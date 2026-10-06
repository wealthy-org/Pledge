import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BorrowPage from '@/app/borrow/page';
import { NFTGrid, type BorrowableNft } from '@/components/borrow/NFTGrid';
import { OfferComparisonList } from '@/components/borrow/OfferComparisonList';
import { BorrowReviewDrawer } from '@/components/borrow/BorrowReviewDrawer';
import type { OfferItem } from '@/types/api';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'collection' ? null : null),
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('wagmi', () => ({
  useConnection: () => ({
    address: '0x2222222222222222222222222222222222222222',
    isConnected: true,
    chainId: 46630,
  }),
  useAccount: () => ({
    address: '0x2222222222222222222222222222222222222222',
    isConnected: true,
    chainId: 46630,
  }),
  usePublicClient: () => ({
    readContract: vi.fn().mockResolvedValue(true),
    simulateContract: vi.fn().mockResolvedValue({ request: {} }),
    waitForTransactionReceipt: vi.fn().mockResolvedValue({ status: 'success' }),
  }),
  useWalletClient: () => ({
    data: {
      writeContract: vi.fn().mockResolvedValue('0x8888888888888888888888888888888888888888888888888888888888888888'),
    },
  }),
}));

vi.mock('@/hooks/api/useInvalidateQueries', () => ({
  useInvalidateProtocolQueries: () => ({
    invalidateAll: vi.fn(),
    invalidateOffers: vi.fn(),
    invalidateLoans: vi.fn(),
    invalidatePortfolio: vi.fn(),
  }),
}));

const mockNfts: BorrowableNft[] = [
  {
    contractAddress: '0x1111111111111111111111111111111111111111',
    tokenId: '1',
    collectionName: 'Robinhood Genesis Pass',
    name: 'Robinhood Genesis Pass #1',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    bestOfferWei: '1500000000000000000',
    offerCount: 2,
    isInLoan: false,
  },
  {
    contractAddress: '0x1111111111111111111111111111111111111111',
    tokenId: '2',
    collectionName: 'Robinhood Genesis Pass',
    name: 'Robinhood Genesis Pass #2',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    bestOfferWei: '1500000000000000000',
    offerCount: 2,
    isInLoan: true,
  },
  {
    contractAddress: '0x2222222222222222222222222222222222222222',
    tokenId: '10',
    collectionName: 'Sherwood Forest Rangers',
    name: 'Sherwood Ranger #10',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    bestOfferWei: '750000000000000000',
    offerCount: 1,
    isInLoan: false,
  },
];

const mockOffers: OfferItem[] = [
  {
    offerId: 2,
    chainId: 46630,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: '0x1111111111111111111111111111111111111111',
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
  {
    offerId: 1,
    chainId: 46630,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: '0x1111111111111111111111111111111111111111',
    principalWei: '1500000000000000000',
    termInterestBps: 100,
    feeBpsSnapshot: 200,
    durationSeconds: 604800,
    expiresAt: '2026-10-15T00:00:00Z',
    status: 'open',
    blockNumber: 100,
    txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    createdAt: '2026-10-01T12:00:00Z',
  },
];

describe('TICKET-36: Borrow Page & Review Drawer Test Suite', () => {
  it('TS-01: NFTGrid renders eligible NFTs and triggers selection callback', () => {
    const handleSelect = vi.fn();
    render(
      <NFTGrid
        nfts={mockNfts}
        selectedNft={null}
        onSelectNft={handleSelect}
      />
    );

    expect(screen.getByText('Robinhood Genesis Pass #1')).toBeDefined();
    expect(screen.getByText('Sherwood Ranger #10')).toBeDefined();

    const selectableCard = screen.getByTestId('nft-card-0x1111111111111111111111111111111111111111-1');
    fireEvent.click(selectableCard);
    expect(handleSelect).toHaveBeenCalledWith(mockNfts[0]);
  });

  it('TS-02: NFTGrid disables selection and renders In Loan badge for active collateral', () => {
    const handleSelect = vi.fn();
    render(
      <NFTGrid
        nfts={mockNfts}
        selectedNft={null}
        onSelectNft={handleSelect}
      />
    );

    expect(screen.getByText(/in loan/i)).toBeDefined();
    const disabledCard = screen.getByTestId('nft-card-0x1111111111111111111111111111111111111111-2');
    fireEvent.click(disabledCard);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('TS-03: OfferComparisonList highlights Best Offer at the top and calculates APR formula', () => {
    const handleBorrow = vi.fn();
    render(
      <OfferComparisonList
        offers={mockOffers}
        onSelectOffer={handleBorrow}
      />
    );

    const rows = screen.getAllByTestId('offer-row');
    expect(rows.length).toBe(2);
    expect(rows[0].getAttribute('data-best-offer')).toBe('true');
    expect(rows[0].textContent).toContain('2.00 ETH');

    expect(screen.getByText(/52.14%/)).toBeDefined();
  });

  it('TS-04: OfferComparisonList renders EmptyState when no offers available', () => {
    render(<OfferComparisonList offers={[]} onSelectOffer={vi.fn()} />);
    expect(screen.getByText(/No offers available for this collection/i)).toBeDefined();
  });

  it('TS-05: BorrowReviewDrawer calculates exact total due, deadline, protocol fee, and escrow warning', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <BorrowReviewDrawer
        isOpen={true}
        nft={mockNfts[0]}
        offer={mockOffers[1]}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getAllByText(/1.500 ETH/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/0.015 ETH/i)).toBeDefined();
    expect(screen.getByText(/1.515 ETH/i)).toBeDefined();
    expect(screen.getByText(/Your NFT will be transferred to the smart contract escrow/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /borrow 1.500 eth/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /borrow 1.500 eth/i }));
    expect(handleConfirm).toHaveBeenCalled();
  });

  it('TS-06: BorrowPage integrates NFTGrid, OfferComparisonList, and ReviewDrawer', () => {
    render(<BorrowPage />);
    expect(screen.getByText(/instant collateral liquidity/i)).toBeDefined();
    expect(screen.getByText(/your eligible nfts/i)).toBeDefined();
  });

  it('TS-07: NFTGrid paginates at 15 cards per page', () => {
    const manyNfts: BorrowableNft[] = Array.from({ length: 20 }, (_, i) => ({
      contractAddress: '0x1111111111111111111111111111111111111111',
      tokenId: String(i + 1),
      collectionName: 'Robinhood Genesis Pass',
      name: `Robinhood Genesis Pass #${i + 1}`,
      bestOfferWei: '1000000000000000000',
      termInterestBps: 200,
      offerCount: 1,
    }));

    render(<NFTGrid nfts={manyNfts} selectedNft={null} onSelectNft={() => {}} />);

    expect(screen.getByText('Robinhood Genesis Pass #1')).toBeDefined();
    expect(screen.getByText('Robinhood Genesis Pass #15')).toBeDefined();
    expect(screen.queryByText('Robinhood Genesis Pass #16')).toBeNull();

    const nextPageBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextPageBtn);

    expect(screen.getByText('Robinhood Genesis Pass #16')).toBeDefined();
    expect(screen.getByText('Robinhood Genesis Pass #20')).toBeDefined();
    expect(screen.queryByText('Robinhood Genesis Pass #1')).toBeNull();
  });
});
