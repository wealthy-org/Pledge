import { MAINNET_CHAIN_ID } from './chains';
import { CURATED_COLLECTIONS, type ActiveCuratedCollection } from './collections';

export const MAINNET_CURATED_COLLECTIONS: ActiveCuratedCollection[] = CURATED_COLLECTIONS.map((col) => ({
  ...col,
  contractAddress: col.addresses[MAINNET_CHAIN_ID],
}));

export function getMainnetCollectionByAddress(address: string): ActiveCuratedCollection | null {
  if (!address) return null;
  const target = address.toLowerCase();
  const found = MAINNET_CURATED_COLLECTIONS.find(
    (col) => col.contractAddress.toLowerCase() === target
  );
  return found || null;
}
