'use client';

import React from 'react';
import { formatUnits } from 'viem';
import { Badge, type BadgeStatus } from '@/components/ui/Badge';
import { getCollectionByAddress } from '@/config/collections';
import { getExplorerTxUrl } from '@/config/chains';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import type { ActivityItem } from '@/types/api';

export interface ActivityItemRowProps {
  activity: ActivityItem;
  chainId?: number;
}

export function ActivityItemRow({
  activity,
  chainId,
}: ActivityItemRowProps) {
  const safeChainId = useSafeChainId();
  const activeChainId = chainId ?? safeChainId;
  const rawCollection =
    (activity.data?.collection as string) ||
    (activity.data?.collectionAddress as string) ||
    activity.contractAddress;
  const colDef = getCollectionByAddress(rawCollection, activeChainId);
  const collectionName =
    (activity.data?.collectionName as string) ||
    colDef?.name ||
    (rawCollection && rawCollection.length >= 10
      ? `${rawCollection.slice(0, 6)}...${rawCollection.slice(-4)}`
      : 'Verified Collection');

  const txUrl = getExplorerTxUrl(activity.txHash, activeChainId);

  const getEventBadge = () => {
    switch (activity.eventType) {
      case 'OfferCreated':
        return <Badge status="open">Offer Created</Badge>;
      case 'LoanStarted':
        return <Badge status="active">Loan Started</Badge>;
      case 'LoanRepaid':
        return <Badge status="repaid">Loan Repaid</Badge>;
      case 'LoanForeclosed':
        return <Badge status="foreclosed">Loan Foreclosed</Badge>;
      case 'OfferCancelled':
        return <Badge status="cancelled">Offer Cancelled</Badge>;
      default:
        return <Badge status="open">{activity.eventType as BadgeStatus}</Badge>;
    }
  };

  const getPrincipalEth = () => {
    const rawWei =
      (activity.data.principalWei as string) ||
      (activity.data.repaymentAmountWei as string) ||
      '0';
    return `${Number(formatUnits(BigInt(rawWei), 18)).toFixed(2)} ETH`;
  };

  const getActorDisplay = () => {
    const lender = activity.data.lender as string | undefined;
    const borrower = activity.data.borrower as string | undefined;

    if (borrower) {
      return `Borrower: ${borrower.slice(0, 6)}...${borrower.slice(-4)}`;
    }
    if (lender) {
      return `Lender: ${lender.slice(0, 6)}...${lender.slice(-4)}`;
    }
    return '';
  };

  const tokenId = activity.data.tokenId as string | undefined;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      data-testid="activity-row"
      className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--raised)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex-shrink-0">{getEventBadge()}</div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-[var(--text)] truncate">
            <span>{collectionName}</span>
            {tokenId && (
              <span className="font-mono text-violet-600 dark:text-violet-400 text-xs font-semibold">
                #{tokenId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[var(--muted)] font-mono">
            <span>{getActorDisplay()}</span>
            <span>•</span>
            <span>{formatDate(activity.timestamp)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 font-mono text-xs">
        <div className="text-left sm:text-right">
          <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] block">
            Value
          </span>
          <span className="font-bold text-[var(--text)]">{getPrincipalEth()}</span>
        </div>

        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View transaction on Blockscout"
          className="p-2 rounded-lg bg-[var(--panel)] border border-[var(--line)] hover:bg-[var(--raised)] text-sky-600 dark:text-sky-400 hover:border-sky-500/40 transition-colors"
        >
          TX ↗
        </a>
      </div>
    </div>
  );
}
