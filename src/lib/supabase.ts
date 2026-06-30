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

const rawSupabaseUrl = getEnvWord("VITE_SUPABASE_URL") || getEnvWord("SUPABASE_URL");
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').trim();
const supabaseAnonKey = getEnvWord("VITE_SUPABASE_ANON_KEY") || getEnvWord("SUPABASE_ANON_KEY");

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabaseInstance: any = null;

const tableWhitelists: Record<string, string[]> = {
  caterer_registrations: [
    'id', 'created_at', 'updated_at', 'userId', 'businessName', 'name',
    'phone', 'alternatePhone', 'email', 'address', 'city', 'cuisine',
    'categories', 'minGuests', 'pricePerPlate', 'status', 'verificationStatus',
    'menuUploaded', 'panNumber', 'aadhaarNumber', 'fssaiNumber', 'gstNumber',
    'logo', 'coverBanner', 'founderImageUrl', 'gallery', 'packages', 'addOns',
    'includedItems', 'username', 'password', 'owner', 'ownerPhoto', 'branchPhoto',
    'galleryPhotos', 'draftMenuPackages', 'aadhaarUrl', 'panUrl', 'fssaiUrl',
    'gstUrl', 'otherDocsUrl', 'rating', 'reviewCount', 'email_verified',
    'experience', 'eventsCompleted', 'awards', 'certifications', 'brandName',
    'tagline', 'whatsappNumber', 'operatingHours', 'branches', 'serviceAreas', 'pendingUpdates',
    'description', 'services', 'achievements', 'highlights', 'specializations', 'menuCount', 'branchesList',
    'latitude', 'longitude'
  ],
  orders: [
    'id', 'created_at', 'updated_at', 'userId', 'catererId', 'catererName',
    'customerName', 'customerEmail', 'customerPhone', 'eventDate',
    'eventTime', 'eventType', 'guestCount', 'totalAmount',
    'status', 'items', 'selectedItems', 'packageSelected',
    'packageDetails', 'pricingSlabs', 'matchedSlab', 'addonItems', 'selectedMenu',
    'notes', 'pricePerPlate', 'platformFee', 'platformFeePerPlate', 'venue',
    'statusHistory', 'internalNotes', 'approvedAt', 'rejectedAt', 'completedAt',
    'latitude', 'longitude'
  ],
  notifications: [
    'id', 'created_at', 'orderId', 'title', 'message', 'targetRole', 'catererId', 'read'
  ],
  audit_logs: [
    'id', 'created_at', 'timestamp', 'action', 'details', 'user_email', 'role'
  ],
  food_images: [
    'id', 'created_at', 'updated_at', 'item_name', 'image_url', 'approved_by_admin', 'status', 'category', 'cuisine'
  ]
};

const uuidColumnsByTable: Record<string, string[]> = {
  caterer_registrations: ['id'],
  orders: ['catererId'],
  notifications: ['id', 'catererId'],
  audit_logs: ['id']
};

export function toUUID(str: any): any {
  if (str === null || str === undefined) return str;
  if (typeof str !== 'string') return str;
  
  const clean = str.trim();
  if (clean === '') return null;
  
  const relaxedUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (relaxedUuidRegex.test(clean)) {
    return clean.toLowerCase();
  }

  // Generate a deterministic 32-character hex string from the input string
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  
  let seed = Math.abs(hash);
  const nextHex = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return Math.floor((seed / 233280) * 16).toString(16);
  };

  let hexStr = '';
  for (let i = 0; i < 32; i++) {
    const charCode = i < clean.length ? clean.charCodeAt(i) : 0;
    const mix = (nextHex() + charCode.toString(16)).slice(-1);
    hexStr += mix;
  }

  const part1 = hexStr.slice(0, 8);
  const part2 = hexStr.slice(8, 12);
  const part3 = '4' + hexStr.slice(13, 16);
  const part4 = '8' + hexStr.slice(17, 20);
  const part5 = hexStr.slice(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

export function sanitizePayload(tableName: string, payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;

  const whitelist = tableWhitelists[tableName];
  if (!whitelist) return payload;

  const processObject = (obj: any): any => {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (whitelist.includes(key)) {
        let val = obj[key];
        const uuidCols = uuidColumnsByTable[tableName];
        if (uuidCols && uuidCols.includes(key)) {
          val = toUUID(val);
        }
        cleaned[key] = val;
      } else {
        if (tableName === 'notifications') {
          if (key === 'targetRole' || key === 'type') {
            cleaned.targetRole = obj[key];
          }
          if (key === 'read' || key === 'is_read') {
            cleaned.read = obj[key];
          }
        }
      }
    }

    // Explicitly guarantee that notification objects have database-compatible required fields
    if (tableName === 'notifications') {
      if (cleaned.targetRole === undefined) {
        if (obj.targetRole !== undefined) cleaned.targetRole = obj.targetRole;
        else if (obj.type !== undefined) cleaned.targetRole = obj.type;
      }
      if (cleaned.read === undefined) {
        if (obj.read !== undefined) cleaned.read = obj.read;
        else if (obj.is_read !== undefined) cleaned.read = obj.is_read;
      }
    }

    return cleaned;
  };

  if (Array.isArray(payload)) {
    return payload.map(processObject);
  }
  return processObject(payload);
}

export function getSupabase() {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseInstance) {
    const rawClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: true
        }
      }
    );

    supabaseInstance = new Proxy(rawClient, {
      get(target, prop, receiver) {
        if (prop === 'from') {
          return (tableName: string) => {
            const queryBuilder = target.from(tableName);

            // Wrap builder recursively to intercept then resolutions and map fallbacks
            const wrapBuilder = (builder: any): any => {
              return new Proxy(builder, {
                get(bTarget, bProp, bReceiver) {
                  if (bProp === 'then') {
                    const originalThen = bTarget.then;
                    return function (onfulfilled?: any, onrejected?: any) {
                      return originalThen.call(bTarget, (result: any) => {
                        if (result?.error) {
                          if (tableName === 'orders') {
                            console.error("ORDERS UPSERT ERROR", result.error);
                          } else if (tableName === 'notifications') {
                            console.warn("Notification handling warn", result.error);
                          }
                        }

                        if (result && result.data) {
                          if (tableName === 'caterer_registrations') {
                            const processRow = (row: any) => {
                              if (row && row.includedItems && typeof row.includedItems === 'object') {
                                if (row.includedItems._fallback_pendingUpdates !== undefined) {
                                  row.pendingUpdates = row.includedItems._fallback_pendingUpdates;
                                }
                                const fallbackKeys = [
                                  'experience', 'eventsCompleted', 'awards', 'certifications',
                                  'brandName', 'tagline', 'whatsappNumber', 'operatingHours',
                                  'branches', 'serviceAreas', 'description', 'services', 'achievements', 'highlights', 'specializations',
                                  'email_verified', 'phone_verified', 'approval_status', 'verification_status', 'founderPhoto', 'additionalPhone', 'branchesList',
                                  'priceRange', 'bookingLeadTime', 'responseTime', 'established', 'serveEntireHyderabad', 'menuCount',
                                  'heroCard1Title', 'heroCard1Text', 'heroCard1Icon',
                                  'heroCard2Value', 'heroCard2Text', 'heroCard2Icon',
                                  'heroCard3Value', 'heroCard3Text', 'heroCard3Icon'
                                ];
                                fallbackKeys.forEach(k => {
                                  const fallbackKey = `_fallback_${k}`;
                                  if (row.includedItems[fallbackKey] !== undefined) {
                                    row[k] = row.includedItems[fallbackKey];
                                  }
                                });
                              }
                              return row;
                            };

                            if (Array.isArray(result.data)) {
                              result.data.forEach(processRow);
                            } else {
                              processRow(result.data);
                            }
                          }
                        }
                        return onfulfilled ? onfulfilled(result) : result;
                      }, (err: any) => {
                        if (tableName === 'orders') {
                          console.error("ORDERS UPSERT ERROR", err);
                        } else if (tableName === 'notifications') {
                          console.warn("Notification handling warn", err);
                        }
                        return onrejected ? onrejected(err) : Promise.reject(err);
                      });
                    };
                  }

                  const value = bTarget[bProp];
                  if (typeof value === 'function') {
                    return (...args: any[]) => {
                      let processedArgs = args;

                      // Intercept UUID fields in filters like eq, neq, in
                      if (bProp === 'eq' || bProp === 'neq' || bProp === 'in') {
                        const col = args[0];
                        const uuidCols = uuidColumnsByTable[tableName];
                        if (uuidCols && uuidCols.includes(col)) {
                          if (bProp === 'eq' || bProp === 'neq') {
                            processedArgs = [col, toUUID(args[1]), ...args.slice(2)];
                          } else if (bProp === 'in' && Array.isArray(args[1])) {
                            processedArgs = [col, args[1].map(v => toUUID(v)), ...args.slice(2)];
                          }
                        }
                      }

                      // Intercept insert/update/upsert parameters to extract virtual fallback keys
                      if (tableName === 'caterer_registrations' && (bProp === 'insert' || bProp === 'update' || bProp === 'upsert')) {
                        const originalPayload = args[0];
                        if (originalPayload) {
                          const clonePayload = (item: any): any => {
                            if (!item || typeof item !== 'object') return item;
                            return { ...item };
                          };
                          
                          let processedPayload;
                          if (Array.isArray(originalPayload)) {
                            processedPayload = originalPayload.map(clonePayload);
                          } else {
                            processedPayload = clonePayload(originalPayload);
                          }

                          const processPayloadItems = (item: any) => {
                            if (item && typeof item === 'object') {
                              const virtualKeys = [
                                'pendingUpdates', 'experience', 'eventsCompleted', 'awards', 'certifications',
                                'brandName', 'tagline', 'whatsappNumber', 'operatingHours', 'branches', 'serviceAreas',
                                'description', 'services', 'achievements', 'highlights', 'specializations',
                                'email_verified', 'phone_verified', 'approval_status', 'verification_status', 'founderPhoto', 'additionalPhone', 'branchesList',
                                'priceRange', 'bookingLeadTime', 'responseTime', 'established', 'serveEntireHyderabad', 'menuCount',
                                'heroCard1Title', 'heroCard1Text', 'heroCard1Icon',
                                'heroCard2Value', 'heroCard2Text', 'heroCard2Icon',
                                'heroCard3Value', 'heroCard3Text', 'heroCard3Icon'
                              ];
                              const fallbackObj: any = {};
                              let hasVirtual = false;
                              virtualKeys.forEach(k => {
                                if (item[k] !== undefined) {
                                  fallbackObj[`_fallback_${k}`] = item[k];
                                  hasVirtual = true;
                                }
                              });

                              if (hasVirtual) {
                                const existingIncluded = item.includedItems || {};
                                const mergedIncluded = typeof existingIncluded === 'object' && !Array.isArray(existingIncluded)
                                  ? { ...existingIncluded, ...fallbackObj }
                                  : { _fallback_list: existingIncluded, ...fallbackObj };
                                item.includedItems = mergedIncluded;
                              }

                              // Remove from actual database payload so it doesn't trigger PGRST204 mismatch error
                              virtualKeys.forEach(k => {
                                delete item[k];
                              });
                            }
                          };

                          if (Array.isArray(processedPayload)) {
                            processedPayload.forEach(processPayloadItems);
                          } else {
                            processPayloadItems(processedPayload);
                          }
                          processedArgs = [processedPayload, ...args.slice(1)];
                        }
                      }

                      // Apply sanitization using pre-existing helper
                      if (bProp === 'insert' || bProp === 'upsert' || bProp === 'update') {
                        const values = processedArgs[0];
                        const sanitized = sanitizePayload(tableName, values);
                        if (tableName === 'orders') {
                          console.log("ORDERS UPSERT PAYLOAD", sanitized);
                        }
                        if (tableName === 'notifications') {
                          console.log("NOTIFICATION PAYLOAD", sanitized);
                        }
                        processedArgs = [sanitized, ...processedArgs.slice(1)];
                      }

                      const res = value.apply(bTarget, processedArgs);
                      if (res && typeof res === 'object' && typeof res.then === 'function') {
                        return wrapBuilder(res);
                      }
                      return res;
                    };
                  }
                  return value;
                }
              });
            };

            return wrapBuilder(queryBuilder);
          };
        }
        const value = target[prop as keyof typeof target];
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
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


// Helper to safely parse localized eventDate strings to SQL-compatible YYYY-MM-DD DATE format
export function parseToDbDate(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // If it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // If it has multiple dates separated by comma, take the first one
  const firstPart = cleaned.split(',')[0].trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(firstPart)) {
    return firstPart;
  }

  // Try parsing the date. Remove weekday (e.g., Sat, Sun) to make it more parseable for Date.parse
  let parseable = firstPart
    .replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, '')
    .trim();

  // If year is not present, append the current year so it parses reliably
  const hasYear = /\b\d{4}\b/.test(parseable);
  if (!hasYear) {
    const currentYear = new Date().getFullYear();
    parseable = `${parseable} ${currentYear}`;
  }

  const timestamp = Date.parse(parseable);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Fallback regex extraction for simple day + month words
  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const lower = parseable.toLowerCase();
  let foundMonth: number | null = null;
  let foundDay: number | null = null;

  for (const [mName, mVal] of Object.entries(monthMap)) {
    if (lower.includes(mName)) {
      foundMonth = mVal;
      break;
    }
  }

  const numMatches = lower.match(/\b\d{1,2}\b/g);
  if (numMatches && numMatches.length > 0) {
    foundDay = parseInt(numMatches[0], 10);
  }

  if (foundMonth && foundDay) {
    const y = new Date().getFullYear();
    const mStr = String(foundMonth).padStart(2, '0');
    const dStr = String(foundDay).padStart(2, '0');
    return `${y}-${mStr}-${dStr}`;
  }

  return null;
}

// Synchronizes localized datasets to the Supabase Database if online
export async function syncLocalTableToSupabase(tableName: string, localData: any[]) {
  console.log(`[TRACE_LOG #11] syncLocalTableToSupabase entry for ${tableName}, count:`, localData?.length);
  if (!localData || localData.length === 0) return;

  // 1. Try server-side high-privilege proxy synchronization first (reliable & bypasses RLS constraints)
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tableName, localData })
    });
    if (response.ok) {
      const resJson = await response.json();
      if (resJson.success) {
        console.log(`[SYNC SUCCESS] Synchronized table "${tableName}" successfully via server proxy.`);
        return;
      }
    }
  } catch (err) {
    console.warn(`[SYNC WARNING] Server-side sync proxy failed, falling back to direct client write:`, err);
  }

  const supabase = getSupabase();
  if (!supabase) return;

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

      if (tableName === 'orders') {
        if (sanitized.selectedItems && !sanitized.items) {
          sanitized.items = sanitized.selectedItems;
        }
        if (sanitized.eventDate) {
          sanitized.eventDate = parseToDbDate(sanitized.eventDate);
        }
      }


      let errorResponse: any = null;
      let attemptPayload = sanitizePayload(tableName, sanitized);
      let success = false;
      
      for (let attempt = 0; attempt < 5; attempt++) {
        let error: any = null;
        let existing = false;
        
        try {
          // Check existence first to avoid Supabase/PostgreSQL upsert RLS policy check failures
          const { data, error: checkError } = await supabase
            .from(tableName)
            .select('id')
            .eq('id', attemptPayload.id)
            .maybeSingle();
            
          if (!checkError && data) {
            existing = true;
          }
        } catch (e) {
          existing = false;
        }

        if (existing) {
          // Perform an update
          const { error: updateError } = await supabase
            .from(tableName)
            .update(attemptPayload)
            .eq('id', attemptPayload.id);
          error = updateError;
        } else {
          // Perform an insert
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(attemptPayload);
            
          // Fallback to update if insert failed because the item was actually created in the meantime (race condition or SELECT RLS policy restriction)
          if (insertError && (insertError.code === '23505' || insertError.message?.includes('duplicate key') || insertError.message?.includes('already exists'))) {
            const { error: updateError } = await supabase
              .from(tableName)
              .update(attemptPayload)
              .eq('id', attemptPayload.id);
            error = updateError;
          } else {
            error = insertError;
          }
        }
          
        if (!error) {
          success = true;
          break;
        }
        
        errorResponse = error;
        // Check for PGRST204 column missing error
        if (error.code === 'PGRST204') {
          const match = error.message?.match(/Could not find (?:the )?['"]?([a-zA-Z0-9_]+)['"]? column/i) || 
                        error.message?.match(/column:? ['"]?([a-zA-Z0-9_]+)['"]?/i) ||
                        error.message?.match(/Could not find column ['"]?([a-zA-Z0-9_]+)['"]?/i);
                        
          const missingColumn = match ? match[1] : null;
          if (missingColumn && attemptPayload[missingColumn] !== undefined) {
            console.warn(`[SYNC WARNING] Column "${missingColumn}" does not exist in "${tableName}" on Supabase. Removing from payload and retrying...`);
            delete attemptPayload[missingColumn];
            continue;
          }
        }
        break;
      }
      
      if (!success && errorResponse) {
        if (tableName === 'notifications') {
          console.warn(`[SYNC WARNING] Sync bypassed for table "notifications" due to RLS or guest limitations:`, errorResponse);
        } else {
          console.error(`[SYNC ERROR] Upsert failed for table "${tableName}" on item:`, errorResponse);
        }
      } else {
        console.log(`[SYNC SUCCESS] Synchronized item successfully to "${tableName}".`);
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
      if (tableName === 'orders') {
        finalData = data.map((item: any) => {
          const mapped = { ...item };
          if (mapped.items && !mapped.selectedItems) mapped.selectedItems = mapped.items;
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

export async function fetchPlatformFeePerPlate(): Promise<number> {
  const localVal = localStorage.getItem('platformFeePerPlate');
  let fee = localVal ? parseFloat(localVal) : 1;
  const supabase = getSupabase();
  if (!supabase) {
    return fee;
  }

  try {
    const { data, error } = await (supabase.from('platform_settings') as any).select('*');
    if (error) {
      throw error;
    }
    if (data && data.length > 0) {
      const row = data[0] as any;
      const dbFee = Number(row.platformFeePerPlate !== undefined ? row.platformFeePerPlate : fee);
      if (!isNaN(dbFee)) {
        fee = dbFee;
        localStorage.setItem('platformFeePerPlate', fee.toString());
      }
    } else {
      // Seed default
      await (supabase.from('platform_settings') as any).insert([{ id: 'default', platformFeePerPlate: fee }]);
    }
  } catch (err) {
    console.warn("Failed to fetch platform fee from Supabase, using cache:", err);
  }
  return fee;
}

export async function updatePlatformFeePerPlateInDB(fee: number): Promise<void> {
  localStorage.setItem('platformFeePerPlate', fee.toString());
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const payload = { id: 'default', platformFeePerPlate: fee };
    const { error } = await (supabase.from('platform_settings') as any).upsert(payload, { onConflict: 'id' });
    if (error) {
      const { error: err2 } = await (supabase.from('platform_settings') as any).update({ platformFeePerPlate: fee }).eq('id', 'default');
      if (err2) {
        console.warn("Could not sync platform fee to Supabase", err2);
      }
    }
  } catch (err) {
    console.warn("Error updating platform fee in Supabase", err);
  }
}

export async function fetchHomepageMode(): Promise<string> {
  const localVal = localStorage.getItem('homepage_mode');
  let mode = localVal || 'classic';
  const supabase = getSupabase();
  if (!supabase) {
    return mode;
  }

  try {
    const { data, error } = await (supabase.from('platform_settings') as any).select('*');
    if (error) {
      throw error;
    }
    if (data && data.length > 0) {
      const row = data[0] as any;
      const dbMode = row.homepage_mode || row.homepageMode || mode;
      mode = dbMode;
      localStorage.setItem('homepage_mode', mode);
    } else {
      // Seed default
      try {
        await (supabase.from('platform_settings') as any).insert([{ id: 'default', homepage_mode: mode }]);
      } catch (insertErr) {
        console.warn("Could not insert default homepage mode to platform_settings", insertErr);
      }
    }
  } catch (err) {
    console.warn("Failed to fetch homepage mode from Supabase, using cache:", err);
  }
  return mode;
}

export async function updateHomepageModeInDB(mode: string): Promise<void> {
  localStorage.setItem('homepage_mode', mode);
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const payload = { id: 'default', homepage_mode: mode };
    const { error } = await (supabase.from('platform_settings') as any).upsert(payload, { onConflict: 'id' });
    if (error) {
      const { error: err2 } = await (supabase.from('platform_settings') as any).update({ homepage_mode: mode }).eq('id', 'default');
      if (err2) {
        console.warn("Could not sync homepage mode to Supabase", err2);
      }
    }
  } catch (err) {
    console.warn("Error updating homepage mode in Supabase", err);
  }
}
