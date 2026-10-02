'use client';

import React, { useState, useMemo } from 'react';
import { CURATED_COLLECTIONS, type CuratedCollectionDefinition } from '@/config/collections';
import { MOCK_OFFERS, getMockCollectionStats } from '@/lib/mock/fixtures';
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
import { useAccount } from 'wagmi';
import type { OfferItem } from '@/types/api';

export default function LendPage() {
  const { address } = useAccount();
  const { data: apiOffers } = useOffers({ lender: address });
  const { state: txState, createOffer, reset: resetTx } = useCreateOffer();
  const { state: cancelTxState, cancelOffer, reset: resetCancelTx } = useCancelOffer();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('rhg');
  const [pendingFormData, setPendingFormData] = useState<CreateOfferFormData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const [cancellingOffer, setCancellingOffer] = useState<OfferItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [localOffers, setLocalOffers] = useState<OfferItem[]>(() => {
    return MOCK_OFFERS.filter((o) => o.status === 'open');
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayOffers = (apiOffers?.offers && apiOffers.offers.length > 0) ? apiOffers.offers : localOffers;

  const collectionStats = useMemo(() => {
    const map: Record<string, { poolSizeEth: string; activeLoansCount: number }> = {};
    for (const col of CURATED_COLLECTIONS) {
      const stats = getMockCollectionStats(col.addresses[46630]);
      map[col.id] = {
        poolSizeEth: stats.poolSizeWei !== '0'
          ? (Number(stats.poolSizeWei) / 1e18).toFixed(2)
          : '0.00',
        activeLoansCount: stats.activeLoansCount,
      };
    }
    return map;
  }, []);

  const selectedCol = useMemo(() => {
    return CURATED_COLLECTIONS.find((c) => c.id === selectedCollectionId) || CURATED_COLLECTIONS[0];
  }, [selectedCollectionId]);

  const handleOpenDrawer = (collection?: CuratedCollectionDefinition) => {
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
        chainId: 46630,
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
    } catch {
      // Error handled by modal
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
      await cancelOffer({
        offerId: cancellingOffer.offerId,
        principalWei: cancellingOffer.principalWei,
      });

      setLocalOffers((prev) => prev.filter((o) => o.offerId !== cancellingOffer.offerId));
      setToastMessage(`Offer #${cancellingOffer.offerId} cancelled. Capital returned to claimable proceeds.`);
    } catch {
      // Handled by modal
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="relative overflow-hidden rounded-[var(--radius)] bg-gradient-to-br from-[#214E3B] to-[#123124] text-white p-8 lg:p-10 shadow-[var(--shadow-raised)]">
        <div className="max-w-2xl relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#A5C9B3] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Yield Generation Workbench</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Earn Fixed Yields on Your Capital
          </h1>

          <p className="text-[#D7E6D9] text-sm sm:text-base leading-relaxed">
            Provide liquidity to NFT holders on Robinhood Chain at deterministic fixed interest rates. Receive predictable yield returns upon loan settlement, backed by full collateral protection.
          </p>

          <div className="pt-2">
            <button
              onClick={() => handleOpenDrawer()}
              className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-dark)] transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <span>➕</span>
              <span>Create Custom Offer</span>
            </button>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center text-[180px] font-black">
          💰
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">Liquidity Opportunities</h2>
          <p className="text-xs text-[var(--muted)]">
            Explore curated collections seeking peer-to-peer liquidity deployment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CURATED_COLLECTIONS.map((col) => (
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

      <div className="space-y-4 pt-4 border-t border-[var(--line)]">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">Your Open Offers</h2>
          <p className="text-xs text-[var(--muted)]">
            Active liquidity offers deposited into the protocol waiting to be accepted by borrowers
          </p>
        </div>

        <MyOpenOffersList
          offers={displayOffers}
          onCancelOffer={handleOpenCancelModal}
        />
      </div>

      <CreateOfferDrawer
        isOpen={isDrawerOpen}
        collections={CURATED_COLLECTIONS}
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
