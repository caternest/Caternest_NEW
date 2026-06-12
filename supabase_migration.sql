-- CONSOLIDATED SUPABASE SCHEMA MIGRATION SCRIPT
-- Copy and run this script in the Supabase SQL Editor to add any missing columns 
-- to your existing 'orders' table, instantly matching the client-side payload properties.

-- 1. Add core missing metadata columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "venue" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "guests" INTEGER;

-- 2. Add pricing & financial audit columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "totalEstimate" NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "pricePerPlate" NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "platformFee" NUMERIC;

-- 3. Add rich details and configurations columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "selectedItems" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "packageDetails" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "matchedSlab" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "specialNotes" TEXT;

-- 4. Add admin / backoffice workflow columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "statusHistory" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ;

-- 5. Notify the database to refresh schema cache for these tables
NOTIFY pgrst, 'reload schema';
