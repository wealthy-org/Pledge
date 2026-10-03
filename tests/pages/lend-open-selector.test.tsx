import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LendPage from '@/app/lend/page';
import { CreateOfferDrawer } from '@/components/lend/CreateOfferDrawer';
import * as collectionSafety from '@/lib/services/collectionSafety';

vi.mock('@/hooks/useSafeChainId', () => ({
  useSafeChainId: () => 46630,
}));

vi.mock('wagmi', () => ({
  useConnection: () => ({ address: '0x1111111111111111111111111111111111111111', isConnected: true }),
  useAccount: () => ({ address: '0x1111111111111111111111111111111111111111', isConnected: true }),
  useChainId: () => 46630,
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

vi.mock('@/hooks/api/useOffers', () => ({
  useOffers: () => ({
    data: { offers: [] },
    refetch: vi.fn(),
  }),
}));

const mockExploreCollections = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Open Collection 1',
    symbol: 'OC1',
    offerCount: 3,
    poolSizeWei: '5000000000000000000',
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'Open Collection 2',
    symbol: 'OC2',
    offerCount: 0,
    poolSizeWei: '0',
  },
];

vi.mock('@/hooks/api/useExploreCollections', () => ({
  useExploreCollections: () => ({
    data: { collections: mockExploreCollections, total: 2 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('TICKET-80: Lend Page Open Selector & Custom Contract Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Lend page with open collections list and explore navigation link', () => {
    render(<LendPage />);
    expect(screen.getByText('Open Collection 1')).toBeDefined();
    expect(screen.getByText('Open Collection 2')).toBeDefined();
    expect(screen.getByText(/explore/i)).toBeDefined();
  });

  it('allows switching to custom ERC-721 mode in CreateOfferDrawer and verifies contract on-chain', async () => {
    const verifySpy = vi.spyOn(collectionSafety, 'verifyErc721OnChain').mockResolvedValue(true);
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();

    render(
      <CreateOfferDrawer
        isOpen={true}
        collections={[
          {
            id: '0x1111111111111111111111111111111111111111',
            name: 'Open Collection 1',
            symbol: 'OC1',
            contractAddress: '0x1111111111111111111111111111111111111111',
          },
        ]}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isConnected={true}
      />
    );

    const customTabButton = screen.getByRole('button', { name: /Custom ERC-721/i });
    fireEvent.click(customTabButton);

    const customInput = screen.getByPlaceholderText('0x...');
    fireEvent.change(customInput, {
      target: { value: '0x3333333333333333333333333333333333333333' },
    });

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith('0x3333333333333333333333333333333333333333', 46630);
    });

    await waitFor(() => {
      expect(screen.getByText(/Verified ERC-721 Compliant Contract/i)).toBeDefined();
    });

    expect(screen.getByText(/Permissionless Market Disclosure/i)).toBeDefined();

    const submitButton = screen.getByRole('button', { name: /Deposit & Publish Offer/i });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionAddress: '0x3333333333333333333333333333333333333333',
        principalWei: '1000000000000000000',
        termInterestBps: 500,
      })
    );
  });
});
