import { describe, it, expect, beforeEach } from 'vitest';
import { processLogBatch } from '@/workers/indexer';
import { indexerStore } from '@/lib/indexer/store';
import { detectReorg, rollbackToSafeBlock } from '@/lib/indexer/reorg';
import { reconcileLoanState, reconcileOfferState, reconcileActiveLoansBatch } from '@/lib/indexer/reconciliation';
import { RawPledgeLog } from '@/lib/indexer/types';
import { TESTNET_CHAIN_ID } from '@/config/chains';

describe('TICKET-25: Indexer Reorg Handling & Reconciliation Test Suite', () => {
  const CHAIN_ID = TESTNET_CHAIN_ID;
  const PLEDGE_ADDRESS = '0x481F5591D7B26661B651Ab2efB66c10c46958E33';
  const COLLECTION = '0x1111111111111111111111111111111111111111';
  const LENDER = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
  const BORROWER = '0xfB5870428d00B1a18274737609825b74c8C12e2B';

  beforeEach(() => {
    indexerStore.reset();
  });

  describe('TS-01: Reorg Detection and Rollback', () => {
    it('detects parentHash mismatch and triggers rollback to safe block', async () => {
      const isReorg = detectReorg('0xparent_new', '0xparent_old');
      expect(isReorg).toBe(true);

      const noReorg = detectReorg('0xparent_valid', '0xparent_valid');
      expect(noReorg).toBe(false);
    });

    it('rolls back events above safe block and updates checkpoint', async () => {
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
          },
        },
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 105,
          blockHash: '0xorphaned_105',
          txHash: '0xbad_tx',
          logIndex: 0,
          eventType: 'OfferCancelled',
          args: {
            offerId: 1,
          },
        },
      ];

      await processLogBatch(logs);
      expect(indexerStore.events.length).toBe(2);
      expect(indexerStore.getOffer(CHAIN_ID, 1)?.status).toBe('cancelled');

      const rolledBackCount = await rollbackToSafeBlock(CHAIN_ID, PLEDGE_ADDRESS, 100);
      expect(rolledBackCount).toBe(1);
      expect(indexerStore.events.length).toBe(1);
      expect(indexerStore.getCheckpoint(CHAIN_ID, PLEDGE_ADDRESS)?.last_block_number).toBe(100);

      const validReplayLogs: RawPledgeLog[] = [
        {
          chainId: CHAIN_ID,
          contractAddress: PLEDGE_ADDRESS,
          blockNumber: 105,
          blockHash: '0xcanonical_105',
          txHash: '0xgood_tx',
          logIndex: 0,
          eventType: 'OfferFilled',
          args: {
            offerId: 1,
            loanId: 1,
          },
        },
      ];

      await processLogBatch(validReplayLogs);
      expect(indexerStore.getOffer(CHAIN_ID, 1)?.status).toBe('filled');
      expect(indexerStore.events.length).toBe(2);
    });
  });

  describe('TS-02: Periodic State Reconciliation', () => {
    it('reconciles divergent loan status from on-chain truth', async () => {
      indexerStore.upsertLoan({
        loan_id: 1,
        chain_id: CHAIN_ID,
        offer_id: 1,
        lender: LENDER,
        borrower: BORROWER,
        collection: COLLECTION,
        token_id: '42',
        principal_wei: '1000000000000000000',
        interest_wei: '50000000000000000',
        fee_bps_snapshot: 200,
        started_at: new Date().toISOString(),
        due_at: new Date().toISOString(),
        status: 'active',
        block_number: 100,
        tx_hash: '0xtx1',
        indexed_at: new Date().toISOString(),
      });

      const res = await reconcileLoanState(CHAIN_ID, 1, 'repaid');
      expect(res.reconciled).toBe(true);
      expect(res.previousStatus).toBe('active');
      expect(res.newStatus).toBe('repaid');
      expect(indexerStore.getLoan(CHAIN_ID, 1)?.status).toBe('repaid');
    });

    it('reconciles divergent offer status from on-chain truth', async () => {
      indexerStore.upsertOffer({
        offer_id: 1,
        chain_id: CHAIN_ID,
        lender: LENDER,
        collection: COLLECTION,
        principal_wei: '1000000000000000000',
        term_interest_bps: 500,
        fee_bps_snapshot: 200,
        duration_seconds: 604800,
        expires_at: new Date().toISOString(),
        status: 'open',
        block_number: 100,
        tx_hash: '0xtx1',
        indexed_at: new Date().toISOString(),
      });

      const res = await reconcileOfferState(CHAIN_ID, 1, 'cancelled');
      expect(res.reconciled).toBe(true);
      expect(res.newStatus).toBe('cancelled');
      expect(indexerStore.getOffer(CHAIN_ID, 1)?.status).toBe('cancelled');
    });

    it('batch reconciles active loans and reports updated count', async () => {
      indexerStore.upsertLoan({
        loan_id: 1,
        chain_id: CHAIN_ID,
        offer_id: 1,
        lender: LENDER,
        borrower: BORROWER,
        collection: COLLECTION,
        token_id: '42',
        principal_wei: '1000000000000000000',
        interest_wei: '50000000000000000',
        fee_bps_snapshot: 200,
        started_at: new Date().toISOString(),
        due_at: new Date().toISOString(),
        status: 'active',
        block_number: 100,
        tx_hash: '0xtx1',
        indexed_at: new Date().toISOString(),
      });

      const result = await reconcileActiveLoansBatch(CHAIN_ID, [1], async (id) => {
        if (id === 1) return { status: 'repaid' };
        return null;
      });

      expect(result.checked).toBe(1);
      expect(result.updated).toBe(1);
      expect(indexerStore.getLoan(CHAIN_ID, 1)?.status).toBe('repaid');
    });
  });

  describe('TS-03: Deep Reorg Tolerance', () => {
    it('handles deep reorg up to 32 blocks gracefully', async () => {
      for (let block = 100; block <= 132; block++) {
        await processLogBatch([
          {
            chainId: CHAIN_ID,
            contractAddress: PLEDGE_ADDRESS,
            blockNumber: block,
            blockHash: `0xblock${block}`,
            txHash: `0xtx${block}`,
            logIndex: 0,
            eventType: 'OfferCreated',
            args: {
              offerId: block,
              lender: LENDER,
              collection: COLLECTION,
              principalWei: '1000000000000000000',
              termInterestBps: 500,
              feeBpsSnapshot: 200,
              durationSeconds: 604800,
            },
          },
        ]);
      }

      expect(indexerStore.events.length).toBe(33);
      expect(indexerStore.getCheckpoint(CHAIN_ID, PLEDGE_ADDRESS)?.last_block_number).toBe(132);

      const removed = await rollbackToSafeBlock(CHAIN_ID, PLEDGE_ADDRESS, 100);
      expect(removed).toBe(32);
      expect(indexerStore.events.length).toBe(1);
      expect(indexerStore.getCheckpoint(CHAIN_ID, PLEDGE_ADDRESS)?.last_block_number).toBe(100);
    });
  });
});
