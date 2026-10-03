'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export interface NavigationProgressBarProps {
  isNavigating?: boolean;
}

export function NavigationProgressBar({ isNavigating }: NavigationProgressBarProps = {}) {
  let pathname: string | null = null;
  let searchParams: unknown = null;
  try {
    pathname = usePathname();
    searchParams = useSearchParams();
  } catch {
    pathname = null;
    searchParams = null;
  }

  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isNavigating !== undefined) return;
    setAnimating(true);
    const timeout = setTimeout(() => {
      setAnimating(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams, isNavigating]);

  const isActive = isNavigating !== undefined ? isNavigating : animating;

  return (
    <div
      role="progressbar"
      aria-label="Page navigation progress"
      aria-hidden={!isActive}
      data-testid="navigation-progress-bar"
      className={`fixed top-0 left-0 right-0 h-[2.5px] z-[9999] pointer-events-none transition-all duration-300 ${
        isActive
          ? 'opacity-100 bg-gradient-to-r from-emerald-500 via-sky-400 to-violet-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
          : 'opacity-0'
      }`}
    />
  );
}
