import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveFromBlockscout } from '@/lib/nft-image/tier1-blockscout';
import * as blockscoutModule from '@/lib/blockscout';

describe('Tier 1: Blockscout Resolver', () => {
  const contract = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const tokenId = '9124';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns resolved image from valid Blockscout imageUrl', async () => {
    const mockClient = {
      fetchNFTInstance: vi.fn().mockResolvedValue({
        tokenId,
        collectionAddress: contract,
        collectionName: 'Robinhood Silver',
        name: 'Robinhood Silver #9124',
        description: '',
        imageUrl: 'https://ipfs.io/ipfs/bafybeiefvqwyjtabs3imzrz7fkftqe2vwrazy66mlse7ljz3bvm3vp6qqm',
        attributes: [],
      }),
    };
    vi.spyOn(blockscoutModule, 'getBlockscoutClient').mockReturnValue(mockClient as any);

    const result = await resolveFromBlockscout(contract, tokenId);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('blockscout');
    expect(result?.isFallback).toBe(false);
    expect(result?.url).toBe('https://gateway.pinata.cloud/ipfs/bafybeiefvqwyjtabs3imzrz7fkftqe2vwrazy66mlse7ljz3bvm3vp6qqm');
  });

  it('returns null if Blockscout returns no image', async () => {
    const mockClient = {
      fetchNFTInstance: vi.fn().mockResolvedValue({
        tokenId,
        collectionAddress: contract,
        collectionName: 'Empty Image NFT',
        name: 'Empty #1',
        description: '',
        imageUrl: '',
        attributes: [],
      }),
    };
    vi.spyOn(blockscoutModule, 'getBlockscoutClient').mockReturnValue(mockClient as any);

    const result = await resolveFromBlockscout(contract, tokenId);
    expect(result).toBeNull();
  });

  it('returns null gracefully on Blockscout API error or 404', async () => {
    const mockClient = {
      fetchNFTInstance: vi.fn().mockRejectedValue(new Error('HTTP 404 Not Found')),
    };
    vi.spyOn(blockscoutModule, 'getBlockscoutClient').mockReturnValue(mockClient as any);

    const result = await resolveFromBlockscout(contract, tokenId);
    expect(result).toBeNull();
  });

  it('returns null when input parameters are invalid', async () => {
    expect(await resolveFromBlockscout('', '1')).toBeNull();
    expect(await resolveFromBlockscout(contract, '')).toBeNull();
  });
});
