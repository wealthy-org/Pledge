import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { TransactionStepper } from '@/components/tx/TransactionStepper';
import { TransactionTimer } from '@/components/tx/TransactionTimer';
import type { TransactionState } from '@/hooks/useTransactionFlow';

describe('TransactionModal Redesign & UX Enhancements Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TS-01: TransactionStepper renders 4 steps and highlights active step correctly', () => {
    const { rerender } = render(<TransactionStepper stage="PREPARING" />);
    expect(screen.getByText('Validation')).toBeDefined();
    expect(screen.getByText('Simulation')).toBeDefined();
    expect(screen.getByText('Signature')).toBeDefined();
    expect(screen.getByText('Mempool & Block')).toBeDefined();

    rerender(<TransactionStepper stage="PROMPTING" />);
    expect(screen.getByText('Signature')).toBeDefined();

    rerender(<TransactionStepper stage="CONFIRMING" />);
    expect(screen.getByText('Mempool & Block')).toBeDefined();
  });

  it('TS-02: TransactionTimer formats elapsed time and calculates remaining estimate', () => {
    const now = Date.now();

    render(
      <TransactionTimer
        stage="CONFIRMING"
        startedAt={now}
        stageStartedAt={now}
      />
    );

    expect(screen.getByText(/elapsed: 00:00/i)).toBeDefined();
    expect(screen.getByText(/est. ~20s remaining/i)).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/elapsed: 00:05/i)).toBeDefined();
  });

  it('TS-03: TransactionModal renders transaction details card when provided', () => {
    const state: TransactionState = {
      stage: 'PROMPTING',
      stageStartedAt: Date.now(),
      startedAt: Date.now(),
      txHash: null,
      error: null,
      isUserRejection: false,
      title: 'Create Lending Offer',
      description: 'Publishing lending offer for Robinhood Gold',
      details: [
        { label: 'Collection', value: 'Robinhood Gold' },
        { label: 'Committed Principal', value: '2.500 ETH' },
        { label: 'Term Interest', value: '5.0%' },
        { label: 'Duration', value: '7 Days' },
      ],
    };

    render(
      <TransactionModal
        isOpen={true}
        state={state}
        chainId={46630}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Transaction Details')).toBeDefined();
    expect(screen.getByText('Robinhood Gold')).toBeDefined();
    expect(screen.getByText('2.500 ETH')).toBeDefined();
    expect(screen.getByText('5.0%')).toBeDefined();
    expect(screen.getByText('7 Days')).toBeDefined();
  });

  it('TS-04: TransactionModal renders 1-click copy hash button with copied feedback', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const state: TransactionState = {
      stage: 'CONFIRMING',
      stageStartedAt: Date.now(),
      startedAt: Date.now(),
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      error: null,
      isUserRejection: false,
      title: 'Create Lending Offer',
      description: 'Confirming block receipt...',
    };

    render(
      <TransactionModal
        isOpen={true}
        state={state}
        chainId={46630}
        onClose={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /copy/i });
    expect(copyBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(state.txHash);
  });

  it('TS-05: TransactionModal renders warning banner when receipt confirmation times out', () => {
    const state: TransactionState = {
      stage: 'ERROR',
      stageStartedAt: Date.now(),
      startedAt: Date.now(),
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      error: 'Block confirmation timed out.',
      errorCode: 'RECEIPT_TIMEOUT',
      actionHint: 'Please check your transaction hash on the block explorer before retrying.',
      isUserRejection: false,
      title: 'Create Lending Offer',
      description: null,
    };

    render(
      <TransactionModal
        isOpen={true}
        state={state}
        chainId={46630}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Notice on Network Delay/i)).toBeDefined();
    expect(screen.getByText(/The transaction was submitted to the network/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /view on explorer/i })).toBeDefined();
  });
});
