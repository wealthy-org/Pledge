import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import {
  getBannerString,
  printUplink,
  printDeployReplay,
  printHelp,
  simulateCreateOffer,
  simulateCancelOffer,
  simulateRepayLoan,
  executeCommand,
  main,
} from '../../scripts/cli';

describe('Pledge Agent CLI Test Suite', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders PLEDGE AGENT banner with ANSI Shadow art', () => {
    const banner = getBannerString();
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

  it('prints deployment replay with PledgeLoans address and tx hash', () => {
    printDeployReplay();
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('[DEV@PLEDGE-AGENT]');
    expect(output).toContain('└─➜');
    expect(output).toContain('Deploying PledgeLoans...');
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
    expect(output).toContain('PLEDGE AGENT CLI Toolbelt');
    expect(output).toContain('Available Commands');
    expect(output).toContain('status | overview');
    expect(output).toContain('collections [query]');
    expect(output).toContain('collection <address>');
    expect(output).toContain('offers [collection]');
    expect(output).toContain('loans [borrower]');
    expect(output).toContain('search <query>');
    expect(output).toContain('offer:create <col> <amt> <apr> <days>');
    expect(output).toContain('offer:cancel <offerId>');
    expect(output).toContain('loan:repay <loanId>');
  });

  it('simulates createOffer transaction payload and calldata encoding', () => {
    simulateCreateOffer(
      '0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496',
      '1.5',
      1200,
      14
    );
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('TRANSACTION PREPARED: createOffer');
    expect(output).toContain('1.5 ETH');
    expect(output).toContain('12.00% (1200 bps)');
    expect(output).toContain('14 days');
    expect(output).toContain('0x');
  });

  it('simulates cancelOffer and repayLoan transaction payload', () => {
    simulateCancelOffer(42);
    simulateRepayLoan(108);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('TRANSACTION PREPARED: cancelOffer');
    expect(output).toContain('Offer ID');
    expect(output).toContain('42');
    expect(output).toContain('TRANSACTION PREPARED: repayLoan');
    expect(output).toContain('Loan ID');
    expect(output).toContain('108');
  });

  it('executes main with default arguments without throwing', async () => {
    await main([]);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('[+] SECURE UPLINK ESTABLISHED');
    expect(output).toContain('[DEV@PLEDGE-AGENT]');
  });

  it('executes subcommands via executeCommand without throwing', async () => {
    await executeCommand(['help']);
    await executeCommand(['banner']);
    await executeCommand(['replay']);
    await executeCommand(['offer:cancel', '1']);
    await executeCommand(['loan:repay', '2']);
    const output = consoleSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
    expect(output).toContain('PLEDGE AGENT CLI Toolbelt');
    expect(output).toContain('[DEV@PLEDGE-AGENT]');
    expect(output).toContain('cancelOffer');
    expect(output).toContain('repayLoan');
  });

  it('executes pledge bash scripts directly and outputs identical text structure', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const bannerOutput = execSync(`bash "${path.join(rootDir, 'scripts/pledge-banner.sh')}"`, {
      encoding: 'utf-8',
    });
    expect(bannerOutput).toContain('[+] SECURE UPLINK ESTABLISHED');
    expect(bannerOutput).toContain('eth_chainId = 46630');

    const replayOutput = execSync(`bash "${path.join(rootDir, 'scripts/pledge-deploy-replay.sh')}"`, {
      encoding: 'utf-8',
    });
    expect(replayOutput).toContain('[DEV@PLEDGE-AGENT]');
    expect(replayOutput).toContain('Deploying PledgeLoans...');
    expect(replayOutput).toContain('0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4');
  });
});
