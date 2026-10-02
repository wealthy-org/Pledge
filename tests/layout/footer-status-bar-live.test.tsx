import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FooterStatusBar } from '@/components/layout/FooterStatusBar';

vi.mock('wagmi', () => ({
  useBlockNumber: () => ({
    data: 1234567n,
    isLoading: false,
  }),
  useChainId: () => 46630,
}));

describe('TICKET-64: FooterStatusBar Live Telemetry Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ethPriceUsd: 2680.5,
        gasPriceGwei: 12,
        timestamp: new Date().toISOString(),
      }),
    });
  });

  it('renders dynamic ETH spot price and Gas price from telemetry endpoint', async () => {
    render(<FooterStatusBar />);

    await waitFor(() => {
      expect(screen.getByText(/\$2,680\.50|\$2,680/i)).toBeDefined();
      expect(screen.getByText(/12 Gwei/i)).toBeDefined();
    });
  });

  it('renders Blockscout explorer and About link correctly', () => {
    render(<FooterStatusBar />);
    expect(screen.getByLabelText(/Blockscout Explorer/i)).toBeDefined();
    expect(screen.getByText(/About Pledge/i)).toBeDefined();
  });
});
