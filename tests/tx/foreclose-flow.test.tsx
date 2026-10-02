import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useForecloseLoan } from '@/hooks/transactions/useForecloseLoan';
import { ForecloseConfirmationModal } from '@/components/loan/ForecloseConfirmationModal';

const mockSimulateContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockInvalidateQueries = vi.fn();

const mockLenderAddress = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
const mockCustomDestination = '0x8888888888888888888888888888888888888888';

vi.mock('wagmi', () => ({
  useConnection: () => ({
    address: mockLenderAddress,
    isConnected: true,
    chainId: 46630,
  }),
  useAccount: () => ({
    address: mockLenderAddress,
    isConnected: true,
    chainId: 46630,
  }),
  usePublicClient: () => ({
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
    invalidateAll: mockInvalidateQueries,
    invalidateOffers: vi.fn(),
    invalidateLoans: vi.fn(),
    invalidatePortfolio: vi.fn(),
  }),
}));

describe('TICKET-49: Foreclose Loan Transaction Flow Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSimulateContract.mockResolvedValue({ request: {} });
    mockWriteContract.mockResolvedValue('0x5555555555555555555555555555555555555555555555555555555555555555');
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: 12500n });
  });

  it('TS-01: Happy Path executes foreclose transaction after due date to destination address', async () => {
    const { result } = renderHook(() => useForecloseLoan());

    const pastDueAt = new Date(Date.now() - 3600000).toISOString();

    let txHash: `0x${string}` | null = null;
    await act(async () => {
      txHash = await result.current.forecloseLoan({
        loanId: 42,
        lender: mockLenderAddress,
        dueAt: pastDueAt,
        destination: mockCustomDestination,
        status: 'active',
      });
    });

    expect(txHash).toBe('0x5555555555555555555555555555555555555555555555555555555555555555');
    expect(mockSimulateContract).toHaveBeenCalledTimes(1);
    expect(mockSimulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'foreclose',
        args: [42n, mockCustomDestination],
      })
    );
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'foreclose',
        args: [42n, mockCustomDestination],
      })
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(result.current.state.stage).toBe('SUCCESS');
  });

  it('TS-02: Rejects transaction if caller is not the recorded lender', async () => {
    const { result } = renderHook(() => useForecloseLoan());

    const pastDueAt = new Date(Date.now() - 3600000).toISOString();
    const unauthorizedLender = '0x9999999999999999999999999999999999999999';

    await act(async () => {
      try {
        await result.current.forecloseLoan({
          loanId: 42,
          lender: unauthorizedLender,
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
    expect(result.current.state.error).toContain('Unauthorized');
  });

  it('TS-03: Rejects transaction if loan is not yet overdue', async () => {
    const { result } = renderHook(() => useForecloseLoan());

    const futureDueAt = new Date(Date.now() + 86400000).toISOString();

    await act(async () => {
      try {
        await result.current.forecloseLoan({
          loanId: 42,
          lender: mockLenderAddress,
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
    expect(result.current.state.error).toContain('not overdue');
  });

  it('TS-04: Rejects transaction if destination is invalid or zero address', async () => {
    const { result } = renderHook(() => useForecloseLoan());

    const pastDueAt = new Date(Date.now() - 3600000).toISOString();

    await act(async () => {
      try {
        await result.current.forecloseLoan({
          loanId: 42,
          lender: mockLenderAddress,
          dueAt: pastDueAt,
          destination: '0x0000000000000000000000000000000000000000',
          status: 'active',
        });
      } catch {
        // Expected
      }
    });

    expect(mockSimulateContract).not.toHaveBeenCalled();
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('Invalid destination');
  });

  it('TS-05: ForecloseConfirmationModal renders destination input, warning, and handles confirm', () => {
    const mockConfirm = vi.fn();
    const mockClose = vi.fn();
    const mockDestinationChange = vi.fn();

    render(
      <ForecloseConfirmationModal
        isOpen={true}
        loanId={42}
        nftName="Robinhood Hoodies #10"
        collectionName="Robinhood Hoodies"
        tokenId="10"
        destinationAddress={mockLenderAddress}
        onDestinationChange={mockDestinationChange}
        onConfirm={mockConfirm}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Foreclose Collateral #42')).toBeDefined();
    expect(screen.getByText('Robinhood Hoodies #10')).toBeDefined();
    expect(screen.getByDisplayValue(mockLenderAddress)).toBeDefined();

    const input = screen.getByDisplayValue(mockLenderAddress);
    fireEvent.change(input, { target: { value: mockCustomDestination } });
    expect(mockDestinationChange).toHaveBeenCalledWith(mockCustomDestination);

    const confirmBtn = screen.getByRole('button', { name: /confirm & claim collateral/i });
    fireEvent.click(confirmBtn);
    expect(mockConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
