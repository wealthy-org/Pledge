'use client';

import React from 'react';
import Link from 'next/link';
import { useBlockNumber, useChainId } from 'wagmi';
import { getActiveChain, TESTNET_CHAIN_ID } from '@/config/chains';
import { useMounted } from '@/lib/hooks/useMounted';

export function FooterStatusBar() {
  const chainId = useChainId();
  const mounted = useMounted();
  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({
    watch: true,
  });

  const activeChain = getActiveChain(chainId ?? TESTNET_CHAIN_ID);
  const explorerUrl = activeChain.blockExplorers?.default.url || 'https://explorer.testnet.robinhood.com';

  return (
    <footer
      className="fixed bottom-0 left-0 md:left-[var(--rail-width)] right-0 h-[var(--footer-bar-height)] z-30 bg-[#f6f8f7] border-t border-[#e2e9e4] px-4 flex items-center justify-between text-[10px] text-[#6b7f70] select-none shadow-xs"
      data-testid="footer-status-bar"
    >
      <div className="flex items-center gap-2 truncate">
        <span className="w-1.5 h-1.5 rounded-full bg-[#087f5b] inline-block animate-pulse" />
        <span className="font-medium text-[#183d30]">{activeChain.name}</span>
        <span className="text-[#d0dbd3]">|</span>
        <span className="font-mono">
          {mounted && blockNumber
            ? `Block #${blockNumber.toString()} · Synced`
            : isBlockLoading
            ? 'Syncing block...'
            : 'Block synced'}
        </span>
        <span className="text-[#d0dbd3]">|</span>
        <span className="font-mono text-[#267451]">ETH: $2,450</span>
        <span className="text-[#d0dbd3]">|</span>
        <span className="font-mono text-[#267451]">Gas: 15 Gwei</span>
        <span className="text-[#d0dbd3]">|</span>
        <span className="text-[#267451] font-medium hidden sm:inline">Non-Custodial Smart Contract Escrow</span>
      </div>

      <div className="flex items-center gap-4 text-[10px]">
        <span className="hidden lg:inline text-[#8a9d90]">Fixed Rate P2P NFT Lending</span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Blockscout Explorer"
          className="text-[#4d7a99] hover:underline flex items-center gap-1"
        >
          <span>Blockscout Explorer</span>
          <span>↗</span>
        </a>
        <Link href="/activity" className="text-[#4d7a99] hover:underline">
          About Pledge ↗
        </Link>
      </div>
    </footer>
  );
}
