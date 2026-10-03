'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient';
import type { MarketStatsResponse } from '@/types/api';

export function useMarketStats(chainId?: number) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<MarketStatsResponse>(
    {
      queryKey: ['market-stats', chainId],
      queryFn: async () => {
        const url = chainId ? `/api/stats/market?chainId=${chainId}` : '/api/stats/market';
        const res = await fetch(url);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch market stats: HTTP ${res.status}`);
        }
        return res.json();
      },
      staleTime: 5000,
      refetchInterval: 10000,
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
