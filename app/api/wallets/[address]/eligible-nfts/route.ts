import { NextRequest } from 'next/server';
import { getCuratedCollections } from '@/config/collections';
import { getBlockscoutClient } from '@/lib/blockscout';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { WalletNftsResponse, WalletNftItem } from '@/types/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;

  if (!validateAddress(address)) {
    return errorResponse(
      `Invalid Ethereum address format: ${address}`,
      'INVALID_ADDRESS',
      400
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor');
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  const curated = getCuratedCollections(chainId);
  const allowlistMap = new Map<string, string>();
  for (const c of curated) {
    allowlistMap.set(c.contractAddress.toLowerCase(), c.name);
  }

  let nfts: WalletNftItem[] = [];

  try {
    const client = getBlockscoutClient(chainId);
    const result = await client.fetchWalletNFTs(address);
    for (const item of result.items) {
      const colAddr = item.collectionAddress.toLowerCase();
      if (allowlistMap.has(colAddr)) {
        nfts.push({
          contractAddress: item.collectionAddress,
          tokenId: item.tokenId,
          collectionName: allowlistMap.get(colAddr) || item.collectionName,
          name: item.name || `${allowlistMap.get(colAddr)} #${item.tokenId}`,
          imageUrl: item.imageUrl,
          tokenUri: '',
        });
      }
    }
  } catch {
    nfts = [];
  }

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = nfts.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < nfts.length ? (startIndex + limit).toString() : null;

  const response: WalletNftsResponse = {
    nfts: paginated,
    nextCursor,
    total: nfts.length,
  };

  return jsonResponse(response);
}
