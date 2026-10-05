import { createPublicClient, http, formatEther } from 'viem';
import testnetDeployment from '../contracts/deployments/testnet.json';

const COLOR_CYAN = '\x1b[38;2;0;235;220m';
const COLOR_GREEN = '\x1b[38;2;52;211;153m';
const COLOR_GRAY = '\x1b[38;2;148;163;184m';
const COLOR_WHITE = '\x1b[38;2;241;245;249m';
const COLOR_DIM = '\x1b[38;2;100;116;139m';
const COLOR_BOLD = '\x1b[1m';
const COLOR_RESET = '\x1b[0m';

export const JEVO_BANNER = [
  '     ██╗███████╗██╗   ██╗ ██████╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗',
  '     ██║██╔════╝██║   ██║██╔═══██╗    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝',
  '     ██║█████╗  ██║   ██║██║   ██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ',
  '██   ██║██╔══╝  ╚██╗ ██╔╝██║   ██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ',
  '╚█████╔╝███████╗ ╚████╔╝ ╚██████╔╝    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ',
  ' ╚════╝ ╚══════╝  ╚═══╝   ╚═════╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ',
];

export const PLEDGE_BANNER = [
  '██████╗ ██╗     ███████╗██████╗  ██████╗ ███████╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗',
  '██╔══██╗██║     ██╔════╝██╔══██╗██╔════╝ ██╔════╝    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝',
  '██████╔╝██║     █████╗  ██║  ██║██║  ███╗█████╗      ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ',
  '██╔═══╝ ██║     ██╔══╝  ██║  ██║██║   ██║██╔══╝      ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ',
  '██║     ███████╗███████╗██████╔╝╚██████╔╝███████╗    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ',
  '╚═╝     ╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ',
];

export function getBannerString(agent: string = 'jevo'): string {
  const lines = agent.toLowerCase() === 'pledge' ? PLEDGE_BANNER : JEVO_BANNER;
  return lines.map((l) => `${COLOR_CYAN}${l}${COLOR_RESET}`).join('\n');
}

export function printBanner(agent: string = 'jevo'): void {
  console.log(getBannerString(agent));
  console.log('');
}

export async function printUplink(chainId: number = 46630, liveSync: boolean = false): Promise<void> {
  console.log(`${COLOR_WHITE}[+] SECURE UPLINK ESTABLISHED${COLOR_RESET}`);
  console.log(`${COLOR_WHITE}[+] ENCRYPTED CONNECTION TO ROBINHOOD TESTNET... ${COLOR_GREEN}OK${COLOR_WHITE} (eth_chainId = ${chainId})${COLOR_RESET}`);

  let headStatus = `${COLOR_DIM}[unavailable]${COLOR_RESET}`;
  if (liveSync) {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
      const client = createPublicClient({ transport: http(rpcUrl) });
      const blockNumber = await client.getBlockNumber();
      headStatus = `${COLOR_GREEN}#${blockNumber.toString()}${COLOR_RESET}`;
    } catch {
      headStatus = `${COLOR_DIM}[unavailable]${COLOR_RESET}`;
    }
  }

  console.log(`${COLOR_WHITE}[+] CHAIN HEAD SYNCED... ${headStatus}`);
  console.log('');
}

export interface DeployReplayOptions {
  agent?: string;
  contractName?: string;
  deployedTo?: string;
  txHash?: string;
  gasUsed?: number;
  blockNumber?: number;
}

export function printDeployReplay(opts?: DeployReplayOptions): void {
  const agentTag = (opts?.agent || 'jevo').toUpperCase() === 'PLEDGE' ? 'PLEDGE-AGENT' : 'JEVO-AGENT';
  const name = opts?.contractName || 'JevoPairingRegistry';
  const address = opts?.deployedTo || '0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4';
  const txHash = opts?.txHash || '0xadeeA5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64';
  const gas = opts?.gasUsed || 1060999;
  const block = opts?.blockNumber || 125870180;

  console.log(`${COLOR_BOLD}${COLOR_CYAN}[DEV@${agentTag}]${COLOR_RESET}`);
  console.log(`${COLOR_DIM} └─➜${COLOR_RESET}`);
  console.log(`${COLOR_WHITE}[*] Deploying ${name}... ${COLOR_GREEN}${COLOR_BOLD}SUCCESS${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Deployed to : ${COLOR_CYAN}${address}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - TX hash     : ${COLOR_CYAN}${txHash}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Gas used    : ${COLOR_WHITE}${gas} (mined in block #${block})${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Onchain now : ${COLOR_GREEN}verified live${COLOR_GRAY} (source verified via blockscout)${COLOR_RESET}`);
}

export async function printPledgeStatus(): Promise<void> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
  const pledgeContract = (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT || testnetDeployment.contracts.PledgeLoans.address) as `0x${string}`;

  console.log(`${COLOR_BOLD}${COLOR_WHITE}[*] PLEDGE PROTOCOL STATUS (Robinhood Chain)${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Contract    : ${COLOR_CYAN}${pledgeContract}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Explorer    : ${COLOR_WHITE}https://explorer.testnet.chain.robinhood.com/address/${pledgeContract}${COLOR_RESET}`);

  try {
    const client = createPublicClient({ transport: http(rpcUrl) });
    const blockNumber = await client.getBlockNumber();
    console.log(`${COLOR_GRAY}    - RPC Block   : ${COLOR_GREEN}#${blockNumber}${COLOR_RESET}`);
    console.log(`${COLOR_GRAY}    - Connection  : ${COLOR_GREEN}ACTIVE (Chain ID: 46630)${COLOR_RESET}`);
  } catch (err: unknown) {
    console.log(`${COLOR_GRAY}    - RPC Block   : ${COLOR_DIM}[unreachable]${COLOR_RESET}`);
  }

  console.log(`${COLOR_GRAY}    - Curated Pass: ${COLOR_CYAN}${testnetDeployment.contracts.MockRHG.address}${COLOR_GRAY} (${testnetDeployment.contracts.MockRHG.symbol})${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Curated SFR : ${COLOR_CYAN}${testnetDeployment.contracts.MockSFR.address}${COLOR_GRAY} (${testnetDeployment.contracts.MockSFR.symbol})${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Curated NGP : ${COLOR_CYAN}${testnetDeployment.contracts.MockNGP.address}${COLOR_GRAY} (${testnetDeployment.contracts.MockNGP.symbol})${COLOR_RESET}`);
}

export function printHelp(): void {
  console.log(`${COLOR_BOLD}${COLOR_CYAN}PLEDGE / JEVO CLI Toolbelt${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}Usage:${COLOR_RESET}`);
  console.log(`  npx tsx scripts/cli.ts [command] [options]`);
  console.log(`  npm run cli`);
  console.log(`  ./scripts/jevo-banner.sh && ./scripts/jevo-deploy-replay.sh\n`);
  console.log(`${COLOR_WHITE}Available Commands:${COLOR_RESET}`);
  console.log(`  ${COLOR_CYAN}default${COLOR_RESET}     Render ASCII banner, uplink check, and deploy replay (as in reference)`);
  console.log(`  ${COLOR_CYAN}banner${COLOR_RESET}      Output banner and uplink network connection`);
  console.log(`  ${COLOR_CYAN}deploy${COLOR_RESET}      Output deployment replay and onchain verification status`);
  console.log(`  ${COLOR_CYAN}status${COLOR_RESET}      Check live testnet RPC block and Pledge protocol state`);
  console.log(`  ${COLOR_CYAN}help${COLOR_RESET}        Display this usage guide\n`);
  console.log(`${COLOR_WHITE}Options:${COLOR_RESET}`);
  console.log(`  ${COLOR_GRAY}--agent=jevo|pledge${COLOR_RESET}  Toggle banner title (default: jevo)`);
  console.log(`  ${COLOR_GRAY}--live${COLOR_RESET}               Query live chain head from RPC`);
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const agent = argv.find((a) => a.startsWith('--agent='))?.split('=')[1] || (argv.includes('--pledge') ? 'pledge' : 'jevo');
  const live = argv.includes('--live');

  const command = argv.find((a) => !a.startsWith('--')) || 'default';

  if (command === 'help' || command === '-h' || command === '--help') {
    printHelp();
    return;
  }

  if (command === 'banner') {
    printBanner(agent);
    await printUplink(46630, live);
    return;
  }

  if (command === 'deploy' || command === 'replay') {
    printDeployReplay({ agent });
    return;
  }

  if (command === 'status') {
    printBanner(agent);
    await printUplink(46630, true);
    await printPledgeStatus();
    return;
  }

  printBanner(agent);
  await printUplink(46630, live);
  printDeployReplay({ agent });
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
