import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GondiClient, executeGondiQuery, clearGondiCache, GondiApiError } from '@/lib/gondi';
import { resolveFromGondi } from '@/lib/nft-image/tier1-gondi';

describe('Gondi GraphQL API Client & Resolver Suite', () => {
  beforeEach(() => {
    clearGondiCache();
    vi.restoreAllMocks();
  });

  it('handles getMarketOverview query successfully', async () => {
    const mockOverview = [
      {
        salesCount: 15,
        salesVolume: 42.5,
        floorChangePercent: 5.2,
        loansCount: 4,
        usersCount: 12,
        collection: {
          id: '2822',
          name: 'CryptoPunks',
          slug: 'cryptopunks',
          contractData: {
            contractAddress: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
          },
          image: {
            cacheUrl: 'https://cdn.gondi.xyz/image/txOyWVb6N3KUlg48gNKG2A==',
          },
        },
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          getMarketOverview: {
            top: mockOverview,
          },
        },
      }),
    } as unknown as Response);

    const client = new GondiClient();
    const result = await client.getMarketOverview('DAY');

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].collection.name).toBe('CryptoPunks');
    expect(result[0].collection.image?.cacheUrl).toBe('https://cdn.gondi.xyz/image/txOyWVb6N3KUlg48gNKG2A==');
  });

  it('handles listCollections query successfully', async () => {
    const mockCollections = [
      {
        node: {
          id: '2155',
          name: 'Bored Ape Yacht Club',
          slug: 'boredapeyachtclub',
          supply: '10000',
          contractData: {
            contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
          },
          image: {
            cacheUrl: 'https://cdn.gondi.xyz/image/_1F9w4ufOBuWuXzBZzm86Q==',
          },
        },
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          listCollections: {
            edges: mockCollections,
          },
        },
      }),
    } as unknown as Response);

    const client = new GondiClient();
    const result = await client.listCollections(10);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Bored Ape Yacht Club');
    expect(result[0].contractData?.contractAddress).toBe('0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d');
  });

  it('handles getNftMetadata query successfully', async () => {
    const mockNft = {
      id: '1056452',
      tokenId: '1',
      name: 'Bored Ape Yacht Club #1',
      description: 'Iconic BAYC #1',
      image: {
        cacheUrl: 'https://cdn.gondi.xyz/image/a8F1Yd-wPqqBR74X3hwz_A==',
      },
      collection: {
        id: '2155',
        name: 'Bored Ape Yacht Club',
        slug: 'boredapeyachtclub',
        contractData: {
          contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        },
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          getNftByContractAddressAndTokenId: mockNft,
        },
      }),
    } as unknown as Response);

    const client = new GondiClient();
    const result = await client.getNftMetadata('0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', '1');

    expect(result).toBeDefined();
    expect(result?.name).toBe('Bored Ape Yacht Club #1');
    expect(result?.image?.cacheUrl).toContain('cdn.gondi.xyz');
  });

  it('resolves image from Gondi CDN in tier1-gondi', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          getNftByContractAddressAndTokenId: {
            id: '1',
            tokenId: '42',
            name: 'Pudgy Penguin #42',
            image: {
              cacheUrl: 'https://cdn.gondi.xyz/image/jgqrCXDkObOaQsinzfJzMw==',
            },
            collection: {
              id: '2173',
              name: 'Pudgy Penguins',
              slug: 'pudgypenguins',
            },
          },
        },
      }),
    } as unknown as Response);

    const resolved = await resolveFromGondi('0xbd3531da5cf5857e7cfaa92426877b022e612cf8', '42');

    expect(resolved).toBeDefined();
    expect(resolved?.source).toBe('gondi-cdn');
    expect(resolved?.url).toBe('https://cdn.gondi.xyz/image/jgqrCXDkObOaQsinzfJzMw==');
    expect(resolved?.isFallback).toBe(false);
  });

  it('handles GraphQL error responses gracefully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: null,
        errors: [{ message: 'Field not found' }],
      }),
    } as unknown as Response);

    await expect(executeGondiQuery('{ invalidQuery }')).rejects.toThrow('Gondi GraphQL Error');
  });

  it('handles HTTP error status codes gracefully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
    } as unknown as Response);

    await expect(executeGondiQuery('{ sample }')).rejects.toThrow(GondiApiError);
  });
});
