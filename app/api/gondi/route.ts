import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '@/lib/api/response';
import { gondiClient } from '@/lib/gondi';
import type { GondiTimeframe } from '@/types/gondi';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'overview';
  const timeframe = (searchParams.get('timeframe') || 'DAY') as GondiTimeframe;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 30;
  const collection = searchParams.get('collection') || searchParams.get('address') || '';
  const tokenId = searchParams.get('tokenId') || '';

  try {
    if (type === 'overview') {
      const overview = await gondiClient.getMarketOverviewData(timeframe);
      return jsonResponse({
        overview,
        top: overview.top || [],
        volume: overview.volume || [],
        movers: overview.movers || [],
        items: overview.top || [],
        count: overview.top?.length || 0,
      });
    }

    if (type === 'collections') {
      const collections = await gondiClient.listCollections(limit);
      return jsonResponse({ collections, count: collections.length });
    }

    if (type === 'nfts') {
      const nfts = await gondiClient.listNfts(limit);
      return jsonResponse({ nfts, count: nfts.length });
    }

    if (type === 'pulse') {
      const pulse = await gondiClient.getLendingMarketPulse();
      return jsonResponse({ pulse });
    }

    if (type === 'loans') {
      const loans = await gondiClient.listLoans(limit);
      return jsonResponse({ loans, count: loans.length });
    }

    if (type === 'item') {
      if (!collection || !tokenId) {
        return errorResponse('Missing collection or tokenId parameter', 'MISSING_PARAMS', 400);
      }
      const item = await gondiClient.getNftMetadata(collection, tokenId);
      return jsonResponse({ item });
    }

    return errorResponse(`Unsupported type: ${type}`, 'INVALID_TYPE', 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown Gondi API error';
    return errorResponse(message, 'GONDI_API_ERROR', 500);
  }
}
