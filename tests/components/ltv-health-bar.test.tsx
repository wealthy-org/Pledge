import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LTVHealthBar } from '@/components/common/LTVHealthBar';

describe('TICKET-68: LTVHealthBar Component Test Suite', () => {
  it('calculates safe LTV (<50%) and applies green styling', () => {
    render(<LTVHealthBar principalEth={0.4} floorPriceEth={1.0} />);

    expect(screen.getByText('40.0%')).toBeDefined();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.className).toContain('emerald');
  });

  it('calculates moderate LTV (50%-75%) and applies amber styling', () => {
    render(<LTVHealthBar principalEth={0.6} floorPriceEth={1.0} />);

    expect(screen.getByText('60.0%')).toBeDefined();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('60');
    expect(bar.className).toContain('amber');
  });

  it('calculates high LTV (>75%) and applies rose/red styling', () => {
    render(<LTVHealthBar principalEth={0.85} floorPriceEth={1.0} />);

    expect(screen.getByText('85.0%')).toBeDefined();
    const bar = screen.getByRole('progressbar');
    expect(bar.className).toContain('rose');
  });

  it('renders fallback dash gracefully when floor price is missing or zero', () => {
    render(<LTVHealthBar principalEth={0.5} floorPriceEth={0} />);

    expect(screen.getByText('—')).toBeDefined();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });
});
