import { NextRequest } from 'next/server';
import { isAddress } from 'viem';
import { getBlockscoutClient } from '@/lib/blockscout';
import { indexerStore } from '@/lib/indexer/store';
import { jsonResponse, errorResponse } from '@/lib/api/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; tokenId: string }> }
) {
  const { collection, tokenId } = await params;

  if (!isAddress(collection)) {
    return errorResponse('Invalid collection address format', 'INVALID_COLLECTION', 400);
  }

  if (!tokenId || !/^\d+$/.test(tokenId)) {
    return errorResponse('Invalid token ID', 'INVALID_TOKEN_ID', 400);
  }

  const { searchParams } = new URL(request.url);
  const chainId = parseInt(searchParams.get('chainId') || process.env.NEXT_PUBLIC_CHAIN_ID || '46630', 10);

  const client = getBlockscoutClient();
  let metadata: {
    name: string;
    description: string;
    imageUrl: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
  } = {
    name: `Token #${tokenId}`,
    description: '',
    imageUrl: '',
    attributes: [],
  };

  try {
    const nft = await client.fetchNFTInstance(collection, tokenId);
    metadata = {
      name: nft.name || `Token #${tokenId}`,
      description: nft.description || '',
      imageUrl: nft.imageUrl || '',
      attributes: (nft.attributes as unknown as Array<{ trait_type: string; value: string | number }>) || [],
    };
  } catch {}

  let activeLoan: {
    loanId: number;
    offerId: number;
    principalWei: string;
    interestWei: string;
    dueAt: string;
    borrower: string;
    lender: string;
    status: string;
  } | null = null;

  for (const l of indexerStore.loans.values()) {
    if (
      l.collection.toLowerCase() === collection.toLowerCase() &&
      l.token_id === tokenId &&
      l.status === 'active'
    ) {
      activeLoan = {
        loanId: l.loan_id,
        offerId: l.offer_id,
        principalWei: l.principal_wei,
        interestWei: l.interest_wei,
        dueAt: l.due_at,
        borrower: l.borrower,
        lender: l.lender,
        status: l.status,
      };
      break;
    }
  }

  const openOffers = [];
  for (const o of indexerStore.offers.values()) {
    if (
      o.collection.toLowerCase() === collection.toLowerCase() &&
      o.status === 'open' &&
      Number(o.expires_at) > Math.floor(Date.now() / 1000)
    ) {
      openOffers.push({
        offerId: o.offer_id,
        principalWei: o.principal_wei,
        termInterestBps: o.term_interest_bps,
        durationSeconds: o.duration_seconds,
        expiresAt: o.expires_at,
        lender: o.lender,
      });
    }
  }

  openOffers.sort((a, b) => (BigInt(b.principalWei) > BigInt(a.principalWei) ? 1 : -1));

  return jsonResponse({
    collection,
    tokenId,
    chainId,
    metadata,
    activeLoan,
    bestOffer: openOffers[0] || null,
    openOffersCount: openOffers.length,
  });
}
