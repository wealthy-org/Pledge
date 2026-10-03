import { isAddress, createPublicClient, http } from 'viem';
import { NftMetadata, CachedNftRecord, MetadataFetchOptions } from '@/types/nft';
import { TESTNET_CHAIN_ID, getActiveChain } from '@/config/chains';
import { ERC721_ABI } from '@/config/contracts';
import { resolveNftImage, generateSvgArtwork } from '@/lib/nft-image';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const inMemoryMetadataCache = new Map<string, CachedNftRecord>();
const inMemoryCollectionCache = new Map<string, { name: string; symbol: string; expiresAt: number }>();

export function resolveCollectionImageUrl(nameOrAddress: string, symbol?: string): string {
  return generateSvgArtwork(nameOrAddress, '', symbol || nameOrAddress);
}

function getCacheKey(contractAddress: string, tokenId: string): string {
  return `${contractAddress.toLowerCase()}:${tokenId}`;
}

export function clearMetadataCache(): void {
  inMemoryMetadataCache.clear();
  inMemoryCollectionCache.clear();
}

export function getMetadataCacheSize(): number {
  return inMemoryMetadataCache.size;
}

export async function fetchOnChainCollectionInfo(
  collectionAddress: string,
  chainId?: number
): Promise<{ name: string; symbol: string; address: `0x${string}` }> {
  const normalized = collectionAddress.toLowerCase();
  const cached = inMemoryCollectionCache.get(normalized);
  if (cached && Date.now() < cached.expiresAt) {
    return {
      address: collectionAddress as `0x${string}`,
      name: cached.name,
      symbol: cached.symbol,
    };
  }

  try {
    const chain = getActiveChain(chainId);
    const rpcUrl = chain.rpcUrls.default.http[0];
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl, { timeout: 3000 }),
    });

    const [nameResult, symbolResult] = await Promise.all([
      client.readContract({
        address: collectionAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'name' as any,
      }).catch(() => null),
      client.readContract({
        address: collectionAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'symbol' as any,
      }).catch(() => null),
    ]);

    const name = nameResult ? String(nameResult) : 'ERC721 Collection';
    const symbol = symbolResult ? String(symbolResult) : 'NFT';

    inMemoryCollectionCache.set(normalized, {
      name,
      symbol,
      expiresAt: Date.now() + DEFAULT_TTL_MS,
    });

    return {
      address: collectionAddress as `0x${string}`,
      name,
      symbol,
    };
  } catch {
    return {
      address: collectionAddress as `0x${string}`,
      name: 'ERC721 Collection',
      symbol: 'NFT',
    };
  }
}

export async function fetchNftMetadata(
  contractAddress: string,
  tokenId: string,
  options: MetadataFetchOptions = {}
): Promise<NftMetadata> {
  if (!contractAddress || !isAddress(contractAddress, { strict: false })) {
    throw new Error(`Invalid collection address: ${contractAddress}`);
  }

  if (!tokenId || typeof tokenId !== 'string' || tokenId.trim() === '') {
    throw new Error('Invalid token ID: token ID must be a non-empty string');
  }

  const cacheKey = getCacheKey(contractAddress, tokenId);
  const now = Date.now();

  if (!options.bypassCache) {
    const cached = inMemoryMetadataCache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      return cached.metadata;
    }
  }

  const [collectionInfo, resolvedImage] = await Promise.all([
    fetchOnChainCollectionInfo(contractAddress),
    resolveNftImage(contractAddress, tokenId, {
      bypassCache: options.bypassCache,
      ttlMs: options.ttlMs,
    }),
  ]);

  const name = collectionInfo.name;

  const metadata: NftMetadata = {
    contractAddress: contractAddress as `0x${string}`,
    tokenId,
    name: `${name} #${tokenId}`,
    description: `${name} on Robinhood Chain`,
    imageUrl: resolvedImage.url,
    rawImageUrl: resolvedImage.rawUri,
    attributes: [
      { traitType: 'Collection', value: name },
      { traitType: 'Symbol', value: collectionInfo.symbol },
    ],
    isFallback: resolvedImage.isFallback,
    tokenUri: resolvedImage.rawUri || `ipfs://bafybeihrhgpass/${tokenId}`,
    imageSource: resolvedImage.source,
  };

  const ttl = options.ttlMs ?? DEFAULT_TTL_MS;
  const record: CachedNftRecord = {
    contractAddress,
    tokenId,
    chainId: TESTNET_CHAIN_ID,
    metadata,
    cachedAt: now,
    expiresAt: now + ttl,
  };

  inMemoryMetadataCache.set(cacheKey, record);

  return metadata;
}
