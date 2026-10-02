import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useAcceptOffer } from '@/hooks/transactions/useAcceptOffer';
import { BorrowConfirmationModal } from '@/components/borrow/BorrowConfirmationModal';

const mockSimulateContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockReadContract = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x2222222222222222222222222222222222222222',
    isConnected: true,
    chainId: 46630,
  }),
  usePublicClient: () => ({
    simulateContract: mockSimulateContract,
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
    readContract: mockReadContract,
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

describe('TICKET-47: Accept Offer Transaction Flow Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadContract.mockResolvedValue(true);
    mockSimulateContract.mockResolvedValue({ request: {} });
    mockWriteContract.mockResolvedValue('0x8888888888888888888888888888888888888888888888888888888888888888');
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: 12350n });
  });

  it('TS-01: Happy path executes acceptOffer atomically when NFT is already approved', async () => {
    const { result } = renderHook(() => useAcceptOffer());

    let txHash: `0x${string}` | null = null;
    await act(async () => {
      txHash = await result.current.acceptOffer({
        offerId: 1,
        tokenId: '42',
        collectionAddress: '0x7Bd29408F11D2bFC23c34f18275bBf23bB716Bc7',
      });
    });

    expect(txHash).toBe('0x8888888888888888888888888888888888888888888888888888888888888888');
    expect(mockSimulateContract).toHaveBeenCalledTimes(1);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(result.current.state.stage).toBe('SUCCESS');
  });

  it('TS-02: Handles approval check and executes approveNFT before loan acceptance', async () => {
    mockReadContract.mockResolvedValue(false);
    const { result } = renderHook(() => useAcceptOffer());

    let isApproved = true;
    await act(async () => {
      isApproved = await result.current.checkIsApproved({
        collectionAddress: '0x7Bd29408F11D2bFC23c34f18275bBf23bB716Bc7',
        tokenId: '42',
      });
    });
    expect(isApproved).toBe(false);

    let approveHash: `0x${string}` | null = null;
    await act(async () => {
      approveHash = await result.current.approveNFT({
        collectionAddress: '0x7Bd29408F11D2bFC23c34f18275bBf23bB716Bc7',
      });
    });
    expect(approveHash).toBe('0x8888888888888888888888888888888888888888888888888888888888888888');
  });

  it('TS-03: BorrowConfirmationModal displays NFT collateral, total due, and triggers callbacks', () => {
    const mockConfirm = vi.fn();
    const mockApprove = vi.fn();
    const mockClose = vi.fn();

    const { rerender } = render(
      <BorrowConfirmationModal
        isOpen={true}
        nftName="Robinhood Hoodies #42"
        tokenId="42"
        collectionName="Robinhood Hoodies"
        principalEth="2.000"
        totalDueEth="2.100"
        durationDays={7}
        isApproved={false}
        onApprove={mockApprove}
        onConfirm={mockConfirm}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Robinhood Hoodies #42')).toBeDefined();
    expect(screen.getByText(/\+?2\.000 ETH/)).toBeDefined();
    expect(screen.getByText(/2\.100 ETH/)).toBeDefined();
    expect(screen.getByRole('button', { name: /approve nft/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /approve nft/i }));
    expect(mockApprove).toHaveBeenCalledTimes(1);

    rerender(
      <BorrowConfirmationModal
        isOpen={true}
        nftName="Robinhood Hoodies #42"
        tokenId="42"
        collectionName="Robinhood Hoodies"
        principalEth="2.000"
        totalDueEth="2.100"
        durationDays={7}
        isApproved={true}
        onApprove={mockApprove}
        onConfirm={mockConfirm}
        onClose={mockClose}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /confirm & accept loan/i });
    fireEvent.click(confirmBtn);
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });
});
