'use client';

import { useCallback } from 'react';
import { formatUnits } from 'viem';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI } from '@/config/contracts';
import { getEffectiveWalletClient } from '@/lib/web3/getEffectiveWalletClient';

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
      const pledgeContractAddress = getPledgeLoansAddress(chainId);
      const claimableEth = params?.claimableWei
        ? `${Number(formatUnits(BigInt(params.claimableWei), 18)).toFixed(4)} ETH`
        : undefined;

      let activeWalletClient: any = walletClient;

      return executeTransaction({
        title: 'Withdraw Protocol Proceeds',
        description: 'Claiming accumulated loan yield and refunded offer capital to your wallet',
        details: [
          ...(claimableEth ? [{ label: 'Claimable Balance', value: claimableEth }] : []),
          { label: 'Destination', value: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected Wallet' },
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to withdraw.');
          }
          if (!publicClient) {
            throw new Error('RPC client unavailable.');
          }
          activeWalletClient = await getEffectiveWalletClient(walletClient, chainId, address);
          if (!activeWalletClient) {
            throw new Error('Wallet client unavailable. Please unlock your wallet.');
          }

          if (params?.claimableWei !== undefined && BigInt(params.claimableWei) === 0n) {
            throw new Error('No claimable proceeds available to withdraw.');
          }
        },
        simulate: async () => {
          if (!publicClient || !address) return;
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'withdrawProceeds',
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
            functionName: 'withdrawProceeds',
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
    withdrawProceeds,
    reset,
  };
}
