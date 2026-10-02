'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { MOCK_WALLET_NFTS, MOCK_OFFERS, MOCK_LOANS, getMockCollectionStats } from '@/lib/mock/fixtures';
import { NFTGrid, type BorrowableNft } from '@/components/borrow/NFTGrid';
import { OfferComparisonList } from '@/components/borrow/OfferComparisonList';
import { BorrowReviewDrawer } from '@/components/borrow/BorrowReviewDrawer';
import { BorrowConfirmationModal } from '@/components/borrow/BorrowConfirmationModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { useAcceptOffer } from '@/hooks/transactions/useAcceptOffer';
import { useAccount } from 'wagmi';
import type { OfferItem } from '@/types/api';

function BorrowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get('collection');
  const { isConnected } = useAccount();
  const { state: txState, checkIsApproved, approveNFT, acceptOffer, reset: resetTx } = useAcceptOffer();

  const [selectedNft, setSelectedNft] = useState<BorrowableNft | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const borrowableNfts: BorrowableNft[] = useMemo(() => {
    return MOCK_WALLET_NFTS.map((nft) => {
      const stats = getMockCollectionStats(nft.contractAddress);
      const activeLoan = MOCK_LOANS.find(
        (l) =>
          l.collection.toLowerCase() === nft.contractAddress.toLowerCase() &&
          l.tokenId === nft.tokenId &&
          l.status === 'active'
      );

      return {
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        collectionName: nft.collectionName,
        name: nft.name,
        imageUrl: nft.imageUrl,
        bestOfferWei: stats.bestOfferWei || undefined,
        offerCount: stats.offerCount,
        isInLoan: Boolean(activeLoan),
      };
    });
  }, []);

  const filteredNfts = useMemo(() => {
    if (!collectionParam) return borrowableNfts;
    return borrowableNfts.filter(
      (n) => n.contractAddress.toLowerCase() === collectionParam.toLowerCase()
    );
  }, [borrowableNfts, collectionParam]);

  const activeCollectionOffers: OfferItem[] = useMemo(() => {
    if (!selectedNft) return [];
    return MOCK_OFFERS.filter(
      (o) =>
        o.collection.toLowerCase() === selectedNft.contractAddress.toLowerCase() &&
        o.status === 'open'
    );
  }, [selectedNft]);

  const handleSelectOffer = (offer: OfferItem) => {
    setSelectedOffer(offer);
    setIsDrawerOpen(true);
  };

  const handleReviewProceed = async () => {
    if (!selectedNft) return;
    setIsDrawerOpen(false);

    if (isConnected) {
      const approved = await checkIsApproved({
        collectionAddress: selectedNft.contractAddress as `0x${string}`,
        tokenId: selectedNft.tokenId,
      });
      setIsApproved(approved);
    } else {
      setIsApproved(true);
    }

    setIsConfirmModalOpen(true);
  };

  const handleApproveNFT = async () => {
    if (!selectedNft) return;
    setIsTxModalOpen(true);
    const hash = await approveNFT({
      collectionAddress: selectedNft.contractAddress as `0x${string}`,
      tokenId: selectedNft.tokenId,
    });
    if (hash) {
      setIsApproved(true);
      setIsTxModalOpen(false);
      resetTx();
      setToastMessage('NFT approved successfully! You can now accept the loan.');
    }
  };

  const handleExecuteAcceptOffer = async () => {
    if (!selectedNft || !selectedOffer) return;
    setIsConfirmModalOpen(false);
    setIsTxModalOpen(true);

    if (isConnected) {
      const hash = await acceptOffer({
        offerId: selectedOffer.offerId,
        tokenId: selectedNft.tokenId,
        collectionAddress: selectedNft.contractAddress as `0x${string}`,
      });
      if (hash) {
        setToastMessage(`Loan initiated successfully! Redirecting...`);
      }
    } else {
      setIsTxModalOpen(false);
      setToastMessage(`Loan initiated successfully for ${selectedNft.name}! Funds sent to wallet.`);
      router.push(`/loan/1`);
    }
  };

  const selectedCollectionDef = selectedNft
    ? CURATED_COLLECTIONS.find(
        (c) => c.addresses[46630].toLowerCase() === selectedNft.contractAddress.toLowerCase()
      )
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="relative overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-[#214E3B] to-[#123124] text-white p-8 lg:p-10 shadow-[var(--shadow-raised)]">
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#A5C9B3] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Borrowing Workbench</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Instant Collateral Liquidity
          </h1>

          <p className="text-[#D7E6D9] text-sm sm:text-base leading-relaxed">
            Select your eligible NFT below to view real-time open lending offers. Lock your NFT into non-custodial escrow and receive instant ETH liquidity.
          </p>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center text-[180px] font-black">
          ⚡
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">Your Eligible NFTs</h2>
          <p className="text-xs text-[var(--muted)]">
            NFTs in your wallet eligible for instantaneous collateral loans
          </p>
        </div>

        <NFTGrid
          nfts={filteredNfts}
          selectedNft={selectedNft}
          onSelectNft={(nft) => setSelectedNft(nft)}
        />
      </div>

      {selectedNft && (
        <div className="space-y-4 pt-4 border-t border-[var(--line)] animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
                Available Offers for {selectedNft.name}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Collection: {selectedCollectionDef?.name || selectedNft.collectionName} • Sorted by Principal DESC
              </p>
            </div>
          </div>

          <OfferComparisonList
            offers={activeCollectionOffers}
            onSelectOffer={handleSelectOffer}
          />
        </div>
      )}

      <BorrowReviewDrawer
        isOpen={isDrawerOpen}
        nft={selectedNft}
        offer={selectedOffer}
        onClose={() => setIsDrawerOpen(false)}
        onConfirm={handleReviewProceed}
      />

      {selectedNft && selectedOffer && (
        <BorrowConfirmationModal
          isOpen={isConfirmModalOpen}
          nftName={selectedNft.name}
          tokenId={selectedNft.tokenId}
          collectionName={selectedNft.collectionName}
          principalEth={(Number(selectedOffer.principalWei) / 1e18).toFixed(3)}
          totalDueEth={(
            (Number(selectedOffer.principalWei) +
              (Number(selectedOffer.principalWei) * selectedOffer.termInterestBps) / 10000) /
            1e18
          ).toFixed(3)}
          durationDays={Math.round(selectedOffer.durationSeconds / 86400)}
          isApproved={isApproved}
          onApprove={handleApproveNFT}
          onConfirm={handleExecuteAcceptOffer}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}

      <TransactionModal
        isOpen={isTxModalOpen}
        state={txState}
        onClose={() => {
          setIsTxModalOpen(false);
          resetTx();
        }}
        onRetry={handleExecuteAcceptOffer}
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default function BorrowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[var(--muted)]">Loading Borrow Page...</div>}>
      <BorrowContent />
    </Suspense>
  );
}
