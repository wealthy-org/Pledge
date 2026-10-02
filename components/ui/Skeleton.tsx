'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[var(--panel)] via-[var(--raised)] to-[var(--panel)] ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      {...props}
    />
  );
}
