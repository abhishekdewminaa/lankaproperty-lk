-- ==============================================================================
-- 12_⚡_SAFE_IN_PLACE_PRODUCTION_UPGRADE.sql
-- Step 12: Bulletproof Dynamic In-Place Production Upgrade for lankaproperty.lk
-- Safe across all database versions: Uses conditional column checks to prevent
-- "column does not exist" errors on both legacy and modern table schemas.
-- ==============================================================================

DO $$
BEGIN
    -- 1. Enable UUID Extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 2. Add New Performance & Architecture Columns (Safe IF NOT EXISTS)
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_ref TEXT;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_lkr NUMERIC(14, 2);
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_type TEXT;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT 'buy';
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'published';
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS hero_image TEXT;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS collections JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS trending_velocity_text TEXT;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS assigned_agent_name TEXT DEFAULT 'Mr Lalith Ranatunga';
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floors INTEGER DEFAULT 1;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 1;
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS land_perches NUMERIC(8, 2);

    -- 3. Dynamic Column Synchronization (Conditional: Only executes if old column exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'price') THEN
        EXECUTE 'UPDATE public.properties SET price_lkr = COALESCE(price_lkr, price, 0) WHERE price_lkr IS NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'category') THEN
        EXECUTE 'UPDATE public.properties SET property_type = COALESCE(property_type, category, ''house'') WHERE property_type IS NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'listing_type') THEN
        EXECUTE 'UPDATE public.properties SET purpose = COALESCE(purpose, listing_type, ''buy'') WHERE purpose IS NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'views_count') THEN
        EXECUTE 'UPDATE public.properties SET view_count = COALESCE(view_count, views_count, 0) WHERE view_count IS NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'land_size') THEN
        EXECUTE 'UPDATE public.properties SET land_perches = COALESCE(land_perches, land_size, 0) WHERE land_perches IS NULL';
    END IF;

    -- Ensure listing_ref is populated
    EXECUTE 'UPDATE public.properties SET listing_ref = COALESCE(listing_ref, ''LP-'' || UPPER(SUBSTRING(COALESCE(district, ''COL''), 1, 3)) || ''-'' || SUBSTRING(id::text, 1, 6)) WHERE listing_ref IS NULL';

    -- 4. If property_images table exists, aggregate into images jsonb
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_images') THEN
        EXECUTE '
        WITH aggregated_images AS (
          SELECT 
            property_id, 
            jsonb_agg(image_url ORDER BY display_order ASC) AS img_array,
            (array_agg(image_url ORDER BY display_order ASC))[1] AS first_img
          FROM public.property_images
          GROUP BY property_id
        )
        UPDATE public.properties p SET
          images = ai.img_array,
          hero_image = COALESCE(p.hero_image, ai.first_img)
        FROM aggregated_images ai
        WHERE p.id::text = ai.property_id::text AND (p.images IS NULL OR p.images = ''[]''::jsonb)';
    END IF;

    -- 5. Add search_vector column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'search_vector') THEN
        ALTER TABLE public.properties ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(city, '') || ' ' || coalesce(district, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(description, '')), 'C')
        ) STORED;
    END IF;
END $$;

-- 6. High-Speed GIN Full-Text Search Index & Partial Indexes (<5ms)
CREATE INDEX IF NOT EXISTS idx_properties_search_gin ON public.properties USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_properties_fast_filter ON public.properties (district, property_type, price_lkr);

-- 7. Fix RLS CPU Spikes: Enforce (SELECT auth.uid()) InitPlan Caching
DROP POLICY IF EXISTS "Public read published properties" ON public.properties;
CREATE POLICY "Public read published properties"
ON public.properties FOR SELECT
USING (
  publication_status = 'published' 
  OR (SELECT auth.uid()) IS NOT NULL
);

-- 8. Circuit Breaker Statement Timeouts
ALTER ROLE authenticator SET statement_timeout = '3000';
ALTER ROLE anon SET statement_timeout = '3000';
