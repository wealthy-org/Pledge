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
  return {
    chainId: MAINNET_CHAIN_ID,
    chainName: 'Robinhood Chain Mainnet',
    rpcUrl: process.env.MAINNET_RPC_URL || 'https://rpc.mainnet.robinhood.com',
    contractAddress:
      process.env.MAINNET_PLEDGE_CONTRACT ||
      '0x4444444444444444444444444444444444444444',
    startBlock: Number(process.env.MAINNET_START_BLOCK || '1'),
    explorerUrl: 'https://explorer.robinhood.com',
  };
}

export function getTestnetIndexerConfig(): IndexerChainConfig {
  return {
    chainId: TESTNET_CHAIN_ID,
    chainName: 'Robinhood Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.robinhood.com',
    contractAddress:
      process.env.NEXT_PUBLIC_PLEDGE_CONTRACT ||
      '0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496',
    startBlock: Number(process.env.TESTNET_START_BLOCK || '1'),
    explorerUrl: 'https://explorer.testnet.robinhood.com',
  };
}

export function getIndexerConfig(chainId?: number): IndexerChainConfig {
  const targetId = chainId || Number(process.env.NEXT_PUBLIC_CHAIN_ID) || TESTNET_CHAIN_ID;
  if (targetId === MAINNET_CHAIN_ID) {
    return getMainnetIndexerConfig();
  }
  return getTestnetIndexerConfig();
}
