import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BlockscoutClient,
  BlockscoutApiError,
  resolveMediaUrl,
  sanitizeMetadata,
} from '@/lib/blockscout';

describe('TICKET-05b: Blockscout Client & Media Sanitization Test Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('TS-01: resolveMediaUrl correctly transforms IPFS, Arweave, and HTTPS URIs', () => {
    expect(resolveMediaUrl('ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/1.png')).toBe(
      'https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/1.png'
    );
    expect(resolveMediaUrl('ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')).toBe(
      'https://gateway.pinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    );
    expect(resolveMediaUrl('ar://1uo_ZtU46fUfZv0qQ8mNq9h3j9qQ8mNq9h3j9qQ8mNq')).toBe(
      'https://arweave.net/1uo_ZtU46fUfZv0qQ8mNq9h3j9qQ8mNq9h3j9qQ8mNq'
    );
    expect(resolveMediaUrl('https://example.com/nft/1.png')).toBe('https://example.com/nft/1.png');
  });

  it('TS-02: resolveMediaUrl throws explicit error on null, empty, or unsupported protocols (Rule 11)', () => {
    expect(() => resolveMediaUrl('')).toThrow('Media URL cannot be empty.');
    expect(() => resolveMediaUrl('ftp://example.com/nft.png')).toThrow('Unsupported URI protocol: ftp:');
  });

  it('TS-03: sanitizeMetadata extracts title, description, and normalized image URL', () => {
    const raw = {
      name: 'Robinhood Genesis #42',
      description: 'First edition collateral NFT',
      image: 'ipfs://QmGenesis42',
      attributes: [{ trait_type: 'Rarity', value: 'Legendary' }],
    };

    const sanitized = sanitizeMetadata(raw);
    expect(sanitized.name).toBe('Robinhood Genesis #42');
    expect(sanitized.description).toBe('First edition collateral NFT');
    expect(sanitized.imageUrl).toBe('https://gateway.pinata.cloud/ipfs/QmGenesis42');
    expect(sanitized.attributes).toEqual([{ trait_type: 'Rarity', value: 'Legendary' }]);
  });

  it('TS-04: BlockscoutClient.fetchWalletNFTs parses items array correctly', async () => {
    const mockResponse = {
      items: [
        {
          id: '1',
          token_id: '1',
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'Robinhood Birds',
            symbol: 'RHB',
            type: 'ERC-721',
          },
          metadata: {
            name: 'Bird #1',
            image: 'https://images.example.com/1.png',
          },
        },
      ],
      next_page_params: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const client = new BlockscoutClient({
      baseUrl: 'https://explorer.testnet.robinhood.com/api/v2',
      apiKey: 'test-api-key',
    });

    const result = await client.fetchWalletNFTs('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tokenId).toBe('1');
    expect(result.items[0].collectionAddress).toBe('0x1234567890123456789012345678901234567890');
    expect(result.items[0].name).toBe('Bird #1');
    expect(result.items[0].imageUrl).toBe('https://images.example.com/1.png');
  });

  it('TS-05: BlockscoutClient throws BlockscoutApiError on 404, 429, or 500 without leaking API key', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'Rate limit exceeded for client',
    });

    const client = new BlockscoutClient({
      baseUrl: 'https://explorer.testnet.robinhood.com/api/v2',
      apiKey: 'secret_sensitive_api_key_12345',
    });

    try {
      await client.fetchNFTInstance('0x1234567890123456789012345678901234567890', '1');
      expect.fail('Expected to throw BlockscoutApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(BlockscoutApiError);
      const apiError = err as BlockscoutApiError;
      expect(apiError.statusCode).toBe(429);
      expect(apiError.message).not.toContain('secret_sensitive_api_key_12345');
      expect(apiError.message).toContain('Blockscout API HTTP 429');
    }
  });

  it('TS-06: BlockscoutClient supports public mode when API key is not provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '1', token_id: '1', metadata: { name: 'Item 1' } }),
    });
    global.fetch = fetchMock;

    const client = new BlockscoutClient({
      baseUrl: 'https://explorer.testnet.robinhood.com/api/v2',
    });

    await client.fetchNFTInstance('0x1234567890123456789012345678901234567890', '1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('apikey=');
  });
});
