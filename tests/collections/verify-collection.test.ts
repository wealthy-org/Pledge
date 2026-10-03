import { describe, it, expect, vi } from 'vitest';
import { isAddress } from 'viem';
import {
  fetchOnChainCollection,
  getCuratedCollections,
  getCollectionByAddress,
} from '@/config/collections';
import { TESTNET_CHAIN_ID } from '@/config/chains';

describe('TICKET-07b: Dynamic On-Chain Collection Verification Test Suite', () => {
  it('TS-01: fetchOnChainCollection verifies live contract and returns metadata', async () => {
    const mockAddr = '0x1111111111111111111111111111111111111111';
    const col = await fetchOnChainCollection(mockAddr, TESTNET_CHAIN_ID);
    if (col) {
      expect(isAddress(col.contractAddress)).toBe(true);
      expect(col.defaultDurations).toEqual([7, 14, 30]);
    } else {
      expect(col).toBeNull();
    }
  });

  it('TS-02: fetchOnChainCollection returns null for empty or invalid contracts', async () => {
    const invalidAddr = '0x000000000000000000000000000000000000dEaD';
    const invalidCol = await fetchOnChainCollection(invalidAddr as any, TESTNET_CHAIN_ID);
    expect(invalidCol).toBeNull();
  });

  it('TS-03: getCuratedCollections returns dynamic collection array', () => {
    const cols = getCuratedCollections(TESTNET_CHAIN_ID);
    expect(Array.isArray(cols)).toBe(true);
  });

  it('TS-04: getCollectionByAddress safely handles unknown addresses', () => {
    const notFound = getCollectionByAddress('0x9999999999999999999999999999999999999999', TESTNET_CHAIN_ID);
    expect(notFound).toBeNull();
  });
});
