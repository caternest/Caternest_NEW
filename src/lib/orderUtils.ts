import { toast } from '../components/Toast';

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
  | 'cancelled';

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
    default: return 'bg-slate-100 text-slate-800';
  }
}

// Store a new Audit Log inside localStorage, triggering live sync to Supabase
export function storeAuditLog(action: string, orderId: string, email: string, role: string, extraDetails?: string) {
  try {
    const rawLogs = localStorage.getItem('auditLogs');
    const logs: AuditLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    
    const newLog: AuditLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      action: action,
      details: extraDetails || `Order ${orderId}: ${action} by ${email} (${role})`,
      user_email: email,
      role: role,
      orderId: orderId
    };
    
    logs.unshift(newLog);
    localStorage.setItem('auditLogs', JSON.stringify(logs));
    return newLog;
  } catch (err) {
    console.error("Failed to store audit log", err);
  }
}

// Store a new Notification inside localStorage, triggering live sync to Supabase
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
    
    const newNotification: Notification = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      orderId: orderId,
      title: title,
      message: message,
      targetRole: targetRole,
      catererId: catererId,
      read: false
    };
    
    list.unshift(newNotification);
    localStorage.setItem('notifications', JSON.stringify(list));
    return newNotification;
  } catch (err) {
    console.error("Failed to store notification", err);
  }
}

// High performance order status modifier
export function performOrderStatusUpdate(
  orderId: string,
  newStatus: OrderStatus,
  extraData: any = {},
  actorEmail: string,
  actorRole: string
): any[] {
  const rawOrders = localStorage.getItem('orders');
  if (!rawOrders) return [];
  
  const allOrders = JSON.parse(rawOrders);
  const normalizedStatus = normalizeStatus(newStatus);
  const timestamp = new Date().toISOString();
  
  const updatedOrders = allOrders.map((o: any) => {
    if (o.id === orderId) {
      // Build Status History item
      const historyItem = {
        status: normalizedStatus,
        updatedAt: timestamp,
        updatedBy: actorEmail,
        role: actorRole,
        notes: extraData.notes || extraData.rejectionReason || extraData.specialNotes || 'Status changed'
      };
      
      const currentHistory = Array.isArray(o.statusHistory) 
        ? o.statusHistory 
        : Array.isArray(o.status_history) 
          ? o.status_history 
          : [];
          
      const newHistory = [...currentHistory, historyItem];
      
      // Setup timeline dates based on status
      const datesObj: any = {};
      if (normalizedStatus === 'approved') {
        datesObj.approvedAt = timestamp;
        datesObj.approved_at = timestamp;
      } else if (normalizedStatus === 'rejected') {
        datesObj.rejectedAt = timestamp;
        datesObj.rejected_at = timestamp;
      } else if (normalizedStatus === 'completed') {
        datesObj.completedAt = timestamp;
        datesObj.completed_at = timestamp;
      }
      
      return {
        ...o,
        status: normalizedStatus, // Persists standard value
        statusHistory: newHistory,
        status_history: newHistory,
        updatedAt: timestamp,
        updated_at: timestamp,
        ...datesObj,
        ...extraData
      };
    }
    return o;
  });
  
  localStorage.setItem('orders', JSON.stringify(updatedOrders));
  
  // Create audit log
  const actionLabel = `Order ${normalizedStatus.replace(/_/g, ' ')}`;
  storeAuditLog(actionLabel, orderId, actorEmail, actorRole);
  
  return updatedOrders;
}
