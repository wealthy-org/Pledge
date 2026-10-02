import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { robinhoodTestnet, robinhoodMainnet, SUPPORTED_CHAINS } from '@/config/chains';

export { robinhoodTestnet, robinhoodMainnet, SUPPORTED_CHAINS };

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
    [robinhoodTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.robinhood.com'),
    [robinhoodMainnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.mainnet.robinhood.com'),
  },
});
