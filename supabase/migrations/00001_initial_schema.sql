CREATE SCHEMA IF NOT EXISTS pledge;
SET search_path TO pledge, public;

GRANT USAGE ON SCHEMA pledge TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA pledge TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA pledge TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pledge TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pledge GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pledge GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pledge GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION pledge.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS pledge.collections (
    address      TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    symbol       TEXT,
    image_url    TEXT,
    is_enabled   BOOLEAN DEFAULT true,
    added_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pledge.offers (
    offer_id          BIGINT PRIMARY KEY,
    chain_id          INT NOT NULL,
    lender            TEXT NOT NULL,
    collection        TEXT NOT NULL REFERENCES pledge.collections(address),
    principal_wei     TEXT NOT NULL,
    term_interest_bps SMALLINT NOT NULL,
    fee_bps_snapshot  SMALLINT NOT NULL,
    duration_seconds  INT NOT NULL,
    expires_at        TIMESTAMPTZ NOT NULL,
    status            TEXT NOT NULL CHECK (status IN ('open', 'filled', 'cancelled')),
    block_number      BIGINT NOT NULL,
    tx_hash           TEXT NOT NULL,
    indexed_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pledge.loans (
    loan_id          BIGINT PRIMARY KEY,
    chain_id         INT NOT NULL,
    offer_id         BIGINT NOT NULL REFERENCES pledge.offers(offer_id),
    lender           TEXT NOT NULL,
    borrower         TEXT NOT NULL,
    collection       TEXT NOT NULL REFERENCES pledge.collections(address),
    token_id         TEXT NOT NULL,
    principal_wei    TEXT NOT NULL,
    interest_wei     TEXT NOT NULL,
    fee_bps_snapshot SMALLINT NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL,
    due_at           TIMESTAMPTZ NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('active', 'repaid', 'foreclosed')),
    block_number     BIGINT NOT NULL,
    tx_hash          TEXT NOT NULL,
    indexed_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pledge.events (
    id               BIGSERIAL PRIMARY KEY,
    chain_id         INT NOT NULL,
    event_type       TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    block_number     BIGINT NOT NULL,
    block_hash       TEXT NOT NULL,
    tx_hash          TEXT NOT NULL,
    log_index        INT NOT NULL,
    data             JSONB NOT NULL,
    indexed_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (chain_id, contract_address, block_number, tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS pledge.indexer_checkpoints (
    chain_id          INT PRIMARY KEY,
    contract_address  TEXT NOT NULL,
    last_block_number BIGINT NOT NULL,
    last_block_hash   TEXT NOT NULL,
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pledge.nft_metadata_cache (
    collection_address TEXT NOT NULL,
    token_id           TEXT NOT NULL,
    name               TEXT,
    image_url          TEXT,
    metadata_uri       TEXT,
    cached_at          TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (collection_address, token_id)
);

CREATE INDEX IF NOT EXISTS idx_offers_collection_status ON pledge.offers(collection, status);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_status ON pledge.loans(borrower, status);
CREATE INDEX IF NOT EXISTS idx_loans_lender_status ON pledge.loans(lender, status);
CREATE INDEX IF NOT EXISTS idx_events_contract_block ON pledge.events(contract_address, block_number);

CREATE MATERIALIZED VIEW IF NOT EXISTS pledge.collection_stats AS
SELECT
    o.collection,
    MAX(o.principal_wei::NUMERIC) AS best_offer_wei,
    SUM(o.principal_wei::NUMERIC) AS pool_size_wei,
    COUNT(*) AS offer_count,
    (SELECT COUNT(*) FROM pledge.loans l WHERE l.collection = o.collection AND l.status = 'active') AS active_loans_count
FROM pledge.offers o
WHERE o.status = 'open'
  AND o.expires_at > NOW()
GROUP BY o.collection;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_stats_col ON pledge.collection_stats (collection);

ALTER TABLE pledge.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge.indexer_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge.nft_metadata_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'pledge' AND tablename = 'collections' AND policyname = 'Allow public read on collections'
    ) THEN
        CREATE POLICY "Allow public read on collections" ON pledge.collections FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'pledge' AND tablename = 'offers' AND policyname = 'Allow public read on offers'
    ) THEN
        CREATE POLICY "Allow public read on offers" ON pledge.offers FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'pledge' AND tablename = 'loans' AND policyname = 'Allow public read on loans'
    ) THEN
        CREATE POLICY "Allow public read on loans" ON pledge.loans FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'pledge' AND tablename = 'events' AND policyname = 'Allow public read on events'
    ) THEN
        CREATE POLICY "Allow public read on events" ON pledge.events FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'pledge' AND tablename = 'nft_metadata_cache' AND policyname = 'Allow public read on nft_metadata_cache'
    ) THEN
        CREATE POLICY "Allow public read on nft_metadata_cache" ON pledge.nft_metadata_cache FOR SELECT USING (true);
    END IF;
END $$;
