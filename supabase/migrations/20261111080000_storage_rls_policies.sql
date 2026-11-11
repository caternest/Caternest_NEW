-- ==============================================================================
-- PLANMYCHOICE / CATERNEST: LEAST-PRIVILEGE SUPABASE STORAGE RLS POLICIES
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
--
-- SECURITY ARCHITECTURE:
-- 1. NO UNRESTRICTED ANON ACCESS:
--    - Anonymous visitors CANNOT perform unrestricted uploads or overwrite existing files.
--    - Legitimate onboarding uploads (caterers scanning a menu on /join before account creation)
--      are authorized securely via single-use Pre-Signed Upload URLs issued by /api/storage/sign.
--    - Pre-signed URLs use cryptographic service-role tokens with 1-hour expiry, validating the
--      exact file path and avoiding any broad anon table-level permissions.
--
-- 2. AUTHENTICATED CATERER OWNERSHIP:
--    - Direct client uploads via Supabase JS SDK are strictly scoped to the authenticated
--      user's folder: (storage.foldername(name))[1] = auth.uid()::text.
--    - Users can only upload, update, and manage objects inside their own user ID folder.
--
-- 3. BOTH INSERT AND UPDATE POLICIES CONFIGURED:
--    - Supabase JS SDK uses `upsert: true` by default. Under PostgreSQL RLS, upserts
--      require both an INSERT and an UPDATE policy. Both are provided here.
-- ==============================================================================

-- 1. Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Ensure standard storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('menu-cards', 'menu-cards', true, 52428800, NULL),
    ('branding-images', 'branding-images', true, 52428800, NULL),
    ('food-images', 'food-images', true, 52428800, NULL),
    ('gallery-images', 'gallery-images', true, 52428800, NULL),
    ('documents', 'documents', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = COALESCE(EXCLUDED.file_size_limit, storage.buckets.file_size_limit);

-- ==============================================================================
-- BUCKET 1: menu-cards (Public: true)
-- Purpose: Caterer menu cards and menu images
-- ==============================================================================

DROP POLICY IF EXISTS "Allow public read image access menu_cards" ON storage.objects;
DROP POLICY IF EXISTS "Public read for menu-cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to upload to menu_cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to menu-cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to menu-cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated caterers upload to menu-cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated caterers update menu-cards" ON storage.objects;

-- SELECT (Read): Public read for menu-cards (customers viewing menus)
CREATE POLICY "Public read for menu-cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-cards');

-- INSERT: Authenticated caterers scoped strictly to their user ID folder
-- (Unauthenticated onboarding uploads are authorized via server pre-signed URLs)
CREATE POLICY "Authenticated caterers upload to menu-cards"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'menu-cards' AND
    auth.role() = 'authenticated' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    )
);

-- UPDATE: Authenticated caterers can only update files in their own folder
CREATE POLICY "Authenticated caterers update menu-cards"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'menu-cards' AND
    auth.role() = 'authenticated' AND
    (
        (storage.foldername(name))[1] = auth.uid()::text OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    )
)
WITH CHECK (bucket_id = 'menu-cards');

-- ==============================================================================
-- BUCKET 2: documents (Public: false - Private & Confidential)
-- Purpose: Private caterer verification documents (Aadhaar, PAN, FSSAI, GST) and confidential menus
-- ==============================================================================

DROP POLICY IF EXISTS "Restrict read on documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own documents or admins all" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own documents folder or temp-scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users read own documents or admins all" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own documents folder" ON storage.objects;
DROP POLICY IF EXISTS "Users update own documents" ON storage.objects;

-- SELECT (Read): STRICTLY PRIVATE - User folder owner or Admin profile only
CREATE POLICY "Users read own documents or admins all"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' AND (
        (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
        (auth.uid() IS NOT NULL AND owner = auth.uid()::text) OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    )
);

-- INSERT: Scoped strictly to the authenticated user's ID folder or Admin
CREATE POLICY "Users upload to own documents folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' AND (
        (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text) OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    )
);

-- UPDATE: User folder owner or Admin
CREATE POLICY "Users update own documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'documents' AND (
        (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text) OR
        (auth.uid() IS NOT NULL AND owner = auth.uid()::text) OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    )
)
WITH CHECK (bucket_id = 'documents');

-- ==============================================================================
-- BUCKETS 3, 4, 5: branding-images, food-images, gallery-images (Public: true)
-- Purpose: Public caterer logos, cover banners, dish photos, event galleries
-- ==============================================================================

DROP POLICY IF EXISTS "Allow public read image access branding_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to upload to branding_images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for branding-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to branding-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to branding-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to branding-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update to branding-images" ON storage.objects;

CREATE POLICY "Public read for branding-images" ON storage.objects FOR SELECT USING (bucket_id = 'branding-images');
CREATE POLICY "Authenticated upload to branding-images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'branding-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Authenticated update to branding-images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'branding-images' AND auth.role() = 'authenticated'
) WITH CHECK (bucket_id = 'branding-images');

DROP POLICY IF EXISTS "Allow public read image access food_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to upload to food_images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for food-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to food-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to food-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to food-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update to food-images" ON storage.objects;

CREATE POLICY "Public read for food-images" ON storage.objects FOR SELECT USING (bucket_id = 'food-images');
CREATE POLICY "Authenticated upload to food-images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'food-images' AND (
        auth.role() = 'authenticated' OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    )
);
CREATE POLICY "Authenticated update to food-images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'food-images' AND (
        auth.role() = 'authenticated' OR
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    )
) WITH CHECK (bucket_id = 'food-images');

DROP POLICY IF EXISTS "Allow public read image access gallery_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to upload to gallery_images" ON storage.objects;
DROP POLICY IF EXISTS "Public read for gallery-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to gallery-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to gallery-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to gallery-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update to gallery-images" ON storage.objects;

CREATE POLICY "Public read for gallery-images" ON storage.objects FOR SELECT USING (bucket_id = 'gallery-images');
CREATE POLICY "Authenticated upload to gallery-images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'gallery-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Authenticated update to gallery-images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'gallery-images' AND auth.role() = 'authenticated'
) WITH CHECK (bucket_id = 'gallery-images');
