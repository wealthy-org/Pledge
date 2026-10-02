'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

export interface ForecloseConfirmationModalProps {
  isOpen: boolean;
  loanId: number | string;
  nftName?: string;
  collectionName?: string;
  tokenId?: string | number;
  destinationAddress: string;
  onDestinationChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ForecloseConfirmationModal({
  isOpen,
  loanId,
  nftName,
  collectionName,
  tokenId,
  destinationAddress,
  onDestinationChange,
  onConfirm,
  onClose,
  isLoading = false,
}: ForecloseConfirmationModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  const displayName = nftName || (collectionName ? `${collectionName} #${tokenId}` : `Collateral #${loanId}`);

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foreclose Collateral #${loanId}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">Foreclose Collateral #{loanId}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Claim collateral NFT transfer due to borrower default
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close foreclosure modal"
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
            <span className="font-semibold text-[var(--text)]">{displayName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[var(--muted)]">Default Status</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              Overdue / Defaulted
            </span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
            <label htmlFor="destination-address" className="font-semibold text-[var(--text)] block">
              Recipient Destination Address:
            </label>
            <input
              id="destination-address"
              type="text"
              value={destinationAddress}
              onChange={(e) => onDestinationChange(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[var(--surface)] border border-[var(--line)] text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
            <p className="text-[11px] text-[var(--muted)]">
              Defaults to your connected lender wallet. You may route to a cold wallet or vault address.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs leading-relaxed flex items-start gap-2">
          <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="font-medium">
            Irreversible Action: Claiming foreclosure closes this loan permanently. The escrowed NFT will be transferred directly to the specified destination address.
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
            variant="danger"
            loading={isLoading}
            onClick={onConfirm}
            className="flex-2 font-bold"
          >
            Confirm & Claim Collateral
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
