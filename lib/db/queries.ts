import { indexerStore } from '@/lib/indexer/store';
import { syncOnChainLogs } from '@/lib/indexer/sync';
import {
  fetchOnChainCollectionInfo,
  resolveCollectionImageUrl,
  setCollectionImageCache,
} from '@/lib/services/metadata';
import { gondiClient, extractGondiImageUrl } from '@/lib/gondi';
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
  LoanDetailResponse,
  WalletLoansResponse,
  ActivityResponse,
  MarketStatsResponse,
  ActivityItem,
} from '@/types/api';
import { OfferStatus, LoanStatus } from '@/types/database';

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

export async function fetchCollectionsWithStats(chainId?: number): Promise<CollectionItemResponse[]> {
  const targetChain = resolveChainId(chainId);
  const snapshot = await getProtocolSnapshot(targetChain);
  const distinctAddresses = getDistinctCollectionsFromSnapshot(snapshot);

  const [overview, gondiList] = await Promise.all([
    gondiClient.getMarketOverviewData('DAY').catch(() => ({ top: [], volume: [], movers: [] })),
    gondiClient.listCollections(50).catch(() => []),
  ]);

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
    map.set(addr, {
      address: (gc.contractData?.contractAddress || gc.id) as `0x${string}`,
      name: gc.name || 'Gondi Collection',
      symbol: gc.slug?.toUpperCase() || 'NFT',
      imageUrl: imgUrl,
      description: `${gc.name || 'NFT Collection'} on Robinhood Chain`,
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
    });
  }

  for (const addr of distinctAddresses) {
    const normalized = addr.toLowerCase();
    if (map.has(normalized)) continue;
    const onChain = await fetchOnChainCollectionInfo(addr, targetChain);
    const stats = computeCollectionStats(snapshot, addr);
    map.set(normalized, {
      address: onChain.address,
      name: onChain.name,
      symbol: onChain.symbol,
      imageUrl: resolveCollectionImageUrl(onChain.address, onChain.symbol || onChain.name),
      description: `${onChain.name} on Robinhood Chain`,
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
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
  const isGondi = Boolean(await gondiClient.getCollectionByAddress(address).catch(() => null));

  if (!isEnabled && !hasOffers && !hasLoans && !isGondi) {
    return null;
  }

  const onChain = await fetchOnChainCollectionInfo(address, targetChain);

  const stats = computeCollectionStats(snapshot, address);
  const lastBlock = await getLastIndexedBlock(targetChain);

  return {
    collection: {
      address: onChain.address,
      name: onChain.name,
      symbol: onChain.symbol,
      imageUrl: onChain.imageUrl || resolveCollectionImageUrl(onChain.address, onChain.symbol || onChain.name),
      description: `${onChain.name} on Robinhood Chain`,
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
    },
    stats: {
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
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
  const allFiltered = filterSnapshotOffers(snapshot, {
    collection: address,
    status,
    sort,
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
