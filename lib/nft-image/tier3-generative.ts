import type { ResolvedNftImage } from './types';

const COLOR_PALETTES = [
  { bg1: '#064e3b', bg2: '#022c22', accent: '#10b981', text: '#6ee7b7' },
  { bg1: '#1e1b4b', bg2: '#0f172a', accent: '#6366f1', text: '#a5b4fc' },
  { bg1: '#14532d', bg2: '#052e16', accent: '#22c55e', text: '#86efac' },
  { bg1: '#78350f', bg2: '#451a03', accent: '#f59e0b', text: '#fde68a' },
  { bg1: '#1e293b', bg2: '#0f172a', accent: '#38bdf8', text: '#7dd3fc' },
  { bg1: '#701a75', bg2: '#4a044e', accent: '#d946ef', text: '#f5d0fe' },
  { bg1: '#831843', bg2: '#500724', accent: '#f43f5e', text: '#fecdd3' },
  { bg1: '#0c4a6e', bg2: '#082f49', accent: '#06b6d4', text: '#67e8f9' },
];

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateSvgArtwork(contractAddress: string, tokenId: string): string {
  const cleanAddr = (contractAddress || '0x0000000000000000000000000000000000000000').toLowerCase();
  const cleanTokenId = (tokenId || '0').trim();
  const seed = stringToSeed(`${cleanAddr}:${cleanTokenId}`);

  const palette = COLOR_PALETTES[seed % COLOR_PALETTES.length];
  const shapeCount = 3 + (seed % 4);
  const displayId = cleanTokenId.length > 8 ? `${cleanTokenId.slice(0, 6)}...` : cleanTokenId;

  let shapesSvg = '';
  for (let i = 0; i < shapeCount; i++) {
    const sSeed = (seed + i * 31) % 1000;
    const cx = (sSeed * 7) % 360 + 20;
    const cy = (sSeed * 13) % 360 + 20;
    const r = 30 + (sSeed % 60);
    const opacity = (0.15 + (sSeed % 25) / 100).toFixed(2);
    shapesSvg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette.accent}" fill-opacity="${opacity}" filter="blur(20px)" />`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <defs>
      <linearGradient id="g_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
      <pattern id="grid_${seed}" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${palette.accent}" stroke-width="0.5" stroke-opacity="0.1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#g_${seed})" />
    <rect width="100%" height="100%" fill="url(#grid_${seed})" />
    ${shapesSvg}
    <g transform="translate(200, 200)">
      <rect x="-60" y="-60" width="120" height="120" rx="24" fill="${palette.bg1}" fill-opacity="0.6" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.4" />
      <text x="0" y="8" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="${palette.text}" text-anchor="middle">#${displayId}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildGenerativeResolvedImage(
  contractAddress: string,
  tokenId: string
): ResolvedNftImage {
  const url = generateSvgArtwork(contractAddress, tokenId);
  return {
    url,
    source: 'generative',
    isFallback: true,
    rawUri: null,
  };
}
