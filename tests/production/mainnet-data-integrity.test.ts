import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CURATED_COLLECTIONS } from '@/config/collections';
import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from '@/config/chains';

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'contracts/lib'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe('TICKET-44: Mainnet Data Integrity & Clean Production Audit', () => {
  it('TS-01: No production app page or component imports from mock or fixture directories', () => {
    const appDir = path.resolve(process.cwd(), 'app');
    const componentsDir = path.resolve(process.cwd(), 'components');
    const sourceFiles = [...scanDirectory(appDir), ...scanDirectory(componentsDir)];

    const forbiddenImports = ['/mocks/', '/fixtures/', 'mock-collections', 'dummy-'];

    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.trim().startsWith('import') || line.trim().startsWith('export')) {
          for (const forbidden of forbiddenImports) {
            if (line.includes(forbidden)) {
              violations.push(`${file}:${index + 1} -> ${line.trim()}`);
            }
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('TS-02: No "TODO" or placeholder markers in source code files', () => {
    const appDir = path.resolve(process.cwd(), 'app');
    const componentsDir = path.resolve(process.cwd(), 'components');
    const hooksDir = path.resolve(process.cwd(), 'hooks');
    const sourceFiles = [
      ...scanDirectory(appDir),
      ...scanDirectory(componentsDir),
      ...scanDirectory(hooksDir),
    ];

    const violations: string[] = [];

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (content.includes('TODO:') || content.includes('FIXME:') || content.includes('replace with real data')) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([]);
  });

  it('TS-03: Curated collections define valid mainnet and testnet addresses', () => {
    expect(CURATED_COLLECTIONS.length).toBeGreaterThan(0);

    for (const col of CURATED_COLLECTIONS) {
      expect(col.addresses[MAINNET_CHAIN_ID]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(col.addresses[TESTNET_CHAIN_ID]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(col.maxLtvBps).toBeGreaterThan(0);
      expect(col.maxLtvBps).toBeLessThanOrEqual(10000);
      expect(col.symbol).toBeDefined();
      expect(col.name).toBeDefined();
    }
  });

  it('TS-04: Chain IDs are correctly configured for Robinhood Testnet and Mainnet', () => {
    expect(TESTNET_CHAIN_ID).toBe(46630);
    expect(MAINNET_CHAIN_ID).toBe(4663);
  });
});
