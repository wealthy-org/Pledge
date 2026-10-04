import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOffers } from '@/hooks/api/useOffers';
import { useLoans } from '@/hooks/api/useLoans';
import { WalletCacheSync } from '@/components/web3/WalletCacheSync';

let mockConnectionAddress: string | undefined = undefined;
let mockIsConnected = false;

vi.mock('wagmi', () => ({
  useConnection: () => ({
    address: mockConnectionAddress,
    isConnected: mockIsConnected,
    chainId: 46630,
  }),
}));

describe('Wallet Scoped Queries & Cache Sync', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('useOffers does not execute network fetch when enabled is false', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useOffers({ lender: undefined, enabled: false }),
      { wrapper }
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('useLoans does not execute network fetch when enabled is false', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLoans({ borrower: undefined, enabled: false }),
      { wrapper }
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('WalletCacheSync cleans up wallet-scoped cached queries on disconnect', async () => {
    queryClient.setQueryData(['portfolio', '0x1234'], { borrowedLoans: [] });
    queryClient.setQueryData(['eligible-nfts', '0x1234', 46630], { nfts: [] });
    queryClient.setQueryData(['offers', { lender: '0x1234' }], { offers: [] });
    queryClient.setQueryData(['offers', { collection: '0xabc' }], { offers: [] });

    mockConnectionAddress = '0x1234';
    mockIsConnected = true;

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <WalletCacheSync />
      </QueryClientProvider>
    );

    expect(queryClient.getQueryData(['portfolio', '0x1234'])).toBeDefined();
    expect(queryClient.getQueryData(['eligible-nfts', '0x1234', 46630])).toBeDefined();
    expect(queryClient.getQueryData(['offers', { lender: '0x1234' }])).toBeDefined();
    expect(queryClient.getQueryData(['offers', { collection: '0xabc' }])).toBeDefined();

    mockConnectionAddress = undefined;
    mockIsConnected = false;

    rerender(
      <QueryClientProvider client={queryClient}>
        <WalletCacheSync />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(queryClient.getQueryData(['portfolio', '0x1234'])).toBeUndefined();
      expect(queryClient.getQueryData(['eligible-nfts', '0x1234', 46630])).toBeUndefined();
      expect(queryClient.getQueryData(['offers', { lender: '0x1234' }])).toBeUndefined();
      expect(queryClient.getQueryData(['offers', { collection: '0xabc' }])).toBeDefined();
    });
  });

  it('WalletCacheSync cleans up wallet-scoped cached queries when switching accounts', async () => {
    queryClient.setQueryData(['portfolio', '0x1111'], { borrowedLoans: [] });
    queryClient.setQueryData(['eligible-nfts', '0x1111', 46630], { nfts: [] });

    mockConnectionAddress = '0x1111';
    mockIsConnected = true;

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <WalletCacheSync />
      </QueryClientProvider>
    );

    mockConnectionAddress = '0x2222';
    mockIsConnected = true;

    rerender(
      <QueryClientProvider client={queryClient}>
        <WalletCacheSync />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(queryClient.getQueryData(['portfolio', '0x1111'])).toBeUndefined();
      expect(queryClient.getQueryData(['eligible-nfts', '0x1111', 46630])).toBeUndefined();
    });
  });
});
