-- CONSOLIDATED SUPABASE SCHEMA MIGRATION SCRIPT
-- Copy and run this script in the Supabase SQL Editor to resolve all schema mismatch warnings.

-- ===================================================
-- 0. Table: profiles & trigger setup
-- ===================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'caterer', 'customer')) DEFAULT 'customer',
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of profiles" ON public.profiles;
CREATE POLICY "Allow public read of profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow service role to manage profiles" ON public.profiles;
CREATE POLICY "Allow service role to manage profiles" ON public.profiles FOR ALL USING (true);

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
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================================
-- 1. Table: caterer_registrations
-- Add alternatePhone and additionalPhone text columns
-- ===================================================
ALTER TABLE public.caterer_registrations ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;
ALTER TABLE public.caterer_registrations ADD COLUMN IF NOT EXISTS "additionalPhone" TEXT;
ALTER TABLE public.caterer_registrations ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN DEFAULT false;
ALTER TABLE public.caterer_registrations ADD COLUMN IF NOT EXISTS "otp" TEXT;
ALTER TABLE public.caterer_registrations ADD COLUMN IF NOT EXISTS "otp_expiry" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_username
ON public.caterer_registrations(username)
WHERE status <> 'Trashed';

-- ===================================================
-- 2. Table: notifications
-- Add orderId, catererId, and read columns
-- ===================================================
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "catererId" UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT false;

-- ===================================================
-- 3. Table: orders
-- Add missing metadata columns including address, venue, and fee fields
-- ===================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "venue" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "guests" INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "totalEstimate" NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "pricePerPlate" NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "platformFee" NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "selectedItems" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "packageDetails" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "matchedSlab" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "specialNotes" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "statusHistory" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ;

-- ===================================================
-- 4. Table: audit_logs
-- Add by column to trace entity operations
-- ===================================================
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS "by" TEXT;

-- ===================================================
-- 4.5 REFINED ROW LEVEL SECURITY (RLS) & TRIGGERS
-- ===================================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caterer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Table Role Escalation Trigger Guard
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

-- 2. Refined Caterer Registrations Policies
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

-- 3. Refined Food Images Policies
DROP POLICY IF EXISTS "Allow insert/update/delete for everyone/admin" ON public.food_images;
DROP POLICY IF EXISTS "Allow admins to manage food images" ON public.food_images;
CREATE POLICY "Allow admins to manage food images" ON public.food_images
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 4. Refined Orders Policies
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

-- 5. Refined Audit Logs Policies
DROP POLICY IF EXISTS "Allow insert/select on audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow anyone to insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow only admins to select audit logs" ON public.audit_logs;

CREATE POLICY "Allow anyone to insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow only admins to select audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- 6. Refined Notifications Policies
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

-- ===================================================
-- 5. Notify the database to refresh schema cache
-- ===================================================
NOTIFY pgrst, 'reload schema';

-- ===================================================
-- 6. SQL VERIFICATION QUERY FOR EACH TABLE
-- ===================================================
-- Run these individual queries to verify all columns exist

-- Verification for public.caterer_registrations
SELECT id, phone, "alternatePhone", "additionalPhone" 
FROM public.caterer_registrations 
LIMIT 1;

-- Verification for public.notifications
SELECT id, "orderId", "catererId", "read" 
FROM public.notifications 
LIMIT 1;

-- Verification for public.orders
SELECT id, venue, address, "eventType", "guestCount", guests, "totalAmount", "totalEstimate" 
FROM public.orders 
LIMIT 1;

-- Verification for public.audit_logs
SELECT id, "timestamp", action, details, user_email, role, "by" 
FROM public.audit_logs 
LIMIT 1;

-- ===================================================
-- 7. Phase 1 Database Migration: New Caterer Details
-- ===================================================
ALTER TABLE public.caterer_registrations 
  ADD COLUMN IF NOT EXISTS "experience" INTEGER,
  ADD COLUMN IF NOT EXISTS "eventsCompleted" INTEGER,
  ADD COLUMN IF NOT EXISTS "awards" TEXT,
  ADD COLUMN IF NOT EXISTS "certifications" TEXT,
  ADD COLUMN IF NOT EXISTS "brandName" TEXT,
  ADD COLUMN IF NOT EXISTS "tagline" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "operatingHours" TEXT,
  ADD COLUMN IF NOT EXISTS "branches" INTEGER,
  ADD COLUMN IF NOT EXISTS "serviceAreas" TEXT,
  ADD COLUMN IF NOT EXISTS "pendingUpdates" JSONB,
  ADD COLUMN IF NOT EXISTS "menuCount" INTEGER,
  ADD COLUMN IF NOT EXISTS "branchesList" JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "achievements" JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS "platformFeePerPlate" NUMERIC;

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    "platformFeePerPlate" NUMERIC DEFAULT 2,
    "homepage_mode" TEXT NOT NULL DEFAULT 'classic'
);

ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS "homepage_mode" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE public.platform_settings ALTER COLUMN "homepage_mode" SET DEFAULT 'classic';
UPDATE public.platform_settings SET "homepage_mode" = 'classic' WHERE "homepage_mode" IS NULL;
ALTER TABLE public.platform_settings ALTER COLUMN "homepage_mode" SET NOT NULL;

ALTER TABLE public.caterer_registrations 
  ADD COLUMN IF NOT EXISTS "latitude" NUMERIC,
  ADD COLUMN IF NOT EXISTS "longitude" NUMERIC;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS "latitude" NUMERIC,
  ADD COLUMN IF NOT EXISTS "longitude" NUMERIC;

INSERT INTO public.platform_settings (id, "platformFeePerPlate", "homepage_mode")
VALUES ('default', 2, 'classic')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings DISABLE ROW LEVEL SECURITY;

-- ===================================================
-- 10. Platform Badges & Caterer Badges
-- ===================================================

CREATE TABLE IF NOT EXISTS public.platform_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    icon TEXT,
    style_variant TEXT NOT NULL DEFAULT 'emerald' CHECK (style_variant IN ('emerald', 'amber', 'gold', 'blue', 'purple', 'rose')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.caterer_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caterer_id UUID NOT NULL REFERENCES public.caterer_registrations(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.platform_badges(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID,
    UNIQUE(caterer_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_caterer_badges_caterer_id ON public.caterer_badges(caterer_id);
CREATE INDEX IF NOT EXISTS idx_caterer_badges_badge_id ON public.caterer_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_platform_badges_is_active ON public.platform_badges(is_active);

-- Enable RLS
ALTER TABLE public.platform_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caterer_badges ENABLE ROW LEVEL SECURITY;

-- Public can read active platform badges
DROP POLICY IF EXISTS "Allow public read of active badges" ON public.platform_badges;
CREATE POLICY "Allow public read of active badges" 
ON public.platform_badges FOR SELECT 
USING (is_active = TRUE OR auth.role() = 'authenticated');

-- Service role & Admin full access on platform_badges
DROP POLICY IF EXISTS "Allow admin full access on platform_badges" ON public.platform_badges;
CREATE POLICY "Allow admin full access on platform_badges" 
ON public.platform_badges FOR ALL 
USING (true)
WITH CHECK (true);

-- Public can read caterer badges assignments
DROP POLICY IF EXISTS "Allow public read of caterer_badges" ON public.caterer_badges;
CREATE POLICY "Allow public read of caterer_badges" 
ON public.caterer_badges FOR SELECT 
USING (true);

-- Service role & Admin full access on caterer_badges
DROP POLICY IF EXISTS "Allow admin full access on caterer_badges" ON public.caterer_badges;
CREATE POLICY "Allow admin full access on caterer_badges" 
ON public.caterer_badges FOR ALL 
USING (true)
WITH CHECK (true);

-- Seed Initial Platform Badges
INSERT INTO public.platform_badges (slug, label, icon, style_variant, is_active, display_order)
VALUES 
    ('verified', 'Verified', 'Check', 'emerald', TRUE, 1),
    ('premium-partner', 'Premium Partner', 'Sparkles', 'amber', TRUE, 2),
    ('featured', 'Featured', 'Star', 'gold', TRUE, 3),
    ('top-rated', 'Top Rated', 'Award', 'blue', TRUE, 4),
    ('trusted', 'Trusted', 'ShieldCheck', 'emerald', TRUE, 5),
    ('new', 'New', 'Tag', 'purple', TRUE, 6),
    ('best-value', 'Best Value', 'Percent', 'rose', TRUE, 7),
    ('editors-choice', 'Editor''s Choice', 'Crown', 'gold', TRUE, 8)
ON CONFLICT (slug) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    style_variant = EXCLUDED.style_variant,
    display_order = EXCLUDED.display_order;

-- Migration: Preserve existing verified and premium partner status for current approved caterers
DO $$
DECLARE
    verified_badge_id UUID;
    premium_badge_id UUID;
    caterer_rec RECORD;
BEGIN
    SELECT id INTO verified_badge_id FROM public.platform_badges WHERE slug = 'verified';
    SELECT id INTO premium_badge_id FROM public.platform_badges WHERE slug = 'premium-partner';

    -- Assign to all current approved caterers to preserve current visual display
    IF verified_badge_id IS NOT NULL THEN
        FOR caterer_rec IN SELECT id FROM public.caterer_registrations WHERE status = 'Approved' LOOP
            INSERT INTO public.caterer_badges (caterer_id, badge_id)
            VALUES (caterer_rec.id, verified_badge_id)
            ON CONFLICT (caterer_id, badge_id) DO NOTHING;
            
            IF premium_badge_id IS NOT NULL THEN
                INSERT INTO public.caterer_badges (caterer_id, badge_id)
                VALUES (caterer_rec.id, premium_badge_id)
                ON CONFLICT (caterer_id, badge_id) DO NOTHING;
            END IF;
        END LOOP;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';


