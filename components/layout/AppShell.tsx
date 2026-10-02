'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { ActivityPanel } from './ActivityPanel';
import { FooterStatusBar } from './FooterStatusBar';
import { MobileBottomNav } from './MobileBottomNav';
import { NavigationProgressBar } from './NavigationProgressBar';
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-150">
      <NavigationProgressBar />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-lg focus:shadow-lg focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>

      <Sidebar />
      <HeaderBar onSearchClick={() => setSearchOpen(true)} />

      <main
        id="main-content"
        className="pt-[calc(var(--header-height)+20px)] pb-[calc(var(--footer-bar-height)+60px)] md:pb-[calc(var(--footer-bar-height)+30px)] md:pl-[calc(var(--rail-width)+24px)] pl-4 pr-4 xl:pr-[calc(var(--feed-width)+24px)] min-h-screen bg-[var(--bg)]"
      >
        <div className="max-w-[1440px] mx-auto">{children}</div>
      </main>

      <ActivityPanel />
      <FooterStatusBar />
      <MobileBottomNav onSearchClick={() => setSearchOpen(true)} />

      {searchOpen && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </div>
  );
}
