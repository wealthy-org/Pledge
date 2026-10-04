'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useConnection, useBalance } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { formatUnits } from 'viem';
import { ClaimableProceedsBanner } from '@/components/portfolio/ClaimableProceedsBanner';
import { BorrowingTab } from '@/components/portfolio/BorrowingTab';
import { OffersTab } from '@/components/portfolio/OffersTab';
import { LendingTab } from '@/components/portfolio/LendingTab';
import { HistoryTab } from '@/components/portfolio/HistoryTab';
import { PortfolioDisconnectedState } from '@/components/portfolio/PortfolioDisconnectedState';
import { CancelOfferModal } from '@/components/lend/CancelOfferModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { NftImage } from '@/components/nft/NftImage';
import { useConnectModal } from '@/contexts/ConnectModalContext';
import { useWithdrawProceeds } from '@/hooks/transactions/useWithdrawProceeds';
import { useCancelOffer } from '@/hooks/transactions/useCancelOffer';
import { usePortfolio } from '@/hooks/api/usePortfolio';
import { useLoans } from '@/hooks/api/useLoans';
import { useOffers } from '@/hooks/api/useOffers';
import { useEligibleNfts } from '@/hooks/api/useEligibleNfts';
import type { OfferItem, LoanItem } from '@/types/api';

export default function PortfolioPage() {
  const chainId = useSafeChainId();
  const { address: userAddress, isConnected } = useConnection();
  const { openConnectModal } = useConnectModal();
  const effectiveAddress = userAddress || '';

  const { data: balanceData } = useBalance({
    address: userAddress,
    query: {
      enabled: Boolean(userAddress && isConnected),
    },
  });
  const { nfts: userNfts, isLoading: isLoadingNfts } = useEligibleNfts(userAddress, chainId);

  const { data: apiPortfolio, refetch: refetchPortfolio } = usePortfolio(effectiveAddress);
  const { data: allUserLoans } = useLoans({ borrower: userAddress, enabled: Boolean(userAddress && isConnected) });
  const { data: allUserOffers } = useOffers({ lender: userAddress, enabled: Boolean(userAddress && isConnected) });

  const { state: withdrawTxState, withdrawProceeds, reset: resetWithdrawTx } = useWithdrawProceeds();
  const { state: cancelTxState, cancelOffer, reset: resetCancelTx } = useCancelOffer();

  const [activeTab, setActiveTab] = useState<'nfts' | 'loans' | 'offers' | 'lending' | 'history'>('nfts');
  const [claimableWei, setClaimableWei] = useState<string>('0');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cancellingOffer, setCancellingOffer] = useState<OfferItem | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  React.useEffect(() => {
    if (!isConnected || !userAddress) {
      setClaimableWei('0');
      setCancellingOffer(null);
      setIsCancelModalOpen(false);
      setToastMessage(null);
      resetWithdrawTx();
      resetCancelTx();
    }
  }, [isConnected, userAddress, resetWithdrawTx, resetCancelTx]);

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
    } catch (err) {
      console.error('[Portfolio Withdraw Error]:', err);
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
      refetchPortfolio();
    } catch (err) {
      console.error('[Portfolio CancelOffer Error]:', err);
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

  if (!isConnected || !userAddress) {
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

        <PortfolioDisconnectedState onConnect={openConnectModal} />
      </div>
    );
  }

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5 sm:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Wallet Balance</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] font-mono">
            {balanceData ? Number(formatUnits(balanceData.value, balanceData.decimals)).toFixed(3) : '0.000'} <small className="text-xs text-[var(--muted)]">{balanceData?.symbol || 'ETH'}</small>
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>Eligible Collectibles</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] font-mono">
            {userNfts.length} <small className="text-xs text-[var(--muted)]">NFTs</small>
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span>Borrowed ETH</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] font-mono">
            {totalBorrowedEth} <small className="text-xs text-[var(--muted)]">ETH</small>
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-[var(--line)] sm:pl-6">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span>Active Offers / Lent</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] font-mono">
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
          <div role="tablist" className="bg-[var(--panel)] p-1 rounded-lg flex flex-wrap gap-1 border border-[var(--line)]">
            <button
              role="tab"
              aria-selected={activeTab === 'nfts'}
              onClick={() => setActiveTab('nfts')}
              className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors cursor-pointer border ${
                activeTab === 'nfts'
                  ? 'bg-[var(--surface)] text-[var(--text)] border-[var(--line)] shadow-xs'
                  : 'text-[var(--muted)] hover:text-[var(--text)] border-transparent'
              }`}
            >
              My Collectibles ({userNfts.length})
            </button>
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
              Borrowing ({userBorrowingLoans.length})
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
              Offers ({userOffers.length})
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
              Lending ({userLentLoans.length})
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

        {activeTab === 'nfts' && (
          <div className="space-y-4">
            {isLoadingNfts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 space-y-3">
                    <div className="aspect-square bg-[var(--panel)] rounded-lg shimmer" />
                    <div className="h-4 bg-[var(--panel)] rounded shimmer w-3/4" />
                    <div className="h-3 bg-[var(--panel)] rounded shimmer w-1/2" />
                  </div>
                ))}
              </div>
            ) : userNfts.length === 0 ? (
              <div className="py-16 px-6 border border-dashed border-[var(--line)] rounded-xl text-center bg-[var(--surface)]">
                <div className="text-3xl text-[var(--muted)] mb-2 font-mono">◈</div>
                <h3 className="text-sm font-semibold text-[var(--text)] mb-1">No Collectibles in Wallet</h3>
                <p className="text-xs text-[var(--muted)] max-w-sm mx-auto mb-4">
                  Your connected wallet does not hold any verified collectibles from our supported collections.
                </p>
                <Link
                  href="/borrow"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Mint Testnet NFT ↗
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {userNfts.map((nft) => (
                  <div
                    key={`${nft.contractAddress}-${nft.tokenId}`}
                    className="flex flex-col bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden hover:border-[var(--line-strong)] transition-colors"
                  >
                    <div className="relative aspect-square w-full bg-[var(--panel)]">
                      <NftImage
                        src={nft.imageUrl}
                        alt={nft.name}
                        contractAddress={nft.contractAddress}
                        tokenId={nft.tokenId}
                        symbol={nft.collectionName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3.5 flex flex-col flex-1 justify-between space-y-3">
                      <div>
                        <div className="text-[10px] text-[var(--muted)] font-mono truncate">{nft.collectionName}</div>
                        <h4 className="text-xs font-semibold text-[var(--text)] truncate mt-0.5">{nft.name}</h4>
                      </div>
                      <Link
                        href={`/borrow?collection=${nft.contractAddress}`}
                        className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white border border-emerald-500/25 transition-colors text-center block"
                      >
                        Borrow Against NFT ↗
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
        chainId={chainId}
        onClose={resetWithdrawTx}
      />

      <TransactionModal
        isOpen={cancelTxState.stage !== 'IDLE'}
        state={cancelTxState}
        chainId={chainId}
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
