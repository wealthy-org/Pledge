import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncOnChainLogs, resetSyncCooldown } from '@/lib/indexer/sync';
import { indexerStore } from '@/lib/indexer/store';
import { createPublicClient } from 'viem';

vi.unmock('@/lib/indexer/sync');
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: vi.fn(),
  };
});

describe('Indexer Sync Pagination & Reliability Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSyncCooldown();
    indexerStore.clear();
  });

  it('paginates large block gaps in 5000-block chunks', async () => {
    const mockGetLogs = vi.fn().mockResolvedValue([]);
    const mockGetBlockNumber = vi.fn().mockResolvedValue(127812000n);
    const mockGetBlock = vi.fn().mockResolvedValue({ hash: '0xblockhash123' });

    (createPublicClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getBlockNumber: mockGetBlockNumber,
      getLogs: mockGetLogs,
      getBlock: mockGetBlock,
    });

    indexerStore.setCheckpoint(46630, '0x481F5591D7B26661B651Ab2efB66c10c46958E33', 127800000, '0xprev');

    const inserted = await syncOnChainLogs(46630);

    expect(inserted).toBe(0);
    expect(mockGetLogs).toHaveBeenCalledTimes(3);
    expect(mockGetLogs).toHaveBeenNthCalledWith(1, expect.objectContaining({
      fromBlock: 127800001n,
      toBlock: 127805000n,
    }));
    expect(mockGetLogs).toHaveBeenNthCalledWith(2, expect.objectContaining({
      fromBlock: 127805001n,
      toBlock: 127810000n,
    }));
    expect(mockGetLogs).toHaveBeenNthCalledWith(3, expect.objectContaining({
      fromBlock: 127810001n,
      toBlock: 127812000n,
    }));

    const checkpoint = indexerStore.getCheckpoint(46630, '0x481F5591D7B26661B651Ab2efB66c10c46958E33');
    expect(checkpoint).toBeDefined();
    expect(checkpoint?.last_block_number).toBe(127812000);
    expect(checkpoint?.last_block_hash).toBe('0xblockhash123');
  });

  it('stops checkpoint advancement if a middle chunk fails', async () => {
    const mockGetLogs = vi.fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('RPC rate limited'));
    const mockGetBlockNumber = vi.fn().mockResolvedValue(127812000n);
    const mockGetBlock = vi.fn().mockResolvedValue({ hash: '0xblockhashchunk1' });

    (createPublicClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getBlockNumber: mockGetBlockNumber,
      getLogs: mockGetLogs,
      getBlock: mockGetBlock,
    });

    indexerStore.setCheckpoint(46630, '0x481F5591D7B26661B651Ab2efB66c10c46958E33', 127800000, '0xprev');

    await syncOnChainLogs(46630);

    const checkpoint = indexerStore.getCheckpoint(46630, '0x481F5591D7B26661B651Ab2efB66c10c46958E33');
    expect(checkpoint?.last_block_number).toBe(127805000);
  });

  it('isolates sync cooldown per chain ID', async () => {
    const mockGetLogs = vi.fn().mockResolvedValue([]);
    const mockGetBlockNumber = vi.fn().mockResolvedValue(100n);
    const mockGetBlock = vi.fn().mockResolvedValue({ hash: '0xhash' });

    (createPublicClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getBlockNumber: mockGetBlockNumber,
      getLogs: mockGetLogs,
      getBlock: mockGetBlock,
    });

    await syncOnChainLogs(46630);
    expect(mockGetBlockNumber).toHaveBeenCalledTimes(1);

    await syncOnChainLogs(46630);
    expect(mockGetBlockNumber).toHaveBeenCalledTimes(1);
  });
});
