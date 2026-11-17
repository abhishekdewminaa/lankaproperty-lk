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
