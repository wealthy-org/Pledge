import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/wallets/[address]/watchlist/route';
import { indexerStore } from '@/lib/indexer/store';
import { NextRequest } from 'next/server';

describe('TICKET-110: Wallet Watchlist API Route Suite', () => {
  const testWallet = '0x1111111111111111111111111111111111111111';
  const testCollection1 = '0x2222222222222222222222222222222222222222';
  const testCollection2 = '0x3333333333333333333333333333333333333333';

  beforeEach(() => {
    indexerStore.clear();
  });

  it('rejects invalid wallet address format', async () => {
    const req = new NextRequest('http://localhost:3000/api/wallets/invalid-addr/watchlist');
    const res = await GET(req, { params: Promise.resolve({ address: 'invalid-addr' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid Ethereum address format');
  });

  it('returns empty watchlist array initially', async () => {
    const req = new NextRequest(`http://localhost:3000/api/wallets/${testWallet}/watchlist`);
    const res = await GET(req, { params: Promise.resolve({ address: testWallet }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.address).toBe(testWallet.toLowerCase());
    expect(json.watchlist).toEqual([]);
  });

  it('toggles single collection in watchlist via POST', async () => {
    const postReq1 = new NextRequest(`http://localhost:3000/api/wallets/${testWallet}/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ collection: testCollection1 }),
    });
    const postRes1 = await POST(postReq1, { params: Promise.resolve({ address: testWallet }) });
    expect(postRes1.status).toBe(200);
    const json1 = await postRes1.json();
    expect(json1.watchlist).toEqual([testCollection1.toLowerCase()]);

    const postReq2 = new NextRequest(`http://localhost:3000/api/wallets/${testWallet}/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ collection: testCollection1 }),
    });
    const postRes2 = await POST(postReq2, { params: Promise.resolve({ address: testWallet }) });
    expect(postRes2.status).toBe(200);
    const json2 = await postRes2.json();
    expect(json2.watchlist).toEqual([]);
  });

  it('sets multiple collections in watchlist via POST', async () => {
    const postReq = new NextRequest(`http://localhost:3000/api/wallets/${testWallet}/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ collections: [testCollection1, testCollection2] }),
    });
    const postRes = await POST(postReq, { params: Promise.resolve({ address: testWallet }) });
    expect(postRes.status).toBe(200);
    const json = await postRes.json();
    expect(json.watchlist).toContain(testCollection1.toLowerCase());
    expect(json.watchlist).toContain(testCollection2.toLowerCase());

    const getReq = new NextRequest(`http://localhost:3000/api/wallets/${testWallet}/watchlist`);
    const getRes = await GET(getReq, { params: Promise.resolve({ address: testWallet }) });
    const getJson = await getRes.json();
    expect(getJson.watchlist.length).toBe(2);
  });
});
