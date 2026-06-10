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

    if (key === 'registrations' || key === 'orders' || key === 'auditLogs') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const tableName = key === 'registrations' 
            ? 'caterer_registrations' 
            : key === 'orders' 
              ? 'orders' 
              : 'audit_logs';
          
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
      const localRegs = JSON.parse(localStorage.getItem('registrations') || '[]');
      const { data: remoteRegs, error: rError } = await supabase
        .from('caterer_registrations')
        .select('*');

      if (!rError) {
        if (remoteRegs && remoteRegs.length > 0) {
          // Sync downstream to client
          originalSetItem.call(localStorage, 'registrations', JSON.stringify(remoteRegs));
        } else if (localRegs.length > 0) {
          // Seed upstream to database
          await syncLocalTableToSupabase('caterer_registrations', localRegs);
        }
      }

      // Sync Orders / Bookings
      const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const { data: remoteOrders, error: oError } = await supabase
        .from('orders')
        .select('*');

      if (!oError) {
        if (remoteOrders && remoteOrders.length > 0) {
          originalSetItem.call(localStorage, 'orders', JSON.stringify(remoteOrders));
        } else if (localOrders.length > 0) {
          await syncLocalTableToSupabase('orders', localOrders);
        }
      }

      // Sync Audit Logs
      const localLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      const { data: remoteLogs, error: lError } = await supabase
        .from('audit_logs')
        .select('*');

      if (!lError) {
        if (remoteLogs && remoteLogs.length > 0) {
          originalSetItem.call(localStorage, 'auditLogs', JSON.stringify(remoteLogs));
        } else if (localLogs.length > 0) {
          await syncLocalTableToSupabase('audit_logs', localLogs);
        }
      }

    } catch (syncErr) {
      console.warn("Background persistence synchronization postponed:", syncErr);
    }
  })();
}
