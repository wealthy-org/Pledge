'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useConnect, useConnectors, useAccount } from 'wagmi';
import { checkWalletAvailability, type WalletType } from '@/lib/web3/wallet';

export interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (connectorName?: string) => void;
  onError?: (error: Error) => void;
}

export function ConnectWalletModal({ isOpen, onClose, onSuccess, onError }: ConnectWalletModalProps) {
  const connectors = useConnectors();
  const { isConnected } = useAccount();
  const { mutate: connect, isPending, error } = useConnect();
  const availability = typeof window !== 'undefined' ? checkWalletAvailability() : {
    phantom: false,
    metamask: false,
    rabby: false,
    injected: false,
  };

  useEffect(() => {
    if (isConnected && isOpen) {
      onClose();
    }
  }, [isConnected, isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

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
            onSuccess?.(targetConnector.name);
          },
          onError: (err) => {
            onError?.(err as Error);
          },
        }
      );
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet Modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md p-6 bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 text-left space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">Connect Wallet</h2>
            <p className="text-xs text-[var(--muted)]">Select your preferred EVM wallet to continue</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] rounded-md hover:bg-[var(--raised)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs font-medium text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl">
            {error.message || 'Failed to connect wallet. Please try again.'}
          </div>
        )}

        <div className="space-y-2.5">
          <button
            onClick={() => handleConnect('phantom')}
            disabled={isPending}
            className="w-full flex items-center justify-between p-3.5 bg-[var(--panel)] hover:bg-[var(--raised)] border border-[var(--line)] hover:border-[var(--primary)] rounded-xl transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#ab9ff2]/15 text-[#ab9ff2] shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M34.2 18.3C33.6 13.5 29.5 9.8 24.6 9.8H13.8C8.9 9.8 5 13.7 5 18.6V26.2C5 28.3 6.7 30 8.8 30H10.5C12.6 30 14.3 28.3 14.3 26.2V25.2C14.3 24.1 15.2 23.2 16.3 23.2C17.4 23.2 18.3 24.1 18.3 25.2V26.2C18.3 28.3 20 30 22.1 30H23.8C25.9 30 27.6 28.3 27.6 26.2V24.2C27.6 23.1 28.5 22.2 29.6 22.2C30.7 22.2 31.6 23.1 31.6 24.2V25.2C31.6 27.3 33.3 29 35.4 29C35.8 29 36.2 28.9 36.6 28.8C37.5 28.4 38.1 27.5 38.1 26.5V23.5C38.1 21.6 36.4 19.9 34.2 18.3ZM14.8 17.2C13.7 17.2 12.8 16.3 12.8 15.2C12.8 14.1 13.7 13.2 14.8 13.2C15.9 13.2 16.8 14.1 16.8 15.2C16.8 16.3 15.9 17.2 14.8 17.2ZM24.2 17.2C23.1 17.2 22.2 16.3 22.2 15.2C22.2 14.1 23.1 13.2 24.2 13.2C25.3 13.2 26.2 14.1 26.2 15.2C26.2 16.3 25.3 17.2 24.2 17.2Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  Phantom Wallet
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {availability.phantom ? 'Detected & Ready' : 'Install Phantom Extension →'}
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-[var(--muted)] group-hover:text-[var(--text)]">
              {availability.phantom ? 'Connect →' : 'Install ↗'}
            </span>
          </button>

          <button
            onClick={() => handleConnect('metamask')}
            disabled={isPending}
            className="w-full flex items-center justify-between p-3.5 bg-[var(--panel)] hover:bg-[var(--raised)] border border-[var(--line)] hover:border-[var(--primary)] rounded-xl transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#e2761b]/15 text-[#e2761b] shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M28 7 17.5 14.5 21 8.5 28 7Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="M4 7l10.5 7.5L11 8.5 4 7Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="m23.5 21.5-3 4.5 6 1.5 1.5-6-4.5 0Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="m8.5 21.5 3 4.5-6 1.5-1.5-6 4.5 0Z" fill="currentColor" fillOpacity="0.2"/>
                  <path d="M16 27.5V14.5M16 27.5l-4.5-1.5M16 27.5l4.5-1.5M4 7l4.5 14.5M28 7l-4.5 14.5M16 14.5 4 7M16 14.5 28 7"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  MetaMask
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {availability.metamask ? 'Detected & Ready' : 'Install MetaMask Extension →'}
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-[var(--muted)] group-hover:text-[var(--text)]">
              {availability.metamask ? 'Connect →' : 'Install ↗'}
            </span>
          </button>

          <button
            onClick={() => handleConnect('injected')}
            disabled={isPending}
            className="w-full flex items-center justify-between p-3.5 bg-[var(--panel)] hover:bg-[var(--raised)] border border-[var(--line)] hover:border-[var(--primary)] rounded-xl transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="3" />
                  <path d="M2 10h20" />
                  <circle cx="17" cy="15" r="1" fill="currentColor" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  Browser Wallet
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {availability.injected ? 'Detected (Rabby / Injected)' : 'Install Rabby / Browser Wallet →'}
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-[var(--muted)] group-hover:text-[var(--text)]">
              {availability.injected ? 'Connect →' : 'Install ↗'}
            </span>
          </button>
        </div>

        <div className="pt-3 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          By connecting your wallet, you agree to Pledge Protocol Terms of Service.
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
