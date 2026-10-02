'use client';

import { useCallback } from 'react';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';

export interface WithdrawProceedsParams {
  claimableWei?: bigint | string;
}

export function useWithdrawProceeds() {
  const { address, isConnected, chainId } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const withdrawProceeds = useCallback(
    async (params?: WithdrawProceedsParams): Promise<`0x${string}` | null> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Please connect your wallet to withdraw.');
      }

      if (!publicClient) {
        throw new Error('RPC client unavailable.');
      }

      if (!walletClient) {
        throw new Error('Wallet client unavailable.');
      }

      const pledgeContractAddress = getPledgeLoansAddress(chainId);

      return executeTransaction({
        title: 'Withdraw Protocol Proceeds',
        description: 'Claiming accumulated loan yield and refunded offer capital to your wallet',
        prepare: async () => {
          if (params?.claimableWei !== undefined && BigInt(params.claimableWei) === 0n) {
            throw new Error('No claimable proceeds available to withdraw.');
          }
        },
        simulate: async () => {
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'withdrawProceeds',
            account: address,
          });
        },
        write: async () => {
          return await walletClient.writeContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'withdrawProceeds',
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
    withdrawProceeds,
    reset,
  };
}
