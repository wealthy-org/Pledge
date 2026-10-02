import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { TransactionToast } from '@/components/tx/TransactionToast';

describe('TICKET-45: Shared Transaction UX Framework Test Suite', () => {
  it('TS-01: Happy path FSM transitions from IDLE -> SUCCESS', async () => {
    const { result } = renderHook(() => useTransactionFlow());

    expect(result.current.state.stage).toBe('IDLE');
    expect(result.current.state.txHash).toBeNull();
    expect(result.current.state.error).toBeNull();

    const mockPrepare = vi.fn().mockResolvedValue(undefined);
    const mockSimulate = vi.fn().mockResolvedValue(undefined);
    const mockWrite = vi.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as `0x${string}`);
    const mockWaitForReceipt = vi.fn().mockResolvedValue({ status: 'success' });
    const mockOnSuccess = vi.fn();

    let txPromise: Promise<unknown>;
    act(() => {
      txPromise = result.current.executeTransaction({
        title: 'Create Lending Offer',
        description: 'Creating a 5 ETH offer on Bored Apes',
        prepare: mockPrepare,
        simulate: mockSimulate,
        write: mockWrite,
        waitForReceipt: mockWaitForReceipt,
        onSuccess: mockOnSuccess,
      });
    });

    await act(async () => {
      await txPromise;
    });

    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockSimulate).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenCalledTimes(1);
    expect(mockWaitForReceipt).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledWith('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    expect(result.current.state.stage).toBe('SUCCESS');
    expect(result.current.state.txHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
  });

  it('TS-02: Simulation error halts flow before wallet prompt and enters ERROR stage', async () => {
    const { result } = renderHook(() => useTransactionFlow());

    const mockSimulate = vi.fn().mockRejectedValue(new Error('Execution reverted: Insufficient collateral'));
    const mockWrite = vi.fn();

    await act(async () => {
      await result.current.executeTransaction({
        title: 'Accept Offer',
        simulate: mockSimulate,
        write: mockWrite,
      });
    });

    expect(mockSimulate).toHaveBeenCalledTimes(1);
    expect(mockWrite).not.toHaveBeenCalled();
    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.error).toContain('Insufficient collateral');
    expect(result.current.state.isUserRejection).toBe(false);
  });

  it('TS-03: User rejection in wallet prompt flags isUserRejection', async () => {
    const { result } = renderHook(() => useTransactionFlow());

    const mockWrite = vi.fn().mockRejectedValue(new Error('User rejected the request.'));

    await act(async () => {
      await result.current.executeTransaction({
        title: 'Repay Loan',
        write: mockWrite,
      });
    });

    expect(result.current.state.stage).toBe('ERROR');
    expect(result.current.state.isUserRejection).toBe(true);
    expect(result.current.state.error).toContain('Transaction rejected by user');
  });

  it('TS-04: reset() restores state machine to initial IDLE stage', async () => {
    const { result } = renderHook(() => useTransactionFlow());

    await act(async () => {
      await result.current.executeTransaction({
        title: 'Cancel Offer',
        write: vi.fn().mockRejectedValue(new Error('Random failure')),
      });
    });

    expect(result.current.state.stage).toBe('ERROR');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.stage).toBe('IDLE');
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.txHash).toBeNull();
  });

  it('TS-05: TransactionModal renders active state, spinner, hash link, and dismiss actions', () => {
    const mockClose = vi.fn();
    const { rerender } = render(
      <TransactionModal
        isOpen={true}
        state={{
          stage: 'PENDING',
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          error: null,
          isUserRejection: false,
          title: 'Repaying Loan #42',
          description: 'Waiting for network confirmation...',
        }}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Repaying Loan #42')).toBeDefined();
    expect(screen.getByText(/Waiting for network confirmation/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /view on explorer/i })).toBeDefined();

    rerender(
      <TransactionModal
        isOpen={true}
        state={{
          stage: 'SUCCESS',
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          error: null,
          isUserRejection: false,
          title: 'Repaying Loan #42',
          description: 'Loan successfully repaid!',
        }}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Transaction Confirmed')).toBeDefined();
    const doneBtn = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('TS-06: TransactionToast renders toast notifications for background status updates', () => {
    const mockDismiss = vi.fn();
    render(
      <TransactionToast
        state={{
          stage: 'PENDING',
          txHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
          error: null,
          isUserRejection: false,
          title: 'Foreclose Loan #12',
          description: 'Broadcasting to network',
        }}
        onDismiss={mockDismiss}
      />
    );

    expect(screen.getByText('Foreclose Loan #12')).toBeDefined();
    expect(screen.getByText(/Broadcasting to network/i)).toBeDefined();
  });
});
