import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchNftMetadata,
  resolveCollectionImageUrl,
  clearMetadataCache,
  getMetadataCacheSize,
  fetchOnChainCollectionInfo,
} from '@/lib/services/metadata';

describe('TICKET-22: NFT Metadata Service & Caching Layer Test Suite', () => {
  const VALID_COLLECTION = '0x1111111111111111111111111111111111111111';
  const TOKEN_ID = '42';

  beforeEach(() => {
    clearMetadataCache();
    vi.restoreAllMocks();
  });

  describe('TS-01: Cache Hit & Cache-Aside Behavior', () => {
    it('stores fetched metadata in cache and serves subsequent requests from cache', async () => {
      expect(getMetadataCacheSize()).toBe(0);

      const firstResult = await fetchNftMetadata(VALID_COLLECTION, TOKEN_ID);
      expect(firstResult.tokenId).toBe(TOKEN_ID);
      expect(firstResult.contractAddress.toLowerCase()).toBe(VALID_COLLECTION.toLowerCase());
      expect(getMetadataCacheSize()).toBe(1);

      const secondResult = await fetchNftMetadata(VALID_COLLECTION, TOKEN_ID);
      expect(secondResult).toEqual(firstResult);
      expect(getMetadataCacheSize()).toBe(1);
    });

    it('bypasses cache when bypassCache option is true', async () => {
      await fetchNftMetadata(VALID_COLLECTION, TOKEN_ID);
      expect(getMetadataCacheSize()).toBe(1);

      const refreshed = await fetchNftMetadata(VALID_COLLECTION, TOKEN_ID, { bypassCache: true });
      expect(refreshed.tokenId).toBe(TOKEN_ID);
    });
  });

  describe('TS-02: Dynamic URL Resolution with Pure String Interpolation', () => {
    it('interpolates collection name directly into image query URL without if-else', () => {
      const url = resolveCollectionImageUrl('Nottingham Guild Pledges');
      expect(url).toContain('keyword=Nottingham%20Guild%20Pledges');
      expect(url).toContain('https://images.unsplash.com');
    });

    it('handles arbitrary collection names via URL encoding', () => {
      const url = resolveCollectionImageUrl('Sherwood Forest & Rangers #1');
      expect(url).toContain('keyword=Sherwood%20Forest%20%26%20Rangers%20%231');
    });
  });

  describe('TS-03: On-Chain Collection Info Fetching', () => {
    it('returns collection address, name, and symbol', async () => {
      const info = await fetchOnChainCollectionInfo(VALID_COLLECTION);
      expect(info.address.toLowerCase()).toBe(VALID_COLLECTION.toLowerCase());
      expect(info.name).toBeDefined();
      expect(info.symbol).toBeDefined();
    });
  });

  describe('TS-04: Parameter Validation & Explicit Errors (Rule 11)', () => {
    it('throws explicit error for invalid collection address format', async () => {
      await expect(fetchNftMetadata('invalid-contract', '1')).rejects.toThrow(
        'Invalid collection address: invalid-contract'
      );
    });

    it('throws explicit error for empty token ID', async () => {
      await expect(fetchNftMetadata(VALID_COLLECTION, '')).rejects.toThrow(
        'Invalid token ID: token ID must be a non-empty string'
      );
    });
  });
});
