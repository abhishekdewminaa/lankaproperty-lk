-- LankaProperty.lk Schema & RLS Policy Specification
-- Architecture: Supabase PostgreSQL 15+ with Row-Level Security
-- Intended for migration execution upon test environment connection.

-- ========================================================
-- 1. EXTENSIONS & SETUP
-- ========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role enum
CREATE TYPE user_role AS ENUM ('super_admin', 'agent', 'owner', 'buyer');
CREATE TYPE listing_status AS ENUM ('draft', 'pending_review', 'published', 'sold', 'archived', 'rejected');
CREATE TYPE property_category AS ENUM ('house', 'apartment', 'land', 'commercial', 'villa');

-- ========================================================
-- 2. TABLES SPECIFICATION
-- ========================================================

-- User Profiles (Linked with auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'buyer',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    whatsapp TEXT,
    agency_name TEXT,
    license_number TEXT,
    district TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Properties Master Table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_ref TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    property_type property_category NOT NULL,
    publication_status listing_status NOT NULL DEFAULT 'draft',
    price_lkr NUMERIC(14, 2) NOT NULL,
    price_unit TEXT NOT NULL DEFAULT 'total',
    is_negotiable BOOLEAN NOT NULL DEFAULT false,
    price_on_request BOOLEAN NOT NULL DEFAULT false,
    
    -- Location fields
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Specifications
    bedrooms INTEGER,
    bathrooms INTEGER,
    sqft INTEGER,
    land_perches NUMERIC(8, 2),
    floors INTEGER,
    parking_spaces INTEGER,
    
    -- Media & Features
    images TEXT[] NOT NULL DEFAULT '{}',
    floor_plans TEXT[] NOT NULL DEFAULT '{}',
    amenities TEXT[] NOT NULL DEFAULT '{}',
    
    -- Internal / Administrative
    private_staff_notes TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    
    -- Analytics & Counters
    view_count INTEGER NOT NULL DEFAULT 0,
    inquiry_count INTEGER NOT NULL DEFAULT 0,
    save_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_trending BOOLEAN NOT NULL DEFAULT false,
    
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Inquiries & CRM Leads
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'web_form',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Viewing Appointments
CREATE TABLE public.viewing_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Audit Logs (Tamper-Resistant)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ========================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are readable by self and super admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 2. Properties Policies
CREATE POLICY "Public can view published properties without staff notes"
ON public.properties FOR SELECT
USING (
  publication_status = 'published' 
  OR auth.uid() = author_id 
  OR public.is_super_admin()
);

CREATE POLICY "Owners and Agents can insert own draft listings"
ON public.properties FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Owners and Agents can update own listings"
ON public.properties FOR UPDATE
USING (auth.uid() = author_id OR public.is_super_admin());

CREATE POLICY "Only Super Admins can delete listings"
ON public.properties FOR DELETE
USING (public.is_super_admin());

-- 3. Inquiries Policies
CREATE POLICY "Anyone can submit an inquiry"
ON public.inquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Property author or Super Admin can view inquiries"
ON public.inquiries FOR SELECT
USING (
  public.is_super_admin() OR 
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = inquiries.property_id AND p.author_id = auth.uid()
  )
);

-- 4. Audit Logs Policies
CREATE POLICY "Super Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "System can record audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);
