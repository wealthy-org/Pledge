import { getActiveChain } from '@/config/chains';
import type {
  BlockscoutClientConfig,
  BlockscoutRawAttribute,
  BlockscoutRawMetadata,
  BlockscoutRawNFTInstance,
  BlockscoutRawWalletNFTResponse,
  SanitizedNFTItem,
  SanitizedWalletNFTResponse,
} from '@/types/blockscout';

export class BlockscoutApiError extends Error {
  public statusCode: number;
  public endpoint: string;

  constructor(message: string, statusCode: number, endpoint: string) {
    super(message);
    this.name = 'BlockscoutApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

export function resolveMediaUrl(uri: string): string {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    throw new Error('Media URL cannot be empty.');
  }

  const trimmed = uri.trim();

  if (trimmed.startsWith('ipfs://')) {
    const path = trimmed.replace(/^ipfs:\/\//, '');
    return `https://gateway.pinata.cloud/ipfs/${path}`;
  }

  if (trimmed.includes('ipfs.io/ipfs/')) {
    return trimmed.replace(/https?:\/\/ipfs\.io\/ipfs\//, 'https://gateway.pinata.cloud/ipfs/');
  }

  if (trimmed.startsWith('ar://')) {
    const path = trimmed.replace(/^ar:\/\//, '');
    return `https://arweave.net/${path}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const colonIdx = trimmed.indexOf(':');
  const protocol = colonIdx !== -1 ? trimmed.slice(0, colonIdx + 1) : 'unknown:';
  throw new Error(`Unsupported URI protocol: ${protocol}`);
}

export function sanitizeMetadata(raw?: BlockscoutRawMetadata | null): {
  name: string;
  description: string;
  imageUrl: string;
  attributes: BlockscoutRawAttribute[];
} {
  if (!raw) {
    return {
      name: 'Unnamed Asset',
      description: '',
      imageUrl: '',
      attributes: [],
    };
  }

  const name = raw.name || 'Unnamed Asset';
  const description = raw.description || '';
  const rawImage = raw.image || raw.image_url || '';
  let imageUrl = '';

  if (rawImage) {
    try {
      imageUrl = resolveMediaUrl(rawImage);
    } catch {
      imageUrl = '';
    }
  }

  const attributes = Array.isArray(raw.attributes) ? raw.attributes : [];

  return {
    name,
    description,
    imageUrl,
    attributes,
  };
}

export class BlockscoutClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeoutMs: number;

  constructor(config?: BlockscoutClientConfig, chainId?: number) {
    const chain = getActiveChain(chainId);
    const explorerUrl = chain.blockExplorers?.default.url;
    const resolvedUrl = config?.baseUrl ?? process.env.NEXT_PUBLIC_BLOCKSCOUT_API_URL ?? (explorerUrl ? `${explorerUrl}/api/v2` : undefined);
    if (!resolvedUrl) {
      throw new Error('Blockscout API URL is not configured.');
    }
    this.baseUrl = resolvedUrl.replace(/\/$/, '');
    this.apiKey = config?.apiKey ?? process.env.BLOCKSCOUT_API_KEY;
    this.timeoutMs = config?.timeoutMs ?? 10000;
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, val);
        }
      });
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BlockscoutApiError(
          `Blockscout API HTTP ${response.status}: ${response.statusText}`,
          response.status,
          cleanEndpoint
        );
      }

      const data = (await response.json()) as T;
      return data;
    } catch (err: unknown) {
      if (err instanceof BlockscoutApiError) {
        throw err;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        throw new BlockscoutApiError(
          `Blockscout API request timed out after ${this.timeoutMs}ms`,
          408,
          cleanEndpoint
        );
      }
      throw new BlockscoutApiError(
        `Failed to fetch from Blockscout API: ${err instanceof Error ? err.message : 'Unknown error'}`,
        500,
        cleanEndpoint
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async fetchWalletNFTs(
    walletAddress: string,
    queryParams?: Record<string, string>
  ): Promise<SanitizedWalletNFTResponse> {
    if (!walletAddress || !walletAddress.startsWith('0x')) {
      throw new Error(`Invalid wallet address format: ${walletAddress}`);
    }

    const raw = await this.request<BlockscoutRawWalletNFTResponse>(
      `/addresses/${walletAddress}/nft`,
      queryParams
    );

    const items: SanitizedNFTItem[] = (raw.items || []).map((item) => {
      const metadata = sanitizeMetadata(item.metadata);
      const collectionAddress =
        item.token?.address_hash ||
        item.token?.address ||
        (item as any).address_hash ||
        (item as any).address ||
        '';
      const collectionName = item.token?.name || 'Unknown Collection';
      const tokenId = item.token_id || item.id || '';
      const name =
        metadata.name && metadata.name !== 'Unnamed Asset'
          ? metadata.name
          : `${collectionName} #${tokenId}`;
      const imageUrl =
        metadata.imageUrl ||
        (item as any).image_url ||
        (item as any).media_url ||
        '';

      return {
        tokenId,
        collectionAddress,
        collectionName,
        name,
        description: metadata.description || '',
        imageUrl,
        attributes: metadata.attributes || [],
      };
    });

    return {
      items,
      nextPageParams: raw.next_page_params || null,
    };
  }

  public async fetchNFTInstance(
    collectionAddress: string,
    tokenId: string
  ): Promise<SanitizedNFTItem> {
    if (!collectionAddress || !collectionAddress.startsWith('0x')) {
      throw new Error(`Invalid collection address format: ${collectionAddress}`);
    }
    if (!tokenId) {
      throw new Error('Token ID is required.');
    }

    const item = await this.request<BlockscoutRawNFTInstance>(
      `/tokens/${collectionAddress}/instances/${tokenId}`
    );

    const metadata = sanitizeMetadata(item.metadata);
    const resolvedAddress =
      item.token?.address_hash || item.token?.address || collectionAddress;
    const collectionName = item.token?.name || 'Unknown Collection';
    const tokenIdVal = item.token_id || item.id || tokenId;
    const name =
      metadata.name && metadata.name !== 'Unnamed Asset'
        ? metadata.name
        : `${collectionName} #${tokenIdVal}`;
    const imageUrl =
      metadata.imageUrl ||
      (item as any).image_url ||
      (item as any).media_url ||
      '';

    return {
      tokenId: tokenIdVal,
      collectionAddress: resolvedAddress,
      collectionName,
      name,
      description: metadata.description || '',
      imageUrl,
      attributes: metadata.attributes || [],
    };
  }
}

const clientsMap = new Map<number, BlockscoutClient>();

export function getBlockscoutClient(chainId?: number): BlockscoutClient {
  let targetId: number | undefined = chainId;
  if (targetId === undefined) {
    const envVal = process.env.NEXT_PUBLIC_CHAIN_ID;
    if (!envVal) {
      throw new Error('Chain ID is not configured. NEXT_PUBLIC_CHAIN_ID must be set.');
    }
    targetId = Number(envVal);
  }
  if (isNaN(targetId)) {
    throw new Error('Invalid chain ID configuration.');
  }
  let client = clientsMap.get(targetId);
  if (!client) {
    client = new BlockscoutClient(undefined, targetId);
    clientsMap.set(targetId, client);
  }
  return client;
}
