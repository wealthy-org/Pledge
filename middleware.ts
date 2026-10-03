import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RATE_LIMIT_STANDARD, RATE_LIMIT_RPC } from '@/lib/api/security';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/')) {
    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();
    const limitConfig = pathname.startsWith('/api/rpc') ? RATE_LIMIT_RPC : RATE_LIMIT_STANDARD;
    const rateLimit = checkRateLimit(ip, limitConfig.maxRequests, limitConfig.windowMs);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many requests, please slow down',
          code: 'RATE_LIMIT_EXCEEDED',
          status: 429,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfterSeconds.toString(),
            'X-RateLimit-Limit': limitConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limitConfig.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
