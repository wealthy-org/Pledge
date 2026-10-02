import {
  createWalletClient,
  createPublicClient,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.robinhood.com';
const PLEDGE_ADDRESS = (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT ||
  '0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496') as `0x${string}`;

const LENDER_PK = (process.env.LENDER_PRIVATE_KEY ||
  '0xe07d1b12dc8d78f9eb3f76a5ccf4d4921d440fed7485db858c8a12dfdb5aa307') as `0x${string}`;
const BORROWER_PK = (process.env.BORROWER_PRIVATE_KEY ||
  '0x4eda5634e65daf4eecf8c9ef6500f640ca3c0351098f0cd9555aa4279c26d74c') as `0x${string}`;

export async function runTestnetDemo() {
  const lenderAccount = privateKeyToAccount(LENDER_PK);
  const borrowerAccount = privateKeyToAccount(BORROWER_PK);

  const publicClient = createPublicClient({
    transport: http(RPC_URL),
  });

  const lenderClient = createWalletClient({
    account: lenderAccount,
    transport: http(RPC_URL),
  });

  const borrowerClient = createWalletClient({
    account: borrowerAccount,
    transport: http(RPC_URL),
  });

  return {
    lender: lenderAccount.address,
    borrower: borrowerAccount.address,
    pledgeAddress: PLEDGE_ADDRESS,
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
