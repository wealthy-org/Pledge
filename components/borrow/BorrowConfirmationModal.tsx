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
            ✕
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
            <span>⚠️</span>
            <span>Foreclosure Warning</span>
          </div>
          <p>
            NFT Anda akan ditransfer ke dalam escrow smart contract. Jika Anda tidak melunasi tepat waktu sebelum masa pinjaman berakhir, NFT Anda dapat disita secara permanen oleh pemberi pinjaman.
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
