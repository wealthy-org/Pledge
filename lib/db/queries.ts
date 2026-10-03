import { getCollectionByAddress } from '@/config/collections';
import { indexerStore } from '@/lib/indexer/store';
import { syncOnChainLogs } from '@/lib/indexer/sync';
import { fetchOnChainCollectionInfo, resolveCollectionImageUrl } from '@/lib/services/metadata';
import {
  CollectionItemResponse,
  CollectionDetailResponse,
  CollectionStatsResponse,
  OffersListResponse,
  LoanDetailResponse,
  WalletLoansResponse,
  ActivityResponse,
  MarketStatsResponse,
  OfferItem,
  LoanItem,
  ActivityItem,
} from '@/types/api';
import { OfferStatus, LoanStatus } from '@/types/database';

function resolveChainId(chainId?: number): number {
  if (chainId !== undefined) return chainId;
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
  await syncOnChainLogs(targetChain);
  let highest = 120;
  for (const checkpoint of indexerStore.checkpoints.values()) {
    if (checkpoint.chain_id === targetChain && checkpoint.last_block_number > highest) {
      highest = checkpoint.last_block_number;
    }
  }
  return highest;
}

export async function getCollectionStatsFromStore(
  collectionAddress: string,
  chainId?: number
): Promise<CollectionStatsResponse> {
  const targetChain = resolveChainId(chainId);
  const target = collectionAddress.toLowerCase();
  const openOffers: OfferItem[] = [];

  for (const row of indexerStore.offers.values()) {
    if (row.chain_id === targetChain && row.collection.toLowerCase() === target && row.status === 'open') {
      openOffers.push({
        offerId: row.offer_id,
        chainId: row.chain_id,
        lender: row.lender,
        collection: row.collection,
        principalWei: row.principal_wei,
        termInterestBps: row.term_interest_bps,
        feeBpsSnapshot: row.fee_bps_snapshot,
        durationSeconds: row.duration_seconds,
        expiresAt: row.expires_at,
        status: row.status,
        blockNumber: row.block_number,
        txHash: row.tx_hash,
        createdAt: row.indexed_at,
      });
    }
  }

  let bestOfferBigInt = 0n;
  let poolSizeBigInt = 0n;

  for (const offer of openOffers) {
    const val = BigInt(offer.principalWei);
    poolSizeBigInt += val;
    if (val > bestOfferBigInt) {
      bestOfferBigInt = val;
    }
  }

  let activeLoansCount = 0;
  for (const row of indexerStore.loans.values()) {
    if (row.chain_id === targetChain && row.collection.toLowerCase() === target && row.status === 'active') {
      activeLoansCount++;
    }
  }

  const lastBlock = await getLastIndexedBlock(targetChain);

  return {
    bestOfferWei: bestOfferBigInt > 0n ? bestOfferBigInt.toString() : null,
    poolSizeWei: poolSizeBigInt.toString(),
    offerCount: openOffers.length,
    activeLoansCount,
    lastIndexedBlock: lastBlock,
  };
}

export async function fetchCollectionsWithStats(chainId?: number): Promise<CollectionItemResponse[]> {
  const targetChain = resolveChainId(chainId);
  await syncOnChainLogs(targetChain);

  const addressSet = new Set<string>();

  for (const colRow of indexerStore.collections.values()) {
    if (colRow.chain_id === targetChain && colRow.is_enabled) {
      addressSet.add(colRow.address.toLowerCase());
    }
  }

  for (const offer of indexerStore.offers.values()) {
    if (offer.chain_id === targetChain && offer.collection) {
      addressSet.add(offer.collection.toLowerCase());
    }
  }

  for (const loan of indexerStore.loans.values()) {
    if (loan.chain_id === targetChain && loan.collection) {
      addressSet.add(loan.collection.toLowerCase());
    }
  }

  const envRhg = process.env.NEXT_PUBLIC_RHG_COLLECTION;
  const envSfr = process.env.NEXT_PUBLIC_SFR_COLLECTION;
  const envNgp = process.env.NEXT_PUBLIC_NGP_COLLECTION;
  if (envRhg && envRhg.startsWith('0x')) addressSet.add(envRhg.toLowerCase());
  if (envSfr && envSfr.startsWith('0x')) addressSet.add(envSfr.toLowerCase());
  if (envNgp && envNgp.startsWith('0x')) addressSet.add(envNgp.toLowerCase());

  const results: CollectionItemResponse[] = [];
  for (const addr of addressSet) {
    const known = getCollectionByAddress(addr, targetChain);
    const stats = await getCollectionStatsFromStore(addr, targetChain);

    if (known) {
      results.push({
        address: known.contractAddress,
        name: known.name,
        symbol: known.symbol,
        imageUrl: resolveCollectionImageUrl(known.name),
        description: `${known.name} on Robinhood Chain`,
        bestOfferWei: stats.bestOfferWei,
        poolSizeWei: stats.poolSizeWei,
        offerCount: stats.offerCount,
        activeLoansCount: stats.activeLoansCount,
      });
    } else {
      const onChain = await fetchOnChainCollectionInfo(addr, targetChain);
      results.push({
        address: onChain.address,
        name: onChain.name,
        symbol: onChain.symbol,
        imageUrl: resolveCollectionImageUrl(onChain.name),
        description: `${onChain.name} on Robinhood Chain`,
        bestOfferWei: stats.bestOfferWei,
        poolSizeWei: stats.poolSizeWei,
        offerCount: stats.offerCount,
        activeLoansCount: stats.activeLoansCount,
      });
    }
  }

  return results;
}

export async function fetchCollectionDetail(
  address: string,
  chainId?: number
): Promise<CollectionDetailResponse | null> {
  const targetChain = resolveChainId(chainId);
  await syncOnChainLogs(targetChain);

  const target = address.toLowerCase();
  const known = getCollectionByAddress(address, targetChain);
  const isEnabledInStore = indexerStore.collections.get(`${targetChain}:${target}`)?.is_enabled;
  const hasOffers = Array.from(indexerStore.offers.values()).some(
    (o) => o.chain_id === targetChain && o.collection.toLowerCase() === target
  );
  const hasLoans = Array.from(indexerStore.loans.values()).some(
    (l) => l.chain_id === targetChain && l.collection.toLowerCase() === target
  );

  if (!known && !isEnabledInStore && !hasOffers && !hasLoans) {
    return null;
  }

  const stats = await getCollectionStatsFromStore(address, targetChain);

  if (known) {
    return {
      collection: {
        address: known.contractAddress,
        name: known.name,
        symbol: known.symbol,
        imageUrl: resolveCollectionImageUrl(known.name),
        description: `${known.name} on Robinhood Chain`,
        bestOfferWei: stats.bestOfferWei,
        poolSizeWei: stats.poolSizeWei,
        offerCount: stats.offerCount,
        activeLoansCount: stats.activeLoansCount,
      },
      stats,
    };
  }

  const onChain = await fetchOnChainCollectionInfo(address, targetChain);
  return {
    collection: {
      address: onChain.address,
      name: onChain.name,
      symbol: onChain.symbol,
      imageUrl: resolveCollectionImageUrl(onChain.name),
      description: `${onChain.name} on Robinhood Chain`,
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
    },
    stats,
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
  const target = address.toLowerCase();
  const allOffers: OfferItem[] = [];

  for (const row of indexerStore.offers.values()) {
    if (row.chain_id === targetChain && row.collection.toLowerCase() === target) {
      allOffers.push({
        offerId: row.offer_id,
        chainId: row.chain_id,
        lender: row.lender,
        collection: row.collection,
        principalWei: row.principal_wei,
        termInterestBps: row.term_interest_bps,
        feeBpsSnapshot: row.fee_bps_snapshot,
        durationSeconds: row.duration_seconds,
        expiresAt: row.expires_at,
        status: row.status,
        blockNumber: row.block_number,
        txHash: row.tx_hash,
        createdAt: row.indexed_at,
      });
    }
  }

  let filtered = allOffers;
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  filtered.sort((a, b) => {
    if (sort === 'principal') {
      const diff = BigInt(b.principalWei) - BigInt(a.principalWei);
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    }
    if (sort === 'interest') {
      return a.termInterestBps - b.termInterestBps;
    }
    if (sort === 'expiry') {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    }
    return b.offerId - a.offerId;
  });

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? (startIndex + limit).toString() : null;

  return {
    offers: paginated,
    nextCursor,
    total: filtered.length,
  };
}

export async function fetchLoanDetail(loanId: number, chainId?: number): Promise<LoanDetailResponse | null> {
  const targetChain = resolveChainId(chainId);
  const fromStore = indexerStore.getLoan(targetChain, loanId);
  if (!fromStore) return null;

  const loan: LoanItem = {
    loanId: fromStore.loan_id,
    offerId: fromStore.offer_id,
    chainId: fromStore.chain_id,
    lender: fromStore.lender,
    borrower: fromStore.borrower,
    collection: fromStore.collection,
    tokenId: fromStore.token_id,
    principalWei: fromStore.principal_wei,
    interestWei: fromStore.interest_wei,
    feeBpsSnapshot: fromStore.fee_bps_snapshot,
    startedAt: fromStore.started_at,
    dueAt: fromStore.due_at,
    status: fromStore.status,
    blockNumber: fromStore.block_number,
    txHash: fromStore.tx_hash,
  };

  const known = getCollectionByAddress(loan.collection, targetChain);
  const onChain = known ? null : await fetchOnChainCollectionInfo(loan.collection, targetChain);
  const collectionName = known ? known.name : (onChain?.name || 'NFT Collection');
  const imageUrl = resolveCollectionImageUrl(collectionName);
  const totalRepayment = BigInt(loan.principalWei) + BigInt(loan.interestWei);

  return {
    loan: {
      ...loan,
      nftMetadata: {
        name: `${collectionName} #${loan.tokenId}`,
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
  const target = address.toLowerCase();
  const allLoans: LoanItem[] = [];

  for (const row of indexerStore.loans.values()) {
    if (row.chain_id === targetChain) {
      allLoans.push({
        loanId: row.loan_id,
        offerId: row.offer_id,
        chainId: row.chain_id,
        lender: row.lender,
        borrower: row.borrower,
        collection: row.collection,
        tokenId: row.token_id,
        principalWei: row.principal_wei,
        interestWei: row.interest_wei,
        feeBpsSnapshot: row.fee_bps_snapshot,
        startedAt: row.started_at,
        dueAt: row.due_at,
        status: row.status,
        blockNumber: row.block_number,
        txHash: row.tx_hash,
      });
    }
  }

  let filtered = allLoans.filter((l) => {
    if (role === 'borrower') return l.borrower.toLowerCase() === target;
    if (role === 'lender') return l.lender.toLowerCase() === target;
    return l.borrower.toLowerCase() === target || l.lender.toLowerCase() === target;
  });

  if (status) {
    filtered = filtered.filter((l) => l.status === status);
  }

  filtered.sort((a, b) => b.loanId - a.loanId);

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
  const target = address.toLowerCase();
  const allOffers: OfferItem[] = [];

  for (const row of indexerStore.offers.values()) {
    if (row.chain_id === targetChain && row.lender.toLowerCase() === target) {
      allOffers.push({
        offerId: row.offer_id,
        chainId: row.chain_id,
        lender: row.lender,
        collection: row.collection,
        principalWei: row.principal_wei,
        termInterestBps: row.term_interest_bps,
        feeBpsSnapshot: row.fee_bps_snapshot,
        durationSeconds: row.duration_seconds,
        expiresAt: row.expires_at,
        status: row.status,
        blockNumber: row.block_number,
        txHash: row.tx_hash,
        createdAt: row.indexed_at,
      });
    }
  }

  let filtered = allOffers;
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  filtered.sort((a, b) => b.offerId - a.offerId);

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? (startIndex + limit).toString() : null;

  return {
    offers: paginated,
    nextCursor,
    total: filtered.length,
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
  await syncOnChainLogs(targetChain);
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
    filtered = filtered.filter((a) => a.contractAddress.toLowerCase() === target);
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
  await syncOnChainLogs(targetChain);
  let totalPoolSize = 0n;
  let totalVolume = 0n;
  let activeLoansCount = 0;
  let totalOffersCount = 0;

  for (const offerRow of indexerStore.offers.values()) {
    if (offerRow.chain_id === targetChain) {
      totalOffersCount++;
      if (offerRow.status === 'open') {
        totalPoolSize += BigInt(offerRow.principal_wei);
      }
    }
  }

  for (const loanRow of indexerStore.loans.values()) {
    if (loanRow.chain_id === targetChain) {
      totalVolume += BigInt(loanRow.principal_wei);
      if (loanRow.status === 'active') {
        activeLoansCount++;
      }
    }
  }

  return {
    totalPoolSizeWei: totalPoolSize.toString(),
    totalActiveLoansCount: activeLoansCount,
    totalVolumeWei: totalVolume.toString(),
    totalOffersCount,
  };
}
