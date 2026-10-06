import { NextRequest } from 'next/server';
import { getProtocolSnapshot } from '@/lib/protocol/snapshot';
import { filterSnapshotOffers } from '@/lib/protocol/aggregate';
import { gondiClient } from '@/lib/gondi';
import { convertGondiOfferToItem } from '@/lib/services/gondiAdapter';
import { jsonResponse, errorResponse } from '@/lib/api/response';
import { OffersListResponse, OfferItem } from '@/types/api';
import type { GondiOfferNode } from '@/types/gondi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainIdParam = searchParams.get('chainId');
    const chainId = chainIdParam ? parseInt(chainIdParam, 10) : 46630;
    const statusParam = searchParams.get('status') || undefined;
    const collectionParam = searchParams.get('collection') || undefined;
    const lenderParam = searchParams.get('lender') || undefined;
    const sortParam = searchParams.get('sort') || 'principal';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const cursor = searchParams.get('cursor');

    const snapshot = await getProtocolSnapshot(chainId);
    const onChainOffers = filterSnapshotOffers(snapshot, {
      collection: collectionParam,
      lender: lenderParam,
      status: statusParam,
      sort: sortParam,
    });

    let gondiOffersRaw: GondiOfferNode[] = [];
    if (collectionParam) {
      gondiOffersRaw = await gondiClient.getCollectionOffers(collectionParam);
    } else if (onChainOffers.length < limit) {
      gondiOffersRaw = await gondiClient.listOffers({ statuses: ['ACTIVE'], first: 50 });
    }

    const gondiItems: OfferItem[] = gondiOffersRaw.map((o) =>
      convertGondiOfferToItem(o, chainId, collectionParam)
    );

    const seenOfferIds = new Set(onChainOffers.map((o) => o.offerId));
    const mergedOffers = [...onChainOffers];

    for (const item of gondiItems) {
      if (!seenOfferIds.has(item.offerId)) {
        if (collectionParam && item.collection.toLowerCase() !== collectionParam.toLowerCase()) {
          continue;
        }
        if (lenderParam && item.lender.toLowerCase() !== lenderParam.toLowerCase()) {
          continue;
        }
        if (statusParam && item.status !== statusParam) {
          continue;
        }
        seenOfferIds.add(item.offerId);
        mergedOffers.push(item);
      }
    }

    if (sortParam === 'principal') {
      mergedOffers.sort((a, b) => (BigInt(b.principalWei) > BigInt(a.principalWei) ? 1 : -1));
    } else if (sortParam === 'interest') {
      mergedOffers.sort((a, b) => b.termInterestBps - a.termInterestBps);
    }

    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const paginated = mergedOffers.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < mergedOffers.length ? (startIndex + limit).toString() : null;

    const response: OffersListResponse = {
      offers: paginated,
      nextCursor,
      total: mergedOffers.length,
    };

    return jsonResponse(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return errorResponse(message, 'OFFERS_FETCH_ERROR', 500);
  }
}

