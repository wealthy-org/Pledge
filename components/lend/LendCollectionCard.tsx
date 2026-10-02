'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { CuratedCollectionDefinition } from '@/config/collections';

export interface LendCollectionCardProps {
  collection: CuratedCollectionDefinition;
  poolSizeEth?: string;
  activeLoansCount?: number;
  onMakeOffer: (collection: CuratedCollectionDefinition) => void;
}

export function LendCollectionCard({
  collection,
  poolSizeEth = '0.00',
  activeLoansCount = 0,
  onMakeOffer,
}: LendCollectionCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col justify-between hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-raised)] transition-all">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--raised)] border border-[var(--line)] shrink-0 relative">
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                {collection.symbol}
              </span>
              <span className="text-[11px] text-[var(--muted)]">{collection.category}</span>
            </div>
            <h3 className="text-base font-bold text-[var(--text)] mt-1 truncate">
              {collection.name}
            </h3>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
          {collection.description}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--line)] text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase text-[var(--muted)] block">
              Floor Price
            </span>
            <span className="font-mono font-bold text-[var(--text)]">
              {collection.floorPriceEth} ETH
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-[var(--muted)] block">
              Pool Liquidity
            </span>
            <span className="font-mono font-bold text-[var(--primary)]">
              {poolSizeEth} ETH
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-[var(--muted)] block">
              Active Loans
            </span>
            <span className="font-mono font-semibold text-[var(--text)]">
              {activeLoansCount}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[var(--surface)] border-t border-[var(--line)]">
        <Button
          variant="primary"
          onClick={() => onMakeOffer(collection)}
          className="w-full"
        >
          Make Offer
        </Button>
      </div>
    </Card>
  );
}
