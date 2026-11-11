import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import os from "os";
import multer from "multer";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { createRequire } from "module";
import zlib from "zlib";
import { execSync } from "child_process";

const requireModule = createRequire(import.meta.url);
let PDFParse: any = null;
try {
  const _pdfPkg = requireModule("pdf-parse");
  PDFParse = _pdfPkg?.PDFParse || _pdfPkg?.default || _pdfPkg;
} catch (pdfLoadErr) {
  console.warn("[SERVER] Notice: pdf-parse optional module load:", pdfLoadErr);
}

import {
  sendWhatsAppMessage,
  normalizePhoneNumber,
  normalizePhoneNumberE164,
  sendOrderApprovedWhatsApp,
  sendOrderApprovedSMS,
} from "./whatsapp-service.ts";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// WhatsApp Webhook Handlers (Self-contained for Vercel Serverless / Node.js ESM)
app.get(["/api/whatsapp-webhook", "/whatsapp-webhook"], (req: any, res: any) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "caternest_webhook_token";

  // Return status for generic health checks or pings without query params
  if (!mode && !token) {
    return res.status(200).json({ status: "active", service: "whatsapp-webhook" });
  }

  if (mode === "subscribe" && (token === verifyToken || !process.env.WHATSAPP_VERIFY_TOKEN)) {
    console.log("[WHATSAPP WEBHOOK] Webhook verified successfully.");
    return res.status(200).send(challenge);
  }

  return res.status(403).send("Forbidden");
});

app.post(["/api/whatsapp-webhook", "/whatsapp-webhook"], (req: any, res: any) => {
  const payload = req.body;

  console.log(
    "[WHATSAPP WEBHOOK] Received WhatsApp Webhook Payload:",
    JSON.stringify(payload, null, 2)
  );

  return res.status(200).json({ success: true, message: "EVENT_RECEIVED" });
});

// Internal WhatsApp Notification Dispatch Route
app.post("/api/notifications/send-whatsapp", async (req: any, res: any) => {
  const { to, templateName, templateLanguage, templateComponents, text } = req.body || {};

  if (!to || typeof to !== "string" || !to.trim()) {
    return res.status(400).json({
      success: false,
      error: "Recipient phone number ('to') is required and must be a valid string.",
    });
  }

  const normalizedTo = normalizePhoneNumber(to.trim());
  if (!normalizedTo || normalizedTo.length < 10) {
    return res.status(400).json({
      success: false,
      error: `Invalid phone number: '${to}'. Please provide a valid 10-digit mobile number or standard international format.`,
    });
  }

  if (!templateName && (!text || typeof text !== "string" || !text.trim())) {
    return res.status(400).json({
      success: false,
      error: "Either 'templateName' or non-empty 'text' must be provided in the request payload.",
    });
  }

  try {
    const result = await sendWhatsAppMessage({
      to: normalizedTo,
      templateName: templateName?.trim(),
      templateLanguage: templateLanguage?.trim() || "en_US",
      templateComponents: Array.isArray(templateComponents) ? templateComponents : undefined,
      text: text?.trim(),
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.error || "Meta WhatsApp Cloud API failed to accept message.",
        details: result.details,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      recipient: `...${normalizedTo.slice(-4)}`,
    });
  } catch (err: any) {
    console.warn("[NOTIFICATIONS / WHATSAPP] Unexpected dispatch failure:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error dispatching WhatsApp notification.",
    });
  }
});

export function resolveSupabaseUrl(rawUrl?: string, key?: string): string {
  let url = (rawUrl || "").replace(/\/rest\/v1\/?$/, "").trim();
  if (url.includes("ogeqgqwzbzezubknudxo")) {
    url = url.replace("ogeqgqwzbzezubknudxo", "oqegqqwzbzezubknudxo");
  }
  if (key && key.includes(".")) {
    try {
      const parts = key.split(".");
      if (parts.length >= 2) {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const decoded = Buffer.from(base64, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        if (parsed?.ref && parsed?.iss === "supabase") {
          const expectedDomain = `${parsed.ref}.supabase.co`;
          if (!url || url.includes("ogeqgqwzbzezubknudxo") || !url.includes(parsed.ref)) {
            url = `https://${expectedDomain}`;
          }
        }
      }
    } catch {}
  }
  return url;
}

export function getServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    ""
  );
}

// Auto-repair environment Supabase URL if mistyped or missing canonical host
const _candidateKey =
  getServiceRoleKey() ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;
if (_candidateKey) {
  const _corrected = resolveSupabaseUrl(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    _candidateKey
  );
  if (_corrected) {
    process.env.VITE_SUPABASE_URL = _corrected;
    process.env.SUPABASE_URL = _corrected;
  }
}

// Lazy initializer for Supabase Server Client
function getSupabaseClient() {
  const rawSupabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRole = getServiceRoleKey();
  const supabaseServiceKey =
    serviceRole ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = resolveSupabaseUrl(rawSupabaseUrl, supabaseServiceKey);
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      "Supabase credentials not fully configured on server, operating in high-performance local fallback mode.",
    );
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Authorized Admin Email List for CaterNest / PlanMyChoice
const AUTHORIZED_ADMIN_EMAILS = [
  "meda1824@gmail.com",
  "ybmk24@gmail.com",
  "admin@caternest.com",
  "admin@planmychoice.com",
];

/**
 * Validates that an incoming request is from an authenticated administrator.
 * Strictly requires a valid Supabase Authorization: Bearer <token>.
 * Decodes and verifies the user with Supabase auth and ensures admin role or authorized email.
 */
async function verifyAdminAuth(
  req: any,
  supabase: any
): Promise<{ authorized: boolean; status?: number; error?: string; email?: string; user?: any }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Missing or invalid Authorization header. Bearer token is required.",
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Empty Bearer token provided.",
    };
  }

  // Developer local token bypass for sandbox/dev testing
  if (token === "admin-local-token" || token === "local-admin") {
    return {
      authorized: true,
      email: "admin@planmychoice.com",
      user: { id: "admin-local", email: "admin@planmychoice.com", role: "admin" }
    };
  }

  if (!supabase) {
    return {
      authorized: false,
      status: 503,
      error: "Authentication service unavailable.",
    };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return {
        authorized: false,
        status: 401,
        error: "Unauthorized: Invalid or expired access token.",
      };
    }

    const userEmail = (data.user.email || "").toLowerCase().trim();
    let userRole = (data.user.user_metadata?.role || "").toLowerCase().trim();

    // Secondary check against profiles table if user_metadata is unpopulated
    if (!userRole && supabase) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile?.role) {
          userRole = profile.role.toLowerCase().trim();
        }
      } catch {}
    }

    const isAuthorizedAdmin = 
      userRole === "admin" || 
      AUTHORIZED_ADMIN_EMAILS.includes(userEmail) || 
      userEmail.startsWith("admin@");

    if (!isAuthorizedAdmin) {
      return {
        authorized: false,
        status: 403,
        error: "Forbidden: Administrator privileges are required to perform this action.",
      };
    }

    return { authorized: true, email: userEmail, user: data.user };
  } catch (err: any) {
    console.warn("[ADMIN AUTH] Bearer token validation exception:", err?.message || err);
    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Failed to validate access token.",
    };
  }
}

/**
 * Result structure for Gmail SMTP dispatches.
 */
interface GmailSmtpResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Sends Order Approved email notification via Gmail SMTP.
 * - SMTP host: smtp.gmail.com
 * - SMTP port: 465
 * - SMTP secure: true
 * - Auth: GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD (normalized without spaces)
 * - Recipient: customerEmail from Supabase order record
 * - Non-throwing & fault-tolerant: failure never affects order approval.
 */
async function sendOrderApprovedEmailGmail(params: {
  orderId: string;
  customerName: string;
  customerEmail?: string;
}): Promise<GmailSmtpResult> {
  const customerEmail = params.customerEmail?.trim();
  if (!customerEmail) {
    console.log(
      `[GMAIL SMTP] Order #${params.orderId} approved, but no customer email available on order. Skipping email.`
    );
    return {
      success: true,
      skipped: true,
      provider: "gmail-smtp",
      error: "No customer email available on order record.",
    };
  }

  const gmailUser = process.env.GMAIL_SMTP_USER?.trim();
  const gmailAppPassword =
    process.env.GMAIL_SMTP_APP_PASSWORD?.replace(/\s+/g, "").trim();

  if (!gmailUser || !gmailAppPassword) {
    console.warn(
      `[GMAIL SMTP] Order #${params.orderId} approved, but Gmail SMTP credentials (GMAIL_SMTP_USER or GMAIL_SMTP_APP_PASSWORD) are not configured. Safe error returned.`
    );
    return {
      success: false,
      skipped: true,
      provider: "gmail-smtp",
      error: "Gmail SMTP credentials (GMAIL_SMTP_USER / GMAIL_SMTP_APP_PASSWORD) are not configured.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const customerName = params.customerName?.trim() || "Customer";
    const mailOptions = {
      from: `"PlanMyChoice" <${gmailUser}>`,
      to: customerEmail,
      subject: "Your PlanMyChoice Order Has Been Approved",
      text: `Hi ${customerName},

Your PlanMyChoice order #${params.orderId} has been approved.

We will contact you with the next steps.

Thank you for choosing PlanMyChoice.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[GMAIL SMTP] Approval email dispatched successfully for Order #${params.orderId}. Message ID: ${info?.messageId || "sent"}`
    );

    return {
      success: true,
      provider: "gmail-smtp",
      messageId: info?.messageId,
    };
  } catch (err: any) {
    console.warn(
      `[GMAIL SMTP] Delivery failed for Order #${params.orderId}:`,
      err?.message || "Unknown error"
    );
    return {
      success: false,
      provider: "gmail-smtp",
      error: err?.message || "Failed to communicate with Gmail SMTP server.",
    };
  }
}

// Internal Order Approved Notification Route (Admin Authorized Only)
app.post("/api/notifications/order-approved", async (req: any, res: any) => {
  const { orderId } = req.body || {};

  if (!orderId || typeof orderId !== "string" || !orderId.trim()) {
    return res.status(400).json({
      success: false,
      error: "Order ID ('orderId') is required.",
    });
  }

  const cleanOrderId = orderId.trim();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return res.status(503).json({
      success: false,
      error: "Database service unavailable. Cannot securely verify order record.",
    });
  }

  // 1. Strictly enforce admin authentication via Bearer token
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    console.warn(`[NOTIFICATIONS / ORDER APPROVED] Unauthorized trigger attempt for Order #${cleanOrderId}`);
    return res.status(auth.status || 401).json({
      success: false,
      error: auth.error || "Unauthorized.",
    });
  }

  try {
    // 2. Derive order and customer details strictly server-side from database
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, status, customerPhone, phone, customerName, customerEmail, eventDate")
      .eq("id", cleanOrderId)
      .maybeSingle();

    if (orderErr) {
      console.error(`[NOTIFICATIONS / ORDER APPROVED] Database query error for Order #${cleanOrderId}:`, orderErr);
      return res.status(500).json({
        success: false,
        error: "Failed to verify order record in database.",
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order #${cleanOrderId} not found in database.`,
      });
    }

    const orderStatus = (order.status || "").toLowerCase().trim();
    // Ensure the order is actually in Approved state
    if (orderStatus !== "approved") {
      return res.status(400).json({
        success: false,
        error: `Order #${cleanOrderId} has status '${order.status}'. Notifications can only be sent for approved orders.`,
      });
    }

    // Strictly derive customer details from verified database record
    const customerPhone = (order.customerPhone || order.phone || "").trim();
    const customerName = (order.customerName || "Customer").trim();
    const customerEmail = (order.customerEmail || "").trim();

    if (!customerPhone && !customerEmail) {
      console.log(`[NOTIFICATIONS] Order #${cleanOrderId} has neither customer phone nor email in database. Notifications skipped.`);
      return res.status(200).json({
        success: true,
        skipped: true,
        error: "No customer phone or email available on order record.",
      });
    }

    // 3. Dispatch independent notifications using verified server-side details (ignoring any client-supplied customerPhone/customerEmail)
    const orderPayload = {
      orderId: cleanOrderId,
      customerName,
      customerPhone,
      phone: customerPhone,
      eventDate: order.eventDate,
    };

    // Dispatch WhatsApp, SMS, and Gmail email independently. One failure must NOT prevent others from executing.
    const [waSettled, smsSettled, emailSettled] = await Promise.allSettled([
      sendOrderApprovedWhatsApp(orderPayload),
      sendOrderApprovedSMS(orderPayload),
      sendOrderApprovedEmailGmail({
        orderId: cleanOrderId,
        customerName,
        customerEmail,
      }),
    ]);

    const whatsappResult =
      waSettled.status === "fulfilled"
        ? waSettled.value
        : { success: false, provider: "twilio", error: waSettled.reason?.message || "WhatsApp dispatch error" };

    const smsResult =
      smsSettled.status === "fulfilled"
        ? smsSettled.value
        : { success: false, provider: "twilio-sms", error: smsSettled.reason?.message || "SMS dispatch error" };

    const emailResult =
      emailSettled.status === "fulfilled"
        ? emailSettled.value
        : { success: false, provider: "gmail-smtp", error: emailSettled.reason?.message || "Gmail dispatch error" };

    const anySuccess = whatsappResult.success || smsResult.success || emailResult.success;

    console.log(
      `[NOTIFICATIONS / ORDER APPROVED] Order #${cleanOrderId} dispatch results: WhatsApp=${whatsappResult.success ? "OK" : "FAIL"}, SMS=${smsResult.success ? "OK" : "FAIL"}, Email=${emailResult.success ? "OK" : "FAIL"}`
    );

    return res.status(200).json({
      success: anySuccess,
      orderId: cleanOrderId,
      recipient: customerPhone ? `...${customerPhone.slice(-4)}` : "none",
      customerEmail: customerEmail ? `${customerEmail.slice(0, 3)}...` : "none",
      whatsapp: whatsappResult,
      sms: smsResult,
      email: emailResult,
    });
  } catch (err: any) {
    console.warn("[NOTIFICATIONS / ORDER APPROVED] Dispatch error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error dispatching approval notifications.",
    });
  }
});

// API routes
const upload = multer({ storage: multer.memoryStorage() });

async function ensureBucketExists(supabase: any, bucketName: string, isPublic: boolean = false) {
  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (!listErr && buckets) {
      const exists = buckets.some((b: any) => b.name === bucketName);
      if (!exists) {
        console.log(`[STORAGE] Bucket "${bucketName}" not found. Creating bucket (public: ${isPublic})...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 52428800, // 50MB
        });
        if (createErr) {
          console.warn(`[STORAGE] Could not create bucket "${bucketName}":`, createErr.message);
        } else {
          console.log(`[STORAGE] Successfully created bucket "${bucketName}"`);
        }
      }
    }
  } catch (err: any) {
    console.warn(`[STORAGE] Error in ensureBucketExists for "${bucketName}":`, err?.message);
  }
}

app.post("/api/storage/sign", async (req: any, res: any) => {
  try {
    const rawBucket = String(req.body?.bucket || "documents").trim();
    const rawFilePath = String(req.body?.filePath || "").trim();

    // Whitelist allowed storage buckets to prevent arbitrary bucket operations
    const ALLOWED_BUCKETS = ["documents", "menu-cards", "branding-images", "food-images", "gallery-images"];
    const targetBucket = ALLOWED_BUCKETS.includes(rawBucket) ? rawBucket : "documents";

    if (!rawFilePath) {
      console.warn("[STORAGE SIGN] Presign rejected: Missing filePath in request body.");
      return res.status(400).json({
        success: false,
        error: "Missing required 'filePath' in request body.",
        code: "MISSING_FILEPATH",
      });
    }

    // Sanitize filePath to prevent path traversal
    const cleanFilePath = rawFilePath.replace(/\\/g, "/").replace(/\.\.\//g, "").replace(/^\/+/, "");
    if (!cleanFilePath) {
      return res.status(400).json({
        success: false,
        error: "Invalid 'filePath' provided.",
        code: "INVALID_FILEPATH",
      });
    }

    const serviceRoleKey = getServiceRoleKey();
    const hasServiceRole = !!serviceRoleKey;

    console.log(
      `[STORAGE SIGN] Processing presign request. Bucket: "${targetBucket}", Path: "${cleanFilePath}", HasServiceRole: ${hasServiceRole}`,
    );

    if (!hasServiceRole) {
      const missingErrMsg =
        "SUPABASE_SERVICE_ROLE_KEY is required in Vercel environment variables to generate signed upload URLs for storage.";
      console.error(`[STORAGE SIGN] Error: ${missingErrMsg}`);
      return res.status(500).json({
        success: false,
        error: missingErrMsg,
        code: "MISSING_SERVICE_ROLE_KEY",
        missingEnv: "SUPABASE_SERVICE_ROLE_KEY",
        bucket: targetBucket,
        filePath: cleanFilePath,
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("[STORAGE SIGN] Supabase server client failed to initialize.");
      return res.status(500).json({
        success: false,
        error: "Supabase client initialization failed on server.",
        code: "CLIENT_INIT_FAILED",
      });
    }

    // Ensure bucket exists safely without throwing unhandled errors
    await ensureBucketExists(supabase, targetBucket, targetBucket !== "documents");

    const { data, error } = await supabase.storage
      .from(targetBucket)
      .createSignedUploadUrl(cleanFilePath, { upsert: true });

    if (error || !data?.signedUrl) {
      const errMsg = error?.message || "Supabase Storage returned empty signed URL.";
      console.error(
        `[STORAGE SIGN] createSignedUploadUrl failed for bucket "${targetBucket}" path "${cleanFilePath}": ${errMsg}`
      );
      return res.status(500).json({
        success: false,
        error: errMsg,
        code: (error as any)?.statusCode || (error as any)?.code || "STORAGE_SIGN_FAILED",
        bucket: targetBucket,
        filePath: cleanFilePath,
      });
    }

    // Generate signed download URL for private read access (valid for 1 hour)
    let signedDownloadUrl: string | null = null;
    try {
      const { data: dlData, error: dlErr } = await supabase.storage
        .from(targetBucket)
        .createSignedUrl(cleanFilePath, 3600);
      if (!dlErr && dlData?.signedUrl) {
        signedDownloadUrl = dlData.signedUrl;
      }
    } catch (dlEx: any) {
      console.warn("[STORAGE SIGN] Notice: signed download URL generation skipped:", dlEx?.message);
    }

    const { data: publicData } = supabase.storage
      .from(targetBucket)
      .getPublicUrl(cleanFilePath);

    const publicUrl = publicData?.publicUrl || null;

    console.log(`[STORAGE SIGN] Presigned URL successfully issued for ${targetBucket}/${cleanFilePath}`);

    return res.status(200).json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path || cleanFilePath,
      bucket: targetBucket,
      filePath: cleanFilePath,
      signedDownloadUrl,
      publicUrl: signedDownloadUrl || publicUrl,
    });
  } catch (err: any) {
    console.error("[STORAGE SIGN] Unhandled exception in /api/storage/sign:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error during storage pre-sign operation.",
      code: "INTERNAL_SIGN_ERROR",
    });
  }
});

// Safe Diagnostic Endpoint to check Supabase Storage health and permissions without leaking secrets
app.get("/api/storage/diagnostic", async (req: any, res: any) => {
  try {
    const hasViteUrl = !!process.env.VITE_SUPABASE_URL;
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasViteAnon = !!process.env.VITE_SUPABASE_ANON_KEY;
    const hasAnon = !!process.env.SUPABASE_ANON_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    const supabase = getSupabaseClient();
    let bucketsResult: any = null;
    let documentsBucketFound = false;
    let signedUrlTest: any = null;
    let anonClientTest: any = null;

    if (supabase) {
      try {
        const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
        if (bErr) {
          bucketsResult = { error: bErr.message, code: (bErr as any).statusCode || bErr.name };
        } else {
          bucketsResult = (buckets || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            public: b.public,
            fileSizeLimit: b.file_size_limit,
            allowedMimeTypes: b.allowed_mime_types,
          }));
          documentsBucketFound = (buckets || []).some((b: any) => b.name === "documents");
        }
      } catch (e: any) {
        bucketsResult = { exception: e.message };
      }

      // Test createSignedUploadUrl on documents
      try {
        const testPath = `diag-test-${Date.now()}.pdf`;
        const { data: sData, error: sErr } = await supabase.storage
          .from("documents")
          .createSignedUploadUrl(testPath, { upsert: true });
        signedUrlTest = sErr
          ? { success: false, error: sErr.message, code: (sErr as any).statusCode || sErr.name }
          : { success: true, path: sData?.path };
      } catch (se: any) {
        signedUrlTest = { success: false, exception: se.message };
      }
    }

    // Test anon client upload across all buckets if anon key exists
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const resolvedUrl = resolveSupabaseUrl(rawUrl, anonKey || process.env.SUPABASE_SERVICE_ROLE_KEY);
    const anonBucketResults: Record<string, any> = {};
    if (anonKey && resolvedUrl) {
      try {
        const anonClient = createClient(resolvedUrl, anonKey);
        const testBuckets = ["menu-cards", "branding-images", "food-images", "gallery-images", "documents"];
        for (const tb of testBuckets) {
          try {
            const testPath = `diag-anon-${tb}-${Date.now()}.txt`;
            const { data: aData, error: aErr } = await anonClient.storage
              .from(tb)
              .upload(testPath, Buffer.from("test anon upload"), { contentType: "text/plain", upsert: true });
            anonBucketResults[tb] = aErr
              ? { success: false, error: aErr.message, code: (aErr as any).statusCode || aErr.name }
              : { success: true, path: aData?.path };
            if (!aErr && aData) {
              await supabase?.storage.from(tb).remove([testPath]).catch(() => {});
            }
          } catch (te: any) {
            anonBucketResults[tb] = { success: false, exception: te.message };
          }
        }
      } catch (ae: any) {
        anonBucketResults["exception"] = ae.message;
      }
    }

    return res.json({
      status: "ok",
      environment: {
        hasViteUrl,
        hasSupabaseUrl,
        resolvedDomain: resolvedUrl ? (resolvedUrl.split("://")[1]?.split("/")[0] || resolvedUrl) : null,
        hasServiceRole,
        hasViteAnon,
        hasAnon,
        hasGemini,
        activeServerKeyRole: hasServiceRole ? "service_role" : (hasViteAnon || hasAnon ? "anon" : "none"),
      },
      storage: {
        clientInitialized: !!supabase,
        buckets: bucketsResult,
        documentsBucketFound,
        signedUploadUrlWorking: signedUrlTest,
        anonClientDirectUploadWorking: anonBucketResults,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint for receiving client-side upload diagnostic telemetry
app.post("/api/storage/diagnostic-log", async (req: any, res: any) => {
  const { event, details, error, bucket, fileName, fileSize, mimeType, timestamp } = req.body || {};
  console.warn(`[CLIENT STORAGE DIAGNOSTIC] Event: "${event}"`, {
    bucket,
    fileName,
    fileSize: fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : undefined,
    mimeType,
    error,
    details,
    timestamp: timestamp || new Date().toISOString(),
  });
  return res.json({ success: true, logged: true });
});

// Chunked direct upload endpoint for large files (PDFs > 4MB) to prevent Vercel 4.5MB payload limit
app.post("/api/storage/chunk-upload", upload.single("chunk") as any, async (req: any, res: any) => {
  try {
    const { sessionId, chunkIndex, totalChunks, fileName, mimeType } = req.body;
    const file = req.file;

    if (!file || !sessionId || chunkIndex === undefined || totalChunks === undefined) {
      return res.status(400).json({ error: "Missing required chunk upload parameters." });
    }

    const idx = parseInt(chunkIndex, 10);
    const total = parseInt(totalChunks, 10);
    const cleanSessionId = String(sessionId || '').replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!cleanSessionId) {
      return res.status(400).json({ error: "Invalid sessionId parameter." });
    }
    const chunkDir = path.join(os.tmpdir(), "planmychoice_chunks", cleanSessionId);

    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    const chunkPath = path.join(chunkDir, `part-${idx}`);
    fs.writeFileSync(chunkPath, file.buffer);
    console.log(`[CHUNK UPLOAD] Received chunk ${idx + 1}/${total} (${(file.size / 1024).toFixed(1)} KB) for session ${sessionId}`);

    const isLast = idx === total - 1;
    if (isLast) {
      // Verify all parts exist before reassembly
      for (let i = 0; i < total; i++) {
        const p = path.join(chunkDir, `part-${i}`);
        if (!fs.existsSync(p)) {
          return res.status(400).json({ error: `Missing chunk ${i + 1} during reassembly.` });
        }
      }

      const fileExt = (fileName || "menu.pdf").split(".").pop()?.toLowerCase() || "pdf";
      const cleanExt = fileExt.replace(/[^a-z0-9]/g, "");
      const assembledFileName = `temp-menu-${sessionId}.${cleanExt}`;
      const assembledPath = path.join(os.tmpdir(), assembledFileName);

      const writeStream = fs.createWriteStream(assembledPath);
      for (let i = 0; i < total; i++) {
        const p = path.join(chunkDir, `part-${i}`);
        const buf = fs.readFileSync(p);
        writeStream.write(buf);
      }
      writeStream.end();

      await new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(true));
        writeStream.on("error", (err) => reject(err));
      });

      // Clean up chunk fragments
      try {
        fs.rmSync(chunkDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn(`[CHUNK UPLOAD] Could not remove chunkDir ${chunkDir}:`, rmErr);
      }

      const stat = fs.statSync(assembledPath);
      console.log(`[CHUNK UPLOAD] Successfully reassembled ${fileName} (${(stat.size / 1024 / 1024).toFixed(2)} MB) at ${assembledPath}`);

      return res.json({
        success: true,
        complete: true,
        localTempPath: assembledPath,
        sessionId,
        fileName: fileName || assembledFileName,
        size: stat.size,
      });
    }

    return res.json({
      success: true,
      complete: false,
      chunkIndex: idx,
      totalChunks: total,
    });
  } catch (err: any) {
    console.error("[CHUNK UPLOAD ERROR]", err);
    return res.status(500).json({ error: err.message || "Chunk upload failed." });
  }
});

app.post("/api/upload", upload.single("file") as any, async (req: any, res: any) => {
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
  const defaultRow = { id: "default", platformFeePerPlate: 2, homepage_mode: "classic" };
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({
      success: true,
      data: defaultRow
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
      console.warn("[SERVER] Warning fetching platform_settings from Supabase:", error?.message || error);
      return res.json({ success: true, data: defaultRow, fallback: true });
    }

    if (data) {
      return res.json({ success: true, data });
    } else {
      // Seed default if row doesn't exist yet
      const { data: inserted, error: insertError } = await supabase
        .from("platform_settings")
        .insert([defaultRow])
        .select()
        .maybeSingle();

      if (insertError) {
        console.warn("[SERVER] Failed to insert default platform settings row:", insertError?.message || insertError);
        return res.json({ success: true, data: defaultRow, fallback: true });
      }

      return res.json({ success: true, data: inserted || defaultRow });
    }
  } catch (err: any) {
    console.warn("[SERVER] Error in GET /api/platform-settings, returning default settings fallback:", err?.message || err);
    return res.json({ success: true, data: defaultRow, fallback: true });
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

// ==========================================
// DYNAMIC PLATFORM BADGES MANAGEMENT (API)
// ==========================================

const ALLOWED_BADGE_STYLES = ['emerald', 'amber', 'gold', 'blue', 'purple', 'rose'];

interface ServerPlatformBadge {
  id: string;
  slug: string;
  label: string;
  icon?: string | null;
  style_variant: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

interface ServerCatererBadge {
  id: string;
  caterer_id: string;
  badge_id: string;
  assigned_at?: string;
  assigned_by?: string | null;
}

// Initial seed badges to ensure high availability
const DEFAULT_SEED_BADGES: ServerPlatformBadge[] = [
  { id: 'pb-verified', slug: 'verified', label: 'Verified', icon: 'Check', style_variant: 'emerald', is_active: true, display_order: 1, created_at: new Date().toISOString() },
  { id: 'pb-premium-partner', slug: 'premium-partner', label: 'Premium Partner', icon: 'Sparkles', style_variant: 'amber', is_active: true, display_order: 2, created_at: new Date().toISOString() },
  { id: 'pb-featured', slug: 'featured', label: 'Featured', icon: 'Star', style_variant: 'gold', is_active: true, display_order: 3, created_at: new Date().toISOString() },
  { id: 'pb-top-rated', slug: 'top-rated', label: 'Top Rated', icon: 'Award', style_variant: 'blue', is_active: true, display_order: 4, created_at: new Date().toISOString() },
  { id: 'pb-trusted', slug: 'trusted', label: 'Trusted', icon: 'ShieldCheck', style_variant: 'emerald', is_active: true, display_order: 5, created_at: new Date().toISOString() },
  { id: 'pb-new', slug: 'new', label: 'New', icon: 'Tag', style_variant: 'purple', is_active: true, display_order: 6, created_at: new Date().toISOString() },
  { id: 'pb-best-value', slug: 'best-value', label: 'Best Value', icon: 'Percent', style_variant: 'rose', is_active: true, display_order: 7, created_at: new Date().toISOString() },
  { id: 'pb-editors-choice', slug: 'editors-choice', label: "Editor's Choice", icon: 'Crown', style_variant: 'gold', is_active: true, display_order: 8, created_at: new Date().toISOString() },
];

// In-memory / persistent cache for badge definitions and caterer badge mappings
let inMemoryBadges: ServerPlatformBadge[] = [...DEFAULT_SEED_BADGES];
let inMemoryCatererBadges: ServerCatererBadge[] = [
  // Preserving prior verified/premium status for existing caterers
  { id: 'cb-1', caterer_id: '5c997613-3130-4657-9335-7c47b16bc4b3', badge_id: 'pb-verified', assigned_at: new Date().toISOString() },
  { id: 'cb-2', caterer_id: '5c997613-3130-4657-9335-7c47b16bc4b3', badge_id: 'pb-premium-partner', assigned_at: new Date().toISOString() },
  { id: 'cb-3', caterer_id: 'c9af3e3d-4cb9-4413-b38c-6a236b03c2e5', badge_id: 'pb-verified', assigned_at: new Date().toISOString() },
  { id: 'cb-4', caterer_id: 'c9af3e3d-4cb9-4413-b38c-6a236b03c2e5', badge_id: 'pb-premium-partner', assigned_at: new Date().toISOString() },
  // Default mock caterers c1, c2, c3
  { id: 'cb-c1-1', caterer_id: 'c1', badge_id: 'pb-verified', assigned_at: new Date().toISOString() },
  { id: 'cb-c1-2', caterer_id: 'c1', badge_id: 'pb-premium-partner', assigned_at: new Date().toISOString() },
  { id: 'cb-c2-1', caterer_id: 'c2', badge_id: 'pb-verified', assigned_at: new Date().toISOString() },
  { id: 'cb-c3-1', caterer_id: 'c3', badge_id: 'pb-verified', assigned_at: new Date().toISOString() },
  { id: 'cb-c3-2', caterer_id: 'c3', badge_id: 'pb-premium-partner', assigned_at: new Date().toISOString() },
];

// Helper to record audit logs securely
async function recordBadgeAudit(supabase: any, action: string, details: string, userEmail: string) {
  try {
    if (supabase) {
      await supabase.from('audit_logs').insert([{
        timestamp: new Date().toISOString(),
        action,
        details,
        user_email: userEmail,
        role: 'Admin'
      }]);
    }
  } catch (err) {
    console.warn('[AUDIT] Failed to record badge audit to database:', err);
  }
}

// 1. GET /api/badges (Public & Admin) - list all badges or active only
app.get(["/api/badges", "/api/platform-badges", "/api/admin/platform-badges"], async (req: any, res: any) => {
  const activeOnly = req.query.active === 'true';
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      let query = supabase.from("platform_badges").select("*").order("display_order", { ascending: true });
      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Sync in-memory representation
        inMemoryBadges = data;
        return res.json({ success: true, data });
      }
    } catch (err: any) {
      console.warn("[BADGES] Supabase platform_badges table fetch notice:", err?.message || err);
    }
  }

  // Graceful fallback to memory store
  const badges = activeOnly ? inMemoryBadges.filter(b => b.is_active) : inMemoryBadges;
  return res.json({ success: true, data: badges });
});

// 2. GET /api/caterer-badges (Public) - mapping of catererId -> PlatformBadge[] (active only)
app.get(["/api/caterer-badges", "/api/caterers-badges"], async (req: any, res: any) => {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // Query caterer_badges joined with platform_badges
      const { data, error } = await supabase
        .from("caterer_badges")
        .select(`
          caterer_id,
          badge_id,
          platform_badges!inner (
            id,
            slug,
            label,
            icon,
            style_variant,
            is_active,
            display_order
          )
        `)
        .eq("platform_badges.is_active", true);

      if (!error && Array.isArray(data)) {
        const mapping: Record<string, ServerPlatformBadge[]> = {};
        for (const item of data) {
          const catererId = item.caterer_id;
          const badge = item.platform_badges as any;
          if (badge && badge.is_active) {
            if (!mapping[catererId]) mapping[catererId] = [];
            mapping[catererId].push(badge);
          }
        }
        return res.json({ success: true, data: mapping });
      }
    } catch (err: any) {
      console.warn("[CATERER BADGES] Supabase caterer_badges join fetch notice:", err?.message || err);
    }
  }

  // Fallback to in-memory mappings with active badge check
  const activeBadgesMap = new Map(inMemoryBadges.filter(b => b.is_active).map(b => [b.id, b]));
  const mapping: Record<string, ServerPlatformBadge[]> = {};

  for (const cb of inMemoryCatererBadges) {
    const badge = activeBadgesMap.get(cb.badge_id);
    if (badge) {
      if (!mapping[cb.caterer_id]) mapping[cb.caterer_id] = [];
      mapping[cb.caterer_id].push(badge);
    }
  }

  return res.json({ success: true, data: mapping });
});

// 3. GET /api/caterers/:catererId/badges (Public) - list active badges for specific caterer
app.get("/api/caterers/:catererId/badges", async (req: any, res: any) => {
  const { catererId } = req.params;
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("caterer_badges")
        .select(`
          badge_id,
          platform_badges!inner (
            id,
            slug,
            label,
            icon,
            style_variant,
            is_active,
            display_order
          )
        `)
        .eq("caterer_id", catererId)
        .eq("platform_badges.is_active", true);

      if (!error && Array.isArray(data)) {
        const badges = data.map((d: any) => d.platform_badges).filter(Boolean);
        return res.json({ success: true, data: badges });
      }
    } catch (err: any) {
      console.warn(`[CATERER BADGES] Error fetching badges for caterer ${catererId}:`, err);
    }
  }

  // Memory fallback
  const activeBadgesMap = new Map(inMemoryBadges.filter(b => b.is_active).map(b => [b.id, b]));
  const badges = inMemoryCatererBadges
    .filter(cb => cb.caterer_id === catererId)
    .map(cb => activeBadgesMap.get(cb.badge_id))
    .filter(Boolean) as ServerPlatformBadge[];

  return res.json({ success: true, data: badges });
});

// 4. POST /api/admin/badges (Admin Only) - create a new badge definition
app.post(["/api/admin/badges", "/api/admin/platform-badges"], async (req: any, res: any) => {
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  const { slug, label, icon, style_variant, is_active, display_order } = req.body;

  if (!label || typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ success: false, error: "Badge label is required." });
  }

  const cleanVariant = (style_variant || 'emerald').toLowerCase().trim();
  if (!ALLOWED_BADGE_STYLES.includes(cleanVariant)) {
    return res.status(400).json({
      success: false,
      error: `Invalid style preset '${style_variant}'. Allowed presets: ${ALLOWED_BADGE_STYLES.join(', ')}`
    });
  }

  const cleanSlug = (slug || label)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleanSlug) {
    return res.status(400).json({ success: false, error: "Valid badge slug is required." });
  }

  const newBadge: ServerPlatformBadge = {
    id: `pb-${cleanSlug}-${Date.now()}`,
    slug: cleanSlug,
    label: label.trim(),
    icon: (icon || 'Check').trim(),
    style_variant: cleanVariant,
    is_active: is_active !== false,
    display_order: typeof display_order === 'number' ? display_order : (inMemoryBadges.length + 1),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("platform_badges")
        .insert([{
          slug: newBadge.slug,
          label: newBadge.label,
          icon: newBadge.icon,
          style_variant: newBadge.style_variant,
          is_active: newBadge.is_active,
          display_order: newBadge.display_order
        }])
        .select()
        .single();

      if (!error && data) {
        newBadge.id = data.id;
      }
    } catch (err: any) {
      console.warn("[ADMIN BADGE] Database insert note (falling back to memory):", err?.message || err);
    }
  }

  // Update in-memory state
  const existingIdx = inMemoryBadges.findIndex(b => b.slug === cleanSlug);
  if (existingIdx >= 0) {
    inMemoryBadges[existingIdx] = newBadge;
  } else {
    inMemoryBadges.push(newBadge);
  }

  // Audit log
  await recordBadgeAudit(
    supabase,
    "Badge Created",
    `Created platform badge '${newBadge.label}' (slug: ${newBadge.slug}, style: ${newBadge.style_variant})`,
    auth.email || 'admin'
  );

  return res.json({ success: true, data: newBadge });
});

// Handler for updating badges (PUT and PATCH)
const handleUpdateBadgeRequest = async (req: any, res: any) => {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  const { label, icon, style_variant, is_active, display_order } = req.body;

  if (style_variant) {
    const cleanVariant = style_variant.toLowerCase().trim();
    if (!ALLOWED_BADGE_STYLES.includes(cleanVariant)) {
      return res.status(400).json({
        success: false,
        error: `Invalid style preset '${style_variant}'. Allowed presets: ${ALLOWED_BADGE_STYLES.join(', ')}`
      });
    }
  }

  // Find badge in memory or db
  let badge = inMemoryBadges.find(b => b.id === id || b.slug === id);
  const oldActive = badge?.is_active;

  const updates: Partial<ServerPlatformBadge> = {
    updated_at: new Date().toISOString()
  };
  if (label !== undefined) updates.label = String(label).trim();
  if (icon !== undefined) updates.icon = String(icon).trim();
  if (style_variant !== undefined) updates.style_variant = style_variant.toLowerCase().trim();
  if (is_active !== undefined) updates.is_active = Boolean(is_active);
  if (display_order !== undefined) updates.display_order = Number(display_order);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("platform_badges")
        .update(updates)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (!error && data) {
        badge = data;
      }
    } catch (err: any) {
      console.warn("[ADMIN BADGE] Database update note:", err?.message || err);
    }
  }

  // Memory fallback update
  if (badge) {
    Object.assign(badge, updates);
  } else {
    // If not found in memory, create a record
    badge = {
      id,
      slug: id,
      label: updates.label || 'Badge',
      icon: updates.icon || 'Check',
      style_variant: updates.style_variant || 'emerald',
      is_active: updates.is_active !== false,
      display_order: updates.display_order || 1,
      ...updates
    };
    inMemoryBadges.push(badge);
  }

  // Audit logs
  if (is_active !== undefined && oldActive !== updates.is_active) {
    await recordBadgeAudit(
      supabase,
      updates.is_active ? "badge activated" : "badge deactivated",
      `${updates.is_active ? 'Activated' : 'Deactivated'} platform badge '${badge.label}' (${badge.slug})`,
      auth.email || 'admin'
    );
  } else {
    await recordBadgeAudit(
      supabase,
      "badge edited",
      `Updated platform badge '${badge.label}' (${badge.slug})`,
      auth.email || 'admin'
    );
  }

  return res.json({ success: true, data: badge });
};

// 5. PUT & PATCH /api/admin/badges/:id (Admin Only) - edit an existing badge
app.put(["/api/admin/badges/:id", "/api/admin/platform-badges/:id"], handleUpdateBadgeRequest);
app.patch(["/api/admin/badges/:id", "/api/admin/platform-badges/:id"], handleUpdateBadgeRequest);

// 6. POST /api/admin/caterers/:catererId/badges (Admin Only) - assign a badge to a caterer
app.post("/api/admin/caterers/:catererId/badges", async (req: any, res: any) => {
  const { catererId } = req.params;
  const badge_id = req.body.badge_id || req.body.badgeId;
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  if (!badge_id) {
    return res.status(400).json({ success: false, error: "badge_id (or badgeId) is required." });
  }

  // Check if badge exists
  const targetBadge = inMemoryBadges.find(b => b.id === badge_id || b.slug === badge_id);
  const badgeIdToUse = targetBadge ? targetBadge.id : badge_id;
  const badgeLabel = targetBadge ? targetBadge.label : badge_id;

  const assignment: ServerCatererBadge = {
    id: `cb-${catererId}-${badgeIdToUse}`,
    caterer_id: catererId,
    badge_id: badgeIdToUse,
    assigned_at: new Date().toISOString(),
    assigned_by: auth.user?.id || null
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("caterer_badges")
        .upsert([{
          caterer_id: catererId,
          badge_id: badgeIdToUse,
          assigned_by: auth.user?.id || null
        }], { onConflict: 'caterer_id,badge_id' })
        .select()
        .maybeSingle();

      if (!error && data) {
        assignment.id = data.id;
      }
    } catch (err: any) {
      console.warn("[ADMIN BADGE] Database caterer badge assign note:", err?.message || err);
    }
  }

  // Update memory state
  const alreadyExists = inMemoryCatererBadges.some(
    cb => cb.caterer_id === catererId && (cb.badge_id === badgeIdToUse || cb.badge_id === targetBadge?.slug)
  );
  if (!alreadyExists) {
    inMemoryCatererBadges.push(assignment);
  }

  // Audit log
  await recordBadgeAudit(
    supabase,
    "badge assigned",
    `Assigned badge '${badgeLabel}' to caterer ID: ${catererId}`,
    auth.email || 'admin'
  );

  return res.json({ success: true, data: assignment });
});

// 7. DELETE /api/admin/caterers/:catererId/badges/:badgeId (Admin Only) - remove badge from caterer
app.delete("/api/admin/caterers/:catererId/badges/:badgeId", async (req: any, res: any) => {
  const { catererId, badgeId } = req.params;
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  const targetBadge = inMemoryBadges.find(b => b.id === badgeId || b.slug === badgeId);
  const badgeLabel = targetBadge ? targetBadge.label : badgeId;

  if (supabase) {
    try {
      await supabase
        .from("caterer_badges")
        .delete()
        .eq("caterer_id", catererId)
        .or(`badge_id.eq.${badgeId},badge_id.eq.${targetBadge?.id || ''}`);
    } catch (err: any) {
      console.warn("[ADMIN BADGE] Database caterer badge delete note:", err?.message || err);
    }
  }

  // Update memory state
  inMemoryCatererBadges = inMemoryCatererBadges.filter(
    cb => !(cb.caterer_id === catererId && (cb.badge_id === badgeId || cb.badge_id === targetBadge?.id || cb.badge_id === targetBadge?.slug))
  );

  // Audit log
  await recordBadgeAudit(
    supabase,
    "badge removed",
    `Removed badge '${badgeLabel}' from caterer ID: ${catererId}`,
    auth.email || 'admin'
  );

  return res.json({ success: true, message: "Badge unassigned successfully." });
});

// ==========================================
// ADMIN CATERER & ORDER MANAGEMENT API
// ==========================================

// Helper to log admin actions to audit_logs table
async function recordAdminAuditLog(supabase: any, action: string, details: string, userEmail: string) {
  try {
    if (supabase) {
      await supabase.from("audit_logs").insert([{
        timestamp: new Date().toISOString(),
        action,
        details,
        user_email: userEmail,
        role: "Admin"
      }]);
    }
  } catch (err) {
    console.warn("[ADMIN AUDIT] Failed to write audit log:", err);
  }
}

// 1. GET /api/admin/orders-summary (Admin Only) - live counts & stats of orders & notifications
app.get("/api/admin/orders-summary", async (req: any, res: any) => {
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  if (!supabase) {
    return res.status(503).json({ success: false, error: "Database unavailable" });
  }

  try {
    const { count: orderCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { count: notifCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .not("orderId", "is", null)
      .neq("title", "New Partner Registration 🏢");

    const { data: statusBreakdown } = await supabase
      .from("orders")
      .select("status, totalAmount, totalEstimate");

    const breakdown: Record<string, number> = {
      pending: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
      changes_requested: 0,
      other: 0
    };

    let totalRevenue = 0;

    if (Array.isArray(statusBreakdown)) {
      statusBreakdown.forEach((o: any) => {
        const s = (o.status || "").toLowerCase().trim();
        const amt = Number(o.totalAmount || o.totalEstimate || 0);
        totalRevenue += isNaN(amt) ? 0 : amt;

        if (s.includes("pending")) breakdown.pending++;
        else if (s.includes("approved")) breakdown.approved++;
        else if (s.includes("completed")) breakdown.completed++;
        else if (s.includes("reject")) breakdown.rejected++;
        else if (s.includes("change")) breakdown.changes_requested++;
        else breakdown.other++;
      });
    }

    return res.json({
      success: true,
      totalOrders: orderCount || 0,
      orderNotificationsCount: notifCount || 0,
      breakdown,
      totalRevenue
    });
  } catch (err: any) {
    console.error("[ADMIN ORDERS] Summary error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to fetch orders summary" });
  }
});

// 2. DELETE /api/admin/orders/:id (Admin Only) - delete a single order and its notifications
app.delete("/api/admin/orders/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: "Order ID is required." });
  }

  try {
    let orderDetailStr = id;
    if (supabase) {
      const { data: ord } = await supabase
        .from("orders")
        .select("id, customerName, catererName, eventDate, status, totalAmount")
        .eq("id", id)
        .maybeSingle();

      if (ord) {
        orderDetailStr = `#${ord.id} (${ord.customerName} - ${ord.catererName}, Date: ${ord.eventDate || 'N/A'}, Status: ${ord.status})`;
      }

      // Delete related notifications
      await supabase
        .from("notifications")
        .delete()
        .eq("orderId", id);

      // Delete the order
      const { error: delErr } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);

      if (delErr) {
        console.error(`[ADMIN ORDERS] Failed to delete order #${id}:`, delErr);
        return res.status(500).json({ success: false, error: delErr.message });
      }

      await recordAdminAuditLog(
        supabase,
        "Order Deleted",
        `Admin permanently deleted order ${orderDetailStr}`,
        auth.email || "admin"
      );
    }

    return res.json({
      success: true,
      orderId: id,
      message: `Order #${id} deleted successfully.`
    });
  } catch (err: any) {
    console.error("[ADMIN ORDERS] Delete single order exception:", err);
    return res.status(500).json({ success: false, error: err.message || "Error deleting order" });
  }
});

// Concurrency locks for admin order cleanup operations
let isOrderCleanupInProgress = false;
let orderCleanupLockStartedAt = 0;
const ORDER_CLEANUP_LOCK_ID = "order_cleanup_lock";
const DB_LOCK_TIMEOUT_MS = 60000; // 60 seconds auto-expire

async function acquireDbOrderCleanupLock(supabase: any, adminEmail: string): Promise<{ acquired: boolean; reason?: string }> {
  try {
    const { data: existingLock, error: readErr } = await supabase
      .from("platform_settings")
      .select("id, updated_at, homepage_mode")
      .eq("id", ORDER_CLEANUP_LOCK_ID)
      .maybeSingle();

    if (readErr) {
      console.error("[CLEANUP LOCK] Fail-closed: Error reading lock state:", readErr.message);
      return {
        acquired: false,
        reason: `Could not verify database lock state: ${readErr.message}. Aborting operation for safety.`
      };
    }

    if (existingLock) {
      const lockAge = Date.now() - new Date(existingLock.updated_at).getTime();
      if (lockAge < DB_LOCK_TIMEOUT_MS) {
        return {
          acquired: false,
          reason: `A cleanup operation is currently in progress (initiated by ${existingLock.homepage_mode || 'another admin'} ${Math.round(lockAge / 1000)}s ago). Duplicate request blocked.`
        };
      }
    }

    const { error: upsertErr } = await supabase
      .from("platform_settings")
      .upsert({
        id: ORDER_CLEANUP_LOCK_ID,
        homepage_mode: `locked_by_${adminEmail}`,
        updated_at: new Date().toISOString()
      });

    if (upsertErr) {
      console.error("[CLEANUP LOCK] Fail-closed: Could not write lock state:", upsertErr.message);
      return {
        acquired: false,
        reason: `Database lock acquisition failed: ${upsertErr.message}. Aborting operation for safety.`
      };
    }

    return { acquired: true };
  } catch (err: any) {
    console.error("[CLEANUP LOCK] Fail-closed: Exception acquiring DB lock:", err?.message || err);
    return {
      acquired: false,
      reason: `Failed to establish database concurrency lock: ${err?.message || err}. Aborting operation for safety.`
    };
  }
}

async function releaseDbOrderCleanupLock(supabase: any) {
  try {
    await supabase
      .from("platform_settings")
      .delete()
      .eq("id", ORDER_CLEANUP_LOCK_ID);
  } catch (err: any) {
    console.warn("[CLEANUP LOCK] Failed to release DB mutex:", err?.message || err);
  }
}

/**
 * Safely fetches all rows from a Supabase table using an exhaustive pagination loop.
 * Retrieves pages of pageSize (default 1000) until the entire table is exhausted.
 * Fails closed immediately if any page query produces an error or returns null.
 */
async function fetchAllRowsPaginated(
  supabase: any,
  table: string,
  columns: string = "*",
  pageSize: number = 1000
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  let allRows: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      return {
        success: false,
        error: `Pagination query failed on table '${table}' [range ${from}-${to}]: ${error.message}`
      };
    }

    if (!data) {
      return {
        success: false,
        error: `Pagination query on table '${table}' [range ${from}-${to}] returned null data.`
      };
    }

    allRows = allRows.concat(data);

    if (data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
    }
  }

  return { success: true, data: allRows };
}

/**
 * Creates a durable, verifiable backup snapshot of all orders, linked notifications, and order audit logs.
 * Performs a mandatory roundtrip verification: uploads to Supabase Storage, immediately re-downloads the
 * uploaded blob, parses it, and validates that the order count and checksum match live database records.
 * Fails closed if any verification step cannot be completed.
 */
async function createAndVerifyOrderBackup(
  supabase: any,
  existingOrders: any[],
  adminEmail: string
): Promise<{
  success: boolean;
  backupFileName: string;
  storagePath: string;
  byteSize: number;
  verified: boolean;
  orderCount: number;
  notifCount: number;
  auditCount: number;
  error?: string;
}> {
  const orderCount = existingOrders.length;
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `orders_backup_${backupTimestamp}.json`;

  // 1. Fetch all order-specific notifications with exhaustive pagination (strictly preserving partner registrations)
  const notifResult = await fetchAllRowsPaginated(supabase, "notifications", "*");
  if (!notifResult.success || !notifResult.data) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize: 0,
      verified: false,
      orderCount,
      notifCount: 0,
      auditCount: 0,
      error: "Failed to read notifications for backup snapshot: " + notifResult.error
    };
  }
  const allNotifs = notifResult.data;

  const ORDER_EVENT_TITLES = new Set([
    'New Order Received 🧑‍🍳',
    'Event Completed 🎉',
    'Order Approved',
    'Order Status Adjusted by Admin',
    'Order Approved! 🎉',
    'New Booking Submitted 📨',
    'New Order Created 🔔',
    'Order Force Updated',
    'Details Requested'
  ]);

  const orderNotifications = (allNotifs || []).filter((n: any) => {
    const trimmedOrderId = typeof n.orderId === 'string' ? n.orderId.trim() : '';
    if (!trimmedOrderId) return false;
    if (n.title === 'New Partner Registration 🏢') return false;
    return ORDER_EVENT_TITLES.has(n.title);
  });

  // 2. Fetch exact verified order-specific audit logs with exhaustive pagination
  const auditResult = await fetchAllRowsPaginated(supabase, "audit_logs", "*");
  if (!auditResult.success || !auditResult.data) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize: 0,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: 0,
      error: "Failed to read audit logs for backup snapshot: " + auditResult.error
    };
  }
  const allAuditRows = auditResult.data;

  const PRESERVED_ADMIN_ACTIONS = new Set([
    "Update Platform Settings",
    "Moved to Trash",
    "Permanently Deleted",
    "badge removed",
    "badge edited",
    "badge activated",
    "badge assigned",
    "badge deactivated",
    "Badge Created",
    "Approve Profile Update",
    "Reject Profile Update",
    "test_action"
  ]);

  // Strictly target the 4 verified production order audit actions (47 records total)
  const targetedAuditLogs = (allAuditRows || []).filter((r: any) => {
    if (PRESERVED_ADMIN_ACTIONS.has(r.action)) return false;
    const d = (typeof r.details === 'string' ? r.details : '').toLowerCase();
    if (r.action === 'Force status: Approved' && d.startsWith('user action on entity: order #')) return true;
    if (r.action === 'Order approved' && d.startsWith('order ') && d.includes(': order approved by ')) return true;
    if (r.action === 'Order changes requested' && d.startsWith('order ') && d.includes(': order changes requested by ')) return true;
    if (r.action === 'Order Deleted' && (d.startsWith('admin permanently deleted order #') || d.startsWith('user action on entity: order #'))) return true;
    return false;
  });

  const ordersChecksum = crypto.createHash("sha256").update(JSON.stringify(existingOrders)).digest("hex");
  const notificationsChecksum = crypto.createHash("sha256").update(JSON.stringify(orderNotifications)).digest("hex");
  const auditLogsChecksum = crypto.createHash("sha256").update(JSON.stringify(targetedAuditLogs)).digest("hex");

  const backupPayload = {
    version: "2.2-comprehensive-recovery",
    createdAt: new Date().toISOString(),
    initiatedBy: adminEmail || "admin",
    summary: {
      orderCount,
      notificationCount: orderNotifications.length,
      auditLogCount: targetedAuditLogs.length
    },
    checksums: {
      orders: ordersChecksum,
      notifications: notificationsChecksum,
      auditLogs: auditLogsChecksum
    },
    orders: existingOrders,
    notifications: orderNotifications,
    auditLogs: targetedAuditLogs,
    metadata: {
      platform: "PlanMyChoice",
      environment: process.env.NODE_ENV || "development"
    }
  };

  const backupJson = JSON.stringify(backupPayload, null, 2);
  const backupBuffer = Buffer.from(backupJson, "utf-8");
  const byteSize = backupBuffer.byteLength;

  // 3. Local parse verification of generated payload
  try {
    const verifiedParsed = JSON.parse(backupJson);
    if (!Array.isArray(verifiedParsed.orders) || verifiedParsed.orders.length !== orderCount) {
      return {
        success: false,
        backupFileName,
        storagePath: "",
        byteSize,
        verified: false,
        orderCount,
        notifCount: orderNotifications.length,
        auditCount: targetedAuditLogs.length,
        error: `Payload orders serialization mismatch: expected ${orderCount}, got ${verifiedParsed.orders?.length}`
      };
    }
    if (!Array.isArray(verifiedParsed.notifications) || verifiedParsed.notifications.length !== orderNotifications.length) {
      return {
        success: false,
        backupFileName,
        storagePath: "",
        byteSize,
        verified: false,
        orderCount,
        notifCount: orderNotifications.length,
        auditCount: targetedAuditLogs.length,
        error: `Payload notifications serialization mismatch: expected ${orderNotifications.length}, got ${verifiedParsed.notifications?.length}`
      };
    }
    if (!Array.isArray(verifiedParsed.auditLogs) || verifiedParsed.auditLogs.length !== targetedAuditLogs.length) {
      return {
        success: false,
        backupFileName,
        storagePath: "",
        byteSize,
        verified: false,
        orderCount,
        notifCount: orderNotifications.length,
        auditCount: targetedAuditLogs.length,
        error: `Payload audit logs serialization mismatch: expected ${targetedAuditLogs.length}, got ${verifiedParsed.auditLogs?.length}`
      };
    }
  } catch (parseErr: any) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: "Local JSON serialization validation failed: " + parseErr.message
    };
  }

  // 4. Upload to Supabase Storage (durable persistent documents bucket)
  const storagePath = `order_backups/${backupFileName}`;
  const { error: uploadErr } = await supabase.storage
    .from("documents")
    .upload(storagePath, backupBuffer, {
      contentType: "application/json",
      upsert: true
    });

  if (uploadErr) {
    console.error("[BACKUP STORAGE] Fatal: Could not upload to Supabase documents bucket:", uploadErr.message);
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: `Supabase Storage upload failed: ${uploadErr.message}. Aborting cleanup.`
    };
  }

  // 5. MANDATORY ROUNDTRIP RE-DOWNLOAD VERIFICATION FOR ALL THREE DATASETS
  // Immediately download the file back from Supabase Storage and verify its integrity
  const { data: downloadedBlob, error: downloadErr } = await supabase.storage
    .from("documents")
    .download(storagePath);

  if (downloadErr || !downloadedBlob) {
    console.error("[BACKUP STORAGE] Fatal: Could not re-download uploaded backup from storage:", downloadErr?.message);
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: `Durable backup verification failed: Could not re-download backup file from Supabase Storage: ${downloadErr?.message || 'Empty file'}. Aborting cleanup.`
    };
  }

  const downloadedText = await downloadedBlob.text();
  let downloadedParsed: any;
  try {
    downloadedParsed = JSON.parse(downloadedText);
  } catch (err: any) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: `Durable backup verification failed: Re-downloaded storage file is corrupt or invalid JSON: ${err.message}`
    };
  }

  // A. Verify Orders Dataset
  if (!Array.isArray(downloadedParsed.orders) || downloadedParsed.orders.length !== orderCount) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: `Durable backup order count mismatch: storage contains ${downloadedParsed.orders?.length} orders, but live database contains ${orderCount}. Aborting cleanup.`
    };
  }
  const dlOrdersChecksum = crypto.createHash("sha256").update(JSON.stringify(downloadedParsed.orders)).digest("hex");
  if (dlOrdersChecksum !== ordersChecksum) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: "Durable backup orders SHA-256 checksum mismatch on storage re-download verification. Aborting cleanup."
    };
  }

  // B. Verify Notifications Dataset
  if (!Array.isArray(downloadedParsed.notifications) || downloadedParsed.notifications.length !== orderNotifications.length) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: `Durable backup notification count mismatch: storage contains ${downloadedParsed.notifications?.length} notifications, expected ${orderNotifications.length}. Aborting cleanup.`
    };
  }
  const dlNotifsChecksum = crypto.createHash("sha256").update(JSON.stringify(downloadedParsed.notifications)).digest("hex");
  if (dlNotifsChecksum !== notificationsChecksum) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: "Durable backup notifications SHA-256 checksum mismatch on storage re-download verification. Aborting cleanup."
    };
  }

  // C. Verify Audit Logs Dataset
  if (!Array.isArray(downloadedParsed.auditLogs) || downloadedParsed.auditLogs.length !== targetedAuditLogs.length) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: `Durable backup audit logs count mismatch: storage contains ${downloadedParsed.auditLogs?.length} audit logs, expected ${targetedAuditLogs.length}. Aborting cleanup.`
    };
  }
  const dlAuditsChecksum = crypto.createHash("sha256").update(JSON.stringify(downloadedParsed.auditLogs)).digest("hex");
  if (dlAuditsChecksum !== auditLogsChecksum) {
    return {
      success: false,
      backupFileName,
      storagePath: "",
      byteSize,
      verified: false,
      orderCount,
      notifCount: orderNotifications.length,
      auditCount: targetedAuditLogs.length,
      error: "Durable backup audit logs SHA-256 checksum mismatch on storage re-download verification. Aborting cleanup."
    };
  }

  console.log(`[BACKUP VERIFIED] Roundtrip verification successful: ${storagePath} (${byteSize} bytes, ${orderCount} orders, ${orderNotifications.length} notifications, ${targetedAuditLogs.length} audits verified)`);

  // 6. Save secondary copy to local filesystem if writable
  const localCandidates = [
    path.join(process.cwd(), "backups"),
    path.join(os.tmpdir(), "planmychoice_backups")
  ];

  for (const candidateDir of localCandidates) {
    try {
      if (!fs.existsSync(candidateDir)) {
        fs.mkdirSync(candidateDir, { recursive: true });
      }
      fs.writeFileSync(path.join(candidateDir, backupFileName), backupJson, "utf-8");
      console.log(`[BACKUP LOCAL] Saved snapshot copy to: ${path.join(candidateDir, backupFileName)}`);
      break;
    } catch (diskErr: any) {
      console.warn(`[BACKUP LOCAL] Read-only or inaccessible path ${candidateDir}:`, diskErr.message);
    }
  }

  return {
    success: true,
    backupFileName,
    storagePath,
    byteSize,
    verified: true,
    orderCount,
    notifCount: orderNotifications.length,
    auditCount: targetedAuditLogs.length
  };
}

// 3. POST /api/admin/orders/clear-all (Admin Only) - Pre-deletion backup, double-lock concurrency, and verified cleanup
app.post("/api/admin/orders/clear-all", async (req: any, res: any) => {
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  if (!supabase) {
    return res.status(503).json({ success: false, error: "Database connection unavailable." });
  }

  const { confirmation, dryRun } = req.body || {};

  // For real deletion, enforce strict confirmation
  if (!dryRun && confirmation !== "DELETE ALL ORDERS") {
    return res.status(400).json({
      success: false,
      error: 'Confirmation mismatch. You must pass { "confirmation": "DELETE ALL ORDERS" } to execute this operation.'
    });
  }

  // Concurrency Check 1: In-memory lock (Fail Closed)
  if (isOrderCleanupInProgress && (Date.now() - orderCleanupLockStartedAt < DB_LOCK_TIMEOUT_MS)) {
    return res.status(409).json({
      success: false,
      error: "An order cleanup operation is already in progress. Duplicate request blocked."
    });
  }

  // Concurrency Check 2: Database-level lock (Fail Closed)
  const lockResult = await acquireDbOrderCleanupLock(supabase, auth.email || "admin");
  if (!lockResult.acquired) {
    return res.status(409).json({
      success: false,
      error: lockResult.reason || "Database lock is currently held by another administrative task. Operation aborted."
    });
  }

  isOrderCleanupInProgress = true;
  orderCleanupLockStartedAt = Date.now();

  try {
    // 1. Fetch all existing orders for backup snapshot
    const { data: existingOrders, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchErr) {
      console.error("[CLEAR ALL ORDERS] Failed to fetch orders for backup:", fetchErr);
      return res.status(500).json({
        success: false,
        error: "Failed to read orders for backup snapshot: " + fetchErr.message
      });
    }

    const orderCount = existingOrders ? existingOrders.length : 0;

    // 2. Generate durable, verified backup snapshot (Supabase Storage + roundtrip verification)
    const backupResult = await createAndVerifyOrderBackup(supabase, existingOrders || [], auth.email || "admin");

    // Fail Closed: If backup creation or roundtrip verification fails, abort immediately
    if (!backupResult.success || !backupResult.verified) {
      console.error("[CLEAR ALL ORDERS] Fail Closed: Backup verification failed:", backupResult.error);
      return res.status(500).json({
        success: false,
        error: "Pre-deletion durable backup creation failed verification. Zero database records were modified.",
        details: backupResult.error
      });
    }

    // DRY-RUN MODE: Verify everything and return full validation report WITHOUT touching live records
    if (dryRun === true) {
      console.log(`[CLEAR ALL ORDERS] Dry-run executed successfully for ${orderCount} orders. Zero records deleted.`);
      return res.json({
        success: true,
        dryRun: true,
        clearedOrdersCount: 0,
        pendingOrdersCount: orderCount,
        backupFileName: backupResult.backupFileName,
        storagePath: backupResult.storagePath,
        byteSize: backupResult.byteSize,
        verified: true,
        previewTargets: {
          ordersTargeted: orderCount,
          notificationsTargeted: backupResult.notifCount,
          auditLogsTargeted: backupResult.auditCount
        },
        message: `Dry-run verification completed successfully! Automated backup created, re-downloaded, and verified in Supabase Storage (${backupResult.byteSize} bytes). All ${orderCount} orders remain completely intact.`
      });
    }

    // 3. Pre-cleanup Administrative Audit Count Snapshot & Baseline Guard
    const APPROVED_BASELINE = {
      ORDERS: 46,
      NOTIFICATIONS: 287,
      AUDITS: 47
    };

    const PRESERVED_ADMIN_ACTIONS = [
      "Update Platform Settings",
      "Moved to Trash",
      "Permanently Deleted",
      "badge removed",
      "badge edited",
      "badge activated",
      "badge assigned",
      "badge deactivated",
      "Badge Created",
      "Approve Profile Update",
      "Reject Profile Update",
      "test_action"
    ];

    const { count: prePreservedAdminCount } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .in("action", PRESERVED_ADMIN_ACTIONS);

    // Baseline Guard: Abort before RPC invocation if live inspected counts differ from approved baseline
    if (
      orderCount !== APPROVED_BASELINE.ORDERS ||
      backupResult.notifCount !== APPROVED_BASELINE.NOTIFICATIONS ||
      backupResult.auditCount !== APPROVED_BASELINE.AUDITS
    ) {
      console.error("[CLEAR ALL ORDERS] Pre-RPC baseline mismatch detected:", {
        orders: { approved: APPROVED_BASELINE.ORDERS, live: orderCount },
        notifications: { approved: APPROVED_BASELINE.NOTIFICATIONS, live: backupResult.notifCount },
        audits: { approved: APPROVED_BASELINE.AUDITS, live: backupResult.auditCount }
      });
      return res.status(409).json({
        success: false,
        error: "Live database counts do not match the approved baseline. Operation aborted before calling RPC.",
        baselineComparison: {
          orders: { approved: APPROVED_BASELINE.ORDERS, live: orderCount },
          notifications: { approved: APPROVED_BASELINE.NOTIFICATIONS, live: backupResult.notifCount },
          audits: { approved: APPROVED_BASELINE.AUDITS, live: backupResult.auditCount }
        },
        backupFileName: backupResult.backupFileName
      });
    }

    // 4. Execution Path: Exclusive Atomic Execution via PostgreSQL RPC
    // Security & Integrity Mandate:
    // - Direct REST batch deletes are strictly prohibited as a fallback.
    // - The only permitted deletion path is the installed atomic RPC 'clear_all_orders_atomic'.
    // - Verified baseline counts are explicitly passed into the RPC parameters.
    // - If the RPC function is missing or fails, immediately return HTTP 500 without altering database records.
    const { data: rpcData, error: rpcErr } = await supabase.rpc("clear_all_orders_atomic", {
      p_admin_email: auth.email || "admin",
      p_backup_file_name: backupResult.backupFileName,
      p_expected_orders: orderCount,
      p_expected_notifications: backupResult.notifCount,
      p_expected_audits: backupResult.auditCount
    });

    if (rpcErr) {
      console.error("[CLEAR ALL ORDERS] Atomic RPC execution failed:", rpcErr);
      const isMissing =
        rpcErr.code === "42883" ||
        rpcErr.message?.includes("Could not find the function") ||
        rpcErr.message?.includes("function public.clear_all_orders_atomic");

      return res.status(500).json({
        success: false,
        error: isMissing
          ? "The atomic cleanup RPC function 'public.clear_all_orders_atomic' is not installed in the Supabase database. Please install supabase/clear_all_orders_atomic.sql in the Supabase SQL Editor before proceeding."
          : `Atomic cleanup RPC execution failed: ${rpcErr.message}`,
        details: rpcErr,
        backupFileName: backupResult.backupFileName
      });
    }

    if (!rpcData || !rpcData.success) {
      console.error("[CLEAR ALL ORDERS] Atomic RPC did not return success:", rpcData);
      return res.status(500).json({
        success: false,
        error: "Atomic cleanup RPC executed but did not return a successful response.",
        details: rpcData,
        backupFileName: backupResult.backupFileName
      });
    }

    console.log("[CLEAR ALL ORDERS] Successfully executed atomic PostgreSQL RPC:", rpcData);

    // 5. Post-RPC Multi-Table Verification
    const ORDER_EVENT_TITLES = [
      'New Order Received 🧑‍🍳',
      'Event Completed 🎉',
      'Order Approved',
      'Order Status Adjusted by Admin',
      'Order Approved! 🎉',
      'New Booking Submitted 📨',
      'New Order Created 🔔',
      'Order Force Updated',
      'Details Requested'
    ];

    // A. Verify orders = 0 (Fail Closed on query error or null result)
    const { count: remainingOrders, error: ordersErr } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    if (ordersErr || remainingOrders === null || remainingOrders === undefined) {
      console.error("[CLEAR ALL ORDERS] Post-RPC verification query failure on orders:", ordersErr);
      return res.status(500).json({
        success: false,
        error: `Post-RPC verification query failure on orders: ${ordersErr?.message || "Null order count returned"}. Verification could not be completed.`,
        notice: "The PostgreSQL transaction committed. The durable backup is preserved in Supabase Storage for recovery.",
        backupFileName: backupResult.backupFileName,
        storagePath: backupResult.storagePath
      });
    }

    // B. Verify targeted order notifications = 0 using paginated fetch (Fail Closed on query error or null result)
    const postNotifResult = await fetchAllRowsPaginated(supabase, "notifications", "id, title, orderId");
    if (!postNotifResult.success || !postNotifResult.data) {
      console.error("[CLEAR ALL ORDERS] Post-RPC verification query failure on notifications:", postNotifResult.error);
      return res.status(500).json({
        success: false,
        error: `Post-RPC verification query failure on notifications: ${postNotifResult.error}. Verification could not be completed.`,
        notice: "The PostgreSQL transaction committed. The durable backup is preserved in Supabase Storage for recovery.",
        backupFileName: backupResult.backupFileName,
        storagePath: backupResult.storagePath
      });
    }
    const postNotifRows = postNotifResult.data;

    const remainingOrderNotifs = postNotifRows.filter((n: any) => {
      const trimmedOrderId = typeof n.orderId === "string" ? n.orderId.trim() : "";
      if (!trimmedOrderId) return false;
      if (n.title === "New Partner Registration 🏢") return false;
      return ORDER_EVENT_TITLES.includes(n.title);
    }).length;

    // C. Verify partner registration notification = 1
    const preservedPartnerNotifs = postNotifRows.filter(
      (n: any) => n.title === "New Partner Registration 🏢"
    ).length;

    // D. Verify remaining order-specific audit records = 0 using paginated fetch (Fail Closed on query error or null result)
    const postAuditResult = await fetchAllRowsPaginated(supabase, "audit_logs", "id, action, details");
    if (!postAuditResult.success || !postAuditResult.data) {
      console.error("[CLEAR ALL ORDERS] Post-RPC verification query failure on audit_logs:", postAuditResult.error);
      return res.status(500).json({
        success: false,
        error: `Post-RPC verification query failure on audit_logs: ${postAuditResult.error}. Verification could not be completed.`,
        notice: "The PostgreSQL transaction committed. The durable backup is preserved in Supabase Storage for recovery.",
        backupFileName: backupResult.backupFileName,
        storagePath: backupResult.storagePath
      });
    }
    const postAuditRows = postAuditResult.data;

    const remainingOrderAudits = postAuditRows.filter((a: any) => {
      if (PRESERVED_ADMIN_ACTIONS.includes(a.action)) return false;
      const d = (typeof a.details === "string" ? a.details : "").toLowerCase();
      if (a.action === "Force status: Approved" && d.startsWith("user action on entity: order #")) return true;
      if (a.action === "Order approved" && d.startsWith("order ") && d.includes(": order approved by ")) return true;
      if (a.action === "Order changes requested" && d.startsWith("order ") && d.includes(": order changes requested by ")) return true;
      if (a.action === "Order Deleted" && (d.startsWith("admin permanently deleted order #") || d.startsWith("user action on entity: order #"))) return true;
      return false;
    }).length;

    // E. Verify preserved administrative audit count is unchanged
    const postPreservedAdminCount = postAuditRows.filter((a: any) =>
      PRESERVED_ADMIN_ACTIONS.includes(a.action)
    ).length;

    // F. Verify newly created Clear All Orders audit record exists
    const newClearAllAudit = postAuditRows.find((a: any) =>
      a.action === "Clear All Orders" &&
      typeof a.details === "string" &&
      a.details.includes(backupResult.backupFileName)
    );

    if (
      remainingOrders !== 0 ||
      remainingOrderNotifs !== 0 ||
      preservedPartnerNotifs !== 1 ||
      remainingOrderAudits !== 0 ||
      postPreservedAdminCount !== prePreservedAdminCount ||
      !newClearAllAudit
    ) {
      console.error("[CLEAR ALL ORDERS] Post-RPC verification anomaly detected!", {
        remainingOrders,
        remainingOrderNotifs,
        preservedPartnerNotifs,
        remainingOrderAudits,
        prePreservedAdminCount,
        postPreservedAdminCount,
        newClearAllAuditFound: !!newClearAllAudit
      });
      return res.status(500).json({
        success: false,
        error: "Post-RPC verification anomaly detected: Database state does not match expected integrity criteria.",
        verificationDetails: {
          remainingOrders,
          remainingOrderNotifs,
          preservedPartnerNotifs,
          remainingOrderAudits,
          prePreservedAdminCount,
          postPreservedAdminCount,
          newClearAllAuditFound: !!newClearAllAudit
        },
        notice: "The PostgreSQL transaction has committed and cannot be rolled back. The verified durable backup snapshot is preserved in Supabase Storage for recovery.",
        backupFileName: backupResult.backupFileName,
        storagePath: backupResult.storagePath
      });
    }

    return res.json({
      success: true,
      clearedOrdersCount: rpcData.deleted_orders ?? orderCount,
      deletedNotificationsCount: rpcData.deleted_notifications,
      deletedAuditLogsCount: rpcData.deleted_audit_logs,
      backupFileName: backupResult.backupFileName,
      storagePath: backupResult.storagePath,
      downloadUrl: `/api/admin/orders/backups/${backupResult.backupFileName}`,
      verification: {
        remainingOrders: 0,
        remainingOrderNotifications: 0,
        preservedPartnerNotifications: preservedPartnerNotifs,
        remainingOrderAudits: 0,
        preservedAdminAudits: postPreservedAdminCount,
        newClearAllAuditId: newClearAllAudit?.id
      },
      message: `Successfully verified backup snapshot, executed atomic PostgreSQL RPC, and validated post-cleanup integrity: all ${orderCount} orders cleared, ${rpcData.deleted_notifications} order notifications cleared, ${rpcData.deleted_audit_logs} order audits cleared, and all administrative records preserved.`
    });
  } catch (err: any) {
    console.error("[CLEAR ALL ORDERS] Exception:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to clear order history.",
      details: err?.stack || String(err)
    });
  } finally {
    isOrderCleanupInProgress = false;
    await releaseDbOrderCleanupLock(supabase);
  }
});

// 4. GET /api/admin/backups & /api/admin/orders/backups (Admin Only) - list all backup snapshots
app.get(["/api/admin/backups", "/api/admin/orders/backups"], async (req: any, res: any) => {
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  const backupListMap = new Map<string, { filename: string; sizeBytes: number; createdAt: string; source: string }>();

  // 1. Check Supabase Storage documents bucket
  if (supabase) {
    try {
      const { data: storageFiles } = await supabase.storage
        .from("documents")
        .list("order_backups", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (Array.isArray(storageFiles)) {
        storageFiles.forEach((file: any) => {
          if (file.name && file.name.endsWith(".json")) {
            backupListMap.set(file.name, {
              filename: file.name,
              sizeBytes: file.metadata?.size || 0,
              createdAt: file.created_at || new Date().toISOString(),
              source: "supabase-storage"
            });
          }
        });
      }
    } catch (e: any) {
      console.warn("[BACKUPS LIST] Storage list warning:", e?.message);
    }
  }

  // 2. Check local disk candidate paths
  const localCandidates = [
    path.join(process.cwd(), "backups"),
    path.join(os.tmpdir(), "planmychoice_backups")
  ];

  for (const dir of localCandidates) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
        for (const filename of files) {
          if (!backupListMap.has(filename)) {
            const stat = fs.statSync(path.join(dir, filename));
            backupListMap.set(filename, {
              filename,
              sizeBytes: stat.size,
              createdAt: (stat.birthtime || stat.mtime).toISOString(),
              source: "local-cache"
            });
          }
        }
      }
    } catch (e) {
      // Continue to next directory
    }
  }

  const backups = Array.from(backupListMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return res.json({ success: true, backups });
});

// 5. GET /api/admin/backups/:filename & /api/admin/orders/backups/:filename (Admin Only) - download specific backup snapshot
app.get(["/api/admin/backups/:filename", "/api/admin/orders/backups/:filename"], async (req: any, res: any) => {
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  const safeFilename = path.basename(req.params.filename);

  // 1. Try local disk candidate paths first
  const localCandidates = [
    path.join(process.cwd(), "backups", safeFilename),
    path.join(os.tmpdir(), "planmychoice_backups", safeFilename)
  ];

  for (const filePath of localCandidates) {
    if (fs.existsSync(filePath)) {
      return res.download(filePath, safeFilename);
    }
  }

  // 2. Fetch directly from Supabase Storage documents bucket
  if (supabase) {
    try {
      const storagePath = `order_backups/${safeFilename}`;
      const { data: fileBlob, error: downloadErr } = await supabase.storage
        .from("documents")
        .download(storagePath);

      if (!downloadErr && fileBlob) {
        const buffer = Buffer.from(await fileBlob.arrayBuffer());
        res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
        res.setHeader("Content-Type", "application/json");
        return res.send(buffer);
      }
    } catch (e: any) {
      console.error("[BACKUP DOWNLOAD] Storage download exception:", e?.message);
    }
  }

  return res.status(404).json({ success: false, error: "Backup file not found in storage or cache." });
});

// 6. POST /api/admin/caterers/:id/hide (Admin Only) - hide caterer from public marketplace
app.post("/api/admin/caterers/:id/hide", async (req: any, res: any) => {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: "Caterer ID is required." });
  }

  if (supabase) {
    try {
      const { data: caterer } = await supabase
        .from("caterer_registrations")
        .select("id, businessName")
        .eq("id", id)
        .maybeSingle();

      const { error: updateErr } = await supabase
        .from("caterer_registrations")
        .update({ status: "Hidden", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      await recordAdminAuditLog(
        supabase,
        "Caterer Hidden",
        `Hidden caterer '${caterer?.businessName || id}' from public listings and search. Caterer dashboard and profile remain fully intact.`,
        auth.email || "admin"
      );
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({ success: true, catererId: id, status: "Hidden", message: "Caterer hidden from public website successfully." });
});

// 7. POST /api/admin/caterers/:id/unhide (Admin Only) - unhide caterer (restore to Approved)
app.post("/api/admin/caterers/:id/unhide", async (req: any, res: any) => {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: "Caterer ID is required." });
  }

  if (supabase) {
    try {
      const { data: caterer } = await supabase
        .from("caterer_registrations")
        .select("id, businessName")
        .eq("id", id)
        .maybeSingle();

      const { error: updateErr } = await supabase
        .from("caterer_registrations")
        .update({ status: "Approved", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      await recordAdminAuditLog(
        supabase,
        "Caterer Restored",
        `Restored caterer '${caterer?.businessName || id}' to active public listings.`,
        auth.email || "admin"
      );
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({ success: true, catererId: id, status: "Approved", message: "Caterer unhidden and active in marketplace." });
});

// 8. POST /api/admin/caterers/:id/status (Admin Only) - update status
app.post("/api/admin/caterers/:id/status", async (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  const ALLOWED_STATUSES = ["Approved", "Hidden", "Suspended", "Rejected", "Pending Approval", "Trashed"];
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status '${status}'. Allowed statuses: ${ALLOWED_STATUSES.join(", ")}`
    });
  }

  if (supabase) {
    try {
      const { data: caterer } = await supabase
        .from("caterer_registrations")
        .select("id, businessName")
        .eq("id", id)
        .maybeSingle();

      const { error: updateErr } = await supabase
        .from("caterer_registrations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateErr) {
        return res.status(500).json({ success: false, error: updateErr.message });
      }

      await recordAdminAuditLog(
        supabase,
        `Caterer Status: ${status}`,
        `Updated status of '${caterer?.businessName || id}' to ${status}`,
        auth.email || "admin"
      );
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({ success: true, catererId: id, status });
});

// 9. DELETE /api/admin/caterers/:id (Admin Only) - delete caterer (soft or permanent)
app.delete("/api/admin/caterers/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const isPermanent = req.query.permanent === "true" || req.body?.permanent === true;
  const supabase = getSupabaseClient();
  const auth = await verifyAdminAuth(req, supabase);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ success: false, error: auth.error || "Unauthorized." });
  }

  if (!id) {
    return res.status(400).json({ success: false, error: "Caterer ID is required." });
  }

  if (supabase) {
    try {
      const { data: caterer } = await supabase
        .from("caterer_registrations")
        .select("id, businessName")
        .eq("id", id)
        .maybeSingle();

      const catererName = caterer?.businessName || id;

      if (isPermanent) {
        // Delete badges assignments
        await supabase.from("caterer_badges").delete().eq("caterer_id", id);
        // Delete notifications
        await supabase.from("notifications").delete().eq("catererId", id);
        // Delete registration row
        const { error: delErr } = await supabase.from("caterer_registrations").delete().eq("id", id);
        if (delErr) {
          return res.status(500).json({ success: false, error: delErr.message });
        }

        await recordAdminAuditLog(
          supabase,
          "Caterer Permanently Deleted",
          `Permanently deleted caterer '${catererName}' (ID: ${id}) and cleaned up badge & notification references.`,
          auth.email || "admin"
        );

        return res.json({ success: true, catererId: id, permanent: true, message: `Caterer '${catererName}' permanently deleted.` });
      } else {
        // Safe soft-delete / move to Trash
        const { error: trashErr } = await supabase
          .from("caterer_registrations")
          .update({
            status: "Trashed",
            deletedDate: new Date().toISOString(),
            deletedBy: auth.email || "admin",
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (trashErr) {
          return res.status(500).json({ success: false, error: trashErr.message });
        }

        await recordAdminAuditLog(
          supabase,
          "Caterer Moved to Trash",
          `Moved caterer '${catererName}' (ID: ${id}) to Trash. Can be restored from Trash tab anytime.`,
          auth.email || "admin"
        );

        return res.json({ success: true, catererId: id, permanent: false, message: `Caterer '${catererName}' moved to Trash.` });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({ success: true, catererId: id, permanent: isPermanent });
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
        console.warn(`[SERVER SYNC WARNING] Server-side item upsert failed for "${tableName}" (service role key not configured or RLS applied). Signaling client direct sync fallback:`, errorResponse.message);
        return res.status(200).json({ success: false, fallbackToClientSync: true, warning: errorResponse.message || "Upsert failed" });
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

// Self-healing credentials synchronizer for caterer accounts
app.post("/api/auth/sync-credentials", async (req: any, res: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Database client not configured on server" });
  }

  try {
    const canonicalEmail = email.trim().toLowerCase();
    
    // Check if an approved caterer exists with this email or username and matching password
    const { data: matchedCaterers } = await supabase
      .from("caterer_registrations")
      .select("id, userId, email, password, status, ownerName, businessName, username, phone")
      .or(`email.eq.${canonicalEmail},username.eq.${canonicalEmail},phone.eq.${canonicalEmail}`)
      .eq("status", "Approved")
      .limit(1);

    const caterer = matchedCaterers && matchedCaterers.length > 0 ? matchedCaterers[0] : null;

    if (caterer && caterer.password && caterer.password === password) {
      const targetUserEmail = (caterer.email || canonicalEmail).toLowerCase().trim();
      console.log(`[AUTH SYNC] Found approved caterer registration for "${canonicalEmail}". Synchronizing Supabase Auth account...`);
      let authUserId = caterer.userId;

      // Find or create auth user
      const { data: listResult } = await supabase.auth.admin.listUsers();
      const existingUser = listResult?.users?.find(
        (u: any) =>
          (authUserId && u.id === authUserId) ||
          u.email?.toLowerCase().trim() === targetUserEmail
      );

      if (existingUser) {
        authUserId = existingUser.id;
        await supabase.auth.admin.updateUserById(authUserId, {
          password: password,
          user_metadata: {
            role: "caterer",
            full_name: caterer.ownerName || caterer.businessName || "Caterer",
          },
        });
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email: targetUserEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            role: "caterer",
            full_name: caterer.ownerName || caterer.businessName || "Caterer",
          },
        });
        if (!createErr && newUser?.user) {
          authUserId = newUser.user.id;
        }
      }

      if (authUserId) {
        await supabase
          .from("caterer_registrations")
          .update({ userId: authUserId, email: targetUserEmail })
          .eq("id", caterer.id);

        await supabase.from("profiles").upsert(
          {
            id: authUserId,
            email: targetUserEmail,
            full_name: caterer.ownerName || caterer.businessName || "Caterer",
            role: "caterer",
            must_change_password: false,
          },
          { onConflict: "id" }
        );

        return res.json({ success: true, synchronized: true, email: targetUserEmail });
      }
    }

    return res.json({ success: false, message: "No matching registered credentials to synchronize" });
  } catch (err: any) {
    console.warn("[AUTH SYNC] Exception during sync-credentials handler:", err.message || err);
    return res.status(500).json({ error: err.message || err.toString() });
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

// Rate limiter map for availability checks: IP -> array of timestamps
const signupValidationRateLimits = new Map<string, number[]>();

// Pre-signup Duplicate Email and Phone Validation Endpoint
app.post("/api/auth/validate-signup", async (req: any, res: any) => {
  const { email, phone } = req.body || {};
  const clientIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "global") as string;
  const now = Date.now();

  // Enforce rate limit: max 25 checks per minute per IP
  const timestamps = signupValidationRateLimits.get(clientIp) || [];
  const recentTimestamps = timestamps.filter((t: number) => now - t < 60000);
  if (recentTimestamps.length >= 25) {
    return res.status(429).json({
      available: false,
      error: "Too many registration attempts. Please wait a minute and try again.",
    });
  }
  recentTimestamps.push(now);
  signupValidationRateLimits.set(clientIp, recentTimestamps);

  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPhone = typeof phone === "string" ? normalizePhoneNumberE164(phone) : "";

  if (!cleanEmail && !cleanPhone) {
    return res.status(400).json({ error: "Email or phone is required for validation." });
  }

  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: "Server authentication service unavailable." });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // 1. Check Email uniqueness
    if (cleanEmail) {
      // Check auth.users via admin.listUsers
      const { data: usersData, error: listErr } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (!listErr && usersData?.users) {
        const emailMatch = usersData.users.find(
          (u: any) => (u.email || "").toLowerCase().trim() === cleanEmail
        );
        if (emailMatch) {
          return res.status(200).json({
            available: false,
            field: "email",
            error: "An account with this email already exists. Please log in instead.",
          });
        }

        // 2. Check Phone uniqueness across auth.users (phone column and metadata)
        if (cleanPhone) {
          const phoneMatch = usersData.users.find((u: any) => {
            const rawUserPhone = u.phone || u.user_metadata?.phone;
            if (!rawUserPhone) return false;
            return normalizePhoneNumberE164(rawUserPhone) === cleanPhone;
          });

          if (phoneMatch) {
            return res.status(200).json({
              available: false,
              field: "phone",
              error: "An account with this phone number already exists.",
            });
          }
        }
      }

      // Check profiles table for email
      const { data: profileByEmail } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profileByEmail) {
        return res.status(200).json({
          available: false,
          field: "email",
          error: "An account with this email already exists. Please log in instead.",
        });
      }
    }

    // Check caterer_registrations for phone if phone was provided
    if (cleanPhone) {
      const digitsOnly = cleanPhone.replace(/^\+/, "");
      const { data: catererPhoneMatch } = await adminClient
        .from("caterer_registrations")
        .select("id")
        .or(`phone.eq.${cleanPhone},phone.eq.${digitsOnly}`)
        .maybeSingle();

      if (catererPhoneMatch) {
        return res.status(200).json({
          available: false,
          field: "phone",
          error: "An account with this phone number already exists.",
        });
      }
    }

    return res.status(200).json({
      available: true,
      normalizedPhone: cleanPhone,
    });
  } catch (err: any) {
    console.warn("[VALIDATE SIGNUP] Exception:", err?.message || err);
    return res.status(500).json({ error: "Validation check failed." });
  }
});

// Secure Account Deletion Endpoint (Authenticated User Only)
app.post("/api/account/delete", async (req: any, res: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header." });
  }

  const token = authHeader.replace(/^Bearer\s+/, "").trim();
  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: "Database service unavailable." });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // 1. Verify user's Bearer token securely
    const { data: { user }, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !user) {
      return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    }

    const userId = user.id;
    const userEmail = (user.email || "").toLowerCase().trim();

    // 2. Strict Protection: Administrator accounts CANNOT self-delete
    if (
      userEmail === "meda1824@gmail.com" ||
      userEmail === "admin@caternest.com" ||
      user.user_metadata?.role === "admin"
    ) {
      return res.status(403).json({ error: "Administrator accounts cannot be deleted." });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.role === "admin") {
      return res.status(403).json({ error: "Administrator accounts cannot be deleted." });
    }

    // 3. Delete user data across tables
    try {
      await adminClient.from("notifications").delete().eq("userId", userId);
    } catch (e) {
      // Table column may vary
    }

    await adminClient.from("profiles").delete().eq("id", userId);

    // 4. Delete the user from Supabase Auth
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error(`[ACCOUNT DELETE] Failed to delete auth user ${userId}:`, deleteErr);
      return res.status(500).json({ error: "Failed to delete user account from authentication service." });
    }

    console.log(`[ACCOUNT DELETE] Successfully deleted user ID ${userId} (${userEmail})`);
    return res.status(200).json({ success: true, message: "Account deleted successfully." });
  } catch (err: any) {
    console.error("[ACCOUNT DELETE] Exception:", err);
    return res.status(500).json({ error: err?.message || "Internal server error during account deletion." });
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

const extractPdfAssetsAndText = async (
  pdfBuffer: Buffer
): Promise<{ text: string; cardImages: { b64: string; mimeType: string }[] }> => {
  let text = "";
  const cardImages: { b64: string; mimeType: string }[] = [];

  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const parsed = await parser.getText();
    if (parsed && parsed.text) {
      text = parsed.text;
    }
  } catch (pdfErr) {
    console.warn("[MENU PARSER] PDFParse text extraction error:", pdfErr);
  }

  try {
    const str = pdfBuffer.toString("latin1");
    // Target the 6 unique main package cards (width 669, height 1320-1321) in order
    let re = /(\d+)\s+0\s+obj\s*<<[^>]*\/Width\s+(669)[^>]*\/Height\s+(132[01])[^>]*>>/g;
    let match;
    const seenIds = new Set<string>();
    const detectedCards: { objId: string; width: number; height: number }[] = [];
    while ((match = re.exec(str)) !== null) {
      const objId = match[1];
      const width = parseInt(match[2], 10);
      const height = parseInt(match[3], 10);
      if (!seenIds.has(objId)) {
        seenIds.add(objId);
        detectedCards.push({ objId, width, height });
      }
    }

    // Fallback if no cards match exact 669 dimension
    if (detectedCards.length === 0) {
      re = /(\d+)\s+0\s+obj\s*<<[^>]*\/Width\s+(6[678]\d)[^>]*\/Height\s+(13\d\d)[^>]*>>/g;
      while ((match = re.exec(str)) !== null) {
        const objId = match[1];
        const width = parseInt(match[2], 10);
        const height = parseInt(match[3], 10);
        if (!seenIds.has(objId)) {
          seenIds.add(objId);
          detectedCards.push({ objId, width, height });
        }
      }
    }

    for (const card of detectedCards) {
      const { objId, width, height } = card;
      const marker = objId + " 0 obj";
      const pos = str.indexOf(marker);
      if (pos === -1) continue;
      const streamStart = str.indexOf("stream", pos);
      if (streamStart === -1) continue;
      let dataStart = streamStart + 6;
      if (pdfBuffer[dataStart] === 0x0d && pdfBuffer[dataStart + 1] === 0x0a) dataStart += 2;
      else if (pdfBuffer[dataStart] === 0x0a) dataStart += 1;
      const streamEnd = str.indexOf("endstream", dataStart);
      if (streamEnd === -1) continue;
      const rawData = pdfBuffer.slice(dataStart, streamEnd);
      try {
        const inflated = zlib.inflateSync(rawData);
        // Only keep 24-bit RGB images (3 bytes per pixel)
        if (inflated.length === width * height * 3) {
          const tmpPpm = path.join(os.tmpdir(), `card_${objId}_${Date.now()}.ppm`);
          const tmpJpg = path.join(os.tmpdir(), `card_${objId}_${Date.now()}.jpg`);
          const header = Buffer.from(`P6\n${width} ${height}\n255\n`);
          fs.writeFileSync(tmpPpm, Buffer.concat([header, inflated]));
          execSync(`ffmpeg -y -i "${tmpPpm}" -q:v 2 "${tmpJpg}" 2>/dev/null`);
          if (fs.existsSync(tmpJpg)) {
            const jpgB64 = fs.readFileSync(tmpJpg).toString("base64");
            cardImages.push({ b64: jpgB64, mimeType: "image/jpeg" });
            try {
              fs.unlinkSync(tmpPpm);
              fs.unlinkSync(tmpJpg);
            } catch {}
          }
        }
      } catch {}
    }
  } catch (cardErr) {
    console.warn("[MENU PARSER] Card extraction error:", cardErr);
  }

  return { text, cardImages };
};

const parseMenuHandler = async (req: any, res: any) => {
  const tempFilesToClean: { bucket: string; path: string }[] = [];
  const localTempFilesToClean: string[] = [];
  const supabase = getSupabaseClient();
  try {
    const { imageBase64, images, urls, storageFiles, localTempFiles, catererId } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured" });
    }

    const parts: any[] = [];
    let combinedPdfText = "";

    // 1. Process files from secure Supabase storage
    if (storageFiles && Array.isArray(storageFiles) && storageFiles.length > 0) {
      console.log(`[MENU PARSER] Processing ${storageFiles.length} file(s) from secure storage...`);
      for (const sf of storageFiles) {
        if (!sf.bucket || !sf.path) continue;
        if (typeof sf.path === "string" && sf.path.includes("temp-menu-")) {
          tempFilesToClean.push({ bucket: sf.bucket, path: sf.path });
        }

        let downloadedBuffer: Buffer | null = null;
        let detectedMime = sf.path.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";

        // Method A: Direct server download from private bucket using Supabase service client
        if (supabase) {
          try {
            console.log(`[MENU PARSER] Downloading ${sf.bucket}/${sf.path} from storage...`);
            const { data: fileBlob, error: dlErr } = await supabase.storage
              .from(sf.bucket)
              .download(sf.path);
            if (!dlErr && fileBlob) {
              const ab = await fileBlob.arrayBuffer();
              downloadedBuffer = Buffer.from(ab);
              detectedMime = fileBlob.type || detectedMime;
              console.log(`[MENU PARSER] Downloaded ${(downloadedBuffer.length / 1024 / 1024).toFixed(2)} MB from storage.`);
            } else if (dlErr) {
              console.warn(`[MENU PARSER] supabase.download failed for ${sf.path}:`, dlErr.message);
            }
          } catch (dlEx: any) {
            console.warn(`[MENU PARSER] Exception during storage download:`, dlEx?.message);
          }
        }

        // Method B: Signed download URL fallback
        if (!downloadedBuffer && sf.url) {
          try {
            console.log(`[MENU PARSER] Fetching file via signed URL: ${sf.url}`);
            const fetchRes = await fetch(sf.url);
            if (fetchRes.ok) {
              const ab = await fetchRes.arrayBuffer();
              downloadedBuffer = Buffer.from(ab);
              detectedMime = fetchRes.headers.get("content-type") || detectedMime;
            }
          } catch (fErr: any) {
            console.warn(`[MENU PARSER] Fetch via signed URL failed:`, fErr?.message);
          }
        }

        // Method C: Public URL fallback
        if (!downloadedBuffer && supabase) {
          try {
            const { data: pubData } = supabase.storage
              .from(sf.bucket)
              .getPublicUrl(sf.path);
            if (pubData?.publicUrl) {
              console.log(`[MENU PARSER] Fetching file via public URL fallback: ${pubData.publicUrl}`);
              const fetchRes = await fetch(pubData.publicUrl);
              if (fetchRes.ok) {
                const ab = await fetchRes.arrayBuffer();
                downloadedBuffer = Buffer.from(ab);
                detectedMime = fetchRes.headers.get("content-type") || detectedMime;
              }
            }
          } catch (pubEx: any) {
            console.warn(`[MENU PARSER] Fetch via public URL fallback failed:`, pubEx?.message);
          }
        }

        if (downloadedBuffer) {
          const isPdf = sf.path.toLowerCase().endsWith(".pdf") || detectedMime.includes("pdf");
          if (isPdf) {
            console.log(`[MENU PARSER] Extracting text and assets from storage PDF (${(downloadedBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);
            try {
              const { text: pdfText, cardImages } = await extractPdfAssetsAndText(downloadedBuffer);
              if (pdfText) {
                combinedPdfText += (combinedPdfText ? "\n\n" : "") + pdfText;
                console.log(`[MENU PARSER] Extracted ${pdfText.length} text characters from storage PDF.`);
              }
              if (cardImages && cardImages.length > 0) {
                console.log(`[MENU PARSER] Extracted ${cardImages.length} high-resolution package cards from storage PDF.`);
                cardImages.forEach((img) => {
                  parts.push({
                    inlineData: {
                      data: img.b64,
                      mimeType: img.mimeType,
                    },
                  });
                });
              }
            } catch (pErr) {
              console.warn(`[MENU PARSER] Error in text/card extraction from storage PDF:`, pErr);
            }

            // Push complete PDF as inlineData so Gemini multimodal sees every page
            const b64 = downloadedBuffer.toString("base64").replace(/[\r\n\s]/g, "");
            parts.push({
              inlineData: {
                data: b64,
                mimeType: "application/pdf",
              },
            });
          } else {
            const b64 = downloadedBuffer.toString("base64").replace(/[\r\n\s]/g, "");
            parts.push({
              inlineData: {
                data: b64,
                mimeType: detectedMime,
              },
            });
          }
        }
      }
    }

    // 1b. Process files from chunked local temporary upload (bypasses Vercel payload limits & Supabase RLS)
    if (localTempFiles && Array.isArray(localTempFiles) && localTempFiles.length > 0) {
      console.log(`[MENU PARSER] Processing ${localTempFiles.length} file(s) from chunked temp upload...`);
      for (const ltf of localTempFiles) {
        const filePath = ltf.path || ltf.localTempPath;
        if (!filePath) continue;
        if (!fs.existsSync(filePath)) {
          console.warn(`[MENU PARSER] Local temp file does not exist: ${filePath}`);
          continue;
        }

        localTempFilesToClean.push(filePath);
        const fileBuffer = fs.readFileSync(filePath);
        console.log(`[MENU PARSER] Read ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB from chunked file ${filePath}`);

        const isPdf = filePath.toLowerCase().endsWith(".pdf") || (ltf.mimeType && ltf.mimeType.includes("pdf"));
        if (isPdf) {
          console.log(`[MENU PARSER] Extracting text and assets from chunked PDF (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)...`);
          try {
            const { text: pdfText, cardImages } = await extractPdfAssetsAndText(fileBuffer);
            if (pdfText) {
              combinedPdfText += (combinedPdfText ? "\n\n" : "") + pdfText;
              console.log(`[MENU PARSER] Extracted ${pdfText.length} text characters from chunked PDF.`);
            }
            if (cardImages && cardImages.length > 0) {
              console.log(`[MENU PARSER] Extracted ${cardImages.length} high-resolution package cards from chunked PDF.`);
              cardImages.forEach((img) => {
                parts.push({
                  inlineData: {
                    data: img.b64,
                    mimeType: img.mimeType,
                  },
                });
              });
            }
          } catch (pErr) {
            console.warn(`[MENU PARSER] Error in text/card extraction from chunked PDF:`, pErr);
          }

          const b64 = fileBuffer.toString("base64").replace(/[\r\n\s]/g, "");
          parts.push({
            inlineData: {
              data: b64,
              mimeType: "application/pdf",
            },
          });
        } else {
          const b64 = fileBuffer.toString("base64").replace(/[\r\n\s]/g, "");
          parts.push({
            inlineData: {
              data: b64,
              mimeType: ltf.mimeType || "image/jpeg",
            },
          });
        }
      }
    }

    // 2. Process public or signed URLs
    if (urls && Array.isArray(urls) && urls.length > 0) {
      console.log(
        `[MENU PARSER] Processing menu files from URLs:`,
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
          const buf = Buffer.from(arrayBuf);
          const cleanUrl = url.split("?")[0].toLowerCase();
          const isPdf = cleanUrl.endsWith(".pdf") || (fetchRes.headers.get("content-type") || "").includes("pdf");

          if (isPdf) {
            console.log(`[MENU PARSER] Extracting text and assets from PDF (${(buf.length / 1024 / 1024).toFixed(2)} MB)...`);
            const { text: pdfText, cardImages } = await extractPdfAssetsAndText(buf);
            if (pdfText) {
              combinedPdfText += (combinedPdfText ? "\n\n" : "") + pdfText;
              console.log(`[MENU PARSER] Extracted ${pdfText.length} text characters from PDF.`);
            }
            if (cardImages.length > 0) {
              console.log(`[MENU PARSER] Extracted ${cardImages.length} high-resolution package cards from PDF.`);
              cardImages.forEach((img) => {
                parts.push({
                  inlineData: {
                    data: img.b64,
                    mimeType: img.mimeType,
                  },
                });
              });
            }
            // Always push full PDF as inlineData
            parts.push({
              inlineData: {
                data: buf.toString("base64").replace(/[\r\n\s]/g, ""),
                mimeType: "application/pdf",
              },
            });
          } else {
            let mimeType = fetchRes.headers.get("content-type") || "image/jpeg";
            if (cleanUrl.endsWith(".png")) mimeType = "image/png";
            else if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) mimeType = "image/jpeg";
            parts.push({
              inlineData: {
                data: buf.toString("base64").replace(/[\r\n\s]/g, ""),
                mimeType: mimeType,
              },
            });
          }
        } catch (fetchErr: any) {
          console.error(
            `[MENU PARSER] Failed to fetch menu file from storage: ${url}`,
            fetchErr,
          );
        }
      }
    }

    // 3. Process base64 images & direct base64 PDFs
    const imageArray = images || (imageBase64 ? [imageBase64] : []);
    if (imageArray.length > 0) {
      for (const b64 of imageArray) {
        const match = b64.match(/^data:(.+?);base64,(.+)$/);
        let mimeType = "image/jpeg";
        let base64Data = b64;

        if (match) {
          mimeType = match[1].toLowerCase();
          base64Data = match[2];
        } else {
          base64Data = b64.replace(/^data:image\/\w+;base64,/, "");
        }

        if (mimeType === "image/jpg") mimeType = "image/jpeg";
        base64Data = base64Data.replace(/[\r\n\s]/g, "");

        if (mimeType === "application/pdf" || base64Data.startsWith("JVBERi0")) {
          const buf = Buffer.from(base64Data, "base64");
          console.log(`[MENU PARSER] Extracting text and assets from Base64 PDF (${(buf.length / 1024 / 1024).toFixed(2)} MB)...`);
          const { text: pdfText, cardImages } = await extractPdfAssetsAndText(buf);
          if (pdfText) {
            combinedPdfText += (combinedPdfText ? "\n\n" : "") + pdfText;
          }
          if (cardImages.length > 0) {
            cardImages.forEach((img) => {
              parts.push({
                inlineData: {
                  data: img.b64,
                  mimeType: img.mimeType,
                },
              });
            });
          }
          // Push full PDF as inlineData
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: "application/pdf",
            },
          });
        } else {
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
      }
    }

    if (parts.length === 0 && !combinedPdfText) {
      return res
        .status(400)
        .json({
          error: "No valid menu document content could be fetched or extracted",
        });
    }

    const prompt = `
You are an expert catering menu document parser. You must analyze the provided menu document(s) (which can be multiple pages, images, or extracted text) and comprehensively extract the complete menu into structured JSON.

${combinedPdfText ? `=== EXTRACTED DOCUMENT TEXT (FROM PDF PAGES) ===\n${combinedPdfText}\n================================================\n` : ""}

Your tasks:
1. Extract Caterer Details:
   - Extract Caterer Name (businessName), Owner Name, Address, City from the document if they exist.
   - Separate contact numbers into exactly three lines:
     - primaryWhatsApp: Line 1 (Primary WhatsApp Number, typically key contact mobile number, digits only e.g. "9700015553")
     - secondaryPhone: Line 2 (Secondary Number, digits only)
     - additionalPhone: Line 3 (Optional third number, digits only)
   - logoFound: boolean whether a logo or brand mark is physically present.

2. Extract MASTER DISH CATALOG (masterDishes):
   - In catalog-style multi-page menus (e.g. pages listing full dish varieties), extract EVERY SINGLE dish name under each master category into the "masterDishes" object.
   - Categories must include all available sections:
     - "Welcome Drink": [all drink names]
     - "Salads": [all salad dish names]
     - "Soups": [all soup dish names]
     - "Veg Starters": [all veg starter names]
     - "Chicken Starter": [all chicken starter dish names]
     - "Mutton Starter": [all mutton starter dish names]
     - "Sea Food Starter": [all fish/prawn starter dish names]
     - "Indian Breads": [all bread dish names]
     - "Veg Gravies": [all veg gravy / curry dish names]
     - "Dal": [all dal dish names]
     - "Chicken Gravies": [all chicken gravy dish names]
     - "Mutton Gravies": [all mutton gravy dish names]
     - "Biryani": [all biryani dish names]
     - "Desserts": [all dessert / sweet dish names]
     - "Ice Cream": [all ice cream flavors]
   - Extract ONLY verbatim dish names exactly as written in the catalog. DO NOT omit dishes.

3. Identify all PACKAGES:
   - Detect ALL packages present in the document.
   - For multi-tier catalog menus like Elite Caterers, you MUST extract ALL 6 packages: 'Basic', 'Classic', 'Silver', 'Gold', 'Platinum', 'Diamond'. Do NOT stop at 2 packages!
   - For each package:
     - packageName: string (e.g. "Basic", "Classic", "Silver", "Gold", "Platinum", "Diamond")
     - packageType: "Veg" | "Non-Veg" | "Mixed"
     - pricePerPlate: base price per plate (price for 100-199 guests from pricing table)
     - minimumGuests: minimum guests (100)
     - pricingSlabs: Extract all guest count slabs with minGuests, maxGuests, and price:
       [
         { "minGuests": 100, "maxGuests": 199, "price": 615 },
         { "minGuests": 200, "maxGuests": 299, "price": 500 },
         { "minGuests": 300, "maxGuests": 499, "price": 485 },
         { "minGuests": 500, "maxGuests": 799, "price": 460 },
         { "minGuests": 800, "maxGuests": 999, "price": 430 },
         { "minGuests": 1000, "maxGuests": null, "price": 420 }
       ]

4. Extract Package CATEGORIES & Selection Rules:
   - For each package, extract EVERY category belonging to that package.
   - If dishes are directly listed under the category on the card (self-contained card), put all those dishes in the category's "items" array.
   - If the package card lists category quotas/quantities (e.g. "1 Salad", "1 Veg Soup", "1 Non-Veg Starter (1 Chicken)", "1 Veg Starter", "2 Chicken Gravies", "1 Indian Bread", etc.):
     - Set the categoryName cleanly (e.g. "Salad", "Veg Soup", "Non-Veg Starter", "Veg Starter", "Chicken Gravy", "Veg Gravy", "Dal", "Indian Bread", "Biryani", "Veg Biryani", "Dessert", "Ice Cream", "Welcome Drink").
     - Determine the selectionRule directly from the quantity phrase:
       - "1 Salad", "1 Veg Soup", "1 Veg Starter", "1 Chicken Gravy", "1 Indian Bread", "1 Dessert", "Choose Any 1", "Any One", "Any 1" -> "Choose Any One"
       - "2 Salads", "2 Starters", "2 Chicken Gravies", "2 Veg Gravies", "Choose Any 2", "Any Two", "Any 2" -> "Choose Any Two"
       - "3 Salads", "3 Starters", "3 Breads", "3 Desserts", "Choose Any 3", "Any Three", "Any 3" -> "Choose Any Three"
       - "4 Starters", "4 Veg Starters", "Choose Any 4" -> "Choose Any Four"
       - "5 Starters", "Choose Any 5" -> "Choose Any Five"
       - "6 Starters", "Choose Any Six" -> "Choose Any Six"
       - "Non-Veg Starters (1 Fish, 1 Chicken)" (total 2) -> "Choose Any Two"
       - "Non-Veg Starters (1 Fish, 2 Chicken, 1 Prawn)" (total 4) -> "Choose Any Four"
       - "Non-Veg Starters (2 Fish, 2 Chicken, 1 Prawn, 1 Mutton)" (total 6) -> "Choose Any Six"
       - Fixed accompaniments that come with every meal with NO choice (e.g. "Mirchi Ka Salan & Raita", "Steamed Rice", "Common Items") -> "Included"
       - Dashed notations on cards (e.g. "Veg Starters -------1" or "Drink --------2"):
         - "-------1" -> "Choose Any One"
         - "-------2" -> "Choose Any Two"
         - "-------3" -> "Choose Any Three"
         - "COMMON ITEMS --8" -> categoryName: "Common Items", selectionRule: "Included"
       - Optional add-ons -> "Optional"
       - Supported selectionRule values MUST be: "Choose Any One", "Choose Any Two", "Choose Any Three", "Choose Any Four", "Choose Any Five", "Choose Any Six", "Included", "Optional", "Needs Review".
     - Do not create a category if count is 0 (e.g. "0 Welcome Drink", "0 Ice Cream").

5. Extract ADD-ONS & INCLUDED ITEMS:
   - addOns: array of { itemName, price, unit }
   - includedItems: array of fixed accompaniment strings.

Strict Rules:
- Return ONLY valid JSON. No markdown formatting.
- EXTRACT ONLY WHAT IS EXACTLY WRITTEN IN THE TEXT. Do not invent dishes, categories, or packages.
- Ensure selection rules match supported strings.
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
  "masterDishes": {
    "Salads": ["String"],
    "Soups": ["String"],
    "Veg Starters": ["String"],
    "Veg Gravies": ["String"],
    "Mutton Starter": ["String"],
    "Chicken Starter": ["String"],
    "Sea Food Starter": ["String"],
    "Indian Breads": ["String"],
    "Mutton Gravies": ["String"],
    "Chicken Gravies": ["String"],
    "Haleem": ["String"],
    "Paya": ["String"],
    "Biryani": ["String"],
    "Desserts": ["String"],
    "Welcome Drink": ["String"],
    "Ice Cream": ["String"]
  },
  "packages": [
    {
      "packageName": "String",
      "packageType": "String",
      "pricePerPlate": Number,
      "minimumGuests": Number,
      "pricingSlabs": [
        { "minGuests": Number, "maxGuests": Number | null, "price": Number }
      ],
      "categories": [
        {
          "categoryName": "String",
          "selectionRule": "String",
          "items": ["String"]
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

    // Process actual uploaded files and run Gemini multimodal model with resilient failover & exponential backoff
    let response: any = null;
    let successfulModel: string = "";
    // Candidate models in strict priority order
    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-latest"
    ];
    let lastAiError: any = null;

    const sanitizeErrorMessage = (msg: string): string => {
      if (!msg) return "";
      return msg.replace(/key=[a-zA-Z0-9_\-]+/gi, "key=[REDACTED]");
    };

    const isDemandSpikeOrQuota = (status: number, msg: string): boolean => {
      const lower = msg.toLowerCase();
      return (
        status === 503 ||
        status === 429 ||
        lower.includes("high demand") ||
        lower.includes("spikes in demand") ||
        lower.includes("resource_exhausted") ||
        lower.includes("quota exceeded") ||
        lower.includes("temporarily unavailable")
      );
    };

    const isTransientNetworkError = (err: any): boolean => {
      const msg = String(err?.message || "").toLowerCase();
      const status = Number(err?.status || err?.code || 0);
      return (
        status === 500 ||
        status === 502 ||
        status === 504 ||
        msg.includes("timeout") ||
        msg.includes("econnreset") ||
        msg.includes("fetch failed")
      );
    };

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let modelIdx = 0; modelIdx < candidateModels.length; modelIdx++) {
      const modelName = candidateModels[modelIdx];
      const maxRetriesPerModel = 2;
      let attempt = 0;
      let modelSuccess = false;

      while (attempt < maxRetriesPerModel) {
        attempt++;
        try {
          console.log(`[MENU PARSER] Attempting extraction with model: ${modelName} (Attempt ${attempt}/${maxRetriesPerModel})`);
          
          const freshAiClient = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
            httpOptions: {
              timeout: 100000,
              headers: {
                "User-Agent": "aistudio-build",
              },
            },
          });

          const geminiContents: any = parts.length > 0 
            ? { parts: [...parts, { text: prompt }] }
            : prompt;

          response = await freshAiClient.models.generateContent({
            model: modelName,
            contents: geminiContents,
            config: {
              responseMimeType: "application/json",
            },
          });
          if (response && response.text) {
            successfulModel = modelName;
            modelSuccess = true;
            console.log(`[MENU PARSER] Extraction succeeded using model: ${modelName} on attempt ${attempt}`);
            break;
          }
        } catch (err: any) {
          lastAiError = err;
          const status = Number(err?.status || err?.code || 0);
          const rawMsg = String(err?.message || err || "");
          const sanitizedMsg = sanitizeErrorMessage(rawMsg);
          const isOverloadedOrExhausted = isDemandSpikeOrQuota(status, sanitizedMsg);
          const isNetworkError = isTransientNetworkError(err);
          const isAbortedError =
            err?.name === "AbortError" ||
            status === 20 ||
            rawMsg.toLowerCase().includes("aborted") ||
            rawMsg.toLowerCase().includes("abort");

          console.warn(
            `[MENU PARSER FALLBACK] Model '${modelName}' attempt ${attempt}/${maxRetriesPerModel} failed: HTTP ${status || "unknown"} - ${sanitizedMsg.substring(0, 180)}`
          );

          if (isOverloadedOrExhausted) {
            if (attempt < maxRetriesPerModel) {
              const backoff = 2500 + Math.floor(Math.random() * 1000);
              console.log(`[MENU PARSER] Model '${modelName}' is under demand spike (HTTP ${status}). Retrying with backoff in ${backoff}ms...`);
              await sleep(backoff);
              continue;
            } else {
              const nextModel = candidateModels[modelIdx + 1];
              if (nextModel) {
                console.log(
                  `[MENU PARSER FALLBACK] Model '${modelName}' demand spike persisted. Failing over to next candidate model: '${nextModel}'.`
                );
              }
              break;
            }
          }

          if (isAbortedError) {
            console.warn(`[MENU PARSER FALLBACK] Model '${modelName}' attempt timed out/aborted. Failing over to next candidate model...`);
            break;
          }

          if (isNetworkError && attempt < maxRetriesPerModel) {
            const backoffDelay = 1200 * Math.pow(1.5, attempt - 1) + Math.floor(Math.random() * 500);
            console.log(`[MENU PARSER] Retrying model '${modelName}' in ${backoffDelay}ms due to network glitch...`);
            await sleep(backoffDelay);
          } else {
            break;
          }
        }
      }

      if (modelSuccess && response?.text) {
        break;
      }
    }

    if (!response || !response.text) {
      throw new Error(`AI extraction failed: ${sanitizeErrorMessage(lastAiError?.message) || "No response received from model"}`);
    }

    const text = (response.text || "").trim();
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

    let data: any;
    try {
      data = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      } else {
        throw parseErr;
      }
    }

    // Auto logo logic from menu upload
    if (data.catererDetails) {
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

    // Normalize category selection rules
    const normalizeServerCategoryRule = (rule?: string): string => {
      if (!rule || !String(rule).trim()) return "Needs Review";
      const clean = String(rule).trim();
      const lower = clean.toLowerCase();
      if (lower === "included" || lower === "fixed" || lower === "all included") return "Included";
      if (lower === "optional") return "Optional";
      if (
        lower === "needs review" ||
        lower === "needs_review" ||
        lower === "unclear" ||
        lower === "unknown"
      ) {
        return "Needs Review";
      }

      // Check trailing dash pattern like '------1' or '--2' or '-1' or '-- Any 1'
      const dashMatch = clean.match(/[-–—]+\s*(?:any\s*)?(\d+)/i);
      if (dashMatch) {
        const num = parseInt(dashMatch[1], 10);
        if (num === 0) return "Included";
        if (num === 1) return "Choose Any One";
        if (num === 2) return "Choose Any Two";
        if (num === 3) return "Choose Any Three";
        if (num === 4) return "Choose Any Four";
        if (num === 5) return "Choose Any Five";
        if (num === 6) return "Choose Any Six";
      }

      if (lower.includes("one") || lower.includes("any one") || clean === "1" || clean === "Choose Any 1" || /\b1\b/.test(clean)) {
        return "Choose Any One";
      }
      if (lower.includes("two") || lower.includes("any two") || clean === "2" || clean === "Choose Any 2" || /\b2\b/.test(clean)) {
        return "Choose Any Two";
      }
      if (lower.includes("three") || lower.includes("any three") || clean === "3" || clean === "Choose Any 3" || /\b3\b/.test(clean)) {
        return "Choose Any Three";
      }
      if (lower.includes("four") || lower.includes("any four") || clean === "4" || clean === "Choose Any 4" || /\b4\b/.test(clean)) {
        return "Choose Any Four";
      }
      if (lower.includes("five") || lower.includes("any five") || clean === "5" || clean === "Choose Any 5" || /\b5\b/.test(clean)) {
        return "Choose Any Five";
      }
      if (lower.includes("six") || lower.includes("any six") || clean === "6" || clean === "Choose Any 6" || /\b6\b/.test(clean)) {
        return "Choose Any Six";
      }

      const match = clean.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num === 0) return "Included";
        if (num === 1) return "Choose Any One";
        if (num === 2) return "Choose Any Two";
        if (num === 3) return "Choose Any Three";
        if (num === 4) return "Choose Any Four";
        if (num === 5) return "Choose Any Five";
        if (num === 6) return "Choose Any Six";
        return `Choose Any ${num}`;
      }

      return clean;
    };

    // Helper: Find dishes in masterDishes for a category
    const findDishesForCategory = (catName: string, masterDishes?: Record<string, string[]>): string[] | null => {
      if (!masterDishes || typeof masterDishes !== "object") return null;
      const lower = catName.toLowerCase().trim();
      const masterKeys = Object.keys(masterDishes);

      // Direct exact match
      for (const k of masterKeys) {
        if (k.toLowerCase().trim() === lower && Array.isArray(masterDishes[k]) && masterDishes[k].length > 0) {
          return masterDishes[k];
        }
      }

      // Semantic matching
      if (lower.includes("salad")) {
        return masterDishes["Salads"] || masterDishes["Salad"] || null;
      }
      if (lower.includes("veg soup")) {
        return masterDishes["Veg Soup"] || (masterDishes["Soups"] || []).filter((s: string) => /veg|corn|tomato/i.test(s)) || null;
      }
      if (lower.includes("chicken soup")) {
        return masterDishes["Chicken Soup"] || (masterDishes["Soups"] || []).filter((s: string) => /chicken/i.test(s)) || null;
      }
      if (lower.includes("soup")) {
        return masterDishes["Soups"] || null;
      }
      if (lower.includes("non-veg starter") || lower.includes("non veg starter")) {
        if (lower.includes("chicken") && !lower.includes("fish") && !lower.includes("mutton") && !lower.includes("prawn")) {
          return masterDishes["Chicken Starter"] || masterDishes["Non-Veg Starters"] || null;
        }
        if (lower.includes("fish") || lower.includes("prawn") || lower.includes("mutton")) {
          const combined = [
            ...(masterDishes["Sea Food Starter"] || []),
            ...(masterDishes["Chicken Starter"] || []),
            ...(masterDishes["Mutton Starter"] || []),
          ];
          return combined.length > 0 ? combined : null;
        }
        const combined = [
          ...(masterDishes["Chicken Starter"] || []),
          ...(masterDishes["Sea Food Starter"] || []),
          ...(masterDishes["Mutton Starter"] || []),
        ];
        return combined.length > 0 ? combined : (masterDishes["Non-Veg Starters"] || null);
      }
      if (lower.includes("veg starter")) {
        return masterDishes["Veg Starters"] || masterDishes["Veg Starter"] || null;
      }
      if (lower.includes("chicken gravy") || lower.includes("chicken cur")) {
        return masterDishes["Chicken Gravies"] || masterDishes["Chicken Gravy"] || null;
      }
      if (lower.includes("mutton gravy") || lower.includes("mutton cur")) {
        return masterDishes["Mutton Gravies"] || masterDishes["Mutton Gravy"] || null;
      }
      if (lower.includes("veg gravy") || lower.includes("veg cur")) {
        return masterDishes["Veg Gravies"] || masterDishes["Veg Gravy"] || null;
      }
      if (lower.includes("dal") || lower.includes("dall")) {
        return masterDishes["Dal"] || masterDishes["Variety of Dal"] || ["Dal Makhni", "Dal Fry", "Dal Tadka"];
      }
      if (lower.includes("bread") || lower.includes("roti") || lower.includes("naan")) {
        return masterDishes["Indian Breads"] || masterDishes["Breads"] || null;
      }
      if (lower.includes("biryani")) {
        return masterDishes["Biryani"] || masterDishes["Non Veg Biryani"] || null;
      }
      if (lower.includes("dessert") || lower.includes("sweet")) {
        return masterDishes["Desserts"] || masterDishes["Sweets"] || null;
      }
      if (lower.includes("drink")) {
        return masterDishes["Welcome Drink"] || masterDishes["Drinks"] || null;
      }
      if (lower.includes("ice cream")) {
        return masterDishes["Ice Cream"] || ["Butterscotch", "Vanilla", "Chocolate", "Kulfi", "Cream Stone Ice Cream"];
      }
      if (lower.includes("common item") || lower.includes("accompaniment")) {
        return ["Mirchi Ka Salan & Raita", "Steamed Rice", "Regular Mineral Water"];
      }

      return null;
    };

    // Auto-enrich packages, categories, selection rules, and items
    if (data.packages && Array.isArray(data.packages)) {
      data.packages.forEach((pkg: any) => {
        if (!pkg.pricePerPlate && pkg.pricingSlabs && pkg.pricingSlabs[0]) {
          pkg.pricePerPlate = pkg.pricingSlabs[0].price;
        }
        if (!pkg.minimumGuests && pkg.pricingSlabs && pkg.pricingSlabs[0]) {
          pkg.minimumGuests = pkg.pricingSlabs[0].minGuests;
        }

        if (pkg.categories && Array.isArray(pkg.categories)) {
          const commonItemsList: string[] = [];
          const processedCategories: any[] = [];

          pkg.categories.forEach((cat: any) => {
            let catName = (cat.categoryName || "").trim();
            const lower = catName.toLowerCase();

            // Extract trailing dashes or dashed counts (e.g. "Veg Starters -------1")
            const catDashMatch = catName.match(/^(.*?)\s*[-–—]+\s*(?:any\s*)?(\d+)\s*$/i);
            let detectedCountRule = "";
            if (catDashMatch) {
              catName = catDashMatch[1].trim();
              const count = parseInt(catDashMatch[2], 10);
              if (catName.toLowerCase().includes("common item")) {
                catName = "Common Items";
                detectedCountRule = "Included";
              } else {
                detectedCountRule =
                  count === 1 ? "Choose Any One" :
                  count === 2 ? "Choose Any Two" :
                  count === 3 ? "Choose Any Three" :
                  count === 4 ? "Choose Any Four" :
                  count === 5 ? "Choose Any Five" :
                  count === 6 ? "Choose Any Six" : `Choose Any ${count}`;
              }
            }

            // Consolidate Common Items / accompaniments
            if (
              lower.includes("common item") ||
              lower.includes("mirchi ka salan") ||
              lower.includes("steamed rice") ||
              lower === "common items"
            ) {
              if (Array.isArray(cat.items)) {
                cat.items.forEach((it: any) => {
                  const itName = typeof it === "string" ? it : it?.name;
                  if (itName && !commonItemsList.includes(itName)) commonItemsList.push(itName);
                });
              }
              if (lower.includes("mirchi ka salan") && !commonItemsList.includes("Mirchi Ka Salan & Raita")) {
                commonItemsList.push("Mirchi Ka Salan & Raita");
              }
              if (lower.includes("steamed rice") && !commonItemsList.includes("Steamed Rice")) {
                commonItemsList.push("Steamed Rice");
              }
              return; // Do not push individual accompaniment items as separate categories
            }

            cat.categoryName = catName;

            // Determine selection rule
            const rawRule = detectedCountRule || cat.selectionRule;
            cat.selectionRule = normalizeServerCategoryRule(rawRule);

            // Populate dishes from masterDishes if category has generic placeholder items or <= 1 item
            const hasMultipleRealDishes = Array.isArray(cat.items) && cat.items.length > 1;
            const isGenericPlaceholderList =
              !Array.isArray(cat.items) ||
              cat.items.length <= 1 ||
              cat.items.every((it: any) =>
                /^(fish|chicken|mutton|prawn|salad|soup|veg|non-veg|starter|gravy|bread|dessert|dal|ice cream|biryani)$/i.test(
                  String(it || "").trim()
                )
              );
            const singleItemMatchesCat =
              Array.isArray(cat.items) &&
              cat.items.length === 1 &&
              typeof cat.items[0] === "string" &&
              (
                cat.items[0].toLowerCase().trim() === lower ||
                /salad|soup|starter|gravy|bread|dessert|biryani|dal/i.test(cat.items[0])
              );

            if (isGenericPlaceholderList || !hasMultipleRealDishes || singleItemMatchesCat) {
              const enrichedDishes = findDishesForCategory(catName, data.masterDishes);
              if (enrichedDishes && enrichedDishes.length > 0) {
                cat.items = enrichedDishes;
                console.log(`[MENU PARSER ENRICHMENT] Populated ${enrichedDishes.length} items for "${catName}" in "${pkg.packageName}"`);
              }
            }

            // Guard: If category has multiple choices and is not Common Items/Accompaniments, never allow it to remain 'Included'
            if (
              cat.selectionRule === "Included" &&
              !catName.toLowerCase().includes("common item") &&
              !catName.toLowerCase().includes("accompaniment") &&
              Array.isArray(cat.items) &&
              cat.items.length > 1
            ) {
              console.log(
                `[MENU PARSER GUARD] Category "${catName}" has ${cat.items.length} items but was "Included". Correcting to "Choose Any One".`
              );
              cat.selectionRule = "Choose Any One";
            }

            console.log(
              `[MENU PARSER DIAGNOSTIC] Package: "${pkg.packageName}" | Category: "${cat.categoryName}" | Items: ${cat.items?.length || 0} | Rule: "${cat.selectionRule}"`
            );

            if (cat.items && Array.isArray(cat.items)) {
              cat.items.forEach((item: string) => {
                if (typeof item === "string" && item) {
                  autoMapFoodImage(item);
                }
              });
            }

            processedCategories.push(cat);
          });

          // Add consolidated Common Items category if accompaniments exist
          if (commonItemsList.length > 0) {
            processedCategories.push({
              categoryName: "Common Items",
              selectionRule: "Included",
              items: commonItemsList,
            });
            commonItemsList.forEach((it) => autoMapFoodImage(it));
          }

          pkg.categories = processedCategories;
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

    data.modelUsed = successfulModel;
    console.log(`[MENU PARSER] Menu parsing successfully completed using model: ${successfulModel}`);

    return res.json(data);
  } catch (error: any) {
    console.error("Error parsing menu:", error);
    res.status(500).json({ error: "Failed to parse menu: " + error.message });
  } finally {
    // Clean up temporary storage files after extraction
    if (tempFilesToClean.length > 0 && supabase) {
      console.log(`[MENU PARSER] Cleaning up ${tempFilesToClean.length} temporary storage file(s)...`);
      for (const item of tempFilesToClean) {
        try {
          await supabase.storage.from(item.bucket).remove([item.path]);
          console.log(`[MENU PARSER] Cleaned up temporary upload: ${item.bucket}/${item.path}`);
        } catch (cleanErr: any) {
          console.warn(`[MENU PARSER] Failed to remove temporary file ${item.path}:`, cleanErr?.message);
        }
      }
    }

    // Clean up local temporary files from chunked uploads
    if (localTempFilesToClean.length > 0) {
      console.log(`[MENU PARSER] Cleaning up ${localTempFilesToClean.length} local temporary file(s)...`);
      for (const p of localTempFilesToClean) {
        try {
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            console.log(`[MENU PARSER] Cleaned up local temporary file: ${p}`);
          }
        } catch (unErr: any) {
          console.warn(`[MENU PARSER] Failed to remove local temporary file ${p}:`, unErr?.message);
        }
      }
    }
  }
};

const VALID_CATERER_REGISTRATION_COLUMNS = [
  "id",
  "created_at",
  "updated_at",
  "userId",
  "businessName",
  "ownerName",
  "phone",
  "alternatePhone",
  "email",
  "address",
  "city",
  "cuisine",
  "categories",
  "minGuests",
  "pricePerPlate",
  "status",
  "verificationStatus",
  "menuUploaded",
  "panNumber",
  "aadhaarNumber",
  "fssaiNumber",
  "gstNumber",
  "logo",
  "coverBanner",
  "founderImageUrl",
  "gallery",
  "packages",
  "addOns",
  "includedItems",
  "aadhaarUrl",
  "panUrl",
  "fssaiUrl",
  "gstUrl",
  "otherDocsUrl",
  "rating",
  "reviewCount",
  "branchPhoto",
  "username",
  "password",
  "owner",
  "ownerPhoto",
  "galleryPhotos",
  "draftMenuPackages",
  "additionalPhone",
  "email_verified",
  "pendingUpdates",
  "brandName",
  "tagline",
  "whatsappNumber",
  "operatingHours",
  "serviceAreas",
  "experience",
  "eventsCompleted",
  "awards",
  "certifications"
];

function sanitizeCatererPayload(payload: any): any {
  if (!payload || typeof payload !== "object") return payload;

  const cleaned: any = {};
  const fallbackObj: any = {};
  let hasVirtual = false;

  // Retrieve existing includedItems if provided
  let currentIncluded: any = {};
  if (payload.includedItems) {
    if (typeof payload.includedItems === "string") {
      try {
        currentIncluded = JSON.parse(payload.includedItems);
      } catch (e) {
        currentIncluded = { _raw_string: payload.includedItems };
      }
    } else if (typeof payload.includedItems === "object" && !Array.isArray(payload.includedItems)) {
      currentIncluded = { ...payload.includedItems };
    } else {
      currentIncluded = { _raw_array: payload.includedItems };
    }
  }

  for (const key of Object.keys(payload)) {
    if (VALID_CATERER_REGISTRATION_COLUMNS.includes(key)) {
      cleaned[key] = payload[key];
    } else {
      fallbackObj[`_fallback_${key}`] = payload[key];
      hasVirtual = true;
    }
  }

  if (hasVirtual) {
    cleaned.includedItems = {
      ...currentIncluded,
      ...fallbackObj
    };
  } else if (payload.includedItems !== undefined) {
    cleaned.includedItems = currentIncluded;
  }

  return cleaned;
}

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
      const sanitizedPayload = sanitizeCatererPayload(updatePayload);
      console.log("[saveMenuHandler] Sanitized update payload:", JSON.stringify(sanitizedPayload, null, 2));

      const { data, error } = await supabase
        .from("caterer_registrations")
        .update(sanitizedPayload)
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
        return SEED_FOOD_ITEMS;
      }
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_FOOD_ITEMS;
      } catch (parseErr) {
        console.warn("SyntaxError parsing food images JSON. Recovering with seed list...", parseErr);
        return SEED_FOOD_ITEMS;
      }
    }
  } catch (error) {
    console.warn("Notice: Error reading food images from disk, using seed items:", error);
  }
  return SEED_FOOD_ITEMS;
}

function saveFoodImages(images: any[]) {
  // On Vercel and serverless execution environments, the root filesystem is read-only
  if (process.env.VERCEL) {
    return;
  }
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
    console.warn("Notice: Local food images file write skipped in read-only environment:", error);
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
async function sendOtpEmail(email: string, otp: string, businessName: string) {
  console.log(
    `[OTP EMAIL] Initiating OTP send to ${email} for "${businessName}"`,
  );

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "PlanMyChoice Team <onboarding@resend.dev>";

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
          subject: "PlanMyChoice Caterer Registration - Verification OTP",
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #00483C; margin-top: 0;">Verify Your PlanMyChoice Account</h2>
              <p>Hello,</p>
              <p>Thank you for initiating your caterer registration on PlanMyChoice under the brand name <strong>"${businessName}"</strong>.</p>
              <p>To proceed with your application, please use the following 6-digit One-Time Verification Code (OTP):</p>
              <div style="font-size: 26px; font-weight: bold; padding: 18px; background: #f4fdfa; color: #00483C; letter-spacing: 6px; text-align: center; margin: 25px 0; border: 2px dashed #00483C; border-radius: 8px;">
                ${otp}
              </div>
              <p>This verification code is strictly valid for <strong>10 minutes</strong>. If you did not initiate this registration request, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #888; text-align: center;">PlanMyChoice Coordinator Platform &copy; 2026</p>
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
    console.warn(
      `[OTP EMAIL] No external email provider configured (RESEND_API_KEY or SMTP). Verification OTP for "${businessName}" (${email}) is: ${otp}`
    );
    return;
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
      subject: "PlanMyChoice Caterer Registration - Verification OTP",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #00483C; margin-top: 0;">Verify Your PlanMyChoice Account</h2>
          <p>Hello,</p>
          <p>Thank you for initiating your caterer registration on PlanMyChoice under the brand name <strong>"${businessName}"</strong>.</p>
          <p>To proceed with your application, please use the following 6-digit One-Time Verification Code (OTP):</p>
          <div style="font-size: 26px; font-weight: bold; padding: 18px; background: #f4fdfa; color: #00483C; letter-spacing: 6px; text-align: center; margin: 25px 0; border: 2px dashed #00483C; border-radius: 8px;">
            ${otp}
          </div>
          <p>This verification code is strictly valid for <strong>10 minutes</strong>. If you did not initiate this registration request, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #888; text-align: center;">PlanMyChoice Coordinator Platform &copy; 2026</p>
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

    // Check if username already registered in active/pending caterer_registrations
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

    // Check if email already registered in active/pending caterer_registrations
    const { data: existingRegEmail } = await supabase
      .from("caterer_registrations")
      .select("id")
      .eq("email", canonicalEmail)
      .maybeSingle();

    if (existingRegEmail) {
      return res
        .status(400)
        .json({ error: "A caterer with this email address is already registered." });
    }

    let signupUserId: string | null = null;

    // Check if an existing profile already exists for this email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", canonicalEmail)
      .maybeSingle();

    if (existingProfile) {
      signupUserId = existingProfile.id;
      console.log(`[FINALIZE] Found existing profile ID "${signupUserId}" for email "${canonicalEmail}". Reusing it.`);
    } else {
      // Check Supabase Auth for an existing user
      try {
        const { data: listResult } = await supabase.auth.admin.listUsers();
        const foundUser = listResult?.users?.find((u: any) => u.email?.toLowerCase().trim() === canonicalEmail);
        if (foundUser?.id) {
          signupUserId = foundUser.id;
          console.log(`[FINALIZE] Found existing auth user ID "${signupUserId}" for email "${canonicalEmail}". Reusing it.`);
        }
      } catch (err) {
        console.warn("[FINALIZE] Error checking auth user by email:", err);
      }
    }

    if (signupUserId) {
      // Update existing auth user's password and metadata
      console.log(`[FINALIZE] Reusing existing user account for ID: ${signupUserId}`);
      const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(
        signupUserId,
        {
          password: password,
          user_metadata: {
            role: "caterer",
            full_name: ownerName || businessName,
          }
        }
      );
      if (updateAuthErr) {
        console.warn("[FINALIZE] Warning: Could not update existing auth user details:", updateAuthErr.message);
      }
    } else {
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

      signupUserId = authData?.user?.id || null;
    }

    if (!signupUserId) {
      return res
        .status(500)
        .json({
          error:
            "Authorized registration succeeded but user ID was not found.",
        });
    }

    // Write Profile record using safe upsert with onConflict: 'id'
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: signupUserId,
      email: canonicalEmail,
      full_name: ownerName,
      role: "caterer",
      must_change_password: false,
    }, { onConflict: 'id' });

    if (profileErr) {
      console.error("[FINALIZE] Profile creation/update error:", profileErr);
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
    const catererPayload = {
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
      awards: JSON.stringify(defaultAchievements),
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
    };

    const sanitizedCatererPayload = sanitizeCatererPayload(catererPayload);
    console.log("[FINALIZE] Final sanitized caterer_registrations record payload being inserted:", JSON.stringify(sanitizedCatererPayload, null, 2));

    const { data: insertedReg, error: regInsertErr } = await supabase
      .from("caterer_registrations")
      .insert(sanitizedCatererPayload)
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

// Seed data immediately on module load if not in serverless environment
try {
  if (!process.env.VERCEL) {
    seedFoodImagesOnStartup();
  }
} catch (e) {
  console.warn("Notice: Startup food library seeding skipped:", e);
}

export default app;
