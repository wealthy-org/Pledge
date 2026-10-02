import { NextRequest } from 'next/server';
import { indexerStore } from '@/lib/indexer/store';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { BestOfferResponse, OfferItem } from '@/types/api';

export async function GET(
  _request: NextRequest,
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
  let bestOffer: OfferItem | null = null;
  let highestPrincipal = 0n;

  for (const row of indexerStore.offers.values()) {
    if (row.collection.toLowerCase() === target && row.status === 'open') {
      const principal = BigInt(row.principal_wei);
      if (principal > highestPrincipal) {
        highestPrincipal = principal;
        bestOffer = {
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
        };
      }
    }
  }

  const response: BestOfferResponse = {
    bestOffer,
  };

  return jsonResponse(response);
}
