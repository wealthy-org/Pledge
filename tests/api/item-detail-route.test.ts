import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/items/[collection]/[tokenId]/route';
import { indexerStore } from '@/lib/indexer/store';

describe('GET /api/items/[collection]/[tokenId]', () => {
  const collection = '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9';

  beforeEach(() => {
    indexerStore.loans.clear();
    indexerStore.offers.clear();
  });

  it('returns 400 for invalid collection address', async () => {
    const req = new NextRequest('http://localhost/api/items/invalid/1');
    const res = await GET(req, {
      params: Promise.resolve({ collection: 'invalid', tokenId: '1' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid collection address');
  });

  it('returns 400 for invalid tokenId', async () => {
    const req = new NextRequest(`http://localhost/api/items/${collection}/abc`);
    const res = await GET(req, {
      params: Promise.resolve({ collection, tokenId: 'abc' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns item details with active loan and best offer', async () => {
    indexerStore.loans.set('46630:5', {
      chain_id: 46630,
      loan_id: 5,
      offer_id: 10,
      lender: '0x1111111111111111111111111111111111111111',
      borrower: '0x2222222222222222222222222222222222222222',
      collection,
      token_id: '42',
      principal_wei: '1000000000000000000',
      interest_wei: '50000000000000000',
      fee_bps_snapshot: 200,
      started_at: '1700000000',
      due_at: '1700604800',
      status: 'active',
      block_number: 100,
      tx_hash: '0xabc',
      indexed_at: '2026-01-01T00:00:00Z',
    });

    const req = new NextRequest(`http://localhost/api/items/${collection}/42`);
    const res = await GET(req, {
      params: Promise.resolve({ collection, tokenId: '42' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.collection).toBe(collection);
    expect(json.tokenId).toBe('42');
    expect(json.activeLoan).toBeDefined();
    expect(json.activeLoan.loanId).toBe(5);
    expect(json.activeLoan.status).toBe('active');
  });
});
