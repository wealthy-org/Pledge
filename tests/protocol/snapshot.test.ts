import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProtocolSnapshot, clearSnapshotCache } from '@/lib/protocol/snapshot';
import { indexerStore } from '@/lib/indexer/store';
import { TESTNET_CHAIN_ID } from '@/config/chains';

describe('ProtocolSnapshot Service Suite', () => {
  beforeEach(() => {
    clearSnapshotCache();
    indexerStore.reset();
  });

  it('generates deterministic protocol snapshot from memory store', async () => {
    indexerStore.upsertOffer({
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: '0x1111111111111111111111111111111111111111',
      collection: '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9',
      principal_wei: '1000000000000000000',
      term_interest_bps: 400,
      fee_bps_snapshot: 200,
      duration_seconds: 604800,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'open',
      block_number: 100,
      tx_hash: '0x1',
      indexed_at: new Date().toISOString(),
    });

    const snapshot = await getProtocolSnapshot(TESTNET_CHAIN_ID);
    expect(snapshot.chainId).toBe(TESTNET_CHAIN_ID);
    expect(snapshot.offers.length).toBe(1);
    expect(snapshot.offers[0].offerId).toBe(1);
    expect(snapshot.offers[0].principalWei).toBe('1000000000000000000');
    expect(snapshot.offers[0].isExpired).toBe(false);
  });

  it('marks past-expiry offers as isExpired: true', async () => {
    indexerStore.upsertOffer({
      offer_id: 2,
      chain_id: TESTNET_CHAIN_ID,
      lender: '0x1111111111111111111111111111111111111111',
      collection: '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9',
      principal_wei: '500000000000000000',
      term_interest_bps: 300,
      fee_bps_snapshot: 200,
      duration_seconds: 86400,
      expires_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'open',
      block_number: 100,
      tx_hash: '0x2',
      indexed_at: new Date().toISOString(),
    });

    const snapshot = await getProtocolSnapshot(TESTNET_CHAIN_ID);
    expect(snapshot.offers.length).toBe(1);
    expect(snapshot.offers[0].isExpired).toBe(true);
  });

  it('deduplicates simultaneous in-flight snapshot requests', async () => {
    const p1 = getProtocolSnapshot(TESTNET_CHAIN_ID);
    const p2 = getProtocolSnapshot(TESTNET_CHAIN_ID);
    const [res1, res2] = await Promise.all([p1, p2]);
    expect(res1).toBe(res2);
  });
});
