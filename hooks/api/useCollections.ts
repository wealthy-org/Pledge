'use client';

import { useQuery } from '@tanstack/react-query';
import type { CollectionsResponse } from '@/types/api';

export function useCollections() {
  const query = useQuery<{
    data: CollectionsResponse;
    indexedBlock: number | null;
  }>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await fetch('/api/collections');
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
    staleTime: 15000,
    refetchInterval: 30000,
  });

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
