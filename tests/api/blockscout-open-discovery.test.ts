import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BlockscoutClient } from '@/lib/blockscout';

describe('TICKET-76: Blockscout Open ERC-721 Collection Discovery & Pagination', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('TS-01: fetchERC721Collections queries /tokens?type=ERC-721 and parses address_hash and address', async () => {
    const mockResponse = {
      items: [
        {
          address_hash: '0x1111111111111111111111111111111111111111',
          name: 'Sherwood Foresters',
          symbol: 'SFF',
          type: 'ERC-721',
          total_supply: '1000',
          holders_count: 42,
          icon_url: 'https://example.com/icon.png',
        },
        {
          address: '0x2222222222222222222222222222222222222222',
          name: 'Nottingham Guild',
          symbol: 'NGP',
          type: 'ERC-721',
        },
      ],
      next_page_params: {
        items_count: 50,
        token_name: 'Nottingham Guild',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const client = new BlockscoutClient({
      baseUrl: 'https://explorer.testnet.chain.robinhood.com/api/v2',
    });

    const result = await client.fetchERC721Collections({ cursor: '10' });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].contractAddress).toBe('0x1111111111111111111111111111111111111111');
    expect(result.items[0].name).toBe('Sherwood Foresters');
    expect(result.items[0].holdersCount).toBe(42);
    expect(result.items[1].contractAddress).toBe('0x2222222222222222222222222222222222222222');
    expect(result.nextPageParams).toEqual({
      items_count: 50,
      token_name: 'Nottingham Guild',
    });
  });

  it('TS-02: fetchCollectionDetails parses single token endpoint', async () => {
    const mockToken = {
      address_hash: '0x3333333333333333333333333333333333333333',
      name: 'Robinhood Genesis Pass',
      symbol: 'RHG',
      type: 'ERC-721',
      total_supply: '500',
      holders_count: 120,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockToken,
    });

    const client = new BlockscoutClient({
      baseUrl: 'https://explorer.testnet.chain.robinhood.com/api/v2',
    });

    const result = await client.fetchCollectionDetails('0x3333333333333333333333333333333333333333');
    expect(result.contractAddress).toBe('0x3333333333333333333333333333333333333333');
    expect(result.name).toBe('Robinhood Genesis Pass');
    expect(result.symbol).toBe('RHG');
    expect(result.holdersCount).toBe(120);
  });
});
