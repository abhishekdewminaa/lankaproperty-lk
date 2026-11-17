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
