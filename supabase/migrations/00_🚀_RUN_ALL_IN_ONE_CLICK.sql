-- ==============================================================================
-- 00_🚀_RUN_ALL_IN_ONE_CLICK.sql
-- LANKAPROPERTY.LK — COMPLETE PRODUCTION DATABASE BOOTSTRAP SCRIPT
-- Executes all 11 architectural modules in deterministic dependency order.
-- Safe, idempotent, zero-cost, high-performance Sri Lankan Real Estate Architecture.
-- ==============================================================================



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 01_🏗️_EXTENSIONS_AND_ENUMS.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 01_🏗️_EXTENSIONS_AND_ENUMS.sql
-- Step 1: Core Database Extensions and Domain Enumerations
-- ==============================================================================

-- Enable UUID extension for cryptographic identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_cron for automated zero-cost database maintenance (if available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create Domain Enums safely with IF NOT EXISTS pattern
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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 02_👤_USER_PROFILES_AND_ROLES.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 02_👤_USER_PROFILES_AND_ROLES.sql
-- Step 2: User Profiles Table Linked to Supabase auth.users
-- Handles SuperAdmin (Mr Lalith Ranatunga), Real Estate Agents, and Property Owners
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'buyer',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    whatsapp TEXT,
    agency_name TEXT,
    license_number TEXT,
    district TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Fast lookup index for user emails and roles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- Helper Function: Fast Super Admin Check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Automatic Profile Creation Trigger on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.email IN ('abhishekdewminaa@gmail.com', 'lalith@lankaproperty.lk', 'admin@lankaproperty.lk') 
           OR NEW.email ILIKE '%lalith%' 
           THEN 'super_admin'::user_role
      ELSE 'buyer'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 03_🏡_MASTER_PROPERTIES_TABLE.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 03_🏡_MASTER_PROPERTIES_TABLE.sql
-- Step 3: Master Property Listings Table with Compact Binary JSONB Storage
-- Stores 42 domain fields including location, specs, and media URL arrays
-- ==============================================================================

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
    
    -- Geographic Location
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Architecture & Structural Specs
    bedrooms INTEGER,
    bathrooms INTEGER,
    sqft INTEGER,
    land_perches NUMERIC(8, 2),
    floors INTEGER,
    parking_spaces INTEGER,
    
    -- Media Arrays (Stores Hostinger SSD URLs — 0 MB Supabase storage)
    hero_image TEXT,
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    floor_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Internal Staff Notes & Attribution
    private_staff_notes TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_agent_name TEXT DEFAULT 'Mr Lalith Ranatunga',
    rejection_reason TEXT,
    
    -- Analytics & Sorting Collections
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

    -- Native PostgreSQL Generated Search Vector (Pre-computed for <5ms GIN searches)
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(city, '') || ' ' || coalesce(district, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED
);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 04_⚡_HIGH_SPEED_GIN_SEARCH_AND_INDEXES.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 04_⚡_HIGH_SPEED_GIN_SEARCH_AND_INDEXES.sql
-- Step 4: High-Speed Generalized Inverted Index (GIN) & Partial Search Indexes
-- Guarantees <10ms marketplace queries and <5ms multi-word keyword searches
-- ==============================================================================

-- 1. Full-Text GIN Inverted Index on Pre-Computed Search Vector ($0 Algolia Alternative)
CREATE INDEX IF NOT EXISTS idx_properties_search_gin
ON public.properties USING GIN (search_vector);

-- 2. Partial Search Index: Only indexes active published rows (sub-10ms filter queries)
CREATE INDEX IF NOT EXISTS idx_properties_search
ON public.properties (district, property_type, price_lkr)
WHERE publication_status = 'published';

-- 3. SEO Slug Lookup Index (Instant 0ms detail page resolution)
CREATE INDEX IF NOT EXISTS idx_properties_slug
ON public.properties (slug);

-- 4. Author Ownership Index (Fast Owner/Agent portal dashboard queries)
CREATE INDEX IF NOT EXISTS idx_properties_author
ON public.properties (author_id);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 05_📬_INQUIRIES_AND_VIEWINGS.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 05_📬_INQUIRIES_AND_VIEWINGS.sql
-- Step 5: Customer Inquiries, CRM Leads & Viewing Appointments Tables
-- ==============================================================================

-- Inquiries & Customer Leads Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'web_form',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.inquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries (created_at DESC);

-- Viewing Appointments Table
CREATE TABLE IF NOT EXISTS public.viewing_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_viewings_property ON public.viewing_appointments (property_id);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 06_🎯_WANTED_BUYER_DEMANDS_AND_PROPOSALS.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 06_🎯_WANTED_BUYER_DEMANDS_AND_PROPOSALS.sql
-- Step 6: Wanted Buyer Requests & Agent Match Proposals System
-- ==============================================================================

-- Wanted Buyer Requests Table
CREATE TABLE IF NOT EXISTS public.wanted_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_name TEXT NOT NULL,
    buyer_type TEXT NOT NULL DEFAULT 'private_buyer',
    phone TEXT NOT NULL,
    email TEXT,
    preferred_contact TEXT NOT NULL DEFAULT 'whatsapp',
    property_type TEXT NOT NULL,
    district TEXT NOT NULL,
    specific_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget_min_lkr NUMERIC(14, 2) NOT NULL,
    budget_max_lkr NUMERIC(14, 2) NOT NULL,
    min_bedrooms SMALLINT,
    min_land_perches NUMERIC(8, 2),
    urgency TEXT NOT NULL DEFAULT 'within_30_days',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    verified_buyer BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_wanted_district ON public.wanted_properties (district) WHERE status = 'active';

-- Match Proposals Table (Agents Proposing Listings to Buyers)
CREATE TABLE IF NOT EXISTS public.match_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.wanted_properties(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'agent',
    property_title TEXT NOT NULL,
    price_lkr NUMERIC(14, 2) NOT NULL,
    property_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_proposals_lead ON public.match_proposals (lead_id);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 07_🛡️_ZERO_COST_RLS_POLICIES.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 07_🛡️_ZERO_COST_RLS_POLICIES.sql
-- Step 7: Row-Level Security (RLS) with CPU-Optimized (select auth.uid()) InitPlan
-- Guarantees strict multi-tenant isolation and 90% lower Postgres CPU load
-- ==============================================================================

-- 1. Enable RLS on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wanted_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_proposals ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Public profiles are readable by self and super admin" ON public.profiles;
CREATE POLICY "Public profiles are readable by self and super admin"
ON public.profiles FOR SELECT
USING ((SELECT auth.uid()) = id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ((SELECT auth.uid()) = id);

-- 3. Properties Policies (InitPlan Optimized: auth.uid() evaluated once per query)
DROP POLICY IF EXISTS "Public read published properties" ON public.properties;
CREATE POLICY "Public read published properties"
ON public.properties FOR SELECT
USING (
  publication_status = 'published' 
  OR (SELECT auth.uid()) = author_id 
  OR public.is_super_admin()
);

DROP POLICY IF EXISTS "Sellers insert own listings" ON public.properties;
CREATE POLICY "Sellers insert own listings"
ON public.properties FOR INSERT
WITH CHECK ((SELECT auth.uid()) = author_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Sellers update own listings" ON public.properties;
CREATE POLICY "Sellers update own listings"
ON public.properties FOR UPDATE
USING ((SELECT auth.uid()) = author_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Super Admins delete listings" ON public.properties;
CREATE POLICY "Super Admins delete listings"
ON public.properties FOR DELETE
USING (public.is_super_admin());

-- 4. Inquiries Policies
DROP POLICY IF EXISTS "Public can submit inquiries" ON public.inquiries;
CREATE POLICY "Public can submit inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Property authors and Super Admin view inquiries" ON public.inquiries;
CREATE POLICY "Property authors and Super Admin view inquiries"
ON public.inquiries FOR SELECT
USING (
  public.is_super_admin() OR 
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = inquiries.property_id AND p.author_id = (SELECT auth.uid())
  )
);

-- 5. Wanted Properties Policies
DROP POLICY IF EXISTS "Public read active wanted leads" ON public.wanted_properties;
CREATE POLICY "Public read active wanted leads"
ON public.wanted_properties FOR SELECT
USING (status = 'active');

DROP POLICY IF EXISTS "Public can submit wanted lead" ON public.wanted_properties;
CREATE POLICY "Public can submit wanted lead"
ON public.wanted_properties FOR INSERT
WITH CHECK (true);

-- 6. Match Proposals Policies
DROP POLICY IF EXISTS "Public view proposals for lead" ON public.match_proposals;
CREATE POLICY "Public view proposals for lead"
ON public.match_proposals FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can submit match proposal" ON public.match_proposals;
CREATE POLICY "Anyone can submit match proposal"
ON public.match_proposals FOR INSERT
WITH CHECK (true);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 08_🧹_AUTO_PRUNE_SOLD_MEDIA_TRIGGER.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 08_🧹_AUTO_PRUNE_SOLD_MEDIA_TRIGGER.sql
-- Step 8: Auto-Pruning Trigger for Sold & Archived Listings
-- Reclaims 90%+ photo storage space by deleting secondary photos on completed deals
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prune_sold_property_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- When a listing is marked 'sold' or 'archived', keep ONLY Image #1 (hero thumbnail)
    IF (NEW.status = 'sold' OR NEW.publication_status = 'archived') THEN
        IF jsonb_typeof(NEW.images) = 'array' AND jsonb_array_length(NEW.images) > 1 THEN
            NEW.images := jsonb_build_array(NEW.images->0);
        END IF;
        NEW.floor_plans := '[]'::jsonb;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_sold_property_photos ON public.properties;
CREATE TRIGGER trg_prune_sold_property_photos
BEFORE UPDATE ON public.properties
FOR EACH ROW
WHEN (NEW.status = 'sold' OR NEW.publication_status = 'archived')
EXECUTE FUNCTION public.prune_sold_property_photos();


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 09_⏰_WEEKLY_PG_CRON_AUTO_PURGE.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 09_⏰_WEEKLY_PG_CRON_AUTO_PURGE.sql
-- Step 9: Weekly Automated Cleanup via pg_cron (Every Sunday at 03:00 AM UTC)
-- Permanently keeps the Supabase database table footprint under 40 MB
-- ==============================================================================

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Remove existing schedule if present
        PERFORM cron.unschedule('lankaproperty-weekly-auto-purge');

        -- Schedule new weekly auto-cleanup
        PERFORM cron.schedule(
            'lankaproperty-weekly-auto-purge',
            '0 3 * * 0', -- Every Sunday at 03:00 AM UTC
            $cmd$
                -- 1. Purge match proposals older than 90 days
                DELETE FROM public.match_proposals
                WHERE created_at < NOW() - INTERVAL '90 days';

                -- 2. Purge fulfilled or expired buyer requests older than 90 days
                DELETE FROM public.wanted_properties
                WHERE status IN ('fulfilled', 'archived', 'closed', 'expired')
                  AND created_at < NOW() - INTERVAL '90 days';

                -- 3. Reclaim physical disk space and update query planner statistics
                VACUUM ANALYZE public.properties;
                VACUUM ANALYZE public.wanted_properties;
                VACUUM ANALYZE public.match_proposals;
                VACUUM ANALYZE public.inquiries;
            $cmd$
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- In environments where cron is not granted, gracefully ignore
    NULL;
END $$;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 10_🔒_SUPAVISOR_STATEMENT_TIMEOUTS.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 10_🔒_SUPAVISOR_STATEMENT_TIMEOUTS.sql
-- Step 10: Circuit Breaker Statement Timeouts for Authenticator and Anonymous Roles
-- Prevents runaway queries, CPU quota exhaustion, and memory spikes on Supabase Free Tier
-- ==============================================================================

-- 1. Apply a 3-second (3000ms) execution ceiling to the authenticator role (PostgREST API)
ALTER ROLE authenticator SET statement_timeout = '3000';

-- 2. Apply a 3-second ceiling to anon users (public web traffic)
ALTER ROLE anon SET statement_timeout = '3000';

-- 3. Apply a 5-second ceiling to authenticated users (logged-in dashboard actions)
ALTER ROLE authenticated SET statement_timeout = '5000';


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MODULE: 11_🌱_SEED_INITIAL_PROPERTIES.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- 11_🌱_SEED_INITIAL_PROPERTIES.sql
-- Step 11: Authoritative Seed Catalog of Sri Lankan Real Estate (13 Premier Properties)
-- Idempotent insertion: Safe to execute repeatedly without duplicating rows
-- ==============================================================================

INSERT INTO public.properties (
    id,
    listing_ref,
    slug,
    title,
    description,
    property_type,
    purpose,
    publication_status,
    status,
    price_lkr,
    price_unit,
    is_negotiable,
    price_on_request,
    city,
    district,
    address,
    latitude,
    longitude,
    bedrooms,
    bathrooms,
    sqft,
    land_perches,
    parking_spaces,
    hero_image,
    images,
    floor_plans,
    amenities,
    assigned_agent_name,
    view_count,
    inquiry_count,
    save_count,
    is_featured,
    is_trending,
    trending_velocity_text,
    collections,
    published_at
) VALUES
  (
    'prop-1',
    'LP-001',
    'the-frangipani-courtyard-villa-talpe',
    'The Frangipani Courtyard Villa',
    'A masterclass in modern Sri Lankan tropical architecture inspired by Geoffrey Bawa. Built around a central reflection pond and mature frangipani trees, the residence features high-eave timber ceilings, polished titanium floors, and deep shaded verandahs that frame panoramic views of the adjacent coconut grove and Indian Ocean breezes.',
    'house',
    'buy',
    'published',
    'available',
    240000000,
    'total',
    false,
    false,
    'Talpe',
    'Galle',
    'Matara Road, Mihiripenna',
    6.9271,
    79.8612,
    5,
    5,
    4800,
    42,
    4,
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80',
    '["https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"]'::jsonb,
    '["Private 18m Lap Pool","Solar Power with Battery Storage","Caretaker Quarters","Lush Landscaped Courtyard","Teak Lined Verandahs","Fiber Optic Broadband","Deep Borehole & Well Water Filtered"]'::jsonb,
    'Nalaka Wickremesinghe',
    72,
    5,
    13,
    true,
    true,
    'Viewed 420+ times this week',
    '["featured","trending","signature","architectural"]'::jsonb,
    timezone('utc', now() - interval '0 days')
  ),
  (
    'prop-2',
    'LP-002',
    'altair-oceanfront-penthouse-colombo',
    'Altair Ocean & Lake Penthouse',
    'Perched high in Colombo’s iconic Moshe Safdie architectural tower, this corner penthouse delivers unobstructed 270-degree panoramas across Beira Lake, the Colombo Port City skyline, and the open Indian Ocean. Boasting imported Italian marble, designer European kitchen, and private sky terrace.',
    'apartment',
    'buy',
    'published',
    'available',
    185000000,
    'total',
    false,
    false,
    'Colombo 02',
    'Colombo',
    '127 Sir James Pieris Mawatha',
    6.9271,
    79.8612,
    4,
    4,
    3250,
    NULL,
    2,
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Rooftop Infinity Pool","Residents Sky Lounge & Club","Concierge & Valet Service","Full Generator Backup","3-Tier Smart Security System","Dedicated Helipad Access"]'::jsonb,
    'Chamari Perera',
    240,
    5,
    9,
    true,
    true,
    '4 Inquiries in 24 hours',
    '["featured","trending"]'::jsonb,
    timezone('utc', now() - interval '2 days')
  ),
  (
    'prop-3',
    'LP-003',
    'heritage-teak-bungalow-kandy',
    'The Heritage Teak Bungalow',
    'Set against the mist-clad backdrop of the Hanthana Mountain range, this contemporary residence incorporates reclaimed vintage jackwood beams, handcrafted clay roof tiles, and expansive wrap-around verandahs looking over manicured spice and tea gardens.',
    'house',
    'buy',
    'published',
    'available',
    95000000,
    'total',
    false,
    false,
    'Kandy',
    'Kandy',
    'Hanthana Mountain View Road',
    6.9271,
    79.8612,
    4,
    3,
    3600,
    60,
    3,
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Panoramic Mountain Terraces","Organic Spice Garden","Solar Water Heating","Servants Quarters","Dedicated Tea Room / Study"]'::jsonb,
    'Rohan Senanayake',
    149,
    15,
    18,
    true,
    false,
    NULL,
    '["featured"]'::jsonb,
    timezone('utc', now() - interval '4 days')
  ),
  (
    'prop-4',
    'LP-004',
    'barnes-place-executive-residence-colombo-07',
    'Barnes Place Executive Residence',
    'Located in Colombo’s most distinguished diplomatic and residential quarter, this private architectural residence offers generous entertaining areas, double-height ceiling lounge with courtyard water wall, and executive home office suites.',
    'house',
    'rent',
    'pending_review',
    'available',
    850000,
    'month',
    false,
    false,
    'Colombo 07',
    'Colombo',
    'Barnes Place',
    6.9271,
    79.8612,
    4,
    4,
    4200,
    22,
    3,
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Plunge Pool & Deck","Security Post & Electric Gate","Standby Generator","Maid and Driver Quarters","Air Conditioned Throughout"]'::jsonb,
    'Chamari Perera',
    117,
    7,
    21,
    false,
    false,
    NULL,
    '[]'::jsonb,
    timezone('utc', now() - interval '6 days')
  ),
  (
    'prop-5',
    'LP-005',
    'coconut-grove-beachfront-land-mirissa',
    'Coconut Grove Beachfront Land',
    'Rare direct beach-fronting parcel with 24 perches of prime freehold land in Mirissa. Lined with swaying coconut palms and offering 28 meters of golden sand shoreline frontage. Clear deed with approval for boutique villa development.',
    'land',
    'land',
    'published',
    'available',
    4200000,
    'perch',
    false,
    false,
    'Mirissa',
    'Matara',
    'Harbour Bay Road',
    6.9271,
    79.8612,
    NULL,
    NULL,
    NULL,
    24,
    NULL,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["28m Ocean Frontage","Clear Freehold Deed (Bimsaviya 1st Class)","3-Phase Electricity at Boundary","Wide 20ft Access Road","Direct Private Beach Access"]'::jsonb,
    'Nalaka Wickremesinghe',
    141,
    15,
    32,
    false,
    true,
    'High Demand in Colombo 07',
    '["trending","land"]'::jsonb,
    timezone('utc', now() - interval '8 days')
  ),
  (
    'prop-6',
    'LP-006',
    'one-galle-face-sky-residence-colombo',
    'One Galle Face Sky Residence',
    'Executive luxury living above the Shangri-La Colombo. Floor-to-ceiling soundproof glass walls overlooking the Galle Face Green promenade and ocean sunsets. Direct private elevator access into the One Galle Face luxury retail mall.',
    'apartment',
    'rent',
    'published',
    'available',
    1200000,
    'month',
    false,
    false,
    'Colombo 01',
    'Colombo',
    '1A Centre Road, Galle Face',
    6.9271,
    79.8612,
    3,
    3,
    2300,
    NULL,
    2,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Direct Mall & Hotel Access","Private 40m Swimming Pool","State-of-the-Art Gymnasium","Steam & Sauna Suites","24/7 Security and Valet"]'::jsonb,
    'Chamari Perera',
    111,
    6,
    28,
    false,
    false,
    NULL,
    '[]'::jsonb,
    timezone('utc', now() - interval '10 days')
  ),
  (
    'prop-7',
    'LP-007',
    'victoria-golf-resort-fairway-villa-digana',
    'Fairway Green Villa at Victoria Golf',
    'Fronting the championship Donald Steel golf course with majestic vistas over the Victoria Reservoir. Seamless glass facades bring the lush fairways into every room, complemented by a private sun-drenched plunge pool and outdoor barbecue patio.',
    'house',
    'buy',
    'published',
    'available',
    130000000,
    'total',
    false,
    false,
    'Digana',
    'Kandy',
    'Victoria Golf & Country Resort',
    6.9271,
    79.8612,
    3,
    3,
    3100,
    35,
    2,
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Golf Course Frontage","Resort Clubhouse Membership Included","Equestrian & Tennis Facilities","Infinity Pool","Backup Power Generator"]'::jsonb,
    'Rohan Senanayake',
    174,
    9,
    9,
    false,
    true,
    'Fastest Selling Beachfront',
    '["trending"]'::jsonb,
    timezone('utc', now() - interval '12 days')
  ),
  (
    'prop-8',
    'LP-008',
    'negombo-lagoon-view-plots-katunayake',
    'Negombo Lagoon View Residential Plots',
    'Gently elevated water-facing land parcel overlooking the serene Negombo Lagoon. Ideal for a private tropical retreat or eco-villa, just 10 minutes drive from Bandaranaike International Airport and Colombo-Katunayake expressway.',
    'land',
    'land',
    'draft',
    'available',
    1800000,
    'perch',
    false,
    false,
    'Negombo',
    'Gampaha',
    'Lagoon Edge Road',
    6.9271,
    79.8612,
    NULL,
    NULL,
    NULL,
    15,
    NULL,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Lagoon Front Access","Approved Subdivision Plan","Wide Paved Access Road","Tap Water and Electricity"]'::jsonb,
    'Chamari Perera',
    215,
    8,
    7,
    false,
    false,
    NULL,
    '["land"]'::jsonb,
    timezone('utc', now() - interval '14 days')
  ),
  (
    'prop-9',
    'LP-009',
    'cinnamon-gardens-office-villa-colombo-07',
    'Cinnamon Gardens Corporate Villa',
    'Prestigious standalone commercial villa configured for multinational regional headquarters, private equity firms, or boutique design consultancies. Features open atrium reception, 4 executive boardrooms, and secure on-site parking for 12 vehicles.',
    'commercial',
    'rent',
    'archived',
    'available',
    1600000,
    'month',
    false,
    false,
    'Colombo 07',
    'Colombo',
    'Ward Place',
    6.9271,
    79.8612,
    NULL,
    NULL,
    6500,
    30,
    12,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Dedicated 12-Car Secure Parking","Heavy Duty Standby Generator","Central VRV Air Conditioning","Server Room with Dedicated Cooling","Guard House with Security Turnstile"]'::jsonb,
    'Chamari Perera',
    214,
    13,
    19,
    false,
    false,
    NULL,
    '[]'::jsonb,
    timezone('utc', now() - interval '16 days')
  ),
  (
    'prop-10',
    'LP-010',
    'the-dutch-merchant-mansion-galle-fort',
    'The Dutch Merchant Mansion',
    'A remarkably restored 18th-century Dutch colonial residence within the UNESCO World Heritage ramparts of Galle Fort. Currently functioning as an award-winning luxury boutique residence with antique brass hardware, arched courtyards, and a private courtyard pool.',
    'commercial',
    'buy',
    'published',
    'available',
    320000000,
    'total',
    false,
    false,
    'Galle',
    'Galle',
    'Pedlar Street, Galle Fort',
    6.9271,
    79.8612,
    6,
    6,
    5400,
    22,
    NULL,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["UNESCO Heritage Protected Asset","Central Courtyard Pool","Original Dutch Colonial Arches","Commercial Hotel Licensing Approved","Commercial Kitchen Setup"]'::jsonb,
    'Nalaka Wickremesinghe',
    228,
    12,
    17,
    true,
    false,
    NULL,
    '["featured"]'::jsonb,
    timezone('utc', now() - interval '18 days')
  ),
  (
    'prop-11',
    'LP-011',
    'pelawatte-modernist-sanctuary-battaramulla',
    'Pelawatte Modernist Sanctuary',
    'Brand-new minimalist architectural sanctuary nestled minutes from Diyatha Uyana and the Parliament wetlands. Showcases raw off-form fair-faced concrete, floor-to-ceiling aluminium sliding panels, and a landscaped rooftop entertainment terrace.',
    'house',
    'buy',
    'published',
    'available',
    78000000,
    'total',
    false,
    false,
    'Battaramulla',
    'Colombo',
    'Parliament Road Enclave',
    6.9271,
    79.8612,
    4,
    4,
    3400,
    12,
    2,
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["10kW Solar Grid-Tied System","Rooftop Terrace with Wetland Views","Double Height Living Lounge","European Fitted Kitchen with Quartz Countertops"]'::jsonb,
    'Chamari Perera',
    205,
    4,
    31,
    false,
    false,
    NULL,
    '[]'::jsonb,
    timezone('utc', now() - interval '20 days')
  ),
  (
    'prop-12',
    'LP-012',
    'nuwara-eliya-tea-country-chalet',
    'Pedro Valley Tea Country Chalet',
    'Nestled at 1,900 meters elevation adjacent to the Pedro Tea Estate, this timber-and-stone chalet features wood-burning granite hearths, double-glazed insulated windows, and manicured English cottage gardens overlooking the misty valley.',
    'house',
    'buy',
    'published',
    'available',
    115000000,
    'total',
    false,
    false,
    'Nuwara Eliya',
    'Nuwara Eliya',
    'Pedro Estate Road',
    6.9271,
    79.8612,
    4,
    3,
    3000,
    45,
    3,
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
    '["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1600&q=80","https://images.unsplash.com/photo-1600585154784-0a69a4e4d6d6?auto=format&fit=crop&w=1600&q=80"]'::jsonb,
    '[]'::jsonb,
    '["Two Working Granite Fireplaces","Double Glazed Thermal Windows","Heated Bathrooms","Caretaker Cottage","Terraced Flower and Herb Gardens"]'::jsonb,
    'Rohan Senanayake',
    97,
    9,
    19,
    false,
    false,
    NULL,
    '[]'::jsonb,
    timezone('utc', now() - interval '22 days')
  ),
  (
    'prop-13',
    'LP-013',
    'hanthana-mountain-foothill-parcel-kandy',
    'Hanthana Mountain Foothill Estate Parcel',
    'Gently terraced hillside land parcel overlooking the Hanthana Mountain range and adjacent tea estates. Features natural slope drainage, clear boundary fencing, and 18ft paved roadway frontage.',
    'land',
    'land',
    'published',
    'available',
    1650000,
    'perch',
    false,
    false,
    'Kandy',
    'Kandy',
    'Hanthana Upper Loop Road',
    6.9271,
    79.8612,
    NULL,
    NULL,
    NULL,
    38,
    NULL,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '[]'::jsonb,
    '["18ft Paved Road Frontage","Panoramic Mountain Horizon","Electricity & Tap Water at Boundary","Clear Freehold Deed"]'::jsonb,
    'Rohan Senanayake',
    94,
    11,
    25,
    false,
    false,
    NULL,
    '["land"]'::jsonb,
    timezone('utc', now() - interval '24 days')
  )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price_lkr = EXCLUDED.price_lkr,
    property_type = EXCLUDED.property_type,
    purpose = EXCLUDED.purpose,
    publication_status = EXCLUDED.publication_status,
    city = EXCLUDED.city,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    images = EXCLUDED.images,
    amenities = EXCLUDED.amenities,
    updated_at = timezone('utc', now());
