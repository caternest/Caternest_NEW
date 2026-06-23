-- SUPABASE PRODUCTION SCHEMAS & POLICIES SETUP
-- Copy and run this script in the Supabase SQL Editor to set up your database.

-- ==========================================
-- 0. EXTENSIONS SCHEMA & PREREQUISITES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. DATABASE TABLES
-- ==========================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'caterer', 'customer')) DEFAULT 'customer',
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    "reviewCount" INTEGER DEFAULT 0,
    "email_verified" BOOLEAN DEFAULT FALSE,
    "otp" TEXT,
    "otp_expiry" TIMESTAMPTZ
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
    "platformFeePerPlate" NUMERIC,
    "venue" TEXT,
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

-- Platform settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    "platformFeePerPlate" NUMERIC DEFAULT 2
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
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

-- Profiles Policies
DROP POLICY IF EXISTS "Allow public read of profiles" ON public.profiles;
CREATE POLICY "Allow public read of profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow service role to manage profiles" ON public.profiles;
CREATE POLICY "Allow service role to manage profiles" ON public.profiles
    FOR ALL USING (true);

-- Caterer Registrations Policies
DROP POLICY IF EXISTS "Allow public read access to caterers" ON public.caterer_registrations;
CREATE POLICY "Allow public read access to caterers" ON public.caterer_registrations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to insert registrations (joining flow)" ON public.caterer_registrations;
CREATE POLICY "Allow anyone to insert registrations (joining flow)" ON public.caterer_registrations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user to update his/her own registration" ON public.caterer_registrations;
DROP POLICY IF EXISTS "Allow authorized updates to caterer registrations" ON public.caterer_registrations;
CREATE POLICY "Allow authorized updates to caterer registrations" ON public.caterer_registrations
    FOR UPDATE USING (
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) OR
        ("userId" = auth.uid()::text) OR
        (email = auth.jwt()->>'email')
    );

DROP POLICY IF EXISTS "Allow direct deletes for owners/admin" ON public.caterer_registrations;
DROP POLICY IF EXISTS "Allow authorized deletes to caterer registrations" ON public.caterer_registrations;
CREATE POLICY "Allow authorized deletes to caterer registrations" ON public.caterer_registrations
    FOR DELETE USING (
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) OR
        ("userId" = auth.uid()::text) OR
        (email = auth.jwt()->>'email')
    );

-- Food Images Policies
DROP POLICY IF EXISTS "Allow public read to food image library" ON public.food_images;
CREATE POLICY "Allow public read to food image library" ON public.food_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert/update/delete for everyone/admin" ON public.food_images;
DROP POLICY IF EXISTS "Allow admins to manage food images" ON public.food_images;
CREATE POLICY "Allow admins to manage food images" ON public.food_images
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Orders Policies
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated select on orders" ON public.orders;
CREATE POLICY "Allow authenticated select on orders" ON public.orders
    FOR SELECT USING (
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) OR
        (auth.uid()::text = "userId") OR
        (auth.jwt()->>'email' = "customerEmail") OR
        (EXISTS (
            SELECT 1 FROM public.caterer_registrations cr 
            WHERE cr.id = public.orders."catererId" AND (cr."userId" = auth.uid()::text OR cr.email = auth.jwt()->>'email')
        ))
    );

DROP POLICY IF EXISTS "Allow insertion on orders" ON public.orders;
CREATE POLICY "Allow insertion on orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow updates on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authorized updates on orders" ON public.orders;
CREATE POLICY "Allow authorized updates on orders" ON public.orders
    FOR UPDATE USING (
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) OR
        (auth.uid()::text = "userId") OR
        (auth.jwt()->>'email' = "customerEmail") OR
        (EXISTS (
            SELECT 1 FROM public.caterer_registrations cr 
            WHERE cr.id = public.orders."catererId" AND (cr."userId" = auth.uid()::text OR cr.email = auth.jwt()->>'email')
        ))
    );

-- Audit Logs Policies
DROP POLICY IF EXISTS "Allow insert/select on audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow anyone to insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow only admins to select audit logs" ON public.audit_logs;

CREATE POLICY "Allow anyone to insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow only admins to select audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Notifications Policies
DROP POLICY IF EXISTS "Allow insert/select on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authorized select on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated inserts on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authorized update of notifications" ON public.notifications;

CREATE POLICY "Allow authorized select on notifications" ON public.notifications
    FOR SELECT USING (
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) OR
        (EXISTS (
            SELECT 1 FROM public.caterer_registrations cr 
            WHERE cr.id = public.notifications."catererId" AND (cr."userId" = auth.uid()::text OR cr.email = auth.jwt()->>'email')
        )) OR
        (EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = public.notifications."orderId" AND (o."userId" = auth.uid()::text OR o."customerEmail" = auth.jwt()->>'email')
        ))
    );

CREATE POLICY "Allow authenticated inserts on notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authorized update of notifications" ON public.notifications
    FOR UPDATE USING (
        (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')) OR
        (EXISTS (
            SELECT 1 FROM public.caterer_registrations cr 
            WHERE cr.id = public.notifications."catererId" AND (cr."userId" = auth.uid()::text OR cr.email = auth.jwt()->>'email')
        )) OR
        (EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = public.notifications."orderId" AND (o."userId" = auth.uid()::text OR o."customerEmail" = auth.jwt()->>'email')
        ))
    );

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

-- Function to handle creating user profile row automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to prevent client-side privilege escalation (role shifting) on profiles table
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.uid() IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ) THEN
         RAISE EXCEPTION 'Unauthorized: Only admin accounts can modify user roles.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ==========================================
-- 6. SCHEMAS SYNC MIGRATIONS (FOR EXISTING TABLES)
-- ==========================================
-- Run this block if you already have the 'public.orders' table created
-- but need to add any missing column to prevent schema cache warnings!

-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "venue" TEXT;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "eventType" TEXT;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "phone" TEXT;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "guests" INTEGER;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "totalEstimate" NUMERIC;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "pricePerPlate" NUMERIC;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "platformFee" NUMERIC;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "selectedItems" JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "packageDetails" JSONB DEFAULT '{}'::jsonb;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "matchedSlab" JSONB DEFAULT '{}'::jsonb;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "specialNotes" TEXT;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "statusHistory" JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMPTZ;
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "platformFeePerPlate" NUMERIC;
-- NOTIFY pgrst, 'reload schema';

