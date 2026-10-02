import { vi } from 'vitest';

process.env.NEXT_PUBLIC_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || '46630';
process.env.NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.robinhood.com';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT = process.env.NEXT_PUBLIC_PLEDGE_CONTRACT || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET = process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET || '0x4444444444444444444444444444444444444444';
process.env.MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || 'https://rpc.mainnet.robinhood.com';
process.env.MAINNET_PLEDGE_CONTRACT = process.env.MAINNET_PLEDGE_CONTRACT || '0x4444444444444444444444444444444444444444';
process.env.MAINNET_START_BLOCK = process.env.MAINNET_START_BLOCK || '1';
process.env.TESTNET_START_BLOCK = process.env.TESTNET_START_BLOCK || '1';
process.env.NEXT_PUBLIC_BLOCKSCOUT_API_URL = process.env.NEXT_PUBLIC_BLOCKSCOUT_API_URL || 'https://explorer.testnet.robinhood.com/api/v2';
process.env.NEXT_PUBLIC_DB_SCHEMA = process.env.NEXT_PUBLIC_DB_SCHEMA || 'pledge';

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
  };
});
