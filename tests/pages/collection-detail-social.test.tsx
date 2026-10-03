import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollectionHeader, type CollectionHeaderStats } from '@/components/collection/CollectionHeader';
import { CURATED_COLLECTIONS, type ActiveCuratedCollection } from '@/config/collections';
import { TESTNET_CHAIN_ID, getExplorerAddressUrl } from '@/config/chains';

describe('TICKET-73: Collection Detail On-Chain Explorer Links & Metadata Test Suite', () => {
  const mockStats: CollectionHeaderStats = {
    bestOfferWei: '1000000000000000000',
    poolSizeWei: '5000000000000000000',
    offerCount: 4,
    aprRange: '15.00%',
    activeLoansCount: 2,
  };

  const sampleCollection: ActiveCuratedCollection = {
    ...CURATED_COLLECTIONS[0],
    contractAddress: CURATED_COLLECTIONS[0].addresses[TESTNET_CHAIN_ID],
  };

  it('renders verified explorer link with target="_blank" and rel="noopener noreferrer"', () => {
    render(<CollectionHeader collection={sampleCollection} stats={mockStats} chainId={TESTNET_CHAIN_ID} />);

    const explorerLinks = screen.getAllByRole('link', { name: /explorer/i });
    expect(explorerLinks.length).toBeGreaterThan(0);
    const explorerLink = explorerLinks[0];
    const expectedUrl = getExplorerAddressUrl(sampleCollection.contractAddress, TESTNET_CHAIN_ID);
    expect(explorerLink.getAttribute('href')).toBe(expectedUrl);
    expect(explorerLink.getAttribute('target')).toBe('_blank');
    expect(explorerLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders verified blockscout address link with target="_blank" and rel="noopener noreferrer"', () => {
    render(<CollectionHeader collection={sampleCollection} stats={mockStats} chainId={TESTNET_CHAIN_ID} />);

    const blockscoutLink = screen.getByRole('link', { name: 'View on Blockscout' });
    expect(blockscoutLink).toBeDefined();
    const expectedUrl = getExplorerAddressUrl(sampleCollection.contractAddress, TESTNET_CHAIN_ID);
    expect(blockscoutLink.getAttribute('href')).toBe(expectedUrl);
    expect(blockscoutLink.getAttribute('target')).toBe('_blank');
    expect(blockscoutLink.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
