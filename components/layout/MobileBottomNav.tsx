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
  icon: string;
}

const NAV_LINKS: MobileNavItem[] = [
  { name: 'Markets', href: '/', icon: '🏛️' },
  { name: 'Borrow', href: '/borrow', icon: '⚡' },
  { name: 'Lend', href: '/lend', icon: '💰' },
  { name: 'Portfolio', href: '/portfolio', icon: '📊' },
  { name: 'Activity', href: '/activity', icon: '📜' },
];

export function MobileBottomNav({ onSearchClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/95 dark:bg-[#0d1714]/95 backdrop-blur-md border-t border-[#e1ebe6] dark:border-[#1e332c] flex items-center justify-around px-2 shadow-lg transition-colors duration-150"
    >
      {NAV_LINKS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.name}
            aria-current={isActive ? 'page' : undefined}
            data-active={isActive ? 'true' : 'false'}
            className={`flex flex-col items-center justify-center min-w-[46px] py-1 px-1.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-[var(--primary)] dark:text-emerald-400 font-bold bg-[#edf7f2] dark:bg-[#192b25]'
                : 'text-[#61736b] dark:text-[#8b9e95] hover:text-[#142d2b] dark:hover:text-white'
            }`}
          >
            <span className="text-lg leading-none mb-1">{item.icon}</span>
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onSearchClick}
        aria-label="Search"
        className="flex flex-col items-center justify-center min-w-[50px] py-1 px-2 rounded-xl text-[#61736b] dark:text-[#8b9e95] hover:text-[#142d2b] dark:hover:text-white transition-all cursor-pointer"
      >
        <span className="text-lg leading-none mb-1">🔍</span>
        <span className="text-[10px] tracking-tight">Search</span>
      </button>
    </nav>
  );
}
