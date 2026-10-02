import { NextRequest } from 'next/server';
import { fetchMarketStats } from '@/lib/db/queries';
import { jsonResponse } from '@/lib/api/response';

export async function GET(request?: NextRequest) {
  const url = request ? new URL(request.url) : null;
  const chainIdParam = url?.searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;
  const stats = await fetchMarketStats(chainId);
  return jsonResponse(stats);
}
