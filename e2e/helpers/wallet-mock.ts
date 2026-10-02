import type { Page } from '@playwright/test';

export const WALLET_A_LENDER = '0x02070747E2436d46f56A691F605A7c03332DFe8d';
export const WALLET_B_BORROWER = '0xfB5870428d00B1a18274737609825b74c8C12e2B';

export async function injectConnectedWallet(page: Page, address: string, chainId: number = 46630): Promise<void> {
  await page.addInitScript(
    ({ addr, chain }) => {
      window.localStorage.setItem('wagmi.connected', 'true');
      window.localStorage.setItem('wagmi.recentConnectorId', '"mock"');
      window.localStorage.setItem('wagmi.store', JSON.stringify({
        state: {
          connections: {
            __type: 'Map',
            value: [
              [
                'mock',
                {
                  accounts: [addr],
                  chainId: chain,
                  connector: { id: 'mock', name: 'Mock Wallet', type: 'mock', uid: 'mock' },
                },
              ],
            ],
          },
          chainId: chain,
          current: 'mock',
        },
        version: 2,
      }));
    },
    { addr: address, chain: chainId }
  );
}
