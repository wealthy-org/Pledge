'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from 'wagmi';
import { useConnectModal } from '@/contexts/ConnectModalContext';

const STORAGE_PREFIX = 'pledge:watchlist';
const SYNC_EVENT = 'pledge:watchlist-updated';

export function useWatchlist() {
  const { address, isConnected } = useConnection();
  const { openConnectModal } = useConnectModal();
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const walletKey = address ? `${STORAGE_PREFIX}:${address.toLowerCase()}` : STORAGE_PREFIX;

  useEffect(() => {
    let active = true;
    try {
      const stored = localStorage.getItem(walletKey) || (address ? localStorage.getItem(STORAGE_PREFIX) : null);
      if (stored) {
        setWatchlist(JSON.parse(stored));
      } else {
        setWatchlist([]);
      }
    } catch {}

    const handleCrossComponentSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ address?: string; watchlist?: string[] }>;
      if (customEvent.detail?.watchlist && Array.isArray(customEvent.detail.watchlist)) {
        if (!customEvent.detail.address || !address || customEvent.detail.address.toLowerCase() === address.toLowerCase()) {
          setWatchlist(customEvent.detail.watchlist);
        }
      }
    };

    window.addEventListener(SYNC_EVENT, handleCrossComponentSync);

    if (address && isConnected) {
      fetch(`/api/wallets/${address.toLowerCase()}/watchlist`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch watchlist');
          return res.json();
        })
        .then((data) => {
          if (active && data?.watchlist && Array.isArray(data.watchlist)) {
            setWatchlist(data.watchlist);
            try {
              localStorage.setItem(walletKey, JSON.stringify(data.watchlist));
            } catch {}
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
      window.removeEventListener(SYNC_EVENT, handleCrossComponentSync);
    };
  }, [address, isConnected, walletKey]);

  const toggleWatchlist = useCallback(
    (collectionAddress: string) => {
      if (!isConnected || !address) {
        openConnectModal?.();
        return;
      }

      const normalized = collectionAddress.toLowerCase();
      setWatchlist((prev) => {
        const exists = prev.some((a) => a.toLowerCase() === normalized);
        const updated = exists
          ? prev.filter((a) => a.toLowerCase() !== normalized)
          : [...prev, collectionAddress];

        try {
          localStorage.setItem(walletKey, JSON.stringify(updated));
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(SYNC_EVENT, {
              detail: { address, watchlist: updated },
            })
          );
        }

        fetch(`/api/wallets/${address.toLowerCase()}/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection: collectionAddress }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.watchlist && Array.isArray(data.watchlist)) {
              setWatchlist(data.watchlist);
              try {
                localStorage.setItem(walletKey, JSON.stringify(data.watchlist));
              } catch {}
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent(SYNC_EVENT, {
                    detail: { address, watchlist: data.watchlist },
                  })
                );
              }
            }
          })
          .catch(() => {});

        return updated;
      });
    },
    [address, isConnected, openConnectModal, walletKey]
  );

  const isWatchlisted = useCallback(
    (collectionAddress: string) => {
      if (!collectionAddress) return false;
      const normalized = collectionAddress.toLowerCase();
      return watchlist.some((a) => a.toLowerCase() === normalized);
    },
    [watchlist]
  );

  return { watchlist, toggleWatchlist, isWatchlisted, isConnected };
}
