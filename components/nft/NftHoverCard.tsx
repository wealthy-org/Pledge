'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { NftImage } from './NftImage';
import { formatShortAddress } from '@/lib/services/collectionSafety';

export interface NftHoverCardProps {
  collection: string;
  tokenId: string;
  collectionName?: string;
  tokenName?: string;
  imageUrl?: string;
  statusText?: string;
  statusVariant?: 'active' | 'overdue' | 'repaid' | 'available';
  children: React.ReactNode;
  className?: string;
}

export function NftHoverCard({
  collection,
  tokenId,
  collectionName,
  tokenName,
  imageUrl,
  statusText,
  statusVariant = 'available',
  children,
  className = '',
}: NftHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  const statusColorClass =
    statusVariant === 'active'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : statusVariant === 'overdue'
      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
      : statusVariant === 'repaid'
      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
      : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      className={`relative inline-block ${className}`}
    >
      {children}

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] shadow-xl animate-in fade-in-0 zoom-in-95 duration-150 select-none pointer-events-auto"
        >
          <div className="space-y-2.5">
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-[var(--panel)] border border-[var(--line)]">
              <NftImage
                contractAddress={collection}
                tokenId={tokenId}
                src={imageUrl}
                alt={tokenName || `Token #${tokenId}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs text-[var(--text)] truncate">
                  {tokenName || `Token #${tokenId}`}
                </span>
                {statusText && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${statusColorClass}`}
                  >
                    {statusText}
                  </span>
                )}
              </div>

              <div className="text-[10px] text-[var(--muted)] font-mono truncate">
                {collectionName || formatShortAddress(collection)}
              </div>
            </div>

            <Link
              href={`/item/${collection}/${tokenId}`}
              className="w-full py-1.5 inline-flex items-center justify-center gap-1 text-center text-[10px] font-bold rounded-md bg-[var(--panel)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--text)] transition-colors"
            >
              <span>View Token Details</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
