import { NextRequest } from 'next/server';
import { getCuratedCollections } from '@/config/collections';
import { getMockCollectionStats } from '@/lib/mock/fixtures';
import { jsonResponse } from '@/lib/api/response';
import { CollectionsResponse, CollectionItemResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  const collections = getCuratedCollections(chainId);

  const enrichedCollections: CollectionItemResponse[] = collections.map((col) => {
    const stats = getMockCollectionStats(col.contractAddress);
    return {
      address: col.contractAddress,
      name: col.name,
      symbol: col.symbol,
      imageUrl: col.imageUrl,
      description: col.description,
      floorPriceEth: col.floorPriceEth,
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
    };
  });

  const response: CollectionsResponse = {
    collections: enrichedCollections,
    total: enrichedCollections.length,
  };

  return jsonResponse(response);
}
