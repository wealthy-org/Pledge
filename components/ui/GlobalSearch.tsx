'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCuratedCollections, type ActiveCuratedCollection } from '@/config/collections';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';

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
  const chainId = useSafeChainId();

  const collections = getCuratedCollections(chainId);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pledge:recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
    }
  }, [isOpen]);

  const saveRecentSearch = (name: string) => {
    try {
      const filtered = recentSearches.filter((item) => item.toLowerCase() !== name.toLowerCase());
      const updated = [name, ...filtered].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('pledge:recent-searches', JSON.stringify(updated));
    } catch {
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('pledge:recent-searches');
  };

  const filteredCollections = collections.filter((col) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      col.name.toLowerCase().includes(q) ||
      col.symbol.toLowerCase().includes(q) ||
      col.contractAddress.toLowerCase().includes(q)
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

  const handleSelect = (col: ActiveCuratedCollection) => {
    saveRecentSearch(col.name);
    router.push(`/collection/${col.contractAddress}`);
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
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[10px] font-mono text-[var(--muted)]">
            ESC
          </kbd>
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
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--panel)] text-[var(--accent-primary)]'
                      : 'hover:bg-[var(--panel)] text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[var(--surface)] border border-[var(--line)] overflow-hidden flex items-center justify-center text-xs font-bold font-mono text-[var(--accent-primary)] shrink-0">
                      <Image
                        src={resolveCollectionImageUrl(col.name)}
                        alt={col.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{col.name}</div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5 font-mono">{col.symbol}</div>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-mono font-semibold">{col.symbol}</div>
                    <div className="text-[10px] text-[var(--muted)] font-mono">
                      {col.contractAddress.slice(0, 6)}...{col.contractAddress.slice(-4)}
                    </div>
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
          <span>Pledge Protocol Quick Jump</span>
        </div>
      </div>
    </div>
  );
}
