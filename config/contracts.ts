import { MAINNET_CHAIN_ID, TESTNET_CHAIN_ID } from './chains';
import PledgeLoansAbiJson from '@/lib/abi/PledgeLoans.json';

export const PLEDGE_LOANS_ABI = PledgeLoansAbiJson;

export const PLEDGE_LOANS_ADDRESSES: Record<number, `0x${string}`> = {
  [TESTNET_CHAIN_ID]: (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT as `0x${string}`) || '0x4663000000000000000000000000000000000001',
  [MAINNET_CHAIN_ID]: (process.env.NEXT_PUBLIC_PLEDGE_CONTRACT_MAINNET as `0x${string}`) || '0x4663000000000000000000000000000000000002',
};

export function getPledgeLoansAddress(chainId?: number): `0x${string}` {
  const targetId = chainId || Number(process.env.NEXT_PUBLIC_CHAIN_ID) || TESTNET_CHAIN_ID;
  const address = PLEDGE_LOANS_ADDRESSES[targetId];
  if (!address) {
    return PLEDGE_LOANS_ADDRESSES[TESTNET_CHAIN_ID];
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

