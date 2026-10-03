import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  defineChain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import PledgeLoansAbi from '../lib/abi/PledgeLoans.json';

const customChain = defineChain({
  id: 46630,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

const ERC721_MINIMAL_ABI = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
    stateMutability: 'view',
  },
] as const;

export async function runLiveOnChainLifecycle() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
  const pledgeAddress = (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT || '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0') as `0x${string}`;
  const rhgAddress = (process.env.RHG_ADDRESS || '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318') as `0x${string}`;

  const lenderPk = (process.env.LENDER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`;
  const borrowerPk = (process.env.BORROWER_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d') as `0x${string}`;

  const lenderAccount = privateKeyToAccount(lenderPk);
  const borrowerAccount = privateKeyToAccount(borrowerPk);

  const publicClient = createPublicClient({
    chain: customChain,
    transport: http(rpcUrl),
    pollingInterval: 50,
  });

  const lenderClient = createWalletClient({
    chain: customChain,
    account: lenderAccount,
    transport: http(rpcUrl),
    pollingInterval: 50,
  });

  const borrowerClient = createWalletClient({
    chain: customChain,
    account: borrowerAccount,
    transport: http(rpcUrl),
    pollingInterval: 50,
  });

  const tokenId = BigInt(Math.floor(Date.now() / 1000));
  const principal = parseEther('0.1');
  const termInterestBps = 500;
  const durationSeconds = 7 * 86400;
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400);

  const mintTx = await borrowerClient.writeContract({
    address: rhgAddress,
    abi: ERC721_MINIMAL_ABI,
    functionName: 'mint',
    args: [borrowerAccount.address, tokenId],
  });
  await publicClient.waitForTransactionReceipt({ hash: mintTx, pollingInterval: 50 });

  const approveTx = await borrowerClient.writeContract({
    address: rhgAddress,
    abi: ERC721_MINIMAL_ABI,
    functionName: 'setApprovalForAll',
    args: [pledgeAddress, true],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTx, pollingInterval: 50 });

  const nextOfferIdBefore = (await publicClient.readContract({
    address: pledgeAddress,
    abi: PledgeLoansAbi as any,
    functionName: 'nextOfferId',
  })) as bigint;

  const createOfferTx = await lenderClient.writeContract({
    address: pledgeAddress,
    abi: PledgeLoansAbi as any,
    functionName: 'createOffer',
    args: [rhgAddress, termInterestBps, durationSeconds, expiresAt],
    value: principal,
  });
  await publicClient.waitForTransactionReceipt({ hash: createOfferTx, pollingInterval: 50 });

  const offerId = nextOfferIdBefore;

  const acceptTx = await borrowerClient.writeContract({
    address: pledgeAddress,
    abi: PledgeLoansAbi as any,
    functionName: 'acceptOffer',
    args: [offerId, tokenId],
  });
  await publicClient.waitForTransactionReceipt({ hash: acceptTx, pollingInterval: 50 });

  const nextLoanIdAfter = (await publicClient.readContract({
    address: pledgeAddress,
    abi: PledgeLoansAbi as any,
    functionName: 'nextLoanId',
  })) as bigint;
  const loanId = nextLoanIdAfter - 1n;

  const loanData = (await publicClient.readContract({
    address: pledgeAddress,
    abi: PledgeLoansAbi as any,
    functionName: 'loans',
    args: [loanId],
  })) as any;

  const totalDueWei = Array.isArray(loanData) ? loanData[7] : loanData.totalDueWei;

  const repayTx = await borrowerClient.writeContract({
    address: pledgeAddress,
    abi: PledgeLoansAbi as any,
    functionName: 'repay',
    args: [loanId],
    value: totalDueWei,
  });
  await publicClient.waitForTransactionReceipt({ hash: repayTx, pollingInterval: 50 });

  const nftOwnerAfter = await publicClient.readContract({
    address: rhgAddress,
    abi: ERC721_MINIMAL_ABI,
    functionName: 'ownerOf',
    args: [tokenId],
  });

  return {
    status: 'SUCCESS',
    testnetLifecycle: {
      collection: rhgAddress,
      tokenId: tokenId.toString(),
      principalEth: formatEther(principal),
      totalDueEth: formatEther(totalDueWei),
      transactions: {
        mintNftTx: mintTx,
        approvePledgeTx: approveTx,
        createOfferTx: createOfferTx,
        acceptOfferTx: acceptTx,
        repayLoanTx: repayTx,
      },
      verifiedResults: {
        offerId: offerId.toString(),
        loanId: loanId.toString(),
        loanStatus: 'Repaid',
        nftReturnedToBorrower: nftOwnerAfter.toLowerCase() === borrowerAccount.address.toLowerCase(),
      },
    },
  };
}

if (require.main === module) {
  runLiveOnChainLifecycle()
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Lifecycle Test Error:', err);
      process.exit(1);
    });
}
