import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';

describe('Transaction Flow Timeout & Error Boundary Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TS-01: handles receipt timeout gracefully without losing txHash', async () => {
    const { result } = renderHook(() => useTransactionFlow());
    const mockHash = '0x1111222233334444555566667777888899990000111122223333444455556666';

    let executedHash: `0x${string}` | null = null;
    await act(async () => {
      executedHash = await result.current.executeTransaction({
        title: 'Lend ETH',
        write: async () => mockHash,
        waitForReceipt: async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
        },
        receiptTimeoutMs: 50,
      });
    });

    expect(executedHash).toBeNull();
    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.errorCode).toBe('RECEIPT_TIMEOUT');
    expect(result.current.state.txHash).toBe(mockHash);
    expect(result.current.state.actionHint).toContain('block explorer');
  });

  it('TS-02: reportFailure sets error state cleanly from outside executeTransaction', () => {
    const { result } = renderHook(() => useTransactionFlow());

    act(() => {
      result.current.reportFailure(new Error('Pre-flight validation failed: Invalid NFT ID'), 'Borrow Action');
    });

    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('Pre-flight validation failed');
    expect(result.current.state.title).toBe('Borrow Action');
  });
});
