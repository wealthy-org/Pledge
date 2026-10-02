'use client';

import { useCallback } from 'react';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI, ERC721_ABI } from '@/config/contracts';

export interface CheckApprovalParams {
  collectionAddress: `0x${string}` | string;
  tokenId?: string | number;
}

export interface ApproveNFTParams {
  collectionAddress: `0x${string}` | string;
  tokenId?: string | number;
}

export interface AcceptOfferParams {
  offerId: number | string;
  tokenId: string | number;
  collectionAddress?: `0x${string}` | string;
}

export function useAcceptOffer() {
  const { address, isConnected, chainId } = useConnection();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const checkIsApproved = useCallback(
    async ({ collectionAddress, tokenId }: CheckApprovalParams): Promise<boolean> => {
      if (!isConnected || !address || !publicClient) return false;

      const pledgeContractAddress = getPledgeLoansAddress(chainId);

      try {
        const isAllApproved = await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'isApprovedForAll',
          args: [address, pledgeContractAddress],
        });

        if (isAllApproved) return true;

        if (tokenId !== undefined && tokenId !== null) {
          const singleApproved = await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'getApproved',
            args: [BigInt(tokenId)],
          });
          if (typeof singleApproved === 'string' && singleApproved.toLowerCase() === pledgeContractAddress.toLowerCase()) {
            return true;
          }
        }

        return false;
      } catch {
        return false;
      }
    },
    [isConnected, address, chainId, publicClient]
  );

  const approveNFT = useCallback(
    async ({ collectionAddress }: ApproveNFTParams): Promise<`0x${string}` | null> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected.');
      }
      if (!publicClient || !walletClient) {
        throw new Error('RPC or Wallet client unavailable.');
      }

      const pledgeContractAddress = getPledgeLoansAddress(chainId);

      return executeTransaction({
        title: 'Approve NFT Collateral',
        description: `Authorizing Pledge protocol to escrow NFT from ${collectionAddress}`,
        write: async () => {
          return await walletClient.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'setApprovalForAll',
            args: [pledgeContractAddress, true],
            account: address,
          });
        },
        waitForReceipt: async (hash: `0x${string}`) => {
          return await publicClient.waitForTransactionReceipt({ hash });
        },
      });
    },
    [isConnected, address, chainId, publicClient, walletClient, executeTransaction]
  );

  const acceptOffer = useCallback(
    async ({ offerId, tokenId, collectionAddress }: AcceptOfferParams): Promise<`0x${string}` | null> => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected.');
      }
      if (!publicClient || !walletClient) {
        throw new Error('RPC or Wallet client unavailable.');
      }

      const pledgeContractAddress = getPledgeLoansAddress(chainId);

      return executeTransaction({
        title: 'Accept Loan Offer',
        description: `Borrowing against NFT #${tokenId} for Offer #${offerId}`,
        prepare: async () => {
          if (collectionAddress) {
            const isApproved = await checkIsApproved({ collectionAddress, tokenId });
            if (!isApproved) {
              throw new Error('NFT is not approved for transfer. Please approve NFT first.');
            }
          }
        },
        simulate: async () => {
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'acceptOffer',
            args: [BigInt(offerId), BigInt(tokenId)],
            account: address,
          });
        },
        write: async () => {
          return await walletClient.writeContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'acceptOffer',
            args: [BigInt(offerId), BigInt(tokenId)],
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
    [isConnected, address, chainId, publicClient, walletClient, executeTransaction, checkIsApproved, invalidateQueries]
  );

  return {
    state,
    checkIsApproved,
    approveNFT,
    acceptOffer,
    reset,
  };
}
