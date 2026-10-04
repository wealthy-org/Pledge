import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/some-random-404-route',
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

describe('AppShell on 404 Route', () => {
  it('hides sidebar, headerbar, and activity panel on unknown routes', () => {
    render(
      <AppShell>
        <div data-testid="404-content">404 Content</div>
      </AppShell>
    );

    expect(screen.queryByRole('navigation', { name: /main navigation/i })).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByLabelText(/activity panel/i)).toBeNull();
    expect(screen.getByTestId('404-content')).toBeDefined();
  });
});
