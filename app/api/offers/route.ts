import { NextRequest } from 'next/server';
import { getProtocolSnapshot } from '@/lib/protocol/snapshot';
import { filterSnapshotOffers } from '@/lib/protocol/aggregate';
import { jsonResponse } from '@/lib/api/response';
import { OffersListResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;
  const statusParam = searchParams.get('status') || undefined;
  const collectionParam = searchParams.get('collection') || undefined;
  const lenderParam = searchParams.get('lender') || undefined;
  const sortParam = searchParams.get('sort') || 'principal';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const cursor = searchParams.get('cursor');

  const snapshot = await getProtocolSnapshot(chainId);
  const filtered = filterSnapshotOffers(snapshot, {
    collection: collectionParam,
    lender: lenderParam,
    status: statusParam,
    sort: sortParam,
  });

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? (startIndex + limit).toString() : null;

  const response: OffersListResponse = {
    offers: paginated,
    nextCursor,
    total: filtered.length,
  };

  return jsonResponse(response);
}
