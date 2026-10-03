import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  resetRateLimits,
  RATE_LIMIT_STANDARD,
  RATE_LIMIT_HEAVY,
  RATE_LIMIT_RPC,
} from '@/lib/api/security';

describe('TICKET-23: API Rate Limiting Test Suite', () => {
  const TEST_IP = '192.168.1.100';

  beforeEach(() => {
    resetRateLimits();
  });

  describe('TS-01: Rate Limit Enforcement', () => {
    it('allows requests within limit and decreases remaining count', () => {
      const first = checkRateLimit(TEST_IP, 5, 60000);
      expect(first.success).toBe(true);
      expect(first.remaining).toBe(4);

      const second = checkRateLimit(TEST_IP, 5, 60000);
      expect(second.success).toBe(true);
      expect(second.remaining).toBe(3);
    });

    it('blocks request when limit is exceeded and returns retryAfter', () => {
      for (let i = 0; i < 5; i++) {
        const res = checkRateLimit(TEST_IP, 5, 60000);
        expect(res.success).toBe(true);
      }

      const blocked = checkRateLimit(TEST_IP, 5, 60000);
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('isolates rate limits between different IP identifiers', () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit('1.1.1.1', 5, 60000);
      }

      const blockedIp1 = checkRateLimit('1.1.1.1', 5, 60000);
      expect(blockedIp1.success).toBe(false);

      const allowedIp2 = checkRateLimit('2.2.2.2', 5, 60000);
      expect(allowedIp2.success).toBe(true);
      expect(allowedIp2.remaining).toBe(4);
    });

    it('uses standard default limits (180/min standard, 30/min heavy, 600/min rpc)', () => {
      expect(RATE_LIMIT_STANDARD.maxRequests).toBe(180);
      expect(RATE_LIMIT_STANDARD.windowMs).toBe(60000);

      expect(RATE_LIMIT_HEAVY.maxRequests).toBe(30);
      expect(RATE_LIMIT_HEAVY.windowMs).toBe(60000);

      expect(RATE_LIMIT_RPC.maxRequests).toBe(600);
      expect(RATE_LIMIT_RPC.windowMs).toBe(60000);
    });
  });
});
