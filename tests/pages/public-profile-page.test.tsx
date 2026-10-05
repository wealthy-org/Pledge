import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProfileDetailClient } from '@/app/profile/[address]/ProfileDetailClient';

const validAddress = '0x1111111111111111111111111111111111111111';

vi.mock('@/components/portfolio/LendingTab', () => ({
  LendingTab: () => <div data-testid="lending-tab">Lending Tab Content</div>,
}));

vi.mock('@/components/portfolio/BorrowingTab', () => ({
  BorrowingTab: () => <div data-testid="borrowing-tab">Borrowing Tab Content</div>,
}));

vi.mock('@/components/portfolio/OffersTab', () => ({
  OffersTab: () => <div data-testid="offers-tab">Offers Tab Content</div>,
}));

vi.mock('@/components/portfolio/HistoryTab', () => ({
  HistoryTab: () => <div data-testid="history-tab">History Tab Content</div>,
}));

describe('ProfileDetailClient Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders invalid address warning when non-EVM address is passed', () => {
    render(<ProfileDetailClient address="not-an-address" />);
    expect(screen.getByText(/Invalid Wallet Address/i)).toBeDefined();
    expect(screen.getByText(/Return to Markets/i)).toBeDefined();
  });

  it('renders profile metrics and switches tabs on click', async () => {
    const mockPortfolio = {
      address: validAddress,
      borrowedLoans: [{ loanId: 1, status: 'active' }],
      lentLoans: [{ loanId: 2, status: 'active' }, { loanId: 3, status: 'active' }],
      activeOffers: [],
      totalBorrowedWei: '1000000000000000000',
      totalLentWei: '2500000000000000000',
      claimableProceedsWei: '0',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPortfolio,
    });

    render(<ProfileDetailClient address={validAddress} />);

    await waitFor(() => {
      expect(screen.getByText('1.000 ETH')).toBeDefined();
    });

    expect(screen.getByText('2.500 ETH')).toBeDefined();
    expect(screen.getByText('Lending (2)')).toBeDefined();
    expect(screen.getByText('Borrowing (1)')).toBeDefined();

    const borrowingTabButton = screen.getByRole('button', { name: /^Borrowing \(1\)$/i });
    fireEvent.click(borrowingTabButton);

    expect(screen.getByTestId('borrowing-tab')).toBeDefined();
  });
});
