'use client';

import React from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectWallet } from '@/components/web3/ConnectWallet';
import { NetworkWarningBanner } from '@/components/web3/NetworkWarningBanner';
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
    <header className="h-[var(--header-height)] w-full border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onSearchClick}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#F4F6F7] border border-[var(--line)] text-xs text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--text)] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm">🔍</span>
            <span>Search collections, loans, or addresses...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded bg-[var(--raised)] border border-[var(--line)] text-[10px] font-mono text-[var(--muted)]">
            /
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {mounted && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--primary-soft)] border border-[var(--primary50)] text-[var(--primary)] text-xs font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupportedChain ? 'bg-[var(--primary)] animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>
              {activeChain.name} ({activeChain.id})
            </span>
          </div>
        )}

        {mounted && isConnected && balanceData && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--raised)] border border-[var(--line)] text-xs font-mono text-[var(--text)]">
            <span className="text-[var(--muted)] text-[11px]">Balance:</span>
            <span className="font-semibold">
              {Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(3)} {balanceData.symbol}
            </span>
          </div>
        )}

        <NetworkWarningBanner />
        <ConnectWallet />
      </div>
    </header>
  );
}
