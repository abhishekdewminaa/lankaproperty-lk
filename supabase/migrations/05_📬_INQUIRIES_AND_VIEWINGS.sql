-- ==============================================================================
-- 05_📬_INQUIRIES_AND_VIEWINGS.sql
-- Step 5: Customer Inquiries, CRM Leads & Viewing Appointments Tables
-- ==============================================================================

-- Inquiries & Customer Leads Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'web_form',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.inquiries (property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries (created_at DESC);

-- Viewing Appointments Table
CREATE TABLE IF NOT EXISTS public.viewing_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_viewings_property ON public.viewing_appointments (property_id);
