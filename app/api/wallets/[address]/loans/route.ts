import { NextRequest } from 'next/server';
import { MOCK_LOANS } from '@/lib/mock/fixtures';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { WalletLoansResponse } from '@/types/api';

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
  const roleParam = searchParams.get('role');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor');

  const target = address.toLowerCase();
  let filtered = MOCK_LOANS.filter((l) => {
    if (roleParam === 'borrower') return l.borrower.toLowerCase() === target;
    if (roleParam === 'lender') return l.lender.toLowerCase() === target;
    return l.borrower.toLowerCase() === target || l.lender.toLowerCase() === target;
  });

  if (statusParam) {
    filtered = filtered.filter((l) => l.status === statusParam);
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
