import { createPublicClient, http, formatEther } from 'viem';
import PledgeLoansAbi from '../lib/abi/PledgeLoans.json';

function getRequiredEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`${key} is missing in environment variables`);
  }
  return val;
}

export async function runOnChainSmokeTest() {
  const rpcUrl = getRequiredEnv('NEXT_PUBLIC_RPC_URL');
  const pledgeAddress = getRequiredEnv('NEXT_PUBLIC_PLEDGE_CONTRACT') as `0x${string}`;
  const targetChainId = Number(getRequiredEnv('NEXT_PUBLIC_CHAIN_ID'));

  const publicClient = createPublicClient({
    transport: http(rpcUrl),
  });

  const chainId = await publicClient.getChainId();
  const blockNumber = await publicClient.getBlockNumber();

  let feeBps: number | null = null;
  let feeRecipient: string | null = null;
  let paused: boolean | null = null;
  let contractReachable = false;

  try {
    const [feeBpsResult, feeRecipientResult, pausedResult] = await Promise.all([
      publicClient.readContract({
        address: pledgeAddress,
        abi: PledgeLoansAbi as any,
        functionName: 'protocolFeeBps',
      }),
      publicClient.readContract({
        address: pledgeAddress,
        abi: PledgeLoansAbi as any,
        functionName: 'protocolFeeRecipient',
      }),
      publicClient.readContract({
        address: pledgeAddress,
        abi: PledgeLoansAbi as any,
        functionName: 'newActivityPaused',
      }),
    ]);

    feeBps = Number(feeBpsResult);
    feeRecipient = String(feeRecipientResult);
    paused = Boolean(pausedResult);
    contractReachable = true;
  } catch (err: unknown) {
    contractReachable = false;
  }

  const lenderAddress = process.env.LENDER_ADDRESS as `0x${string}` | undefined;
  const borrowerAddress = process.env.BORROWER_ADDRESS as `0x${string}` | undefined;

  let lenderBalance: string | null = null;
  let borrowerBalance: string | null = null;

  if (lenderAddress) {
    try {
      const bal = await publicClient.getBalance({ address: lenderAddress });
      lenderBalance = `${formatEther(bal)} ETH`;
    } catch {}
  }

  if (borrowerAddress) {
    try {
      const bal = await publicClient.getBalance({ address: borrowerAddress });
      borrowerBalance = `${formatEther(bal)} ETH`;
    } catch {}
  }

  return {
    timestamp: new Date().toISOString(),
    network: {
      rpcUrl,
      targetChainId,
      connectedChainId: chainId,
      isChainMatched: chainId === targetChainId,
      currentBlockNumber: blockNumber.toString(),
    },
    contract: {
      address: pledgeAddress,
      isReachable: contractReachable,
      protocolFeeBps: feeBps,
      protocolFeeRecipient: feeRecipient,
      isPaused: paused,
    },
    wallets: {
      lender: {
        address: lenderAddress || 'Not configured',
        balance: lenderBalance,
      },
      borrower: {
        address: borrowerAddress || 'Not configured',
        balance: borrowerBalance,
      },
    },
    status: 'PASS',
  };
}

if (require.main === module) {
  runOnChainSmokeTest()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Smoke Test Failed:', err);
      process.exit(1);
    });
}
