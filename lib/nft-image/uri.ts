export const MAX_METADATA_BYTES = 256 * 1024;
export const DEFAULT_TIMEOUT_MS = 4000;

export function resolveIpfsGatewayUrl(uri: string): string {
  const trimmed = uri.trim();
  if (trimmed.startsWith('ipfs://')) {
    const path = trimmed.replace(/^ipfs:\/\//, '');
    return `https://gateway.pinata.cloud/ipfs/${path}`;
  }
  if (trimmed.includes('ipfs.io/ipfs/')) {
    return trimmed.replace(/https?:\/\/ipfs\.io\/ipfs\//, 'https://gateway.pinata.cloud/ipfs/');
  }
  return trimmed;
}

export function resolveArweaveGatewayUrl(uri: string): string {
  const trimmed = uri.trim();
  if (trimmed.startsWith('ar://')) {
    const path = trimmed.replace(/^ar:\/\//, '');
    return `https://arweave.net/${path}`;
  }
  return trimmed;
}

export function resolveMediaUrlSafe(uri?: string | null): string | null {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return null;
  }
  const trimmed = uri.trim();
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  if (trimmed.startsWith('ipfs://') || trimmed.includes('ipfs.io/ipfs/')) {
    return resolveIpfsGatewayUrl(trimmed);
  }
  if (trimmed.startsWith('ar://')) {
    return resolveArweaveGatewayUrl(trimmed);
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

export function parseDataUri(uri: string): { mimeType: string; isBase64: boolean; data: string } | null {
  if (!uri || !uri.startsWith('data:')) {
    return null;
  }
  const commaIdx = uri.indexOf(',');
  if (commaIdx === -1) {
    return null;
  }
  const meta = uri.slice(5, commaIdx);
  const data = uri.slice(commaIdx + 1);
  const parts = meta.split(';');
  const mimeType = parts[0] || 'text/plain';
  const isBase64 = parts.includes('base64');
  return { mimeType, isBase64, data };
}

export function decodeDataUriJson(uri: string): Record<string, unknown> | null {
  const parsed = parseDataUri(uri);
  if (!parsed) {
    return null;
  }
  try {
    let rawText = '';
    if (parsed.isBase64) {
      if (typeof atob === 'function') {
        rawText = atob(parsed.data);
      } else {
        rawText = Buffer.from(parsed.data, 'base64').toString('utf-8');
      }
    } else {
      rawText = decodeURIComponent(parsed.data);
    }
    if (rawText.length > MAX_METADATA_BYTES) {
      return null;
    }
    const json = JSON.parse(rawText);
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      return json as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchJsonWithLimit(
  url: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxBytes = MAX_METADATA_BYTES
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resolvedUrl = resolveMediaUrlSafe(url) || url;
    const res = await fetch(resolvedUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (!res.ok) {
      return null;
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > maxBytes) {
      return null;
    }

    const text = await res.text();
    if (text.length > maxBytes) {
      return null;
    }

    const data = JSON.parse(text);
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
