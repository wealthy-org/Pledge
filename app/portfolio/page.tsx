'use client';

import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ClaimableProceedsBanner } from '@/components/portfolio/ClaimableProceedsBanner';
import { BorrowingTab } from '@/components/portfolio/BorrowingTab';
import { OffersTab } from '@/components/portfolio/OffersTab';
import { LendingTab } from '@/components/portfolio/LendingTab';
import { HistoryTab } from '@/components/portfolio/HistoryTab';
import { CancelOfferModal } from '@/components/lend/CancelOfferModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
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

  const [activeTab, setActiveTab] = useState<string>('borrowing');
  const [claimableWei, setClaimableWei] = useState<string>('520000000000000000');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cancellingOffer, setCancellingOffer] = useState<OfferItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const effectiveClaimableWei = apiPortfolio?.claimableWei || claimableWei;

  const userBorrowingCount = useMemo(() => {
    return MOCK_LOANS.filter((l) => {
      const isBorrower = l.borrower.toLowerCase() === normalizedUser;
      return isBorrower && l.status === 'active';
    }).length;
  }, [normalizedUser]);

  const userOffersCount = useMemo(() => {
    return MOCK_OFFERS.filter((o) => {
      return o.lender.toLowerCase() === normalizedUser && o.status === 'open';
    }).length;
  }, [normalizedUser]);

  const userLendingCount = useMemo(() => {
    return MOCK_LOANS.filter((l) => {
      return l.lender.toLowerCase() === normalizedUser && l.status === 'active';
    }).length;
  }, [normalizedUser]);

  const userHistoryCount = useMemo(() => {
    const loansHist = MOCK_LOANS.filter((l) => {
      const isUser =
        l.borrower.toLowerCase() === normalizedUser ||
        l.lender.toLowerCase() === normalizedUser;
      return isUser && (l.status === 'repaid' || l.status === 'foreclosed');
    }).length;

    const offersHist = MOCK_OFFERS.filter((o) => {
      return (
        o.lender.toLowerCase() === normalizedUser &&
        (o.status === 'filled' || o.status === 'cancelled')
      );
    }).length;

    return loansHist + offersHist;
  }, [normalizedUser]);

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

  const tabs: TabItem[] = [
    { id: 'borrowing', label: 'Borrowing', count: userBorrowingCount },
    { id: 'offers', label: 'Offers', count: userOffersCount },
    { id: 'lending', label: 'Lending', count: userLendingCount },
    { id: 'history', label: 'History', count: userHistoryCount },
  ];

  const isWithdrawing =
    withdrawTxState.stage === 'PREPARING' ||
    withdrawTxState.stage === 'SIMULATING' ||
    withdrawTxState.stage === 'PROMPTING' ||
    withdrawTxState.stage === 'PENDING' ||
    withdrawTxState.stage === 'CONFIRMING';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)]">
          Portfolio Overview
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] font-mono mt-1">
          Real-time positions, liquidity offers, and protocol claimable balance
        </p>
      </div>

      <ClaimableProceedsBanner
        claimableWei={effectiveClaimableWei}
        onWithdraw={handleWithdraw}
        isWithdrawing={isWithdrawing}
      />

      <div className="space-y-4">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId)}
        />

        {activeTab === 'borrowing' && (
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
