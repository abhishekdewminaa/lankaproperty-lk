import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://rnedttrpovxswnraezas.supabase.co',
  'sb_publishable_vBaZKq7pyNXrYxRymTNdkQ_hGPZV6ca'
);

async function updateRefs() {
  await client
    .from('properties')
    .update({ listing_ref: 'LP-GAM-2026-2000 prop-1794908904153' })
    .eq('id', 'a59f1089-0415-4300-8000-179490890415');

  await client
    .from('properties')
    .update({ listing_ref: 'LP-COL-2026-6800 prop-1794902582161' })
    .eq('id', 'b482e911-3942-49da-a859-9943f6057ce8');

  await client
    .from('properties')
    .update({ listing_ref: 'LP-GAM-2026-9875 prop-1794898758796' })
    .eq('id', 'e102f43a-7a19-4849-868d-71285efd9c12');

  console.log('Legacy prop ID refs updated in Supabase!');
  process.exit(0);
}

updateRefs().catch((err) => {
  console.error(err);
  process.exit(1);
});
