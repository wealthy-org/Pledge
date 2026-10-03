import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('TICKET-63: GlobalSearch Combobox & Keyboard Navigation Test Suite', () => {
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders input with WAI-ARIA combobox role and attributes', () => {
    render(<GlobalSearch isOpen={true} onClose={mockClose} />);

    const input = screen.getByRole('combobox');
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('filters collections when typing', () => {
    render(<GlobalSearch isOpen={true} onClose={mockClose} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'PUNK' } });

    expect(screen.getAllByText(/PUNK/i).length).toBeGreaterThan(0);
  });

  it('supports keyboard ArrowDown and Enter navigation to select collection', () => {
    render(<GlobalSearch isOpen={true} onClose={mockClose} />);

    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockPush).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('saves selected search to recent searches in localStorage', () => {
    render(<GlobalSearch isOpen={true} onClose={mockClose} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'SHER' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const recent = JSON.parse(localStorage.getItem('pledge:recent-searches') || '[]');
    expect(recent.length).toBeGreaterThan(0);
  });
});
