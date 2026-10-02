import {
  createWalletClient,
  createPublicClient,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

function getRequiredEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`${key} is missing in environment variables`);
  }
  return val;
}

export async function runTestnetDemo() {
  const rpcUrl = getRequiredEnv('NEXT_PUBLIC_RPC_URL');
  const pledgeAddress = getRequiredEnv('NEXT_PUBLIC_PLEDGE_CONTRACT') as `0x${string}`;
  const lenderPk = getRequiredEnv('LENDER_PRIVATE_KEY') as `0x${string}`;
  const borrowerPk = getRequiredEnv('BORROWER_PRIVATE_KEY') as `0x${string}`;

  const lenderAccount = privateKeyToAccount(lenderPk);
  const borrowerAccount = privateKeyToAccount(borrowerPk);

  const publicClient = createPublicClient({
    transport: http(rpcUrl),
  });

  const lenderClient = createWalletClient({
    account: lenderAccount,
    transport: http(rpcUrl),
  });

  const borrowerClient = createWalletClient({
    account: borrowerAccount,
    transport: http(rpcUrl),
  });

  return {
    lender: lenderAccount.address,
    borrower: borrowerAccount.address,
    pledgeAddress,
    hasPublicClient: Boolean(publicClient),
    hasLenderClient: Boolean(lenderClient),
    hasBorrowerClient: Boolean(borrowerClient),
    status: 'Demo clients initialized successfully',
  };
}

if (require.main === module) {
  runTestnetDemo()
    .then((res) => console.log(JSON.stringify(res, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
