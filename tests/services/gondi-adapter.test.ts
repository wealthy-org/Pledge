import { describe, it, expect } from 'vitest';
import { convertGondiOfferToItem, convertGondiLoanToItem } from '@/lib/services/gondiAdapter';
import type { GondiOfferNode, GondiLoanNode } from '@/types/gondi';

describe('gondiAdapter test suite', () => {
  it('converts GondiOfferNode to OfferItem accurately', () => {
    const mockOffer: GondiOfferNode = {
      id: 'offer-12345',
      offerId: 101,
      lenderAddress: '0x1111111111111111111111111111111111111111',
      borrowerAddress: '0x2222222222222222222222222222222222222222',
      principalAmount: '5000000000000000000',
      aprBps: '1200',
      fee: '100',
      duration: '604800',
      expirationTime: '1780000000',
      status: 'active',
      contractAddress: '0x3333333333333333333333333333333333333333',
      collateralAddress: '0x4444444444444444444444444444444444444444',
    };

    const item = convertGondiOfferToItem(mockOffer, 46630, '0x4444444444444444444444444444444444444444');

    expect(item.offerId).toBe(101);
    expect(item.chainId).toBe(46630);
    expect(item.lender).toBe('0x1111111111111111111111111111111111111111');
    expect(item.collection).toBe('0x4444444444444444444444444444444444444444');
    expect(item.principalWei).toBe('5000000000000000000');
    expect(item.durationSeconds).toBe(604800);
    expect(item.status).toBe('open');
  });

  it('converts GondiLoanNode to LoanItem accurately', () => {
    const mockLoan: GondiLoanNode = {
      id: 'loan-999',
      loanId: 88,
      address: '0x4444444444444444444444444444444444444444',
      borrowerAddress: '0x5555555555555555555555555555555555555555',
      principalAddress: '0x6666666666666666666666666666666666666666',
      startTime: '1700000000',
      repaymentTime: '1700604800',
      duration: '604800',
      status: 'loan_repaid',
      protocolFee: '25',
      offerIds: ['101'],
      currency: {
        symbol: 'WETH',
        decimals: 18,
      },
    };

    const item = convertGondiLoanToItem(mockLoan, 46630, '0x4444444444444444444444444444444444444444');

    expect(item.loanId).toBe(88);
    expect(item.offerId).toBe(101);
    expect(item.chainId).toBe(46630);
    expect(item.borrower).toBe('0x5555555555555555555555555555555555555555');
    expect(item.collection).toBe('0x4444444444444444444444444444444444444444');
    expect(item.status).toBe('repaid');
    expect(item.startedAt).toBe(new Date(1700000000 * 1000).toISOString());
    expect(item.dueAt).toBe(new Date((1700000000 + 604800) * 1000).toISOString());
  });

  it('maps loan status correctly for active and foreclosed', () => {
    const activeLoan: GondiLoanNode = {
      id: 'active-1',
      loanId: 1,
      address: '0x123',
      borrowerAddress: '0xabc',
      status: 'loan_initiated',
    };
    expect(convertGondiLoanToItem(activeLoan).status).toBe('active');

    const foreclosedLoan: GondiLoanNode = {
      id: 'foreclosed-1',
      loanId: 2,
      address: '0x123',
      borrowerAddress: '0xabc',
      status: 'loan_foreclosed',
    };
    expect(convertGondiLoanToItem(foreclosedLoan).status).toBe('foreclosed');
  });
});
