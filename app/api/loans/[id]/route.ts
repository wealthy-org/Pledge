import { NextRequest } from 'next/server';
import { MOCK_LOANS } from '@/lib/mock/fixtures';
import { getCollectionByAddress } from '@/config/collections';
import { jsonResponse, errorResponse } from '@/lib/api/response';
import { LoanDetailResponse } from '@/types/api';

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

  const loan = MOCK_LOANS.find((l) => l.loanId === loanId);
  if (!loan) {
    return errorResponse(
      `Loan with ID ${loanId} not found`,
      'LOAN_NOT_FOUND',
      404
    );
  }

  const collection = getCollectionByAddress(loan.collection);
  const totalRepayment = BigInt(loan.principalWei) + BigInt(loan.interestWei);

  const response: LoanDetailResponse = {
    loan: {
      ...loan,
      nftMetadata: {
        name: `${collection ? collection.name : 'NFT'} #${loan.tokenId}`,
        imageUrl: collection ? collection.imageUrl : '',
        collectionName: collection ? collection.name : 'Unknown Collection',
      },
      totalRepaymentWei: totalRepayment.toString(),
    },
  };

  return jsonResponse(response);
}
