'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

export interface CreateOfferConfirmationModalProps {
  isOpen: boolean;
  collectionName: string;
  collectionSymbol: string;
  principalEth: string;
  termInterestBps: number;
  durationDays: number;
  expectedPayoutEth: string;
  protocolFeeEth: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function CreateOfferConfirmationModal({
  isOpen,
  collectionName,
  collectionSymbol,
  principalEth,
  termInterestBps,
  durationDays,
  expectedPayoutEth,
  protocolFeeEth,
  onConfirm,
  onClose,
  isLoading = false,
}: CreateOfferConfirmationModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  const interestRatePercent = (termInterestBps / 100).toFixed(1);

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Lending Offer"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">Confirm Lending Offer</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Review your financial commitment before signing
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirmation modal"
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 bg-[var(--panel)] p-4 rounded-xl border border-[var(--line)] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Target Collection</span>
            <span className="font-semibold text-[var(--text)]">
              {collectionName} ({collectionSymbol})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Committed Capital</span>
            <span className="font-mono font-bold text-sm text-[var(--text)]">
              {principalEth} ETH
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Fixed Term Interest</span>
            <span className="font-mono font-semibold text-[var(--primary)]">
              {interestRatePercent}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Loan Duration</span>
            <span className="font-mono font-medium text-[var(--text)]">
              {durationDays} Days
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Estimated Protocol Fee</span>
            <span className="font-mono text-[var(--muted)]">
              {protocolFeeEth} ETH
            </span>
          </div>

          <div className="pt-2.5 border-t border-[var(--line)] flex items-center justify-between">
            <span className="font-bold text-[var(--text)]">Net Payout if Repaid</span>
            <span className="font-mono font-extrabold text-base text-[var(--primary)]">
              {expectedPayoutEth} ETH
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs leading-relaxed">
          <p className="font-medium">
            ETH Anda akan disetor ke dalam kontrak escrow smart contract Pledge. Anda dapat membatalkan penawaran kapan saja selama belum diisi oleh peminjam.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            loading={isLoading}
            onClick={onConfirm}
            className="flex-2"
          >
            Confirm & Sign in Wallet
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
