import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function run() {
  const { data: tables, error } = await supabase.rpc('get_table_names');
  console.log('Tables rpc:', tables, error);
}
run();
