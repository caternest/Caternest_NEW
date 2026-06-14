-- CONSOLIDATED SUPABASE SCHEMA MIGRATION SCRIPT
-- Copy and run this script in the Supabase SQL Editor to resolve all schema mismatch warnings.

-- ===================================================
-- 1. Table: caterer_registrations
-- Add alternatePhone and additionalPhone text columns
-- ===================================================
ALTER TABLE public.caterer_registrations ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;
ALTER TABLE public.caterer_registrations ADD COLUMN IF NOT EXISTS "additionalPhone" TEXT;

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
