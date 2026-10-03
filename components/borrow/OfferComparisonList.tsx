'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { OfferItem } from '@/types/api';

export interface OfferComparisonListProps {
  offers: OfferItem[];
  collectionAddress?: string;
  onSelectOffer: (offer: OfferItem) => void;
  isLoading?: boolean;
}

export function OfferComparisonList({
  offers,
  collectionAddress,
  onSelectOffer,
  isLoading = false,
}: OfferComparisonListProps) {
  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      const valA = BigInt(a.principalWei);
      const valB = BigInt(b.principalWei);
      if (valA < valB) return 1;
      if (valA > valB) return -1;
      return 0;
    });
  }, [offers]);

  const calculateInterestEth = (principalWei: string, bps: number) => {
    const principal = BigInt(principalWei);
    const interest = (principal * BigInt(bps) + 9999n) / 10000n;
    return Number(formatUnits(interest, 18)).toFixed(3);
  };

  const calculateApr = (bps: number, durationSeconds: number) => {
    const days = durationSeconds / 86400 || 7;
    const rate = (bps / 10000) * (365 / days) * 100;
    return `${rate.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-[var(--surface)] border border-[var(--line)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (sortedOffers.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-center space-y-4">
        <EmptyState
          title="Belum ada penawaran untuk koleksi ini."
          description="Saat ini belum ada pemberi pinjaman (lender) yang memasang penawaran aktif untuk koleksi ini."
        />
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/explore">
            <Button variant="secondary" size="sm">
              Jelajahi Koleksi Lain
            </Button>
          </Link>
          {collectionAddress && (
            <Link href={`/lend?collection=${collectionAddress}`}>
              <Button variant="primary" size="sm">
                Buat Penawaran Likuiditas
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedOffers.map((offer, index) => {
        const isBestOffer = index === 0;
        const principalEth = `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`;
        const interestEth = `${calculateInterestEth(offer.principalWei, offer.termInterestBps)} ETH`;
        const days = Math.round(offer.durationSeconds / 86400);
        const aprFormatted = calculateApr(offer.termInterestBps, offer.durationSeconds);
        const termRateDisplay = `${(offer.termInterestBps / 100).toFixed(1)}% for ${days}d`;

        return (
          <div
            key={offer.offerId}
            data-testid="offer-row"
            data-best-offer={isBestOffer ? 'true' : 'false'}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isBestOffer
                ? 'bg-[var(--primary-soft)] border-[var(--primary)] shadow-[var(--shadow-subtle)] ring-1 ring-[var(--primary)]'
                : 'bg-[var(--panel)] border-[var(--line)] hover:border-[var(--line-strong)]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {isBestOffer && (
                <Badge status="active" className="hidden sm:inline-flex">
                  Best Offer
                </Badge>
              )}

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  Principal
                </span>
                <span className="text-base font-bold font-mono text-[var(--text)]">
                  {principalEth}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  Fixed Interest
                </span>
                <span className="text-xs font-semibold font-mono text-[var(--text)]">
                  {interestEth} <span className="text-[var(--muted)]">({termRateDisplay})</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  Duration
                </span>
                <span className="text-xs font-mono font-medium text-[var(--text)]">
                  {days} Days
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--muted)] block">
                  APR (Annualized)
                </span>
                <span className="text-xs font-mono font-medium text-[var(--primary)]">
                  {aprFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={isBestOffer ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onSelectOffer(offer)}
                className="w-full sm:w-auto"
              >
                Borrow this Offer
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
