import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { ApiErrorResponse } from '@/types/api';

export function jsonResponse<T>(data: T, status = 200, indexedBlock = 120): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      'X-Indexed-Block': indexedBlock.toString(),
      'X-Indexer-Status': 'synced',
    },
  });
}

export function errorResponse(error: string, code: string, status: number): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error,
      code,
      status,
    },
    { status }
  );
}

export function validateAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return isAddress(address, { strict: false });
}
