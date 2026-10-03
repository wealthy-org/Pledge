'use client';

import React, { useState } from 'react';
import { useConnection, useChainId, useSwitchChain } from 'wagmi';
import { getActiveChain, TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';
import { requestNetworkSwitch } from '@/lib/web3/networkSwitch';
import { useMounted } from '@/lib/hooks/useMounted';

export function NetworkWarningBanner() {
  const { isConnected } = useConnection();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const mounted = useMounted();

  if (!mounted || !isConnected) return null;

  const isSupportedChain = chainId === TESTNET_CHAIN_ID || chainId === MAINNET_CHAIN_ID;
  if (isSupportedChain) return null;

  const targetChain = getActiveChain();

  const handleSwitch = async () => {
    if (!targetChain?.id) {
      throw new Error('Target chain configuration is missing or undefined.');
    }
    setDismissedError(null);
    setErrorMessage(null);
    setIsPending(true);

    try {
      await requestNetworkSwitch(targetChain);
    } catch (err: any) {
      try {
        switchChain({ chainId: targetChain.id });
      } catch (wagmiErr: any) {
        setErrorMessage(err?.message || wagmiErr?.message || 'Failed to switch network.');
      }
    } finally {
      setIsPending(false);
    }
  };

  const currentErrorMessage = errorMessage;
  const isErrorModalVisible = Boolean(currentErrorMessage && dismissedError !== currentErrorMessage);

  return (
    <>
      <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              <strong className="font-semibold text-amber-300">Unsupported Network:</strong> You are currently connected to Chain ID {chainId}. Please switch to{' '}
              <span className="font-mono underline font-medium">{targetChain.name} ({targetChain.id})</span> to interact with Pledge Protocol.
            </span>
          </div>
          <button
            onClick={handleSwitch}
            disabled={isPending}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isPending ? 'Switching...' : `Switch to ${targetChain.name}`}
          </button>
        </div>
      </div>

      {isErrorModalVisible && currentErrorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 bg-[var(--panel)] border border-red-500/40 rounded-xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-[var(--line)]">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 font-bold">
                <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[var(--text)]">Network Switch Failed</h3>
            </div>
            <p className="text-xs text-[var(--muted)] mb-4 font-mono leading-relaxed bg-[var(--surface)] p-3 rounded-lg border border-[var(--line)]">
              {currentErrorMessage}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDismissedError(currentErrorMessage)}
                className="px-3.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] bg-[var(--raised)] hover:bg-[var(--line)] rounded-lg transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setDismissedError(null);
                  handleSwitch();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--lime)] hover:bg-[#076b4d] rounded-lg transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
