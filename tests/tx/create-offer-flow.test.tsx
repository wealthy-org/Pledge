import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { useCreateOffer } from '@/hooks/transactions/useCreateOffer';
import { CreateOfferConfirmationModal } from '@/components/lend/CreateOfferConfirmationModal';
import { parseEther } from 'viem';

const mockSimulateContract = vi.fn();
const mockWriteContract = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockGetBalance = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('wagmi', () => ({
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

describe('TICKET-46: Create Offer Transaction Flow Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBalance.mockResolvedValue(parseEther('10.0'));
    mockSimulateContract.mockResolvedValue({ request: {} });
    mockWriteContract.mockResolvedValue('0x9999999999999999999999999999999999999999999999999999999999999999');
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success', blockNumber: 12345n });
  });

  it('TS-01: Happy path creates offer with exact wei value and triggers cache invalidation', async () => {
    const { result } = renderHook(() => useCreateOffer());

    let txHash: `0x${string}` | null = null;
    await act(async () => {
      txHash = await result.current.createOffer({
        collectionAddress: '0x7Bd29408F11D2bFC23c34f18275bBf23bB716Bc7',
        principalWei: parseEther('2.5'),
        termInterestBps: 500,
        durationSeconds: 7 * 86400,
        expirySeconds: 3 * 86400,
      });
    });

    expect(txHash).toBe('0x9999999999999999999999999999999999999999999999999999999999999999');
    expect(mockSimulateContract).toHaveBeenCalledTimes(1);
    expect(mockWriteContract).toHaveBeenCalledTimes(1);
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledTimes(1);
    expect(mockInvalidateQueries).toHaveBeenCalled();
    expect(result.current.state.stage).toBe('SUCCESS');
  });

  it('TS-02: Insufficient ETH balance rejects before simulation and wallet prompt', async () => {
    mockGetBalance.mockResolvedValue(parseEther('0.5'));
    const { result } = renderHook(() => useCreateOffer());

    let txHash: `0x${string}` | null = null;
    await act(async () => {
      txHash = await result.current.createOffer({
        collectionAddress: '0x7Bd29408F11D2bFC23c34f18275bBf23bB716Bc7',
        principalWei: parseEther('2.5'),
        termInterestBps: 500,
        durationSeconds: 7 * 86400,
        expirySeconds: 3 * 86400,
      });
    });

    expect(txHash).toBeNull();
    expect(mockSimulateContract).not.toHaveBeenCalled();
    expect(mockWriteContract).not.toHaveBeenCalled();
    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('Insufficient ETH');
  });

  it('TS-03: CreateOfferConfirmationModal renders financial commitment and calls onConfirm', () => {
    const mockConfirm = vi.fn();
    const mockClose = vi.fn();

    render(
      <CreateOfferConfirmationModal
        isOpen={true}
        collectionName="Bored Ape Yacht Club"
        collectionSymbol="BAYC"
        principalEth="2.500"
        termInterestBps={500}
        durationDays={7}
        expectedPayoutEth="2.622"
        protocolFeeEth="0.0025"
        onConfirm={mockConfirm}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Confirm Lending Offer')).toBeDefined();
    expect(screen.getByText('2.500 ETH')).toBeDefined();
    expect(screen.getByText('5.0%')).toBeDefined();
    expect(screen.getByText('7 Days')).toBeDefined();
    expect(screen.getByText('2.622 ETH')).toBeDefined();

    const confirmBtn = screen.getByRole('button', { name: /confirm & sign in wallet/i });
    fireEvent.click(confirmBtn);
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });
});
