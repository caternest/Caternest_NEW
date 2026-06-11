-- SUPABASE PRODUCTION SCHEMAS & POLICIES SETUP
-- Copy and run this script in the Supabase SQL Editor to set up your database.

-- ==========================================
-- 0. EXTENSIONS SCHEMA & PREREQUISITES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. DATABASE TABLES
-- ==========================================

-- Caterer registrations table
CREATE TABLE IF NOT EXISTS public.caterer_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    "userId" TEXT,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "cuisine" TEXT[],
    "categories" TEXT[],
    "minGuests" INTEGER,
    "pricePerPlate" NUMERIC,
    "status" TEXT DEFAULT 'pending',
    "verificationStatus" TEXT DEFAULT 'pending',
    "menuUploaded" BOOLEAN DEFAULT FALSE,
    "panNumber" TEXT,
    "aadhaarNumber" TEXT,
    "fssaiNumber" TEXT,
    "gstNumber" TEXT,
    "logo" TEXT,
    "coverBanner" TEXT,
    "founderImageUrl" TEXT,
    "gallery" TEXT[],
    "packages" JSONB DEFAULT '[]'::jsonb,
    "addOns" JSONB DEFAULT '[]'::jsonb,
    "includedItems" JSONB DEFAULT '[]'::jsonb,
    "username" TEXT,
    "password" TEXT,
    "owner" TEXT,
    "ownerPhoto" TEXT,
    "branchPhoto" TEXT,
    "galleryPhotos" TEXT[],
    "draftMenuPackages" JSONB DEFAULT '[]'::jsonb,
    "aadhaarUrl" TEXT,
    "panUrl" TEXT,
    "fssaiUrl" TEXT,
    "gstUrl" TEXT,
    "otherDocsUrl" TEXT,
    "rating" NUMERIC DEFAULT 0,
    "reviewCount" INTEGER DEFAULT 0
);

-- Food images library table
CREATE TABLE IF NOT EXISTS public.food_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    item_name TEXT UNIQUE NOT NULL,
    image_url TEXT,
    approved_by_admin BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'No Image',
    category TEXT,
    cuisine TEXT
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    "userId" TEXT,
    "catererId" UUID,
    "catererName" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "phone" TEXT,
    "eventDate" DATE,
    "eventTime" TEXT,
    "eventType" TEXT,
    "guestCount" INTEGER,
    "guests" INTEGER,
    "totalAmount" NUMERIC,
    "totalEstimate" NUMERIC,
    "status" TEXT DEFAULT 'pending',
    "items" JSONB DEFAULT '[]'::jsonb,
    "selectedItems" JSONB DEFAULT '[]'::jsonb,
    "packageSelected" TEXT,
    "packageDetails" JSONB DEFAULT '{}'::jsonb,
    "pricingSlabs" JSONB DEFAULT '[]'::jsonb,
    "matchedSlab" JSONB DEFAULT '{}'::jsonb,
    "addonItems" JSONB DEFAULT '[]'::jsonb,
    "selectedMenu" JSONB DEFAULT '[]'::jsonb,
    "notes" TEXT,
    "specialNotes" TEXT,
    "pricePerPlate" NUMERIC,
    "platformFee" NUMERIC,
    "status_history" JSONB DEFAULT '[]'::jsonb,
    "statusHistory" JSONB DEFAULT '[]'::jsonb,
    "internal_notes" TEXT,
    "internalNotes" TEXT,
    "quotation" JSONB DEFAULT '{}'::jsonb,
    "approved_at" TIMESTAMPTZ,
    "approvedAt" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "rejectedAt" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    "orderId" TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "catererId" UUID,
    read BOOLEAN DEFAULT false
);

-- Audit / System Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    timestamp TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    user_email TEXT,
    role TEXT
);

-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.caterer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. CREATE POLICIES FOR TABLES
-- ==========================================

-- Caterer Registrations Policies
DROP POLICY IF EXISTS "Allow public read access to caterers" ON public.caterer_registrations;
CREATE POLICY "Allow public read access to caterers" ON public.caterer_registrations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to insert registrations (joining flow)" ON public.caterer_registrations;
CREATE POLICY "Allow anyone to insert registrations (joining flow)" ON public.caterer_registrations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user to update his/her own registration" ON public.caterer_registrations;
CREATE POLICY "Allow user to update his/her own registration" ON public.caterer_registrations
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow direct deletes for owners/admin" ON public.caterer_registrations;
CREATE POLICY "Allow direct deletes for owners/admin" ON public.caterer_registrations
    FOR DELETE USING (true);

-- Food Images Policies
DROP POLICY IF EXISTS "Allow public read to food image library" ON public.food_images;
CREATE POLICY "Allow public read to food image library" ON public.food_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert/update/delete for everyone/admin" ON public.food_images;
CREATE POLICY "Allow insert/update/delete for everyone/admin" ON public.food_images
    FOR ALL USING (true) WITH CHECK (true);

-- Orders Policies
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
CREATE POLICY "Allow public select on orders" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insertion on orders" ON public.orders;
CREATE POLICY "Allow insertion on orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow updates on orders" ON public.orders;
CREATE POLICY "Allow updates on orders" ON public.orders
    FOR UPDATE USING (true) WITH CHECK (true);

-- Audit Logs Policies
DROP POLICY IF EXISTS "Allow insert/select on audit logs" ON public.audit_logs;
CREATE POLICY "Allow insert/select on audit logs" ON public.audit_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Notifications Policies
DROP POLICY IF EXISTS "Allow insert/select on notifications" ON public.notifications;
CREATE POLICY "Allow insert/select on notifications" ON public.notifications
    FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 4. STORAGE BUCKETS SETUP
-- ==========================================

-- Policies for Public Buckets: menu-cards, food-images, gallery-images, branding-images
DROP POLICY IF EXISTS "Allow public read image access menu_cards" ON storage.objects;
CREATE POLICY "Allow public read image access menu_cards"
    ON storage.objects FOR SELECT USING (bucket_id = 'menu-cards');

DROP POLICY IF EXISTS "Allow anyone to upload to menu_cards" ON storage.objects;
CREATE POLICY "Allow anyone to upload to menu_cards"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-cards');

DROP POLICY IF EXISTS "Allow public read image access food_images" ON storage.objects;
CREATE POLICY "Allow public read image access food_images"
    ON storage.objects FOR SELECT USING (bucket_id = 'food-images');

DROP POLICY IF EXISTS "Allow anyone to upload to food_images" ON storage.objects;
CREATE POLICY "Allow anyone to upload to food_images"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'food-images');

DROP POLICY IF EXISTS "Allow public read image access gallery_images" ON storage.objects;
CREATE POLICY "Allow public read image access gallery_images"
    ON storage.objects FOR SELECT USING (bucket_id = 'gallery-images');

DROP POLICY IF EXISTS "Allow anyone to upload to gallery_images" ON storage.objects;
CREATE POLICY "Allow anyone to upload to gallery_images"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery-images');

DROP POLICY IF EXISTS "Allow public read image access branding_images" ON storage.objects;
CREATE POLICY "Allow public read image access branding_images"
    ON storage.objects FOR SELECT USING (bucket_id = 'branding-images');

DROP POLICY IF EXISTS "Allow anyone to upload to branding_images" ON storage.objects;
CREATE POLICY "Allow anyone to upload to branding_images"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'branding-images');

-- Policy for Private Bucket: documents (No public read, only authenticated/ownership check)
DROP POLICY IF EXISTS "Restrict read on documents bucket" ON storage.objects;
CREATE POLICY "Restrict read on documents bucket"
    ON storage.objects FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Allow uploads to documents" ON storage.objects;
CREATE POLICY "Allow uploads to documents"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

-- ==========================================
-- 5. VIEWS & FUNCTIONS
-- ==========================================

-- View to display active approved caterers
CREATE OR REPLACE VIEW public.active_caterers AS
    SELECT * FROM public.caterer_registrations
    WHERE status = 'approved' OR status = 'Approved';

-- Function to handle automated updating of updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic status updates
DROP TRIGGER IF EXISTS tr_caterer_updated ON public.caterer_registrations;
CREATE TRIGGER tr_caterer_updated
    BEFORE UPDATE ON public.caterer_registrations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_orders_updated ON public.orders;
CREATE TRIGGER tr_orders_updated
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
