export const protocolKeys = {
  all: ['protocol'] as const,
  collections: (chainId?: number) => ['protocol', 'collections', chainId] as const,
  collectionDetail: (chainId: number | undefined, address: string) => ['protocol', 'collection', chainId, address.toLowerCase()] as const,
  collectionStats: (chainId: number | undefined, address: string) => ['protocol', 'collection-stats', chainId, address.toLowerCase()] as const,
  offers: (chainId?: number, params?: Record<string, unknown>) => ['protocol', 'offers', chainId, params] as const,
  loans: (chainId?: number, params?: Record<string, unknown>) => ['protocol', 'loans', chainId, params] as const,
  marketStats: (chainId?: number) => ['protocol', 'market-stats', chainId] as const,
  portfolio: (address?: string) => ['protocol', 'portfolio', address?.toLowerCase()] as const,
  activity: (chainId?: number, params?: Record<string, unknown>) => ['protocol', 'activity', chainId, params] as const,
  eligibleNfts: (address?: string, chainId?: number) => ['protocol', 'eligible-nfts', address?.toLowerCase(), chainId] as const,
};
