import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  return '';
};

const AUTHORITATIVE_SUPABASE_URL = 'https://xmvhnzuidwpwvdnyydio.supabase.co';
const AUTHORITATIVE_SUPABASE_ANON_KEY = 'sb_publishable_2LUs3ORDsu4TrHUQOlsXyw_xP9KgxP9';

const rawEnvUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const rawEnvKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

// Guard against retired/deleted project URLs (e.g. rnedttrpovxswnraezas) injected by stale Hostinger hPanel env vars
const isActiveProductionProject = Boolean(rawEnvUrl && rawEnvUrl.includes('xmvhnzuidwpwvdnyydio.supabase.co'));

const supabaseUrl = isActiveProductionProject ? rawEnvUrl : AUTHORITATIVE_SUPABASE_URL;
const supabaseAnonKey = isActiveProductionProject && rawEnvKey ? rawEnvKey : AUTHORITATIVE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-application-name': 'lankaproperty-web',
      'x-client-info': 'supabase-js/2.119.0-hostinger-optimized',
    },
  },
});

/**
 * Strategy 5: Supavisor Transaction Pooler Configuration Guide
 * For any direct PostgreSQL connection strings (e.g. Prisma, Drizzle, migrations):
 * ALWAYS connect to Port 6543 with '?pgbouncer=true' rather than direct Port 5432:
 * postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
 */
export const SUPAVISOR_POOLER_PORT = 6543;
export const SUPAVISOR_POOLER_PARAMS = '?pgbouncer=true';

export default supabase;
