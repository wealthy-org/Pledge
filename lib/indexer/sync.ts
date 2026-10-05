import { createPublicClient, http, decodeEventLog } from 'viem';
import { getActiveChain } from '@/config/chains';
import { getPledgeLoansAddress, getPledgeDeploymentBlock, PLEDGE_LOANS_ABI } from '@/config/contracts';
import { processLogBatch } from '@/workers/indexer';
import { RawPledgeLog, PledgeEventType } from './types';
import { indexerStore } from './store';

const lastSyncTimes = new Map<number, number>();
const SYNC_COOLDOWN_MS = 5000;
const RPC_TIMEOUT_MS = 8000;
const CHUNK_SIZE = 50000n;

export function resetSyncCooldown(chainId?: number): void {
  if (chainId !== undefined) {
    lastSyncTimes.delete(chainId);
  } else {
    lastSyncTimes.clear();
  }
}

export async function syncOnChainLogs(chainId?: number): Promise<number> {
  const chain = getActiveChain(chainId);
  const now = Date.now();
  const lastSync = lastSyncTimes.get(chain.id) || 0;
  if (now - lastSync < SYNC_COOLDOWN_MS) {
    return 0;
  }
  lastSyncTimes.set(chain.id, now);

  try {
    const rpcUrl = chain.rpcUrls.default.http[0];
    if (!rpcUrl) {
      throw new Error(`RPC URL is missing for chain ID ${chain.id}`);
    }
    const contractAddress = getPledgeLoansAddress(chain.id);

    const client = createPublicClient({
      chain,
      transport: http(rpcUrl, { timeout: RPC_TIMEOUT_MS }),
    });

    const currentBlock = await client.getBlockNumber();
    const checkpoint = indexerStore.getCheckpoint(chain.id, contractAddress);
    const defaultStartBlock = getPledgeDeploymentBlock(chain.id);
    const fromBlock = checkpoint ? BigInt(checkpoint.last_block_number + 1) : defaultStartBlock;

    if (fromBlock > currentBlock) {
      return 0;
    }

    let totalInserted = 0;
    let lastProcessedBlock = fromBlock - 1n;
    let lastProcessedBlockHash = checkpoint?.last_block_hash || '';

    for (let start = fromBlock; start <= currentBlock; start += CHUNK_SIZE) {
      const end = start + CHUNK_SIZE - 1n > currentBlock ? currentBlock : start + CHUNK_SIZE - 1n;

      let logs;
      try {
        logs = await client.getLogs({
          address: contractAddress,
          fromBlock: start,
          toBlock: end,
        });
      } catch {
        break;
      }

      const parsedLogs: RawPledgeLog[] = [];
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: PLEDGE_LOANS_ABI,
            data: log.data,
            topics: log.topics,
          });

          parsedLogs.push({
            chainId: chain.id,
            contractAddress: log.address.toLowerCase(),
            blockNumber: Number(log.blockNumber),
            blockHash: log.blockHash || '',
            txHash: log.transactionHash || '',
            logIndex: Number(log.logIndex),
            eventType: (decoded.eventName as unknown) as PledgeEventType,
            args: ((decoded.args as unknown) as Record<string, unknown>) || {},
          });
        } catch {}
      }

      if (parsedLogs.length > 0) {
        const result = await processLogBatch(parsedLogs);
        totalInserted += result.eventsInserted;
      }

      lastProcessedBlock = end;
    }

    if (lastProcessedBlock >= fromBlock) {
      try {
        const blockHeader = await client.getBlock({ blockNumber: lastProcessedBlock });
        if (blockHeader && blockHeader.hash) {
          lastProcessedBlockHash = blockHeader.hash;
        }
      } catch {}

      indexerStore.setCheckpoint(
        chain.id,
        contractAddress,
        Number(lastProcessedBlock),
        lastProcessedBlockHash
      );
    }

    return totalInserted;
  } catch {
    return 0;
  }
}
