import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/wallets/[address]/loans/route';
import { indexerStore } from '@/lib/indexer/store';
import { NextRequest } from 'next/server';
import { getPledgeLoansAddress } from '@/config/contracts';

describe('Chain ID Consistency & Wallet Loans Filtering Suite', () => {
  const testAddress = '0x1111111111111111111111111111111111111111';

  beforeEach(() => {
    indexerStore.clear();
  });

  it('filters wallet loans by chainId parameter', async () => {
    indexerStore.upsertLoan({
      chain_id: 46630,
      loan_id: 1,
      offer_id: 10,
      lender: '0x2222222222222222222222222222222222222222',
      borrower: testAddress,
      collection: '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496',
      token_id: '1',
      principal_wei: '1000000000000000000',
      interest_wei: '50000000000000000',
      fee_bps_snapshot: 100,
      started_at: '1700000000',
      due_at: '1700604800',
      status: 'active',
      tx_hash: '0x1',
      block_number: 100,
      indexed_at: '2026-10-01T12:00:00Z',
    });

    indexerStore.upsertLoan({
      chain_id: 4663,
      loan_id: 2,
      offer_id: 20,
      lender: '0x2222222222222222222222222222222222222222',
      borrower: testAddress,
      collection: '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496',
      token_id: '2',
      principal_wei: '2000000000000000000',
      interest_wei: '100000000000000000',
      fee_bps_snapshot: 100,
      started_at: '1700000000',
      due_at: '1700604800',
      status: 'active',
      tx_hash: '0x2',
      block_number: 200,
      indexed_at: '2026-10-01T12:00:00Z',
    });

    const req46630 = new NextRequest(`http://localhost:3000/api/wallets/${testAddress}/loans?chainId=46630`);
    const res46630 = await GET(req46630, { params: Promise.resolve({ address: testAddress }) });
    const json46630 = await res46630.json();

    expect(res46630.status).toBe(200);
    expect(json46630.loans.length).toBe(1);
    expect(json46630.loans[0].loanId).toBe(1);
  });

  it('rejects invalid chainId with 400 bad request', async () => {
    const req = new NextRequest(`http://localhost:3000/api/wallets/${testAddress}/loans?chainId=invalid`);
    const res = await GET(req, { params: Promise.resolve({ address: testAddress }) });
    expect(res.status).toBe(400);
  });

  it('throws on unsupported chain ID without fallback in getPledgeLoansAddress', () => {
    expect(() => getPledgeLoansAddress(1)).toThrow('Unsupported chain ID: 1');
  });
});
