import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { FooterStatusBar } from '@/components/layout/FooterStatusBar';

const mockUseAccount = vi.fn();
const mockUseDisconnect = vi.fn();
const mockUseChainId = vi.fn();
const mockUseBalance = vi.fn();
const mockUseBlockNumber = vi.fn();
const mockUseSwitchChain = vi.fn();
const mockUseConnect = vi.fn();
const mockUseConnectors = vi.fn();

vi.mock('wagmi', () => ({
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

describe('TICKET-33: Layout Web3 State Integration Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDisconnect.mockReturnValue({ disconnect: vi.fn() });
    mockUseSwitchChain.mockReturnValue({ switchChain: vi.fn(), isPending: false, error: null });
    mockUseConnect.mockReturnValue({ connect: vi.fn(), isPending: false, error: null });
    mockUseConnectors.mockReturnValue([]);
    mockUseBalance.mockReturnValue({
      data: { decimals: 18, symbol: 'ETH', value: 1452000000000000000n },
      isLoading: false,
    });
    mockUseBlockNumber.mockReturnValue({
      data: 1234567n,
      isLoading: false,
    });
  });

  it('TS-01: Disconnected state renders standard connect CTA in HeaderBar', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
    });
    mockUseChainId.mockReturnValue(46630);

    render(<HeaderBar />);

    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeDefined();
  });

  it('TS-02: Connected wallet renders truncated address and balance in HeaderBar', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      isConnecting: false,
    });
    mockUseChainId.mockReturnValue(46630);

    render(<HeaderBar />);

    expect(screen.getByText('0x1234...5678')).toBeDefined();
    expect(screen.getByText(/1.452 ETH/i)).toBeDefined();
  });

  it('TS-03: Sidebar renders connected wallet avatar indicator when wallet is connected', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      isConnecting: false,
    });
    mockUseChainId.mockReturnValue(46630);

    render(<Sidebar />);

    expect(screen.getByTestId('sidebar-wallet-avatar')).toBeDefined();
  });

  it('TS-04: FooterStatusBar renders live block number and synced status', () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
      isConnecting: false,
    });
    mockUseChainId.mockReturnValue(46630);
    mockUseBlockNumber.mockReturnValue({
      data: 9876543n,
      isLoading: false,
    });

    render(<FooterStatusBar />);

    expect(screen.getByText(/9876543/)).toBeDefined();
    expect(screen.getByText(/synced/i)).toBeDefined();
  });
});
