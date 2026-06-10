import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Lazy initializer for Supabase Server Client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials not fully configured on server, operating in high-performance local fallback mode.");
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const parseMenuHandler = async (req: any, res: any) => {
  try {
    const { imageBase64, images, catererId } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const imageArray = images || (imageBase64 ? [imageBase64] : []);
    if (imageArray.length === 0) {
      return res.status(400).json({ error: "Image data is required" });
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

    const parts: any[] = imageArray.map((b64: string) => {
      const match = b64.match(/^data:(.+?);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = b64;
  
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = b64.replace(/^data:image\/\w+;base64,/, "");
      }
      return {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    });

    const prompt = `
You are an expert catering menu document parser. You must analyze the provided menu document(s) (which can be multiple pages or images) and comprehensively extract the data into structured JSON.

Your tasks:
1. Extract Caterer Details: Extract Caterer Name (businessName), Owner Name, Phone Number(s), Alternate Numbers, and Address/City from the document if they exist.
2. Identify all PACKAGES. Ensure that you detect all packages across multiple pages (e.g. Basic, Classic, Silver, Gold, Platinum, Diamond, Veg, Non-Veg). If you see breakfast items (Idly, Vada, Dosa, Poori, Tea, Coffee), create a separate 'Breakfast' package.
3. Connect Pricing Matrix / Slabs to Packages: Many menus contain pricing slabs based on minimum and maximum guest counts.
Example:
"100-199 Guests = ₹615 per plate" -> minGuests: 100, maxGuests: 199, price: 615
"200-299 Guests = ₹500 per plate" -> minGuests: 200, maxGuests: 299, price: 500
"1000+ Guests = ₹420 per plate" -> minGuests: 1000, maxGuests: null, price: 420
You MUST extract these slabs and place them under the \`pricingSlabs\` array for each package.
4. Link CATEGORIES to PACKAGES. Read the package composition pages and list the categories included in each package, along with the selection rule for each category (e.g. "Choose Any 1", "Choose Any 2", "Choose Any 3", "Included", "Fixed Items").
5. Connect DISHES to CATEGORIES. Look at the detailed menu pages to find the actual list of items for each category and assign them to the respective categories inside the package. Every item under every category must be extracted.
6. Extract ADD-ONS.
7. Extract GENERAL INCLUDED ITEMS/TERMS (e.g., table essentials).

Strict Rules:
- Return ONLY valid JSON. No markdown wrappers (\`\`\`json etc.).
- EXTRACT ONLY WHAT IS EXACTLY WRITTEN IN THE TEXT. Do not invent, guess, or hallucinate dishes, categories, or packages.
- CRITICAL: DO NOT create a category if there are no valid dishes found for it in the document. An empty category or a category with guessed placeholder items (like "Standard Ice Cream" or "Assorted Drinks") is STRICTLY FORBIDDEN.
- Ignore empty categories entirely.
- Do not copy categories from other packages unless explicitly shared in the document.
- Only extract categories physically present in the uploaded menu. Extract only dishes physically present under those categories.
- Ensure selection rules directly state limits (e.g. "Choose Any 1") to aid customer ordering flow.
- Ensure pricing slabs are properly structured.
- Output schema MUST follow EXACTLY:
{
  "catererDetails": {
    "businessName": "String | null",
    "ownerName": "String | null",
    "phone": "String | null",
    "alternatePhone": "String | null",
    "address": "String | null",
    "city": "String | null"
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
        if (catererDetails.phone) updatePayload.phone = catererDetails.phone;
        if (catererDetails.alternatePhone) updatePayload.alternatePhone = catererDetails.alternatePhone;
        if (catererDetails.address) updatePayload.address = catererDetails.address;
        if (catererDetails.city) updatePayload.city = catererDetails.city;
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

  // It does not exist, so according to requirements, create database entry with NO IMAGE AVAILABLE (status: No Image)
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

async function startServer() {
  // Automatically populate library on server boot/reload
  seedFoodImagesOnStartup();
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
