'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCollections } from '@/hooks/api/useCollections';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { getCuratedCollections } from '@/config/collections';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import type { CollectionItemResponse } from '@/types/api';

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [apiResults, setApiResults] = useState<CollectionItemResponse[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const chainId = useSafeChainId();
  const { data: curatedData } = useCollections(chainId);

  const fallbackCollections: CollectionItemResponse[] = useMemo(() => {
    const raw = getCuratedCollections(chainId);
    return raw.map((c) => ({
      address: c.contractAddress,
      name: c.name,
      symbol: c.symbol,
      imageUrl: resolveCollectionImageUrl(c.name),
      description: `${c.name} on Robinhood Chain`,
      bestOfferWei: null,
      activeLoansCount: 0,
      offerCount: 0,
      poolSizeWei: '0',
    }));
  }, [chainId]);

  const displayCollections = useMemo(() => {
    const baseList = curatedData?.collections && curatedData.collections.length > 0
      ? curatedData.collections
      : fallbackCollections;

    const mergedMap = new Map<string, CollectionItemResponse>();
    for (const item of baseList) {
      mergedMap.set(item.address.toLowerCase(), item);
    }
    if (apiResults) {
      for (const item of apiResults) {
        const existing = mergedMap.get(item.address.toLowerCase());
        mergedMap.set(item.address.toLowerCase(), existing ? { ...existing, ...item } : item);
      }
    }

    const merged = Array.from(mergedMap.values());
    const q = query.toLowerCase().trim();
    if (!q) return merged;
    return merged.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [curatedData, fallbackCollections, apiResults, query]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pledge:recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (chainId) params.set('chainId', chainId.toString());
        if (query.trim()) params.set('search', query.trim());
        params.set('limit', '20');

        const res = await fetch(`/api/explore/collections?${params.toString()}`);
        if (res.ok && active) {
          const data = await res.json();
          if (data.collections) {
            setApiResults(data.collections);
          }
        }
      } catch {
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchResults();
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, chainId]);

  const saveRecentSearch = (name: string) => {
    try {
      const filtered = recentSearches.filter((item) => item.toLowerCase() !== name.toLowerCase());
      const updated = [name, ...filtered].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('pledge:recent-searches', JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('pledge:recent-searches');
  };

  const handleClose = () => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!isOpen) return null;

  const handleSelect = (col: CollectionItemResponse) => {
    saveRecentSearch(col.name);
    router.push(`/collection/${col.address}`);
    handleClose();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < displayCollections.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : displayCollections.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayCollections[selectedIndex]) {
        handleSelect(displayCollections[selectedIndex]);
      }
    }
  };

  const activeOptionId = displayCollections[selectedIndex] ? `search-option-${displayCollections[selectedIndex].address}` : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Protocol"
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--line)] gap-3 bg-[var(--panel)]">
          <svg className="w-4 h-4 text-[var(--muted)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={activeOptionId}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search collections, loans, or addresses..."
            className="flex-1 bg-transparent border-none text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-hidden"
          />
          {isLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[10px] font-mono text-[var(--muted)]">
              ESC
            </kbd>
          )}
        </div>

        {recentSearches.length > 0 && !query && (
          <div className="px-4 py-2 bg-[var(--panel)] border-b border-[var(--line)] flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-[var(--muted)]">
              <span className="font-semibold uppercase tracking-wider text-[9px]">Recent:</span>
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--line)] text-[var(--accent-primary)] hover:border-[var(--line-strong)] transition-colors shrink-0"
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-[10px] text-[var(--muted)] hover:text-red-500 transition-colors ml-2 shrink-0"
            >
              Clear
            </button>
          </div>
        )}

        <div id="search-results-list" role="listbox" className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--line)]">
          {displayCollections.length === 0 && !isLoading ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">
              No collections found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            displayCollections.map((col, idx) => {
              const isSelected = idx === selectedIndex;
              const hasOffers = (col.offerCount || 0) > 0;
              const displayImage = col.imageUrl || resolveCollectionImageUrl(col.name);

              return (
                <div
                  key={col.address}
                  id={`search-option-${col.address}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(col)}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--panel)] text-[var(--accent-primary)]'
                      : 'hover:bg-[var(--panel)] text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[var(--surface)] border border-[var(--line)] overflow-hidden flex items-center justify-center text-xs font-bold font-mono text-[var(--accent-primary)] shrink-0">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={col.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        col.symbol.slice(0, 2)
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                        <span>{col.name}</span>
                        <span className="text-[10px] text-[var(--muted)] font-mono">({col.symbol})</span>
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5 font-mono">
                        {formatShortAddress(col.address)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasOffers ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Offers Active ({col.offerCount})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--surface)] text-[var(--muted)] border border-[var(--line)]">
                        Explore
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between text-[10px] text-[var(--muted)] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>Pledge Open Discovery</span>
        </div>
      </div>
    </div>
  );
}
