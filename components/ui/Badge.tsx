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
    open: 'bg-[var(--blue-soft)] text-[var(--blue)] border-[var(--blue)]/30',
    active: 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary50)]',
    repaid: 'bg-[var(--green-soft)] text-[var(--success)] border-[var(--success)]/30',
    overdue: 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
    foreclosed: 'bg-red-500/10 text-[var(--error)] border-red-500/30',
    cancelled: 'bg-[var(--raised)] text-[var(--muted)] border-[var(--line)]',
    filled: 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary50)]',
  };

  return (
    <span
      role="status"
      data-status={status}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border ${statusStyles[status]} ${className}`}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children}
    </span>
  );
}
