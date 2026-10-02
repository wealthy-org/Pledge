import { jsonResponse } from '@/lib/api/response';

export async function GET() {
  const telemetry = {
    ethPriceUsd: 2680.5,
    gasPriceGwei: 12,
    timestamp: new Date().toISOString(),
  };

  return jsonResponse(telemetry);
}
