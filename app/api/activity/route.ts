import { NextRequest } from 'next/server';
import { fetchActivityFeed } from '@/lib/db/queries';
import { jsonResponse } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collectionParam = searchParams.get('collection') || undefined;
  const typeParam = searchParams.get('type') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor') || undefined;

  const response = await fetchActivityFeed(
    collectionParam === 'all' ? undefined : collectionParam,
    typeParam === 'all' ? undefined : typeParam,
    limit,
    cursor
  );

  return jsonResponse(response);
}
