export type GondiTimeframe = 'DAY' | 'WEEK' | 'MONTH';

export interface GondiImage {
  id?: string | null;
  data?: string | null;
  accessTypeName?: string | null;
  contentTypeMime?: string | null;
  cacheUrl?: string | null;
}

export interface GondiContractData {
  contractAddress?: string | null;
}

export interface GondiCollectionSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  supply?: string | number | null;
  nftsCount?: number | null;
  contractData?: GondiContractData | null;
  image?: GondiImage | null;
}

export interface GondiMarketOverviewItem {
  salesCount?: number | null;
  salesVolume?: number | null;
  floorChangePercent?: number | null;
  loansCount?: number | null;
  usersCount?: number | null;
  collection: GondiCollectionSummary;
}

export interface GondiMarketOverviewData {
  top: GondiMarketOverviewItem[];
  volume?: GondiMarketOverviewItem[];
  movers?: GondiMarketOverviewItem[];
}

export interface GondiNftNode {
  id: string;
  tokenId: string;
  name?: string | null;
  description?: string | null;
  image?: GondiImage | null;
  collection: {
    id: string;
    name: string;
    slug: string;
    contractData?: GondiContractData | null;
  };
}

export interface GondiCollectionNode {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  supply?: string | number | null;
  contractData?: GondiContractData | null;
  image?: GondiImage | null;
}

export interface GondiLendingPulseData {
  asOf?: string | null;
  outstandingPrincipalUsd?: string | null;
  accruedTodayUsd?: string | null;
  accrualPerDayUsd?: string | null;
  paidInterest30dUsd?: string | null;
  newLoans24h?: number | null;
}

export interface GondiLoanNode {
  id: string;
  principalAmount: string;
  duration: string;
  startTime: string;
  status: string;
  nft?: {
    name?: string | null;
    tokenId?: string | null;
    image?: GondiImage | null;
    collection?: {
      name?: string | null;
    } | null;
  } | null;
}

export interface GondiGraphQLResponse<T> {
  data?: T | null;
  errors?: Array<{ message: string; locations?: unknown[] }> | null;
}
