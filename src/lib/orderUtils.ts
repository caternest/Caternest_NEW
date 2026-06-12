import { toast } from '../components/Toast';
import { getSupabase } from './supabase';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface AuditLog {
  id: string;
  created_at?: string;
  timestamp: string;
  action: string;
  details: string;
  user_email: string;
  role: string;
  orderId?: string;
}

export interface Notification {
  id: string;
  created_at?: string;
  orderId?: string;
  title: string;
  message: string;
  targetRole: 'caterer' | 'admin' | 'customer';
  catererId?: string;
  read: boolean;
}

// Order Status Constants
export const STATUS_PENDING = 'pending';
export const STATUS_APPROVED = 'approved';
export const STATUS_REJECTED = 'rejected';
export const STATUS_CHANGES_REQUESTED = 'changes_requested';
export const STATUS_UPDATED_BY_CUSTOMER = 'updated_by_customer';
export const STATUS_COMPLETED = 'completed';
export const STATUS_CANCELLED = 'cancelled';

export type OrderStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'updated_by_customer'
  | 'completed'
  | 'cancelled'
  | 'quotation_updated';

// Backwards compatibility mapper
export function normalizeStatus(status: string): OrderStatus {
  const s = (status || '').toLowerCase().trim();
  if (s === 'submitted' || s === 'pending caterer review' || s === 'pending') return 'pending';
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'modified' || s === 'changes_requested') return 'changes_requested';
  if (s === 'updated_by_customer' || s === 'updated') return 'updated_by_customer';
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'quotation_updated' || s === 'quotation updated') return 'quotation_updated';
  return 'pending';
}

export function getStatusLabel(status: string): string {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'pending': return 'Pending Review';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'changes_requested': return 'Changes Requested';
    case 'updated_by_customer': return 'Updated by Customer';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'quotation_updated': return 'Quotation Updated';
    default: return status;
  }
}

export function getStatusBadgeColor(status: string): string {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'changes_requested': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'updated_by_customer': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'completed': return 'bg-slate-800 text-white border-slate-750';
    case 'cancelled': return 'bg-slate-100 text-slate-500 border-slate-250';
    case 'quotation_updated': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default: return 'bg-slate-100 text-slate-800';
  }
}

// Store a new Audit Log inside localStorage and write to Supabase
export function storeAuditLog(action: string, orderId: string, email: string, role: string, extraDetails?: string) {
  try {
    const rawLogs = localStorage.getItem('auditLogs');
    const logs: AuditLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    
    const newId = generateUUID();
    const newLog: AuditLog = {
      id: newId,
      timestamp: new Date().toISOString(),
      action: action,
      details: extraDetails || `Order ${orderId}: ${action} by ${email} (${role})`,
      user_email: email,
      role: role,
      orderId: orderId
    };
    
    logs.unshift(newLog);
    localStorage.setItem('auditLogs', JSON.stringify(logs));

    // Direct Non-blocking Supabase Write
    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          const { error } = await (supabase as any).from('audit_logs').insert([{
            id: newId,
            timestamp: newLog.timestamp,
            action: action,
            details: newLog.details,
            user_email: email,
            role: role
          }]);
          if (error) console.error("[AUDIT LOG DB WRITE ERROR]", error.message);
        } catch (err) {
          console.error("[AUDIT LOG DB WRITE CRASH]", err);
        }
      })();
    }
    
    return newLog;
  } catch (err) {
    console.error("Failed to store audit log", err);
  }
}

// Store a new Notification inside localStorage and write to Supabase
export function storeNotification(
  orderId: string,
  title: string,
  message: string,
  targetRole: 'caterer' | 'admin' | 'customer',
  catererId?: string
) {
  try {
    const rawNotify = localStorage.getItem('notifications');
    const list: Notification[] = rawNotify ? JSON.parse(rawNotify) : [];
    
    const newId = generateUUID();
    const newNotification: Notification = {
      id: newId,
      orderId: orderId,
      title: title,
      message: message,
      targetRole: targetRole,
      catererId: catererId,
      read: false
    };
    
    list.unshift(newNotification);
    localStorage.setItem('notifications', JSON.stringify(list));

    // Direct Non-blocking Supabase Write
    const supabase = getSupabase();
    if (supabase) {
      const sanitizedCatererId = catererId && catererId.length === 36 ? catererId : null;
      (async () => {
        try {
          const { error } = await (supabase as any).from('notifications').insert([{
            id: newId,
            orderId: orderId,
            title: title,
            message: message,
            targetRole: targetRole,
            catererId: sanitizedCatererId,
            read: false
          }]);
          if (error) console.error("[NOTIFICATION DB WRITE ERROR]", error.message);
        } catch (err) {
          console.error("[NOTIFICATION DB WRITE CRASH]", err);
        }
      })();
    }
    
    return newNotification;
  } catch (err) {
    console.error("Failed to store notification", err);
  }
}

// High performance order status modifier with direct Supabase write & logging
export async function performOrderStatusUpdate(
  orderId: string,
  newStatus: OrderStatus,
  extraData: any = {},
  actorEmail: string,
  actorRole: string
): Promise<any[]> {
  const rawOrders = localStorage.getItem('orders');
  const allOrders = rawOrders ? JSON.parse(rawOrders) : [];
  const normalizedStatus = normalizeStatus(newStatus);
  const timestamp = new Date().toISOString();

  // Requirement 7: Console log BEFORE update
  console.log("[ORDER UPDATE PROGRESS] Before update:", {
    orderId,
    newStatus: normalizedStatus,
    extraData,
    actorEmail,
    actorRole
  });

  const targetOrder = allOrders.find((o: any) => o.id === orderId);

  // If order not found in localStorage cache, we'll construct a sparse one or load from DB if available
  let previousHistory: any[] = [];
  if (targetOrder) {
    previousHistory = Array.isArray(targetOrder.statusHistory)
      ? targetOrder.statusHistory
      : Array.isArray(targetOrder.status_history)
        ? targetOrder.status_history
        : [];
  }

  // Requirement 5: Create precise new action history log
  let noteText = '';
  if (normalizedStatus === 'approved') noteText = 'Order approved';
  else if (normalizedStatus === 'rejected') noteText = extraData.rejectionReason || 'Order rejected';
  else if (normalizedStatus === 'changes_requested') noteText = extraData.changesRequestedMemo || 'Changes requested by caterer';
  else if (normalizedStatus === 'quotation_updated') noteText = extraData.specialNotes || `Quotation updated: Plate price ₹${extraData.pricePerPlate}`;
  else noteText = extraData.notes || extraData.specialNotes || 'Status updated';

  const historyItem = {
    action: normalizedStatus,
    actor: actorRole === 'partner' ? 'caterer' : actorRole,
    timestamp: timestamp,
    note: noteText
  };

  const newHistory = [...previousHistory, historyItem];

  // Prepare standard mapped database update payload (Standard + Snake case copies)
  const statusUpdateFields: any = {
    status: normalizedStatus,
    statusHistory: newHistory,
    status_history: newHistory,
    updated_at: timestamp
  };

  if (normalizedStatus === 'approved') {
    statusUpdateFields.approvedAt = timestamp;
    statusUpdateFields.approved_at = timestamp;
  } else if (normalizedStatus === 'rejected') {
    statusUpdateFields.rejectedAt = timestamp;
    statusUpdateFields.rejected_at = timestamp;
    statusUpdateFields.specialNotes = extraData.rejectionReason || '';
    statusUpdateFields.notes = extraData.rejectionReason || '';
  } else if (normalizedStatus === 'changes_requested') {
    statusUpdateFields.specialNotes = extraData.changesRequestedMemo || '';
    statusUpdateFields.notes = extraData.changesRequestedMemo || '';
  } else if (normalizedStatus === 'quotation_updated') {
    if (extraData.pricePerPlate !== undefined) {
      statusUpdateFields.pricePerPlate = Number(extraData.pricePerPlate);
    }
    if (extraData.totalEstimate !== undefined) {
      statusUpdateFields.totalEstimate = Number(extraData.totalEstimate);
      statusUpdateFields.totalAmount = Number(extraData.totalEstimate);
    }
    if (extraData.guests !== undefined) {
      statusUpdateFields.guests = Number(extraData.guests);
      statusUpdateFields.guestCount = Number(extraData.guests);
    }
    statusUpdateFields.specialNotes = extraData.specialNotes || '';
    statusUpdateFields.notes = extraData.specialNotes || '';
  }

  // Merging other simple fields passed down
  const finalFields = {
    ...statusUpdateFields,
    ...(normalizedStatus !== 'quotation_updated' ? extraData : {})
  };

  // Requirement 6: Every action must be persisted DIRECTLY in Supabase orders table
  const supabase = getSupabase();
  if (supabase) {
    try {
      console.log(`[ORDER UPDATE PROGRESS] Performing direct Supabase update for order #${orderId}...`);
      const { data, error } = await (supabase as any)
        .from('orders')
        .update(finalFields)
        .eq('id', orderId)
        .select();

      // Requirement 7: Console log update error or result
      if (error) {
        console.error("[ORDER UPDATE ERROR] Supabase update statement rejected:", error);
        toast(`Database save rejected: ${error.message}`, "error");
        throw error;
      }

      console.log("[ORDER UPDATE SUCCESS] Updated row result:", data);
    } catch (saveErr: any) {
      console.error("[ORDER UPDATE ERROR] Exception during Supabase transaction:", saveErr);
      throw saveErr;
    }
  } else {
    console.warn("[ORDER UPDATE PROGRESS] Supabase not initialized; running in browser mock storage sandbox mode.");
  }

  // Write client state mirror cache to ensure instant reactivity and local persistence
  const updatedOrders = allOrders.map((o: any) => {
    if (o.id === orderId) {
      return {
        ...o,
        ...finalFields
      };
    }
    return o;
  });

  localStorage.setItem('orders', JSON.stringify(updatedOrders));

  // Requirement 7: Console log AFTER local update completion
  console.log("[ORDER UPDATE PROGRESS] After update successfully completed in localStorage cache.");

  // Store audit log
  const actionLabel = `Order ${normalizedStatus.replace(/_/g, ' ')}`;
  storeAuditLog(actionLabel, orderId, actorEmail, actorRole);

  return updatedOrders;
}
