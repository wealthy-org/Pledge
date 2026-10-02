import { indexerStore } from './store';

export function detectReorg(incomingParentHash: string, recordedBlockHash: string): boolean {
  if (!incomingParentHash || !recordedBlockHash) return false;
  return incomingParentHash.toLowerCase() !== recordedBlockHash.toLowerCase();
}

export async function rollbackToSafeBlock(
  chainId: number,
  contractAddress: string,
  safeBlockNumber: number
): Promise<number> {
  const initialCount = indexerStore.events.length;

  const validEvents = indexerStore.events.filter(
    (e) => e.chain_id === chainId && e.contract_address === contractAddress.toLowerCase() && e.block_number <= safeBlockNumber
  );

  const removedCount = initialCount - validEvents.length;
  indexerStore.events = validEvents;

  const lastValidEvent = validEvents[validEvents.length - 1];
  const lastBlockHash = lastValidEvent ? lastValidEvent.block_hash : '0xgenesis';

  indexerStore.setCheckpoint(chainId, contractAddress, safeBlockNumber, lastBlockHash);

  return removedCount;
}
