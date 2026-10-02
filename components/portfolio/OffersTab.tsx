'use client';

import React from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCollectionByAddress } from '@/config/collections';
import type { OfferItem } from '@/types/api';

export interface OffersTabProps {
  offers: OfferItem[];
  userAddress?: string;
  onCancelOffer: (offer: OfferItem) => void;
}

export function OffersTab({
  offers,
  userAddress,
  onCancelOffer,
}: OffersTabProps) {
  const normalizedUser = userAddress?.toLowerCase();

  const userOpenOffers = offers.filter((offer) => {
    if (!normalizedUser) return false;
    const isLender = offer.lender.toLowerCase() === normalizedUser;
    return isLender && offer.status === 'open';
  });

  const formatDate = (isoString: string) => {
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

  if (userOpenOffers.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <EmptyState
          title="No Open Offers"
          description="You currently have no active lending offers in the market."
        />
        <div className="flex justify-center mt-4">
          <Link href="/lend">
            <Button variant="primary" size="sm">
              Create Lending Offer
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--panel)] border-b border-[var(--line)] text-[9px] font-mono uppercase tracking-[1.5px] text-[var(--muted)]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Offer ID</th>
              <th className="py-3.5 px-4 font-semibold">Collection</th>
              <th className="py-3.5 px-4 font-semibold">Principal</th>
              <th className="py-3.5 px-4 font-semibold">Terms</th>
              <th className="py-3.5 px-4 font-semibold">Expires At</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line)]">
            {userOpenOffers.map((offer) => {
              const principalEth = `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`;
              const days = Math.round(offer.durationSeconds / 86400);
              const termPercent = (offer.termInterestBps / 100).toFixed(1);
              const colDef = getCollectionByAddress(offer.collection);
              const collectionName = colDef?.name || 'Curated Collection';

              return (
                <tr key={offer.offerId} className="hover:bg-[#F0F7F7] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    #{offer.offerId}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-[var(--text)]">
                    {collectionName}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--primary)]">
                    {principalEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--text)]">
                    {termPercent}% for {days}d
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    {formatDate(offer.expiresAt)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCancelOffer(offer)}
                    >
                      Cancel Offer
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
