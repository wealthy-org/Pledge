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
  const gradId = React.useId().replace(/:/g, '');

  const stepX = (width - 6) / (points.length - 1);
  const coords = points.map((val, idx) => {
    const x = 2 + idx * stepX;
    const y = height - 3 - ((val - min) / range) * (height - 6);
    return { x, y, str: `${x.toFixed(1)},${y.toFixed(1)}` };
  });

  const pathD = `M ${coords.map((c) => c.str).join(' L ')}`;
  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)},${height} L ${coords[0].x.toFixed(1)},${height} Z`;
  const lastPoint = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible inline-block select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sparkGrad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkGrad-${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2"
        fill={strokeColor}
      />
    </svg>
  );
}
