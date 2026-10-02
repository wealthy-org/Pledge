import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeframeSelector } from '@/components/markets/TimeframeSelector';

describe('TICKET-67: Markets TimeframeSelector Component Test Suite', () => {
  it('renders 24H, 7D, and 30D timeframe buttons', () => {
    const handleSelect = vi.fn();
    render(<TimeframeSelector timeframe="24h" onSelectTimeframe={handleSelect} />);

    expect(screen.getByRole('button', { name: '24H' })).toBeDefined();
    expect(screen.getByRole('button', { name: '7D' })).toBeDefined();
    expect(screen.getByRole('button', { name: '30D' })).toBeDefined();
  });

  it('triggers onSelectTimeframe callback on click', () => {
    const handleSelect = vi.fn();
    render(<TimeframeSelector timeframe="24h" onSelectTimeframe={handleSelect} />);

    const btn7d = screen.getByRole('button', { name: '7D' });
    fireEvent.click(btn7d);

    expect(handleSelect).toHaveBeenCalledWith('7d');
  });
});
