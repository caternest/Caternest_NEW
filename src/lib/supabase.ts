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
    'id', 'created_at', 'updated_at', 'userId', 'businessName', 'ownerName',
    'phone', 'alternatePhone', 'email', 'address', 'city', 'cuisine',
    'categories', 'minGuests', 'pricePerPlate', 'status', 'verificationStatus',
    'menuUploaded', 'panNumber', 'aadhaarNumber', 'fssaiNumber', 'gstNumber',
    'logo', 'coverBanner', 'founderImageUrl', 'gallery', 'packages', 'addOns',
    'includedItems', 'username', 'password', 'owner', 'ownerPhoto', 'branchPhoto',
    'galleryPhotos', 'draftMenuPackages', 'aadhaarUrl', 'panUrl', 'fssaiUrl',
    'gstUrl', 'otherDocsUrl', 'rating', 'reviewCount', 'email_verified',
    'experience', 'eventsCompleted', 'awards', 'certifications', 'brandName',
    'tagline', 'whatsappNumber', 'operatingHours', 'branches', 'serviceAreas', 'pendingUpdates'
  ],
  orders: [
    'id', 'created_at', 'updated_at', 'userId', 'catererId', 'catererName',
    'customerName', 'customerEmail', 'customerPhone', 'phone', 'eventDate',
    'eventTime', 'eventType', 'guestCount', 'guests', 'totalAmount',
    'totalEstimate', 'status', 'items', 'selectedItems', 'packageSelected',
    'packageDetails', 'pricingSlabs', 'matchedSlab', 'addonItems', 'selectedMenu',
    'notes', 'specialNotes', 'pricePerPlate', 'platformFee', 'platformFeePerPlate', 'venue',
    'statusHistory', 'internalNotes', 'approvedAt', 'rejectedAt', 'completedAt'
  ],
  notifications: [
    'id', 'created_at', 'user_id', 'title', 'message', 'type', 'is_read', 'orderId', 'catererId', 'read'
  ],
  audit_logs: [
    'id', 'created_at', 'timestamp', 'action', 'details', 'user_email', 'role'
  ],
  food_images: [
    'id', 'created_at', 'updated_at', 'item_name', 'image_url', 'approved_by_admin', 'status', 'category', 'cuisine'
  ]
};

export function sanitizePayload(tableName: string, payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;

  const whitelist = tableWhitelists[tableName];
  if (!whitelist) return payload;

  const processObject = (obj: any): any => {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (whitelist.includes(key)) {
        cleaned[key] = obj[key];
        // Mirror read to is_read when whitelisted key is copied
        if (tableName === 'notifications' && key === 'read') {
          cleaned.is_read = obj.read;
        }
      } else {
        // Safe mapping fallback logic
        if (tableName === 'orders' && key === 'address' && !obj.venue) {
          cleaned.venue = obj.address;
        }
        if (tableName === 'caterer_registrations' && (key === 'additionalPhone' || key === 'additionalMobile') && !obj.alternatePhone) {
          cleaned.alternatePhone = obj[key];
        }
        if (tableName === 'notifications' && key === 'targetRole') {
          cleaned.type = obj.targetRole;
        }
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
    const rawClient = createClient(supabaseUrl, supabaseAnonKey);

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
                            console.error("NOTIFICATION ERROR", result.error);
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
                                  'branches', 'serviceAreas'
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
                          console.error("NOTIFICATION ERROR", err);
                        }
                        return onrejected ? onrejected(err) : Promise.reject(err);
                      });
                    };
                  }

                  const value = bTarget[bProp];
                  if (typeof value === 'function') {
                    return (...args: any[]) => {
                      let processedArgs = args;

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
                                'brandName', 'tagline', 'whatsappNumber', 'operatingHours', 'branches', 'serviceAreas'
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

// Synchronizes localized datasets to the Supabase Database if online
export async function syncLocalTableToSupabase(tableName: string, localData: any[]) {
  console.log(`[TRACE_LOG #11] syncLocalTableToSupabase entry for ${tableName}, count:`, localData?.length);
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

        if (sanitized.address && !sanitized.venue) {
          sanitized.venue = sanitized.address;
        }

        if (sanitized.selectedItems && !sanitized.items) {
          sanitized.items = sanitized.selectedItems;
        } else if (sanitized.items && !sanitized.selectedItems) {
          sanitized.selectedItems = sanitized.items;
        }
      }

      let errorResponse: any = null;
      let attemptPayload = sanitizePayload(tableName, sanitized);
      let success = false;
      
      for (let attempt = 0; attempt < 5; attempt++) {
        const { error } = await supabase
          .from(tableName)
          .upsert(attemptPayload, { onConflict: 'id' });
          
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
        console.error(`[SYNC ERROR] Upsert failed for table "${tableName}" on item:`, errorResponse);
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
