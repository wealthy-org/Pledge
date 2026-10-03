'use client';

import { useCallback } from 'react';
import { formatUnits } from 'viem';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';
import { getEffectiveWalletClient } from '@/lib/web3/getEffectiveWalletClient';

export interface CancelOfferParams {
  offerId: number | string;
  principalWei?: bigint | string;
  collectionName?: string;
}

export function useCancelOffer() {
  const { address, isConnected } = useConnection();
  const chainId = useSafeChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const cancelOffer = useCallback(
    async (params: CancelOfferParams): Promise<`0x${string}` | null> => {
      const pledgeContractAddress = getPledgeLoansAddress(chainId);
      const principalDisplay = params.principalWei
        ? `${Number(formatUnits(BigInt(params.principalWei), 18)).toFixed(3)} ETH`
        : undefined;

      let activeWalletClient: any = walletClient;

      return executeTransaction({
        targetChainId: chainId,
        title: `Cancel Offer #${params.offerId}`,
        description: `Refunding offer capital ${params.collectionName ? `for ${params.collectionName}` : ''} to claimable proceeds`,
        details: [
          { label: 'Offer ID', value: `#${params.offerId}` },
          ...(params.collectionName ? [{ label: 'Collection', value: params.collectionName }] : []),
          ...(principalDisplay ? [{ label: 'Refund Amount', value: principalDisplay }] : []),
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to cancel offer.');
          }
          if (!publicClient) {
            throw new Error('RPC client unavailable.');
          }
          activeWalletClient = await getEffectiveWalletClient(walletClient, chainId, address);
          if (!activeWalletClient) {
            throw new Error('Wallet client unavailable. Please unlock your wallet.');
          }
        },
        simulate: async () => {
          if (!publicClient || !address) return;
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'cancelOffer',
            args: [BigInt(params.offerId)],
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
            functionName: 'cancelOffer',
            args: [BigInt(params.offerId)],
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
    cancelOffer,
    reset,
  };
}
