'use client';

import { useMemo } from 'react';
import { useCollections } from '@/hooks/api/useCollections';
import { useExploreCollections } from '@/hooks/api/useExploreCollections';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import type { CollectionItemResponse, ExploreCollectionItem } from '@/types/api';

export interface UnifiedCollectionItem {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  floorPriceEth?: string;
  totalSupply?: string;
  holdersCount?: number;
  bestOfferWei: string | null;
  poolSizeWei: string;
  offerCount: number;
  activeLoansCount: number;
  isVerifiedErc721: boolean;
}

export function useUnifiedCollectionSearch({
  query = '',
  chainId,
  hasOffersOnly = false,
  limit = 50,
}: {
  query?: string;
  chainId?: number;
  hasOffersOnly?: boolean;
  limit?: number;
}) {
  const { data: protocolCollectionsData, isLoading: isLoadingProtocol } = useCollections(chainId);
  const {
    data: exploreData,
    isLoading: isLoadingExplore,
    isError,
    error,
    refetch,
  } = useExploreCollections({
    chainId,
    search: query.trim() || undefined,
    hasOffers: hasOffersOnly,
    limit,
  });

  const collections = useMemo(() => {
    const map = new Map<string, UnifiedCollectionItem>();

    const baseList: UnifiedCollectionItem[] =
      protocolCollectionsData?.collections && protocolCollectionsData.collections.length > 0
        ? protocolCollectionsData.collections.map((item) => ({
            ...item,
            bestOfferWei: item.bestOfferWei ?? null,
            poolSizeWei: item.poolSizeWei || '0',
            offerCount: item.offerCount || 0,
            activeLoansCount: item.activeLoansCount || 0,
            isVerifiedErc721: true,
          }))
        : [];

    for (const item of baseList) {
      map.set(item.address.toLowerCase(), {
        address: item.address,
        name: item.name,
        symbol: item.symbol,
        imageUrl: item.imageUrl || resolveCollectionImageUrl(item.address, item.symbol || item.name),
        bestOfferWei: item.bestOfferWei ?? null,
        poolSizeWei: item.poolSizeWei || '0',
        offerCount: item.offerCount || 0,
        activeLoansCount: item.activeLoansCount || 0,
        isVerifiedErc721: true,
      });
    }

    if (exploreData?.collections) {
      for (const item of exploreData.collections) {
        const key = item.address.toLowerCase();
        const existing = map.get(key);
        map.set(key, {
          address: item.address,
          name: (existing && existing.name !== 'Robinhood NFT' && existing.name !== 'ERC721 Collection') ? existing.name : item.name,
          symbol: existing?.symbol || item.symbol,
          imageUrl: item.imageUrl || existing?.imageUrl || resolveCollectionImageUrl(item.address, item.symbol || item.name),
          bestOfferWei: item.bestOfferWei ?? existing?.bestOfferWei ?? null,
          poolSizeWei: item.poolSizeWei || existing?.poolSizeWei || '0',
          offerCount: item.offerCount ?? existing?.offerCount ?? 0,
          activeLoansCount: item.activeLoansCount ?? existing?.activeLoansCount ?? 0,
          isVerifiedErc721: true,
          totalSupply: item.totalSupply,
          holdersCount: item.holdersCount,
        });
      }
    }

    let result = Array.from(map.values());

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }

    if (hasOffersOnly) {
      result = result.filter((c) => (c.offerCount || 0) > 0);
    }

    return result;
  }, [protocolCollectionsData, exploreData, query, hasOffersOnly]);

  return {
    collections,
    isLoading: !protocolCollectionsData && !exploreData && (isLoadingProtocol || isLoadingExplore),
    isError,
    error,
    refetch,
  };
}
