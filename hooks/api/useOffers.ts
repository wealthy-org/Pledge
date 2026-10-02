'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient';
import type { OffersListResponse } from '@/types/api';

export interface UseOffersParams {
  collection?: string;
  lender?: string;
  status?: string;
}

export function useOffers(params?: UseOffersParams) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<OffersListResponse>(
    {
      queryKey: ['offers', params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params?.collection) searchParams.set('collection', params.collection);
        if (params?.lender) searchParams.set('lender', params.lender);
        if (params?.status) searchParams.set('status', params.status);

        const qs = searchParams.toString();
        const url = qs ? `/api/offers?${qs}` : '/api/offers';

        const res = await fetch(url);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch offers: HTTP ${res.status}`);
        }

        return res.json();
      },
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
