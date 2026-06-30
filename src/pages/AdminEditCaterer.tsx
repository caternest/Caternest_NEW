import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ShieldCheck, Key, Image as ImageIcon, FileText, ChefHat, Building2, User, UploadCloud, X, CheckCircle2 } from 'lucide-react';
import { cn, compressImageFile, safeSaveRegistrations } from '../lib/utils';
import CatererMenuBuilder from '../components/CatererMenuBuilder';
import { toast } from '../components/Toast';
import { getSupabase, uploadToSupabaseBucket } from '../lib/supabase';

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
    <div className="space-y-2">
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

export default function AdminEditCaterer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caterer, setCaterer] = useState<any>(null);
  const [menuPackages, setMenuPackages] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'menu' | 'documents' | 'gallery'>('basic');

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetData, setResetData] = useState({ username: '', password: '' });
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('registrations');
    if (raw) {
      const all = JSON.parse(raw);
      const found = all.find((c: any) => c.id === id);
      if (found) {
        // Ensure default values are populated
        if (!found.galleryPhotos) found.galleryPhotos = [];
        setCaterer(found);
        setMenuPackages(found.menuPackages || []);
      }
    }
  }, [id]);

  if (!caterer) return <div className="pt-32 text-center text-slate-500 font-medium">Loading Caterer Profile...</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCaterer({ ...caterer, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const raw = localStorage.getItem('registrations');
    if (raw) {
      const all = JSON.parse(raw);
      const updated = all.map((c: any) => c.id === id ? { ...caterer, menuPackages } : c);
      try {
        safeSaveRegistrations(updated);

        // Persist full profile updates to Supabase caterer_registrations table securely
        const supabase = getSupabase();
        if (supabase) {
          console.log("[ADMIN EDIT CATERER] Persisting updated profile parameters onto Supabase...", caterer);
          const { error: dbError } = await supabase
            .from('caterer_registrations')
            .update({
              ...caterer,
              packages: menuPackages,
              draftMenuPackages: menuPackages
            })
            .eq('id', id);

          if (dbError) {
            console.error("[ADMIN EDIT CATERER] Cloud database save warning:", dbError);
            toast(`Profile cached locally. Warning: Cloud database update failed: ${dbError.message}`, 'error');
          } else {
            console.log("[ADMIN EDIT CATERER] Profile successfully updated in database.");
          }
        }

        // If the password changed, update it securely on the auth server tier
        if (isPasswordChanged && caterer.password) {
          try {
            const res = await fetch('/api/admin/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                catererId: id,
                newPassword: caterer.password
              })
            });
            const data = await res.json();
            if (!res.ok) {
              console.error("Backend credentials auth sync failed:", data.error);
              toast(`Profile saved local. Warning: Auth server update failed: ${data.error}`, 'error');
              return;
            } else {
              console.log("Credentials synced successfully on auth tier:", data);
              setIsPasswordChanged(false);

              // Update the local storage state with the newly synchronized userId if it returned one
              if (data.userId) {
                const refreshedRaw = localStorage.getItem('registrations');
                if (refreshedRaw) {
                  const refreshedAll = JSON.parse(refreshedRaw);
                  const updatedWithUserId = refreshedAll.map((c: any) => c.id === id ? { ...c, userId: data.userId } : c);
                  safeSaveRegistrations(updatedWithUserId);
                  setCaterer((prev: any) => ({ ...prev, userId: data.userId }));
                }
              }
            }
          } catch (syncErr: any) {
            console.error("Credentials sync error:", syncErr);
            toast('Profile saved, but Auth system update postponed.', 'error');
            return;
          }
        }

        toast('Caterer profile successfully updated!', 'success');
      } catch (err) {
        console.error("Quota exceeded during save", err);
        alert("The profile data is too large to save (images may exceed your browser's local storage quota limit). Try reducing gallery photos or profile image sizes.");
      }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const fileArray: File[] = Array.from(files);

      const uploadedUrls: string[] = [];
      const localFiles: File[] = [];

      for (const file of fileArray) {
          try {
              const supabase = getSupabase();
              if (supabase) {
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
                  const publicUrl = await uploadToSupabaseBucket('gallery-images', fileName, file, file.type);
                  if (publicUrl) {
                      uploadedUrls.push(publicUrl);
                      continue;
                  }
              }
          } catch (storageErr) {
              console.warn("Storage upload failed for gallery item:", storageErr);
          }
          localFiles.push(file);
      }

      if (uploadedUrls.length > 0) {
          setCaterer((prev: any) => ({
              ...prev,
              galleryPhotos: [...(prev.galleryPhotos || []), ...uploadedUrls]
          }));
      }

      if (localFiles.length > 0) {
          const promises = localFiles.map((file: File) => {
              return compressImageFile(file, 600, 600, 0.75).catch(() => file.name);
          });

          Promise.all(promises).then(base64s => {
              setCaterer((prev: any) => ({
                  ...prev,
                  galleryPhotos: [...(prev.galleryPhotos || []), ...base64s]
              }));
          });
      }
  };

  const removeGalleryPhoto = (idx: number) => {
      setCaterer((prev: any) => ({
          ...prev,
          galleryPhotos: prev.galleryPhotos.filter((_: any, i: number) => i !== idx)
      }));
  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const supabase = getSupabase();
          if (supabase) {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
              const publicUrl = await uploadToSupabaseBucket('documents', fileName, file, file.type);
              if (publicUrl) {
                  setCaterer((prev: any) => ({ ...prev, [field]: publicUrl }));
                  return;
              }
          }
      } catch (storageErr) {
          console.warn("Document scan upload failed:", storageErr);
      }

      setCaterer((prev: any) => ({ ...prev, [field]: file.name }));
  };

  const openPasswordReset = () => {
     setResetData({ username: caterer.username || '', password: '' });
     setIsResetOpen(true);
  };

  const handlePasswordReset = () => {
     if (resetData.password && resetData.password.length < 6) {
         alert('Password must be at least 6 characters.');
         return;
     }
     setCaterer((prev: any) => ({ 
         ...prev, 
         username: resetData.username || prev.username,
         password: resetData.password || prev.password
     }));
     if (resetData.password) {
         setIsPasswordChanged(true);
     }
     setIsResetOpen(false);
     toast('Credentials updated in editor. Click Save All Changes to confirm.', 'success');
  };

  const TABS = [
      { id: 'basic', label: 'Basic Details', icon: User },
      { id: 'business', label: 'Business Details', icon: Building2 },
      { id: 'menu', label: 'Menu Management', icon: ChefHat },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'gallery', label: 'Branding & Gallery', icon: ImageIcon },
  ];

  return (
    <div className="pt-24 pb-12 min-h-screen bg-slate-50 font-poppins">
      <div className="max-w-7xl mx-auto px-4">
        <button onClick={() => navigate('/admin-dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-semibold">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
                <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight flex items-center gap-3">
                    Edit Profile: <span className="text-brand-green-700">{caterer.businessName}</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">Super Admin Control Panel</p>
            </div>
            <div className="flex gap-3">
                <button onClick={handleSave} className="bg-brand-green-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-brand-green-800 flex items-center gap-2 shadow-lg shadow-brand-green-900/20">
                  <Save size={18} /> Save All Changes
                </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row min-h-[600px]">
              {/* Sidebar Navigation */}
              <div className="w-full lg:w-64 bg-slate-50 border-r border-slate-100 p-4 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto">
                  {TABS.map(tab => (
                      <button 
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap", activeTab === tab.id ? "bg-white text-brand-green-800 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-100")}
                      >
                          <tab.icon size={18} className={activeTab === tab.id ? "text-brand-green-600" : "text-slate-400"} />
                          {tab.label}
                      </button>
                  ))}
              </div>

               {/* Main Content Area */}
              <div className="flex-1 p-6 lg:p-8">
                  {activeTab === 'basic' && (
                      <div className="space-y-8 max-w-3xl animate-in fade-in duration-300">
                          <div>
                              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Account Ownership</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Owner Name</label>
                                      <input name="owner" value={caterer.owner || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Primary Email</label>
                                      <input name="email" value={caterer.email || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Mobile Number</label>
                                      <input name="phone" value={caterer.phone || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Alternate Mobile</label>
                                      <input name="alternatePhone" value={caterer.alternatePhone || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">WhatsApp Mobile Connection</label>
                                      <input name="whatsappNumber" value={caterer.whatsappNumber || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Login Credentials</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
                                      <input name="username" value={caterer.username || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Current Password</label>
                                      <div className="flex items-center gap-3">
                                          <input type="text" readOnly value={"••••••••"} className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl px-4 py-2.5 outline-none cursor-not-allowed" />
                                          <button onClick={openPasswordReset} className="flex-shrink-0 px-4 py-2.5 bg-red-50 text-red-700 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition flex items-center gap-2">
                                              <Key size={16} /> Reset
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Location</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div className="md:col-span-2">
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Address</label>
                                      <textarea name="location" value={caterer.location || ''} onChange={handleChange} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-bold text-slate-700 mb-1.5">City</label>
                                      <input name="city" value={caterer.city || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'business' && (
                      <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Business Name</label>
                                  <input name="businessName" value={caterer.businessName || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Brand Display Name</label>
                                  <input name="brandName" value={caterer.brandName || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Brand Tagline</label>
                                  <input name="tagline" value={caterer.tagline || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Business Description</label>
                                  <textarea name="description" value={caterer.description || ''} onChange={handleChange} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Years of Experience</label>
                                  <input name="experience" type="number" value={caterer.experience || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Events Completed</label>
                                  <input name="eventsCompleted" type="number" value={caterer.eventsCompleted || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Established Year</label>
                                  <input name="establishedYear" type="number" value={caterer.establishedYear || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Number of Branches</label>
                                  <input name="branches" type="number" value={caterer.branches || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Operating Hours</label>
                                  <input name="operatingHours" value={caterer.operatingHours || ''} onChange={handleChange} placeholder="e.g. 6:00 AM - 11:00 PM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div className="md:col-span-2 flex flex-col gap-3">
                                  <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition hover:bg-slate-100">
                                      <input
                                          type="checkbox"
                                          checked={!!caterer.serveEntireHyderabad}
                                          onChange={(e) => {
                                              setCaterer(prev => ({
                                                  ...prev,
                                                  serveEntireHyderabad: e.target.checked
                                              }));
                                          }}
                                          className="w-4 h-4 text-[#0F3D2E] focus:ring-[#0F3D2E] border-gray-300 rounded cursor-pointer accent-[#0F3D2E]"
                                      />
                                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                          Serve Entire Hyderabad
                                      </span>
                                  </label>

                                  {!caterer.serveEntireHyderabad && (
                                      <div>
                                          <label className="block text-sm font-bold text-slate-700 mb-1.5">Service Areas (comma separated)</label>
                                          <input name="serviceAreas" value={caterer.serviceAreas || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                                      </div>
                                  )}
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Awards (Optional)</label>
                                  <input name="awards" value={caterer.awards || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Certifications (Optional)</label>
                                  <input name="certifications" value={caterer.certifications || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-brand-green-500" />
                              </div>
                          </div>
                      </div>
                  )}

                  {activeTab === 'menu' && (
                      <div className="animate-in fade-in duration-300">
                          <CatererMenuBuilder packages={menuPackages} onChange={setMenuPackages} isParsing={isParsing} setIsParsing={setIsParsing} />
                      </div>
                  )}

                  {activeTab === 'documents' && (
                      <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
                          <p className="text-sm text-slate-600 bg-blue-50 p-4 rounded-xl border border-blue-100 font-medium">As Admin, you can view and replace the uploaded verification documents for this caterer.</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {['aadhaarFile', 'panFile', 'fssaiFile', 'gstFile'].map((docField) => (
                                  <div key={docField} className="border border-slate-200 bg-slate-50 p-6 rounded-2xl relative">
                                      <h4 className="font-bold text-slate-800 mb-1 capitalize text-base">{docField.replace('File', '')} Document</h4>
                                      <div className="mt-4 flex items-center justify-between">
                                          {caterer[docField] ? (
                                              <div className="flex items-center gap-2">
                                                  <CheckCircle2 size={18} className="text-brand-green-600" />
                                                  <span className="text-sm font-bold text-slate-700 truncate max-w-[150px]" title={caterer[docField]}>{caterer[docField]}</span>
                                              </div>
                                          ) : (
                                              <span className="text-sm text-slate-400 font-medium italic">Not uploaded</span>
                                          )}
                                          <label className="cursor-pointer text-xs font-bold text-brand-green-700 hover:text-brand-green-900 bg-brand-green-50 px-3 py-1.5 rounded-lg border border-brand-green-100 transition-colors">
                                              Replace
                                              <input type="file" className="hidden" onChange={e => handleDocumentChange(e, docField)} />
                                          </label>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {activeTab === 'gallery' && (
                      <div className="animate-in fade-in duration-300 max-w-4xl space-y-10">
                          
                          <div>
                              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">Profile Branding</h3>
                              <p className="text-sm text-slate-600 font-medium mb-6">Manage logo, cover banner, and founder image uploads.</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                   <ImageUploaderField 
                                        label="Caterer Logo Upload (500x500)"
                                        value={caterer.logo || ''}
                                        onChange={(val) => setCaterer({...caterer, logo: val})}
                                        placeholder="e.g. https://host.com/logo.jpg"
                                   />
                                   <ImageUploaderField 
                                        label="Cover Banner Upload (1600x600)"
                                        value={caterer.coverBanner || ''}
                                        onChange={(val) => setCaterer({...caterer, coverBanner: val})}
                                        placeholder="e.g. https://host.com/banner.jpg"
                                   />
                                   <ImageUploaderField 
                                        label="Founder Photo Upload (500x500)"
                                        value={caterer.ownerPhoto || ''}
                                        onChange={(val) => setCaterer({...caterer, ownerPhoto: val})}
                                        placeholder="e.g. https://host.com/founder.jpg"
                                   />
                                   <ImageUploaderField 
                                        label="Branch Photo Upload (Optional)"
                                        value={caterer.branchPhoto || ''}
                                        onChange={(val) => setCaterer({...caterer, branchPhoto: val})}
                                        placeholder="e.g. https://host.com/branch.jpg"
                                   />
                              </div>
                          </div>

                          <div>
                              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Gallery Upload</h3>
                              <div className="flex justify-between items-center mb-6">
                                  <p className="text-sm text-slate-600 font-medium font-poppins">Manage portfolio images visible to customers.</p>
                                  <label className="cursor-pointer font-bold text-sm bg-brand-green-900 text-white px-5 py-2.5 rounded-xl hover:bg-brand-green-800 flex items-center gap-2 shadow-sm transition-colors">
                                     <UploadCloud size={16} /> Upload New Images
                                     <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                                  </label>
                              </div>
                              
                              {(!caterer.galleryPhotos || caterer.galleryPhotos.length === 0) ? (
                                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                                      <ImageIcon size={48} className="text-slate-300 mb-4" />
                                      <p className="text-slate-500 font-medium text-lg mb-1">No images uploaded yet</p>
                                      <p className="text-sm text-slate-400">Click upload to add some portfolio pictures.</p>
                                  </div>
                              ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                      {caterer.galleryPhotos.map((photo: string, i: number) => {
                                          const isImage = photo.startsWith('data:image/') || photo.startsWith('http://') || photo.startsWith('https://');
                                          return (
                                              <div key={i} className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                                  {isImage ? (
                                                      <img src={photo} alt={`Gallery ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                  ) : (
                                                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 p-4 text-center break-all font-medium text-xs">
                                                          {photo}
                                                      </div>
                                                  )}
                                                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/65 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                      <button onClick={() => removeGalleryPhoto(i)} className="p-3 bg-white text-red-600 rounded-full hover:scale-110 shadow-lg transition-transform" title="Remove Photo">
                                                          <X size={20} />
                                                      </button>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}

              </div>
          </div>
        </div>
      </div>
      
      {/* Password Reset Modal */}
      {isResetOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                  <h3 className="text-xl font-bold font-display text-slate-800 mb-6 flex items-center gap-2"><Key size={20} className="text-brand-green-600"/> Reset Login Credentials</h3>
                  <div className="space-y-4 mb-8">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">New Username</label>
                          <input required value={resetData.username} onChange={e => setResetData({...resetData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-green-500" placeholder="Username" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
                          <input type="text" value={resetData.password} onChange={e => setResetData({...resetData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-green-500" placeholder="Leave empty to keep current" />
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setIsResetOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                      <button onClick={handlePasswordReset} className="flex-1 px-4 py-3 bg-brand-green-900 text-white font-bold rounded-xl hover:bg-brand-green-800 transition">Save Credentials</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
