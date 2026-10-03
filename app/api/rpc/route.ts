import { NextRequest, NextResponse } from 'next/server';
import { TESTNET_CHAIN_ID } from '@/config/chains';

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method: string;
  params?: unknown[];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
        },
      },
      { status: 400 }
    );
  }

  const upstreamRpc =
    process.env.INTERNAL_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'https://rpc.testnet.chain.robinhood.com';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const upstreamResponse = await fetch(upstreamRpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (upstreamResponse.ok) {
      const upstreamJson = await upstreamResponse.json();
      return NextResponse.json(upstreamJson, { status: 200 });
    }

    if (Array.isArray(body)) {
      const errors = body.map((item: JsonRpcRequest) => ({
        jsonrpc: '2.0',
        id: item?.id ?? null,
        error: {
          code: -32603,
          message: `Upstream RPC responded with HTTP ${upstreamResponse.status}`,
        },
      }));
      return NextResponse.json(errors, { status: 502 });
    }

    const singleReq = body as JsonRpcRequest;
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: singleReq?.id ?? null,
        error: {
          code: -32603,
          message: `Upstream RPC responded with HTTP ${upstreamResponse.status}`,
        },
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Upstream RPC unavailable';

    if (Array.isArray(body)) {
      const errors = body.map((item: JsonRpcRequest) => ({
        jsonrpc: '2.0',
        id: item?.id ?? null,
        error: {
          code: -32603,
          message: `Upstream RPC unavailable: ${errorMsg}`,
        },
      }));
      return NextResponse.json(errors, { status: 502 });
    }

    const singleReq = body as JsonRpcRequest;
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: singleReq?.id ?? null,
        error: {
          code: -32603,
          message: `Upstream RPC unavailable: ${errorMsg}`,
        },
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    chainId: TESTNET_CHAIN_ID,
  });
}
