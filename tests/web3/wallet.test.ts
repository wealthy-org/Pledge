import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  truncateAddress,
  checkWalletAvailability,
  getPhantomProvider,
} from '@/lib/web3/wallet';

describe('TICKET-04b: Wallet Utilities & Provider Detection Test Suite', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    delete (global.window as { phantom?: unknown }).phantom;
    delete (global.window as { ethereum?: unknown }).ethereum;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('TS-04: truncateAddress formats address correctly', () => {
    expect(truncateAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')).toBe('0x7099...79C8');
    expect(truncateAddress('')).toBe('');
    expect(truncateAddress('short')).toBe('short');
  });

  it('TS-05: checkWalletAvailability detects phantom and metamask', () => {
    const none = checkWalletAvailability();
    expect(none.phantom).toBe(false);
    expect(none.metamask).toBe(false);

    (global.window as { phantom?: unknown }).phantom = { ethereum: { isPhantom: true } };
    const withPhantom = checkWalletAvailability();
    expect(withPhantom.phantom).toBe(true);

    (global.window as { ethereum?: unknown }).ethereum = { isMetaMask: true };
    const withBoth = checkWalletAvailability();
    expect(withBoth.metamask).toBe(true);
  });

  it('TS-06: getPhantomProvider returns the phantom EVM provider instance', () => {
    expect(getPhantomProvider()).toBeNull();

    const mockEvm = { request: vi.fn(), isPhantom: true };
    (global.window as { phantom?: unknown }).phantom = { ethereum: mockEvm };
    expect(getPhantomProvider()).toBe(mockEvm);
  });
});

