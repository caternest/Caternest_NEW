import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Sanitize URL by removing /rest/v1/ if appended
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("CRITICAL: Supabase credentials are missing. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  process.exit(1);
}

console.log("Using sanitized Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function bootstrap() {
  console.log("Starting Admin Accounts Bootstrap on Supabase...");

  const admins = [
    { email: 'meda1824@gmail.com', name: 'Primary Admin' },
    { email: 'ybmk24@gmail.com', name: 'Secondary Admin' }
  ];

  for (const admin of admins) {
    try {
      console.log(`Checking/Registering ${admin.email}...`);
      
      // 1. Create auth user via admin API
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: 'Welcome24',
        email_confirm: true,
        user_metadata: {
          full_name: admin.name,
          role: 'admin'
        }
      });

      let userId = '';

      if (createError) {
        if (createError.message?.includes('already exists') || (createError as any).code === 'email_exists') {
          console.log(`User ${admin.email} already exists in Auth. Fetching user reference...`);
          // Fetch existing user to find ID
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) {
            console.error("Error listing users:", listError);
            continue;
          }
          const foundUser = listData.users.find((u: any) => u.email === admin.email);
          if (foundUser) {
            userId = foundUser.id;
          } else {
            console.error(`Could not locate existing user for email ${admin.email}`);
            continue;
          }
        } else {
          console.error(`Failed to create admin user ${admin.email}:`, createError);
          continue;
        }
      } else if (userData?.user) {
        userId = userData.user.id;
        console.log(`Created Auth User for ${admin.email}, ID: ${userId}`);
      }

      if (userId) {
        // Ensure user password and metadata are up to date (reset password to Welcome24)
        console.log(`Resetting/Updating user ${admin.email} auth credentials...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: 'Welcome24',
          email_confirm: true,
          user_metadata: {
            full_name: admin.name,
            role: 'admin'
          }
        });
        if (updateError) {
          console.error(`Warning: Failed to update auth info for ${admin.email}:`, updateError);
        }

        // Ensure profile is set to admin and must_change_password is true
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: admin.email,
            full_name: admin.name,
            role: 'admin',
            must_change_password: true
          }, { onConflict: 'id' });

        if (profileError) {
          console.error(`Failed to assign database profile for admin ${admin.email}:`, profileError);
        } else {
          console.log(`Admin profile for ${admin.email} successfully bootstrapped!`);
        }
      }
    } catch (err) {
      console.error(`Exception bootstrapping ${admin.email}:`, err);
    }
  }

  console.log("Bootstrap complete!");
}

bootstrap();
