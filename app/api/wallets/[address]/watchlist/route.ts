import { NextRequest } from 'next/server';
import { indexerStore } from '@/lib/indexer/store';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';

export async function GET(
  _request: NextRequest,
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

  const watchlist = indexerStore.getWatchlist(address);

  return jsonResponse({
    address: address.toLowerCase(),
    watchlist,
  });
}

export async function POST(
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

  let body: { collection?: string; collections?: string[]; action?: 'toggle' | 'set' };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_BODY', 400);
  }

  let updated: string[] = [];

  if (body.collections && Array.isArray(body.collections)) {
    updated = indexerStore.setWatchlist(address, body.collections);
  } else if (body.collection && typeof body.collection === 'string') {
    if (!validateAddress(body.collection)) {
      return errorResponse(
        `Invalid collection address format: ${body.collection}`,
        'INVALID_COLLECTION_ADDRESS',
        400
      );
    }
    updated = indexerStore.toggleWatchlist(address, body.collection);
  } else {
    return errorResponse(
      'Missing collection or collections in request body',
      'MISSING_COLLECTION',
      400
    );
  }

  return jsonResponse({
    address: address.toLowerCase(),
    watchlist: updated,
  });
}
