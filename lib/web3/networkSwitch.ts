import type { Chain } from 'viem';

async function getConnectedProvider(): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const { config } = await import('@/lib/wagmi');
    if (config) {
      const currentKey = config.state.current;
      const currentConnection = currentKey ? config.state.connections.get(currentKey) : undefined;
      if (currentConnection?.connector) {
        const connProvider = await currentConnection.connector.getProvider();
        if (connProvider && typeof (connProvider as any).request === 'function') {
          return connProvider;
        }
      }
    }
  } catch {}

  const win = window as any;
  if (win.ethereum) {
    if (Array.isArray(win.ethereum.providers) && win.ethereum.providers.length > 0) {
      const metamask = win.ethereum.providers.find((p: any) => p.isMetaMask && !p.isPhantom);
      if (metamask) return metamask;
      return win.ethereum.providers[0];
    }
    return win.ethereum;
  }

  if (win.phantom?.ethereum) {
    return win.phantom.ethereum;
  }

  return null;
}

export async function requestNetworkSwitch(targetChain: Chain): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const hexChainId = `0x${targetChain.id.toString(16)}` as `0x${string}`;
  const provider = await getConnectedProvider();

  let wagmiSwitched = false;
  try {
    const { config } = await import('@/lib/wagmi');
    const { switchChain } = await import('wagmi/actions');
    if (config) {
      await switchChain(config, { chainId: targetChain.id as any });
      wagmiSwitched = true;
      return true;
    }
  } catch (wagmiErr: any) {
    const msg = (wagmiErr?.message || '').toLowerCase();
    const code = wagmiErr?.code;
    if (code === 4001 || msg.includes('user rejected') || msg.includes('denied') || msg.includes('cancelled')) {
      throw new Error('Network switch was cancelled in wallet.');
    }
  }

  if (!wagmiSwitched && provider && typeof provider.request === 'function') {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      return true;
    } catch (switchErr: any) {
      const errorCode = switchErr?.code || switchErr?.data?.originalError?.code;
      const errorMessage = (switchErr?.message || '').toLowerCase();

      if (
        errorCode === 4902 ||
        errorCode === -32603 ||
        errorMessage.includes('unrecognized') ||
        errorMessage.includes('not added') ||
        errorMessage.includes('add') ||
        errorMessage.includes('could not find')
      ) {
        const rawUrls = targetChain.rpcUrls?.default?.http || [];
        const validUrls = rawUrls.filter((u) => u.startsWith('http'));
        const rpcUrls = validUrls.length > 0 ? validUrls : ['https://rpc.testnet.chain.robinhood.com'];
        const explorerUrls = targetChain.blockExplorers?.default?.url
          ? [targetChain.blockExplorers.default.url]
          : ['https://explorer.testnet.chain.robinhood.com'];

        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: targetChain.name,
              nativeCurrency: {
                name: targetChain.nativeCurrency?.name || 'Ether',
                symbol: targetChain.nativeCurrency?.symbol || 'ETH',
                decimals: targetChain.nativeCurrency?.decimals || 18,
              },
              rpcUrls,
              blockExplorerUrls: explorerUrls,
            },
          ],
        });
        return true;
      }

      if (
        errorCode === 4001 ||
        errorMessage.includes('user rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('cancelled')
      ) {
        throw new Error('Network switch was cancelled in wallet.');
      }

      throw switchErr;
    }
  }

  return true;
}
