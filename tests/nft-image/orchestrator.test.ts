import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveNftImage,
  clearNftImageCache,
  getNftImageCacheSize,
} from '@/lib/nft-image';
import * as tier1Module from '@/lib/nft-image/tier1-blockscout';
import * as tier2Module from '@/lib/nft-image/tier2-onchain';

describe('NFT Image Resolution Orchestrator', () => {
  const contract = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const tokenId = '9124';

  beforeEach(() => {
    clearNftImageCache();
    vi.restoreAllMocks();
  });

  it('short-circuits at Tier 1 if Blockscout returns valid image', async () => {
    const tier1Spy = vi.spyOn(tier1Module, 'resolveFromBlockscout').mockResolvedValue({
      url: 'https://gateway.pinata.cloud/ipfs/bafytest',
      source: 'blockscout',
      isFallback: false,
      rawUri: 'ipfs://bafytest',
    });
    const tier2Spy = vi.spyOn(tier2Module, 'resolveFromTokenUri');

    const result = await resolveNftImage(contract, tokenId);
    expect(result.source).toBe('blockscout');
    expect(result.isFallback).toBe(false);
    expect(tier1Spy).toHaveBeenCalledTimes(1);
    expect(tier2Spy).not.toHaveBeenCalled();
  });

  it('falls back to Tier 2 if Tier 1 returns null', async () => {
    vi.spyOn(tier1Module, 'resolveFromBlockscout').mockResolvedValue(null);
    const tier2Spy = vi.spyOn(tier2Module, 'resolveFromTokenUri').mockResolvedValue({
      url: 'https://example.com/onchain.png',
      source: 'onchain-uri',
      isFallback: false,
      rawUri: 'https://example.com/onchain.png',
    });

    const result = await resolveNftImage(contract, tokenId);
    expect(result.source).toBe('onchain-uri');
    expect(result.url).toBe('https://example.com/onchain.png');
    expect(tier2Spy).toHaveBeenCalledTimes(1);
  });

  it('falls back to Tier 3 generative artwork if Tier 1 and Tier 2 return null', async () => {
    vi.spyOn(tier1Module, 'resolveFromBlockscout').mockResolvedValue(null);
    vi.spyOn(tier2Module, 'resolveFromTokenUri').mockResolvedValue(null);

    const result = await resolveNftImage(contract, tokenId);
    expect(result.source).toBe('generative');
    expect(result.isFallback).toBe(true);
    expect(result.url.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });

  it('caches successful resolutions in memory', async () => {
    const tier1Spy = vi.spyOn(tier1Module, 'resolveFromBlockscout').mockResolvedValue({
      url: 'https://example.com/cached.png',
      source: 'blockscout',
      isFallback: false,
      rawUri: 'https://example.com/cached.png',
    });

    const first = await resolveNftImage(contract, tokenId);
    const second = await resolveNftImage(contract, tokenId);

    expect(first.url).toBe(second.url);
    expect(tier1Spy).toHaveBeenCalledTimes(1);
    expect(getNftImageCacheSize()).toBe(1);
  });

  it('bypasses cache when bypassCache option is true', async () => {
    const tier1Spy = vi.spyOn(tier1Module, 'resolveFromBlockscout').mockResolvedValue({
      url: 'https://example.com/fresh.png',
      source: 'blockscout',
      isFallback: false,
      rawUri: 'https://example.com/fresh.png',
    });

    await resolveNftImage(contract, tokenId);
    await resolveNftImage(contract, tokenId, { bypassCache: true });

    expect(tier1Spy).toHaveBeenCalledTimes(2);
  });

  it('deduplicates simultaneous in-flight requests for the same NFT', async () => {
    let callCount = 0;
    vi.spyOn(tier1Module, 'resolveFromBlockscout').mockImplementation(async () => {
      callCount++;
      await new Promise((res) => setTimeout(res, 50));
      return {
        url: 'https://example.com/parallel.png',
        source: 'blockscout',
        isFallback: false,
        rawUri: 'https://example.com/parallel.png',
      };
    });

    const [res1, res2, res3] = await Promise.all([
      resolveNftImage(contract, tokenId),
      resolveNftImage(contract, tokenId),
      resolveNftImage(contract, tokenId),
    ]);

    expect(res1.url).toBe('https://example.com/parallel.png');
    expect(res2.url).toBe('https://example.com/parallel.png');
    expect(res3.url).toBe('https://example.com/parallel.png');
    expect(callCount).toBe(1);
  });
});
