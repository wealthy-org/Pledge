'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConnectWalletModal } from '@/components/web3/ConnectWalletModal';
import { Toast, type ToastType } from '@/components/ui/Toast';

interface ConnectModalContextType {
  isOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
}

const ConnectModalContext = createContext<ConnectModalContextType | undefined>(undefined);

export function ConnectModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const openConnectModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeConnectModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ConnectModalContext.Provider value={{ isOpen, openConnectModal, closeConnectModal }}>
      {children}
      <ConnectWalletModal
        isOpen={isOpen}
        onClose={closeConnectModal}
        onSuccess={(walletName) => {
          setToast({
            type: 'success',
            message: walletName ? `Connected to ${walletName} successfully!` : 'Wallet connected successfully!',
          });
        }}
        onError={(err) => {
          setToast({
            type: 'error',
            message: err.message || 'Failed to connect wallet. Please try again.',
          });
        }}
      />
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </ConnectModalContext.Provider>
  );
}

export function useConnectModal(): ConnectModalContextType {
  const context = useContext(ConnectModalContext);
  if (!context) {
    return {
      isOpen: false,
      openConnectModal: () => {},
      closeConnectModal: () => {},
    };
  }
  return context;
}
