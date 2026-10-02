'use client';

import React from 'react';
import Link from 'next/link';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectWallet } from '@/components/web3/ConnectWallet';
import { getActiveChain, TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';
import { useMounted } from '@/lib/hooks/useMounted';

interface HeaderBarProps {
  onSearchClick?: () => void;
}

export function HeaderBar({ onSearchClick }: HeaderBarProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const mounted = useMounted();
  const { data: balanceData } = useBalance({
    address,
    query: {
      enabled: Boolean(address && isConnected),
    },
  });

  const isSupportedChain = chainId === TESTNET_CHAIN_ID || chainId === MAINNET_CHAIN_ID;
  const activeChain = getActiveChain(chainId);

  return (
    <header className="fixed top-0 left-0 md:left-[var(--rail-width)] right-0 h-[var(--header-height)] bg-white/95 dark:bg-[#0d1714]/95 backdrop-blur-md z-30 px-6 border-b border-[#e1ebe6] dark:border-[#1e332c] flex items-center justify-between gap-6 shadow-[0_2px_9px_rgba(35,79,56,0.06)] dark:shadow-[0_2px_9px_rgba(0,0,0,0.3)] transition-colors duration-150">
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-[26px] font-semibold tracking-[-1.4px] text-[#142d2b] dark:text-[#f0f6fc] shrink-0 select-none hover:opacity-90 transition-opacity"
        >
          <svg className="w-7 h-7 text-[var(--lime)]" viewBox="0 0 32 32" fill="none">
            <path d="M5 27V5h12a8 8 0 0 1 0 16h-5v6H5Z" fill="currentColor" />
            <path d="M12 11h5a2 2 0 0 1 0 4h-5v-4Z" fill="#ffffff" className="dark:fill-[#0d1714]" />
            <path d="m23 23 5-5v9h-9l4-4Z" fill="currentColor" />
          </svg>
          <span>
            pledge<span className="text-[var(--lime)]">.</span>
          </span>
        </Link>

        <button
          onClick={onSearchClick}
          className="flex-1 hidden sm:flex items-center justify-between h-[47px] px-4 rounded-xl bg-[#f0f4f2] dark:bg-[#14221e] border border-[#e1ebe6] dark:border-[#1e332c] text-[13px] text-[var(--muted)] dark:text-[#8ca197] hover:border-[#79acd0] hover:bg-white dark:hover:bg-[#192b25] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--muted)] dark:text-[#8ca197] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="10" cy="10" r="6" />
              <path d="m15 15 5 5" />
            </svg>
            <span>Search collections or collectibles</span>
          </div>
          <kbd className="px-2 py-0.5 rounded bg-white dark:bg-[#111a17] border border-[#e1ebe6] dark:border-[#1e332c] text-[11px] font-mono text-[#708179] dark:text-[#8ca197] shadow-xs">
            /
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {mounted && (
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-[#54716a] dark:text-[#8ca197] whitespace-nowrap">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupportedChain ? 'bg-[#2881bd] shadow-[0_0_0_3px_#e9f2fb] dark:shadow-[0_0_0_3px_#162e3d] animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>{isSupportedChain ? `${activeChain.name} (${activeChain.id})` : 'Wrong Network'}</span>
          </div>
        )}

        {mounted && isConnected && balanceData && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f4f2] dark:bg-[#14221e] border border-[#d9e8e5] dark:border-[#1e332c] text-xs font-mono text-[#142d2b] dark:text-[#f0f6fc]">
            <span className="text-[var(--muted)] dark:text-[#8ca197] text-[10px]">Balance:</span>
            <span className="font-semibold">
              {Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(3)} {balanceData.symbol}
            </span>
          </div>
        )}

        <ConnectWallet />
      </div>
    </header>
  );
}
