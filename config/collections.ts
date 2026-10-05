import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID, getActiveChain } from './chains';
import { createPublicClient, http } from 'viem';
import { ERC721_ABI } from './contracts';

export interface DiscoveredCollection {
  id: string;
  name: string;
  symbol: string;
  defaultDurations: [7, 14, 30];
  contractAddress: `0x${string}`;
  addresses: Record<number, `0x${string}`>;
}

export type ActiveCuratedCollection = DiscoveredCollection;
export type CuratedCollectionDefinition = DiscoveredCollection;

const collectionMetadataCache = new Map<string, { name: string; symbol: string }>();

export async function fetchOnChainCollection(
  address: `0x${string}`,
  chainId?: number
): Promise<DiscoveredCollection | null> {
  const lowerAddr = (address || '').toLowerCase();
  if (collectionMetadataCache.has(lowerAddr)) {
    const meta = collectionMetadataCache.get(lowerAddr)!;
    const targetChain = chainId || TESTNET_CHAIN_ID;
    return {
      id: meta.symbol.toLowerCase(),
      name: meta.name,
      symbol: meta.symbol,
      defaultDurations: [7, 14, 30],
      addresses: {
        [TESTNET_CHAIN_ID]: address,
        [MAINNET_CHAIN_ID]: address,
        [targetChain]: address,
      },
      contractAddress: address,
    };
  }

  const chain = getActiveChain(chainId);
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0], { timeout: 2000 }),
  });

  try {
    const [nameResult, symbolResult, bytecode] = await Promise.all([
      client.readContract({ address, abi: ERC721_ABI, functionName: 'name' as any }).catch(() => null),
      client.readContract({ address, abi: ERC721_ABI, functionName: 'symbol' as any }).catch(() => null),
      client.getBytecode({ address }).catch(() => null),
    ]);

    if (!nameResult && !symbolResult && (!bytecode || bytecode === '0x')) {
      return null;
    }

    const name = nameResult ? String(nameResult) : 'ERC721 Collection';
    const symbol = symbolResult ? String(symbolResult) : 'NFT';
    const targetChain = chainId || TESTNET_CHAIN_ID;

    collectionMetadataCache.set(address.toLowerCase(), { name, symbol });

    return {
      id: symbol.toLowerCase(),
      name,
      symbol,
      defaultDurations: [7, 14, 30],
      addresses: {
        [TESTNET_CHAIN_ID]: address,
        [MAINNET_CHAIN_ID]: address,
        [targetChain]: address,
      },
      contractAddress: address,
    };
  } catch {
    return null;
  }
}

export async function fetchCuratedCollections(
  chainId?: number
): Promise<DiscoveredCollection[]> {
  return [];
}

export function getCuratedCollections(chainId?: number): DiscoveredCollection[] {
  const targetChain = chainId || TESTNET_CHAIN_ID;
  const list: DiscoveredCollection[] = [];
  for (const [addr, meta] of collectionMetadataCache.entries()) {
    list.push({
      id: meta.symbol.toLowerCase(),
      name: meta.name,
      symbol: meta.symbol,
      defaultDurations: [7, 14, 30],
      addresses: {
        [TESTNET_CHAIN_ID]: addr as `0x${string}`,
        [MAINNET_CHAIN_ID]: addr as `0x${string}`,
        [targetChain]: addr as `0x${string}`,
      },
      contractAddress: addr as `0x${string}`,
    });
  }
  return list;
}

export const CURATED_COLLECTIONS: DiscoveredCollection[] = [];

export function getCollectionByAddress(
  address: string,
  chainId?: number
): DiscoveredCollection | null {
  if (!address) return null;
  const lowerTarget = address.toLowerCase();
  const cached = collectionMetadataCache.get(lowerTarget);
  if (!cached) return null;
  const targetChain = chainId || TESTNET_CHAIN_ID;
  return {
    id: cached.symbol.toLowerCase(),
    name: cached.name,
    symbol: cached.symbol,
    defaultDurations: [7, 14, 30],
    addresses: {
      [TESTNET_CHAIN_ID]: lowerTarget as `0x${string}`,
      [MAINNET_CHAIN_ID]: lowerTarget as `0x${string}`,
      [targetChain]: lowerTarget as `0x${string}`,
    },
    contractAddress: lowerTarget as `0x${string}`,
  };
}
