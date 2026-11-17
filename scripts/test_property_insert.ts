import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function testInsert() {
  const testId = '00000000-0000-0000-0000-000000000001';
  const { data, error } = await supabase
    .from('properties')
    .upsert({
      id: testId,
      slug: 'test-property-rls-check',
      title: 'Test Property RLS Check',
      property_type: 'house',
      purpose: 'buy',
      publication_status: 'published',
      status: 'active',
      price_lkr: 10000000,
      city: 'Colombo',
      district: 'Colombo',
    });
  console.log('Upsert result:', { data, error });
}
testInsert();
