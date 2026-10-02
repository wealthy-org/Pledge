'use client';

import React, { useState, useId } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-1.5';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-1.5';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-1.5';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      onKeyDown={handleKeyDown}
    >
      {React.isValidElement(children) ? (
        React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': isVisible ? tooltipId : undefined,
        })
      ) : (
        <button
          type="button"
          aria-describedby={isVisible ? tooltipId : undefined}
          className="inline-flex items-center justify-center w-4 h-4 rounded-md text-[10px] font-mono text-[var(--muted)] hover:text-[var(--text)] bg-[var(--panel)] border border-[var(--line)] transition-colors cursor-help"
        >
          ?
        </button>
      )}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1.5 text-xs font-normal text-[var(--text)] bg-[var(--surface)] rounded-md shadow-lg border border-[var(--line)] whitespace-normal max-w-xs pointer-events-none transition-opacity duration-150 ${getPositionClasses()}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
