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
