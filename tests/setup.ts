import { vi } from 'vitest';

process.env.NEXT_PUBLIC_CHAIN_ID = '46630';
process.env.NEXT_PUBLIC_RPC_URL = 'https://rpc.testnet.chain.robinhood.com';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT = '0x481F5591D7B26661B651Ab2efB66c10c46958E33';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET = '0x4444444444444444444444444444444444444444';
process.env.MAINNET_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
process.env.MAINNET_PLEDGE_CONTRACT = '0x4444444444444444444444444444444444444444';
process.env.MAINNET_START_BLOCK = '1';
process.env.TESTNET_START_BLOCK = '1';
process.env.GONDI_API_URL = 'https://api2.gondi.xyz/graphql';
process.env.GONDI_CDN_URL = 'https://cdn.gondi.xyz';
process.env.NEXT_PUBLIC_DB_SCHEMA = 'pledge';
process.env.NEXT_PUBLIC_RHG_COLLECTION = '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496';
process.env.NEXT_PUBLIC_SFR_COLLECTION = '0x34A1D3fff3958843C43aD80F30b94c510645C316';
process.env.NEXT_PUBLIC_NGP_COLLECTION = '0x90193C961A926261B756D1E5bb255e67ff9498A1';
process.env.NEXT_PUBLIC_RHG_COLLECTION_MAINNET = '0x4444444444444444444444444444444444444444';
process.env.NEXT_PUBLIC_SFR_COLLECTION_MAINNET = '0x5555555555555555555555555555555555555555';
process.env.NEXT_PUBLIC_NGP_COLLECTION_MAINNET = '0x6666666666666666666666666666666666666666';

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

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>().catch(() => ({}));
  return {
    ...actual,
    createPublicClient: vi.fn().mockImplementation(() => ({
      getBlockNumber: vi.fn().mockResolvedValue(127812000n),
      getLogs: vi.fn().mockResolvedValue([]),
      getBlock: vi.fn().mockResolvedValue({ hash: '0xmockhash' }),
      readContract: vi.fn().mockResolvedValue(null),
      getBytecode: vi.fn().mockResolvedValue(null),
    })),
  };
});
