'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CURATED_COLLECTIONS, type CuratedCollectionDefinition } from '@/config/collections';

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pledge:recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  const saveRecentSearch = (name: string) => {
    try {
      const filtered = recentSearches.filter((item) => item.toLowerCase() !== name.toLowerCase());
      const updated = [name, ...filtered].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('pledge:recent-searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('pledge:recent-searches');
  };

  const filteredCollections = CURATED_COLLECTIONS.filter((col) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      col.name.toLowerCase().includes(q) ||
      col.symbol.toLowerCase().includes(q) ||
      col.category.toLowerCase().includes(q) ||
      Object.values(col.addresses).some((addr) => addr.toLowerCase().includes(q))
    );
  });

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

  const handleSelect = (col: CuratedCollectionDefinition) => {
    saveRecentSearch(col.name);
    router.push(`/collection/${col.id}`);
    handleClose();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCollections.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCollections.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCollections[selectedIndex]) {
        handleSelect(filteredCollections[selectedIndex]);
      }
    }
  };

  const activeOptionId = filteredCollections[selectedIndex] ? `search-option-${filteredCollections[selectedIndex].id}` : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Protocol"
        className="w-full max-w-xl bg-white dark:bg-[#111a17] border border-[#e6ece9] dark:border-[#1e332c] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-[#e6ece9] dark:border-[#1e332c] gap-3 bg-[#f8faf9] dark:bg-[#14221e]">
          <span className="text-base text-[var(--muted)]">🔍</span>
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
            className="flex-1 bg-transparent border-none text-sm text-[#142d2b] dark:text-[#f0f6fc] placeholder-[var(--muted)] focus:outline-hidden"
          />
          <kbd className="px-2 py-0.5 rounded bg-white dark:bg-[#192b25] border border-[#e6ece9] dark:border-[#1e332c] text-[10px] font-mono text-[var(--muted)] shadow-xs">
            ESC
          </kbd>
        </div>

        {recentSearches.length > 0 && !query && (
          <div className="px-4 py-2 bg-[#f4f7f5] dark:bg-[#14221e] border-b border-[#e6ece9] dark:border-[#1e332c] flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-[var(--muted)]">
              <span className="font-semibold uppercase tracking-wider text-[9px]">Recent:</span>
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#192b25] border border-[#dee7e3] dark:border-[#1e332c] text-[#214e3b] dark:text-emerald-400 hover:border-emerald-500 transition-colors shrink-0"
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

        <div id="search-results-list" role="listbox" className="max-h-80 overflow-y-auto p-2 divide-y divide-[#e6ece9] dark:divide-[#1e332c]">
          {filteredCollections.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">
              No matching collections found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCollections.map((col, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={col.id}
                  id={`search-option-${col.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(col)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#edf7f2] dark:bg-[#16382b] text-[#214e3b] dark:text-emerald-300'
                      : 'hover:bg-[#f4f7f5] dark:hover:bg-[#192b25] text-[#142d2b] dark:text-[#f0f6fc]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f4f7f5] dark:bg-[#192b25] border border-[#dee7e3] dark:border-[#1e332c] flex items-center justify-center text-xs font-bold font-mono text-[#214e3b] dark:text-emerald-400">
                      {col.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{col.name}</div>
                      <div className="text-[11px] text-[var(--muted)] mt-0.5">{col.category}</div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-mono font-bold">{col.floorPriceEth} ETH</div>
                    <div className="text-[10px] text-[var(--muted)] font-mono">
                      Max {(col.maxLtvBps / 100).toFixed(0)}% LTV
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-[#f8faf9] dark:bg-[#14221e] border-t border-[#e6ece9] dark:border-[#1e332c] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>Pledge Protocol Quick Jump</span>
        </div>
      </div>
    </div>
  );
}
