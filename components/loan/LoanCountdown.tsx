'use client';

import React, { useState, useEffect } from 'react';
import type { LoanStatus } from '@/types/database';

export interface LoanCountdownProps {
  dueAt: string;
  status: LoanStatus;
  currentTime?: string | number;
}

export function LoanCountdown({
  dueAt,
  status,
  currentTime,
}: LoanCountdownProps) {
  const dueTimestamp = new Date(dueAt).getTime();

  const [liveTimeLeftMs, setLiveTimeLeftMs] = useState<number>(() => {
    return dueTimestamp - new Date().getTime();
  });

  useEffect(() => {
    if (currentTime !== undefined) {
      return;
    }

    const interval = setInterval(() => {
      setLiveTimeLeftMs(dueTimestamp - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [dueTimestamp, currentTime]);

  if (status === 'repaid') {
    return (
      <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 space-y-1">
        <div className="flex items-center gap-2 font-mono font-bold text-sm">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Loan Repaid</span>
        </div>
        <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
          This loan was successfully settled in full. The collateral NFT has been released back to the borrower.
        </p>
      </div>
    );
  }

  if (status === 'foreclosed') {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200 space-y-1">
        <div className="flex items-center gap-2 font-mono font-bold text-sm">
          <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Loan Foreclosed</span>
        </div>
        <p className="text-xs text-rose-800/80 dark:text-rose-200/80">
          This loan defaulted past its deadline. The collateral NFT has been liquidated and transferred to the lender.
        </p>
      </div>
    );
  }

  const effectiveTimeLeft =
    currentTime !== undefined
      ? dueTimestamp - (typeof currentTime === 'number' ? currentTime : new Date(currentTime).getTime())
      : liveTimeLeftMs;

  const isOverdue = effectiveTimeLeft <= 0;

  if (isOverdue) {
    const overdueSeconds = Math.abs(Math.floor(effectiveTimeLeft / 1000));
    const overdueDays = Math.floor(overdueSeconds / 86400);
    const overdueHours = Math.floor((overdueSeconds % 86400) / 3600);

    return (
      <div className="p-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <span className="font-mono font-bold text-sm tracking-wider uppercase text-amber-900 dark:text-amber-200">
            Overdue
          </span>
          <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
            Default Risk
          </span>
        </div>
        <p className="text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/90">
          The deadline for this loan has expired {overdueDays > 0 ? `${overdueDays}d ${overdueHours}h ago` : 'recently'}. Lender is entitled to claim foreclosure on the NFT collateral.
        </p>
      </div>
    );
  }

  const totalSeconds = Math.floor(effectiveTimeLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[1.5px] text-[var(--muted)] block">
            Time Remaining
          </span>
          <span className="text-xs text-[var(--muted)]">Until Repayment Deadline</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold">
          <span className="w-1.5 h-1.5 rounded-xs bg-emerald-500" />
          <span>Active Accrual</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
          <div className="text-2xl font-black font-mono text-[var(--text)]">{days}d</div>
          <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Days</div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
          <div className="text-2xl font-black font-mono text-[var(--text)]">
            {hours.toString().padStart(2, '0')}h
          </div>
          <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Hours</div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
          <div className="text-2xl font-black font-mono text-[var(--text)]">
            {minutes.toString().padStart(2, '0')}m
          </div>
          <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Mins</div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
          <div className="text-2xl font-black font-mono text-[var(--primary)]">
            {seconds.toString().padStart(2, '0')}s
          </div>
          <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Secs</div>
        </div>
      </div>
    </div>
  );
}
