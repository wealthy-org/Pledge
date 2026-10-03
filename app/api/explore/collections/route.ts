import { NextRequest } from 'next/server';
import { getBlockscoutClient } from '@/lib/blockscout';
import { indexerStore } from '@/lib/indexer/store';
import { syncOnChainLogs } from '@/lib/indexer/sync';
import { jsonResponse } from '@/lib/api/response';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { detectDuplicateNames } from '@/lib/services/collectionSafety';
import type { ExploreCollectionItem, ExploreCollectionsResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const hasOffersOnly = searchParams.get('hasOffers') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
  const cursor = searchParams.get('cursor') || undefined;
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  if (chainId !== undefined) {
    try {
      await syncOnChainLogs(chainId);
    } catch {}
  }

  let blockscoutItems: Array<{
    contractAddress: string;
    name: string;
    symbol: string;
    totalSupply?: string;
    holdersCount?: number;
    iconUrl?: string;
  }> = [];

  let nextPageParams: Record<string, unknown> | null = null;

  try {
    const client = getBlockscoutClient(chainId);
    const queryParams: Record<string, string> = {};
    if (cursor) queryParams.cursor = cursor;
    const response = await client.fetchERC721Collections(queryParams);
    blockscoutItems = response.items;
    nextPageParams = response.nextPageParams;
  } catch {
    blockscoutItems = [];
  }

  const activeOffers = Array.from(indexerStore.offers.values()).filter(
    (o) => o.status === 'open' && (chainId === undefined || o.chain_id === chainId)
  );

  const activeLoans = Array.from(indexerStore.loans.values()).filter(
    (l) => l.status === 'active' && (chainId === undefined || l.chain_id === chainId)
  );

  const offersByCol = new Map<string, typeof activeOffers>();
  for (const offer of activeOffers) {
    const col = offer.collection.toLowerCase();
    const list = offersByCol.get(col) || [];
    list.push(offer);
    offersByCol.set(col, list);
  }

  const loansByCol = new Map<string, typeof activeLoans>();
  for (const loan of activeLoans) {
    const col = loan.collection.toLowerCase();
    const list = loansByCol.get(col) || [];
    list.push(loan);
    loansByCol.set(col, list);
  }

  const seenAddresses = new Set<string>();
  const aggregated: ExploreCollectionItem[] = [];

  for (const item of blockscoutItems) {
    const addr = item.contractAddress.toLowerCase();
    if (!addr) continue;
    seenAddresses.add(addr);

    const colOffers = offersByCol.get(addr) || [];
    const colLoans = loansByCol.get(addr) || [];

    let poolSize = 0n;
    let bestOffer: bigint | null = null;
    for (const o of colOffers) {
      const val = BigInt(o.principal_wei);
      poolSize += val;
      if (bestOffer === null || val > bestOffer) {
        bestOffer = val;
      }
    }

    aggregated.push({
      address: item.contractAddress,
      name: item.name,
      symbol: item.symbol,
      imageUrl: item.iconUrl || resolveCollectionImageUrl(item.contractAddress, item.symbol || item.name),
      totalSupply: item.totalSupply,
      holdersCount: item.holdersCount,
      bestOfferWei: bestOffer !== null ? bestOffer.toString() : null,
      poolSizeWei: poolSize.toString(),
      offerCount: colOffers.length,
      activeLoansCount: colLoans.length,
      isVerifiedErc721: true,
    });
  }

  for (const [colAddr, colOffers] of offersByCol.entries()) {
    if (!seenAddresses.has(colAddr)) {
      seenAddresses.add(colAddr);
      const colLoans = loansByCol.get(colAddr) || [];
      let poolSize = 0n;
      let bestOffer: bigint | null = null;
      for (const o of colOffers) {
        const val = BigInt(o.principal_wei);
        poolSize += val;
        if (bestOffer === null || val > bestOffer) {
          bestOffer = val;
        }
      }

      aggregated.push({
        address: colAddr,
        name: `Collection ${colAddr.slice(0, 6)}...${colAddr.slice(-4)}`,
        symbol: 'NFT',
        imageUrl: resolveCollectionImageUrl(colAddr, 'NFT'),
        bestOfferWei: bestOffer !== null ? bestOffer.toString() : null,
        poolSizeWei: poolSize.toString(),
        offerCount: colOffers.length,
        activeLoansCount: colLoans.length,
        isVerifiedErc721: true,
      });
    }
  }

  let filtered = aggregated;

  if (search) {
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.symbol.toLowerCase().includes(search) ||
        c.address.toLowerCase().includes(search)
    );
  }

  if (hasOffersOnly) {
    filtered = filtered.filter((c) => c.offerCount > 0);
  }

  const duplicatesMap = detectDuplicateNames(filtered);
  const withDuplicateFlags = filtered.map((c) => ({
    ...c,
    isDuplicateName: duplicatesMap.get(c.address.toLowerCase()) || false,
  }));

  const paginated = withDuplicateFlags.slice(0, limit);
  const nextCursor =
    nextPageParams && typeof nextPageParams === 'object'
      ? JSON.stringify(nextPageParams)
      : withDuplicateFlags.length > limit
      ? limit.toString()
      : null;

  const result: ExploreCollectionsResponse = {
    collections: paginated,
    nextCursor,
    total: withDuplicateFlags.length,
  };

  return jsonResponse(result);
}
