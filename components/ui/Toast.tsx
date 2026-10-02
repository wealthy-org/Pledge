'use client';

import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type?: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  type = 'info',
  message,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig: Record<
    ToastType,
    { icon: React.ReactNode; bg: string; border: string; text: string }
  > = {
    success: {
      icon: (
        <svg className="w-4 h-4 text-[var(--success)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      bg: 'bg-[var(--surface)]',
      border: 'border-[var(--primary)]',
      text: 'text-[var(--text)]',
    },
    error: {
      icon: (
        <svg className="w-4 h-4 text-[var(--error)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      bg: 'bg-[var(--surface)]',
      border: 'border-[var(--error)]/40',
      text: 'text-[var(--text)]',
    },
    warning: {
      icon: (
        <svg className="w-4 h-4 text-[var(--warning-text)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      bg: 'bg-[var(--surface)]',
      border: 'border-[var(--warning-border)]',
      text: 'text-[var(--text)]',
    },
    info: {
      icon: (
        <svg className="w-4 h-4 text-[var(--blue)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
      bg: 'bg-[var(--surface)]',
      border: 'border-[var(--line-strong)]',
      text: 'text-[var(--text)]',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl ${config.bg} ${config.border} ${config.text} animate-in slide-in-from-bottom-5 duration-200`}
    >
      {config.icon}
      <span className="text-xs font-medium leading-tight max-w-sm">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="ml-2 p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
