-- ==============================================================================
-- LankaProperty.lk — Targeted Cost Optimization Migration (#7 & #8)
--
-- #7: Delete Secondary Gallery Photos (2..N) & Floorplans When Marked SOLD / ARCHIVED
--     (Keeps only hero_image / images[0] thumbnail for historical price reference,
--      reclaiming 90%+ of photo storage on completed listings).
--
-- #8: Auto-Purge Expired Wanted Leads (>90 days), Match Proposals (>90 days),
--     and Old Audit Logs (>60 days) via pg_cron every Sunday at 03:00 AM UTC
--     (Keeps the 500 MB database under 40 MB permanently).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ITEM #7: AUTO-PRUNE SECONDARY PHOTOS WHEN A PROPERTY IS MARKED SOLD / ARCHIVED
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_sold_property_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    secondary_image TEXT;
BEGIN
    -- Trigger when status becomes 'sold' or publication_status becomes 'archived'
    IF (NEW.status = 'sold' OR NEW.publication_status = 'archived') THEN
        -- Delete secondary photos (index 1..N) from Supabase Storage bucket 'property-media'
        IF jsonb_typeof(NEW.images) = 'array' AND jsonb_array_length(NEW.images) > 1 THEN
            FOR secondary_image IN
                SELECT value#>>'{}'
                FROM jsonb_array_elements(NEW.images) WITH ORDINALITY AS t(value, idx)
                WHERE idx > 1
            LOOP
                DELETE FROM storage.objects
                WHERE bucket_id = 'property-media'
                  AND (name = secondary_image OR secondary_image LIKE '%' || name);
            END LOOP;

            -- Keep ONLY Image #1 (images[0] hero thumbnail) in the database row
            NEW.images := jsonb_build_array(NEW.images->0);
        END IF;

        -- Clear floor_plans array if column exists
        IF to_jsonb(NEW) ? 'floor_plans' THEN
            NEW.floor_plans := '[]'::jsonb;
        END IF;
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


-- ------------------------------------------------------------------------------
-- ITEM #8: WEEKLY AUTOMATED CLEANUP VIA pg_cron (90d Proposals/Wanted, 60d Logs)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'lankaproperty-weekly-auto-purge',
    '0 3 * * 0', -- Runs every Sunday at 03:00 AM UTC
    $$
        -- 1. Purge match proposals older than 90 days
        DELETE FROM public.match_proposals
        WHERE created_at < NOW() - INTERVAL '90 days';

        -- 2. Purge fulfilled/archived/expired wanted buyer requests older than 90 days
        DELETE FROM public.wanted_properties
        WHERE status IN ('fulfilled', 'archived', 'closed', 'expired')
          AND created_at < NOW() - INTERVAL '90 days';

        -- 3. Purge audit logs older than 60 days
        DELETE FROM public.audit_logs
        WHERE created_at < NOW() - INTERVAL '60 days';
    $$
);
