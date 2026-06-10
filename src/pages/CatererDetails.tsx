import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Star, Phone, MessageCircle, ChevronLeft, ChevronRight, Check, CheckCircle2, ChevronDown, ImageIcon, Mail, ShieldCheck, Award, Users, ChefHat, X, CalendarDays, Building, Clock, Briefcase, PlayCircle, BookOpen, Map, Heart, LayoutGrid, Package, MenuSquare, FileText, User } from 'lucide-react';
import { DEMO_REVIEWS, DEMO_CATERERS } from '../data';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

// Highly polished, realistic decorative crown vector asset to perfectly mimic the image design
const CrownOrnament = ({ theme }: { theme: 'silver' | 'gold' | 'platinum' | 'premium' | 'royal' | 'grand' }) => {
  let baseColor = '#DEAA38'; // Gold color matching the palette
  let gradStart = '#FFEAA7';
  let gradEnd = '#8A640F';
  
  if (theme === 'silver') {
    baseColor = '#A0AEC0'; // Silver
    gradStart = '#FFFFFF';
    gradEnd = '#4A5568';
  } else if (theme === 'platinum') {
    baseColor = '#CBD5E0'; // Platinum
    gradStart = '#FFFFFF';
    gradEnd = '#64748B';
  } else if (theme === 'premium') {
    baseColor = '#D4AF37'; // Rose gold base with ruby highlight
    gradStart = '#FFF2F2';
    gradEnd = '#8B0000';
  } else if (theme === 'royal' || theme === 'grand') {
    baseColor = '#DEAA38';
    gradStart = '#FFF9E6';
    gradEnd = '#A27008';
  }

  return (
    <div className="absolute -top-[23px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none pointer-events-none">
      {/* Glowing backdrop shadow */}
      <div className={cn(
        "absolute -inset-1 rounded-full blur-[8px] opacity-35 -z-10",
        theme === 'gold' || theme === 'royal' || theme === 'grand' ? "bg-amber-400/45" :
        theme === 'premium' ? "bg-red-400/35" : "bg-slate-300/35"
      )} />
      
      {/* SVG Crown Vector mirroring the elegant curls from the design image */}
      <svg width="64" height="42" viewBox="0 0 100 68" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.22)]">
        <defs>
          <linearGradient id={`crown-grad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="45%" stopColor={baseColor} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id="gold-glowing-jewel">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Crown Body with arches */}
        <path 
          d="M15 60 L8 28 L32 42 L50 14 L68 42 L92 28 L85 60 Z" 
          fill={`url(#crown-grad-${theme})`} 
          stroke={theme === 'silver' ? '#718096' : '#AA7C11'} 
          strokeWidth="1.5"
          strokeLinejoin="round" 
        />
        
        {/* Velvet interior cushion backing */}
        <path 
          d="M17 60 C25 44, 75 44, 83 60 Z" 
          fill={theme === 'premium' ? '#991B1B' : theme === 'royal' || theme === 'grand' ? '#451A03' : '#1E293B'} 
          opacity="0.25" 
        />
        
        {/* Velvet cushion bar */}
        <path 
          d="M12 56 C12 56, 50 61, 88 56" 
          stroke={theme === 'silver' ? '#CBD5E0' : '#DEAA38'} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Master headband bottom */}
        <rect x="15" y="58" width="70" height="6" fill={`url(#crown-grad-${theme})`} rx="2" stroke={theme === 'silver' ? '#4A5568' : '#8A640F'} strokeWidth="1" />
        
        {/* Small ruby/diamond decals in bands */}
        <circle cx="26" cy="61" r="1.5" fill="#FFF" />
        <circle cx="38" cy="61" r="1.5" fill={theme === 'premium' ? '#F43F5E' : '#DEAA38'} />
        <circle cx="50" cy="61" r="1.5" fill="#FFF" />
        <circle cx="62" cy="61" r="1.5" fill={theme === 'premium' ? '#F43F5E' : '#DEAA38'} />
        <circle cx="74" cy="61" r="1.5" fill="#FFF" />

        {/* Floating peak jewels */}
        <circle cx="8" cy="28" r="4.5" fill="#FFF" stroke={theme === 'silver' ? '#718096' : '#D4AF37'} strokeWidth="1" filter="url(#gold-glowing-jewel)" />
        <circle cx="50" cy="14" r="5.5" fill="#FFFDF0" stroke={theme === 'silver' ? '#718096' : '#D4AF37'} strokeWidth="1.2" filter="url(#gold-glowing-jewel)" />
        <circle cx="92" cy="28" r="4.5" fill="#FFF" stroke={theme === 'silver' ? '#718096' : '#D4AF37'} strokeWidth="1" filter="url(#gold-glowing-jewel)" />
        
        {/* Side mini peak jewels */}
        <circle cx="32" cy="42" r="2.5" fill={theme === 'premium' ? '#EF4444' : '#60A5FA'} />
        <circle cx="68" cy="42" r="2.5" fill={theme === 'premium' ? '#EF4444' : '#60A5FA'} />
      </svg>
    </div>
  );
};

// Decorative Luxury Divider Line
const LuxuryDivider = () => (
  <div className="flex items-center gap-1.5 my-4">
    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/45 to-[#D4AF37]/20"></div>
    <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]"></div>
    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/45 to-[#D4AF37]/10"></div>
  </div>
);

// Helper to reliably split achievement text into a bold number and a dark label
const getAchievementParts = (ach: string) => {
  const normalized = ach.toLowerCase();
  if (normalized.includes('5000') || normalized.includes('5,000')) {
    return { number: '5,000+', label: 'Successful Events' };
  }
  if (normalized.includes('100,000') || normalized.includes('1,00,000') || normalized.includes('100000')) {
    return { number: '100,000+', label: 'Happy Customers' };
  }
  if (normalized.includes('150')) {
    return { number: '150+', label: 'Expert Professionals' };
  }
  if (normalized.includes('10') && (normalized.includes('year') || normalized.includes('trust'))) {
    return { number: '10+', label: 'Years of Trust' };
  }
  
  // Fallback regex parsing
  const matchNum = ach.match(/(\d[\d,kKmM+]*\+?)/);
  if (matchNum) {
    const num = matchNum[0];
    const label = ach.replace(num, '').replace(/^[-\s:text]+/, '').trim();
    return { number: num, label: label || 'Achieved' };
  }
  return { number: '✦', label: ach };
};

// Deluxe 3D Golden Medal award emblem
const GoldMedalIcon = ({ title, isShield = false }: { title: string; isShield?: boolean }) => (
  <div className="flex flex-col items-center text-center">
    <div className="relative w-24 h-24 mb-3 drop-shadow-[0_8px_16px_rgba(212,175,55,0.25)] hover:scale-105 transition-transform duration-300">
      {/* Outer subtle glow */}
      <div className="absolute inset-2 bg-[#D4AF37]/15 rounded-full blur-md"></div>
      
      <svg className="w-full h-full relative z-10" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2D1" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#AA7C11" />
            <stop offset="100%" stopColor="#FFF2D1" />
          </linearGradient>
        </defs>
        
        {/* Ribbon decoration behind the medal */}
        <path d="M35 48 L22 84 L38 77 L50 84 L45 48" fill="#0F3D2E" stroke="#D4AF37" strokeWidth="1" />
        <path d="M65 48 L78 84 L62 77 L50 84 L55 48" fill="#0F3D2E" stroke="#D4AF37" strokeWidth="1" />
        <path d="M38 48 L27 82 L38 76 L45 82 L43 48" fill="#D4AF37" opacity="0.6" />
        <path d="M62 48 L73 82 L62 76 L55 82 L57 48" fill="#D4AF37" opacity="0.6" />
        
        {/* Main Medal border */}
        <circle cx="50" cy="42" r="32" fill="url(#gold-metallic)" stroke="#FFF" strokeWidth="1" />
        {/* Inner medal ring */}
        <circle cx="50" cy="42" r="27" fill="#0F3D2E" stroke="url(#gold-metallic)" strokeWidth="2" />
        {/* Outer dotted accent circle */}
        <circle cx="50" cy="42" r="23" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="2 2" />
        
        {/* Central Icon */}
        {isShield ? (
          <path 
            d="M50 25 L65 30 L65 45 Q65 58 50 63 Q35 58 35 45 L35 30 Z" 
            fill="url(#gold-metallic)" 
            stroke="#FFF" 
            strokeWidth="0.5" 
          />
        ) : (
          <path 
            d="M50 24 L54 33 Q55 35 57 35 L67 35 L58 41 Q57 42 58 44 L61 53 L52 47 Q50 46 48 47 L39 53 L42 44 Q43 42 42 41 L33 35 L43 35 Q45 35 46 33 Z" 
            fill="url(#gold-metallic)" 
          />
        )}
        
        {/* Laurels at bottom */}
        <path d="M28 42 Q28 55 50 55 Q72 55 72 42" fill="none" stroke="url(#gold-metallic)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
    
    <span className="font-sans font-bold text-[#1C1C1C] text-xs leading-tight max-w-[150px]">
      {title}
    </span>
  </div>
);

export default function CatererDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [caterer, setCaterer] = useState<any>(null);
  
  useEffect(() => {
     let allCaterers = [...DEMO_CATERERS];
     const raw = localStorage.getItem('registrations');
     if(raw) {
         try {
           const allRegs = JSON.parse(raw);
           const regMapped = allRegs.map((r: any) => ({
                 ...r,
                 id: r.id,
                 name: r.businessName,
                 location: r.location || 'Banjara Hills', 
                 type: r.type || 'Veg + Non-Veg',
                 startingPrice: 350,
                 rating: 4.8,
                 reviewCount: 12,
                 description: r.description || 'Welcome to our premium catering service.',
                 images: r.images || [],
                 logo: r.logo || '',
                 address: r.address || r.location || 'Hyderabad, Telangana',
                 phone: r.phone || '+91 98765 43210',
                 menus: [],
                 menuPackages: r.menuPackages || r.packages || [],
                 packages: r.packages || r.menuPackages || [],
                 menuItems: r.menuItems || [],
                 coverBanner: r.coverBanner,
                 ownerPhoto: r.ownerPhoto,
                 ownerName: r.owner || 'Business Owner',
                 galleryPhotos: r.galleryPhotos || [],
                 achievements: r.achievements,
                 awards: r.awards,
                 teamPhotos: r.teamPhotos || [],
                 kitchenPhotos: r.kitchenPhotos || [],
                 specializations: r.specializations || (r.serviceAreas ? [] : null)
           }));
           allCaterers = [...allCaterers, ...regMapped];
         } catch(e) {}
     }
     
     const found = allCaterers.find(c => c.id === id);
     if (found) {
         setCaterer(found);
     }
  }, [id]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [activeGalleryTab, setActiveGalleryTab] = useState('All');
  const [guestCount, setGuestCount] = useState(100);
  const [activeTab, setActiveTab] = useState('Overview');

  const handleTabClick = (tab: string) => {
      setActiveTab(tab);
      if (tab === 'Overview') {
          document.getElementById('overview-section')?.scrollIntoView({ behavior: 'smooth' });
       } else if (tab === 'Packages' || tab === 'Menu') {
          document.getElementById('menu-packages')?.scrollIntoView({ behavior: 'smooth' });
       } else if (tab === 'Gallery') {
          document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
       } else if (tab === 'Reviews') {
          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
       } else if (tab === 'About Us') {
          document.getElementById('founder-info')?.scrollIntoView({ behavior: 'smooth' });
       }
  };

  if (!caterer) return <div className="min-h-screen pt-32 pb-24 text-center text-slate-500 font-medium">Loading Caterer Profile...</div>;

  const fallbackBanner = caterer.coverBanner || (caterer.images && caterer.images[0]) || '';
  const fallbackOwnerPhoto = caterer.ownerPhoto || '';
  const allGalleryPhotos = [
      ...(caterer.galleryPhotos || caterer.images || []),
      ...(caterer.kitchenPhotos || []),
      ...(caterer.teamPhotos || [])
  ];
  
  const openLightbox = (images: string[], index: number) => {
      setLightboxImages(images);
      setLightboxIndex(index);
      setLightboxOpen(true);
  };
  
  const nextLightboxEvent = (e: React.MouseEvent) => {
      e.stopPropagation();
      setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };
  
  const prevLightboxEvent = (e: React.MouseEvent) => {
      e.stopPropagation();
      setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  let packageTiers: any[] = [];
  if (caterer.menuPackages && caterer.menuPackages.length > 0) {
      packageTiers = caterer.menuPackages.map((pkg: any, idx: number) => {
          const sorted = pkg.pricingSlabs ? [...pkg.pricingSlabs].sort((a:any, b:any) => a.minGuests - b.minGuests) : [];
          const priceValue = sorted.length ? sorted[0].price : (pkg.pricePerPlate || (caterer.startingPrice || 350) + (idx * 150));
          const minGuestsValue = sorted.length ? sorted[0].minGuests : (pkg.minimumGuests || 50);
          
          const themeIndex = idx % 6;
          const themes: ('silver' | 'gold' | 'platinum' | 'premium' | 'royal' | 'grand')[] = ['silver', 'gold', 'platinum', 'premium', 'royal', 'grand'];
          const theme = themes[themeIndex];
          
          return {
              id: idx,
              name: pkg.packageName || (themeIndex === 0 ? 'Silver Package' : themeIndex === 1 ? 'Gold Package' : themeIndex === 2 ? 'Platinum Package' : themeIndex === 3 ? 'Premium Package' : themeIndex === 4 ? 'Royal Package' : 'Grand Royal'),
              type: pkg.packageType === 'Veg' ? 'veg' : 'nonVeg',
              price: priceValue,
              guests: minGuestsValue,
              categoriesCount: pkg.categories?.length || (themeIndex === 0 ? 6 : themeIndex === 1 ? 7 : themeIndex === 2 ? 8 : themeIndex === 3 ? 10 : themeIndex === 4 ? 12 : 14),
              selectItems: themeIndex < 3 ? 'Select Any 1 Item' : 'Select Any 2 Items',
              theme: theme,
              desc: pkg.description || `Special selection for your guests.`,
              popular: themeIndex === 4
          };
      });
  } else {
      packageTiers = [
          { id: 'v_silver', name: 'Silver Package', type: 'veg', price: caterer.startingPrice || 350, guests: 100, categoriesCount: 6, selectItems: 'Select Any 1 Item', theme: 'silver', desc: 'Simple & elegant vegetarian spread for family gatherings.' },
          { id: 'v_gold', name: 'Gold Package', type: 'veg', price: (caterer.startingPrice || 350) + 100, guests: 150, categoriesCount: 7, selectItems: 'Select Any 1 Item', theme: 'gold', desc: 'Slightly richer premium veg spread with extra paneer delicacies.' },
          { id: 'v_platinum', name: 'Platinum Package', type: 'veg', price: (caterer.startingPrice || 350) + 250, guests: 200, categoriesCount: 8, selectItems: 'Select Any 1 Item', theme: 'platinum', desc: 'Ultra luxury premium veg spread for signature events.' },
          { id: 'nv_premium', name: 'Premium Package', type: 'nonVeg', price: (caterer.startingPrice || 350) + 450, guests: 150, categoriesCount: 10, selectItems: 'Select Any 2 Items', theme: 'premium', desc: 'Classic non-veg catering with double choice meat courses.' },
          { id: 'nv_royal', name: 'Royal Package', type: 'nonVeg', price: (caterer.startingPrice || 350) + 750, guests: 200, categoriesCount: 12, selectItems: 'Select Any 2 Items', theme: 'royal', desc: 'Exquisite regal non-veg banquet for elite wedding celebrations.', popular: true },
          { id: 'nv_grand', name: 'Grand Royal', type: 'nonVeg', price: (caterer.startingPrice || 350) + 1150, guests: 250, categoriesCount: 14, selectItems: 'Select Any 2 Items', theme: 'grand', desc: 'The ultimate royal banquet with exotic seafood, mutton, and dessert options.' }
      ];
  }

  const specializations = caterer.specializations || ['Wedding Catering', 'Birthday Parties', 'Corporate Events', 'Housewarming', 'Live Counters'];
  const achievementsList = caterer.achievements ? caterer.achievements.split(',').map((s: string) => s.trim()) : ['5000+ Successful Events', '1,00,000+ Happy Customers', 'Expert Team of 150+ Professionals', '10+ Years of Customer Trust'];
  const awardsList = caterer.awards ? caterer.awards.split(',').map((s: string) => s.trim()) : ['Best Wedding Caterer', 'Excellence in Catering'];
  const branchesList = caterer.branches ? caterer.branches.toString().split(',') : ['Head Office'];
  const serviceAreasList = caterer.serviceAreas ? caterer.serviceAreas.split(',').map((s: string) => s.trim()) : [`${caterer.city || 'Hyderabad'} and surrounding areas.`];
  const operatingHours = caterer.operatingHours || 'Monday - Sunday\n6:00 AM - 11:00 PM\n(Open on all holidays)';

  return (
    <div className="bg-[#FAF8F3] min-h-screen">
      {/* Lightbox */}
      <AnimatePresence>
          {lightboxOpen && (
              <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm"
                  onClick={() => setLightboxOpen(false)}
              >
                  <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors" onClick={() => setLightboxOpen(false)}>
                      <X size={32} />
                  </button>
                  <button className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4" onClick={prevLightboxEvent}>
                      <ChevronLeft size={48} strokeWidth={1} />
                  </button>
                  
                  <motion.img 
                      key={lightboxIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      src={lightboxImages[lightboxIndex]}
                      className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
                      alt="Gallery"
                  />
                  
                  <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4" onClick={nextLightboxEvent}>
                      <ChevronRight size={48} strokeWidth={1} />
                  </button>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 tracking-widest text-sm font-medium">
                      {lightboxIndex + 1} / {lightboxImages.length}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* SECTION 1: HERO CONTAINER WITH INTEGRATED COVER BANNER */}
      <div className="relative w-full bg-[#0B3D2E] text-white pt-6 pb-12 mt-[72px] rounded-b-[3.5rem] border-b-4 border-[#D4A437]/25 shadow-[0_15px_40px_rgba(11,61,46,0.15)] overflow-hidden">
          {/* Background Cover Banner - Lighter 80% opacity to remain vibrant and visible */}
          <div className="absolute inset-0 z-0">
              {fallbackBanner ? (
                  <img src={fallbackBanner} alt={caterer.name} className="w-full h-full object-cover opacity-80" />
              ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0B3D2E]/80 to-[#124f3c]/80 flex items-center justify-center">
                      <ImageIcon className="text-[#D4A437]/25 w-32 h-32" />
                  </div>
              )}
              {/* Left Side Banner Overlay - smooth dark gradient only on the left side, keeping the right vibrant */}
              <div 
                  className="absolute inset-0" 
                  style={{
                      background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 25%, rgba(0,0,0,0.15) 55%, transparent 100%)'
                  }}
              />
          </div>
          
          <div className="relative z-10 max-w-[1600px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
              {/* Top Row: Navigation buttons */}
              <div className="flex justify-between items-center w-full mb-8">
                   <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold transition-all w-fit border border-white/10 shadow-sm text-xs cursor-pointer hover:scale-105 active:scale-95">
                       <ChevronLeft size={16} /> Back to Caterers
                   </button>
                   <div className="flex gap-2">
                       <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold transition-all w-fit border border-white/10 shadow-sm text-xs cursor-pointer hover:scale-105 active:scale-95">
                           Share
                       </button>
                       <button className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-md text-red-500 rounded-full transition-all border border-white/10 shadow-sm cursor-pointer hover:scale-105 active:scale-95">
                           <Heart size={16} className="fill-red-500 stroke-red-500" />
                       </button>
                   </div>
              </div>

              {/* Identity Row */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mt-4 mb-4">
                  {/* Left Section: Glassmorphism Dark Blur Panel */}
                  <div 
                      className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:py-6 md:px-8 rounded-[20px] border border-[#D4A437]/25 w-full lg:max-w-[75%] xl:max-w-[70%] shadow-[0_12px_42px_rgba(0,0,0,0.35)] text-center md:text-left"
                      style={{
                          background: 'rgba(0,0,0,0.35)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                      }}
                  >
                      {/* Round Logo card without wreath ornaments (flawless premium design) */}
                      <div className="shrink-0 select-none">
                          {/* White logo rounded card background */}
                          <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-white rounded-full p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.25),_0_0_15px_rgba(212,164,55,0.15)] border-4 border-[#D4A437] flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-300">
                              {caterer.logo ? (
                                  <img src={caterer.logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                  <span className="font-display font-medium text-[#0B3D2E] text-4xl uppercase tracking-wider">{caterer.name.substring(0,2)}</span>
                              )}
                          </div>
                      </div>
                      
                      {/* Premium Typography & Details Stack with natural wrapping */}
                      <div className="flex-1 text-left">
                          <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-display font-bold text-white tracking-wide uppercase drop-shadow-md leading-tight max-w-xl select-text">
                              {caterer.name}{" "}
                              {caterer.status === 'Approved' && (
                                  <span className="inline-flex items-center align-middle bg-[#10B981] text-white rounded-full p-1 shadow-lg shrink-0 border border-white/15 select-none w-5 h-5 ml-1.5" title="Verified Caterer">
                                      <Check size={11} className="text-white stroke-[4]" />
                                  </span>
                              )}
                          </h1>
                          
                          {/* Location & Details Area */}
                          <div className="flex items-center gap-1.5 text-slate-100/95 hover:text-white font-medium text-xs sm:text-sm mt-3 transition-colors">
                              <MapPin size={14} className="text-[#D4A437]" /> 
                              <span>{caterer.address || caterer.location}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-slate-200 text-xs sm:text-sm font-semibold mt-2">
                              <div className="flex items-center gap-1.5">
                                  <Star size={14} className="fill-[#D4A437] stroke-[#D4A437]" /> 
                                  <span className="font-extrabold text-[#D4A437]">{caterer.rating || '4.9'}</span> 
                                  <span className="text-slate-300 font-medium">({caterer.reviewCount || '120'} Reviews)</span>
                              </div>
                              <span className="text-white/20 hidden sm:inline">|</span>
                              <span className="text-slate-200">
                                  800+ Events Completed
                              </span>
                          </div>
                      </div>
                  </div>

                  {/* Right Section: Explore Menu button */}
                  <div className="w-full lg:w-auto shrink-0 flex justify-center mt-4 lg:mt-0 pb-1 lg:pb-0">
                      <button 
                          onClick={() => {
                              document.getElementById('menu-packages')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full sm:w-auto px-10 py-4 bg-[#D4A437] hover:bg-[#E0B84C] text-white font-black tracking-widest text-xs uppercase rounded-2xl border border-[rgba(212,164,55,0.4)] shadow-[0_4px_20px_rgba(212,164,55,0.35),0_10px_25px_rgba(212,164,55,0.2)] flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-[2px] active:scale-95 group/btn cursor-pointer font-sans"
                      >
                          <BookOpen size={16} className="text-white group-hover/btn:scale-110 transition-transform" />
                          BOOK NOW
                      </button>
                  </div>
              </div>

              {/* Premium Statistics Strip */}
              <div className="w-full mt-10">
                  <div className="bg-[#0B3D2E]/95 backdrop-blur-md rounded-3xl lg:rounded-full border border-[#D4A437]/30 shadow-[0_12px_40px_rgba(11,61,46,0.35),_0_0_15px_rgba(212,164,55,0.15)] px-6 py-5 lg:py-4 lg:px-10 flex flex-wrap lg:flex-nowrap items-center justify-between text-white gap-4 lg:gap-2">
                      <div className="flex items-center gap-3 w-[45%] lg:w-auto">
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/5 text-[#D4A437]">
                              <Award size={18} className="stroke-[2.5]" />
                          </div>
                          <div className="text-left">
                              <div className="font-extrabold text-sm lg:text-base text-white leading-tight">{caterer.experience || '10+'} Years</div>
                              <div className="text-[10px] text-[#D4A437] uppercase tracking-wider font-extrabold font-sans">Experience</div>
                          </div>
                      </div>

                      <div className="hidden lg:block w-px h-8 bg-[#D4A437]/20"></div>

                      <div className="flex items-center gap-3 w-[45%] lg:w-auto">
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/5 text-[#D4A437]">
                              <Users size={18} />
                          </div>
                          <div className="text-left">
                              <div className="font-extrabold text-sm lg:text-base text-white leading-tight">800+ Events</div>
                              <div className="text-[10px] text-[#D4A437] uppercase tracking-wider font-extrabold font-sans font-sans">Completed</div>
                          </div>
                      </div>

                      <div className="hidden lg:block w-px h-8 bg-[#D4A437]/20"></div>

                      <div className="flex items-center gap-3 w-[45%] lg:w-auto">
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/5 text-[#D4A437]">
                              <CheckCircle2 size={18} />
                          </div>
                          <div className="text-left">
                              <div className="font-extrabold text-sm lg:text-base text-white leading-tight">100% Customer</div>
                              <div className="text-[10px] text-[#D4A437] uppercase tracking-wider font-extrabold font-sans">Satisfaction</div>
                          </div>
                      </div>

                      <div className="hidden lg:block w-px h-8 bg-[#D4A437]/20"></div>

                      <div className="flex items-center gap-3 w-[45%] lg:w-auto">
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/5 text-[#D4A437]">
                              <ChefHat size={18} />
                          </div>
                          <div className="text-left">
                              <div className="font-extrabold text-sm lg:text-base text-white leading-tight">Hygienic</div>
                              <div className="text-[10px] text-[#D4A437] uppercase tracking-wider font-extrabold font-sans font-sans font-sans font-sans">Food</div>
                          </div>
                      </div>

                      <div className="hidden lg:block w-px h-8 bg-[#D4A437]/20"></div>

                      <div className="flex items-center gap-3.5 w-[45%] lg:w-auto">
                          <div className="bg-white/10 p-2.5 rounded-xl border border-white/5 text-[#D4A437]">
                              <Clock size={18} />
                          </div>
                          <div className="text-left">
                              <div className="font-extrabold text-sm lg:text-base text-white leading-tight">On-time</div>
                              <div className="text-[10px] text-[#D4A437] uppercase tracking-wider font-extrabold font-sans font-sans">Service</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* SECTION 1.5: TABS BAR SYSTEM (Cream Palette) */}
      <div className="max-w-[1600px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-10 relative z-30">
          <div className="bg-white p-2 rounded-3xl md:rounded-full border-2 border-[#D4A437]/45 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2.5 shadow-[0_8px_32px_rgba(212,164,55,0.12)] overflow-x-auto no-scrollbar justify-center md:justify-start w-full md:w-max">
              {['Overview', 'Packages', 'Menu', 'Gallery', 'Reviews', 'About Us'].map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                      <button 
                          key={tab} 
                          onClick={() => handleTabClick(tab)}
                          className={cn(
                              "px-5 py-2.5 rounded-full font-extrabold text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer border-2", 
                              isActive 
                                  ? "bg-[#0B3D2E] text-white border-[#D4A437] shadow-[0_4px_14px_rgba(11,61,46,0.25)] scale-[1.03]" 
                                  : "bg-transparent text-slate-800 hover:text-[#0B3D2E] hover:bg-[#0B3D2E]/5 border-transparent"
                          )}
                      >
                          {tab === 'Overview' && <LayoutGrid size={13} className={cn(isActive ? "text-[#D4A437]" : "opacity-80")} />}
                          {tab === 'Packages' && <Package size={13} className={cn(isActive ? "text-[#D4A437]" : "opacity-80")} />}
                          {tab === 'Menu' && <MenuSquare size={13} className={cn(isActive ? "text-[#D4A437]" : "opacity-80")} />}
                          {tab === 'Gallery' && <ImageIcon size={13} className={cn(isActive ? "text-[#D4A437]" : "opacity-80")} />}
                          {tab === 'Reviews' && <Star size={13} className={cn(isActive ? "text-[#D4A437]" : "opacity-80")} />}
                          {tab === 'About Us' && <User size={13} className={cn(isActive ? "text-[#D4A437]" : "opacity-80")} />}
                          {tab}
                      </button>
                  );
              })}
          </div>
      </div>

      <div className="max-w-[1600px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
          
          <div className="grid grid-cols-1 lg:grid-cols-[72%_minmax(0,1fr)] gap-8 lg:gap-10 items-start my-8">
              
              {/* LEFT COLUMN (72% width) */}
              <div className="flex flex-col gap-8 w-full">
                  
                  {/* SECTION 2: SERVICES DESK & MENU EXPLORE - Horizontal bar */}
                  <div id="overview-section" className="bg-white rounded-3xl p-6 shadow-sm border border-[#D4A437]/20 flex flex-col xl:flex-row items-center gap-8 overflow-hidden relative z-10 hover:shadow-md transition-shadow">
                      
                      {/* Founder Mini Info */}
                      {(caterer.ownerName || caterer.founderName) && (
                          <div id="founder-info" className="flex items-center gap-4 shrink-0 pr-8 xl:border-r border-slate-200 w-full xl:w-auto">
                              {caterer.ownerPhoto ? (
                                  <img src={caterer.ownerPhoto} alt="Founder" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                              ) : (
                                  <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                                      <User size={24} className="text-slate-400" />
                                  </div>
                              )}
                              <div>
                                  <p className="text-xs font-bold text-[#D4A437] uppercase tracking-widest">Founder</p>
                                  <p className="font-bold text-slate-900 text-lg">{caterer.founderName || caterer.ownerName}</p>
                                  <p className="text-xs text-slate-500 max-w-[180px] line-clamp-2 mt-0.5">{caterer.founderDescription || "Passionate about serving delicious food."}</p>
                              </div>
                          </div>
                      )}

                      {/* Specializations / Services Icons */}
                      <div className="flex-1 flex flex-wrap justify-center xl:justify-start items-center gap-x-8 gap-y-4 px-4 w-full">
                          {specializations.slice(0, 5).map((spec: string, i: number) => {
                              // Map some generic icons
                              const GenericIcon = spec.toLowerCase().includes('wedding') ? Briefcase : spec.toLowerCase().includes('corporate') ? Building : spec.toLowerCase().includes('birthday') ? GiftIcon : ChefHat;
                              return (
                                  <div key={i} className="flex flex-col items-center gap-2 text-center max-w-[80px]">
                                     <div className="text-[#D4A437] bg-amber-50 p-3 rounded-xl">
                                         <GenericIcon size={24} strokeWidth={1.5} />
                                     </div>
                                     <span className="text-[11px] font-bold text-slate-700 leading-tight">{spec}</span>
                                  </div>
                              )
                          })}
                      </div>

                      {/* Menu Explore Button */}
                      <div className="shrink-0 w-full xl:w-auto mt-4 xl:mt-0">
                          <button onClick={() => {
                              document.getElementById('menu-packages')?.scrollIntoView({ behavior: 'smooth' });
                          }} className="w-full xl:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#0B3D2E] text-white font-bold rounded-xl shadow-lg hover:bg-[#124f3c] transition-colors uppercase tracking-widest text-sm relative overflow-hidden group">
                              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 w-1/3 skew-x-12"></div>
                              <BookOpen size={20} /> MENU EXPLORE
                          </button>
                      </div>
                  </div>

                  {/* SECTION 3: BUSINESS INFORMATION CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      
                      {/* Branches Details */}
                      <div className="md:col-span-6 lg:col-span-4 bg-white/95 rounded-[24px] p-8 border-2 border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(212,175,55,0.06)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)] hover:border-[#D4AF37]/50 transition-all duration-500 flex flex-col h-full group">
                          <h3 className="font-display font-bold text-[#0F3D2E] text-lg flex items-center gap-2.5 uppercase tracking-wider">
                              <Building size={22} className="text-[#D4AF37]" strokeWidth={1.5} /> Branches Details
                          </h3>
                          
                          <LuxuryDivider />
                          
                          <ul className="space-y-4 flex-1 mb-6">
                              {branchesList.map((branch: string, i: number) => (
                                  <li key={i} className="flex items-start gap-3 text-[16px] text-slate-800 font-medium">
                                      <MapPin size={22} className="text-[#D4AF37] mt-0.5 shrink-0" strokeWidth={1.5} />
                                      <span className="font-sans leading-relaxed">
                                          {branch} {i === 0 && <span className="text-[10px] text-[#D4AF37] font-semibold bg-[#0F3D2E]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30 ml-1.5 uppercase tracking-wider">Head Office</span>}
                                      </span>
                                  </li>
                              ))}
                          </ul>
                          
                          {/* Large elegant image preview */}
                          <div className="h-44 bg-slate-50 rounded-2xl overflow-hidden relative flex items-center justify-center border-2 border-[#D4AF37]/20 shadow-inner group-hover:border-[#D4AF37]/45 transition-colors">
                              <img 
                                  src={caterer.branchPhoto || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600"} 
                                  alt="Luxury Wedding Aesthetic" 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                  referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0F3D2E]/40 via-transparent to-transparent"></div>
                          </div>
                      </div>

                      {/* Service Areas */}
                      <div className="md:col-span-6 lg:col-span-4 bg-white/95 rounded-[24px] p-8 border-2 border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(212,175,55,0.06)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)] hover:border-[#D4AF37]/50 transition-all duration-500 flex flex-col h-full group">
                          <h3 className="font-display font-bold text-[#0F3D2E] text-lg flex items-center gap-2.5 uppercase tracking-wider">
                              <MapPin size={22} className="text-[#D4AF37]" strokeWidth={1.5} /> Service Areas
                          </h3>
                          
                          <LuxuryDivider />
                          
                          <div className="flex flex-col flex-1 justify-between relative min-h-[220px]">
                              <p className="text-[17px] text-slate-800 font-medium leading-relaxed mb-6 z-10 w-2/3 select-text font-sans mt-2">
                                  {serviceAreasList.join(', ')}
                              </p>
                              
                              {/* Large map illustration */}
                              <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-85 pointer-events-none flex items-center justify-end group-hover:scale-105 transition-transform duration-500">
                                  <svg viewBox="0 0 100 100" className="w-24 h-24 text-[#D4AF37]">
                                      <path 
                                          d="M10 20 L40 10 L70 25 L90 15 L90 80 L70 90 L40 75 L10 85 Z" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="1.5" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round" 
                                      />
                                      <path 
                                          d="M40 10 L40 75" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="1.5" 
                                          strokeDasharray="2 3" 
                                      />
                                      <path 
                                          d="M70 25 L70 90" 
                                          fill="none" 
                                          stroke="currentColor" 
                                          strokeWidth="1.5" 
                                          strokeDasharray="2 3" 
                                      />
                                      <circle cx="55" cy="45" r="5" fill="#0F3D2E" stroke="currentColor" strokeWidth="1" />
                                      <circle cx="55" cy="45" r="1.5" fill="currentColor" />
                                  </svg>
                              </div>
                          </div>
                      </div>

                      {/* Operating Hours */}
                      <div className="md:col-span-12 lg:col-span-4 bg-white/95 rounded-[24px] p-8 border-2 border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(212,175,55,0.06)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)] hover:border-[#D4AF37]/50 transition-all duration-500 flex flex-col h-full group">
                          <h3 className="font-display font-bold text-[#0F3D2E] text-lg flex items-center gap-2.5 uppercase tracking-wider">
                              <Clock size={22} className="text-[#D4AF37]" strokeWidth={1.5} /> Operating Hours
                          </h3>
                          
                          <LuxuryDivider />
                          
                          <div className="flex flex-col h-full justify-between flex-1 min-h-[220px]">
                              <div className="space-y-4 font-sans mt-2">
                                  <div className="flex flex-col">
                                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Weekly Schedule</span>
                                      <span className="text-[17px] font-bold text-[#0F3D2E] mt-0.5">Monday - Sunday</span>
                                  </div>
                                  
                                  <div className="flex flex-col">
                                      <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-bold">Timings</span>
                                      {/* Highlight timings in gold */}
                                      <div className="inline-flex items-center gap-2 bg-[#FCFAF5] border border-[#D4AF37]/30 px-4 py-2 rounded-xl mt-1.5 w-fit">
                                          <span className="text-[17px] font-extrabold text-[#D4AF37] tracking-wide">6:00 AM - 11:00 PM</span>
                                      </div>
                                  </div>
                                  
                                  <div className="text-sm font-semibold text-slate-500 italic mt-3">
                                      (Open on all holidays)
                                  </div>
                              </div>
                              
                              {/* Large clock/calendar icon styled with gold color */}
                              <div className="mt-4 flex justify-end text-[#D4AF37] opacity-80 group-hover:scale-110 transition-transform duration-500">
                                  <CalendarDays size={52} className="stroke-[1.5]" />
                              </div>
                          </div>
                      </div>

                      {/* Achievements */}
                      <div className="md:col-span-12 lg:col-span-5 bg-white/95 rounded-[24px] p-8 border-2 border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(212,175,55,0.06)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)] hover:border-[#D4AF37]/50 transition-all duration-500 flex flex-col h-full group">
                          <h3 className="font-display font-bold text-[#0F3D2E] text-lg flex items-center gap-2.5 uppercase tracking-wider">
                              <Award size={22} className="text-[#D4AF37]" strokeWidth={1.5} /> Achievements
                          </h3>
                          
                          <LuxuryDivider />
                          
                          {/* Large gold numbers & dark charcoal labels mapping */}
                          <div className="space-y-5 flex-1 flex flex-col justify-center py-2">
                              {achievementsList.slice(0, 4).map((ach: string, i: number) => {
                                  const parts = getAchievementParts(ach);
                                  return (
                                      <div key={i} className="flex items-center gap-4 py-3 border-b border-[#D4AF37]/15 last:border-0">
                                          <div className="flex-shrink-0 bg-[#0F3D2E]/5 border border-[#D4AF37]/30 rounded-full p-2 text-[#D4AF37] shadow-xs group-hover:bg-[#0F3D2E]/10 transition-colors">
                                              <Check size={16} className="stroke-[3]" />
                                          </div>
                                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                                              <span className="text-3xl sm:text-[32px] font-black text-[#D4AF37] leading-none tracking-tight font-sans">
                                                  {parts.number}
                                              </span>
                                              <span className="text-[17px] text-[#1C1C1C] font-semibold tracking-wide font-sans leading-tight">
                                                  {parts.label}
                                              </span>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Awards / Certifications */}
                      <div className="md:col-span-12 lg:col-span-7 bg-white/95 rounded-[24px] p-8 border-2 border-[#D4AF37]/35 shadow-[0_12px_40px_rgba(212,175,55,0.06)] hover:shadow-[0_20px_50px_rgba(212,175,55,0.18)] hover:border-[#D4AF37]/50 transition-all duration-500 flex flex-col h-full group">
                          <h3 className="font-display font-bold text-[#0F3D2E] text-lg flex items-center gap-2.5 uppercase tracking-wider">
                              <Award size={22} className="text-[#D4AF37]" strokeWidth={1.5} /> Awards & Certs
                          </h3>
                          
                          <LuxuryDivider />
                          
                          {/* Side-by-side or responsive grid for gold medal awards badges */}
                          <div className="flex-1 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 py-2">
                              {awardsList.slice(0, 4).map((award: string, i: number) => (
                                  <div key={i} className="flex flex-col items-center">
                                      <GoldMedalIcon title={award} />
                                  </div>
                              ))}
                              {caterer.fssai && (
                                   <div className="flex flex-col items-center">
                                      <GoldMedalIcon title="FSSAI Certified" isShield={true} />
                                   </div>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* SECTION 4: GALLERY OVERVIEW */}
                  <div id="gallery-section" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                      <h3 className="uppercase tracking-widest text-[#0B3D2E] font-bold mb-4 flex items-center gap-1.5">
                          <span className="text-[#D4A437]">✦</span> Gallery
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {allGalleryPhotos.slice(0, 4).map((img: string, i: number) => (
                              <div key={i} onClick={() => openLightbox(allGalleryPhotos, i)} className="aspect-video md:aspect-square rounded-2xl overflow-hidden relative cursor-zoom-in group shadow-sm border border-slate-200">
                                  <img src={img} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors"></div>
                              </div>
                          ))}
                          {allGalleryPhotos.length > 4 ? (
                              <div onClick={() => openLightbox(allGalleryPhotos, 4)} className="aspect-video md:aspect-square rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors group">
                                   <div className="bg-[#0B3D2E] text-white rounded-full p-3 mb-2 group-hover:scale-110 transition-transform shadow-sm">
                                       <PlayCircle size={24} />
                                   </div>
                                   <span className="text-sm font-bold text-slate-700">View More</span>
                                   <span className="text-xs text-slate-500">Photos & Videos</span>
                               </div>
                          ) : null}
                      </div>
                  </div>

                  {/* SECTION 6: MENU PACKAGES */}
                  <section id="menu-packages" className="bg-[#FCFAF5] rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-amber-200/30 relative overflow-hidden select-none">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-100/15 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 pb-6 border-b border-amber-200/40">
                          <div className="text-center sm:text-left select-none">
                              <h2 className="text-2xl font-display font-black text-[#051410] tracking-tight relative inline-block">
                                  Choose Your Package
                              </h2>
                              <div className="flex items-center justify-center sm:justify-start gap-1 text-[#DEAA38] mt-1 text-xs font-serif">
                                  <span className="opacity-40">⏤⊰</span>
                                  <span className="text-xs">❃</span>
                                  <span className="font-bold uppercase tracking-wider text-[9px] text-[#D4A437] font-sans mx-1">Premium Selections</span>
                                  <span className="text-xs">❃</span>
                                  <span className="opacity-40">⊱⏤</span>
                              </div>
                          </div>
                          
                          {/* Guest Selector Counter */}
                          <div className="bg-gradient-to-r from-stone-50 to-[#FFFDF5] border border-amber-200/60 rounded-xl p-1.5 px-3 flex items-center gap-3 shadow-[0_4px_12px_rgba(222,170,56,0.06)]">
                              <button 
                                  onClick={() => setGuestCount(prev => Math.max(10, prev - 10))}
                                  className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-90 transition-all flex items-center justify-center font-bold text-base select-none cursor-pointer"
                              >
                                  −
                              </button>
                              <div className="text-center min-w-[55px] select-none">
                                  <span className="block text-sm font-black text-slate-800 leading-none">{guestCount}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block">Guests</span>
                              </div>
                              <button 
                                  onClick={() => setGuestCount(prev => Math.min(3000, prev + 10))}
                                  className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-90 transition-all flex items-center justify-center font-bold text-base select-none cursor-pointer"
                              >
                                  +
                              </button>
                          </div>
                      </div>
                      
                      {/* Responsive dynamic grid package listing */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                          {packageTiers.map((pkg, idx) => {
                              const theme = pkg.theme || 'silver';
                              
                              // Theme backgrounds, borders and custom styling definitions
                              let bgBorderClass = "bg-gradient-to-b from-stone-50 to-white border border-stone-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)]";
                              let badgeClass = "bg-green-50 text-green-800 border-green-200/60";
                              let badgeDotClass = "bg-green-600";
                              let titleClass = "text-slate-800";
                              let buttonClass = "bg-[#002C26] hover:bg-[#003B31] text-white shadow-[0_4px_10px_rgba(0,44,38,0.2)]";

                              if (theme === 'gold') {
                                  bgBorderClass = "bg-gradient-to-b from-[#FFFDF2] to-[#FFFBF0] border-2 border-[#DEAA38]/50 shadow-[0_12px_35px_rgba(222,170,56,0.12)]";
                                  titleClass = "text-[#A27008]";
                                  buttonClass = "bg-gradient-to-r from-[#D4AF37] via-[#F5E6B3] to-[#AA7C11] text-[#051410] font-black border border-[#DEAA38]/30 shadow-[0_6px_20px_rgba(170,124,17,0.25)] hover:brightness-105";
                              } else if (theme === 'platinum') {
                                  bgBorderClass = "bg-gradient-to-b from-[#F9FAFB] to-white border border-slate-300 shadow-[0_4px_22px_rgba(0,0,0,0.03)]";
                                  titleClass = "text-slate-900";
                              } else if (theme === 'premium') {
                                  bgBorderClass = "bg-gradient-to-b from-[#FFF5F5] to-white border-2 border-red-200/80 shadow-[0_10px_30px_rgba(239,68,68,0.05)]";
                                  titleClass = "text-red-955";
                                  badgeClass = "bg-red-50 text-red-800 border-red-200/60";
                                  badgeDotClass = "bg-red-600";
                                  buttonClass = "bg-gradient-to-r from-red-700 to-[#7F1D1D] hover:from-red-800 hover:to-[#5E0000] text-white shadow-[0_6px_20px_rgba(127,29,29,0.25)]";
                              } else if (theme === 'royal') {
                                  bgBorderClass = "bg-gradient-to-b from-[#FFFDF6] to-[#FFF9F2] border-2 border-[#DEAA38] shadow-[0_12px_45px_rgba(222,170,56,0.26)]";
                                  titleClass = "text-[#925F02]";
                                  badgeClass = "bg-red-50 text-red-800 border-red-200/60";
                                  badgeDotClass = "bg-red-600";
                              } else if (theme === 'grand') {
                                  bgBorderClass = "bg-gradient-to-b from-[#FFFDF9] to-white border-2 border-[#DEAA38]/40 shadow-[0_8px_30px_rgba(222,170,56,0.08)]";
                                  titleClass = "text-amber-955";
                                  badgeClass = "bg-red-50 text-red-800 border-red-200/60";
                                  badgeDotClass = "bg-red-600";
                              }

                              return (
                                  <div 
                                      key={pkg.id} 
                                      className={cn(
                                          "rounded-[2rem] p-6 transition-all duration-300 relative flex flex-col pt-10 h-full group hover:-translate-y-2 select-none",
                                          bgBorderClass
                                      )}
                                  >
                                      {/* Decorative 3D Floating Crown */}
                                      <CrownOrnament theme={theme} />
                                      
                                      {/* Best Seller/Popular Ribbon */}
                                      {pkg.popular && (
                                          <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#EF4444] to-[#C21111] text-white font-black text-[9px] uppercase px-4 py-1.5 rounded-full shadow-[0_4px_10px_rgba(239,68,68,0.35)] tracking-widest border border-red-500/15 z-35">
                                              Popular
                                          </div>
                                      )}

                                      {/* Veg / Non-Veg Tag */}
                                      <div className="text-center mb-4">
                                          <span className={cn(
                                              "text-[9px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full mb-1 inline-flex items-center gap-1 border shadow-xs",
                                              badgeClass
                                          )}>
                                              <span className={cn("w-1.5 h-1.5 rounded-full", badgeDotClass)}></span>
                                              {pkg.type === 'veg' ? 'Pure Veg' : 'Non-Veg Allowed'}
                                          </span>
                                          
                                          <h3 className={cn("text-base font-serif font-black tracking-wide uppercase leading-tight mt-1", titleClass)}>
                                              {pkg.name}
                                          </h3>
                                      </div>

                                      {/* Price plate */}
                                      <div className="text-center mb-5 pb-4 border-b border-dashed border-stone-200">
                                          <div className="inline-flex items-baseline text-slate-950">
                                              <span className="text-lg font-bold font-poppins mr-0.5 text-stone-400">₹</span>
                                              <span className="text-3.5xl font-black font-poppins leading-none tracking-tight">{pkg.price}</span>
                                              <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider ml-1">/ plate</span>
                                          </div>
                                      </div>

                                      {/* Description Text */}
                                      <p className="text-[12px] leading-relaxed text-slate-500 mb-5 text-center italic font-medium px-2 flex-1">
                                          "{pkg.desc}"
                                      </p>

                                      {/* Core items specs list */}
                                      <div className="space-y-3 mb-6 bg-[#FAF6F0]/40 p-4 rounded-xl border border-stone-100">
                                          <div className="flex items-center gap-3">
                                              <div className="w-7.5 h-7.5 rounded-full bg-amber-50/70 flex items-center justify-center text-[#DEAA38] shrink-0 border border-amber-100">
                                                  <ChefHat size={14} strokeWidth={2} />
                                              </div>
                                              <span className="text-xs font-bold text-slate-700 tracking-tight">
                                                  {pkg.categoriesCount} Categories Included
                                              </span>
                                          </div>

                                          <div className="flex items-center gap-3">
                                              <div className="w-7.5 h-7.5 rounded-full bg-amber-50/70 flex items-center justify-center text-[#DEAA38] shrink-0 border border-amber-100">
                                                  <Award size={14} strokeWidth={2} />
                                              </div>
                                              <span className="text-xs font-bold text-slate-700 tracking-tight">
                                                  {pkg.selectItems}
                                              </span>
                                          </div>

                                          <div className="flex items-center gap-3">
                                              <div className="w-7.5 h-7.5 rounded-full bg-amber-50/70 flex items-center justify-center text-[#DEAA38] shrink-0 border border-amber-100">
                                                  <Users size={14} strokeWidth={2} />
                                              </div>
                                              <span className="text-xs font-bold text-slate-700 tracking-tight">
                                                  {pkg.guests}+ Guests Limit
                                              </span>
                                          </div>
                                      </div>
                                      
                                      {/* Order Button (View Details) */}
                                      <Link 
                                          to={`/order/${caterer.id}`} 
                                          state={{ packageIdx: pkg.id, customGuestCount: guestCount }} 
                                          className={cn(
                                              "mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 cursor-pointer pointer-events-auto",
                                              buttonClass
                                          )}
                                      >
                                          View Details <ChevronRight size={14} className="stroke-[3]" />
                                      </Link>
                                  </div>
                              );
                          })}
                      </div>
                  </section>

                  {/* SECTION 7: REVIEWS */}
                  <section id="reviews-section" className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200/60 shadow-xs relative overflow-hidden w-full">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pb-4 border-b border-slate-100">
                          <div>
                              <h2 className="text-xl font-display font-black text-slate-900 uppercase tracking-wider">Customer Feedback</h2>
                              <p className="text-slate-500 font-medium text-xs mt-1">Authentic ratings from wedding banquets and events.</p>
                          </div>
                          <div className="flex items-center gap-2 bg-[#FAF8F3] px-4 py-2 rounded-xl border border-[#D4A437]/35 shadow-xs shrink-0 self-start sm:self-auto">
                              <Star className="text-[#D4A437] fill-[#D4A437]" size={16} />
                              <span className="font-extrabold text-[#0B3D2E] text-sm leading-none">{caterer.rating || '4.9'}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-sans">/ 5 Rating</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full font-sans">
                          {DEMO_REVIEWS.filter(r => r.rating >= 4).slice(0, 3).map((review: any, idx: number) => (
                              <div key={idx} className="bg-[#FAF8F3]/40 p-5 rounded-2xl border border-slate-100/80 hover:border-[#D4A437]/30 hover:shadow-[0_8px_30px_rgba(212,164,55,0.06)] transition-all duration-300 flex flex-col justify-between h-full group">
                                  <div>
                                      <div className="flex items-center justify-between mb-3 font-sans">
                                          <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-full bg-[#0B3D2E]/10 text-[#0B3D2E] font-black text-xs flex items-center justify-center border border-[#0B3D2E]/10">
                                                  {review.userName ? review.userName[0] : 'U'}
                                              </div>
                                              <div className="text-left">
                                                  <h4 className="font-extrabold text-slate-800 text-xs leading-tight">{review.userName || 'Premium Host'}</h4>
                                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{review.date || 'Recent Wedding'}</span>
                                              </div>
                                          </div>
                                          <div className="flex gap-0.5 text-[#D4A437]">
                                              {[...Array(5)].map((_, i) => (
                                                  <Star key={i} size={10} className={cn("fill-current", i < Math.floor(review.rating || 5) ? "" : "opacity-30")} />
                                              ))}
                                          </div>
                                      </div>
                                      <p className="text-xs text-slate-600 italic leading-relaxed group-hover:text-slate-800 transition-colors font-sans">
                                          "{review.comment || review.text || 'Wonderful service and delectable culinary layout. Exceptionally professional!'}"
                                      </p>
                                  </div>
                                  <div className="mt-4 pt-2 border-t border-slate-100/50 flex items-center justify-between text-[9px] font-black tracking-wider uppercase">
                                      <span className="bg-[#0B3D2E]/5 text-[#0B3D2E] px-2 py-0.5 rounded-md font-sans">Verified Order</span>
                                      <span className="text-slate-400 font-bold font-sans">{review.eventType || 'Catering Banquet'}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </section>

                  {/* SECTION 5: CONTACT PROTECTION NOTICE */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex flex-shrink-0 items-center justify-center text-amber-600">
                          <ShieldCheck size={32} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                          <h4 className="font-bold text-amber-900 mb-1 text-xl">Privacy Protected Contact</h4>
                          <p className="text-amber-800 font-medium">To protect caterer confidentiality, direct contact details (Phone & WhatsApp) will be securely shared only after your order is confirmed.</p>
                      </div>
                      {user?.role === 'admin' && (
                          <div className="flex gap-4 items-center border-t md:border-t-0 md:border-l border-amber-200 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                              <div className="text-amber-900 font-bold flex flex-col font-sans">
                                  <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">Admin View</span>
                                  <span className="flex items-center gap-2"><Phone size={14} /> {caterer.phone}</span>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* RIGHT COLUMN (28% width) */}
              <div className="flex flex-col gap-8 w-full lg:mt-6 lg:pl-3">
                  
                  {/* SECTION 8: TRUST BADGES */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-xs">
                      <h3 className="uppercase tracking-widest text-[#0B3D2E] font-bold mb-5 flex items-center gap-1.5 text-xs sm:text-sm">
                          <span className="text-[#D4A437]">✦</span> Why Trust Our Food?
                      </h3>
                      <div className="space-y-4">
                          <div className="flex items-center gap-4 animate-fade-in">
                              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                                  <ShieldCheck size={22} className="stroke-[2.5]" />
                              </div>
                              <div className="text-left font-sans">
                                  <h4 className="text-slate-800 font-extrabold text-sm leading-tight">Hygienic Food Standards</h4>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 animate-pulse">FSSAI Certified Kitchens</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-amber-50 text-[#D4A437] flex items-center justify-center shrink-0 border border-amber-100/50">
                                  <Award size={22} />
                              </div>
                              <div className="text-left font-sans">
                                  <h4 className="text-slate-800 font-extrabold text-sm leading-tight">Fresh Ingredients</h4>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">100% Quality Assurance</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0B3D2E] flex items-center justify-center shrink-0 border border-emerald-100/50">
                                  <ChefHat size={22} />
                              </div>
                              <div className="text-left font-sans">
                                  <h4 className="text-slate-800 font-extrabold text-sm leading-tight">Experienced Chefs</h4>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">5-Star Culinary Expertise</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                                  <Clock size={22} />
                              </div>
                              <div className="text-left font-sans">
                                  <h4 className="text-slate-800 font-extrabold text-sm leading-tight">On-Time Delivery</h4>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Hot & Fresh On Time</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0B3D2E] flex items-center justify-center shrink-0 border border-emerald-100/50">
                                  <CheckCircle2 size={22} />
                              </div>
                              <div className="text-left font-sans">
                                  <h4 className="text-slate-800 font-extrabold text-sm leading-tight">Trusted by Customers</h4>
                                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Loved by 20,000+ Guests</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

          </div>

      </div>
    </div>
  );
}

// Support Icon Helper Component inline
function GiftIcon({size, strokeWidth, className}: any) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>;
}
