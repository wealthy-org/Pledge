'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'panel' | 'surface' | 'raised';
}

export function Card({
  children,
  variant = 'panel',
  className = '',
  ...props
}: CardProps) {
  const bgStyles = {
    panel: 'bg-[var(--panel)]',
    surface: 'bg-[var(--surface)]',
    raised: 'bg-[var(--raised)]',
  };

  return (
    <div
      className={`rounded-[var(--radius)] border border-[var(--line)] shadow-[var(--shadow-subtle)] ${bgStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
