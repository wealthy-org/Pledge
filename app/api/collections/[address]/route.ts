import { NextRequest } from 'next/server';
import { fetchCollectionDetail } from '@/lib/db/queries';
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

  const detail = await fetchCollectionDetail(address, chainId);
  if (!detail) {
    return errorResponse(
      `Collection with address ${address} not found in allowlist`,
      'COLLECTION_NOT_FOUND',
      404
    );
  }

  return jsonResponse(detail);
}
