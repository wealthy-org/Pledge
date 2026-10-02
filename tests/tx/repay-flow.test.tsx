import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useRepayLoan } from '@/hooks/transactions/useRepayLoan';
import { RepayConfirmationModal } from '@/components/loan/RepayConfirmationModal';

const mockSimulateContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockGetBalance = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('wagmi', () => ({
  useConnection: () => ({
    address: '0x1111111111111111111111111111111111111111',
    isConnected: true,
    chainId: 46630,
  }),
  useAccount: () => ({
    address: '0x1111111111111111111111111111111111111111',
    isConnected: true,
    chainId: 46630,
  }),
  usePublicClient: () => ({
    simulateContract: mockSimulateContract,
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
    getBalance: mockGetBalance,
  }),
  useWalletClient: () => ({
    data: {
      writeContract: mockWriteContract,
    },
  }),
}));

vi.mock('@/hooks/api/useInvalidateQueries', () => ({
  useInvalidateProtocolQueries: () => ({
    invalidateAll: mockInvalidateQueries,
    invalidateOffers: vi.fn(),
    invalidateLoans: vi.fn(),
    invalidatePortfolio: vi.fn(),
  }),
}));

describe('TICKET-48: Repay Loan Transaction Flow Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBalance.mockResolvedValue(10000000000000000000n);
    mockSimulateContract.mockResolvedValue({ request: {} });
    mockWriteContract.mockResolvedValue('0x7777777777777777777777777777777777777777777777777777777777777777');
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: 12400n });
  });

  it('TS-01: Happy Path executes repay payable transaction with exact totalDueWei', async () => {
    const { result } = renderHook(() => useRepayLoan());

    const futureDueAt = new Date(Date.now() + 86400000).toISOString();
    const totalDueWei = 1050000000000000000n;

    let txHash: `0x${string}` | null = null;
    await act(async () => {
      txHash = await result.current.repayLoan({
        loanId: 1,
        totalDueWei,
        dueAt: futureDueAt,
        status: 'active',
      });
    });

    expect(txHash).toBe('0x7777777777777777777777777777777777777777777777777777777777777777');
    expect(mockGetBalance).toHaveBeenCalledTimes(1);
    expect(mockSimulateContract).toHaveBeenCalledTimes(1);
    expect(mockSimulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'repay',
        args: [1n],
        value: totalDueWei,
      })
    );
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'repay',
        args: [1n],
        value: totalDueWei,
      })
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(result.current.state.stage).toBe('SUCCESS');
  });

  it('TS-02: Rejects transaction if wallet balance is insufficient for totalDueWei', async () => {
    mockGetBalance.mockResolvedValue(500000000000000000n);
    const { result } = renderHook(() => useRepayLoan());

    const futureDueAt = new Date(Date.now() + 86400000).toISOString();
    const totalDueWei = 1050000000000000000n;

    await act(async () => {
      try {
        await result.current.repayLoan({
          loanId: 1,
          totalDueWei,
          dueAt: futureDueAt,
          status: 'active',
        });
      } catch {
        // Expected
      }
    });

    expect(mockSimulateContract).not.toHaveBeenCalled();
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('Insufficient ETH balance');
  });

  it('TS-03: Rejects transaction if loan is already overdue', async () => {
    const { result } = renderHook(() => useRepayLoan());

    const pastDueAt = new Date(Date.now() - 3600000).toISOString();
    const totalDueWei = 1050000000000000000n;

    await act(async () => {
      try {
        await result.current.repayLoan({
          loanId: 1,
          totalDueWei,
          dueAt: pastDueAt,
          status: 'active',
        });
      } catch {
        // Expected
      }
    });

    expect(mockSimulateContract).not.toHaveBeenCalled();
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('overdue');
  });

  it('TS-04: RepayConfirmationModal displays payment breakdown and handles actions', () => {
    const mockConfirm = vi.fn();
    const mockClose = vi.fn();

    render(
      <RepayConfirmationModal
        isOpen={true}
        loanId={1}
        nftName="Robinhood Hoodies #42"
        collectionName="Robinhood Hoodies"
        tokenId="42"
        principalEth="1.000"
        interestEth="0.050"
        totalDueEth="1.050"
        dueAt={new Date(Date.now() + 86400000).toISOString()}
        onConfirm={mockConfirm}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Repay Loan #1')).toBeDefined();
    expect(screen.getByText('Robinhood Hoodies #42')).toBeDefined();
    expect(screen.getByText('1.050 ETH')).toBeDefined();
    expect(screen.getByText('1.000 ETH')).toBeDefined();
    expect(screen.getByText('0.050 ETH')).toBeDefined();

    const confirmBtn = screen.getByRole('button', { name: /confirm & repay loan/i });
    fireEvent.click(confirmBtn);
    expect(mockConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
