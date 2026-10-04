'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center">
      <div className="relative max-w-xl w-full p-8 sm:p-10 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--panel)] border border-[var(--line)] text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>404 · Page Not Found</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
              Lost in the liquidity matrix.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
              The page, collection address, or loan contract you are trying to reach does not exist or has been relocated.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--lime)] hover:bg-[#076b4d] text-white text-xs font-semibold transition-all duration-150 shadow-sm"
            >
              <span>Back to Markets</span>
              <span>→</span>
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--panel)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--text)] text-xs font-semibold transition-all duration-150"
            >
              <span>Explore Collections</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-[var(--line)]">
            <div className="text-[11px] font-medium text-[var(--muted)] mb-3">
              Popular Destinations
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
              <Link
                href="/lend"
                className="p-2.5 rounded-lg bg-[var(--panel)] hover:border-[var(--line)] border border-transparent transition-all group card-hover-lift"
              >
                <div className="text-xs font-semibold text-[var(--text)] group-hover:text-emerald-500 transition-colors">
                  Lend ETH
                </div>
                <div className="text-[10px] text-[var(--muted)]">Earn fixed APR</div>
              </Link>

              <Link
                href="/borrow"
                className="p-2.5 rounded-lg bg-[var(--panel)] hover:border-[var(--line)] border border-transparent transition-all group card-hover-lift"
              >
                <div className="text-xs font-semibold text-[var(--text)] group-hover:text-emerald-500 transition-colors">
                  Borrow
                </div>
                <div className="text-[10px] text-[var(--muted)]">Pledge your NFTs</div>
              </Link>

              <Link
                href="/portfolio"
                className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-[var(--panel)] hover:border-[var(--line)] border border-transparent transition-all group card-hover-lift"
              >
                <div className="text-xs font-semibold text-[var(--text)] group-hover:text-emerald-500 transition-colors">
                  Portfolio
                </div>
                <div className="text-[10px] text-[var(--muted)]">Active loans & yield</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
