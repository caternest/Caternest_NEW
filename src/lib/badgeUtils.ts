import React from 'react';
import {
  Check,
  Sparkles,
  Star,
  Award,
  ShieldCheck,
  Tag,
  Percent,
  Crown,
  Zap,
  Heart,
  Flame,
  BadgeCheck,
  CheckCircle2,
  Bookmark,
  Coffee,
  ThumbsUp,
  LucideIcon
} from 'lucide-react';

export type BadgeStyleVariant = 'emerald' | 'amber' | 'gold' | 'blue' | 'purple' | 'rose';

export interface PlatformBadge {
  id: string;
  slug: string;
  label: string;
  icon?: string | null;
  style_variant: BadgeStyleVariant;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CatererBadgeAssignment {
  id: string;
  caterer_id: string;
  badge_id: string;
  assigned_at?: string;
  assigned_by?: string | null;
  badge?: PlatformBadge;
}

export const ALLOWED_STYLE_VARIANTS: BadgeStyleVariant[] = [
  'emerald',
  'amber',
  'gold',
  'blue',
  'purple',
  'rose'
];

export const VALID_BADGE_STYLES = ALLOWED_STYLE_VARIANTS;

export const STYLE_VARIANT_CONFIG: Record<
  BadgeStyleVariant,
  {
    name: string;
    // For desktop card inside caterer listing
    desktopClasses: string;
    // For mobile overlay card
    mobileClasses: string;
    // For CatererDetails header/badges
    detailsClasses: string;
    // For Admin preview chips
    adminChipClasses: string;
    // Visual dot color
    dotColor: string;
  }
> = {
  emerald: {
    name: 'Emerald (Verified / Trusted)',
    desktopClasses: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    mobileClasses: 'bg-emerald-600/90 text-white',
    detailsClasses: 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs',
    adminChipClasses: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    dotColor: '#059669'
  },
  amber: {
    name: 'Amber (Premium Partner)',
    desktopClasses: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    mobileClasses: 'bg-[#DEAA38]/95 text-white',
    detailsClasses: 'bg-amber-50 text-amber-900 border border-amber-200 shadow-xs',
    adminChipClasses: 'bg-amber-50 text-amber-800 border border-amber-200',
    dotColor: '#D97706'
  },
  gold: {
    name: 'Gold (Featured / Editor Choice)',
    desktopClasses: 'bg-yellow-50 text-amber-900 border border-yellow-300/80',
    mobileClasses: 'bg-[#B4831B]/95 text-white',
    detailsClasses: 'bg-yellow-50/90 text-amber-900 border border-[#D4AF37]/50 shadow-xs',
    adminChipClasses: 'bg-yellow-50 text-amber-900 border border-yellow-300',
    dotColor: '#B4831B'
  },
  blue: {
    name: 'Blue (Top Rated / Certified)',
    desktopClasses: 'bg-blue-50 text-blue-800 border border-blue-200/80',
    mobileClasses: 'bg-blue-600/90 text-white',
    detailsClasses: 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs',
    adminChipClasses: 'bg-blue-50 text-blue-800 border border-blue-200',
    dotColor: '#2563EB'
  },
  purple: {
    name: 'Purple (New / Exclusive)',
    desktopClasses: 'bg-purple-50 text-purple-800 border border-purple-200/80',
    mobileClasses: 'bg-purple-600/90 text-white',
    detailsClasses: 'bg-purple-50 text-purple-800 border border-purple-200 shadow-xs',
    adminChipClasses: 'bg-purple-50 text-purple-800 border border-purple-200',
    dotColor: '#9333EA'
  },
  rose: {
    name: 'Rose (Best Value / Popular)',
    desktopClasses: 'bg-rose-50 text-rose-800 border border-rose-200/80',
    mobileClasses: 'bg-rose-600/90 text-white',
    detailsClasses: 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs',
    adminChipClasses: 'bg-rose-50 text-rose-800 border border-rose-200',
    dotColor: '#E11D48'
  }
};

export const AVAILABLE_BADGE_ICONS: Record<string, LucideIcon> = {
  Check,
  Sparkles,
  Star,
  Award,
  ShieldCheck,
  Tag,
  Percent,
  Crown,
  Zap,
  Heart,
  Flame,
  BadgeCheck,
  CheckCircle2,
  Bookmark,
  Coffee,
  ThumbsUp
};

export const AVAILABLE_ICONS = Object.entries(AVAILABLE_BADGE_ICONS).map(([name, icon]) => ({
  name,
  icon
}));

export const SEED_PLATFORM_BADGES: Omit<PlatformBadge, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    slug: 'verified',
    label: 'Verified',
    icon: 'Check',
    style_variant: 'emerald',
    is_active: true,
    display_order: 1
  },
  {
    slug: 'premium-partner',
    label: 'Premium Partner',
    icon: 'Sparkles',
    style_variant: 'amber',
    is_active: true,
    display_order: 2
  },
  {
    slug: 'featured',
    label: 'Featured',
    icon: 'Star',
    style_variant: 'gold',
    is_active: true,
    display_order: 3
  },
  {
    slug: 'top-rated',
    label: 'Top Rated',
    icon: 'Award',
    style_variant: 'blue',
    is_active: true,
    display_order: 4
  },
  {
    slug: 'trusted',
    label: 'Trusted',
    icon: 'ShieldCheck',
    style_variant: 'emerald',
    is_active: true,
    display_order: 5
  },
  {
    slug: 'new',
    label: 'New',
    icon: 'Tag',
    style_variant: 'purple',
    is_active: true,
    display_order: 6
  },
  {
    slug: 'best-value',
    label: 'Best Value',
    icon: 'Percent',
    style_variant: 'rose',
    is_active: true,
    display_order: 7
  },
  {
    slug: 'editors-choice',
    label: "Editor's Choice",
    icon: 'Crown',
    style_variant: 'gold',
    is_active: true,
    display_order: 8
  }
];

export function getBadgeIconComponent(iconName?: string | null): LucideIcon {
  if (!iconName) return Check;
  return AVAILABLE_BADGE_ICONS[iconName] || Check;
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const BADGE_STYLE_LABELS: Record<string, string> = {
  emerald: 'Emerald (Verified / Trusted)',
  amber: 'Amber (Premium Partner)',
  gold: 'Gold (Featured / Editor Choice)',
  blue: 'Blue (Top Rated / Certified)',
  purple: 'Purple (New / Exclusive)',
  rose: 'Rose (Best Value / Popular)'
};

export function getDesktopBadgeClasses(variant?: string | null): string {
  const v = (variant || 'emerald') as BadgeStyleVariant;
  return STYLE_VARIANT_CONFIG[v]?.desktopClasses || STYLE_VARIANT_CONFIG.emerald.desktopClasses;
}

export function getMobileBadgeClasses(variant?: string | null): string {
  const v = (variant || 'emerald') as BadgeStyleVariant;
  return STYLE_VARIANT_CONFIG[v]?.mobileClasses || STYLE_VARIANT_CONFIG.emerald.mobileClasses;
}

export function DynamicBadgeIcon({ name, size = 12, className = '' }: { name?: string | null; size?: number; className?: string }) {
  const IconComp = getBadgeIconComponent(name);
  return React.createElement(IconComp, { size, className: `shrink-0 stroke-[2.5] ${className}` });
}
