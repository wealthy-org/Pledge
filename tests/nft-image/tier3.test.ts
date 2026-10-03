import { describe, it, expect } from 'vitest';
import { generateSvgArtwork, buildGenerativeResolvedImage } from '@/lib/nft-image/tier3-generative';

describe('Tier 3: Deterministic Generative Artwork Generator', () => {
  const contractA = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const contractB = '0x35aFdeCe065C2453461dA4726A2843E77Fb48C6c';

  it('generates 100% deterministic SVG data URI for same contract and tokenId', () => {
    const first = generateSvgArtwork(contractA, '42');
    const second = generateSvgArtwork(contractA, '42');
    expect(first).toBe(second);
    expect(first.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });

  it('generates distinct SVG artwork for different tokenIds', () => {
    const svg1 = generateSvgArtwork(contractA, '1');
    const svg2 = generateSvgArtwork(contractA, '2');
    expect(svg1).not.toBe(svg2);
  });

  it('generates distinct SVG artwork for different contracts with same tokenId', () => {
    const svgA = generateSvgArtwork(contractA, '1');
    const svgB = generateSvgArtwork(contractB, '1');
    expect(svgA).not.toBe(svgB);
  });

  it('handles empty or missing inputs gracefully', () => {
    const svg = generateSvgArtwork('', '');
    expect(svg.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });

  it('renders symbol or emblem instead of #0 when tokenId is empty or 0', () => {
    const svgWithSymbol = generateSvgArtwork(contractA, '', 'ROB');
    const decoded = decodeURIComponent(svgWithSymbol);
    expect(decoded).toContain('ROB');
    expect(decoded).not.toContain('>#0</text>');
    expect(decoded).not.toContain('>#</text>');

    const svgZeroToken = generateSvgArtwork(contractA, '0', 'WSP');
    const decodedZero = decodeURIComponent(svgZeroToken);
    expect(decodedZero).toContain('WSP');
    expect(decodedZero).not.toContain('>#0</text>');
  });

  it('buildGenerativeResolvedImage returns proper ResolvedNftImage object', () => {
    const resolved = buildGenerativeResolvedImage(contractA, '100');
    expect(resolved.source).toBe('generative');
    expect(resolved.isFallback).toBe(true);
    expect(resolved.rawUri).toBeNull();
    expect(resolved.url.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });
});
