'use client';

import React from 'react';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export interface BorrowableNft {
  contractAddress: string;
  tokenId: string;
  collectionName: string;
  name: string;
  imageUrl: string;
  bestOfferWei?: string;
  offerCount: number;
  isInLoan?: boolean;
}

export interface NFTGridProps {
  nfts: BorrowableNft[];
  selectedNft: BorrowableNft | null;
  onSelectNft: (nft: BorrowableNft) => void;
  isLoading?: boolean;
}

export function NFTGrid({
  nfts,
  selectedNft,
  onSelectNft,
  isLoading = false,
}: NFTGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            data-testid="nft-card-skeleton"
            className="bg-white dark:bg-[#161b22] border border-[#dee7e3] dark:border-[#30363d] rounded-xl overflow-hidden p-0"
          >
            <Skeleton width="100%" height="200px" borderRadius="0px" />
            <div className="p-4 space-y-3">
              <Skeleton width="100px" height="12px" />
              <Skeleton width="140px" height="16px" />
              <div className="pt-2 border-t border-[#e1e8e9] dark:border-[#30363d] space-y-2">
                <Skeleton width="100%" height="14px" />
                <Skeleton width="100%" height="14px" />
              </div>
              <Skeleton width="100%" height="36px" borderRadius="8px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="p-8 border border-dashed border-[#e1e8e9] rounded-xl text-center">
        <EmptyState
          title="No Eligible Collectibles Found"
          description="Your connected wallet does not hold any verified NFTs from our curated collections, or all eligible collectibles are currently collateralized."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {nfts.map((nft) => {
        const isSelected =
          selectedNft?.contractAddress.toLowerCase() === nft.contractAddress.toLowerCase() &&
          selectedNft?.tokenId === nft.tokenId;

        const bestOfferEth =
          nft.bestOfferWei && BigInt(nft.bestOfferWei) > 0n
            ? `${Number(formatUnits(BigInt(nft.bestOfferWei), 18)).toFixed(3)} ETH`
            : '0.800 ETH';

        return (
          <article
            key={`${nft.contractAddress}-${nft.tokenId}`}
            data-testid={`nft-card-${nft.contractAddress}-${nft.tokenId}`}
            onClick={() => !nft.isInLoan && onSelectNft(nft)}
            className={`flex flex-col bg-white dark:bg-[#161b22] border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
              nft.isInLoan
                ? 'opacity-70 bg-[#fafcfc] dark:bg-[#0d1117] border-[#e1e8e9] dark:border-[#30363d] cursor-not-allowed'
                : isSelected
                ? 'border-[var(--lime)] shadow-[0_8px_24px_rgba(8,127,91,0.12)] ring-1 ring-[var(--lime)] hover:-translate-y-1 hover:shadow-lg'
                : 'border-[#dee7e3] dark:border-[#30363d] hover:border-[#b7d4c9] dark:hover:border-[#3fb950]/40 hover:-translate-y-1 hover:shadow-lg'
            }`}
          >
            <div className="relative aspect-square w-full bg-[#f4f7f5] overflow-hidden group">
              {nft.imageUrl ? (
                <Image
                  src={nft.imageUrl}
                  alt={nft.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg text-[#214e3b]">
                  #{nft.tokenId}
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-1 justify-between">
              <div>
                <div className="text-[10px] text-[#627478] truncate">
                  {nft.collectionName}
                </div>
                <h3 className="text-sm font-semibold text-[#142d2b] mt-0.5 mb-3 truncate">
                  {nft.name}
                </h3>

                <div className="space-y-2 text-[11px] pb-3 border-b border-[#e8eded]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#627478]">Best offer</span>
                    <strong className="font-mono text-[#184b3b]">{bestOfferEth}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#627478]">Term interest</span>
                    <span className="font-medium text-[var(--lime)]">5.0%</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={nft.isInLoan}
                onClick={() => onSelectNft(nft)}
                className={`w-full mt-3 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  nft.isInLoan
                    ? 'bg-[#f4f6f7] border border-[#e1e8e9] text-[#718781] cursor-not-allowed opacity-80'
                    : isSelected
                    ? 'bg-[var(--lime)] text-white hover:bg-[#076b4d] shadow-xs'
                    : 'bg-[#edf7f2] hover:bg-[#e1f1e9] border border-[#cfe4dc] text-[#142d2b]'
                }`}
              >
                <span>{nft.isInLoan ? 'In Loan' : 'Compare offers'}</span>
                {!nft.isInLoan && <span className="text-xs">↗</span>}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
