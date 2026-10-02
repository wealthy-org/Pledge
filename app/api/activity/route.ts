import { NextRequest } from 'next/server';
import { MOCK_ACTIVITY } from '@/lib/mock/fixtures';
import { jsonResponse } from '@/lib/api/response';
import { ActivityResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collectionParam = searchParams.get('collection');
  const typeParam = searchParams.get('type');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor');

  let filtered = [...MOCK_ACTIVITY];

  if (collectionParam) {
    const target = collectionParam.toLowerCase();
    filtered = filtered.filter((a) => a.contractAddress.toLowerCase() === target);
  }

  if (typeParam) {
    filtered = filtered.filter((a) => a.eventType.toLowerCase() === typeParam.toLowerCase());
  }

  filtered.sort((a, b) => b.blockNumber - a.blockNumber);

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? (startIndex + limit).toString() : null;

  const response: ActivityResponse = {
    activity: paginated,
    nextCursor,
    total: filtered.length,
  };

  return jsonResponse(response);
}
