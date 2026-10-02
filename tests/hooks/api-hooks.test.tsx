import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCollections } from '@/hooks/api/useCollections';
import { useOffers } from '@/hooks/api/useOffers';
import { useLoan } from '@/hooks/api/useLoans';
import { usePortfolio } from '@/hooks/api/usePortfolio';
import { useActivity } from '@/hooks/api/useActivity';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  function QueryWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return QueryWrapper;
}

describe('TICKET-42: Testnet API Data Fetching & Cache Invalidation Hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('TS-01: useCollections Hook', () => {
    it('fetches collections list and reads X-Indexed-Block header', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'x-indexed-block': '105' }),
        json: async () => ({
          collections: [
            {
              address: '0x1111111111111111111111111111111111111111',
              name: 'Robinhood Genesis Pass',
              symbol: 'RHG',
              floorPriceEth: '1.25',
              poolSizeWei: '3500000000000000000',
              offerCount: 2,
              activeLoansCount: 1,
            },
          ],
          total: 1,
        }),
      });

      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.collections.length).toBe(1);
      expect(result.current.data?.collections[0].symbol).toBe('RHG');
      expect(result.current.indexedBlock).toBe(105);
    });
  });

  describe('TS-02: useOffers Hook', () => {
    it('fetches open offers with collection parameter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          offers: [
            {
              offerId: 1,
              principalWei: '1500000000000000000',
              status: 'open',
            },
          ],
          total: 1,
        }),
      });

      const { result } = renderHook(
        () => useOffers({ collection: '0x1111111111111111111111111111111111111111' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.offers.length).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/offers?collection=0x1111111111111111111111111111111111111111')
      );
    });
  });

  describe('TS-03: useLoan & useLoans Hooks', () => {
    it('fetches single loan details by ID', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          loan: {
            loanId: 1,
            principalWei: '1000000000000000000',
            status: 'active',
          },
        }),
      });

      const { result } = renderHook(() => useLoan(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.loan.loanId).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/loans/1')
      );
    });
  });

  describe('TS-04: usePortfolio Hook', () => {
    it('fetches user portfolio and claimable proceeds balance', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          userAddress: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
          claimableWei: '520000000000000000',
          activeLoans: [],
          openOffers: [],
        }),
      });

      const { result } = renderHook(
        () => usePortfolio('0xfB5870428d00B1a18274737609825b74c8C12e2B'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.claimableWei).toBe('520000000000000000');
    });
  });

  describe('TS-05: useActivity Hook', () => {
    it('fetches on-chain activity event timeline', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          activity: [
            {
              id: 1,
              eventType: 'OfferCreated',
              txHash: '0xaaaaaaaa',
            },
          ],
          total: 1,
        }),
      });

      const { result } = renderHook(() => useActivity({ eventType: 'OfferCreated' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.activity.length).toBe(1);
      expect(result.current.data?.activity[0].eventType).toBe('OfferCreated');
    });
  });

  describe('TS-06: useInvalidateProtocolQueries Hook', () => {
    it('invalidates all protocol queries upon transaction settlement', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useInvalidateProtocolQueries(), { wrapper });

      await result.current.invalidateAll();
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['collections'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['offers'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['loans'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['portfolio'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['activity'] });
    });
  });

  describe('TS-07: Error Handling (Rule 11)', () => {
    it('throws explicit error with status code on HTTP failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Database connection failed', code: 'DB_ERROR' }),
      });

      const { result } = renderHook(() => useCollections(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toContain('Database connection failed');
    });
  });
});
