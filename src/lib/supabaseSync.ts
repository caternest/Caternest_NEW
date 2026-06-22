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
    originalSetItem.call(localStorage, key, value);

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
      // Sync Caterer Registrations
      const { data: remoteRegs, error: rError } = await supabase
        .from('caterer_registrations')
        .select('*');

      if (!rError && remoteRegs) {
        originalSetItem.call(localStorage, 'registrations', JSON.stringify(remoteRegs));
      }

      // Sync Orders / Bookings
      const { data: remoteOrders, error: oError } = await supabase
        .from('orders')
        .select('*');

      if (!oError && remoteOrders) {
        originalSetItem.call(localStorage, 'orders', JSON.stringify(remoteOrders));
      }

      // Sync Audit Logs
      const { data: remoteLogs, error: lError } = await supabase
        .from('audit_logs')
        .select('*');

      if (!lError && remoteLogs) {
        originalSetItem.call(localStorage, 'auditLogs', JSON.stringify(remoteLogs));
      }

      // Sync Notifications
      const { data: remoteNotifications, error: nError } = await supabase
        .from('notifications')
        .select('*');

      if (!nError && remoteNotifications) {
        originalSetItem.call(localStorage, 'notifications', JSON.stringify(remoteNotifications));
      }

    } catch (syncErr) {
      console.warn("Background persistence synchronization postponed:", syncErr);
    }
  })();
}
