import { NextRequest } from 'next/server';
import { MOCK_WALLET_NFTS } from '@/lib/mock/fixtures';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { WalletNftsResponse } from '@/types/api';

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
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const cursor = searchParams.get('cursor');

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = MOCK_WALLET_NFTS.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < MOCK_WALLET_NFTS.length ? (startIndex + limit).toString() : null;

  const response: WalletNftsResponse = {
    nfts: paginated,
    nextCursor,
    total: MOCK_WALLET_NFTS.length,
  };

  return jsonResponse(response);
}
