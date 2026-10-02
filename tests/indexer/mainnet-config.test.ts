import { describe, it, expect } from 'vitest';
import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';
import {
  getMainnetIndexerConfig,
  getTestnetIndexerConfig,
  getIndexerConfig,
} from '@/config/indexer.mainnet';

describe('TICKET-27b: Mainnet Indexer Configuration & Environment Isolation Test Suite', () => {
  it('TS-01: Mainnet indexer config reflects correct chain parameters and deployment start block', () => {
    const config = getMainnetIndexerConfig();
    expect(config.chainId).toBe(MAINNET_CHAIN_ID);
    expect(config.chainId).toBe(4663);
    expect(config.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(config.startBlock).toBeGreaterThanOrEqual(1);
    expect(config.rpcUrl).toContain('mainnet');
    expect(config.explorerUrl).toBe('https://explorer.robinhood.com');
  });

  it('TS-02: Testnet indexer config reflects testnet chain parameters', () => {
    const config = getTestnetIndexerConfig();
    expect(config.chainId).toBe(TESTNET_CHAIN_ID);
    expect(config.chainId).toBe(46630);
    expect(config.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(config.explorerUrl).toBe('https://explorer.testnet.robinhood.com');
  });

  it('TS-03: getIndexerConfig switches between testnet and mainnet without data bleeding', () => {
    const testnet = getIndexerConfig(TESTNET_CHAIN_ID);
    const mainnet = getIndexerConfig(MAINNET_CHAIN_ID);

    expect(testnet.chainId).not.toBe(mainnet.chainId);
    expect(testnet.contractAddress).not.toBe(mainnet.contractAddress);
    expect(testnet.explorerUrl).not.toBe(mainnet.explorerUrl);
  });
});
