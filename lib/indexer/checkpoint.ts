import { indexerStore } from './store';

export async function getCheckpoint(chainId: number, contractAddress: string): Promise<number> {
  const record = indexerStore.getCheckpoint(chainId, contractAddress);
  return record ? record.last_block_number : 0;
}

export async function saveCheckpoint(
  chainId: number,
  contractAddress: string,
  blockNumber: number,
  blockHash: string
): Promise<void> {
  indexerStore.setCheckpoint(chainId, contractAddress, blockNumber, blockHash);
}
