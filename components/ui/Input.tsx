'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
  prefix?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  suffix,
  prefix,
  error,
  helperText,
  id,
  className = '',
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--text)] tracking-tight"
        >
          {label}
        </label>
      )}

      <div
        className={`flex items-center rounded-xl bg-[var(--surface)] border px-3.5 py-2 transition-all ${
          error
            ? 'border-[var(--error)] focus-within:ring-2 focus-within:ring-red-500/20'
            : 'border-[var(--line)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-emerald-500/20'
        }`}
      >
        {prefix && <span className="text-xs text-[var(--muted)] font-mono mr-2">{prefix}</span>}
        <input
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          className={`flex-1 bg-transparent border-none text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-hidden font-mono ${className}`}
          {...props}
        />
        {suffix && <span className="text-xs text-[var(--muted)] font-mono ml-2 font-medium">{suffix}</span>}
      </div>

      {error && (
        <span id={errorId} role="alert" className="text-xs text-[var(--error)] font-medium">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} className="text-xs text-[var(--muted)]">
          {helperText}
        </span>
      )}
    </div>
  );
}
