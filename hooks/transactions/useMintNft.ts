'use client';

import { useCallback } from 'react';
import { useConnection, usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionFlow } from '@/hooks/useTransactionFlow';
import { useInvalidateProtocolQueries } from '@/hooks/api/useInvalidateQueries';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { getCuratedCollections } from '@/config/collections';
import { getEffectiveWalletClient } from '@/lib/web3/getEffectiveWalletClient';

const ERC721_MINT_ABI = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export interface MintNftParams {
  collectionAddress: `0x${string}`;
  collectionName?: string;
  tokenId?: bigint;
}

export function useMintNft() {
  const { address, isConnected } = useConnection();
  const chainId = useSafeChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { state, executeTransaction, reset } = useTransactionFlow();
  const invalidateQueries = useInvalidateProtocolQueries();

  const mintNft = useCallback(
    async (params?: Partial<MintNftParams>): Promise<`0x${string}` | null> => {
      const defaultCollections = getCuratedCollections(chainId);
      const defaultCollection = defaultCollections[0];
      const targetCollection = (params?.collectionAddress ||
        defaultCollection?.contractAddress) as `0x${string}`;
      const targetName = params?.collectionName || defaultCollection?.name || 'Curated Testnet NFT';
      const tokenId = params?.tokenId ?? BigInt(Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000));

      let activeWalletClient: any = walletClient;

      return executeTransaction({
        title: 'Mint Testnet NFT',
        description: `Minting testnet collectible #${tokenId.toString()} from ${targetName}`,
        details: [
          { label: 'Collection', value: targetName },
          { label: 'Token ID', value: `#${tokenId.toString()}` },
          { label: 'Cost', value: '0 ETH (Free Testnet)' },
        ],
        prepare: async () => {
          if (!isConnected || !address) {
            throw new Error('Wallet not connected. Please connect your wallet to mint.');
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
            address: targetCollection,
            abi: ERC721_MINT_ABI,
            functionName: 'mint',
            args: [address, tokenId],
            account: address,
          });
        },
        write: async () => {
          const client = activeWalletClient || (await getEffectiveWalletClient(walletClient, chainId, address));
          if (!client || !address) {
            throw new Error('Wallet client unavailable.');
          }
          return await client.writeContract({
            address: targetCollection,
            abi: ERC721_MINT_ABI,
            functionName: 'mint',
            args: [address, tokenId],
            account: address,
          });
        },
        waitForReceipt: async (hash: `0x${string}`) => {
          if (!publicClient) throw new Error('RPC client unavailable.');
          return await publicClient.waitForTransactionReceipt({ hash });
        },
        onSuccess: () => {
          if (address) {
            invalidateQueries.invalidatePortfolio(address);
          }
          invalidateQueries.invalidateAll();
        },
      });
    },
    [isConnected, address, chainId, publicClient, walletClient, executeTransaction, invalidateQueries]
  );

  return {
    state,
    mintNft,
    reset,
  };
}
