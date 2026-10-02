import { NextRequest } from 'next/server';
import { getCollectionByAddress } from '@/config/collections';
import { getMockCollectionStats } from '@/lib/mock/fixtures';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { CollectionDetailResponse } from '@/types/api';

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
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  const collection = getCollectionByAddress(address, chainId);
  if (!collection) {
    return errorResponse(
      `Collection with address ${address} not found in allowlist`,
      'COLLECTION_NOT_FOUND',
      404
    );
  }

  const stats = getMockCollectionStats(address);

  const response: CollectionDetailResponse = {
    collection: {
      address: collection.contractAddress,
      name: collection.name,
      symbol: collection.symbol,
      imageUrl: collection.imageUrl,
      description: collection.description,
      floorPriceEth: collection.floorPriceEth,
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
    },
    stats,
  };

  return jsonResponse(response);
}
