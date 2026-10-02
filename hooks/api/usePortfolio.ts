'use client';

import { useQuery } from '@tanstack/react-query';
import type { LoanItem, OfferItem } from '@/types/api';

export interface PortfolioDataResponse {
  userAddress: string;
  claimableWei: string;
  activeLoans: LoanItem[];
  openOffers: OfferItem[];
}

export function usePortfolio(userAddress?: string | null) {
  const query = useQuery<PortfolioDataResponse>({
    queryKey: ['portfolio', userAddress],
    queryFn: async () => {
      if (!userAddress) throw new Error('User address is required');
      const res = await fetch(`/api/portfolio/${userAddress}`);
      if (!res.ok) {
        let errJson: { error?: string } = {};
        try {
          errJson = await res.json();
        } catch {}
        throw new Error(errJson.error || `Failed to fetch portfolio: HTTP ${res.status}`);
      }

      return res.json();
    },
    enabled: Boolean(userAddress),
    staleTime: 10000,
    refetchInterval: 20000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}
