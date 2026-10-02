import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChip } from '@/components/ui/FilterChip';
import { Table } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { Toast } from '@/components/ui/Toast';
import { Drawer } from '@/components/ui/Drawer';

describe('TICKET-32: Shared UI Primitives Test Suite', () => {
  it('TS-01: Button handles clicks, variants, sizes, and loading state', () => {
    const handleClick = vi.fn();
    const { rerender } = render(
      <Button onClick={handleClick} variant="primary" size="md">
        Confirm Action
      </Button>
    );

    const btn = screen.getByRole('button', { name: /confirm action/i });
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={handleClick} loading={true}>
        Confirm Action
      </Button>
    );
    expect(btn.getAttribute('disabled')).not.toBeNull();
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('TS-02: Input renders label, suffix, and error state message', () => {
    const handleChange = vi.fn();
    render(
      <Input
        label="Principal Amount"
        suffix="ETH"
        error="Minimum amount is 0.01 ETH"
        value="0.005"
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Principal Amount')).toBeDefined();
    expect(screen.getByText('ETH')).toBeDefined();
    expect(screen.getByText('Minimum amount is 0.01 ETH')).toBeDefined();
  });

  it('TS-03: Card renders container with customizable children and styling', () => {
    render(
      <Card data-testid="custom-card" className="custom-class">
        <div>Card Inner Content</div>
      </Card>
    );
    expect(screen.getByTestId('custom-card')).toBeDefined();
    expect(screen.getByText('Card Inner Content')).toBeDefined();
  });

  it('TS-04: Badge renders correct status color variant', () => {
    render(<Badge status="active">Active Loan</Badge>);
    const badge = screen.getByText('Active Loan');
    expect(badge.getAttribute('data-status')).toBe('active');
  });

  it('TS-05: Skeleton renders placeholder with custom width and height', () => {
    const { container } = render(<Skeleton width="120px" height="24px" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.style.width).toBe('120px');
    expect(skeleton.style.height).toBe('24px');
  });

  it('TS-06: EmptyState renders title, description, and optional action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Open Offers"
        description="There are currently no active offers for this collection."
        actionLabel="Create Offer"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No Open Offers')).toBeDefined();
    expect(screen.getByText(/currently no active offers/i)).toBeDefined();

    const actionBtn = screen.getByRole('button', { name: /create offer/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalled();
  });

  it('TS-07: FilterChip handles selection and click events', () => {
    const handleSelect = vi.fn();
    render(
      <FilterChip
        id="all"
        label="All Collections"
        selected={true}
        onSelect={handleSelect}
      />
    );

    const chip = screen.getByRole('button', { name: /all collections/i });
    expect(chip.getAttribute('data-selected')).toBe('true');
    fireEvent.click(chip);
    expect(handleSelect).toHaveBeenCalledWith('all');
  });

  it('TS-08: Table renders column headers, rows, loading skeleton, and empty state', () => {
    const columns = [
      { key: 'name', header: 'Collection' },
      { key: 'floor', header: 'Floor Price' },
    ];
    const data = [{ id: '1', name: 'Genesis Pass', floor: '1.25 ETH' }];

    const { rerender } = render(
      <Table columns={columns} data={data} keyExtractor={(item) => item.id} />
    );

    expect(screen.getByText('Genesis Pass')).toBeDefined();
    expect(screen.getByText('1.25 ETH')).toBeDefined();

    rerender(
      <Table
        columns={columns}
        data={[] as Array<{ id: string; name: string; floor: string }>}
        isLoading={true}
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByTestId('table-skeleton')).toBeDefined();

    rerender(
      <Table
        columns={columns}
        data={[] as Array<{ id: string; name: string; floor: string }>}
        isLoading={false}
        emptyMessage="No collections listed"
        keyExtractor={(item) => item.id}
      />
    );
    expect(screen.getByText('No collections listed')).toBeDefined();
  });

  it('TS-09: Tabs switches active tab item', () => {
    const handleTabChange = vi.fn();
    const tabs = [
      { id: 'borrow', label: 'Borrow' },
      { id: 'lend', label: 'Lend' },
    ];

    render(<Tabs tabs={tabs} activeTab="borrow" onChange={handleTabChange} />);
    const lendTab = screen.getByRole('tab', { name: /lend/i });
    fireEvent.click(lendTab);
    expect(handleTabChange).toHaveBeenCalledWith('lend');
  });

  it('TS-10: Toast renders notification message with close button', () => {
    const handleClose = vi.fn();
    render(
      <Toast
        type="success"
        message="Loan offer accepted successfully"
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Loan offer accepted successfully')).toBeDefined();
    const closeBtn = screen.getByLabelText(/close notification/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('TS-11: Drawer opens with title and calls onClose on dismiss', () => {
    const handleClose = vi.fn();
    render(
      <Drawer isOpen={true} title="Loan Terms Review" onClose={handleClose}>
        <div>Transaction Summary</div>
      </Drawer>
    );

    expect(screen.getByText('Loan Terms Review')).toBeDefined();
    expect(screen.getByText('Transaction Summary')).toBeDefined();

    const closeBtn = screen.getByLabelText(/close drawer/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
