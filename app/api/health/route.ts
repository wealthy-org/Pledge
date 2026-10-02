import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { getActiveChain } from '@/config/chains';
import { getSupabaseClient } from '@/lib/db/supabase';

export async function GET() {
  const chain = getActiveChain();
  const rpcUrl = chain.rpcUrls.default.http[0] || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.robinhood.com';

  let latestRpcBlock = 0n;
  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
    latestRpcBlock = await publicClient.getBlockNumber();
  } catch {
    latestRpcBlock = 0n;
  }

  const supabase = getSupabaseClient();
  let lastIndexedBlock: number | null = null;

  try {
    const res = await supabase
      .from('indexer_checkpoints')
      .select('last_indexed_block')
      .eq('chain_id', chain.id)
      .single() as { data: { last_indexed_block: number } | null };

    if (res.data && typeof res.data.last_indexed_block === 'number') {
      lastIndexedBlock = res.data.last_indexed_block;
    }
  } catch {
    lastIndexedBlock = null;
  }

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
          content: `⚠️ **Pledge Indexer Lag Alert**\n- Chain ID: \`${chain.id}\`\n- Latest RPC Block: \`${Number(latestRpcBlock)}\`\n- Last Indexed Block: \`${lastIndexedBlock}\`\n- Lag: \`${lagBlocks} blocks\`\n- Timestamp: \`${new Date().toISOString()}\``,
        }),
      });
    } catch {
      // Gracefully ignore webhook dispatch errors
    }
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
}
