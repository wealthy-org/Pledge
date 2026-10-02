import { getCuratedCollections, getCollectionByAddress } from '@/config/collections';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { indexerStore } from '@/lib/indexer/store';
import { MOCK_OFFERS, MOCK_LOANS, MOCK_ACTIVITY } from '@/lib/mock/fixtures';
import {
  CollectionItemResponse,
  CollectionDetailResponse,
  CollectionStatsResponse,
  OffersListResponse,
  LoanDetailResponse,
  WalletLoansResponse,
  ActivityResponse,
  MarketStatsResponse,
  LoanItem,
} from '@/types/api';
import { OfferStatus, LoanStatus } from '@/types/database';

export async function getLastIndexedBlock(chainId = TESTNET_CHAIN_ID): Promise<number> {
  let highest = 120;
  for (const checkpoint of indexerStore.checkpoints.values()) {
    if (checkpoint.chain_id === chainId && checkpoint.last_block_number > highest) {
      highest = checkpoint.last_block_number;
    }
  }
  return highest;
}

export async function getCollectionStatsFromStore(
  collectionAddress: string,
  chainId = TESTNET_CHAIN_ID
): Promise<CollectionStatsResponse> {
  const target = collectionAddress.toLowerCase();
  const allOffers = [...MOCK_OFFERS];

  for (const offerRow of indexerStore.offers.values()) {
    if (offerRow.chain_id === chainId && !allOffers.some((o) => o.offerId === offerRow.offer_id)) {
      allOffers.push({
        offerId: offerRow.offer_id,
        chainId: offerRow.chain_id,
        lender: offerRow.lender,
        collection: offerRow.collection,
        principalWei: offerRow.principal_wei,
        termInterestBps: offerRow.term_interest_bps,
        feeBpsSnapshot: offerRow.fee_bps_snapshot,
        durationSeconds: offerRow.duration_seconds,
        expiresAt: offerRow.expires_at,
        status: offerRow.status,
        blockNumber: offerRow.block_number,
        txHash: offerRow.tx_hash,
        createdAt: offerRow.indexed_at,
      });
    }
  }

  const openOffers = allOffers.filter(
    (o) => o.collection.toLowerCase() === target && o.status === 'open'
  );

  let bestOfferBigInt = 0n;
  let poolSizeBigInt = 0n;

  for (const offer of openOffers) {
    const val = BigInt(offer.principalWei);
    poolSizeBigInt += val;
    if (val > bestOfferBigInt) {
      bestOfferBigInt = val;
    }
  }

  const allLoans = [...MOCK_LOANS];
  for (const loanRow of indexerStore.loans.values()) {
    if (loanRow.chain_id === chainId && !allLoans.some((l) => l.loanId === loanRow.loan_id)) {
      allLoans.push({
        loanId: loanRow.loan_id,
        offerId: loanRow.offer_id,
        chainId: loanRow.chain_id,
        lender: loanRow.lender,
        borrower: loanRow.borrower,
        collection: loanRow.collection,
        tokenId: loanRow.token_id,
        principalWei: loanRow.principal_wei,
        interestWei: loanRow.interest_wei,
        feeBpsSnapshot: loanRow.fee_bps_snapshot,
        startedAt: loanRow.started_at,
        dueAt: loanRow.due_at,
        status: loanRow.status,
        blockNumber: loanRow.block_number,
        txHash: loanRow.tx_hash,
      });
    }
  }

  const activeLoans = allLoans.filter(
    (l) => l.collection.toLowerCase() === target && l.status === 'active'
  );

  const lastBlock = await getLastIndexedBlock(chainId);

  return {
    bestOfferWei: bestOfferBigInt > 0n ? bestOfferBigInt.toString() : null,
    poolSizeWei: poolSizeBigInt.toString(),
    offerCount: openOffers.length,
    activeLoansCount: activeLoans.length,
    lastIndexedBlock: lastBlock,
  };
}

export async function fetchCollectionsWithStats(chainId = TESTNET_CHAIN_ID): Promise<CollectionItemResponse[]> {
  const collections = getCuratedCollections(chainId);

  const results: CollectionItemResponse[] = [];
  for (const col of collections) {
    const stats = await getCollectionStatsFromStore(col.contractAddress, chainId);
    results.push({
      address: col.contractAddress,
      name: col.name,
      symbol: col.symbol,
      imageUrl: col.imageUrl,
      description: col.description,
      floorPriceEth: col.floorPriceEth,
      bestOfferWei: stats.bestOfferWei,
      poolSizeWei: stats.poolSizeWei,
      offerCount: stats.offerCount,
      activeLoansCount: stats.activeLoansCount,
    });
  }

  return results;
}

export async function fetchCollectionDetail(
  address: string,
  chainId = TESTNET_CHAIN_ID
): Promise<CollectionDetailResponse | null> {
  const collection = getCollectionByAddress(address, chainId);
  if (!collection) return null;

  const stats = await getCollectionStatsFromStore(address, chainId);

  return {
    collection: {
      address: collection.contractAddress,
      name: collection.name,
      symbol: collection.symbol,
      imageUrl: collection.imageUrl,
      description: collection.description,
      floorPriceEth: collection.floorPriceEth,
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
  cursor?: string
): Promise<OffersListResponse> {
  const target = address.toLowerCase();
  const allOffers = [...MOCK_OFFERS];

  for (const offerRow of indexerStore.offers.values()) {
    if (!allOffers.some((o) => o.offerId === offerRow.offer_id)) {
      allOffers.push({
        offerId: offerRow.offer_id,
        chainId: offerRow.chain_id,
        lender: offerRow.lender,
        collection: offerRow.collection,
        principalWei: offerRow.principal_wei,
        termInterestBps: offerRow.term_interest_bps,
        feeBpsSnapshot: offerRow.fee_bps_snapshot,
        durationSeconds: offerRow.duration_seconds,
        expiresAt: offerRow.expires_at,
        status: offerRow.status,
        blockNumber: offerRow.block_number,
        txHash: offerRow.tx_hash,
        createdAt: offerRow.indexed_at,
      });
    }
  }

  let filtered = allOffers.filter((o) => o.collection.toLowerCase() === target);
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

export async function fetchLoanDetail(loanId: number, chainId = TESTNET_CHAIN_ID): Promise<LoanDetailResponse | null> {
  let loan: LoanItem | undefined = MOCK_LOANS.find((l) => l.loanId === loanId);

  if (!loan) {
    const fromStore = indexerStore.getLoan(chainId, loanId);
    if (fromStore) {
      loan = {
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
    }
  }

  if (!loan) return null;

  const collection = getCollectionByAddress(loan.collection, chainId);
  const totalRepayment = BigInt(loan.principalWei) + BigInt(loan.interestWei);

  return {
    loan: {
      ...loan,
      nftMetadata: {
        name: `${collection ? collection.name : 'NFT'} #${loan.tokenId}`,
        imageUrl: collection ? collection.imageUrl : '',
        collectionName: collection ? collection.name : 'Unknown Collection',
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
  cursor?: string
): Promise<WalletLoansResponse> {
  const target = address.toLowerCase();
  const allLoans = [...MOCK_LOANS];

  for (const loanRow of indexerStore.loans.values()) {
    if (!allLoans.some((l) => l.loanId === loanRow.loan_id)) {
      allLoans.push({
        loanId: loanRow.loan_id,
        offerId: loanRow.offer_id,
        chainId: loanRow.chain_id,
        lender: loanRow.lender,
        borrower: loanRow.borrower,
        collection: loanRow.collection,
        tokenId: loanRow.token_id,
        principalWei: loanRow.principal_wei,
        interestWei: loanRow.interest_wei,
        feeBpsSnapshot: loanRow.fee_bps_snapshot,
        startedAt: loanRow.started_at,
        dueAt: loanRow.due_at,
        status: loanRow.status,
        blockNumber: loanRow.block_number,
        txHash: loanRow.tx_hash,
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

export async function fetchActivityFeed(
  collection?: string,
  type?: string,
  limit = 20,
  cursor?: string
): Promise<ActivityResponse> {
  const allActivity = [...MOCK_ACTIVITY];

  for (const eventRow of indexerStore.events) {
    if (!allActivity.some((a) => a.id === eventRow.id)) {
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

  let filtered = [...allActivity];

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

export async function fetchMarketStats(): Promise<MarketStatsResponse> {
  let totalPoolSize = 0n;
  let totalVolume = 0n;

  for (const offer of MOCK_OFFERS) {
    if (offer.status === 'open') {
      totalPoolSize += BigInt(offer.principalWei);
    }
  }
  for (const offerRow of indexerStore.offers.values()) {
    if (offerRow.status === 'open') {
      totalPoolSize += BigInt(offerRow.principal_wei);
    }
  }

  for (const loan of MOCK_LOANS) {
    totalVolume += BigInt(loan.principalWei);
  }
  for (const loanRow of indexerStore.loans.values()) {
    totalVolume += BigInt(loanRow.principal_wei);
  }

  const activeLoansCount = MOCK_LOANS.filter((l) => l.status === 'active').length +
    Array.from(indexerStore.loans.values()).filter((l) => l.status === 'active').length;

  const totalOffersCount = MOCK_OFFERS.length + indexerStore.offers.size;

  return {
    totalPoolSizeWei: totalPoolSize.toString(),
    totalActiveLoansCount: activeLoansCount,
    totalVolumeWei: totalVolume.toString(),
    totalOffersCount,
  };
}
