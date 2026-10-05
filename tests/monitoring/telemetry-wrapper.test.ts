import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureException, captureMessage } from '@/lib/monitoring/sentry';
import { trackEvent } from '@/lib/analytics/track';

describe('Telemetry & Observability Wrappers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('safely handles captureException when Sentry is not configured', () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    expect(() => captureException(new Error('Test error'))).not.toThrow();
  });

  it('safely handles captureMessage when Sentry is not configured', () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    expect(() => captureMessage('Test info message')).not.toThrow();
  });

  it('calls Sentry global when DSN and window.Sentry are present', () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://fake@sentry.io/123';
    const mockCapture = vi.fn();
    (window as unknown as { Sentry: { captureException: typeof mockCapture } }).Sentry = {
      captureException: mockCapture,
    };

    const err = new Error('Tracked failure');
    captureException(err, { tags: { environment: 'test' } });
    expect(mockCapture).toHaveBeenCalledWith(err, { tags: { environment: 'test' } });
  });

  it('trackEvent records event into window.dataLayer', () => {
    const dataLayer: Array<Record<string, unknown>> = [];
    (window as unknown as { dataLayer: typeof dataLayer }).dataLayer = dataLayer;

    trackEvent('create_offer_click', {
      chainId: 46630,
      valueEth: '1.5',
    });

    expect(dataLayer.length).toBe(1);
    expect(dataLayer[0].event).toBe('create_offer_click');
    expect(dataLayer[0].chainId).toBe(46630);
    expect(dataLayer[0].valueEth).toBe('1.5');
    expect(dataLayer[0].timestamp).toBeDefined();
  });

  it('trackEvent throws explicit error on invalid event name', () => {
    expect(() => trackEvent('' as unknown as 'page_view')).toThrow(
      /eventName is required/i
    );
  });
});
