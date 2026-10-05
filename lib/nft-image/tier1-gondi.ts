import { gondiClient } from '@/lib/gondi';
import { resolveMediaUrlSafe } from './uri';
import type { ResolvedNftImage } from './types';

export async function resolveFromGondi(
  contractAddress: string,
  tokenId: string
): Promise<ResolvedNftImage | null> {
  if (!contractAddress || !tokenId) {
    return null;
  }

  try {
    const item = await gondiClient.getNftMetadata(contractAddress, tokenId);
    if (!item) {
      return null;
    }

    const rawCandidates = [
      item.image?.cacheUrl,
      item.description,
    ];

    for (const raw of rawCandidates) {
      if (raw && raw.startsWith('https://cdn.gondi.xyz/')) {
        return {
          url: raw,
          source: 'gondi-cdn',
          isFallback: false,
          rawUri: raw,
        };
      }
      const resolved = resolveMediaUrlSafe(raw);
      if (resolved) {
        return {
          url: resolved,
          source: 'gondi-cdn',
          isFallback: false,
          rawUri: raw || null,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
