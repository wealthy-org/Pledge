import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from './chains';

export interface CollectionSocials {
  website?: string;
  twitter?: string;
  discord?: string;
}

export interface CuratedCollectionDefinition {
  id: string;
  name: string;
  symbol: string;
  description: string;
  totalSupply: number;
  category: string;
  defaultDurations: [7, 14, 30];
  maxLtvBps: number;
  minLtvBps: number;
  floorPriceEth: string;
  imageUrl: string;
  riskNotes?: string;
  socials?: CollectionSocials;
  addresses: {
    [TESTNET_CHAIN_ID]: `0x${string}`;
    [MAINNET_CHAIN_ID]: `0x${string}`;
    [key: number]: `0x${string}`;
  };
}

export interface ActiveCuratedCollection extends CuratedCollectionDefinition {
  contractAddress: `0x${string}`;
}

export const CURATED_COLLECTIONS: readonly CuratedCollectionDefinition[] = [
  {
    id: 'rhg',
    name: 'Robinhood Genesis Pass',
    symbol: 'RHG',
    description: 'Premier tier membership pass granting priority lending terms and discounted protocol fee rates.',
    totalSupply: 1000,
    category: 'Access & Membership',
    defaultDurations: [7, 14, 30],
    maxLtvBps: 7500,
    minLtvBps: 1000,
    floorPriceEth: '1.25',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    riskNotes: 'High liquidity Genesis Tier pass with historical stable valuation on Robinhood Chain. Verified contract with active community collateralization.',
    socials: {
      website: 'https://robinhood.com',
      twitter: 'https://x.com/robinhoodapp',
      discord: 'https://discord.gg/robinhood',
    },
    addresses: {
      [TESTNET_CHAIN_ID]: '0x1111111111111111111111111111111111111111',
      [MAINNET_CHAIN_ID]: '0x4444444444444444444444444444444444444444',
    },
  },
  {
    id: 'sfr',
    name: 'Sherwood Forest Rangers',
    symbol: 'SFR',
    description: 'Generative PFP avatar collection representing mythical archers and outlaws of Sherwood Forest.',
    totalSupply: 5000,
    category: 'PFPs & Avatars',
    defaultDurations: [7, 14, 30],
    maxLtvBps: 6500,
    minLtvBps: 1000,
    floorPriceEth: '0.65',
    imageUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    riskNotes: 'Medium liquidity avatar collection. Borrower default risk should be mitigated with conservative loan terms and appropriate LTV margins.',
    socials: {
      website: 'https://sherwoodrangers.io',
      twitter: 'https://x.com/sherwoodrangers',
      discord: 'https://discord.gg/sherwoodrangers',
    },
    addresses: {
      [TESTNET_CHAIN_ID]: '0x2222222222222222222222222222222222222222',
      [MAINNET_CHAIN_ID]: '0x5555555555555555555555555555555555555555',
    },
  },
  {
    id: 'ngp',
    name: 'Nottingham Guild Pledges',
    symbol: 'NGP',
    description: 'Artistic generative collectibles engineered for decentralized loan collateralization on Robinhood Chain.',
    totalSupply: 3000,
    category: 'Generative Art',
    defaultDurations: [7, 14, 30],
    maxLtvBps: 7000,
    minLtvBps: 1000,
    floorPriceEth: '0.45',
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&auto=format&fit=crop&q=80',
    riskNotes: 'Art generative collection. Market depth may fluctuate during high volatility. Lender consideration of floor price variance is recommended.',
    socials: {
      website: 'https://nottinghamguild.org',
      twitter: 'https://x.com/nottinghamguild',
      discord: 'https://discord.gg/nottinghamguild',
    },
    addresses: {
      [TESTNET_CHAIN_ID]: '0x3333333333333333333333333333333333333333',
      [MAINNET_CHAIN_ID]: '0x6666666666666666666666666666666666666666',
    },
  },
];

export function getCuratedCollections(chainId?: number): ActiveCuratedCollection[] {
  let targetChain: number | undefined = chainId;
  if (targetChain === undefined) {
    const envVal = process.env.NEXT_PUBLIC_CHAIN_ID;
    if (!envVal) {
      throw new Error('Chain ID is not configured. NEXT_PUBLIC_CHAIN_ID must be set.');
    }
    targetChain = Number(envVal);
  }
  if (isNaN(targetChain)) {
    throw new Error('Invalid chain ID configuration.');
  }
  return CURATED_COLLECTIONS.map((col) => {
    const contractAddress = col.addresses[targetChain];
    if (!contractAddress) {
      throw new Error(`Collection ${col.name} (${col.id}) is not deployed on chain ${targetChain}.`);
    }
    return {
      ...col,
      contractAddress,
    };
  });
}

export function getCollectionByAddress(
  address: string,
  chainId?: number
): ActiveCuratedCollection | null {
  if (!address) return null;
  const lowerTarget = address.toLowerCase();
  let targetChain: number | undefined = chainId;
  if (targetChain === undefined) {
    const envVal = process.env.NEXT_PUBLIC_CHAIN_ID;
    if (!envVal) {
      throw new Error('Chain ID is not configured. NEXT_PUBLIC_CHAIN_ID must be set.');
    }
    targetChain = Number(envVal);
  }
  if (isNaN(targetChain)) {
    throw new Error('Invalid chain ID configuration.');
  }
  const all = getCuratedCollections(targetChain);
  const found = all.find((col) => col.contractAddress.toLowerCase() === lowerTarget);
  if (found) return found;

  for (const c of CURATED_COLLECTIONS) {
    const isMatch = Object.values(c.addresses).some(
      (addr) => addr && typeof addr === 'string' && addr.toLowerCase() === lowerTarget
    );
    if (isMatch) {
      const targetAddress = c.addresses[targetChain];
      if (!targetAddress) {
        throw new Error(`Collection ${c.name} (${c.id}) is not deployed on chain ${targetChain}.`);
      }
      return {
        ...c,
        contractAddress: targetAddress,
      };
    }
  }
  return null;
}

export function isCollectionAllowed(address: string, chainId?: number): boolean {
  return getCollectionByAddress(address, chainId) !== null;
}
