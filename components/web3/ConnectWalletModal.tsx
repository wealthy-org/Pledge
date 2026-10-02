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
    const injectedConnector =
      connectors.find((c) => {
        if (walletType === 'phantom') {
          return c.id.toLowerCase().includes('phantom') || c.name.toLowerCase().includes('phantom') || c.type === 'injected';
        }
        if (walletType === 'metamask') {
          return c.id.toLowerCase().includes('metamask') || c.name.toLowerCase().includes('metamask') || c.type === 'injected';
        }
        return c.type === 'injected' || c.id === 'injected';
      }) || connectors[0];

    if (injectedConnector) {
      connect(
        { connector: injectedConnector },
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
                  {availability.phantom ? 'Detected & Ready' : 'Multi-chain EVM Wallet'}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted group-hover:text-text">→</span>
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
                  {availability.metamask ? 'Detected & Ready' : 'Browser Extension'}
                </div>
              </div>
            </div>
            <span className="text-xs text-muted group-hover:text-text">→</span>
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
                <div className="text-xs text-muted">Rabby, Coinbase, or Injected Provider</div>
              </div>
            </div>
            <span className="text-xs text-muted group-hover:text-text">→</span>
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-line text-center text-xs text-muted">
          By connecting your wallet, you agree to Pledge Protocol Terms of Service.
        </div>
      </div>
    </div>
  );
}
