import { fetchMarketStats } from '@/lib/db/queries';
import { jsonResponse } from '@/lib/api/response';

export async function GET() {
  const stats = await fetchMarketStats();
  return jsonResponse(stats);
}
