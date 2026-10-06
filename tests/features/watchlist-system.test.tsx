import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWatchlist } from '@/hooks/useWatchlist';

const mockOpenConnectModal = vi.fn();
let mockConnection = {
  address: '0x1234567890123456789012345678901234567890',
  isConnected: true,
};

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>().catch(() => ({}));
  return {
    ...actual,
    useConnection: () => mockConnection,
  };
});

vi.mock('@/contexts/ConnectModalContext', () => ({
  useConnectModal: () => ({
    openConnectModal: mockOpenConnectModal,
    closeConnectModal: vi.fn(),
    isConnectModalOpen: false,
  }),
}));

describe('TICKET-72 & TICKET-110: Watchlist System Hook Test Suite', () => {
  const testAddress1 = '0x1111111111111111111111111111111111111111';
  const testAddress2 = '0x2222222222222222222222222222222222222222';
  let serverWatchlist: string[] = [];

  beforeEach(() => {
    localStorage.clear();
    mockOpenConnectModal.mockClear();
    serverWatchlist = [];
    mockConnection = {
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    };
    global.fetch = vi.fn().mockImplementation((_url: string, options?: any) => {
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body as string);
        if (body.collection) {
          const norm = body.collection.toLowerCase();
          if (serverWatchlist.includes(norm)) {
            serverWatchlist = serverWatchlist.filter((c) => c !== norm);
          } else {
            serverWatchlist.push(norm);
          }
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ address: mockConnection.address, watchlist: serverWatchlist }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ address: mockConnection.address, watchlist: serverWatchlist }),
      });
    });
  });

  it('opens connect modal when toggling watchlist while disconnected', async () => {
    mockConnection = {
      address: undefined as unknown as string,
      isConnected: false,
    };

    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      result.current.toggleWatchlist(testAddress1);
    });

    expect(mockOpenConnectModal).toHaveBeenCalled();
    expect(result.current.isWatchlisted(testAddress1)).toBe(false);
  });

  it('initializes with empty watchlist or stored values when connected', async () => {
    let hookResult: any;
    await act(async () => {
      hookResult = renderHook(() => useWatchlist()).result;
    });
    expect(hookResult.current.watchlist).toEqual([]);
    expect(hookResult.current.isWatchlisted(testAddress1)).toBe(false);
  });

  it('toggles adding and removing address from watchlist and persists to localStorage', async () => {
    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      result.current.toggleWatchlist(testAddress1);
    });

    expect(result.current.isWatchlisted(testAddress1)).toBe(true);
    const key = `pledge:watchlist:${mockConnection.address.toLowerCase()}`;
    expect(JSON.parse(localStorage.getItem(key) || '[]')).toContain(testAddress1);

    await act(async () => {
      result.current.toggleWatchlist(testAddress1);
    });

    expect(result.current.isWatchlisted(testAddress1)).toBe(false);
    expect(JSON.parse(localStorage.getItem(key) || '[]')).toEqual([]);
  });

  it('supports multiple watchlisted collections', async () => {
    const { result } = renderHook(() => useWatchlist());

    await act(async () => {
      result.current.toggleWatchlist(testAddress1);
    });
    await act(async () => {
      result.current.toggleWatchlist(testAddress2);
    });

    expect(result.current.isWatchlisted(testAddress1)).toBe(true);
    expect(result.current.isWatchlisted(testAddress2)).toBe(true);
    expect(result.current.watchlist.length).toBe(2);
  });
});
