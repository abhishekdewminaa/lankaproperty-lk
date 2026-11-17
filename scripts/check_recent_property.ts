import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title, slug, publication_status, status, city, district, images')
    .order('created_at', { ascending: false });
  console.log('Total properties in Supabase:', data?.length);
  console.log('Properties:', data?.map(d => ({ title: d.title, slug: d.slug, pub: d.publication_status, status: d.status, images: d.images?.length })));
}
run();
