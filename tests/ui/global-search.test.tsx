import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalSearch } from '@/components/ui/GlobalSearch';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockCollections = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Nottingham Punks',
    symbol: 'PUNK',
    imageUrl: '',
    poolSizeWei: '0',
    offerCount: 0,
    activeLoansCount: 0,
  },
  {
    address: '0x2222222222222222222222222222222222222222',
    name: 'Sherwood Foresters',
    symbol: 'SHER',
    imageUrl: '',
    poolSizeWei: '0',
    offerCount: 0,
    activeLoansCount: 0,
  },
];

vi.mock('@/hooks/api/useCollections', () => ({
  useCollections: () => ({
    data: {
      collections: mockCollections,
    },
    isLoading: false,
  }),
}));

describe('TICKET-31: Global Search Component Test Suite', () => {
  it('TS-01: GlobalSearch renders open dialog when isOpen is true', () => {
    render(<GlobalSearch isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: /search protocol/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/search collections, loans, or addresses/i)).toBeDefined();
  });

  it('TS-02: Fuzzy filters collections based on user query', () => {
    render(<GlobalSearch isOpen={true} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/search collections, loans, or addresses/i);

    fireEvent.change(input, { target: { value: 'PUNK' } });
    expect(screen.getAllByText(/PUNK/i).length).toBeGreaterThan(0);
  });

  it('TS-03: Keyboard arrow navigation and Enter key triggers navigation', () => {
    const handleClose = vi.fn();
    render(<GlobalSearch isOpen={true} onClose={handleClose} />);
    const input = screen.getByPlaceholderText(/search collections, loans, or addresses/i);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('TS-04: ESC key closes search modal dialog', () => {
    const handleClose = vi.fn();
    render(<GlobalSearch isOpen={true} onClose={handleClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});
