import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { FooterStatusBar } from '@/components/layout/FooterStatusBar';
import { MAINNET_CHAIN_ID } from '@/config/chains';

const mockUseAccount = vi.fn();
const mockUseDisconnect = vi.fn();
const mockUseChainId = vi.fn();
const mockUseBalance = vi.fn();
const mockUseBlockNumber = vi.fn();
const mockUseSwitchChain = vi.fn();
const mockUseConnect = vi.fn();
const mockUseConnectors = vi.fn();

vi.mock('wagmi', () => ({
  useConnection: () => mockUseAccount(),
  useAccount: () => mockUseAccount(),
  useDisconnect: () => mockUseDisconnect(),
  useChainId: () => mockUseChainId(),
  useBalance: (args?: unknown) => mockUseBalance(args),
  useBlockNumber: (args?: unknown) => mockUseBlockNumber(args),
  useSwitchChain: () => mockUseSwitchChain(),
  useConnect: () => mockUseConnect(),
  useConnectors: () => mockUseConnectors(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('TICKET-34: Layout Mainnet Chain Switch Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDisconnect.mockReturnValue({ disconnect: vi.fn() });
    mockUseSwitchChain.mockReturnValue({ switchChain: vi.fn(), isPending: false, error: null });
    mockUseConnect.mockReturnValue({ connect: vi.fn(), isPending: false, error: null });
    mockUseConnectors.mockReturnValue([]);
    mockUseBalance.mockReturnValue({
      data: { decimals: 18, symbol: 'ETH', value: 5250000000000000000n },
      isLoading: false,
    });
    mockUseBlockNumber.mockReturnValue({
      data: 5000123n,
      isLoading: false,
    });
  });

  it('TS-01: HeaderBar renders Robinhood Mainnet network badge when on chain 4663', () => {
    mockUseAccount.mockReturnValue({
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      isConnected: true,
      isConnecting: false,
    });
    mockUseChainId.mockReturnValue(MAINNET_CHAIN_ID);

    render(<HeaderBar />);

    expect(screen.getByText(new RegExp(`Robinhood.*${MAINNET_CHAIN_ID}`, 'i'))).toBeDefined();
    expect(screen.queryByText(/Wrong Network/i)).toBeNull();
  });

  it('TS-02: FooterStatusBar provides explorer link pointing to Mainnet Blockscout when on chain 4663', () => {
    mockUseAccount.mockReturnValue({
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      isConnected: true,
      isConnecting: false,
    });
    mockUseChainId.mockReturnValue(MAINNET_CHAIN_ID);

    render(<FooterStatusBar />);

    const explorerLink = screen.getByRole('link', { name: /blockscout explorer/i });
    expect(explorerLink).toBeDefined();
    expect(explorerLink.getAttribute('href')).toContain('explorer.robinhood.com');
  });
});
