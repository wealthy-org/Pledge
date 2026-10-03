import { createWalletClient, custom } from 'viem';
import { getActiveChain, TESTNET_CHAIN_ID } from '@/config/chains';
import { getPhantomProvider } from '@/lib/web3/wallet';

export async function getEffectiveWalletClient(
  cachedWalletClient?: any,
  targetChainId?: number,
  userAddress?: `0x${string}`
): Promise<any> {
  if (cachedWalletClient) {
    return cachedWalletClient;
  }

  const activeChain = getActiveChain(targetChainId || TESTNET_CHAIN_ID);

  try {
    const { config } = await import('@/lib/wagmi');
    const { getWalletClient, getConnectorClient, switchChain } = await import('wagmi/actions');

    if (config) {
      try {
        const actionClient = await getWalletClient(config, {
          chainId: activeChain.id as any,
        });
        if (actionClient) {
          return actionClient;
        }
      } catch (error) {
        console.warn('[WalletClientHelper] getWalletClient direct retrieval failed:', error);
      }

      try {
        const connectorClient = await getConnectorClient(config, {
          chainId: activeChain.id as any,
        });
        if (connectorClient) {
          return connectorClient;
        }
      } catch (error) {
        console.warn('[WalletClientHelper] getConnectorClient retrieval failed:', error);
      }

      try {
        await switchChain(config, { chainId: activeChain.id as any });
        const switchedClient = await getWalletClient(config, {
          chainId: activeChain.id as any,
        });
        if (switchedClient) {
          return switchedClient;
        }
      } catch (switchError) {
        console.warn('[WalletClientHelper] auto switch chain failed:', switchError);
      }
    }
  } catch (err) {
    console.warn('[WalletClientHelper] dynamic wagmi action retrieval failed:', err);
  }

  if (typeof window !== 'undefined') {
    const provider = getPhantomProvider() || window.ethereum;
    if (provider && userAddress) {
      try {
        const viemClient = createWalletClient({
          account: userAddress,
          chain: activeChain,
          transport: custom(provider as any),
        });
        return viemClient;
      } catch (viemError) {
        console.warn('[WalletClientHelper] fallback createWalletClient failed:', viemError);
      }
    }
  }

  throw new Error(
    `Wallet client unavailable. Please ensure your wallet (e.g. Phantom / MetaMask) is unlocked and switched to ${activeChain.name} (Chain ID: ${activeChain.id}).`
  );
}
