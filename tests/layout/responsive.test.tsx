import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/borrow',
}));

describe('TICKET-30: Responsive Navigation & Breakpoints Test Suite', () => {
  it('TS-01: MobileBottomNav renders all core navigation touch targets', () => {
    render(<MobileBottomNav />);
    const nav = screen.getByRole('navigation', { name: /mobile bottom navigation/i });
    expect(nav).toBeDefined();

    expect(screen.getByRole('link', { name: /markets/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /lend/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /borrow/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /portfolio/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /activity/i })).toBeDefined();
  });

  it('TS-02: MobileBottomNav highlights current active path /borrow', () => {
    render(<MobileBottomNav />);
    const borrowLink = screen.getByRole('link', { name: /borrow/i });
    expect(borrowLink.getAttribute('data-active')).toBe('true');
  });
});
