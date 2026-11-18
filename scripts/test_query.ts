import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://rnedttrpovxswnraezas.supabase.co',
  'sb_publishable_vBaZKq7pyNXrYxRymTNdkQ_hGPZV6ca'
);

function ensureValidUUID(id: string): string {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }
  let hex = '';
  for (let i = 0; i < id.length; i++) {
    hex += id.charCodeAt(i).toString(16).padStart(2, '0');
  }
  hex = (hex + '00000000000000000000000000000000').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function findProperty(slug: string) {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {}

  const normalizedSlug = decoded.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const cleanRaw = decoded.toLowerCase().replace(/^\/+|\/+$/g, '').trim();
  const validUUID = ensureValidUUID(cleanRaw);

  // 1. Try Exact Slug or Direct UUID or Direct Listing Ref match
  const { data: exactData } = await client
    .from('properties')
    .select('id, slug, title, listing_ref, publication_status')
    .or(`slug.eq.${normalizedSlug},id.eq.${validUUID},listing_ref.ilike.%${cleanRaw}%`)
    .limit(1)
    .maybeSingle();

  if (exactData) return exactData;

  // 2. Try Partial Slug match
  const { data: partialData } = await client
    .from('properties')
    .select('id, slug, title, listing_ref, publication_status')
    .or(`slug.ilike.%${normalizedSlug}%,slug.ilike.${normalizedSlug}%`)
    .limit(1)
    .maybeSingle();

  if (partialData) return partialData;

  // 3. Fallback to Fuzzy Title tokens match
  const tokens = normalizedSlug.split('-').filter((t) => t.length > 3).slice(0, 4);
  if (tokens.length > 0) {
    const titleSearch = tokens.join('%');
    const { data: titleData } = await client
      .from('properties')
      .select('id, slug, title, listing_ref, publication_status')
      .ilike('title', `%${titleSearch}%`)
      .limit(1)
      .maybeSingle();

    if (titleData) return titleData;
  }

  return null;
}

async function test() {
  const slugsToTest = [
    'solidly built house for sale in an excellent location janatha mawatha maharagama',
    'solidly-built-house-for-sale-in-an-excellent-location-janatha-mawatha-maharagama',
    'fully-complete-house-for-sale-in-godigamuwa-dunagaha',
    'paddy field-facing newly built house for sale in asgiriya gampaha',
    'prop-1794908904153',
    'prop-1794902582161',
    'prop-1794898758796',
  ];

  for (const slug of slugsToTest) {
    const res = await findProperty(slug);
    console.log(`MATCH [${slug}]:`, res?.title, '-> ID:', res?.id);
  }
  process.exit(0);
}

test();
