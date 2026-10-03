import { describe, it, expect, beforeEach } from 'vitest';
import { indexerStore } from '@/lib/indexer/store';
import { clearSnapshotCache } from '@/lib/protocol/snapshot';
import {
  fetchCollectionsWithStats,
  fetchCollectionDetail,
  fetchMarketStats,
  fetchCollectionOffers,
} from '@/lib/db/queries';
import { TESTNET_CHAIN_ID } from '@/config/chains';

describe('Cross-Page Protocol Consistency Test Suite', () => {
  const RHG_ADDRESS = '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9';

  beforeEach(() => {
    clearSnapshotCache();
    indexerStore.reset();
  });

  it('maintains 100% data synchronization across market overview, collection detail, borrow and lend routes', async () => {
    indexerStore.upsertOffer({
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: '0x1111111111111111111111111111111111111111',
      collection: RHG_ADDRESS,
      principal_wei: '1500000000000000000',
      term_interest_bps: 400,
      fee_bps_snapshot: 200,
      duration_seconds: 604800,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'open',
      block_number: 100,
      tx_hash: '0x1',
      indexed_at: new Date().toISOString(),
    });

    indexerStore.upsertOffer({
      offer_id: 2,
      chain_id: TESTNET_CHAIN_ID,
      lender: '0x2222222222222222222222222222222222222222',
      collection: RHG_ADDRESS,
      principal_wei: '3000000000000000000',
      term_interest_bps: 500,
      fee_bps_snapshot: 200,
      duration_seconds: 604800,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'open',
      block_number: 101,
      tx_hash: '0x2',
      indexed_at: new Date().toISOString(),
    });

    indexerStore.upsertLoan({
      loan_id: 1,
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: '0x1111111111111111111111111111111111111111',
      borrower: '0x3333333333333333333333333333333333333333',
      collection: RHG_ADDRESS,
      token_id: '42',
      principal_wei: '1500000000000000000',
      interest_wei: '60000000000000000',
      fee_bps_snapshot: 200,
      started_at: new Date().toISOString(),
      due_at: new Date(Date.now() + 604800000).toISOString(),
      status: 'active',
      block_number: 102,
      tx_hash: '0xloan1',
      indexed_at: new Date().toISOString(),
    });

    const marketCollections = await fetchCollectionsWithStats(TESTNET_CHAIN_ID);
    const rhgMarket = marketCollections.find((c) => c.address.toLowerCase() === RHG_ADDRESS.toLowerCase());
    expect(rhgMarket).toBeDefined();

    const collectionDetail = await fetchCollectionDetail(RHG_ADDRESS, TESTNET_CHAIN_ID);
    expect(collectionDetail).not.toBeNull();

    const collectionOffers = await fetchCollectionOffers(RHG_ADDRESS, 'open', 'principal', 20, undefined, TESTNET_CHAIN_ID);

    const marketStats = await fetchMarketStats(TESTNET_CHAIN_ID);

    expect(rhgMarket?.bestOfferWei).toBe('3000000000000000000');
    expect(collectionDetail?.stats.bestOfferWei).toBe('3000000000000000000');
    expect(collectionOffers.offers[0].principalWei).toBe('3000000000000000000');

    expect(rhgMarket?.poolSizeWei).toBe('4500000000000000000');
    expect(collectionDetail?.stats.poolSizeWei).toBe('4500000000000000000');
    expect(marketStats.totalPoolSizeWei).toBe('4500000000000000000');

    expect(rhgMarket?.offerCount).toBe(2);
    expect(collectionDetail?.stats.offerCount).toBe(2);
    expect(collectionOffers.total).toBe(2);

    expect(rhgMarket?.activeLoansCount).toBe(1);
    expect(collectionDetail?.stats.activeLoansCount).toBe(1);
    expect(marketStats.totalActiveLoansCount).toBe(1);
  });
});
