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
      className={`p-10 rounded-xl bg-[var(--surface)] border border-dashed border-[var(--line)] flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="text-[var(--muted)] mb-1">
        {icon || (
          <svg
            className="w-8 h-8 text-[var(--muted)] opacity-60 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
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
