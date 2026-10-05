import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AllLoansTable } from '@/components/lend/AllLoansTable';

const mockLoans = [
  {
    loanId: 1,
    offerId: 10,
    chainId: 46630,
    lender: '0x1111111111111111111111111111111111111111',
    borrower: '0x2222222222222222222222222222222222222222',
    collection: '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9',
    tokenId: '42',
    principalWei: '1000000000000000000',
    interestWei: '50000000000000000',
    feeBpsSnapshot: 200,
    startedAt: '1700000000',
    dueAt: '1700604800',
    status: 'active',
    blockNumber: '100',
    txHash: '0xabc',
  },
  {
    loanId: 2,
    offerId: 11,
    chainId: 46630,
    lender: '0x1111111111111111111111111111111111111111',
    borrower: '0x3333333333333333333333333333333333333333',
    collection: '0x146BefC6C8656Df737255d08fa1281319Fc1A4c3',
    tokenId: '99',
    principalWei: '2500000000000000000',
    interestWei: '125000000000000000',
    feeBpsSnapshot: 200,
    startedAt: '1690000000',
    dueAt: '1690604800',
    status: 'repaid',
    blockNumber: '90',
    txHash: '0xdef',
  },
];

vi.mock('@/hooks/api/useLoans', () => ({
  useLoans: ({ status }: { status?: string }) => {
    let filtered = mockLoans;
    if (status) {
      filtered = mockLoans.filter((l) => l.status === status);
    }
    return {
      data: { loans: filtered },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

vi.mock('@/components/nft/NftImage', () => ({
  NftImage: ({ tokenId }: { tokenId: string }) => <div data-testid="nft-image">Image #{tokenId}</div>,
}));

vi.mock('@/components/common/CountdownTimer', () => ({
  CountdownTimer: () => <span>Countdown 5d 12h</span>,
}));

describe('AllLoansTable Component', () => {
  it('renders table headers and loan items', () => {
    render(<AllLoansTable />);
    expect(screen.getByText('Loan')).toBeDefined();
    expect(screen.getByText('Collateral NFT')).toBeDefined();
    expect(screen.getByText('Principal')).toBeDefined();
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('Token #42')).toBeDefined();
    expect(screen.getByText('1.000 ETH')).toBeDefined();
    expect(screen.getByText('+0.0500 ETH')).toBeDefined();
  });

  it('filters loans when status chips are clicked', () => {
    render(<AllLoansTable />);
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('#2')).toBeDefined();

    const activeFilterButton = screen.getByRole('button', { name: /^Active$/i });
    fireEvent.click(activeFilterButton);

    expect(screen.getByText('#1')).toBeDefined();
  });
});
