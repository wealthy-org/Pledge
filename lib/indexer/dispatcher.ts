import { RawPledgeLog } from './types';
import { indexerStore } from './store';
import { OfferRow, LoanRow } from '@/types/database';

export async function dispatchLog(log: RawPledgeLog): Promise<boolean> {
  const isNewEvent = indexerStore.insertEventIdempotent(log);
  if (!isNewEvent) {
    return false;
  }

  const { eventType, args, chainId, blockNumber, txHash, timestamp } = log;
  const now = timestamp || new Date().toISOString();

  switch (eventType) {
    case 'CollectionStatusChanged': {
      const collectionAddress = String(args.collection || '').toLowerCase();
      const enabled = Boolean(args.enabled);
      if (collectionAddress) {
        indexerStore.collections.set(`${chainId}:${collectionAddress}`, {
          chain_id: chainId,
          address: collectionAddress,
          name: '',
          symbol: null,
          image_url: null,
          is_enabled: enabled,
          added_at: now,
        });
      }
      break;
    }

    case 'CollectionEnabled': {
      const collectionAddress = String(args.collection || '').toLowerCase();
      if (collectionAddress) {
        indexerStore.collections.set(`${chainId}:${collectionAddress}`, {
          chain_id: chainId,
          address: collectionAddress,
          name: '',
          symbol: null,
          image_url: null,
          is_enabled: true,
          added_at: now,
        });
      }
      break;
    }

    case 'CollectionDisabled': {
      const collectionAddress = String(args.collection || '').toLowerCase();
      if (collectionAddress) {
        indexerStore.collections.set(`${chainId}:${collectionAddress}`, {
          chain_id: chainId,
          address: collectionAddress,
          name: '',
          symbol: null,
          image_url: null,
          is_enabled: false,
          added_at: now,
        });
      }
      break;
    }

    case 'OfferCreated': {
      const offerId = Number(args.offerId);
      const collectionAddress = String(args.collection || '').toLowerCase();
      if (collectionAddress) {
        indexerStore.collections.set(`${chainId}:${collectionAddress}`, {
          chain_id: chainId,
          address: collectionAddress,
          name: '',
          symbol: null,
          image_url: null,
          is_enabled: true,
          added_at: now,
        });
      }
      const offer: OfferRow = {
        offer_id: offerId,
        chain_id: chainId,
        lender: String(args.lender).toLowerCase(),
        collection: collectionAddress,
        principal_wei: String(args.principalWei || args.principal || '0'),
        term_interest_bps: Number(args.termInterestBps || 0),
        fee_bps_snapshot: Number(args.feeBpsSnapshot || 0),
        duration_seconds: Number(args.durationSeconds || 0),
        expires_at: args.expiresAt ? new Date(Number(args.expiresAt) * 1000).toISOString() : now,
        status: 'open',
        block_number: blockNumber,
        tx_hash: txHash,
        indexed_at: now,
      };
      indexerStore.upsertOffer(offer);
      break;
    }

    case 'OfferCancelled': {
      const offerId = Number(args.offerId);
      const existing = indexerStore.getOffer(chainId, offerId);
      if (existing) {
        existing.status = 'cancelled';
        indexerStore.upsertOffer(existing);
      }
      break;
    }

    case 'OfferFilled': {
      const offerId = Number(args.offerId);
      const existing = indexerStore.getOffer(chainId, offerId);
      if (existing) {
        existing.status = 'filled';
        indexerStore.upsertOffer(existing);
      }
      break;
    }

    case 'LoanStarted': {
      const loanId = Number(args.loanId);
      const collectionAddress = String(args.collection || '').toLowerCase();
      if (collectionAddress) {
        indexerStore.collections.set(`${chainId}:${collectionAddress}`, {
          chain_id: chainId,
          address: collectionAddress,
          name: '',
          symbol: null,
          image_url: null,
          is_enabled: true,
          added_at: now,
        });
      }
      const loan: LoanRow = {
        loan_id: loanId,
        chain_id: chainId,
        offer_id: Number(args.offerId || 0),
        lender: String(args.lender).toLowerCase(),
        borrower: String(args.borrower).toLowerCase(),
        collection: collectionAddress,
        token_id: String(args.tokenId || '0'),
        principal_wei: String(args.principalWei || args.principal || '0'),
        interest_wei: String(args.interestWei || args.interest || '0'),
        fee_bps_snapshot: Number(args.feeBpsSnapshot || 0),
        started_at: args.startedAt ? new Date(Number(args.startedAt) * 1000).toISOString() : now,
        due_at: args.dueAt ? new Date(Number(args.dueAt) * 1000).toISOString() : now,
        status: 'active',
        block_number: blockNumber,
        tx_hash: txHash,
        indexed_at: now,
      };
      indexerStore.upsertLoan(loan);
      break;
    }

    case 'LoanRepaid': {
      const loanId = Number(args.loanId);
      const existing = indexerStore.getLoan(chainId, loanId);
      if (existing) {
        existing.status = 'repaid';
        indexerStore.upsertLoan(existing);
      }
      break;
    }

    case 'LoanForeclosed': {
      const loanId = Number(args.loanId);
      const existing = indexerStore.getLoan(chainId, loanId);
      if (existing) {
        existing.status = 'foreclosed';
        indexerStore.upsertLoan(existing);
      }
      break;
    }

    default:
      break;
  }

  return true;
}
