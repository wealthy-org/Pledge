import { NextRequest } from 'next/server';
import { fetchWalletLoans } from '@/lib/db/queries';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { LoanStatus } from '@/types/database';

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
  const statusParam = searchParams.get('status') as LoanStatus | null;
  const roleParam = searchParams.get('role') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor') || undefined;
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  if (chainIdParam !== null && (isNaN(chainId!) || chainId! <= 0)) {
    return errorResponse('Invalid chainId parameter', 'INVALID_CHAIN_ID', 400);
  }

  const response = await fetchWalletLoans(
    address,
    statusParam || undefined,
    roleParam,
    limit,
    cursor,
    chainId
  );

  return jsonResponse(response);
}
