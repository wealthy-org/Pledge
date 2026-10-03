import { OfferStatus, LoanStatus } from '@/types/database';

export interface RawContractOffer {
  offerId: number;
  lender: string;
  collection: string;
  principalWei: string;
  termInterestBps: number;
  durationSeconds: number;
  expiresAt: string;
  feeBpsSnapshot: number;
  status: OfferStatus;
  isExpired: boolean;
}

export interface RawContractLoan {
  loanId: number;
  offerId: number;
  lender: string;
  borrower: string;
  collection: string;
  tokenId: string;
  principalWei: string;
  interestWei: string;
  feeBpsSnapshot: number;
  startedAt: string;
  dueAt: string;
  status: LoanStatus;
  isOverdue: boolean;
}

export interface ProtocolSnapshot {
  chainId: number;
  contractAddress: string;
  blockNumber: number;
  protocolFeeBps: number;
  newActivityPaused: boolean;
  offers: RawContractOffer[];
  loans: RawContractLoan[];
  enabledCollections: string[];
  fetchedAt: number;
}

export interface CollectionAggregateStats {
  address: string;
  bestOfferWei: string | null;
  poolSizeWei: string;
  offerCount: number;
  activeLoansCount: number;
  volumeWei: string;
}

export interface MarketAggregateStats {
  totalPoolSizeWei: string;
  totalActiveLoansCount: number;
  totalVolumeWei: string;
  totalOffersCount: number;
}
