'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
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

const KNOWN_ROUTES = new Set([
  '/',
  '/about',
  '/activity',
  '/borrow',
  '/explore',
  '/lend',
  '/portfolio',
]);

function isKnownRoute(pathname: string | null): boolean {
  if (!pathname) return true;
  if (KNOWN_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/collection/') && pathname.length > '/collection/'.length) return true;
  if (pathname.startsWith('/loan/') && pathname.length > '/loan/'.length) return true;
  return false;
}

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isKnown = isKnownRoute(pathname);

  const [searchOpen, setSearchOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const [isMobileActivityOpen, setIsMobileActivityOpen] = useState(false);

  useSearchShortcut(() => setSearchOpen(true));

  if (!isKnown) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-150">
        <NavigationProgressBar />
        <main id="main-content" className="w-full min-h-screen">
          {children}
        </main>
      </div>
    );
  }

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
      <HeaderBar
        onSearchClick={() => setSearchOpen(true)}
        onActivityClick={() => setIsMobileActivityOpen(true)}
      />

      <main
        id="main-content"
        className={`app-main-content w-full ${
          isActivityOpen ? 'app-main-activity-open' : 'app-main-activity-collapsed'
        }`}
      >
        <div
          className={`mx-auto w-full transition-all duration-200 ${
            isActivityOpen ? 'max-w-[1440px]' : 'max-w-[1720px]'
          }`}
        >
          {children}
        </div>
      </main>

      <ActivityPanel
        isOpen={isActivityOpen}
        onToggle={() => setIsActivityOpen((prev) => !prev)}
        isMobileOpen={isMobileActivityOpen}
        onMobileClose={() => setIsMobileActivityOpen(false)}
      />
      <FooterStatusBar />
      <MobileBottomNav onSearchClick={() => setSearchOpen(true)} />

      {searchOpen && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </div>
  );
}
