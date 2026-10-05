import { gondiClient, extractGondiImageUrl } from '@/lib/gondi';
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

    const imgUrl = extractGondiImageUrl(item.image);
    if (imgUrl) {
      return {
        url: imgUrl,
        source: 'gondi-cdn',
        isFallback: false,
        rawUri: item.image?.data || item.image?.cacheUrl || null,
      };
    }

    const descCandidate = resolveMediaUrlSafe(item.description);
    if (descCandidate) {
      return {
        url: descCandidate,
        source: 'gondi-cdn',
        isFallback: false,
        rawUri: item.description || null,
      };
    }

    return null;
  } catch {
    return null;
  }
}
