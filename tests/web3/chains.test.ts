import { describe, it, expect } from 'vitest';
import {
  TESTNET_CHAIN_ID,
  MAINNET_CHAIN_ID,
  robinhoodTestnet,
  robinhoodMainnet,
  getExplorerTxUrl,
  getExplorerAddressUrl,
  getActiveChain,
} from '@/config/chains';

describe('TICKET-04b: Chain Configuration & Explorer Helpers Test Suite', () => {
  it('TS-01: Chain parameters integrity for Robinhood Testnet and Mainnet', () => {
    expect(robinhoodTestnet.id).toBe(TESTNET_CHAIN_ID);
    expect(robinhoodTestnet.name).toBe('Robinhood Testnet');
    expect(robinhoodTestnet.nativeCurrency.symbol).toBe('ETH');
    expect(robinhoodTestnet.nativeCurrency.decimals).toBe(18);
    expect(robinhoodTestnet.blockExplorers?.default.url).toBe('https://explorer.testnet.chain.robinhood.com');

    expect(robinhoodMainnet.id).toBe(MAINNET_CHAIN_ID);
    expect(robinhoodMainnet.name).toBe('Robinhood Chain');
    expect(robinhoodMainnet.nativeCurrency.symbol).toBe('ETH');
    expect(robinhoodMainnet.nativeCurrency.decimals).toBe(18);
    expect(robinhoodMainnet.blockExplorers?.default.url).toBe('https://explorer.mainnet.chain.robinhood.com');
  });

  it('TS-02: Explorer URL resolution for transactions and addresses', () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    const testnetTx = getExplorerTxUrl(txHash, TESTNET_CHAIN_ID);
    expect(testnetTx).toBe(`https://explorer.testnet.chain.robinhood.com/tx/${txHash}`);

    const mainnetTx = getExplorerTxUrl(txHash, MAINNET_CHAIN_ID);
    expect(mainnetTx).toBe(`https://explorer.mainnet.chain.robinhood.com/tx/${txHash}`);

    const testnetAddr = getExplorerAddressUrl(address, TESTNET_CHAIN_ID);
    expect(testnetAddr).toBe(`https://explorer.testnet.chain.robinhood.com/address/${address}`);

    const mainnetAddr = getExplorerAddressUrl(address, MAINNET_CHAIN_ID);
    expect(mainnetAddr).toBe(`https://explorer.mainnet.chain.robinhood.com/address/${address}`);
  });

  it('TS-03: getActiveChain returns appropriate chain definition and throws on unsupported chain ID', () => {
    expect(getActiveChain(TESTNET_CHAIN_ID).id).toBe(TESTNET_CHAIN_ID);
    expect(getActiveChain(MAINNET_CHAIN_ID).id).toBe(MAINNET_CHAIN_ID);
    expect(() => getActiveChain(1)).toThrow(/Unsupported chain ID/i);
  });
});
