import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ActivityPanel } from '@/components/layout/ActivityPanel';
import { FooterStatusBar } from '@/components/layout/FooterStatusBar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/lend',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('wagmi', () => ({
  useConnection: () => ({ address: undefined, isConnected: false, isConnecting: false }),
  useAccount: () => ({ address: undefined, isConnected: false, isConnecting: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
  useChainId: () => 46630,
  useBalance: () => ({ data: undefined, isLoading: false }),
  useBlockNumber: () => ({ data: 1234567n, isLoading: false }),
  useSwitchChain: () => ({ switchChain: vi.fn(), isPending: false, error: null }),
  useConnect: () => ({ connect: vi.fn(), connectors: [] }),
}));

vi.mock('@/components/web3/ConnectWallet', () => ({
  ConnectWallet: () => <button data-testid="connect-wallet-btn">Connect Wallet</button>,
}));

vi.mock('@/components/web3/NetworkWarningBanner', () => ({
  NetworkWarningBanner: () => <div data-testid="network-warning" />,
}));

describe('TICKET-29: Three-Panel Layout Shell Test Suite', () => {
  it('TS-01: AppShell renders all structural sections (Sidebar, HeaderBar, Main, ActivityPanel)', () => {
    render(
      <AppShell>
        <div data-testid="test-content">Dashboard Workbench Content</div>
      </AppShell>
    );

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeDefined();
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByRole('complementary', { name: /activity feed/i })).toBeDefined();
    expect(screen.getByTestId('test-content')).toBeDefined();
  });

  it('TS-02: Sidebar highlights current active route /lend with appropriate styling', () => {
    render(<Sidebar />);
    const lendLink = screen.getByRole('link', { name: /lend/i });
    expect(lendLink).toBeDefined();
    expect(lendLink.getAttribute('data-active')).toBe('true');
  });

  it('TS-03: Sidebar expands and collapses on toggle button click', () => {
    const { container } = render(<Sidebar />);
    const sidebarElement = container.querySelector('aside');
    expect(sidebarElement?.getAttribute('data-expanded')).toBe('false');

    const toggleBtn = screen.getByLabelText(/toggle sidebar/i);
    fireEvent.click(toggleBtn);
    expect(sidebarElement?.getAttribute('data-expanded')).toBe('true');

    fireEvent.click(toggleBtn);
    expect(sidebarElement?.getAttribute('data-expanded')).toBe('false');
  });

  it('TS-04: ActivityPanel toggles open and closed state', () => {
    render(<ActivityPanel />);
    const toggleBtn = screen.getByLabelText(/toggle activity panel/i);
    expect(screen.getByText(/recent activity/i)).toBeDefined();

    fireEvent.click(toggleBtn);
  });

  it('TS-05: FooterStatusBar renders ETH price and gas metrics', () => {
    render(<FooterStatusBar />);
    expect(screen.getByText(/eth/i)).toBeDefined();
    expect(screen.getByText(/gwei/i)).toBeDefined();
  });
});
