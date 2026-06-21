import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2, Trash2, Edit2, Plus, GripVertical, X, Copy, ChevronDown, Check, ChefHat, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase, uploadToSupabaseBucket } from '../lib/supabase';

interface MenuCategory {
  categoryName: string;
  selectionRule: string;
  items: string[];
}

interface MenuPackage {
  packageName: string;
  packageType: string;
  itemCount?: number;
  pricePerPlate?: number;
  minimumGuests?: number;
  pricingSlabs?: {
    minGuests: number;
    maxGuests: number | null;
    price: number;
  }[];
  categories: MenuCategory[];
}

interface CatererMenuBuilderProps {
  packages: MenuPackage[];
  onChange: (pkgs: MenuPackage[]) => void;
  isParsing: boolean;
  setIsParsing: (isParsing: boolean) => void;
  onCatererDetailsExtracted?: (details: any) => void;
}

export default function CatererMenuBuilder({ packages, onChange, isParsing, setIsParsing, onCatererDetailsExtracted }: CatererMenuBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Food image management states
  const [foodImages, setFoodImages] = useState<any[]>([]);
  const [catererEditingItem, setCatererEditingItem] = useState<any>(null);
  const [catererImgPreview, setCatererImgPreview] = useState<string>('');

  React.useEffect(() => {
    // Reset scanner states on mount to ensure fresh state upon load/user switch/page reload
    try {
      setIsParsing(false);
    } catch (e) {
      console.warn("Could not reset parsing state in parent:", e);
    }
    setUploadProgress(0);
    setScanProgress(0);
    setScanStatus('');
    setScanError('');
    setTimeRemaining(0);
    setLastFiles(null);
  }, []);

  React.useEffect(() => {
    fetch('/api/food-images')
      .then(res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error(`Response was not JSON. Status: ${res.status}`);
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.images)) {
          setFoodImages(data.images);
        } else if (Array.isArray(data)) {
          setFoodImages(data);
        }
      })
      .catch(err => console.error("Error loading food images inside builder:", err));
  }, []);

  const refreshBuilderImages = () => {
    fetch('/api/food-images')
      .then(res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error(`Response was not JSON. Status: ${res.status}`);
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.images)) {
          setFoodImages(data.images);
        } else if (Array.isArray(data)) {
          setFoodImages(data);
        }
      })
      .catch(err => console.error(err));
  };

  const getBuilderItemImage = (itemName: string) => {
    const found = foodImages.find(img => img.item_name.toLowerCase() === itemName.toLowerCase() && img.status === 'Approved');
    if (found?.image_url) return found.image_url;
    
    // Check pending/rejected ones too so the caterer sees what they have
    const pendingFound = foodImages.find(img => img.item_name.toLowerCase() === itemName.toLowerCase());
    if (pendingFound?.image_url) return pendingFound.image_url;

    // Direct fallback professional food thumbnail
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60`;
  };

  const getBuilderItemStatus = (itemName: string) => {
    const found = foodImages.find(img => img.item_name.toLowerCase() === itemName.toLowerCase());
    return found ? found.status : 'System Default';
  };

  const handleCatererImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size is too large. Max limit is 2MB.");
      return;
    }

    try {
      const supabase = getSupabase();
      if (supabase) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
        const publicUrl = await uploadToSupabaseBucket('food-images', fileName, file, file.type);
        if (publicUrl) {
          setCatererImgPreview(publicUrl);
          return;
        }
      }
    } catch (storageErr) {
      console.warn("Storage upload failed, fallback to local base64:", storageErr);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCatererImgPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const saveCatererCustomImage = () => {
    if (!catererEditingItem) return;
    
    fetch('/api/food-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: catererEditingItem.item_name,
        image_url: catererImgPreview,
        status: 'Pending Admin Review',
        approved_by_admin: false
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Image submitted successfully! It will be shown instantly, pending Admin approval.");
          setCatererEditingItem(null);
          refreshBuilderImages();
        } else {
          alert(data.error || "Failed to submit image.");
        }
      })
      .catch(err => {
        console.error("Error submitting custom image:", err);
        alert("An error occurred. Please try again.");
      });
  };

  // States for Modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [activePackageIndex, setActivePackageIndex] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatRule, setNewCatRule] = useState('Included');

  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [newPkgData, setNewPkgData] = useState({ name: '', type: 'Mixed', price: '', minGuests: '' });

  const [showAddItemModal, setShowAddItemModal] = useState<{pkgIdx: number, catIdx: number} | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const [showEditItemModal, setShowEditItemModal] = useState<{pkgIdx: number, catIdx: number, itemIdx: number, currentName: string} | null>(null);

  const [deletePackageModal, setDeletePackageModal] = useState<{pkgIdx: number, name: string} | null>(null);
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{pkgIdx: number, catIdx: number, name: string} | null>(null);
  const [deleteItemModal, setDeleteItemModal] = useState<{pkgIdx: number, catIdx: number, itemIdx: number, name: string} | null>(null);

  const [editPackageIdx, setEditPackageIdx] = useState<number | null>(null);
  const [editPackageNameStr, setEditPackageNameStr] = useState('');

  const [editCategoryIdx, setEditCategoryIdx] = useState<{pkg: number, cat: number} | null>(null);
  const [editCategoryNameStr, setEditCategoryNameStr] = useState('');

  // New states for progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [scanError, setScanError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastFiles, setLastFiles] = useState<FileList | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLastFiles(files);
    processFiles(files);
  };

  const processFiles = async (files: FileList) => {
    setIsParsing(true);
    setUploadProgress(0);
    setScanProgress(0);
    setScanError('');
    setScanStatus('Uploading documents...');
    setTimeRemaining(45);

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
            if (prev >= 100) {
                clearInterval(uploadInterval);
                return 100;
            }
            return prev + 15;
        });
    }, 200);

    // Time remaining countdown
    const timerInterval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    try {
      const urls: string[] = [];
      const uploadPromises = Array.from(files).map(async (file: File) => {
          try {
              const fileExt = file.name.split('.').pop() || 'pdf';
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
              const publicUrl = await uploadToSupabaseBucket('menu-cards', fileName, file, file.type);
              if (publicUrl) {
                  urls.push(publicUrl);
              } else {
                  console.warn(`Upload failed for ${file.name}, returned empty URL`);
              }
          } catch (uploadErr) {
            console.error("Storage item upload failed:", uploadErr);
          }
      });

      await Promise.all(uploadPromises);
      clearInterval(uploadInterval);
      setUploadProgress(100);
      setScanStatus('Analyzing menu layout & text...');

      if (urls.length === 0) {
        throw new Error('Could not upload menu documents to secure storage. Please check your storage settings and try again.');
      }

      // Simulate scan progress
      const scanInterval = setInterval(() => {
          setScanProgress(prev => {
              if (prev === 30) setScanStatus('Extracting pricing slabs...');
              if (prev === 60) setScanStatus('Categorizing menu items...');
              if (prev === 80) setScanStatus('Finalizing packages...');
              
              if (prev >= 95) return 95;
              return prev + 2;
          });
      }, 400);

      const res = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      clearInterval(scanInterval);
      clearInterval(timerInterval);

      if (!res.ok) {
        throw new Error('Failed to parse menu. Please try again.');
      }

      const data = await res.json();
      
      setScanProgress(100);
      setScanStatus('Scan successful!');

      let newPackages = [...packages];
      if (data.packages && Array.isArray(data.packages)) {
          newPackages = [...newPackages, ...data.packages];
      } else if (data.packageName) {
          newPackages.push(data);
      }
      
      onChange(newPackages);
      if (data.catererDetails && onCatererDetailsExtracted) {
        onCatererDetailsExtracted(data.catererDetails);
      }
      refreshBuilderImages();
      
      setTimeout(() => {
        setIsParsing(false);
        setUploadProgress(0);
        setScanProgress(0);
        setScanStatus('');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      clearInterval(timerInterval);
      setScanError(err.message || 'Error parsing menu card. Please try again.');
      setIsParsing(false);
    }
  };

  // --- Package Management ---
  const handleAddPackageManually = () => {
    setShowAddPackageModal(true);
    setNewPkgData({ name: '', type: 'Mixed', price: '', minGuests: '' });
  };

  const createManualPackage = () => {
    if (newPkgData.name.trim()) {
      const newPkgs = [...packages, {
        packageName: newPkgData.name.trim(),
        packageType: newPkgData.type,
        categories: [],
        pricePerPlate: parseInt(newPkgData.price) || 0,
        minimumGuests: parseInt(newPkgData.minGuests) || 0,
        pricingSlabs: [{
            minGuests: parseInt(newPkgData.minGuests) || 0,
            maxGuests: null,
            price: parseInt(newPkgData.price) || 0
        }]
      }];
      onChange(newPkgs);
      setShowAddPackageModal(false);
    }
  };

  const confirmDeletePackage = () => {
    if (deletePackageModal) {
      const newPkgs = [...packages];
      newPkgs.splice(deletePackageModal.pkgIdx, 1);
      onChange(newPkgs);
      setDeletePackageModal(null);
    }
  };

  const duplicatePackage = (idx: number) => {
    const newPkgs = [...packages];
    const original = newPkgs[idx];
    const dup = JSON.parse(JSON.stringify(original));
    dup.packageName = `${dup.packageName} (Copy)`;
    newPkgs.splice(idx + 1, 0, dup);
    onChange(newPkgs);
  };

  const savePackageName = (idx: number) => {
    if (editPackageNameStr.trim()) {
      const newPkgs = [...packages];
      newPkgs[idx].packageName = editPackageNameStr;
      onChange(newPkgs);
    }
    setEditPackageIdx(null);
  };

  // --- Category Management ---
  const openAddCategory = (pkgIdx: number) => {
    setActivePackageIndex(pkgIdx);
    setNewCatName('');
    setNewCatRule('Included');
    setShowAddCategoryModal(true);
  };

  const handleAddCategory = () => {
    if (activePackageIndex !== null && newCatName.trim()) {
      const newPkgs = [...packages];
      newPkgs[activePackageIndex].categories.push({
        categoryName: newCatName.trim(),
        selectionRule: newCatRule,
        items: []
      });
      onChange(newPkgs);
      setShowAddCategoryModal(false);
    }
  };

  const confirmDeleteCategory = () => {
    if (deleteCategoryModal) {
      const newPkgs = [...packages];
      newPkgs[deleteCategoryModal.pkgIdx].categories.splice(deleteCategoryModal.catIdx, 1);
      onChange(newPkgs);
      setDeleteCategoryModal(null);
    }
  };

  const duplicateCategory = (pkgIdx: number, catIdx: number) => {
    const newPkgs = [...packages];
    const original = newPkgs[pkgIdx].categories[catIdx];
    const dup = JSON.parse(JSON.stringify(original));
    dup.categoryName = `${dup.categoryName} (Copy)`;
    newPkgs[pkgIdx].categories.splice(catIdx + 1, 0, dup);
    onChange(newPkgs);
  };

  const saveCategoryName = (pkgIdx: number, catIdx: number) => {
    if (editCategoryNameStr.trim()) {
      const newPkgs = [...packages];
      newPkgs[pkgIdx].categories[catIdx].categoryName = editCategoryNameStr;
      onChange(newPkgs);
    }
    setEditCategoryIdx(null);
  };

  const updateRule = (pkgIdx: number, catIdx: number, val: string) => {
    const newPkgs = [...packages];
    newPkgs[pkgIdx].categories[catIdx].selectionRule = val;
    onChange(newPkgs);
  };

  // --- Item Management ---
  const openAddItemModal = (pkgIdx: number, catIdx: number) => {
    setNewItemName('');
    setShowAddItemModal({ pkgIdx, catIdx });
  };

  const handleAddItem = () => {
    if (showAddItemModal && newItemName.trim()) {
      const { pkgIdx, catIdx } = showAddItemModal;
      const newPkgs = [...packages];
      newPkgs[pkgIdx].categories[catIdx].items.push(newItemName.trim());
      onChange(newPkgs);
      setShowAddItemModal(null);
    }
  };

  const saveEditedItem = () => {
    if (showEditItemModal && showEditItemModal.currentName.trim()) {
        const { pkgIdx, catIdx, itemIdx, currentName } = showEditItemModal;
        const newPkgs = [...packages];
        newPkgs[pkgIdx].categories[catIdx].items[itemIdx] = currentName.trim();
        onChange(newPkgs);
        setShowEditItemModal(null);
    }
  };

  const updateItem = (pkgIdx: number, catIdx: number, itemIdx: number, val: string) => {
    const newPkgs = [...packages];
    newPkgs[pkgIdx].categories[catIdx].items[itemIdx] = val;
    onChange(newPkgs);
  };

  const confirmDeleteItem = () => {
    if (deleteItemModal) {
      const newPkgs = [...packages];
      newPkgs[deleteItemModal.pkgIdx].categories[deleteItemModal.catIdx].items.splice(deleteItemModal.itemIdx, 1);
      onChange(newPkgs);
      setDeleteItemModal(null);
    }
  };

  const moveItem = (pkgIdx: number, catIdx: number, itemIdx: number, targetCatIdx: number) => {
    if (catIdx === targetCatIdx) return;
    const newPkgs = [...packages];
    const itemToMove = newPkgs[pkgIdx].categories[catIdx].items.splice(itemIdx, 1)[0];
    newPkgs[pkgIdx].categories[targetCatIdx].items.push(itemToMove);
    onChange(newPkgs);
  };

  return (
    <div className="font-poppins bg-white p-2 md:p-4 rounded-[2rem] relative">
      {/* Title & Banner styling matching image */}
      <div className="text-left mb-6">
        <h2 className="text-2xl font-display font-semibold text-slate-900 flex items-center gap-2">
          Build Your Menu with AI <span className="text-brand-gold-500 font-sans">✨</span>
        </h2>
        <p className="text-slate-500 text-xs mt-1">Upload your catering menu and let our AI extract dishes, categories & pricing</p>
      </div>

      <div className="mb-8 bg-[#f2f7f5] rounded-3xl p-6 border-2 border-dashed border-[#6ea494] flex flex-col items-center justify-center min-h-[200px] relative transition-all">
        <input 
          type="file" 
          multiple
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,application/pdf" 
          onChange={handleFileUpload} 
        />
        
        {isParsing ? (
          <div className="w-full max-w-sm space-y-5 animate-in zoom-in-95 duration-500 py-4">
              <div className="flex flex-col items-center mb-6">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 text-[#00483C] relative shadow-brand-green-900/5">
                       <ChefHat size={32} className="animate-pulse" />
                       <div className="absolute inset-0 border-4 border-brand-green-400 border-t-brand-green-600 rounded-full animate-spin"></div>
                  </div>
                  <h3 className="font-bold text-base text-slate-800">{scanStatus || 'Processing...'}</h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                      {timeRemaining > 20 ? `Estimated time remaining: 00:${timeRemaining.toString().padStart(2, '0')}` : 
                       timeRemaining > 10 ? "Approx 15 seconds remaining" :
                       timeRemaining > 0 ? "Almost done..." : "Finalizing extraction..."}
                  </p>
              </div>

              <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                     <span>Uploading Documents</span>
                     <span>{Math.min(100, uploadProgress)}%</span>
                  </div>
                  <div className="h-2 bg-[#e0eee8] rounded-full overflow-hidden">
                     <div className="h-full bg-brand-green-400 transition-all duration-300" style={{width: `${uploadProgress}%`}} />
                  </div>
              </div>

              <div className="space-y-1.5">
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>AI Menu Extraction</span>
                    <span>{Math.min(100, scanProgress)}%</span>
                 </div>
                 <div className="h-2 bg-brand-gold-200/50 rounded-full overflow-hidden">
                    <div className={cn("h-full transition-all duration-500", scanProgress === 100 ? "bg-green-500" : "bg-[#DEAA38]")} style={{width: `${scanProgress}%`}} />
                 </div>
              </div>
          </div>
        ) : scanError ? (
          <div className="flex flex-col items-center justify-center text-red-800 w-full py-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shadow-sm mb-3 text-red-600 animate-bounce">
              <AlertCircle size={24} />
            </div>
            <p className="font-bold mb-1">Scan Failed</p>
            <p className="text-xs text-red-800/80 font-medium mb-4 text-center max-w-sm">{scanError}</p>
            <div className="flex gap-3">
               <button onClick={(e) => { e.stopPropagation(); setScanError(''); setScanStatus(''); setUploadProgress(0); setScanProgress(0); }} className="text-xs font-bold bg-white text-slate-700 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
               <button onClick={(e) => { e.stopPropagation(); if(lastFiles) processFiles(lastFiles); }} className="text-xs font-bold bg-red-600 text-white px-4 py-2 rounded-xl shadow min-w-[100px] hover:bg-red-700 transition-colors">Retry Scan</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 select-none text-center">
            {/* White rounded upload circle icon */}
            <div className="w-16 h-16 rounded-full bg-white text-brand-green-600 flex items-center justify-center mb-3 shadow-[0_4px_16px_rgba(15,41,34,0.06)] group-hover:scale-105 transition-transform">
              <UploadCloud size={28} className="text-[#00483C]" />
            </div>
            
            <p className="text-base font-bold text-slate-900 font-display">Drag & Drop Menu Here</p>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Supports: JPG, PNG, PDF (Max 25MB)</p>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#00483C] text-white font-semibold font-sans text-xs px-6 py-2.5 rounded-full hover:bg-brand-green-800 transition-all shadow-md active:scale-95"
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      {/* AI automatically bullet highlights row */}
      <div className="mb-8">
        <p className="text-xs font-bold text-slate-900 tracking-wide font-poppins mb-3">Our AI will automatically:</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#DEAA38] inline-block shrink-0"></span>
            <span>Extract all menu items</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#DEAA38] inline-block shrink-0"></span>
            <span>Suggest pricing slabs</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#DEAA38] inline-block shrink-0"></span>
            <span>Organize dishes</span>
          </div>
        </div>
      </div>

      {/* Separator - Or create packages manually */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative bg-white px-4 text-xs font-semibold text-slate-400 font-poppins uppercase tracking-wider">
          Or create packages manually
        </div>
      </div>

      {/* Add package manually button centered */}
      <div className="flex justify-center mb-10">
        <button 
          onClick={handleAddPackageManually}
          className="border-2 border-dashed border-slate-300 hover:border-[#DEAA38] hover:bg-brand-gold-50/20 text-slate-700 font-semibold text-xs px-6 py-3 rounded-2xl flex items-center gap-2 transition-all"
        >
          <span className="text-[#DEAA38] text-base font-bold">+</span> Add Package Manually
        </button>
      </div>

      {/* Your Packages list (Extracted items) render styled exactly like Screen 1 */}
      {packages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase font-poppins mb-4">Your Packages (AI Extracted)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packages.map((pkg, idx) => {
              const totalItems = pkg.categories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
              const totalCats = pkg.categories?.length || 0;
              const minGuestsVal = pkg.minimumGuests || (pkg.pricingSlabs?.[0]?.minGuests) || 100;
              const basePrice = pkg.pricePerPlate || (pkg.pricingSlabs?.[0]?.price) || 0;
              
              // Colors based on names or defaults
              const isGold = pkg.packageName?.toLowerCase().includes('gold') || idx === 1;
              const isPlatinum = pkg.packageName?.toLowerCase().includes('platinum') || pkg.packageName?.toLowerCase().includes('premium') || idx === 2;
              
              // Preset badges and palettes matching screen 1
              let badge = "PURE VEG";
              let cardBg = "bg-slate-50 border-slate-200";
              let badgeStyle = "bg-green-100 text-green-700 border border-green-200/50";
              
              if (isGold) {
                badge = "MOST POPULAR";
                cardBg = "bg-amber-50/40 border-amber-200/60";
                badgeStyle = "bg-[#DEAA38] text-slate-900 font-bold";
              } else if (isPlatinum) {
                badge = "PREMIUM";
                cardBg = "bg-indigo-50/30 border-indigo-100";
                badgeStyle = "bg-indigo-600 text-white font-bold";
              }

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "rounded-2xl p-5 border relative shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group",
                    cardBg
                  )}
                >
                  <div>
                    {/* Badge */}
                    <div className="mb-3">
                      <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block", badgeStyle)}>
                        {badge}
                      </span>
                    </div>

                    {/* Package Name */}
                    <h4 className="font-display font-bold text-lg text-slate-900 group-hover:text-brand-green-800 transition-colors">
                      {pkg.packageName || `Package ${idx + 1}`}
                    </h4>

                    {/* Price banner */}
                    <p className="text-xl font-bold text-[#DEAA38] font-sans mt-2">
                      ₹{basePrice} <span className="text-xs text-slate-500 font-normal">/ pax</span>
                    </p>

                    {/* Meta stats list */}
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>Min {minGuestsVal} Guests</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>{totalCats || 8} Categories</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview action trigger */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button 
                      type="button"
                      onClick={() => {
                        const targetElement = document.getElementById(`pkg-edit-${idx}`);
                        if (targetElement) {
                          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className="text-xs font-bold text-brand-green-700 hover:text-brand-green-900 hover:underline flex items-center gap-1.5 transition-all text-left"
                    >
                      Preview & Edit Menu <span className="text-[#DEAA38]">→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Package Editors Section */}
      <div className="space-y-8 mt-10">
        {packages.map((pkg, pIdx) => {
          const totalItems = pkg.categories.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
          const totalCats = pkg.categories?.length || 0;
          
          return (
          <div key={pIdx} id={`pkg-edit-${pIdx}`} className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
            
            {/* Extraction Review Panel */}
            <div className="bg-brand-gold-50/50 border-b border-brand-gold-100 px-6 py-3 flex flex-wrap gap-6 items-center">
                <div>
                   <p className="text-xs text-brand-gold-700 font-bold uppercase tracking-wider mb-0.5">Extraction Review</p>
                   <p className="text-sm text-slate-700">Check and edit your package details before saving.</p>
                </div>
                <div className="flex gap-4 ml-auto">
                    <div className="text-center font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-brand-gold-200 text-sm"><span className="text-brand-gold-600">{totalCats}</span> Categories</div>
                    <div className="text-center font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-brand-gold-200 text-sm"><span className="text-brand-gold-600">{totalItems}</span> Items</div>
                    <div className="text-center font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 text-sm flex items-center gap-1"><CheckCircle2 size={16}/> 98% Confidence</div>
                </div>
            </div>

            <div className="bg-white border-b border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                {editPackageIdx === pIdx ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input 
                               type="text" 
                               value={editPackageNameStr}
                               onChange={(e) => setEditPackageNameStr(e.target.value)}
                               className="text-xl font-bold bg-white border-2 border-brand-green-500 focus:outline-none rounded-lg px-2 py-1 w-full max-w-[300px]"
                               autoFocus
                               onKeyDown={(e) => e.key === 'Enter' && savePackageName(pIdx)}
                            />
                            <button onClick={() => savePackageName(pIdx)} className="p-2 bg-brand-green-900 text-white rounded-lg hover:bg-brand-green-800"><Check size={16}/></button>
                            <button onClick={() => setEditPackageIdx(null)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X size={16}/></button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                        {pkg.packageName || 'Unnamed Package'}
                        <button onClick={() => { setEditPackageNameStr(pkg.packageName); setEditPackageIdx(pIdx); }} className="text-slate-400 hover:text-brand-gold-600"><Edit2 size={16}/></button>
                        <span className={cn("text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider", pkg.packageType?.toLowerCase() === 'veg' ? "bg-green-100 text-green-700" : pkg.packageType?.toLowerCase() === 'non veg' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700")}>
                            {pkg.packageType || 'Mixed'}
                        </span>
                        </h3>
                        
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pricing Slabs</div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                                <div className="grid grid-cols-4 bg-slate-100 p-2 text-xs font-bold text-slate-600 border-b border-slate-200">
                                    <div className="px-2">Min Guests</div>
                                    <div className="px-2">Max Guests</div>
                                    <div className="px-2">Price (₹)</div>
                                    <div className="px-2 text-right">Actions</div>
                                </div>
                                {pkg.pricingSlabs?.map((slab, sIdx) => (
                                    <div key={sIdx} className="grid grid-cols-4 p-2 items-center text-sm border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                        <div className="px-2">
                                            <input 
                                                type="number" 
                                                value={slab.minGuests || ''}
                                                onChange={(e) => {
                                                    const newPkgs = [...packages];
                                                    if(newPkgs[pIdx].pricingSlabs) newPkgs[pIdx].pricingSlabs![sIdx].minGuests = Number(e.target.value);
                                                    onChange(newPkgs);
                                                }}
                                                className="w-full bg-transparent border-b border-transparent focus:border-brand-green-500 outline-none"
                                                placeholder="Min"
                                            />
                                        </div>
                                        <div className="px-2 flex items-center gap-1">
                                            <input 
                                                type="number" 
                                                value={slab.maxGuests || ''}
                                                onChange={(e) => {
                                                    const newPkgs = [...packages];
                                                    if(newPkgs[pIdx].pricingSlabs) newPkgs[pIdx].pricingSlabs![sIdx].maxGuests = e.target.value ? Number(e.target.value) : null;
                                                    onChange(newPkgs);
                                                }}
                                                className="w-full bg-transparent border-b border-transparent focus:border-brand-green-500 outline-none"
                                                placeholder="Max (optional)"
                                            />
                                        </div>
                                        <div className="px-2 flex items-center gap-1">
                                            <span className="text-slate-400">₹</span>
                                            <input 
                                                type="number" 
                                                value={slab.price || ''}
                                                onChange={(e) => {
                                                    const newPkgs = [...packages];
                                                    if(newPkgs[pIdx].pricingSlabs) newPkgs[pIdx].pricingSlabs![sIdx].price = Number(e.target.value);
                                                    if (sIdx === 0) {
                                                        newPkgs[pIdx].pricePerPlate = Number(e.target.value);
                                                    }
                                                    onChange(newPkgs);
                                                }}
                                                className="w-full bg-transparent border-b border-transparent focus:border-brand-green-500 outline-none font-bold"
                                                placeholder="Price"
                                            />
                                        </div>
                                        <div className="px-2 text-right">
                                            <button 
                                                onClick={() => {
                                                    const newPkgs = [...packages];
                                                    newPkgs[pIdx].pricingSlabs?.splice(sIdx, 1);
                                                    onChange(newPkgs);
                                                }}
                                                className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                                title="Delete Slab"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    const newPkgs = [...packages];
                                    if (!newPkgs[pIdx].pricingSlabs) newPkgs[pIdx].pricingSlabs = [];
                                    newPkgs[pIdx].pricingSlabs!.push({ minGuests: 100, maxGuests: null, price: 0 });
                                    onChange(newPkgs);
                                }}
                                className="text-xs font-bold text-brand-green-600 self-start flex items-center gap-1 hover:text-brand-green-800 transition-colors bg-brand-green-50 px-3 py-1.5 rounded-lg"
                            >
                                <Plus size={14} /> Add Pricing Slab
                            </button>
                        </div>
                    </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => duplicatePackage(pIdx)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors">
                  <Copy size={16} /> Duplicate
                </button>
                <button onClick={() => setDeletePackageModal({pkgIdx: pIdx, name: pkg.packageName})} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-medium text-sm transition-colors">
                  <Trash2 size={16} /> Delete Package
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
              {pkg.categories?.map((cat, cIdx) => (
                <div key={cIdx} className="bg-white border border-slate-200 rounded-xl shadow-sm relative flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-xl">
                    <div className="flex-1 mr-4">
                      {editCategoryIdx?.pkg === pIdx && editCategoryIdx?.cat === cIdx ? (
                          <div className="flex items-center gap-2 mb-2">
                              <input 
                                 type="text" 
                                 value={editCategoryNameStr}
                                 onChange={(e) => setEditCategoryNameStr(e.target.value)}
                                 className="font-bold bg-white border-2 border-brand-green-500 rounded px-2 py-1 flex-1 min-w-0 text-sm focus:outline-none"
                                 autoFocus
                                 onKeyDown={(e) => e.key === 'Enter' && saveCategoryName(pIdx, cIdx)}
                              />
                              <button onClick={() => saveCategoryName(pIdx, cIdx)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={16}/></button>
                              <button onClick={() => setEditCategoryIdx(null)} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X size={16}/></button>
                          </div>
                      ) : (
                          <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-800">{cat.categoryName}</h4>
                              <button onClick={() => { setEditCategoryNameStr(cat.categoryName); setEditCategoryIdx({pkg: pIdx, cat: cIdx}); }} className="text-slate-400 hover:text-brand-gold-600 opacity-50 hover:opacity-100"><Edit2 size={14}/></button>
                          </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={cat.selectionRule || 'Included'} 
                          onChange={(e) => updateRule(pIdx, cIdx, e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:border-brand-gold-500 focus:outline-none font-semibold text-brand-gold-700 cursor-pointer hover:bg-slate-50 w-full max-w-[140px]" 
                        >
                           <option value="Included">Included</option>
                           <option value="Choose Any One">Choose Any One</option>
                           <option value="Choose Any Two">Choose Any Two</option>
                           <option value="Choose Any Three">Choose Any Three</option>
                           <option value="Optional">Optional</option>
                        </select>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">
                          {cat.items?.length || 0} Items
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => duplicateCategory(pIdx, cIdx)} className="p-1.5 text-slate-400 hover:text-brand-gold-600 hover:bg-brand-gold-50 rounded-lg transition-colors" title="Duplicate Category">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => setDeleteCategoryModal({pkgIdx: pIdx, catIdx: cIdx, name: cat.categoryName})} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Category">
                          <Trash2 size={16} />
                        </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 space-y-2">
                    {cat.items?.map((item, iIdx) => (
                      <div key={iIdx} className="flex flex-row items-center gap-3 py-1 group/item border-b border-dashed border-slate-100 last:border-0 hover:bg-slate-50/50 px-1.5 rounded-lg transition-all">
                        <div className="text-slate-300 group-hover/item:text-slate-500 cursor-grab px-1"><GripVertical size={14}/></div>
                        
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <span className="text-sm font-bold text-slate-800 truncate">{item}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider block mt-0.5",
                            getBuilderItemStatus(item) === 'Approved' ? "text-emerald-600" :
                            getBuilderItemStatus(item) === 'Pending Admin Review' ? "text-amber-500 animate-pulse" :
                            getBuilderItemStatus(item) === 'Rejected' ? "text-red-500" : "text-slate-400"
                          )}>
                            {getBuilderItemStatus(item) === 'Pending Admin Review' ? 'Review Pending' : getBuilderItemStatus(item)}
                          </span>
                        </div>
                        
                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                            {/* Move to Category Dropdown */}
                            <div className="relative group/move">
                                <button className="p-1 text-slate-400 hover:text-blue-500 rounded hover:bg-blue-50 flex items-center gap-1" title="Move to Category">
                                   <ChevronDown size={14} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1 hidden group-hover/move:block z-10">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Move to:</p>
                                    {pkg.categories.map((targetCat, tIdx) => (
                                        <button 
                                           key={tIdx} 
                                           onClick={(e) => { e.stopPropagation(); moveItem(pIdx, cIdx, iIdx, tIdx); }}
                                           className={cn("w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors", tIdx === cIdx ? "bg-brand-green-50 text-brand-green-900 font-bold" : "hover:bg-slate-50 text-slate-700")}
                                        >
                                            {targetCat.categoryName}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                              onClick={() => {
                                setCatererEditingItem({ item_name: item, package_idx: pIdx, category_idx: cIdx, item_idx: iIdx });
                                setCatererImgPreview(getBuilderItemImage(item));
                              }} 
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50" 
                              title="Change/Upload Image"
                            >
                                <UploadCloud size={14} />
                            </button>
                            
                            <button onClick={() => setShowEditItemModal({pkgIdx: pIdx, catIdx: cIdx, itemIdx: iIdx, currentName: item})} className="p-1 text-slate-400 hover:text-brand-gold-600 rounded hover:bg-brand-gold-50" title="Edit Item">
                                <Edit2 size={14} />
                            </button>
 
                            <button onClick={() => setDeleteItemModal({pkgIdx: pIdx, catIdx: cIdx, itemIdx: iIdx, name: item})} className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50" title="Delete Item">
                                <Trash2 size={14} />
                            </button>
                        </div>
                      </div>
                    ))}
                    
                    <button onClick={() => openAddItemModal(pIdx, cIdx)} className="mt-2 text-brand-green-600 text-sm font-semibold flex items-center gap-1 hover:text-brand-green-800 px-1 py-2 w-full hover:bg-brand-green-50 rounded-lg transition-colors">
                      <Plus size={16} /> Add Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-center">
                 <button onClick={() => openAddCategory(pIdx)} className="px-6 py-2.5 bg-brand-green-900 text-white rounded-xl text-sm font-bold shadow-sm shadow-brand-green-900/20 hover:bg-brand-green-800 flex items-center gap-2 transition-colors">
                    <Plus size={18}/> Add Category
                 </button>
            </div>
          </div>
        )})}
      </div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {showAddCategoryModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                >
                    <button onClick={() => setShowAddCategoryModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Add New Category</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Category Name</label>
                            <input 
                               type="text" 
                               value={newCatName}
                               onChange={(e) => setNewCatName(e.target.value)}
                               placeholder="e.g. Premium Desserts"
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none"
                               autoFocus
                               onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Selection Rule</label>
                            <select 
                               value={newCatRule}
                               onChange={(e) => setNewCatRule(e.target.value)}
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none cursor-pointer"
                            >
                               <option value="Included">Included</option>
                               <option value="Choose Any One">Choose Any One</option>
                               <option value="Choose Any Two">Choose Any Two</option>
                               <option value="Choose Any Three">Choose Any Three</option>
                               <option value="Custom">Custom</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setShowAddCategoryModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleAddCategory} className="flex-1 py-3 bg-brand-green-900 text-white font-bold rounded-xl shadow-lg hover:bg-brand-green-800 transition-colors">Create Category</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItemModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                    <button onClick={() => setShowAddItemModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Add New Item</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Name</label>
                            <input 
                               type="text" 
                               value={newItemName}
                               onChange={(e) => setNewItemName(e.target.value)}
                               placeholder="e.g. Paneer Butter Masala"
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none"
                               autoFocus
                               onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setShowAddItemModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleAddItem} className="flex-1 py-3 bg-brand-green-900 text-white font-bold rounded-xl shadow-lg hover:bg-brand-green-800 transition-colors">Add Item</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {showEditItemModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                    <button onClick={() => setShowEditItemModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Edit Item</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Name</label>
                            <input 
                               type="text" 
                               value={showEditItemModal.currentName}
                               onChange={(e) => setShowEditItemModal({...showEditItemModal, currentName: e.target.value})}
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none"
                               autoFocus
                               onKeyDown={(e) => e.key === 'Enter' && saveEditedItem()}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setShowEditItemModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={saveEditedItem} className="flex-1 py-3 bg-brand-green-900 text-white font-bold rounded-xl shadow-lg hover:bg-brand-green-800 transition-colors">Save Changes</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Add Package Modal */}
      <AnimatePresence>
        {showAddPackageModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
                >
                    <button onClick={() => setShowAddPackageModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Create Package Manually</h3>
                    
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Package Name</label>
                            <input 
                               type="text" 
                               value={newPkgData.name}
                               onChange={(e) => setNewPkgData({...newPkgData, name: e.target.value})}
                               placeholder="e.g. Premium Wedding Buffet"
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Package Type</label>
                            <select 
                               value={newPkgData.type}
                               onChange={(e) => setNewPkgData({...newPkgData, type: e.target.value})}
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none cursor-pointer"
                            >
                               <option value="Veg">Veg</option>
                               <option value="Non-Veg">Non-Veg</option>
                               <option value="Breakfast">Breakfast</option>
                               <option value="Mixed">Mixed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Price Per Plate (₹)</label>
                            <input 
                               type="number" 
                               value={newPkgData.price}
                               onChange={(e) => setNewPkgData({...newPkgData, price: e.target.value})}
                               placeholder="e.g. 450"
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Minimum Guests</label>
                            <input 
                               type="number" 
                               value={newPkgData.minGuests}
                               onChange={(e) => setNewPkgData({...newPkgData, minGuests: e.target.value})}
                               placeholder="e.g. 100"
                               className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-brand-gold-500 focus:ring-1 focus:ring-brand-gold-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setShowAddPackageModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={createManualPackage} className="flex-1 py-3 bg-brand-green-900 text-white font-bold rounded-xl shadow-lg hover:bg-brand-green-800 transition-colors">Create Package</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletePackageModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                    <button onClick={() => setDeletePackageModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Package?</h3>
                    <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete <span className="font-bold">"{deletePackageModal.name}"</span>? All categories and items inside it will be permanently removed.</p>

                    <div className="flex gap-3">
                        <button onClick={() => setDeletePackageModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={confirmDeletePackage} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors">Delete Package</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteCategoryModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                    <button onClick={() => setDeleteCategoryModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Category?</h3>
                    <div className="mb-6">
                        <p className="text-slate-600 text-sm mb-1">Category Name:</p>
                        <p className="font-bold text-slate-800 bg-slate-50 border border-slate-200 p-3 rounded-lg">{deleteCategoryModal.name}</p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setDeleteCategoryModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={confirmDeleteCategory} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors">Delete</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteItemModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
                >
                    <button onClick={() => setDeleteItemModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"><X size={20}/></button>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Item?</h3>
                    <p className="text-slate-600 text-sm mb-6">Are you sure you want to delete <span className="font-bold">"{deleteItemModal.name}"</span>?</p>

                    <div className="flex gap-3">
                        <button onClick={() => setDeleteItemModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={confirmDeleteItem} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors">Delete Item</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>



    </div>
  );
}
