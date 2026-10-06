import { NextRequest } from 'next/server';
import { indexerStore } from '@/lib/indexer/store';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { getServiceSupabaseClient, getSupabaseClient } from '@/lib/db/supabase';

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

  const target = address.toLowerCase();

  try {
    const supabase = getServiceSupabaseClient() || getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from('watchlists')
      .select('collection_address')
      .eq('wallet_address', target);

    if (!error && data) {
      const dbList = (data as Array<{ collection_address: string }>).map((r) => r.collection_address.toLowerCase());
      const memoryList = indexerStore.getWatchlist(target);
      const combined = Array.from(new Set([...memoryList, ...dbList]));
      indexerStore.setWatchlist(target, combined);
      return jsonResponse({
        address: target,
        watchlist: combined,
      });
    }
  } catch {}

  const watchlist = indexerStore.getWatchlist(target);

  return jsonResponse({
    address: target,
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

  const target = address.toLowerCase();

  let body: { collection?: string; collections?: string[]; action?: 'toggle' | 'set' };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_BODY', 400);
  }

  let updated: string[] = [];

  if (body.collections && Array.isArray(body.collections)) {
    updated = indexerStore.setWatchlist(target, body.collections);
    try {
      const supabase = getServiceSupabaseClient() || getSupabaseClient();
      await (supabase as any).from('watchlists').delete().eq('wallet_address', target);
      if (updated.length > 0) {
        await (supabase as any).from('watchlists').insert(
          updated.map((c) => ({
            wallet_address: target,
            collection_address: c.toLowerCase(),
          }))
        );
      }
    } catch {}
  } else if (body.collection && typeof body.collection === 'string') {
    if (!validateAddress(body.collection)) {
      return errorResponse(
        `Invalid collection address format: ${body.collection}`,
        'INVALID_COLLECTION_ADDRESS',
        400
      );
    }
    const normCollection = body.collection.toLowerCase();
    updated = indexerStore.toggleWatchlist(target, normCollection);
    try {
      const supabase = getServiceSupabaseClient() || getSupabaseClient();
      const isNowPresent = updated.includes(normCollection);
      if (isNowPresent) {
        await (supabase as any).from('watchlists').upsert({
          wallet_address: target,
          collection_address: normCollection,
        });
      } else {
        await (supabase as any)
          .from('watchlists')
          .delete()
          .eq('wallet_address', target)
          .eq('collection_address', normCollection);
      }
    } catch {}
  } else {
    return errorResponse(
      'Missing collection or collections in request body',
      'MISSING_COLLECTION',
      400
    );
  }

  return jsonResponse({
    address: target,
    watchlist: updated,
  });
}
