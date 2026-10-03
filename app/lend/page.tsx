'use client';

import React, { useState, useMemo } from 'react';
import { type CuratedCollectionDefinition, type ActiveCuratedCollection } from '@/config/collections';
import { LendCollectionCard } from '@/components/lend/LendCollectionCard';
import { MyOpenOffersList } from '@/components/lend/MyOpenOffersList';
import { CreateOfferDrawer, type CreateOfferFormData } from '@/components/lend/CreateOfferDrawer';
import { CreateOfferConfirmationModal } from '@/components/lend/CreateOfferConfirmationModal';
import { CancelOfferModal } from '@/components/lend/CancelOfferModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useCreateOffer } from '@/hooks/transactions/useCreateOffer';
import { useCancelOffer } from '@/hooks/transactions/useCancelOffer';
import { useOffers } from '@/hooks/api/useOffers';
import { useCollections } from '@/hooks/api/useCollections';
import { useConnection } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import type { OfferItem } from '@/types/api';

import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';

export default function LendPage() {
  const chainId = useSafeChainId();
  const { address } = useConnection();
  const { data: apiOffers, refetch: refetchOffers } = useOffers({ lender: address });
  const {
    data: collectionsData,
    isLoading: isLoadingCollections,
    isError: isErrorCollections,
    error: errorCollections,
    refetch: refetchCollections,
  } = useCollections(chainId);
  const { state: txState, createOffer, reset: resetTx } = useCreateOffer();
  const { state: cancelTxState, cancelOffer, reset: resetCancelTx } = useCancelOffer();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [pendingFormData, setPendingFormData] = useState<CreateOfferFormData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const [cancellingOffer, setCancellingOffer] = useState<OfferItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [localOffers, setLocalOffers] = useState<OfferItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayOffers = useMemo(() => {
    const fromApi = apiOffers?.offers || [];
    const combined = [...localOffers, ...fromApi];
    const seen = new Set<number>();
    return combined.filter((o) => {
      if (seen.has(o.offerId)) return false;
      seen.add(o.offerId);
      return o.status === 'open';
    });
  }, [apiOffers, localOffers]);

  const curated: ActiveCuratedCollection[] = useMemo(() => {
    if (!collectionsData?.collections) return [];
    return collectionsData.collections.map((item) => ({
      id: item.symbol.toLowerCase(),
      name: item.name,
      symbol: item.symbol,
      defaultDurations: [7, 14, 30] as [7, 14, 30],
      addresses: {
        [TESTNET_CHAIN_ID]: item.address as `0x${string}`,
        [MAINNET_CHAIN_ID]: item.address as `0x${string}`,
        [chainId]: item.address as `0x${string}`,
      },
      contractAddress: item.address as `0x${string}`,
    }));
  }, [chainId, collectionsData]);

  const collectionStats = useMemo(() => {
    const map: Record<string, { poolSizeEth: string; activeLoansCount: number }> = {};
    if (collectionsData?.collections) {
      for (const item of collectionsData.collections) {
        const id = item.symbol.toLowerCase();
        map[id] = {
          poolSizeEth: item.poolSizeWei && item.poolSizeWei !== '0'
            ? (Number(item.poolSizeWei) / 1e18).toFixed(2)
            : '0.00',
          activeLoansCount: item.activeLoansCount || 0,
        };
      }
    }
    return map;
  }, [collectionsData]);

  const selectedCol = useMemo(() => {
    return curated.find((c) => c.id === selectedCollectionId) || curated[0] || null;
  }, [curated, selectedCollectionId]);

  const handleOpenDrawer = (collection?: CuratedCollectionDefinition | ActiveCuratedCollection) => {
    if (collection) {
      setSelectedCollectionId(collection.id);
    } else if (curated[0]) {
      setSelectedCollectionId(curated[0].id);
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
      await createOffer({
        collectionAddress: pendingFormData.collectionAddress,
        principalWei: BigInt(pendingFormData.principalWei),
        termInterestBps: pendingFormData.termInterestBps,
        durationSeconds: pendingFormData.durationSeconds,
        expirySeconds: pendingFormData.expirySeconds,
      });

      const newOffer: OfferItem = {
        offerId: Date.now(),
        chainId,
        lender: address || '',
        collection: pendingFormData.collectionAddress,
        principalWei: pendingFormData.principalWei,
        termInterestBps: pendingFormData.termInterestBps,
        feeBpsSnapshot: 200,
        durationSeconds: pendingFormData.durationSeconds,
        expiresAt: new Date(Date.now() + pendingFormData.expirySeconds * 1000).toISOString(),
        status: 'open',
        blockNumber: 0,
        txHash: '',
        createdAt: new Date().toISOString(),
      };
      setLocalOffers((prev) => [newOffer, ...prev]);
      setIsTxModalOpen(false);
      setToastMessage('Lending offer created successfully! Capital committed to escrow.');
      refetchOffers();
    } catch {}
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
      await cancelOffer({
        offerId: cancellingOffer.offerId,
        principalWei: cancellingOffer.principalWei,
      });

      setLocalOffers((prev) => prev.filter((o) => o.offerId !== cancellingOffer.offerId));
      setToastMessage(`Offer #${cancellingOffer.offerId} cancelled. Capital returned to claimable proceeds.`);
      refetchOffers();
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[#e6ece9] dark:border-[#1e332c] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-[2px] text-[#377994] dark:text-emerald-400 flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[#4d93be] dark:bg-emerald-500 inline-block" />
          <span>Put your ETH to work · Earn fixed yields</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b] dark:text-[#f0fdf4]">
              Set the terms. Fund the loan.
            </h1>

            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Make offers on curated collections. Liquidity opportunities with fixed interest when borrowers repay.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenDrawer()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--lime)] hover:bg-[#076b4d] text-white transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            Create Offer +
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#142d2b] dark:text-[#f0fdf4]">Choose a market</h2>
          <span className="text-xs text-[var(--muted)]">
            {curated.length} curated collections
          </span>
        </div>

        {isErrorCollections ? (
          <div className="p-8 border border-dashed border-red-200 dark:border-red-900/40 rounded-xl text-center bg-red-50/50 dark:bg-red-950/10">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">Failed to load curated collections</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {errorCollections instanceof Error ? errorCollections.message : 'Unable to query curated collections from the RPC network.'}
                </p>
              </div>
              <Button onClick={() => refetchCollections()} size="sm" variant="secondary">
                Retry Connection
              </Button>
            </div>
          </div>
        ) : isLoadingCollections ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden p-4 space-y-3"
              >
                <Skeleton width="100%" height="160px" borderRadius="8px" />
                <Skeleton width="120px" height="16px" />
                <Skeleton width="80px" height="12px" />
                <Skeleton width="100%" height="32px" borderRadius="6px" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {curated.map((col) => (
              <LendCollectionCard
                key={col.contractAddress}
                collection={col}
                poolSizeEth={collectionStats[col.id]?.poolSizeEth || '0.00'}
                activeLoansCount={collectionStats[col.id]?.activeLoansCount || 0}
                onMakeOffer={handleOpenDrawer}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-6 border-t border-[var(--line)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[#142d2b] dark:text-[#f0fdf4]">Your Open Offers</h2>
            <p className="text-xs text-[var(--muted)]">
              Active liquidity offers deposited into the protocol waiting to be accepted
            </p>
          </div>
        </div>

        <MyOpenOffersList
          offers={displayOffers}
          onCancelOffer={handleOpenCancelModal}
        />
      </div>

      {isDrawerOpen && (
        <CreateOfferDrawer
          isOpen={isDrawerOpen}
          collections={curated}
          initialCollectionId={selectedCollectionId}
          onClose={() => setIsDrawerOpen(false)}
          onSubmit={handleDrawerSubmit}
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
          principalEth={(Number(cancellingOffer.principalWei) / 1e18).toFixed(2)}
          onConfirm={handleConfirmCancelOffer}
          onClose={() => setIsCancelModalOpen(false)}
        />
      )}

      <TransactionModal
        isOpen={isTxModalOpen}
        state={txState}
        onClose={() => {
          setIsTxModalOpen(false);
          resetTx();
        }}
        onRetry={handleExecuteConfirmedOffer}
      />

      <TransactionModal
        isOpen={cancelTxState.stage !== 'IDLE'}
        state={cancelTxState}
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
