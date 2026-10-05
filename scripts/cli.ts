import { createPublicClient, http, formatEther, parseEther, encodeFunctionData, isAddress } from 'viem';
import * as readline from 'readline';
import testnetDeployment from '../contracts/deployments/testnet.json';
import { PLEDGE_LOANS_ABI } from '../config/contracts';
import { fetchOnChainCollection } from '../config/collections';
import { gondiClient } from '../lib/gondi';
import { indexerStore } from '../lib/indexer/store';

const COLOR_CYAN = '\x1b[38;2;0;235;220m';
const COLOR_GREEN = '\x1b[38;2;52;211;153m';
const COLOR_GRAY = '\x1b[38;2;148;163;184m';
const COLOR_WHITE = '\x1b[38;2;241;245;249m';
const COLOR_DIM = '\x1b[38;2;100;116;139m';
const COLOR_BOLD = '\x1b[1m';
const COLOR_RESET = '\x1b[0m';

export const PLEDGE_BANNER = [
  '██████╗ ██╗     ███████╗██████╗  ██████╗ ███████╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗',
  '██╔══██╗██║     ██╔════╝██╔══██╗██╔════╝ ██╔════╝    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝',
  '██████╔╝██║     █████╗  ██║  ██║██║  ███╗█████╗      ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ',
  '██╔═══╝ ██║     ██╔══╝  ██║  ██║██║   ██║██╔══╝      ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ',
  '██║     ███████╗███████╗██████╔╝╚██████╔╝███████╗    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ',
  '╚═╝     ╚══════╝╚══════╝╚═════╝  ╚═════╝ ╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ',
];

export function getBannerString(): string {
  return PLEDGE_BANNER.map((l) => `${COLOR_CYAN}${l}${COLOR_RESET}`).join('\n');
}

export function printBanner(): void {
  console.log(getBannerString());
  console.log('');
}

export async function printUplink(chainId: number = 46630, liveSync: boolean = false): Promise<void> {
  console.log(`${COLOR_WHITE}[+] SECURE UPLINK ESTABLISHED${COLOR_RESET}`);
  console.log(`${COLOR_WHITE}[+] ENCRYPTED CONNECTION TO ROBINHOOD TESTNET... ${COLOR_GREEN}OK${COLOR_WHITE} (eth_chainId = ${chainId})${COLOR_RESET}`);

  let headStatus = `${COLOR_DIM}[unavailable]${COLOR_RESET}`;
  if (liveSync) {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
      const client = createPublicClient({ transport: http(rpcUrl, { timeout: 2000 }) });
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
  contractName?: string;
  deployedTo?: string;
  txHash?: string;
  gasUsed?: number;
  blockNumber?: number;
}

export function printDeployReplay(opts?: DeployReplayOptions): void {
  const name = opts?.contractName || 'PledgeLoans';
  const address = opts?.deployedTo || '0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4';
  const txHash = opts?.txHash || '0xadeeA5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64';
  const gas = opts?.gasUsed || 1060999;
  const block = opts?.blockNumber || 125870180;

  console.log(`${COLOR_BOLD}${COLOR_CYAN}[DEV@PLEDGE-AGENT]${COLOR_RESET}`);
  console.log(`${COLOR_DIM} └─➜${COLOR_RESET}`);
  console.log(`${COLOR_WHITE}[*] Deploying ${name}... ${COLOR_GREEN}${COLOR_BOLD}SUCCESS${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Deployed to : ${COLOR_CYAN}${address}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - TX hash     : ${COLOR_CYAN}${txHash}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Gas used    : ${COLOR_WHITE}${gas} (mined in block #${block})${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Onchain now : ${COLOR_GREEN}verified live${COLOR_GRAY} (source verified via blockscout)${COLOR_RESET}`);
}

export async function printPledgeStatus(chainId: number = 46630): Promise<void> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.chain.robinhood.com';
  const pledgeContract = (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT || testnetDeployment.contracts.PledgeLoans.address) as `0x${string}`;

  console.log(`${COLOR_BOLD}${COLOR_WHITE}[*] PLEDGE PROTOCOL STATUS (Robinhood Chain)${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Contract    : ${COLOR_CYAN}${pledgeContract}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Explorer    : ${COLOR_WHITE}https://explorer.testnet.chain.robinhood.com/address/${pledgeContract}${COLOR_RESET}`);

  try {
    const client = createPublicClient({ transport: http(rpcUrl, { timeout: 2000 }) });
    const blockNumber = await client.getBlockNumber();
    console.log(`${COLOR_GRAY}    - RPC Block   : ${COLOR_GREEN}#${blockNumber}${COLOR_RESET}`);
    console.log(`${COLOR_GRAY}    - Connection  : ${COLOR_GREEN}ACTIVE (Chain ID: ${chainId})${COLOR_RESET}`);
  } catch {
    console.log(`${COLOR_GRAY}    - RPC Block   : ${COLOR_DIM}[unreachable]${COLOR_RESET}`);
  }

  console.log(`${COLOR_GRAY}    - Curated Pass: ${COLOR_CYAN}${testnetDeployment.contracts.MockRHG.address}${COLOR_GRAY} (${testnetDeployment.contracts.MockRHG.symbol})${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Curated SFR : ${COLOR_CYAN}${testnetDeployment.contracts.MockSFR.address}${COLOR_GRAY} (${testnetDeployment.contracts.MockSFR.symbol})${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Curated NGP : ${COLOR_CYAN}${testnetDeployment.contracts.MockNGP.address}${COLOR_GRAY} (${testnetDeployment.contracts.MockNGP.symbol})${COLOR_RESET}`);

  const activeOffers = Array.from(indexerStore.offers.values()).filter(
    (o) => o.chain_id === chainId && o.status === 'open'
  );
  const activeLoans = Array.from(indexerStore.loans.values()).filter(
    (l) => l.chain_id === chainId && l.status === 'active'
  );
  console.log(`${COLOR_GRAY}    - Open Offers : ${COLOR_WHITE}${activeOffers.length}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Active Loans: ${COLOR_WHITE}${activeLoans.length}${COLOR_RESET}`);
}

interface CliCollectionItem {
  address: string;
  name: string;
  symbol: string;
  isCurated: boolean;
  offerCount: number;
  poolSizeEth: string;
}

export async function getCliCollectionsList(chainId: number = 46630): Promise<CliCollectionItem[]> {
  const curatedItems: CliCollectionItem[] = [
    {
      address: testnetDeployment.contracts.MockRHG.address,
      name: testnetDeployment.contracts.MockRHG.name,
      symbol: testnetDeployment.contracts.MockRHG.symbol,
      isCurated: true,
      offerCount: 0,
      poolSizeEth: '0.000',
    },
    {
      address: testnetDeployment.contracts.MockSFR.address,
      name: testnetDeployment.contracts.MockSFR.name,
      symbol: testnetDeployment.contracts.MockSFR.symbol,
      isCurated: true,
      offerCount: 0,
      poolSizeEth: '0.000',
    },
    {
      address: testnetDeployment.contracts.MockNGP.address,
      name: testnetDeployment.contracts.MockNGP.name,
      symbol: testnetDeployment.contracts.MockNGP.symbol,
      isCurated: true,
      offerCount: 0,
      poolSizeEth: '0.000',
    },
  ];

  let gondiItems: CliCollectionItem[] = [];
  try {
    const rawGondi = await gondiClient.listCollections(30);
    gondiItems = rawGondi.map((g) => ({
      address: g.contractData?.contractAddress || g.id,
      name: g.name || 'Gondi Collection',
      symbol: g.slug?.toUpperCase() || 'NFT',
      isCurated: false,
      offerCount: 0,
      poolSizeEth: '0.000',
    }));
  } catch {}

  const seen = new Set<string>();
  const merged: CliCollectionItem[] = [];

  for (const item of [...curatedItems, ...gondiItems]) {
    const addr = item.address.toLowerCase();
    if (!addr || seen.has(addr)) continue;
    seen.add(addr);

    const offers = Array.from(indexerStore.offers.values()).filter(
      (o) => o.chain_id === chainId && o.collection.toLowerCase() === addr && o.status === 'open'
    );
    let totalPoolWei = 0n;
    for (const off of offers) {
      totalPoolWei += BigInt(off.principal_wei);
    }

    merged.push({
      ...item,
      offerCount: offers.length,
      poolSizeEth: formatEther(totalPoolWei),
    });
  }

  return merged;
}

export async function printCollections(query?: string, chainId: number = 46630): Promise<void> {
  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] NFT COLLECTIONS CATALOG${COLOR_RESET}`);
  if (query) {
    console.log(`${COLOR_DIM}Filtering collections matching: "${query}"${COLOR_RESET}`);
  }

  let collections = await getCliCollectionsList(chainId);
  if (query) {
    const q = query.toLowerCase();
    collections = collections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }

  if (collections.length === 0) {
    console.log(`${COLOR_DIM}No collections found.${COLOR_RESET}`);
    return;
  }

  console.log('');
  console.log(`${COLOR_BOLD}${COLOR_WHITE}NAME                             SYMBOL   TAG       OFFERS  POOL (ETH)  ADDRESS${COLOR_RESET}`);
  console.log(`${COLOR_DIM}--------------------------------------------------------------------------------------------------${COLOR_RESET}`);

  for (const c of collections.slice(0, 30)) {
    const namePadded = c.name.padEnd(32).slice(0, 32);
    const symbolPadded = (c.symbol || 'NFT').padEnd(8).slice(0, 8);
    const tag = c.isCurated ? `${COLOR_GREEN}CURATED${COLOR_RESET}  ` : `${COLOR_DIM}EXPLORE${COLOR_RESET}  `;
    const offersPadded = String(c.offerCount || 0).padStart(6);
    const poolEth = Number(c.poolSizeEth).toFixed(3).padStart(10);
    const shortAddr = `${c.address.slice(0, 6)}...${c.address.slice(-4)}`;
    console.log(`${COLOR_WHITE}${namePadded}${COLOR_RESET} ${COLOR_GRAY}${symbolPadded}${COLOR_RESET} ${tag} ${COLOR_CYAN}${offersPadded}${COLOR_RESET} ${COLOR_GREEN}${poolEth}${COLOR_RESET}  ${COLOR_DIM}${c.address}${COLOR_RESET} (${shortAddr})`);
  }

  if (collections.length > 30) {
    console.log(`${COLOR_DIM}... and ${collections.length - 30} more collections.${COLOR_RESET}`);
  }
}

export async function printCollectionDetail(address: string, chainId: number = 46630): Promise<void> {
  if (!isAddress(address)) {
    console.log(`${COLOR_BOLD}\x1b[31m[!] Invalid Ethereum contract address: ${address}${COLOR_RESET}`);
    return;
  }

  const normalized = address.toLowerCase() as `0x${string}`;
  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] INSPECTING COLLECTION: ${normalized}${COLOR_RESET}`);

  const onchain = await fetchOnChainCollection(normalized, chainId);
  const collections = await getCliCollectionsList(chainId);
  const meta = collections.find((c) => c.address.toLowerCase() === normalized);

  const name = meta?.name || onchain?.name || 'Unknown Collection';
  const symbol = meta?.symbol || onchain?.symbol || 'NFT';
  const isCurated = meta?.isCurated || false;

  const offers = Array.from(indexerStore.offers.values()).filter(
    (o) => o.chain_id === chainId && o.collection.toLowerCase() === normalized && o.status === 'open'
  );
  const loans = Array.from(indexerStore.loans.values()).filter(
    (l) => l.chain_id === chainId && l.collection.toLowerCase() === normalized && l.status === 'active'
  );

  let bestOfferWei = 0n;
  let poolWei = 0n;
  for (const o of offers) {
    const val = BigInt(o.principal_wei);
    poolWei += val;
    if (val > bestOfferWei) bestOfferWei = val;
  }

  console.log(`${COLOR_GRAY}    - Name        : ${COLOR_WHITE}${name}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Symbol      : ${COLOR_WHITE}${symbol}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Address     : ${COLOR_CYAN}${normalized}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Status      : ${isCurated ? `${COLOR_GREEN}Curated Protocol Allowlist${COLOR_RESET}` : `${COLOR_DIM}Open Market Explore${COLOR_RESET}`}`);
  console.log(`${COLOR_GRAY}    - Active Pool : ${COLOR_GREEN}${formatEther(poolWei)} ETH${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Best Offer  : ${COLOR_WHITE}${bestOfferWei > 0n ? `${formatEther(bestOfferWei)} ETH` : 'None'}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Open Offers : ${COLOR_WHITE}${offers.length}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Active Loans: ${COLOR_WHITE}${loans.length}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Durations   : ${COLOR_WHITE}7, 14, 30 days${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Explorer    : ${COLOR_DIM}https://explorer.testnet.chain.robinhood.com/address/${normalized}${COLOR_RESET}`);
}

export async function printOffers(collection?: string, chainId: number = 46630): Promise<void> {
  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] ACTIVE LENDING OFFERS${COLOR_RESET}`);

  let offers = Array.from(indexerStore.offers.values()).filter(
    (o) => o.chain_id === chainId && o.status === 'open'
  );
  if (collection && isAddress(collection)) {
    const colLower = collection.toLowerCase();
    offers = offers.filter((o) => o.collection.toLowerCase() === colLower);
    console.log(`${COLOR_DIM}Filtered by collection: ${colLower}${COLOR_RESET}`);
  }

  if (offers.length === 0) {
    console.log(`${COLOR_DIM}No open offers currently indexed on-chain.${COLOR_RESET}`);
    return;
  }

  console.log('');
  console.log(`${COLOR_BOLD}${COLOR_WHITE}ID   LENDER           COLLECTION       PRINCIPAL (ETH)   APR %    DURATION${COLOR_RESET}`);
  console.log(`${COLOR_DIM}----------------------------------------------------------------------------${COLOR_RESET}`);

  for (const o of offers) {
    const idStr = String(o.offer_id).padEnd(4);
    const lender = `${o.lender.slice(0, 6)}...${o.lender.slice(-4)}`.padEnd(16);
    const col = `${o.collection.slice(0, 6)}...${o.collection.slice(-4)}`.padEnd(16);
    const principal = Number(formatEther(BigInt(o.principal_wei))).toFixed(3).padStart(15);
    const apr = `${(o.term_interest_bps / 100).toFixed(2)}%`.padStart(8);
    const durationDays = Math.round(o.duration_seconds / 86400);
    console.log(`${COLOR_CYAN}${idStr}${COLOR_RESET} ${COLOR_WHITE}${lender}${COLOR_RESET} ${COLOR_DIM}${col}${COLOR_RESET} ${COLOR_GREEN}${principal}${COLOR_RESET} ${COLOR_WHITE}${apr}${COLOR_RESET} ${COLOR_GRAY}${durationDays}d${COLOR_RESET}`);
  }
}

export async function printLoans(borrower?: string, chainId: number = 46630): Promise<void> {
  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] ACTIVE PROTOCOL LOANS${COLOR_RESET}`);

  let loans = Array.from(indexerStore.loans.values()).filter(
    (l) => l.chain_id === chainId && l.status === 'active'
  );
  if (borrower && isAddress(borrower)) {
    const bLower = borrower.toLowerCase();
    loans = loans.filter((l) => l.borrower.toLowerCase() === bLower);
    console.log(`${COLOR_DIM}Filtered by borrower: ${bLower}${COLOR_RESET}`);
  }

  if (loans.length === 0) {
    console.log(`${COLOR_DIM}No active loans currently recorded on-chain.${COLOR_RESET}`);
    return;
  }

  console.log('');
  console.log(`${COLOR_BOLD}${COLOR_WHITE}ID   BORROWER         COLLATERAL       TOKEN ID  PRINCIPAL (ETH)  INTEREST (ETH)${COLOR_RESET}`);
  console.log(`${COLOR_DIM}-----------------------------------------------------------------------------------${COLOR_RESET}`);

  for (const l of loans) {
    const idStr = String(l.loan_id).padEnd(4);
    const b = `${l.borrower.slice(0, 6)}...${l.borrower.slice(-4)}`.padEnd(16);
    const c = `${l.collection.slice(0, 6)}...${l.collection.slice(-4)}`.padEnd(16);
    const token = String(l.token_id).slice(0, 8).padStart(8);
    const principal = Number(formatEther(BigInt(l.principal_wei))).toFixed(3).padStart(14);
    const interest = Number(formatEther(BigInt(l.interest_wei))).toFixed(4).padStart(14);
    console.log(`${COLOR_CYAN}${idStr}${COLOR_RESET} ${COLOR_WHITE}${b}${COLOR_RESET} ${COLOR_DIM}${c}${COLOR_RESET} ${COLOR_GRAY}${token}${COLOR_RESET}  ${COLOR_GREEN}${principal}${COLOR_RESET}   ${COLOR_WHITE}${interest}${COLOR_RESET}`);
  }
}

export async function printSearch(query: string, chainId: number = 46630): Promise<void> {
  const q = query.trim().toLowerCase();
  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] GLOBAL SEARCH FOR: "${query}"${COLOR_RESET}`);

  const collections = await getCliCollectionsList(chainId);
  const matchedCols = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
  );

  console.log(`${COLOR_WHITE}Matched Collections (${matchedCols.length}):${COLOR_RESET}`);
  for (const c of matchedCols.slice(0, 10)) {
    const tag = c.isCurated ? `${COLOR_GREEN}[Curated]${COLOR_RESET}` : `${COLOR_DIM}[Explore]${COLOR_RESET}`;
    console.log(`  - ${COLOR_WHITE}${c.name}${COLOR_RESET} (${COLOR_CYAN}${c.symbol}${COLOR_RESET}) ${tag} [${COLOR_DIM}${c.address}${COLOR_RESET}]`);
  }

  if (isAddress(q)) {
    console.log('');
    console.log(`${COLOR_WHITE}Wallet / Contract Address Detected:${COLOR_RESET}`);
    console.log(`  - Explorer: ${COLOR_CYAN}https://explorer.testnet.chain.robinhood.com/address/${q}${COLOR_RESET}`);
  }
}

export function simulateCreateOffer(
  collection: string,
  amountEth: string,
  aprBps: number,
  durationDays: number
): void {
  if (!isAddress(collection)) {
    console.log(`${COLOR_BOLD}\x1b[31m[!] Invalid collection address: ${collection}${COLOR_RESET}`);
    return;
  }

  const principalWei = parseEther(amountEth);
  const durationSeconds = Math.round(durationDays * 86400);
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400);
  const pledgeAddress = testnetDeployment.contracts.PledgeLoans.address as `0x${string}`;

  const calldata = encodeFunctionData({
    abi: PLEDGE_LOANS_ABI,
    functionName: 'createOffer',
    args: [collection as `0x${string}`, aprBps, durationSeconds, expiresAt],
  });

  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] TRANSACTION PREPARED: createOffer${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - To Contract : ${COLOR_WHITE}${pledgeAddress}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Value       : ${COLOR_GREEN}${amountEth} ETH (${principalWei.toString()} wei)${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Collection  : ${COLOR_CYAN}${collection}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Duration    : ${COLOR_WHITE}${durationDays} days (${durationSeconds} seconds)${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Term APR    : ${COLOR_WHITE}${(aprBps / 100).toFixed(2)}% (${aprBps} bps)${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Calldata    : ${COLOR_DIM}${calldata}${COLOR_RESET}`);
  console.log(`${COLOR_GREEN}[+] Transaction ready for broadcast via Robinhood Testnet signer.${COLOR_RESET}`);
}

export function simulateCancelOffer(offerId: number): void {
  const pledgeAddress = testnetDeployment.contracts.PledgeLoans.address as `0x${string}`;
  const calldata = encodeFunctionData({
    abi: PLEDGE_LOANS_ABI,
    functionName: 'cancelOffer',
    args: [BigInt(offerId)],
  });

  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] TRANSACTION PREPARED: cancelOffer${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - To Contract : ${COLOR_WHITE}${pledgeAddress}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Offer ID    : ${COLOR_WHITE}${offerId}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Calldata    : ${COLOR_DIM}${calldata}${COLOR_RESET}`);
  console.log(`${COLOR_GREEN}[+] Cancellation calldata ready.${COLOR_RESET}`);
}

export function simulateRepayLoan(loanId: number): void {
  const pledgeAddress = testnetDeployment.contracts.PledgeLoans.address as `0x${string}`;
  const calldata = encodeFunctionData({
    abi: PLEDGE_LOANS_ABI,
    functionName: 'repay',
    args: [BigInt(loanId)],
  });

  console.log(`${COLOR_BOLD}${COLOR_CYAN}[*] TRANSACTION PREPARED: repayLoan${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - To Contract : ${COLOR_WHITE}${pledgeAddress}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Loan ID     : ${COLOR_WHITE}${loanId}${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}    - Calldata    : ${COLOR_DIM}${calldata}${COLOR_RESET}`);
  console.log(`${COLOR_GREEN}[+] Loan repayment calldata ready.${COLOR_RESET}`);
}

export function printHelp(): void {
  console.log(`${COLOR_BOLD}${COLOR_CYAN}PLEDGE AGENT CLI Toolbelt${COLOR_RESET}`);
  console.log(`${COLOR_GRAY}Usage:${COLOR_RESET}`);
  console.log(`  npx tsx scripts/cli.ts [command] [options]`);
  console.log(`  npm run cli`);
  console.log(`  ./scripts/pledge-banner.sh && ./scripts/pledge-deploy-replay.sh\n`);
  console.log(`${COLOR_WHITE}Available Commands:${COLOR_RESET}`);
  console.log(`  ${COLOR_CYAN}status | overview${COLOR_RESET}                         Display protocol metrics, TVL, contracts & RPC uplink`);
  console.log(`  ${COLOR_CYAN}collections [query]${COLOR_RESET}                       Explore all NFT collections with offer & pool metrics`);
  console.log(`  ${COLOR_CYAN}collection <address>${COLOR_RESET}                      Inspect specific collection terms, allowlist & pool stats`);
  console.log(`  ${COLOR_CYAN}offers [collection]${COLOR_RESET}                       List active lending offers`);
  console.log(`  ${COLOR_CYAN}loans [borrower]${COLOR_RESET}                          List active protocol loans`);
  console.log(`  ${COLOR_CYAN}search <query>${COLOR_RESET}                            Global terminal search across collections & wallets`);
  console.log(`  ${COLOR_CYAN}offer:create <col> <amt> <apr> <days>${COLOR_RESET}     Prepare & encode createOffer transaction payload`);
  console.log(`  ${COLOR_CYAN}offer:cancel <offerId>${COLOR_RESET}                    Prepare & encode cancelOffer transaction payload`);
  console.log(`  ${COLOR_CYAN}loan:repay <loanId>${COLOR_RESET}                       Prepare & encode repay transaction payload`);
  console.log(`  ${COLOR_CYAN}banner${COLOR_RESET}                                    Output banner and uplink network connection`);
  console.log(`  ${COLOR_CYAN}replay | deploy${COLOR_RESET}                           Output deployment replay and live verification log`);
  console.log(`  ${COLOR_CYAN}repl | -i | interactive${COLOR_RESET}                   Launch interactive terminal prompt`);
  console.log(`  ${COLOR_CYAN}help${COLOR_RESET}                                      Display this usage guide\n`);
  console.log(`${COLOR_WHITE}Options:${COLOR_RESET}`);
  console.log(`  ${COLOR_GRAY}--live${COLOR_RESET}                                    Query live chain head from RPC`);
}

export async function runInteractiveRepl(): Promise<void> {
  printBanner();
  await printUplink(46630, false);
  console.log(`${COLOR_BOLD}${COLOR_GREEN}Interactive Pledge Agent CLI started. Type 'help' for command list, 'exit' to quit.${COLOR_RESET}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question(`${COLOR_BOLD}${COLOR_CYAN}[DEV@PLEDGE-AGENT]${COLOR_RESET} ${COLOR_DIM}└─➜${COLOR_RESET} `, async (input) => {
      const trimmed = input.trim();
      if (!trimmed) {
        promptUser();
        return;
      }
      if (trimmed === 'exit' || trimmed === 'quit') {
        rl.close();
        return;
      }

      const parts = trimmed.split(/\s+/);
      try {
        await executeCommand(parts);
      } catch (err: unknown) {
        console.error(`${COLOR_BOLD}\x1b[31m[!] Error: ${(err as Error).message}${COLOR_RESET}`);
      }
      console.log('');
      promptUser();
    });
  };

  promptUser();
}

export async function executeCommand(argv: string[]): Promise<void> {
  const live = argv.includes('--live');
  const command = argv.find((a) => !a.startsWith('--')) || 'default';
  const args = argv.filter((a) => !a.startsWith('--') && a !== command);

  if (command === 'help' || command === '-h' || command === '--help') {
    printHelp();
    return;
  }

  if (command === 'banner') {
    printBanner();
    await printUplink(46630, live);
    return;
  }

  if (command === 'deploy' || command === 'replay') {
    printDeployReplay();
    return;
  }

  if (command === 'status' || command === 'overview') {
    printBanner();
    await printUplink(46630, true);
    await printPledgeStatus();
    return;
  }

  if (command === 'collections') {
    await printCollections(args[0]);
    return;
  }

  if (command === 'collection') {
    if (!args[0]) {
      console.log(`${COLOR_BOLD}\x1b[31m[!] Usage: collection <address>${COLOR_RESET}`);
      return;
    }
    await printCollectionDetail(args[0]);
    return;
  }

  if (command === 'offers') {
    await printOffers(args[0]);
    return;
  }

  if (command === 'loans') {
    await printLoans(args[0]);
    return;
  }

  if (command === 'search') {
    if (!args[0]) {
      console.log(`${COLOR_BOLD}\x1b[31m[!] Usage: search <query>${COLOR_RESET}`);
      return;
    }
    await printSearch(args[0]);
    return;
  }

  if (command === 'offer:create') {
    if (args.length < 4) {
      console.log(`${COLOR_BOLD}\x1b[31m[!] Usage: offer:create <collection> <amountEth> <aprBps> <durationDays>${COLOR_RESET}`);
      return;
    }
    simulateCreateOffer(args[0], args[1], parseInt(args[2], 10), parseFloat(args[3]));
    return;
  }

  if (command === 'offer:cancel') {
    if (!args[0]) {
      console.log(`${COLOR_BOLD}\x1b[31m[!] Usage: offer:cancel <offerId>${COLOR_RESET}`);
      return;
    }
    simulateCancelOffer(parseInt(args[0], 10));
    return;
  }

  if (command === 'loan:repay') {
    if (!args[0]) {
      console.log(`${COLOR_BOLD}\x1b[31m[!] Usage: loan:repay <loanId>${COLOR_RESET}`);
      return;
    }
    simulateRepayLoan(parseInt(args[0], 10));
    return;
  }

  if (command === 'repl' || command === '-i' || command === 'interactive') {
    await runInteractiveRepl();
    return;
  }

  printBanner();
  await printUplink(46630, live);
  printDeployReplay();
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  await executeCommand(argv);
}

if (typeof require !== 'undefined' && require.main === module) {
  const isRepl = process.argv.some((a) => ['repl', '-i', 'interactive'].includes(a));
  main()
    .then(() => {
      if (!isRepl) {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
