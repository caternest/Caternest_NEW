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

export function resolveSupabaseUrl(rawUrl: string, key?: string): string {
  let url = (rawUrl || "").replace(/\/rest\/v1\/?$/, '').trim();
  if (url.includes("ogeqgqwzbzezubknudxo")) {
    url = url.replace("ogeqgqwzbzezubknudxo", "oqegqqwzbzezubknudxo");
  }
  if (key && key.includes(".")) {
    try {
      const parts = key.split(".");
      if (parts.length >= 2) {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const decoded = typeof atob === "function"
          ? atob(base64)
          : (typeof Buffer !== "undefined" ? Buffer.from(base64, "base64").toString("utf-8") : "");
        if (decoded) {
          const parsed = JSON.parse(decoded);
          if (parsed?.ref && parsed?.iss === "supabase") {
            const expectedDomain = `${parsed.ref}.supabase.co`;
            if (!url || url.includes("ogeqgqwzbzezubknudxo") || !url.includes(parsed.ref)) {
              url = `https://${expectedDomain}`;
            }
          }
        }
      }
    } catch {
      // Fallback
    }
  }
  return url;
}

const rawSupabaseUrl = getEnvWord("VITE_SUPABASE_URL") || getEnvWord("SUPABASE_URL");
const supabaseAnonKey = getEnvWord("VITE_SUPABASE_ANON_KEY") || getEnvWord("SUPABASE_ANON_KEY");
const supabaseUrl = resolveSupabaseUrl(rawSupabaseUrl, supabaseAnonKey);

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
          persistSession: true,
          autoRefreshToken: true,
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
                          console.warn("Orders database sync notice:", err?.message || err);
                        } else if (tableName === 'notifications') {
                          console.warn("Notification handling warn:", err?.message || err);
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

export interface UploadMenuResult {
  success: boolean;
  bucket?: string;
  path?: string;
  url?: string;
  offline?: boolean;
  error?: string;
  errorDetails?: any;
  localTempFile?: {
    path: string;
    sessionId: string;
    fileName: string;
  };
}

/**
 * Dedicated, progress-aware multi-path upload for menu files (PDFs, images up to 25MB).
 * Path 1: Direct upload to Supabase Storage via signed upload URL (bypasses Vercel 4.5MB limit).
 * Path 2: Direct browser client upload via Supabase JS SDK.
 * Path 3: Chunked 3MB slice upload to /api/storage/chunk-upload (safe from Vercel limit and Supabase RLS).
 */
export async function uploadMenuDocumentToStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadMenuResult> {
  const client = getSupabase();
  let authUserId: string | null = null;
  try {
    const sessionRes = await client?.auth.getSession();
    authUserId = sessionRes?.data?.session?.user?.id || null;
  } catch {}

  const fileExt = file.name.split('.').pop() || 'pdf';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileTimestamp = Date.now();
  const fileRand = Math.random().toString(36).substring(2, 7);
  const fileBaseName = `menu-${fileTimestamp}-${fileRand}.${cleanExt}`;
  const fileName = authUserId ? `${authUserId}/${fileBaseName}` : `temp-scans/${fileBaseName}`;
  const targetBucket = 'menu-cards';
  const lastErrors: { path: string; error: string; details?: any }[] = [];

  try {
    console.log(`[MENU STORAGE] Initiating upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) to path "${fileName}"...`);
    onProgress?.(5);

    // 1. Attempt to obtain signed upload URL and tokens from backend
    let signJson: any = null;
    try {
      const signRes = await fetch('/api/storage/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: targetBucket,
          filePath: fileName,
        }),
      });

      if (signRes.ok) {
        signJson = await signRes.json().catch(() => null);
      } else {
        const signErrText = await signRes.text().catch(() => '');
        lastErrors.push({ path: 'presign', error: `HTTP ${signRes.status}: ${signErrText}` });
        console.warn(`[MENU STORAGE] Storage sign returned HTTP ${signRes.status}.`);
      }
    } catch (signErr: any) {
      lastErrors.push({ path: 'presign', error: signErr?.message || 'Network error' });
      console.warn(`[MENU STORAGE] Network error requesting signed URL:`, signErr);
    }

    if (signJson?.offline) {
      console.log(`[MENU STORAGE] Server operating in local offline mode (no Supabase credentials).`);
      return {
        success: false,
        offline: true,
      };
    }

    // PATH 1: If backend provided a signed upload URL, upload directly via XHR
    if (signJson?.success && signJson.signedUrl) {
      const { signedUrl, token, bucket, filePath, signedDownloadUrl, publicUrl } = signJson;
      console.log(`[MENU STORAGE] Signed upload URL acquired. Uploading raw file directly to storage...`);
      onProgress?.(10);

      const uploadSuccess = await new Promise<boolean>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.timeout = 180000; // 3 minutes timeout for up to 25MB

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            const pct = Math.min(95, Math.max(10, Math.round(10 + (evt.loaded / evt.total) * 85)));
            onProgress?.(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`[MENU STORAGE] Direct XHR upload succeeded with HTTP ${xhr.status}.`);
            onProgress?.(100);
            resolve(true);
          } else {
            console.warn(`[MENU STORAGE] Direct XHR upload failed with HTTP ${xhr.status}:`, xhr.responseText);
            lastErrors.push({ path: 'signed-xhr', error: `HTTP ${xhr.status}: ${xhr.responseText}` });
            resolve(false);
          }
        };

        xhr.onerror = () => {
          console.warn(`[MENU STORAGE] Direct XHR network error.`);
          lastErrors.push({ path: 'signed-xhr', error: 'Network error during PUT' });
          resolve(false);
        };

        xhr.ontimeout = () => {
          console.warn(`[MENU STORAGE] Direct XHR upload timed out after 180s.`);
          lastErrors.push({ path: 'signed-xhr', error: 'PUT timed out after 180s' });
          resolve(false);
        };

        xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');
        xhr.send(file);
      });

      if (uploadSuccess) {
        return {
          success: true,
          bucket: bucket || targetBucket,
          path: filePath || fileName,
          url: signedDownloadUrl || publicUrl,
        };
      }

      // Fallback to Supabase JS SDK uploadToSignedUrl if XHR failed
      try {
        const client = getSupabase();
        if (client && token) {
          console.log(`[MENU STORAGE] Retrying upload via supabase.storage.uploadToSignedUrl...`);
          const { data, error } = await client.storage
            .from(bucket || targetBucket)
            .uploadToSignedUrl(filePath || fileName, token, file, {
              contentType: file.type || 'application/pdf',
              upsert: true,
            });
          if (!error && data) {
            console.log(`[MENU STORAGE] SDK uploadToSignedUrl succeeded!`);
            onProgress?.(100);
            return {
              success: true,
              bucket: bucket || targetBucket,
              path: filePath || fileName,
              url: signedDownloadUrl || publicUrl,
            };
          }
          if (error) {
            lastErrors.push({ path: 'uploadToSignedUrl', error: error.message });
            console.warn(`[MENU STORAGE] SDK uploadToSignedUrl failed:`, error.message);
          }
        }
      } catch (sdkErr: any) {
        lastErrors.push({ path: 'uploadToSignedUrl', error: sdkErr?.message });
        console.warn(`[MENU STORAGE] Exception in SDK uploadToSignedUrl:`, sdkErr);
      }
    }

    // PATH 2: Direct Browser-to-Supabase Storage Upload via Supabase JS SDK
    if (client) {
      console.log(`[MENU STORAGE] Attempting direct browser upload to Supabase Storage via client SDK...`);
      onProgress?.(20);

      // Only attempt actual target buckets for menus: targetBucket (menu-cards) and documents.
      // Do NOT retry unrelated buckets (branding-images, food-images, gallery-images).
      const menuBuckets = Array.from(new Set([targetBucket, 'documents']));

      for (const b of menuBuckets) {
        try {
          console.log(`[MENU STORAGE] Attempting client direct upload to bucket "${b}" with path "${fileName}"...`);
          onProgress?.(25);
          const { data, error } = await client.storage
            .from(b)
            .upload(fileName, file, {
              contentType: file.type || 'application/pdf',
              upsert: true,
            });

          if (!error && data) {
            console.log(`[MENU STORAGE] Client direct upload succeeded to bucket "${b}"!`);
            onProgress?.(100);

            const { data: pubData } = client.storage.from(b).getPublicUrl(fileName);
            let clientSignedUrl: string | null = null;
            try {
              const { data: sData } = await client.storage.from(b).createSignedUrl(fileName, 3600);
              if (sData?.signedUrl) clientSignedUrl = sData.signedUrl;
            } catch {}

            return {
              success: true,
              bucket: b,
              path: fileName,
              url: clientSignedUrl || pubData?.publicUrl || undefined,
            };
          } else if (error) {
            const statusCode = (error as any)?.statusCode || (error as any)?.status || 'RLS';
            lastErrors.push({ path: `client-direct-${b}`, error: `${error.message} (${statusCode})` });
            console.warn(`[MENU STORAGE] Client direct upload to bucket "${b}" failed:`, error.message);
          }
        } catch (bErr: any) {
          lastErrors.push({ path: `client-direct-${b}`, error: bErr?.message || 'Exception' });
          console.warn(`[MENU STORAGE] Exception in client upload to bucket "${b}":`, bErr);
        }
      }
    }

    // PATH 3: Direct Chunked 3MB Transfer (Prevents Vercel 4.5MB Payload Limits & Supabase Storage RLS)
    console.log(`[MENU STORAGE] Supabase storage direct upload unavailable. Initiating chunked transfer (3MB slices)...`);
    onProgress?.(30);

    try {
      const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunks (strictly below Vercel's 4.5MB limit)
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      let reassemblyResult: any = null;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunkBlob = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunkBlob, file.name);
        formData.append('sessionId', sessionId);
        formData.append('chunkIndex', String(i));
        formData.append('totalChunks', String(totalChunks));
        formData.append('fileName', file.name);
        formData.append('mimeType', file.type || 'application/pdf');

        const chunkPct = Math.min(95, Math.round(30 + ((i + 1) / totalChunks) * 65));
        onProgress?.(chunkPct);

        const chunkRes = await fetch('/api/storage/chunk-upload', {
          method: 'POST',
          body: formData,
        });

        if (!chunkRes.ok) {
          const errText = await chunkRes.text().catch(() => '');
          throw new Error(`Chunk ${i + 1}/${totalChunks} upload failed (HTTP ${chunkRes.status}): ${errText}`);
        }

        const chunkJson = await chunkRes.json();
        if (chunkJson.complete) {
          reassemblyResult = chunkJson;
        }
      }

      if (reassemblyResult && reassemblyResult.localTempPath) {
        console.log(`[MENU STORAGE] Chunked upload successfully completed at: ${reassemblyResult.localTempPath}`);
        onProgress?.(100);
        return {
          success: true,
          localTempFile: {
            path: reassemblyResult.localTempPath,
            sessionId: reassemblyResult.sessionId,
            fileName: file.name,
          },
        };
      }
    } catch (chunkErr: any) {
      lastErrors.push({ path: 'chunk-upload', error: chunkErr?.message });
      console.warn(`[MENU STORAGE] Chunked upload failed:`, chunkErr);
    }

    // 4. Send telemetry report to /api/storage/diagnostic-log
    try {
      fetch('/api/storage/diagnostic-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'menu_upload_failed',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          error: lastErrors.map((e) => `[${e.path}]: ${e.error}`).join(' | '),
          details: lastErrors,
        }),
      }).catch(() => {});
    } catch {}

    // 5. If file is small, allow base64 fallback
    if (file.size <= 4 * 1024 * 1024) {
      return {
        success: false,
        offline: true,
      };
    }

    const detailedErrorMsg = lastErrors.length > 0
      ? `Upload failed: ${lastErrors.map((e) => `[${e.path}]: ${e.error}`).join('; ')}`
      : `Upload failed for ${(file.size / 1024 / 1024).toFixed(1)}MB document.`;

    return {
      success: false,
      error: detailedErrorMsg,
      errorDetails: lastErrors,
    };
  } catch (err: any) {
    console.warn(`[MENU STORAGE] Unexpected error in uploadMenuDocumentToStorage:`, err);
    return {
      success: false,
      error: err?.message || 'Storage upload error',
    };
  }
}

// Helper to check if a bucket exists or upload file to Supabase storage
export async function uploadToSupabaseBucket(bucket: string, filePath: string, fileBody: any, fileType: string = 'image/jpeg') {
  const isLargeFile = fileBody && (fileBody.size > 4 * 1024 * 1024 || (typeof fileBody === 'string' && fileBody.length > 5 * 1024 * 1024));

  // Helper for server-side multipart upload fallback (only for small files <= 4MB to prevent Vercel 413)
  const uploadViaServerMultipart = async (): Promise<string | null> => {
    if (isLargeFile) {
      console.warn(`[STORAGE CLIENT LOGGER] File exceeds 4MB. Skipping server multipart fallback to prevent Vercel 413.`);
      return null;
    }
    try {
      console.warn(`[STORAGE CLIENT LOGGER] Attempting server multipart upload fallback via /api/upload for bucket "${bucket}"...`);
      const formData = new FormData();
      let blobToSend: Blob;

      if (fileBody instanceof Blob) {
        blobToSend = fileBody;
      } else if (typeof fileBody === 'string') {
        const match = fileBody.match(/^data:(.+?);base64,(.+)$/);
        if (match) {
          const byteCharacters = atob(match[2]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          blobToSend = new Blob([new Uint8Array(byteNumbers)], { type: match[1] });
        } else {
          blobToSend = new Blob([fileBody], { type: fileType });
        }
      } else {
        blobToSend = new Blob([fileBody], { type: fileType });
      }

      const rawFileName = filePath.split('/').pop() || 'upload.bin';
      formData.append("file", blobToSend, rawFileName);
      formData.append("bucket", bucket);
      formData.append("filePath", filePath);
      formData.append("fileType", fileType);

      const serverRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (serverRes.ok) {
        const json = await serverRes.json();
        if (json.publicUrl) {
          console.log(`[STORAGE CLIENT LOGGER] Server multipart fallback succeeded: ${json.publicUrl}`);
          return json.publicUrl;
        }
      } else {
        const errText = await serverRes.text();
        console.warn("[STORAGE CLIENT LOGGER] Server multipart fallback response error:", errText);
      }
    } catch (fbErr) {
      console.warn("[STORAGE CLIENT LOGGER] Server multipart fallback exception:", fbErr);
    }
    return null;
  };

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
      console.warn(`[STORAGE CLIENT LOGGER] Pre-signed URL generation returned non-200 for bucket ${bucket}:`, errText);
    }

    const signJson = signRes.ok ? await signRes.json().catch(() => null) : null;
    const { signedUrl, token, publicUrl, signedDownloadUrl } = signJson || {};

    if (!signedUrl) {
      console.log(`[STORAGE CLIENT LOGGER] Pre-signed URL unavailable. Attempting direct browser client upload to bucket "${bucket}"...`);
      try {
        const client = getSupabase();
        if (client) {
          let uploadPayload = fileBody;
          if (typeof fileBody === 'string') {
            const match = fileBody.match(/^data:(.+?);base64,(.+)$/);
            if (match) {
              const byteCharacters = atob(match[2]);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              uploadPayload = new Blob([new Uint8Array(byteNumbers)], { type: match[1] });
            }
          }
          const { data, error } = await client.storage
            .from(bucket)
            .upload(filePath, uploadPayload, {
              contentType: fileType,
              upsert: true,
            });
          if (!error && data) {
            const { data: pubData } = client.storage.from(bucket).getPublicUrl(filePath);
            if (pubData?.publicUrl) {
              console.log(`[STORAGE CLIENT LOGGER] Direct browser client upload succeeded: ${pubData.publicUrl}`);
              return pubData.publicUrl;
            }
          }
        }
      } catch (cErr) {
        console.warn(`[STORAGE CLIENT LOGGER] Direct client upload attempt error:`, cErr);
      }
      return await uploadViaServerMultipart();
    }

    console.log(`[STORAGE CLIENT LOGGER] Signed upload URL acquired. Uploading directly to Supabase storage...`);

    // 2. Try Supabase JS client uploadToSignedUrl if client instance and token are available
    try {
      const client = getSupabase();
      if (client && token) {
        const { data, error } = await client.storage
          .from(bucket)
          .uploadToSignedUrl(filePath, token, fileBody, {
            contentType: fileType,
            upsert: true,
          });
        if (!error && data) {
          console.log(`[STORAGE CLIENT LOGGER] SDK uploadToSignedUrl successful.`);
          return signedDownloadUrl || publicUrl || null;
        }
      }
    } catch (sdkEx) {
      console.warn(`[STORAGE CLIENT LOGGER] SDK uploadToSignedUrl attempt failed:`, sdkEx);
    }

    // 3. Fallback: Transmit directly using FormData PUT with 180s safety timeout
    const putController = new AbortController();
    const putTimeout = setTimeout(() => putController.abort(), 180000);
    let uploadRes: Response;
    try {
      const formData = new FormData();
      formData.append('', fileBody);
      uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: formData,
        signal: putController.signal
      });
    } finally {
      clearTimeout(putTimeout);
    }

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.warn(`[STORAGE CLIENT LOGGER] Direct object storage PUT operation failed:`, errText);
      return await uploadViaServerMultipart();
    }

    console.log(`[STORAGE CLIENT LOGGER] Direct client-to-bucket upload successful. Returning resolution URL: ${signedDownloadUrl || publicUrl}`);
    return signedDownloadUrl || publicUrl || null;
  } catch (error) {
    console.warn(`[STORAGE CLIENT LOGGER] Exception during direct upload under bucket ${bucket}:`, error);
    return await uploadViaServerMultipart();
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
        if (!sanitized.guestCount && sanitized.guests) {
          sanitized.guestCount = Number(sanitized.guests);
        }
        if (!sanitized.totalAmount && sanitized.totalEstimate) {
          sanitized.totalAmount = Number(sanitized.totalEstimate);
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
  let defaultFee = localVal ? parseFloat(localVal) : 2;
  
  try {
    const response = await fetch('/api/platform-settings');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result && result.success && result.data) {
      const fee = Number(result.data.platformFeePerPlate);
      if (!isNaN(fee)) {
        localStorage.setItem('platformFeePerPlate', fee.toString());
        return fee;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch platform fee from API, falling back to cache:", err);
  }
  return defaultFee;
}

export async function updatePlatformFeePerPlateInDB(fee: number): Promise<void> {
  try {
    const response = await fetch('/api/platform-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ platformFeePerPlate: fee })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned error: ${errText}`);
    }

    const result = await response.json();
    if (result && result.success) {
      localStorage.setItem('platformFeePerPlate', fee.toString());
    } else {
      throw new Error("Failed to update platform fee on the server.");
    }
  } catch (err) {
    console.error("Error in updatePlatformFeePerPlateInDB:", err);
    throw err;
  }
}

export async function fetchHomepageMode(): Promise<string> {
  try {
    const response = await fetch('/api/platform-settings');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result && result.success && result.data) {
      const mode = result.data.homepage_mode;
      if (mode === 'classic' || mode === 'marketplace') {
        localStorage.setItem('homepage_mode', mode);
        return mode;
      }
    }
    throw new Error("Invalid response format or missing data");
  } catch (err) {
    console.warn("Failed to fetch homepage mode from API, falling back to cache:", err);
    return localStorage.getItem('homepage_mode') || 'classic';
  }
}

export async function updateHomepageModeInDB(mode: string): Promise<any> {
  try {
    const response = await fetch('/api/platform-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ homepage_mode: mode })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned error: ${errText}`);
    }

    const result = await response.json();
    if (result && result.success) {
      // Log details only in development mode
      if (import.meta.env.DEV) {
        console.log("%c[DB UPDATE AUDIT LOG]", "color: #DEAA38; font-weight: bold; font-size: 12px;");
        console.log("Current row id:", result.rowId);
        console.log("Previous homepage_mode:", result.previousHomepageMode);
        console.log("New homepage_mode:", result.newHomepageMode);
        console.log("UPDATE response:", result.updateResponse);
        console.log("affected row count:", result.affectedRowCount);
        console.log("Database value after update:", result.databaseValueAfter);
      }

      if (result.affectedRowCount === 0) {
        throw new Error("Update affected 0 rows on the database table 'platform_settings'!");
      }

      // Synchronize cache on success
      localStorage.setItem('homepage_mode', result.databaseValueAfter);
      return result;
    } else {
      throw new Error("Failed to update homepage mode on the server.");
    }
  } catch (err: any) {
    console.error("Error in updateHomepageModeInDB:", err);
    throw err;
  }
}
