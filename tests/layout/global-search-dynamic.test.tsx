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

vi.mock('@/hooks/useSafeChainId', () => ({
  useSafeChainId: () => 46630,
}));

describe('TICKET-81: Dynamic Global Search with Open Catalog Indexing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('fetches collections dynamically from /api/explore/collections when typing', async () => {
    const mockCollections = [
      {
        address: '0x1111111111111111111111111111111111111111',
        name: 'CyberPunks Alpha',
        symbol: 'CPUNK',
        offerCount: 3,
        poolSizeWei: '5000000000000000000',
      },
      {
        address: '0x2222222222222222222222222222222222222222',
        name: 'Empty Punks Beta',
        symbol: 'EPUNK',
        offerCount: 0,
        poolSizeWei: '0',
      },
    ];

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/explore/collections')) {
        return {
          ok: true,
          json: async () => ({ collections: mockCollections, total: 2 }),
        } as unknown as Response;
      }
      return { ok: false } as unknown as Response;
    });

    render(<GlobalSearch isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Search collections/i);
    fireEvent.change(searchInput, { target: { value: 'punk' } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('CyberPunks Alpha')).toBeDefined();
      expect(screen.getByText('Empty Punks Beta')).toBeDefined();
    });

    expect(screen.getByText(/Offers Active \(3\)/i)).toBeDefined();
    expect(screen.getByText(/Explore/i)).toBeDefined();

    const alphaItem = screen.getByText('CyberPunks Alpha');
    fireEvent.click(alphaItem);

    expect(mockPush).toHaveBeenCalledWith('/collection/0x1111111111111111111111111111111111111111');
  });
});
