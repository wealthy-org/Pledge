'use client';

import { useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';

export interface CreateOfferParams {
  collectionAddress: `0x${string}` | string;
  principalWei: bigint;
  termInterestBps: number;
  durationSeconds: number;
  expirySeconds: number;
}

export function useCreateOffer() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const createOffer = useCallback(
    async (params: CreateOfferParams): Promise<`0x${string}` | null> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected. Please connect your wallet to create an offer.');
      }

      if (!publicClient) {
        throw new Error('RPC client unavailable.');
      }

      if (!walletClient) {
        throw new Error('Wallet client unavailable.');
      }

      const pledgeContractAddress = getPledgeLoansAddress(chainId);
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + params.expirySeconds);

      return executeTransaction({
        title: 'Create Lending Offer',
        description: `Publishing lending offer for collection ${params.collectionAddress}`,
        prepare: async () => {
          const balance = await publicClient.getBalance({ address });
          if (balance < params.principalWei) {
            throw new Error('Insufficient ETH balance to cover offer principal.');
          }
        },
        simulate: async () => {
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'createOffer',
            args: [
              params.collectionAddress as `0x${string}`,
              params.termInterestBps,
              params.durationSeconds,
              expiresAt,
            ],
            value: params.principalWei,
            account: address,
          });
        },
        write: async () => {
          return await walletClient.writeContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'createOffer',
            args: [
              params.collectionAddress as `0x${string}`,
              params.termInterestBps,
              params.durationSeconds,
              expiresAt,
            ],
            value: params.principalWei,
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
    createOffer,
    reset,
  };
}
