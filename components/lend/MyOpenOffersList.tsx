'use client';

import React from 'react';
import { formatUnits } from 'viem';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { getCollectionByAddress } from '@/config/collections';
import type { OfferItem } from '@/types/api';

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
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-[var(--surface)] border border-[var(--line)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-center space-y-4">
        <div className="max-w-md mx-auto space-y-2">
          <h4 className="text-sm font-bold text-[var(--text)]">Connect wallet to view your offers</h4>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Your committed lending capital in escrow and active borrower offers are tied to your Web3 wallet address.
          </p>
        </div>
        {onConnect && (
          <button
            type="button"
            onClick={onConnect}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Connect Wallet
          </button>
        )}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <EmptyState
          title="No Open Offers"
          description="You do not have any active liquidity offers currently waiting for borrowers. Select a collection above to create a new lending offer."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const colDef = getCollectionByAddress(offer.collection, chainId);

        const principalEth = `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`;
        const days = Math.round(offer.durationSeconds / 86400);
        const termRateDisplay = `${(offer.termInterestBps / 100).toFixed(1)}% for ${days}d`;
        const expiresDate = new Date(offer.expiresAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return (
          <div
            key={offer.offerId}
            className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] hover:border-[var(--line-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Badge status="open">Offer #{offer.offerId}</Badge>

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  Collection
                </span>
                <span className="text-sm font-bold text-[var(--text)]">
                  {colDef?.name || 'Curated Collection'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  Principal
                </span>
                <span className="text-base font-bold font-mono text-[var(--primary)]">
                  {principalEth}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  Fixed Term Return
                </span>
                <span className="text-xs font-semibold font-mono text-[var(--text)]">
                  {termRateDisplay}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  Expires On
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {expiresDate}
                </span>
              </div>
            </div>

            <div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onCancelOffer(offer.offerId)}
                className="w-full sm:w-auto"
              >
                Cancel Offer
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
