import { vi } from 'vitest';
import { indexerStore } from '@/lib/indexer/store';

process.env.NEXT_PUBLIC_CHAIN_ID = '46630';
process.env.NEXT_PUBLIC_RPC_URL = 'https://rpc.testnet.chain.robinhood.com';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT = '0x481F5591D7B26661B651Ab2efB66c10c46958E33';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET = '0x4444444444444444444444444444444444444444';
process.env.MAINNET_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
process.env.MAINNET_PLEDGE_CONTRACT = '0x4444444444444444444444444444444444444444';
process.env.MAINNET_START_BLOCK = '1';
process.env.TESTNET_START_BLOCK = '1';
process.env.NEXT_PUBLIC_DB_SCHEMA = 'pledge';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>().catch(() => ({}));
  return {
    ...actual,
    useAccount: () => ({
      address: undefined,
      isConnected: false,
    }),
    useConnection: () => ({
      address: undefined,
      isConnected: false,
    }),
    usePublicClient: () => undefined,
    useWalletClient: () => ({ data: undefined }),
    useConfig: () => ({}),
    useBalance: () => ({
      data: {
        value: 10000000000000000000n,
        decimals: 18,
        symbol: 'ETH',
        formatted: '10.0',
      },
      isLoading: false,
    }),
  };
});

vi.mock('next/font/google', () => ({
  Inter: () => ({
    variable: '--font-inter',
    className: 'font-inter',
    style: { fontFamily: 'Inter, sans-serif' },
  }),
}));

vi.mock('@/lib/indexer/sync', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>().catch(() => ({}));
  return {
    ...actual,
    syncOnChainLogs: vi.fn().mockResolvedValue(0),
    resetSyncCooldown: vi.fn(),
  };
});

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dead';

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>().catch(() => ({}));
  return {
    ...actual,
    createPublicClient: vi.fn().mockImplementation(() => ({
      getBlockNumber: vi.fn().mockResolvedValue(127812000n),
      getLogs: vi.fn().mockResolvedValue([]),
      getBlock: vi.fn().mockResolvedValue({ hash: '0xmockhash' }),
      readContract: vi.fn().mockImplementation(({ functionName, address }) => {
        const addr = String(address || '').toLowerCase();
        if (addr === ZERO_ADDRESS || addr === DEAD_ADDRESS) {
          return Promise.resolve(null);
        }
        if (functionName === 'getCuratedCollections') {
          const curated = Array.from(indexerStore.collections.values())
            .filter((c) => c.is_enabled)
            .map((c) => c.address as `0x${string}`);
          return Promise.resolve(curated);
        }
        if (functionName === 'isCollectionCurated') {
          const col = Array.from(indexerStore.collections.values()).find(
            (c) => c.address.toLowerCase() === addr && c.is_enabled
          );
          return Promise.resolve(Boolean(col));
        }
        if (functionName === 'name') {
          const col = Array.from(indexerStore.collections.values()).find(
            (c) => c.address.toLowerCase() === addr
          );
          return Promise.resolve(col?.name || `Mock Collection ${addr.slice(0, 6)}`);
        }
        if (functionName === 'symbol') {
          const col = Array.from(indexerStore.collections.values()).find(
            (c) => c.address.toLowerCase() === addr
          );
          return Promise.resolve(col?.symbol || 'MOCK');
        }
        return Promise.resolve(null);
      }),
      getBytecode: vi.fn().mockImplementation(({ address }) => {
        const addr = String(address || '').toLowerCase();
        if (addr === ZERO_ADDRESS || addr === DEAD_ADDRESS) {
          return Promise.resolve(null);
        }
        return Promise.resolve('0x1234');
      }),
    })),
  };
});
