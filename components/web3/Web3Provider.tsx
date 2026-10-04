'use client';

import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { ConnectModalProvider } from '@/contexts/ConnectModalContext';
import { WalletCacheSync } from './WalletCacheSync';

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletCacheSync />
        <ConnectModalProvider>
          {children}
        </ConnectModalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
