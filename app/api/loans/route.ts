import { NextRequest } from 'next/server';
import { indexerStore } from '@/lib/indexer/store';
import { gondiClient } from '@/lib/gondi';
import { convertGondiLoanToItem } from '@/lib/services/gondiAdapter';
import { jsonResponse } from '@/lib/api/response';
import { WalletLoansResponse, LoanItem } from '@/types/api';
import type { GondiLoanNode } from '@/types/gondi';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : 46630;
  const statusParam = searchParams.get('status');
  const collectionParam = searchParams.get('collection');
  const borrowerParam = searchParams.get('borrower');
  const lenderParam = searchParams.get('lender');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const cursor = searchParams.get('cursor');

  const onChainLoans: LoanItem[] = [];
  for (const row of indexerStore.loans.values()) {
    onChainLoans.push({
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

  let gondiLoansRaw: GondiLoanNode[] = [];
  if (collectionParam) {
    gondiLoansRaw = await gondiClient.getCollectionLoans(collectionParam).catch(() => []);
    if (gondiLoansRaw.length === 0 && onChainLoans.length === 0) {
      gondiLoansRaw = await gondiClient.listLoans({ first: 20 }).catch(() => []);
    }
  } else if (onChainLoans.length < limit) {
    gondiLoansRaw = await gondiClient.listLoans({ first: 50 }).catch(() => []);
  }

  const gondiItems: LoanItem[] = gondiLoansRaw.map((l) =>
    convertGondiLoanToItem(l, chainId, collectionParam || undefined)
  );

  const seenLoanIds = new Set(onChainLoans.map((l) => l.loanId));
  const mergedLoans = [...onChainLoans];

  for (const item of gondiItems) {
    if (!seenLoanIds.has(item.loanId)) {
      seenLoanIds.add(item.loanId);
      mergedLoans.push(item);
    }
  }

  let filtered = mergedLoans;

  if (statusParam) {
    filtered = filtered.filter((l) => l.status === statusParam);
  }

  if (collectionParam) {
    const target = collectionParam.toLowerCase();
    filtered = filtered.filter((l) => l.collection.toLowerCase() === target);
  }

  if (borrowerParam) {
    const target = borrowerParam.toLowerCase();
    filtered = filtered.filter((l) => l.borrower.toLowerCase() === target);
  }

  if (lenderParam) {
    const target = lenderParam.toLowerCase();
    filtered = filtered.filter((l) => l.lender.toLowerCase() === target);
  }

  filtered.sort((a, b) => b.loanId - a.loanId);

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? (startIndex + limit).toString() : null;

  const response: WalletLoansResponse = {
    loans: paginated,
    nextCursor,
    total: filtered.length,
  };

  return jsonResponse(response);
}

