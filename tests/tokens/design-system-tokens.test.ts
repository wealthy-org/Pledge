import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TICKET-28: CSS Design System Tokens & Typography Test Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const cssPath = path.join(rootDir, 'app/globals.css');

  it('TS-01: globals.css exists and defines all required Clean Professional Finance CSS variables', () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    const css = fs.readFileSync(cssPath, 'utf-8');

    const expectedTokens: Record<string, string> = {
      '--bg': '#ffffff',
      '--panel': '#f6f8fa',
      '--raised': '#eef3f5',
      '--surface': '#fafcfc',
      '--line': '#e1e8e9',
      '--text': '#142d2b',
      '--muted': '#627478',
      '--always-white': '#ffffff',
      '--primary': '#087f5b',
      '--primary70': '#087f5b70',
      '--primary50': '#087f5b50',
      '--primary90': '#087f5b90',
      '--primary-dark': '#157454',
      '--primary-hover-bg': '#076b4d',
      '--primary-soft': '#eaf6ef',
      '--primary100': '#eaf6ef',
      '--lime': '#087f5b',
      '--green': '#157454',
      '--green-soft': '#eaf6ef',
      '--blue': '#276eb6',
      '--blue-soft': '#eaf3fc',
      '--success': '#267451',
      '--warning-text': '#775d26',
      '--warning-bg': '#fff9eb',
      '--warning-border': '#eaddb9',
      '--error': '#b7462c',
      '--disabled': '#94a3a8',
      '--disabled-bg': '#edf2f3',
      '--disabled-text': '#879a9d',
      '--disabled-border': '#d2dcdf',
      '--radius': '16px',
      '--rail-width': '68px',
      '--rail-expanded-width': '220px',
      '--feed-width': '320px',
      '--header-height': '76px',
      '--footer-bar-height': '32px',
      '--shadow-subtle': '0 1px 3px rgba(20, 45, 43, 0.05)',
      '--shadow-raised': '0 4px 12px rgba(20, 45, 43, 0.08)',
      '--z-header': '40',
      '--z-drawer': '50',
      '--z-modal': '60',
      '--z-toast': '70',
    };

    for (const [token, value] of Object.entries(expectedTokens)) {
      expect(css).toContain(`${token}: ${value}`);
    }
  });

  it('TS-02: Tailwind v4 @theme directive exports full token palette', () => {
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toContain('@theme');
    expect(css).toContain('--color-primary: var(--primary)');
    expect(css).toContain('--color-panel: var(--panel)');
    expect(css).toContain('--color-line: var(--line)');
    expect(css).toContain('--color-surface: var(--surface)');
    expect(css).toContain('--color-disabled-bg: var(--disabled-bg)');
    expect(css).toContain('--color-disabled-text: var(--disabled-text)');
    expect(css).toContain('--font-sans: var(--font-inter)');
  });

  it('TS-03: Dark mode token scaffold is defined under [data-theme="dark"]', () => {
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('--bg: #0d1117');
    expect(css).toContain('--panel: #161b22');
    expect(css).toContain('--line: #30363d');
    expect(css).toContain('--disabled-bg: #161d26');
    expect(css).toContain('--disabled-text: #596775');
  });
});
