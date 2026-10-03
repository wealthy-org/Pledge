import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID, getActiveChain } from './chains';
import { createPublicClient, http } from 'viem';
import { ERC721_ABI } from './contracts';
import addressesData from './collections.json';

export interface CuratedCollectionEntry {
  [TESTNET_CHAIN_ID]: `0x${string}`;
  [MAINNET_CHAIN_ID]: `0x${string}`;
  [key: number]: `0x${string}`;
}

export interface ActiveCuratedCollection {
  id: string;
  name: string;
  symbol: string;
  defaultDurations: [7, 14, 30];
  addresses: {
    [TESTNET_CHAIN_ID]: `0x${string}`;
    [MAINNET_CHAIN_ID]: `0x${string}`;
    [key: number]: `0x${string}`;
  };
  contractAddress: `0x${string}`;
}

export type CuratedCollectionDefinition = ActiveCuratedCollection;

export const CURATED_COLLECTION_ENTRIES = addressesData as unknown as CuratedCollectionEntry[];

const collectionMetadataCache = new Map<string, { name: string; symbol: string }>();

export async function fetchOnChainCollection(
  address: `0x${string}`,
  chainId?: number
): Promise<ActiveCuratedCollection | null> {
  const chain = getActiveChain(chainId);
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0], { timeout: 3000 }),
  });

  try {
    const isCurated = CURATED_COLLECTION_ENTRIES.some((entry) =>
      Object.values(entry).some((a) => a.toLowerCase() === address.toLowerCase())
    );

    const [nameResult, symbolResult, bytecode] = await Promise.all([
      client.readContract({ address, abi: ERC721_ABI, functionName: 'name' as any }).catch(() => null),
      client.readContract({ address, abi: ERC721_ABI, functionName: 'symbol' as any }).catch(() => null),
      client.getBytecode({ address }).catch(() => null),
    ]);

    if (!isCurated && !nameResult && !symbolResult && (!bytecode || bytecode === '0x')) {
      return null;
    }

    const name = nameResult ? String(nameResult) : 'Robinhood NFT';
    const symbol = symbolResult ? String(symbolResult) : 'RNFT';
    const targetChain = chainId || TESTNET_CHAIN_ID;

    collectionMetadataCache.set(address.toLowerCase(), { name, symbol });

    const knownEntry = CURATED_COLLECTION_ENTRIES.find((entry) =>
      Object.values(entry).some((a) => a.toLowerCase() === address.toLowerCase())
    );

    return {
      id: symbol.toLowerCase(),
      name,
      symbol,
      defaultDurations: [7, 14, 30],
      addresses: knownEntry || {
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
): Promise<ActiveCuratedCollection[]> {
  const targetChain = chainId || TESTNET_CHAIN_ID;
  const isMainnet = targetChain === MAINNET_CHAIN_ID;

  const results = await Promise.all(
    CURATED_COLLECTION_ENTRIES.map(async (entry) => {
      const address = isMainnet ? entry[MAINNET_CHAIN_ID] : entry[TESTNET_CHAIN_ID];
      const col = await fetchOnChainCollection(address, targetChain);
      return (
        col || {
          id: 'rnft',
          name: 'Robinhood NFT',
          symbol: 'RNFT',
          defaultDurations: [7, 14, 30] as [7, 14, 30],
          addresses: entry,
          contractAddress: address,
        }
      );
    })
  );
  return results;
}

export function getCuratedCollections(chainId?: number): ActiveCuratedCollection[] {
  let targetChain = TESTNET_CHAIN_ID;
  if (chainId !== undefined) {
    targetChain = chainId;
  } else if (process.env.NEXT_PUBLIC_CHAIN_ID) {
    targetChain = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  }

  const isMainnet = targetChain === MAINNET_CHAIN_ID;

  return CURATED_COLLECTION_ENTRIES.map((entry) => {
    const contractAddress = isMainnet ? entry[MAINNET_CHAIN_ID] : entry[TESTNET_CHAIN_ID];
    const cached = collectionMetadataCache.get(contractAddress.toLowerCase());
    const name = cached?.name || 'Robinhood NFT';
    const symbol = cached?.symbol || 'RNFT';
    return {
      id: symbol.toLowerCase(),
      name,
      symbol,
      defaultDurations: [7, 14, 30],
      addresses: entry,
      contractAddress,
    };
  });
}

export const CURATED_COLLECTIONS: ActiveCuratedCollection[] = getCuratedCollections();

export function getCollectionByAddress(
  address: string,
  chainId?: number
): ActiveCuratedCollection | null {
  if (!address) return null;
  const lowerTarget = address.toLowerCase();
  const all = getCuratedCollections(chainId);
  const found = all.find(
    (col) =>
      col.contractAddress.toLowerCase() === lowerTarget ||
      Object.values(col.addresses).some((a) => a.toLowerCase() === lowerTarget)
  );
  return found || null;
}

export function isCollectionAllowed(address: string, chainId?: number): boolean {
  if (!address) return false;
  const lowerTarget = address.toLowerCase();
  return CURATED_COLLECTION_ENTRIES.some((entry) =>
    Object.values(entry).some((a) => a.toLowerCase() === lowerTarget)
  );
}
