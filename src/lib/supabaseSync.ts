import { getSupabase, isSupabaseConfigured, syncLocalTableToSupabase } from "./supabase";

// High fidelity two-way synchronization bridge
export function initializeSupabaseSync() {
  if (!isSupabaseConfigured) {
    console.info("Supabase parameters not configured. Operating in high-performance mock sandbox mode.");
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;

  console.info("Supabase parameters detected. Initializing database routing layer...");

  // 1. Install an interceptor on localStorage.setItem to mirror all client writes to the cloud database
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    let success = false;
    try {
      originalSetItem.call(localStorage, key, value);
      success = true;
    } catch (quotaErr: any) {
      if (
        quotaErr.name === 'QuotaExceededError' ||
        quotaErr.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        quotaErr.code === 22 ||
        quotaErr.code === 1014
      ) {
        console.warn(`[localStorage QUOTA EXCEEDED] Intercepted storage exception for key "${key}". Initiating space cleanup...`);
        if (key === 'registrations') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              const sanitizeItem = (val: any): any => {
                if (typeof val === 'string') {
                  if (val.length > 500 && (val.startsWith('data:') || val.includes(';base64,'))) {
                    return '/placeholder.jpg';
                  }
                  return val;
                }
                if (Array.isArray(val)) {
                  return val.map(item => sanitizeItem(item));
                }
                if (val !== null && typeof val === 'object') {
                  const cleanedObj: any = {};
                  for (const k of Object.keys(val)) {
                    cleanedObj[k] = sanitizeItem(val[k]);
                  }
                  return cleanedObj;
                }
                return val;
              };
              const cleaned = parsed.map(r => sanitizeItem(r));
              const cleanedStr = JSON.stringify(cleaned);
              originalSetItem.call(localStorage, key, cleanedStr);
              value = cleanedStr; // Use cleaned representation for subsequent database sync triggers
              success = true;
              console.info("[localStorage QUOTA EXCEEDED] Successfully sanitized registrations database cache and saved.");
            }
          } catch (innerErr) {
            console.error("Failed to sanitize registrations payload:", innerErr);
          }
        }
        
        if (!success) {
          try {
            localStorage.removeItem('auditLogs');
            localStorage.removeItem('notifications');
            originalSetItem.call(localStorage, key, value);
            success = true;
            console.info(`[localStorage QUOTA EXCEEDED] Recovered space by pruning auxiliary logs; key "${key}" saved.`);
          } catch (lastErr) {
            console.error("Critical: Absolutely out of localStorage space even after log pruning!", lastErr);
          }
        }
      } else {
        throw quotaErr;
      }
    }

    if (key === 'registrations' || key === 'orders' || key === 'auditLogs' || key === 'notifications') {
      try {
        console.log(`[TRACE_LOG #10] supabaseSync.ts interception for key: ${key}`);
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const tableName = key === 'registrations' 
            ? 'caterer_registrations' 
            : key === 'orders' 
              ? 'orders' 
              : key === 'auditLogs'
                ? 'audit_logs'
                : 'notifications';
          
          // Fire non-blocking upload sequence
          syncLocalTableToSupabase(tableName, parsed);
        }
      } catch (err) {
        console.error(`Browser sync interception failed for key: ${key}`, err);
      }
    }
  };

  // 2. Perform non-blocking background initial synchronization
  (async () => {
    try {
      // Sync/Load helper with Quota limit recovery
      const safeLoadTable = (key: string, data: any[]) => {
        try {
          originalSetItem.call(localStorage, key, JSON.stringify(data));
        } catch (quotaErr: any) {
          console.warn(`[BACKGROUND SYNC QUOTA EXCEEDED] Cannot write key "${key}". Sanitizing space...`);
          if (key === 'registrations') {
            try {
              const sanitizeItem = (val: any): any => {
                if (typeof val === 'string') {
                  if (val.length > 500 && (val.startsWith('data:') || val.includes(';base64,'))) {
                    return '/placeholder.jpg';
                  }
                  return val;
                }
                if (Array.isArray(val)) {
                  return val.map(item => sanitizeItem(item));
                }
                if (val !== null && typeof val === 'object') {
                  const cleanedObj: any = {};
                  for (const k of Object.keys(val)) {
                    cleanedObj[k] = sanitizeItem(val[k]);
                  }
                  return cleanedObj;
                }
                return val;
              };
              const cleaned = data.map(r => sanitizeItem(r));
              originalSetItem.call(localStorage, key, JSON.stringify(cleaned));
              console.info("[BACKGROUND SYNC] Successfully loaded sanitized registrations.");
              return;
            } catch (innerErr) {
              console.error("[BACKGROUND SYNC] Sanitization sequence crash for registrations:", innerErr);
            }
          }
          try {
            localStorage.removeItem('auditLogs');
            localStorage.removeItem('notifications');
            originalSetItem.call(localStorage, key, JSON.stringify(data));
          } catch (lastErr) {
            console.error(`[BACKGROUND SYNC] Critical out-of-quota error writing key "${key}":`, lastErr);
          }
        }
      };

      // Sync Caterer Registrations
      const { data: remoteRegs, error: rError } = await supabase
        .from('caterer_registrations')
        .select('*');

      if (!rError && remoteRegs) {
        safeLoadTable('registrations', remoteRegs);
      }

      // Sync Orders / Bookings
      const { data: remoteOrders, error: oError } = await supabase
        .from('orders')
        .select('*');

      if (!oError && remoteOrders) {
        safeLoadTable('orders', remoteOrders);
      }

      // Sync Audit Logs
      const { data: remoteLogs, error: lError } = await supabase
        .from('audit_logs')
        .select('*');

      if (!lError && remoteLogs) {
        safeLoadTable('auditLogs', remoteLogs);
      }

      // Sync Notifications
      const { data: remoteNotifications, error: nError } = await supabase
        .from('notifications')
        .select('*');

      if (!nError && remoteNotifications) {
        safeLoadTable('notifications', remoteNotifications);
      }

    } catch (syncErr) {
      console.warn("Background persistence synchronization postponed:", syncErr);
    }
  })();
}
