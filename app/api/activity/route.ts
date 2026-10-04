import { NextRequest } from 'next/server';
import { fetchActivityFeed } from '@/lib/db/queries';
import { jsonResponse, errorResponse } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionParam = searchParams.get('collection') || undefined;
    const typeParam = searchParams.get('type') || undefined;
    const parsedLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(1, isNaN(parsedLimit) ? 20 : parsedLimit), 100);
    const cursor = searchParams.get('cursor') || undefined;
    const chainIdParam = searchParams.get('chainId');
    const parsedChainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;
    const chainId = parsedChainId && !isNaN(parsedChainId) && parsedChainId > 0 ? parsedChainId : undefined;

    const response = await fetchActivityFeed(
      collectionParam === 'all' ? undefined : collectionParam,
      typeParam === 'all' ? undefined : typeParam,
      limit,
      cursor,
      chainId
    );

    return jsonResponse(response);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error while fetching activity',
      'ACTIVITY_FETCH_ERROR',
      500
    );
  }
}
