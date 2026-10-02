'use client';

import React from 'react';
import { type TransactionState } from '@/hooks/useTransactionFlow';
import { getExplorerTxUrl } from '@/config/chains';

export interface TransactionToastProps {
  state: TransactionState;
  onDismiss: () => void;
  chainId?: number;
}

export function TransactionToast({
  state,
  onDismiss,
  chainId,
}: TransactionToastProps) {
  if (state.stage === 'IDLE') return null;

  const isPending =
    state.stage === 'PREPARING' ||
    state.stage === 'SIMULATING' ||
    state.stage === 'PROMPTING' ||
    state.stage === 'PENDING' ||
    state.stage === 'CONFIRMING';

  const isSuccess = state.stage === 'SUCCESS';
  const isError = state.stage === 'ERROR';

  const explorerUrl = state.txHash ? getExplorerTxUrl(state.txHash, chainId) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[var(--surface)] border border-[var(--line)] shadow-2xl rounded-2xl p-4 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isPending && (
            <div className="w-6 h-6 rounded-full bg-[var(--primary-soft)] border border-[var(--primary50)] flex items-center justify-center">
              <svg
                className="animate-spin h-3.5 w-3.5 text-[var(--primary)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}

          {isSuccess && (
            <div className="w-6 h-6 rounded-full bg-[var(--green-soft)] border border-[var(--success)]/30 text-[var(--success)] flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          )}

          {isError && (
            <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 text-[var(--error)] flex items-center justify-center text-xs font-bold">
              ✕
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[var(--text)] truncate">
            {state.title || 'Transaction'}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-0.5 line-clamp-2">
            {state.error || state.description || 'Processing transaction...'}
          </div>
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[10px] font-mono text-[var(--primary)] hover:underline mt-1"
            >
              View on Explorer ↗
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss transaction notification"
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] p-1 rounded-md cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
