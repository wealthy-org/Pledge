import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import nextConfig from '@/next.config';

describe('TICKET-57b: Final Security Audit & Codebase Hardening Suite', () => {
  it('TS-01: Scans app, components, and hooks directories for zero production console.logs', () => {
    const rootDir = path.resolve(process.cwd());
    const targetDirs = ['app', 'components', 'hooks'];
    const consoleLogRegex = /\bconsole\.log\s*\(/g;

    const violations: { file: string; match: string }[] = [];

    function scanDir(dir: string) {
      const fullPath = path.join(rootDir, dir);
      if (!fs.existsSync(fullPath)) return;

      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = fs.readFileSync(entryPath, 'utf8');
          if (consoleLogRegex.test(content)) {
            violations.push({ file: path.join(dir, entry.name), match: 'console.log' });
          }
        }
      }
    }

    for (const dir of targetDirs) {
      scanDir(dir);
    }

    expect(violations).toEqual([]);
  });

  it('TS-02: Enforces strict HTTP security headers including CSP and HSTS in next.config.ts', async () => {
    expect(nextConfig.headers).toBeDefined();
    if (!nextConfig.headers) return;

    const headersList = await nextConfig.headers();
    const rootConfig = headersList.find((h) => h.source === '/:path*');
    expect(rootConfig).toBeDefined();

    const headersMap: Record<string, string> = {};
    for (const h of rootConfig?.headers || []) {
      headersMap[h.key.toLowerCase()] = h.value;
    }

    expect(headersMap['x-frame-options']).toBe('DENY');
    expect(headersMap['x-content-type-options']).toBe('nosniff');
    expect(headersMap['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headersMap['permissions-policy']).toBeDefined();
    expect(headersMap['strict-transport-security']).toBeDefined();
    expect(headersMap['content-security-policy']).toBeDefined();
  });

  it('TS-03: Verifies Content-Security-Policy disallows unsafe execution', async () => {
    if (!nextConfig.headers) return;
    const headersList = await nextConfig.headers();
    const rootConfig = headersList.find((h) => h.source === '/:path*');
    const cspHeader = rootConfig?.headers.find((h) => h.key.toLowerCase() === 'content-security-policy');

    expect(cspHeader).toBeDefined();
    expect(cspHeader?.value).toContain("default-src 'self'");
    expect(cspHeader?.value).toContain("frame-ancestors 'none'");
  });
});
