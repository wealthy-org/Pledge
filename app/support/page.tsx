'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Escrow & Security',
    question: 'How does escrow work when I accept a borrow offer?',
    answer:
      'When you accept a borrow offer, your ERC-721 NFT is transferred directly into the PledgeLoans immutable smart contract escrow in the exact same atomic transaction where you receive your ETH loan. The NFT remains safely locked in the contract until you repay the principal plus fixed term interest, or until the loan passes the due timestamp without repayment.',
  },
  {
    category: 'Escrow & Security',
    question: 'Is there any price liquidation or oracle risk during the loan?',
    answer:
      'No. Pledge operates with zero price-based liquidations and zero oracle dependency. Even if the NFT floor price fluctuates drastically, your loan terms, interest rate, and due date remain 100% fixed and immutable. You can never be liquidated early due to floor price drops.',
  },
  {
    category: 'Repayment & Foreclosure',
    question: 'What happens if a loan passes its due date without repayment?',
    answer:
      'If a loan is not repaid before the exact due timestamp (dueAt), the status shifts to Overdue. Once overdue, the lender has the unilateral right to call the foreclose function on-chain, transferring the collateral NFT to their designated wallet. The borrower keeps the borrowed ETH permanently.',
  },
  {
    category: 'Lending & Yield',
    question: 'How do lenders earn yield on Pledge?',
    answer:
      'Lenders create collection-wide or item offers by committing native ETH with custom duration (7, 14, or 30 days) and fixed term interest rates (in basis points). When a borrower accepts the offer, the loan starts. Upon full repayment, the lender claims their principal plus interest minus the protocol fee via the pull-payment withdrawProceeds function.',
  },
  {
    category: 'Supported Networks',
    question: 'Which blockchain networks and tokens are supported?',
    answer:
      'Pledge currently operates exclusively on Robinhood Chain (Testnet Chain ID 46630 and Mainnet Chain ID 4663). Native ETH is used for all loan funding and repayment, and standard ERC-721 NFT collections are supported as collateral.',
  },
  {
    category: 'Fees',
    question: 'What is the protocol fee and how is it calculated?',
    answer:
      'The protocol fee is taken solely from the lender’s earned interest upon successful repayment. The fee rate is snapshotted at the exact time an offer is created and will never change for that loan even if protocol fees are adjusted later.',
  },
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Escrow & Security', 'Repayment & Foreclosure', 'Lending & Yield', 'Supported Networks', 'Fees'];

  const filteredFaqs =
    activeCategory === 'All'
      ? FAQS
      : FAQS.filter((f) => f.category === activeCategory);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Support & Knowledge Base
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
          How can we help you?
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl">
          Everything you need to know about peer-to-peer NFT backed lending, atomic smart contract escrow, and risk management on Robinhood Chain.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-2 hover:border-[var(--line-strong)] transition-colors">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-[var(--text)]">Atomic Escrow</h2>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            NFTs are locked in non-custodial smart contracts. No human or protocol admin can access your collateral during an active loan.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-2 hover:border-[var(--line-strong)] transition-colors">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-[var(--text)]">Zero Oracle Risk</h2>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Borrow rates and payback deadlines are mathematically fixed at loan inception. Zero flash crash liquidations.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--line)] space-y-2 hover:border-[var(--line-strong)] transition-colors">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-[var(--text)]">Pull-Payment Safety</h2>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Lender payouts and protocol fees use pull-payments to prevent malicious contract reverts from blocking liquidations.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <h2 className="text-xl font-bold text-[var(--text)]">Frequently Asked Questions</h2>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[var(--text)] hover:bg-[var(--panel)] transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <span className="shrink-0 text-[var(--muted)]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--muted)] leading-relaxed border-t border-[var(--line)]/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] space-y-4">
        <h2 className="text-lg font-bold text-[var(--text)]">Official Community & Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://discord.gg/pledge"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <span>Discord Community</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--muted)]">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
          <a
            href="https://twitter.com/pledge_fi"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <span>Twitter / X Updates</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--muted)]">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
          <Link
            href="/activity"
            className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <span>Live Protocol Activity</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[var(--muted)]">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
