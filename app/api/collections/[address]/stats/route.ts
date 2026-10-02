import { NextRequest } from 'next/server';
import { getCollectionStatsFromStore } from '@/lib/db/queries';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';

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
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  const stats = await getCollectionStatsFromStore(address, chainId);
  return jsonResponse(stats);
}
