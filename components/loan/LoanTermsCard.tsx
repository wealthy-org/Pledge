'use client';

import React from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Badge } from '@/components/ui/Badge';
import { getExplorerAddressUrl, getExplorerTxUrl, TESTNET_CHAIN_ID } from '@/config/chains';
import type { LoanItem } from '@/types/api';

export interface LoanTermsCardProps {
  loan: LoanItem;
  collectionName: string;
  imageUrl: string;
  chainId?: number;
}

export function LoanTermsCard({
  loan,
  collectionName,
  imageUrl,
  chainId = TESTNET_CHAIN_ID,
}: LoanTermsCardProps) {
  const principalEth = `${Number(formatUnits(BigInt(loan.principalWei), 18)).toFixed(2)} ETH`;
  const interestEth = `${Number(formatUnits(BigInt(loan.interestWei), 18)).toFixed(2)} ETH`;
  const totalDueBigInt = BigInt(loan.principalWei) + BigInt(loan.interestWei);
  const totalDueEth = `${Number(formatUnits(totalDueBigInt, 18)).toFixed(2)} ETH`;

  const borrowerTruncated = `${loan.borrower.slice(0, 6)}...${loan.borrower.slice(-4)}`;
  const lenderTruncated = `${loan.lender.slice(0, 6)}...${loan.lender.slice(-4)}`;
  const collectionTruncated = `${loan.collection.slice(0, 6)}...${loan.collection.slice(-4)}`;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const borrowerUrl = getExplorerAddressUrl(loan.borrower, chainId);
  const lenderUrl = getExplorerAddressUrl(loan.lender, chainId);
  const collectionUrl = getExplorerAddressUrl(loan.collection, chainId);
  const txUrl = getExplorerTxUrl(loan.txHash, chainId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]">
      <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-3">
        <div className="relative w-full aspect-square max-w-[280px] rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--raised)]">
          <Image
            src={imageUrl}
            alt={`${collectionName} #${loan.tokenId}`}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="w-full text-center space-y-1">
          <h3 className="font-bold text-base text-[var(--text)]">{collectionName}</h3>
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)] font-mono">
            <span>Token #{loan.tokenId}</span>
            <span>•</span>
            <a
              href={collectionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--primary)] underline decoration-dotted"
            >
              {collectionTruncated}
            </a>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
                Contract Reference
              </span>
              <h2 className="text-xl font-bold font-mono text-[var(--text)]">
                Loan #{loan.loanId}
              </h2>
            </div>
            <Badge status={loan.status}>{loan.status}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
            <div>
              <span className="text-[9px] uppercase font-mono text-[var(--muted)] block">
                Principal
              </span>
              <span className="text-base font-bold font-mono text-[var(--text)]">
                {principalEth}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase font-mono text-[var(--muted)] block">
                Term Interest
              </span>
              <span className="text-base font-bold font-mono text-[var(--text)]">
                {interestEth}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase font-mono text-[var(--muted)] block">
                Total Due
              </span>
              <span className="text-base font-bold font-mono text-[var(--primary)]">
                {totalDueEth}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Borrower</span>
              <a
                href={borrowerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text)] hover:text-[var(--primary)] underline decoration-dotted"
              >
                {borrowerTruncated}
              </a>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Lender</span>
              <a
                href={lenderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text)] hover:text-[var(--primary)] underline decoration-dotted"
              >
                {lenderTruncated}
              </a>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Origination Date</span>
              <span className="text-[var(--text)]">{formatDate(loan.startedAt)}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[var(--line)]">
              <span className="text-[var(--muted)]">Repayment Deadline</span>
              <span className="text-[var(--primary)] font-bold">{formatDate(loan.dueAt)}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs">
          <span className="text-[var(--muted)] font-mono">On-Chain Origination Proof:</span>
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on Blockscout"
            className="text-[var(--primary)] font-mono font-semibold hover:underline decoration-dotted"
          >
            View on Blockscout ↗
          </a>
        </div>
      </div>
    </div>
  );
}
