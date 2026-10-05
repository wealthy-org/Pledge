import { vi } from 'vitest';

process.env.NEXT_PUBLIC_CHAIN_ID = '46630';
process.env.NEXT_PUBLIC_RPC_URL = 'https://rpc.testnet.chain.robinhood.com';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT = '0x481F5591D7B26661B651Ab2efB66c10c46958E33';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET = '0x4444444444444444444444444444444444444444';
process.env.MAINNET_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
process.env.MAINNET_PLEDGE_CONTRACT = '0x4444444444444444444444444444444444444444';
process.env.MAINNET_START_BLOCK = '1';
process.env.TESTNET_START_BLOCK = '1';
process.env.NEXT_PUBLIC_BLOCKSCOUT_API_URL = 'https://explorer.testnet.chain.robinhood.com/api/v2';
process.env.NEXT_PUBLIC_DB_SCHEMA = 'pledge';
process.env.NEXT_PUBLIC_RHG_COLLECTION = '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9';
process.env.NEXT_PUBLIC_SFR_COLLECTION = '0x146BefC6C8656Df737255d08fa1281319Fc1A4c3';
process.env.NEXT_PUBLIC_NGP_COLLECTION = '0x75599F7385dCdbE2aB3b3b0B8d4A3E2C8f02494D';
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

