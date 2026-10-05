import { NextRequest } from 'next/server';
import { gondiClient } from '@/lib/gondi';
import { indexerStore } from '@/lib/indexer/store';
import { syncOnChainLogs } from '@/lib/indexer/sync';
import { jsonResponse } from '@/lib/api/response';
import { resolveCollectionImageUrl, setCollectionImageCache, fetchOnChainCollectionInfo } from '@/lib/services/metadata';
import { detectDuplicateNames } from '@/lib/services/collectionSafety';
import type { ExploreCollectionItem, ExploreCollectionsResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
  const hasOffersOnly = searchParams.get('hasOffers') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  if (chainId !== undefined) {
    try {
      await syncOnChainLogs(chainId);
    } catch {}
  }

  const [overviewItems, collectionNodes] = await Promise.all([
    gondiClient.getMarketOverview('DAY').catch(() => []),
    gondiClient.listCollections(limit).catch(() => []),
  ]);

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

  for (const item of overviewItems) {
    const addr = (item.collection?.contractData?.contractAddress || item.collection?.id || '').toLowerCase();
    if (!addr || seenAddresses.has(addr)) continue;
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

    if (item.collection?.image?.cacheUrl) {
      setCollectionImageCache(addr, item.collection.image.cacheUrl);
    }
    const name = item.collection?.name || 'Unnamed Collection';
    const symbol = item.collection?.slug?.toUpperCase() || 'NFT';
    const imageUrl = item.collection?.image?.cacheUrl || resolveCollectionImageUrl(addr, symbol || name);
    const floorPriceEth = item.salesVolume ? (item.salesVolume / Math.max(1, item.salesCount || 1)).toFixed(2) : undefined;

    aggregated.push({
      address: item.collection?.contractData?.contractAddress || item.collection?.id,
      name,
      symbol,
      imageUrl,
      totalSupply: item.collection?.supply ? String(item.collection.supply) : undefined,
      holdersCount: item.usersCount || undefined,
      floorPriceEth,
      bestOfferWei: bestOffer !== null ? bestOffer.toString() : null,
      poolSizeWei: poolSize.toString(),
      offerCount: colOffers.length || (item.loansCount ? item.loansCount : 0),
      activeLoansCount: colLoans.length,
      isVerifiedErc721: true,
    });
  }

  for (const node of collectionNodes) {
    const addr = (node.contractData?.contractAddress || node.id || '').toLowerCase();
    if (!addr || seenAddresses.has(addr)) continue;
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

    if (node.image?.cacheUrl) {
      setCollectionImageCache(addr, node.image.cacheUrl);
    }
    const name = node.name || 'Unnamed Collection';
    const symbol = node.slug?.toUpperCase() || 'NFT';
    const imageUrl = node.image?.cacheUrl || resolveCollectionImageUrl(addr, symbol || name);

    aggregated.push({
      address: node.contractData?.contractAddress || node.id,
      name,
      symbol,
      imageUrl,
      totalSupply: node.supply ? String(node.supply) : undefined,
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

      const meta = await fetchOnChainCollectionInfo(colAddr, chainId);

      aggregated.push({
        address: colAddr,
        name: meta.name || `Collection ${colAddr.slice(0, 6)}...${colAddr.slice(-4)}`,
        symbol: meta.symbol || 'NFT',
        imageUrl: resolveCollectionImageUrl(colAddr, meta.symbol || meta.name),
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
  const nextCursor = withDuplicateFlags.length > limit ? limit.toString() : null;

  const result: ExploreCollectionsResponse = {
    collections: paginated,
    nextCursor,
    total: withDuplicateFlags.length,
  };

  return jsonResponse(result);
}
