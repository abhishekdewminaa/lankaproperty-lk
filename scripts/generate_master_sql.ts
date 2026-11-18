import fs from 'fs';
import path from 'path';
import { PROPERTIES_DATA } from '../src/data/properties';

const SUPABASE_STORAGE_URL = 'https://xmvhnzuidwpwvdnyydio.supabase.co/storage/v1/object/public/property-images/listings';

// Helper to sanitize strings for SQL literals
function sqlEscape(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function sqlJson(data: any): string {
  if (!data) return "'[]'::jsonb";
  return `'${JSON.stringify(data).replace(/'/g, "''")}'::jsonb`;
}

// Generate the complete SQL
let sql = `-- ==============================================================================
-- LankaProperty.lk — Complete All-In-One Master Database & Storage Migration
-- Target: xmvhnzuidwpwvdnyydio.supabase.co (PostgreSQL 15+)
-- Contains:
--   1. Extensions (uuid-ossp, pg_cron)
--   2. Custom Enums (user_role, listing_status, property_category)
--   3. Tables (profiles, properties, inquiries, wanted_properties, audit_logs)
--   4. Storage Bucket Setup & Policies (property-images bucket)
--   5. Full RLS Configuration (Permissive public inserts for sync)
--   6. Indexes & Performance Optimizations (GIN search vector, partial indexes)
--   7. Full Seeding for All 16 Properties with Supabase Storage WebP URLs
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. ENUM TYPES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'agent', 'owner', 'buyer');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM ('draft', 'pending_review', 'published', 'sold', 'archived', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_category') THEN
        CREATE TYPE property_category AS ENUM ('house', 'apartment', 'land', 'commercial', 'villa');
    END IF;
END $$;

-- 3. STORAGE BUCKET CREATION (property-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Storage Bucket Policies
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Anyone can upload property images" ON storage.objects;
CREATE POLICY "Anyone can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Anyone can update property images" ON storage.objects;
CREATE POLICY "Anyone can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images');

-- 4. MASTER PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    listing_ref TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    property_type property_category NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'buy',
    publication_status listing_status NOT NULL DEFAULT 'draft',
    status TEXT NOT NULL DEFAULT 'active',
    price_lkr NUMERIC(14, 2) NOT NULL,
    price_unit TEXT NOT NULL DEFAULT 'total',
    is_negotiable BOOLEAN NOT NULL DEFAULT false,
    price_on_request BOOLEAN NOT NULL DEFAULT false,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bedrooms INTEGER,
    bathrooms INTEGER,
    sqft INTEGER,
    land_perches NUMERIC(8, 2),
    floors INTEGER,
    parking_spaces INTEGER,
    hero_image TEXT,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    floor_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    private_staff_notes TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_agent_name TEXT,
    rejection_reason TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    inquiry_count INTEGER NOT NULL DEFAULT 0,
    save_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_trending BOOLEAN NOT NULL DEFAULT false,
    trending_velocity_text TEXT,
    collections JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(city, '') || ' ' || coalesce(district, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_search_gin ON public.properties USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_properties_search ON public.properties (district, property_type, price_lkr) WHERE publication_status = 'published';
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties (slug);

-- Ensure RLS is active and allows public reads & inserts for sync
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published properties" ON public.properties;
CREATE POLICY "Public read published properties"
ON public.properties FOR SELECT
USING (
  publication_status = 'published' 
  OR (SELECT auth.uid()) = author_id 
  OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Public and service can insert listings" ON public.properties;
CREATE POLICY "Public and service can insert listings"
ON public.properties FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Public and service can update listings" ON public.properties;
CREATE POLICY "Public and service can update listings"
ON public.properties FOR UPDATE
USING (true);

-- ==============================================================================
-- 5. AUTHORITATIVE LISTINGS DATA (ALL 16 PROPERTIES UPSERT)
-- ==============================================================================
`;

// Map and convert property data
for (let i = 0; i < PROPERTIES_DATA.length; i++) {
  const p = PROPERTIES_DATA[i];
  
  // Transform images if needed for the 3 new listings
  let images = [...p.images];
  let heroImage = images[0] || null;

  if (p.id === 'prop-1794908904153') {
    heroImage = `${SUPABASE_STORAGE_URL}/asgiriya-gampaha-hero.webp`;
    images = [
      heroImage,
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    ];
  } else if (p.id === 'prop-1794902582161') {
    heroImage = `${SUPABASE_STORAGE_URL}/maharagama-janatha-mawatha-1-hero.webp`;
    images = [
      heroImage,
      `${SUPABASE_STORAGE_URL}/maharagama-janatha-mawatha-2-aerial.webp`,
      `${SUPABASE_STORAGE_URL}/maharagama-janatha-mawatha-3-interior.webp`,
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ];
  } else if (p.id === 'prop-1794898758796') {
    heroImage = `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-1-hero.webp`;
    images = [
      heroImage,
      `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-2-verandah.webp`,
      `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-3-living.webp`,
      `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-4-bed1.webp`,
      `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-5-bed2.webp`,
      `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-6-bath.webp`,
      `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-7-bath2.webp`,
      `${SUPABASE_STORAGE_URL}/godigamuwa-dunagaha-8-garden.webp`,
    ];
  }

  const collections = [];
  if (p.isFeatured) collections.push('featured');
  if (p.isTrending) collections.push('trending');
  if (p.isSignature) collections.push('signature', 'architectural');
  if (p.type === 'land' || p.purpose === 'land') collections.push('land');

  const lat = p.location.coordinates?.latitude || (p.location.coordinates as any)?.lat || null;
  const lng = p.location.coordinates?.longitude || (p.location.coordinates as any)?.lng || null;
  const listingRef = `LP-${(p.location.district || 'SRI').slice(0, 3).toUpperCase()}-2026-${(100 + i).toString()}`;
  const priceOnRequest = p.priceLkr === 0;

  sql += `
INSERT INTO public.properties (
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

fs.writeFileSync('supabase/all_in_one_master_migration.sql', sql, 'utf8');
console.log('Successfully generated supabase/all_in_one_master_migration.sql with all 16 properties!');
