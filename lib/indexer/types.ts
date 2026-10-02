export type PledgeEventType =
  | 'OfferCreated'
  | 'OfferCancelled'
  | 'OfferFilled'
  | 'LoanStarted'
  | 'LoanRepaid'
  | 'LoanForeclosed'
  | 'ProceedsWithdrawn'
  | 'CollectionEnabled'
  | 'CollectionDisabled'
  | 'FeeParametersUpdated'
  | 'FeeRecipientUpdated'
  | 'NewActivityPaused'
  | 'NewActivityUnpaused';

export interface RawPledgeLog {
  chainId: number;
  contractAddress: string;
  blockNumber: number;
  blockHash: string;
  txHash: string;
  logIndex: number;
  eventType: PledgeEventType;
  timestamp?: string;
  args: Record<string, unknown>;
}

export interface IndexingResult {
  processedCount: number;
  lastBlock: number;
  eventsInserted: number;
}
