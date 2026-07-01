import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabaseUrl = url.replace(/\/rest\/v1\/?$/, "").trim();
const supabase = createClient(supabaseUrl, key);

async function run() {
  const { data: caterers, error } = await supabase
    .from('caterer_registrations')
    .select('id, userId, businessName, email, status');
    
  if (error) {
    console.error("Error fetching registrations:", error);
    return;
  }
  
  console.log("=== CATERER REGISTRATIONS ===");
  caterers.forEach((c: any) => {
    console.log(`ID: ${c.id}, userId: ${c.userId}, businessName: ${c.businessName}, email: ${c.email}, status: ${c.status}`);
  });
}

run();
