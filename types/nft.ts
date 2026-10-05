export type ImageSource = 'gondi-cdn' | 'onchain-inline' | 'onchain-uri' | 'generative';

export interface ResolvedNftImage {
  url: string;
  source: ImageSource;
  isFallback: boolean;
  rawUri: string | null;
  animationUrl?: string | null;
}

export interface NftImageResolutionOptions {
  bypassCache?: boolean;
  ttlMs?: number;
  timeoutMs?: number;
  chainId?: number;
}

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
  imageSource?: ImageSource;
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
