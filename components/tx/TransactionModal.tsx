'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { type TransactionState } from '@/hooks/useTransactionFlow';
import { Button } from '@/components/ui/Button';
import { getExplorerTxUrl } from '@/config/chains';

export interface TransactionModalProps {
  isOpen: boolean;
  state: TransactionState;
  onClose: () => void;
  onRetry?: () => void;
  chainId?: number;
}

export function TransactionModal({
  isOpen,
  state,
  onClose,
  onRetry,
  chainId,
}: TransactionModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  const isPending =
    state.stage === 'PREPARING' ||
    state.stage === 'SIMULATING' ||
    state.stage === 'PROMPTING' ||
    state.stage === 'PENDING' ||
    state.stage === 'CONFIRMING';

  const isSuccess = state.stage === 'SUCCESS';
  const isError = state.stage === 'ERROR';

  const stageDescriptions: Record<string, string> = {
    PREPARING: 'Preparing transaction parameters...',
    SIMULATING: 'Simulating execution against smart contracts...',
    PROMPTING: 'Please confirm and sign the transaction in your wallet...',
    PENDING: 'Transaction submitted. Waiting for mempool confirmation...',
    CONFIRMING: 'Confirming block receipt on Robinhood Chain...',
    SUCCESS: 'Transaction confirmed successfully!',
    ERROR: state.error || 'Transaction encountered an error.',
  };

  const currentDesc = state.description || stageDescriptions[state.stage] || '';
  const explorerUrl = state.txHash ? getExplorerTxUrl(state.txHash, chainId) : null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={state.title || 'Transaction'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-center">
          {isPending && (
            <div className="w-16 h-16 rounded-full bg-[var(--primary-soft)] border border-[var(--primary50)] flex items-center justify-center">
              <svg
                className="animate-spin h-8 w-8 text-[var(--primary)]"
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
            <div className="w-16 h-16 rounded-full bg-[var(--green-soft)] border border-[var(--success)]/30 text-[var(--success)] flex items-center justify-center text-3xl">
              ✓
            </div>
          )}

          {isError && (
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-[var(--error)] flex items-center justify-center text-3xl font-bold">
              ✕
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-[var(--text)]">
            {isSuccess ? 'Transaction Confirmed' : isError ? 'Transaction Failed' : state.title || 'Processing Transaction'}
          </h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">{currentDesc}</p>

          {isError && state.errorCode && (
            <div className="inline-block mt-2 px-2.5 py-1 rounded-md bg-[var(--panel)] border border-[var(--line)] text-[11px] font-mono text-[var(--muted)]">
              Error Code: {state.errorCode}
            </div>
          )}

          {isError && state.actionHint && (
            <div className="mt-3 p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-left text-xs space-y-1">
              <span className="font-bold text-[var(--text)] block text-[10px] uppercase tracking-wider font-mono">
                💡 Suggested Action:
              </span>
              <p className="text-[var(--muted)] leading-relaxed">{state.actionHint}</p>
            </div>
          )}
        </div>

        {explorerUrl && (
          <div className="pt-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--primary)] hover:underline"
            >
              <span>View on Explorer</span>
              <span>↗</span>
            </a>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-3">
          {isSuccess && (
            <Button variant="primary" onClick={onClose} className="w-full">
              Done
            </Button>
          )}

          {isError && (
            <>
              {onRetry && !state.isUserRejection && (
                <Button variant="primary" onClick={onRetry} className="flex-1">
                  Try Again
                </Button>
              )}
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Close
              </Button>
            </>
          )}

          {isPending && (
            <p className="text-[11px] font-mono text-[var(--muted)] animate-pulse">
              Please do not close this window
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
