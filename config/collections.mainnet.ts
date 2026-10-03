import { MAINNET_CHAIN_ID } from './chains';
import { getCuratedCollections, type ActiveCuratedCollection } from './collections';

export const MAINNET_CURATED_COLLECTIONS: ActiveCuratedCollection[] = getCuratedCollections(MAINNET_CHAIN_ID);

export function getMainnetCollectionByAddress(address: string): ActiveCuratedCollection | null {
  if (!address) return null;
  const target = address.toLowerCase();
  const all = getCuratedCollections(MAINNET_CHAIN_ID);
  const found = all.find(
    (col) => col.contractAddress.toLowerCase() === target
  );
  return found || null;
}
