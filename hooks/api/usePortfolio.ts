'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient';
import type { LoanItem, OfferItem } from '@/types/api';

export interface PortfolioDataResponse {
  address?: string;
  userAddress?: string;
  borrowedLoans?: LoanItem[];
  lentLoans?: LoanItem[];
  activeOffers?: OfferItem[];
  openOffers?: OfferItem[];
  activeLoans?: LoanItem[];
  totalBorrowedWei?: string;
  totalLentWei?: string;
  claimableProceedsWei?: string;
  claimableWei?: string;
}

export function usePortfolio(userAddress?: string | null) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<PortfolioDataResponse>(
    {
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
    },
    queryClient
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}
