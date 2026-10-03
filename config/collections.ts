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

export const CURATED_COLLECTIONS_CONFIG: CuratedCollectionDefinition[] = [
  {
    id: 'rhg',
    name: 'Robinhood Genesis Pass',
    symbol: 'RHG',
    defaultDurations: [7, 14, 30],
    addresses: {
      [TESTNET_CHAIN_ID]: '0xE80385Cf259C82359CF5eA4eA98cD6514d9257a9',
      [MAINNET_CHAIN_ID]: '0x1111111111111111111111111111111111111111',
    },
  },
  {
    id: 'sfr',
    name: 'Sherwood Forest Rangers',
    symbol: 'SFR',
    defaultDurations: [7, 14, 30],
    addresses: {
      [TESTNET_CHAIN_ID]: '0x146BefC6C8656Df737255d08fa1281319Fc1A4c3',
      [MAINNET_CHAIN_ID]: '0x2222222222222222222222222222222222222222',
    },
  },
  {
    id: 'ngp',
    name: 'Nottingham Guild Pledges',
    symbol: 'NGP',
    defaultDurations: [7, 14, 30],
    addresses: {
      [TESTNET_CHAIN_ID]: '0x75599F7385dCdbE2aB3b3b0B8d4A3E2C8f02494D',
      [MAINNET_CHAIN_ID]: '0x3333333333333333333333333333333333333333',
    },
  },
];

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

  return CURATED_COLLECTIONS_CONFIG.map((col) => {
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
