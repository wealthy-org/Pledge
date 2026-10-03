import type { Chain } from 'viem';
import { getPhantomProvider } from '@/lib/web3/wallet';

export async function requestNetworkSwitch(targetChain: Chain): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const hexChainId = `0x${targetChain.id.toString(16)}` as `0x${string}`;
  const provider = getPhantomProvider() || window.ethereum;

  if (!provider || typeof provider.request !== 'function') {
    throw new Error('No EVM wallet provider detected in browser.');
  }

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return true;
  } catch (switchError: any) {
    const errorCode = switchError?.code || switchError?.data?.originalError?.code;
    const errorMessage = (switchError?.message || '').toLowerCase();

    if (
      errorCode === 4902 ||
      errorCode === -32603 ||
      errorMessage.includes('unrecognized') ||
      errorMessage.includes('not added') ||
      errorMessage.includes('add')
    ) {
      const rpcUrls = targetChain.rpcUrls?.default?.http || [];
      const explorerUrls = targetChain.blockExplorers?.default?.url ? [targetChain.blockExplorers.default.url] : [];

      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexChainId,
            chainName: targetChain.name,
            nativeCurrency: targetChain.nativeCurrency,
            rpcUrls: rpcUrls.length > 0 ? rpcUrls : ['https://rpc.testnet.chain.robinhood.com'],
            blockExplorerUrls: explorerUrls.length > 0 ? explorerUrls : undefined,
          },
        ],
      });
      return true;
    }

    if (errorCode === 4001 || errorMessage.includes('user rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
      throw new Error('Network switch request was rejected in your wallet. Please approve switching to Robinhood Testnet in Phantom/MetaMask.');
    }

    throw switchError;
  }
}
