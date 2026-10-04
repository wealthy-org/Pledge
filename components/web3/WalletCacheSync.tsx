'use client';

import { useEffect, useRef } from 'react';
import { useConnection } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';

export function WalletCacheSync() {
  const { address, isConnected } = useConnection();
  const queryClient = useQueryClient();
  const prevAddressRef = useRef<string | undefined>(address);
  const prevConnectedRef = useRef<boolean>(isConnected);

  useEffect(() => {
    const prevAddress = prevAddressRef.current;
    const prevConnected = prevConnectedRef.current;

    const hasDisconnected = prevConnected && !isConnected;
    const hasAccountChanged = Boolean(prevAddress && address && prevAddress.toLowerCase() !== address.toLowerCase());

    if (hasDisconnected || hasAccountChanged) {
      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key) || key.length === 0) return false;
          const first = key[0];
          if (first === 'portfolio' || first === 'eligible-nfts') return true;
          if (first === 'offers' || first === 'loans') {
            const params = key[1] as Record<string, unknown> | undefined;
            if (params && (Boolean(params.lender) || Boolean(params.borrower))) {
              return true;
            }
          }
          return false;
        },
      });
    }

    prevAddressRef.current = address;
    prevConnectedRef.current = isConnected;
  }, [address, isConnected, queryClient]);

  return null;
}
