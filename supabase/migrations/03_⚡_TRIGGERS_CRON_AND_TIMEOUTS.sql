-- ==============================================================================
-- 03_TRIGGERS_CRON_AND_TIMEOUTS.sql
-- LankaProperty.lk — Step 3 of 4: Media Pruning Trigger, Auto-Purge & Timeouts
-- Target: xmvhnzuidwpwvdnyydio.supabase.co
-- Safe & Idempotent: Keeps database size & storage costs minimal.
-- ==============================================================================

-- 1. AUTO-PRUNE SOLD / ARCHIVED SECONDARY MEDIA TRIGGER
CREATE OR REPLACE FUNCTION public.prune_sold_property_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
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

-- 2. WEEKLY PG_CRON DATABASE AUTO-PURGE
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

-- 3. SUPAVISOR STATEMENT TIMEOUTS (CRASH PREVENTION)
DO $$ BEGIN
    EXECUTE 'ALTER ROLE authenticator SET statement_timeout = ''3000''';
    EXECUTE 'ALTER ROLE anon SET statement_timeout = ''3000''';
    EXECUTE 'ALTER ROLE authenticated SET statement_timeout = ''5000''';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
