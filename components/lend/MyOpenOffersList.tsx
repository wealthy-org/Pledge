'use client';

import React, { useState, useMemo } from 'react';
import { formatUnits } from 'viem';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { getCollectionByAddress } from '@/config/collections';
import type { OfferItem } from '@/types/api';

const OFFERS_PAGE_SIZE = 6;

export interface MyOpenOffersListProps {
  offers: OfferItem[];
  onCancelOffer: (offerId: number) => void;
  isLoading?: boolean;
  chainId?: number;
  isConnected?: boolean;
  onConnect?: () => void;
}

export function MyOpenOffersList({
  offers,
  onCancelOffer,
  isLoading = false,
  chainId: propChainId,
  isConnected = true,
  onConnect,
}: MyOpenOffersListProps) {
  const hookChainId = useSafeChainId();
  const chainId = propChainId || hookChainId;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(offers.length / OFFERS_PAGE_SIZE);
  const paginatedOffers = useMemo(() => {
    return offers.slice((page - 1) * OFFERS_PAGE_SIZE, page * OFFERS_PAGE_SIZE);
  }, [offers, page]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-[var(--surface)] border border-[var(--line)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <svg className="w-4 h-4 text-[var(--muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Connect your wallet to view and manage your active lending offers.</span>
        </div>
        {onConnect && (
          <button
            type="button"
            onClick={onConnect}
            className="px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover-bg)] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Connect Wallet
          </button>
        )}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="py-3 px-3.5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)]/60 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted)]/50 shrink-0" />
          <span>No active open offers. Choose a collection below or click Create Offer to supply liquidity.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {paginatedOffers.map((offer) => {
          const colDef = getCollectionByAddress(offer.collection, chainId);

          const principalEth = `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`;
          const days = Math.round(offer.durationSeconds / 86400);
          const termRateDisplay = `${(offer.termInterestBps / 100).toFixed(1)}% · ${days}d`;
          const expiresDate = new Date(offer.expiresAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={offer.offerId}
              className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--line)] hover:border-[var(--line-strong)] transition-all flex flex-col justify-between gap-2 shadow-2xs group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Badge status="open">#{offer.offerId}</Badge>
                  <span
                    className="text-xs font-semibold text-[var(--text)] truncate max-w-[130px] sm:max-w-[150px]"
                    title={colDef?.name || 'Curated Collection'}
                  >
                    {colDef?.name || 'Curated Collection'}
                  </span>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancelOffer(offer.offerId)}
                  className="px-2 py-0.5 text-[11px] h-6.5 shrink-0"
                >
                  Cancel Offer
                </Button>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-[var(--line)] text-xs">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] uppercase font-mono text-[var(--muted)]">Principal</span>
                  <span className="text-xs font-bold font-mono text-[var(--primary)]">
                    {principalEth}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--panel)] border border-[var(--line)] text-[var(--text)]">
                    {termRateDisplay}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    Exp: {expiresDate}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={offers.length}
          pageSize={OFFERS_PAGE_SIZE}
          itemName="offers"
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

