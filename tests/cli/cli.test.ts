import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import {
  getBannerString,
  printUplink,
  printDeployReplay,
  printHelp,
  main,
} from '../../scripts/cli';

describe('Pledge & Jevo Agent CLI Test Suite', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders JEVO banner with exact ANSI Shadow art', () => {
    const banner = getBannerString('jevo');
    expect(banner).toContain('██╗███████╗██╗');
    expect(banner).toContain('█████╗  ██████╗');
  });

  it('renders PLEDGE banner when requested', () => {
    const banner = getBannerString('pledge');
    expect(banner).toContain('██████╗ ██╗');
    expect(banner).toContain('█████╗  ██████╗');
  });

  it('prints uplink status and Robinhood Testnet chain ID', async () => {
    await printUplink(46630, false);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('[+] SECURE UPLINK ESTABLISHED');
    expect(output).toContain('[+] ENCRYPTED CONNECTION TO ROBINHOOD TESTNET... ');
    expect(output).toContain('(eth_chainId = 46630)');
    expect(output).toContain('[+] CHAIN HEAD SYNCED... ');
    expect(output).toContain('[unavailable]');
  });

  it('prints deployment replay with exact Jevo registry and transaction hash', () => {
    printDeployReplay();
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('[DEV@JEVO-AGENT]');
    expect(output).toContain('└─➜');
    expect(output).toContain('Deploying JevoPairingRegistry...');
    expect(output).toContain('SUCCESS');
    expect(output).toContain('0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4');
    expect(output).toContain('0xadeeA5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64');
    expect(output).toContain('1060999 (mined in block #125870180)');
    expect(output).toContain('verified live');
    expect(output).toContain('source verified via blockscout');
  });

  it('prints help message properly', () => {
    printHelp();
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('PLEDGE / JEVO CLI Toolbelt');
    expect(output).toContain('Available Commands');
  });

  it('executes main with default arguments without throwing', async () => {
    await main([]);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('[+] SECURE UPLINK ESTABLISHED');
    expect(output).toContain('[DEV@JEVO-AGENT]');
  });

  it('executes bash scripts directly and outputs identical text structure', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const bannerOutput = execSync(`bash "${path.join(rootDir, 'scripts/jevo-banner.sh')}"`, {
      encoding: 'utf-8',
    });
    expect(bannerOutput).toContain('[+] SECURE UPLINK ESTABLISHED');
    expect(bannerOutput).toContain('eth_chainId = 46630');

    const replayOutput = execSync(`bash "${path.join(rootDir, 'scripts/jevo-deploy-replay.sh')}"`, {
      encoding: 'utf-8',
    });
    expect(replayOutput).toContain('[DEV@JEVO-AGENT]');
    expect(replayOutput).toContain('Deploying JevoPairingRegistry...');
    expect(replayOutput).toContain('0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4');
  });
});
