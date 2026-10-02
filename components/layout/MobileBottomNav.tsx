'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavItem {
  name: string;
  href: string;
  icon: string;
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { name: 'Markets', href: '/', icon: '🏛️' },
  { name: 'Lend', href: '/lend', icon: '💰' },
  { name: 'Borrow', href: '/borrow', icon: '⚡' },
  { name: 'Portfolio', href: '/portfolio', icon: '📊' },
  { name: 'Activity', href: '/activity', icon: '📜' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#214E3B] border-t border-[#316950] text-[#D7E6D9] flex items-center justify-around px-2 shadow-2xl"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.name}
            data-active={isActive ? 'true' : 'false'}
            className={`flex flex-col items-center justify-center min-w-[54px] py-1 px-2 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-white font-bold bg-[#ffffff1c]'
                : 'text-[#A5C9B3] hover:text-white'
            }`}
          >
            <span className="text-lg leading-none mb-1">{item.icon}</span>
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
