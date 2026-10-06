'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';

const BORROW_PAGE_SIZE = 10;

export interface BorrowableNft {
  contractAddress: string;
  tokenId: string;
  collectionName: string;
  name: string;
  imageUrl?: string;
  bestOfferWei?: string;
  termInterestBps?: number;
  offerCount: number;
  isInLoan?: boolean;
}

export interface NFTGridProps {
  nfts: BorrowableNft[];
  selectedNft: BorrowableNft | null;
  onSelectNft: (nft: BorrowableNft) => void;
  isLoading?: boolean;
  onMintTestnet?: () => void;
}

export function NFTGrid({
  nfts,
  selectedNft,
  onSelectNft,
  isLoading = false,
  onMintTestnet,
}: NFTGridProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(nfts.length / BORROW_PAGE_SIZE);
  const paginatedNfts = useMemo(() => {
    return nfts.slice((page - 1) * BORROW_PAGE_SIZE, page * BORROW_PAGE_SIZE);
  }, [nfts, page]);
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5" data-testid="nft-grid-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            data-testid="nft-card-skeleton"
            className="flex flex-col bg-white dark:bg-[#111a17] border border-[#dee7e3] dark:border-[#1e332c] rounded-xl overflow-hidden"
          >
            <div className="aspect-square w-full bg-[var(--panel)] shimmer" />
            <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
              <div>
                <div className="w-24 h-2.5 bg-[var(--panel)] rounded shimmer mb-1.5" />
                <div className="w-36 h-4 bg-[var(--panel)] rounded shimmer mb-3" />
                <div className="space-y-2 pt-2 border-t border-[#e8eded] dark:border-[#1e332c]">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-3 bg-[var(--panel)] rounded shimmer" />
                    <div className="w-14 h-3 bg-[var(--panel)] rounded shimmer" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-3 bg-[var(--panel)] rounded shimmer" />
                    <div className="w-8 h-3 bg-[var(--panel)] rounded shimmer" />
                  </div>
                </div>
              </div>
              <div className="w-full h-9 bg-[var(--panel)] rounded-lg shimmer mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="p-8 border border-dashed border-[#e1e8e9] dark:border-[#1e332c] rounded-xl text-center bg-white dark:bg-[#111a17] flex flex-col items-center justify-center">
        <EmptyState
          title="No Eligible Collectibles Found"
          description="Your connected wallet does not hold any verified NFTs from indexed collections, or all eligible collectibles are currently collateralized."
        />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {onMintTestnet && (
            <button
              type="button"
              onClick={onMintTestnet}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs cursor-pointer"
            >
              <span>Mint Testnet NFT (1-Click)</span>
              <svg className="w-3.5 h-3.5 text-emerald-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </button>
          )}
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--panel)] hover:bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] transition-colors shadow-xs"
          >
            <span>Explore Collections</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5">
        {paginatedNfts.map((nft) => {
          const isSelected =
            selectedNft?.contractAddress.toLowerCase() === nft.contractAddress.toLowerCase() &&
            selectedNft?.tokenId === nft.tokenId;

          const hasOffer = Boolean(nft.bestOfferWei && BigInt(nft.bestOfferWei) > 0n);
          const bestOfferEth = hasOffer
            ? `${Number(formatUnits(BigInt(nft.bestOfferWei!), 18)).toFixed(3)} ETH`
            : '—';
          const termInterestStr = nft.termInterestBps !== undefined
            ? `${(nft.termInterestBps / 100).toFixed(1)}%`
            : hasOffer
            ? 'Fixed'
            : '—';

          return (
            <article
              key={`${nft.contractAddress}-${nft.tokenId}`}
              data-testid={`nft-card-${nft.contractAddress}-${nft.tokenId}`}
              onClick={() => !nft.isInLoan && onSelectNft(nft)}
              className={`flex flex-col bg-white dark:bg-[#111a17] border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                nft.isInLoan
                  ? 'opacity-70 bg-[#fafcfc] dark:bg-[#0d1714] border-[#e1e8e9] dark:border-[#1e332c] cursor-not-allowed'
                  : isSelected
                  ? 'border-[var(--lime)] shadow-[0_8px_24px_rgba(8,127,91,0.12)] ring-1 ring-[var(--lime)] hover:-translate-y-1 hover:shadow-lg'
                  : 'border-[#dee7e3] dark:border-[#1e332c] hover:border-[#b7d4c9] dark:hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              <div className="relative aspect-square w-full bg-[#f4f7f5] dark:bg-[#14221e] overflow-hidden group">
                {nft.imageUrl ? (
                  <Image
                    src={nft.imageUrl}
                    alt={nft.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[#214e3b] dark:text-emerald-400">
                    #{nft.tokenId}
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                <div>
                  <div className="text-[10px] text-[#627478] dark:text-[#8ca197] truncate">
                    {nft.collectionName}
                  </div>
                  <h3 className="text-sm font-semibold text-[#142d2b] dark:text-[#f0f6fc] mt-0.5 mb-3 truncate">
                    {nft.name}
                  </h3>

                  <div className="space-y-2 text-[11px] pb-3 border-b border-[#e8eded] dark:border-[#1e332c]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#627478] dark:text-[#8ca197]">Best offer</span>
                      <strong className="font-mono text-[#184b3b] dark:text-[#56d364]">{bestOfferEth}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#627478] dark:text-[#8ca197]">Term interest</span>
                      <span className="font-medium text-[var(--lime)]">{termInterestStr}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={nft.isInLoan}
                  onClick={() => onSelectNft(nft)}
                  className={`w-full mt-3 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    nft.isInLoan
                      ? 'bg-[#f4f6f7] dark:bg-[#14221e] border border-[#e1e8e9] dark:border-[#1e332c] text-[#718781] dark:text-[#8ca197] cursor-not-allowed opacity-80'
                      : isSelected
                      ? 'bg-[var(--lime)] text-white hover:bg-[#076b4d] shadow-xs'
                      : 'bg-[#edf7f2] dark:bg-[#14221e] hover:bg-[#e1f1e9] dark:hover:bg-[#192b25] border border-[#cfe4dc] dark:border-[#1e332c] text-[#142d2b] dark:text-[#f0f6fc]'
                  }`}
                >
                  <span>{nft.isInLoan ? 'In Loan' : 'Compare offers'}</span>
                  {!nft.isInLoan && (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={nfts.length}
        pageSize={BORROW_PAGE_SIZE}
        itemName="collectibles"
        onPageChange={setPage}
      />
    </div>
  );
}
