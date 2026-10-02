'use client';

import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { ClaimableProceedsBanner } from '@/components/portfolio/ClaimableProceedsBanner';
import { BorrowingTab } from '@/components/portfolio/BorrowingTab';
import { OffersTab } from '@/components/portfolio/OffersTab';
import { LendingTab } from '@/components/portfolio/LendingTab';
import { HistoryTab } from '@/components/portfolio/HistoryTab';
import { CancelOfferModal } from '@/components/lend/CancelOfferModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { useWithdrawProceeds } from '@/hooks/transactions/useWithdrawProceeds';
import { useCancelOffer } from '@/hooks/transactions/useCancelOffer';
import { usePortfolio } from '@/hooks/api/usePortfolio';
import { MOCK_LOANS, MOCK_OFFERS } from '@/lib/mock/fixtures';
import type { OfferItem, LoanItem } from '@/types/api';

export default function PortfolioPage() {
  const { address: userAddress } = useAccount();
  const effectiveAddress = userAddress || '';
  const normalizedUser = effectiveAddress.toLowerCase();

  const { data: apiPortfolio } = usePortfolio(effectiveAddress);

  const { state: withdrawTxState, withdrawProceeds, reset: resetWithdrawTx } = useWithdrawProceeds();
  const { state: cancelTxState, cancelOffer, reset: resetCancelTx } = useCancelOffer();

  const [activeTab, setActiveTab] = useState<'loans' | 'offers' | 'lending' | 'history'>('loans');
  const [claimableWei, setClaimableWei] = useState<string>('520000000000000000');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cancellingOffer, setCancellingOffer] = useState<OfferItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const effectiveClaimableWei = apiPortfolio?.claimableWei || claimableWei;

  const userBorrowingLoans = useMemo(() => {
    return MOCK_LOANS.filter((l) => {
      const isBorrower = l.borrower.toLowerCase() === normalizedUser;
      return isBorrower && l.status === 'active';
    });
  }, [normalizedUser]);

  const userOffers = useMemo(() => {
    return MOCK_OFFERS.filter((o) => {
      return o.lender.toLowerCase() === normalizedUser && o.status === 'open';
    });
  }, [normalizedUser]);

  const totalBorrowedEth = useMemo(() => {
    const totalWei = userBorrowingLoans.reduce((sum, l) => sum + BigInt(l.principalWei || '0'), 0n);
    const eth = Number(formatUnits(totalWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '0.800';
  }, [userBorrowingLoans]);

  const totalRepaymentDueEth = useMemo(() => {
    const totalWei = userBorrowingLoans.reduce((sum, l) => {
      const principal = BigInt(l.principalWei || '0');
      const interest = l.interestWei ? BigInt(l.interestWei) : 0n;
      return sum + principal + interest;
    }, 0n);
    const eth = Number(formatUnits(totalWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '0.840';
  }, [userBorrowingLoans]);

  const totalOpenOfferEth = useMemo(() => {
    const totalWei = userOffers.reduce((sum, o) => sum + BigInt(o.principalWei || '0'), 0n);
    const eth = Number(formatUnits(totalWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '1.500';
  }, [userOffers]);

  const handleWithdraw = async () => {
    try {
      await withdrawProceeds({
        claimableWei: effectiveClaimableWei,
      });
      setClaimableWei('0');
      setToastMessage('Proceeds successfully withdrawn to your wallet!');
    } catch {
      // Handled by modal
    }
  };

  const handleOpenCancelOffer = (offer: OfferItem) => {
    setCancellingOffer(offer);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelOffer = async () => {
    if (!cancellingOffer) return;
    setIsCancelModalOpen(false);

    try {
      await cancelOffer({
        offerId: cancellingOffer.offerId,
        principalWei: cancellingOffer.principalWei,
      });
      setToastMessage(`Offer #${cancellingOffer.offerId} successfully cancelled. Funds credited to Claimable Vault.`);
    } catch {
      // Handled by modal
    }
  };

  const handleRepayLoan = (loan: LoanItem) => {
    setToastMessage(`Repayment initiated for Loan #${loan.loanId}.`);
  };

  const isWithdrawing =
    withdrawTxState.stage === 'PREPARING' ||
    withdrawTxState.stage === 'SIMULATING' ||
    withdrawTxState.stage === 'PROMPTING' ||
    withdrawTxState.stage === 'PENDING' ||
    withdrawTxState.stage === 'CONFIRMING';

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="space-y-2 border-b border-[#e6ece9] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-[2px] text-[#377994] flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[#4d93be] inline-block" />
          <span>Portfolio Overview · Everything, in one place</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-[#142d2b]">
          Your positions.
        </h1>

        <p className="text-xs sm:text-sm text-[var(--muted)]">
          Manage borrowed ETH, lending offers, and upcoming repayments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-[#f7fafb] border border-[#e1e8e9] rounded-xl p-6">
        <div className="space-y-1">
          <span className="text-[10px] text-[#637878] block">Borrowed ETH</span>
          <div className="text-2xl font-normal tracking-[-0.7px] text-[#183c35] font-mono">
            {totalBorrowedEth} <small className="text-xs text-[#607579]">ETH</small>
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-[#e1e8e9] sm:pl-6">
          <span className="text-[10px] text-[#637878] block">Total repayment due</span>
          <div className="text-2xl font-normal tracking-[-0.7px] text-[#183c35] font-mono">
            {totalRepaymentDueEth} <small className="text-xs text-[#607579]">ETH</small>
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-[#e1e8e9] sm:pl-6">
          <span className="text-[10px] text-[#637878] block">Open offer principal</span>
          <div className="text-2xl font-normal tracking-[-0.7px] text-[#183c35] font-mono">
            {totalOpenOfferEth} <small className="text-xs text-[#607579]">ETH</small>
          </div>
        </div>
      </div>

      <ClaimableProceedsBanner
        claimableWei={effectiveClaimableWei}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#e1e8e9]">
          <div role="tablist" className="bg-[#f3f5f4] p-[3px] rounded-[7px] flex gap-1">
            <button
              role="tab"
              aria-selected={activeTab === 'loans'}
              onClick={() => setActiveTab('loans')}
              className={`text-[11px] font-medium py-1.5 px-3 rounded-[5px] transition-all cursor-pointer ${
                activeTab === 'loans'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              Borrowing
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'offers'}
              onClick={() => setActiveTab('offers')}
              className={`text-[11px] font-medium py-1.5 px-3 rounded-[5px] transition-all cursor-pointer ${
                activeTab === 'offers'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              Offers
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'lending'}
              onClick={() => setActiveTab('lending')}
              className={`text-[11px] font-medium py-1.5 px-3 rounded-[5px] transition-all cursor-pointer ${
                activeTab === 'lending'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              Lending
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              className={`text-[11px] font-medium py-1.5 px-3 rounded-[5px] transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-[#174732] border border-[#e3e9e6] shadow-[0_1px_3px_rgba(25,63,41,0.06)]'
                  : 'text-[#607169] hover:text-[#174732]'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {activeTab === 'loans' && (
          <BorrowingTab
            loans={MOCK_LOANS}
            userAddress={effectiveAddress}
            onRepay={handleRepayLoan}
          />
        )}

        {activeTab === 'offers' && (
          <OffersTab
            offers={MOCK_OFFERS}
            userAddress={effectiveAddress}
            onCancelOffer={handleOpenCancelOffer}
          />
        )}

        {activeTab === 'lending' && (
          <LendingTab
            loans={MOCK_LOANS}
            userAddress={effectiveAddress}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            loans={MOCK_LOANS}
            offers={MOCK_OFFERS}
            userAddress={effectiveAddress}
          />
        )}
      </div>

      {cancellingOffer && (
        <CancelOfferModal
          isOpen={isCancelModalOpen}
          offerId={cancellingOffer.offerId}
          principalEth={(Number(cancellingOffer.principalWei) / 1e18).toFixed(2)}
          onConfirm={handleConfirmCancelOffer}
          onClose={() => setIsCancelModalOpen(false)}
        />
      )}

      <TransactionModal
        isOpen={withdrawTxState.stage !== 'IDLE'}
        state={withdrawTxState}
        onClose={resetWithdrawTx}
      />

      <TransactionModal
        isOpen={cancelTxState.stage !== 'IDLE'}
        state={cancelTxState}
        onClose={resetCancelTx}
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
