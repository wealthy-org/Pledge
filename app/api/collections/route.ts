import { NextRequest } from 'next/server';
import { fetchCollectionsWithStats, getLastIndexedBlock } from '@/lib/db/queries';
import { jsonResponse } from '@/lib/api/response';
import { CollectionsResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  const enrichedCollections = await fetchCollectionsWithStats(chainId);
  const lastBlock = await getLastIndexedBlock(chainId);

  const response: CollectionsResponse = {
    collections: enrichedCollections,
    total: enrichedCollections.length,
  };

  return jsonResponse(response, 200, lastBlock);
}
