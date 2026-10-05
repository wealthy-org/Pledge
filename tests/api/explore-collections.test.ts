import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/explore/collections/route';
import { indexerStore } from '@/lib/indexer/store';
import { clearGondiCache } from '@/lib/gondi';
import { detectDuplicateNames, formatShortAddress } from '@/lib/services/collectionSafety';

describe('TICKET-77: Explore Collections API Route & Safety Verification', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearGondiCache();
    indexerStore.reset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('TS-01: formatShortAddress formats 42-char hex correctly', () => {
    expect(formatShortAddress('0x1234567890123456789012345678901234567890')).toBe('0x1234...7890');
    expect(formatShortAddress('short')).toBe('short');
  });

  it('TS-02: detectDuplicateNames flags collections with identical names', () => {
    const list = [
      { name: 'Robinhood Genesis', address: '0x1111111111111111111111111111111111111111' },
      { name: 'Robinhood Genesis', address: '0x2222222222222222222222222222222222222222' },
      { name: 'Sherwood Foresters', address: '0x3333333333333333333333333333333333333333' },
    ];
    const duplicates = detectDuplicateNames(list);
    expect(duplicates.get('0x1111111111111111111111111111111111111111')).toBe(true);
    expect(duplicates.get('0x2222222222222222222222222222222222222222')).toBe(true);
    expect(duplicates.get('0x3333333333333333333333333333333333333333')).toBe(false);
  });

  it('TS-03: GET /api/explore/collections returns aggregated collection list and offer stats', async () => {
    const mockGondiResponse = {
      data: {
        getMarketOverview: {
          top: [
            {
              salesCount: 5,
              salesVolume: 10,
              collection: {
                id: '4444',
                name: 'Nottingham Punks',
                slug: 'nottinghampunks',
                contractData: {
                  contractAddress: '0x4444444444444444444444444444444444444444',
                },
                image: {
                  cacheUrl: 'https://cdn.gondi.xyz/image/abc',
                },
              },
            },
          ],
        },
        listCollections: {
          edges: [],
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGondiResponse,
    });

    indexerStore.upsertOffer({
      offer_id: 1,
      chain_id: 46630,
      lender: '0x1234567890123456789012345678901234567890',
      collection: '0x4444444444444444444444444444444444444444',
      principal_wei: '1000000000000000000',
      term_interest_bps: 500,
      fee_bps_snapshot: 250,
      duration_seconds: 604800,
      expires_at: '2000000000',
      status: 'open',
      block_number: 100,
      tx_hash: '0xabc',
      indexed_at: new Date().toISOString(),
    });

    const req = new NextRequest('http://localhost:3000/api/explore/collections?chainId=46630');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.collections).toHaveLength(1);
    expect(data.collections[0].address).toBe('0x4444444444444444444444444444444444444444');
    expect(data.collections[0].name).toBe('Nottingham Punks');
    expect(data.collections[0].offerCount).toBe(1);
    expect(data.collections[0].bestOfferWei).toBe('1000000000000000000');
  });

  it('TS-04: GET /api/explore/collections filters by search and hasOffers', async () => {
    const mockGondiResponse = {
      data: {
        getMarketOverview: {
          top: [
            {
              collection: {
                id: '1111',
                name: 'Sherwood Foresters',
                slug: 'sherwoodforesters',
                contractData: {
                  contractAddress: '0x1111111111111111111111111111111111111111',
                },
              },
            },
            {
              collection: {
                id: '2222',
                name: 'Robinhood Birds',
                slug: 'robinhoodbirds',
                contractData: {
                  contractAddress: '0x2222222222222222222222222222222222222222',
                },
              },
            },
          ],
        },
        listCollections: {
          edges: [],
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGondiResponse,
    });

    const searchReq = new NextRequest('http://localhost:3000/api/explore/collections?search=birds');
    const searchRes = await GET(searchReq);
    const searchData = await searchRes.json();
    expect(searchData.collections).toHaveLength(1);
    expect(searchData.collections[0].name).toBe('Robinhood Birds');

    const offersReq = new NextRequest('http://localhost:3000/api/explore/collections?hasOffers=true');
    const offersRes = await GET(offersReq);
    const offersData = await offersRes.json();
    expect(offersData.collections).toHaveLength(0);
  });

  it('TS-05: GET /api/explore/collections does not fabricate offerCount from loansCount when no active offers exist', async () => {
    const mockGondiResponse = {
      data: {
        getMarketOverview: {
          top: [
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
          ],
        },
        listCollections: {
          edges: [],
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGondiResponse,
    });

    const req = new NextRequest('http://localhost:3000/api/explore/collections?chainId=46630');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.collections).toHaveLength(1);
    expect(data.collections[0].address).toBe('0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb');
    expect(data.collections[0].offerCount).toBe(0);
  });
});
