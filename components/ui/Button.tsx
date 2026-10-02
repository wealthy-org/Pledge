'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] active:bg-[var(--primary-hover-bg)] shadow-sm border border-transparent',
    secondary:
      'bg-[var(--raised)] text-[var(--text)] hover:bg-[var(--line)] border border-[var(--line)]',
    ghost:
      'bg-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] border border-transparent',
    danger:
      'bg-[var(--error)] text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2 font-medium',
    lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5 font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : 'false'}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
