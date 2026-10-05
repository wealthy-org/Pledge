import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/route';
import { indexerStore } from '@/lib/indexer/store';

describe('GET /api/search', () => {
  beforeEach(() => {
    indexerStore.collections.clear();
    indexerStore.loans.clear();
    indexerStore.collections.set('46630:0x7fa9385be102ac3eac297483dd6233d62b3e1496', {
      chain_id: 46630,
      address: '0x7fa9385be102ac3eac297483dd6233d62b3e1496',
      name: 'Robinhood Genesis Pass',
      symbol: 'RHG',
      image_url: null,
      is_enabled: true,
      added_at: new Date().toISOString(),
    });
  });

  it('returns empty result set for empty query', async () => {
    const req = new NextRequest('http://localhost/api/search?q=');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results.length).toBe(0);
  });

  it('searches collections by name keyword', async () => {
    const req = new NextRequest('http://localhost/api/search?q=Genesis');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.collections.length).toBeGreaterThan(0);
    expect(json.collections[0].title).toContain('Genesis');
  });

  it('searches wallets when 0x address is passed', async () => {
    const wallet = '0x1234567890123456789012345678901234567890';
    const req = new NextRequest(`http://localhost/api/search?q=${wallet}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.wallets.length).toBe(1);
    expect(json.wallets[0].url).toBe(`/profile/${wallet}`);
  });

  it('searches specific token items using collection:tokenId pattern', async () => {
    const req = new NextRequest('http://localhost/api/search?q=RHG:7');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items.length).toBeGreaterThan(0);
    expect(json.items[0].url).toContain('/item/');
    expect(json.items[0].url).toContain('/7');
  });
});
