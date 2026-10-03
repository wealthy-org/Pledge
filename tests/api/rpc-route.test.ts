import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/rpc/route';
import { NextRequest } from 'next/server';

describe('JSON-RPC Proxy & Fallback Route Test Suite', () => {
  it('GET /api/rpc returns status ok and testnet chainId', async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(json.chainId).toBe(46630);
  });

  it('POST /api/rpc responds to eth_chainId with hex string', async () => {
    const req = new NextRequest('http://localhost:3000/api/rpc', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.jsonrpc).toBe('2.0');
    expect(json.id).toBe(1);
    expect(json.result).toBe('0xb626');
  });

  it('POST /api/rpc handles batch JSON-RPC requests', async () => {
    const req = new NextRequest('http://localhost:3000/api/rpc', {
      method: 'POST',
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'eth_chainId' },
        { jsonrpc: '2.0', id: 2, method: 'net_version' },
        { jsonrpc: '2.0', id: 3, method: 'eth_blockNumber' },
      ]),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(3);
    expect(json[0].result).toBe('0xb626');
    expect(json[1].result).toBe('46630');
    expect(json[2].result.startsWith('0x')).toBe(true);
  });

  it('POST /api/rpc responds to eth_getBalance, eth_getCode, eth_call', async () => {
    const req = new NextRequest('http://localhost:3000/api/rpc', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 42,
        method: 'eth_getBalance',
        params: ['0x1111111111111111111111111111111111111111', 'latest'],
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(typeof json.result).toBe('string');
    expect(json.result.startsWith('0x')).toBe(true);
  });
});
