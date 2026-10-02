'use client';

import React from 'react';

export interface LTVHealthBarProps {
  principalEth?: number | string;
  floorPriceEth?: number | string;
  ltvPercentage?: number;
  className?: string;
  showLabel?: boolean;
}

export function LTVHealthBar({
  principalEth,
  floorPriceEth,
  ltvPercentage,
  className = '',
  showLabel = true,
}: LTVHealthBarProps) {
  let ltv: number | null = null;

  if (typeof ltvPercentage === 'number' && !isNaN(ltvPercentage)) {
    ltv = Math.min(Math.max(ltvPercentage, 0), 100);
  } else if (principalEth !== undefined && floorPriceEth !== undefined) {
    const p = typeof principalEth === 'string' ? parseFloat(principalEth) : principalEth;
    const f = typeof floorPriceEth === 'string' ? parseFloat(floorPriceEth) : floorPriceEth;

    if (!isNaN(p) && !isNaN(f) && f > 0 && p >= 0) {
      ltv = Math.min(Math.max((p / f) * 100, 0), 100);
    }
  }

  const getStatusConfig = (val: number | null) => {
    if (val === null) {
      return {
        label: '—',
        barColor: 'bg-[#cfd9d5] dark:bg-[#30363d]',
        textColor: 'text-[#62756d] dark:text-[#8b949e]',
        badgeBg: 'bg-[#edf2f0] dark:bg-[#21262d]',
      };
    }
    if (val < 50) {
      return {
        label: `${val.toFixed(1)}%`,
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
      };
    }
    if (val <= 75) {
      return {
        label: `${val.toFixed(1)}%`,
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
      };
    }
    return {
      label: `${val.toFixed(1)}%`,
      barColor: 'bg-rose-500',
      textColor: 'text-rose-700 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    };
  };

  const status = getStatusConfig(ltv);
  const percentageValue = ltv !== null ? Math.round(ltv) : 0;

  return (
    <div className={`flex flex-col gap-1 min-w-[80px] ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#63756e] dark:text-[#8b949e] font-medium">
            LTV
          </span>
          <span className={`text-[11px] font-mono font-semibold ${status.textColor}`}>
            {status.label}
          </span>
        </div>
      )}
      <div className="w-full h-1.5 bg-[#e4ede8] dark:bg-[#21262d] rounded-full overflow-hidden">
        <div
          role="progressbar"
          aria-label="Loan to value ratio"
          aria-valuenow={percentageValue}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ width: `${percentageValue}%` }}
          className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
        />
      </div>
    </div>
  );
}
