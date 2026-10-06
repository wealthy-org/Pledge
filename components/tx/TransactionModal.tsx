'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type TransactionState } from '@/hooks/useTransactionFlow';
import { Button } from '@/components/ui/Button';
import { getActiveChain, getExplorerTxUrl, TESTNET_CHAIN_ID } from '@/config/chains';
import { requestNetworkSwitch } from '@/lib/web3/networkSwitch';
import { TransactionStepper } from './TransactionStepper';
import { TransactionTimer } from './TransactionTimer';
import { STAGE_ESTIMATES } from '@/lib/tx/stageEstimates';

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
  const [copied, setCopied] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const safeChainId =
    chainId === TESTNET_CHAIN_ID || chainId === 4663
      ? chainId
      : TESTNET_CHAIN_ID;
  const targetChain = getActiveChain(safeChainId);

  useEffect(() => {
    if (!isOpen) return;

    const originalTitle = document.title;
    if (
      state.stage === 'PREPARING' ||
      state.stage === 'SIMULATING' ||
      state.stage === 'PROMPTING' ||
      state.stage === 'PENDING' ||
      state.stage === 'CONFIRMING'
    ) {
      document.title = 'Processing Transaction... · Pledge';
    } else if (state.stage === 'SUCCESS') {
      document.title = 'Transaction Confirmed · Pledge';
    } else if (state.stage === 'ERROR') {
      document.title = 'Transaction Failed · Pledge';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.title = originalTitle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, state.stage, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isPending =
    state.stage === 'PREPARING' ||
    state.stage === 'SIMULATING' ||
    state.stage === 'PROMPTING' ||
    state.stage === 'PENDING' ||
    state.stage === 'CONFIRMING';

  const isSuccess = state.stage === 'SUCCESS';
  const isError = state.stage === 'ERROR';

  const stageEstimate = STAGE_ESTIMATES[state.stage];
  const currentDesc = state.description || stageEstimate?.description || '';
  const explorerUrl = state.txHash ? getExplorerTxUrl(state.txHash, chainId) : null;

  const isChainMismatch =
    state.errorCode === 'CHAIN_MISMATCH' ||
    Boolean(
      state.error &&
        (state.error.toLowerCase().includes('wrong network') ||
          state.error.toLowerCase().includes('chain mismatch') ||
          state.error.toLowerCase().includes('connectorchainmismatch') ||
          state.error.toLowerCase().includes('unsupported chain') ||
          state.error.toLowerCase().includes('switch to'))
    );

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    setSwitchError(null);
    try {
      const switchPromise = requestNetworkSwitch(targetChain);
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Network switch timed out. Please open your wallet extension directly to approve.')), 15000)
      );
      const success = await Promise.race([switchPromise, timeoutPromise]);
      if (success) {
        onClose();
        if (onRetry) {
          setTimeout(() => {
            onRetry();
          }, 200);
        }
      }
    } catch (err: any) {
      setSwitchError(err?.message || 'Failed to switch network in wallet.');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCopyHash = async () => {
    if (!state.txHash) return;
    try {
      await navigator.clipboard.writeText(state.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
      aria-describedby="tx-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f1715] border border-[var(--line)] shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div className="text-left">
            <span className="text-[10px] uppercase font-semibold tracking-[1.5px] text-[var(--muted)] block">
              {isSuccess ? 'Transaction Confirmed' : isError ? 'Execution Notice' : 'Transaction in Progress'}
            </span>
            <h3 id="tx-modal-title" className="text-base font-semibold text-[var(--text)]">
              {isSuccess
                ? 'Action Successfully Confirmed'
                : isError
                ? 'Transaction Failed'
                : state.title || 'Processing Transaction'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <TransactionStepper stage={state.stage} />

        <div className="flex justify-center">
          {isPending && (
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary50)] flex items-center justify-center">
              <svg className="animate-spin h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {isSuccess && (
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] border border-[var(--success)]/30 text-[var(--success)] flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}

          {isError && (
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-[var(--error)] flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-1 text-center">
          <p id="tx-modal-desc" className="text-xs text-[var(--muted)] leading-relaxed">
            {currentDesc}
          </p>
        </div>

        {isError && state.error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-left space-y-1">
            <span className="font-semibold text-red-600 dark:text-red-400 block text-[10px] uppercase tracking-wider font-mono">
              Failure Reason
            </span>
            <p className="text-xs text-[var(--text)] leading-relaxed font-medium">
              {state.error}
            </p>
          </div>
        )}

        {state.details && state.details.length > 0 && (
          <div className="rounded-xl bg-[var(--panel)] border border-[var(--line)] p-3 text-left space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] block">
              Transaction Details
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {state.details.map((d, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-[10px] text-[var(--muted)]">{d.label}</span>
                  <span className="font-medium text-[var(--text)] truncate">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <TransactionTimer
          stage={state.stage}
          startedAt={state.startedAt}
          stageStartedAt={state.stageStartedAt}
        />

        {state.txHash && (
          <div className="rounded-xl bg-[var(--panel)] border border-[var(--line)] p-3 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[10px] uppercase font-mono text-[var(--muted)] shrink-0">Tx Hash:</span>
              <span className="font-mono text-[11px] text-[var(--text)] truncate">
                {state.txHash.slice(0, 10)}...{state.txHash.slice(-8)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-[#15231f] border border-[var(--line)] hover:border-[var(--primary)] text-[10px] font-mono text-[var(--text)] transition-colors cursor-pointer"
              >
                <span>{copied ? 'Copied' : 'Copy'}</span>
                {copied && (
                  <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View on Explorer"
                  className="px-2 py-1 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] hover:underline text-[10px] font-mono font-medium transition-colors inline-flex items-center gap-1"
                >
                  <span>View on Explorer</span>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {isError && (
          <div className="space-y-3 text-left">
            {state.errorCode === 'RECEIPT_TIMEOUT' && (
              <div className="p-3 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning-border)] text-xs text-[var(--warning-text)] space-y-1">
                <span className="font-semibold block text-[11px]">Notice on Network Delay</span>
                <p className="text-[11px] leading-relaxed">
                  The transaction was submitted to the network, but confirmation took longer than expected. Please check your transaction on the block explorer before retrying to avoid duplicate submissions.
                </p>
              </div>
            )}

            {state.errorCode && state.errorCode !== 'RECEIPT_TIMEOUT' && (
              <div className="inline-block px-2.5 py-1 rounded-md bg-[var(--panel)] border border-[var(--line)] text-[11px] font-mono text-[var(--muted)]">
                Error Code: {state.errorCode}
              </div>
            )}

            {state.actionHint && (
              <div className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-xs space-y-1">
                <span className="font-semibold text-[var(--text)] block text-[10px] uppercase tracking-wider font-mono">
                  Suggested Action
                </span>
                <p className="text-[var(--muted)] leading-relaxed">{state.actionHint}</p>
              </div>
            )}

            {switchError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-[var(--error)] space-y-1">
                <span className="font-semibold block text-[10px] uppercase tracking-wider font-mono">
                  Switch Network Error
                </span>
                <p className="leading-relaxed">{switchError}</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          {isSuccess && (
            <Button variant="primary" onClick={onClose} className="w-full h-11">
              Done
            </Button>
          )}

          {isError && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                {isChainMismatch ? (
                  <Button
                    variant="primary"
                    loading={isSwitching}
                    onClick={handleSwitchNetwork}
                    className="w-full h-11 whitespace-nowrap text-xs sm:text-sm font-medium"
                  >
                    <span className="truncate">Switch to {targetChain.name}</span>
                  </Button>
                ) : (
                  onRetry &&
                  !state.isUserRejection &&
                  state.errorCode !== 'RECEIPT_TIMEOUT' && (
                    <Button
                      variant="primary"
                      onClick={onRetry}
                      className="w-full h-11 text-xs sm:text-sm font-medium"
                    >
                      Try Again
                    </Button>
                  )
                )}
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full h-11 text-xs sm:text-sm font-medium"
                >
                  Close
                </Button>
              </div>

              {isSwitching && (
                <p className="text-[10px] font-mono text-[var(--muted)] animate-pulse text-center">
                  Please approve the network switch in your wallet extension...
                </p>
              )}
            </div>
          )}

          {isPending && (
            <div className="w-full space-y-2">
              <Button variant="secondary" onClick={onClose} className="w-full h-11 text-xs">
                {state.txHash ? 'Close (Transaction continues in background)' : 'Dismiss'}
              </Button>
              <p className="text-[10px] font-mono text-[var(--muted)] animate-pulse">
                Please do not close browser during wallet signature prompt
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
