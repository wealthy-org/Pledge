import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let cachedClient: SupabaseClient<Database> | null = null;
let cachedServiceClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA as 'pledge' | 'public' | undefined;

  if (!url || !anonKey) {
    throw new Error('Supabase URL or Anon Key is missing in environment variables');
  }

  if (!schema) {
    throw new Error('NEXT_PUBLIC_DB_SCHEMA is missing in environment variables');
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(url, anonKey, {
      db: {
        schema: schema as unknown as 'public',
      },
      auth: {
        persistSession: false,
      },
    });
  }

  return cachedClient;
}

export function getServiceSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA as 'pledge' | 'public' | undefined;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase Service Role Key is missing in environment variables');
  }

  if (!schema) {
    throw new Error('NEXT_PUBLIC_DB_SCHEMA is missing in environment variables');
  }

  if (!cachedServiceClient) {
    cachedServiceClient = createClient<Database>(url, serviceRoleKey, {
      db: {
        schema: schema as unknown as 'public',
      },
      auth: {
        persistSession: false,
      },
    });
  }

  return cachedServiceClient;
}
