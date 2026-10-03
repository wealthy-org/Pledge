import { describe, it, expect } from 'vitest';
import { isAddress } from 'viem';
import { MAINNET_CURATED_COLLECTIONS, getMainnetCollectionByAddress } from '@/config/collections.mainnet';

describe('TICKET-19b: Mainnet Collection Admission Technical Audit Suite', () => {
  it('TS-01: Validates all 3 curated collections have valid mainnet checksum addresses', () => {
    expect(MAINNET_CURATED_COLLECTIONS).toHaveLength(3);
    for (const col of MAINNET_CURATED_COLLECTIONS) {
      expect(isAddress(col.contractAddress)).toBe(true);
      expect(col.name).toBeDefined();
      expect(col.symbol).toBeDefined();
      expect(col.defaultDurations).toEqual([7, 14, 30]);
    }
  });

  it('TS-02: Confirms retrieval by address works case-insensitively', () => {
    const rhg = MAINNET_CURATED_COLLECTIONS[0];
    const retrieved = getMainnetCollectionByAddress(rhg.contractAddress.toLowerCase());
    expect(retrieved).not.toBeNull();
    expect(retrieved?.symbol).toBe(rhg.symbol);
  });

  it('TS-03: Returns null for unknown or unwhitelisted address', () => {
    const unwhitelisted = getMainnetCollectionByAddress('0x000000000000000000000000000000000000dead');
    expect(unwhitelisted).toBeNull();
  });
});
