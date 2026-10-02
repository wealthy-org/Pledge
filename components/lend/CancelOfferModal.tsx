'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

export interface CancelOfferModalProps {
  isOpen: boolean;
  offerId: number | string;
  collectionName?: string;
  principalEth: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function CancelOfferModal({
  isOpen,
  offerId,
  collectionName,
  principalEth,
  onConfirm,
  onClose,
  isLoading = false,
}: CancelOfferModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cancel Offer #${offerId}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">Cancel Offer #{offerId}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Withdraw liquidity offer from the order book
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cancellation modal"
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 bg-[var(--panel)] p-4 rounded-xl border border-[var(--line)] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Target Collection</span>
            <span className="font-semibold text-[var(--text)]">{collectionName || 'Curated Collection'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Committed Principal</span>
            <span className="font-mono font-bold text-sm text-[var(--text)]">{principalEth} ETH</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
          <p className="font-medium">
            Once cancelled, your {principalEth} ETH principal is securely refunded directly into your protocol Claimable Proceeds balance, ready for instant withdrawal.
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
            Keep Offer
          </Button>

          <Button
            type="button"
            variant="danger"
            loading={isLoading}
            onClick={onConfirm}
            className="flex-2 font-bold"
          >
            Confirm & Cancel Offer
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
