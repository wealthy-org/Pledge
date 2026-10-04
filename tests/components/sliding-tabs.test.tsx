import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RankingTabs } from '@/components/markets/RankingTabs';
import { TimeframeSelector } from '@/components/markets/TimeframeSelector';
import { Toast } from '@/components/ui/Toast';

describe('Sliding Tabs & Micro-Interactions Test Suite', () => {
  it('RankingTabs renders tabs, sets active state, and triggers onTabChange', () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <RankingTabs activeTab="top" onTabChange={handleTabChange} />
    );

    const topTab = screen.getByRole('tab', { name: 'Top' });
    const volumeTab = screen.getByRole('tab', { name: 'Volume' });
    const moversTab = screen.getByRole('tab', { name: 'Movers' });

    expect(topTab.getAttribute('aria-selected')).toBe('true');
    expect(volumeTab.getAttribute('aria-selected')).toBe('false');

    fireEvent.click(volumeTab);
    expect(handleTabChange).toHaveBeenCalledWith('volume');

    rerender(<RankingTabs activeTab="movers" onTabChange={handleTabChange} />);
    expect(moversTab.getAttribute('aria-selected')).toBe('true');
  });

  it('TimeframeSelector renders options and triggers onSelectTimeframe', () => {
    const handleSelect = vi.fn();
    const { rerender } = render(
      <TimeframeSelector timeframe="24h" onSelectTimeframe={handleSelect} />
    );

    const dayBtn = screen.getByRole('button', { name: '24H' });
    const weekBtn = screen.getByRole('button', { name: '7D' });

    expect(dayBtn.getAttribute('aria-pressed')).toBe('true');
    expect(weekBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(weekBtn);
    expect(handleSelect).toHaveBeenCalledWith('7d');

    rerender(<TimeframeSelector timeframe="30d" onSelectTimeframe={handleSelect} />);
    const monthBtn = screen.getByRole('button', { name: '30D' });
    expect(monthBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('Toast renders with message and progress bar animation line', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Toast
        type="success"
        message="Offer created successfully"
        onClose={handleClose}
        duration={4000}
      />
    );

    expect(screen.getByText('Offer created successfully')).toBeDefined();
    const progressBar = container.querySelector('.animate-progress-countdown');
    expect(progressBar).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
