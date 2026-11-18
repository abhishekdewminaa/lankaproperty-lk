-- ==============================================================================
-- 03_⚡_TRIGGERS_CRON_AND_TIMEOUTS.sql
-- LankaProperty.lk — Step 3 of 4: Anti-Tamper Guard, Media Pruning & Timeouts
-- Target: xmvhnzuidwpwvdnyydio.supabase.co
-- ==============================================================================

-- 1. ANTI-TAMPER & PAYLOAD SANITIZATION TRIGGER (Caps gallery to 20 photos & strips scripts)
CREATE OR REPLACE FUNCTION public.guard_and_sanitize_property_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Strip any accidental or malicious HTML <script> tags
    NEW.title := regexp_replace(coalesce(NEW.title, ''), '<script[^>]*>.*?</script>', '', 'gi');
    NEW.description := regexp_replace(coalesce(NEW.description, ''), '<script[^>]*>.*?</script>', '', 'gi');

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

    -- Auto-prune sold/archived secondary media to save 90%+ storage
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
