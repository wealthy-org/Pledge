export interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
  level?: 'fatal' | 'error' | 'warning' | 'info';
}

export function captureException(error: unknown, context?: ErrorContext): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  try {
    const win = typeof window !== 'undefined' ? (window as unknown as { Sentry?: { captureException: (err: unknown, ctx?: unknown) => void } }) : undefined;
    if (win?.Sentry) {
      win.Sentry.captureException(error, context);
    }
  } catch {}
}

export function captureMessage(message: string, context?: ErrorContext): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  try {
    const win = typeof window !== 'undefined' ? (window as unknown as { Sentry?: { captureMessage: (msg: string, ctx?: unknown) => void } }) : undefined;
    if (win?.Sentry) {
      win.Sentry.captureMessage(message, context);
    }
  } catch {}
}
