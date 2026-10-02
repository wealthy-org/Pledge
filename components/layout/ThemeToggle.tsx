'use client';

import React, { useEffect, useState } from 'react';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'auto';
}

export function ThemeToggle({ className = '', variant = 'auto' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = (mode: 'light' | 'dark') => {
    setTheme(mode);
    document.documentElement.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('pledge:theme');
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      applyTheme(initial);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('pledge:theme', next);
    applyTheme(next);
  };

  const baseStyles =
    variant === 'sidebar'
      ? 'text-[#d7e6d9] hover:bg-[#ffffff1c] hover:text-white'
      : 'bg-[#f0f4f2] dark:bg-[#14221e] border border-[#e1ebe6] dark:border-[#1e332c] text-[#315949] dark:text-[#a3c4b6] hover:text-[#142d2b] dark:hover:text-[#f0f6fc] hover:border-[#b7d4c9] dark:hover:border-emerald-500/40 shadow-xs';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className={`flex items-center justify-center w-[38px] h-[38px] rounded-xl transition-all cursor-pointer select-none ${baseStyles} ${className}`}
    >
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
