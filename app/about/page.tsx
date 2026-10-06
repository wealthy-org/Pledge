import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'About Pledge | Non-Custodial P2P NFT Lending',
  description: 'Learn about Pledge, a decentralized peer-to-peer NFT lending protocol with fixed rates, zero oracle dependencies, and smart contract escrow.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 px-4 sm:px-6">
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-soft)] border border-[var(--primary)] text-[var(--primary)] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          Decentralized P2P Lending Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
          About Pledge
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl leading-relaxed">
          Pledge is a non-custodial, fixed-rate peer-to-peer NFT lending protocol built for maximum security, zero oracle risk, and transparent on-chain capital allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-lg">
            <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">Zero Oracle Risk</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Pledge does not rely on price oracles or liquidation cascades. Loan terms are strictly agreed between lender and borrower with predetermined durations and fixed interest.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-lg">
            <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">Instant Escrow</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Borrowers accept open collection offers instantly. Collateral NFTs and loan principal are locked securely in the audited smart contract until settlement.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-lg">
            <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">Permissionless Markets</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Anyone can create lending offers on any verified ERC-721 collection or borrow liquidity against their verified assets with full custody guarantee.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-6">
        <h2 className="text-xl font-bold text-[var(--text)]">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">For Lenders</div>
            <h4 className="text-sm font-semibold text-[var(--text)]">Earn Fixed Yield on Capital</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Deposit ETH into an offer specifying your desired interest rate and loan duration. If repaid, you earn your principal plus interest. If default occurs, you claim the underlying NFT.
            </p>
            <div className="pt-2">
              <Link href="/lend">
                <Button variant="secondary" size="sm" className="inline-flex items-center gap-1.5">
                  Explore Lending
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">For Borrowers</div>
            <h4 className="text-sm font-semibold text-[var(--text)]">Unlock Instant Liquidity</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Use your NFTs as collateral to borrow ETH instantly without selling your assets. Repay before the due date to reclaim your exact NFT.
            </p>
            <div className="pt-2">
              <Link href="/borrow">
                <Button variant="primary" size="sm" className="inline-flex items-center gap-1.5">
                  Borrow Liquidity
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--panel)] border border-[var(--line)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">Ready to get started?</h3>
          <p className="text-xs text-[var(--muted)]">Connect your Web3 wallet and explore available lending markets.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="secondary" size="sm">
              View Markets
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="primary" size="sm">
              Explore Collections
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
