'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { ActivityPanel } from './ActivityPanel';
import { MobileBottomNav } from './MobileBottomNav';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';

const GlobalSearch = dynamic(
  () => import('@/components/ui/GlobalSearch').then((mod) => mod.GlobalSearch),
  { ssr: false }
);

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  useSearchShortcut(() => setSearchOpen(true));

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-lg focus:shadow-lg focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div className="flex flex-col flex-1 md:pl-[var(--rail-width)] pl-0 pb-16 md:pb-0 transition-all duration-200">
        <HeaderBar onSearchClick={() => setSearchOpen(true)} />

        <div className="flex flex-1 overflow-hidden">
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>

          <ActivityPanel />
        </div>
      </div>

      <MobileBottomNav />

      {searchOpen && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </div>
  );
}
