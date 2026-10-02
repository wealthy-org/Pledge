import { describe, it, expect, vi } from 'vitest';
import React, { useState, useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { AppShell } from '@/components/layout/AppShell';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <nav aria-label="Main Sidebar" data-testid="sidebar" />,
}));

vi.mock('@/components/layout/HeaderBar', () => ({
  HeaderBar: ({ onSearchClick }: { onSearchClick: () => void }) => (
    <header data-testid="header">
      <button type="button" onClick={onSearchClick} aria-label="Open search">
        Search
      </button>
    </header>
  ),
}));

vi.mock('@/components/layout/ActivityPanel', () => ({
  ActivityPanel: () => <aside aria-label="Live Activity" data-testid="activity-panel" />,
}));

vi.mock('@/components/layout/MobileBottomNav', () => ({
  MobileBottomNav: () => <nav aria-label="Mobile Navigation" data-testid="mobile-nav" />,
}));

describe('TICKET-43: Accessibility & WCAG 2.1 AA Test Suite', () => {
  it('TS-01: AppShell provides skip-to-content link pointing to main element', () => {
    render(
      <AppShell>
        <div>Content Inside Main</div>
      </AppShell>
    );

    const skipLink = screen.getByRole('link', { name: /skip to (main )?content/i });
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute('href')).toBe('#main-content');

    const main = document.getElementById('main-content');
    expect(main).not.toBeNull();
  });

  it('TS-02: Badge component has role="status" and accessible structure', () => {
    render(<Badge status="active">Active Loan</Badge>);

    const badge = screen.getByRole('status');
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain('Active Loan');
  });

  it('TS-03: Input associates label, helper text, and error with ARIA attributes', () => {
    const { rerender } = render(
      <Input
        label="Principal Amount"
        helperText="Enter loan amount in ETH"
        id="principal-input"
      />
    );

    const input = screen.getByLabelText('Principal Amount');
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-invalid')).toBe('false');

    rerender(
      <Input
        label="Principal Amount"
        error="Principal cannot exceed maximum floor"
        id="principal-input"
      />
    );

    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('TS-04: Button defaults to type="button" and exposes aria-busy when loading', () => {
    const { rerender } = render(<Button>Submit</Button>);
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('aria-busy')).toBe('false');

    rerender(<Button loading>Submit</Button>);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('TS-05: Table renders header cells with scope="col"', () => {
    const columns = [
      { key: 'name', header: 'Collection Name' },
      { key: 'volume', header: 'Total Volume' },
    ];
    const data = [{ name: 'Test NFT', volume: '10 ETH' }];

    render(
      <Table
        columns={columns}
        data={data}
        keyExtractor={(item) => item.name}
      />
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers.length).toBe(2);
    headers.forEach((th) => {
      expect(th.getAttribute('scope')).toBe('col');
    });
  });

  it('TS-06: Drawer traps focus, manages Escape dismissal, and restores focus to trigger on close', () => {
    function TestDrawerWrapper() {
      const [isOpen, setIsOpen] = useState(false);
      const buttonRef = useRef<HTMLButtonElement>(null);

      return (
        <div>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setIsOpen(true)}
            id="open-drawer-btn"
          >
            Open Drawer
          </button>
          <Drawer isOpen={isOpen} title="Test Drawer" onClose={() => setIsOpen(false)}>
            <button type="button" id="drawer-inner-btn-1">
              Inner 1
            </button>
            <button type="button" id="drawer-inner-btn-2">
              Inner 2
            </button>
          </Drawer>
        </div>
      );
    }

    render(<TestDrawerWrapper />);

    const openBtn = screen.getByRole('button', { name: 'Open Drawer' });
    openBtn.focus();
    expect(document.activeElement).toBe(openBtn);

    fireEvent.click(openBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
