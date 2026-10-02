export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OfferStatus = 'open' | 'filled' | 'cancelled';
export type LoanStatus = 'active' | 'repaid' | 'foreclosed';

export interface CollectionRow {
  address: string;
  name: string;
  symbol: string | null;
  image_url: string | null;
  is_enabled: boolean;
  added_at: string;
}

export interface OfferRow {
  offer_id: number;
  chain_id: number;
  lender: string;
  collection: string;
  principal_wei: string;
  term_interest_bps: number;
  fee_bps_snapshot: number;
  duration_seconds: number;
  expires_at: string;
  status: OfferStatus;
  block_number: number;
  tx_hash: string;
  indexed_at: string;
}

export interface LoanRow {
  loan_id: number;
  chain_id: number;
  offer_id: number;
  lender: string;
  borrower: string;
  collection: string;
  token_id: string;
  principal_wei: string;
  interest_wei: string;
  fee_bps_snapshot: number;
  started_at: string;
  due_at: string;
  status: LoanStatus;
  block_number: number;
  tx_hash: string;
  indexed_at: string;
}

export interface EventRow {
  id: number;
  chain_id: number;
  event_type: string;
  contract_address: string;
  block_number: number;
  block_hash: string;
  tx_hash: string;
  log_index: number;
  data: Json;
  indexed_at: string;
}

export interface IndexerCheckpointRow {
  chain_id: number;
  contract_address: string;
  last_block_number: number;
  last_block_hash: string;
  updated_at: string;
}

export interface NftMetadataCacheRow {
  collection_address: string;
  token_id: string;
  name: string | null;
  image_url: string | null;
  metadata_uri: string | null;
  cached_at: string;
}

export interface CollectionStatsRow {
  collection: string;
  best_offer_wei: number | null;
  pool_size_wei: number | null;
  offer_count: number;
  active_loans_count: number;
}

export interface Database {
  pledge: {
    Tables: {
      collections: {
        Row: CollectionRow;
        Insert: Partial<CollectionRow> & Pick<CollectionRow, 'address' | 'name'>;
        Update: Partial<CollectionRow>;
      };
      offers: {
        Row: OfferRow;
        Insert: OfferRow;
        Update: Partial<OfferRow>;
      };
      loans: {
        Row: LoanRow;
        Insert: LoanRow;
        Update: Partial<LoanRow>;
      };
      events: {
        Row: EventRow;
        Insert: Omit<EventRow, 'id' | 'indexed_at'> & { id?: number; indexed_at?: string };
        Update: Partial<EventRow>;
      };
      indexer_checkpoints: {
        Row: IndexerCheckpointRow;
        Insert: IndexerCheckpointRow;
        Update: Partial<IndexerCheckpointRow>;
      };
      nft_metadata_cache: {
        Row: NftMetadataCacheRow;
        Insert: NftMetadataCacheRow;
        Update: Partial<NftMetadataCacheRow>;
      };
    };
    Views: {
      collection_stats: {
        Row: CollectionStatsRow;
      };
    };
  };
  public: {
    Tables: {
      collections: {
        Row: CollectionRow;
        Insert: Partial<CollectionRow> & Pick<CollectionRow, 'address' | 'name'>;
        Update: Partial<CollectionRow>;
      };
      offers: {
        Row: OfferRow;
        Insert: OfferRow;
        Update: Partial<OfferRow>;
      };
      loans: {
        Row: LoanRow;
        Insert: LoanRow;
        Update: Partial<LoanRow>;
      };
      events: {
        Row: EventRow;
        Insert: Omit<EventRow, 'id' | 'indexed_at'> & { id?: number; indexed_at?: string };
        Update: Partial<EventRow>;
      };
      indexer_checkpoints: {
        Row: IndexerCheckpointRow;
        Insert: IndexerCheckpointRow;
        Update: Partial<IndexerCheckpointRow>;
      };
      nft_metadata_cache: {
        Row: NftMetadataCacheRow;
        Insert: NftMetadataCacheRow;
        Update: Partial<NftMetadataCacheRow>;
      };
    };
    Views: {
      collection_stats: {
        Row: CollectionStatsRow;
      };
    };
  };
}
