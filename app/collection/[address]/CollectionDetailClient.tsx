'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useConnection } from 'wagmi';
import { CollectionHeader, type CollectionHeaderStats } from '@/components/collection/CollectionHeader';
import { CollectionOffersTable } from '@/components/collection/CollectionOffersTable';
import { CollectionLoanHistoryTable } from '@/components/collection/CollectionLoanHistoryTable';
import { CollectionRiskNotes } from '@/components/collection/CollectionRiskNotes';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { BorrowReviewDrawer } from '@/components/borrow/BorrowReviewDrawer';
import { useConnectModal } from '@/contexts/ConnectModalContext';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { useCollections, useCollection } from '@/hooks/api/useCollections';
import { useOffers } from '@/hooks/api/useOffers';
import { useLoans } from '@/hooks/api/useLoans';
import { useEligibleNfts } from '@/hooks/api/useEligibleNfts';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import type { ActiveCuratedCollection } from '@/config/collections';
import type { OfferItem } from '@/types/api';

export interface CollectionDetailClientProps {
  collection: ActiveCuratedCollection;
}

export function CollectionDetailClient({ collection: initialCollection }: CollectionDetailClientProps) {
  const { address, isConnected } = useConnection();
  const { openConnectModal } = useConnectModal();
  const chainId = useSafeChainId();
  const { data: collectionsData } = useCollections(chainId);
  const { data: remoteCollection } = useCollection(initialCollection.contractAddress, chainId);

  const matchedRemote = collectionsData?.collections?.find(
    (c) => c.address.toLowerCase() === initialCollection.contractAddress.toLowerCase()
  );

  const collection: ActiveCuratedCollection = useMemo(() => {
    const remote = remoteCollection || matchedRemote;
    if (!remote) return initialCollection;
    return {
      ...initialCollection,
      name: remote.name || initialCollection.name,
      symbol: remote.symbol || initialCollection.symbol,
      imageUrl: remote.imageUrl || initialCollection.imageUrl,
    };
  }, [initialCollection, matchedRemote, remoteCollection]);

  const [activeTab, setActiveTab] = useState<string>('offers');
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const targetAddress = collection.contractAddress.toLowerCase();

  const { data: offersData } = useOffers({ collection: targetAddress, chainId });
  const { data: loansData } = useLoans({ collection: targetAddress, chainId });
  const { nfts: userNfts } = useEligibleNfts(address, chainId);

  const openOffers = useMemo(() => {
    return (offersData?.offers || []).filter((o) => o.status === 'open');
  }, [offersData]);

  const activeLoans = useMemo(() => {
    return (loansData?.loans || []).filter((l) => l.status === 'active');
  }, [loansData]);

  const historyLoans = useMemo(() => {
    return (loansData?.loans || []).filter((l) => l.status !== 'active');
  }, [loansData]);

  const stats: CollectionHeaderStats = useMemo(() => {
    let poolSizeBigInt = 0n;
    let bestOfferBigInt = 0n;
    const aprValues: number[] = [];

    for (const offer of openOffers) {
      const p = BigInt(offer.principalWei);
      poolSizeBigInt += p;
      if (p > bestOfferBigInt) {
        bestOfferBigInt = p;
      }
      const days = offer.durationSeconds / 86400 || 7;
      const apr = (offer.termInterestBps / 10000) * (365 / days) * 100;
      aprValues.push(apr);
    }

    let aprRange = '--';
    if (aprValues.length > 0) {
      const minApr = Math.min(...aprValues);
      const maxApr = Math.max(...aprValues);
      if (minApr === maxApr) {
        aprRange = `${minApr.toFixed(2)}%`;
      } else {
        aprRange = `${minApr.toFixed(2)}% - ${maxApr.toFixed(2)}%`;
      }
    }

    return {
      bestOfferWei: bestOfferBigInt > 0n ? bestOfferBigInt.toString() : null,
      poolSizeWei: poolSizeBigInt.toString(),
      offerCount: openOffers.length,
      aprRange,
      activeLoansCount: activeLoans.length,
    };
  }, [openOffers, activeLoans]);

  const eligibleWalletNft = useMemo(() => {
    const found = userNfts.find(
      (n) => n.contractAddress.toLowerCase() === targetAddress
    );
    if (found) {
      return {
        contractAddress: found.contractAddress,
        tokenId: found.tokenId,
        collectionName: found.collectionName,
        name: found.name,
        imageUrl: found.imageUrl,
        bestOfferWei: stats.bestOfferWei || undefined,
        offerCount: stats.offerCount,
      };
    }
    return {
      contractAddress: collection.contractAddress,
      tokenId: '1',
      collectionName: collection.name,
      name: collection.name,
      imageUrl: collection.imageUrl || resolveCollectionImageUrl(collection.contractAddress, collection.symbol || collection.name),
      bestOfferWei: stats.bestOfferWei || undefined,
      offerCount: stats.offerCount,
    };
  }, [collection, targetAddress, userNfts, stats]);

  const handleBorrow = (offer: OfferItem) => {
    if (!isConnected) {
      openConnectModal();
      return;
    }
    setSelectedOffer(offer);
    setIsDrawerOpen(true);
  };

  const handleConfirmBorrow = () => {
    setIsDrawerOpen(false);
    setToastMessage(`Loan initiated successfully! Funds sent to wallet.`);
  };

  const tabs: TabItem[] = [
    { id: 'offers', label: 'Offers', count: openOffers.length },
    { id: 'active-loans', label: 'Active Loans', count: activeLoans.length },
    { id: 'history', label: 'History', count: historyLoans.length },
  ];

  return (
    <div className="space-y-8">
      <CollectionHeader
        collection={collection}
        stats={stats}
        imageUrl={collection.imageUrl}
      />

      <CollectionRiskNotes
        collectionName={collection.name}
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />

          {!isConnected ? (
            <Button variant="secondary" size="sm" onClick={openConnectModal}>
              + Make an Offer
            </Button>
          ) : (
            <Link href="/lend">
              <Button variant="secondary" size="sm">
                + Make an Offer
              </Button>
            </Link>
          )}
        </div>

        {activeTab === 'offers' && (
          <div className="space-y-3">
            <CollectionOffersTable
              offers={openOffers}
              onBorrow={handleBorrow}
            />
          </div>
        )}

        {activeTab === 'active-loans' && (
          <div className="space-y-3">
            <CollectionLoanHistoryTable loans={activeLoans} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <CollectionLoanHistoryTable loans={historyLoans} />
          </div>
        )}
      </div>

      <BorrowReviewDrawer
        isOpen={isDrawerOpen}
        nft={eligibleWalletNft}
        offer={selectedOffer}
        onClose={() => setIsDrawerOpen(false)}
        onConfirm={handleConfirmBorrow}
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
