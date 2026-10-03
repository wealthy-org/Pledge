'use client';

import React from 'react';
import Link from 'next/link';
import { useConnection, useChainId, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectWallet } from '@/components/web3/ConnectWallet';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { getActiveChain, TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';
import { useMounted } from '@/lib/hooks/useMounted';

interface HeaderBarProps {
  onSearchClick?: () => void;
}

export function HeaderBar({ onSearchClick }: HeaderBarProps) {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();
  const mounted = useMounted();
  const { data: balanceData } = useBalance({
    address,
    query: {
      enabled: Boolean(address && isConnected),
    },
  });

  const isSupportedChain = chainId === TESTNET_CHAIN_ID || chainId === MAINNET_CHAIN_ID;
  const activeChain = getActiveChain(isSupportedChain ? chainId : undefined);

  return (
    <header className="fixed top-0 left-0 md:left-[var(--rail-width)] right-0 h-[var(--header-height)] bg-[var(--surface)] z-30 px-6 border-b border-[var(--line)] flex items-center justify-between gap-6 transition-colors duration-150">
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[var(--text)] shrink-0 select-none hover:opacity-90 transition-opacity"
        >
          <svg className="w-7 h-7 text-[var(--accent-primary)]" viewBox="0 0 32 32" fill="none">
            <path d="M5 27V5h12a8 8 0 0 1 0 16h-5v6H5Z" fill="currentColor" />
            <path d="M12 11h5a2 2 0 0 1 0 4h-5v-4Z" fill="var(--surface)" />
            <path d="m23 23 5-5v9h-9l4-4Z" fill="currentColor" />
          </svg>
          <span>
            pledge<span className="text-[var(--accent-primary)]">.</span>
          </span>
        </Link>

        <button
          onClick={onSearchClick}
          className="flex-1 hidden sm:flex items-center justify-between h-10 px-3.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs text-[var(--muted)] hover:border-[var(--line-strong)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-[var(--muted)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="10" r="6" />
              <path d="m15 15 5 5" />
            </svg>
            <span>Search collections or collectibles</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--line)] text-[10px] font-mono text-[var(--muted)]">
            /
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {mounted && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
            <span
              className={`w-2 h-2 rounded-full ${
                isSupportedChain ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[11px]">{isSupportedChain ? `${activeChain.name} (${activeChain.id})` : 'Wrong Network'}</span>
          </div>
        )}

        {mounted && isConnected && balanceData && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs font-mono text-[var(--text)]">
            <span className="text-[var(--muted)] text-[10px]">Balance:</span>
            <span className="font-semibold">
              {Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(3)} {balanceData.symbol}
            </span>
          </div>
        )}

        <ThemeToggle variant="header" />
        <ConnectWallet />
      </div>
    </header>
  );
}
