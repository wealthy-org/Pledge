'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import type { BorrowableNft } from './NFTGrid';
import type { OfferItem } from '@/types/api';

export interface BorrowReviewDrawerProps {
  isOpen: boolean;
  nft: BorrowableNft | null;
  offer: OfferItem | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BorrowReviewDrawer({
  isOpen,
  nft,
  offer,
  onClose,
  onConfirm,
  isLoading = false,
}: BorrowReviewDrawerProps) {
  const calculations = useMemo(() => {
    if (!offer) return null;

    const principalBigInt = BigInt(offer.principalWei);
    const interestBigInt = (principalBigInt * BigInt(offer.termInterestBps) + 9999n) / 10000n;
    const totalDueBigInt = principalBigInt + interestBigInt;
    const feeBigInt = (interestBigInt * BigInt(offer.feeBpsSnapshot)) / 10000n;

    const principalEth = Number(formatUnits(principalBigInt, 18)).toFixed(3);
    const interestEth = Number(formatUnits(interestBigInt, 18)).toFixed(3);
    const totalDueEth = Number(formatUnits(totalDueBigInt, 18)).toFixed(3);
    const protocolFeeEth = Number(formatUnits(feeBigInt, 18)).toFixed(4);

    const days = Math.round(offer.durationSeconds / 86400);
    const aprRate = ((offer.termInterestBps / 10000) * (365 / days) * 100).toFixed(2);

    const baseTimestamp = offer.createdAt ? new Date(offer.createdAt).getTime() : 1790900000000;
    const deadlineDate = new Date(baseTimestamp + offer.durationSeconds * 1000);
    const deadlineString = deadlineDate.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return {
      principalEth,
      interestEth,
      totalDueEth,
      protocolFeeEth,
      days,
      aprRate,
      deadlineString,
    };
  }, [offer]);

  if (!nft || !offer || !calculations) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Review Loan Terms"
      width="470px"
    >
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)] flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--raised)] border border-[var(--line)] shrink-0 relative">
            <Image
              src={nft.imageUrl}
              alt={nft.name}
              fill
              sizes="64px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-mono text-[var(--muted)] truncate">
              {nft.collectionName}
            </span>
            <span className="text-base font-bold text-[var(--text)] truncate">
              {nft.name}
            </span>
            <span className="text-[11px] font-mono text-[var(--primary)] font-semibold mt-0.5">
              Collateral Token #{nft.tokenId}
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
          <div className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--muted)]">
            Financial Terms Breakdown
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">ETH Received (Principal)</span>
              <span className="font-mono font-bold text-base text-[var(--text)]">
                {calculations.principalEth} ETH
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Fixed Term Interest</span>
              <span className="font-mono font-semibold text-[var(--text)]">
                {calculations.interestEth} ETH ({((offer.termInterestBps / 100)).toFixed(1)}% for {calculations.days}d)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">APR (annualized) — display only</span>
              <span className="font-mono font-medium text-[var(--primary)]">
                {calculations.aprRate}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Protocol Fee (deducted from interest)</span>
              <span className="font-mono text-[var(--muted)]">
                {calculations.protocolFeeEth} ETH
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
              <span className="font-semibold text-[var(--text)]">Total Repayment Due</span>
              <span className="font-mono font-extrabold text-base text-[var(--primary)]">
                {calculations.totalDueEth} ETH
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Repayment Deadline</span>
              <span className="font-mono font-semibold text-[var(--text)] text-right">
                {calculations.deadlineString}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs leading-relaxed">
          <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
            <span>⚠️</span>
            <span>Escrow & Foreclosure Disclaimer</span>
          </div>
          <p>
            NFT Anda akan dipindahkan ke smart contract selama pinjaman berlangsung. Anda tidak dapat mentransfer atau menjual NFT ini. Jika gagal melunasi sebelum deadline, lender berhak mengklaim NFT Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            loading={isLoading}
            className="flex-2"
          >
            Borrow {calculations.principalEth} ETH
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
