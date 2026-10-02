import { isAddress } from 'viem';
import { NftMetadata, CachedNftRecord, MetadataFetchOptions } from '@/types/nft';
import { getCollectionByAddress } from '@/config/collections';
import { TESTNET_CHAIN_ID } from '@/config/chains';

export const FALLBACK_NFT_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const inMemoryMetadataCache = new Map<string, CachedNftRecord>();

export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return FALLBACK_NFT_IMAGE;
  }

  const trimmed = url.trim();

  if (trimmed.startsWith('ipfs://')) {
    const path = trimmed.replace(/^ipfs:\/\//, '');
    return `https://gateway.pinata.cloud/ipfs/${path}`;
  }

  if (trimmed.includes('ipfs.io/ipfs/')) {
    return trimmed.replace(/https?:\/\/ipfs\.io\/ipfs\//, 'https://gateway.pinata.cloud/ipfs/');
  }

  if (trimmed.startsWith('ar://')) {
    const path = trimmed.replace(/^ar:\/\//, '');
    return `https://arweave.net/${path}`;
  }

  if (trimmed.startsWith('https://')) {
    return trimmed;
  }

  return FALLBACK_NFT_IMAGE;
}

function getCacheKey(contractAddress: string, tokenId: string): string {
  return `${contractAddress.toLowerCase()}:${tokenId}`;
}

export function clearMetadataCache(): void {
  inMemoryMetadataCache.clear();
}

export function getMetadataCacheSize(): number {
  return inMemoryMetadataCache.size;
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

  const knownCollection = getCollectionByAddress(contractAddress);

  let metadata: NftMetadata;

  if (knownCollection) {
    metadata = {
      contractAddress: knownCollection.contractAddress,
      tokenId,
      name: `${knownCollection.name} #${tokenId}`,
      description: knownCollection.description,
      imageUrl: sanitizeImageUrl(knownCollection.imageUrl),
      rawImageUrl: knownCollection.imageUrl,
      attributes: [
        { traitType: 'Collection', value: knownCollection.name },
        { traitType: 'Category', value: knownCollection.category },
      ],
      isFallback: false,
      tokenUri: `ipfs://bafybeihrhgpass/${tokenId}`,
    };
  } else {
    metadata = {
      contractAddress,
      tokenId,
      name: `NFT #${tokenId}`,
      description: 'Collateral token on Robinhood Chain',
      imageUrl: FALLBACK_NFT_IMAGE,
      rawImageUrl: null,
      attributes: [],
      isFallback: true,
      tokenUri: null,
    };
  }

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
