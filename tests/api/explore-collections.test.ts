import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/explore/collections/route';
import { indexerStore } from '@/lib/indexer/store';
import { clearBlockscoutCache } from '@/lib/blockscout';
import { detectDuplicateNames, formatShortAddress } from '@/lib/services/collectionSafety';

describe('TICKET-77: Explore Collections API Route & Safety Verification', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearBlockscoutCache();
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
    const mockBlockscoutResponse = {
      items: [
        {
          address: '0x4444444444444444444444444444444444444444',
          name: 'Nottingham Punks',
          symbol: 'NPK',
          type: 'ERC-721',
          total_supply: '1000',
        },
      ],
      next_page_params: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBlockscoutResponse,
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
    const mockBlockscoutResponse = {
      items: [
        {
          address: '0x1111111111111111111111111111111111111111',
          name: 'Sherwood Foresters',
          symbol: 'SFF',
        },
        {
          address: '0x2222222222222222222222222222222222222222',
          name: 'Robinhood Birds',
          symbol: 'RHB',
        },
      ],
      next_page_params: null,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockBlockscoutResponse,
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
});
