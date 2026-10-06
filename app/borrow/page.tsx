'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NFTGrid, type BorrowableNft } from '@/components/borrow/NFTGrid';
import { BorrowDisconnectedHero } from '@/components/borrow/BorrowDisconnectedHero';
import { OfferComparisonList } from '@/components/borrow/OfferComparisonList';
import { BorrowReviewDrawer } from '@/components/borrow/BorrowReviewDrawer';
import { BorrowConfirmationModal } from '@/components/borrow/BorrowConfirmationModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { useConnectModal } from '@/contexts/ConnectModalContext';
import { useAcceptOffer } from '@/hooks/transactions/useAcceptOffer';
import { useMintNft } from '@/hooks/transactions/useMintNft';
import { useEligibleNfts } from '@/hooks/api/useEligibleNfts';
import { useCollections } from '@/hooks/api/useCollections';
import { useOffers } from '@/hooks/api/useOffers';
import { useLoans } from '@/hooks/api/useLoans';
import { useConnection } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useMounted } from '@/lib/hooks/useMounted';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import type { OfferItem } from '@/types/api';

export function BorrowPageSkeleton() {
  return (
    <div className="space-y-8" data-testid="borrow-page-skeleton">
      <div className="space-y-2 border-b border-[#e6ece9] dark:border-[#1e332c] pb-4">
        <div className="w-64 h-3 bg-[var(--panel)] rounded shimmer" />
        <div className="w-80 sm:w-96 h-9 bg-[var(--panel)] rounded shimmer" />
        <div className="w-72 h-4 bg-[var(--panel)] rounded shimmer" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-36 h-6 bg-[var(--panel)] rounded shimmer" />
            <div className="w-24 h-4 bg-[var(--panel)] rounded shimmer" />
          </div>
          <div className="w-36 h-8 bg-[var(--panel)] rounded-lg shimmer" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              data-testid="nft-card-skeleton"
              className="flex flex-col bg-white dark:bg-[#111a17] border border-[#dee7e3] dark:border-[#1e332c] rounded-xl overflow-hidden"
            >
              <div className="aspect-square w-full bg-[var(--panel)] shimmer" />
              <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
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
      </div>
    </div>
  );
}

function BorrowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get('collection');
  const chainId = useSafeChainId();
  const mounted = useMounted();
  const { address, isConnected } = useConnection();
  const { state: txState, checkIsApproved, approveNFT, acceptOffer, reset: resetTx } = useAcceptOffer();
  const { state: mintTxState, mintNft, reset: resetMintTx } = useMintNft();

  const { nfts: rawWalletNfts, isLoading: isLoadingNfts } = useEligibleNfts(address, chainId);
  const { data: collectionsData } = useCollections(chainId);
  const { data: userLoansData } = useLoans({ borrower: address, status: 'active', enabled: Boolean(address && isConnected) });

  const [selectedNft, setSelectedNft] = useState<BorrowableNft | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (mounted && !isConnected) {
      setSelectedNft(null);
      setSelectedOffer(null);
      setIsDrawerOpen(false);
      setIsConfirmModalOpen(false);
      setIsTxModalOpen(false);
      setToastMessage(null);
      resetTx();
      resetMintTx();
    }
  }, [isConnected, mounted, resetTx, resetMintTx]);

  const { data: offersData } = useOffers({
    collection: selectedNft?.contractAddress,
    status: 'open',
    chainId,
  });

  const activeCollectionOffers = offersData?.offers || [];

  const borrowableNfts: BorrowableNft[] = useMemo(() => {
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
  }, [rawWalletNfts, collectionsData, userLoansData]);

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
    if (!isConnected) {
      openConnectModal();
      return;
    }
    setIsDrawerOpen(false);

    const approved = await checkIsApproved({
      collectionAddress: selectedNft.contractAddress as `0x${string}`,
      tokenId: selectedNft.tokenId,
    });
    setIsApproved(approved);
    setIsConfirmModalOpen(true);
  };

  const handleApproveNFT = async () => {
    if (!selectedNft) return;
    if (!isConnected) {
      openConnectModal();
      return;
    }
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
    if (!isConnected) {
      openConnectModal();
      return;
    }
    setIsConfirmModalOpen(false);
    setIsTxModalOpen(true);

    const hash = await acceptOffer({
      offerId: selectedOffer.offerId,
      tokenId: selectedNft.tokenId,
      collectionAddress: selectedNft.contractAddress as `0x${string}`,
    });
    if (hash) {
      setToastMessage(`Loan initiated successfully! Redirecting...`);
    }
  };

  const { openConnectModal } = useConnectModal();

  const handleMintTestnetNft = async () => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    const fallbackAddress = collectionsData?.collections?.[0]?.address as `0x${string}` | undefined;
    const targetAddress = (collectionParam || fallbackAddress) as `0x${string}` | undefined;
    if (!targetAddress) return;
    const targetCollection = collectionsData?.collections?.find(
      (c) => c.address.toLowerCase() === targetAddress.toLowerCase()
    );
    const hash = await mintNft({
      collectionAddress: targetAddress,
      collectionName: targetCollection?.name || (targetAddress ? formatShortAddress(targetAddress) : 'Robinhood NFT'),
    });
    if (hash) {
      setToastMessage('Testnet NFT minted successfully! Your new NFT will appear shortly.');
    }
  };

  const selectedCollectionDef = selectedNft
    ? collectionsData?.collections?.find(
        (c) => c.address.toLowerCase() === selectedNft.contractAddress.toLowerCase()
      )
    : null;

  if (!mounted) {
    return <BorrowPageSkeleton />;
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-[#142d2b] dark:text-[#f0fdf4]">Your eligible NFTs</h2>
            <span className="text-xs text-[var(--muted)]">
              {isConnected
                ? isLoadingNfts
                  ? 'Scanning wallet...'
                  : `${filteredNfts.length} eligible NFT${filteredNfts.length === 1 ? '' : 's'}`
                : '(Connect wallet to scan)'}
            </span>
          </div>

          <button
            type="button"
            onClick={isConnected ? handleMintTestnetNft : openConnectModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-white dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <span>{isConnected ? 'Mint Testnet NFT' : 'Connect Wallet to Mint'}</span>
            <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </button>
        </div>

        {collectionParam && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-xs text-[var(--text)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)]">Filtered by:</span>
              <strong className="font-semibold text-sky-600 dark:text-sky-400">
                {collectionsData?.collections?.find((c) => c.address.toLowerCase() === collectionParam.toLowerCase())?.name || collectionParam}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => router.push('/borrow')}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] underline cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        )}

        {!isConnected ? (
          <BorrowDisconnectedHero onConnect={openConnectModal} />
        ) : (
          <NFTGrid
            nfts={filteredNfts}
            selectedNft={selectedNft}
            isLoading={isLoadingNfts}
            onMintTestnet={handleMintTestnetNft}
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
        )}
      </div>

      {isConnected && selectedNft && (
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
            collectionAddress={selectedNft.contractAddress}
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
        chainId={chainId}
        onClose={() => {
          setIsTxModalOpen(false);
          resetTx();
        }}
        onRetry={handleExecuteAcceptOffer}
      />

      <TransactionModal
        isOpen={mintTxState.stage !== 'IDLE'}
        state={mintTxState}
        chainId={chainId}
        onClose={() => {
          resetMintTx();
        }}
        onRetry={handleMintTestnetNft}
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
    <Suspense fallback={<BorrowPageSkeleton />}>
      <BorrowContent />
    </Suspense>
  );
}
