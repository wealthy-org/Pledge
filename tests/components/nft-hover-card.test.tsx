import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NftHoverCard } from '@/components/nft/NftHoverCard';

vi.mock('@/components/nft/NftImage', () => ({
  NftImage: ({ alt }: { alt: string }) => <div data-testid="nft-image">{alt}</div>,
}));

describe('NftHoverCard Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders child element and does not show tooltip initially', () => {
    render(
      <NftHoverCard collection="0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9" tokenId="12">
        <button type="button">Hover Me</button>
      </NftHoverCard>
    );

    expect(screen.getByText('Hover Me')).toBeDefined();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('opens tooltip card on mouse enter after debounce', () => {
    render(
      <NftHoverCard
        collection="0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9"
        tokenId="12"
        tokenName="Rare Beast #12"
        statusText="In Loan"
        statusVariant="active"
      >
        <span>Card Trigger</span>
      </NftHoverCard>
    );

    const trigger = screen.getByText('Card Trigger');
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole('tooltip')).toBeDefined();
    expect(screen.getAllByText('Rare Beast #12').length).toBeGreaterThan(0);
    expect(screen.getByText('In Loan')).toBeDefined();
    expect(screen.getByText('View Token Details ↗')).toBeDefined();
  });

  it('dismisses tooltip on mouse leave', () => {
    render(
      <NftHoverCard collection="0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9" tokenId="12">
        <span>Trigger</span>
      </NftHoverCard>
    );

    const trigger = screen.getByText('Trigger');
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeDefined();

    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
