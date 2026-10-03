import { describe, it, expect, beforeEach } from 'vitest';
import { processLogBatch } from '@/workers/indexer';
import { indexerStore } from '@/lib/indexer/store';
import { getCheckpoint } from '@/lib/indexer/checkpoint';
import { RawPledgeLog } from '@/lib/indexer/types';
import { TESTNET_CHAIN_ID } from '@/config/chains';

describe('TICKET-24: Event Indexer Core Worker Test Suite', () => {
  const CHAIN_ID = TESTNET_CHAIN_ID;
  const PLEDGE_ADDRESS = '0x481F5591D7B26661B651Ab2efB66c10c46958E33';
  const COLLECTION = '0x1111111111111111111111111111111111111111';
  const LENDER = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
  const BORROWER = '0xfB5870428d00B1a18274737609825b74c8C12e2B';

  beforeEach(() => {
    indexerStore.reset();
  });

  describe('TS-01: Idempotent Log Ingestion', () => {
    it('ingesting the same log stream twice does not duplicate event records', async () => {
      const logs: RawPledgeLog[] = [
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 100,
          blockHash: '0xblock100',
          txHash: '0xtx1',
          logIndex: 0,
          eventType: 'OfferCreated',
          args: {
            offerId: 1,
            lender: LENDER,
            collection: COLLECTION,
            principalWei: '1000000000000000000',
            termInterestBps: 500,
            feeBpsSnapshot: 200,
            durationSeconds: 604800,
            expiresAt: 1799999999,
          },
        },
      ];

      const firstPass = await processLogBatch(logs);
      expect(firstPass.eventsInserted).toBe(1);
      expect(indexerStore.events.length).toBe(1);

      const secondPass = await processLogBatch(logs);
      expect(secondPass.eventsInserted).toBe(0);
      expect(indexerStore.events.length).toBe(1);
    });
  });

  describe('TS-02: Complete State Transition Sequences', () => {
    it('processes OfferCreated -> OfferFilled -> LoanStarted -> LoanRepaid correctly', async () => {
      const logs: RawPledgeLog[] = [
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 100,
          blockHash: '0xblock100',
          txHash: '0xtx1',
          logIndex: 0,
          eventType: 'OfferCreated',
          args: {
            offerId: 1,
            lender: LENDER,
            collection: COLLECTION,
            principalWei: '1000000000000000000',
            termInterestBps: 500,
            feeBpsSnapshot: 200,
            durationSeconds: 604800,
            expiresAt: 1799999999,
          },
        },
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 105,
          blockHash: '0xblock105',
          txHash: '0xtx2',
          logIndex: 0,
          eventType: 'OfferFilled',
          args: {
            offerId: 1,
            loanId: 1,
          },
        },
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 105,
          blockHash: '0xblock105',
          txHash: '0xtx2',
          logIndex: 1,
          eventType: 'LoanStarted',
          args: {
            loanId: 1,
            offerId: 1,
            lender: LENDER,
            borrower: BORROWER,
            collection: COLLECTION,
            tokenId: '42',
            principalWei: '1000000000000000000',
            interestWei: '50000000000000000',
            durationSeconds: 604800,
            dueAt: 1800604799,
            feeBpsSnapshot: 200,
          },
        },
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 110,
          blockHash: '0xblock110',
          txHash: '0xtx3',
          logIndex: 0,
          eventType: 'LoanRepaid',
          args: {
            loanId: 1,
          },
        },
      ];

      const result = await processLogBatch(logs);
      expect(result.eventsInserted).toBe(4);

      const offer = indexerStore.getOffer(CHAIN_ID, 1);
      expect(offer?.status).toBe('filled');

      const loan = indexerStore.getLoan(CHAIN_ID, 1);
      expect(loan?.status).toBe('repaid');
      expect(loan?.borrower.toLowerCase()).toBe(BORROWER.toLowerCase());
      expect(loan?.token_id).toBe('42');
    });

    it('processes OfferCreated -> OfferCancelled sequence', async () => {
      const logs: RawPledgeLog[] = [
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 100,
          blockHash: '0xblock100',
          txHash: '0xtx1',
          logIndex: 0,
          eventType: 'OfferCreated',
          args: {
            offerId: 2,
            lender: LENDER,
            collection: COLLECTION,
            principalWei: '500000000000000000',
            termInterestBps: 300,
            feeBpsSnapshot: 200,
            durationSeconds: 604800,
            expiresAt: 1799999999,
          },
        },
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 102,
          blockHash: '0xblock102',
          txHash: '0xtx2',
          logIndex: 0,
          eventType: 'OfferCancelled',
          args: {
            offerId: 2,
          },
        },
      ];

      await processLogBatch(logs);
      const offer = indexerStore.getOffer(CHAIN_ID, 2);
      expect(offer?.status).toBe('cancelled');
    });

    it('processes LoanStarted -> LoanForeclosed sequence', async () => {
      const logs: RawPledgeLog[] = [
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 100,
          blockHash: '0xblock100',
          txHash: '0xtx1',
          logIndex: 0,
          eventType: 'LoanStarted',
          args: {
            loanId: 3,
            offerId: 5,
            lender: LENDER,
            borrower: BORROWER,
            collection: COLLECTION,
            tokenId: '99',
            principalWei: '750000000000000000',
            interestWei: '30000000000000000',
            dueAt: 1800000000,
            feeBpsSnapshot: 200,
          },
        },
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 150,
          blockHash: '0xblock150',
          txHash: '0xtx2',
          logIndex: 0,
          eventType: 'LoanForeclosed',
          args: {
            loanId: 3,
            destination: LENDER,
          },
        },
      ];

      await processLogBatch(logs);
      const loan = indexerStore.getLoan(CHAIN_ID, 3);
      expect(loan?.status).toBe('foreclosed');
    });
  });

  describe('TS-03: Checkpoint Persistence', () => {
    it('updates last indexed block accurately', async () => {
      const logs: RawPledgeLog[] = [
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 250,
          blockHash: '0xblock250',
          txHash: '0xtx1',
          logIndex: 0,
          eventType: 'OfferCreated',
          args: {
            offerId: 10,
            lender: LENDER,
            collection: COLLECTION,
            principalWei: '1000000000000000000',
            termInterestBps: 500,
            feeBpsSnapshot: 200,
            durationSeconds: 604800,
          },
        },
      ];

      await processLogBatch(logs);
      const lastBlock = await getCheckpoint(CHAIN_ID, PLEDGE_ADDRESS);
      expect(lastBlock).toBe(250);
    });
  });
});
