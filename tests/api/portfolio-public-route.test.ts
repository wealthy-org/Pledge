import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/portfolio/[address]/route';
import { indexerStore } from '@/lib/indexer/store';

describe('GET /api/portfolio/[address]', () => {
  const userAddress = '0x1111111111111111111111111111111111111111';

  beforeEach(() => {
    indexerStore.loans.clear();
    indexerStore.offers.clear();
  });

  it('returns 400 for malformed address', async () => {
    const req = new NextRequest('http://localhost/api/portfolio/invalid');
    const res = await GET(req, {
      params: Promise.resolve({ address: 'invalid' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid Ethereum address format');
  });

  it('aggregates borrowed and lent loans accurately', async () => {
    indexerStore.loans.set('46630:1', {
      chain_id: 46630,
      loan_id: 1,
      offer_id: 10,
      lender: userAddress,
      borrower: '0x2222222222222222222222222222222222222222',
      collection: '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9',
      token_id: '1',
      principal_wei: '2000000000000000000',
      interest_wei: '100000000000000000',
      fee_bps_snapshot: 200,
      started_at: '1700000000',
      due_at: '1700604800',
      status: 'active',
      block_number: 100,
      tx_hash: '0xabc',
      indexed_at: '2026-01-01T00:00:00Z',
    });

    indexerStore.loans.set('46630:2', {
      chain_id: 46630,
      loan_id: 2,
      offer_id: 11,
      lender: '0x3333333333333333333333333333333333333333',
      borrower: userAddress,
      collection: '0x146BefC6C8656Df737255d08fa1281319Fc1A4c3',
      token_id: '5',
      principal_wei: '1500000000000000000',
      interest_wei: '75000000000000000',
      fee_bps_snapshot: 200,
      started_at: '1700000000',
      due_at: '1700604800',
      status: 'active',
      block_number: 101,
      tx_hash: '0xdef',
      indexed_at: '2026-01-01T00:00:00Z',
    });

    const req = new NextRequest(`http://localhost/api/portfolio/${userAddress}?chainId=46630`);
    const res = await GET(req, {
      params: Promise.resolve({ address: userAddress }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.lentLoans.length).toBe(1);
    expect(json.borrowedLoans.length).toBe(1);
    expect(json.totalLentWei).toBe('2000000000000000000');
    expect(json.totalBorrowedWei).toBe('1500000000000000000');
  });
});
