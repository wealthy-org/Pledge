import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from './chains';
import PledgeLoansAbiJson from '@/lib/abi/PledgeLoans.json';

export const PLEDGE_LOANS_ABI = PledgeLoansAbiJson;

export const PLEDGE_DEPLOYMENT_BLOCKS: Record<number, bigint> = {
  [TESTNET_CHAIN_ID]: BigInt(process.env.NEXT_PUBLIC_PLEDGE_START_BLOCK || '127800000'),
  [MAINNET_CHAIN_ID]: BigInt(process.env.NEXT_PUBLIC_PLEDGE_START_BLOCK_MAINNET || '0'),
};

export function getPledgeDeploymentBlock(chainId?: number): bigint {
  let targetId: number = TESTNET_CHAIN_ID;
  if (chainId !== undefined) {
    targetId = chainId;
  } else if (process.env.NEXT_PUBLIC_CHAIN_ID) {
    targetId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  }

  if (targetId in PLEDGE_DEPLOYMENT_BLOCKS) {
    return PLEDGE_DEPLOYMENT_BLOCKS[targetId];
  }
  return 0n;
}

export const PLEDGE_LOANS_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  [TESTNET_CHAIN_ID]: (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT as `0x${string}`) || '0x481F5591D7B26661B651Ab2efB66c10c46958E33',
  [MAINNET_CHAIN_ID]: (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET as `0x${string}`) || undefined,
};

export function getPledgeLoansAddress(chainId?: number): `0x${string}` {
  let targetId: number = TESTNET_CHAIN_ID;
  if (chainId !== undefined) {
    targetId = chainId;
  } else if (process.env.NEXT_PUBLIC_CHAIN_ID) {
    targetId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  }

  if (targetId !== TESTNET_CHAIN_ID && targetId !== MAINNET_CHAIN_ID) {
    throw new Error(`Unsupported chain ID: ${targetId}`);
  }

  const address = PLEDGE_LOANS_ADDRESSES[targetId];
  if (!address) {
    throw new Error(`PledgeLoans contract address is not configured for chain ID ${targetId}`);
  }
  return address;
}

export const ERC721_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'contractURI',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getApproved',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
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
    name: 'approve',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const;
