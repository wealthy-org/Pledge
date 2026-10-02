'use client';

import React, { useMemo } from 'react';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { OfferItem } from '@/types/api';

export interface CollectionOffersTableProps {
  offers: OfferItem[];
  onBorrow: (offer: OfferItem) => void;
  isLoading?: boolean;
}

export function CollectionOffersTable({
  offers,
  onBorrow,
  isLoading = false,
}: CollectionOffersTableProps) {
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
    return `${rate.toFixed(2)}% (annualized)`;
  };

  const formatExpiry = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-3">
        <Skeleton height="40px" borderRadius="8px" />
        <Skeleton height="48px" borderRadius="8px" />
        <Skeleton height="48px" borderRadius="8px" />
      </div>
    );
  }

  if (sortedOffers.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
        <EmptyState
          title="No Active Offers"
          description="There are currently no active liquidity offers for this collection. Be the first to create one!"
        />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--panel)] border-b border-[var(--line)] text-[9px] font-mono uppercase tracking-[1.5px] text-[var(--muted)]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Principal</th>
              <th className="py-3.5 px-4 font-semibold">Fixed Interest</th>
              <th className="py-3.5 px-4 font-semibold">APR Rate</th>
              <th className="py-3.5 px-4 font-semibold">Duration</th>
              <th className="py-3.5 px-4 font-semibold">Expires At</th>
              <th className="py-3.5 px-4 font-semibold">Lender</th>
              <th className="py-3.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line)]">
            {sortedOffers.map((offer, index) => {
              const isBestOffer = index === 0;
              const principalEth = `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`;
              const interestEth = `${calculateInterestEth(offer.principalWei, offer.termInterestBps)} ETH`;
              const days = Math.round(offer.durationSeconds / 86400);
              const aprDisplay = calculateApr(offer.termInterestBps, offer.durationSeconds);
              const lenderTruncated = `${offer.lender.slice(0, 6)}...${offer.lender.slice(-4)}`;
              const termPercent = (offer.termInterestBps / 100).toFixed(1);

              return (
                <tr
                  key={offer.offerId}
                  data-testid="collection-offer-row"
                  data-best-offer={isBestOffer ? 'true' : 'false'}
                  className={`transition-colors ${
                    isBestOffer
                      ? 'border-l-4 border-l-[var(--primary)] bg-[var(--primary-soft)] hover:bg-[#E8F3EE]'
                      : 'hover:bg-[#F0F7F7]'
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-sm text-[var(--text)]">
                    <div className="flex items-center gap-2">
                      <span>{principalEth}</span>
                      {isBestOffer && (
                        <Badge status="active" className="text-[9px] py-0 px-1.5">
                          Best
                        </Badge>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--text)]">
                    <div>{interestEth}</div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {termPercent}% for {days}d
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-[var(--primary)]">
                    {aprDisplay}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--text)]">
                    {days} Days
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    {formatExpiry(offer.expiresAt)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    <span title={offer.lender}>{lenderTruncated}</span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant={isBestOffer ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => onBorrow(offer)}
                    >
                      Borrow
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
