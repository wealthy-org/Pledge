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
      http: ['https://rpc.testnet.robinhood.com'],
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
      http: ['https://rpc.mainnet.robinhood.com'],
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
  let targetId: number | undefined = chainId;
  if (targetId === undefined) {
    const envVal = process.env.NEXT_PUBLIC_CHAIN_ID;
    if (!envVal) {
      throw new Error('Chain ID is not configured. NEXT_PUBLIC_CHAIN_ID must be set.');
    }
    targetId = Number(envVal);
  }
  if (isNaN(targetId)) {
    throw new Error('Invalid chain ID configuration.');
  }
  if (targetId === MAINNET_CHAIN_ID) {
    return robinhoodMainnet;
  }
  if (targetId === TESTNET_CHAIN_ID) {
    return robinhoodTestnet;
  }
  throw new Error(`Unsupported chain ID: ${targetId}. Supported chains are ${TESTNET_CHAIN_ID} and ${MAINNET_CHAIN_ID}.`);
}

export function getExplorerTxUrl(txHash: string, chainId?: number): string {
  const chain = getActiveChain(chainId);
  const baseUrl = chain.blockExplorers?.default.url;
  if (!baseUrl) {
    throw new Error(`No block explorer configured for chain ID ${chain.id}`);
  }
  return `${baseUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, chainId?: number): string {
  const chain = getActiveChain(chainId);
  const baseUrl = chain.blockExplorers?.default.url;
  if (!baseUrl) {
    throw new Error(`No block explorer configured for chain ID ${chain.id}`);
  }
  return `${baseUrl}/address/${address}`;
}
