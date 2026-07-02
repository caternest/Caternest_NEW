import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import multer from "multer";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Supabase Server Client
const getSupabaseClient = () => {
  const rawSupabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!rawSupabaseUrl) return null;
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").trim();
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "Supabase credentials not fully configured on server, operating in high-performance local fallback mode.",
    );
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

// API routes
const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/storage/sign", async (req: any, res: any) => {
  const bucket = req.body.bucket || "branding-images";
  const filePath = req.body.filePath;

  console.log(
    `[STORAGE SIGN] Initiating pre-signed URL generation. Bucket: ${bucket}, File Path: ${filePath}`,
  );

  if (!filePath) {
    const errorMsg = "Presign failed: No filePath provided in JSON body";
    console.error(`[STORAGE SIGN] ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const errorMsg =
      "Presign failed: Supabase backend client or service role key is not configured.";
    console.error(`[STORAGE SIGN] ${errorMsg}`);
    return res.status(500).json({ error: errorMsg });
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error(
        `[STORAGE SIGN] Storage Error generating signed URL for bucket ${bucket}:`,
        error.message || error,
      );
      return res.status(500).json({ error: error.message, details: error });
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl || null;

    console.log(
      `[STORAGE SIGN] Presigned URL and Public verification URL generated successfully under Service Role.`,
    );
    return res.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl,
    });
  } catch (err: any) {
    console.error(
      `[STORAGE SIGN] Unexpected Error in pre-sign handler for bucket ${bucket}:`,
      err,
    );
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
  const bucket = req.body.bucket || "branding-images";
  const filePath = req.body.filePath;
  const fileType = req.body.fileType || "image/jpeg";
  const file = req.file;

  console.log(
    `[STORAGE LOG] Initiating upload. Bucket: ${bucket}, File Name/Path: ${filePath}, File Type: ${fileType}, System File Size: ${file ? file.size : 0} bytes`,
  );

  if (!file) {
    const errorMsg =
      "Upload failed: No file provided under post multipart field 'file'";
    console.error(`[STORAGE LOG] ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const errorMsg =
      "Upload failed: Supabase backend client or service role key is not configured.";
    console.error(`[STORAGE LOG] ${errorMsg}`);
    return res.status(500).json({ error: errorMsg });
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: fileType,
        upsert: true,
      });

    const uploadResultLog = error
      ? `Error: ${error.message || JSON.stringify(error)}`
      : "Success";
    console.log(
      `[STORAGE LOG] Upload attempt complete. Result: ${uploadResultLog}`,
    );

    if (error) {
      console.error(
        `[STORAGE LOG] Storage Error uploading to bucket ${bucket}:`,
        error.message || error,
      );
      return res.status(500).json({ error: error.message, details: error });
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl || null;

    console.log(
      `[STORAGE LOG] Upload successful! Bucket: ${bucket}, File Name: ${filePath}, Result URL: ${publicUrl}`,
    );

    return res.json({ success: true, publicUrl });
  } catch (err: any) {
    console.error(
      `[STORAGE LOG] Unexpected Error in upload handler for bucket ${bucket}:`,
      err,
    );
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/platform-settings", async (req: any, res: any) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({
      success: true,
      data: { id: "default", platformFeePerPlate: 2, homepage_mode: "classic" }
    });
  }

  try {
    // Fetch ONLY the same platform_settings row ('default')
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return res.json({ success: true, data });
    } else {
      // Seed default if row doesn't exist yet
      const defaultRow = { id: "default", platformFeePerPlate: 2, homepage_mode: "classic" };
      const { data: inserted, error: insertError } = await supabase
        .from("platform_settings")
        .insert([defaultRow])
        .select()
        .maybeSingle();

      if (insertError) {
        console.error("[SERVER] Failed to insert default platform settings row:", insertError);
        return res.json({ success: true, data: defaultRow });
      }

      return res.json({ success: true, data: inserted || defaultRow });
    }
  } catch (err: any) {
    console.error("[SERVER] Error in GET /api/platform-settings:", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/platform-settings", async (req: any, res: any) => {
  const supabase = getSupabaseClient();
  const { platformFeePerPlate, homepage_mode } = req.body;

  if (homepage_mode && homepage_mode !== "classic" && homepage_mode !== "marketplace") {
    return res.status(400).json({ error: "Invalid homepage_mode. Must be 'classic' or 'marketplace'" });
  }

  if (!supabase) {
    console.warn("[SERVER] Supabase not configured. Simulating platform settings save.");
    return res.json({
      success: true,
      rowId: "default",
      previousHomepageMode: "classic",
      newHomepageMode: homepage_mode || "classic",
      updateResponse: { message: "Simulated response" },
      affectedRowCount: 1,
      databaseValueAfter: homepage_mode || "classic"
    });
  }

  try {
    // 1. Fetch the existing row to get previous values
    const { data: beforeData, error: beforeError } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (beforeError) {
      throw beforeError;
    }

    const previousHomepageMode = beforeData?.homepage_mode || "classic";
    const previousFee = beforeData?.platformFeePerPlate || 2;

    const nextFee = platformFeePerPlate !== undefined ? Number(platformFeePerPlate) : previousFee;
    const nextMode = homepage_mode || previousHomepageMode;

    // 2. Perform the UPDATE query directly on the row where id = 'default' (ensures NO duplicate rows)
    const updatePayload = {
      platformFeePerPlate: nextFee,
      homepage_mode: nextMode,
      updated_at: new Date().toISOString()
    };

    const updateResponse = await supabase
      .from("platform_settings")
      .update(updatePayload)
      .eq("id", "default")
      .select();

    const { data: afterUpdate, error: updateError } = updateResponse;

    if (updateError) {
      throw updateError;
    }

    const affectedRowCount = afterUpdate ? afterUpdate.length : 0;

    // 3. If update affected 0 rows, try inserting it (healing database) or return error
    let finalAffectedCount = affectedRowCount;
    let finalAfterUpdate = afterUpdate;

    if (affectedRowCount === 0) {
      console.warn("[SERVER] UPDATE affected 0 rows. Attempting to insert the row...");
      const { data: inserted, error: insertError } = await supabase
        .from("platform_settings")
        .insert([{ id: "default", ...updatePayload }])
        .select();

      if (insertError) {
        console.error("[SERVER] Failed to insert row after UPDATE affected 0 rows:", insertError);
        return res.status(500).json({
          error: "Database UPDATE affected 0 rows and self-healing INSERT failed.",
          affectedRowCount: 0
        });
      }

      if (inserted && inserted.length > 0) {
        finalAffectedCount = inserted.length;
        finalAfterUpdate = inserted;
      }
    }

    // 4. Immediately query the database again and verify that homepage_mode has actually changed
    const { data: verifyData, error: verifyError } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (verifyError) {
      throw verifyError;
    }

    const databaseValueAfter = verifyData?.homepage_mode || "classic";

    console.log("[SERVER] Platform Settings Save Flow complete:", {
      rowId: "default",
      previousHomepageMode,
      newHomepageMode: nextMode,
      affectedRowCount: finalAffectedCount,
      databaseValueAfter
    });

    return res.json({
      success: true,
      rowId: "default",
      previousHomepageMode,
      newHomepageMode: nextMode,
      updateResponse: updateResponse,
      affectedRowCount: finalAffectedCount,
      databaseValueAfter
    });
  } catch (err: any) {
    console.error("[SERVER] Error in POST /api/platform-settings:", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

// Server-side robust database synchronization endpoint (bypasses RLS)
app.post("/api/sync", async (req: any, res: any) => {
  const { tableName, localData } = req.body;

  const VALID_TABLES = ['caterer_registrations', 'orders', 'notifications', 'audit_logs', 'food_images'];
  if (!tableName || !VALID_TABLES.includes(tableName)) {
    return res.status(400).json({ error: `Invalid or missing tableName: ${tableName}` });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(200).json({ success: true, warning: "Supabase not configured, sync bypassed in simulation mode" });
  }

  const syncWhitelists: Record<string, string[]> = {
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

  const syncUuidColumns: Record<string, string[]> = {
    caterer_registrations: ['id'],
    orders: ['catererId'],
    notifications: ['id', 'catererId'],
    audit_logs: ['id']
  };

  const helperToUUID = (str: any): any => {
    if (str === null || str === undefined) return str;
    if (typeof str !== 'string') return str;
    const clean = str.trim();
    if (clean === '') return null;
    const relaxedUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (relaxedUuidRegex.test(clean)) return clean.toLowerCase();
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
  };

  const helperParseToDbDate = (dateStr: any): string | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const cleaned = dateStr.trim();
    if (!cleaned) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
    const firstPart = cleaned.split(',')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(firstPart)) return firstPart;
    let parseable = firstPart
      .replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, '')
      .trim();
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
    return null;
  };

  try {
    const dataList = Array.isArray(localData) ? localData : [localData];
    console.log(`[SERVER SYNC] Processing ${dataList.length} items for table "${tableName}"...`);

    for (const item of dataList) {
      if (!item || typeof item !== 'object') continue;
      const sanitized = { ...item };

      // Standardize timestamps
      if (sanitized.createdAt) {
        if (!sanitized.created_at) sanitized.created_at = sanitized.createdAt;
        delete sanitized.createdAt;
      }
      if (sanitized.updatedAt) {
        if (!sanitized.updated_at) sanitized.updated_at = sanitized.updatedAt;
        delete sanitized.updatedAt;
      }

      if (tableName === 'orders') {
        if (sanitized.selectedItems && !sanitized.items) {
          sanitized.items = sanitized.selectedItems;
        }
        if (sanitized.eventDate) {
          sanitized.eventDate = helperParseToDbDate(sanitized.eventDate);
        }
      }

      // Filter and sanitize payload against whitelist
      const whitelist = syncWhitelists[tableName];
      const attemptPayload: any = {};
      
      if (whitelist) {
        for (const key of Object.keys(sanitized)) {
          if (whitelist.includes(key)) {
            let val = sanitized[key];
            const uuidCols = syncUuidColumns[tableName];
            if (uuidCols && uuidCols.includes(key)) {
              val = helperToUUID(val);
            }
            attemptPayload[key] = val;
          } else {
            if (tableName === 'notifications') {
              if (key === 'targetRole' || key === 'type') {
                attemptPayload.targetRole = sanitized[key];
              }
              if (key === 'read' || key === 'is_read') {
                attemptPayload.read = sanitized[key];
              }
            }
          }
        }
      }

      if (tableName === 'notifications') {
        if (attemptPayload.targetRole === undefined) {
          if (item.targetRole !== undefined) attemptPayload.targetRole = item.targetRole;
          else if (item.type !== undefined) attemptPayload.targetRole = item.type;
        }
        if (attemptPayload.read === undefined) {
          if (item.read !== undefined) attemptPayload.read = item.read;
          else if (item.is_read !== undefined) attemptPayload.read = item.is_read;
        }
      }

      if (tableName === 'caterer_registrations') {
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
          attemptPayload.includedItems = mergedIncluded;
        }

        virtualKeys.forEach(k => {
          delete attemptPayload[k];
        });
      }

      // Perform direct Server-Side Upsert (Bypasses Client-Side RLS restriction perfectly!)
      let success = false;
      let errorResponse: any = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        const { error } = await supabase
          .from(tableName)
          .upsert(attemptPayload, { onConflict: 'id' });

        if (!error) {
          success = true;
          break;
        }

        errorResponse = error;

        // Strip nonexistent columns automatically on PGRST204 errors
        if (error.code === 'PGRST204') {
          const match = error.message?.match(/Could not find (?:the )?['"]?([a-zA-Z0-9_]+)['"]? column/i) || 
                        error.message?.match(/column:? ['"]?([a-zA-Z0-9_]+)['"]?/i) ||
                        error.message?.match(/Could not find column ['"]?([a-zA-Z0-9_]+)['"]?/i);
                        
          const missingColumn = match ? match[1] : null;
          if (missingColumn && attemptPayload[missingColumn] !== undefined) {
            console.warn(`[SERVER SYNC WARNING] Column "${missingColumn}" does not exist in database. Stripping and retrying...`);
            delete attemptPayload[missingColumn];
            continue;
          }
        }
        break;
      }

      if (!success && errorResponse) {
        console.error(`[SERVER SYNC ERROR] Failed item upsert for "${tableName}":`, errorResponse);
        return res.status(500).json({ error: errorResponse.message || "Upsert failed" });
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[SERVER SYNC CRASH]", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

// Proxy routes for Supabase Auth to bypass iframe CORS/fetch network restrictions
app.post("/api/auth/login", async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password are required" } });
  }

  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").trim();
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: { message: "Supabase not configured on server" } });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || err.toString() } });
  }
});

app.post("/api/auth/signup", async (req: any, res: any) => {
  const { email, password, options } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: { message: "Email and password are required" } });
  }

  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").trim();
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: { message: "Supabase not configured on server" } });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || err.toString() } });
  }
});

app.post("/api/auth/resend", async (req: any, res: any) => {
  const { type, email } = req.body;
  if (!email || !type) {
    return res.status(400).json({ error: { message: "Email and type are required" } });
  }

  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").trim();
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: { message: "Supabase not configured on server" } });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await supabase.auth.resend({
      type,
      email
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || err.toString() } });
  }
});

app.post("/api/auth/reset-password-request", async (req: any, res: any) => {
  const { email, redirectTo } = req.body;
  if (!email) {
    return res.status(400).json({ error: { message: "Email is required" } });
  }

  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").trim();
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: { message: "Supabase not configured on server" } });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || err.toString() } });
  }
});

app.post("/api/admin/reset-password", async (req: any, res: any) => {
  const { catererId, newPassword } = req.body;

  if (!catererId || !newPassword) {
    return res
      .status(400)
      .json({ error: "catererId and newPassword are required parameters." });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters." });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(
      "Supabase not fully setup on server, simulation mode success.",
    );
    return res.json({
      success: true,
      offline: true,
      message: "Credentials successfully updated in local offline database.",
    });
  }

  try {
    // 1. Get caterer registration
    const { data: caterer, error: fetchErr } = await supabase
      .from("caterer_registrations")
      .select("*")
      .eq("id", catererId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error fetching caterer registration:", fetchErr);
      return res
        .status(500)
        .json({
          error: "Failed to fetch caterer registration: " + fetchErr.message,
        });
    }

    if (!caterer) {
      return res
        .status(404)
        .json({ error: "Caterer profile not found with the provided id." });
    }

    const email = caterer.email;
    if (!email) {
      return res
        .status(400)
        .json({
          error: "This caterer has no registered email. Cannot perform reset.",
        });
    }

    let authUser = null;
    let userId = caterer.userId;

    // 2. Find Auth user
    const { data: listData, error: listErr } =
      await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error("Error listing users from auth admin:", listErr);
    } else if (listData?.users) {
      // Find by userId first, or fallback to email match
      authUser = listData.users.find(
        (u: any) =>
          (userId && u.id === userId) ||
          u.email?.toLowerCase() === email.toLowerCase(),
      );
    }

    if (authUser) {
      console.log(
        `[AUTH ADMIN] Found existing auth user ${authUser.id} for email ${email}. Updating password...`,
      );
      const { data: updatedUser, error: updateErr } =
        await supabase.auth.admin.updateUserById(authUser.id, {
          password: newPassword,
        });

      if (updateErr) {
        console.error("Error updating password in auth admin:", updateErr);
        return res
          .status(500)
          .json({
            error: "Supabase Auth password update failed: " + updateErr.message,
          });
      }

      userId = authUser.id;
    } else {
      console.log(
        `[AUTH ADMIN] No auth user found for email ${email}. Creating a new auth account...`,
      );
      const { data: newUser, error: createErr } =
        await supabase.auth.admin.createUser({
          email: email,
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            role: "caterer",
            full_name: caterer.ownerName || caterer.businessName || "Caterer",
          },
        });

      if (createErr) {
        console.error("Error creating user in auth admin:", createErr);
        return res
          .status(500)
          .json({
            error: "Supabase Auth user creation failed: " + createErr.message,
          });
      }

      const createdUser = newUser?.user;
      if (!createdUser) {
        return res
          .status(500)
          .json({
            error: "Supabase Auth user creation resulted in empty payload.",
          });
      }

      userId = createdUser.id;
      authUser = createdUser;
    }

    const finalEmail = authUser?.email || email;

    // Check if user is an admin
    const isAdminEmail = ["meda1824@gmail.com", "ybmk24@gmail.com"].includes(
      finalEmail.toLowerCase().trim(),
    );
    const isAdminRole = authUser?.user_metadata?.role === "admin";
    const finalRole = isAdminEmail || isAdminRole ? "admin" : "caterer";

    // 3. Keep caterer_registrations and profiles tables in perfect sync
    // Update user ID and email in registrations
    const { error: updateRegError } = await supabase
      .from("caterer_registrations")
      .update({
        userId: userId,
        email: finalEmail,
      })
      .eq("id", catererId);

    if (updateRegError) {
      console.warn(
        "Warning: caterer_registrations table sync failed:",
        updateRegError.message,
      );
    }

    // Create or update profiles row
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: finalEmail,
          full_name:
            isAdminEmail || isAdminRole
              ? authUser?.user_metadata?.full_name || "Primary Admin"
              : caterer.ownerName || caterer.businessName || "Caterer",
          role: finalRole,
          must_change_password: false,
        },
        { onConflict: "id" },
      );

    if (updateProfileError) {
      console.warn(
        "Warning: profiles table sync failed:",
        updateProfileError.message,
      );
    }

    console.log(
      `[AUTH ADMIN] Successfully synchronized reset credential flow for caterer ${catererId}`,
    );
    return res.json({
      success: true,
      message:
        "Caterer password and credentials successfully reset and synchronized.",
    });
  } catch (err: any) {
    console.error("Unexpected error in admin reset-password flow:", err);
    return res
      .status(500)
      .json({ error: "Internal server error: " + err.message });
  }
});

app.post("/api/admin/approve-caterer", async (req: any, res: any) => {
  const { catererId } = req.body;

  if (!catererId) {
    return res.status(400).json({ error: "catererId is required." });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn(
      "Supabase not fully setup on server, simulation mode success.",
    );
    return res.json({
      success: true,
      offline: true,
      message: "Approved successfully in local storage fallback mode.",
    });
  }

  try {
    // 1. Get caterer registration
    const { data: caterer, error: fetchErr } = await supabase
      .from("caterer_registrations")
      .select("*")
      .eq("id", catererId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error fetching caterer registration:", fetchErr);
      return res
        .status(500)
        .json({
          error: "Failed to fetch caterer registration: " + fetchErr.message,
        });
    }

    if (!caterer) {
      return res
        .status(404)
        .json({ error: "Caterer profile not found with the provided id." });
    }

    const email = caterer.email;
    if (!email) {
      return res
        .status(400)
        .json({
          error:
            "This caterer has no registered email. Cannot perform approval sync.",
        });
    }

    let authUser = null;
    let userId = caterer.userId;

    // 2. See if Auth user already exists by listing users
    const { data: listData, error: listErr } =
      await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error("Error listing users from auth admin:", listErr);
    } else if (listData?.users) {
      authUser = listData.users.find(
        (u: any) =>
          (userId && u.id === userId) ||
          u.email?.toLowerCase() === email.toLowerCase(),
      );
    }

    if (authUser) {
      console.log(
        `[AUTH ADMIN] Existing auth user found with ID: ${authUser.id} on approval.`,
      );
      userId = authUser.id;
    } else {
      console.log(
        `[AUTH ADMIN] No auth user found for email ${email}. Automatically creating active account...`,
      );
      const registeredPassword = caterer.password || "TempPass123!";
      const { data: newUser, error: createErr } =
        await supabase.auth.admin.createUser({
          email: email,
          password: registeredPassword,
          email_confirm: true,
          user_metadata: {
            role: "caterer",
            full_name: caterer.ownerName || caterer.businessName || "Caterer",
          },
        });

      if (createErr) {
        console.error("Error auto-creating auth user on approval:", createErr);
        return res
          .status(500)
          .json({
            error: "Supabase Auth user creation failed: " + createErr.message,
          });
      }

      const createdUser = newUser?.user;
      if (!createdUser) {
        return res
          .status(500)
          .json({
            error: "Supabase Auth user creation returned empty payload.",
          });
      }

      userId = createdUser.id;
      authUser = createdUser;
      console.log(`[AUTH ADMIN] Created new auth user on approval: ${userId}`);
    }

    const finalEmail = authUser?.email || email;

    // Check if user is an admin
    const isAdminEmail = ["meda1824@gmail.com", "ybmk24@gmail.com"].includes(
      finalEmail.toLowerCase().trim(),
    );
    const isAdminRole = authUser?.user_metadata?.role === "admin";
    const finalRole = isAdminEmail || isAdminRole ? "admin" : "caterer";

    // 3. Keep caterer_registrations and profiles tables in perfect sync
    // Update status, email, and user ID in registrations
    const { error: updateRegError } = await supabase
      .from("caterer_registrations")
      .update({
        userId: userId,
        email: finalEmail,
        status: "Approved",
      })
      .eq("id", catererId);

    if (updateRegError) {
      console.warn(
        "Warning: caterer_registrations table sync failed on approval:",
        updateRegError.message,
      );
    }

    // Create or update profiles row with correct identity properties
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: finalEmail,
          full_name:
            isAdminEmail || isAdminRole
              ? authUser?.user_metadata?.full_name || "Primary Admin"
              : caterer.ownerName || caterer.businessName || "Caterer",
          role: finalRole,
          must_change_password: isAdminEmail || isAdminRole ? false : true,
        },
        { onConflict: "id" },
      );

    if (updateProfileError) {
      console.warn(
        "Warning: profiles table sync failed on approval:",
        updateProfileError.message,
      );
    }

    console.log(
      `[AUTH ADMIN] Successfully synchronized approval credential flow for caterer ${catererId}`,
    );
    return res.json({
      success: true,
      userId: userId,
      message:
        "Caterer approved, Auth user created, and profile synchronized with must_change_password.",
    });
  } catch (err: any) {
    console.error("Unexpected error in admin approve-caterer flow:", err);
    return res
      .status(500)
      .json({ error: "Internal server error: " + err.message });
  }
});

const parseMenuHandler = async (req: any, res: any) => {
  try {
    const { imageBase64, images, urls, catererId } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured" });
    }

    const parts: any[] = [];

    if (urls && Array.isArray(urls) && urls.length > 0) {
      console.log(
        `[MENU PARSER] Processing menu files from public URLs:`,
        urls,
      );
      for (const url of urls) {
        try {
          console.log(`[MENU PARSER] Server fetching menu file: ${url}`);
          const fetchRes = await fetch(url);
          if (!fetchRes.ok) {
            throw new Error(
              `HTTP error fetching ${url}: ${fetchRes.statusText}`,
            );
          }
          const arrayBuf = await fetchRes.arrayBuffer();
          const base64Data = Buffer.from(arrayBuf).toString("base64");

          let mimeType =
            fetchRes.headers.get("content-type") || "application/pdf";
          if (url.toLowerCase().endsWith(".pdf")) {
            mimeType = "application/pdf";
          } else if (url.toLowerCase().endsWith(".png")) {
            mimeType = "image/png";
          } else if (
            url.toLowerCase().endsWith(".jpg") ||
            url.toLowerCase().endsWith(".jpeg")
          ) {
            mimeType = "image/jpeg";
          }

          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        } catch (fetchErr: any) {
          console.error(
            `[MENU PARSER] Failed to fetch menu file from storage: ${url}`,
            fetchErr,
          );
        }
      }
    } else {
      const imageArray = images || (imageBase64 ? [imageBase64] : []);
      if (imageArray.length === 0) {
        return res
          .status(400)
          .json({
            error: "Image data (images/imageBase64) or urls is required",
          });
      }

      imageArray.forEach((b64: string) => {
        const match = b64.match(/^data:(.+?);base64,(.+)$/);
        let mimeType = "image/jpeg";
        let base64Data = b64;

        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          base64Data = b64.replace(/^data:image\/\w+;base64,/, "");
        }
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
      });
    }

    if (parts.length === 0) {
      return res
        .status(400)
        .json({
          error: "No valid menu document content could be fetched or extracted",
        });
    }

    // Lazy initialization of active GoogleGenAI Client
    const aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const prompt = `
You are an expert catering menu document parser. You must analyze the provided menu document(s) (which can be multiple pages or images) and comprehensively extract the data into structured JSON.

Your tasks:
1. Extract Caterer Details: Extract Caterer Name (businessName), Owner Name, Address/City from the document if they exist.
2. Extract logo, brand name, and contact numbers:
   - Identify if there is a logo or brand emblem physically present inside the document (set logoFound to true or false).
   - If a logo is found, describe it or set a valid reference.
   - Separate extracted contact numbers into exactly three lines:
     - primaryWhatsApp: Line 1 (Primary WhatsApp Number, typically key contact mobile number, digits only e.g. "9441170159")
     - secondaryPhone: Line 2 (Secondary Number, digits only)
     - additionalPhone: Line 3 (Optional third number, digits only)
3. Identify all PACKAGES. Detect all packages across multiple pages (Veg, Non-Veg, etc). If you see breakfast items, put them in a separate 'Breakfast' package.
4. Connect Pricing Matrix / Slabs to Packages: Many menus contain pricing slabs based on minimum and maximum guest counts.
Example:
"100-199 Guests = ₹615 per plate" -> minGuests: 100, maxGuests: 199, price: 615
"200-299 Guests = ₹500 per plate" -> minGuests: 200, maxGuests: 299, price: 500
You MUST extract these slabs and place them under the \`pricingSlabs\` array for each package.
5. Link CATEGORIES to PACKAGES. list the categories included in each package, along with the selection rule for each category (e.g. "Choose Any 1", "Choose Any 2", "Choose Any 3", "Included", "Fixed").
6. Connect DISHES to CATEGORIES. Look at the detailed menu pages to find the actual list of items for each category and assign them to the respective categories inside the package. Every item under every category must be extracted.
7. Extract ADD-ONS.
8. Extract GENERAL INCLUDED ITEMS/TERMS.

Strict Rules:
- Return ONLY valid JSON. No markdown wrappers (\`\`\`json etc.).
- EXTRACT ONLY WHAT IS EXACTLY WRITTEN IN THE TEXT. Do not invent, guess, or hallucinate dishes, categories, or packages.
- CRITICAL: DO NOT create a category if there are no valid dishes found in the document.
- Ignore empty categories entirely.
- Ensure selection rules directly state limits (e.g. "Choose Any 1") to aid customer ordering flow.
- Ensure pricing slabs are properly structured.
- Output schema MUST follow EXACTLY:
{
  "catererDetails": {
    "businessName": "String | null",
    "ownerName": "String | null",
    "primaryWhatsApp": "String | null",
    "secondaryPhone": "String | null",
    "additionalPhone": "String | null",
    "phone": "String | null",
    "alternatePhone": "String | null",
    "address": "String | null",
    "city": "String | null",
    "logoFound": Boolean,
    "logoUrl": "String | null"
  },
  "packages": [
    {
      "packageName": "String",
      "packageType": "String", 
      "pricingSlabs": [
        { "minGuests": Number, "maxGuests": Number | null, "price": Number }
      ],
      "categories": [
        {
          "categoryName": "String",
          "selectionRule": "String",
          "items": ["String", "String"]
        }
      ]
    }
  ],
  "addOns": [
    { "itemName": "String", "price": Number, "unit": "String" }
  ],
  "includedItems": ["String"]
}
`;

    // Process actual uploaded files and run Gemini multimodal model
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [...parts, { text: prompt }],
    });

    const text = response.text || "";
    // Clean JSON parsing
    let jsonStr = text;
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.substring(7);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
    }

    const data = JSON.parse(jsonStr.trim());

    // Auto logo logic from menu upload
    if (data.catererDetails) {
      // Keep compatible with legacy fields
      data.catererDetails.phone =
        data.catererDetails.primaryWhatsApp || data.catererDetails.phone;
      data.catererDetails.alternatePhone =
        data.catererDetails.secondaryPhone ||
        data.catererDetails.alternatePhone;

      if (data.catererDetails.logoFound) {
        if (urls && Array.isArray(urls) && urls.length > 0) {
          data.catererDetails.logoUrl = urls[0];
        } else {
          data.catererDetails.logoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.catererDetails.businessName || "Caterer")}&backgroundColor=0b3d2e&textColor=d4a437`;
        }
      } else {
        data.catererDetails.logoUrl = "";
      }
    }

    // Process newly scanned items to map food images automatically
    if (data.packages && Array.isArray(data.packages)) {
      data.packages.forEach((pkg: any) => {
        if (pkg.categories && Array.isArray(pkg.categories)) {
          pkg.categories.forEach((cat: any) => {
            if (cat.items && Array.isArray(cat.items)) {
              cat.items.forEach((item: string) => {
                if (typeof item === "string" && item) {
                  autoMapFoodImage(item);
                }
              });
            }
          });
        }
      });
    }

    // Auto-save parsed results to Database if a valid catererId is provided
    if (catererId) {
      const supabase = getSupabaseClient();
      if (supabase) {
        console.log(
          `Auto-saving extracted menu packages to Supabase for caterer: ${catererId}`,
        );
        const { error: dbError } = await supabase
          .from("caterer_registrations")
          .update({
            packages: data.packages || [],
            addOns: data.addOns || [],
            includedItems: data.includedItems || [],
            menuUploaded: true,
          })
          .eq("id", catererId);

        if (dbError) {
          console.error(
            "Failed to auto-save scanned menu components to database:",
            dbError,
          );
        } else {
          console.log(
            `Successfully synced scanned menu and packages back to database for caterer ${catererId}`,
          );
        }
      }
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error parsing menu:", error);
    res.status(500).json({ error: "Failed to parse menu: " + error.message });
  }
};

const saveMenuHandler = async (req: any, res: any) => {
  try {
    const { catererId, packages, addOns, includedItems, catererDetails } =
      req.body;
    if (!catererId) {
      return res.status(400).json({ error: "catererId parameter is required" });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const updatePayload: any = {
        packages: packages || [],
        addOns: addOns || [],
        includedItems: includedItems || [],
        menuUploaded: true,
      };

      if (catererDetails) {
        if (catererDetails.businessName)
          updatePayload.businessName = catererDetails.businessName;
        if (catererDetails.ownerName)
          updatePayload.ownerName = catererDetails.ownerName;
        if (catererDetails.phone || catererDetails.primaryWhatsApp)
          updatePayload.phone =
            catererDetails.primaryWhatsApp || catererDetails.phone;
        if (catererDetails.alternatePhone || catererDetails.secondaryPhone)
          updatePayload.alternatePhone =
            catererDetails.secondaryPhone || catererDetails.alternatePhone;
        if (catererDetails.additionalPhone)
          updatePayload.additionalPhone = catererDetails.additionalPhone;
        if (catererDetails.address)
          updatePayload.address = catererDetails.address;
        if (catererDetails.city) updatePayload.city = catererDetails.city;
        if (catererDetails.logoUrl) {
          updatePayload.logo = catererDetails.logoUrl;
          updatePayload.catererLogo = catererDetails.logoUrl;
        }
      }

      console.log(`Updating caterer ${catererId} menu options on Supabase...`);
      const { data, error } = await supabase
        .from("caterer_registrations")
        .update(updatePayload)
        .eq("id", catererId)
        .select();

      if (error) {
        console.error("Failed to save menu on Supabase:", error);
        return res.status(500).json({ error: error.message });
      }
      return res.json({ success: true, data });
    } else {
      console.warn(
        "Supabase not fully configured on server, returning offline simulation status",
      );
      return res.json({ success: true, offline: true });
    }
  } catch (err: any) {
    console.error("Error in saveMenuHandler:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

app.post("/api/parse-menu", parseMenuHandler);
app.post("/api/scan-menu", parseMenuHandler);
app.post("/api/extract-menu", parseMenuHandler);
app.post("/api/process-menu", parseMenuHandler);
app.post("/api/save-menu", saveMenuHandler);

const IMAGES_FILE_PATH = path.join(
  process.cwd(),
  "src/data/food_item_images.json",
);

const SEED_FOOD_ITEMS = [
  // South Indian
  {
    item_name: "Idli",
    image_url:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=450&auto=format&fit=crop&q=80",
    category: "Breakfast",
    cuisine: "South Indian",
  },
  {
    item_name: "Dosa",
    image_url:
      "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=450&auto=format&fit=crop&q=80",
    category: "Breakfast",
    cuisine: "South Indian",
  },
  {
    item_name: "Puri",
    image_url:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80",
    category: "Breakfast",
    cuisine: "South Indian",
  },
  {
    item_name: "Vada",
    image_url:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80",
    category: "Breakfast",
    cuisine: "South Indian",
  },
  {
    item_name: "Sambar",
    image_url:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80",
    category: "Gravy / Curry",
    cuisine: "South Indian",
  },
  {
    item_name: "Rasam",
    image_url:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80",
    category: "Soup / Gravy",
    cuisine: "South Indian",
  },
  {
    item_name: "Veg Biryani",
    image_url:
      "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=450&auto=format&fit=crop&q=80",
    category: "Rice",
    cuisine: "South Indian",
  },
  {
    item_name: "Chicken Biryani",
    image_url:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=450&auto=format&fit=crop&q=80",
    category: "Main Course",
    cuisine: "South Indian",
  },
  {
    item_name: "Mutton Biryani",
    image_url:
      "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=450&auto=format&fit=crop&q=80",
    category: "Main Course",
    cuisine: "South Indian",
  },
  {
    item_name: "Paneer Curry",
    image_url:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80",
    category: "Gravy / Curry",
    cuisine: "South Indian",
  },
  {
    item_name: "Veg Fried Rice",
    image_url:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80",
    category: "Rice",
    cuisine: "South Indian",
  },
  {
    item_name: "Gobi Manchurian",
    image_url:
      "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "South Indian",
  },

  // North Indian
  {
    item_name: "Paneer Butter Masala",
    image_url:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80",
    category: "Gravy / Curry",
    cuisine: "North Indian",
  },
  {
    item_name: "Palak Paneer",
    image_url:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=450&auto=format&fit=crop&q=80",
    category: "Gravy / Curry",
    cuisine: "North Indian",
  },
  {
    item_name: "Dal Makhani",
    image_url:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80",
    category: "Dal & Lentils",
    cuisine: "North Indian",
  },
  {
    item_name: "Butter Naan",
    image_url:
      "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80",
    category: "Breads",
    cuisine: "North Indian",
  },
  {
    item_name: "Rumali Roti",
    image_url:
      "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80",
    category: "Breads",
    cuisine: "North Indian",
  },
  {
    item_name: "Jeera Rice",
    image_url:
      "https://images.unsplash.com/photo-1591814468924-caf77022753c?w=450&auto=format&fit=crop&q=80",
    category: "Rice",
    cuisine: "North Indian",
  },
  {
    item_name: "Kaju Curry",
    image_url:
      "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80",
    category: "Gravy / Curry",
    cuisine: "North Indian",
  },
  {
    item_name: "Chole Bhature",
    image_url:
      "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80",
    category: "Main Course",
    cuisine: "North Indian",
  },

  // Chinese
  {
    item_name: "Veg Noodles",
    image_url:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=450&auto=format&fit=crop&q=80",
    category: "Noodles",
    cuisine: "Chinese",
  },
  {
    item_name: "Hakka Noodles",
    image_url:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=450&auto=format&fit=crop&q=80",
    category: "Noodles",
    cuisine: "Chinese",
  },
  {
    item_name: "Veg Manchurian",
    image_url:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "Chinese",
  },
  {
    item_name: "Chicken Manchurian",
    image_url:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "Chinese",
  },
  {
    item_name: "Spring Rolls",
    image_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "Chinese",
  },
  {
    item_name: "Fried Rice",
    image_url:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80",
    category: "Rice",
    cuisine: "Chinese",
  },

  // Desserts
  {
    item_name: "Gulab Jamun",
    image_url:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80",
    category: "Desserts",
    cuisine: "Desserts",
  },
  {
    item_name: "Rasgulla",
    image_url:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80",
    category: "Desserts",
    cuisine: "Desserts",
  },
  {
    item_name: "Double Ka Meetha",
    image_url:
      "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80",
    category: "Desserts",
    cuisine: "Desserts",
  },
  {
    item_name: "Ice Cream",
    image_url:
      "https://images.unsplash.com/photo-1501443712940-3decff3f6d90?w=450&auto=format&fit=crop&q=80",
    category: "Desserts",
    cuisine: "Desserts",
  },
  {
    item_name: "Fruit Salad",
    image_url:
      "https://images.unsplash.com/photo-1564093490129-74f1f56b9052?w=450&auto=format&fit=crop&q=80",
    category: "Desserts",
    cuisine: "Desserts",
  },

  // Beverages
  {
    item_name: "Fruit Punch",
    image_url:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80",
    category: "Beverages",
    cuisine: "Beverages",
  },
  {
    item_name: "Mojito",
    image_url:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80",
    category: "Beverages",
    cuisine: "Beverages",
  },
  {
    item_name: "Soft Drinks",
    image_url:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80",
    category: "Beverages",
    cuisine: "Beverages",
  },
  {
    item_name: "Welcome Drink",
    image_url:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80",
    category: "Beverages",
    cuisine: "Beverages",
  },
  {
    item_name: "Badam Milk",
    image_url:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80",
    category: "Beverages",
    cuisine: "Beverages",
  },

  // Commonly Known Extra Items
  {
    item_name: "Paneer Tikka",
    image_url:
      "https://images.unsplash.com/photo-1567184109411-47a7a3746aed?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "North Indian",
  },
  {
    item_name: "Gobi 65",
    image_url:
      "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "South Indian",
  },
  {
    item_name: "Aloo Tikki",
    image_url:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "North Indian",
  },
  {
    item_name: "French Fries",
    image_url:
      "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "Western",
  },
  {
    item_name: "Crispy Corn",
    image_url:
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=450&auto=format&fit=crop&q=80",
    category: "Starter",
    cuisine: "Chinese",
  },
  {
    item_name: "Garlic Naan",
    image_url:
      "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80",
    category: "Breads",
    cuisine: "North Indian",
  },
  {
    item_name: "Tandoori Roti",
    image_url:
      "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80",
    category: "Breads",
    cuisine: "North Indian",
  },
  {
    item_name: "Vanilla Ice Cream",
    image_url:
      "https://images.unsplash.com/photo-1501443712940-3decff3f6d90?w=450&auto=format&fit=crop&q=80",
    category: "Desserts",
    cuisine: "Desserts",
  },
  {
    item_name: "Butterscotch Ice Cream",
    image_url:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=450&auto=format&fit=crop&q=80",
    category: "Desserts",
    cuisine: "Desserts",
  },
  {
    item_name: "Sweet Lassi",
    image_url:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80",
    category: "Beverages",
    cuisine: "North Indian",
  },
];

function getFoodImages() {
  try {
    if (fs.existsSync(IMAGES_FILE_PATH)) {
      const data = fs.readFileSync(IMAGES_FILE_PATH, "utf-8").trim();
      if (!data) {
        return [];
      }
      try {
        return JSON.parse(data);
      } catch (parseErr) {
        console.error("SyntaxError parsing food images JSON. Recovering with empty list...", parseErr);
        return [];
      }
    }
  } catch (error) {
    console.error("Error reading food images:", error);
  }
  return [];
}

function saveFoodImages(images: any[]) {
  try {
    const dir = path.dirname(IMAGES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      IMAGES_FILE_PATH,
      JSON.stringify(images, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("Error saving food images:", error);
  }
}

function seedFoodImagesOnStartup() {
  try {
    const images = getFoodImages();
    let updated = false;
    const now = new Date().toISOString();

    for (const item of SEED_FOOD_ITEMS) {
      const exists = images.some(
        (img: any) =>
          img.item_name.toLowerCase().trim() ===
          item.item_name.toLowerCase().trim(),
      );
      if (!exists) {
        images.push({
          id: Math.random().toString(36).substr(2, 9),
          item_name: item.item_name,
          image_url: item.image_url,
          category: item.category,
          cuisine: item.cuisine,
          approved_by_admin: true,
          status: "Approved",
          created_at: now,
          updated_at: now,
        });
        updated = true;
      } else {
        // Enforce proper category and cuisine for seeded items if undefined
        const idx = images.findIndex(
          (img: any) =>
            img.item_name.toLowerCase().trim() ===
            item.item_name.toLowerCase().trim(),
        );
        if (idx !== -1) {
          let itemUpdated = false;
          if (!images[idx].category) {
            images[idx].category = item.category;
            itemUpdated = true;
          }
          if (!images[idx].cuisine) {
            images[idx].cuisine = item.cuisine;
            itemUpdated = true;
          }
          if (!images[idx].status) {
            images[idx].status = "Approved";
            itemUpdated = true;
          }
          if (!images[idx].image_url && item.image_url) {
            images[idx].image_url = item.image_url;
            itemUpdated = true;
          }
          if (itemUpdated) updated = true;
        }
      }
    }

    if (updated || images.length === 0) {
      saveFoodImages(images);
      console.log(
        "Central Food Image Library seeded successfully with master items.",
      );
    }
  } catch (error) {
    console.error("Error seeding food images:", error);
  }
}

function fuzzyMatchFoodImage(itemName: string) {
  const images = getFoodImages();
  const query = itemName.toLowerCase().trim();

  // 1. Direct match first
  const exact = images.find(
    (i: any) => i.item_name.toLowerCase().trim() === query,
  );
  if (exact) return exact;

  // Helper to remove fillers and return significant lowercase words
  const cleanAndGetWords = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(
        (w) =>
          w &&
          ![
            "and",
            "with",
            "the",
            "special",
            "royal",
            "hot",
            "crispy",
            "fresh",
            "style",
            "signature",
            "authentic",
            "premium",
            "deluxe",
            "surprise",
          ].includes(w),
      );
  };

  const queryWords = cleanAndGetWords(query);
  if (queryWords.length === 0) return null;

  let bestMatch: any = null;
  let bestScore = 0;

  for (const img of images) {
    const imgWords = cleanAndGetWords(img.item_name);
    if (imgWords.length === 0) continue;

    // Calculate common word counts
    let matchCount = 0;
    for (const word of queryWords) {
      if (imgWords.includes(word)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const score = matchCount / Math.max(queryWords.length, imgWords.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = img;
      }
    }
  }

  // Define threshold for high confidence
  // If query is high confidence match (shares a good ratio of keywords)
  const isHighConfidence =
    bestScore >= 0.4 || (queryWords.length === 1 && bestScore === 1.0);
  if (isHighConfidence && bestMatch) {
    return bestMatch;
  }
  return null;
}

function autoMapFoodImage(itemName: string) {
  const images = getFoodImages();
  const lowerName = itemName.toLowerCase().trim();

  // Try mapping via our high-confidence fuzzy matching routine
  const matched = fuzzyMatchFoodImage(itemName);
  if (matched && matched.image_url) {
    return matched.image_url;
  }

  // Check if mapping already exists with status 'No Image'
  const existingEmpty = images.find(
    (i: any) => i.item_name.toLowerCase().trim() === lowerName,
  );
  if (existingEmpty) {
    return existingEmpty.image_url;
  }

  // Create auto-mapped metadata
  let category = "Starter";
  let cuisine = "Multicuisine";

  if (
    lowerName.includes("biryani") ||
    lowerName.includes("pulao") ||
    lowerName.includes("rice") ||
    lowerName.includes("pork fried rice")
  ) {
    category = "Rice";
  } else if (
    lowerName.includes("curry") ||
    lowerName.includes("masala") ||
    lowerName.includes("paneer") ||
    lowerName.includes("dal") ||
    lowerName.includes("gravy") ||
    lowerName.includes("kofta")
  ) {
    category = "Gravy / Curry";
  } else if (
    lowerName.includes("roti") ||
    lowerName.includes("naan") ||
    lowerName.includes("paratha") ||
    lowerName.includes("bread") ||
    lowerName.includes("kulcha")
  ) {
    category = "Breads";
  } else if (
    lowerName.includes("ice cream") ||
    lowerName.includes("halwa") ||
    lowerName.includes("jamun") ||
    lowerName.includes("kheer") ||
    lowerName.includes("sweet") ||
    lowerName.includes("dessert") ||
    lowerName.includes("rasgulla") ||
    lowerName.includes("meetha")
  ) {
    category = "Desserts";
  } else if (
    lowerName.includes("drink") ||
    lowerName.includes("juice") ||
    lowerName.includes("punch") ||
    lowerName.includes("mojito") ||
    lowerName.includes("beverage") ||
    lowerName.includes("milk") ||
    lowerName.includes("soda")
  ) {
    category = "Beverages";
  } else if (
    lowerName.includes("idli") ||
    lowerName.includes("dosa") ||
    lowerName.includes("puri") ||
    lowerName.includes("vada") ||
    lowerName.includes("sambar") ||
    lowerName.includes("breakfast")
  ) {
    category = "Breakfast";
  } else if (lowerName.includes("soup") || lowerName.includes("shorba")) {
    category = "Soup";
  }

  if (
    lowerName.includes("idli") ||
    lowerName.includes("dosa") ||
    lowerName.includes("puri") ||
    lowerName.includes("vada") ||
    lowerName.includes("sambar") ||
    lowerName.includes("rasam") ||
    lowerName.includes("south")
  ) {
    cuisine = "South Indian";
  } else if (
    lowerName.includes("paneer") ||
    lowerName.includes("dal") ||
    lowerName.includes("naan") ||
    lowerName.includes("bhature") ||
    lowerName.includes("north") ||
    lowerName.includes("kaju") ||
    lowerName.includes("roti") ||
    lowerName.includes("chole")
  ) {
    cuisine = "North Indian";
  } else if (
    lowerName.includes("noodle") ||
    lowerName.includes("manchurian") ||
    lowerName.includes("spring roll") ||
    lowerName.includes("chinese") ||
    lowerName.includes("hakka")
  ) {
    cuisine = "Chinese";
  } else if (category === "Desserts") {
    cuisine = "Desserts";
  } else if (category === "Beverages") {
    cuisine = "Beverages";
  }

  // It does not exist, so create database entry with NO IMAGE AVAILABLE
  const now = new Date().toISOString();
  images.push({
    id: Math.random().toString(36).substr(2, 9),
    item_name: itemName,
    image_url: "", // Empty URL for Fallback placeholder
    approved_by_admin: false,
    status: "No Image", // status "No Image" requires Admin approval/action
    category: category,
    cuisine: cuisine,
    created_at: now,
    updated_at: now,
  });

  saveFoodImages(images);
  return "";
}

// REST endpoints for Admin & Caterer Dashboards
app.get("/api/food-images", (req, res) => {
  const images = getFoodImages();
  res.json({ success: true, images });
});

app.post("/api/food-images", (req, res) => {
  const {
    item_name,
    image_url,
    status,
    approved_by_admin,
    caterer_id,
    delete_item,
    category,
    cuisine,
  } = req.body;
  if (!item_name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  let images = getFoodImages();

  if (delete_item) {
    images = images.filter(
      (img: any) =>
        img.item_name.toLowerCase().trim() !== item_name.toLowerCase().trim(),
    );
    saveFoodImages(images);
    return res.json({ success: true, message: "Item image deleted", images });
  }

  const existingIdx = images.findIndex(
    (img: any) =>
      img.item_name.toLowerCase().trim() === item_name.toLowerCase().trim(),
  );

  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    images[existingIdx] = {
      ...images[existingIdx],
      image_url:
        image_url !== undefined ? image_url : images[existingIdx].image_url,
      status: status || images[existingIdx].status || "Approved",
      approved_by_admin:
        approved_by_admin !== undefined
          ? approved_by_admin
          : images[existingIdx].approved_by_admin,
      caterer_id:
        caterer_id !== undefined ? caterer_id : images[existingIdx].caterer_id,
      category: category || images[existingIdx].category || "Starter",
      cuisine: cuisine || images[existingIdx].cuisine || "Multicuisine",
      updated_at: now,
    };
  } else {
    images.push({
      id: Math.random().toString(36).substr(2, 9),
      item_name,
      image_url: image_url || "",
      status: status || "Approved",
      approved_by_admin:
        approved_by_admin !== undefined ? approved_by_admin : true,
      caterer_id: caterer_id || null,
      category: category || "Starter",
      cuisine: cuisine || "Multicuisine",
      created_at: now,
      updated_at: now,
    });
  }

  saveFoodImages(images);
  res.json({ success: true, images });
});

// ===================================================
// EMAIL OTP REGISTRATION FLOW FOR CATERERS
// ===================================================
interface RegistrationSession {
  formData: any;
  password: string;
  otp: string;
  otpExpiry: Date;
  lastSentAt: Date;
}

const registrationSessions = new Map<string, RegistrationSession>();

async function sendOtpEmail(email: string, otp: string, businessName: string) {
  console.log(
    `[OTP EMAIL] Initiating OTP send to ${email} for "${businessName}"`,
  );

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "CaterNest Team <onboarding@resend.dev>";

  if (resendApiKey) {
    console.log(
      `[OTP EMAIL] Using Resend HTTP API as the production email provider.`,
    );
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "CaterNest Caterer Registration - Verification OTP",
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #00483C; margin-top: 0;">Verify Your CaterNest Account</h2>
              <p>Hello,</p>
              <p>Thank you for initiating your caterer registration on CaterNest under the brand name <strong>"${businessName}"</strong>.</p>
              <p>To proceed with your application, please use the following 6-digit One-Time Verification Code (OTP):</p>
              <div style="font-size: 26px; font-weight: bold; padding: 18px; background: #f4fdfa; color: #00483C; letter-spacing: 6px; text-align: center; margin: 25px 0; border: 2px dashed #00483C; border-radius: 8px;">
                ${otp}
              </div>
              <p>This verification code is strictly valid for <strong>10 minutes</strong>. If you did not initiate this registration request, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #888; text-align: center;">CaterNest Coordinator Platform &copy; 2026</p>
            </div>
          `,
        }),
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (e) {
        throw new Error(`Invalid JSON response from Resend API: ${resText}`);
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Resend API error status ${response.status}: ${resText}`,
        );
      }

      console.log(
        `[OTP EMAIL] Resend Email sent successfully. Message ID: ${data.id || "N/A"}`,
      );
      return;
    } catch (err: any) {
      console.error("[OTP EMAIL] Resend API delivery failed:", err);
      throw new Error(
        `Email delivery blocked: Resend delivery failed. ${err.message || err}`,
      );
    }
  }

  // Fallback to standard SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Production email provider is not configured. Please set RESEND_API_KEY.",
      );
    }
    console.warn(
      "[OTP EMAIL] No production email credentials set. Falling back to local/test SMTP.",
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser || "ethereal.user@ethereal.email",
        pass: smtpPass || "ethereal.pass",
      },
    });

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: "CaterNest Caterer Registration - Verification OTP",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #00483C; margin-top: 0;">Verify Your CaterNest Account</h2>
          <p>Hello,</p>
          <p>Thank you for initiating your caterer registration on CaterNest under the brand name <strong>"${businessName}"</strong>.</p>
          <p>To proceed with your application, please use the following 6-digit One-Time Verification Code (OTP):</p>
          <div style="font-size: 26px; font-weight: bold; padding: 18px; background: #f4fdfa; color: #00483C; letter-spacing: 6px; text-align: center; margin: 25px 0; border: 2px dashed #00483C; border-radius: 8px;">
            ${otp}
          </div>
          <p>This verification code is strictly valid for <strong>10 minutes</strong>. If you did not initiate this registration request, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #888; text-align: center;">CaterNest Coordinator Platform &copy; 2026</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[OTP EMAIL] Nodemailer Email sent successfully. Message ID: ${info.messageId}`,
    );
  } catch (err: any) {
    console.error("[OTP EMAIL] Error sending real email with Nodemailer:", err);
    throw new Error(
      `Email delivery blocked: Nodemailer SMTP delivery failed. ${err.message || err}`,
    );
  }
}

// Removed OTP request-otp endpoint
// Removed OTP verify-only endpoint

app.post("/api/register/finalize", async (req: any, res: any) => {
  const {
    email,
    password,
    businessName,
    ownerName,
    phone,
    alternateMobile,
    additionalMobile,
    username,
    location,
    city,
    menuPackages,
    catererLogo,
    coverBanner,
    founderPhoto,
    branchPhoto,
    galleryPhotos,
    latitude,
    longitude,
  } = req.body;

  if (
    !email ||
    !password ||
    !businessName ||
    !ownerName ||
    !phone ||
    !username
  ) {
    return res
      .status(400)
      .json({
        error:
          "All required registration fields (owner, businessName, username, email, phone, password) must be completed.",
      });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Database not available." });
  }

  try {
    const canonicalEmail = email.toLowerCase().trim();
    const canonicalUsername = username.toLowerCase().trim();

    // Check if email already registered in profiles or caterer_registrations
    const { data: existingRegEmail } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", canonicalEmail)
      .maybeSingle();

    if (existingRegEmail) {
      return res
        .status(400)
        .json({ error: "A user with this email address is already registered." });
    }

    const { data: existingRegUsername } = await supabase
      .from("caterer_registrations")
      .select("id")
      .eq("username", canonicalUsername)
      .maybeSingle();

    if (existingRegUsername) {
      return res
        .status(400)
        .json({ error: "This username is already taken. Please choose another." });
    }

    console.log(
      `[FINALIZE] Success! Creating auth account on Supabase for email: ${canonicalEmail}`,
    );

    // Create user in Supabase Auth via admin client
    const { data: authData, error: signupErr } =
      await supabase.auth.admin.createUser({
        email: canonicalEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: "caterer",
          full_name: ownerName || businessName,
        },
      });

    if (signupErr) {
      console.error("[FINALIZE] Auth creation error:", signupErr);
      return res
        .status(400)
        .json({ error: "Auth registration failed: " + signupErr.message });
    }

    const signupUserId = authData?.user?.id;
    if (!signupUserId) {
      return res
        .status(500)
        .json({
          error:
            "Authorized registration succeeded but user ID was not found.",
        });
    }

    // Write Profile record
    const { error: profileErr } = await supabase.from("profiles").insert({
      id: signupUserId,
      email: canonicalEmail,
      full_name: ownerName,
      role: "caterer",
      must_change_password: false,
    });

    if (profileErr) {
      console.error("[FINALIZE] Profile creation error:", profileErr);
      return res
        .status(500)
        .json({ error: "Profile creation failed: " + profileErr.message });
    }

    const defaultAchievements = [
      { value: "400+", title: "Events Completed", icon: "trophy" },
      { value: "15+", title: "Years Experience", icon: "award" },
      { value: "2500+", title: "Happy Customers", icon: "users" },
      { value: "120+", title: "Menu Items", icon: "clipboard" },
      { value: "75+", title: "Premium Events Served", icon: "chef-hat" },
      { value: "4.9", title: "Average Rating", icon: "star" }
    ];

    // Write Caterer registration record
    const { data: insertedReg, error: regInsertErr } = await supabase
      .from("caterer_registrations")
      .insert({
        userId: signupUserId,
        email_verified: true,
        businessName: businessName,
        owner: ownerName,
        ownerName: ownerName,
        phone: phone,
        alternatePhone: alternateMobile,
        additionalPhone: additionalMobile,
        username: canonicalUsername,
        address: location,
        city: city,
        logo: catererLogo || null,
        coverBanner: coverBanner || null,
        founderImageUrl: founderPhoto || null,
        ownerPhoto: founderPhoto || null,
        branchPhoto: branchPhoto || null,
        galleryPhotos: galleryPhotos || [],
        gallery: galleryPhotos || [],
        packages: menuPackages || [],
        draftMenuPackages: menuPackages || [],
        achievements: defaultAchievements,
        status: "Pending Approval",
        email: canonicalEmail,
        latitude: latitude || null,
        longitude: longitude || null,
        branchesList: [
          {
            name: "Main Branch",
            address: location,
            latitude: latitude || null,
            longitude: longitude || null
          }
        ]
      })
      .select()
      .maybeSingle();

    if (regInsertErr) {
      console.error(
        "[FINALIZE] caterer_registrations record insertion failed:",
        regInsertErr,
      );
      return res
        .status(500)
        .json({
          error: "Failed to save registration record: " + regInsertErr.message,
        });
    }

    return res.json({
      success: true,
      id: insertedReg?.id,
      message: "Registration submitted successfully. Awaiting Admin Approval.",
    });
  } catch (err: any) {
    console.error("Unexpected error in finalize registration:", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

// Removed OTP verify-otp endpoint

// Removed OTP resend-otp endpoint

// Seed data immediately on module load
try {
  seedFoodImagesOnStartup();
} catch (e) {
  console.error("Error seeding food library:", e);
}

export default app;
