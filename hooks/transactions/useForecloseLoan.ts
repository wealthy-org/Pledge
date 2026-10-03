'use client';

import { useCallback } from 'react';
import { isAddress } from 'viem';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';

export interface ForecloseLoanParams {
  loanId: number | string;
  lender: string;
  dueAt: string | number;
  destination?: string;
  status?: string;
  collectionName?: string;
  tokenId?: string | number;
}

export function useForecloseLoan() {
  const { address, isConnected, chainId } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const forecloseLoan = useCallback(
    async (params: ForecloseLoanParams): Promise<`0x${string}` | null> => {
      const targetDestination = params.destination || address;
      const pledgeContractAddress = getPledgeLoansAddress(chainId);

      return executeTransaction({
        title: `Foreclose Collateral #${params.loanId}`,
        description: `Transferring collateral for Loan #${params.loanId} to destination`,
        details: [
          { label: 'Loan ID', value: `#${params.loanId}` },
          ...(params.collectionName ? [{ label: 'Collateral', value: `${params.collectionName} #${params.tokenId || ''}` }] : []),
          ...(targetDestination ? [{ label: 'Destination', value: `${targetDestination.slice(0, 6)}...${targetDestination.slice(-4)}` }] : []),
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to foreclose.');
          }
          if (!publicClient) {
            throw new Error('RPC client unavailable.');
          }
          if (!walletClient) {
            throw new Error('Wallet client unavailable. Please unlock your wallet.');
          }

          if (params.lender.toLowerCase() !== address.toLowerCase()) {
            throw new Error('Unauthorized: Connected wallet is not the recorded lender.');
          }

          if (params.status && params.status.toLowerCase() !== 'active') {
            throw new Error(`Cannot foreclose loan with status: ${params.status}`);
          }

          const dueTimestamp =
            typeof params.dueAt === 'number'
              ? (params.dueAt > 1e11 ? params.dueAt : params.dueAt * 1000)
              : new Date(params.dueAt).getTime();

          if (dueTimestamp > Date.now()) {
            throw new Error('Loan is not overdue. Foreclosure is only permitted after repayment deadline.');
          }

          if (
            !targetDestination ||
            !isAddress(targetDestination) ||
            targetDestination.toLowerCase() === `0x${'0'.repeat(40)}`
          ) {
            throw new Error('Invalid destination address for collateral receipt.');
          }
        },
        simulate: async () => {
          if (!publicClient || !address) return;
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'foreclose',
            args: [BigInt(params.loanId), targetDestination as `0x${string}`],
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
            functionName: 'foreclose',
            args: [BigInt(params.loanId), targetDestination as `0x${string}`],
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
    forecloseLoan,
    reset,
  };
}
