'use client';

import React, { useEffect } from 'react';
import { useConnect, useConnectors } from 'wagmi';
import { checkWalletAvailability, type WalletType } from '@/lib/web3/wallet';

export interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const connectors = useConnectors();
  const { mutate: connect, isPending, error } = useConnect();
  const availability = typeof window !== 'undefined' ? checkWalletAvailability() : {
    phantom: false,
    metamask: false,
    rabby: false,
    injected: false,
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnect = (walletType: WalletType) => {
    if (walletType === 'phantom' && !availability.phantom) {
      window.open('https://phantom.app/', '_blank', 'noopener,noreferrer');
      return;
    }
    if (walletType === 'metamask' && !availability.metamask) {
      window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
      return;
    }
    if (walletType === 'injected' && !availability.injected) {
      window.open('https://rabby.io/', '_blank', 'noopener,noreferrer');
      return;
    }

    const targetConnector =
      connectors.find((c) => {
        const id = c.id.toLowerCase();
        const name = c.name.toLowerCase();
        if (walletType === 'phantom') {
          return id.includes('phantom') || name.includes('phantom');
        }
        if (walletType === 'metamask') {
          return id.includes('metamask') || name.includes('metamask') || id.includes('io.metamask');
        }
        return c.type === 'injected' || id === 'injected';
      }) || connectors[0];

    if (targetConnector) {
      connect(
        { connector: targetConnector },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md p-6 bg-panel border border-line rounded-[var(--radius)] shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
          <div>
            <h2 className="text-lg font-semibold text-text tracking-tight">Connect Wallet</h2>
            <p className="text-xs text-muted">Select your preferred EVM wallet to continue</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-text rounded-md hover:bg-raised transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error.message || 'Failed to connect wallet. Please try again.'}
          </div>
        )}

        <div className="space-y-2.5">
          <button
            onClick={() => handleConnect('phantom')}
            disabled={isPending}
            className="w-full flex items-center justify-between p-3.5 bg-bg hover:bg-raised border border-line hover:border-lime rounded-xl transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold text-sm">
                🟣
              </div>
              <div>
                <div className="text-sm font-medium text-text group-hover:text-lime transition-colors">
                  Phantom Wallet
                </div>
                <div className="text-xs text-muted">
                  {availability.phantom ? 'Detected & Ready' : 'Install Phantom Extension →'}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted group-hover:text-text">
              {availability.phantom ? 'Connect →' : 'Install ↗'}
            </span>
          </button>

          <button
            onClick={() => handleConnect('metamask')}
            disabled={isPending}
            className="w-full flex items-center justify-between p-3.5 bg-bg hover:bg-raised border border-line hover:border-lime rounded-xl transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-100 text-orange-700 font-bold text-sm">
                🦊
              </div>
              <div>
                <div className="text-sm font-medium text-text group-hover:text-lime transition-colors">
                  MetaMask
                </div>
                <div className="text-xs text-muted">
                  {availability.metamask ? 'Detected & Ready' : 'Install MetaMask Extension →'}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted group-hover:text-text">
              {availability.metamask ? 'Connect →' : 'Install ↗'}
            </span>
          </button>

          <button
            onClick={() => handleConnect('injected')}
            disabled={isPending}
            className="w-full flex items-center justify-between p-3.5 bg-bg hover:bg-raised border border-line hover:border-lime rounded-xl transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
                🌐
              </div>
              <div>
                <div className="text-sm font-medium text-text group-hover:text-lime transition-colors">
                  Browser Wallet
                </div>
                <div className="text-xs text-muted">
                  {availability.injected ? 'Detected (Rabby / Injected)' : 'Install Rabby / Browser Wallet →'}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted group-hover:text-text">
              {availability.injected ? 'Connect →' : 'Install ↗'}
            </span>
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-line text-center text-xs text-muted">
          By connecting your wallet, you agree to Pledge Protocol Terms of Service.
        </div>
      </div>
    </div>
  );
}
