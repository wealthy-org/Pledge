'use client';

import { useCallback } from 'react';
import { formatUnits } from 'viem';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';

export interface RepayLoanParams {
  loanId: number | string;
  totalDueWei: bigint;
  dueAt: string | number;
  status?: string;
  collectionName?: string;
  tokenId?: string | number;
}

export function useRepayLoan() {
  const { address, isConnected, chainId } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const repayLoan = useCallback(
    async (params: RepayLoanParams): Promise<`0x${string}` | null> => {
      const pledgeContractAddress = getPledgeLoansAddress(chainId);
      const repaymentAmount = `${Number(formatUnits(params.totalDueWei, 18)).toFixed(4)} ETH`;

      return executeTransaction({
        title: `Repay Loan #${params.loanId}`,
        description: `Settling ${params.collectionName ? `${params.collectionName} #${params.tokenId || ''}` : `Loan #${params.loanId}`}`,
        details: [
          { label: 'Loan ID', value: `#${params.loanId}` },
          ...(params.collectionName ? [{ label: 'Collateral', value: `${params.collectionName} #${params.tokenId || ''}` }] : []),
          { label: 'Settlement Amount', value: repaymentAmount },
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to repay.');
          }
          if (!publicClient) {
            throw new Error('RPC client unavailable.');
          }
          if (!walletClient) {
            throw new Error('Wallet client unavailable. Please unlock your wallet.');
          }

          if (params.status && params.status.toLowerCase() !== 'active') {
            throw new Error(`Cannot repay loan with status: ${params.status}`);
          }

          const dueTimestamp =
            typeof params.dueAt === 'number'
              ? (params.dueAt > 1e11 ? params.dueAt : params.dueAt * 1000)
              : new Date(params.dueAt).getTime();

          if (dueTimestamp <= Date.now()) {
            throw new Error('Loan repayment deadline has passed. Loan is overdue.');
          }

          const balance = await publicClient.getBalance({ address });
          if (balance < params.totalDueWei) {
            throw new Error('Insufficient ETH balance to cover loan repayment.');
          }
        },
        simulate: async () => {
          if (!publicClient || !address) return;
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'repay',
            args: [BigInt(params.loanId)],
            value: params.totalDueWei,
            account: address,
          });
        },
        write: async () => {
          if (!walletClient || !address) {
            throw new Error('Wallet client unavailable.');
          }
          return await walletClient.writeContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'repay',
            args: [BigInt(params.loanId)],
            value: params.totalDueWei,
            account: address,
          });
        },
        waitForReceipt: async (hash: `0x${string}`) => {
          if (!publicClient) throw new Error('RPC client unavailable.');
          return await publicClient.waitForTransactionReceipt({ hash });
        },
        onSuccess: () => {
          invalidateQueries.invalidateAll();
        },
      });
    },
    [isConnected, address, chainId, publicClient, walletClient, executeTransaction, invalidateQueries]
  );

  return {
    state,
    repayLoan,
    reset,
  };
}
