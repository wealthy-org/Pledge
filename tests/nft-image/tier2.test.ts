import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as uriModule from '@/lib/nft-image/uri';

const mockReadContract = vi.fn();

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');
  return {
    ...actual,
    createPublicClient: () => ({
      readContract: mockReadContract,
    }),
  };
});

import { resolveFromTokenUri } from '@/lib/nft-image/tier2-onchain';

describe('Tier 2: On-Chain tokenURI Resolver', () => {
  const contract = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const tokenId = '9124';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves onchain inline base64 JSON metadata', async () => {
    const jsonStr = JSON.stringify({
      name: 'Nouns Pass',
      image: 'https://example.com/noun.svg',
    });
    const b64 = Buffer.from(jsonStr).toString('base64');
    const dataUri = `data:application/json;base64,${b64}`;

    mockReadContract.mockResolvedValueOnce(dataUri);

    const result = await resolveFromTokenUri(contract, tokenId);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('onchain-inline');
    expect(result?.url).toBe('https://example.com/noun.svg');
    expect(result?.isFallback).toBe(false);
  });

  it('resolves off-chain ipfs tokenURI via gateway fetcher', async () => {
    const ipfsTokenUri = 'ipfs://bafybeihrhgpass/9124.json';
    mockReadContract.mockResolvedValueOnce(ipfsTokenUri);

    vi.spyOn(uriModule, 'fetchJsonWithLimit').mockResolvedValueOnce({
      name: 'Robinhood Pass #9124',
      image: 'ipfs://bafybeiefvqwyjtabs3imzrz7fkftqe2vwrazy66mlse7ljz3bvm3vp6qqm',
    });

    const result = await resolveFromTokenUri(contract, tokenId);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('onchain-uri');
    expect(result?.url).toBe('https://gateway.pinata.cloud/ipfs/bafybeiefvqwyjtabs3imzrz7fkftqe2vwrazy66mlse7ljz3bvm3vp6qqm');
  });

  it('returns null on contract revert or invalid address', async () => {
    mockReadContract.mockRejectedValueOnce(new Error('execution reverted'));

    const result = await resolveFromTokenUri(contract, tokenId);
    expect(result).toBeNull();
    expect(await resolveFromTokenUri('invalid-address', tokenId)).toBeNull();
  });

  it('returns null when tokenURI returns empty string or no image field', async () => {
    mockReadContract.mockResolvedValueOnce('');

    const result = await resolveFromTokenUri(contract, tokenId);
    expect(result).toBeNull();
  });
});
