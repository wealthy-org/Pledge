'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-between p-6 sm:p-12 select-none">
      <div className="w-full max-w-4xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--lime)] flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="font-bold text-base tracking-tight text-[var(--text)]">
            Pledge
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Return to App</span>
        </Link>
      </div>

      <div className="relative max-w-lg w-full my-auto py-8 text-center space-y-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--panel)] border border-[var(--line)] text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>404 · Page Not Found</span>
          </div>

          <div className="text-7xl sm:text-8xl font-black tracking-tighter text-[var(--text)] select-none">
            404
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              Lost in the liquidity matrix.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
              The page, collection address, or loan contract you are trying to reach does not exist or has been relocated on Robinhood Chain.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--lime)] hover:bg-[#076b4d] text-white text-xs font-semibold transition-all duration-150 shadow-md hover:shadow-lg"
            >
              <span>Back to Markets</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--panel)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--text)] text-xs font-semibold transition-all duration-150"
            >
              <span>Explore Collections</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl text-center text-[11px] text-[var(--muted)] pt-6 border-t border-[var(--line)]">
        Pledge Protocol · Fixed-Rate Peer-to-Peer NFT Lending Marketplace
      </div>
    </div>
  );
}
