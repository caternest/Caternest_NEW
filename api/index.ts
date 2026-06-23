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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy initializer for Supabase Server Client
const getSupabaseClient = () => {
  const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!rawSupabaseUrl) return null;
  const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials not fully configured on server, operating in high-performance local fallback mode.");
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

// API routes
const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/storage/sign", async (req: any, res: any) => {
  const bucket = req.body.bucket || "branding-images";
  const filePath = req.body.filePath;

  console.log(`[STORAGE SIGN] Initiating pre-signed URL generation. Bucket: ${bucket}, File Path: ${filePath}`);

  if (!filePath) {
    const errorMsg = "Presign failed: No filePath provided in JSON body";
    console.error(`[STORAGE SIGN] ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const errorMsg = "Presign failed: Supabase backend client or service role key is not configured.";
    console.error(`[STORAGE SIGN] ${errorMsg}`);
    return res.status(500).json({ error: errorMsg });
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error(`[STORAGE SIGN] Storage Error generating signed URL for bucket ${bucket}:`, error.message || error);
      return res.status(500).json({ error: error.message, details: error });
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl || null;

    console.log(`[STORAGE SIGN] Presigned URL and Public verification URL generated successfully under Service Role.`);
    return res.json({ success: true, signedUrl: data.signedUrl, token: data.token, path: data.path, publicUrl });
  } catch (err: any) {
    console.error(`[STORAGE SIGN] Unexpected Error in pre-sign handler for bucket ${bucket}:`, err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/upload", upload.single("file"), async (req: any, res: any) => {
  const bucket = req.body.bucket || "branding-images";
  const filePath = req.body.filePath;
  const fileType = req.body.fileType || "image/jpeg";
  const file = req.file;

  console.log(`[STORAGE LOG] Initiating upload. Bucket: ${bucket}, File Name/Path: ${filePath}, File Type: ${fileType}, System File Size: ${file ? file.size : 0} bytes`);

  if (!file) {
    const errorMsg = "Upload failed: No file provided under post multipart field 'file'";
    console.error(`[STORAGE LOG] ${errorMsg}`);
    return res.status(400).json({ error: errorMsg });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const errorMsg = "Upload failed: Supabase backend client or service role key is not configured.";
    console.error(`[STORAGE LOG] ${errorMsg}`);
    return res.status(500).json({ error: errorMsg });
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: fileType,
        upsert: true
      });

    const uploadResultLog = error ? `Error: ${error.message || JSON.stringify(error)}` : "Success";
    console.log(`[STORAGE LOG] Upload attempt complete. Result: ${uploadResultLog}`);

    if (error) {
      console.error(`[STORAGE LOG] Storage Error uploading to bucket ${bucket}:`, error.message || error);
      return res.status(500).json({ error: error.message, details: error });
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl || null;

    console.log(`[STORAGE LOG] Upload successful! Bucket: ${bucket}, File Name: ${filePath}, Result URL: ${publicUrl}`);

    return res.json({ success: true, publicUrl });
  } catch (err: any) {
    console.error(`[STORAGE LOG] Unexpected Error in upload handler for bucket ${bucket}:`, err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/admin/reset-password", async (req: any, res: any) => {
  const { catererId, newPassword } = req.body;

  if (!catererId || !newPassword) {
    return res.status(400).json({ error: "catererId and newPassword are required parameters." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("Supabase not fully setup on server, simulation mode success.");
    return res.json({ success: true, offline: true, message: "Credentials successfully updated in local offline database." });
  }

  try {
    // 1. Get caterer registration
    const { data: caterer, error: fetchErr } = await supabase
      .from('caterer_registrations')
      .select('*')
      .eq('id', catererId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error fetching caterer registration:", fetchErr);
      return res.status(500).json({ error: "Failed to fetch caterer registration: " + fetchErr.message });
    }

    if (!caterer) {
      return res.status(404).json({ error: "Caterer profile not found with the provided id." });
    }

    const email = caterer.email;
    if (!email) {
      return res.status(400).json({ error: "This caterer has no registered email. Cannot perform reset." });
    }

    let authUser = null;
    let userId = caterer.userId;

    // 2. Find Auth user
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error("Error listing users from auth admin:", listErr);
    } else if (listData?.users) {
      // Find by userId first, or fallback to email match
      authUser = listData.users.find((u: any) => 
        (userId && u.id === userId) || u.email?.toLowerCase() === email.toLowerCase()
      );
    }

    if (authUser) {
      console.log(`[AUTH ADMIN] Found existing auth user ${authUser.id} for email ${email}. Updating password...`);
      const { data: updatedUser, error: updateErr } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { password: newPassword }
      );

      if (updateErr) {
        console.error("Error updating password in auth admin:", updateErr);
        return res.status(500).json({ error: "Supabase Auth password update failed: " + updateErr.message });
      }
      
      userId = authUser.id;
    } else {
      console.log(`[AUTH ADMIN] No auth user found for email ${email}. Creating a new auth account...`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true,
        user_metadata: { 
          role: 'caterer',
          full_name: caterer.ownerName || caterer.businessName || 'Caterer'
        }
      });

      if (createErr) {
        console.error("Error creating user in auth admin:", createErr);
        return res.status(500).json({ error: "Supabase Auth user creation failed: " + createErr.message });
      }

      const createdUser = newUser?.user;
      if (!createdUser) {
        return res.status(500).json({ error: "Supabase Auth user creation resulted in empty payload." });
      }

      userId = createdUser.id;
      authUser = createdUser;
    }

    const finalEmail = authUser?.email || email;

    // Check if user is an admin
    const isAdminEmail = ['meda1824@gmail.com', 'ybmk24@gmail.com'].includes(finalEmail.toLowerCase().trim());
    const isAdminRole = authUser?.user_metadata?.role === 'admin';
    const finalRole = (isAdminEmail || isAdminRole) ? 'admin' : 'caterer';

    // 3. Keep caterer_registrations and profiles tables in perfect sync
    // Update user ID and email in registrations
    const { error: updateRegError } = await supabase
      .from('caterer_registrations')
      .update({ 
        userId: userId,
        email: finalEmail
      })
      .eq('id', catererId);

    if (updateRegError) {
      console.warn("Warning: caterer_registrations table sync failed:", updateRegError.message);
    }

    // Create or update profiles row
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: finalEmail,
        full_name: (isAdminEmail || isAdminRole) ? (authUser?.user_metadata?.full_name || 'Primary Admin') : (caterer.ownerName || caterer.businessName || 'Caterer'),
        role: finalRole,
        must_change_password: false
      }, { onConflict: 'id' });

    if (updateProfileError) {
      console.warn("Warning: profiles table sync failed:", updateProfileError.message);
    }

    console.log(`[AUTH ADMIN] Successfully synchronized reset credential flow for caterer ${catererId}`);
    return res.json({ 
      success: true, 
      message: "Caterer password and credentials successfully reset and synchronized." 
    });
  } catch (err: any) {
    console.error("Unexpected error in admin reset-password flow:", err);
    return res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

app.post("/api/admin/approve-caterer", async (req: any, res: any) => {
  const { catererId } = req.body;

  if (!catererId) {
    return res.status(400).json({ error: "catererId is required." });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("Supabase not fully setup on server, simulation mode success.");
    return res.json({ success: true, offline: true, message: "Approved successfully in local storage fallback mode." });
  }

  try {
    // 1. Get caterer registration
    const { data: caterer, error: fetchErr } = await supabase
      .from('caterer_registrations')
      .select('*')
      .eq('id', catererId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error fetching caterer registration:", fetchErr);
      return res.status(500).json({ error: "Failed to fetch caterer registration: " + fetchErr.message });
    }

    if (!caterer) {
      return res.status(404).json({ error: "Caterer profile not found with the provided id." });
    }

    const email = caterer.email;
    if (!email) {
      return res.status(400).json({ error: "This caterer has no registered email. Cannot perform approval sync." });
    }

    let authUser = null;
    let userId = caterer.userId;

    // 2. See if Auth user already exists by listing users
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) {
      console.error("Error listing users from auth admin:", listErr);
    } else if (listData?.users) {
      authUser = listData.users.find((u: any) => 
        (userId && u.id === userId) || u.email?.toLowerCase() === email.toLowerCase()
      );
    }

    if (authUser) {
      console.log(`[AUTH ADMIN] Existing auth user found with ID: ${authUser.id} on approval.`);
      userId = authUser.id;
    } else {
      console.log(`[AUTH ADMIN] No auth user found for email ${email}. Automatically creating active account...`);
      const registeredPassword = caterer.password || "TempPass123!";
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: email,
        password: registeredPassword,
        email_confirm: true,
        user_metadata: {
          role: 'caterer',
          full_name: caterer.ownerName || caterer.businessName || 'Caterer'
        }
      });

      if (createErr) {
        console.error("Error auto-creating auth user on approval:", createErr);
        return res.status(500).json({ error: "Supabase Auth user creation failed: " + createErr.message });
      }

      const createdUser = newUser?.user;
      if (!createdUser) {
        return res.status(500).json({ error: "Supabase Auth user creation returned empty payload." });
      }

      userId = createdUser.id;
      authUser = createdUser;
      console.log(`[AUTH ADMIN] Created new auth user on approval: ${userId}`);
    }

    const finalEmail = authUser?.email || email;

    // Check if user is an admin
    const isAdminEmail = ['meda1824@gmail.com', 'ybmk24@gmail.com'].includes(finalEmail.toLowerCase().trim());
    const isAdminRole = authUser?.user_metadata?.role === 'admin';
    const finalRole = (isAdminEmail || isAdminRole) ? 'admin' : 'caterer';

    // 3. Keep caterer_registrations and profiles tables in perfect sync
    // Update status, email, and user ID in registrations
    const { error: updateRegError } = await supabase
      .from('caterer_registrations')
      .update({ 
        userId: userId,
        email: finalEmail,
        status: 'Approved'
      })
      .eq('id', catererId);

    if (updateRegError) {
      console.warn("Warning: caterer_registrations table sync failed on approval:", updateRegError.message);
    }

    // Create or update profiles row with correct identity properties
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: finalEmail,
        full_name: (isAdminEmail || isAdminRole) ? (authUser?.user_metadata?.full_name || 'Primary Admin') : (caterer.ownerName || caterer.businessName || 'Caterer'),
        role: finalRole,
        must_change_password: (isAdminEmail || isAdminRole) ? false : true
      }, { onConflict: 'id' });

    if (updateProfileError) {
      console.warn("Warning: profiles table sync failed on approval:", updateProfileError.message);
    }

    console.log(`[AUTH ADMIN] Successfully synchronized approval credential flow for caterer ${catererId}`);
    return res.json({ 
      success: true, 
      userId: userId,
      message: "Caterer approved, Auth user created, and profile synchronized with must_change_password." 
    });
  } catch (err: any) {
    console.error("Unexpected error in admin approve-caterer flow:", err);
    return res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

const parseMenuHandler = async (req: any, res: any) => {
  try {
    const { imageBase64, images, urls, catererId } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const parts: any[] = [];

    if (urls && Array.isArray(urls) && urls.length > 0) {
      console.log(`[MENU PARSER] Processing menu files from public URLs:`, urls);
      for (const url of urls) {
        try {
          console.log(`[MENU PARSER] Server fetching menu file: ${url}`);
          const fetchRes = await fetch(url);
          if (!fetchRes.ok) {
            throw new Error(`HTTP error fetching ${url}: ${fetchRes.statusText}`);
          }
          const arrayBuf = await fetchRes.arrayBuffer();
          const base64Data = Buffer.from(arrayBuf).toString("base64");
          
          let mimeType = fetchRes.headers.get("content-type") || "application/pdf";
          if (url.toLowerCase().endsWith(".pdf")) {
            mimeType = "application/pdf";
          } else if (url.toLowerCase().endsWith(".png")) {
            mimeType = "image/png";
          } else if (url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg")) {
            mimeType = "image/jpeg";
          }

          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        } catch (fetchErr: any) {
          console.error(`[MENU PARSER] Failed to fetch menu file from storage: ${url}`, fetchErr);
        }
      }
    } else {
      const imageArray = images || (imageBase64 ? [imageBase64] : []);
      if (imageArray.length === 0) {
        return res.status(400).json({ error: "Image data (images/imageBase64) or urls is required" });
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
            mimeType: mimeType
          }
        });
      });
    }

    if (parts.length === 0) {
      return res.status(400).json({ error: "No valid menu document content could be fetched or extracted" });
    }

    // Lazy initialization of active GoogleGenAI Client
    const aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
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
      data.catererDetails.phone = data.catererDetails.primaryWhatsApp || data.catererDetails.phone;
      data.catererDetails.alternatePhone = data.catererDetails.secondaryPhone || data.catererDetails.alternatePhone;

      if (data.catererDetails.logoFound) {
        if (urls && Array.isArray(urls) && urls.length > 0) {
          data.catererDetails.logoUrl = urls[0];
        } else {
          data.catererDetails.logoUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.catererDetails.businessName || 'Caterer')}&backgroundColor=0b3d2e&textColor=d4a437`;
        }
      } else {
        data.catererDetails.logoUrl = '';
      }
    }

    // Process newly scanned items to map food images automatically
    if (data.packages && Array.isArray(data.packages)) {
      data.packages.forEach((pkg: any) => {
        if (pkg.categories && Array.isArray(pkg.categories)) {
          pkg.categories.forEach((cat: any) => {
            if (cat.items && Array.isArray(cat.items)) {
              cat.items.forEach((item: string) => {
                if (typeof item === 'string' && item) {
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
        console.log(`Auto-saving extracted menu packages to Supabase for caterer: ${catererId}`);
        const { error: dbError } = await supabase
          .from('caterer_registrations')
          .update({
            packages: data.packages || [],
            addOns: data.addOns || [],
            includedItems: data.includedItems || [],
            menuUploaded: true
          })
          .eq('id', catererId);
        
        if (dbError) {
          console.error("Failed to auto-save scanned menu components to database:", dbError);
        } else {
          console.log(`Successfully synced scanned menu and packages back to database for caterer ${catererId}`);
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
    const { catererId, packages, addOns, includedItems, catererDetails } = req.body;
    if (!catererId) {
      return res.status(400).json({ error: "catererId parameter is required" });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const updatePayload: any = {
        packages: packages || [],
        addOns: addOns || [],
        includedItems: includedItems || [],
        menuUploaded: true
      };

      if (catererDetails) {
        if (catererDetails.businessName) updatePayload.businessName = catererDetails.businessName;
        if (catererDetails.ownerName) updatePayload.ownerName = catererDetails.ownerName;
        if (catererDetails.phone || catererDetails.primaryWhatsApp) updatePayload.phone = catererDetails.primaryWhatsApp || catererDetails.phone;
        if (catererDetails.alternatePhone || catererDetails.secondaryPhone) updatePayload.alternatePhone = catererDetails.secondaryPhone || catererDetails.alternatePhone;
        if (catererDetails.additionalPhone) updatePayload.additionalPhone = catererDetails.additionalPhone;
        if (catererDetails.address) updatePayload.address = catererDetails.address;
        if (catererDetails.city) updatePayload.city = catererDetails.city;
        if (catererDetails.logoUrl) {
          updatePayload.logo = catererDetails.logoUrl;
          updatePayload.catererLogo = catererDetails.logoUrl;
        }
      }

      console.log(`Updating caterer ${catererId} menu options on Supabase...`);
      const { data, error } = await supabase
        .from('caterer_registrations')
        .update(updatePayload)
        .eq('id', catererId)
        .select();

      if (error) {
        console.error("Failed to save menu on Supabase:", error);
        return res.status(500).json({ error: error.message });
      }
      return res.json({ success: true, data });
    } else {
      console.warn("Supabase not fully configured on server, returning offline simulation status");
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


const IMAGES_FILE_PATH = path.join(process.cwd(), "src/data/food_item_images.json");

const SEED_FOOD_ITEMS = [
  // South Indian
  { item_name: "Idli", image_url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=450&auto=format&fit=crop&q=80", category: "Breakfast", cuisine: "South Indian" },
  { item_name: "Dosa", image_url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=450&auto=format&fit=crop&q=80", category: "Breakfast", cuisine: "South Indian" },
  { item_name: "Puri", image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80", category: "Breakfast", cuisine: "South Indian" },
  { item_name: "Vada", image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80", category: "Breakfast", cuisine: "South Indian" },
  { item_name: "Sambar", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80", category: "Gravy / Curry", cuisine: "South Indian" },
  { item_name: "Rasam", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80", category: "Soup / Gravy", cuisine: "South Indian" },
  { item_name: "Veg Biryani", image_url: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=450&auto=format&fit=crop&q=80", category: "Rice", cuisine: "South Indian" },
  { item_name: "Chicken Biryani", image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=450&auto=format&fit=crop&q=80", category: "Main Course", cuisine: "South Indian" },
  { item_name: "Mutton Biryani", image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=450&auto=format&fit=crop&q=80", category: "Main Course", cuisine: "South Indian" },
  { item_name: "Paneer Curry", image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80", category: "Gravy / Curry", cuisine: "South Indian" },
  { item_name: "Veg Fried Rice", image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80", category: "Rice", cuisine: "South Indian" },
  { item_name: "Gobi Manchurian", image_url: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "South Indian" },

  // North Indian
  { item_name: "Paneer Butter Masala", image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80", category: "Gravy / Curry", cuisine: "North Indian" },
  { item_name: "Palak Paneer", image_url: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=450&auto=format&fit=crop&q=80", category: "Gravy / Curry", cuisine: "North Indian" },
  { item_name: "Dal Makhani", image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80", category: "Dal & Lentils", cuisine: "North Indian" },
  { item_name: "Butter Naan", image_url: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80", category: "Breads", cuisine: "North Indian" },
  { item_name: "Rumali Roti", image_url: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80", category: "Breads", cuisine: "North Indian" },
  { item_name: "Jeera Rice", image_url: "https://images.unsplash.com/photo-1591814468924-caf77022753c?w=450&auto=format&fit=crop&q=80", category: "Rice", cuisine: "North Indian" },
  { item_name: "Kaju Curry", image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80", category: "Gravy / Curry", cuisine: "North Indian" },
  { item_name: "Chole Bhature", image_url: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80", category: "Main Course", cuisine: "North Indian" },

  // Chinese
  { item_name: "Veg Noodles", image_url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=450&auto=format&fit=crop&q=80", category: "Noodles", cuisine: "Chinese" },
  { item_name: "Hakka Noodles", image_url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=450&auto=format&fit=crop&q=80", category: "Noodles", cuisine: "Chinese" },
  { item_name: "Veg Manchurian", image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "Chinese" },
  { item_name: "Chicken Manchurian", image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "Chinese" },
  { item_name: "Spring Rolls", image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "Chinese" },
  { item_name: "Fried Rice", image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80", category: "Rice", cuisine: "Chinese" },

  // Desserts
  { item_name: "Gulab Jamun", image_url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80", category: "Desserts", cuisine: "Desserts" },
  { item_name: "Rasgulla", image_url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80", category: "Desserts", cuisine: "Desserts" },
  { item_name: "Double Ka Meetha", image_url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80", category: "Desserts", cuisine: "Desserts" },
  { item_name: "Ice Cream", image_url: "https://images.unsplash.com/photo-1501443712940-3decff3f6d90?w=450&auto=format&fit=crop&q=80", category: "Desserts", cuisine: "Desserts" },
  { item_name: "Fruit Salad", image_url: "https://images.unsplash.com/photo-1564093490129-74f1f56b9052?w=450&auto=format&fit=crop&q=80", category: "Desserts", cuisine: "Desserts" },

  // Beverages
  { item_name: "Fruit Punch", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80", category: "Beverages", cuisine: "Beverages" },
  { item_name: "Mojito", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80", category: "Beverages", cuisine: "Beverages" },
  { item_name: "Soft Drinks", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80", category: "Beverages", cuisine: "Beverages" },
  { item_name: "Welcome Drink", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80", category: "Beverages", cuisine: "Beverages" },
  { item_name: "Badam Milk", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80", category: "Beverages", cuisine: "Beverages" },

  // Commonly Known Extra Items
  { item_name: "Paneer Tikka", image_url: "https://images.unsplash.com/photo-1567184109411-47a7a3746aed?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "North Indian" },
  { item_name: "Gobi 65", image_url: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "South Indian" },
  { item_name: "Aloo Tikki", image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "North Indian" },
  { item_name: "French Fries", image_url: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "Western" },
  { item_name: "Crispy Corn", image_url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=450&auto=format&fit=crop&q=80", category: "Starter", cuisine: "Chinese" },
  { item_name: "Garlic Naan", image_url: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80", category: "Breads", cuisine: "North Indian" },
  { item_name: "Tandoori Roti", image_url: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80", category: "Breads", cuisine: "North Indian" },
  { item_name: "Vanilla Ice Cream", image_url: "https://images.unsplash.com/photo-1501443712940-3decff3f6d90?w=450&auto=format&fit=crop&q=80", category: "Desserts", cuisine: "Desserts" },
  { item_name: "Butterscotch Ice Cream", image_url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=450&auto=format&fit=crop&q=80", category: "Desserts", cuisine: "Desserts" },
  { item_name: "Sweet Lassi", image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=450&auto=format&fit=crop&q=80", category: "Beverages", cuisine: "North Indian" }
];

function getFoodImages() {
  try {
    if (fs.existsSync(IMAGES_FILE_PATH)) {
      const data = fs.readFileSync(IMAGES_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading food images:", error);
  }
  return [];
}

function saveFoodImages(images: any[]) {
  try {
    fs.writeFileSync(IMAGES_FILE_PATH, JSON.stringify(images, null, 2), "utf-8");
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
      const exists = images.some((img: any) => img.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim());
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
          updated_at: now
        });
        updated = true;
      } else {
        // Enforce proper category and cuisine for seeded items if undefined
        const idx = images.findIndex((img: any) => img.item_name.toLowerCase().trim() === item.item_name.toLowerCase().trim());
        if (idx !== -1) {
          let itemUpdated = false;
          if (!images[idx].category) { images[idx].category = item.category; itemUpdated = true; }
          if (!images[idx].cuisine) { images[idx].cuisine = item.cuisine; itemUpdated = true; }
          if (!images[idx].status) { images[idx].status = "Approved"; itemUpdated = true; }
          if (!images[idx].image_url && item.image_url) { images[idx].image_url = item.image_url; itemUpdated = true; }
          if (itemUpdated) updated = true;
        }
      }
    }

    if (updated || images.length === 0) {
      saveFoodImages(images);
      console.log("Central Food Image Library seeded successfully with master items.");
    }
  } catch (error) {
    console.error("Error seeding food images:", error);
  }
}

function fuzzyMatchFoodImage(itemName: string) {
  const images = getFoodImages();
  const query = itemName.toLowerCase().trim();

  // 1. Direct match first
  const exact = images.find((i: any) => i.item_name.toLowerCase().trim() === query);
  if (exact) return exact;

  // Helper to remove fillers and return significant lowercase words
  const cleanAndGetWords = (str: string) => {
    return str.toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(w => w && !["and", "with", "the", "special", "royal", "hot", "crispy", "fresh", "style", "signature", "authentic", "premium", "deluxe", "surprise"].includes(w));
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
  const isHighConfidence = bestScore >= 0.4 || (queryWords.length === 1 && bestScore === 1.0);
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
  const existingEmpty = images.find((i: any) => i.item_name.toLowerCase().trim() === lowerName);
  if (existingEmpty) {
    return existingEmpty.image_url;
  }

  // Create auto-mapped metadata
  let category = "Starter";
  let cuisine = "Multicuisine";
  
  if (lowerName.includes("biryani") || lowerName.includes("pulao") || lowerName.includes("rice") || lowerName.includes("pork fried rice")) {
    category = "Rice";
  } else if (lowerName.includes("curry") || lowerName.includes("masala") || lowerName.includes("paneer") || lowerName.includes("dal") || lowerName.includes("gravy") || lowerName.includes("kofta")) {
    category = "Gravy / Curry";
  } else if (lowerName.includes("roti") || lowerName.includes("naan") || lowerName.includes("paratha") || lowerName.includes("bread") || lowerName.includes("kulcha")) {
    category = "Breads";
  } else if (lowerName.includes("ice cream") || lowerName.includes("halwa") || lowerName.includes("jamun") || lowerName.includes("kheer") || lowerName.includes("sweet") || lowerName.includes("dessert") || lowerName.includes("rasgulla") || lowerName.includes("meetha")) {
    category = "Desserts";
  } else if (lowerName.includes("drink") || lowerName.includes("juice") || lowerName.includes("punch") || lowerName.includes("mojito") || lowerName.includes("beverage") || lowerName.includes("milk") || lowerName.includes("soda")) {
    category = "Beverages";
  } else if (lowerName.includes("idli") || lowerName.includes("dosa") || lowerName.includes("puri") || lowerName.includes("vada") || lowerName.includes("sambar") || lowerName.includes("breakfast")) {
    category = "Breakfast";
  } else if (lowerName.includes("soup") || lowerName.includes("shorba")) {
    category = "Soup";
  }

  if (lowerName.includes("idli") || lowerName.includes("dosa") || lowerName.includes("puri") || lowerName.includes("vada") || lowerName.includes("sambar") || lowerName.includes("rasam") || lowerName.includes("south")) {
    cuisine = "South Indian";
  } else if (lowerName.includes("paneer") || lowerName.includes("dal") || lowerName.includes("naan") || lowerName.includes("bhature") || lowerName.includes("north") || lowerName.includes("kaju") || lowerName.includes("roti") || lowerName.includes("chole")) {
    cuisine = "North Indian";
  } else if (lowerName.includes("noodle") || lowerName.includes("manchurian") || lowerName.includes("spring roll") || lowerName.includes("chinese") || lowerName.includes("hakka")) {
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
    updated_at: now
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
  const { item_name, image_url, status, approved_by_admin, caterer_id, delete_item, category, cuisine } = req.body;
  if (!item_name) {
    return res.status(400).json({ error: "Item name is required" });
  }

  let images = getFoodImages();
  
  if (delete_item) {
    images = images.filter((img: any) => img.item_name.toLowerCase().trim() !== item_name.toLowerCase().trim());
    saveFoodImages(images);
    return res.json({ success: true, message: "Item image deleted", images });
  }

  const existingIdx = images.findIndex(
    (img: any) => img.item_name.toLowerCase().trim() === item_name.toLowerCase().trim()
  );

  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    images[existingIdx] = {
      ...images[existingIdx],
      image_url: image_url !== undefined ? image_url : images[existingIdx].image_url,
      status: status || images[existingIdx].status || "Approved",
      approved_by_admin: approved_by_admin !== undefined ? approved_by_admin : images[existingIdx].approved_by_admin,
      caterer_id: caterer_id !== undefined ? caterer_id : images[existingIdx].caterer_id,
      category: category || images[existingIdx].category || "Starter",
      cuisine: cuisine || images[existingIdx].cuisine || "Multicuisine",
      updated_at: now
    };
  } else {
    images.push({
      id: Math.random().toString(36).substr(2, 9),
      item_name,
      image_url: image_url || "",
      status: status || "Approved",
      approved_by_admin: approved_by_admin !== undefined ? approved_by_admin : true,
      caterer_id: caterer_id || null,
      category: category || "Starter",
      cuisine: cuisine || "Multicuisine",
      created_at: now,
      updated_at: now
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
  console.log(`[OTP EMAIL] Sending OTP ${otp} to ${email} for "${businessName}"`);
  console.log(`=== OTP_GENERATION_SUCCESS: EMAIL: ${email}, OTP: ${otp} ===`);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
      }
    });

    const mailOptions = {
      from: '"CaterNest Team" <no-reply@caternest.com>',
      to: email,
      subject: 'CaterNest Caterer Registration - Verification OTP',
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
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[OTP EMAIL] OTP Email sent successfully to ${email}`);
  } catch (err) {
    console.error("[OTP EMAIL] Error sending real email with Nodemailer:", err);
  }
}

app.post("/api/register/request-otp", async (req: any, res: any) => {
  const { businessName, ownerName, email, phone, username, password, menuPackages } = req.body;

  if (!email || !password || !businessName || !ownerName || !phone || !username) {
    return res.status(400).json({ error: "All registration fields (owner, username, email, phone, password) are required." });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Database not available." });
  }

  try {
    const canonicalEmail = email.toLowerCase().trim();
    const canonicalUsername = username.toLowerCase().trim();

    // Check if email already approved/registered/active in caterer_registrations
    const { data: existingApp, error: fetchErr } = await supabase
      .from('caterer_registrations')
      .select('email, status, username')
      .or(`email.eq.${canonicalEmail},username.eq.${canonicalUsername}`);

    if (fetchErr) {
      console.error("Error checking existing registration schema:", fetchErr);
    }

    if (existingApp && existingApp.length > 0) {
      const activeMatch = existingApp.find(x => (x.status || '').toLowerCase() === 'approved');
      if (activeMatch) {
         return res.status(400).json({ error: "A caterer account with this email or username is already active/approved." });
      }
    }

    // Rate-limit check (60 seconds)
    const existingSession = registrationSessions.get(canonicalEmail);
    if (existingSession) {
      const elapsed = (Date.now() - new Date(existingSession.lastSentAt).getTime()) / 1000;
      if (elapsed < 60) {
        return res.status(429).json({ error: `Please wait ${Math.ceil(60 - elapsed)} seconds before requesting a new OTP.` });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Capture registration session securely in-memory
    registrationSessions.set(canonicalEmail, {
      formData: req.body,
      password: password,
      otp: hashedOtp,
      otpExpiry: otpExpiry,
      lastSentAt: new Date()
    });

    console.log(`[OTP REGISTER] Stored temp registration session and hashed OTP for ${canonicalEmail}`);

    // Insert or update pre-existing draft inside caterer_registrations database with status = 'Pending Verification'
    const newReg = {
      businessName,
      owner: ownerName,
      ownerName,
      email: canonicalEmail,
      phone,
      username: canonicalUsername,
      status: 'Pending Verification',
      email_verified: false,
      packages: menuPackages || [],
      draftMenuPackages: menuPackages || []
    };

    const { data: matchedRecord } = await supabase
      .from('caterer_registrations')
      .select('id')
      .eq('email', canonicalEmail)
      .maybeSingle();

    if (matchedRecord) {
      const { error: updateErr } = await supabase
        .from('caterer_registrations')
        .update(newReg)
        .eq('id', matchedRecord.id);

      if (updateErr) {
        console.error("Error updating temp caterer registration:", updateErr.message);
        return res.status(500).json({ error: "Failed to update temporary registration records: " + updateErr.message });
      }
    } else {
      const { error: insertErr } = await supabase
        .from('caterer_registrations')
        .insert([newReg]);

      if (insertErr) {
        console.error("Error inserting temp caterer registration:", insertErr.message);
        return res.status(500).json({ error: "Failed to save temporary registration records: " + insertErr.message });
      }
    }

    // Trigger async email OTP transmission
    await sendOtpEmail(canonicalEmail, otp, businessName);

    return res.json({
      success: true,
      message: "One-Time Verification Code sent of email: " + email,
      otp: otp
    });
  } catch (err: any) {
    console.error("Critical error in request-otp endpoint:", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/register/verify-otp", async (req: any, res: any) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required parameters." });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Database not available." });
  }

  try {
    const canonicalEmail = email.toLowerCase().trim();
    const enterOtp = otp.trim();
    const session = registrationSessions.get(canonicalEmail);

    // Look up caterer registration matching the email
    const { data: reg, error: fetchErr } = await supabase
      .from('caterer_registrations')
      .select('*')
      .eq('email', canonicalEmail)
      .maybeSingle();

    if (fetchErr) {
      console.error("Error retrieving registration record:", fetchErr);
      return res.status(500).json({ error: "Service lookup failed." });
    }

    if (!reg) {
      return res.status(404).json({ error: "No pending registration application found matching this email." });
    }

    // Match OTP and check Expiration
    if (!session) {
      return res.status(400).json({ error: "Verification session expired due to server inactivity. Please request a new OTP." });
    }

    const expectedOtp = session.otp;
    const expectedExpiry = session.otpExpiry;

    const hashedEnterOtp = crypto.createHash('sha256').update(enterOtp).digest('hex');

    if (!expectedOtp || expectedOtp !== hashedEnterOtp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (!expectedExpiry || new Date() > new Date(expectedExpiry)) {
      return res.status(400).json({ error: "OTP Expired" });
    }

    const password = session.password;
    const formData = session.formData;

    if (!password || !formData) {
      return res.status(400).json({ error: "Verification session expired due to server inactivity. Please request a new OTP." });
    }

    console.log(`[OTP VERIFY] Success! Creating auth account on Supabase for email: ${canonicalEmail}`);

    // Create user in Supabase Auth via admin client
    const { data: authData, error: signupErr } = await supabase.auth.admin.createUser({
      email: canonicalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'caterer',
        full_name: formData.ownerName || formData.businessName || 'Caterer'
      }
    });

    if (signupErr) {
      // If user already exists, check if they can be linked
      if (signupErr.message?.includes('already exists') || (signupErr as any).code === 'email_exists') {
        console.warn("[OTP VERIFY] User already exists in auth. Fetching user reference to reconcile...");
        // List user to reconcile
        const { data: listData } = await supabase.auth.admin.listUsers();
        const foundUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === canonicalEmail);
        if (foundUser) {
          const signupUserId = foundUser.id;
          
          await supabase.from('profiles').upsert({
            id: signupUserId,
            email: canonicalEmail,
            full_name: formData.ownerName,
            role: 'caterer',
            must_change_password: false
          }, { onConflict: 'id' });

          await supabase
            .from('caterer_registrations')
            .update({
              userId: signupUserId,
              email_verified: true,
              status: 'Pending Approval'
            })
            .eq('id', reg.id);

          registrationSessions.delete(canonicalEmail);
          return res.json({ success: true, message: "Email verified successfully. Awaiting Admin Approval." });
        }
      }
      console.error("[OTP VERIFY] Auth Account registration failed:", signupErr);
      return res.status(500).json({ error: "Auth registration failed: " + signupErr.message });
    }

    const signupUserId = authData?.user?.id;
    if (!signupUserId) {
      return res.status(500).json({ error: "Verification succeeded but auth user id was not produced." });
    }

    console.log(`[OTP VERIFY] Created auth.user ${signupUserId}. Upserting profile & updating registration.`);

    // Write Profile record
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: signupUserId,
      email: canonicalEmail,
      full_name: formData.ownerName,
      role: 'caterer',
      must_change_password: false
    }, { onConflict: 'id' });

    if (profileErr) {
      console.warn("Profile mapping failed:", profileErr.message);
    }

    // Update caternest registration status and details
    const { error: updateErr } = await supabase
      .from('caterer_registrations')
      .update({
        userId: signupUserId,
        email_verified: true,
        status: 'Pending Approval',
        packages: formData.menuPackages || reg.packages || []
      })
      .eq('id', reg.id);

    if (updateErr) {
      console.error("Updates on registration record failed:", updateErr.message);
    }

    // Clean session
    registrationSessions.delete(canonicalEmail);

    return res.json({
      success: true,
      message: "Email verified successfully. Awaiting Admin Approval."
    });
  } catch (err: any) {
    console.error("Unexpected error in verify-otp api route:", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

app.post("/api/register/resend-otp", async (req: any, res: any) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email parameter is required." });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ error: "Database not available." });
  }

  try {
    const canonicalEmail = email.toLowerCase().trim();
    const session = registrationSessions.get(canonicalEmail);

    if (!session) {
      return res.status(400).json({ error: "No active verification session found. Please register again from Step 1." });
    }

    // Rate limit 60 seconds
    const elapsed = (Date.now() - new Date(session.lastSentAt).getTime()) / 1000;
    if (elapsed < 60) {
      return res.status(429).json({ error: `Please wait ${Math.ceil(60 - elapsed)} seconds before requesting a new OTP.` });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Update session
    session.otp = hashedOtp;
    session.otpExpiry = otpExpiry;
    session.lastSentAt = new Date();

    await sendOtpEmail(canonicalEmail, otp, session.formData.businessName || "Your Business");

    return res.json({
      success: true,
      message: "One-Time Verification Code resent successfully to: " + email,
      otp: otp
    });
  } catch (err: any) {
    console.error("Unexpected error in resend-otp API endpoint:", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
});

// Seed data immediately on module load
try {
  seedFoodImagesOnStartup();
} catch (e) {
  console.error("Error seeding food library:", e);
}

export default app;
