import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as orchestratorModule from '@/lib/nft-image';
import * as metadataService from '@/lib/services/metadata';

describe('TICKET-87: Multi-Tier Metadata & Image Resolution End-to-End Suite', () => {
  const contract = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const tokenId = '9124';

  beforeEach(() => {
    metadataService.clearMetadataCache();
    orchestratorModule.clearNftImageCache();
    vi.restoreAllMocks();
  });

  it('resolves metadata with Tier 1 Blockscout image', async () => {
    vi.spyOn(orchestratorModule, 'resolveNftImage').mockResolvedValueOnce({
      url: 'https://gateway.pinata.cloud/ipfs/bafybeiefvqwyjtabs3imzrz7fkftqe2vwrazy66mlse7ljz3bvm3vp6qqm',
      source: 'blockscout',
      isFallback: false,
      rawUri: 'ipfs://bafybeiefvqwyjtabs3imzrz7fkftqe2vwrazy66mlse7ljz3bvm3vp6qqm',
    });

    const metadata = await metadataService.fetchNftMetadata(contract, tokenId);
    expect(metadata.imageUrl).toBe('https://gateway.pinata.cloud/ipfs/bafybeiefvqwyjtabs3imzrz7fkftqe2vwrazy66mlse7ljz3bvm3vp6qqm');
    expect(metadata.imageSource).toBe('blockscout');
    expect(metadata.isFallback).toBe(false);
  });

  it('resolves metadata with Tier 2 On-Chain tokenURI image when Tier 1 is absent', async () => {
    vi.spyOn(orchestratorModule, 'resolveNftImage').mockResolvedValueOnce({
      url: 'https://gateway.pinata.cloud/ipfs/bafycustom',
      source: 'onchain-uri',
      isFallback: false,
      rawUri: 'ipfs://bafycustom',
    });

    const metadata = await metadataService.fetchNftMetadata(contract, tokenId, { bypassCache: true });
    expect(metadata.imageUrl).toBe('https://gateway.pinata.cloud/ipfs/bafycustom');
    expect(metadata.imageSource).toBe('onchain-uri');
    expect(metadata.isFallback).toBe(false);
  });

  it('resolves metadata with Tier 3 Generative SVG when Tier 1 and Tier 2 fail', async () => {
    vi.spyOn(orchestratorModule, 'resolveNftImage').mockResolvedValueOnce({
      url: 'data:image/svg+xml;utf8,%3Csvg%3E%3C%2Fsvg%3E',
      source: 'generative',
      isFallback: true,
      rawUri: null,
    });

    const metadata = await metadataService.fetchNftMetadata(contract, tokenId, { bypassCache: true });
    expect(metadata.imageUrl.startsWith('data:image/svg+xml')).toBe(true);
    expect(metadata.imageSource).toBe('generative');
    expect(metadata.isFallback).toBe(true);
  });

  it('serves cached metadata on subsequent calls', async () => {
    const spy = vi.spyOn(orchestratorModule, 'resolveNftImage').mockResolvedValue({
      url: 'https://example.com/cached.png',
      source: 'blockscout',
      isFallback: false,
      rawUri: 'https://example.com/cached.png',
    });

    const first = await metadataService.fetchNftMetadata(contract, tokenId);
    const second = await metadataService.fetchNftMetadata(contract, tokenId);

    expect(first.imageUrl).toBe(second.imageUrl);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
