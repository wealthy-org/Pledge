'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { LoanItem } from '@/types/api';

export interface LoanActionButtonsProps {
  loan: LoanItem;
  userAddress?: string;
  isOverdue: boolean;
  onRepay: () => void;
  onForeclose: () => void;
  isProcessing?: boolean;
}

export function LoanActionButtons({
  loan,
  userAddress,
  isOverdue,
  onRepay,
  onForeclose,
  isProcessing = false,
}: LoanActionButtonsProps) {
  if (loan.status === 'repaid') {
    return (
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
        <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>This loan was fully repaid and settled.</span>
      </div>
    );
  }

  if (loan.status === 'foreclosed') {
    return (
      <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-center text-xs font-mono text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2">
        <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>This loan was foreclosed and collateral transferred to lender.</span>
      </div>
    );
  }

  const normalizedUser = userAddress?.toLowerCase();
  const isBorrower = normalizedUser === loan.borrower.toLowerCase();
  const isLender = normalizedUser === loan.lender.toLowerCase();

  if (isBorrower) {
    if (isOverdue) {
      return (
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-center space-y-1">
            <div className="text-xs font-mono font-bold text-amber-900 dark:text-amber-200">
              Repayment Deadline Passed (Overdue)
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80">
              Grace period has expired. The lender may seize the collateral at any time.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            disabled
            className="w-full"
          >
            Repay Loan (Overdue)
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onRepay}
          loading={isProcessing}
          className="w-full text-sm font-bold"
        >
          Repay Loan
        </Button>
        <p className="text-[11px] text-center text-[var(--muted)] font-mono">
          Settles principal + term interest and instantaneously releases your collateral NFT.
        </p>
      </div>
    );
  }

  if (isLender) {
    if (isOverdue) {
      return (
        <div className="space-y-3">
          <Button
            variant="danger"
            size="lg"
            onClick={onForeclose}
            loading={isProcessing}
            className="w-full text-sm font-bold"
          >
            Foreclose Collateral
          </Button>
          <p className="text-[11px] text-center text-rose-600 dark:text-rose-400 font-mono">
            Default confirmed. Claim ownership and transfer of the collateral NFT into your wallet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--raised)] text-center text-xs font-mono text-[var(--muted)]">
          Loan in progress (Not yet overdue). Foreclosure is unlocked if borrower fails to repay by deadline.
        </div>
        <Button
          variant="secondary"
          size="lg"
          disabled
          className="w-full"
        >
          Foreclose Collateral
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-center space-y-1">
      <div className="text-xs font-mono font-semibold text-[var(--text)]">
        Observer Mode
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        Connect with borrower address to repay, or lender address to foreclose after deadline.
      </p>
    </div>
  );
}
