import { isAddress, getAddress } from 'viem';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds: number;
}

export const RATE_LIMIT_STANDARD: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60000,
};

export const RATE_LIMIT_HEAVY: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60000,
};

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests = RATE_LIMIT_STANDARD.maxRequests,
  windowMs = RATE_LIMIT_STANDARD.windowMs
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now >= entry.resetTime) {
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count < maxRequests) {
    entry.count += 1;
    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
      retryAfterSeconds: 0,
    };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));
  return {
    success: false,
    remaining: 0,
    resetTime: entry.resetTime,
    retryAfterSeconds,
  };
}

export function resetRateLimits(): void {
  rateLimitStore.clear();
}

export function validateAndFormatAddress(address: string | null | undefined): `0x${string}` {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    throw new Error('Address is required');
  }

  const trimmed = address.trim();
  if (!isAddress(trimmed, { strict: false })) {
    throw new Error(`Invalid Ethereum address format: ${trimmed}`);
  }

  try {
    return getAddress(trimmed);
  } catch {
    return trimmed.toLowerCase() as `0x${string}`;
  }
}

export function sanitizePaginationLimit(
  limitParam: string | null | undefined,
  maxLimit = 50,
  defaultLimit = 20
): number {
  if (!limitParam || typeof limitParam !== 'string') {
    return defaultLimit;
  }

  const parsed = parseInt(limitParam.trim(), 10);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultLimit;
  }

  if (parsed > maxLimit) {
    return maxLimit;
  }

  return parsed;
}

export function sanitizeNumericParam(
  value: string | null | undefined,
  fallback: number
): number {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const parsed = parseInt(value.trim(), 10);
  if (isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}
