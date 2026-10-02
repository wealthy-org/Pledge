import { NextRequest } from 'next/server';
import { MOCK_OFFERS } from '@/lib/mock/fixtures';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { OffersListResponse } from '@/types/api';

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
  const statusParam = searchParams.get('status') || 'open';
  const sortParam = searchParams.get('sort') || 'principal';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor');

  const target = address.toLowerCase();
  let filtered = MOCK_OFFERS.filter((o) => o.collection.toLowerCase() === target);

  if (statusParam) {
    filtered = filtered.filter((o) => o.status === statusParam);
  }

  filtered.sort((a, b) => {
    if (sortParam === 'principal') {
      const diff = BigInt(b.principalWei) - BigInt(a.principalWei);
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    }
    if (sortParam === 'interest') {
      return a.termInterestBps - b.termInterestBps;
    }
    if (sortParam === 'expiry') {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    }
    return b.offerId - a.offerId;
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
