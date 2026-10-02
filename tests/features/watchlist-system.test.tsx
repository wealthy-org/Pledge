import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWatchlist } from '@/hooks/useWatchlist';

describe('TICKET-72: Watchlist System Hook Test Suite', () => {
  const testAddress1 = '0x1111111111111111111111111111111111111111';
  const testAddress2 = '0x2222222222222222222222222222222222222222';

  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty watchlist or stored values', () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.watchlist).toEqual([]);
    expect(result.current.isWatchlisted(testAddress1)).toBe(false);
  });

  it('toggles adding and removing address from watchlist and persists to localStorage', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.toggleWatchlist(testAddress1);
    });

    expect(result.current.isWatchlisted(testAddress1)).toBe(true);
    expect(JSON.parse(localStorage.getItem('pledge:watchlist') || '[]')).toContain(testAddress1);

    act(() => {
      result.current.toggleWatchlist(testAddress1);
    });

    expect(result.current.isWatchlisted(testAddress1)).toBe(false);
    expect(JSON.parse(localStorage.getItem('pledge:watchlist') || '[]')).toEqual([]);
  });

  it('supports multiple watchlisted collections', () => {
    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.toggleWatchlist(testAddress1);
      result.current.toggleWatchlist(testAddress2);
    });

    expect(result.current.isWatchlisted(testAddress1)).toBe(true);
    expect(result.current.isWatchlisted(testAddress2)).toBe(true);
    expect(result.current.watchlist.length).toBe(2);
  });
});
