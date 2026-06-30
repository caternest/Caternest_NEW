/**
 * CaterNest Premium Location Intelligence Module
 * Provides smart multi-source search, Hyderabad-first prioritization, typo tolerance,
 * ranking, caches, distance calculation, driving time estimation, and favorite management.
 */

export interface LocationResult {
  id: string;
  display_name: string;
  mainLabel: string;
  subLabel: string;
  latitude: number;
  longitude: number;
  rank: number; // 1 to 5 stars
  type?: string;
  source: 'photon' | 'nominatim' | 'geoapify' | 'local';
}

export interface FavoriteLocation {
  id: string;
  label: string; // "Home", "Office", etc.
  icon: string; // "🏠", "🏢", etc.
  address: string;
  latitude: number;
  longitude: number;
}

// Typo correction map for Hyderabad neighborhoods
const TYPO_MAP: { [key: string]: string } = {
  madapur: "Madhapur",
  madhpur: "Madhapur",
  gachiboli: "Gachibowli",
  gachibowly: "Gachibowli",
  "jubli hills": "Jubilee Hills",
  jubli: "Jubilee Hills",
  kondapr: "Kondapur",
  kondapoor: "Kondapur",
  kukatpali: "Kukatpally",
  kukkatpally: "Kukatpally",
  miyapr: "Miyapur",
  secunderbad: "Secunderabad",
  hitech: "Hitec City",
  begumpet: "Begumpet",
  charminar: "Charminar",
  banjara: "Banjara Hills",
  somajiguda: "Somajiguda",
  dlf: "DLF Cyber City"
};

// Local Hyderabad database fallback and fast search
export const LOCAL_HYDERABAD_LOCATIONS = [
  {
    id: "loc_madhapur",
    display_name: "Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Madhapur",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4483,
    lon: 78.3915
  },
  {
    id: "loc_madhapur_metro",
    display_name: "Madhapur Metro Station, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Madhapur Metro Station",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4424,
    lon: 78.3962
  },
  {
    id: "loc_inorbit",
    display_name: "Inorbit Mall, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Inorbit Mall",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4345,
    lon: 78.3867
  },
  {
    id: "loc_kondapur",
    display_name: "Kondapur, Hyderabad, Telangana, 500084, India",
    mainLabel: "Kondapur",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4622,
    lon: 78.3568
  },
  {
    id: "loc_gachibowli",
    display_name: "Gachibowli, Hyderabad, Telangana, 500032, India",
    mainLabel: "Gachibowli",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4401,
    lon: 78.3489
  },
  {
    id: "loc_jubilee_hills",
    display_name: "Jubilee Hills, Hyderabad, Telangana, 500033, India",
    mainLabel: "Jubilee Hills",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4325,
    lon: 78.4071
  },
  {
    id: "loc_banjara_hills",
    display_name: "Banjara Hills, Hyderabad, Telangana, 500034, India",
    mainLabel: "Banjara Hills",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4165,
    lon: 78.4347
  },
  {
    id: "loc_hitech_city",
    display_name: "Hitec City, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Hitec City",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4504,
    lon: 78.3808
  },
  {
    id: "loc_secunderabad",
    display_name: "Secunderabad, Hyderabad, Telangana, 500003, India",
    mainLabel: "Secunderabad",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4399,
    lon: 78.4983
  },
  {
    id: "loc_charminar",
    display_name: "Charminar, Hyderabad, Telangana, 500002, India",
    mainLabel: "Charminar",
    subLabel: "Hyderabad, India",
    lat: 17.3616,
    lon: 78.4747
  },
  {
    id: "loc_dlf",
    display_name: "DLF Cyber City, Gachibowli, Hyderabad, Telangana, 500032, India",
    mainLabel: "DLF Cyber City",
    subLabel: "Gachibowli, Hyderabad, India",
    lat: 17.4474,
    lon: 78.3575
  },
  {
    id: "loc_ikea",
    display_name: "IKEA Hyderabad, Hitec City, Hyderabad, Telangana, 500081, India",
    mainLabel: "IKEA Hyderabad",
    subLabel: "Hitec City, Hyderabad, India",
    lat: 17.4385,
    lon: 78.3745
  }
];

// Response cache to speed up searches
const searchCache = new Map<string, LocationResult[]>();
let activeAbortController: AbortController | null = null;

/**
 * Normalizes and corrects typos in search string
 */
export function correctTypos(query: string): string {
  let cleaned = query.toLowerCase().trim();
  Object.keys(TYPO_MAP).forEach((typo) => {
    const regex = new RegExp(`\\b${typo}\\b`, "gi");
    cleaned = cleaned.replace(regex, TYPO_MAP[typo]);
  });
  return cleaned;
}

/**
 * Priorities scoring: Hyderabad & Telangana first
 */
export function getPriorityScore(displayName: string): number {
  const lower = displayName.toLowerCase();
  let score = 0;
  if (lower.includes('hyderabad')) score += 500;
  if (lower.includes('secunderabad')) score += 400;
  if (lower.includes('telangana')) score += 300;
  if (lower.includes('india')) score += 100;
  return score;
}

/**
 * Rank based on place type: Building > Apartment > Business > Function Hall > Restaurant > Hospital > School > Colony > Road > Area
 */
export function rankLocation(displayName: string, type: string = ""): number {
  const lowerName = displayName.toLowerCase();
  const lowerType = type.toLowerCase();

  // ★★★★★ Building, Apartment, Business
  if (
    lowerName.includes("building") || lowerName.includes("residency") || lowerName.includes("villas") || 
    lowerName.includes("apartment") || lowerName.includes("heights") || lowerName.includes("tower") ||
    lowerType.includes("building") || lowerType.includes("apartment") || lowerType.includes("residential")
  ) {
    return 5;
  }
  if (
    lowerName.includes("business") || lowerName.includes("office") || lowerName.includes("pvt") || 
    lowerName.includes("ltd") || lowerName.includes("corp") || lowerName.includes("tech") ||
    lowerType.includes("office") || lowerType.includes("commercial")
  ) {
    return 5;
  }

  // ★★★★ Function Hall, Restaurant, Hospital, School
  if (
    lowerName.includes("function hall") || lowerName.includes("marriage hall") || 
    lowerName.includes("convention") || lowerName.includes("gardens") || lowerName.includes("venue")
  ) {
    return 4;
  }
  if (
    lowerName.includes("restaurant") || lowerName.includes("hotel") || lowerName.includes("cafe") || 
    lowerName.includes("food") || lowerName.includes("dine") || lowerName.includes("biryani") ||
    lowerType.includes("restaurant") || lowerType.includes("cafe")
  ) {
    return 4;
  }
  if (lowerName.includes("hospital") || lowerName.includes("clinic") || lowerName.includes("medical") || lowerType.includes("hospital")) {
    return 4;
  }
  if (lowerName.includes("school") || lowerName.includes("college") || lowerName.includes("university") || lowerName.includes("academy") || lowerType.includes("school") || lowerType.includes("education")) {
    return 4;
  }

  // ★★★ Colony, Road
  if (
    lowerName.includes("colony") || lowerName.includes("enclave") || lowerName.includes("society") || 
    lowerName.includes("nagar") || lowerName.includes("phase") || lowerName.includes("sector") ||
    lowerName.includes("road") || lowerName.includes("street") || lowerName.includes("lane") || 
    lowerName.includes("highway") || lowerName.includes("rd") || lowerType.includes("highway") || lowerType.includes("road")
  ) {
    return 3;
  }

  // ★★ Area / City / Suburb
  return 2;
}

/**
 * Smart Multi-Source Search using Photon + Nominatim + Geoapify (Graceful free tier / fallback)
 */
export async function searchLocations(query: string): Promise<LocationResult[]> {
  const corrected = correctTypos(query);
  if (!corrected || corrected.length < 2) {
    return [];
  }

  // Check cache first
  if (searchCache.has(corrected)) {
    return searchCache.get(corrected) || [];
  }

  // Cancel previous running request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  const { signal } = activeAbortController;

  const results: LocationResult[] = [];

  // Match local high-fidelity database first
  const searchTerms = corrected.toLowerCase().split(/\s+/).filter(Boolean);
  const localMatches = LOCAL_HYDERABAD_LOCATIONS.filter(loc => {
    const matchText = `${loc.display_name} ${loc.mainLabel} ${loc.subLabel}`.toLowerCase();
    return searchTerms.every(term => matchText.includes(term));
  }).map(loc => ({
    id: loc.id,
    display_name: loc.display_name,
    mainLabel: loc.mainLabel,
    subLabel: loc.subLabel,
    latitude: loc.lat,
    longitude: loc.lon,
    rank: rankLocation(loc.display_name),
    source: 'local' as const
  }));
  results.push(...localMatches);

  // Prep bounded search query
  let apiQuery = corrected;
  if (!/hyderabad|telangana|secunderabad/i.test(apiQuery)) {
    apiQuery += ", Hyderabad, Telangana, India";
  }

  try {
    // 1. Fetch from Photon API (Fast, built-in typo tolerance, free)
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(apiQuery)}&limit=10&lat=17.44&lon=78.39`;
    const photonPromise = fetch(photonUrl, { signal }).then(async r => {
      if (r.ok) {
        const data = await r.json();
        if (data && Array.isArray(data.features)) {
          data.features.forEach((feat: any) => {
            const props = feat.properties || {};
            const coords = feat.geometry?.coordinates || [];
            if (coords.length >= 2) {
              const lon = coords[0];
              const lat = coords[1];

              const name = props.name || props.street || "";
              if (!name) return;

              // Construct proper display name
              const parts = [
                name,
                props.district || props.city || "",
                props.state || "Telangana",
                props.country || "India"
              ].filter(Boolean);
              const displayName = parts.join(", ");

              const mainLabel = name;
              const subLabel = [props.district || props.city || "", "Telangana", "India"].filter(Boolean).join(", ");

              results.push({
                id: `photon_${props.osm_id || Math.random().toString()}`,
                display_name: displayName,
                mainLabel,
                subLabel,
                latitude: lat,
                longitude: lon,
                rank: rankLocation(displayName, props.osm_value || props.type || ""),
                type: props.osm_value || props.type || "",
                source: 'photon'
              });
            }
          });
        }
      }
    }).catch(err => {
      if (err.name !== 'AbortError') console.warn("Photon API fetch failed", err);
    });

    // 2. Fetch from Nominatim (Strict boundary region first)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(apiQuery)}&countrycodes=in&viewbox=78.2,17.6,78.7,17.2&bounded=1&limit=6&addressdetails=1`;
    const nominatimPromise = fetch(nominatimUrl, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'CaterNest-Premium-Location-Intelligence'
      },
      signal
    }).then(async r => {
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const displayName = item.display_name;
            const parts = displayName.split(',');
            const mainLabel = parts[0] || '';
            const subLabel = parts.slice(1, 4).map((p: string) => p.trim()).join(', ');

            results.push({
              id: `nominatim_${item.place_id || Math.random().toString()}`,
              display_name: displayName,
              mainLabel,
              subLabel,
              latitude: lat,
              longitude: lon,
              rank: rankLocation(displayName, item.type || item.class || ""),
              type: item.type || item.class || "",
              source: 'nominatim'
            });
          });
        }
      }
    }).catch(err => {
      if (err.name !== 'AbortError') console.warn("Nominatim API fetch failed", err);
    });

    // Run APIs in parallel
    await Promise.allSettled([photonPromise, nominatimPromise]);

  } catch (globalErr) {
    console.error("Multi-source geocoding fetch failed", globalErr);
  }

  // Filter out exact duplicates by checking distance < 50 meters or exact display_name
  const uniqueResults: LocationResult[] = [];
  results.forEach(res => {
    const isDuplicate = uniqueResults.some(u => 
      u.display_name.toLowerCase() === res.display_name.toLowerCase() ||
      (Math.abs(u.latitude - res.latitude) < 0.0005 && Math.abs(u.longitude - res.longitude) < 0.0005)
    );
    if (!isDuplicate) {
      uniqueResults.push(res);
    }
  });

  // Sort by combination of priority (Hyderabad first) and place-type rank
  uniqueResults.sort((a, b) => {
    const priorityA = getPriorityScore(a.display_name);
    const priorityB = getPriorityScore(b.display_name);

    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Hyderabad first
    }

    // Then rank stars
    return b.rank - a.rank;
  });

  const finalSlice = uniqueResults.slice(0, 8);
  searchCache.set(corrected, finalSlice);
  return finalSlice;
}

/**
 * Reverse Geocode coordinates to Address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; mainLabel: string; subLabel: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "CaterNest-Premium-Reverse-Geocode",
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        const mainLabel = parts[0]?.trim() || "Selected Location";
        const subLabel = parts.slice(1, 4).map((p: any) => p.trim()).join(", ");
        return {
          address: data.display_name,
          mainLabel,
          subLabel
        };
      }
    }
  } catch (err) {
    console.warn("Reverse geocode failed, using lat/lng fallback", err);
  }

  const coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  return {
    address: coords,
    mainLabel: coords,
    subLabel: "Hyderabad, Telangana"
  };
}

/**
 * Saves a query to the user's recent searches (max 10)
 */
export function saveRecentSearch(query: string): void {
  if (!query || query.trim().length < 3) return;
  const cleaned = query.trim();
  try {
    const recents = getRecentSearches();
    const filtered = recents.filter(r => r.toLowerCase() !== cleaned.toLowerCase());
    filtered.unshift(cleaned);
    localStorage.setItem('caternest_recent_searches', JSON.stringify(filtered.slice(0, 10)));
  } catch (e) {
    console.error("Failed to save recent search", e);
  }
}

/**
 * Gets user's recent searches
 */
export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem('caternest_recent_searches');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse recent searches", e);
  }
  return [];
}

/**
 * Clears recent searches
 */
export function clearRecentSearches(): void {
  localStorage.removeItem('caternest_recent_searches');
}

/**
 * Save custom favorite locations
 */
export function saveFavoriteLocation(fav: FavoriteLocation): void {
  try {
    const favs = getFavoriteLocations();
    const filtered = favs.filter(f => f.id !== fav.id && f.label !== fav.label);
    filtered.push(fav);
    localStorage.setItem('caternest_favorites', JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to save favorite location", e);
  }
}

/**
 * Get saved favorite locations (with pre-populated defaults if empty)
 */
export function getFavoriteLocations(): FavoriteLocation[] {
  try {
    const raw = localStorage.getItem('caternest_favorites');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to parse favorites", e);
  }

  // Pre-populated premium defaults
  return [
    {
      id: "fav_home",
      label: "Home",
      icon: "🏠",
      address: "Madhapur, Hyderabad, Telangana, India",
      latitude: 17.4483,
      longitude: 78.3915
    },
    {
      id: "fav_office",
      label: "Office",
      icon: "🏢",
      address: "DLF Cyber City, Gachibowli, Hyderabad, Telangana, India",
      latitude: 17.4474,
      longitude: 78.3575
    }
  ];
}

/**
 * Calculates distance in KM using the Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

/**
 * Estimates driving time based on city traffic and distance
 */
export function estimateDrivingTimeMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  // ~25km/h speed in city including traffic signals (2.4 minutes per km) + 5 minutes baseline traffic buffer
  return Math.round(distanceKm * 2.2 + 5);
}
