'use client';

import React from 'react';
import { useBlockNumber, useChainId } from 'wagmi';
import { getActiveChain } from '@/config/chains';
import { useMounted } from '@/lib/hooks/useMounted';

export function FooterStatusBar() {
  const chainId = useChainId();
  const mounted = useMounted();
  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({
    watch: true,
  });

  const activeChain = getActiveChain(chainId);
  const explorerUrl = activeChain.blockExplorers?.default.url || 'https://explorer.testnet.robinhood.com';

  return (
    <div
      className="h-[var(--footer-bar-height)] w-full border-t border-[#316950] px-3 flex items-center justify-between text-[11px] text-[#A5C9B3] font-mono select-none"
      data-testid="footer-status-bar"
    >
      <div className="flex items-center gap-2 truncate">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>ETH $3,450</span>
        </span>
        <span className="text-[#4D856B]">|</span>
        <span>12 GWEI</span>
        <span className="text-[#4D856B]">|</span>
        <span>
          {mounted && blockNumber
            ? `Block #${blockNumber.toString()}`
            : isBlockLoading
            ? 'Syncing...'
            : 'Block #--'}
        </span>
        <span className="text-[#4D856B]">|</span>
        <span className="text-emerald-300 font-medium">Synced</span>
      </div>

      <div className="flex items-center gap-2.5">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
          aria-label="Blockscout Explorer"
        >
          🔍
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
          aria-label="Twitter"
        >
          𝕏
        </a>
        <a
          href="https://discord.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
          aria-label="Discord"
        >
          👾
        </a>
      </div>
    </div>
  );
}
