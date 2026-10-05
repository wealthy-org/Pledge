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
