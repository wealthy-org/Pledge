import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from './chains';

export interface IndexerChainConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  contractAddress: string;
  startBlock: number;
  explorerUrl: string;
}

export function getMainnetIndexerConfig(): IndexerChainConfig {
  const rpcUrl = process.env.MAINNET_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL_MAINNET;
  if (!rpcUrl) {
    throw new Error('MAINNET_RPC_URL is not configured. Environment variable must be set.');
  }
  const contractAddress = process.env.MAINNET_PLEDGE_CONTRACT || process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET;
  if (!contractAddress) {
    throw new Error('MAINNET_PLEDGE_CONTRACT is not configured. Environment variable must be set.');
  }
  const startBlockStr = process.env.MAINNET_START_BLOCK || '1';
  return {
    chainId: MAINNET_CHAIN_ID,
    chainName: 'Robinhood Chain Mainnet',
    rpcUrl,
    contractAddress,
    startBlock: Number(startBlockStr),
    explorerUrl: 'https://explorer.mainnet.chain.robinhood.com',
  };
}

export function getTestnetIndexerConfig(): IndexerChainConfig {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_RPC_URL is not configured. Environment variable must be set.');
  }
  const contractAddress = process.env.NEXT_PUBLIC_PLEDGE_CONTRACT;
  if (!contractAddress) {
    throw new Error('NEXT_PUBLIC_PLEDGE_CONTRACT is not configured. Environment variable must be set.');
  }
  const startBlockStr = process.env.TESTNET_START_BLOCK || '1';
  return {
    chainId: TESTNET_CHAIN_ID,
    chainName: 'Robinhood Testnet',
    rpcUrl,
    contractAddress,
    startBlock: Number(startBlockStr),
    explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
  };
}

export function getIndexerConfig(chainId?: number): IndexerChainConfig {
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
    return getMainnetIndexerConfig();
  }
  if (targetId === TESTNET_CHAIN_ID) {
    return getTestnetIndexerConfig();
  }
  throw new Error(`Unsupported chain ID for indexer: ${targetId}`);
}
