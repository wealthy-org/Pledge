export interface NftAttribute {
  traitType: string;
  value: string | number;
}

export interface NftMetadata {
  contractAddress: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  rawImageUrl: string | null;
  attributes: NftAttribute[];
  isFallback: boolean;
  tokenUri: string | null;
}

export interface CachedNftRecord {
  contractAddress: string;
  tokenId: string;
  chainId: number;
  metadata: NftMetadata;
  cachedAt: number;
  expiresAt: number;
}

export interface MetadataFetchOptions {
  bypassCache?: boolean;
  ttlMs?: number;
}
