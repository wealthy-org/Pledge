import { OfferRow, LoanRow, EventRow, IndexerCheckpointRow, CollectionRow, Json } from '@/types/database';
import { RawPledgeLog } from './types';

class IndexerMemoryStore {
  public offers = new Map<string, OfferRow>();
  public loans = new Map<string, LoanRow>();
  public events: EventRow[] = [];
  public checkpoints = new Map<string, IndexerCheckpointRow>();
  public collections = new Map<string, CollectionRow>();
  private eventIds = new Set<string>();

  private getEventCompositeKey(chainId: number, contractAddress: string, txHash: string, logIndex: number): string {
    return `${chainId}:${contractAddress.toLowerCase()}:${txHash.toLowerCase()}:${logIndex}`;
  }

  public insertEventIdempotent(log: RawPledgeLog): boolean {
    const key = this.getEventCompositeKey(log.chainId, log.contractAddress, log.txHash, log.logIndex);
    if (this.eventIds.has(key)) {
      return false;
    }

    this.eventIds.add(key);
    const sanitizedData: Record<string, unknown> = {};
    if (log.args && typeof log.args === 'object') {
      for (const [k, v] of Object.entries(log.args)) {
        sanitizedData[k] = typeof v === 'bigint' ? v.toString() : v;
      }
    }
    const row: EventRow = {
      id: this.events.length + 1,
      chain_id: log.chainId,
      event_type: log.eventType,
      contract_address: log.contractAddress.toLowerCase(),
      block_number: log.blockNumber,
      block_hash: log.blockHash,
      tx_hash: log.txHash,
      log_index: log.logIndex,
      data: sanitizedData as unknown as Json,
      indexed_at: log.timestamp || new Date().toISOString(),
    };
    this.events.push(row);
    return true;
  }

  public upsertOffer(offer: OfferRow): void {
    const key = `${offer.chain_id}:${offer.offer_id}`;
    this.offers.set(key, offer);
  }

  public getOffer(chainId: number, offerId: number): OfferRow | undefined {
    return this.offers.get(`${chainId}:${offerId}`);
  }

  public upsertLoan(loan: LoanRow): void {
    const key = `${loan.chain_id}:${loan.loan_id}`;
    this.loans.set(key, loan);
  }

  public getLoan(chainId: number, loanId: number): LoanRow | undefined {
    return this.loans.get(`${chainId}:${loanId}`);
  }

  public setCheckpoint(chainId: number, contractAddress: string, blockNumber: number, blockHash: string): void {
    const key = `${chainId}:${contractAddress.toLowerCase()}`;
    this.checkpoints.set(key, {
      chain_id: chainId,
      contract_address: contractAddress.toLowerCase(),
      last_block_number: blockNumber,
      last_block_hash: blockHash,
      updated_at: new Date().toISOString(),
    });
  }

  public getCheckpoint(chainId: number, contractAddress: string): IndexerCheckpointRow | undefined {
    const key = `${chainId}:${contractAddress.toLowerCase()}`;
    return this.checkpoints.get(key);
  }

  public reset(): void {
    this.offers.clear();
    this.loans.clear();
    this.events = [];
    this.eventIds.clear();
    this.checkpoints.clear();
    this.collections.clear();
  }

  public clear(): void {
    this.reset();
  }
}

export const indexerStore = new IndexerMemoryStore();
