import { NextRequest } from 'next/server';
import { indexerStore } from '@/lib/indexer/store';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { OffersListResponse, OfferItem } from '@/types/api';

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
  const statusParam = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor');

  const target = address.toLowerCase();
  const allOffers: OfferItem[] = [];

  for (const row of indexerStore.offers.values()) {
    if (row.lender.toLowerCase() === target) {
      allOffers.push({
        offerId: row.offer_id,
        chainId: row.chain_id,
        lender: row.lender,
        collection: row.collection,
        principalWei: row.principal_wei,
        termInterestBps: row.term_interest_bps,
        feeBpsSnapshot: row.fee_bps_snapshot,
        durationSeconds: row.duration_seconds,
        expiresAt: row.expires_at,
        status: row.status,
        blockNumber: row.block_number,
        txHash: row.tx_hash,
        createdAt: row.indexed_at,
      });
    }
  }

  let filtered = allOffers;
  if (statusParam) {
    filtered = filtered.filter((o) => o.status === statusParam);
  }

  filtered.sort((a, b) => b.offerId - a.offerId);

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
