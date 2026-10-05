import { isAddress, createPublicClient, http } from 'viem';
import { NftMetadata, CachedNftRecord, MetadataFetchOptions } from '@/types/nft';
import { TESTNET_CHAIN_ID, getActiveChain } from '@/config/chains';
import { ERC721_ABI } from '@/config/contracts';
import { resolveNftImage, generateSvgArtwork } from '@/lib/nft-image';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const inMemoryMetadataCache = new Map<string, CachedNftRecord>();
const inMemoryCollectionCache = new Map<string, { name: string; symbol: string; expiresAt: number }>();
const inMemoryCollectionImageCache = new Map<string, string>();

export function setCollectionImageCache(key: string, url: string): void {
  if (key && url) {
    inMemoryCollectionImageCache.set(key.toLowerCase(), url);
  }
}

export function resolveCollectionImageUrl(nameOrAddress: string, symbol?: string, preferredUrl?: string): string {
  if (preferredUrl && preferredUrl.trim() !== '') {
    return preferredUrl;
  }
  const key = (nameOrAddress || '').toLowerCase();
  if (inMemoryCollectionImageCache.has(key)) {
    return inMemoryCollectionImageCache.get(key)!;
  }
  return generateSvgArtwork(nameOrAddress, '', symbol || nameOrAddress);
}

function getCacheKey(contractAddress: string, tokenId: string): string {
  return `${contractAddress.toLowerCase()}:${tokenId}`;
}

export function clearMetadataCache(): void {
  inMemoryMetadataCache.clear();
  inMemoryCollectionCache.clear();
  inMemoryCollectionImageCache.clear();
}

export function getMetadataCacheSize(): number {
  return inMemoryMetadataCache.size;
}

export async function fetchOnChainCollectionInfo(
  collectionAddress: string,
  chainId?: number
): Promise<{ name: string; symbol: string; address: `0x${string}` }> {
  const normalized = (collectionAddress || '').toLowerCase();
  const known = {
    [(process.env.NEXT_PUBLIC_RHG_COLLECTION || '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496').toLowerCase()]: {
      name: 'Robinhood Genesis Pass',
      symbol: 'RHG',
    },
    [(process.env.NEXT_PUBLIC_SFR_COLLECTION || '0x34A1D3fff3958843C43aD80F30b94c510645C316').toLowerCase()]: {
      name: 'Sherwood Forest Rangers',
      symbol: 'SFR',
    },
    [(process.env.NEXT_PUBLIC_NGP_COLLECTION || '0x90193C961A926261B756D1E5bb255e67ff9498A1').toLowerCase()]: {
      name: 'Nottingham Guild Pledges',
      symbol: 'NGP',
    },
  };

  if (normalized in known) {
    const info = known[normalized as keyof typeof known];
    return {
      address: collectionAddress as `0x${string}`,
      name: info.name,
      symbol: info.symbol,
    };
  }

  if (process.env.NODE_ENV !== 'test') {
    try {
      const chain = getActiveChain(chainId);
      const rpcUrl = chain.rpcUrls.default.http[0];
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl, { timeout: 500 }),
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
    } catch {}
  }

  return {
    address: collectionAddress as `0x${string}`,
    name: 'ERC721 Collection',
    symbol: 'NFT',
  };
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
