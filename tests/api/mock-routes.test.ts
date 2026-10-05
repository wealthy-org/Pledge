import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as getCollections } from '@/app/api/collections/route';
import { GET as getCollectionDetail } from '@/app/api/collections/[address]/route';
import { GET as getBestOffer } from '@/app/api/collections/[address]/best-offer/route';
import { GET as getCollectionOffers } from '@/app/api/collections/[address]/offers/route';
import { GET as getCollectionStats } from '@/app/api/collections/[address]/stats/route';
import { GET as getWalletNfts } from '@/app/api/wallets/[address]/eligible-nfts/route';
import { GET as getWalletLoans } from '@/app/api/wallets/[address]/loans/route';
import { GET as getWalletOffers } from '@/app/api/wallets/[address]/offers/route';
import { GET as getLoanDetail } from '@/app/api/loans/[id]/route';
import { GET as getActivity } from '@/app/api/activity/route';
import { GET as getMarketStats } from '@/app/api/stats/market/route';
import { indexerStore } from '@/lib/indexer/store';
import { gondiClient } from '@/lib/gondi';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { NextRequest } from 'next/server';

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('TICKET-21: Live API Route Handlers Test Suite', () => {
  const RHG_ADDRESS = '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9';
  const WALLET_A = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
  const WALLET_B = '0xfB5870428d00B1a18274737609825b74c8C12e2B';

  beforeEach(() => {
    indexerStore.reset();

    indexerStore.upsertOffer({
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_A,
      collection: '0x3333333333333333333333333333333333333333',
      principal_wei: '1500000000000000000',
      term_interest_bps: 400,
      fee_bps_snapshot: 200,
      duration_seconds: 604800,
      expires_at: '2026-10-15T00:00:00Z',
      status: 'open',
      block_number: 100,
      tx_hash: '0x1',
      indexed_at: '2026-10-01T12:00:00Z',
    });

    indexerStore.upsertOffer({
      offer_id: 2,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_A,
      collection: RHG_ADDRESS,
      principal_wei: '2000000000000000000',
      term_interest_bps: 400,
      fee_bps_snapshot: 200,
      duration_seconds: 604800,
      expires_at: '2026-10-15T00:00:00Z',
      status: 'open',
      block_number: 101,
      tx_hash: '0x2',
      indexed_at: '2026-10-01T12:00:00Z',
    });

    indexerStore.upsertOffer({
      offer_id: 3,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_B,
      collection: '0x2222222222222222222222222222222222222222',
      principal_wei: '750000000000000000',
      term_interest_bps: 500,
      fee_bps_snapshot: 200,
      duration_seconds: 604800,
      expires_at: '2026-10-15T00:00:00Z',
      status: 'open',
      block_number: 102,
      tx_hash: '0x3',
      indexed_at: '2026-10-01T12:00:00Z',
    });

    indexerStore.upsertLoan({
      loan_id: 1,
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_A,
      borrower: WALLET_B,
      collection: RHG_ADDRESS,
      token_id: '42',
      principal_wei: '1000000000000000000',
      interest_wei: '40000000000000000',
      fee_bps_snapshot: 200,
      started_at: '2026-10-01T10:00:00Z',
      due_at: '2026-10-08T10:00:00Z',
      status: 'active',
      block_number: 90,
      tx_hash: '0xloan1',
      indexed_at: '2026-10-01T10:00:00Z',
    });

    indexerStore.upsertLoan({
      loan_id: 2,
      offer_id: 2,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_A,
      borrower: WALLET_B,
      collection: RHG_ADDRESS,
      token_id: '101',
      principal_wei: '500000000000000000',
      interest_wei: '15000000000000000',
      fee_bps_snapshot: 200,
      started_at: '2026-09-10T10:00:00Z',
      due_at: '2026-09-17T10:00:00Z',
      status: 'repaid',
      block_number: 70,
      tx_hash: '0xloan2',
      indexed_at: '2026-09-10T10:00:00Z',
    });

    indexerStore.insertEventIdempotent({
      chainId: TESTNET_CHAIN_ID,
      contractAddress: RHG_ADDRESS,
      blockNumber: 90,
      blockHash: '0xblock90',
      txHash: '0xloan1',
      logIndex: 0,
      eventType: 'LoanStarted',
      args: { loanId: 1 },
      timestamp: '2026-10-01T10:00:00Z',
    });

    indexerStore.insertEventIdempotent({
      chainId: TESTNET_CHAIN_ID,
      contractAddress: RHG_ADDRESS,
      blockNumber: 100,
      blockHash: '0xblock100',
      txHash: '0xoffer1',
      logIndex: 0,
      eventType: 'OfferCreated',
      args: { offerId: 1 },
      timestamp: '2026-10-01T12:00:00Z',
    });

    vi.spyOn(gondiClient, 'listNfts').mockResolvedValue([
      {
        id: '1',
        tokenId: '42',
        name: 'RHG #42',
        collection: {
          id: RHG_ADDRESS,
          name: 'Robinhood Genesis Pass',
          contractData: { contractAddress: RHG_ADDRESS },
        },
        image: {
          cacheUrl: 'https://images.unsplash.com/photo-1',
        },
      } as any,
    ]);
  });

  describe('TS-01: All 11 Endpoints Happy Path', () => {
    it('1. GET /api/collections returns collections list with calculated stats', async () => {
      const req = createRequest('http://localhost:3000/api/collections');
      const res = await getCollections(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('collections');
      expect(Array.isArray(body.collections)).toBe(true);
      expect(body.collections.length).toBeGreaterThan(0);
      expect(body.collections[0]).toHaveProperty('address');
      expect(body.collections[0]).toHaveProperty('bestOfferWei');
      expect(body.collections[0]).toHaveProperty('poolSizeWei');
      expect(body.collections[0]).toHaveProperty('offerCount');
      expect(body.collections[0]).toHaveProperty('activeLoansCount');
    });

    it('2. GET /api/collections/[address] returns single collection with stats', async () => {
      const req = createRequest(`http://localhost:3000/api/collections/${RHG_ADDRESS}`);
      const res = await getCollectionDetail(req, { params: Promise.resolve({ address: RHG_ADDRESS }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('collection');
      expect(body).toHaveProperty('stats');
      expect(body.collection.address.toLowerCase()).toBe(RHG_ADDRESS.toLowerCase());
      expect(body.stats).toHaveProperty('poolSizeWei');
    });

    it('3. GET /api/collections/[address]/best-offer returns highest open offer', async () => {
      const req = createRequest(`http://localhost:3000/api/collections/${RHG_ADDRESS}/best-offer`);
      const res = await getBestOffer(req, { params: Promise.resolve({ address: RHG_ADDRESS }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('bestOffer');
      if (body.bestOffer) {
        expect(body.bestOffer.status).toBe('open');
        expect(body.bestOffer.principalWei).toBe('2000000000000000000');
      }
    });

    it('4. GET /api/collections/[address]/offers returns open offers sorted', async () => {
      const req = createRequest(`http://localhost:3000/api/collections/${RHG_ADDRESS}/offers?status=open&sort=principal`);
      const res = await getCollectionOffers(req, { params: Promise.resolve({ address: RHG_ADDRESS }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('offers');
      expect(Array.isArray(body.offers)).toBe(true);
      expect(body.offers.length).toBe(1);
    });

    it('5. GET /api/collections/[address]/stats returns aggregate metrics', async () => {
      const req = createRequest(`http://localhost:3000/api/collections/${RHG_ADDRESS}/stats`);
      const res = await getCollectionStats(req, { params: Promise.resolve({ address: RHG_ADDRESS }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.bestOfferWei).toBe('2000000000000000000');
      expect(body.poolSizeWei).toBe('2000000000000000000');
      expect(body.offerCount).toBe(1);
      expect(body.activeLoansCount).toBe(1);
    });

    it('6. GET /api/wallets/[address]/eligible-nfts returns owned whitelisted NFTs', async () => {
      const req = createRequest(`http://localhost:3000/api/wallets/${WALLET_B}/eligible-nfts`);
      const res = await getWalletNfts(req, { params: Promise.resolve({ address: WALLET_B }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('nfts');
      expect(Array.isArray(body.nfts)).toBe(true);
      expect(body.nfts.length).toBeGreaterThan(0);
      expect(body.nfts[0]).toHaveProperty('contractAddress');
      expect(body.nfts[0]).toHaveProperty('tokenId');
    });

    it('7. GET /api/wallets/[address]/loans returns user loans', async () => {
      const req = createRequest(`http://localhost:3000/api/wallets/${WALLET_B}/loans?status=active`);
      const res = await getWalletLoans(req, { params: Promise.resolve({ address: WALLET_B }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('loans');
      expect(Array.isArray(body.loans)).toBe(true);
      expect(body.loans.length).toBe(1);
      expect(body.loans[0].borrower.toLowerCase()).toBe(WALLET_B.toLowerCase());
      expect(body.loans[0].status).toBe('active');
    });

    it('8. GET /api/wallets/[address]/offers returns user offers', async () => {
      const req = createRequest(`http://localhost:3000/api/wallets/${WALLET_A}/offers?status=open`);
      const res = await getWalletOffers(req, { params: Promise.resolve({ address: WALLET_A }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('offers');
      expect(Array.isArray(body.offers)).toBe(true);
      expect(body.offers.length).toBe(2);
      expect(body.offers[0].lender.toLowerCase()).toBe(WALLET_A.toLowerCase());
    });

    it('9. GET /api/loans/[id] returns loan details and total repayment', async () => {
      const req = createRequest('http://localhost:3000/api/loans/1');
      const res = await getLoanDetail(req, { params: Promise.resolve({ id: '1' }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('loan');
      expect(body.loan.loanId).toBe(1);
      expect(body.loan.totalRepaymentWei).toBe('1040000000000000000');
    });

    it('10. GET /api/activity returns indexed event stream', async () => {
      const req = createRequest('http://localhost:3000/api/activity');
      const res = await getActivity(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('activity');
      expect(Array.isArray(body.activity)).toBe(true);
      expect(body.activity.length).toBeGreaterThan(0);
    });

    it('11. GET /api/stats/market returns global market metrics', async () => {
      const res = await getMarketStats();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('totalPoolSizeWei');
      expect(body).toHaveProperty('totalActiveLoansCount');
      expect(body).toHaveProperty('totalVolumeWei');
      expect(body).toHaveProperty('totalOffersCount');
      expect(BigInt(body.totalPoolSizeWei)).toBeGreaterThanOrEqual(2000000000000000000n);
    });
  });

  describe('TS-02: Invalid Address / ID Error Handling (Rule 11)', () => {
    it('returns 400 for invalid collection address format', async () => {
      const req = createRequest('http://localhost:3000/api/collections/invalid-address');
      const res = await getCollectionDetail(req, { params: Promise.resolve({ address: 'invalid-address' }) });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe('INVALID_ADDRESS');
      expect(body.status).toBe(400);
      expect(body.error).toContain('Invalid Ethereum address format');
    });

    it('returns 404 when collection is not found in allowlist', async () => {
      const nonExistent = '0x000000000000000000000000000000000000dEaD';
      const req = createRequest(`http://localhost:3000/api/collections/${nonExistent}`);
      const res = await getCollectionDetail(req, { params: Promise.resolve({ address: nonExistent }) });
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.code).toBe('COLLECTION_NOT_FOUND');
      expect(body.status).toBe(404);
    });

    it('returns 400 for invalid loan ID', async () => {
      const req = createRequest('http://localhost:3000/api/loans/abc');
      const res = await getLoanDetail(req, { params: Promise.resolve({ id: 'abc' }) });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.code).toBe('INVALID_LOAN_ID');
      expect(body.status).toBe(400);
    });

    it('returns 404 for non-existent loan ID', async () => {
      const req = createRequest('http://localhost:3000/api/loans/9999');
      const res = await getLoanDetail(req, { params: Promise.resolve({ id: '9999' }) });
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.code).toBe('LOAN_NOT_FOUND');
      expect(body.status).toBe(404);
    });
  });

  describe('TS-03: Filtering and Sorting Behaviors', () => {
    it('filters activity feed by eventType', async () => {
      const req = createRequest('http://localhost:3000/api/activity?type=LoanStarted');
      const res = await getActivity(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.activity.every((a: { eventType: string }) => a.eventType === 'LoanStarted')).toBe(true);
    });

    it('filters wallet loans by status', async () => {
      const req = createRequest(`http://localhost:3000/api/wallets/${WALLET_B}/loans?status=repaid`);
      const res = await getWalletLoans(req, { params: Promise.resolve({ address: WALLET_B }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.loans.length).toBe(1);
      expect(body.loans[0].status).toBe('repaid');
    });
  });
});
