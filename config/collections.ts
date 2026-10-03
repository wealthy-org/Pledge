import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID, getActiveChain } from './chains';
import { createPublicClient, http } from 'viem';
import { ERC721_ABI } from './contracts';
import defaultCollections from './collections.json';

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

export function parseCuratedCollections(): CuratedCollectionDefinition[] {
  const envJson = process.env.NEXT_PUBLIC_COLLECTIONS_JSON;
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as CuratedCollectionDefinition[];
      }
    } catch {}
  }
  return defaultCollections as unknown as CuratedCollectionDefinition[];
}

export const CURATED_COLLECTIONS_CONFIG: CuratedCollectionDefinition[] = parseCuratedCollections();

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
  const configList = parseCuratedCollections();

  return configList.map((col) => {
    const contractAddress = isMainnet ? col.addresses[MAINNET_CHAIN_ID] : col.addresses[TESTNET_CHAIN_ID];
    return {
      ...col,
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
  return getCollectionByAddress(address, chainId) !== null;
}
