'use client';

import React from 'react';

export type BadgeStatus =
  | 'open'
  | 'active'
  | 'repaid'
  | 'overdue'
  | 'foreclosed'
  | 'cancelled'
  | 'filled';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
}

export function Badge({
  children,
  status = 'open',
  className = '',
  ...props
}: BadgeProps) {
  const statusStyles: Record<BadgeStatus, string> = {
    open: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25',
    active: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
    repaid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    overdue: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    foreclosed: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
    cancelled: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/25',
    filled: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
  };

  return (
    <span
      role="status"
      data-status={status}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider border ${statusStyles[status]} ${className}`}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-xs bg-current opacity-75" />
      {children}
    </span>
  );
}
