'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

export interface BorrowConfirmationModalProps {
  isOpen: boolean;
  nftName: string;
  tokenId: string | number;
  collectionName: string;
  principalEth: string;
  totalDueEth: string;
  durationDays: number;
  isApproved: boolean;
  onApprove: () => void;
  onConfirm: () => void;
  onClose: () => void;
  isApproving?: boolean;
  isConfirming?: boolean;
}

export function BorrowConfirmationModal({
  isOpen,
  nftName,
  tokenId,
  collectionName,
  principalEth,
  totalDueEth,
  durationDays,
  isApproved,
  onApprove,
  onConfirm,
  onClose,
  isApproving = false,
  isConfirming = false,
}: BorrowConfirmationModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Borrowing Transaction"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">Confirm Borrowing & Escrow</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Review loan terms before locking NFT collateral
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 bg-[var(--panel)] p-4 rounded-xl border border-[var(--line)] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Collateral Asset</span>
            <span className="font-semibold text-[var(--text)]">
              {nftName || `${collectionName} #${tokenId}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">ETH Transferred to You</span>
            <span className="font-mono font-bold text-sm text-[var(--primary)]">
              +{principalEth} ETH
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Total Repayment Due</span>
            <span className="font-mono font-bold text-sm text-[var(--text)]">
              {totalDueEth} ETH
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Loan Duration</span>
            <span className="font-mono font-medium text-[var(--text)]">
              {durationDays} Days
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[var(--error)] text-xs leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Foreclosure Warning</span>
          </div>
          <p>
            Your NFT will be transferred into smart contract escrow. If you do not repay on time before the loan duration expires, your collateral NFT may be permanently foreclosed by the lender.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isApproving || isConfirming}
            className="flex-1"
          >
            Cancel
          </Button>

          {!isApproved ? (
            <Button
              type="button"
              variant="primary"
              loading={isApproving}
              onClick={onApprove}
              className="flex-2"
            >
              1. Approve NFT
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              loading={isConfirming}
              onClick={onConfirm}
              className="flex-2"
            >
              Confirm & Accept Loan
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
