'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  errorMessage: string;
  errorCode?: string;
  actionHint?: string;
  onRetry?: () => void;
  onClose: () => void;
}

export function ErrorModal({
  isOpen,
  title = 'Transaction Failed',
  errorMessage,
  errorCode,
  actionHint,
  onRetry,
  onClose,
}: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-red-500/30 shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl font-black">
            ✕
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">{errorMessage}</p>

          {errorCode && (
            <div className="inline-block mt-2 px-2.5 py-1 rounded-md bg-[var(--panel)] border border-[var(--line)] text-[11px] font-mono text-[var(--muted)]">
              Error Code: {errorCode}
            </div>
          )}
        </div>

        {actionHint && (
          <div className="p-3.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-left text-xs space-y-1">
            <span className="font-bold text-[var(--text)] block text-[11px] uppercase tracking-wider font-mono">
              💡 Suggested Next Step:
            </span>
            <p className="text-[var(--muted)] leading-relaxed">{actionHint}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          {onRetry && (
            <Button
              type="button"
              variant="primary"
              onClick={onRetry}
              className="flex-1 font-bold"
            >
              Try Again
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
