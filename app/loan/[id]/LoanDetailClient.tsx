'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { useConnection } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { LoanTermsCard } from '@/components/loan/LoanTermsCard';
import { LoanCountdown } from '@/components/loan/LoanCountdown';
import { LoanActionButtons } from '@/components/loan/LoanActionButtons';
import { RepayConfirmationModal } from '@/components/loan/RepayConfirmationModal';
import { ForecloseConfirmationModal } from '@/components/loan/ForecloseConfirmationModal';
import { TransactionModal } from '@/components/tx/TransactionModal';
import { Toast } from '@/components/ui/Toast';
import { useRepayLoan } from '@/hooks/transactions/useRepayLoan';
import { useForecloseLoan } from '@/hooks/transactions/useForecloseLoan';
import type { LoanItem } from '@/types/api';

export interface LoanDetailClientProps {
  loan: LoanItem;
  collectionName: string;
  imageUrl: string;
}

export function LoanDetailClient({
  loan,
  collectionName,
  imageUrl,
}: LoanDetailClientProps) {
  const chainId = useSafeChainId();
  const { address: connectedAddress } = useConnection();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isForecloseModalOpen, setIsForecloseModalOpen] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState(connectedAddress || '');

  const { state: repayTxState, repayLoan, reset: resetRepayTx } = useRepayLoan();
  const { state: forecloseTxState, forecloseLoan, reset: resetForecloseTx } = useForecloseLoan();

  const [isOverdue] = useState<boolean>(() => {
    const dueTimestamp = new Date(loan.dueAt).getTime();
    return loan.status === 'active' && dueTimestamp < new Date().getTime();
  });

  const principalWei = BigInt(loan.principalWei || '0');
  const interestWei = BigInt(loan.interestWei || '0');
  const totalDueWei = principalWei + interestWei;

  const principalEth = Number(formatEther(principalWei)).toFixed(4);
  const interestEth = Number(formatEther(interestWei)).toFixed(4);
  const totalDueEth = Number(formatEther(totalDueWei)).toFixed(4);

  const isTxProcessing =
    repayTxState.stage === 'PREPARING' ||
    repayTxState.stage === 'SIMULATING' ||
    repayTxState.stage === 'PROMPTING' ||
    repayTxState.stage === 'PENDING' ||
    repayTxState.stage === 'CONFIRMING' ||
    forecloseTxState.stage === 'PREPARING' ||
    forecloseTxState.stage === 'SIMULATING' ||
    forecloseTxState.stage === 'PROMPTING' ||
    forecloseTxState.stage === 'PENDING' ||
    forecloseTxState.stage === 'CONFIRMING';

  const handleOpenRepay = () => {
    setIsRepayModalOpen(true);
  };

  const handleConfirmRepay = async () => {
    setIsRepayModalOpen(false);
    try {
      await repayLoan({
        loanId: loan.loanId,
        totalDueWei,
        dueAt: loan.dueAt,
        status: loan.status,
        collectionName,
        tokenId: loan.tokenId,
      });
    } catch {}
  };

  const handleOpenForeclose = () => {
    setDestinationAddress(connectedAddress || loan.lender);
    setIsForecloseModalOpen(true);
  };

  const handleConfirmForeclose = async () => {
    setIsForecloseModalOpen(false);
    try {
      await forecloseLoan({
        loanId: loan.loanId,
        lender: loan.lender,
        dueAt: loan.dueAt,
        destination: destinationAddress || connectedAddress || loan.lender,
        status: loan.status,
        collectionName,
        tokenId: loan.tokenId,
      });
    } catch {}
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/portfolio"
            className="p-2 rounded-xl bg-[var(--raised)] border border-[var(--line)] hover:bg-[var(--panel)] transition-colors text-xs font-mono font-bold text-[var(--muted)] hover:text-[var(--text)]"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text)]">
              Loan #{loan.loanId} Overview
            </h1>
            <p className="text-xs text-[var(--muted)] font-mono">
              Collateral: {collectionName} #{loan.tokenId}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <LoanTermsCard
            loan={loan}
            collectionName={collectionName}
            imageUrl={imageUrl}
          />

          <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] space-y-2 text-xs text-[var(--muted)]">
            <h4 className="font-bold text-[var(--text)] font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[var(--accent-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Non-Custodial Escrow Contract Terms</span>
            </h4>
            <p className="leading-relaxed">
              This loan is executed under the immutable PledgeLoans smart contract. The collateral NFT is held in isolated escrow until either:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>The borrower settles the full principal + term interest before the deadline.</li>
              <li>The deadline expires and the lender claims foreclosure on the collateral NFT.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <LoanCountdown
            dueAt={loan.dueAt}
            status={loan.status}
          />

          <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-subtle)] space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[1.5px] text-[var(--muted)] block">
                Actions
              </span>
              <h3 className="text-sm font-bold text-[var(--text)]">Loan Settlement</h3>
            </div>

            <LoanActionButtons
              loan={loan}
              userAddress={connectedAddress}
              isOverdue={isOverdue}
              onRepay={handleOpenRepay}
              onForeclose={handleOpenForeclose}
              isProcessing={isTxProcessing}
            />
          </div>
        </div>
      </div>

      <RepayConfirmationModal
        isOpen={isRepayModalOpen}
        loanId={loan.loanId}
        collectionName={collectionName}
        tokenId={loan.tokenId}
        principalEth={principalEth}
        interestEth={interestEth}
        totalDueEth={totalDueEth}
        dueAt={loan.dueAt}
        onConfirm={handleConfirmRepay}
        onClose={() => setIsRepayModalOpen(false)}
      />

      <ForecloseConfirmationModal
        isOpen={isForecloseModalOpen}
        loanId={loan.loanId}
        collectionName={collectionName}
        tokenId={loan.tokenId}
        destinationAddress={destinationAddress}
        onDestinationChange={setDestinationAddress}
        onConfirm={handleConfirmForeclose}
        onClose={() => setIsForecloseModalOpen(false)}
      />

      <TransactionModal
        isOpen={repayTxState.stage !== 'IDLE'}
        state={repayTxState}
        chainId={chainId}
        onClose={resetRepayTx}
      />

      <TransactionModal
        isOpen={forecloseTxState.stage !== 'IDLE'}
        state={forecloseTxState}
        chainId={chainId}
        onClose={resetForecloseTx}
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
