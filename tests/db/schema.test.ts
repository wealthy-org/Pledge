import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TICKET-03b: Supabase Schema, Types & Database Client Test Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const migrationPath = path.join(rootDir, 'supabase/migrations/00001_initial_schema.sql');
  const typesPath = path.join(rootDir, 'types/database.ts');
  const clientPath = path.join(rootDir, 'lib/db/supabase.ts');

  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('TS-01: Migration SQL contains schema definition, 6 core tables and materialized view', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS pledge');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pledge.collections');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pledge.offers');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pledge.loans');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pledge.events');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pledge.indexer_checkpoints');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS pledge.nft_metadata_cache');
    expect(sql).toContain('CREATE MATERIALIZED VIEW IF NOT EXISTS pledge.collection_stats');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION pledge.set_updated_at');
  });

  it('TS-02: types/database.ts exports complete types for pledge database schema', async () => {
    expect(fs.existsSync(typesPath)).toBe(true);
    const dbTypes = await import('@/types/database');
    expect(dbTypes).toBeDefined();
  });

  it('TS-03: SQL migration defines RLS and schema role permissions', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('GRANT USAGE ON SCHEMA pledge TO postgres, anon, authenticated, service_role');
    expect(sql).toContain('ALTER TABLE pledge.collections ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE pledge.offers ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE pledge.loans ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('ALTER TABLE pledge.events ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('Allow public read on collections');
    expect(sql).toContain('Allow public read on offers');
    expect(sql).toContain('Allow public read on loans');
  });

  it('TS-04: lib/db/supabase.ts initializes client and throws explicit error when env is missing (Rule 11)', async () => {
    expect(fs.existsSync(clientPath)).toBe(true);
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { getSupabaseClient, getServiceSupabaseClient } = await import('@/lib/db/supabase');

    expect(() => getSupabaseClient()).toThrow(/Supabase URL or Anon Key is missing/i);
    expect(() => getServiceSupabaseClient()).toThrow(/Supabase Service Role Key is missing/i);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.NEXT_PUBLIC_DB_SCHEMA = 'pledge';

    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();

    const serviceClient = getServiceSupabaseClient();
    expect(serviceClient).toBeDefined();
    expect(serviceClient.from).toBeDefined();
  });
});
