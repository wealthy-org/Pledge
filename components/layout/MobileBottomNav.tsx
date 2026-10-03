'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface MobileBottomNavProps {
  onSearchClick?: () => void;
}

interface MobileNavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_LINKS: MobileNavItem[] = [
  {
    name: 'Markets',
    href: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: 'Borrow',
    href: '/borrow',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M12 7v10m-4-4 4 4 4-4" />
      </svg>
    ),
  },
  {
    name: 'Lend',
    href: '/lend',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="m4 15 4-4 4 3 8-9M14 5h6v6M4 20h16" />
      </svg>
    ),
  },
  {
    name: 'Explore',
    href: '/explore',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="7" width="18" height="14" rx="3" />
        <path d="M8 7V4h8v3M3 12h18m-12 0v3h6v-3" />
      </svg>
    ),
  },
  {
    name: 'Activity',
    href: '/activity',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    ),
  },
];

export function MobileBottomNav({ onSearchClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[var(--surface)] border-t border-[var(--line)] flex items-center justify-around px-2 shadow-lg transition-colors duration-150"
    >
      {NAV_LINKS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const activeColorClass =
          item.href === '/borrow'
            ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30'
            : item.href === '/lend'
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
            : item.href === '/portfolio'
            ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
            : item.href === '/activity'
            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.name}
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive ? 'true' : 'false'}
            className={`flex flex-col items-center justify-center min-w-[46px] py-1 px-1.5 rounded-lg transition-colors border ${
              isActive
                ? `${activeColorClass} font-semibold shadow-xs`
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span className="mb-0.5">{item.icon}</span>
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onSearchClick}
        aria-label="Search"
        className="flex flex-col items-center justify-center min-w-[50px] py-1 px-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        <span className="mb-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <span className="text-[10px] tracking-tight">Search</span>
      </button>
    </nav>
  );
}
