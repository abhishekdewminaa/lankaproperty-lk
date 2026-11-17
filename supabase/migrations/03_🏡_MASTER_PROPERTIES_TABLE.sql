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
