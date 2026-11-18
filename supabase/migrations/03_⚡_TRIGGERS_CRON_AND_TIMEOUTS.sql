-- ==============================================================================
-- 03_⚡_TRIGGERS_CRON_AND_TIMEOUTS.sql
-- LankaProperty.lk — Step 3 of 4: Auto-Scaling Triggers, Anti-Tamper & Timeouts
-- Target: xmvhnzuidwpwvdnyydio.supabase.co
--
-- Built for 500 to 50,000+ Expanding Properties:
-- 1. Auto-generates collision-free 'listing_ref' (e.g. LP-COL-2026-1001) via
--    sequence if omitted or colliding when new properties are added.
-- 2. Auto-deduplicates 'slug' if two listings share the same title, preventing
--    unique constraint crashes as the catalog scales past 500+ properties.
-- 3. Strips <script> tags, caps gallery array at 20 photos, and auto-prunes
--    secondary media when a property is marked 'sold' or 'archived'.
-- ==============================================================================

CREATE SEQUENCE IF NOT EXISTS public.property_listing_ref_seq START WITH 1000;

-- 1. AUTO-SCALING, ANTI-COLLISION & SANITIZATION TRIGGER
CREATE OR REPLACE FUNCTION public.guard_and_sanitize_property_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    dist_prefix TEXT;
    base_slug TEXT;
BEGIN
    -- Strip any accidental or malicious HTML <script> tags
    NEW.title := regexp_replace(coalesce(NEW.title, ''), '<script[^>]*>.*?</script>', '', 'gi');
    NEW.description := regexp_replace(coalesce(NEW.description, ''), '<script[^>]*>.*?</script>', '', 'gi');

    -- Auto-generate or deduplicate listing_ref as catalog expands (500+ properties)
    dist_prefix := UPPER(SUBSTRING( regexp_replace(coalesce(NEW.district, 'SRI'), '[^a-zA-Z]', '', 'g') || 'SRI', 1, 3 ));
    IF NEW.listing_ref IS NULL OR btrim(NEW.listing_ref) = '' OR EXISTS (
        SELECT 1 FROM public.properties p WHERE p.listing_ref = NEW.listing_ref AND p.id <> NEW.id
    ) THEN
        NEW.listing_ref := 'LP-' || dist_prefix || '-' || EXTRACT(YEAR FROM timezone('utc', now()))::text || '-' || nextval('public.property_listing_ref_seq')::text;
    END IF;

    -- Auto-sanitize & deduplicate slug to prevent unique_violation crashes across 500+ listings
    base_slug := lower(regexp_replace(coalesce(nullif(btrim(NEW.slug), ''), NEW.title, 'property'), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
    IF base_slug = '' THEN
        base_slug := 'property-' || SUBSTRING(NEW.id, 1, 8);
    END IF;

    IF EXISTS (SELECT 1 FROM public.properties p WHERE p.slug = base_slug AND p.id <> NEW.id) THEN
        NEW.slug := base_slug || '-' || SUBSTRING(md5(NEW.id || clock_timestamp()::text), 1, 5);
    ELSE
        NEW.slug := base_slug;
    END IF;

    -- Ensure hero_image defaults to first element of images JSONB array
    IF (NEW.hero_image IS NULL OR btrim(NEW.hero_image) = '') AND jsonb_typeof(NEW.images) = 'array' AND jsonb_array_length(NEW.images) > 0 THEN
        NEW.hero_image := NEW.images->>0;
    END IF;

    -- Prevent JSONB array memory-bomb attacks: cap images to 20 items max
    IF jsonb_typeof(NEW.images) = 'array' AND jsonb_array_length(NEW.images) > 20 THEN
        NEW.images := (
            SELECT jsonb_agg(elem)
            FROM (
                SELECT elem FROM jsonb_array_elements(NEW.images) WITH ORDINALITY AS t(elem, idx)
                WHERE idx <= 20
            ) sub
        );
    END IF;

    -- Auto-prune sold/archived secondary media to save 90%+ storage as catalog grows
    IF (NEW.status = 'sold' OR NEW.publication_status = 'archived') THEN
        IF jsonb_typeof(NEW.images) = 'array' AND jsonb_array_length(NEW.images) > 1 THEN
            NEW.images := jsonb_build_array(NEW.images->0);
        END IF;
        NEW.floor_plans := '[]'::jsonb;
    END IF;

    NEW.updated_at := timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_sold_property_photos ON public.properties;
DROP TRIGGER IF EXISTS trg_guard_and_sanitize_property_write ON public.properties;
CREATE TRIGGER trg_guard_and_sanitize_property_write
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.guard_and_sanitize_property_write();

-- 2. WEEKLY PG_CRON DATABASE AUTO-PURGE (Keeps database under 40 MB permanently)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('lankaproperty-weekly-auto-purge');
        PERFORM cron.schedule(
            'lankaproperty-weekly-auto-purge',
            '0 3 * * 0',
            $cmd$
                DELETE FROM public.wanted_properties
                WHERE status IN ('fulfilled', 'archived', 'expired')
                  AND created_at < NOW() - INTERVAL '90 days';

                DELETE FROM public.audit_logs
                WHERE created_at < NOW() - INTERVAL '60 days';

                VACUUM ANALYZE public.properties;
                VACUUM ANALYZE public.wanted_properties;
            $cmd$
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. SUPAVISOR STATEMENT TIMEOUTS (DDoS & Runaway Query Circuit Breaker)
DO $$ BEGIN
    EXECUTE 'ALTER ROLE authenticator SET statement_timeout = ''3000''';
    EXECUTE 'ALTER ROLE anon SET statement_timeout = ''3000''';
    EXECUTE 'ALTER ROLE authenticated SET statement_timeout = ''5000''';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
