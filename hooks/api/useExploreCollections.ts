'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient';
import type { ExploreCollectionsResponse } from '@/types/api';

export interface UseExploreCollectionsOptions {
  chainId?: number;
  search?: string;
  hasOffers?: boolean;
  limit?: number;
  cursor?: string;
}

export function useExploreCollections(options: UseExploreCollectionsOptions = {}) {
  const queryClient = useSafeQueryClient();
  const { chainId, search, hasOffers, limit = 50, cursor } = options;

  const query = useQuery<{
    data: ExploreCollectionsResponse;
    indexedBlock: number | null;
  }>(
    {
      queryKey: ['explore-collections', chainId, search, hasOffers, limit, cursor],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (chainId) params.set('chainId', chainId.toString());
        if (search) params.set('search', search);
        if (hasOffers) params.set('hasOffers', 'true');
        if (limit) params.set('limit', limit.toString());
        if (cursor) params.set('cursor', cursor);

        const url = `/api/explore/collections?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch explore collections: HTTP ${res.status}`);
        }

        const rawBlock = res.headers.get('x-indexed-block');
        const indexedBlock = rawBlock ? parseInt(rawBlock, 10) : null;
        const data: ExploreCollectionsResponse = await res.json();

        return { data, indexedBlock };
      },
      staleTime: 15000,
      refetchInterval: 30000,
    },
    queryClient
  );

  return {
    data: query.data?.data,
    indexedBlock: query.data?.indexedBlock,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetch: query.refetch,
  };
}
