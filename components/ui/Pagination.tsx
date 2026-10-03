'use client';

import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  itemName?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemName = 'items',
  className = '',
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSize || 10))) {
    return null;
  }

  const startItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
    : undefined;
  const endItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(currentPage * pageSize, totalItems)
    : undefined;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--line)] ${className}`}
      data-testid="pagination-bar"
    >
      <div className="text-xs text-[var(--muted)] select-none">
        {startItem !== undefined && endItem !== undefined && totalItems !== undefined ? (
          <span>
            Showing <strong className="text-[var(--text)] font-semibold">{startItem}</strong>–
            <strong className="text-[var(--text)] font-semibold">{endItem}</strong> of{' '}
            <strong className="text-[var(--text)] font-semibold">{totalItems}</strong> {itemName}
          </span>
        ) : (
          <span>
            Page <strong className="text-[var(--text)] font-semibold">{currentPage}</strong> of{' '}
            <strong className="text-[var(--text)] font-semibold">{Math.max(1, totalPages)}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 select-none">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer ${
            currentPage <= 1
              ? 'opacity-40 pointer-events-none border-[var(--line)] text-[var(--muted)] bg-[var(--surface)]'
              : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--raised)] hover:border-[var(--line-strong)] shadow-xs'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden xs:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-[var(--muted)] select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] hover:bg-[var(--raised)] hover:border-[var(--line-strong)]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer ${
            currentPage >= totalPages
              ? 'opacity-40 pointer-events-none border-[var(--line)] text-[var(--muted)] bg-[var(--surface)]'
              : 'border-[var(--line)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--raised)] hover:border-[var(--line-strong)] shadow-xs'
          }`}
        >
          <span className="hidden xs:inline">Next</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
