'use client';

import { useChainId } from 'wagmi';
import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';

export function useSafeChainId(): number {
  try {
    const chainId = useChainId();
    if (chainId === TESTNET_CHAIN_ID || chainId === MAINNET_CHAIN_ID) {
      return chainId;
    }
  } catch {}

  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (envChainId) {
    const parsed = Number(envChainId);
    if (!isNaN(parsed) && (parsed === MAINNET_CHAIN_ID || parsed === TESTNET_CHAIN_ID)) {
      return parsed;
    }
  }

  return TESTNET_CHAIN_ID;
}
