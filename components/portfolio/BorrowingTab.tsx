'use client';

import React from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { LoanItem } from '@/types/api';

export interface BorrowingTabProps {
  loans: LoanItem[];
  userAddress?: string;
  onRepay?: (loan: LoanItem) => void;
}

export function BorrowingTab({
  loans,
  userAddress,
  onRepay,
}: BorrowingTabProps) {
  const normalizedUser = userAddress?.toLowerCase();

  const userBorrowingLoans = loans.filter((loan) => {
    if (!normalizedUser) return false;
    const isBorrower = loan.borrower.toLowerCase() === normalizedUser;
    return isBorrower && loan.status === 'active';
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

  const calculateTotalDue = (principalWei: string, interestWei: string) => {
    const total = BigInt(principalWei) + BigInt(interestWei);
    return `${Number(formatUnits(total, 18)).toFixed(2)} ETH`;
  };

  if (userBorrowingLoans.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <EmptyState
          title="No Active Borrowings"
          description="You currently have no active or overdue collateral loans."
        />
        <div className="flex justify-center mt-4">
          <Link href="/borrow">
            <Button variant="primary" size="sm">
              Borrow Against NFTs
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
              <th className="py-3.5 px-4 font-semibold">Principal</th>
              <th className="py-3.5 px-4 font-semibold">Total Due</th>
              <th className="py-3.5 px-4 font-semibold">Due Date</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line)]">
            {userBorrowingLoans.map((loan) => {
              const principalEth = `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`;
              const totalDueEth = calculateTotalDue(loan.principalWei, loan.interestWei);

              return (
                <tr key={loan.loanId} className="hover:bg-[#F0F7F7] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    #{loan.loanId}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-[var(--primary)]">
                    #{loan.tokenId}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--text)]">
                    {principalEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    {totalDueEth}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                    {formatDate(loan.dueAt)}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={loan.status}>{loan.status}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    {onRepay ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onRepay(loan)}
                      >
                        Repay
                      </Button>
                    ) : (
                      <Link href={`/loan/${loan.loanId}`}>
                        <Button variant="primary" size="sm">
                          Repay
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
