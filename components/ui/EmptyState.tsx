'use client';

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`p-10 rounded-[var(--radius)] bg-[var(--surface)] border border-dashed border-[var(--line)] flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--raised)] flex items-center justify-center text-2xl text-[var(--muted)] opacity-80">
        {icon || '📭'}
      </div>

      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-semibold text-[var(--text)]">{title}</h4>
        <p className="text-xs text-[var(--muted)] leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="primary" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
