import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollectionHeader } from '@/components/collection/CollectionHeader';
import type { ActiveCuratedCollection } from '@/config/collections';

vi.mock('@/hooks/useSafeChainId', () => ({
  useSafeChainId: () => 46630,
}));

const mockCollection: ActiveCuratedCollection = {
  id: 'cyberpunks',
  name: 'CyberPunks',
  symbol: 'CPUNK',
  defaultDurations: [7, 14, 30],
  addresses: {
    46630: '0x1234567890abcdef1234567890abcdef12345678',
    4663: '0x1234567890abcdef1234567890abcdef12345678',
  },
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
};

const mockStats = {
  bestOfferWei: '1500000000000000000',
  poolSizeWei: '5000000000000000000',
  offerCount: 4,
  aprRange: '12.50% - 15.00%',
  activeLoansCount: 2,
};

describe('TICKET-81: Collection Header Anti-Spoofing & Explorer Verification Badges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders full contract address with copy action and explorer link', () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    render(
      <CollectionHeader
        collection={mockCollection}
        stats={mockStats}
        chainId={46630}
      />
    );

    expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeDefined();
    expect(screen.getByText('Verified ERC-721')).toBeDefined();
    expect(screen.getByText(/Blockscout Explorer/i)).toBeDefined();

    const copyBtn = screen.getByRole('button', { name: /Copy contract address/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
  });

  it('renders duplicate name warning banner when isDuplicateName is true', () => {
    render(
      <CollectionHeader
        collection={mockCollection}
        stats={mockStats}
        chainId={46630}
        isDuplicateName={true}
      />
    );

    expect(screen.getByText(/Duplicate Name Warning:/i)).toBeDefined();
    expect(screen.getByText(/Verify on Blockscout ↗/i)).toBeDefined();
  });
});
