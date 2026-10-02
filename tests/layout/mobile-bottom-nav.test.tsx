import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

let mockPathname = '/borrow';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('TICKET-74: MobileBottomNav Component Test Suite', () => {
  it('renders mobile navigation items and marks active route with aria-current="page"', () => {
    mockPathname = '/borrow';
    render(<MobileBottomNav />);

    const borrowLink = screen.getByRole('link', { name: 'Borrow' });
    expect(borrowLink).toBeDefined();
    expect(borrowLink.getAttribute('aria-current')).toBe('page');

    const marketsLink = screen.getByRole('link', { name: 'Markets' });
    expect(marketsLink).toBeDefined();
    expect(marketsLink.getAttribute('aria-current')).toBeNull();
  });

  it('triggers onSearchClick when search button is clicked', () => {
    const handleSearch = vi.fn();
    render(<MobileBottomNav onSearchClick={handleSearch} />);

    const searchBtn = screen.getByRole('button', { name: 'Search' });
    expect(searchBtn).toBeDefined();

    fireEvent.click(searchBtn);
    expect(handleSearch).toHaveBeenCalled();
  });
});
