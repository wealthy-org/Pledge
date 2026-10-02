'use client';

import { useQuery } from '@tanstack/react-query';
import type { ActivityResponse } from '@/types/api';

export interface UseActivityParams {
  eventType?: string;
  collection?: string;
  cursor?: string;
}

export function useActivity(params?: UseActivityParams) {
  const query = useQuery<ActivityResponse>({
    queryKey: ['activity', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.eventType && params.eventType !== 'all') {
        searchParams.set('type', params.eventType);
      }
      if (params?.collection && params.collection !== 'all') {
        searchParams.set('collection', params.collection);
      }
      if (params?.cursor) {
        searchParams.set('cursor', params.cursor);
      }

      const qs = searchParams.toString();
      const url = qs ? `/api/activity?${qs}` : '/api/activity';

      const res = await fetch(url);
      if (!res.ok) {
        let errJson: { error?: string } = {};
        try {
          errJson = await res.json();
        } catch {}
        throw new Error(errJson.error || `Failed to fetch activity: HTTP ${res.status}`);
      }

      return res.json();
    },
    staleTime: 10000,
    refetchInterval: 15000,
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
