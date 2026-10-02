export type WalletType = 'phantom' | 'metamask' | 'rabby' | 'injected';

export interface WalletAvailability {
  phantom: boolean;
  metamask: boolean;
  rabby: boolean;
  injected: boolean;
}

export interface EthereumProvider {
  isPhantom?: boolean;
  isMetaMask?: boolean;
  isRabby?: boolean;
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    phantom?: {
      ethereum?: EthereumProvider;
    };
    ethereum?: EthereumProvider & {
      providers?: EthereumProvider[];
    };
  }
}

export function truncateAddress(address?: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getPhantomProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  if (window.phantom?.ethereum?.isPhantom) {
    return window.phantom.ethereum;
  }
  if (window.phantom?.ethereum) {
    return window.phantom.ethereum;
  }
  if (window.ethereum?.isPhantom) {
    return window.ethereum;
  }
  return null;
}

export function checkWalletAvailability(): WalletAvailability {
  if (typeof window === 'undefined') {
    return { phantom: false, metamask: false, rabby: false, injected: false };
  }

  const hasPhantom = !!(window.phantom?.ethereum || window.ethereum?.isPhantom);
  const hasMetaMask = !!(window.ethereum?.isMetaMask && !window.ethereum?.isPhantom && !window.ethereum?.isRabby);
  const hasRabby = !!window.ethereum?.isRabby;
  const hasInjected = !!window.ethereum;

  return {
    phantom: hasPhantom,
    metamask: hasMetaMask,
    rabby: hasRabby,
    injected: hasInjected,
  };
}
