import type { Chain } from 'viem';
import { getPhantomProvider } from '@/lib/web3/wallet';

export async function requestNetworkSwitch(targetChain: Chain): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const hexChainId = `0x${targetChain.id.toString(16)}` as `0x${string}`;
  const provider = getPhantomProvider() || window.ethereum;

  if (!provider || typeof provider.request !== 'function') {
    throw new Error('No EVM wallet provider detected in browser.');
  }

  let switched = false;

  try {
    const { config } = await import('@/lib/wagmi');
    const { switchChain } = await import('wagmi/actions');
    if (config) {
      await switchChain(config, { chainId: targetChain.id as any });
      switched = true;
    }
  } catch {
    switched = false;
  }

  if (!switched) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      switched = true;
    } catch (switchError: any) {
      const errorCode = switchError?.code || switchError?.data?.originalError?.code;
      const errorMessage = (switchError?.message || '').toLowerCase();

      if (
        errorCode === 4902 ||
        errorCode === -32603 ||
        errorMessage.includes('unrecognized') ||
        errorMessage.includes('not added') ||
        errorMessage.includes('add') ||
        errorMessage.includes('could not find')
      ) {
        const rpcUrls = targetChain.rpcUrls?.default?.http || ['https://rpc.testnet.chain.robinhood.com'];
        const explorerUrls = targetChain.blockExplorers?.default?.url
          ? [targetChain.blockExplorers.default.url]
          : [];

        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: rpcUrls.filter((url) => !url.startsWith('/')),
              blockExplorerUrls: explorerUrls.length > 0 ? explorerUrls : undefined,
            },
          ],
        });
        switched = true;
      } else if (
        errorCode === 4001 ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('cancelled') ||
        errorMessage.includes('denied')
      ) {
        throw new Error(
          'Network switch request was rejected in your wallet. Please approve switching to Robinhood Testnet in your wallet.'
        );
      } else {
        throw switchError;
      }
    }
  }

  if (switched) {
    try {
      const { config } = await import('@/lib/wagmi');
      const { switchChain } = await import('wagmi/actions');
      if (config) {
        await switchChain(config, { chainId: targetChain.id as any });
      }
    } catch {}

    let retries = 15;
    while (retries > 0) {
      try {
        const currentChain = await provider.request({ method: 'eth_chainId' });
        const currentId =
          typeof currentChain === 'string'
            ? parseInt(currentChain, 16)
            : Number(currentChain);
        if (currentId === targetChain.id) {
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
      retries--;
    }
  }

  return true;
}
