import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/nft-image/route';
import * as orchestratorModule from '@/lib/nft-image';

describe('GET /api/nft-image Route Handler', () => {
  const validContract = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const tokenId = '9124';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 if contract is missing or invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/nft-image?tokenId=1');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Invalid or missing contract address');
  });

  it('returns 400 if tokenId is missing', async () => {
    const req = new NextRequest(`http://localhost:3000/api/nft-image?contract=${validContract}`);
    const res = await GET(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Missing tokenId parameter');
  });

  it('returns 200 with resolved image data on valid request', async () => {
    vi.spyOn(orchestratorModule, 'resolveNftImage').mockResolvedValue({
      url: 'https://gateway.pinata.cloud/ipfs/bafytest',
      source: 'gondi-cdn',
      isFallback: false,
      rawUri: 'ipfs://bafytest',
    });

    const req = new NextRequest(`http://localhost:3000/api/nft-image?contract=${validContract}&tokenId=${tokenId}`);
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.url).toBe('https://gateway.pinata.cloud/ipfs/bafytest');
    expect(data.source).toBe('gondi-cdn');
    expect(data.isFallback).toBe(false);
  });

  it('returns fallback 200 even if orchestrator throws unexpected error', async () => {
    vi.spyOn(orchestratorModule, 'resolveNftImage').mockRejectedValue(new Error('Unexpected crash'));

    const req = new NextRequest(`http://localhost:3000/api/nft-image?contract=${validContract}&tokenId=${tokenId}`);
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.source).toBe('generative');
    expect(data.isFallback).toBe(true);
  });
});
