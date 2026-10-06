'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { truncateAddress } from '@/lib/web3/wallet';
import { getExplorerAddressUrl } from '@/config/chains';

export interface WalletDropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  chainId: number;
  onDisconnect: () => void;
  ethBalance?: string;
  className?: string;
}

export function WalletDropdownMenu({
  isOpen,
  onClose,
  address,
  chainId,
  onDisconnect,
  ethBalance,
  className = '',
}: WalletDropdownMenuProps) {
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const explorerUrl = getExplorerAddressUrl(address, chainId);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      className={`absolute right-0 top-full mt-2 z-50 w-64 p-2 bg-white dark:bg-[#111a17] border border-[#e6ece9] dark:border-[#1e332c] rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-150 ${className}`}
    >
      <div className="p-3 bg-[#f4f7f5] dark:bg-[#14221e] rounded-xl border border-[#dee7e3] dark:border-[#1e332c] mb-2">
        <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-[var(--muted)]">
          <span>Connected Account</span>
          {ethBalance && <span className="font-semibold text-emerald-600 dark:text-emerald-400">{ethBalance} ETH</span>}
        </div>
        <div className="font-mono text-xs font-bold text-[#142d2b] dark:text-[#f0f6fc] truncate mt-1">
          {truncateAddress(address)}
        </div>
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy Address"
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#2c3e38] dark:text-[#f0f6fc] hover:bg-[#edf7f2] dark:hover:bg-[#192b25] rounded-lg transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-[var(--muted)]">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy Address</span>
          </div>
          {copied && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Copied!</span>}
        </button>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          aria-label="View on Explorer"
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#2c3e38] dark:text-[#f0f6fc] hover:bg-[#edf7f2] dark:hover:bg-[#192b25] rounded-lg transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-[var(--muted)]">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20" />
            </svg>
            <span>View on Explorer</span>
          </div>
          <svg className="w-3.5 h-3.5 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </a>

        <Link
          href="/portfolio"
          onClick={onClose}
          aria-label="My Portfolio"
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#2c3e38] dark:text-[#f0f6fc] hover:bg-[#edf7f2] dark:hover:bg-[#192b25] rounded-lg transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-[var(--muted)]">
              <rect x="3" y="7" width="18" height="14" rx="3" />
              <path d="M8 7V4h8v3" />
            </svg>
            <span>My Portfolio</span>
          </div>
          <svg className="w-3.5 h-3.5 text-[var(--muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="border-t border-[#e6ece9] dark:border-[#1e332c] my-1 pt-1">
        <button
          type="button"
          onClick={() => {
            onDisconnect();
            onClose();
          }}
          aria-label="Disconnect"
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer text-left font-medium"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
