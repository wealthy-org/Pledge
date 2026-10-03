'use client';

import { useCallback } from 'react';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { getPledgeLoansAddress, PLEDGE_LOANS_ABI, ERC721_ABI } from '@/config/contracts';
import { getEffectiveWalletClient } from '@/lib/web3/getEffectiveWalletClient';

export interface CheckApprovalParams {
  collectionAddress: `0x${string}` | string;
  tokenId?: string | number;
}

export interface ApproveNFTParams {
  collectionAddress: `0x${string}` | string;
  collectionName?: string;
  tokenId?: string | number;
}

export interface AcceptOfferParams {
  offerId: number | string;
  tokenId: string | number;
  collectionAddress?: `0x${string}` | string;
  collectionName?: string;
  principalEth?: string;
}

export function useAcceptOffer() {
  const { address, isConnected } = useConnection();
  const chainId = useSafeChainId();
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
    async ({ collectionAddress, collectionName }: ApproveNFTParams): Promise<`0x${string}` | null> => {
      const pledgeContractAddress = getPledgeLoansAddress(chainId);
      let activeWalletClient: any = walletClient;

      return executeTransaction({
        title: 'Approve NFT Collateral',
        description: `Authorizing Pledge protocol to escrow NFT from ${collectionName || collectionAddress}`,
        details: [
          { label: 'Collection', value: collectionName || `${collectionAddress.slice(0, 6)}...${collectionAddress.slice(-4)}` },
          { label: 'Approval Target', value: 'Pledge Protocol Contract' },
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to approve.');
          }
          if (!publicClient) {
            throw new Error('RPC client unavailable.');
          }
          activeWalletClient = await getEffectiveWalletClient(walletClient, chainId, address);
          if (!activeWalletClient) {
            throw new Error('Wallet client unavailable. Please unlock your wallet.');
          }
        },
        write: async () => {
          const client = activeWalletClient || (await getEffectiveWalletClient(walletClient, chainId, address));
          if (!client || !address) {
            throw new Error('Wallet client unavailable.');
          }
          return await client.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'setApprovalForAll',
            args: [pledgeContractAddress, true],
            account: address,
          });
        },
        waitForReceipt: async (hash: `0x${string}`) => {
          if (!publicClient) throw new Error('RPC client unavailable.');
          return await publicClient.waitForTransactionReceipt({ hash });
        },
      });
    },
    [isConnected, address, chainId, publicClient, walletClient, executeTransaction]
  );

  const acceptOffer = useCallback(
    async ({ offerId, tokenId, collectionAddress, collectionName, principalEth }: AcceptOfferParams): Promise<`0x${string}` | null> => {
      const pledgeContractAddress = getPledgeLoansAddress(chainId);
      let activeWalletClient: any = walletClient;

      return executeTransaction({
        title: 'Accept Loan Offer',
        description: `Borrowing against NFT #${tokenId} for Offer #${offerId}`,
        details: [
          { label: 'Offer ID', value: `#${offerId}` },
          { label: 'Collateral Token', value: `${collectionName || 'NFT'} #${tokenId}` },
          ...(principalEth ? [{ label: 'Borrowed Capital', value: `${principalEth} ETH` }] : []),
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to borrow.');
          }
          if (!publicClient) {
            throw new Error('RPC client unavailable.');
          }
          activeWalletClient = await getEffectiveWalletClient(walletClient, chainId, address);
          if (!activeWalletClient) {
            throw new Error('Wallet client unavailable. Please unlock your wallet.');
          }

          if (collectionAddress) {
            const isApproved = await checkIsApproved({ collectionAddress, tokenId });
            if (!isApproved) {
              throw new Error('NFT is not approved for transfer. Please approve NFT first.');
            }
          }
        },
        simulate: async () => {
          if (!publicClient || !address) return;
          await publicClient.simulateContract({
            address: pledgeContractAddress,
            abi: PLEDGE_LOANS_ABI,
            functionName: 'acceptOffer',
            args: [BigInt(offerId), BigInt(tokenId)],
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
            functionName: 'acceptOffer',
            args: [BigInt(offerId), BigInt(tokenId)],
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
