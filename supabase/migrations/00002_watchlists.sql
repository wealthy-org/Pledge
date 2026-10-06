CREATE TABLE IF NOT EXISTS pledge.watchlists (
    wallet_address     TEXT NOT NULL,
    collection_address TEXT NOT NULL,
    created_at         TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (wallet_address, collection_address)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_wallet ON pledge.watchlists(wallet_address);
CREATE INDEX IF NOT EXISTS idx_watchlists_collection ON pledge.watchlists(collection_address);

ALTER TABLE pledge.watchlists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'pledge' AND tablename = 'watchlists' AND policyname = 'Allow public all on watchlists'
    ) THEN
        CREATE POLICY "Allow public all on watchlists" ON pledge.watchlists FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
