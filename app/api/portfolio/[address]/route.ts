import { NextRequest } from 'next/server';
import { MOCK_LOANS, MOCK_OFFERS } from '@/lib/mock/fixtures';
import { indexerStore } from '@/lib/indexer/store';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { LoanItem, OfferItem } from '@/types/api';

export interface PortfolioResponse {
  address: string;
  borrowedLoans: LoanItem[];
  lentLoans: LoanItem[];
  activeOffers: OfferItem[];
  totalBorrowedWei: string;
  totalLentWei: string;
  claimableProceedsWei: string;
}

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

  const allLoans: LoanItem[] = [...MOCK_LOANS];
  for (const row of indexerStore.loans.values()) {
    if (!allLoans.some((l) => l.loanId === row.loan_id)) {
      allLoans.push({
        loanId: row.loan_id,
        offerId: row.offer_id,
        chainId: row.chain_id,
        lender: row.lender,
        borrower: row.borrower,
        collection: row.collection,
        tokenId: row.token_id,
        principalWei: row.principal_wei,
        interestWei: row.interest_wei,
        feeBpsSnapshot: row.fee_bps_snapshot,
        startedAt: row.started_at,
        dueAt: row.due_at,
        status: row.status,
        blockNumber: row.block_number,
        txHash: row.tx_hash,
      });
    }
  }

  const borrowedLoans = allLoans.filter((l) => l.borrower.toLowerCase() === target && l.status === 'active');
  const lentLoans = allLoans.filter((l) => l.lender.toLowerCase() === target && l.status === 'active');

  const allOffers: OfferItem[] = [...MOCK_OFFERS];
  for (const row of indexerStore.offers.values()) {
    if (!allOffers.some((o) => o.offerId === row.offer_id)) {
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

  const activeOffers = allOffers.filter((o) => o.lender.toLowerCase() === target && o.status === 'open');

  let totalBorrowed = 0n;
  for (const l of borrowedLoans) {
    totalBorrowed += BigInt(l.principalWei);
  }

  let totalLent = 0n;
  for (const l of lentLoans) {
    totalLent += BigInt(l.principalWei);
  }

  const response: PortfolioResponse = {
    address,
    borrowedLoans,
    lentLoans,
    activeOffers,
    totalBorrowedWei: totalBorrowed.toString(),
    totalLentWei: totalLent.toString(),
    claimableProceedsWei: '0',
  };

  return jsonResponse(response);
}
