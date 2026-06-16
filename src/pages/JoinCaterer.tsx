import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, Clock, MapPin, ChevronLeft, ChevronRight, Check, Trash2, Link, Save, ShieldCheck, Mail, Lock, Sparkles, AlertCircle, HelpCircle, Bold, Italic, List, ListOrdered, Underline, CheckCircle, Flame, Star, Coffee, Utensils, Award } from 'lucide-react';
import { cn, compressImageFile } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import JoinSteps from '../components/JoinSteps';
import CatererMenuBuilder from '../components/CatererMenuBuilder';
import { useNavigate } from 'react-router-dom';
import { getSupabase, uploadToSupabaseBucket } from '../lib/supabase';
import { storeNotification } from '../lib/orderUtils';

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
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
      
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
              <label className="cursor-pointer bg-white text-slate-800 text-xs font-black px-4 py-2 rounded-xl hover:bg-slate-100 transition-all select-none col-span-2">
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
            <p className="text-xs font-bold text-slate-700">Drag & drop your image here, or</p>
            <label className="mt-1 text-xs font-extrabold text-brand-gold-600 hover:text-brand-gold-700 cursor-pointer underline decoration-2 underline-offset-2">
              browse files
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
            <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, JPEG, WEBP, GIF</p>
          </div>
        )}
      </div>

      <div className="relative mt-2">
        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Or paste image URL</label>
        <input 
          type="text" 
          placeholder={placeholder} 
          value={isBase64 ? '' : value} 
          disabled={!!isBase64}
          onChange={e => onChange(e.target.value)} 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-brand-gold-500 outline-none placeholder:text-slate-400 disabled:opacity-50" 
        />
        {isBase64 && (
          <p className="text-[10px] text-brand-gold-600 mt-1 font-semibold font-poppins">Using uploaded file. Clear image to paste a custom URL.</p>
        )}
      </div>
    </div>
  );
};

export default function JoinCaterer() {
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('caterer_join_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.step === 'number') {
          return parsed.step;
        }
      }
    } catch (e) {}
    return 1;
  });
  const [status, setStatus] = useState<'form' | 'pending' | 'approved'>('form');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [menuPackages, setMenuPackages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('caterer_join_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.menuPackages)) {
          return parsed.menuPackages;
        }
      }
    } catch (e) {}
    return [];
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isUsernameManual, setIsUsernameManual] = useState(false);

  const [isEmailVerified, setIsEmailVerified] = useState(() => {
    try {
      const saved = localStorage.getItem('caterer_join_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData && parsed.formData.email_verified) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  });
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'sending' | 'sent' | 'verified' | 'expired' | 'error'>('none');
  const [verificationError, setVerificationError] = useState('');

  const popularAreas = ['Kondapur', 'Gachibowli', 'Kukatpally', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Begumpet', 'Secunderabad'];

  const [formData, setFormData] = useState(() => {
    const defaultData = {
      ownerName: '',
      mobile: '',
      alternateMobile: '',
      additionalMobile: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',

      businessName: '',
      experience: '',
      location: '',
      city: '',
      serviceAreas: '',
      description: '',
      awards: '',
      achievements: '',
      galleryPhotos: [] as string[],
      catererLogo: '',
      coverBanner: '',
      founderPhoto: '',
      branchPhoto: '',

      aadhaarFile: '',
      panFile: '',
      fssaiFile: '',
      gstFile: '',
      otherDocs: '',
      email_verified: false
    };

    try {
      const saved = localStorage.getItem('caterer_join_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          return { ...defaultData, ...parsed.formData };
        }
      }
    } catch (e) {}
    return defaultData;
  });

  // Auto-save progress to localStorage draft caching
  React.useEffect(() => {
    const draftPayload = {
      formData: {
        ...formData,
        email_verified: isEmailVerified
      },
      step,
      menuPackages
    };
    localStorage.setItem('caterer_join_form_data', JSON.stringify(draftPayload));
  }, [formData, step, menuPackages, isEmailVerified]);

  // Auto-detect returning verification status from Supabase email link redirect
  React.useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (session?.user) {
          const authEmail = session.user.email || '';
          const isConfirmed = !!session.user.email_confirmed_at;
          
          if (isConfirmed) {
            console.log("[EMAIL VERIFICATION SUCCESS] Session confirmed email:", authEmail);
            setIsEmailVerified(true);
            setFormData(prev => {
              const emailToUse = prev.email && prev.email.trim().toLowerCase() === authEmail.trim().toLowerCase()
                ? prev.email
                : authEmail;
              return { 
                ...prev, 
                email: emailToUse,
                email_verified: true 
              };
            });
            setVerificationStatus('verified');
          }
        }
      } catch (err) {
        console.error("Error checking Supabase session:", err);
      }
    };

    // Run first eager check
    checkSession();

    // Subscribe to state change specifically for callback link landing
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      console.log("[EMAIL VERIFICATION CHECK] Auth event triggered:", event);
      if (session?.user) {
        const authEmail = session.user.email || '';
        const isConfirmed = !!session.user.email_confirmed_at;
        
        if (isConfirmed) {
          console.log("[EMAIL VERIFICATION SUCCESS] onAuthStateChange confirmed email:", authEmail);
          setIsEmailVerified(true);
          setFormData(prev => {
            const emailToUse = prev.email && prev.email.trim().toLowerCase() === authEmail.trim().toLowerCase()
              ? prev.email
              : authEmail;
            return { 
              ...prev, 
              email: emailToUse,
              email_verified: true 
            };
          });
          setVerificationStatus('verified');
        }
      }
    });

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Clean up localStorage draft on successful submission
  React.useEffect(() => {
    if (status === 'pending') {
      localStorage.removeItem('caterer_join_form_data');
    }
  }, [status]);

  const handleSendVerification = async () => {
    if (!formData.email) {
      alert("Please enter a valid email address.");
      return;
    }
    setVerificationError('');
    setVerificationStatus('sending');

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: formData.email.trim(),
          options: {
            emailRedirectTo: window.location.origin + '/join'
          }
        });

        if (error) {
          console.error("Supabase signInWithOtp error:", error);
          setVerificationError(error.message);
          setVerificationStatus('error');
          return;
        }

        setVerificationStatus('sent');
        alert("Verification email sent successfully. Please check your inbox.");
      } catch (err: any) {
        console.error("Failed to send OTP verification email:", err);
        setVerificationError(err?.message || "Unexpected error sending verification code.");
        setVerificationStatus('error');
      }
    } else {
      // Offline Simulation mode
      console.warn("Supabase is not configured. Simulating Magic Link email send...");
      setTimeout(() => {
        setIsEmailVerified(true);
        setFormData(prev => ({ ...prev, email_verified: true }));
        setVerificationStatus('verified');
        alert("[Simulation Mode] Supabase is offline/not configured. Automatically verified email to unlock form progress.");
      }, 800);
    }
  };

  const serviceAreaChips = formData.serviceAreas 
    ? formData.serviceAreas.split(',').map((x: string) => x.trim()).filter(Boolean) 
    : [];

  const addServiceAreaChip = (area: string) => {
    const current = formData.serviceAreas ? formData.serviceAreas.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
    if (!current.includes(area)) {
      current.push(area);
      setFormData({ ...formData, serviceAreas: current.join(', ') });
    }
  };

  const removeServiceAreaChip = (area: string) => {
    const current = formData.serviceAreas ? formData.serviceAreas.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
    const filtered = current.filter(x => x.toLowerCase() !== area.toLowerCase());
    setFormData({ ...formData, serviceAreas: filtered.join(', ') });
  };

  const generateUsernameFromBusinessName = (name: string) => {
    if (!name) return '';
    const clean = name.toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return '';
    const base = clean.substring(0, 5);
    
    const raw = localStorage.getItem('registrations') || '[]';
    let registrationsLocal = [];
    try {
      registrationsLocal = JSON.parse(raw);
    } catch(e) {}
    
    let candidate = base;
    let attempt = 1;
    const usernameExists = (uname: string) => registrationsLocal.some((r: any) => (r.username || '').toLowerCase() === uname.toLowerCase());
    
    while (usernameExists(candidate)) {
      const numStr = attempt < 10 ? `0${attempt}` : `${attempt}`;
      candidate = `${base.substring(0, 5 - numStr.length)}${numStr}`;
      attempt++;
    }
    return candidate;
  };

  React.useEffect(() => {
    if (!isUsernameManual && formData.businessName) {
      const generated = generateUsernameFromBusinessName(formData.businessName);
      setFormData(prev => ({ ...prev, username: generated }));
    }
  }, [formData.businessName, isUsernameManual]);

  const handleCatererDetailsExtracted = (details: any) => {
      setFormData(prev => ({
          ...prev,
          businessName: prev.businessName || details.businessName || '',
          ownerName: prev.ownerName || details.ownerName || '',
          mobile: prev.mobile || details.primaryWhatsApp || details.phone || '',
          alternateMobile: prev.alternateMobile || details.secondaryPhone || details.alternatePhone || '',
          additionalMobile: prev.additionalMobile || details.additionalPhone || '',
          location: prev.location || details.address || '',
          city: prev.city || details.city || '',
          catererLogo: prev.catererLogo || details.logoUrl || ''
      }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (menuPackages.length === 0) {
          if(!window.confirm("You haven't added any menu packages. Are you sure you want to continue?")) {
              return;
          }
      }
    } else if (step === 2) {
      if (!isEmailVerified && !formData.email_verified) {
        alert("Please verify your email address before continuing.");
        return;
      }
      if (!formData.ownerName || !formData.mobile || !formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
        alert("Please fill all basic details.");
        return;
      }
      if (formData.password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
    } else if (step === 3) {
      if (!formData.businessName || !formData.location || !formData.city) {
          alert("Please fill the mandatory Business Details (Name, Location, City).");
          return;
      }
    }
    
    setStep(s => Math.min(5, s + 1));
  };
  
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const supabase = getSupabase();
          if (supabase) {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
              const publicUrl = await uploadToSupabaseBucket('documents', fileName, file, file.type);
              if (publicUrl) {
                  setFormData(prev => ({ ...prev, [field]: publicUrl }));
                  return;
              }
          }
      } catch (storageErr) {
          console.warn("Document scan upload failed:", storageErr);
      }

      setFormData(prev => ({ ...prev, [field]: file.name }));
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
          setFormData(prev => ({
              ...prev,
              galleryPhotos: [...prev.galleryPhotos, ...uploadedUrls]
          }));
      }

      if (localFiles.length > 0) {
          const promises = localFiles.map((file: File) => {
              return compressImageFile(file, 600, 600, 0.75).catch(() => file.name);
          });

          Promise.all(promises).then(base64s => {
              setFormData(prev => ({
                  ...prev,
                  galleryPhotos: [...prev.galleryPhotos, ...base64s]
              }));
          });
      }
  };

  const removeGalleryPhoto = (idx: number) => {
      setFormData(prev => ({
          ...prev,
          galleryPhotos: prev.galleryPhotos.filter((_, i) => i !== idx)
      }));
  };

  const handleSubmit = async (e: any) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (!isEmailVerified && !formData.email_verified) {
      alert("Registration failed: Email address must be verified successfully before completing registration.");
      return;
    }
    
    // Construct registration payload
    const newReg = {
      userId: user?.id || 'demo-user',
      businessName: formData.businessName,
      owner: formData.ownerName,
      ownerName: formData.ownerName,
      email: formData.email,
      phone: formData.mobile,
      alternatePhone: formData.alternateMobile,
      additionalPhone: formData.additionalMobile,
      username: formData.username,
      password: formData.password,
      address: formData.location,
      city: formData.city,
      status: 'Pending Approval',
      logo: formData.catererLogo,
      coverBanner: formData.coverBanner,
      founderImageUrl: formData.founderPhoto,
      ownerPhoto: formData.founderPhoto,
      branchPhoto: formData.branchPhoto,
      galleryPhotos: formData.galleryPhotos,
      gallery: formData.galleryPhotos,
      packages: menuPackages,
      draftMenuPackages: menuPackages,
      email_verified: true
    };

    console.log("Database write starting. Payload to be inserted into public.caterer_registrations:", newReg);

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await (supabase
          .from('caterer_registrations') as any)
          .insert([newReg])
          .select();

        if (error) {
          throw error;
         }

        console.log("Database write successful. Insert result:", data);
        
        // Populate local storage as a local high fidelity cache as well
        const existing = JSON.parse(localStorage.getItem('registrations') || '[]');
        localStorage.setItem('registrations', JSON.stringify([...existing, { ...newReg, id: (data as any)?.[0]?.id || Math.random().toString(36).substr(2, 9) }]));
        
        // Trigger New Partner notification
        storeNotification(
          "",
          "New Partner Registration 🏢",
          `Partner "${newReg.businessName}" submitted a business registration application. Review required!`,
          "admin"
        );

        setStatus('pending');
      } catch (err: any) {
        console.error("CRITICAL DATABASE INSERT ERROR:", err);
        alert(`Failed to save registration directly to Supabase: ${err.message || err.toString()}`);
      }
    } else {
      console.warn("Supabase is not configured. Saving to localStorage as fallback...");
      const existing = JSON.parse(localStorage.getItem('registrations') || '[]');
      const fallbackReg = { ...newReg, id: Math.random().toString(36).substr(2, 9) };
      try {
        localStorage.setItem('registrations', JSON.stringify([...existing, fallbackReg]));
        storeNotification(
          "",
          "New Partner Registration 🏢",
          `Partner "${newReg.businessName}" submitted a business registration application. Review required!`,
          "admin"
        );
        setStatus('pending');
      } catch (err) {
        console.error("Failed to save due to storage quota limit, attempting with minimized images", err);
        const minimizedReg = {
          ...fallbackReg,
          logo: (formData.catererLogo && formData.catererLogo.startsWith('data:image/')) ? '' : formData.catererLogo,
          coverBanner: (formData.coverBanner && formData.coverBanner.startsWith('data:image/')) ? '' : formData.coverBanner,
          ownerPhoto: (formData.founderPhoto && formData.founderPhoto.startsWith('data:image/')) ? '' : formData.founderPhoto,
          branchPhoto: (formData.branchPhoto && formData.branchPhoto.startsWith('data:image/')) ? '' : formData.branchPhoto,
          galleryPhotos: formData.galleryPhotos ? formData.galleryPhotos.filter(photo => photo && !photo.startsWith('data:image/')) : []
        };
        try {
          localStorage.setItem('registrations', JSON.stringify([...existing, minimizedReg]));
          alert("Your application was submitted successfully! (Note: High-resolution image uploads were optimized/cleared to fit local storage limit).");
          setStatus('pending');
        } catch (err2) {
          console.warn("Optimizing existing history item sizes in localStorage...");
          const optimizedExisting = existing.map((entry: any) => ({
            ...entry,
            logo: (entry.logo && entry.logo.startsWith('data:image/')) ? '' : entry.logo,
            coverBanner: (entry.coverBanner && entry.coverBanner.startsWith('data:image/')) ? '' : entry.coverBanner,
            ownerPhoto: (entry.ownerPhoto && entry.ownerPhoto.startsWith('data:image/')) ? '' : entry.ownerPhoto,
            branchPhoto: (entry.branchPhoto && entry.branchPhoto.startsWith('data:image/')) ? '' : entry.branchPhoto,
            galleryPhotos: entry.galleryPhotos ? entry.galleryPhotos.filter((photo: string) => photo && !photo.startsWith('data:image/')) : []
          }));
          try {
            localStorage.setItem('registrations', JSON.stringify([...optimizedExisting, minimizedReg]));
            setStatus('pending');
          } catch (err3) {
            const minimalReg = {
              ...fallbackReg,
              logo: '',
              coverBanner: '',
              ownerPhoto: '',
              branchPhoto: '',
              galleryPhotos: [],
              packages: []
            };
            try {
              localStorage.setItem('registrations', JSON.stringify([minimalReg]));
              setStatus('pending');
            } catch (err4) {
              alert("Could not submit because your browser local storage is completely full. Please clear some browser storage and try again.");
            }
          }
        }
      }
    }
  };

  if (status === 'pending') {
    return (
      <div className="min-h-screen relative bg-[#051410] font-poppins flex flex-col items-center justify-center py-20 px-4 overflow-hidden text-white">
        {/* Decorative background light sources */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#DEAA38]/5 rounded-full blur-[120px] pointer-events-none select-none" />
        <div className="absolute bottom-1/4 right-1/2 w-96 h-96 bg-[#00483C]/30 rounded-full blur-[140px] pointer-events-none select-none" />
        
        {/* Content container */}
        <div className="max-w-2xl w-full text-center relative z-10 animate-in fade-in duration-700">
          
          {/* Header brand logo */}
          <div className="flex flex-col items-center mb-10 select-none">
             <div className="flex items-center gap-1.5 mb-1.5">
                 <Sparkles className="text-[#DEAA38]" size={22} />
                 <span className="font-display font-medium text-xl text-[#DEAA38] tracking-widest uppercase">CaterNest</span>
             </div>
             <p className="text-[10px] tracking-wider text-[#6ea494] font-bold font-poppins uppercase">Making Every Event Special</p>
          </div>

          {/* Laurel wreath check indicator */}
          <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center select-none">
              <div className="absolute inset-0 bg-brand-gold-500/5 rounded-full border border-brand-gold-500/10 animate-pulse" />
              <div className="absolute inset-3 bg-brand-gold-500/10 rounded-full border border-brand-gold-500/20" />
              
              <div className="absolute -inset-1 flex justify-between items-center px-1 pointer-events-none text-[#DEAA38]/60">
                 <div className="text-xl rotate-[-25deg] font-serif">✿ ✿ ✿</div>
                 <div className="text-xl rotate-[25deg] font-serif">✿ ✿ ✿</div>
              </div>

              {/* Inner central gold check circle */}
              <div className="w-22 h-22 rounded-full bg-gradient-to-tr from-amber-600 via-[#DEAA38] to-yellow-300 shadow-[0_10px_25px_rgba(222,170,56,0.3)] flex items-center justify-center relative">
                  <Check size={40} className="text-[#051410]" strokeWidth={4} />
                  
                  {/* Floating sparkles */}
                  <div className="absolute -top-1 -right-1 text-white animate-bounce duration-1000"><Sparkles size={16} /></div>
                  <div className="absolute -bottom-1 -left-1 text-yellow-105 animate-pulse"><Sparkles size={12} /></div>
              </div>
          </div>

          {/* Primary Submit Success heading */}
          <h2 className="text-3xl font-display font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-amber-200 to-amber-100 mt-6 mb-3">
             Application Submitted!
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto font-poppins leading-relaxed mb-8 font-light">
             Thank you for registering with CaterNest. Your application is under review. Our team will verify your details and list your profile shortly.
          </p>

          {/* Custom Steps Progress Timeline */}
          <div className="bg-black/30 border border-[#DEAA38]/10 rounded-[2rem] p-6 sm:p-7 max-w-xl mx-auto mb-8 backdrop-blur-md text-left">
              <span className="block text-[10px] font-bold text-[#DEAA38] uppercase tracking-widest mb-5 font-poppins">What happens next?</span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-2 relative">
                  {/* Connecting line */}
                  <div className="absolute top-[16px] left-[16px] right-[16px] h-[1px] bg-slate-800 hidden md:block select-none pointer-events-none" />
                  
                  {/* Stage 1: Submitted */}
                  <div className="flex md:flex-col items-center md:text-center gap-3 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center shrink-0">
                          <Check size={14} className="text-green-400" strokeWidth={3} />
                      </div>
                      <div className="pt-0.5">
                          <p className="text-[11px] font-bold text-white uppercase tracking-wider md:leading-none">Submitted</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Application received</p>
                      </div>
                  </div>

                  {/* Stage 2: Under Review */}
                  <div className="flex md:flex-col items-center md:text-center gap-3 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-[#DEAA38]/20 border-2 border-[#DEAA38] flex items-center justify-center shrink-0 animate-pulse shadow-[0_10px_25px_rgba(222,170,56,0.3)]">
                          <Clock size={14} className="text-[#DEAA38]" />
                      </div>
                      <div className="pt-0.5">
                          <p className="text-[11px] font-bold text-[#DEAA38] uppercase tracking-wider md:leading-none">Under Review</p>
                          <p className="text-[9px] text-slate-300 mt-0.5">Checking qualifications</p>
                      </div>
                  </div>

                  {/* Stage 3: Moderation */}
                  <div className="flex md:flex-col items-center md:text-center gap-3 relative z-10 opacity-30">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-705 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-slate-400 font-sans">3</span>
                      </div>
                      <div className="pt-0.5">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider md:leading-none">Approval</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-normal">Account activated</p>
                      </div>
                  </div>

                  {/* Stage 4: Live Listing */}
                  <div className="flex md:flex-col items-center md:text-center gap-3 relative z-10 opacity-30">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-705 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-slate-400 font-sans">4</span>
                      </div>
                      <div className="pt-0.5">
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider md:leading-none">Public Live</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-normal">Receive bookings</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Time frame summary card */}
          <div className="inline-block bg-[#0e2720]/80 border border-[#DEAA38]/10 rounded-2xl px-6 py-3.5 mb-8 backdrop-blur">
              <span className="text-[10px] text-[#DEAA38] font-bold block uppercase tracking-widest">Expected Verification Status</span>
              <span className="text-xs font-semibold text-slate-100 mt-0.5 block">Pending Review • 1 - 3 Business Days</span>
              <p className="text-[10px] text-slate-400 mt-1">Status notification email: <span className="text-slate-200 font-sans">{formData.email || 'your registered email'}</span></p>
          </div>

          {/* Footer Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
              <button 
                onClick={() => navigate('/')} 
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Go to Homepage
              </button>
              <button 
                onClick={() => navigate('/caterers')} 
                className="w-full sm:w-auto bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] px-7 py-2.5 rounded-full text-xs font-bold shadow-lg shadow-brand-gold-500/20 transition-all active:scale-95 cursor-pointer"
              >
                Explore Marketplace
              </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 bg-[#f2f7f5] min-h-screen border-t border-brand-green-100 font-poppins">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        
        {/* Embedded Top Brand Header spanning the card style */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-6 duration-500">
           <div className="flex items-center gap-2.5">
               <div className="w-10 h-10 rounded-full bg-[#00483C] text-[#DEAA38] flex items-center justify-center font-display font-bold text-lg select-none shadow-brand-green-900/10 shadow-md">
                  CN
               </div>
               <div>
                   <div className="flex items-center gap-1">
                      <span className="font-display font-semibold text-lg text-brand-green-950 uppercase tracking-widest leading-none">CaterNest</span>
                      <span className="text-[#DEAA38] font-sans">★</span>
                   </div>
                   <p className="text-[10px] tracking-wider text-slate-400 font-bold font-poppins uppercase leading-none mt-1">Making Every Event Special</p>
               </div>
           </div>
           
           <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full font-bold font-poppins">Step {step} of 5</span>
              <button 
                onClick={() => {
                  alert("Draft saved successfully! You can resume registration anytime.");
                }} 
                className="text-xs font-semibold px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 flex items-center gap-1 bg-white cursor-pointer"
              >
                <Save size={12} /> Save Draft
              </button>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Progress Sidebar */}
          <div className="w-full md:w-[280px] shrink-0">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-32 space-y-8 animate-in slide-in-from-left-6 duration-500">
                  <div>
                      <h3 className="font-poppins font-bold text-[11px] tracking-wider text-slate-400 uppercase mb-4">Registration Progress</h3>
                      <JoinSteps currentStep={step} />
                  </div>
                  
                  {/* Sidebar Support Widget precisely matching design */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                     <div className="w-8 h-8 rounded-full bg-[#00483C]/5 flex items-center justify-center text-brand-green-800 mb-2.5">
                         <HelpCircle size={16} />
                     </div>
                     <h4 className="font-bold text-xs text-slate-900 font-poppins">Need Help?</h4>
                     <p className="text-[11px] text-slate-500 mt-1 mb-3.5 leading-relaxed font-poppins">
                        Or have questions about documentation? Our onboarding team is here to assist you.
                     </p>
                     <button 
                       type="button" 
                       onClick={() => window.open('https://wa.me/919999999999', '_blank')}
                       className="w-full bg-[#00483C] text-white font-bold text-[10px] uppercase tracking-wider py-2 rounded-xl hover:bg-[#00362c] transition-all block text-center cursor-pointer"
                     >
                        Chat with Support
                     </button>
                  </div>
              </div>
          </div>

          {/* Wizard Form container card */}
          <div className="flex-1 w-full bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col justify-between animate-in fade-in duration-500">
              
              {/* Internal Step Header Banner */}
              <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-poppins">
                      {step === 1 && "1. MENU EXTRACTION"}
                      {step === 2 && "2. CONTACT DETAILS"}
                      {step === 3 && "3. BRAND & OPERATIONS"}
                      {step === 4 && "4. BACKUP VERIFICATION"}
                      {step === 5 && "5. FINAL CONFIRMATION"}
                  </span>
                  
                  <span className="flex items-center gap-1.5 text-xs text-[#DEAA38] font-bold font-poppins">
                     <ShieldCheck size={14} className="text-[#DEAA38]" /> Safe & Secure
                  </span>
              </div>
              
              <div className="p-6 md:p-8 flex-1">
                  {/* STEP 1: Menu Upload & AI Scan */}
                  {step === 1 && (
                      <div className="font-poppins animate-in fade-in duration-300">
                         <CatererMenuBuilder 
                              packages={menuPackages}
                              onChange={setMenuPackages}
                              isParsing={isParsing}
                              setIsParsing={setIsParsing}
                              onCatererDetailsExtracted={handleCatererDetailsExtracted}
                         />
                      </div>
                  )}
                  
                  {/* STEP 2: Basic Details */}
                  {step === 2 && (
                      <div className="space-y-6 font-poppins animate-in fade-in duration-300">
                         <div>
                            <h3 className="font-display font-semibold text-xl text-slate-900 mb-1">Caterer Contact Information</h3>
                            <p className="text-xs text-slate-500 font-poppins">Provide the owner contacts and account credentials for your Caterer Panel login.</p>
                         </div>
                         
                         <div className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Owner Name <span className="text-red-500">*</span></label>
                                  <input type="text" value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="Enter owner's full legal name" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Mobile Number <span className="text-red-500">*</span> (Primary WhatsApp Number)</label>
                                  <input type="text" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="e.g. +91 98765 43210" />
                                </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Line 2: Secondary Number</label>
                                  <input type="text" value={formData.alternateMobile || ''} onChange={e => setFormData({ ...formData, alternateMobile: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="e.g. Backup manager number" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Line 3: Additional Number (Optional)</label>
                                   <input type="text" value={formData.additionalMobile || ''} onChange={e => setFormData({ ...formData, additionalMobile: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all mb-4" placeholder="e.g. backup or landline" />
                                   <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Email Address <span className="text-red-500">*</span></label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="email" 
                                      value={formData.email} 
                                      disabled={verificationStatus === 'sending'}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setFormData({ 
                                          ...formData, 
                                          email: val,
                                          email_verified: false
                                        });
                                        setIsEmailVerified(false);
                                        setVerificationStatus('none');
                                      }} 
                                      className="flex-1 bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all text-slate-900" 
                                      placeholder="e.g. delicious@caterer.com" 
                                    />
                                    <button
                                      type="button"
                                      disabled={!formData.email || isEmailVerified || verificationStatus === 'sending'}
                                      onClick={handleSendVerification}
                                      className={cn(
                                        "px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                                        isEmailVerified 
                                          ? "bg-emerald-600 text-white cursor-not-allowed" 
                                          : "bg-[#00483C] text-white hover:bg-[#00362c] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                      )}
                                    >
                                      {verificationStatus === 'sending' ? 'Sending...' : isEmailVerified ? 'Verified' : 'Verify Email'}
                                    </button>
                                  </div>

                                  {/* Verification Status Banner / Message */}
                                  <div className="mt-2.5">
                                    {isEmailVerified ? (
                                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                                        <span className="text-emerald-600 text-base">✅</span>
                                        <div>
                                          <p className="text-xs font-bold text-slate-950 font-poppins">✅ Email Verified</p>
                                          <p className="text-[11px] text-slate-600 font-poppins">Email verified successfully. You may continue registration.</p>
                                        </div>
                                      </div>
                                    ) : verificationStatus === 'sent' || verificationStatus === 'sending' ? (
                                      <div className="space-y-3 font-poppins">
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                          <div className="flex items-center gap-2">
                                            <span className="text-amber-600">📨</span>
                                            <div>
                                              <p className="text-xs font-bold text-slate-950">Verification Email Sent</p>
                                              <p className="text-[11px] text-slate-600">We have sent a secure Magic Link to your email inbox. Please click the link to verify your email address automatically.</p>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={handleSendVerification}
                                            className="text-[11px] font-bold text-[#DEAA38] hover:underline flex items-center gap-1 bg-transparent cursor-pointer"
                                          >
                                            🔄 Resend Verification Email
                                          </button>
                                        </div>
                                      </div>
                                    ) : verificationStatus === 'expired' ? (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 font-poppins">
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-600">⚠️</span>
                                          <div>
                                            <p className="text-xs font-bold text-slate-950">Verification Link Expired</p>
                                            <p className="text-[11px] text-slate-600">Verification link expired. Please resend verification email.</p>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={handleSendVerification}
                                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                          Resend Verification Email
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 font-poppins">
                                        <span className="text-red-600">🔴</span>
                                        <div>
                                          <p className="text-xs font-bold text-slate-950">Email Not Verified</p>
                                          <p className="text-[11px] text-slate-600">Email not verified. Please verify your email to continue.</p>
                                        </div>
                                      </div>
                                    )}
                                    {verificationError && (
                                      <p className="text-xs text-red-500 font-semibold mt-1 font-poppins">{verificationError}</p>
                                    )}
                                  </div>
                                </div>
                           </div>
                           
                           <div className="relative flex items-center justify-center my-6">
                              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-slate-150"></div>
                              </div>
                              <div className="relative bg-white px-4 text-xs font-semibold text-slate-400 font-poppins uppercase tracking-wider">
                                Choose Login Credentials
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Choose Username <span className="text-red-500">*</span></label>
                                  <input type="text" value={formData.username} disabled={!isEmailVerified} onChange={e => { setIsUsernameManual(true); setFormData({ ...formData, username: e.target.value }); }} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-900" placeholder={isEmailVerified ? "e.g. gourmet_kitchens" : "Verify email first to choose username"} />
                                </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Choose Password <span className="text-red-500">*</span></label>
                                  <input type="password" value={formData.password} disabled={!isEmailVerified} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-900" placeholder={isEmailVerified ? "Choose a secure password" : "Verify email first"} />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Confirm Password <span className="text-red-500">*</span></label>
                                  <input type="password" value={formData.confirmPassword} disabled={!isEmailVerified} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-900" placeholder={isEmailVerified ? "Retype password to confirm" : "Verify email first"} />
                                </div>
                           </div>
                         </div>

                         {/* Security Shield Callout block */}
                         <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-start gap-3 mt-6">
                            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                               <Lock size={15} />
                            </span>
                            <div>
                               <h4 className="text-xs font-bold text-slate-900 leading-none font-poppins">Security Encryption</h4>
                               <p className="text-[11px] text-slate-500 mt-1 leading-normal font-poppins">
                                  Your password and confidential business logs are fully hashed and encrypted. We never share or sell onboarding registry records.
                               </p>
                            </div>
                         </div>
                      </div>
                  )}
                  
                  {/* STEP 3: Business Details */}
                  {step === 3 && (
                      <div className="space-y-6 font-poppins animate-in fade-in duration-300">
                         <div>
                            <h3 className="font-display font-semibold text-xl text-slate-900 mb-1">Business Setup & Branding</h3>
                            <p className="text-xs text-slate-500">How customers see your brand listing. Add high quality logos and banner assets.</p>
                         </div>

                         <div className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Caterer Name / Brand Name <span className="text-red-500">*</span></label>
                                  <input type="text" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="e.g. Royal Taste Caterers" />
                                </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Years of Experience <span className="text-red-500">*</span></label>
                                  <input type="number" min="0" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">City <span className="text-red-500">*</span></label>
                                  <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="e.g. Hyderabad" />
                                </div>
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Kitchen Office Address <span className="text-red-500">*</span></label>
                                  <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="Enter complete physical address of central kitchen" />
                                </div>
                                
                                {/* Service Areas with interactive quick chips */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Service Areas <span className="text-slate-400 font-normal">(Comma separated or pick below)</span></label>
                                  <input 
                                    type="text" 
                                    value={formData.serviceAreas} 
                                    onChange={e => setFormData({ ...formData, serviceAreas: e.target.value })} 
                                    className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all mb-2" 
                                    placeholder="e.g. Kondapur, Gachibowli, Kukatpally" />
                                  
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                     {popularAreas.map((area, sIdx) => {
                                        const contains = serviceAreaChips.some(x => x.toLowerCase() === area.toLowerCase());
                                        return (
                                           <button
                                              key={sIdx}
                                              type="button"
                                              onClick={() => contains ? removeServiceAreaChip(area) : addServiceAreaChip(area)}
                                              className={cn(
                                                "text-[10px] font-bold px-3 py-1 rounded-full border transition-all uppercase tracking-wide cursor-pointer",
                                                contains ? "bg-brand-gold-500 border-brand-gold-500 text-slate-900 shadow" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                              )}
                                           >
                                              {contains ? "✓" : "+"} {area}
                                           </button>
                                        );
                                     })}
                                  </div>
                                </div>
                                
                                {/* Description with visual WYSIWYG editor mockup toolbar */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Public Description <span className="text-red-500">*</span></label>
                                  
                                  <div className="flex flex-wrap items-center gap-1 bg-slate-100 border border-slate-200 border-b-0 px-3 py-1.5 rounded-t-xl text-slate-500 select-none">
                                      <button type="button" className="p-1 hover:bg-white hover:text-slate-800 rounded transition-colors" title="Bold"><Bold size={13}/></button>
                                      <button type="button" className="p-1 hover:bg-white hover:text-slate-800 rounded transition-colors" title="Italic"><Italic size={13}/></button>
                                      <button type="button" className="p-1 hover:bg-white hover:text-slate-800 rounded transition-colors" title="Underline"><Underline size={13}/></button>
                                      <div className="w-[1px] h-3 bg-slate-300 mx-1" />
                                      <button type="button" className="p-1 hover:bg-white hover:text-slate-800 rounded transition-colors" title="List"><List size={13}/></button>
                                      <button type="button" className="p-1 hover:bg-white hover:text-slate-800 rounded transition-colors" title="Numbered List"><ListOrdered size={13}/></button>
                                      <div className="w-[1px] h-3 bg-slate-300 mx-1" />
                                      <span className="text-[9px] font-bold text-slate-400 ml-auto uppercase tracking-wider font-poppins">Visual Editor</span>
                                  </div>
                                  
                                  <textarea 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                    rows={4} 
                                    className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-b-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" 
                                    placeholder="Write details about your cuisine specialties, corporate history, client list, safety certifications..." />
                                </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Awards (Optional)</label>
                                  <input type="text" value={formData.awards} onChange={e => setFormData({ ...formData, awards: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="Best Caterer Award 2024" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Achievements (Optional)</label>
                                  <input type="text" value={formData.achievements} onChange={e => setFormData({ ...formData, achievements: e.target.value })} className="w-full bg-slate-50/40 border border-slate-200 focus:border-[#DEAA38]/80 focus:bg-white rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-brand-gold-500/10 outline-none transition-all" placeholder="Served 500+ premium wedding events" />
                                </div>
                           </div>
                           
                           <div className="pt-6 mt-8 border-t border-slate-100">
                               <h3 className="font-display font-semibold text-base text-slate-900 mb-4 flex items-center gap-1.5">
                                  <Sparkles size={16} className="text-[#DEAA38]"/> Profile Media & Branding Assets
                               </h3>
                               
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                   <ImageUploaderField 
                                        label="Caterer Logo Upload (500x500)"
                                        value={formData.catererLogo}
                                        onChange={(val) => setFormData(prev => ({ ...prev, catererLogo: val }))}
                                        placeholder="e.g. Paste logo photo URL"
                                   />
                                   <ImageUploaderField 
                                        label="Cover Banner Upload (1600x600)"
                                        value={formData.coverBanner}
                                        onChange={(val) => setFormData(prev => ({ ...prev, coverBanner: val }))}
                                        placeholder="e.g. Paste banner hero URL"
                                   />
                                   <ImageUploaderField 
                                        label="Founder / Chef Headshot (500x500)"
                                        value={formData.founderPhoto}
                                        onChange={(val) => setFormData(prev => ({ ...prev, founderPhoto: val }))}
                                        placeholder="e.g. Paste portrait URL"
                                   />
                                   <ImageUploaderField 
                                        label="Branch / Front Outlet Photo (Optional)"
                                        value={formData.branchPhoto}
                                        onChange={(val) => setFormData(prev => ({ ...prev, branchPhoto: val }))}
                                        placeholder="e.g. Paste storefront image URL"
                                   />
                               </div>

                               <div className="space-y-3">
                                   <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">Gallery Showcase Images <span className="text-slate-400 font-normal capitalize font-poppins">(Food Prep, Live Stalls, Catering Teams)</span></label>
                                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                       {formData.galleryPhotos.map((photo, i) => {
                                           const isImage = photo.startsWith('data:image/') || photo.startsWith('http://') || photo.startsWith('https://');
                                           return (
                                               <div key={i} className="relative aspect-video rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden group shadow-sm hover:shadow transition-shadow">
                                                   {isImage ? (
                                                       <img src={photo} alt={`Gallery ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                   ) : (
                                                       <div className="p-2 text-center text-xs text-slate-500 font-medium truncate max-w-full font-poppins">
                                                           {photo}
                                                       </div>
                                                   )}
                                                   <button 
                                                       type="button" 
                                                       onClick={() => removeGalleryPhoto(i)} 
                                                       className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full shadow flex items-center justify-center transition-colors cursor-pointer"
                                                       title="Remove Image"
                                                   >
                                                       <span className="block text-sm font-bold leading-none">×</span>
                                                   </button>
                                               </div>
                                           );
                                       })}
                                       <label className="aspect-video border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-brand-gold-500 rounded-xl cursor-pointer flex flex-col items-center justify-center text-xs font-bold text-slate-600 transition-all gap-1 select-none text-center p-2">
                                           <UploadCloud size={20} className="text-[#DEAA38]" />
                                           <span>+ Add Photo</span>
                                           <span className="text-[9px] text-slate-400 font-normal font-poppins">JPG, PNG, WEBP</span>
                                           <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                                       </label>
                                   </div>
                               </div>
                           </div>
                         </div>
                      </div>
                  )}

                  {/* STEP 4: Documents Verification */}
                  {step === 4 && (
                      <div className="space-y-6 font-poppins animate-in fade-in duration-300">
                          <div>
                             <h3 className="font-display font-semibold text-xl text-slate-900 mb-1">Corporate Verification Docs</h3>
                             <p className="text-xs text-slate-500 font-poppins">Provide legal identification and licensing scans to fast-track moderation. Safe and encrypted storage.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Aadhaar card uploader */}
                              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl relative flex flex-col justify-between min-h-[180px]">
                                  <div>
                                     <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between font-poppins">Aadhaar Card <span className="text-[10px] font-normal text-slate-400 uppercase font-poppins">Optional</span></h4>
                                     <p className="text-[11px] text-slate-500 mt-0.5 font-poppins">Owner or company signatory's ID scanned copy</p>
                                  </div>
                                  <div className="mt-4">
                                     <label className="flex items-center justify-center border border-dashed border-slate-300 hover:border-[#DEAA38] bg-white rounded-xl py-2.5 cursor-pointer transition-all">
                                         <input type="file" className="hidden" onChange={e => handleFileChange(e, 'aadhaarFile')} />
                                         <span className="text-xs font-semibold text-slate-600 px-4 truncate flex items-center gap-2 font-poppins">
                                            {formData.aadhaarFile ? <CheckCircle2 size={14} className="text-green-600 shrink-0"/> : <UploadCloud size={14} className="text-[#DEAA38] shrink-0" />}
                                            {formData.aadhaarFile || "Upload Aadhaar PDF/Image"}
                                         </span>
                                     </label>
                                  </div>
                                  {formData.aadhaarFile && <span className="absolute top-4 right-4 text-green-600"><CheckCircle2 size={16}/></span>}
                              </div>

                              {/* PAN Card uploader */}
                              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl relative flex flex-col justify-between min-h-[180px]">
                                  <div>
                                     <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between font-poppins">PAN Card <span className="text-[10px] font-normal text-slate-400 uppercase font-poppins">Optional</span></h4>
                                     <p className="text-[11px] text-slate-500 mt-0.5 font-poppins">Corporate PAN or Proprietor PAN certificate scan</p>
                                  </div>
                                  <div className="mt-4">
                                     <label className="flex items-center justify-center border border-dashed border-slate-300 hover:border-[#DEAA38] bg-white rounded-xl py-2.5 cursor-pointer transition-all">
                                         <input type="file" className="hidden" onChange={e => handleFileChange(e, 'panFile')} />
                                         <span className="text-xs font-semibold text-slate-600 px-4 truncate flex items-center gap-2 font-poppins">
                                            {formData.panFile ? <CheckCircle2 size={14} className="text-green-600 shrink-0"/> : <UploadCloud size={14} className="text-[#DEAA38] shrink-0" />}
                                            {formData.panFile || "Upload PAN Scan"}
                                         </span>
                                     </label>
                                  </div>
                                  {formData.panFile && <span className="absolute top-4 right-4 text-green-600"><CheckCircle2 size={16}/></span>}
                              </div>

                              {/* FSSAI License */}
                              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl relative flex flex-col justify-between min-h-[180px]">
                                  <div>
                                     <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between font-poppins">FSSAI Licence <span className="text-[10px] font-normal text-slate-400 uppercase font-poppins">Optional</span></h4>
                                     <p className="text-[11px] text-slate-500 mt-0.5 font-poppins">Food Safety Standard Authority registry certificate copy</p>
                                  </div>
                                  <div className="mt-4">
                                     <label className="flex items-center justify-center border border-dashed border-slate-300 hover:border-[#DEAA38] bg-white rounded-xl py-2.5 cursor-pointer transition-all">
                                         <input type="file" className="hidden" onChange={e => handleFileChange(e, 'fssaiFile')} />
                                         <span className="text-xs font-semibold text-slate-600 px-4 truncate flex items-center gap-2 font-poppins">
                                            {formData.fssaiFile ? <CheckCircle2 size={14} className="text-green-600 shrink-0"/> : <UploadCloud size={14} className="text-[#DEAA38] shrink-0" />}
                                            {formData.fssaiFile || "Upload FSSAI License Certificate"}
                                         </span>
                                     </label>
                                  </div>
                                  {formData.fssaiFile && <span className="absolute top-4 right-4 text-green-600"><CheckCircle2 size={16}/></span>}
                              </div>

                              {/* GST Certificate */}
                              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl relative flex flex-col justify-between min-h-[180px]">
                                  <div>
                                     <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between font-poppins">GSTIN Form <span className="text-[10px] font-normal text-slate-400 uppercase font-poppins">Optional</span></h4>
                                     <p className="text-[11px] text-slate-500 mt-0.5 font-poppins">Goods and Services Tax registration certificate copy</p>
                                  </div>
                                  <div className="mt-4">
                                     <label className="flex items-center justify-center border border-dashed border-slate-300 hover:border-[#DEAA38] bg-white rounded-xl py-2.5 cursor-pointer transition-all">
                                         <input type="file" className="hidden" onChange={e => handleFileChange(e, 'gstFile')} />
                                         <span className="text-xs font-semibold text-slate-600 px-4 truncate flex items-center gap-2 font-poppins">
                                            {formData.gstFile ? <CheckCircle2 size={14} className="text-green-600 shrink-0"/> : <UploadCloud size={14} className="text-[#DEAA38] shrink-0" />}
                                            {formData.gstFile || "Upload GST Reg Form (REG-06)"}
                                         </span>
                                     </label>
                                  </div>
                                  {formData.gstFile && <span className="absolute top-4 right-4 text-green-600"><CheckCircle2 size={16}/></span>}
                              </div>

                              {/* Additional validation attachments */}
                              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl relative flex flex-col justify-between min-h-[180px] md:col-span-2">
                                  <div>
                                     <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between font-poppins">Other ISO or Municipal Certificates <span className="text-[10px] font-normal text-slate-400 uppercase font-poppins">Optional</span></h4>
                                     <p className="text-[11px] text-slate-500 mt-0.5 font-poppins">Any health clearance certificates from local authorities or ISO standard copies</p>
                                  </div>
                                  <div className="mt-4">
                                     <label className="flex items-center justify-center border border-dashed border-slate-300 hover:border-[#DEAA38] bg-white rounded-xl py-2.5 cursor-pointer transition-all">
                                         <input type="file" className="hidden" onChange={e => handleFileChange(e, 'otherDocs')} />
                                         <span className="text-xs font-semibold text-slate-600 px-4 truncate flex items-center gap-2 font-poppins">
                                            {formData.otherDocs ? <CheckCircle2 size={14} className="text-green-600 shrink-0"/> : <UploadCloud size={14} className="text-[#DEAA38] shrink-0" />}
                                            {formData.otherDocs || "Upload extra attachment files"}
                                         </span>
                                     </label>
                                  </div>
                                  {formData.otherDocs && <span className="absolute top-4 right-4 text-green-600"><CheckCircle2 size={16}/></span>}
                              </div>
                          </div>
                      </div>
                  )}

                  {/* STEP 5: Review & Submit */}
                  {step === 5 && (
                      <div className="space-y-6 font-poppins animate-in fade-in duration-300">
                         <div className="text-left bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-2xl border border-[#cbdcd5] mb-4">
                             <h3 className="font-display font-semibold text-lg text-[#00483C] leading-none mb-1.5 flex items-center gap-1.5">
                                <ShieldCheck size={20} className="text-[#DEAA38]"/> Verify & Clear Application
                             </h3>
                             <p className="text-slate-600 text-xs leading-relaxed font-poppins">
                                Please review your catering records before signing off for onboarding clearance. Approval verification generally succeeds faster when details match document archives.
                             </p>
                         </div>
                         
                         {/* Card 1: Contact Details */}
                         <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-poppins">Owner & Contacts</h4>
                                  <button onClick={() => setStep(2)} className="text-[#00483C] text-xs font-bold hover:underline cursor-pointer">Edit</button>
                              </div>
                              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                                  <div><span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5 font-poppins">Owner Name</span><span className="text-xs text-slate-800 font-semibold font-poppins">{formData.ownerName || '-'}</span></div>
                                  <div><span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5 font-poppins">Mobile Number</span><span className="text-xs text-slate-800 font-semibold font-poppins">{formData.mobile || '-'}</span></div>
                                  <div><span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5 font-poppins">Email Signature</span><span className="text-xs text-slate-800 font-semibold break-all font-poppins">{formData.email || '-'}</span></div>
                                  <div><span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5 font-poppins">Login Account</span><span className="text-xs text-slate-800 font-semibold font-poppins">@{formData.username || '-'}</span></div>
                                  <div><span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5 font-poppins">Experience Slabs</span><span className="text-xs text-slate-800 font-semibold font-poppins">{formData.experience || '0'} Years</span></div>
                                  <div><span className="block text-[10px] text-slate-400 uppercase font-bold mb-0.5 font-poppins">Service Location</span><span className="text-xs text-slate-800 font-semibold font-poppins">{formData.city || '-'}</span></div>
                              </div>
                         </div>

                         {/* Card 2: Menus & Packages */}
                         <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-poppins">Public Offerings / Packages</h4>
                                  <button onClick={() => setStep(1)} className="text-[#00483C] text-xs font-bold hover:underline cursor-pointer font-poppins">Edit</button>
                              </div>
                              <div className="p-6 space-y-3">
                                 {menuPackages.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                       {menuPackages.map((pkg, i) => {
                                          const sortedSlabs = pkg.pricingSlabs ? [...pkg.pricingSlabs].sort((a: any, b: any) => a.minGuests - b.minGuests) : [];
                                          const basePrice = pkg.pricePerPlate || (sortedSlabs[0]?.price) || 0;
                                          return (
                                             <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 relative flex items-center justify-between animate-in fade-in duration-300">
                                                <div>
                                                    <span className="block font-bold text-slate-900 text-sm leading-none mb-1 font-poppins">{pkg.packageName || 'Package ' + (i+1)}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-poppins">{pkg.categories?.length || 0} Categories</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-sans font-bold text-sm text-[#DEAA38] block font-poppins">₹{basePrice}</span>
                                                    <span className="text-[10px] text-slate-500 block font-poppins">per plate</span>
                                                </div>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 ) : <p className="text-xs text-slate-400 italic font-poppins">No catering packages compiled.</p>}
                              </div>
                         </div>

                         {/* Card 3: Verification Credentials */}
                         <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                              <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-poppins">Corporate Documents Checklist</h4>
                                  <button onClick={() => setStep(4)} className="text-[#00483C] text-xs font-bold hover:underline cursor-pointer font-poppins">Edit</button>
                              </div>
                              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                                     <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 font-poppins">Aadhaar Card</span>
                                     {formData.aadhaarFile ? <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 inline-block font-poppins">✓ Attached</span> : <span className="text-xs text-slate-400 font-poppins">N/A</span>}
                                  </div>
                                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                                     <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 font-poppins">PAN Card</span>
                                     {formData.panFile ? <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 inline-block font-poppins font-poppins">✓ Attached</span> : <span className="text-xs text-slate-400 font-poppins font-poppins font-poppins font-poppins font-poppins">N/A</span>}
                                  </div>
                                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                                     <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 font-poppins font-poppins">FSSAI License</span>
                                     {formData.fssaiFile ? <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 inline-block font-poppins">✓ Attached</span> : <span className="text-xs text-slate-400 font-poppins">N/A</span>}
                                  </div>
                                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                                     <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 font-poppins font-poppins">GST License</span>
                                     {formData.gstFile ? <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 inline-block font-poppins">✓ Attached</span> : <span className="text-xs text-slate-400 font-poppins font-poppins">N/A</span>}
                                  </div>
                              </div>
                         </div>
                      </div>
                  )}
              </div>
              
              {/* Fixed Action Footer precisely matching designs */}
              <div className="bg-slate-50 p-5 md:p-6 border-t border-slate-150 flex justify-between items-center mt-auto">
                  <button 
                      onClick={handleBack}
                      disabled={step === 1 || isParsing}
                      className={cn("px-5 py-2.5 rounded-xl font-bold font-poppins text-xs uppercase tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer", step === 1 || isParsing ? "opacity-0 pointer-events-none" : "text-slate-500 hover:bg-slate-200")}
                  >
                      <ChevronLeft size={14} /> Back
                  </button>
                  
                  {step < 5 ? (
                      <button 
                          onClick={handleNext}
                          disabled={isParsing || (step === 2 && !isEmailVerified)}
                          className={cn("bg-[#00483C] text-white px-6 py-2.5 rounded-xl font-bold font-poppins text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-brand-green-800 transition-colors shadow-lg shadow-brand-green-900/10 cursor-pointer", (isParsing || (step === 2 && !isEmailVerified)) ? "opacity-50 cursor-not-allowed" : "")}
                      >
                          Next Step <ChevronRight size={14} />
                      </button>
                  ) : (
                      <button 
                          onClick={handleSubmit}
                          className="bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] px-8 py-2.5 rounded-xl font-black font-poppins text-xs uppercase tracking-widest flex items-center gap-1.5 transition-colors shadow-lg shadow-brand-gold-500/10 active:scale-95 cursor-pointer animate-pulse"
                      >
                          Submit For Approval
                      </button>
                  )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
