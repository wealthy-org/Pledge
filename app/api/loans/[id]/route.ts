import { NextRequest } from 'next/server';
import { fetchLoanDetail } from '@/lib/db/queries';
import { jsonResponse, errorResponse } from '@/lib/api/response';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const loanId = parseInt(id, 10);

  if (isNaN(loanId) || loanId <= 0) {
    return errorResponse(
      `Invalid loan ID format: ${id}`,
      'INVALID_LOAN_ID',
      400
    );
  }

  const detail = await fetchLoanDetail(loanId);
  if (!detail) {
    return errorResponse(
      `Loan with ID ${loanId} not found`,
      'LOAN_NOT_FOUND',
      404
    );
  }

  return jsonResponse(detail);
}
