import { NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { ApiErrorResponse } from '@/types/api';

export function serializeBigInts(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeBigInts);
  }
  if (typeof value === 'object') {
    const serializedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      serializedObj[k] = serializeBigInts(v);
    }
    return serializedObj;
  }
  return value;
}

export function jsonResponse<T>(data: T, status = 200, indexedBlock = 120): NextResponse<T> {
  const safeData = serializeBigInts(data) as T;
  return NextResponse.json(safeData, {
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
