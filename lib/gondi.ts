import type {
  GondiTimeframe,
  GondiMarketOverviewData,
  GondiMarketOverviewItem,
  GondiCollectionNode,
  GondiNftNode,
  GondiLendingPulseData,
  GondiOfferNode,
  GondiLoanNode,
  GondiGraphQLResponse,
  GondiImage,
} from '@/types/gondi';
import { resolveMediaUrlSafe } from '@/lib/nft-image/uri';
import { GONDI_GRAPHQL_ENDPOINT, GONDI_CDN_URL } from './constants';

export { GONDI_GRAPHQL_ENDPOINT, GONDI_CDN_URL };
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

  public async getCollectionByAddress(contractAddress: string): Promise<GondiCollectionNode | null> {
    if (!contractAddress) return null;
    const normalized = contractAddress.toLowerCase();
    const query = `
      query GetCollectionByAddress($contractAddress: Address!) {
        getCollectionsByContractAddress(contractAddress: $contractAddress) {
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
    `;

    try {
      const data = await executeGondiQuery<{
        getCollectionsByContractAddress: GondiCollectionNode[];
      }>(query, { contractAddress: normalized }, `collection:${normalized}`);
      const list = data?.getCollectionsByContractAddress || [];
      if (list.length > 0) {
        return list[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  public async getNftMetadata(
    contractAddress: string,
    tokenId: string
  ): Promise<GondiNftNode | null> {
    if (!contractAddress || !tokenId) return null;
    const query = `
      query GetNftByContractAndToken($contractAddress: Address!, $tokenId: BigInt!) {
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

  public async listOffers(options?: {
    slugs?: string[];
    contractAddresses?: string[];
    statuses?: string[];
    first?: number;
  } | number): Promise<GondiOfferNode[]> {
    const opts = typeof options === 'number' ? { first: options } : options;
    const first = opts?.first || 50;
    const cacheKey = `offers:${opts?.slugs?.join(',') || ''}:${opts?.contractAddresses?.join(',') || ''}:${opts?.statuses?.join(',') || ''}:${first}`;

    let query: string;
    let variables: Record<string, unknown>;

    if (opts?.slugs && opts.slugs.length > 0) {
      if (opts?.statuses && opts.statuses.length > 0) {
        query = `
          query ListOffersBySlugWithStatus($slugs: [String!]!, $statuses: [OfferStatus!], $first: Int) {
            listOffers(slugs: $slugs, statuses: $statuses, first: $first) {
              edges {
                node {
                  id
                  offerId
                  lenderAddress
                  borrowerAddress
                  principalAmount
                  aprBps
                  fee
                  duration
                  expirationTime
                  status
                  contractAddress
                  collateralAddress
                }
              }
            }
          }
        `;
        variables = { slugs: opts.slugs, statuses: opts.statuses, first };
      } else {
        query = `
          query ListOffersBySlug($slugs: [String!]!, $first: Int) {
            listOffers(slugs: $slugs, first: $first) {
              edges {
                node {
                  id
                  offerId
                  lenderAddress
                  borrowerAddress
                  principalAmount
                  aprBps
                  fee
                  duration
                  expirationTime
                  status
                  contractAddress
                  collateralAddress
                }
              }
            }
          }
        `;
        variables = { slugs: opts.slugs, first };
      }
    } else if (opts?.contractAddresses && opts.contractAddresses.length > 0) {
      if (opts?.statuses && opts.statuses.length > 0) {
        query = `
          query ListOffersByContractWithStatus($contractAddresses: [Address!]!, $statuses: [OfferStatus!], $first: Int) {
            listOffers(contractAddresses: $contractAddresses, statuses: $statuses, first: $first) {
              edges {
                node {
                  id
                  offerId
                  lenderAddress
                  borrowerAddress
                  principalAmount
                  aprBps
                  fee
                  duration
                  expirationTime
                  status
                  contractAddress
                  collateralAddress
                }
              }
            }
          }
        `;
        variables = { contractAddresses: opts.contractAddresses.map((a) => a.toLowerCase()), statuses: opts.statuses, first };
      } else {
        query = `
          query ListOffersByContract($contractAddresses: [Address!]!, $first: Int) {
            listOffers(contractAddresses: $contractAddresses, first: $first) {
              edges {
                node {
                  id
                  offerId
                  lenderAddress
                  borrowerAddress
                  principalAmount
                  aprBps
                  fee
                  duration
                  expirationTime
                  status
                  contractAddress
                  collateralAddress
                }
              }
            }
          }
        `;
        variables = { contractAddresses: opts.contractAddresses.map((a) => a.toLowerCase()), first };
      }
    } else {
      if (opts?.statuses && opts.statuses.length > 0) {
        query = `
          query ListOffersGlobalWithStatus($statuses: [OfferStatus!], $first: Int) {
            listOffers(statuses: $statuses, first: $first) {
              edges {
                node {
                  id
                  offerId
                  lenderAddress
                  borrowerAddress
                  principalAmount
                  aprBps
                  fee
                  duration
                  expirationTime
                  status
                  contractAddress
                  collateralAddress
                }
              }
            }
          }
        `;
        variables = { statuses: opts.statuses, first };
      } else {
        query = `
          query ListOffersGlobal($first: Int) {
            listOffers(first: $first) {
              edges {
                node {
                  id
                  offerId
                  lenderAddress
                  borrowerAddress
                  principalAmount
                  aprBps
                  fee
                  duration
                  expirationTime
                  status
                  contractAddress
                  collateralAddress
                }
              }
            }
          }
        `;
        variables = { first };
      }
    }

    try {
      const data = await executeGondiQuery<{
        listOffers: { edges: Array<{ node: GondiOfferNode }> };
      }>(query, variables, cacheKey);
      return (data?.listOffers?.edges || []).map((e) => e.node);
    } catch {
      return [];
    }
  }

  public async getCollectionOffers(
    contractAddress: string,
    slug?: string,
    first: number = 30
  ): Promise<GondiOfferNode[]> {
    if (!contractAddress) return [];
    const normalized = contractAddress.toLowerCase();
    let colSlug = slug;
    if (!colSlug) {
      const col = await this.getCollectionByAddress(normalized).catch(() => null);
      if (col?.slug) colSlug = col.slug;
    }

    const seen = new Set<string>();
    const matched: GondiOfferNode[] = [];

    const addOffer = (o: GondiOfferNode) => {
      if (!o || seen.has(o.id)) return;
      seen.add(o.id);
      matched.push({
        ...o,
        collateralAddress: normalized,
        contractAddress: o.contractAddress || normalized,
      });
    };

    if (colSlug) {
      const activeBySlug = await this.listOffers({ slugs: [colSlug], statuses: ['ACTIVE'], first }).catch(() => []);
      for (const o of activeBySlug) addOffer(o);

      if (matched.length === 0) {
        const allBySlug = await this.listOffers({ slugs: [colSlug], first }).catch(() => []);
        for (const o of allBySlug) addOffer(o);
      }
    }

    if (matched.length === 0) {
      const byContract = await this.listOffers({ contractAddresses: [normalized], statuses: ['ACTIVE'], first }).catch(() => []);
      for (const o of byContract) addOffer(o);

      if (matched.length === 0) {
        const allByContract = await this.listOffers({ contractAddresses: [normalized], first }).catch(() => []);
        for (const o of allByContract) addOffer(o);
      }
    }

    return matched;
  }

  public async listLoans(options?: {
    slugs?: string[];
    contractAddresses?: string[];
    first?: number;
  } | number): Promise<GondiLoanNode[]> {
    const opts = typeof options === 'number' ? { first: options } : options;
    const first = opts?.first || 50;
    const cacheKey = `loans:${opts?.slugs?.join(',') || ''}:${opts?.contractAddresses?.join(',') || ''}:${first}`;

    let query: string;
    let variables: Record<string, unknown>;

    if (opts?.slugs && opts.slugs.length > 0) {
      query = `
        query ListLoansBySlug($slugs: [String!]!, $first: Int) {
          listLoans(slugs: $slugs, first: $first) {
            edges {
              node {
                id
                loanId
                address
                borrowerAddress
                principalAddress
                startTime
                repaymentTime
                duration
                status
                protocolFee
                offerIds
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
        }
      `;
      variables = { slugs: opts.slugs, first };
    } else if (opts?.contractAddresses && opts.contractAddresses.length > 0) {
      query = `
        query ListLoansByContract($contractAddresses: [Address!]!, $first: Int) {
          listLoans(contractAddresses: $contractAddresses, first: $first) {
            edges {
              node {
                id
                loanId
                address
                borrowerAddress
                principalAddress
                startTime
                repaymentTime
                duration
                status
                protocolFee
                offerIds
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
        }
      `;
      variables = { contractAddresses: opts.contractAddresses.map((a) => a.toLowerCase()), first };
    } else {
      query = `
        query ListLoansGlobal($first: Int) {
          listLoans(first: $first) {
            edges {
              node {
                id
                loanId
                address
                borrowerAddress
                principalAddress
                startTime
                repaymentTime
                duration
                status
                protocolFee
                offerIds
                currency {
                  symbol
                  decimals
                }
              }
            }
          }
        }
      `;
      variables = { first };
    }

    try {
      const data = await executeGondiQuery<{
        listLoans: { edges: Array<{ node: GondiLoanNode }> };
      }>(query, variables, cacheKey);
      return (data?.listLoans?.edges || []).map((e) => e.node);
    } catch {
      return [];
    }
  }

  public async getCollectionLoans(
    contractAddress: string,
    slug?: string,
    first: number = 30
  ): Promise<GondiLoanNode[]> {
    if (!contractAddress) return [];
    const normalized = contractAddress.toLowerCase();
    let colSlug = slug;
    if (!colSlug) {
      const col = await this.getCollectionByAddress(normalized).catch(() => null);
      if (col?.slug) colSlug = col.slug;
    }

    const seen = new Set<string>();
    const matched: GondiLoanNode[] = [];

    const addLoan = (l: GondiLoanNode) => {
      if (!l || seen.has(l.id)) return;
      seen.add(l.id);
      matched.push({
        ...l,
        address: normalized,
      });
    };

    if (colSlug) {
      const bySlug = await this.listLoans({ slugs: [colSlug], first }).catch(() => []);
      for (const l of bySlug) addLoan(l);
    }

    if (matched.length === 0) {
      const byContract = await this.listLoans({ contractAddresses: [normalized], first }).catch(() => []);
      for (const l of byContract) addLoan(l);
    }

    return matched;
  }

  public async getAllOffersMap(first: number = 50): Promise<Map<string, GondiOfferNode[]>> {
    const activeOffers = await this.listOffers({ statuses: ['ACTIVE'], first }).catch(() => []);
    const offers = activeOffers.length > 0 ? activeOffers : await this.listOffers({ first }).catch(() => []);
    const map = new Map<string, GondiOfferNode[]>();

    for (const o of offers) {
      const colAddr = (o.collateralAddress || o.contractAddress || '').toLowerCase();
      if (!colAddr) continue;
      const list = map.get(colAddr) || [];
      list.push(o);
      map.set(colAddr, list);
    }

    return map;
  }
}

export const gondiClient = new GondiClient();

