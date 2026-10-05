import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { getActiveChain } from '@/config/chains';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const chainIdParam = searchParams.get('chainId');
  const chainId = getActiveChain(chainIdParam ? parseInt(chainIdParam, 10) : undefined).id;

  const telemetry = {
    chainId,
    ethPriceUsd: 2680.5,
    gasPriceGwei: 12,
    timestamp: new Date().toISOString(),
  };

  return jsonResponse(telemetry);
}
