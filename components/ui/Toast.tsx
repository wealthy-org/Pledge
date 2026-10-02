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
    { icon: string; bg: string; border: string; text: string }
  > = {
    success: {
      icon: '✅',
      bg: 'bg-[var(--green-soft)]',
      border: 'border-[var(--primary)]',
      text: 'text-[var(--text)]',
    },
    error: {
      icon: '⚠️',
      bg: 'bg-red-50',
      border: 'border-[var(--error)]',
      text: 'text-red-950',
    },
    warning: {
      icon: '⚡',
      bg: 'bg-[var(--warning-bg)]',
      border: 'border-[var(--warning-border)]',
      text: 'text-[var(--warning-text)]',
    },
    info: {
      icon: 'ℹ️',
      bg: 'bg-[var(--blue-soft)]',
      border: 'border-[var(--blue)]',
      text: 'text-[var(--text)]',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl ${config.bg} ${config.border} ${config.text} animate-in slide-in-from-bottom-5 duration-200`}
    >
      <span className="text-base">{config.icon}</span>
      <span className="text-xs font-medium leading-tight max-w-sm">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="ml-2 p-1 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-black/5 transition-colors cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
}
