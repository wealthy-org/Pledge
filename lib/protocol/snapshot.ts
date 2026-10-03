import { createPublicClient, http } from 'viem';
import { getActiveChain, TESTNET_CHAIN_ID } from '@/config/chains';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';
import { indexerStore } from '@/lib/indexer/store';
import { syncOnChainLogs } from '@/lib/indexer/sync';
import { ProtocolSnapshot, RawContractOffer, RawContractLoan } from './types';
import { OfferStatus, LoanStatus } from '@/types/database';

const SNAPSHOT_TTL_MS = 2500;
const RPC_TIMEOUT_MS = 5000;
const snapshotCache = new Map<number, ProtocolSnapshot>();
const inFlightSnapshots = new Map<number, Promise<ProtocolSnapshot>>();

function resolveChainId(chainId?: number): number {
  if (chainId !== undefined && !isNaN(chainId) && chainId > 0) return chainId;
  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (!envChainId) return TESTNET_CHAIN_ID;
  const parsed = Number(envChainId);
  return !isNaN(parsed) && parsed > 0 ? parsed : TESTNET_CHAIN_ID;
}

function decodeOfferStatus(statusNum: number): OfferStatus {
  if (statusNum === 1) return 'open';
  if (statusNum === 2) return 'filled';
  return 'cancelled';
}

function decodeLoanStatus(statusNum: number): LoanStatus {
  if (statusNum === 1) return 'active';
  if (statusNum === 2) return 'repaid';
  return 'foreclosed';
}

export async function getProtocolSnapshot(chainId?: number): Promise<ProtocolSnapshot> {
  const targetChainId = resolveChainId(chainId);
  const now = Date.now();

  const cached = snapshotCache.get(targetChainId);
  if (cached && now - cached.fetchedAt < SNAPSHOT_TTL_MS) {
    return cached;
  }

  const inFlight = inFlightSnapshots.get(targetChainId);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    try {
      try {
        await syncOnChainLogs(targetChainId);
      } catch {}

      const chain = getActiveChain(targetChainId);
      const rpcUrl = chain.rpcUrls.default.http[0];
      const contractAddress = getPledgeLoansAddress(targetChainId);

      const client = createPublicClient({
        chain,
        transport: http(rpcUrl, { timeout: RPC_TIMEOUT_MS, batch: true }),
      });

      let blockNumber = 0;
      let protocolFeeBps = 200;
      let newActivityPaused = false;
      let nextOfferId = 1n;
      let nextLoanId = 1n;

      try {
        const [block, fee, paused, nextOffer, nextLoan] = await Promise.all([
          client.getBlockNumber(),
          client.readContract({
            address: contractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'protocolFeeBps',
          }).catch(() => 200),
          client.readContract({
            address: contractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'newActivityPaused',
          }).catch(() => false),
          client.readContract({
            address: contractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'nextOfferId',
          }).catch(() => 1n),
          client.readContract({
            address: contractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'nextLoanId',
          }).catch(() => 1n),
        ]);

        blockNumber = Number(block);
        protocolFeeBps = Number(fee);
        newActivityPaused = Boolean(paused);
        nextOfferId = BigInt(nextOffer as bigint);
        nextLoanId = BigInt(nextLoan as bigint);
      } catch {}

      const offersMap = new Map<number, RawContractOffer>();
      const loansMap = new Map<number, RawContractLoan>();
      const enabledCollectionsSet = new Set<string>();

      const nowSeconds = Math.floor(now / 1000);

      const offerPromises: Promise<void>[] = [];
      for (let i = 1n; i < nextOfferId; i++) {
        const id = Number(i);
        offerPromises.push(
          client
            .readContract({
              address: contractAddress,
              abi: PLEDGE_LOANS_ABI,
              functionName: 'offers',
              args: [i],
            })
            .then((res) => {
              const tuple = res as readonly [
                string,
                string,
                bigint,
                number,
                number,
                bigint,
                number,
                number
              ];
              const lender = (tuple[0] || '').toLowerCase();
              const collection = (tuple[1] || '').toLowerCase();
              const principalWei = tuple[2] ? tuple[2].toString() : '0';
              const termInterestBps = Number(tuple[3] || 0);
              const durationSeconds = Number(tuple[4] || 0);
              const expiresAtSeconds = Number(tuple[5] || 0);
              const feeBpsSnapshot = Number(tuple[6] || 0);
              const statusNum = Number(tuple[7] || 0);
              const isExpired = expiresAtSeconds > 0 && expiresAtSeconds < nowSeconds;

              if (collection) {
                enabledCollectionsSet.add(collection);
              }

              offersMap.set(id, {
                offerId: id,
                lender,
                collection,
                principalWei,
                termInterestBps,
                durationSeconds,
                expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
                feeBpsSnapshot,
                status: decodeOfferStatus(statusNum),
                isExpired,
              });
            })
            .catch(() => {})
        );
      }

      const loanPromises: Promise<void>[] = [];
      for (let i = 1n; i < nextLoanId; i++) {
        const id = Number(i);
        loanPromises.push(
          client
            .readContract({
              address: contractAddress,
              abi: PLEDGE_LOANS_ABI,
              functionName: 'loans',
              args: [i],
            })
            .then((res) => {
              const tuple = res as readonly [
                bigint,
                string,
                string,
                string,
                bigint,
                bigint,
                bigint,
                bigint,
                bigint,
                number,
                number
              ];
              const offerId = Number(tuple[0] || 0);
              const lender = (tuple[1] || '').toLowerCase();
              const borrower = (tuple[2] || '').toLowerCase();
              const collection = (tuple[3] || '').toLowerCase();
              const tokenId = tuple[4] ? tuple[4].toString() : '0';
              const principalWei = tuple[5] ? tuple[5].toString() : '0';
              const interestWei = tuple[6] ? tuple[6].toString() : '0';
              const feeBpsSnapshot = Number(tuple[7] || 0);
              const dueAtSeconds = Number(tuple[8] || 0);
              const statusNum = Number(tuple[10] || 0);
              const isOverdue = dueAtSeconds > 0 && dueAtSeconds < nowSeconds;

              if (collection) {
                enabledCollectionsSet.add(collection);
              }

              loansMap.set(id, {
                loanId: id,
                offerId,
                lender,
                borrower,
                collection,
                tokenId,
                principalWei,
                interestWei,
                feeBpsSnapshot,
                startedAt: new Date(now).toISOString(),
                dueAt: new Date(dueAtSeconds * 1000).toISOString(),
                status: decodeLoanStatus(statusNum),
                isOverdue,
              });
            })
            .catch(() => {})
        );
      }

      await Promise.all([...offerPromises, ...loanPromises]);

      for (const row of indexerStore.offers.values()) {
        if (row.chain_id === targetChainId && !offersMap.has(row.offer_id)) {
          const expSeconds = Math.floor(new Date(row.expires_at).getTime() / 1000);
          offersMap.set(row.offer_id, {
            offerId: row.offer_id,
            lender: row.lender.toLowerCase(),
            collection: row.collection.toLowerCase(),
            principalWei: row.principal_wei,
            termInterestBps: row.term_interest_bps,
            durationSeconds: row.duration_seconds,
            expiresAt: row.expires_at,
            feeBpsSnapshot: row.fee_bps_snapshot,
            status: row.status,
            isExpired: expSeconds < nowSeconds,
          });
          enabledCollectionsSet.add(row.collection.toLowerCase());
        }
      }

      for (const row of indexerStore.loans.values()) {
        if (row.chain_id === targetChainId && !loansMap.has(row.loan_id)) {
          const dueSeconds = Math.floor(new Date(row.due_at).getTime() / 1000);
          loansMap.set(row.loan_id, {
            loanId: row.loan_id,
            offerId: row.offer_id,
            lender: row.lender.toLowerCase(),
            borrower: row.borrower.toLowerCase(),
            collection: row.collection.toLowerCase(),
            tokenId: row.token_id,
            principalWei: row.principal_wei,
            interestWei: row.interest_wei,
            feeBpsSnapshot: row.fee_bps_snapshot,
            startedAt: row.started_at,
            dueAt: row.due_at,
            status: row.status,
            isOverdue: dueSeconds < nowSeconds,
          });
          enabledCollectionsSet.add(row.collection.toLowerCase());
        }
      }

      for (const col of indexerStore.collections.values()) {
        if (col.chain_id === targetChainId && col.is_enabled) {
          enabledCollectionsSet.add(col.address.toLowerCase());
        }
      }

      const snapshot: ProtocolSnapshot = {
        chainId: targetChainId,
        contractAddress,
        blockNumber,
        protocolFeeBps,
        newActivityPaused,
        offers: Array.from(offersMap.values()),
        loans: Array.from(loansMap.values()),
        enabledCollections: Array.from(enabledCollectionsSet),
        fetchedAt: now,
      };

      snapshotCache.set(targetChainId, snapshot);
      return snapshot;
    } finally {
      inFlightSnapshots.delete(targetChainId);
    }
  })();

  inFlightSnapshots.set(targetChainId, promise);
  return promise;
}

export function clearSnapshotCache(chainId?: number): void {
  if (chainId !== undefined) {
    snapshotCache.delete(chainId);
  } else {
    snapshotCache.clear();
  }
}
