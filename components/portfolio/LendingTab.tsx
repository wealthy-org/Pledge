'use client';

import React from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { LoanItem } from '@/types/api';

export interface LendingTabProps {
  loans: LoanItem[];
  userAddress?: string;
  onForeclose?: (loan: LoanItem) => void;
}

export function LendingTab({
  loans,
  userAddress,
  onForeclose,
}: LendingTabProps) {
  const normalizedUser = userAddress?.toLowerCase();

  const userLendingLoans = loans.filter((loan) => {
    if (!normalizedUser) return false;
    const isLender = loan.lender.toLowerCase() === normalizedUser;
    return isLender && loan.status === 'active';
  });

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

  if (userLendingLoans.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <EmptyState
          title="No Active Lending"
          description="You currently have no active capital deployed into borrower collateral loans."
        />
        <div className="flex justify-center mt-4">
          <Link href="/lend">
            <Button variant="primary" size="sm">
              Discover Loan Requests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--panel)] border-b border-[var(--line)] text-[9px] font-mono uppercase tracking-[1.5px] text-[var(--muted)]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Loan ID</th>
              <th className="py-3.5 px-4 font-semibold">Collateral</th>
              <th className="py-3.5 px-4 font-semibold">Borrower</th>
              <th className="py-3.5 px-4 font-semibold">Principal</th>
              <th className="py-3.5 px-4 font-semibold">Interest</th>
              <th className="py-3.5 px-4 font-semibold">Due Date</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line)]">
            {userLendingLoans.map((loan) => {
              const principalEth = `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`;
              const interestEth = `${Number(formatUnits(BigInt(loan.interestWei), 18)).toFixed(2)} ETH`;
              const borrowerTruncated = `${loan.borrower.slice(0, 6)}...${loan.borrower.slice(-4)}`;
              const isPastDue = new Date(loan.dueAt).getTime() < new Date().getTime();

              return (
                <tr key={loan.loanId} className="hover:bg-[#F0F7F7] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    #{loan.loanId}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-[var(--primary)]">
                    #{loan.tokenId}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    {borrowerTruncated}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--text)]">
                    {principalEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{interestEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    {formatDate(loan.dueAt)}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={loan.status}>{loan.status}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    {isPastDue && onForeclose ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onForeclose(loan)}
                      >
                        Foreclose
                      </Button>
                    ) : (
                      <Link href={`/loan/${loan.loanId}`}>
                        <Button variant="secondary" size="sm">
                          Details
                        </Button>
                      </Link>
                    )}
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
