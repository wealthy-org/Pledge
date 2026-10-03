'use client';

import React, { useState, useMemo } from 'react';
import { getCuratedCollections, type CuratedCollectionDefinition, type ActiveCuratedCollection } from '@/config/collections';
import { LendCollectionCard } from '@/components/lend/LendCollectionCard';
import { MyOpenOffersList } from '@/components/lend/MyOpenOffersList';
import { CreateOfferDrawer, type CreateOfferFormData } from '@/components/lend/CreateOfferDrawer';
import { CreateOfferConfirmationModal } from '@/components/lend/CreateOfferConfirmationModal';
import { CancelOfferModal } from '@/components/lend/CancelOfferModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { useCreateOffer } from '@/hooks/transactions/useCreateOffer';
import { useCancelOffer } from '@/hooks/transactions/useCancelOffer';
import { useOffers } from '@/hooks/api/useOffers';
import { useCollections } from '@/hooks/api/useCollections';
import { useConnection } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import type { OfferItem } from '@/types/api';

export default function LendPage() {
  const chainId = useSafeChainId();
  const { address } = useConnection();
  const { data: apiOffers, refetch: refetchOffers } = useOffers({ lender: address });
  const { data: collectionsData } = useCollections(chainId);
  const { state: txState, createOffer, reset: resetTx } = useCreateOffer();
  const { state: cancelTxState, cancelOffer, reset: resetCancelTx } = useCancelOffer();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('rhg');
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

  const curated = useMemo(() => {
    const raw = getCuratedCollections(chainId);
    if (!collectionsData?.collections) return raw;
    return raw.map((col) => {
      const remote = collectionsData.collections.find(
        (c) => c.address.toLowerCase() === col.contractAddress.toLowerCase()
      );
      if (!remote) return col;
      return {
        ...col,
        id: remote.symbol.toLowerCase(),
        name: remote.name,
        symbol: remote.symbol,
      };
    });
  }, [chainId, collectionsData]);

  const collectionStats = useMemo(() => {
    const map: Record<string, { poolSizeEth: string; activeLoansCount: number }> = {};
    for (const col of curated) {
      const colAddress = col.contractAddress;
      const remote = collectionsData?.collections?.find(
        (c) => c.address.toLowerCase() === colAddress.toLowerCase()
      );
      map[col.id] = {
        poolSizeEth: remote?.poolSizeWei && remote.poolSizeWei !== '0'
          ? (Number(remote.poolSizeWei) / 1e18).toFixed(2)
          : '0.00',
        activeLoansCount: remote?.activeLoansCount || 0,
      };
    }
    return map;
  }, [collectionsData, curated]);

  const selectedCol = useMemo(() => {
    return curated.find((c) => c.id === selectedCollectionId) || curated[0];
  }, [curated, selectedCollectionId]);

  const handleOpenDrawer = (collection?: CuratedCollectionDefinition | ActiveCuratedCollection) => {
    if (collection) {
      setSelectedCollectionId(collection.id);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {curated.map((col) => (
            <LendCollectionCard
              key={col.id}
              collection={col}
              poolSizeEth={collectionStats[col.id]?.poolSizeEth || '0.00'}
              activeLoansCount={collectionStats[col.id]?.activeLoansCount || 0}
              onMakeOffer={handleOpenDrawer}
            />
          ))}
        </div>
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

      <CreateOfferDrawer
        isOpen={isDrawerOpen}
        collections={curated}
        initialCollectionId={selectedCollectionId}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
      />

      {pendingFormData && (
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
