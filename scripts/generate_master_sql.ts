import fs from 'fs';
import { PROPERTIES_DATA } from '../src/data/properties';

const SUPABASE_STORAGE_URL = 'https://xmvhnzuidwpwvdnyydio.supabase.co/storage/v1/object/public/property-images/listings';

function sqlEscape(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function sqlJson(data: any): string {
  if (!data) return "'[]'::jsonb";
  return `'${JSON.stringify(data).replace(/'/g, "''")}'::jsonb`;
}

let sql = `-- ==============================================================================
-- 04_SEED_ALL_16_PROPERTIES.sql
-- LankaProperty.lk — Step 4 of 4: Authoritative Seed & Upsert for All 16 Properties
-- Target: xmvhnzuidwpwvdnyydio.supabase.co
-- Safe & Idempotent: Upserts all 16 properties with Supabase Storage WebP URLs.
-- ==============================================================================

`;

for (let i = 0; i < PROPERTIES_DATA.length; i++) {
  const p = PROPERTIES_DATA[i];
  const images = [...p.images];
  const heroImage = images[0] || null;

  const collections: string[] = [];
  if (p.isFeatured) collections.push('featured');
  if (p.isTrending) collections.push('trending');
  if (p.isSignature) collections.push('signature', 'architectural');
  if (p.type === 'land' || p.purpose === 'land') collections.push('land');

  const lat = p.location.coordinates?.latitude || (p.location.coordinates as any)?.lat || null;
  const lng = p.location.coordinates?.longitude || (p.location.coordinates as any)?.lng || null;
  const listingRef = `LP-${(p.location.district || 'SRI').slice(0, 3).toUpperCase()}-2026-${(100 + i).toString()}`;
  const priceOnRequest = p.priceLkr === 0;

  sql += `INSERT INTO public.properties (
    id, listing_ref, slug, title, description, property_type, purpose,
    publication_status, status, price_lkr, price_unit, is_negotiable,
    price_on_request, city, district, address, latitude, longitude,
    bedrooms, bathrooms, sqft, land_perches, parking_spaces,
    hero_image, images, floor_plans, amenities, assigned_agent_name,
    view_count, inquiry_count, save_count, is_featured, is_trending,
    trending_velocity_text, collections, published_at
) VALUES (
    ${sqlEscape(p.id)},
    ${sqlEscape(listingRef)},
    ${sqlEscape(p.slug)},
    ${sqlEscape(p.title)},
    ${sqlEscape(p.description)},
    '${p.type || 'house'}'::property_category,
    ${sqlEscape(p.purpose || 'buy')},
    'published'::listing_status,
    'active',
    ${p.priceLkr || 0},
    ${sqlEscape(p.priceUnit || 'total')},
    ${p.isNegotiable ? 'true' : 'false'},
    ${priceOnRequest ? 'true' : 'false'},
    ${sqlEscape(p.location.city)},
    ${sqlEscape(p.location.district)},
    ${sqlEscape(p.location.address)},
    ${lat ? lat : 'NULL'},
    ${lng ? lng : 'NULL'},
    ${p.specs?.bedrooms || 'NULL'},
    ${p.specs?.bathrooms || 'NULL'},
    ${p.specs?.floorAreaSqFt || p.specs?.sqft || 'NULL'},
    ${p.specs?.landPerches || 'NULL'},
    ${p.specs?.parkingSpaces || 'NULL'},
    ${sqlEscape(heroImage)},
    ${sqlJson(images)},
    ${sqlJson(p.floorPlans || [])},
    ${sqlJson(p.amenities || [])},
    ${sqlEscape(p.agent?.name || 'Mr Lalith Ranatunga')},
    ${150 + i * 20},
    ${5 + i * 2},
    ${12 + i},
    ${p.isFeatured ? 'true' : 'false'},
    ${p.isTrending ? 'true' : 'false'},
    ${sqlEscape((p as any).trendingVelocityText || (p.isTrending ? 'High Demand' : null))},
    ${sqlJson(collections)},
    ${sqlEscape(p.publishedDate ? `${p.publishedDate}T00:00:00Z` : new Date().toISOString())}
)
ON CONFLICT (id) DO UPDATE SET
    listing_ref = EXCLUDED.listing_ref,
    slug = EXCLUDED.slug,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    property_type = EXCLUDED.property_type,
    purpose = EXCLUDED.purpose,
    publication_status = EXCLUDED.publication_status,
    status = EXCLUDED.status,
    price_lkr = EXCLUDED.price_lkr,
    price_unit = EXCLUDED.price_unit,
    is_negotiable = EXCLUDED.is_negotiable,
    price_on_request = EXCLUDED.price_on_request,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    bedrooms = EXCLUDED.bedrooms,
    bathrooms = EXCLUDED.bathrooms,
    sqft = EXCLUDED.sqft,
    land_perches = EXCLUDED.land_perches,
    parking_spaces = EXCLUDED.parking_spaces,
    hero_image = EXCLUDED.hero_image,
    images = EXCLUDED.images,
    floor_plans = EXCLUDED.floor_plans,
    amenities = EXCLUDED.amenities,
    assigned_agent_name = EXCLUDED.assigned_agent_name,
    is_featured = EXCLUDED.is_featured,
    is_trending = EXCLUDED.is_trending,
    collections = EXCLUDED.collections,
    published_at = EXCLUDED.published_at,
    updated_at = timezone('utc', now());

`;
}

fs.writeFileSync('supabase/migrations/04_🌱_SEED_ALL_16_PROPERTIES.sql', sql, 'utf8');
console.log(`Generated supabase/migrations/04_🌱_SEED_ALL_16_PROPERTIES.sql (${PROPERTIES_DATA.length} properties, CDN base: ${SUPABASE_STORAGE_URL})`);
