import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID, getActiveChain } from './chains';
import { createPublicClient, http } from 'viem';
import { ERC721_ABI } from './contracts';

export interface CuratedCollectionDefinition {
  id: string;
  name: string;
  symbol: string;
  defaultDurations: [7, 14, 30];
  addresses: {
    [TESTNET_CHAIN_ID]: `0x${string}`;
    [MAINNET_CHAIN_ID]: `0x${string}`;
    [key: number]: `0x${string}`;
  };
}

export interface ActiveCuratedCollection extends CuratedCollectionDefinition {
  contractAddress: `0x${string}`;
}

export async function fetchOnChainCollection(
  address: `0x${string}`,
  chainId?: number
): Promise<ActiveCuratedCollection> {
  const chain = getActiveChain(chainId);
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });

  const [nameResult, symbolResult] = await Promise.all([
    client.readContract({ address, abi: ERC721_ABI, functionName: 'name' as any }),
    client.readContract({ address, abi: ERC721_ABI, functionName: 'symbol' as any }),
  ]);

  const name = String(nameResult);
  const symbol = String(symbolResult);
  const targetChain = chainId || TESTNET_CHAIN_ID;

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
}

export function getCuratedCollections(chainId?: number): ActiveCuratedCollection[] {
  let targetChain = TESTNET_CHAIN_ID;
  if (chainId !== undefined) {
    targetChain = chainId;
  } else if (process.env.NEXT_PUBLIC_CHAIN_ID) {
    targetChain = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  }

  const isMainnet = targetChain === MAINNET_CHAIN_ID;
  const env = process.env;
  const collections: ActiveCuratedCollection[] = [];
  const processedSymbols = new Set<string>();

  for (const key of Object.keys(env)) {
    if (key.startsWith('NEXT_PUBLIC_') && key.endsWith('_COLLECTION') && !key.endsWith('_MAINNET')) {
      const symbol = key.replace('NEXT_PUBLIC_', '').replace('_COLLECTION', '');
      if (!symbol || processedSymbols.has(symbol)) continue;
      processedSymbols.add(symbol);

      const testnetAddr = env[`NEXT_PUBLIC_${symbol}_COLLECTION`] as `0x${string}`;
      const mainnetAddr = (env[`NEXT_PUBLIC_${symbol}_COLLECTION_MAINNET`] || testnetAddr) as `0x${string}`;

      if (!testnetAddr) {
        throw new Error(`Collection address for ${symbol} is missing`);
      }

      const contractAddress = isMainnet ? mainnetAddr : testnetAddr;
      const id = symbol.toLowerCase();
      const name = symbol;

      collections.push({
        id,
        name,
        symbol,
        defaultDurations: [7, 14, 30],
        addresses: {
          [TESTNET_CHAIN_ID]: testnetAddr,
          [MAINNET_CHAIN_ID]: mainnetAddr,
        },
        contractAddress,
      });
    }
  }

  if (collections.length === 0) {
    throw new Error('No curated collections configured in environment');
  }

  return collections;
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
  return getCollectionByAddress(address, chainId) !== null;
}
