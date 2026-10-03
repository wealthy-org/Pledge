import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getCollections } from '@/app/api/collections/route';
import { GET as getOffers } from '@/app/api/offers/route';
import { GET as getLoans } from '@/app/api/loans/route';
import { GET as getPortfolio } from '@/app/api/portfolio/[address]/route';
import { processLogBatch } from '@/workers/indexer';
import { indexerStore } from '@/lib/indexer/store';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { NextRequest } from 'next/server';

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('TICKET-26: Real Database Integration & X-Indexed-Block Headers Test Suite', () => {
  const WALLET_A = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
  const WALLET_B = '0xfB5870428d00B1a18274737609825b74c8C12e2B';
  const PLEDGE_ADDRESS = '0x481F5591D7B26661B651Ab2efB66c10c46958E33';
  const COLLECTION = '0x1111111111111111111111111111111111111111';

  beforeEach(() => {
    indexerStore.reset();
  });

  describe('TS-01 & TS-02: Database Query & X-Indexed-Block Headers', () => {
    it('returns collections with valid X-Indexed-Block and X-Indexer-Status headers', async () => {
      const req = createRequest('http://localhost:3000/api/collections');
      const res = await getCollections(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('X-Indexed-Block')).toBeDefined();
      expect(Number(res.headers.get('X-Indexed-Block'))).toBeGreaterThan(0);
      expect(res.headers.get('X-Indexer-Status')).toBe('synced');
    });

    it('returns global offers list with pagination and headers', async () => {
      const req = createRequest('http://localhost:3000/api/offers?limit=10');
      const res = await getOffers(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('offers');
      expect(Array.isArray(body.offers)).toBe(true);
      expect(res.headers.get('X-Indexed-Block')).toBeDefined();
    });

    it('returns global loans list with pagination and headers', async () => {
      const req = createRequest('http://localhost:3000/api/loans?limit=10');
      const res = await getLoans(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('loans');
      expect(Array.isArray(body.loans)).toBe(true);
    });

    it('returns user portfolio summary with lent and borrowed aggregation', async () => {
      const req = createRequest(`http://localhost:3000/api/portfolio/${WALLET_B}`);
      const res = await getPortfolio(req, { params: Promise.resolve({ address: WALLET_B }) });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.address.toLowerCase()).toBe(WALLET_B.toLowerCase());
      expect(body).toHaveProperty('borrowedLoans');
      expect(body).toHaveProperty('lentLoans');
      expect(body).toHaveProperty('activeOffers');
      expect(body).toHaveProperty('totalBorrowedWei');
    });
  });

  describe('TS-03: Post-Transaction Data Appearance', () => {
    it('immediately reflects new on-chain indexer logs in subsequent API queries', async () => {
      await processLogBatch([
        {
          chainId: TESTNET_CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 200,
          blockHash: '0xblock200',
          txHash: '0xnew_offer_tx',
          logIndex: 0,
          eventType: 'OfferCreated',
          args: {
            offerId: 99,
            lender: WALLET_A,
            collection: COLLECTION,
            principalWei: '5000000000000000000',
            termInterestBps: 800,
            feeBpsSnapshot: 200,
            durationSeconds: 604800,
          },
        },
      ]);

      const req = createRequest('http://localhost:3000/api/offers?status=open');
      const res = await getOffers(req);
      const body = await res.json();

      const createdOffer = body.offers.find((o: { offerId: number }) => o.offerId === 99);
      expect(createdOffer).toBeDefined();
      expect(createdOffer.principalWei).toBe('5000000000000000000');
    });
  });
});
