'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient';
import type { WalletNftsResponse } from '@/types/api';

export function useEligibleNfts(address?: string | null, chainId?: number) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<WalletNftsResponse>(
    {
      queryKey: ['eligible-nfts', address, chainId],
      queryFn: async () => {
        if (!address) return { nfts: [], nextCursor: null, total: 0 };
        const url = chainId
          ? `/api/wallets/${address}/eligible-nfts?chainId=${chainId}`
          : `/api/wallets/${address}/eligible-nfts`;
        const res = await fetch(url);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch eligible NFTs: HTTP ${res.status}`);
        }
        return res.json();
      },
      enabled: Boolean(address),
      staleTime: 15000,
      refetchInterval: 30000,
    },
    queryClient
  );

  return {
    data: query.data,
    nfts: query.data?.nfts || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}
