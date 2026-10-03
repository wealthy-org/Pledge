import { NextRequest } from 'next/server';
import { getBlockscoutClient } from '@/lib/blockscout';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { formatShortAddress } from '@/lib/services/collectionSafety';
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

  let nfts: WalletNftItem[] = [];

  try {
    const client = getBlockscoutClient(chainId);
    const queryParams: Record<string, string> = {};
    if (cursor) queryParams.cursor = cursor;
    const result = await client.fetchWalletNFTs(address, queryParams);
    for (const item of result.items) {
      const collectionName = item.collectionName || (item.collectionAddress ? formatShortAddress(item.collectionAddress) : 'Robinhood Verified NFT');
      const name = item.name || `${collectionName} #${item.tokenId}`;
      const imageUrl = item.imageUrl || resolveCollectionImageUrl(collectionName);

      nfts.push({
        contractAddress: item.collectionAddress,
        tokenId: item.tokenId,
        collectionName,
        name,
        imageUrl,
        tokenUri: '',
      });
    }
  } catch {
    nfts = [];
  }

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = cursor ? nfts : nfts.slice(startIndex, startIndex + limit);
  const nextCursor = !cursor && startIndex + limit < nfts.length ? (startIndex + limit).toString() : null;

  const response: WalletNftsResponse = {
    nfts: paginated,
    nextCursor,
    total: nfts.length,
  };

  return jsonResponse(response);
}
