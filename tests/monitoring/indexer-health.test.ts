import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/route';

const mockGetBlockNumber = vi.fn();
const mockSupabaseSelect = vi.fn();

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSupabaseSelect,
        }),
      }),
    }),
  }),
}));

vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: () => ({
      getBlockNumber: mockGetBlockNumber,
    }),
  };
});

describe('TICKET-55b: Indexer Health & Observability Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as unknown as Response);
  });

  it('TS-01: Returns HTTP 200 and status ok when indexer is fully synced (lag <= 20 blocks)', async () => {
    mockGetBlockNumber.mockResolvedValue(1000n);
    mockSupabaseSelect.mockResolvedValue({
      data: { last_indexed_block: 995 },
      error: null,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(json.lagBlocks).toBe(5);
    expect(json.latestRpcBlock).toBe(1000);
    expect(json.lastIndexedBlock).toBe(995);
  });

  it('TS-02: Returns HTTP 503 and status lagging when indexer lag exceeds threshold (> 20 blocks)', async () => {
    mockGetBlockNumber.mockResolvedValue(1050n);
    mockSupabaseSelect.mockResolvedValue({
      data: { last_indexed_block: 1000 },
      error: null,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.status).toBe('lagging');
    expect(json.lagBlocks).toBe(50);
    expect(json.latestRpcBlock).toBe(1050);
    expect(json.lastIndexedBlock).toBe(1000);
  });

  it('TS-03: Sends alert payload when webhook URL is configured and lag is detected', async () => {
    process.env.ALERT_WEBHOOK_URL = 'https://discord.com/api/webhooks/dummy';
    mockGetBlockNumber.mockResolvedValue(1100n);
    mockSupabaseSelect.mockResolvedValue({
      data: { last_indexed_block: 1000 },
      error: null,
    });

    const response = await GET();
    expect(response.status).toBe(503);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/dummy',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    delete process.env.ALERT_WEBHOOK_URL;
  });

  it('TS-04: Gracefully handles missing database checkpoint without throwing unhandled rejection', async () => {
    mockGetBlockNumber.mockResolvedValue(1000n);
    mockSupabaseSelect.mockResolvedValue({
      data: null,
      error: { message: 'Row not found' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe('initializing');
    expect(json.latestRpcBlock).toBe(1000);
  });
});
