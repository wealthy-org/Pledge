'use client';

import React, { useState } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { truncateAddress } from '@/lib/web3/wallet';
import { ConnectWalletModal } from './ConnectWalletModal';
import { WalletDropdownMenu } from './WalletDropdownMenu';
import { getActiveChain, TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';
import { useMounted } from '@/lib/hooks/useMounted';

export interface ConnectWalletProps {
  className?: string;
}

export function ConnectWallet({ className = '' }: ConnectWalletProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <button
          disabled
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--raised)] border border-[var(--line)] text-[var(--muted)] opacity-60 cursor-not-allowed"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const isSupportedChain = chainId === TESTNET_CHAIN_ID || chainId === MAINNET_CHAIN_ID;
  const activeChain = getActiveChain(chainId);

  if (!isConnected || !address) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isConnecting}
          className={`px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-2 ${className}`}
        >
          {isConnecting ? (
            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-300 inline-block shadow-xs" />
          )}
          <span className="text-white font-semibold">{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>

        <ConnectWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-1.5 p-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg">
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-[var(--surface)]">
          <span
            className={`w-2 h-2 rounded-full ${
              isSupportedChain ? 'bg-[var(--lime)] animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-[var(--muted)] font-mono text-[11px]">
            {isSupportedChain ? activeChain.name : 'Wrong Network'}
          </span>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          className="px-2.5 py-1 text-xs font-mono font-medium text-[var(--text)] bg-[var(--raised)] hover:bg-[var(--line)] rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>{truncateAddress(address)}</span>
          <svg className="w-3 h-3 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <WalletDropdownMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        address={address}
        chainId={chainId}
        onDisconnect={disconnect}
      />

      <ConnectWalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
