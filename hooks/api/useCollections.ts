'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient';
import type { CollectionsResponse } from '@/types/api';

export function useCollections(chainId?: number) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<{
    data: CollectionsResponse;
    indexedBlock: number | null;
  }>(
    {
      queryKey: ['collections', chainId],
      queryFn: async () => {
        const url = chainId ? `/api/collections?chainId=${chainId}` : '/api/collections';
        const res = await fetch(url);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch collections: HTTP ${res.status}`);
        }

        const rawBlock = res.headers.get('x-indexed-block');
        const indexedBlock = rawBlock ? parseInt(rawBlock, 10) : null;
        const data: CollectionsResponse = await res.json();

        return { data, indexedBlock };
      },
      staleTime: 5000,
      refetchInterval: 10000,
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

export function useCollection(address?: string, chainId?: number) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<{
    collection: CollectionsResponse['collections'][0];
    stats: unknown;
  }>(
    {
      queryKey: ['collection', address?.toLowerCase(), chainId],
      queryFn: async () => {
        if (!address) return null;
        const url = chainId
          ? `/api/collections/${address}?chainId=${chainId}`
          : `/api/collections/${address}`;
        const res = await fetch(url);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch collection: HTTP ${res.status}`);
        }
        return res.json();
      },
      enabled: Boolean(address),
      staleTime: 5000,
      refetchInterval: 10000,
    },
    queryClient
  );

  return {
    data: query.data?.collection,
    stats: query.data?.stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
