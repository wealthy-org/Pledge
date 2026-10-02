import { NextRequest } from 'next/server';
import { fetchCollectionOffers } from '@/lib/db/queries';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { OfferStatus } from '@/types/database';

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
  const statusParam = (searchParams.get('status') || 'open') as OfferStatus;
  const sortParam = searchParams.get('sort') || 'principal';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor') || undefined;
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  const response = await fetchCollectionOffers(
    address,
    statusParam,
    sortParam,
    limit,
    cursor,
    chainId
  );

  return jsonResponse(response);
}
