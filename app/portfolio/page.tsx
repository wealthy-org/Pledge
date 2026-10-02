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
import { useLoans } from '@/hooks/api/useLoans';
import { useOffers } from '@/hooks/api/useOffers';
import type { OfferItem, LoanItem } from '@/types/api';

export default function PortfolioPage() {
  const { address: userAddress } = useAccount();
  const effectiveAddress = userAddress || '';

  const { data: apiPortfolio, refetch: refetchPortfolio } = usePortfolio(effectiveAddress);
  const { data: allUserLoans } = useLoans({ borrower: effectiveAddress });
  const { data: allUserOffers } = useOffers({ lender: effectiveAddress });

  const { state: withdrawTxState, withdrawProceeds, reset: resetWithdrawTx } = useWithdrawProceeds();
  const { state: cancelTxState, cancelOffer, reset: resetCancelTx } = useCancelOffer();

  const [activeTab, setActiveTab] = useState<'loans' | 'offers' | 'lending' | 'history'>('loans');
  const [claimableWei, setClaimableWei] = useState<string>('0');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cancellingOffer, setCancellingOffer] = useState<OfferItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const effectiveClaimableWei = apiPortfolio?.claimableProceedsWei || claimableWei;
  const userBorrowingLoans = apiPortfolio?.borrowedLoans || [];
  const userLentLoans = apiPortfolio?.lentLoans || [];
  const userOffers = apiPortfolio?.activeOffers || [];

  const totalBorrowedEth = useMemo(() => {
    const totalWei = userBorrowingLoans.reduce((sum: bigint, l: LoanItem) => sum + BigInt(l.principalWei || '0'), 0n);
    const eth = Number(formatUnits(totalWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '0.00';
  }, [userBorrowingLoans]);

  const totalLentEth = useMemo(() => {
    const totalWei = userLentLoans.reduce((sum: bigint, l: LoanItem) => sum + BigInt(l.principalWei || '0'), 0n);
    const eth = Number(formatUnits(totalWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '0.00';
  }, [userLentLoans]);

  const totalEarnedEth = useMemo(() => {
    const totalEarnedWei = userLentLoans
      .filter((l: LoanItem) => l.status === 'repaid')
      .reduce((sum: bigint, l: LoanItem) => sum + BigInt(l.interestWei || '0'), 0n);
    const eth = Number(formatUnits(totalEarnedWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '0.00';
  }, [userLentLoans]);

  const totalRepaymentDueEth = useMemo(() => {
    const totalWei = userBorrowingLoans.reduce((sum: bigint, l: LoanItem) => {
      const principal = BigInt(l.principalWei || '0');
      const interest = l.interestWei ? BigInt(l.interestWei) : 0n;
      return sum + principal + interest;
    }, 0n);
    const eth = Number(formatUnits(totalWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '0.00';
  }, [userBorrowingLoans]);

  const totalOpenOfferEth = useMemo(() => {
    const totalWei = userOffers.reduce((sum: bigint, o: OfferItem) => sum + BigInt(o.principalWei || '0'), 0n);
    const eth = Number(formatUnits(totalWei, 18));
    return eth.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') || '0.00';
  }, [userOffers]);

  const handleWithdraw = async () => {
    try {
      await withdrawProceeds({
        claimableWei: effectiveClaimableWei,
      });
      setClaimableWei('0');
      setToastMessage('Proceeds successfully withdrawn to your wallet!');
      refetchPortfolio();
    } catch {}
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
      refetchPortfolio();
    } catch {}
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
    <div className="space-y-8">
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-[var(--accent-primary)] flex items-center gap-2">
          <span className="w-5 h-[1px] bg-[var(--accent-primary)] inline-block" />
          <span>Portfolio Overview</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
          Your positions
        </h1>

        <p className="text-xs text-[var(--muted)]">
          Manage borrowed ETH, lending offers, and upcoming repayments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6">
        <div className="space-y-1">
          <span className="text-[10px] text-[var(--muted)] block uppercase font-mono">Borrowed ETH</span>
          <div className="text-2xl font-bold tracking-tight text-[var(--text)] font-mono">
            {totalBorrowedEth} <small className="text-xs text-[var(--muted)]">ETH</small>
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
          <span className="text-[10px] text-[var(--muted)] block uppercase font-mono">Total repayment due</span>
          <div className="text-2xl font-bold tracking-tight text-[var(--text)] font-mono">
            {totalRepaymentDueEth} <small className="text-xs text-[var(--muted)]">ETH</small>
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
          <span className="text-[10px] text-[var(--muted)] block uppercase font-mono">Open offer principal</span>
          <div className="text-2xl font-bold tracking-tight text-[var(--text)] font-mono">
            {totalOpenOfferEth} <small className="text-xs text-[var(--muted)]">ETH</small>
          </div>
        </div>
      </div>

      <ClaimableProceedsBanner
        claimableWei={effectiveClaimableWei}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
        totalBorrowedEth={totalBorrowedEth}
        totalLentEth={totalLentEth}
        totalEarnedEth={totalEarnedEth}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
          <div role="tablist" className="bg-[var(--panel)] p-1 rounded-lg flex gap-1 border border-[var(--line)]">
            <button
              role="tab"
              aria-selected={activeTab === 'loans'}
              onClick={() => setActiveTab('loans')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'loans'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              Borrowing
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'offers'}
              onClick={() => setActiveTab('offers')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'offers'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              Offers
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'lending'}
              onClick={() => setActiveTab('lending')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'lending'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              Lending
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'history'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {activeTab === 'loans' && (
          <BorrowingTab
            loans={userBorrowingLoans}
            userAddress={effectiveAddress}
            onRepay={handleRepayLoan}
          />
        )}

        {activeTab === 'offers' && (
          <OffersTab
            offers={userOffers}
            userAddress={effectiveAddress}
            onCancelOffer={handleOpenCancelOffer}
          />
        )}

        {activeTab === 'lending' && (
          <LendingTab
            loans={userLentLoans}
            userAddress={effectiveAddress}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            loans={allUserLoans?.loans || []}
            offers={allUserOffers?.offers || []}
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
