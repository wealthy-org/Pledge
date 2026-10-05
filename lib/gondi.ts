import type {
  GondiTimeframe,
  GondiMarketOverviewData,
  GondiMarketOverviewItem,
  GondiCollectionNode,
  GondiNftNode,
  GondiLendingPulseData,
  GondiLoanNode,
  GondiGraphQLResponse,
  GondiImage,
} from '@/types/gondi';
import { resolveMediaUrlSafe } from '@/lib/nft-image/uri';

export const GONDI_GRAPHQL_ENDPOINT = 'https://api2.gondi.xyz/graphql';
const DEFAULT_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 60000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export class GondiApiError extends Error {
  public statusCode: number;
  public endpoint: string;

  constructor(message: string, statusCode: number = 500, endpoint: string = GONDI_GRAPHQL_ENDPOINT) {
    super(message);
    this.name = 'GondiApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

export function clearGondiCache(): void {
  memoryCache.clear();
}

export function extractGondiImageUrl(img?: GondiImage | null): string | null {
  if (!img) return null;
  if (img.data && typeof img.data === 'string' && img.data.trim() !== '') {
    return resolveMediaUrlSafe(img.data);
  }
  if (img.cacheUrl && typeof img.cacheUrl === 'string' && !img.cacheUrl.includes('==')) {
    return resolveMediaUrlSafe(img.cacheUrl);
  }
  if (img.cacheUrl && typeof img.cacheUrl === 'string') {
    return resolveMediaUrlSafe(img.cacheUrl);
  }
  return null;
}

export async function executeGondiQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  cacheKey?: string,
  ttlMs: number = CACHE_TTL_MS
): Promise<T> {
  if (cacheKey) {
    const cached = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(GONDI_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new GondiApiError(`Gondi API HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const payload: GondiGraphQLResponse<T> = await response.json();

    if (payload.errors && payload.errors.length > 0) {
      const msg = payload.errors.map((e) => e.message).join('; ');
      throw new GondiApiError(`Gondi GraphQL Error: ${msg}`, 400);
    }

    if (!payload.data) {
      throw new GondiApiError('Gondi GraphQL returned empty data payload', 500);
    }

    if (cacheKey) {
      memoryCache.set(cacheKey, {
        data: payload.data,
        expiresAt: Date.now() + ttlMs,
      });
    }

    return payload.data;
  } catch (err: unknown) {
    if (err instanceof GondiApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new GondiApiError(`Gondi API request timed out after ${DEFAULT_TIMEOUT_MS}ms`, 408);
    }
    throw new GondiApiError(
      `Failed to fetch from Gondi API: ${err instanceof Error ? err.message : 'Unknown error'}`,
      500
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export class GondiClient {
  public async getMarketOverviewData(timeframe: GondiTimeframe = 'DAY'): Promise<GondiMarketOverviewData> {
    const query = `
      query GetOverview($timeframe: MarketOverviewTimeframe!) {
        getMarketOverview(timeframe: $timeframe) {
          top {
            salesCount
            salesVolume
            floorChangePercent
            loansCount
            usersCount
            collection {
              id
              name
              slug
              supply
              nftsCount
              contractData {
                contractAddress
              }
              image {
                id
                data
                accessTypeName
                contentTypeMime
                cacheUrl
              }
            }
          }
          volume {
            salesCount
            salesVolume
            floorChangePercent
            collection {
              id
              name
              slug
              contractData {
                contractAddress
              }
              image {
                id
                data
                accessTypeName
                contentTypeMime
                cacheUrl
              }
            }
          }
          movers {
            salesCount
            floorChangePercent
            collection {
              id
              name
              slug
              contractData {
                contractAddress
              }
              image {
                id
                data
                accessTypeName
                contentTypeMime
                cacheUrl
              }
            }
          }
        }
      }
    `;

    try {
      const data = await executeGondiQuery<{ getMarketOverview: GondiMarketOverviewData }>(
        query,
        { timeframe },
        `overview:${timeframe}`
      );
      return data?.getMarketOverview || { top: [], volume: [], movers: [] };
    } catch {
      return { top: [], volume: [], movers: [] };
    }
  }

  public async getMarketOverview(timeframe: GondiTimeframe = 'DAY'): Promise<GondiMarketOverviewItem[]> {
    const data = await this.getMarketOverviewData(timeframe);
    return data.top || [];
  }

  public async listCollections(first: number = 30): Promise<GondiCollectionNode[]> {
    const query = `
      query ListCollections($first: Int!) {
        listCollections(first: $first) {
          edges {
            node {
              id
              name
              slug
              description
              supply
              contractData {
                contractAddress
              }
              image {
                id
                data
                accessTypeName
                contentTypeMime
                cacheUrl
              }
            }
          }
        }
      }
    `;

    try {
      const data = await executeGondiQuery<{
        listCollections: { edges: Array<{ node: GondiCollectionNode }> };
      }>(query, { first }, `collections:${first}`);
      return (data?.listCollections?.edges || []).map((e) => e.node);
    } catch {
      return [];
    }
  }

  public async getNftMetadata(
    contractAddress: string,
    tokenId: string
  ): Promise<GondiNftNode | null> {
    if (!contractAddress || !tokenId) return null;
    const query = `
      query GetNftByContractAndToken($contractAddress: Address!, $tokenId: String!) {
        getNftByContractAddressAndTokenId(contractAddress: $contractAddress, tokenId: $tokenId) {
          id
          tokenId
          name
          description
          image {
            id
            data
            accessTypeName
            contentTypeMime
            cacheUrl
          }
          collection {
            id
            name
            slug
            contractData {
              contractAddress
            }
          }
        }
      }
    `;

    try {
      const data = await executeGondiQuery<{
        getNftByContractAddressAndTokenId: GondiNftNode | null;
      }>(
        query,
        { contractAddress: contractAddress.toLowerCase(), tokenId },
        `nft:${contractAddress.toLowerCase()}:${tokenId}`
      );
      return data?.getNftByContractAddressAndTokenId || null;
    } catch {
      return null;
    }
  }

  public async getLendingMarketPulse(): Promise<GondiLendingPulseData | null> {
    const query = `
      query GetLendingPulse {
        getLendingMarketPulse {
          asOf
          outstandingPrincipalUsd
          accruedTodayUsd
          accrualPerDayUsd
          paidInterest30dUsd
          newLoans24h
        }
      }
    `;

    try {
      const data = await executeGondiQuery<{
        getLendingMarketPulse: GondiLendingPulseData | null;
      }>(query, {}, 'pulse', 30000);
      return data?.getLendingMarketPulse || null;
    } catch {
      return null;
    }
  }

  public async listNfts(first: number = 20): Promise<GondiNftNode[]> {
    const query = `
      query ListNfts($first: Int!) {
        listNfts(first: $first) {
          edges {
            node {
              id
              tokenId
              name
              image {
                id
                data
                accessTypeName
                contentTypeMime
                cacheUrl
              }
              collection {
                id
                name
                slug
                contractData {
                  contractAddress
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await executeGondiQuery<{
        listNfts: { edges: Array<{ node: GondiNftNode }> };
      }>(query, { first }, `nfts:${first}`);
      return (data?.listNfts?.edges || []).map((e) => e.node);
    } catch {
      return [];
    }
  }

  public async listLoans(first: number = 20): Promise<GondiLoanNode[]> {
    const query = `
      query ListLoans($first: Int!) {
        listLoans(first: $first) {
          edges {
            node {
              id
              principalAmount
              duration
              startTime
              status
              nft {
                name
                tokenId
                image {
                  id
                  data
                  accessTypeName
                  contentTypeMime
                  cacheUrl
                }
                collection {
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
      const data = await executeGondiQuery<{
        listLoans: { edges: Array<{ node: GondiLoanNode }> };
      }>(query, { first }, `loans:${first}`);
      return (data?.listLoans?.edges || []).map((e) => e.node);
    } catch {
      return [];
    }
  }
}

export const gondiClient = new GondiClient();
