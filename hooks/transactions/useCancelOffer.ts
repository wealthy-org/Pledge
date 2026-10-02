'use client';

import { useCallback } from 'react';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';

export interface CancelOfferParams {
  offerId: number | string;
  principalWei?: bigint | string;
  collectionName?: string;
}

export function useCancelOffer() {
  const { address, isConnected, chainId } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const cancelOffer = useCallback(
    async (params: CancelOfferParams): Promise<`0x${string}` | null> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Please connect your wallet to cancel offer.');
      }

      if (!publicClient) {
        throw new Error('RPC client unavailable.');
      }

      if (!walletClient) {
        throw new Error('Wallet client unavailable.');
      }

      const pledgeContractAddress = getPledgeLoansAddress(chainId);

      return executeTransaction({
        title: `Cancel Offer #${params.offerId}`,
        description: `Refunding offer capital ${params.collectionName ? `for ${params.collectionName}` : ''} to claimable proceeds`,
        simulate: async () => {
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'cancelOffer',
            args: [BigInt(params.offerId)],
            account: address,
          });
        },
        write: async () => {
          return await walletClient.writeContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'cancelOffer',
            args: [BigInt(params.offerId)],
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
    cancelOffer,
    reset,
  };
}
