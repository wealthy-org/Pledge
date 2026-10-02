'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

export interface RepayConfirmationModalProps {
  isOpen: boolean;
  loanId: number | string;
  nftName?: string;
  collectionName?: string;
  tokenId?: string | number;
  principalEth: string;
  interestEth: string;
  totalDueEth: string;
  dueAt: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function RepayConfirmationModal({
  isOpen,
  loanId,
  nftName,
  collectionName,
  tokenId,
  principalEth,
  interestEth,
  totalDueEth,
  dueAt,
  onConfirm,
  onClose,
  isLoading = false,
}: RepayConfirmationModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  const displayName = nftName || (collectionName ? `${collectionName} #${tokenId}` : `Loan #${loanId}`);
  const formattedDueDate = new Date(dueAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Repay Loan #${loanId}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">Repay Loan #{loanId}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Settle loan obligations to reclaim collateral
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close repayment modal"
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 bg-[var(--panel)] p-4 rounded-xl border border-[var(--line)] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Collateral Asset</span>
            <span className="font-semibold text-[var(--text)]">{displayName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Principal Borrowed</span>
            <span className="font-mono font-medium text-[var(--text)]">{principalEth} ETH</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Fixed Term Interest</span>
            <span className="font-mono font-medium text-[var(--text)]">{interestEth} ETH</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Repayment Deadline</span>
            <span className="font-mono text-[var(--muted)]">{formattedDueDate}</span>
          </div>

          <div className="pt-2.5 border-t border-[var(--line)] flex items-center justify-between">
            <span className="font-bold text-[var(--text)]">Total Payment Required</span>
            <span className="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
              {totalDueEth} ETH
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed">
          <p className="font-medium">
            Upon successful settlement, the smart contract will immediately unlock and return your collateral NFT back into your connected wallet.
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
            Confirm & Repay Loan
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
