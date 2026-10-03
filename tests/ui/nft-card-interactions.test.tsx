import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NFTGrid, type BorrowableNft } from '@/components/borrow/NFTGrid';
import { LendCollectionCard } from '@/components/lend/LendCollectionCard';

describe('TICKET-70: NFT Card Micro-Interactions & Hover Lift Test Suite', () => {
  const mockNft: BorrowableNft = {
    contractAddress: '0x1111111111111111111111111111111111111111',
    tokenId: '1',
    collectionName: 'Robinhood Genesis Pass',
    name: 'Robinhood Genesis Pass #1',
    imageUrl: 'https://example.com/nft.png',
    offerCount: 3,
  };

  it('applies hover lift and transition classes to NFTGrid cards', () => {
    render(
      <NFTGrid
        nfts={[mockNft]}
        selectedNft={null}
        onSelectNft={vi.fn()}
      />
    );

    const card = screen.getByTestId(`nft-card-${mockNft.contractAddress}-${mockNft.tokenId}`);
    expect(card.className).toContain('hover:-translate-y-1');
    expect(card.className).toContain('hover:shadow');
  });

  it('applies hover lift and transition classes to LendCollectionCard', () => {
    const col = {
      id: '0x1111111111111111111111111111111111111111',
      name: 'Robinhood Genesis Pass',
      symbol: 'RHG',
      contractAddress: '0x1111111111111111111111111111111111111111',
    };
    render(
      <LendCollectionCard
        collection={col}
        onMakeOffer={vi.fn()}
      />
    );

    const article = screen.getByRole('article');
    expect(article.className).toContain('hover:-translate-y-1');
    expect(article.className).toContain('hover:shadow');
  });
});
