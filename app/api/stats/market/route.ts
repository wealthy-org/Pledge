import { getMockMarketStats } from '@/lib/mock/fixtures';
import { jsonResponse } from '@/lib/api/response';
import { MarketStatsResponse } from '@/types/api';

export async function GET() {
  const stats: MarketStatsResponse = getMockMarketStats();
  return jsonResponse(stats);
}
