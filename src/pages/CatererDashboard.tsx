import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Activity, ChefHat, Bell, TrendingUp, CalendarDays, CheckCircle, CheckCircle2, XCircle, RefreshCw, Clock, Settings, ShoppingBag, CreditCard, User, Image as ImageIcon, MapPin, Search, Menu as MenuIcon, Edit, ChevronRight, X, Save, UploadCloud } from 'lucide-react';
import { cn, compressImageFile } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/Toast';
import CatererMenuBuilder from '../components/CatererMenuBuilder';
import { getSupabase, uploadToSupabaseBucket } from '../lib/supabase';
import { 
  performOrderStatusUpdate, 
  storeNotification, 
  normalizeStatus, 
  getStatusBadgeColor, 
  getStatusLabel 
} from '../lib/orderUtils';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}

const ImageUploaderField: React.FC<ImageUploaderProps> = ({ label, value, onChange, placeholder }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file.");
      return;
    }
    try {
      const supabase = getSupabase();
      if (supabase) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
        const publicUrl = await uploadToSupabaseBucket('branding-images', fileName, file, file.type);
        if (publicUrl) {
          onChange(publicUrl);
          return;
        }
      }
    } catch (storageErr) {
      console.warn("Supabase storage upload failed, fallback to local:", storageErr);
    }

    compressImageFile(file, 600, 600, 0.75)
      .then(base64 => onChange(base64))
      .catch(err => {
        console.error("Error compressing image", err);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            onChange(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isBase64 = value && value.startsWith('data:image/');

  return (
    <div className="space-y-2 text-left">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-2xl p-4 transition-all flex flex-col items-center justify-center min-h-[160px] bg-slate-50 relative overflow-hidden",
          dragActive ? "border-brand-gold-500 bg-brand-gold-50/20" : "border-slate-200 hover:border-slate-300",
          value ? "border-brand-gold-300 bg-white" : ""
        )}
      >
        {value ? (
          <div className="relative w-full h-[140px] flex items-center justify-center group rounded-xl overflow-hidden bg-white">
            <img 
              src={value} 
              alt="Preview" 
              className="max-h-full max-w-full object-contain rounded-xl p-1"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.opacity = '0.3';
              }}
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <label className="cursor-pointer bg-white text-slate-800 text-xs font-black px-4 py-2 rounded-xl hover:bg-slate-100 transition-all select-none">
                Change Image
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>
              <button 
                type="button"
                onClick={() => onChange('')}
                className="bg-red-500 text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-red-600 transition-all"
              >
                Clear
              </button>
            </div>
            <span className="absolute bottom-2 left-2 bg-brand-gold-500 text-slate-900 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow">
              {isBase64 ? 'Uploaded File' : 'URL Image'}
            </span>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center py-2 select-none">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <UploadCloud size={22} className="text-brand-gold-600" />
            </div>
            <p className="text-sm font-bold text-slate-700">Drag & drop your image here, or</p>
            <label className="mt-1 text-xs font-extrabold text-brand-gold-600 hover:text-brand-gold-700 cursor-pointer underline decoration-2 underline-offset-2">
              browse files
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, JPEG, WEBP, GIF</p>
          </div>
        )}
      </div>

      <div className="relative mt-2">
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Or paste image URL</label>
        <input 
          type="text" 
          placeholder={placeholder} 
          value={isBase64 ? '' : value} 
          disabled={!!isBase64}
          onChange={e => onChange(e.target.value)} 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-brand-gold-500 outline-none placeholder:text-slate-400 disabled:opacity-50" 
        />
        {isBase64 && (
          <p className="text-[10px] text-brand-gold-600 mt-1 font-semibold">Using uploaded file. Clear image to paste a custom URL.</p>
        )}
      </div>
    </div>
  );
};

export default function CatererDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [partnerOrders, setPartnerOrders] = useState<any[]>([]);
  const [caterer, setCaterer] = useState<any>(null);
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyData, setModifyData] = useState<any>({ price: 0, package: '', guests: 0, notes: '' });

  // Order Management Extra States
  const [showChangesRequestModal, setShowChangesRequestModal] = useState(false);
  const [changesRequestText, setChangesRequestText] = useState('');
  const [internalNotesText, setInternalNotesText] = useState('');

  // Menu Builder State
  const [draftPackages, setDraftPackages] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Profile Edit State
  const [profileFormData, setProfileFormData] = useState<any>({});
  const [isProfilePending, setIsProfilePending] = useState(false);

  const catererDashboardId = localStorage.getItem('catererDashboardId');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    // Fetch Caterer Details
    let cid = catererDashboardId;
    if (!cid && user) cid = user.id;
    if (!cid) return;

    // Fetch from Supabase
    const supabase = getSupabase() as any;
    let fetchedCaterer: any = null;
    if (supabase) {
      try {
        console.log("Fetching live caterer profile from Supabase for ID:", cid);
        const { data, error } = await (supabase
          .from('caterer_registrations') as any)
          .select('*')
          .eq('id', cid)
          .maybeSingle();

        if (!error && data) {
          const cat = data as any;
          fetchedCaterer = cat;
          setCaterer(cat);
          setDraftPackages(cat.draftMenuPackages || cat.menuPackages || cat.packages || []);
          setProfileFormData({
              ownerName: cat.owner || cat.ownerName || '',
              businessName: cat.businessName || '',
              mobile: cat.phone || '',
              alternateMobile: cat.alternatePhone || '',
              email: cat.email || '',
              location: cat.address || cat.location || '',
              city: cat.city || '',
              description: cat.description || '',
              fssai: cat.fssaiNumber || cat.fssai || '',
              gst: cat.gstNumber || cat.gst || '',
              pan: cat.panNumber || cat.pan || '',
              logo: cat.logo || '',
              coverBanner: cat.coverBanner || '',
              ownerPhoto: cat.ownerPhoto || cat.founderImageUrl || '',
              branchPhoto: cat.branchPhoto || ''
          });
          setIsProfilePending(!!cat.pendingUpdates);
          
          // Sync local storage registrations
          const registrationsLocal = JSON.parse(localStorage.getItem('registrations') || '[]');
          const filtered = registrationsLocal.filter((r: any) => r.id !== cid);
          localStorage.setItem('registrations', JSON.stringify([...filtered, cat]));
        }
      } catch (err) {
        console.error("Error reading live profile from Supabase:", err);
      }
    }

    if (!fetchedCaterer) {
        const rawRegistrations = localStorage.getItem('registrations');
        if (rawRegistrations) {
            const all = JSON.parse(rawRegistrations);
            const found = all.find((c: any) => c.id === cid);
            if (found) {
               setCaterer(found);
               setDraftPackages(found.draftMenuPackages || found.menuPackages || found.packages || []);
               setProfileFormData({
                   ownerName: found.owner || found.ownerName || '',
                   businessName: found.businessName || '',
                   mobile: found.phone || '',
                   alternateMobile: found.alternatePhone || '',
                   email: found.email || '',
                   location: found.address || found.location || '',
                   city: found.city || '',
                   description: found.description || '',
                   fssai: found.fssaiNumber || found.fssai || '',
                   gst: found.gstNumber || found.gst || '',
                   pan: found.panNumber || found.pan || '',
                   logo: found.logo || '',
                   coverBanner: found.coverBanner || '',
                   ownerPhoto: found.ownerPhoto || found.founderImageUrl || '',
                   branchPhoto: found.branchPhoto || ''
               });
               setIsProfilePending(!!found.pendingUpdates);
            }
        }
    }

    // Fetch Orders from Supabase first
    if (supabase) {
      try {
        console.log("Fetching live orders from Supabase for caterer ID:", cid);
        const { data: ords, error: ordsErr } = await supabase
          .from('orders')
          .select('*')
          .eq('catererId', cid)
          .order('created_at', { ascending: false });

        if (!ordsErr && ords) {
          setPartnerOrders(ords);
          // Sync local storage orders
          const rawOrders = localStorage.getItem('orders') || '[]';
          const allLocalOrders = JSON.parse(rawOrders).filter((o: any) => o.catererId !== cid);
          localStorage.setItem('orders', JSON.stringify([...allLocalOrders, ...ords]));
          return;
        }
      } catch (err) {
        console.error("Error reading live orders from Supabase:", err);
      }
    }

    // Check localStorage fallback for orders
    const rawOrders = localStorage.getItem('orders');
    if (rawOrders) {
        const allOrders = JSON.parse(rawOrders);
        const myOrders = allOrders.filter((o: any) => o.catererId === cid);
        // sort by newest
        myOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPartnerOrders(myOrders);
    }
  };

  const handleOpenOrderDetails = (ord: any) => {
    setSelectedOrder(ord);
    setInternalNotesText(ord.internalNotes || ord.internal_notes || '');
  };

  const handleSaveInternalNotes = (orderId: string) => {
    const rawOrders = localStorage.getItem('orders');
    if (rawOrders) {
      const allOrders = JSON.parse(rawOrders);
      const updated = allOrders.map((o: any) => {
        if (o.id === orderId) {
          return {
            ...o,
            internalNotes: internalNotesText,
            internal_notes: internalNotesText
          };
        }
        return o;
      });
      localStorage.setItem('orders', JSON.stringify(updated));
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, internalNotes: internalNotesText, internal_notes: internalNotesText });
      }
      refreshData();
      toast("Internal notes updated successfully", "success");
    }
  };

  const handleRequestChanges = () => {
    if (!changesRequestText.trim()) {
      toast("Please specify what changes or details you are requesting.", "error");
      return;
    }
    performOrderStatusUpdate(
      selectedOrder.id, 
      'changes_requested', 
      { 
        changesRequestedMemo: changesRequestText,
        specialNotes: changesRequestText 
      }, 
      user?.email || 'partner@caternest.com', 
      'partner'
    );
    
    storeNotification(
      selectedOrder.id,
      "Details Requested",
      `The caterer has requested updates for your order #${selectedOrder.id}: ${changesRequestText}`,
      "customer",
      caterer?.id
    );

    setShowChangesRequestModal(false);
    setSelectedOrder(null);
    setChangesRequestText('');
    refreshData();
    toast("Requested changes successfully", "success");
  };

  const handleApprove = (id: string) => {
    performOrderStatusUpdate(id, 'approved', {}, user?.email || 'partner@caternest.com', 'partner');
    
    const ord = partnerOrders.find(o => o.id === id);
    storeNotification(
      id,
      "Order Approved! 🎉",
      `Your booking query for ${ord?.eventDate || 'selected date'} has been approved by the caterer.`,
      "customer",
      caterer?.id
    );
    
    storeNotification(
      id,
      "Order Approved",
      `Order #${id} has been approved by ${caterer?.businessName || 'Caterer'}.`,
      "admin"
    );

    refreshData();
    setSelectedOrder(null);
    toast("Order approved successfully", "success");
  };

  const handleReject = () => {
    if(!rejectReason.trim()) {
      toast("Please provide a rejection reason.", "error");
      return;
    }
    performOrderStatusUpdate(
      selectedOrder.id, 
      'rejected', 
      { rejectionReason: rejectReason }, 
      user?.email || 'partner@caternest.com', 
      'partner'
    );
    
    storeNotification(
      selectedOrder.id,
      "Order Rejected",
      `Your booking request was declined. Reason: ${rejectReason}`,
      "customer",
      caterer?.id
    );
    
    setShowRejectModal(false);
    setSelectedOrder(null);
    setRejectReason('');
    refreshData();
    toast("Order rejected successfully", "success");
  };

  const handleModify = () => {
    performOrderStatusUpdate(
      selectedOrder.id, 
      'changes_requested', 
      {
        pricePerPlate: modifyData.price,
        guests: modifyData.guests,
        specialNotes: modifyData.notes,
        totalEstimate: modifyData.price * modifyData.guests + (selectedOrder.platformFee || 0)
      }, 
      user?.email || 'partner@caternest.com', 
      'partner'
    );
    
    storeNotification(
      selectedOrder.id,
      "Quote Proposal Adjusted",
      `The caterer has sent an adjusted quotation of ₹${(modifyData.price * modifyData.guests + (selectedOrder.platformFee || 0)).toLocaleString()}`,
      "customer",
      caterer?.id
    );

    setShowModifyModal(false);
    setSelectedOrder(null);
    refreshData();
    toast("Adjusted quotation sent to customer", "success");
  };

  const openModifyModal = (ord: any) => {
    setSelectedOrder(ord);
    setModifyData({
      price: ord.pricePerPlate,
      package: ord.packageDetails?.packageName || 'Custom',
      guests: ord.guests,
      notes: ord.specialNotes || ''
    });
    setShowModifyModal(true);
  };

  // Notification tab state hooks and triggers
  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  
  const reloadNotifications = () => {
    const raw = localStorage.getItem('notifications') || '[]';
    try {
      const parsed = JSON.parse(raw);
      const filtered = parsed.filter((n: any) => 
        n.targetRole === 'caterer' && 
        (!n.catererId || n.catererId === caterer?.id || n.catererId === user?.id)
      );
      setLocalNotifications(filtered);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications' || caterer) {
      reloadNotifications();
    }
  }, [activeTab, caterer]);

  const handleMarkNotificationRead = (id: string) => {
    const raw = localStorage.getItem('notifications') || '[]';
    try {
      const parsed = JSON.parse(raw);
      const updated = parsed.map((n: any) => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('notifications', JSON.stringify(updated));
      reloadNotifications();
      toast("Notification marked read", "success");
    } catch(err) {
      console.error(err);
    }
  };

  const handleClearAllNotifications = () => {
    const raw = localStorage.getItem('notifications') || '[]';
    try {
      const parsed = JSON.parse(raw);
      const remaining = parsed.filter((n: any) => 
        !(n.targetRole === 'caterer' && (!n.catererId || n.catererId === caterer?.id || n.catererId === user?.id))
      );
      localStorage.setItem('notifications', JSON.stringify(remaining));
      reloadNotifications();
      toast("Notifications cleared", "success");
    } catch(err) {
      console.error(err);
    }
  };

  const handleSaveDraft = async () => {
      let cid = catererDashboardId;
      if (!cid && user) cid = user.id;
      if (!cid || !caterer) return;

      const supabase = getSupabase() as any;
      if (supabase) {
        try {
          const { error } = await supabase
            .from('caterer_registrations')
            .update({ draftMenuPackages: draftPackages })
            .eq('id', caterer.id);
          if (error) throw error;
        } catch (err: any) {
          console.error("Failed to save draft to Supabase:", err);
        }
      }

      const rawRegistrations = localStorage.getItem('registrations');
      if (rawRegistrations) {
          const all = JSON.parse(rawRegistrations);
          const updated = all.map((c: any) => c.id === caterer.id ? { ...c, draftMenuPackages: draftPackages } : c);
          try {
              localStorage.setItem('registrations', JSON.stringify(updated));
              toast('Draft saved successfully', 'success');
              refreshData();
          } catch (err) {
              console.error("Quota exceeded during save", err);
              alert("Your changes are too large for custom browser storage limits. Saved to live database but clearing local storage cache...");
              refreshData();
          }
      }
  };

  const handlePublishMenu = async () => {
      let cid = catererDashboardId;
      if (!cid && user) cid = user.id;
      if (!cid || !caterer) return;

      const supabase = getSupabase() as any;
      if (supabase) {
        try {
          const { error } = await supabase
            .from('caterer_registrations')
            .update({ 
               draftMenuPackages: draftPackages, 
               menuPackages: draftPackages,
               packages: draftPackages
            })
            .eq('id', caterer.id);
          if (error) throw error;
        } catch (err: any) {
          console.error("Failed to publish menu to Supabase:", err);
        }
      }

      const rawRegistrations = localStorage.getItem('registrations');
      if (rawRegistrations) {
          const all = JSON.parse(rawRegistrations);
          const updated = all.map((c: any) => c.id === caterer.id ? { ...c, draftMenuPackages: draftPackages, menuPackages: draftPackages, packages: draftPackages } : c);
          try {
              localStorage.setItem('registrations', JSON.stringify(updated));
              toast('Menu published successfully! Customers can now see these changes.', 'success');
              refreshData();
          } catch (err) {
              console.error("Quota exceeded during publish", err);
              alert("Your menu was successfully published to the live database! Cache cleared locally.");
              refreshData();
          }
      }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      let cid = catererDashboardId;
      if (!cid && user) cid = user.id;
      if (!cid || !caterer) return;

      const supabase = getSupabase() as any;
      if (supabase) {
        try {
          const { error } = await supabase
            .from('caterer_registrations')
            .update({ pendingUpdates: profileFormData })
            .eq('id', caterer.id);
          if (error) throw error;
        } catch (err: any) {
          console.error("Failed to submit profile updates to Supabase:", err);
        }
      }

      const rawRegistrations = localStorage.getItem('registrations');
      if (rawRegistrations) {
          const all = JSON.parse(rawRegistrations);
          const updated = all.map((c: any) => {
              if (c.id === caterer.id) {
                  return {
                      ...c,
                      pendingUpdates: { ...profileFormData }
                  };
              }
              return c;
          });
          try {
              localStorage.setItem('registrations', JSON.stringify(updated));
              toast('Profile update requested. Pending Admin Approval.', 'success');
              refreshData();
          } catch (err) {
              console.error("Quota exceeded during save", err);
              alert("The profile update request was saved on Supabase! Cache cleared locally.");
              refreshData();
          }
      }
  };

  const totalOrders = partnerOrders.length;
  const pendingOrders = partnerOrders.filter(o => {
    const s = normalizeStatus(o.status);
    return s === 'pending' || s === 'updated_by_customer';
  }).length;
  const approvedOrders = partnerOrders.filter(o => normalizeStatus(o.status) === 'approved').length;
  const modifiedOrders = partnerOrders.filter(o => normalizeStatus(o.status) === 'changes_requested').length;
  const rejectedOrders = partnerOrders.filter(o => {
    const s = normalizeStatus(o.status);
    return s === 'rejected' || s === 'cancelled';
  }).length;
  const completedOrders = partnerOrders.filter(o => normalizeStatus(o.status) === 'completed').length;
  
  // Calculate Revenue
  const revenue = partnerOrders
      .filter(o => {
        const s = normalizeStatus(o.status);
        return s === 'approved' || s === 'completed';
      })
      .reduce((acc, curr) => acc + (((Number(curr.pricePerPlate) || 0) * (Number(curr.guests) || 0)) * 0.9), 0);
  
  // This month revenue
  const thisMonthRevenue = partnerOrders
      .filter(o => {
        const s = normalizeStatus(o.status);
        const isApprovedOrCompleted = s === 'approved' || s === 'completed';
        return isApprovedOrCompleted && new Date(o.createdAt).getMonth() === new Date().getMonth();
      })
      .reduce((acc, curr) => acc + (((Number(curr.pricePerPlate) || 0) * (Number(curr.guests) || 0)) * 0.9), 0);

  const getStatusColor = (status: string) => {
    return getStatusBadgeColor(status);
  };

  const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Activity },
      { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: pendingOrders > 0 ? pendingOrders : null },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'gallery', label: 'Gallery', icon: ImageIcon },
      { id: 'packages', label: 'Menu Packages', icon: Package },
      { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="flex h-[calc(100vh-80px)]">
        
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col hidden md:flex h-full">
            <div className="p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Caterer Portal</p>
                <h2 className="text-xl font-display font-medium text-white truncate">{caterer?.businessName || 'My Business'}</h2>
                <div className="mt-2 flex items-center gap-2 text-xs text-brand-gold-400 font-medium bg-brand-gold-500/10 px-2.5 py-1 rounded-md inline-flex border border-brand-gold-500/20">
                    <CheckCircle size={12}/> Approved Partner
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto w-full px-4 space-y-1">
               {navItems.map(item => (
                   <button 
                       key={item.id}
                       onClick={() => setActiveTab(item.id)} 
                       className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-colors", activeTab === item.id ? "bg-brand-gold-500 text-slate-900" : "hover:bg-slate-800 text-slate-300")}
                   >
                       <div className="flex items-center gap-3">
                           <item.icon size={18} /> {item.label}
                       </div>
                       {item.badge && <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", activeTab === item.id ? "bg-slate-900 text-brand-gold-500" : "bg-brand-gold-500 text-slate-900")}>{item.badge}</span>}
                   </button>
               ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
            <div className="p-8">
               
               {activeTab === 'dashboard' && (
                 <>
                    <h1 className="text-3xl font-display font-bold text-slate-900 mb-8">Dashboard Overview</h1>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div><p className="text-sm font-bold text-slate-500">Total Orders</p><p className="text-2xl font-bold text-slate-900">{totalOrders}</p></div>
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Package size={20}/></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div><p className="text-sm font-bold text-slate-500">Pending Orders</p><p className="text-2xl font-bold text-amber-600">{pendingOrders}</p></div>
                            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={20}/></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div><p className="text-sm font-bold text-slate-500">Approved</p><p className="text-2xl font-bold text-green-600">{approvedOrders}</p></div>
                            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center"><CheckCircle size={20}/></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div><p className="text-sm font-bold text-slate-500">Completed</p><p className="text-2xl font-bold text-slate-800">{completedOrders}</p></div>
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><CheckCircle2 size={20}/></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div><p className="text-sm font-bold text-slate-500">Revenue</p><p className="text-2xl font-bold text-brand-gold-600">₹{(revenue/1000).toFixed(1)}k</p></div>
                            <div className="w-10 h-10 rounded-lg bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center"><Activity size={20}/></div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-8">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                            <h3 className="font-bold text-slate-900">Upcoming Events (Next 7 Days)</h3>
                            <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-brand-green-700 hover:text-brand-green-800">View All Calendar</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {partnerOrders.filter(o => ['Approved', 'Modified'].includes(o.status) && o.eventDate).slice(0, 3).map(ord => (
                                <div key={'upcoming-'+ord.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-4 hover:border-brand-green-300 transition-colors">
                                    <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center border border-slate-200 flex-shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(ord.eventDate).toLocaleDateString('en-US', {month: 'short'})}</span>
                                        <span className="text-lg font-bold text-slate-800 leading-none">{new Date(ord.eventDate).getDate()}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 truncate" title={ord.customerName}>{ord.customerName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{ord.eventType || 'Event'} • {ord.guests} Guests</p>
                                        <p className="text-[10px] font-bold text-brand-green-700 mt-1.5 uppercase tracking-wider bg-brand-green-100 inline-block px-2 py-0.5 rounded">Ordered</p>
                                    </div>
                                </div>
                            ))}
                            {partnerOrders.filter(o => ['Approved', 'Modified'].includes(o.status)).length === 0 && (
                                <div className="col-span-full py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    No upcoming events scheduled for this week.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Recent Notifications</h3>
                        </div>
                        <div className="divide-y divide-slate-100 h-64 overflow-y-auto p-2">
                           {partnerOrders.slice(0, 5).map((ord) => (
                               <div key={ord.id} className="p-4 flex gap-4 hover:bg-slate-50 rounded-lg">
                                   <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex flex-shrink-0 items-center justify-center"><Bell size={18}/></div>
                                   <div>
                                       <p className="font-bold text-slate-800 text-sm">New order received from {ord.customerName}</p>
                                       <p className="text-xs text-slate-500 mt-1">Package: {ord.packageDetails?.packageName || 'Custom'} • Guests: {ord.guests} • Date: {ord.eventDate || 'TBD'}</p>
                                       <p className="text-[10px] text-slate-400 mt-2">{new Date(ord.createdAt).toLocaleString()}</p>
                                   </div>
                               </div>
                           ))}
                           {partnerOrders.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No recent notifications.</div>}
                        </div>
                    </div>
                 </>
               )}

               {activeTab === 'orders' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                          <h2 className="text-xl font-bold text-slate-900">Order Management</h2>
                      </div>
                      
                      <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 border-b border-slate-200 z-10">
                                  <tr>
                                      <th className="px-6 py-4">Order ID</th>
                                      <th className="px-6 py-4">Date & Time</th>
                                      <th className="px-6 py-4">Customer</th>
                                      <th className="px-6 py-4">Phone</th>
                                      <th className="px-6 py-4">Package</th>
                                      <th className="px-6 py-4">Guests</th>
                                      <th className="px-6 py-4">Amount</th>
                                      <th className="px-6 py-4">Status</th>
                                      <th className="px-6 py-4 w-10">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {partnerOrders.map((ord) => (
                                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors group">
                                          <td className="px-6 py-4 font-mono font-medium text-slate-700">{ord.id}</td>
                                          <td className="px-6 py-4 text-slate-500">{new Date(ord.createdAt).toLocaleDateString()}<br/><span className="text-[10px]">{new Date(ord.createdAt).toLocaleTimeString()}</span></td>
                                          <td className="px-6 py-4 font-bold text-slate-800">{ord.customerName}</td>
                                          <td className="px-6 py-4 text-slate-500">{ord.phone || 'N/A'}</td>
                                          <td className="px-6 py-4 text-slate-600">{ord.packageDetails?.packageName || 'Custom'}</td>
                                          <td className="px-6 py-4 text-slate-600">{ord.guests}</td>
                                          <td className="px-6 py-4 font-bold text-brand-green-900">₹{ord.totalEstimate?.toLocaleString()}</td>
                                          <td className="px-6 py-4">
                                              <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", getStatusColor(ord.status))}>
                                                  {ord.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4">
                                              <button onClick={() => setSelectedOrder(ord)} className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg text-xs font-bold transition-colors">
                                                  View
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                                  {partnerOrders.length === 0 && (
                                      <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-500">No orders found.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
               )}

               {activeTab === 'payments' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                          <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
                      </div>
                      
                      <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 border-b border-slate-200 z-10">
                                  <tr>
                                      <th className="px-6 py-4">Order ID</th>
                                      <th className="px-6 py-4">Date</th>
                                      <th className="px-6 py-4">Customer</th>
                                      <th className="px-6 py-4">Gross Amount</th>
                                      <th className="px-6 py-4">Platform Fee</th>
                                      <th className="px-6 py-4 text-brand-green-900">Net Amount</th>
                                      <th className="px-6 py-4">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {partnerOrders.filter(o => ['Approved', 'Completed'].includes(o.status)).map((ord) => {
                                      const gross = (ord.pricePerPlate || 0) * (ord.guests || 0);
                                      const netAmount = gross * 0.9;
                                      return (
                                      <tr key={'pay-'+ord.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-6 py-4 font-mono font-medium text-slate-700">{ord.id}</td>
                                          <td className="px-6 py-4 text-slate-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                                          <td className="px-6 py-4 font-bold text-slate-800">{ord.customerName}</td>
                                          <td className="px-6 py-4">₹{gross.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-red-600">-₹{((gross * 0.1) + (ord.platformFee || 0)).toLocaleString()}</td>
                                          <td className="px-6 py-4 font-bold text-brand-green-900 bg-brand-green-50/30">₹{netAmount.toLocaleString()}</td>
                                          <td className="px-6 py-4">
                                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800">
                                                  Settled
                                              </span>
                                          </td>
                                      </tr>
                                      )
                                  })}
                                  {partnerOrders.filter(o => ['Approved', 'Completed'].includes(o.status)).length === 0 && (
                                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No payment history found.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
               )}

               {activeTab === 'packages' && (
                  <div className="space-y-6">
                      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <div>
                              <h2 className="text-xl font-bold text-slate-900">Menu Packages</h2>
                              <p className="text-sm text-slate-500">Edit your menu packages. Changes are saved as drafts until published.</p>
                          </div>
                          <div className="flex gap-3">
                              <button onClick={handleSaveDraft} className="px-6 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors flex items-center gap-2">
                                  <Save size={18} /> Save Draft
                              </button>
                              <button onClick={handlePublishMenu} className="px-6 py-2 bg-brand-green-900 text-white hover:bg-brand-green-800 font-bold rounded-xl transition-colors shadow-lg shadow-brand-green-900/20">
                                  Publish Changes
                              </button>
                          </div>
                      </div>
                      <CatererMenuBuilder 
                          packages={draftPackages} 
                          onChange={setDraftPackages} 
                          isParsing={isParsing} 
                          setIsParsing={setIsParsing} 
                      />
                  </div>
               )}

               {activeTab === 'profile' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                      <div className="mb-8 border-b border-slate-100 pb-4">
                          <h2 className="text-xl font-bold text-slate-900">Profile Management</h2>
                          <p className="text-sm text-slate-500">Identity changes require admin approval before becoming visible.</p>
                      </div>

                      {isProfilePending && (
                          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
                              <Clock className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                              <div>
                                  <h4 className="font-bold text-amber-900 text-sm">Update Request Pending</h4>
                                  <p className="text-amber-800 text-sm mt-1">Your recent profile changes are currently under review by our admin team. Once approved, they will be visible to customers.</p>
                              </div>
                          </div>
                      )}

                      <form onSubmit={handleProfileSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Owner Name</label>
                                  <input type="text" value={profileFormData.ownerName} onChange={(e) => setProfileFormData({...profileFormData, ownerName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none" required />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Business Name</label>
                                  <input type="text" value={profileFormData.businessName} onChange={(e) => setProfileFormData({...profileFormData, businessName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none" required />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Mobile Number</label>
                                  <input type="tel" value={profileFormData.mobile} onChange={(e) => setProfileFormData({...profileFormData, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none" required />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                                  <input type="email" value={profileFormData.email} onChange={(e) => setProfileFormData({...profileFormData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none" required />
                              </div>
                              <div className="col-span-1 md:col-span-2">
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Business Description</label>
                                  <textarea value={profileFormData.description} onChange={(e) => setProfileFormData({...profileFormData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none h-24 resize-none" placeholder="Tell customers about your catering service..." required></textarea>
                              </div>
                              <div className="col-span-1 md:col-span-2">
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Address</label>
                                  <textarea value={profileFormData.location} onChange={(e) => setProfileFormData({...profileFormData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none h-24 resize-none" required></textarea>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Base City</label>
                                  <input type="text" value={profileFormData.city} onChange={(e) => setProfileFormData({...profileFormData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none" required />
                              </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100">
                              <h3 className="font-bold text-slate-800 mb-4">Branding & Identity</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <ImageUploaderField 
                                        label="Caterer Logo Upload (500x500)"
                                        value={profileFormData.logo || ''}
                                        onChange={(val) => setProfileFormData({...profileFormData, logo: val})}
                                        placeholder="e.g. https://host.com/logo.jpg"
                                   />
                                   <ImageUploaderField 
                                        label="Cover Banner Upload (1600x600)"
                                        value={profileFormData.coverBanner || ''}
                                        onChange={(val) => setProfileFormData({...profileFormData, coverBanner: val})}
                                        placeholder="e.g. https://host.com/banner.jpg"
                                   />
                                   <ImageUploaderField 
                                        label="Founder Photo Upload (500x500)"
                                        value={profileFormData.ownerPhoto || ''}
                                        onChange={(val) => setProfileFormData({...profileFormData, ownerPhoto: val})}
                                        placeholder="e.g. https://host.com/founder.jpg"
                                   />
                                   <ImageUploaderField 
                                        label="Branch Photo Upload (Optional)"
                                        value={profileFormData.branchPhoto || ''}
                                        onChange={(val) => setProfileFormData({...profileFormData, branchPhoto: val})}
                                        placeholder="e.g. https://host.com/branch.jpg"
                                   />
                              </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100">
                              <h3 className="font-bold text-slate-800 mb-4">Legal Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">FSSAI Number</label>
                                      <input type="text" value={profileFormData.fssai} onChange={(e) => setProfileFormData({...profileFormData, fssai: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none uppercase" placeholder="14-digit number" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">GSTIN</label>
                                      <input type="text" value={profileFormData.gst} onChange={(e) => setProfileFormData({...profileFormData, gst: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none uppercase" placeholder="15-character GSTIN" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">PAN Number</label>
                                      <input type="text" value={profileFormData.pan} onChange={(e) => setProfileFormData({...profileFormData, pan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none uppercase" placeholder="10-character PAN" />
                                  </div>
                              </div>
                          </div>

                          <div className="pt-8 text-right">
                              <button type="submit" className="px-8 py-3 bg-brand-green-900 text-white font-bold rounded-xl shadow-lg hover:bg-brand-green-800 transition-colors">
                                  Submit Profile for Review
                              </button>
                          </div>
                      </form>
                  </div>
               )}

               {activeTab === 'notifications' && (
                   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
                       <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                           <div>
                               <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2"><Bell className="text-brand-gold-500" /> Notifications Inbox</h2>
                               <p className="text-sm text-slate-500 mt-1">Status changes, system updates, and incoming quotations</p>
                           </div>
                           {localNotifications.length > 0 && (
                               <button onClick={handleClearAllNotifications} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors">
                                   Clear All
                               </button>
                           )}
                       </div>

                       <div className="space-y-3">
                           {localNotifications.map((n) => (
                               <div key={n.id} className={cn("p-4 rounded-xl border transition-all flex justify-between items-start", n.read ? "bg-slate-50 border-slate-150" : "bg-brand-gold-50/20 border-brand-gold-100 shadow-sm")}>
                                   <div className="space-y-1">
                                       <div className="flex items-center gap-2">
                                           <span className={cn("w-2 h-2 rounded-full", n.read ? "bg-slate-300" : "bg-brand-gold-500")} />
                                           <h4 className="font-bold text-slate-800 text-sm">{n.title}</h4>
                                       </div>
                                       <p className="text-xs text-slate-600 pl-4">{n.message}</p>
                                       {n.orderId && <p className="text-[10px] text-slate-400 font-mono pl-4">Order ID: {n.orderId}</p>}
                                   </div>
                                   {!n.read && (
                                       <button onClick={() => handleMarkNotificationRead(n.id)} className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all">
                                           Mark Read
                                        </button>
                                   )}
                               </div>
                           ))}
                           {localNotifications.length === 0 && (
                               <div className="text-center py-12 text-slate-500">
                                   <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                       <Bell size={24} />
                                   </div>
                                   <p className="font-semibold text-slate-700">All caught up!</p>
                                   <p className="text-xs text-slate-500 mt-1">You have no new notifications.</p>
                                </div>
                            )}
                       </div>
                   </div>
               )}

               {['gallery', 'settings'].includes(activeTab) && (
                   <div className="pt-20 text-center flex flex-col items-center">
                       <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
                           <Settings size={32}/>
                       </div>
                       <h2 className="text-2xl font-bold text-slate-800 mb-2 capitalize">{activeTab} Details</h2>
                       <p className="text-slate-500 max-w-md">This section is currently under development and will allow you to manage your {activeTab} in future updates.</p>
                       <button onClick={() => setActiveTab('dashboard')} className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm">Return to Dashboard</button>
                   </div>
               )}

            </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
          {selectedOrder && !showRejectModal && !showModifyModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                  >
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <div>
                              <h3 className="font-display font-bold text-2xl text-slate-900">Order #{selectedOrder.id}</h3>
                              <p className="text-sm text-slate-500">Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                          </div>
                          <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={20}/></button>
                      </div>

                      <div className="p-6 overflow-y-auto flex-1 space-y-6">
                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Status</p>
                                   <span className={cn("px-2.5 py-1 inline-block rounded-md text-xs font-bold uppercase tracking-wider", getStatusColor(selectedOrder.status))}>{selectedOrder.status}</span>
                               </div>
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Date</p>
                                   <p className="font-bold text-slate-800">{selectedOrder.eventDate || 'N/A'}</p>
                               </div>
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Guests</p>
                                   <p className="font-bold text-slate-800">{selectedOrder.guests}</p>
                               </div>
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                   <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">Type</p>
                                   <p className="font-bold text-slate-800">{selectedOrder.eventType || 'N/A'}</p>
                               </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                   <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Customer Details</h4>
                                   <div className="space-y-2 text-sm">
                                       <p><span className="text-slate-500 w-20 inline-block font-medium">Name:</span> <span className="font-bold text-slate-700">{selectedOrder.customerName}</span></p>
                                       <p><span className="text-slate-500 w-20 inline-block font-medium">Phone:</span> <span className="text-slate-700">{selectedOrder.phone || 'N/A'}</span></p>
                                       <p><span className="text-slate-500 w-20 inline-block font-medium">Email:</span> <span className="text-slate-700">{selectedOrder.customerEmail || 'N/A'}</span></p>
                                       <p><span className="text-slate-500 w-20 inline-block font-medium flex items-start gap-1"><MapPin size={14}/> Venue:</span> <span className="text-slate-700 block mt-1">{selectedOrder.address || 'N/A'}</span></p>
                                   </div>
                               </div>

                               <div>
                                   <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Financials</h4>
                                   <div className="space-y-2 text-sm bg-green-50 p-4 rounded-xl border border-green-100">
                                       <div className="flex justify-between"><span className="text-slate-600 font-medium">Food Cost ({selectedOrder.pricePerPlate} × {selectedOrder.guests})</span> <span className="text-slate-800 font-bold">₹{((selectedOrder.pricePerPlate||0) * (selectedOrder.guests||0)).toLocaleString()}</span></div>
                                       <div className="flex justify-between"><span className="text-slate-600 font-medium">Platform Fee</span> <span className="text-slate-800 font-bold">₹{selectedOrder.platformFee || 0}</span></div>
                                       <div className="flex justify-between pt-2 border-t border-green-200/50 mt-2"><span className="text-green-800 font-bold">Customer Total</span> <span className="text-brand-green-900 font-display text-xl font-bold leading-none">₹{selectedOrder.totalEstimate?.toLocaleString()}</span></div>
                                   </div>
                               </div>
                           </div>

                           <div>
                               <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Menu & Package</h4>
                               <p className="text-sm font-bold text-slate-700 mb-1">Package: {selectedOrder.packageDetails?.packageName || 'Customized Menu'}</p>
                               <p className="text-sm font-bold text-slate-700 mb-3 hover:text-brand-gold-600 transition-colors">Matched Slab: <span className="bg-brand-gold-100 text-brand-gold-800 px-2 py-0.5 rounded ml-2">{selectedOrder.matchedSlab ? `${selectedOrder.matchedSlab.minGuests} - ${selectedOrder.matchedSlab.maxGuests || '1000+'} Guests` : 'Default Slab'}</span></p>
                               <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm list-disc pl-4 marker:text-brand-gold-500 pb-4">
                                   {selectedOrder.selectedItems?.map((item: string, i: number) => (
                                       <li key={i} className="text-slate-600">{item}</li>
                                   ))}
                               </ul>
                               {selectedOrder.specialNotes && (
                                   <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-sm text-slate-700 mt-2">
                                       <span className="font-bold text-amber-900 block mb-1">Special Notes:</span>
                                       {selectedOrder.specialNotes}
                                   </div>
                               )}

                               <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-left">
                                   <span className="font-bold text-slate-900 text-sm block mb-1.5 flex items-center gap-1.5">📝 Caterer Internal Notes (Private)</span>
                                   <textarea 
                                       value={internalNotesText}
                                       onChange={(e) => setInternalNotesText(e.target.value)}
                                       placeholder="Add private notes (e.g. staff setup instructions, chef reminders)..."
                                       className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:border-brand-gold-500 outline-none resize-none h-16 mb-2"
                                   />
                                   <button 
                                       onClick={() => handleSaveInternalNotes(selectedOrder.id)}
                                       className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                                   >
                                       Save Memo
                                   </button>
                               </div>
                           </div>
                      </div>

                      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-wrap">
                          {['pending', 'Submitted', 'Pending Caterer Review', 'updated_by_customer', 'changes_requested'].includes(normalizeStatus(selectedOrder.status)) ? (
                              <>
                                 <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-bold rounded-xl text-xs transition-colors">Reject</button>
                                 <button onClick={() => setShowChangesRequestModal(true)} className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-bold rounded-xl text-xs transition-colors">Request Changes</button>
                                 <button onClick={() => openModifyModal(selectedOrder)} className="px-4 py-2 border-2 border-brand-gold-500 text-brand-gold-700 hover:bg-brand-gold-50 font-bold rounded-xl text-xs transition-colors">Edit Quotation</button>
                                 <button onClick={() => handleApprove(selectedOrder.id)} className="px-5 py-2 bg-brand-green-900 text-white hover:bg-brand-green-800 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-brand-green-900/20">Approve Order</button>
                              </>
                          ) : (
                              <button onClick={() => setSelectedOrder(null)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 text-xs transition">Close</button>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}

          {showRejectModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                     <h3 className="text-xl font-bold text-slate-900 mb-2">Reject Order</h3>
                     <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting this order. The customer will be notified.</p>
                     <textarea 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-red-500 outline-none resize-none h-24 mb-4"
                         placeholder="e.g. Date fully booked, Out of service area..."
                         value={rejectReason}
                         onChange={(e)=>setRejectReason(e.target.value)}
                     ></textarea>
                     <div className="flex gap-3 justify-end mt-2">
                         <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                         <button onClick={handleReject} className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md shadow-red-600/20 w-32">Confirm Reject</button>
                     </div>
                 </motion.div>
              </div>
          )}

          {showModifyModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                     <h3 className="text-xl font-bold text-slate-900 mb-4">Modify Order Quote</h3>
                     
                     <div className="space-y-4 mb-6">
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Price Per Plate (₹)</label>
                             <input type="number" value={modifyData.price} onChange={(e)=>setModifyData({...modifyData, price: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Guest Count</label>
                             <input type="number" value={modifyData.guests} onChange={(e)=>setModifyData({...modifyData, guests: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Caterer Notes for Customer</label>
                             <textarea value={modifyData.notes} onChange={(e)=>setModifyData({...modifyData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg resize-none h-20 placeholder:text-slate-400" placeholder="e.g. Adjusted price for premium items requested..."></textarea>
                         </div>
                     </div>

                     <div className="bg-brand-green-50 p-3 rounded-lg flex justify-between items-center mb-6">
                         <span className="font-bold text-brand-green-900">New Estimate:</span>
                         <span className="font-display font-bold text-xl text-brand-green-900">₹{(modifyData.price * modifyData.guests + (selectedOrder?.platformFee || 0)).toLocaleString()}</span>
                     </div>
                     
                     <div className="flex gap-3 justify-end">
                         <button onClick={() => setShowModifyModal(false)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                         <button onClick={handleModify} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/20">Send Modification</button>
                     </div>
                 </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
