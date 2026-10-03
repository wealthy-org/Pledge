import { createPublicClient, http } from 'viem';
import { getActiveChain } from '@/config/chains';

const ERC165_ABI = [
  {
    type: 'function',
    name: 'supportsInterface',
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

const ERC721_INTERFACE_ID = '0x80ac58cd';

export function formatShortAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function detectDuplicateNames<T extends { name: string; address: string }>(
  items: T[]
): Map<string, boolean> {
  const nameCount = new Map<string, number>();
  for (const item of items) {
    const cleanName = (item.name || '').trim().toLowerCase();
    if (cleanName) {
      nameCount.set(cleanName, (nameCount.get(cleanName) || 0) + 1);
    }
  }

  const result = new Map<string, boolean>();
  for (const item of items) {
    const cleanName = (item.name || '').trim().toLowerCase();
    const isDuplicate = (nameCount.get(cleanName) || 0) > 1;
    result.set(item.address.toLowerCase(), isDuplicate);
  }
  return result;
}

export async function verifyErc721OnChain(
  address: string,
  chainId?: number
): Promise<boolean> {
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return false;
  }

  try {
    const chain = getActiveChain(chainId);
    const client = createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0], { timeout: 3000 }),
    });

    const isErc721 = await client.readContract({
      address: address as `0x${string}`,
      abi: ERC165_ABI,
      functionName: 'supportsInterface',
      args: [ERC721_INTERFACE_ID],
    });

    return Boolean(isErc721);
  } catch {
    return false;
  }
}
