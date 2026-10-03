import { isAddress } from 'viem';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { resolveFromBlockscout } from './tier1-blockscout';
import { resolveFromTokenUri } from './tier2-onchain';
import { buildGenerativeResolvedImage } from './tier3-generative';
import type { NftImageResolutionOptions, ResolvedNftImage } from './types';

export * from './types';
export * from './uri';
export * from './tier3-generative';
export * from './tier1-blockscout';
export * from './tier2-onchain';

interface CachedImageEntry {
  image: ResolvedNftImage;
  expiresAt: number;
}

const imageCache = new Map<string, CachedImageEntry>();
const inFlightRequests = new Map<string, Promise<ResolvedNftImage>>();

const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_TTL_MS = 5 * 60 * 1000;

function getCacheKey(contractAddress: string, tokenId: string, chainId: number): string {
  return `${chainId}:${contractAddress.toLowerCase()}:${tokenId}`;
}

export function clearNftImageCache(): void {
  imageCache.clear();
  inFlightRequests.clear();
}

export function getNftImageCacheSize(): number {
  return imageCache.size;
}

export async function resolveNftImage(
  contractAddress: string,
  tokenId: string,
  options: NftImageResolutionOptions = {}
): Promise<ResolvedNftImage> {
  if (!contractAddress || !tokenId) {
    return buildGenerativeResolvedImage(contractAddress || '0x0', tokenId || '0');
  }

  const normalizedAddr = contractAddress.trim();
  const normalizedTokenId = tokenId.trim();
  const chainId = options.chainId ?? TESTNET_CHAIN_ID;
  const cacheKey = getCacheKey(normalizedAddr, normalizedTokenId, chainId);

  const now = Date.now();
  if (!options.bypassCache) {
    const cached = imageCache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      return cached.image;
    }
  }

  const existingInFlight = inFlightRequests.get(cacheKey);
  if (existingInFlight && !options.bypassCache) {
    return existingInFlight;
  }

  const resolutionPromise = (async () => {
    try {
      const tier1Result = await resolveFromBlockscout(
        normalizedAddr,
        normalizedTokenId,
        chainId
      );
      if (tier1Result && tier1Result.url) {
        const ttl = options.ttlMs ?? SUCCESS_TTL_MS;
        imageCache.set(cacheKey, { image: tier1Result, expiresAt: Date.now() + ttl });
        return tier1Result;
      }

      if (isAddress(normalizedAddr, { strict: false })) {
        const tier2Result = await resolveFromTokenUri(
          normalizedAddr,
          normalizedTokenId,
          chainId
        );
        if (tier2Result && tier2Result.url) {
          const ttl = options.ttlMs ?? SUCCESS_TTL_MS;
          imageCache.set(cacheKey, { image: tier2Result, expiresAt: Date.now() + ttl });
          return tier2Result;
        }
      }

      const tier3Result = buildGenerativeResolvedImage(
        normalizedAddr,
        normalizedTokenId
      );
      imageCache.set(cacheKey, {
        image: tier3Result,
        expiresAt: Date.now() + FALLBACK_TTL_MS,
      });
      return tier3Result;
    } catch {
      const fallback = buildGenerativeResolvedImage(
        normalizedAddr,
        normalizedTokenId
      );
      return fallback;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, resolutionPromise);
  return resolutionPromise;
}
