'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConnection } from 'wagmi';
import { truncateAddress } from '@/lib/web3/wallet';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useMounted } from '@/hooks/useMounted';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Markets',
    href: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="m3 10 9-7 9 7v10H6V10m4 10v-7h5v7" />
      </svg>
    ),
  },
  {
    name: 'Borrow',
    href: '/borrow',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M12 7v10m-4-4 4 4 4-4" />
      </svg>
    ),
  },
  {
    name: 'Lend',
    href: '/lend',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="m4 15 4-4 4 3 8-9M14 5h6v6M4 20h16" />
      </svg>
    ),
  },
  {
    name: 'Explore',
    href: '/explore',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <rect x="3" y="7" width="18" height="14" rx="3" />
        <path d="M8 7V4h8v3M3 12h18m-12 0v3h6v-3" />
      </svg>
    ),
  },
  {
    name: 'Activity',
    href: '/activity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { address, isConnected } = useConnection();
  const mounted = useMounted();

  return (
    <aside
      aria-label="Main navigation"
      data-expanded={isExpanded ? 'true' : 'false'}
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-[var(--rail-width)] z-40 bg-[var(--surface)] text-[var(--text)] border-r border-[var(--line)] flex-col items-center justify-between select-none transition-colors duration-150"
    >
      <div className="w-full flex flex-col items-center">
        <div className="w-full h-[var(--header-height)] flex items-center justify-center relative">
          <Link
            href="/"
            className="grid place-items-center text-[var(--accent-primary)] hover:opacity-90 transition-opacity"
            title="Pledge home"
            aria-label="Pledge home"
          >
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
              <path d="M5 27V5h12a8 8 0 0 1 0 16h-5v6H5Z" fill="currentColor" />
              <path d="M12 11h5a2 2 0 0 1 0 4h-5v-4Z" fill="var(--surface)" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label="Toggle sidebar"
            className="sr-only"
          >
            Toggle sidebar
          </button>
        </div>

        <nav aria-label="Main Navigation" className="flex flex-col gap-3 w-full items-center pt-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            const activeColorClass =
              item.href === '/borrow'
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                : item.href === '/lend'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : item.href === '/collections'
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30'
                : item.href === '/portfolio'
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                : item.href === '/activity'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                title={item.name}
                data-active={isActive ? 'true' : 'false'}
                className={`flex items-center justify-center w-11 h-11 rounded-lg transition-colors duration-150 cursor-pointer border ${
                  isActive
                    ? `${activeColorClass} shadow-xs`
                    : 'border-transparent text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]'
                }`}
              >
                {item.icon}
                <span className="sr-only">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="w-full flex flex-col items-center mb-6 gap-3">
        {mounted && isConnected && address && (
          <Link
            href="/portfolio"
            data-testid="sidebar-wallet-avatar"
            title={`Connected as ${truncateAddress(address)}`}
            className="w-8 h-8 rounded-md bg-[var(--panel)] border border-[var(--line)] flex items-center justify-center text-[10px] font-mono font-medium text-[var(--accent-primary)] hover:border-[var(--line-strong)] transition-colors"
          >
            {address.slice(2, 4).toUpperCase()}
          </Link>
        )}

        <ThemeToggle variant="sidebar" />

        <Link
          href="/activity"
          title="About & Help"
          aria-label="How it works"
          className="flex items-center justify-center w-11 h-11 rounded-lg text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.3.9-1.7 1.2-1.7 2.7m0 2.5v1" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
