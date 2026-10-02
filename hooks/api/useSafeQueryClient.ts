'use client';

import { useContext } from 'react';
import { QueryClient, QueryClientContext } from '@tanstack/react-query';

let globalFallbackClient: QueryClient | null = null;

export function useSafeQueryClient(): QueryClient {
  const contextClient = useContext(QueryClientContext);
  if (contextClient) {
    return contextClient;
  }
  if (!globalFallbackClient) {
    globalFallbackClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  }
  return globalFallbackClient;
}
