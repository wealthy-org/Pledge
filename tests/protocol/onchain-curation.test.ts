import { describe, it, expect, beforeEach } from 'vitest';
import { getProtocolSnapshot, clearSnapshotCache } from '@/lib/protocol/snapshot';
import { fetchCuratedCollections } from '@/config/collections';
import { indexerStore } from '@/lib/indexer/store';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { GET as searchRoute } from '@/app/api/search/route';
import { GET as collectionDetailRoute } from '@/app/api/collections/[address]/route';
import { GET as eligibleNftsRoute } from '@/app/api/wallets/[address]/eligible-nfts/route';
import { gondiClient } from '@/lib/gondi';
import { vi } from 'vitest';
import { NextRequest } from 'next/server';

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

describe('On-Chain Curation Lifecycle Integration Suite', () => {
  const COLLECTION_A = '0x1111111111111111111111111111111111111111';
  const COLLECTION_B = '0x2222222222222222222222222222222222222222';
  const WALLET_TEST = '0xfB5870428d00B1a18274737609825b74c8C12e2B';

  beforeEach(() => {
    clearSnapshotCache();
    indexerStore.reset();
  });

  it('reflects admin addition of curated collection in snapshot and fetchCuratedCollections', async () => {
    indexerStore.collections.set(`${TESTNET_CHAIN_ID}:${COLLECTION_A}`, {
      chain_id: TESTNET_CHAIN_ID,
      address: COLLECTION_A,
      name: 'Cyber Samurai NFT',
      symbol: 'CSAM',
      image_url: null,
      is_enabled: true,
      added_at: new Date().toISOString(),
    });

    const curated = await fetchCuratedCollections(TESTNET_CHAIN_ID);
    expect(curated.length).toBe(1);
    expect(curated[0].contractAddress.toLowerCase()).toBe(COLLECTION_A.toLowerCase());
    expect(curated[0].name).toBe('Cyber Samurai NFT');
    expect(curated[0].symbol).toBe('CSAM');

    const snapshot = await getProtocolSnapshot(TESTNET_CHAIN_ID);
    expect(snapshot.enabledCollections).toContain(COLLECTION_A);
  });

  it('excludes disabled collection from snapshot even if historic offers or loans exist without fabrication', async () => {
    indexerStore.collections.set(`${TESTNET_CHAIN_ID}:${COLLECTION_A}`, {
      chain_id: TESTNET_CHAIN_ID,
      address: COLLECTION_A,
      name: 'Cyber Samurai NFT',
      symbol: 'CSAM',
      image_url: null,
      is_enabled: false,
      added_at: new Date().toISOString(),
    });

    indexerStore.upsertOffer({
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_TEST,
      collection: COLLECTION_A,
      principal_wei: '1000000000000000000',
      term_interest_bps: 400,
      fee_bps_snapshot: 200,
      duration_seconds: 604800,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'open',
      block_number: 100,
      tx_hash: '0x1',
      indexed_at: new Date().toISOString(),
    });

    indexerStore.upsertLoan({
      loan_id: 1,
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_TEST,
      borrower: WALLET_TEST,
      collection: COLLECTION_A,
      token_id: '1',
      principal_wei: '1000000000000000000',
      interest_wei: '40000000000000000',
      fee_bps_snapshot: 200,
      started_at: new Date().toISOString(),
      due_at: new Date(Date.now() + 604800000).toISOString(),
      status: 'active',
      block_number: 100,
      tx_hash: '0xloan',
      indexed_at: new Date().toISOString(),
    });

    const snapshot = await getProtocolSnapshot(TESTNET_CHAIN_ID);
    expect(snapshot.enabledCollections).not.toContain(COLLECTION_A);
  });

  it('updates search API dynamically according to on-chain curated collections', async () => {
    indexerStore.collections.set(`${TESTNET_CHAIN_ID}:${COLLECTION_A}`, {
      chain_id: TESTNET_CHAIN_ID,
      address: COLLECTION_A,
      name: 'Aether Phoenix',
      symbol: 'APX',
      image_url: null,
      is_enabled: true,
      added_at: new Date().toISOString(),
    });
    indexerStore.collections.set(`${TESTNET_CHAIN_ID}:${COLLECTION_B}`, {
      chain_id: TESTNET_CHAIN_ID,
      address: COLLECTION_B,
      name: 'Shadow Wraith',
      symbol: 'SWR',
      image_url: null,
      is_enabled: false,
      added_at: new Date().toISOString(),
    });

    const reqMatch = createRequest('http://localhost:3000/api/search?q=phoenix');
    const resMatch = await searchRoute(reqMatch);
    expect(resMatch.status).toBe(200);
    const bodyMatch = await resMatch.json();
    expect(bodyMatch.results.length).toBe(1);
    expect(bodyMatch.results[0].id.toLowerCase()).toBe(COLLECTION_A.toLowerCase());

    const reqDisabled = createRequest('http://localhost:3000/api/search?q=wraith');
    const resDisabled = await searchRoute(reqDisabled);
    expect(resDisabled.status).toBe(200);
    const bodyDisabled = await resDisabled.json();
    expect(bodyDisabled.results.length).toBe(0);
  });

  it('enforces 404 for uncurated collection without active market presence', async () => {
    const UNCURATED_ADDR = '0x9999999999999999999999999999999999999999';
    const req = createRequest(`http://localhost:3000/api/collections/${UNCURATED_ADDR}`);
    const res = await collectionDetailRoute(req, {
      params: Promise.resolve({ address: UNCURATED_ADDR }),
    });
    expect(res.status).toBe(404);
  });

  it('eligible-nfts route filters against curated collections and excludes active collaterals', async () => {
    indexerStore.collections.set(`${TESTNET_CHAIN_ID}:${COLLECTION_A}`, {
      chain_id: TESTNET_CHAIN_ID,
      address: COLLECTION_A,
      name: 'Aether Phoenix',
      symbol: 'APX',
      image_url: null,
      is_enabled: true,
      added_at: new Date().toISOString(),
    });

    indexerStore.upsertLoan({
      loan_id: 1,
      offer_id: 1,
      chain_id: TESTNET_CHAIN_ID,
      lender: WALLET_TEST,
      borrower: WALLET_TEST,
      collection: COLLECTION_A,
      token_id: '5',
      principal_wei: '1000000000000000000',
      interest_wei: '40000000000000000',
      fee_bps_snapshot: 200,
      started_at: new Date().toISOString(),
      due_at: new Date(Date.now() + 604800000).toISOString(),
      status: 'active',
      block_number: 100,
      tx_hash: '0xloan',
      indexed_at: new Date().toISOString(),
    });

    vi.spyOn(gondiClient, 'listNfts').mockResolvedValue([
      {
        id: '1',
        tokenId: '5',
        name: 'APX #5',
        collection: {
          id: COLLECTION_A,
          name: 'Aether Phoenix',
          contractData: { contractAddress: COLLECTION_A },
        },
      } as any,
      {
        id: '2',
        tokenId: '6',
        name: 'APX #6',
        collection: {
          id: COLLECTION_A,
          name: 'Aether Phoenix',
          contractData: { contractAddress: COLLECTION_A },
        },
      } as any,
      {
        id: '3',
        tokenId: '7',
        name: 'Uncurated #7',
        collection: {
          id: COLLECTION_B,
          name: 'Shadow Wraith',
          contractData: { contractAddress: COLLECTION_B },
        },
      } as any,
    ]);

    const req = createRequest(`http://localhost:3000/api/wallets/${WALLET_TEST}/eligible-nfts`);
    const res = await eligibleNftsRoute(req, {
      params: Promise.resolve({ address: WALLET_TEST }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.nfts.length).toBe(2);
    expect(body.nfts.some((n: any) => n.tokenId === '5')).toBe(false);
    expect(body.nfts.some((n: any) => n.tokenId === '6')).toBe(true);
    expect(body.nfts.some((n: any) => n.tokenId === '7')).toBe(true);
  });
});
