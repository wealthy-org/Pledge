import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRepayLoan } from '@/hooks/transactions/useRepayLoan';
import { useForecloseLoan } from '@/hooks/transactions/useForecloseLoan';
import { decodeTxError } from '@/lib/tx/errorDecoder';

const mockGetBalance = vi.fn();
const mockSimulateContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    isConnected: true,
    chainId: 46630,
  }),
  usePublicClient: () => ({
    getBalance: mockGetBalance,
    simulateContract: mockSimulateContract,
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
  }),
  useWalletClient: () => ({
    data: {
      writeContract: mockWriteContract,
    },
  }),
}));

vi.mock('@/hooks/api/useInvalidateQueries', () => ({
  useInvalidateProtocolQueries: () => ({
    invalidateAll: vi.fn(),
  }),
}));

describe('TICKET-53: Negative Scenarios and Error Path Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBalance.mockResolvedValue(1000000000000000000n);
  });

  it('TS-01: blocks repayment if dueAt timestamp is in the past', async () => {
    const { result } = renderHook(() => useRepayLoan());
    const pastTimestamp = Date.now() - 10000;

    await act(async () => {
      try {
        await result.current.repayLoan({
          loanId: 1,
          totalDueWei: 1000000000000000000n,
          dueAt: pastTimestamp,
          status: 'active',
        });
      } catch {
        // Expected
      }
    });

    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('repayment deadline has passed');
  });

  it('TS-02: blocks foreclosure if dueAt timestamp has not passed yet', async () => {
    const { result } = renderHook(() => useForecloseLoan());
    const futureTimestamp = Date.now() + 100000000;

    await act(async () => {
      try {
        await result.current.forecloseLoan({
          loanId: 1,
          lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
          dueAt: futureTimestamp,
          destination: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
          status: 'active',
        });
      } catch {
        // Expected
      }
    });

    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('Loan is not overdue');
  });

  it('TS-03: blocks foreclosure if non-lender wallet attempts call', async () => {
    const { result } = renderHook(() => useForecloseLoan());
    const pastTimestamp = Date.now() - 10000;

    await act(async () => {
      try {
        await result.current.forecloseLoan({
          loanId: 1,
          lender: '0x9999999999999999999999999999999999999999',
          dueAt: pastTimestamp,
          destination: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
          status: 'active',
        });
      } catch {
        // Expected
      }
    });

    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('Unauthorized');
  });

  it('TS-04: decodes custom contract error OfferNotOpen cleanly for UI display', () => {
    const decoded = decodeTxError(new Error('PledgeLoans: OfferNotOpen()'));
    expect(decoded.code).toBe('OfferNotOpen');
    expect(decoded.message).toContain('no longer open');
    expect(decoded.actionHint).toBeDefined();
    expect(decoded.isSilent).toBe(false);
  });

  it('TS-05: decodes custom contract error LoanOverdue cleanly for UI display', () => {
    const decoded = decodeTxError(new Error('PledgeLoans: LoanOverdue()'));
    expect(decoded.code).toBe('LoanOverdue');
    expect(decoded.message).toContain('Loan is overdue');
    expect(decoded.actionHint).toBeDefined();
  });
});
