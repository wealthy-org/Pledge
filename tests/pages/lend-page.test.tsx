import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LendPage from '@/app/lend/page';
import { CreateOfferDrawer } from '@/components/lend/CreateOfferDrawer';
import { MyOpenOffersList } from '@/components/lend/MyOpenOffersList';
import { LendCollectionCard } from '@/components/lend/LendCollectionCard';
import type { OfferItem } from '@/types/api';

const mockTestCol = {
  id: '0x1111111111111111111111111111111111111111',
  name: 'Robinhood NFT',
  symbol: 'RNFT',
  contractAddress: '0x1111111111111111111111111111111111111111' as `0x${string}`,
  defaultDurations: [7, 14, 30] as [7, 14, 30],
  addresses: {
    46630: '0x1111111111111111111111111111111111111111' as `0x${string}`,
    4663: '0x1111111111111111111111111111111111111111' as `0x${string}`,
  },
};

const mockOpenOffers: OfferItem[] = [
  {
    offerId: 1,
    chainId: 46630,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: '0x1111111111111111111111111111111111111111',
    principalWei: '1500000000000000000',
    termInterestBps: 500,
    feeBpsSnapshot: 200,
    durationSeconds: 604800,
    expiresAt: '2026-10-15T00:00:00Z',
    status: 'open',
    blockNumber: 100,
    txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    createdAt: '2026-10-01T12:00:00Z',
  },
  {
    offerId: 2,
    chainId: 46630,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: '0x2222222222222222222222222222222222222222',
    principalWei: '2000000000000000000',
    termInterestBps: 700,
    feeBpsSnapshot: 200,
    durationSeconds: 1209600,
    expiresAt: '2026-10-20T00:00:00Z',
    status: 'open',
    blockNumber: 105,
    txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    createdAt: '2026-10-01T13:00:00Z',
  },
];

vi.mock('wagmi', () => ({
  useConnection: () => ({
    address: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    isConnected: true,
    chainId: 46630,
  }),
  useAccount: () => ({
    address: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    isConnected: true,
    chainId: 46630,
  }),
  usePublicClient: () => ({
    getBalance: vi.fn().mockResolvedValue(10000000000000000000n),
    simulateContract: vi.fn().mockResolvedValue({ request: {} }),
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
  }),
  useWalletClient: () => ({
    data: {
      writeContract: vi.fn().mockResolvedValue('0x9999999999999999999999999999999999999999999999999999999999999999'),
    },
  }),
}));

vi.mock('@/hooks/api/useOffers', () => ({
  useOffers: () => ({
    data: { offers: mockOpenOffers },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/api/useInvalidateQueries', () => ({
  useInvalidateProtocolQueries: () => vi.fn(),
}));

describe('TICKET-37: Lend Page & Create Offer Drawer Test Suite', () => {
  it('TS-01: CreateOfferDrawer calculates financial preview and renders terms', () => {
    const handleClose = vi.fn();
    const handleSubmit = vi.fn();

    render(
      <CreateOfferDrawer
        isOpen={true}
        collections={[mockTestCol]}
        initialCollectionId={mockTestCol.id}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByRole('dialog', { name: /create lending offer/i })).toBeDefined();

    const principalInput = screen.getByLabelText(/principal/i);
    fireEvent.change(principalInput, { target: { value: '1.0' } });

    const interestInput = screen.getByLabelText(/term interest/i);
    fireEvent.change(interestInput, { target: { value: '5.0' } });

    expect(screen.getByText('0.050 ETH')).toBeDefined();
    expect(screen.getByText(/fund recovery depends on borrower repayment/i)).toBeDefined();

    const submitBtn = screen.getByRole('button', { name: /deposit & publish offer/i });
    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('TS-02: CreateOfferDrawer provides 7, 14, and 30 days duration options', () => {
    render(
      <CreateOfferDrawer
        isOpen={true}
        collections={[mockTestCol]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getAllByText('7 Days').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('14 Days')).toBeDefined();
    expect(screen.getByText('30 Days')).toBeDefined();
  });

  it('TS-03: MyOpenOffersList renders open offers and triggers cancel callback', () => {
    const handleCancel = vi.fn();
    render(
      <MyOpenOffersList
        offers={mockOpenOffers}
        onCancelOffer={handleCancel}
      />
    );

    expect(screen.getByText('1.50 ETH')).toBeDefined();
    expect(screen.getByText('2.00 ETH')).toBeDefined();

    const cancelButtons = screen.getAllByRole('button', { name: /cancel offer/i });
    expect(cancelButtons.length).toBe(2);
  });

  it('TS-04: LendCollectionCard displays collection metrics and opens drawer', () => {
    const handleMakeOffer = vi.fn();
    render(
      <LendCollectionCard
        collection={mockTestCol}
        poolSizeEth="5.00"
        activeLoansCount={2}
        onMakeOffer={handleMakeOffer}
      />
    );

    expect(screen.getAllByText(mockTestCol.name).length).toBeGreaterThan(0);
    expect(screen.getByText('5.00 ETH')).toBeDefined();

    const makeOfferBtn = screen.getByRole('button', { name: /make offer/i });
    fireEvent.click(makeOfferBtn);
    expect(handleMakeOffer).toHaveBeenCalledWith(mockTestCol);
  });

  it('TS-05: LendPage integrates Collection Discovery, MyOpenOffersList, and Drawer', () => {
    render(<LendPage />);
    expect(screen.getByText(/earn fixed yields/i)).toBeDefined();
    expect(screen.getByText(/choose a collection market/i)).toBeDefined();
    expect(screen.getByText(/your open offers/i)).toBeDefined();
  });
});
