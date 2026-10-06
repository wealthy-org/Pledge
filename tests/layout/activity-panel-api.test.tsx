import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ActivityPanel } from '@/components/layout/ActivityPanel';

describe('TICKET-62 & TICKET-110: Real-time ActivityPanel API Integration Test Suite', () => {
  const mockActivities = [
    {
      id: 'act-1',
      type: 'LoanStarted',
      collection: '0x1111111111111111111111111111111111111111',
      collectionName: 'Robinhood Genesis Pass',
      tokenId: '42',
      amountEth: '0.8',
      principalWei: '800000000000000000',
      userAddress: '0x3a123456789f12',
      txHash: '0xabc123',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'act-2',
      type: 'LoanRepaid',
      collection: '0x2222222222222222222222222222222222222222',
      collectionName: 'Sherwood Forest Rangers',
      tokenId: '16',
      amountEth: '0.65',
      principalWei: '650000000000000000',
      userAddress: '0x7c123456789b0',
      txHash: '0xdef456',
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: mockActivities,
        cursor: null,
      }),
    });
  });

  it('fetches activities from /api/activity on mount and renders them', async () => {
    await act(async () => {
      render(<ActivityPanel />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/activity'));
      expect(screen.getByText(/Robinhood Genesis Pass/i)).toBeDefined();
      expect(screen.getByText(/Sherwood Forest Rangers/i)).toBeDefined();
    });
  });

  it('filters items when changing feed type filter to loan or repaid', async () => {
    await act(async () => {
      render(<ActivityPanel />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Robinhood Genesis Pass/i)).toBeDefined();
    });

    const repaidFilterBtn = screen.getByRole('button', { name: /^repaid$/i });
    await act(async () => {
      fireEvent.click(repaidFilterBtn);
    });

    expect(screen.getByText(/Sherwood Forest Rangers/i)).toBeDefined();
  });

  it('switches to watchlist tab and displays watchlist view', async () => {
    await act(async () => {
      render(<ActivityPanel />);
    });

    const watchlistBtn = screen.getByRole('button', { name: /watchlist/i });
    await act(async () => {
      fireEvent.click(watchlistBtn);
    });

    expect(screen.getByText(/watchlist is empty/i)).toBeDefined();
    expect(screen.getByText(/explore collections/i)).toBeDefined();
  });

  it('renders mobile slide-over drawer overlay when isMobileOpen is true and closes via backdrop or ESC', async () => {
    const handleClose = vi.fn();
    let rerenderFn: any;
    await act(async () => {
      const renderResult = render(<ActivityPanel isMobileOpen={true} onMobileClose={handleClose} />);
      rerenderFn = renderResult.rerender;
    });

    expect(screen.getByTestId('activity-mobile-drawer')).toBeDefined();
    expect(screen.getByTestId('activity-backdrop')).toBeDefined();

    const backdrop = screen.getByTestId('activity-backdrop');
    await act(async () => {
      fireEvent.click(backdrop);
    });
    expect(handleClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
    expect(handleClose).toHaveBeenCalledTimes(2);

    await act(async () => {
      rerenderFn(<ActivityPanel isMobileOpen={false} onMobileClose={handleClose} />);
    });
    expect(screen.queryByTestId('activity-mobile-drawer')).toBeNull();
  });
});
