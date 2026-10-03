import { NextRequest } from 'next/server';
import { getProtocolSnapshot } from '@/lib/protocol/snapshot';
import { filterSnapshotOffers } from '@/lib/protocol/aggregate';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { BestOfferResponse } from '@/types/api';

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

  const snapshot = await getProtocolSnapshot(chainId);
  const offers = filterSnapshotOffers(snapshot, {
    collection: address,
    status: 'open',
    sort: 'principal',
  });

  const bestOffer = offers.length > 0 ? offers[0] : null;

  const response: BestOfferResponse = {
    bestOffer,
  };

  return jsonResponse(response);
}
