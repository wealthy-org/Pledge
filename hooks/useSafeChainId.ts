'use client';

import { useChainId } from 'wagmi';

export function useSafeChainId(): number {
  try {
    const chainId = useChainId();
    if (typeof chainId === 'number' && !isNaN(chainId) && chainId > 0) {
      return chainId;
    }
  } catch {}

  const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  if (!envChainId) {
    throw new Error('NEXT_PUBLIC_CHAIN_ID environment variable is missing.');
  }
  const parsed = Number(envChainId);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid NEXT_PUBLIC_CHAIN_ID environment variable: ${envChainId}`);
  }
  return parsed;
}
