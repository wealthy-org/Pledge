import { describe, it, expect } from 'vitest';
import { isAddress } from 'viem';
import {
  CURATED_COLLECTIONS,
  getCuratedCollections,
  getCollectionByAddress,
  isCollectionAllowed,
} from '@/config/collections';
import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';

describe('TICKET-07b: Curated Collections & Verification Test Suite', () => {
  it('TS-01: Contains at least 3 curated collections with valid metadata and addresses', () => {
    expect(CURATED_COLLECTIONS.length).toBeGreaterThanOrEqual(3);

    CURATED_COLLECTIONS.forEach((col) => {
      expect(col.id).toBeTruthy();
      expect(col.name).toBeTruthy();
      expect(col.symbol).toBeTruthy();
      expect(col.description).toBeTruthy();
      expect(col.totalSupply).toBeGreaterThan(0);
      expect(col.category).toBeTruthy();
      expect(col.defaultDurations).toEqual([7, 14, 30]);

      expect(isAddress(col.addresses[TESTNET_CHAIN_ID])).toBe(true);
      expect(isAddress(col.addresses[MAINNET_CHAIN_ID])).toBe(true);
      expect(col.addresses[TESTNET_CHAIN_ID]).not.toBe(col.addresses[MAINNET_CHAIN_ID]);
    });
  });

  it('TS-02: getCuratedCollections resolves addresses according to active chain ID', () => {
    const testnetCols = getCuratedCollections(TESTNET_CHAIN_ID);
    const mainnetCols = getCuratedCollections(MAINNET_CHAIN_ID);

    expect(testnetCols.length).toBe(CURATED_COLLECTIONS.length);
    expect(mainnetCols.length).toBe(CURATED_COLLECTIONS.length);

    expect(testnetCols[0].contractAddress).toBe(CURATED_COLLECTIONS[0].addresses[TESTNET_CHAIN_ID]);
    expect(mainnetCols[0].contractAddress).toBe(CURATED_COLLECTIONS[0].addresses[MAINNET_CHAIN_ID]);
  });

  it('TS-03: isCollectionAllowed correctly checks address membership', () => {
    const validTestnetAddr = CURATED_COLLECTIONS[0].addresses[TESTNET_CHAIN_ID];
    const invalidAddr = '0x000000000000000000000000000000000000dEaD';

    expect(isCollectionAllowed(validTestnetAddr, TESTNET_CHAIN_ID)).toBe(true);
    expect(isCollectionAllowed(invalidAddr, TESTNET_CHAIN_ID)).toBe(false);
  });

  it('TS-04: getCollectionByAddress retrieves collection or returns null safely', () => {
    const validTestnetAddr = CURATED_COLLECTIONS[1].addresses[TESTNET_CHAIN_ID];
    const found = getCollectionByAddress(validTestnetAddr, TESTNET_CHAIN_ID);

    expect(found).not.toBeNull();
    expect(found?.symbol).toBe(CURATED_COLLECTIONS[1].symbol);

    const notFound = getCollectionByAddress('0x9999999999999999999999999999999999999999', TESTNET_CHAIN_ID);
    expect(notFound).toBeNull();
  });
});
