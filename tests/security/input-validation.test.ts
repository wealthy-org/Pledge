import { describe, it, expect } from 'vitest';
import {
  validateAndFormatAddress,
  sanitizePaginationLimit,
  sanitizeNumericParam,
} from '@/lib/api/security';

describe('TICKET-23: API Input Validation & Sanitization Test Suite', () => {
  describe('TS-02: Address Validation & Rejection', () => {
    it('accepts and normalizes valid Ethereum checksum address', () => {
      const validAddress = '0x1111111111111111111111111111111111111111';
      const formatted = validateAndFormatAddress(validAddress);
      expect(formatted).toBe('0x1111111111111111111111111111111111111111');
    });

    it('throws explicit error for non-hex or malformed addresses', () => {
      expect(() => validateAndFormatAddress('0xinvalid')).toThrow('Invalid Ethereum address format: 0xinvalid');
      expect(() => validateAndFormatAddress('1234567890')).toThrow('Invalid Ethereum address format: 1234567890');
      expect(() => validateAndFormatAddress('')).toThrow('Address is required');
    });

    it('throws explicit error for incorrect length', () => {
      expect(() => validateAndFormatAddress('0x12345')).toThrow('Invalid Ethereum address format: 0x12345');
    });
  });

  describe('TS-03: Pagination & Numeric Clamping', () => {
    it('clamps excessive limit parameter to max 50 items', () => {
      const clamped = sanitizePaginationLimit('500');
      expect(clamped).toBe(50);
    });

    it('uses default limit of 20 when param is missing or invalid', () => {
      expect(sanitizePaginationLimit(null)).toBe(20);
      expect(sanitizePaginationLimit(undefined)).toBe(20);
      expect(sanitizePaginationLimit('abc')).toBe(20);
      expect(sanitizePaginationLimit('0')).toBe(20);
      expect(sanitizePaginationLimit('-10')).toBe(20);
    });

    it('accepts valid limit between 1 and 50', () => {
      expect(sanitizePaginationLimit('10')).toBe(10);
      expect(sanitizePaginationLimit('50')).toBe(50);
    });

    it('sanitizes numeric parameter with fallback', () => {
      expect(sanitizeNumericParam('100', 1)).toBe(100);
      expect(sanitizeNumericParam('invalid', 5)).toBe(5);
      expect(sanitizeNumericParam(null, 10)).toBe(10);
    });
  });
});
