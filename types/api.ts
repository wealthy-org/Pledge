import { OfferStatus, LoanStatus } from './database';

export interface ApiErrorResponse {
  error: string;
  code: string;
  status: number;
}

export interface CollectionItemResponse {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  description: string;
  floorPriceEth?: string;
  bestOfferWei: string | null;
  poolSizeWei: string;
  offerCount: number;
  activeLoansCount: number;
}

export interface CollectionsResponse {
  collections: CollectionItemResponse[];
  total: number;
}

export interface ExploreCollectionItem {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  totalSupply?: string;
  holdersCount?: number;
  floorPriceEth?: string;
  bestOfferWei: string | null;
  poolSizeWei: string;
  offerCount: number;
  activeLoansCount: number;
  isVerifiedErc721: boolean;
  isDuplicateName?: boolean;
}

export interface ExploreCollectionsResponse {
  collections: ExploreCollectionItem[];
  nextCursor: string | null;
  total: number;
}

export interface CollectionDetailResponse {
  collection: CollectionItemResponse;
  stats: CollectionStatsResponse;
}

export interface OfferItem {
  offerId: number;
  chainId: number;
  lender: string;
  collection: string;
  principalWei: string;
  termInterestBps: number;
  feeBpsSnapshot: number;
  durationSeconds: number;
  expiresAt: string;
  status: OfferStatus;
  blockNumber: number;
  txHash: string;
  createdAt: string;
}

export interface BestOfferResponse {
  bestOffer: OfferItem | null;
}

export interface OffersListResponse {
  offers: OfferItem[];
  nextCursor: string | null;
  total: number;
}

export interface CollectionStatsResponse {
  bestOfferWei: string | null;
  poolSizeWei: string;
  offerCount: number;
  activeLoansCount: number;
  lastIndexedBlock: number;
}

export interface WalletNftItem {
  contractAddress: string;
  tokenId: string;
  collectionName: string;
  name: string;
  imageUrl: string;
  tokenUri: string;
}

export interface WalletNftsResponse {
  nfts: WalletNftItem[];
  nextCursor: string | null;
  total: number;
}

export interface LoanItem {
  loanId: number;
  offerId: number;
  chainId: number;
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
  blockNumber: number;
  txHash: string;
}

export interface WalletLoansResponse {
  loans: LoanItem[];
  nextCursor: string | null;
  total: number;
}

export interface LoanDetailItem extends LoanItem {
  nftMetadata?: {
    name: string;
    imageUrl?: string;
    collectionName: string;
  };
  totalRepaymentWei: string;
}

export interface LoanDetailResponse {
  loan: LoanDetailItem;
}

export interface ActivityItem {
  id: number;
  eventType: string;
  contractAddress: string;
  blockNumber: number;
  txHash: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface ActivityResponse {
  activity: ActivityItem[];
  nextCursor: string | null;
  total: number;
}

export interface MarketStatsResponse {
  totalPoolSizeWei: string;
  totalActiveLoansCount: number;
  totalVolumeWei: string;
  totalOffersCount: number;
}
