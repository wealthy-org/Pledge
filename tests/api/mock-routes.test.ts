import { describe, it, expect } from 'vitest';
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
import { NextRequest } from 'next/server';

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('TICKET-21: Mock API Route Handlers Test Suite', () => {
  const RHG_ADDRESS = '0x1111111111111111111111111111111111111111';
  const WALLET_A = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
  const WALLET_B = '0xfB5870428d00B1a18274737609825b74c8C12e2B';

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
      expect(body.offers.length).toBe(2);
      expect(BigInt(body.offers[0].principalWei)).toBeGreaterThanOrEqual(BigInt(body.offers[1].principalWei));
    });

    it('5. GET /api/collections/[address]/stats returns aggregate metrics', async () => {
      const req = createRequest(`http://localhost:3000/api/collections/${RHG_ADDRESS}/stats`);
      const res = await getCollectionStats(req, { params: Promise.resolve({ address: RHG_ADDRESS }) });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.bestOfferWei).toBe('2000000000000000000');
      expect(body.poolSizeWei).toBe('3500000000000000000');
      expect(body.offerCount).toBe(2);
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
      expect(BigInt(body.totalPoolSizeWei)).toBe(4250000000000000000n);
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
