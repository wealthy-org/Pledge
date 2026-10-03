import { getBlockscoutClient } from '@/lib/blockscout';
import { resolveMediaUrlSafe } from './uri';
import type { ResolvedNftImage } from './types';

export async function resolveFromBlockscout(
  contractAddress: string,
  tokenId: string,
  chainId?: number
): Promise<ResolvedNftImage | null> {
  if (!contractAddress || !tokenId) {
    return null;
  }

  try {
    const client = getBlockscoutClient(chainId);
    const item = await client.fetchNFTInstance(contractAddress, tokenId);
    if (!item) {
      return null;
    }

    const rawCandidates = [
      item.imageUrl,
      item.description,
    ];

    for (const raw of rawCandidates) {
      const resolved = resolveMediaUrlSafe(raw);
      if (resolved) {
        return {
          url: resolved,
          source: 'blockscout',
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
