import { NextRequest, NextResponse } from 'next/server';
import { TESTNET_CHAIN_ID } from '@/config/chains';

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method: string;
  params?: unknown[];
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

function handleSingleRpcMethod(req: JsonRpcRequest): JsonRpcResponse {
  const id = req.id !== undefined ? req.id : null;
  const method = req.method;

  switch (method) {
    case 'eth_chainId':
      return {
        jsonrpc: '2.0',
        id,
        result: `0x${TESTNET_CHAIN_ID.toString(16)}`,
      };

    case 'net_version':
      return {
        jsonrpc: '2.0',
        id,
        result: TESTNET_CHAIN_ID.toString(),
      };

    case 'eth_blockNumber':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x100000',
      };

    case 'eth_getBalance':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x0',
      };

    case 'eth_getCode':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x',
      };

    case 'eth_call':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x',
      };

    case 'eth_estimateGas':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x5208',
      };

    case 'eth_gasPrice':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x3b9aca00',
      };

    case 'eth_maxPriorityFeePerGas':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x3b9aca00',
      };

    case 'eth_feeHistory':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          oldestBlock: '0x100000',
          baseFeePerGas: ['0x3b9aca00', '0x3b9aca00'],
          gasUsedRatio: [0.5],
          reward: [['0x3b9aca00']],
        },
      };

    case 'eth_getBlockByNumber':
    case 'eth_getBlockByHash':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          number: '0x100000',
          hash: '0x' + '1'.repeat(64),
          parentHash: '0x' + '0'.repeat(64),
          timestamp: '0x65000000',
          transactions: [],
          gasLimit: '0x1c9c380',
          gasUsed: '0x0',
          baseFeePerGas: '0x3b9aca00',
        },
      };

    case 'eth_getTransactionCount':
      return {
        jsonrpc: '2.0',
        id,
        result: '0x0',
      };

    case 'eth_getTransactionByHash':
    case 'eth_getTransactionReceipt':
      return {
        jsonrpc: '2.0',
        id,
        result: null,
      };

    case 'eth_accounts':
      return {
        jsonrpc: '2.0',
        id,
        result: [],
      };

    case 'eth_syncing':
      return {
        jsonrpc: '2.0',
        id,
        result: false,
      };

    case 'web3_clientVersion':
      return {
        jsonrpc: '2.0',
        id,
        result: 'PledgeMockRPC/v1.0.0',
      };

    default:
      return {
        jsonrpc: '2.0',
        id,
        result: null,
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstreamRpc = process.env.INTERNAL_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    const isBrokenRobinhood = upstreamRpc?.includes('testnet.robinhood.com');

    if (upstreamRpc && !isBrokenRobinhood && !upstreamRpc.startsWith('/')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
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
      } catch {
      }
    }

    if (Array.isArray(body)) {
      const responses = body.map((r: JsonRpcRequest) => handleSingleRpcMethod(r));
      return NextResponse.json(responses, { status: 200 });
    }

    const response = handleSingleRpcMethod(body as JsonRpcRequest);
    return NextResponse.json(response, { status: 200 });
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
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    chainId: TESTNET_CHAIN_ID,
    client: 'PledgeMockRPC/v1.0.0',
  });
}
