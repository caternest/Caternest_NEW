import { PlatformBadge, CatererBadgeAssignment, SEED_PLATFORM_BADGES } from './badgeUtils';

const API_BASE = '/api';

// In-memory fallback if backend is momentarily unreachable
let cachedBadges: PlatformBadge[] = [];
let cachedCatererBadges: Record<string, PlatformBadge[]> = {};

/**
 * Fetch all platform badges. If activeOnly is true, returns only active badges.
 */
export async function fetchPlatformBadges(activeOnly: boolean = false): Promise<PlatformBadge[]> {
  try {
    const url = `${API_BASE}/badges${activeOnly ? '?active=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch badges: ${res.statusText}`);
    }
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      cachedBadges = json.data;
      return json.data;
    }
  } catch (err) {
    console.warn('[BADGE API] Error fetching badges from backend, using fallback:', err);
  }

  // Fallback to cached or seed badges
  if (cachedBadges.length > 0) {
    return activeOnly ? cachedBadges.filter(b => b.is_active) : cachedBadges;
  }

  // Seed fallback
  const mockSeed: PlatformBadge[] = SEED_PLATFORM_BADGES.map((b, idx) => ({
    ...b,
    id: `seed-badge-${b.slug}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    display_order: idx + 1
  }));
  cachedBadges = mockSeed;
  return activeOnly ? mockSeed.filter(b => b.is_active) : mockSeed;
}

/**
 * Fetch a mapping of catererId -> PlatformBadge[] for all caterers
 */
export async function fetchCatererBadgesMap(): Promise<Record<string, PlatformBadge[]>> {
  try {
    const res = await fetch(`${API_BASE}/caterer-badges`);
    if (!res.ok) {
      throw new Error(`Failed to fetch caterer badges map: ${res.statusText}`);
    }
    const json = await res.json();
    if (json.success && json.data) {
      cachedCatererBadges = json.data;
      return json.data;
    }
  } catch (err) {
    console.warn('[BADGE API] Error fetching caterer badges map:', err);
  }
  return cachedCatererBadges;
}

/**
 * Fetch badges assigned to a specific caterer
 */
export async function fetchBadgesForCaterer(catererId: string): Promise<PlatformBadge[]> {
  try {
    const res = await fetch(`${API_BASE}/caterers/${encodeURIComponent(catererId)}/badges`);
    if (!res.ok) {
      throw new Error(`Failed to fetch badges for caterer: ${res.statusText}`);
    }
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn(`[BADGE API] Error fetching badges for caterer ${catererId}:`, err);
  }

  // Fallback to cache map
  return cachedCatererBadges[catererId] || [];
}

/**
 * Admin: Create a new platform badge definition
 */
export async function createPlatformBadge(
  badge: {
    slug: string;
    label: string;
    icon?: string;
    style_variant: string;
    is_active?: boolean;
    display_order?: number;
  },
  token: string
): Promise<{ success: boolean; data?: PlatformBadge; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/badges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(badge)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to create badge' };
    }
    // Invalidate local cache
    cachedBadges = [];
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Admin: Update an existing platform badge
 */
export async function updatePlatformBadge(
  id: string,
  updates: {
    label?: string;
    icon?: string;
    style_variant?: string;
    is_active?: boolean;
    display_order?: number;
  },
  token: string
): Promise<{ success: boolean; data?: PlatformBadge; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/badges/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to update badge' };
    }
    // Invalidate local cache
    cachedBadges = [];
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Admin: Assign a badge to an individual caterer
 */
export async function assignBadgeToCaterer(
  catererId: string,
  badgeId: string,
  token: string
): Promise<{ success: boolean; data?: CatererBadgeAssignment; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/admin/caterers/${encodeURIComponent(catererId)}/badges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ badge_id: badgeId })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to assign badge' };
    }
    // Invalidate caterer badge map cache
    cachedCatererBadges = {};
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Admin: Remove a badge from an individual caterer
 */
export async function removeBadgeFromCaterer(
  catererId: string,
  badgeId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/admin/caterers/${encodeURIComponent(catererId)}/badges/${encodeURIComponent(badgeId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to remove badge' };
    }
    // Invalidate caterer badge map cache
    cachedCatererBadges = {};
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
