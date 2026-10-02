import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RankingTabs } from '@/components/markets/RankingTabs';

describe('TICKET-66: Markets RankingTabs Component Test Suite', () => {
  it('renders Top, Volume, and Movers tabs with accessibility attributes', () => {
    const handleTabChange = vi.fn();
    render(<RankingTabs activeTab="top" onTabChange={handleTabChange} />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeDefined();

    const topTab = screen.getByRole('tab', { name: /top/i });
    const volumeTab = screen.getByRole('tab', { name: /volume/i });
    const moversTab = screen.getByRole('tab', { name: /movers/i });

    expect(topTab.getAttribute('aria-selected')).toBe('true');
    expect(volumeTab.getAttribute('aria-selected')).toBe('false');
    expect(moversTab.getAttribute('aria-selected')).toBe('false');
  });

  it('triggers onTabChange callback when clicking different tabs', () => {
    const handleTabChange = vi.fn();
    render(<RankingTabs activeTab="top" onTabChange={handleTabChange} />);

    const volumeTab = screen.getByRole('tab', { name: /volume/i });
    fireEvent.click(volumeTab);

    expect(handleTabChange).toHaveBeenCalledWith('volume');
  });
});
