import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getOffers } from '@/app/api/offers/route';
import { GET as getLoans } from '@/app/api/loans/route';
import { indexerStore } from '@/lib/indexer/store';
import { clearGondiCache } from '@/lib/gondi';

describe('Offers & Loans Gondi Integration API Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearGondiCache();
    indexerStore.reset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('GET /api/offers returns merged on-chain snapshot and Gondi offers for a collection', async () => {
    const mockCollection = '0x4444444444444444444444444444444444444444';

    indexerStore.upsertOffer({
      offer_id: 1,
      chain_id: 46630,
      lender: '0x1111111111111111111111111111111111111111',
      collection: mockCollection,
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

    const mockGondiOffers = {
      data: {
        getCollectionsByContractAddress: [
          {
            id: '1',
            name: 'Punks',
            slug: 'punks',
            contractData: { contractAddress: mockCollection },
          },
        ],
        listOffers: {
          edges: [
            {
              node: {
                id: 'gondi-offer-1',
                offerId: 102,
                lenderAddress: '0x2222222222222222222222222222222222222222',
                borrowerAddress: '0x0000000000000000000000000000000000000000',
                principalAmount: '2500000000000000000',
                aprBps: '1500',
                fee: '100',
                duration: '604800',
                expirationTime: '2000000000',
                status: 'active',
                contractAddress: mockCollection,
                collateralAddress: mockCollection,
              },
            },
          ],
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGondiOffers,
    });

    const req = new NextRequest(`http://localhost:3000/api/offers?collection=${mockCollection}&chainId=46630`);
    const res = await getOffers(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.offers.length).toBeGreaterThanOrEqual(2);
    expect(data.offers.some((o: { offerId: number }) => o.offerId === 1)).toBe(true);
    expect(data.offers.some((o: { offerId: number }) => o.offerId === 102)).toBe(true);
  });

  it('GET /api/loans returns active and historical loans from Gondi API and on-chain indexer', async () => {
    const mockCollection = '0x4444444444444444444444444444444444444444';

    indexerStore.upsertLoan({
      loan_id: 1,
      offer_id: 1,
      chain_id: 46630,
      lender: '0x1111111111111111111111111111111111111111',
      borrower: '0x2222222222222222222222222222222222222222',
      collection: mockCollection,
      token_id: '1',
      principal_wei: '1000000000000000000',
      interest_wei: '50000000000000000',
      fee_bps_snapshot: 250,
      started_at: new Date(1700000000 * 1000).toISOString(),
      due_at: new Date(1700604800 * 1000).toISOString(),
      status: 'active',
      block_number: 100,
      tx_hash: '0xabc',
      indexed_at: new Date().toISOString(),
    });

    const mockGondiLoans = {
      data: {
        getCollectionsByContractAddress: [
          {
            id: '1',
            name: 'Punks',
            slug: 'punks',
            contractData: { contractAddress: mockCollection },
          },
        ],
        listLoans: {
          edges: [
            {
              node: {
                id: 'gondi-loan-201',
                loanId: 201,
                address: mockCollection,
                borrowerAddress: '0x3333333333333333333333333333333333333333',
                principalAddress: '0x4444444444444444444444444444444444444444',
                startTime: '1700000000',
                repaymentTime: '1700604800',
                duration: '604800',
                status: 'loan_initiated',
                protocolFee: '25',
                offerIds: ['99'],
                currency: { symbol: 'WETH', decimals: 18 },
              },
            },
            {
              node: {
                id: 'gondi-loan-202',
                loanId: 202,
                address: mockCollection,
                borrowerAddress: '0x3333333333333333333333333333333333333333',
                principalAddress: '0x4444444444444444444444444444444444444444',
                startTime: '1690000000',
                repaymentTime: '1690604800',
                duration: '604800',
                status: 'loan_repaid',
                protocolFee: '25',
                offerIds: ['98'],
                currency: { symbol: 'WETH', decimals: 18 },
              },
            },
          ],
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGondiLoans,
    });

    const activeReq = new NextRequest(`http://localhost:3000/api/loans?collection=${mockCollection}&status=active`);
    const activeRes = await getLoans(activeReq);
    expect(activeRes.status).toBe(200);
    const activeData = await activeRes.json();

    expect(activeData.loans.length).toBeGreaterThanOrEqual(2);
    expect(activeData.loans.every((l: { status: string }) => l.status === 'active')).toBe(true);

    const historyReq = new NextRequest(`http://localhost:3000/api/loans?collection=${mockCollection}&status=repaid`);
    const historyRes = await getLoans(historyReq);
    expect(historyRes.status).toBe(200);
    const historyData = await historyRes.json();

    expect(historyData.loans.length).toBeGreaterThanOrEqual(1);
    expect(historyData.loans[0].loanId).toBe(202);
    expect(historyData.loans[0].status).toBe('repaid');
  });
});
