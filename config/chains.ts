import { defineChain, type Chain } from 'viem';

export const TESTNET_CHAIN_ID = 46630;
export const MAINNET_CHAIN_ID = 4663;

export const robinhoodTestnet = defineChain({
  id: TESTNET_CHAIN_ID,
  name: 'Robinhood Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://explorer.testnet.robinhood.com',
    },
  },
  testnet: true,
});

export const robinhoodMainnet = defineChain({
  id: MAINNET_CHAIN_ID,
  name: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.mainnet.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://explorer.robinhood.com',
    },
  },
  testnet: false,
});

export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  robinhoodTestnet,
  robinhoodMainnet,
];

export function getActiveChain(chainId?: number): Chain {
  const targetId = chainId || Number(process.env.NEXT_PUBLIC_CHAIN_ID) || TESTNET_CHAIN_ID;
  if (targetId === MAINNET_CHAIN_ID) {
    return robinhoodMainnet;
  }
  return robinhoodTestnet;
}

export function getExplorerTxUrl(txHash: string, chainId?: number): string {
  const chain = getActiveChain(chainId);
  const baseUrl = chain.blockExplorers?.default.url || 'https://explorer.testnet.robinhood.com';
  return `${baseUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, chainId?: number): string {
  const chain = getActiveChain(chainId);
  const baseUrl = chain.blockExplorers?.default.url || 'https://explorer.testnet.robinhood.com';
  return `${baseUrl}/address/${address}`;
}
