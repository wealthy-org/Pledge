import { http, fallback, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { robinhoodTestnet, robinhoodMainnet, SUPPORTED_CHAINS } from '@/config/chains';

export { robinhoodTestnet, robinhoodMainnet, SUPPORTED_CHAINS };

function getRpcUrl(defaultFallback: string): string {
  const configured = process.env.NEXT_PUBLIC_RPC_URL;
  if (configured && !configured.includes('testnet.robinhood.com')) {
    return configured;
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
      http(getRpcUrl('/api/rpc'), { retryCount: 1, timeout: 3000 }),
    ]),
    [robinhoodMainnet.id]: fallback([
      http(getRpcUrl('/api/rpc'), { retryCount: 1, timeout: 3000 }),
    ]),
  },
});

