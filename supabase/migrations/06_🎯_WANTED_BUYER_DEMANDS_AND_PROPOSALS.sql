-- ==============================================================================
-- 06_🎯_WANTED_BUYER_DEMANDS_AND_PROPOSALS.sql
-- Step 6: Wanted Buyer Requests & Agent Match Proposals System
-- ==============================================================================

-- Wanted Buyer Requests Table
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

CREATE INDEX IF NOT EXISTS idx_wanted_district ON public.wanted_properties (district) WHERE status = 'active';

-- Match Proposals Table (Agents Proposing Listings to Buyers)
CREATE TABLE IF NOT EXISTS public.match_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.wanted_properties(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'agent',
    property_title TEXT NOT NULL,
    price_lkr NUMERIC(14, 2) NOT NULL,
    property_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_proposals_lead ON public.match_proposals (lead_id);
