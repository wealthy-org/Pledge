'use client';

import { useCallback } from 'react';
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
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Please connect your wallet to repay.');
      }

      if (!publicClient) {
        throw new Error('RPC client unavailable.');
      }

      if (!walletClient) {
        throw new Error('Wallet client unavailable.');
      }

      const pledgeContractAddress = getPledgeLoansAddress(chainId);

      return executeTransaction({
        title: `Repay Loan #${params.loanId}`,
        description: `Settling ${params.collectionName ? `${params.collectionName} #${params.tokenId || ''}` : `Loan #${params.loanId}`}`,
        prepare: async () => {
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
