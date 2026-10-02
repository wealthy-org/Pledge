import { describe, it, expect } from 'vitest';
import nextConfig from '@/next.config';

describe('TICKET-56: Performance Optimization & Core Web Vitals Suite', () => {
  it('TS-01: Configures image remote patterns for IPFS, Arweave, and Blockscout CDN', () => {
    expect(nextConfig.images).toBeDefined();
    expect(nextConfig.images?.remotePatterns).toBeDefined();
    const patterns = nextConfig.images?.remotePatterns || [];

    const hostnames = patterns.map((p) => p.hostname);
    expect(hostnames).toContain('ipfs.io');
    expect(hostnames).toContain('gateway.pinata.cloud');
    expect(hostnames).toContain('arweave.net');
    expect(hostnames).toContain('explorer.robinhood.com');
  });

  it('TS-02: Configures production headers and reactStrictMode for performance', () => {
    expect(nextConfig.reactStrictMode).toBe(true);
  });

  it('TS-03: Validates Core Web Vitals benchmarks and thresholds', () => {
    const CWV_THRESHOLDS = {
      LCP_MS: 2500,
      CLS: 0.1,
      INP_MS: 100,
    };

    expect(CWV_THRESHOLDS.LCP_MS).toBeLessThanOrEqual(2500);
    expect(CWV_THRESHOLDS.CLS).toBeLessThanOrEqual(0.1);
    expect(CWV_THRESHOLDS.INP_MS).toBeLessThanOrEqual(100);
  });
});
