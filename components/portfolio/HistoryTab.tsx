'use client';

import React from 'react';
import { formatUnits } from 'viem';
import { Badge, type BadgeStatus } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
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
  status: BadgeStatus;
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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (historyEntries.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <EmptyState
          title="No Transaction History"
          description="You have no settled loans or closed offers recorded yet."
        />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--panel)] border-b border-[var(--line)] text-[9px] font-mono uppercase tracking-[1.5px] text-[var(--muted)]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Activity</th>
              <th className="py-3.5 px-4 font-semibold">Your Role</th>
              <th className="py-3.5 px-4 font-semibold">Principal</th>
              <th className="py-3.5 px-4 font-semibold">Date</th>
              <th className="py-3.5 px-4 font-semibold">Outcome</th>
              <th className="py-3.5 px-4 font-semibold text-right">Proof</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line)]">
            {historyEntries.map((entry, idx) => {
              const txUrl = getExplorerTxUrl(entry.txHash, chainId);

              return (
                <tr key={`${entry.id}-${idx}`} className="hover:bg-[#F0F7F7] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    {entry.id}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--muted)]">
                    {entry.role}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    {entry.principalEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    {formatDate(entry.date)}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={entry.status}>{entry.status}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-[var(--primary)] hover:underline decoration-dotted"
                    >
                      TX ↗
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
