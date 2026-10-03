import { RawPledgeLog, IndexingResult } from '@/lib/indexer/types';
import { dispatchLog } from '@/lib/indexer/dispatcher';
import { saveCheckpoint } from '@/lib/indexer/checkpoint';
import { clearSnapshotCache } from '@/lib/protocol/snapshot';
import { TESTNET_CHAIN_ID } from '@/config/chains';

export async function processLogBatch(logs: RawPledgeLog[]): Promise<IndexingResult> {
  let eventsInserted = 0;
  let lastBlock = 0;
  let lastBlockHash = '';
  let chainId = TESTNET_CHAIN_ID;
  let contractAddress = '';

  const sortedLogs = [...logs].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }
    return a.logIndex - b.logIndex;
  });

  for (const log of sortedLogs) {
    const inserted = await dispatchLog(log);
    if (inserted) {
      eventsInserted += 1;
    }
    lastBlock = Math.max(lastBlock, log.blockNumber);
    lastBlockHash = log.blockHash;
    chainId = log.chainId;
    contractAddress = log.contractAddress;
  }

  if (lastBlock > 0 && contractAddress) {
    await saveCheckpoint(chainId, contractAddress, lastBlock, lastBlockHash);
  }

  if (logs.length > 0) {
    clearSnapshotCache(chainId);
  }

  return {
    processedCount: logs.length,
    lastBlock,
    eventsInserted,
  };
}
