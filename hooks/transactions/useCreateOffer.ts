'use client';

import { useCallback } from 'react';
import { formatUnits } from 'viem';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';
import { getEffectiveWalletClient } from '@/lib/web3/getEffectiveWalletClient';

export interface CreateOfferParams {
  collectionAddress: `0x${string}` | string;
  collectionName?: string;
  principalWei: bigint;
  termInterestBps: number;
  durationSeconds: number;
  expirySeconds: number;
}

export function useCreateOffer() {
  const { address, isConnected, chainId } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const createOffer = useCallback(
    async (params: CreateOfferParams): Promise<`0x${string}` | null> => {
      const pledgeContractAddress = getPledgeLoansAddress(chainId);
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + params.expirySeconds);
      const principalEth = `${Number(formatUnits(params.principalWei, 18)).toFixed(3)} ETH`;
      const interestRate = `${(params.termInterestBps / 100).toFixed(1)}%`;
      const durationDays = `${Math.round(params.durationSeconds / 86400)} Days`;

      let activeWalletClient: any = walletClient;

      return executeTransaction({
        title: 'Create Lending Offer',
        description: `Publishing lending offer for ${params.collectionName || params.collectionAddress}`,
        details: [
          { label: 'Collection', value: params.collectionName || `${params.collectionAddress.slice(0, 6)}...${params.collectionAddress.slice(-4)}` },
          { label: 'Committed Principal', value: principalEth },
          { label: 'Term Interest', value: interestRate },
          { label: 'Duration', value: durationDays },
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to create an offer.');
          }
          if (!publicClient) {
            throw new Error('RPC client unavailable.');
          }
          activeWalletClient = await getEffectiveWalletClient(walletClient, chainId, address);
          if (!activeWalletClient) {
            throw new Error('Wallet client unavailable. Please unlock your wallet.');
          }

          const balance = await publicClient.getBalance({ address });
          if (balance < params.principalWei) {
            throw new Error('Insufficient ETH balance to cover offer principal.');
          }
        },
        simulate: async () => {
          if (!publicClient || !address) return;
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
          const client = activeWalletClient || (await getEffectiveWalletClient(walletClient, chainId, address));
          if (!client || !address) {
            throw new Error('Wallet client unavailable.');
          }
          return await client.writeContract({
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
    createOffer,
    reset,
  };
}
