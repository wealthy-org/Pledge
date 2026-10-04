import { describe, it, expect, beforeEach } from 'vitest';
import { GET as getActivity } from '@/app/api/activity/route';
import { indexerStore } from '@/lib/indexer/store';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { NextRequest } from 'next/server';

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('Activity API Route with BigInt Serialization & ChainId Filter', () => {
  beforeEach(() => {
    indexerStore.reset();
  });

  it('handles events containing BigInt values without throwing 500 error', async () => {
    indexerStore.insertEventIdempotent({
      chainId: TESTNET_CHAIN_ID,
      contractAddress: '0x1234567890123456789012345678901234567890',
      blockNumber: 12345,
      blockHash: '0xabc',
      txHash: '0xdef',
      logIndex: 0,
      eventType: 'OfferCreated',
      args: {
        offerId: 99n,
        principalWei: 2000000000000000000n,
        termInterestBps: 500n,
        durationSeconds: 604800n,
        expiresAt: 1760000000n,
      },
    });

    const req = createRequest(`http://localhost:3000/api/activity?chainId=${TESTNET_CHAIN_ID}`);
    const res = await getActivity(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('activity');
    expect(Array.isArray(body.activity)).toBe(true);
    expect(body.activity.length).toBe(1);
    expect(body.activity[0].data.offerId).toBe('99');
    expect(body.activity[0].data.principalWei).toBe('2000000000000000000');
  });

  it('handles invalid limit gracefully and defaults to safe limit', async () => {
    const req = createRequest('http://localhost:3000/api/activity?limit=invalid');
    const res = await getActivity(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('activity');
  });
});
