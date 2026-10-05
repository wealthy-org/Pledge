import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { getActiveChain } from '@/config/chains';
import { getPledgeLoansAddress } from '@/config/contracts';
import { indexerStore } from '@/lib/indexer/store';

export async function GET(request?: NextRequest) {
  try {
    const url = request ? new URL(request.url) : null;
    const chainIdParam = url?.searchParams.get('chainId');
    const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;
    const chain = getActiveChain(chainId);
    const rpcUrl = chain.rpcUrls.default.http[0];

    if (!rpcUrl) {
      return NextResponse.json(
        {
          status: 'error',
          error: `RPC URL is not configured for chain ID ${chain.id}`,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    let latestRpcBlock = 0n;
    try {
      const publicClient = createPublicClient({
        chain,
        transport: http(rpcUrl, { timeout: 4000 }),
      });
      latestRpcBlock = await publicClient.getBlockNumber();
    } catch {
      latestRpcBlock = 0n;
    }

    const contractAddress = getPledgeLoansAddress(chain.id);
    const checkpoint = indexerStore.getCheckpoint(chain.id, contractAddress);
    const lastIndexedBlock: number | null = checkpoint ? checkpoint.last_block_number : null;

    if (lastIndexedBlock === null) {
      return NextResponse.json(
        {
          status: 'initializing',
          chainId: chain.id,
          latestRpcBlock: Number(latestRpcBlock),
          lastIndexedBlock: null,
          lagBlocks: 0,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const lagBlocks = Math.max(0, Number(latestRpcBlock) - lastIndexedBlock);
    const isLagging = lagBlocks > 20;

    if (isLagging && process.env.ALERT_WEBHOOK_URL) {
      try {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `[ALERT] **Pledge Indexer Lag Alert**\n- Chain ID: \`${chain.id}\`\n- Latest RPC Block: \`${Number(latestRpcBlock)}\`\n- Last Indexed Block: \`${lastIndexedBlock}\`\n- Lag: \`${lagBlocks} blocks\`\n- Timestamp: \`${new Date().toISOString()}\``,
          }),
        });
      } catch {}
    }

    if (isLagging) {
      return NextResponse.json(
        {
          status: 'lagging',
          chainId: chain.id,
          latestRpcBlock: Number(latestRpcBlock),
          lastIndexedBlock,
          lagBlocks,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        chainId: chain.id,
        latestRpcBlock: Number(latestRpcBlock),
        lastIndexedBlock,
        lagBlocks,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown health check error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
