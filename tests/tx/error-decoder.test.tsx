import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { decodeTxError } from '@/lib/tx/errorDecoder';
import { ErrorModal } from '@/components/modals/ErrorModal';

describe('TICKET-51: Transaction Error Decoder & Edge Case Suite', () => {
  it('TS-01: Decodes contract custom errors correctly into user-friendly messages', () => {
    const errOfferNotOpen = new Error('Execution reverted with reason: OfferNotOpen(42)');
    const res1 = decodeTxError(errOfferNotOpen);
    expect(res1.code).toBe('OfferNotOpen');
    expect(res1.message).toContain('no longer open');
    expect(res1.isUserRejection).toBe(false);
    expect(res1.isSilent).toBe(false);

    const errCollectionDisabled = new Error('CollectionDisabled()');
    const res2 = decodeTxError(errCollectionDisabled);
    expect(res2.code).toBe('CollectionDisabled');
    expect(res2.message).toContain('disabled');

    const errLoanOverdue = new Error('LoanOverdue(1, 1000, 2000)');
    const res3 = decodeTxError(errLoanOverdue);
    expect(res3.code).toBe('LoanOverdue');
    expect(res3.message).toContain('overdue');

    const errLoanNotOverdue = new Error('LoanNotOverdue(1, 2000, 1000)');
    const res4 = decodeTxError(errLoanNotOverdue);
    expect(res4.code).toBe('LoanNotOverdue');
    expect(res4.message).toContain('not reached its maturity');

    const errUnauthorized = new Error('Unauthorized()');
    const res5 = decodeTxError(errUnauthorized);
    expect(res5.code).toBe('Unauthorized');
    expect(res5.message).toContain('not authorized');

    const errNoClaimable = new Error('NoClaimableBalance()');
    const res6 = decodeTxError(errNoClaimable);
    expect(res6.code).toBe('NoClaimableBalance');
    expect(res6.message).toContain('No claimable balance');
  });

  it('TS-02: Flags user rejection with isUserRejection and isSilent', () => {
    const errRejection1 = new Error('User rejected the request.');
    const res1 = decodeTxError(errRejection1);
    expect(res1.isUserRejection).toBe(true);
    expect(res1.isSilent).toBe(true);

    const errRejection2 = new Error('MetaMask Tx Signature: User denied transaction signature.');
    const res2 = decodeTxError(errRejection2);
    expect(res2.isUserRejection).toBe(true);
    expect(res2.isSilent).toBe(true);
  });

  it('TS-03: Decodes insufficient funds and gas balance errors', () => {
    const errFunds = new Error('insufficient funds for gas * price + value');
    const res = decodeTxError(errFunds);
    expect(res.code).toBe('INSUFFICIENT_FUNDS');
    expect(res.message).toContain('Insufficient ETH balance');
  });

  it('TS-04: Decodes network and chain mismatch errors', () => {
    const errChain = new Error('ChainMismatchError: The current chain of the wallet (1) does not match the target chain (46630).');
    const res = decodeTxError(errChain);
    expect(res.code).toBe('CHAIN_MISMATCH');
    expect(res.message).toContain('wrong network');
  });

  it('TS-05: Decodes RPC connection timeouts with retry action hint', () => {
    const errTimeout = new Error('RpcTimeoutError: The request took longer than 10000ms to respond.');
    const res = decodeTxError(errTimeout);
    expect(res.code).toBe('RPC_TIMEOUT');
    expect(res.message).toContain('timed out');
    expect(res.actionHint).toBeDefined();
  });

  it('TS-06: ErrorModal renders error diagnostics and triggers recovery callbacks (Rule 11)', () => {
    const mockRetry = vi.fn();
    const mockClose = vi.fn();

    render(
      <ErrorModal
        isOpen={true}
        title="Contract Revert Encountered"
        errorMessage="Tawaran ini telah diisi oleh pengguna lain atau telah dibatalkan."
        errorCode="OfferNotOpen"
        actionHint="Please refresh the markets page to discover current active liquidity offers."
        onRetry={mockRetry}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Contract Revert Encountered')).toBeDefined();
    expect(screen.getByText(/Tawaran ini telah diisi/)).toBeDefined();
    expect(screen.getByText('Error Code: OfferNotOpen')).toBeDefined();
    expect(screen.getByText(/Please refresh the markets page/)).toBeDefined();

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(mockRetry).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeBtn);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
