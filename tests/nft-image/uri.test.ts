import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveIpfsGatewayUrl,
  resolveArweaveGatewayUrl,
  resolveMediaUrlSafe,
  parseDataUri,
  decodeDataUriJson,
  fetchJsonWithLimit,
  MAX_METADATA_BYTES,
} from '@/lib/nft-image/uri';

describe('NFT Image URI Utilities', () => {
  it('resolves ipfs protocol to pinata gateway URL', () => {
    const raw = 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
    const resolved = resolveIpfsGatewayUrl(raw);
    expect(resolved).toBe('https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco');
  });

  it('replaces ipfs.io domain with pinata gateway', () => {
    const raw = 'https://ipfs.io/ipfs/bafybeihrhgpass/1';
    const resolved = resolveIpfsGatewayUrl(raw);
    expect(resolved).toBe('https://gateway.pinata.cloud/ipfs/bafybeihrhgpass/1');
  });

  it('resolves arweave protocol to arweave gateway', () => {
    const raw = 'ar://e30M3pU8aQ';
    const resolved = resolveArweaveGatewayUrl(raw);
    expect(resolved).toBe('https://arweave.net/e30M3pU8aQ');
  });

  it('safely resolves media urls', () => {
    expect(resolveMediaUrlSafe(null)).toBeNull();
    expect(resolveMediaUrlSafe('')).toBeNull();
    expect(resolveMediaUrlSafe('data:image/svg+xml;utf8,<svg></svg>')).toBe('data:image/svg+xml;utf8,<svg></svg>');
    expect(resolveMediaUrlSafe('https://example.com/nft.png')).toBe('https://example.com/nft.png');
    expect(resolveMediaUrlSafe('ftp://example.com/nft.png')).toBeNull();
  });

  it('parses base64 data URI correctly', () => {
    const jsonStr = JSON.stringify({ name: 'Test NFT', image: 'https://example.com/img.png' });
    const b64 = Buffer.from(jsonStr).toString('base64');
    const dataUri = `data:application/json;base64,${b64}`;

    const parsed = parseDataUri(dataUri);
    expect(parsed).not.toBeNull();
    expect(parsed?.mimeType).toBe('application/json');
    expect(parsed?.isBase64).toBe(true);

    const decoded = decodeDataUriJson(dataUri);
    expect(decoded).toEqual({ name: 'Test NFT', image: 'https://example.com/img.png' });
  });

  it('parses utf8 encoded data URI', () => {
    const dataUri = 'data:application/json;utf8,%7B%22name%22%3A%22Robinhood%22%7D';
    const decoded = decodeDataUriJson(dataUri);
    expect(decoded).toEqual({ name: 'Robinhood' });
  });

  it('returns null for corrupted data URI', () => {
    expect(decodeDataUriJson('data:invalid')).toBeNull();
    expect(decodeDataUriJson('not-a-data-uri')).toBeNull();
  });

  describe('fetchJsonWithLimit', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      global.fetch = originalFetch;
      vi.useRealTimers();
    });

    it('fetches valid JSON payload within limit', async () => {
      const mockData = { name: 'OnChain NFT', image: 'ipfs://bafytest' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '100' }),
        text: () => Promise.resolve(JSON.stringify(mockData)),
      });

      const res = await fetchJsonWithLimit('https://example.com/metadata.json', 3000);
      expect(res).toEqual(mockData);
    });

    it('returns null if response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const res = await fetchJsonWithLimit('https://example.com/metadata.json');
      expect(res).toBeNull();
    });

    it('returns null if content length exceeds maxBytes limit', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': String(MAX_METADATA_BYTES + 1000) }),
        text: () => Promise.resolve('{}'),
      });

      const res = await fetchJsonWithLimit('https://example.com/huge.json');
      expect(res).toBeNull();
    });

    it('returns null if fetched text is invalid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        text: () => Promise.resolve('<html>502 Bad Gateway</html>'),
      });

      const res = await fetchJsonWithLimit('https://example.com/bad.json');
      expect(res).toBeNull();
    });
  });
});
