-- ==============================================================================
-- 01_SCHEMA_AND_INDEXES.sql
-- LankaProperty.lk — Step 1 of 4: Extensions, Enums, Tables, Columns & Indexes
-- Target: xmvhnzuidwpwvdnyydio.supabase.co (PostgreSQL 15+)
-- Safe & Idempotent: Can be re-run on both fresh and existing databases.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. CUSTOM ENUM TYPES
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

-- 3. USER PROFILES TABLE
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
    price_lkr NUMERIC(14, 2) NOT NULL DEFAULT 0,
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

-- Ensure all columns exist if upgrading an existing properties table
DO $$ BEGIN
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_ref TEXT;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS hero_image TEXT;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_plans JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS collections JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_trending BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS trending_velocity_text TEXT;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS assigned_agent_name TEXT DEFAULT 'Mr Lalith Ranatunga';
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS inquiry_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS save_count INTEGER NOT NULL DEFAULT 0;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE public.properties ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(city, '') || ' ' || coalesce(district, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'C')
        ) STORED;
    END IF;
END $$;

-- 5. SUPPORTING TABLES (INQUIRIES, WANTED LEADS, AUDIT LOGS)
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

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    event TEXT NOT NULL,
    details TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_properties_search_gin ON public.properties USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_properties_search ON public.properties (district, property_type, price_lkr) WHERE publication_status = 'published';
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties (slug);
CREATE INDEX IF NOT EXISTS idx_properties_author ON public.properties (author_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.inquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_wanted_district ON public.wanted_properties (district) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs (created_at);
