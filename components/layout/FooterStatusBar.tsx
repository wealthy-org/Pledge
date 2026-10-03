'use client';

import React, { useState, useEffect } from 'react';
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

  const [ethPrice, setEthPrice] = useState<string>('$2,680.50');
  const [gasPrice, setGasPrice] = useState<string>('12 Gwei');

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/stats/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (data.ethPriceUsd) {
            setEthPrice(`$${Number(data.ethPriceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          }
          if (data.gasPriceGwei) {
            setGasPrice(`${data.gasPriceGwei} Gwei`);
          }
        }
      } catch {}
    };

    fetchTelemetry();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchTelemetry();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const isSupportedChain = chainId === TESTNET_CHAIN_ID || chainId === 4663;
  const activeChain = getActiveChain(isSupportedChain ? chainId : undefined);
  const explorerUrl = activeChain.blockExplorers?.default.url || 'https://explorer.testnet.chain.robinhood.com';

  return (
    <footer
      className="hidden md:flex fixed bottom-0 left-0 md:left-[var(--rail-width)] right-0 h-[var(--footer-bar-height)] z-30 bg-white dark:bg-[#09100e] border-t border-[#e1ebe6] dark:border-[#182c24] px-4 items-center justify-between text-[10px] text-[#556e64] dark:text-[#8b9e95] select-none shadow-xs transition-colors duration-150"
      data-testid="footer-status-bar"
    >
      <div className="flex items-center gap-2 truncate">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
        <span className="font-medium text-[#142d2b] dark:text-[#f0f6fc]">{activeChain.name}</span>
        <span className="text-[#d0dbd3] dark:text-[#1e332c]">|</span>
        <span className="font-mono text-[#556e64] dark:text-[#8b9e95]">
          {mounted && blockNumber
            ? `Block #${blockNumber.toString()} · Synced`
            : isBlockLoading
            ? 'Syncing block...'
            : 'Block synced'}
        </span>
        <span className="text-[#d0dbd3] dark:text-[#1e332c]">|</span>
        <span className="font-mono font-medium text-amber-600 dark:text-amber-400">ETH: {ethPrice}</span>
        <span className="text-[#d0dbd3] dark:text-[#1e332c]">|</span>
        <span className="font-mono font-medium text-violet-600 dark:text-violet-400">Gas: {gasPrice}</span>
        <span className="text-[#d0dbd3] dark:text-[#1e332c]">|</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">Non-Custodial Smart Contract Escrow</span>
      </div>

      <div className="flex items-center gap-4 text-[10px]">
        <span className="hidden lg:inline text-[#8a9d90] dark:text-[#8b9e95]">Fixed Rate P2P NFT Lending</span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Blockscout Explorer"
          className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
        >
          <span>Blockscout Explorer</span>
          <span>↗</span>
        </a>
        <Link href="/activity" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
          About Pledge ↗
        </Link>
      </div>
    </footer>
  );
}
