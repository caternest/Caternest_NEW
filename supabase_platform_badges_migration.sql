-- ==============================================================================
-- PLANMYCHOICE: DYNAMIC ADMIN-CONTROLLED PLATFORM BADGES MIGRATION
-- ==============================================================================

-- 1. Create table for Platform Badge definitions
CREATE TABLE IF NOT EXISTS public.platform_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    icon TEXT,
    style_variant TEXT NOT NULL DEFAULT 'emerald',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create junction table for Caterer Badge assignments
CREATE TABLE IF NOT EXISTS public.caterer_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caterer_id UUID NOT NULL REFERENCES public.caterer_registrations(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.platform_badges(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by TEXT,
    UNIQUE(caterer_id, badge_id)
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_caterer_badges_caterer_id ON public.caterer_badges(caterer_id);
CREATE INDEX IF NOT EXISTS idx_caterer_badges_badge_id ON public.caterer_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_platform_badges_active ON public.platform_badges(is_active, display_order);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.platform_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caterer_badges ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: platform_badges
DROP POLICY IF EXISTS "Allow public read active platform badges" ON public.platform_badges;
CREATE POLICY "Allow public read active platform badges"
ON public.platform_badges
FOR SELECT
USING (
  is_active = true 
  OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow admin manage platform badges" ON public.platform_badges;
CREATE POLICY "Allow admin manage platform badges"
ON public.platform_badges
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. RLS Policies: caterer_badges
DROP POLICY IF EXISTS "Allow public read caterer badges" ON public.caterer_badges;
CREATE POLICY "Allow public read caterer badges"
ON public.caterer_badges
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow admin manage caterer badges" ON public.caterer_badges;
CREATE POLICY "Allow admin manage caterer badges"
ON public.caterer_badges
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 7. Seed initial platform badges
INSERT INTO public.platform_badges (slug, label, icon, style_variant, is_active, display_order)
VALUES
    ('verified', 'Verified', 'Check', 'emerald', true, 1),
    ('premium-partner', 'Premium Partner', 'Sparkles', 'amber', true, 2),
    ('featured', 'Featured', 'Star', 'gold', true, 3),
    ('top-rated', 'Top Rated', 'Award', 'blue', true, 4),
    ('trusted', 'Trusted', 'ShieldCheck', 'emerald', true, 5),
    ('new', 'New', 'Tag', 'purple', true, 6),
    ('best-value', 'Best Value', 'Percent', 'rose', true, 7),
    ('editors-choice', 'Editor''s Choice', 'Crown', 'gold', true, 8)
ON CONFLICT (slug) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    style_variant = EXCLUDED.style_variant,
    display_order = EXCLUDED.display_order;

-- 8. Migration of existing approved caterers:
-- Preserves current visible behavior by assigning 'verified' and 'premium-partner' to existing approved caterers
DO $$
DECLARE
    v_badge_verified UUID;
    v_badge_premium UUID;
BEGIN
    SELECT id INTO v_badge_verified FROM public.platform_badges WHERE slug = 'verified' LIMIT 1;
    SELECT id INTO v_badge_premium FROM public.platform_badges WHERE slug = 'premium-partner' LIMIT 1;

    IF v_badge_verified IS NOT NULL THEN
        INSERT INTO public.caterer_badges (caterer_id, badge_id, assigned_by)
        SELECT id, v_badge_verified, 'system_migration'
        FROM public.caterer_registrations
        WHERE status = 'Approved'
        ON CONFLICT (caterer_id, badge_id) DO NOTHING;
    END IF;

    IF v_badge_premium IS NOT NULL THEN
        INSERT INTO public.caterer_badges (caterer_id, badge_id, assigned_by)
        SELECT id, v_badge_premium, 'system_migration'
        FROM public.caterer_registrations
        WHERE status = 'Approved'
        ON CONFLICT (caterer_id, badge_id) DO NOTHING;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
