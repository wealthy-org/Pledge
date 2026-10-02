import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchNftMetadata,
  sanitizeImageUrl,
  clearMetadataCache,
  getMetadataCacheSize,
  FALLBACK_NFT_IMAGE,
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

  describe('TS-02: IPFS & Arweave Resolution', () => {
    it('resolves ipfs:// URI to https gateway URL', () => {
      const ipfsUri = 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/1.png';
      const resolved = sanitizeImageUrl(ipfsUri);
      expect(resolved).toBe('https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/1.png');
    });

    it('resolves ar:// URI to https gateway URL', () => {
      const arUri = 'ar://u1r2v3w4x5y6/image.png';
      const resolved = sanitizeImageUrl(arUri);
      expect(resolved).toBe('https://arweave.net/u1r2v3w4x5y6/image.png');
    });

    it('preserves standard secure https URLs', () => {
      const httpsUrl = 'https://example.com/nft/123.jpg';
      const resolved = sanitizeImageUrl(httpsUrl);
      expect(resolved).toBe(httpsUrl);
    });
  });

  describe('TS-03: Malicious URL Sanitization & Protocol Allowlist', () => {
    it('sanitizes javascript: scheme to fallback image', () => {
      const malicious = 'javascript:alert(1)';
      const sanitized = sanitizeImageUrl(malicious);
      expect(sanitized).toBe(FALLBACK_NFT_IMAGE);
    });

    it('sanitizes data: scheme to fallback image', () => {
      const dataUri = 'data:text/html,<script>alert(1)</script>';
      const sanitized = sanitizeImageUrl(dataUri);
      expect(sanitized).toBe(FALLBACK_NFT_IMAGE);
    });

    it('sanitizes file: and vbscript: schemes to fallback image', () => {
      expect(sanitizeImageUrl('file:///etc/passwd')).toBe(FALLBACK_NFT_IMAGE);
      expect(sanitizeImageUrl('vbscript:msgbox(1)')).toBe(FALLBACK_NFT_IMAGE);
    });

    it('returns fallback image for null, undefined, or empty string', () => {
      expect(sanitizeImageUrl(null)).toBe(FALLBACK_NFT_IMAGE);
      expect(sanitizeImageUrl(undefined)).toBe(FALLBACK_NFT_IMAGE);
      expect(sanitizeImageUrl('')).toBe(FALLBACK_NFT_IMAGE);
    });
  });

  describe('TS-04: Graceful Metadata Fallback (Rule 11 & Resilience)', () => {
    it('provides valid fallback metadata when downstream service fails or token has empty metadata', async () => {
      const unknownCollection = '0x9999999999999999999999999999999999999999';
      const result = await fetchNftMetadata(unknownCollection, '999');

      expect(result).toBeDefined();
      expect(result.contractAddress.toLowerCase()).toBe(unknownCollection.toLowerCase());
      expect(result.tokenId).toBe('999');
      expect(result.imageUrl).toBe(FALLBACK_NFT_IMAGE);
      expect(result.isFallback).toBe(true);
    });
  });

  describe('TS-05: Parameter Validation & Explicit Errors (Rule 11)', () => {
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
