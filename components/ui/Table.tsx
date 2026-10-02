'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  keyExtractor,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)] ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--panel)] border-b border-[var(--line)] text-[10px] font-mono uppercase tracking-[1.5px] text-[var(--muted)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-3.5 px-4 font-semibold ${alignClass[col.align || 'left']}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E8EDED]">
            {isLoading ? (
              <tr data-testid="table-skeleton">
                <td colSpan={columns.length} className="p-4 space-y-3">
                  <Skeleton height="36px" borderRadius="8px" />
                  <Skeleton height="36px" borderRadius="8px" />
                  <Skeleton height="36px" borderRadius="8px" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState
                    title={emptyMessage}
                    description="Try changing your filters or check back later."
                  />
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors ${
                    onRowClick
                      ? 'hover:bg-[#F0F7F7] cursor-pointer'
                      : 'hover:bg-[var(--panel)]'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 text-[var(--text)] font-medium ${
                        alignClass[col.align || 'left']
                      }`}
                    >
                      {col.render
                        ? col.render(item)
                        : (item[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
