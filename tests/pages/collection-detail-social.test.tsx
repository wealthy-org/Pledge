import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollectionHeader, type CollectionHeaderStats } from '@/components/collection/CollectionHeader';
import { CURATED_COLLECTIONS, type ActiveCuratedCollection } from '@/config/collections';

import { TESTNET_CHAIN_ID } from '@/config/chains';

describe('TICKET-73: Collection Detail Social Links & Metadata Test Suite', () => {
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
    socials: {
      website: 'https://robinhood.com',
      twitter: 'https://x.com/robinhoodapp',
      discord: 'https://discord.gg/robinhood',
    },
  };

  it('renders configured social links with target="_blank" and rel="noopener noreferrer"', () => {
    render(<CollectionHeader collection={sampleCollection} stats={mockStats} />);

    const websiteLink = screen.getByRole('link', { name: 'Website' });
    expect(websiteLink).toBeDefined();
    expect(websiteLink.getAttribute('href')).toBe('https://robinhood.com');
    expect(websiteLink.getAttribute('target')).toBe('_blank');
    expect(websiteLink.getAttribute('rel')).toBe('noopener noreferrer');

    const twitterLink = screen.getByRole('link', { name: 'Twitter' });
    expect(twitterLink).toBeDefined();
    expect(twitterLink.getAttribute('href')).toBe('https://x.com/robinhoodapp');
    expect(twitterLink.getAttribute('target')).toBe('_blank');
    expect(twitterLink.getAttribute('rel')).toBe('noopener noreferrer');

    const discordLink = screen.getByRole('link', { name: 'Discord' });
    expect(discordLink).toBeDefined();
    expect(discordLink.getAttribute('href')).toBe('https://discord.gg/robinhood');
    expect(discordLink.getAttribute('target')).toBe('_blank');
    expect(discordLink.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('gracefully handles missing social links without throwing error', () => {
    const colWithoutSocials: ActiveCuratedCollection = {
      ...CURATED_COLLECTIONS[0],
      contractAddress: CURATED_COLLECTIONS[0].addresses[TESTNET_CHAIN_ID],
      socials: undefined,
    };

    render(<CollectionHeader collection={colWithoutSocials} stats={mockStats} />);
    expect(screen.queryByRole('link', { name: /website/i })).toBeNull();
  });
});
