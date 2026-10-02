'use client';

import React from 'react';

export interface NavigationProgressBarProps {
  isNavigating?: boolean;
  className?: string;
}

export function NavigationProgressBar({ isNavigating = false, className = '' }: NavigationProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label="Page navigation progress"
      aria-hidden={!isNavigating}
      className={`fixed top-0 left-0 right-0 h-[2.5px] z-[9999] pointer-events-none transition-opacity duration-300 ${
        isNavigating ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-400 w-full animate-[progress_1.2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(33,78,59,0.6)]" />
    </div>
  );
}
