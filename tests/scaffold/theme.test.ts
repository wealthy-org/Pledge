import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';

describe('TICKET-01: Theme & Scaffolding Test Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const cssPath = path.join(rootDir, 'app/globals.css');
  const layoutPath = path.join(rootDir, 'app/layout.tsx');
  const wagmiPath = path.join(rootDir, 'lib/wagmi.ts');

  it('TS-01: globals.css defines all required Clean Professional Finance CSS variables', () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    const expectedTokens: Record<string, string> = {
      '--bg': '#ffffff',
      '--panel': '#f6f8fa',
      '--raised': '#eef3f5',
      '--line': '#e1e8e9',
      '--text': '#142d2b',
      '--muted': '#627478',
      '--lime': '#087f5b',
      '--green': '#157454',
      '--blue': '#276eb6',
      '--blue-soft': '#eaf3fc',
      '--green-soft': '#eaf6ef',
      '--radius': '16px',
    };

    for (const [token, value] of Object.entries(expectedTokens)) {
      expect(cssContent).toContain(`${token}: ${value}`);
    }
  });

  it('TS-02: globals.css binds design tokens in Tailwind v4 @theme directive', () => {
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent).toContain('@theme');
    expect(cssContent).toContain('--color-panel: var(--panel)');
    expect(cssContent).toContain('--color-line: var(--line)');
    expect(cssContent).toContain('--color-lime: var(--lime)');
    expect(cssContent).toContain('--color-green: var(--green)');
    expect(cssContent).toContain('--color-blue: var(--blue)');
    expect(cssContent).toContain('--font-sans: var(--font-inter)');
  });

  it('TS-03: globals.css contains no dark mode media query', () => {
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent).not.toContain('prefers-color-scheme: dark');
    expect(cssContent).not.toContain('@media (prefers-color-scheme: dark)');
  });

  it('TS-04: app/layout.tsx configures Inter font and base metadata', () => {
    expect(fs.existsSync(layoutPath)).toBe(true);
    const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    expect(layoutContent).toContain('next/font/google');
    expect(layoutContent).toContain('Inter');
    expect(layoutContent).toContain('--font-inter');
    expect(layoutContent).toContain('Pledge | NFT Lending Marketplace');
  });

  it('TS-05: Environment skeletons exist and contain required variables', () => {
    const envFiles = ['.env.example', '.env.testnet.example', '.env.mainnet.example'];
    const requiredKeys = [
      'NEXT_PUBLIC_CHAIN_ID',
      'NEXT_PUBLIC_RPC_URL',
      'NEXT_PUBLIC_PLEDGE_CONTRACT',
      'GONDI_API_URL',
      'GONDI_CDN_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_DB_SCHEMA',
    ];

    for (const file of envFiles) {
      const filePath = path.join(rootDir, file);
      expect(fs.existsSync(filePath), `Missing ${file}`).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const key of requiredKeys) {
        expect(content).toContain(key);
      }
    }
  });

  it('TS-06: lib/wagmi.ts exports valid wagmi config with viem chain definitions', async () => {
    expect(fs.existsSync(wagmiPath)).toBe(true);
    const { config, robinhoodTestnet, robinhoodMainnet } = await import('@/lib/wagmi');
    expect(config).toBeDefined();
    expect(robinhoodTestnet).toBeDefined();
    expect(robinhoodTestnet.id).toBe(TESTNET_CHAIN_ID);
    expect(robinhoodMainnet).toBeDefined();
    expect(robinhoodMainnet.id).toBe(MAINNET_CHAIN_ID);
  });
});
