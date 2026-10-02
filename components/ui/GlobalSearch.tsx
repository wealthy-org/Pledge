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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Protocol"
        className="w-full max-w-xl bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--line)] gap-3 bg-[var(--panel)]">
          <span className="text-base text-[var(--muted)]">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search collections, loans, or addresses..."
            className="flex-1 bg-transparent border-none text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-hidden"
          />
          <kbd className="px-2 py-0.5 rounded bg-[var(--raised)] border border-[var(--line)] text-[10px] font-mono text-[var(--muted)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--line)]">
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
                  onClick={() => handleSelect(col)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'hover:bg-[var(--raised)] text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--raised)] border border-[var(--line)] flex items-center justify-center text-xs font-bold font-mono">
                      {col.symbol}
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

        <div className="px-4 py-2 bg-[var(--panel)] border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
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
