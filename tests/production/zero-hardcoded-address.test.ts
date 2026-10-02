import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID, getActiveChain, robinhoodMainnet } from '@/config/chains';
import { getPledgeLoansAddress } from '@/config/contracts';

describe('TICKET-54b: Zero Hardcoded Address & Mainnet Configuration Finalization', () => {
  it('TS-01: Scans app, components, and hooks directories for zero rogue hardcoded addresses', () => {
    const rootDir = path.resolve(process.cwd());
    const targetDirs = ['app', 'components', 'hooks'];
    const hexAddressRegex = /0x[a-fA-F0-9]{40}/g;

    const allowedFiles = [
      path.normalize('lib/mock/fixtures.ts'),
      path.normalize('config/contracts.ts'),
      path.normalize('config/collections.ts'),
      path.normalize('config/collections.mainnet.ts'),
      path.normalize('config/chains.ts'),
    ];

    const violations: { file: string; address: string }[] = [];

    function scanDir(dir: string) {
      const fullPath = path.join(rootDir, dir);
      if (!fs.existsSync(fullPath)) return;

      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const relativePath = path.normalize(path.join(dir, entry.name));
          if (allowedFiles.some((allowed) => relativePath.endsWith(allowed))) {
            continue;
          }

          const content = fs.readFileSync(entryPath, 'utf8');
          const matches = content.match(hexAddressRegex);
          if (matches) {
            for (const match of matches) {
              violations.push({ file: relativePath, address: match });
            }
          }
        }
      }
    }

    for (const dir of targetDirs) {
      scanDir(dir);
    }

    expect(violations).toEqual([]);
  });

  it('TS-02: Resolves PledgeLoans contract address accurately for mainnet and testnet', () => {
    const testnetAddr = getPledgeLoansAddress(TESTNET_CHAIN_ID);
    const mainnetAddr = getPledgeLoansAddress(MAINNET_CHAIN_ID);

    expect(testnetAddr).toBeDefined();
    expect(testnetAddr.startsWith('0x')).toBe(true);
    expect(testnetAddr.length).toBe(42);

    expect(mainnetAddr).toBeDefined();
    expect(mainnetAddr.startsWith('0x')).toBe(true);
    expect(mainnetAddr.length).toBe(42);
    expect(mainnetAddr).not.toBe(testnetAddr);
  });

  it('TS-03: Resolves mainnet chain configuration with proper Blockscout explorer and RPC', () => {
    const mainnetConfig = robinhoodMainnet;

    expect(mainnetConfig.id).toBe(4663);
    expect(mainnetConfig.name).toBe('Robinhood Chain');
    expect(mainnetConfig.testnet).toBe(false);
    expect(mainnetConfig.rpcUrls.default.http[0]).toBe('https://rpc.mainnet.robinhood.com');
    expect(mainnetConfig.blockExplorers?.default.url).toBe('https://explorer.robinhood.com');
  });

  it('TS-04: getActiveChain respects process.env.NEXT_PUBLIC_CHAIN_ID for production deployment', () => {
    const originalEnv = process.env.NEXT_PUBLIC_CHAIN_ID;
    try {
      process.env.NEXT_PUBLIC_CHAIN_ID = '4663';
      const activeMainnet = getActiveChain();
      expect(activeMainnet.id).toBe(4663);
      expect(activeMainnet.testnet).toBe(false);

      process.env.NEXT_PUBLIC_CHAIN_ID = '46630';
      const activeTestnet = getActiveChain();
      expect(activeTestnet.id).toBe(46630);
      expect(activeTestnet.testnet).toBe(true);
    } finally {
      process.env.NEXT_PUBLIC_CHAIN_ID = originalEnv;
    }
  });
});
