import { createPublicClient, http, isAddress } from 'viem';
import { getActiveChain } from '@/config/chains';
import { ERC721_ABI } from '@/config/contracts';
import {
  decodeDataUriJson,
  fetchJsonWithLimit,
  resolveMediaUrlSafe,
} from './uri';
import type { ResolvedNftImage } from './types';

export async function resolveFromTokenUri(
  contractAddress: string,
  tokenId: string,
  chainId?: number
): Promise<ResolvedNftImage | null> {
  if (!contractAddress || !isAddress(contractAddress, { strict: false }) || !tokenId) {
    return null;
  }

  let rawTokenUri = '';

  try {
    const chain = getActiveChain(chainId);
    const rpcUrl = chain.rpcUrls.default.http[0];
    const client = createPublicClient({
      chain,
      transport: http(rpcUrl, { timeout: 3000 }),
    });

    const parsedTokenId = BigInt(tokenId);
    const result = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'tokenURI',
      args: [parsedTokenId],
    });

    if (typeof result === 'string') {
      rawTokenUri = result.trim();
    }
  } catch {
    return null;
  }

  if (!rawTokenUri) {
    return null;
  }

  if (rawTokenUri.startsWith('data:image/')) {
    return {
      url: rawTokenUri,
      source: 'onchain-inline',
      isFallback: false,
      rawUri: rawTokenUri,
    };
  }

  if (rawTokenUri.startsWith('data:application/json')) {
    const json = decodeDataUriJson(rawTokenUri);
    if (!json) {
      return null;
    }
    const rawImage = (json.image || json.image_url || json.imageUrl) as string | undefined;
    if (rawImage) {
      const resolved = resolveMediaUrlSafe(rawImage);
      if (resolved) {
        return {
          url: resolved,
          source: 'onchain-inline',
          isFallback: false,
          rawUri: rawTokenUri,
        };
      }
    }
    if (typeof json.image_data === 'string' && json.image_data.startsWith('<svg')) {
      const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(json.image_data)}`;
      return {
        url: svgDataUri,
        source: 'onchain-inline',
        isFallback: false,
        rawUri: rawTokenUri,
      };
    }
    return null;
  }

  if (
    rawTokenUri.startsWith('ipfs://') ||
    rawTokenUri.startsWith('ar://') ||
    rawTokenUri.startsWith('http://') ||
    rawTokenUri.startsWith('https://')
  ) {
    const json = await fetchJsonWithLimit(rawTokenUri, 3000);
    if (!json) {
      return null;
    }
    const rawImage = (json.image || json.image_url || json.imageUrl) as string | undefined;
    if (rawImage) {
      const resolved = resolveMediaUrlSafe(rawImage);
      if (resolved) {
        return {
          url: resolved,
          source: 'onchain-uri',
          isFallback: false,
          rawUri: rawTokenUri,
        };
      }
    }
    return null;
  }

  return null;
}
