'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCuratedCollections, getCollectionByAddress } from '@/config/collections';
import { NFTGrid, type BorrowableNft } from '@/components/borrow/NFTGrid';
import { OfferComparisonList } from '@/components/borrow/OfferComparisonList';
import { BorrowReviewDrawer } from '@/components/borrow/BorrowReviewDrawer';
import { BorrowConfirmationModal } from '@/components/borrow/BorrowConfirmationModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { useAcceptOffer } from '@/hooks/transactions/useAcceptOffer';
import { useEligibleNfts } from '@/hooks/api/useEligibleNfts';
import { useCollections } from '@/hooks/api/useCollections';
import { useOffers } from '@/hooks/api/useOffers';
import { useLoans } from '@/hooks/api/useLoans';
import { useConnection } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import type { OfferItem } from '@/types/api';

function BorrowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get('collection');
  const chainId = useSafeChainId();
  const { address, isConnected } = useConnection();
  const { state: txState, checkIsApproved, approveNFT, acceptOffer, reset: resetTx } = useAcceptOffer();

  const { nfts: rawWalletNfts } = useEligibleNfts(address, chainId);
  const { data: collectionsData } = useCollections(chainId);
  const { data: userLoansData } = useLoans({ borrower: address, status: 'active' });

  const [selectedNft, setSelectedNft] = useState<BorrowableNft | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: offersData } = useOffers({
    collection: selectedNft?.contractAddress,
    status: 'open',
  });

  const activeCollectionOffers = offersData?.offers || [];

  const borrowableNfts: BorrowableNft[] = useMemo(() => {
    if (rawWalletNfts.length > 0) {
      return rawWalletNfts.map((nft) => {
        const remoteStats = collectionsData?.collections?.find(
          (c) => c.address.toLowerCase() === nft.contractAddress.toLowerCase()
        );
        const activeLoan = userLoansData?.loans?.find(
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
          bestOfferWei: remoteStats?.bestOfferWei || undefined,
          offerCount: remoteStats?.offerCount || 0,
          isInLoan: Boolean(activeLoan),
        };
      });
    }

    return getCuratedCollections(chainId).map((col, idx) => {
      const colAddress = col.contractAddress;
      const remoteStats = collectionsData?.collections?.find(
        (c) => c.address.toLowerCase() === colAddress.toLowerCase()
      );

      return {
        contractAddress: colAddress,
        tokenId: String(idx + 1),
        collectionName: col.name,
        name: `${col.name} #${idx + 1}`,
        imageUrl: resolveCollectionImageUrl(col.name),
        bestOfferWei: remoteStats?.bestOfferWei || undefined,
        offerCount: remoteStats?.offerCount || 0,
        isInLoan: false,
      };
    });
  }, [rawWalletNfts, collectionsData, userLoansData, chainId]);

  const filteredNfts = useMemo(() => {
    if (!collectionParam) return borrowableNfts;
    return borrowableNfts.filter(
      (n) => n.contractAddress.toLowerCase() === collectionParam.toLowerCase()
    );
  }, [borrowableNfts, collectionParam]);

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
    ? getCollectionByAddress(selectedNft.contractAddress, chainId)
    : null;

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[#e6ece9] dark:border-[#1e332c] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-[2px] text-[#377994] dark:text-emerald-400 flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[#4d93be] dark:bg-emerald-500 inline-block" />
          <span>Make room for your next move · Instant collateral liquidity</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b] dark:text-[#f0fdf4]">
          Borrow against your collection.
        </h1>

        <p className="text-xs sm:text-sm text-[var(--muted)]">
          Choose an NFT, compare offers, and review your exact repayment.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#142d2b] dark:text-[#f0fdf4]">Your eligible NFTs</h2>
          <span className="text-xs text-[var(--muted)]">
            {filteredNfts.length} eligible NFT{filteredNfts.length === 1 ? '' : 's'}
          </span>
        </div>

        <NFTGrid
          nfts={filteredNfts}
          selectedNft={selectedNft}
          onSelectNft={(nft) => {
            setSelectedNft(nft);
            const offers = activeCollectionOffers.filter(
              (o) =>
                o.collection.toLowerCase() === nft.contractAddress.toLowerCase() &&
                o.status === 'open'
            );
            if (offers.length > 0) {
              setSelectedOffer(offers[0]);
              setIsDrawerOpen(true);
            }
          }}
        />
      </div>

      {selectedNft && (
        <div className="space-y-4 pt-4 border-t border-[var(--line)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[#142d2b]">
                Available Offers for {selectedNft.name}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Collection: {selectedCollectionDef?.name || selectedNft.collectionName} • Fixed Rate Term
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
