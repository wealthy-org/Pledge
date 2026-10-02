'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pledge:watchlist';

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const toggleWatchlist = useCallback((address: string) => {
    setWatchlist((prev) => {
      const normalized = address.toLowerCase();
      const exists = prev.some((a) => a.toLowerCase() === normalized);
      const updated = exists
        ? prev.filter((a) => a.toLowerCase() !== normalized)
        : [...prev, address];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const isWatchlisted = useCallback(
    (address: string) => {
      const normalized = address.toLowerCase();
      return watchlist.some((a) => a.toLowerCase() === normalized);
    },
    [watchlist]
  );

  return { watchlist, toggleWatchlist, isWatchlisted };
}
