import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useCancelOffer } from '@/hooks/transactions/useCancelOffer';
import { useWithdrawProceeds } from '@/hooks/transactions/useWithdrawProceeds';
import { CancelOfferModal } from '@/components/lend/CancelOfferModal';
import { ClaimableProceedsBanner } from '@/components/portfolio/ClaimableProceedsBanner';

const mockSimulateContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockInvalidateQueries = vi.fn();

const mockUserAddress = '0x02070747E2436d46f56A691F605A7c03332DFe8d';

vi.mock('wagmi', () => ({
  useConnection: () => ({
    address: mockUserAddress,
    isConnected: true,
    chainId: 46630,
  }),
  useAccount: () => ({
    address: mockUserAddress,
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

describe('TICKET-50: Cancel Offer & Withdraw Proceeds Flow Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSimulateContract.mockResolvedValue({ request: {} });
    mockWriteContract.mockResolvedValue('0x3333333333333333333333333333333333333333333333333333333333333333');
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: 12600n });
  });

  it('TS-01: Happy Path executes cancelOffer transaction and invalidates queries', async () => {
    const { result } = renderHook(() => useCancelOffer());

    let txHash: `0x${string}` | null = null;
    await act(async () => {
      txHash = await result.current.cancelOffer({
        offerId: 5,
        principalWei: 1500000000000000000n,
        collectionName: 'Robinhood Hoodies',
      });
    });

    expect(txHash).toBe('0x3333333333333333333333333333333333333333333333333333333333333333');
    expect(mockSimulateContract).toHaveBeenCalledTimes(1);
    expect(mockSimulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'cancelOffer',
        args: [5n],
      })
    );
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'cancelOffer',
        args: [5n],
      })
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(result.current.state.stage).toBe('SUCCESS');
  });

  it('TS-02: Happy Path executes withdrawProceeds pull payment transaction', async () => {
    const { result } = renderHook(() => useWithdrawProceeds());

    let txHash: `0x${string}` | null = null;
    await act(async () => {
      txHash = await result.current.withdrawProceeds({
        claimableWei: '1500000000000000000',
      });
    });

    expect(txHash).toBe('0x3333333333333333333333333333333333333333333333333333333333333333');
    expect(mockSimulateContract).toHaveBeenCalledTimes(1);
    expect(mockSimulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'withdrawProceeds',
      })
    );
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'withdrawProceeds',
      })
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(result.current.state.stage).toBe('SUCCESS');
  });

  it('TS-03: Rejects withdrawProceeds when claimable proceeds balance is zero', async () => {
    const { result } = renderHook(() => useWithdrawProceeds());

    await act(async () => {
      try {
        await result.current.withdrawProceeds({
          claimableWei: '0',
        });
      } catch {
        // Expected
      }
    });

    expect(mockSimulateContract).not.toHaveBeenCalled();
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('No claimable proceeds');
  });

  it('TS-04: CancelOfferModal renders offer details, refund note, and triggers confirmation', () => {
    const mockConfirm = vi.fn();
    const mockClose = vi.fn();

    render(
      <CancelOfferModal
        isOpen={true}
        offerId={5}
        collectionName="Robinhood Hoodies"
        principalEth="1.50"
        onConfirm={mockConfirm}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Cancel Offer #5')).toBeDefined();
    expect(screen.getByText('Robinhood Hoodies')).toBeDefined();
    expect(screen.getByText('1.50 ETH')).toBeDefined();

    const confirmBtn = screen.getByRole('button', { name: /confirm & cancel offer/i });
    fireEvent.click(confirmBtn);
    expect(mockConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /keep offer/i });
    fireEvent.click(cancelBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('TS-05: ClaimableProceedsBanner handles zero and non-zero balances correctly', () => {
    const mockWithdraw = vi.fn();

    const { rerender } = render(
      <ClaimableProceedsBanner
        claimableWei="0"
        onWithdraw={mockWithdraw}
      />
    );

    const withdrawBtn = screen.getByRole('button', { name: /withdraw proceeds/i });
    expect(withdrawBtn.hasAttribute('disabled')).toBe(true);

    rerender(
      <ClaimableProceedsBanner
        claimableWei="1500000000000000000"
        onWithdraw={mockWithdraw}
      />
    );

    const activeWithdrawBtn = screen.getByRole('button', { name: /withdraw proceeds/i });
    expect(activeWithdrawBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(activeWithdrawBtn);
    expect(mockWithdraw).toHaveBeenCalledTimes(1);
  });
});
