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
