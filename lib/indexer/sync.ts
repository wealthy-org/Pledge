import { createPublicClient, http, decodeEventLog } from 'viem';
import { getActiveChain, TESTNET_CHAIN_ID } from '@/config/chains';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';
import { processLogBatch } from '@/workers/indexer';
import { RawPledgeLog, PledgeEventType } from './types';
import { indexerStore } from './store';

let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 5000;
const RPC_TIMEOUT_MS = 4000;
const TESTNET_DEPLOYMENT_START_BLOCK = 127800000n;
const HIGH_BLOCK_HEIGHT_THRESHOLD = 500000n;

export async function syncOnChainLogs(chainId?: number): Promise<number> {
  const now = Date.now();
  if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return 0;
  }
  lastSyncTime = now;

  try {
    const chain = getActiveChain(chainId);
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
    const defaultStartBlock = chain.id === TESTNET_CHAIN_ID ? (currentBlock > HIGH_BLOCK_HEIGHT_THRESHOLD ? TESTNET_DEPLOYMENT_START_BLOCK : 0n) : 0n;
    const fromBlock = checkpoint ? BigInt(checkpoint.last_block_number + 1) : defaultStartBlock;

    if (fromBlock > currentBlock) {
      return 0;
    }

    const logs = await client.getLogs({
      address: contractAddress,
      fromBlock,
      toBlock: currentBlock,
    });

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
      return result.eventsInserted;
    }

    indexerStore.setCheckpoint(chain.id, contractAddress, Number(currentBlock), '');
    return 0;
  } catch {
    return 0;
  }
}
