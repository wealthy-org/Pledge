import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveFromGondi } from '@/lib/nft-image/tier1-gondi';
import { gondiClient } from '@/lib/gondi';

describe('Tier 1: Gondi Resolver', () => {
  const contract = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const tokenId = '9124';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns resolved image from valid Gondi CDN cacheUrl', async () => {
    vi.spyOn(gondiClient, 'getNftMetadata').mockResolvedValueOnce({
      id: '123',
      tokenId,
      name: 'Pudgy Penguin #9124',
      description: '',
      image: {
        cacheUrl: 'https://cdn.gondi.xyz/image/txOyWVb6N3KUlg48gNKG2A==',
      },
      collection: {
        id: '2173',
        name: 'Pudgy Penguins',
        slug: 'pudgypenguins',
      },
    });

    const result = await resolveFromGondi(contract, tokenId);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('gondi-cdn');
    expect(result?.isFallback).toBe(false);
    expect(result?.url).toBe('https://cdn.gondi.xyz/image/txOyWVb6N3KUlg48gNKG2A==');
  });

  it('returns null if Gondi returns no image', async () => {
    vi.spyOn(gondiClient, 'getNftMetadata').mockResolvedValueOnce({
      id: '123',
      tokenId,
      name: 'Empty #1',
      description: '',
      image: null,
      collection: {
        id: '1',
        name: 'Empty NFT',
        slug: 'empty',
      },
    });

    const result = await resolveFromGondi(contract, tokenId);
    expect(result).toBeNull();
  });

  it('returns null gracefully on Gondi API error or 404', async () => {
    vi.spyOn(gondiClient, 'getNftMetadata').mockRejectedValueOnce(new Error('HTTP 404 Not Found'));

    const result = await resolveFromGondi(contract, tokenId);
    expect(result).toBeNull();
  });

  it('returns null when input parameters are invalid', async () => {
    expect(await resolveFromGondi('', '1')).toBeNull();
    expect(await resolveFromGondi(contract, '')).toBeNull();
  });
});
