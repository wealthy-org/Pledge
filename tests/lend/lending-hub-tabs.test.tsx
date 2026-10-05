import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LendPage from '@/app/lend/page';

vi.mock('@/hooks/useUnifiedCollectionSearch', () => ({
  useUnifiedCollectionSearch: () => ({
    collections: [
      {
        address: '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9',
        name: 'Robinhood Genesis',
        symbol: 'RHG',
        poolSizeWei: '5000000000000000000',
        activeLoansCount: 2,
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/api/useOffers', () => ({
  useOffers: () => ({
    data: {
      offers: [
        {
          offerId: 101,
          collection: '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9',
          principalWei: '1000000000000000000',
          termInterestBps: 500,
          durationSeconds: '604800',
          expiresAt: '1800000000',
          lender: '0x1111111111111111111111111111111111111111',
          status: 'open',
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/api/useLoans', () => ({
  useLoans: () => ({
    data: {
      loans: [
        {
          loanId: 1,
          offerId: 101,
          chainId: 46630,
          lender: '0x1111111111111111111111111111111111111111',
          borrower: '0x2222222222222222222222222222222222222222',
          collection: '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9',
          tokenId: '7',
          principalWei: '1000000000000000000',
          interestWei: '50000000000000000',
          dueAt: '1800000000',
          status: 'active',
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/contexts/ConnectModalContext', () => ({
  useConnectModal: () => ({ openConnectModal: vi.fn() }),
}));

vi.mock('@/hooks/transactions/useCreateOffer', () => ({
  useCreateOffer: () => ({
    state: { stage: 'IDLE' },
    createOffer: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/transactions/useCancelOffer', () => ({
  useCancelOffer: () => ({
    state: { stage: 'IDLE' },
    cancelOffer: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('LendPage Lending Hub Tabs', () => {
  it('renders default Market Collections tab', () => {
    render(<LendPage />);
    expect(screen.getByText('Market Collections')).toBeDefined();
    expect(screen.getByText('All Open Offers')).toBeDefined();
    expect(screen.getByText('Protocol Loans')).toBeDefined();
    expect(screen.getByText('Robinhood Genesis')).toBeDefined();
  });

  it('switches to All Open Offers tab when clicked', () => {
    render(<LendPage />);
    const offersTab = screen.getByRole('button', { name: /^All Open Offers$/i });
    fireEvent.click(offersTab);

    expect(screen.getByText('#101')).toBeDefined();
    expect(screen.getByText('5.00% for 7d')).toBeDefined();
  });

  it('switches to Protocol Loans tab when clicked', () => {
    render(<LendPage />);
    const loansTab = screen.getByRole('button', { name: /^Protocol Loans$/i });
    fireEvent.click(loansTab);

    expect(screen.getByText('Collateral NFT')).toBeDefined();
    expect(screen.getByText('Token #7')).toBeDefined();
  });
});
