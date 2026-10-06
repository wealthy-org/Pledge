'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { LendCollectionCard, type GenericCollectionItem } from '@/components/lend/LendCollectionCard';
import { MyOpenOffersList } from '@/components/lend/MyOpenOffersList';
import { AllLoansTable } from '@/components/lend/AllLoansTable';
import { AllOffersTable } from '@/components/lend/AllOffersTable';
import { CreateOfferDrawer, type CreateOfferFormData, type CreateOfferCollectionOption } from '@/components/lend/CreateOfferDrawer';
import { CreateOfferConfirmationModal } from '@/components/lend/CreateOfferConfirmationModal';
import { CancelOfferModal } from '@/components/lend/CancelOfferModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { useConnectModal } from '@/contexts/ConnectModalContext';
import { useCreateOffer } from '@/hooks/transactions/useCreateOffer';
import { useCancelOffer } from '@/hooks/transactions/useCancelOffer';
import { useOffers } from '@/hooks/api/useOffers';
import { useUnifiedCollectionSearch } from '@/hooks/useUnifiedCollectionSearch';
import { useConnection } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import type { OfferItem } from '@/types/api';

const COLLECTIONS_PAGE_SIZE = 15;

export default function LendPage() {
  const chainId = useSafeChainId();
  const { address, isConnected } = useConnection();
  const { openConnectModal } = useConnectModal();
  const { data: apiOffers, isLoading: isLoadingOffers, refetch: refetchOffers } = useOffers({
    lender: address,
    chainId,
    status: 'open',
    enabled: Boolean(isConnected && address),
  });

  const [activeTab, setActiveTab] = useState<'collections' | 'offers' | 'loans'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionPage, setCollectionPage] = useState(1);
  const {
    collections: unifiedCollections,
    isLoading: isLoadingCollections,
    isError: isErrorCollections,
    error: errorCollections,
    refetch: refetchCollections,
  } = useUnifiedCollectionSearch({ chainId, query: searchQuery, randomize: true });

  const { state: txState, createOffer, reset: resetTx } = useCreateOffer();
  const { state: cancelTxState, cancelOffer, reset: resetCancelTx } = useCancelOffer();

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCollectionPage(1);
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedCustomAddress, setSelectedCustomAddress] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<CreateOfferFormData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const [cancellingOffer, setCancellingOffer] = useState<OfferItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isConnected || !address) {
      setIsDrawerOpen(false);
      setIsConfirmModalOpen(false);
      setIsTxModalOpen(false);
      setIsCancelModalOpen(false);
      setPendingFormData(null);
      setCancellingOffer(null);
      setToastMessage(null);
      resetTx();
      resetCancelTx();
    }
  }, [isConnected, address, resetTx, resetCancelTx]);

  const displayOffers = useMemo(() => {
    if (!isConnected || !address) return [];
    const fromApi = apiOffers?.offers || [];
    const seen = new Set<number>();
    const normalizedAddress = address.toLowerCase();
    return fromApi.filter((o) => {
      if (seen.has(o.offerId)) return false;
      seen.add(o.offerId);
      return o.status === 'open' && (!o.lender || o.lender.toLowerCase() === normalizedAddress);
    });
  }, [apiOffers, isConnected, address]);

  const collectionsList: CreateOfferCollectionOption[] = useMemo(() => {
    return unifiedCollections.map((item) => ({
      id: item.address.toLowerCase(),
      name: item.name,
      symbol: item.symbol,
      contractAddress: item.address,
      imageUrl: item.imageUrl,
    }));
  }, [unifiedCollections]);

  const collectionStats = useMemo(() => {
    const map: Record<string, { poolSizeEth: string; floorPriceEth?: string; activeLoansCount: number }> = {};
    for (const item of unifiedCollections) {
      const id = item.address.toLowerCase();
      const onChainPool = item.poolSizeWei && item.poolSizeWei !== '0'
        ? (Number(item.poolSizeWei) / 1e18).toFixed(2)
        : null;
      const gondiVolume = item.salesVolumeEth ? parseFloat(item.salesVolumeEth).toFixed(2) : null;
      map[id] = {
        poolSizeEth: onChainPool || gondiVolume || '0.00',
        floorPriceEth: item.floorPriceEth,
        activeLoansCount: item.offerCount || item.activeLoansCount || 0,
      };
    }
    return map;
  }, [unifiedCollections]);

  const totalCollectionPages = Math.ceil(collectionsList.length / COLLECTIONS_PAGE_SIZE);
  const paginatedCollections = useMemo(() => {
    const start = (collectionPage - 1) * COLLECTIONS_PAGE_SIZE;
    return collectionsList.slice(start, start + COLLECTIONS_PAGE_SIZE);
  }, [collectionsList, collectionPage]);

  const selectedCol = useMemo(() => {
    if (!pendingFormData) return null;
    const match = collectionsList.find(
      (c) => c.contractAddress?.toLowerCase() === pendingFormData.collectionAddress.toLowerCase()
    );
    if (match) return match;
    return {
      id: pendingFormData.collectionAddress.toLowerCase(),
      name: `Contract ${formatShortAddress(pendingFormData.collectionAddress)}`,
      symbol: 'ERC721',
      contractAddress: pendingFormData.collectionAddress,
    };
  }, [collectionsList, pendingFormData]);

  const handleOpenDrawer = (collection?: GenericCollectionItem) => {
    if (collection) {
      const addr = collection.contractAddress || collection.address || '';
      setSelectedCollectionId(addr.toLowerCase());
      setSelectedCustomAddress(addr);
    } else if (collectionsList[0]) {
      setSelectedCollectionId(collectionsList[0].id);
      setSelectedCustomAddress(collectionsList[0].contractAddress || '');
    }
    setIsDrawerOpen(true);
  };

  const handleDrawerSubmit = (data: CreateOfferFormData) => {
    setPendingFormData(data);
    setIsDrawerOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleExecuteConfirmedOffer = async () => {
    if (!pendingFormData) return;
    setIsConfirmModalOpen(false);
    setIsTxModalOpen(true);

    try {
      const hash = await createOffer({
        collectionAddress: pendingFormData.collectionAddress,
        collectionName: selectedCol?.name,
        principalWei: BigInt(pendingFormData.principalWei),
        termInterestBps: pendingFormData.termInterestBps,
        durationSeconds: pendingFormData.durationSeconds,
        expirySeconds: pendingFormData.expirySeconds,
      });

      if (hash) {
        setToastMessage('Lending offer created successfully! Capital committed to escrow.');
        refetchOffers();
        refetchCollections();
      }
    } catch (err) {
      console.error('[LendPage CreateOffer Error]:', err);
    }
  };

  const handleOpenCancelModal = (offerId: number) => {
    const target = displayOffers.find((o) => o.offerId === offerId);
    if (target) {
      setCancellingOffer(target);
      setIsCancelModalOpen(true);
    }
  };

  const handleConfirmCancelOffer = async () => {
    if (!cancellingOffer) return;
    setIsCancelModalOpen(false);

    try {
      const match = collectionsList.find((c) => c.contractAddress?.toLowerCase() === cancellingOffer.collection.toLowerCase());
      const hash = await cancelOffer({
        offerId: cancellingOffer.offerId,
        principalWei: cancellingOffer.principalWei,
        collectionName: match?.name || formatShortAddress(cancellingOffer.collection),
      });

      if (hash) {
        setToastMessage(`Offer #${cancellingOffer.offerId} cancelled. Capital returned to claimable proceeds.`);
        refetchOffers();
        refetchCollections();
      }
    } catch (err) {
      console.error('[LendPage CancelOffer Error]:', err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-2 border-b border-[#e6ece9] dark:border-[#1e332c] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-[2px] text-[#377994] dark:text-emerald-400 flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[#4d93be] dark:bg-emerald-500 inline-block" />
          <span>Put your ETH to work · Earn fixed yields</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b] dark:text-[#f0fdf4]">
              Set the terms. Fund the loan.
            </h1>

            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Liquidity opportunities with fixed interest when borrowers repay.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/explore"
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--line)] text-[var(--text)] transition-colors whitespace-nowrap shrink-0"
            >
              Explore ↗
            </Link>

            <button
              type="button"
              onClick={() => handleOpenDrawer()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Create Offer +
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-[#142d2b] dark:text-[#f0fdf4]">
              Your Open Offers
            </h2>
            {isConnected && address && displayOffers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                {displayOffers.length} Active
              </span>
            )}
          </div>
        </div>

        <MyOpenOffersList
          offers={displayOffers}
          isLoading={isLoadingOffers && Boolean(isConnected && address)}
          onCancelOffer={handleOpenCancelModal}
          isConnected={isConnected}
          onConnect={openConnectModal}
        />
      </div>

      <div className="space-y-4 pt-4 border-t border-[var(--line)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#142d2b] dark:text-[#f0fdf4]">
              Choose a collection market
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Select an ERC-721 collection to provide liquidity or browse market terms.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-[var(--surface)] rounded-xl border border-[var(--line)] w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('collections')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'collections'
                  ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Market Collections
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'offers'
                  ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              All Open Offers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('loans')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'loans'
                  ? 'bg-[var(--panel)] text-[var(--text)] shadow-xs border border-[var(--line)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Protocol Loans
            </button>
          </div>

          {activeTab === 'collections' && (
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search collections or address..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--surface)] border border-[var(--line)] rounded-lg text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--lime)] transition-colors"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>

        {activeTab === 'offers' ? (
          <AllOffersTable />
        ) : activeTab === 'loans' ? (
          <AllLoansTable />
        ) : isErrorCollections ? (
          <div className="p-8 border border-dashed border-red-200 dark:border-red-900/40 rounded-xl text-center bg-red-50/50 dark:bg-red-950/10">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">Failed to load collections</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {errorCollections instanceof Error ? errorCollections.message : 'Unable to query collections.'}
                </p>
              </div>
              <Button onClick={() => refetchCollections()} size="sm" variant="secondary">
                Retry Connection
              </Button>
            </div>
          </div>
        ) : isLoadingCollections ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden p-3 sm:p-4 space-y-3"
              >
                <Skeleton width="100%" height="140px" borderRadius="8px" />
                <Skeleton width="120px" height="16px" />
                <Skeleton width="80px" height="12px" />
                <Skeleton width="100%" height="32px" borderRadius="6px" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {paginatedCollections.map((col) => (
                <LendCollectionCard
                  key={col.contractAddress || col.id}
                  collection={col}
                  poolSizeEth={collectionStats[col.id]?.poolSizeEth || '0.00'}
                  floorPriceEth={collectionStats[col.id]?.floorPriceEth}
                  activeLoansCount={collectionStats[col.id]?.activeLoansCount || 0}
                  imageUrl={(col as any).imageUrl}
                  onMakeOffer={handleOpenDrawer}
                />
              ))}
            </div>
            <Pagination
              currentPage={collectionPage}
              totalPages={totalCollectionPages}
              totalItems={collectionsList.length}
              pageSize={COLLECTIONS_PAGE_SIZE}
              itemName="collections"
              onPageChange={setCollectionPage}
            />
          </div>
        )}
      </div>

      {isDrawerOpen && (
        <CreateOfferDrawer
          isOpen={isDrawerOpen}
          collections={collectionsList}
          initialCollectionId={selectedCollectionId}
          initialCollectionAddress={selectedCustomAddress}
          onClose={() => setIsDrawerOpen(false)}
          onSubmit={handleDrawerSubmit}
          isConnected={isConnected}
          onConnect={openConnectModal}
        />
      )}

      {pendingFormData && selectedCol && (
        <CreateOfferConfirmationModal
          isOpen={isConfirmModalOpen}
          collectionName={selectedCol.name}
          collectionSymbol={selectedCol.symbol}
          principalEth={(Number(pendingFormData.principalWei) / 1e18).toFixed(3)}
          termInterestBps={pendingFormData.termInterestBps}
          durationDays={pendingFormData.durationSeconds / 86400}
          expectedPayoutEth={(
            (Number(pendingFormData.principalWei) +
              (Number(pendingFormData.principalWei) * pendingFormData.termInterestBps) / 10000 -
              (Number(pendingFormData.principalWei) * pendingFormData.termInterestBps * 0.02) / 10000) /
            1e18
          ).toFixed(3)}
          protocolFeeEth={(
            (Number(pendingFormData.principalWei) * pendingFormData.termInterestBps * 0.02) /
            10000 /
            1e18
          ).toFixed(4)}
          onConfirm={handleExecuteConfirmedOffer}
          onClose={() => setIsConfirmModalOpen(false)}
        />
      )}

      {cancellingOffer && (
        <CancelOfferModal
          isOpen={isCancelModalOpen}
          offerId={cancellingOffer.offerId}
          collectionName={
            collectionsList.find((c) => c.contractAddress?.toLowerCase() === cancellingOffer.collection.toLowerCase())?.name ||
            formatShortAddress(cancellingOffer.collection)
          }
          principalEth={(Number(cancellingOffer.principalWei) / 1e18).toFixed(2)}
          onConfirm={handleConfirmCancelOffer}
          onClose={() => {
            setIsCancelModalOpen(false);
            setCancellingOffer(null);
          }}
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
        onRetry={handleExecuteConfirmedOffer}
      />

      <TransactionModal
        isOpen={cancelTxState.stage !== 'IDLE'}
        state={cancelTxState}
        chainId={chainId}
        onClose={resetCancelTx}
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
