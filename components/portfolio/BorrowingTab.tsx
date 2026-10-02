'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';
import { getCollectionByAddress } from '@/config/collections';
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
  const router = useRouter();
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
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const calculateTotalDue = (principalWei: string, interestWei: string) => {
    const total = BigInt(principalWei) + BigInt(interestWei || '0');
    return `${Number(formatUnits(total, 18)).toFixed(2)} ETH`;
  };

  if (userBorrowingLoans.length === 0) {
    return (
      <div className="py-16 px-6 border border-dashed border-[#e1e8e9] rounded-xl text-center">
        <div className="text-3xl text-[var(--lime)] mb-2 font-mono">◈</div>
        <h3 className="text-base font-medium text-[#142d2b]">Your next move starts here.</h3>
        <p className="text-xs text-[var(--muted)] mt-1 mb-4">
          Borrow against a verified NFT to see your active loan positions here.
        </p>
        <Link
          href="/borrow"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#edf7f2] hover:bg-[#e1f1e9] border border-[#cfe4dc] text-[#142d2b] text-xs font-semibold transition-colors"
        >
          <span>Explore your NFTs</span>
          <span>↗</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {userBorrowingLoans.map((loan) => {
        const col = getCollectionByAddress(loan.collection, 46630);
        const principalEth = `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`;
        const totalDueEth = calculateTotalDue(loan.principalWei, loan.interestWei);
        const tokenId = loan.tokenId || (loan as unknown as { nftId?: string }).nftId || '0';

        return (
          <article
            key={loan.loanId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-[#dee7e3] hover:border-[#b7d4c9] rounded-xl transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg bg-[#f4f7f5] border border-[#dee7e3] overflow-hidden flex items-center justify-center shrink-0">
                {col?.imageUrl ? (
                  <Image
                    src={col.imageUrl}
                    alt={col.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="font-mono font-bold text-xs text-[#214e3b]">
                    #{tokenId}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#142d2b]">
                  {col?.name || 'Curated NFT'} <span>#{tokenId}</span>
                </h3>
                <span className="inline-block text-[9px] px-2 py-0.5 mt-1 rounded bg-[#e5f4ec] text-[var(--lime)] font-medium">
                  Loan · {loan.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:gap-8 justify-between sm:justify-end">
              <div>
                <small className="text-[9px] text-[var(--muted)] block">Principal</small>
                <strong className="text-xs font-mono font-semibold text-[#142d2b]">
                  {principalEth}
                </strong>
              </div>

              <div>
                <small className="text-[9px] text-[var(--muted)] block">Repayment</small>
                <strong className="text-xs font-mono font-semibold text-[#184b3b]">
                  {totalDueEth}
                </strong>
              </div>

              <div>
                <small className="text-[9px] text-[var(--muted)] block">Due date</small>
                <strong className="text-xs font-mono font-normal text-[var(--muted)]">
                  {formatDate(loan.dueAt)}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onRepay) {
                    onRepay(loan);
                  } else {
                    router.push(`/loan/${loan.loanId}`);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Repay
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
