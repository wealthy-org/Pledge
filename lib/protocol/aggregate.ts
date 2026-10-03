import { ProtocolSnapshot, RawContractOffer, RawContractLoan, CollectionAggregateStats, MarketAggregateStats } from './types';
import { OfferItem, LoanItem } from '@/types/api';
import { OfferStatus, LoanStatus } from '@/types/database';

export function computeCollectionStats(
  snapshot: ProtocolSnapshot,
  collectionAddress: string
): CollectionAggregateStats {
  const target = collectionAddress.toLowerCase();
  let bestOfferBigInt = 0n;
  let poolSizeBigInt = 0n;
  let openOfferCount = 0;
  let activeLoansCount = 0;
  let volumeBigInt = 0n;

  for (const offer of snapshot.offers) {
    if (offer.collection.toLowerCase() === target && offer.status === 'open' && !offer.isExpired) {
      const p = BigInt(offer.principalWei);
      poolSizeBigInt += p;
      openOfferCount++;
      if (p > bestOfferBigInt) {
        bestOfferBigInt = p;
      }
    }
  }

  for (const loan of snapshot.loans) {
    if (loan.collection.toLowerCase() === target) {
      volumeBigInt += BigInt(loan.principalWei);
      if (loan.status === 'active') {
        activeLoansCount++;
      }
    }
  }

  return {
    address: target,
    bestOfferWei: bestOfferBigInt > 0n ? bestOfferBigInt.toString() : null,
    poolSizeWei: poolSizeBigInt.toString(),
    offerCount: openOfferCount,
    activeLoansCount,
    volumeWei: volumeBigInt.toString(),
  };
}

export function computeMarketStats(snapshot: ProtocolSnapshot): MarketAggregateStats {
  let totalPoolSize = 0n;
  let totalVolume = 0n;
  let activeLoansCount = 0;
  let totalOffersCount = 0;

  for (const offer of snapshot.offers) {
    if (offer.status === 'open' && !offer.isExpired) {
      totalPoolSize += BigInt(offer.principalWei);
      totalOffersCount++;
    }
  }

  for (const loan of snapshot.loans) {
    totalVolume += BigInt(loan.principalWei);
    if (loan.status === 'active') {
      activeLoansCount++;
    }
  }

  return {
    totalPoolSizeWei: totalPoolSize.toString(),
    totalActiveLoansCount: activeLoansCount,
    totalVolumeWei: totalVolume.toString(),
    totalOffersCount,
  };
}

export function filterSnapshotOffers(
  snapshot: ProtocolSnapshot,
  params?: {
    collection?: string;
    lender?: string;
    status?: string;
    sort?: string;
  }
): OfferItem[] {
  let list: OfferItem[] = snapshot.offers.map((o) => ({
    offerId: o.offerId,
    chainId: snapshot.chainId,
    lender: o.lender,
    collection: o.collection,
    principalWei: o.principalWei,
    termInterestBps: o.termInterestBps,
    feeBpsSnapshot: o.feeBpsSnapshot,
    durationSeconds: o.durationSeconds,
    expiresAt: o.expiresAt,
    status: o.isExpired && o.status === 'open' ? ('expired' as OfferStatus) : o.status,
    blockNumber: snapshot.blockNumber,
    txHash: '',
    createdAt: o.expiresAt,
  }));

  if (params?.collection) {
    const target = params.collection.toLowerCase();
    list = list.filter((o) => o.collection.toLowerCase() === target);
  }

  if (params?.lender) {
    const target = params.lender.toLowerCase();
    list = list.filter((o) => o.lender.toLowerCase() === target);
  }

  if (params?.status) {
    list = list.filter((o) => o.status === params.status);
  }

  const sortParam = params?.sort || 'principal';
  list.sort((a, b) => {
    if (sortParam === 'principal') {
      const diff = BigInt(b.principalWei) - BigInt(a.principalWei);
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    }
    if (sortParam === 'interest') {
      return a.termInterestBps - b.termInterestBps;
    }
    if (sortParam === 'expiry') {
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    }
    return b.offerId - a.offerId;
  });

  return list;
}

export function filterSnapshotLoans(
  snapshot: ProtocolSnapshot,
  params?: {
    borrower?: string;
    lender?: string;
    collection?: string;
    status?: string;
  }
): LoanItem[] {
  let list: LoanItem[] = snapshot.loans.map((l) => ({
    loanId: l.loanId,
    offerId: l.offerId,
    chainId: snapshot.chainId,
    lender: l.lender,
    borrower: l.borrower,
    collection: l.collection,
    tokenId: l.tokenId,
    principalWei: l.principalWei,
    interestWei: l.interestWei,
    feeBpsSnapshot: l.feeBpsSnapshot,
    startedAt: l.startedAt,
    dueAt: l.dueAt,
    status: l.status,
    blockNumber: snapshot.blockNumber,
    txHash: '',
  }));

  if (params?.borrower) {
    const target = params.borrower.toLowerCase();
    list = list.filter((l) => l.borrower.toLowerCase() === target);
  }

  if (params?.lender) {
    const target = params.lender.toLowerCase();
    list = list.filter((l) => l.lender.toLowerCase() === target);
  }

  if (params?.collection) {
    const target = params.collection.toLowerCase();
    list = list.filter((l) => l.collection.toLowerCase() === target);
  }

  if (params?.status) {
    list = list.filter((l) => l.status === params.status);
  }

  list.sort((a, b) => b.loanId - a.loanId);
  return list;
}

export function getDistinctCollectionsFromSnapshot(snapshot: ProtocolSnapshot): string[] {
  const set = new Set<string>();
  for (const addr of snapshot.enabledCollections) {
    if (addr) set.add(addr.toLowerCase());
  }
  for (const offer of snapshot.offers) {
    if (offer.collection) set.add(offer.collection.toLowerCase());
  }
  for (const loan of snapshot.loans) {
    if (loan.collection) set.add(loan.collection.toLowerCase());
  }
  return Array.from(set);
}
