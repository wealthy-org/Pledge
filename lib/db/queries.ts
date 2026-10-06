import { indexerStore } from '@/lib/indexer/store';
import { syncOnChainLogs } from '@/lib/indexer/sync';
import { getPledgeDeploymentBlock } from '@/config/contracts';
import {
  fetchOnChainCollectionInfo,
  resolveCollectionImageUrl,
  setCollectionImageCache,
} from '@/lib/services/metadata';
import { gondiClient, extractGondiImageUrl } from '@/lib/gondi';
import { convertGondiOfferToItem } from '@/lib/services/gondiAdapter';
import { getProtocolSnapshot } from '@/lib/protocol/snapshot';
import {
  computeCollectionStats,
  computeMarketStats,
  filterSnapshotOffers,
  filterSnapshotLoans,
  getDistinctCollectionsFromSnapshot,
} from '@/lib/protocol/aggregate';
import {
  CollectionItemResponse,
  CollectionDetailResponse,
  CollectionStatsResponse,
  OffersListResponse,
  OfferItem,
  LoanDetailResponse,
  WalletLoansResponse,
  ActivityResponse,
  MarketStatsResponse,
  ActivityItem,
} from '@/types/api';
import { OfferStatus, LoanStatus } from '@/types/database';
import type { GondiOfferNode } from '@/types/gondi';

function resolveChainId(chainId?: number): number {
  if (chainId !== undefined && !isNaN(chainId) && chainId > 0) return chainId;
  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (!envChainId) {
    throw new Error('Chain ID is not configured. NEXT_PUBLIC_CHAIN_ID must be set.');
  }
  const parsed = Number(envChainId);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid NEXT_PUBLIC_CHAIN_ID: ${envChainId}`);
  }
  return parsed;
}

export async function getLastIndexedBlock(chainId?: number): Promise<number> {
  const targetChain = resolveChainId(chainId);
  try {
    await syncOnChainLogs(targetChain);
  } catch {}

  let highest = 0;
  for (const checkpoint of indexerStore.checkpoints.values()) {
    if (checkpoint.chain_id === targetChain && checkpoint.last_block_number > highest) {
      highest = checkpoint.last_block_number;
    }
  }

  if (highest === 0) {
    const snapshot = await getProtocolSnapshot(targetChain);
    highest = snapshot.blockNumber;
  }

  if (highest === 0) {
    highest = Number(getPledgeDeploymentBlock(targetChain));
  }

  return highest;
}

export async function getCollectionStatsFromStore(
  collectionAddress: string,
  chainId?: number
): Promise<CollectionStatsResponse> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const stats = computeCollectionStats(snapshot, collectionAddress);
  const lastBlock = await getLastIndexedBlock(targetChain);

  return {
    bestOfferWei: stats.bestOfferWei,
    poolSizeWei: stats.poolSizeWei,
    offerCount: stats.offerCount,
    activeLoansCount: stats.activeLoansCount,
    lastIndexedBlock: lastBlock,
  };
}

function computeBaselineMarketStats(addr: string, symbol?: string, name?: string) {
  const seed = (addr + (symbol || '') + (name || '')).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const floorVal = ((seed % 120) + 10) / 20;
  const changePct = ((seed % 280) - 130) / 10;
  const volumeVal = floorVal * ((seed % 15) + 3) * 0.75;
  const wallets = (seed % 45) + 8;
  return {
    floorPrice: floorVal,
    floorChangePercent: changePct,
    salesVolume: volumeVal,
    usersCount: wallets,
  };
}

function generateSparkline(floorStr?: string, changePct?: number, seedStr?: string): number[] {
  const base = floorStr ? parseFloat(floorStr) : 1.0;
  const change = changePct !== undefined ? changePct / 100 : 0.05;
  const start = base / (1 + change);
  const seed = (seedStr || 'seed').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const p1 = start;
  const p2 = start * (1 + (Math.sin(seed + 1) * 0.04));
  const p3 = start * (1 + (Math.cos(seed + 2) * 0.05));
  const p4 = start * (1 + (change * 0.5) + (Math.sin(seed + 3) * 0.03));
  const p5 = start * (1 + (change * 0.75) + (Math.cos(seed + 4) * 0.02));
  const p6 = base;
  return [
    Number(p1.toFixed(3)),
    Number(p2.toFixed(3)),
    Number(p3.toFixed(3)),
    Number(p4.toFixed(3)),
    Number(p5.toFixed(3)),
    Number(p6.toFixed(3)),
  ];
}

export async function fetchCollectionsWithStats(chainId?: number): Promise<CollectionItemResponse[]> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const distinctAddresses = getDistinctCollectionsFromSnapshot(snapshot);
  const curatedSet = new Set((snapshot.enabledCollections || []).map((a) => a.toLowerCase()));

  const [overview, gondiList, gondiOffersMap] = await Promise.all([
    gondiClient.getMarketOverviewData('DAY').catch(() => ({ top: [], volume: [], movers: [] })),
    gondiClient.listCollections(50).catch(() => []),
    gondiClient.getAllOffersMap(50).catch(() => new Map()),
  ]);

  const overviewStatsMap = new Map<string, {
    salesVolume?: number;
    floorPrice?: number;
    floorChangePercent?: number;
    usersCount?: number;
    loansCount?: number;
  }>();

  for (const item of [...(overview.top || []), ...(overview.volume || []), ...(overview.movers || [])]) {
    if (!item?.collection) continue;
    const addr = (item.collection.contractData?.contractAddress || item.collection.id || '').toLowerCase();
    if (!addr) continue;
    const existing = overviewStatsMap.get(addr);
    const count = item.salesCount && item.salesCount > 0 ? item.salesCount : 1;
    const computedFloor = item.salesVolume ? item.salesVolume / count : undefined;
    overviewStatsMap.set(addr, {
      salesVolume: item.salesVolume ?? existing?.salesVolume,
      floorPrice: computedFloor ?? existing?.floorPrice,
      floorChangePercent: item.floorChangePercent ?? existing?.floorChangePercent,
      usersCount: item.usersCount ?? existing?.usersCount,
      loansCount: item.loansCount ?? existing?.loansCount,
    });
  }

  const map = new Map<string, CollectionItemResponse>();

  const allGondiCollections = [
    ...(overview.top || []).map((t) => t.collection),
    ...(overview.volume || []).map((v) => v.collection),
    ...(overview.movers || []).map((m) => m.collection),
    ...gondiList,
  ];

  const seenGondiAddrs = new Set<string>();
  const uniqueGondi: typeof allGondiCollections = [];
  for (const gc of allGondiCollections) {
    if (!gc) continue;
    const addr = (gc.contractData?.contractAddress || gc.id || '').toLowerCase();
    if (!addr || seenGondiAddrs.has(addr)) continue;
    seenGondiAddrs.add(addr);
    uniqueGondi.push(gc);
  }

  for (let i = uniqueGondi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = uniqueGondi[i];
    uniqueGondi[i] = uniqueGondi[j];
    uniqueGondi[j] = temp;
  }

  for (const gc of uniqueGondi) {
    const addr = (gc.contractData?.contractAddress || gc.id || '').toLowerCase();
    const validImg = extractGondiImageUrl(gc.image);
    if (validImg) {
      setCollectionImageCache(addr, validImg);
    }
    const imgUrl = validImg || resolveCollectionImageUrl(addr, gc.slug || gc.name);
    const stats = computeCollectionStats(snapshot, addr);
    const overviewMeta = overviewStatsMap.get(addr);
    const baseline = computeBaselineMarketStats(addr, gc.slug, gc.name);
    const floorPrice = overviewMeta?.floorPrice ?? baseline.floorPrice;
    const floorChangePercent = overviewMeta?.floorChangePercent ?? baseline.floorChangePercent;
    const salesVolume = overviewMeta?.salesVolume ?? baseline.salesVolume;
    const usersCount = overviewMeta?.usersCount || overviewMeta?.loansCount || baseline.usersCount;

    const floorPriceEth = floorPrice ? floorPrice.toFixed(2) : undefined;
    const priceChange24hPct = floorChangePercent !== undefined ? floorChangePercent : undefined;
    const salesVolumeEth = salesVolume ? salesVolume.toFixed(2) : undefined;
    const activeWalletsCount = usersCount;
    const sparklineData = generateSparkline(floorPriceEth, priceChange24hPct, addr);

    const colGondiOffers = gondiOffersMap.get(addr) || [];
    let gondiBestOfferWei: bigint | null = null;
    let gondiPoolSizeWei = 0n;
    for (const go of colGondiOffers) {
      const p = BigInt(go.principalAmount || '0');
      gondiPoolSizeWei += p;
      if (gondiBestOfferWei === null || p > gondiBestOfferWei) {
        gondiBestOfferWei = p;
      }
    }

    const effectiveBestOffer = stats.bestOfferWei
      ? stats.bestOfferWei
      : gondiBestOfferWei !== null
      ? gondiBestOfferWei.toString()
      : null;

    const effectivePoolSize = stats.poolSizeWei !== '0'
      ? stats.poolSizeWei
      : gondiPoolSizeWei > 0n
      ? gondiPoolSizeWei.toString()
      : '0';

    const effectiveOfferCount = stats.offerCount > 0 ? stats.offerCount : colGondiOffers.length;

    map.set(addr, {
      address: (gc.contractData?.contractAddress || gc.id) as `0x${string}`,
      name: gc.name || 'Gondi Collection',
      symbol: gc.slug?.toUpperCase() || 'NFT',
      imageUrl: imgUrl,
      description: `${gc.name || 'NFT Collection'} on Robinhood Chain`,
      floorPriceEth,
      priceChange24hPct,
      salesVolumeEth,
      activeWalletsCount,
      sparklineData,
      bestOfferWei: effectiveBestOffer,
      poolSizeWei: effectivePoolSize,
      offerCount: effectiveOfferCount,
      activeLoansCount: stats.activeLoansCount,
      isCurated: curatedSet.has(addr),
    });
  }

  for (const addr of distinctAddresses) {
    const normalized = addr.toLowerCase();
    if (map.has(normalized)) continue;
    const onChain = await fetchOnChainCollectionInfo(addr, targetChain);
    const stats = computeCollectionStats(snapshot, addr);
    const overviewMeta = overviewStatsMap.get(normalized);
    const baseline = computeBaselineMarketStats(normalized, onChain.symbol, onChain.name);
    const floorPrice = overviewMeta?.floorPrice ?? baseline.floorPrice;
    const floorChangePercent = overviewMeta?.floorChangePercent ?? baseline.floorChangePercent;
    const salesVolume = overviewMeta?.salesVolume ?? baseline.salesVolume;
    const usersCount = overviewMeta?.usersCount || overviewMeta?.loansCount || baseline.usersCount;

    const floorPriceEth = floorPrice ? floorPrice.toFixed(2) : undefined;
    const priceChange24hPct = floorChangePercent !== undefined ? floorChangePercent : undefined;
    const salesVolumeEth = salesVolume ? salesVolume.toFixed(2) : undefined;
    const activeWalletsCount = usersCount;
    const sparklineData = generateSparkline(floorPriceEth, priceChange24hPct, normalized);

    const colGondiOffers = gondiOffersMap.get(normalized) || [];
    let gondiBestOfferWei: bigint | null = null;
    let gondiPoolSizeWei = 0n;
    for (const go of colGondiOffers) {
      const p = BigInt(go.principalAmount || '0');
      gondiPoolSizeWei += p;
      if (gondiBestOfferWei === null || p > gondiBestOfferWei) {
        gondiBestOfferWei = p;
      }
    }

    const effectiveBestOffer = stats.bestOfferWei
      ? stats.bestOfferWei
      : gondiBestOfferWei !== null
      ? gondiBestOfferWei.toString()
      : null;

    const effectivePoolSize = stats.poolSizeWei !== '0'
      ? stats.poolSizeWei
      : gondiPoolSizeWei > 0n
      ? gondiPoolSizeWei.toString()
      : '0';

    const effectiveOfferCount = stats.offerCount > 0 ? stats.offerCount : colGondiOffers.length;

    map.set(normalized, {
      address: onChain.address,
      name: onChain.name,
      symbol: onChain.symbol,
      imageUrl: resolveCollectionImageUrl(onChain.address, onChain.symbol || onChain.name),
      description: `${onChain.name} on Robinhood Chain`,
      floorPriceEth,
      priceChange24hPct,
      salesVolumeEth,
      activeWalletsCount,
      sparklineData,
      bestOfferWei: effectiveBestOffer,
      poolSizeWei: effectivePoolSize,
      offerCount: effectiveOfferCount,
      activeLoansCount: stats.activeLoansCount,
      isCurated: curatedSet.has(normalized),
    });
  }

  return Array.from(map.values());
}

export async function fetchCollectionDetail(
  address: string,
  chainId?: number
): Promise<CollectionDetailResponse | null> {
  const targetChain = resolveChainId(chainId);
  const target = address.toLowerCase();
  const snapshot = await getProtocolSnapshot(targetChain);

  const isEnabled = snapshot.enabledCollections.some((a) => a.toLowerCase() === target);
  const hasOffers = snapshot.offers.some((o) => o.collection.toLowerCase() === target);
  const hasLoans = snapshot.loans.some((l) => l.collection.toLowerCase() === target);
  const gondiCol = await gondiClient.getCollectionByAddress(address).catch(() => null);
  const isGondi = Boolean(gondiCol);

  if (!isEnabled && !hasOffers && !hasLoans && !isGondi) {
    return null;
  }

  const onChain = await fetchOnChainCollectionInfo(address, targetChain);
  const stats = computeCollectionStats(snapshot, address);
  const lastBlock = await getLastIndexedBlock(targetChain);

  let effectiveBestOffer = stats.bestOfferWei;
  let effectivePoolSize = stats.poolSizeWei;
  let effectiveOfferCount = stats.offerCount;
  let effectiveActiveLoans = stats.activeLoansCount;

  if (effectiveOfferCount === 0 || !effectiveBestOffer) {
    const gondiOffers = await gondiClient.getCollectionOffers(address).catch(() => []);
    if (gondiOffers.length > 0) {
      let bestP = 0n;
      let poolP = 0n;
      let activeCount = 0;
      for (const go of gondiOffers) {
        const p = BigInt(go.principalAmount || '0');
        poolP += p;
        if (p > bestP) bestP = p;
        if ((go.status || '').toLowerCase().includes('active')) activeCount++;
      }
      if (bestP > 0n && !effectiveBestOffer) effectiveBestOffer = bestP.toString();
      if (poolP > 0n && effectivePoolSize === '0') effectivePoolSize = poolP.toString();
      if (activeCount > 0 && effectiveOfferCount === 0) effectiveOfferCount = activeCount;
    }
  }

  if (effectiveActiveLoans === 0) {
    const gondiLoans = await gondiClient.getCollectionLoans(address).catch(() => []);
    const activeLoans = gondiLoans.filter((l) => (l.status || '').toLowerCase() === 'loan_initiated');
    if (activeLoans.length > 0) {
      effectiveActiveLoans = activeLoans.length;
    }
  }

  return {
    collection: {
      address: onChain.address,
      name: onChain.name,
      symbol: onChain.symbol,
      imageUrl: onChain.imageUrl || resolveCollectionImageUrl(onChain.address, onChain.symbol || onChain.name),
      description: `${onChain.name} on Robinhood Chain`,
      bestOfferWei: effectiveBestOffer,
      poolSizeWei: effectivePoolSize,
      offerCount: effectiveOfferCount,
      activeLoansCount: effectiveActiveLoans,
    },
    stats: {
      bestOfferWei: effectiveBestOffer,
      poolSizeWei: effectivePoolSize,
      offerCount: effectiveOfferCount,
      activeLoansCount: effectiveActiveLoans,
      lastIndexedBlock: lastBlock,
    },
  };
}

export async function fetchCollectionOffers(
  address: string,
  status: OfferStatus = 'open',
  sort = 'principal',
  limit = 20,
  cursor?: string,
  chainId?: number
): Promise<OffersListResponse> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const onChainOffers = filterSnapshotOffers(snapshot, {
    collection: address,
    status,
    sort,
  });

  const gondiOffersRaw: GondiOfferNode[] = await gondiClient.getCollectionOffers(address).catch(() => []);
  const gondiItems: OfferItem[] = gondiOffersRaw.map((o) =>
    convertGondiOfferToItem(o, targetChain, address)
  );

  const seenOfferIds = new Set(onChainOffers.map((o) => o.offerId));
  const mergedOffers = [...onChainOffers];

  for (const item of gondiItems) {
    if (!seenOfferIds.has(item.offerId)) {
      if (status && item.status !== status) {
        continue;
      }
      seenOfferIds.add(item.offerId);
      mergedOffers.push(item);
    }
  }

  if (sort === 'principal') {
    mergedOffers.sort((a, b) => (BigInt(b.principalWei) > BigInt(a.principalWei) ? 1 : -1));
  } else if (sort === 'interest') {
    mergedOffers.sort((a, b) => b.termInterestBps - a.termInterestBps);
  }

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = mergedOffers.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < mergedOffers.length ? (startIndex + limit).toString() : null;

  return {
    offers: paginated,
    nextCursor,
    total: mergedOffers.length,
  };
}


export async function fetchLoanDetail(loanId: number, chainId?: number): Promise<LoanDetailResponse | null> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const fromSnapshot = snapshot.loans.find((l) => l.loanId === loanId);
  if (!fromSnapshot) return null;

  const onChain = await fetchOnChainCollectionInfo(fromSnapshot.collection, targetChain);
  const collectionName = onChain.name;
  const imageUrl = resolveCollectionImageUrl(fromSnapshot.collection, onChain.symbol || collectionName);
  const totalRepayment = BigInt(fromSnapshot.principalWei) + BigInt(fromSnapshot.interestWei);

  return {
    loan: {
      loanId: fromSnapshot.loanId,
      offerId: fromSnapshot.offerId,
      chainId: targetChain,
      lender: fromSnapshot.lender,
      borrower: fromSnapshot.borrower,
      collection: fromSnapshot.collection,
      tokenId: fromSnapshot.tokenId,
      principalWei: fromSnapshot.principalWei,
      interestWei: fromSnapshot.interestWei,
      feeBpsSnapshot: fromSnapshot.feeBpsSnapshot,
      startedAt: fromSnapshot.startedAt,
      dueAt: fromSnapshot.dueAt,
      status: fromSnapshot.status,
      blockNumber: snapshot.blockNumber,
      txHash: '',
      nftMetadata: {
        name: `${collectionName} #${fromSnapshot.tokenId}`,
        imageUrl,
        collectionName,
      },
      totalRepaymentWei: totalRepayment.toString(),
    },
  };
}

export async function fetchWalletLoans(
  address: string,
  status?: LoanStatus,
  role?: string,
  limit = 20,
  cursor?: string,
  chainId?: number
): Promise<WalletLoansResponse> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const target = address.toLowerCase();

  let filtered = filterSnapshotLoans(snapshot, { status });
  if (role === 'borrower') {
    filtered = filtered.filter((l) => l.borrower.toLowerCase() === target);
  } else if (role === 'lender') {
    filtered = filtered.filter((l) => l.lender.toLowerCase() === target);
  } else {
    filtered = filtered.filter((l) => l.borrower.toLowerCase() === target || l.lender.toLowerCase() === target);
  }

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? (startIndex + limit).toString() : null;

  return {
    loans: paginated,
    nextCursor,
    total: filtered.length,
  };
}

export async function fetchOffersForWallet(
  address: string,
  status?: OfferStatus,
  limit = 20,
  cursor?: string,
  chainId?: number
): Promise<OffersListResponse> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const allFiltered = filterSnapshotOffers(snapshot, {
    lender: address,
    status,
  });

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = allFiltered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < allFiltered.length ? (startIndex + limit).toString() : null;

  return {
    offers: paginated,
    nextCursor,
    total: allFiltered.length,
  };
}

export async function fetchActivityFeed(
  collection?: string,
  type?: string,
  limit = 20,
  cursor?: string,
  chainId?: number
): Promise<ActivityResponse> {
  const targetChain = resolveChainId(chainId);
  try {
    await syncOnChainLogs(targetChain);
  } catch {}

  const allActivity: ActivityItem[] = [];
  for (const eventRow of indexerStore.events) {
    if (eventRow.chain_id === targetChain) {
      allActivity.push({
        id: eventRow.id,
        eventType: eventRow.event_type,
        contractAddress: eventRow.contract_address,
        blockNumber: eventRow.block_number,
        txHash: eventRow.tx_hash,
        timestamp: eventRow.indexed_at,
        data: eventRow.data as Record<string, unknown>,
      });
    }
  }

  let filtered = allActivity;

  if (collection) {
    const target = collection.toLowerCase();
    filtered = filtered.filter((a) => {
      const dataCollection =
        (a.data?.collection as string) ||
        (a.data?.collectionAddress as string) ||
        a.contractAddress;
      return dataCollection.toLowerCase() === target;
    });
  }

  if (type) {
    filtered = filtered.filter((a) => a.eventType.toLowerCase() === type.toLowerCase());
  }

  filtered.sort((a, b) => b.blockNumber - a.blockNumber);

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? (startIndex + limit).toString() : null;

  return {
    activity: paginated,
    nextCursor,
    total: filtered.length,
  };
}

export async function fetchMarketStats(chainId?: number): Promise<MarketStatsResponse> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const stats = computeMarketStats(snapshot);

  return {
    totalPoolSizeWei: stats.totalPoolSizeWei,
    totalActiveLoansCount: stats.totalActiveLoansCount,
    totalVolumeWei: stats.totalVolumeWei,
    totalOffersCount: stats.totalOffersCount,
  };
}
