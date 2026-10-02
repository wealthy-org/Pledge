'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { FooterStatusBar } from './FooterStatusBar';
import { truncateAddress } from '@/lib/web3/wallet';
import { useMounted } from '@/lib/hooks/useMounted';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Markets', href: '/', icon: '🏛️' },
  { name: 'Lend', href: '/lend', icon: '💰' },
  { name: 'Borrow', href: '/borrow', icon: '⚡' },
  { name: 'Collections', href: '/collections', icon: '🖼️' },
  { name: 'Portfolio', href: '/portfolio', icon: '📊' },
  { name: 'Activity', href: '/activity', icon: '📜' },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const mounted = useMounted();

  const getGradientFromAddress = (addr?: string) => {
    if (!addr) return 'from-emerald-600 to-teal-500';
    const charCode = addr.charCodeAt(2) || 0;
    if (charCode % 3 === 0) return 'from-emerald-500 to-teal-400';
    if (charCode % 3 === 1) return 'from-teal-500 to-cyan-400';
    return 'from-emerald-600 to-green-400';
  };

  return (
    <aside
      aria-label="Sidebar Navigation"
      data-expanded={expanded ? 'true' : 'false'}
      className={`hidden md:flex fixed left-0 top-0 bottom-0 z-40 bg-[#214E3B] text-[#D7E6D9] flex-col justify-between transition-all duration-200 ease-in-out select-none ${
        expanded ? 'w-[var(--rail-expanded-width)]' : 'w-[var(--rail-width)]'
      }`}
    >
      <div className="flex flex-col flex-1">
        <div className="h-[var(--header-height)] flex items-center px-4 justify-between border-b border-[#316950]">
          <Link href="/" className="flex items-center gap-3 overflow-hidden" aria-label="Pledge Home">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0">
              P
            </div>
            {expanded && (
              <div className="flex flex-col animate-in fade-in duration-150">
                <span className="font-bold text-white tracking-tight text-base leading-none">
                  PLEDGE
                </span>
                <span className="text-[10px] text-[#A5C9B3] font-mono mt-0.5">
                  Robinhood EVM
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-lg text-[#A5C9B3] hover:text-white hover:bg-[#2d634c] transition-colors cursor-pointer"
          >
            {expanded ? '◀' : '▶'}
          </button>
        </div>

        <nav aria-label="Main Navigation" className="flex-1 py-4 flex flex-col gap-1.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                data-active={isActive ? 'true' : 'false'}
                className={`flex items-center rounded-lg transition-all duration-150 group cursor-pointer ${
                  expanded ? 'px-3.5 py-2.5 gap-3' : 'justify-center py-2.5 px-0'
                } ${
                  isActive
                    ? 'bg-[#ffffff1c] text-white border-l-[3px] border-[var(--primary)] font-semibold shadow-xs'
                    : 'text-[#D7E6D9] hover:bg-[#2a5d47] hover:text-white'
                }`}
              >
                <span className="text-lg shrink-0 w-6 h-6 flex items-center justify-center">
                  {item.icon}
                </span>
                {expanded && (
                  <span className="text-xs font-medium tracking-tight truncate">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col">
        {mounted && isConnected && address && (
          <div
            data-testid="sidebar-wallet-avatar"
            className={`p-3 border-t border-[#316950] flex items-center gap-2.5 ${
              expanded ? 'px-3.5' : 'justify-center'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getGradientFromAddress(
                address
              )} flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-xs shrink-0`}
            >
              {address.slice(2, 4).toUpperCase()}
            </div>
            {expanded && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-mono text-white font-medium truncate">
                  {truncateAddress(address)}
                </span>
                <span className="text-[10px] text-[#A5C9B3] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Connected
                </span>
              </div>
            )}
          </div>
        )}

        <FooterStatusBar />
      </div>
    </aside>
  );
}
