import { indexerStore } from './store';
import { LoanStatus, OfferStatus } from '@/types/database';

export interface ReconciliationResult {
  reconciled: boolean;
  previousStatus: string;
  newStatus: string;
}

export interface BatchReconciliationResult {
  checked: number;
  updated: number;
}

export async function reconcileLoanState(
  chainId: number,
  loanId: number,
  onchainStatus: LoanStatus
): Promise<ReconciliationResult> {
  const loan = indexerStore.getLoan(chainId, loanId);
  if (!loan) {
    return {
      reconciled: false,
      previousStatus: 'unknown',
      newStatus: onchainStatus,
    };
  }

  const previousStatus = loan.status;
  if (previousStatus !== onchainStatus) {
    loan.status = onchainStatus;
    indexerStore.upsertLoan(loan);
    return {
      reconciled: true,
      previousStatus,
      newStatus: onchainStatus,
    };
  }

  return {
    reconciled: false,
    previousStatus,
    newStatus: onchainStatus,
  };
}

export async function reconcileOfferState(
  chainId: number,
  offerId: number,
  onchainStatus: OfferStatus
): Promise<ReconciliationResult> {
  const offer = indexerStore.getOffer(chainId, offerId);
  if (!offer) {
    return {
      reconciled: false,
      previousStatus: 'unknown',
      newStatus: onchainStatus,
    };
  }

  const previousStatus = offer.status;
  if (previousStatus !== onchainStatus) {
    offer.status = onchainStatus;
    indexerStore.upsertOffer(offer);
    return {
      reconciled: true,
      previousStatus,
      newStatus: onchainStatus,
    };
  }

  return {
    reconciled: false,
    previousStatus,
    newStatus: onchainStatus,
  };
}

export async function reconcileActiveLoansBatch(
  chainId: number,
  loanIds: number[],
  onchainReader: (loanId: number) => Promise<{ status: LoanStatus } | null>
): Promise<BatchReconciliationResult> {
  let checked = 0;
  let updated = 0;

  for (const loanId of loanIds) {
    checked += 1;
    const onchain = await onchainReader(loanId);
    if (onchain) {
      const res = await reconcileLoanState(chainId, loanId, onchain.status);
      if (res.reconciled) {
        updated += 1;
      }
    }
  }

  return {
    checked,
    updated,
  };
}
