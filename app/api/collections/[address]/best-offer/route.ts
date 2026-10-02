import { NextRequest } from 'next/server';
import { MOCK_OFFERS } from '@/lib/mock/fixtures';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { BestOfferResponse, OfferItem } from '@/types/api';

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

  const target = address.toLowerCase();
  const openOffers = MOCK_OFFERS.filter(
    (o) => o.collection.toLowerCase() === target && o.status === 'open'
  );

  let bestOffer: OfferItem | null = null;
  let highestPrincipal = 0n;

  for (const offer of openOffers) {
    const principal = BigInt(offer.principalWei);
    if (principal > highestPrincipal) {
      highestPrincipal = principal;
      bestOffer = offer;
    }
  }

  const response: BestOfferResponse = {
    bestOffer,
  };

  return jsonResponse(response);
}
