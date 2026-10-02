import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from './chains';
import PledgeLoansAbiJson from '@/lib/abi/PledgeLoans.json';

export const PLEDGE_LOANS_ABI = PledgeLoansAbiJson;

export const PLEDGE_LOANS_ADDRESSES: Record<number, `0x${string}`> = new Proxy(
  {},
  {
    get(_target, prop) {
      const id = Number(prop);
      if (id === MAINNET_CHAIN_ID) {
        const addr = process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET as `0x${string}` | undefined;
        if (!addr) {
          throw new Error('NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET is not configured.');
        }
        return addr;
      }
      if (id === TESTNET_CHAIN_ID) {
        const addr = process.env.NEXT_PUBLIC_PLEDGE_CONTRACT as `0x${string}` | undefined;
        if (!addr) {
          throw new Error('NEXT_PUBLIC_PLEDGE_CONTRACT is not configured.');
        }
        return addr;
      }
      throw new Error(`Unsupported chain ID: ${String(prop)}`);
    },
  }
);

export function getPledgeLoansAddress(chainId?: number): `0x${string}` {
  let targetId: number | undefined = chainId;
  if (targetId === undefined) {
    const envVal = process.env.NEXT_PUBLIC_CHAIN_ID;
    if (!envVal) {
      throw new Error('Chain ID is not configured. NEXT_PUBLIC_CHAIN_ID must be set.');
    }
    targetId = Number(envVal);
  }
  if (isNaN(targetId)) {
    throw new Error('Invalid chain ID configuration.');
  }

  const address = targetId === MAINNET_CHAIN_ID
    ? (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET as `0x${string}` | undefined)
    : (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT as `0x${string}` | undefined);

  if (!address) {
    throw new Error(`Pledge contract address is not configured for chain ID ${targetId}.`);
  }
  return address;
}

export const ERC721_ABI = [
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

