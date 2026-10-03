import { http, fallback, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { robinhoodTestnet, robinhoodMainnet, SUPPORTED_CHAINS } from '@/config/chains';

export { robinhoodTestnet, robinhoodMainnet, SUPPORTED_CHAINS };

function getRpcUrl(defaultFallback: string): string {
  const configured = process.env.NEXT_PUBLIC_RPC_URL;
  if (configured && !configured.startsWith('/')) {
    return configured.trim();
  }
  if (typeof window !== 'undefined') {
    return '/api/rpc';
  }
  return defaultFallback;
}

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected({
      target: 'phantom',
      shimDisconnect: true,
    }),
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [robinhoodTestnet.id]: fallback([
      http(getRpcUrl('https://rpc.testnet.chain.robinhood.com'), { retryCount: 2, timeout: 8000 }),
      http('/api/rpc', { retryCount: 1, timeout: 8000 }),
    ]),
    [robinhoodMainnet.id]: fallback([
      http(getRpcUrl('https://rpc.mainnet.chain.robinhood.com'), { retryCount: 2, timeout: 8000 }),
      http('/api/rpc', { retryCount: 1, timeout: 8000 }),
    ]),
  },
});
