'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections } from '@/hooks/api/useCollections';
import type { SearchResultItem } from '@/app/api/search/route';

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [apiResults, setApiResults] = useState<{
    collections: SearchResultItem[];
    wallets: SearchResultItem[];
    items: SearchResultItem[];
    results: SearchResultItem[];
  }>({
    collections: [],
    wallets: [],
    items: [],
    results: [],
  });
  const [dynamicExploreCollections, setDynamicExploreCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const chainId = useSafeChainId();
  const { data: localCollectionsData } = useCollections(chainId);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pledge:recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setApiResults({ collections: [], wallets: [], items: [], results: [] });
      setDynamicExploreCollections([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setApiResults({ collections: [], wallets: [], items: [], results: [] });
        setDynamicExploreCollections([]);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (chainId) params.set('chainId', chainId.toString());
        params.set('q', trimmed);

        const [searchRes, exploreRes] = await Promise.allSettled([
          fetch(`/api/search?${params.toString()}`),
          fetch(`/api/explore/collections?q=${encodeURIComponent(trimmed)}`),
        ]);

        if (!active) return;

        if (searchRes.status === 'fulfilled' && searchRes.value.ok) {
          const data = await searchRes.value.json();
          setApiResults({
            collections: data.collections || [],
            wallets: data.wallets || [],
            items: data.items || [],
            results: data.results || [],
          });
        }

        if (exploreRes.status === 'fulfilled' && exploreRes.value.ok) {
          const data = await exploreRes.value.json();
          if (Array.isArray(data.collections)) {
            setDynamicExploreCollections(data.collections);
          }
        }

        setSelectedIndex(0);
      } catch {
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 80);
    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [query, chainId]);

  const localCollections = useMemo(() => {
    const list = localCollectionsData?.collections || [];
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.symbol && c.symbol.toLowerCase().includes(q)) ||
        c.address.toLowerCase().includes(q)
    );
  }, [localCollectionsData, query]);

  const mergedCollections = useMemo(() => {
    const map = new Map<string, { id: string; title: string; subtitle: string; url: string; badge?: string; offerCount?: number; poolSizeWei?: string }>();

    for (const c of localCollections) {
      if (!c || !c.address) continue;
      map.set(c.address.toLowerCase(), {
        id: c.address.toLowerCase(),
        title: c.name,
        subtitle: `${c.symbol || 'NFT'} · ${c.address.slice(0, 6)}...${c.address.slice(-4)}`,
        url: `/collection/${c.address}`,
        badge: 'Curated',
        offerCount: c.offerCount,
        poolSizeWei: c.poolSizeWei,
      });
    }

    for (const c of dynamicExploreCollections) {
      if (!c || !c.address) continue;
      const existing = map.get(c.address.toLowerCase());
      map.set(c.address.toLowerCase(), {
        id: c.address.toLowerCase(),
        title: c.name,
        subtitle: `${c.symbol || 'NFT'} · ${c.address.slice(0, 6)}...${c.address.slice(-4)}`,
        url: `/collection/${c.address}`,
        badge: existing?.badge || 'Explore',
        offerCount: c.offerCount !== undefined ? c.offerCount : existing?.offerCount,
        poolSizeWei: c.poolSizeWei || existing?.poolSizeWei,
      });
    }

    for (const c of apiResults.collections) {
      if (!c || (!c.id && !c.url)) continue;
      const key = (c.id || c.url).toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          title: c.title,
          subtitle: c.subtitle,
          url: c.url,
          badge: c.badge || 'Verified',
        });
      }
    }

    return Array.from(map.values());
  }, [localCollections, dynamicExploreCollections, apiResults.collections]);

  const allDisplayItems = useMemo(() => {
    return [
      ...mergedCollections.map((c) => ({
        type: 'collection' as const,
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        url: c.url,
        badge: c.badge,
        offerCount: c.offerCount,
        poolSizeWei: c.poolSizeWei,
      })),
      ...apiResults.wallets,
      ...apiResults.items,
    ];
  }, [mergedCollections, apiResults.wallets, apiResults.items]);

  const handleSelect = (item: { url: string; title: string }) => {
    try {
      const updated = [item.title, ...recentSearches.filter((s) => s !== item.title)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('pledge:recent-searches', JSON.stringify(updated));
    } catch {}

    onClose();
    router.push(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allDisplayItems.length > 0 ? (prev + 1) % allDisplayItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allDisplayItems.length > 0 ? (prev - 1 + allDisplayItems.length) % allDisplayItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allDisplayItems[selectedIndex]) {
        handleSelect(allDisplayItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  let currentFlatCounter = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search protocol collections, loans, and addresses"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--line)] gap-3">
          <svg className="w-5 h-5 text-[var(--muted)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search collections, loans, or addresses..."
            className="flex-1 bg-transparent border-none text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none"
          />
          {isLoading && (
            <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--panel)] text-[var(--muted)] border border-[var(--line)]">
            ESC
          </kbd>
        </div>

        <div id="search-results-list" role="listbox" className="overflow-y-auto p-2 space-y-4 max-h-[60vh]">
          {query.trim() === '' && mergedCollections.length === 0 ? (
            <div className="p-3 space-y-3">
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] px-2">
                    <span>Recent Searches</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem('pledge:recent-searches');
                      }}
                      className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="px-2.5 py-1 rounded-md text-xs bg-[var(--panel)] hover:bg-[var(--line)] text-[var(--text)] transition-colors border border-[var(--line)]"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-center py-6 text-xs text-[var(--muted)]">
                Type a collection name, 0x wallet address, or token ID to search across the protocol.
              </div>
            </div>
          ) : allDisplayItems.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">
              No matching collections, wallets, or tokens found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-3">
              {mergedCollections.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 py-1">
                    Collections ({mergedCollections.length})
                  </div>
                  {mergedCollections.map((item) => {
                    const itemIndex = currentFlatCounter++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[var(--panel)] text-[var(--text)]' : 'text-[var(--text)] hover:bg-[var(--panel)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--accent-primary)]">
                            {item.title.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{item.title}</div>
                            <div className="text-[10px] text-[var(--muted)] font-mono truncate">{item.subtitle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.offerCount !== undefined && item.offerCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Offers Active ({item.offerCount})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)]">
                              {item.badge || 'Explore'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {apiResults.wallets.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 py-1">
                    Profiles & Wallets ({apiResults.wallets.length})
                  </div>
                  {apiResults.wallets.map((item) => {
                    const itemIndex = currentFlatCounter++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[var(--panel)] text-[var(--text)]' : 'text-[var(--text)] hover:bg-[var(--panel)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                            0x
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold font-mono truncate">{item.title}</div>
                            <div className="text-[10px] text-[var(--muted)] truncate">{item.subtitle}</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[var(--accent-primary)] font-semibold">
                          View Profile →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {apiResults.items.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 py-1">
                    NFT Items ({apiResults.items.length})
                  </div>
                  {apiResults.items.map((item) => {
                    const itemIndex = currentFlatCounter++;
                    const isSelected = selectedIndex === itemIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[var(--panel)] text-[var(--text)]' : 'text-[var(--text)] hover:bg-[var(--panel)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 text-xs font-bold">
                            #
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{item.title}</div>
                            <div className="text-[10px] text-[var(--muted)] truncate">{item.subtitle}</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[var(--lime)] font-semibold">
                          Item Details ↗
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-[var(--panel)]/40 border-t border-[var(--line)] text-[10px] text-[var(--muted)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Pledge Global Discovery</span>
        </div>
      </div>
    </div>
  );
}
