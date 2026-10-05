import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalSearch } from '@/components/ui/GlobalSearch';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('GlobalSearch V2 Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    localStorage.clear();
  });

  it('renders search input when open and dismisses on escape', () => {
    const handleClose = vi.fn();
    render(<GlobalSearch isOpen={true} onClose={handleClose} />);

    const input = screen.getByPlaceholderText(/search collections/i);
    expect(input).toBeDefined();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('fetches and renders grouped results for collections and wallets', async () => {
    const mockSearchResults = {
      query: '0x123',
      collections: [
        {
          type: 'collection',
          id: '0xabc',
          title: 'Curated Punks',
          subtitle: 'PUNK',
          url: '/collection/0xabc',
          badge: 'Curated',
        },
      ],
      wallets: [
        {
          type: 'wallet',
          id: '0x123',
          title: '0x1234...5678',
          subtitle: 'Public Wallet Profile',
          url: '/profile/0x12345678',
        },
      ],
      items: [],
      results: [
        {
          type: 'collection',
          id: '0xabc',
          title: 'Curated Punks',
          subtitle: 'PUNK',
          url: '/collection/0xabc',
        },
        {
          type: 'wallet',
          id: '0x123',
          title: '0x1234...5678',
          subtitle: 'Public Wallet Profile',
          url: '/profile/0x12345678',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchResults,
    });

    render(<GlobalSearch isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/search collections/i);
    fireEvent.change(input, { target: { value: '0x123' } });

    await waitFor(() => {
      expect(screen.getByText('Curated Punks')).toBeDefined();
    });

    expect(screen.getByText('0x1234...5678')).toBeDefined();
    expect(screen.getByText(/Collections \(1\)/i)).toBeDefined();
    expect(screen.getByText(/Profiles & Wallets \(1\)/i)).toBeDefined();

    const collectionItem = screen.getByText('Curated Punks');
    fireEvent.click(collectionItem);

    expect(mockPush).toHaveBeenCalledWith('/collection/0xabc');
  });
});
