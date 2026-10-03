'use client';

import React from 'react';

export interface SparklineChartProps {
  data?: number[];
  isPositive?: boolean;
  width?: number;
  height?: number;
}

export function SparklineChart({
  data = [1.1, 1.15, 1.12, 1.18, 1.22, 1.2, 1.25],
  isPositive = true,
  width = 84,
  height = 24,
}: SparklineChartProps) {
  const points = data.length > 0 ? data : [1, 1.1, 1.05, 1.2];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  const stepX = (width - 4) / (points.length - 1);
  const coords = points.map((val, idx) => {
    const x = 2 + idx * stepX;
    const y = height - 2 - ((val - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;
  const areaD = `${pathD} L ${width - 2},${height} L 2,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible inline-block"
      aria-hidden="true"
    >
      <path d={areaD} fill={fillColor} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
