import { createClient } from "@supabase/supabase-js";

// Safe helper to read environment keys whether we are on Vite client or Node.js server
export const getEnvWord = (key: string): string => {
  if (typeof process !== "undefined" && process?.env && process.env[key]) {
    return process.env[key] || "";
  }
  // Checking window context for Vite environment properties
  if (typeof window !== "undefined") {
    const win = window as any;
    if (win.importMetaEnv && win.importMetaEnv[key]) {
      return win.importMetaEnv[key];
    }
  }
  try {
    return ((import.meta as any).env as any)[key] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnvWord("VITE_SUPABASE_URL") || getEnvWord("SUPABASE_URL");
const supabaseAnonKey = getEnvWord("VITE_SUPABASE_ANON_KEY") || getEnvWord("SUPABASE_ANON_KEY");
const supabaseServiceKey = getEnvWord("SUPABASE_SERVICE_ROLE_KEY");

export const isSupabaseConfigured = !!(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseInstance) {
    const activeKey = supabaseServiceKey || supabaseAnonKey;
    supabaseInstance = createClient(supabaseUrl, activeKey);
  }
  return supabaseInstance;
}

// Helper to check if a bucket exists or upload file to Supabase storage
export async function uploadToSupabaseBucket(bucket: string, filePath: string, fileBody: any, fileType: string = 'image/jpeg') {
  try {
    console.log(`[STORAGE CLIENT LOGGER] Requesting signed URL. Bucket: ${bucket}, Path: ${filePath}, Type: ${fileType}`);

    // 1. Fetch pre-signed direct upload instruction from server
    const signRes = await fetch('/api/storage/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucket, filePath })
    });

    if (!signRes.ok) {
      const errText = await signRes.text();
      console.error(`[STORAGE CLIENT LOGGER] Failed to retrieve pre-signed URL for bucket ${bucket}:`, errText);
      return null;
    }

    const signJson = await signRes.json();
    const { signedUrl, publicUrl } = signJson;

    if (!signedUrl) {
      console.error(`[STORAGE CLIENT LOGGER] Storage returned empty signed URL configuration:`, signJson);
      return null;
    }

    console.log(`[STORAGE CLIENT LOGGER] Signed upload URL acquired. Uploading raw binary directly to Supabase storage...`);

    // 2. Transmit the raw binary file directly to S3/Supabase storage endpoint with PUT
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": fileType
      },
      body: fileBody
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`[STORAGE CLIENT LOGGER] Direct object storage PUT operation failed:`, errText);
      return null;
    }

    console.log(`[STORAGE CLIENT LOGGER] Direct client-to-bucket upload successful. Returning resolution URL: ${publicUrl}`);
    return publicUrl || null;
  } catch (error) {
    console.error(`[STORAGE CLIENT LOGGER] direct-client-upload execution crash under bucket ${bucket}:`, error);
    return null;
  }
}

// Synchronizes localized datasets to the Supabase Database if online
export async function syncLocalTableToSupabase(tableName: string, localData: any[]) {
  const supabase = getSupabase();
  if (!supabase || !localData || localData.length === 0) return;

  try {
    for (const item of localData) {
      const sanitized = { ...item };
      // Standardize timestamps into snake_case and remove camelCase copies to prevent warning/error
      if (sanitized.createdAt) {
        if (!sanitized.created_at) {
          sanitized.created_at = sanitized.createdAt;
        }
        delete sanitized.createdAt;
      }
      if (sanitized.updatedAt) {
        if (!sanitized.updated_at) {
          sanitized.updated_at = sanitized.updatedAt;
        }
        delete sanitized.updatedAt;
      }

      // Explicitly map orders schema fields bi-directionally to support both old and new layouts
      if (tableName === 'orders') {
        if (sanitized.phone && !sanitized.customerPhone) {
          sanitized.customerPhone = sanitized.phone;
        } else if (sanitized.customerPhone && !sanitized.phone) {
          sanitized.phone = sanitized.customerPhone;
        }

        if (sanitized.guests !== undefined && sanitized.guestCount === undefined) {
          sanitized.guestCount = sanitized.guests;
        } else if (sanitized.guestCount !== undefined && sanitized.guests === undefined) {
          sanitized.guests = sanitized.guestCount;
        }

        if (sanitized.totalEstimate !== undefined && sanitized.totalAmount === undefined) {
          sanitized.totalAmount = sanitized.totalEstimate;
        } else if (sanitized.totalAmount !== undefined && sanitized.totalEstimate === undefined) {
          sanitized.totalEstimate = sanitized.totalAmount;
        }

        if (sanitized.specialNotes && !sanitized.notes) {
          sanitized.notes = sanitized.specialNotes;
        } else if (sanitized.notes && !sanitized.specialNotes) {
          sanitized.specialNotes = sanitized.notes;
        }

        if (sanitized.selectedItems && !sanitized.items) {
          sanitized.items = sanitized.selectedItems;
        } else if (sanitized.items && !sanitized.selectedItems) {
          sanitized.selectedItems = sanitized.items;
        }
      }

      const { error } = await supabase
        .from(tableName)
        .upsert(sanitized, { onConflict: 'id' });
      
      if (error) {
        console.warn(`Supabase upsert warning on table "${tableName}":`, error.message);
      }
    }
  } catch (err) {
    console.error(`Failed to sync table "${tableName}":`, err);
  }
}

// Fetch complete dataset with fallback to local
export async function fetchWithSupabaseFallback(tableName: string, localStorageKey: string) {
  const localCached = localStorage.getItem(localStorageKey);
  const parsedLocal = localCached ? JSON.parse(localCached) : [];

  const supabase = getSupabase();
  if (!supabase) {
    return parsedLocal;
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      let finalData: any[] = data;
      // Map rich structure to fit both older and modern expectations in downstream caching
      if (tableName === 'orders') {
        finalData = data.map((item: any) => {
          const mapped = { ...item };
          if (mapped.customerPhone && !mapped.phone) mapped.phone = mapped.customerPhone;
          if (mapped.phone && !mapped.customerPhone) mapped.customerPhone = mapped.phone;

          if (mapped.guestCount !== undefined && mapped.guests === undefined) mapped.guests = mapped.guestCount;
          if (mapped.guests !== undefined && mapped.guestCount === undefined) mapped.guestCount = mapped.guests;

          if (mapped.totalAmount !== undefined && mapped.totalEstimate === undefined) mapped.totalEstimate = Number(mapped.totalAmount);
          if (mapped.totalEstimate !== undefined && mapped.totalAmount === undefined) mapped.totalAmount = mapped.totalEstimate;

          if (mapped.notes && !mapped.specialNotes) mapped.specialNotes = mapped.notes;
          if (mapped.specialNotes && !mapped.notes) mapped.notes = mapped.specialNotes;

          if (mapped.items && !mapped.selectedItems) mapped.selectedItems = mapped.items;
          if (mapped.selectedItems && !mapped.items) mapped.items = mapped.selectedItems;

          return mapped;
        });
      }

      // Sync browser local state as a high fidelity cache
      localStorage.setItem(localStorageKey, JSON.stringify(finalData));
      return finalData;
    } else if (parsedLocal && parsedLocal.length > 0) {
      // Seed first-time client records down to Supabase to prevent loss of local demo work
      await syncLocalTableToSupabase(tableName, parsedLocal);
      return parsedLocal;
    }
    return [] as any[];
  } catch (err) {
    console.warn(`Database connection failed on "${tableName}", defaulting to transient state:`, err);
    return parsedLocal;
  }
}

// Writes records to both Supabase and localStorage
export async function saveWithSupabaseSync(tableName: string, localStorageKey: string, dataArray: any[]) {
  // Always update localStorage first to ensure instant local persistence and zero delay UI updating
  localStorage.setItem(localStorageKey, JSON.stringify(dataArray));

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await syncLocalTableToSupabase(tableName, dataArray);
  } catch (err) {
    console.error(`Error persisting upstream synced copy to "${tableName}":`, err);
  }
}
