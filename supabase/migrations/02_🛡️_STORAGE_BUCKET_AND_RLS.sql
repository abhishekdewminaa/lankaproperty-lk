-- ==============================================================================
-- 02_STORAGE_BUCKET_AND_RLS.sql
-- LankaProperty.lk — Step 2 of 4: Supabase Storage Bucket & Row-Level Security
-- Target: xmvhnzuidwpwvdnyydio.supabase.co
-- Safe & Idempotent: Creates 'property-images' bucket & permissive sync RLS.
-- ==============================================================================

-- 1. CREATE PUBLIC STORAGE BUCKET FOR PROPERTY PHOTOS (WebP/AVIF/JPEG/PNG)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. STORAGE OBJECT POLICIES (Cross-device read & client upload support)
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Anyone can upload property images" ON storage.objects;
CREATE POLICY "Anyone can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Anyone can update property images" ON storage.objects;
CREATE POLICY "Anyone can update property images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images');

-- 3. ENABLE ROW-LEVEL SECURITY ON PUBLIC TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wanted_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: Fast Super Admin check
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are readable by self and super admin" ON public.profiles;
CREATE POLICY "Public profiles are readable by self and super admin"
ON public.profiles FOR SELECT
USING ((SELECT auth.uid()) = id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ((SELECT auth.uid()) = id);

-- 5. PROPERTIES POLICIES (Allows cross-device desktop/mobile sync & publishing)
DROP POLICY IF EXISTS "Public read published properties" ON public.properties;
CREATE POLICY "Public read published properties"
ON public.properties FOR SELECT
USING (
  publication_status = 'published'
  OR (SELECT auth.uid()) = author_id
  OR public.is_super_admin()
  OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Sellers insert own listings" ON public.properties;
DROP POLICY IF EXISTS "Public and service can insert listings" ON public.properties;
CREATE POLICY "Public and service can insert listings"
ON public.properties FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Sellers update own listings" ON public.properties;
DROP POLICY IF EXISTS "Public and service can update listings" ON public.properties;
CREATE POLICY "Public and service can update listings"
ON public.properties FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Super Admins delete listings" ON public.properties;
CREATE POLICY "Super Admins delete listings"
ON public.properties FOR DELETE
USING (public.is_super_admin());

-- 6. INQUIRIES & WANTED LEADS POLICIES
DROP POLICY IF EXISTS "Public can submit inquiries" ON public.inquiries;
CREATE POLICY "Public can submit inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Property authors and Super Admin view inquiries" ON public.inquiries;
CREATE POLICY "Property authors and Super Admin view inquiries"
ON public.inquiries FOR SELECT
USING (
  public.is_super_admin() OR
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = inquiries.property_id AND p.author_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Public read active wanted leads" ON public.wanted_properties;
CREATE POLICY "Public read active wanted leads"
ON public.wanted_properties FOR SELECT
USING (status = 'active');

DROP POLICY IF EXISTS "Public can submit wanted lead" ON public.wanted_properties;
CREATE POLICY "Public can submit wanted lead"
ON public.wanted_properties FOR INSERT
WITH CHECK (true);
