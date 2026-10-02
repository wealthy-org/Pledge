'use client';

import React from 'react';
import { formatUnits } from 'viem';
import { getExplorerTxUrl, TESTNET_CHAIN_ID } from '@/config/chains';
import type { LoanItem, OfferItem } from '@/types/api';

export interface HistoryTabProps {
  loans: LoanItem[];
  offers: OfferItem[];
  userAddress?: string;
  chainId?: number;
}

interface HistoryEntry {
  id: string;
  type: 'Loan' | 'Offer';
  role: 'Borrower' | 'Lender';
  principalEth: string;
  status: string;
  date: string;
  txHash: string;
}

export function HistoryTab({
  loans,
  offers,
  userAddress,
  chainId = TESTNET_CHAIN_ID,
}: HistoryTabProps) {
  const normalizedUser = userAddress?.toLowerCase();

  const historyEntries: HistoryEntry[] = [];

  if (normalizedUser) {
    for (const loan of loans) {
      if (loan.status === 'repaid' || loan.status === 'foreclosed') {
        const isBorrower = loan.borrower.toLowerCase() === normalizedUser;
        const isLender = loan.lender.toLowerCase() === normalizedUser;

        if (isBorrower || isLender) {
          historyEntries.push({
            id: `Loan #${loan.loanId}`,
            type: 'Loan',
            role: isBorrower ? 'Borrower' : 'Lender',
            principalEth: `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`,
            status: loan.status,
            date: loan.dueAt,
            txHash: loan.txHash,
          });
        }
      }
    }

    for (const offer of offers) {
      if (offer.status === 'filled' || offer.status === 'cancelled') {
        if (offer.lender.toLowerCase() === normalizedUser) {
          historyEntries.push({
            id: `Offer #${offer.offerId}`,
            type: 'Offer',
            role: 'Lender',
            principalEth: `${Number(formatUnits(BigInt(offer.principalWei), 18)).toFixed(2)} ETH`,
            status: offer.status,
            date: offer.createdAt,
            txHash: offer.txHash,
          });
        }
      }
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoString;
    }
  };

  if (historyEntries.length === 0) {
    return (
      <div className="py-16 px-6 border border-dashed border-[#e1e8e9] rounded-xl text-center">
        <div className="text-3xl text-[var(--lime)] mb-2 font-mono">◈</div>
        <h3 className="text-base font-medium text-[#142d2b]">A fresh start.</h3>
        <p className="text-xs text-[var(--muted)] mt-1">
          Repaid loans and cancelled offers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {historyEntries.map((entry, idx) => {
        const txUrl = getExplorerTxUrl(entry.txHash, chainId);

        return (
          <article
            key={`${entry.id}-${idx}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-[#dee7e3] hover:border-[#b7d4c9] rounded-xl transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-[#f4f7f5] border border-[#dee7e3] flex items-center justify-center text-sm font-mono font-bold text-[#214e3b]">
                {entry.type === 'Loan' ? '⚡' : '💰'}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#142d2b]">{entry.id}</h3>
                <span
                  className={`inline-block text-[9px] px-2 py-0.5 mt-0.5 rounded font-medium ${
                    entry.status === 'repaid'
                      ? 'bg-[#e8f2fd] text-[#276fa6]'
                      : entry.status === 'cancelled'
                      ? 'bg-[#f4f6f7] text-[#8d8172]'
                      : 'bg-[#fee2e2] text-red-700'
                  }`}
                >
                  {entry.type} · {entry.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end">
              <div>
                <small className="text-[9px] text-[var(--muted)] block">Role</small>
                <strong className="text-xs font-mono font-medium text-[#142d2b]">
                  {entry.role}
                </strong>
              </div>

              <div>
                <small className="text-[9px] text-[var(--muted)] block">Principal</small>
                <strong className="text-xs font-mono font-semibold text-[#142d2b]">
                  {entry.principalEth}
                </strong>
              </div>

              <div>
                <small className="text-[9px] text-[var(--muted)] block">Date</small>
                <strong className="text-xs font-mono font-normal text-[var(--muted)]">
                  {formatDate(entry.date)}
                </strong>
              </div>

              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-[#e1e8e9] bg-white hover:bg-[#eef5fb] text-[#286a9b] text-xs font-semibold transition-colors"
              >
                Explorer ↗
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
