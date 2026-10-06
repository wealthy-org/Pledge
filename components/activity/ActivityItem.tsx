'use client';

import React from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { Badge, type BadgeStatus } from '@/components/ui/Badge';
import { NftImage } from '@/components/nft/NftImage';
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

  const symbol = colDef?.symbol || (activity.data?.symbol as string) || 'NFT';
  const imageUrl = colDef?.imageUrl || (activity.data?.imageUrl as string);

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

  const lender = activity.data.lender as string | undefined;
  const borrower = activity.data.borrower as string | undefined;
  const termInterestBps = activity.data.termInterestBps as number | undefined;
  const durationSeconds = activity.data.durationSeconds as number | undefined;
  const tokenId = activity.data.tokenId as string | undefined;

  const formatShortAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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

  const getDurationString = (sec?: number) => {
    if (!sec) return null;
    if (sec >= 86400) {
      const days = Math.round(sec / 86400);
      return `${days}d term`;
    }
    const hours = Math.round(sec / 3600);
    return `${hours}h term`;
  };

  const getAprString = (bps?: number) => {
    if (bps === undefined || bps === null) return null;
    return `${(bps / 100).toFixed(1)}% APR`;
  };

  return (
    <div
      data-testid="activity-row"
      className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--raised)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--panel)] border border-[var(--line)] shrink-0 flex items-center justify-center">
          <NftImage
            src={imageUrl}
            alt={collectionName}
            contractAddress={rawCollection}
            symbol={symbol}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="min-w-0 space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="shrink-0">{getEventBadge()}</div>
            <Link
              href={`/collection/${rawCollection}`}
              className="font-bold text-sm text-[var(--text)] hover:text-[var(--primary)] transition-colors truncate max-w-[200px] sm:max-w-xs"
              title={collectionName}
            >
              {collectionName}
            </Link>
            {tokenId && (
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--panel)] text-violet-600 dark:text-violet-400 border border-[var(--line)]">
                #{tokenId}
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--panel)] text-[var(--muted)] border border-[var(--line)]">
              {symbol}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-[var(--muted)] font-mono flex-wrap">
            {lender && (
              <span className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-sans text-[var(--muted)]">Lender:</span>
                <span className="text-[var(--text)] font-semibold">{formatShortAddress(lender)}</span>
              </span>
            )}
            {lender && borrower && <span>•</span>}
            {borrower && (
              <span className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-sans text-[var(--muted)]">Borrower:</span>
                <span className="text-[var(--text)] font-semibold">{formatShortAddress(borrower)}</span>
              </span>
            )}
            {(lender || borrower) && <span>•</span>}
            <span title={activity.timestamp}>{formatDate(activity.timestamp)}</span>
            {activity.blockNumber > 0 && (
              <>
                <span>•</span>
                <span className="text-[10px] text-[var(--muted)]">Block #{activity.blockNumber}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-5 font-mono text-xs pt-2 md:pt-0 border-t md:border-t-0 border-[var(--line)]/60 shrink-0">
        {(termInterestBps !== undefined || durationSeconds !== undefined) && (
          <div className="text-left md:text-right hidden sm:block">
            <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] block">
              Terms
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-[var(--text)] text-xs">
              {getAprString(termInterestBps) && <span>{getAprString(termInterestBps)}</span>}
              {getAprString(termInterestBps) && getDurationString(durationSeconds) && <span>•</span>}
              {getDurationString(durationSeconds) && (
                <span className="text-[var(--muted)]">{getDurationString(durationSeconds)}</span>
              )}
            </div>
          </div>
        )}

        <div className="text-left md:text-right">
          <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] block">
            {activity.eventType === 'LoanRepaid' ? 'Repayment' : 'Principal Value'}
          </span>
          <span className="font-bold text-sm text-[var(--text)]">{getPrincipalEth()}</span>
        </div>

        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View transaction on Blockscout"
          title="View on Explorer"
          className="px-2.5 py-1.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] hover:bg-[var(--raised)] text-sky-600 dark:text-sky-400 hover:border-sky-500/40 transition-colors flex items-center gap-1 font-sans text-xs font-medium"
        >
          <span>TX</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
