export interface BlockscoutRawToken {
  address?: string | null;
  address_hash?: string | null;
  name?: string | null;
  symbol?: string | null;
  type?: string | null;
  total_supply?: string | null;
}

export interface BlockscoutRawAttribute {
  trait_type: string;
  value: unknown;
}

export interface BlockscoutRawMetadata {
  name?: string | null;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  animation_url?: string | null;
  attributes?: BlockscoutRawAttribute[] | null;
  [key: string]: unknown;
}

export interface BlockscoutRawNFTInstance {
  id: string;
  token_id: string;
  token?: BlockscoutRawToken | null;
  metadata?: BlockscoutRawMetadata | null;
  owner?: {
    hash: string;
    implementation_name?: string | null;
    is_contract?: boolean;
  } | null;
}

export interface BlockscoutRawWalletNFTResponse {
  items: BlockscoutRawNFTInstance[];
  next_page_params?: Record<string, unknown> | null;
}

export interface SanitizedNFTItem {
  tokenId: string;
  collectionAddress: string;
  collectionName: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: BlockscoutRawAttribute[];
}

export interface SanitizedWalletNFTResponse {
  items: SanitizedNFTItem[];
  nextPageParams: Record<string, unknown> | null;
}

export interface BlockscoutClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}
