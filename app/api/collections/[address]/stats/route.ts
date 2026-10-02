import { NextRequest } from 'next/server';
import { getMockCollectionStats } from '@/lib/mock/fixtures';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { CollectionStatsResponse } from '@/types/api';

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

  const stats: CollectionStatsResponse = getMockCollectionStats(address);
  return jsonResponse(stats);
}
