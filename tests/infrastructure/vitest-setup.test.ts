import { describe, it, expect } from 'vitest';
import { truncateAddress } from '@/lib/web3/wallet';
import { TESTNET_CHAIN_ID } from '@/config/chains';

describe('TICKET-06: Testing Infrastructure & Runner Test Suite', () => {
  it('TS-01: Module path aliases resolution works correctly', () => {
    expect(TESTNET_CHAIN_ID).toBe(46630);
    expect(truncateAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')).toBe('0x7099...79C8');
  });

  it('TS-02: DOM environment is active and window.matchMedia mock functions', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(window.matchMedia('(min-width: 768px)').matches).toBe(false);
  });

  it('TS-03: Asynchronous promise resolution functions as expected', async () => {
    const delayedValue = await new Promise<string>((resolve) => {
      setTimeout(() => resolve('ready'), 10);
    });
    expect(delayedValue).toBe('ready');
  });
});
