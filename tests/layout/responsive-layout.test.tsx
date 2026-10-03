import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';
import { FooterStatusBar } from '@/components/layout/FooterStatusBar';
import { Drawer } from '@/components/ui/Drawer';

vi.mock('next/navigation', () => ({
  usePathname: () => '/lend',
  useRouter: () => ({ push: vi.fn() }),
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

describe('Responsive Layout & Clipping Prevention Test Suite', () => {
  it('renders AppShell with app-main-content class on main element', () => {
    render(
      <AppShell>
        <div data-testid="lend-page-content">Lend Page</div>
      </AppShell>
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeDefined();
    expect(mainElement.classList.contains('app-main-content')).toBe(true);
  });

  it('renders FooterStatusBar with hidden md:flex responsive classes', () => {
    render(<FooterStatusBar />);
    const footer = screen.getByTestId('footer-status-bar');
    expect(footer.classList.contains('hidden')).toBe(true);
    expect(footer.classList.contains('md:flex')).toBe(true);
  });

  it('renders Drawer with full-width constraints on mobile viewports', () => {
    render(
      <Drawer isOpen={true} title="Create Offer" onClose={vi.fn()}>
        <div>Drawer Body</div>
      </Drawer>
    );

    const dialog = screen.getByRole('dialog', { name: /create offer/i });
    expect(dialog).toBeDefined();
    expect(dialog.style.maxWidth).toBe('100vw');
  });
});
