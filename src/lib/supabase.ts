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
    const formData = new FormData();
    formData.append('bucket', bucket);
    formData.append('filePath', filePath);
    formData.append('fileType', fileType);
    formData.append('file', fileBody);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Upload API error for bucket ${bucket}:`, errText);
      return null;
    }

    const json = await res.json();
    return json.publicUrl || null;
  } catch (error) {
    console.error(`Upload error in client wrapper for bucket ${bucket}:`, error);
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
      // Map some camelCase fields to snake_case if tables expect them, or upsert direct JSON matches
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
      // Sync browser local state as a high fidelity cache
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      return data;
    } else if (parsedLocal && parsedLocal.length > 0) {
      // Seed first-time client records down to Supabase to prevent loss of local demo work
      await syncLocalTableToSupabase(tableName, parsedLocal);
      return parsedLocal;
    }
    return [];
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
