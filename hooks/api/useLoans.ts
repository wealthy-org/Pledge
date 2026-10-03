'use client';

import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient';
import type { WalletLoansResponse, LoanDetailResponse } from '@/types/api';

export interface UseLoansParams {
  collection?: string;
  borrower?: string;
  lender?: string;
  status?: string;
  chainId?: number;
}

export function useLoans(params?: UseLoansParams) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<WalletLoansResponse>(
    {
      queryKey: ['loans', params],
      queryFn: async () => {
        const searchParams = new URLSearchParams();
        if (params?.collection) searchParams.set('collection', params.collection);
        if (params?.borrower) searchParams.set('borrower', params.borrower);
        if (params?.lender) searchParams.set('lender', params.lender);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.chainId) searchParams.set('chainId', params.chainId.toString());

        const qs = searchParams.toString();
        const url = qs ? `/api/loans?${qs}` : '/api/loans';

        const res = await fetch(url);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch loans: HTTP ${res.status}`);
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

export function useLoan(id: number | string | null | undefined) {
  const queryClient = useSafeQueryClient();

  const query = useQuery<LoanDetailResponse>(
    {
      queryKey: ['loans', id],
      queryFn: async () => {
        if (!id) throw new Error('Loan ID is required');
        const res = await fetch(`/api/loans/${id}`);
        if (!res.ok) {
          let errJson: { error?: string } = {};
          try {
            errJson = await res.json();
          } catch {}
          throw new Error(errJson.error || `Failed to fetch loan details: HTTP ${res.status}`);
        }

        return res.json();
      },
      enabled: Boolean(id),
      staleTime: 10000,
      refetchInterval: 15000,
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
