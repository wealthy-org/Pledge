import { NextRequest } from 'next/server';
import { indexerStore } from '@/lib/indexer/store';
import { syncOnChainLogs } from '@/lib/indexer/sync';
import { jsonResponse } from '@/lib/api/response';
import { OffersListResponse, OfferItem } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;
  const statusParam = searchParams.get('status');
  const collectionParam = searchParams.get('collection');
  const lenderParam = searchParams.get('lender');
  const sortParam = searchParams.get('sort') || 'principal';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const cursor = searchParams.get('cursor');

  if (chainId !== undefined) {
    try {
      await syncOnChainLogs(chainId);
    } catch {}
  }

  const allOffers: OfferItem[] = [];
  for (const row of indexerStore.offers.values()) {
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

  let filtered = allOffers;

  if (statusParam) {
    filtered = filtered.filter((o) => o.status === statusParam);
  }

  if (collectionParam) {
    const target = collectionParam.toLowerCase();
    filtered = filtered.filter((o) => o.collection.toLowerCase() === target);
  }

  if (lenderParam) {
    const target = lenderParam.toLowerCase();
    filtered = filtered.filter((o) => o.lender.toLowerCase() === target);
  }

  filtered.sort((a, b) => {
    if (sortParam === 'principal') {
      const diff = BigInt(b.principalWei) - BigInt(a.principalWei);
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    }
    if (sortParam === 'interest') {
      return a.termInterestBps - b.termInterestBps;
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
