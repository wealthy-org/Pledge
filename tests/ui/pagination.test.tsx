import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/ui/Pagination';

describe('Pagination Component Test Suite', () => {
  it('renders page numbers, items count and navigates on page click', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={50}
        pageSize={10}
        itemName="collections"
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByText(/showing/i)).toBeDefined();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('50')).toBeDefined();
    expect(screen.getByText(/collections/i)).toBeDefined();

    const page3Btn = screen.getByRole('button', { name: '3' });
    fireEvent.click(page3Btn);
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('navigates with next and prev buttons', () => {
    const handlePageChange = vi.fn();
    const { rerender } = render(
      <Pagination
        currentPage={2}
        totalPages={4}
        totalItems={40}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    const nextBtn = screen.getByRole('button', { name: /next page/i });

    fireEvent.click(prevBtn);
    expect(handlePageChange).toHaveBeenCalledWith(1);

    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(3);

    rerender(
      <Pagination
        currentPage={1}
        totalPages={4}
        totalItems={40}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );
    expect(prevBtn.getAttribute('disabled')).not.toBeNull();

    rerender(
      <Pagination
        currentPage={4}
        totalPages={4}
        totalItems={40}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );
    expect(nextBtn.getAttribute('disabled')).not.toBeNull();
  });

  it('handles ellipsis formatting for many pages', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={5}
        totalPages={15}
        totalItems={150}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('returns null when totalPages <= 1 and totalItems <= pageSize', () => {
    const handlePageChange = vi.fn();
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        totalItems={5}
        pageSize={10}
        onPageChange={handlePageChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
