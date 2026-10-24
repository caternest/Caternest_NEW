import React, { useState, useRef, useEffect } from 'react';
import { 
  Search,
  MapPin,
  Crosshair,
  ChevronDown,
  ChevronRight,
  Star, 
  ChefHat, 
  Tag, 
  Calendar, 
  Sparkles,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  Camera,
  Music,
  Paintbrush,
  Mic,
  Sparkle,
  Gift,
  Mail,
  Car,
  CheckCircle,
  Clock4,
  Heart,
  X,
  Utensils,
  BarChart2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { HYDERABAD_AREAS } from '../data';
import { getSupabase } from '../lib/supabase';

export default function Home() {
  const navigate = useNavigate();

  // Search & Location States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Hyderabad, Telangana');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Close location dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (selectedLocation) {
      const cleanLoc = selectedLocation.replace(', Telangana', '').trim();
      if (cleanLoc && cleanLoc !== 'All Hyderabad') {
        params.set('location', cleanLoc);
      }
    }
    navigate(`/explore?${params.toString()}`);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation('Current Location');
          setIsLocationDropdownOpen(false);
          const params = new URLSearchParams();
          if (searchQuery.trim()) params.set('search', searchQuery.trim());
          params.set('lat', position.coords.latitude.toString());
          params.set('lng', position.coords.longitude.toString());
          navigate(`/explore?${params.toString()}`);
        },
        () => {
          setSelectedLocation('Hyderabad, Telangana');
          setIsLocationDropdownOpen(false);
        }
      );
    }
  };


  // Fallback Top Rated Caterers (Matching Reference image_3d9d44db.png)
  const FALLBACK_POPULAR_CATERERS = [
    {
      id: 'c1',
      name: 'Sri Sai Caterers',
      location: 'Hyderabad',
      cuisines: 'South Indian, North Indian',
      rating: 4.8,
      reviewCount: 120,
      startingPrice: 350,
      image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
      type: 'Veg & Non-Veg',
      tags: ['Veg', 'Non-Veg', 'Custom Menu'],
      isVerified: true
    },
    {
      id: 'c2',
      name: 'Royal Spice Caterers',
      location: 'Hyderabad',
      cuisines: 'North Indian, Mughlai',
      rating: 4.6,
      reviewCount: 98,
      startingPrice: 420,
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800',
      type: 'North Indian, Mughlai',
      tags: ['Veg', 'Non-Veg', 'Live Counters'],
      isVerified: true
    },
    {
      id: 'c3',
      name: 'Utsav Caterers',
      location: 'Hyderabad',
      cuisines: 'South Indian, Traditional',
      rating: 4.7,
      reviewCount: 156,
      startingPrice: 380,
      image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&q=80&w=800',
      type: 'South Indian, Traditional',
      tags: ['Veg', 'Custom Menu', 'Bulk Orders'],
      isVerified: true
    },
    {
      id: 'c4',
      name: 'Celebration Caterers',
      location: 'Hyderabad',
      cuisines: 'Multi Cuisine',
      rating: 4.5,
      reviewCount: 87,
      startingPrice: 480,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
      type: 'Multi Cuisine',
      tags: ['Veg', 'Non-Veg', 'Wedding Special'],
      isVerified: true
    }
  ];

  const [popularCaterers, setPopularCaterers] = useState<any[]>(FALLBACK_POPULAR_CATERERS);

  // Fetch verified approved caterers
  useEffect(() => {
    const fetchPopularCaterers = async () => {
      let catererList: any[] = [];
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('caterer_registrations')
            .select('*')
            .or('status.eq.Approved,status.eq.approved')
            .limit(4);
          if (!error && data && data.length > 0) {
            catererList = data.map((r: any) => ({
              id: r.id,
              name: r.businessName || 'Premium Caterer',
              location: r.address || r.location || 'Hyderabad',
              rating: typeof r.rating === 'number' ? r.rating : 4.9,
              reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 120,
              startingPrice: Number(r.startingPrice) || 350,
              image: (r.galleryPhotos && r.galleryPhotos[0]) || (r.images && r.images[0]) || 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
              type: r.type || 'Veg + Non-Veg',
              tags: ['Verified Partner', 'Live Counters'],
              isVerified: true
            }));
          }
        } catch (e) {
          console.error("Error fetching caterers on Home:", e);
        }
      }

      if (catererList.length === 0) {
        try {
          const raw = localStorage.getItem('registrations');
          if (raw) {
            const parsed = JSON.parse(raw);
            const approved = parsed.filter((r: any) => r && (r.status === 'Approved' || r.status === 'approved'));
            if (approved.length > 0) {
              catererList = approved.slice(0, 4).map((r: any) => ({
                id: r.id,
                name: r.businessName || 'Premium Caterer',
                location: r.location || 'Hyderabad',
                rating: typeof r.rating === 'number' ? r.rating : 4.9,
                reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 85,
                startingPrice: Number(r.startingPrice) || 350,
                image: (r.galleryPhotos && r.galleryPhotos[0]) || (r.images && r.images[0]) || 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
                type: r.type || 'Veg + Non-Veg',
                tags: ['Verified Partner', 'Custom Menus'],
                isVerified: true
              }));
            }
          }
        } catch (e) {}
      }

      if (catererList.length > 0) {
        const combined = [...catererList];
        FALLBACK_POPULAR_CATERERS.forEach(fb => {
          if (combined.length < 4 && !combined.some(c => c.id === fb.id || c.name === fb.name)) {
            combined.push(fb);
          }
        });
        setPopularCaterers(combined.slice(0, 4));
      }
    };

    fetchPopularCaterers();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans overflow-x-hidden pt-14 sm:pt-[58px]">
      
      {/* 1. ONE UNIFIED EMERALD-GREEN HERO */}
      <section 
        className="relative w-full overflow-hidden text-center py-10 sm:py-12 md:py-14 select-none"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 25%, #053D2E 0%, #03281E 60%, #021B14 100%)'
        }}
      >
        {/* Subtle decorative culinary background texture */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(#D4AF37 0.8px, transparent 0.8px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Radial Highlights */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Center Body (Clean & Centered) */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          
          {/* Main Prominent Heading */}
          <h1 
            className="text-2xl sm:text-3xl md:text-[34px] lg:text-[40px] font-display font-bold text-white tracking-tight leading-[1.25] mb-2.5 sm:mb-3 max-w-3xl drop-shadow-sm text-center"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Explore All Caterers in One Place. <br className="hidden sm:inline" />
            <span className="text-[#DEAA38]">Choose the Best for Every Occasion</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-white/85 text-xs sm:text-[13.5px] max-w-xl mx-auto mb-6 sm:mb-7 leading-relaxed font-sans font-medium text-center">
            Compare verified caterers, explore menus, and choose packages that make your event special.
          </p>

          {/* Horizontal Search Bar (Single horizontal pill on desktop, clean wrapped card on mobile) */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl md:rounded-full p-2 md:p-1.5 md:pl-5 shadow-[0_16px_45px_rgba(0,0,0,0.45)] border border-white/30 flex flex-col md:flex-row items-stretch md:items-center gap-2">
              
              {/* Search Input for Caterer Name / Cuisine */}
              <div className="flex-1 flex items-center gap-2 px-2.5 md:px-0 py-1.5 md:py-0">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by caterer name, cuisine, or keyword..."
                  className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-[13px] font-medium outline-none py-1"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Vertical Divider for Desktop */}
              <div className="hidden md:block w-px h-7 bg-slate-200 shrink-0 mx-1" />

              {/* Location Selector */}
              <div ref={locationDropdownRef} className="relative flex items-center gap-2 px-2.5 md:px-2 py-1.5 md:py-0 border-t md:border-t-0 border-slate-100">
                <MapPin size={17} className="text-[#DEAA38] shrink-0" />
                
                <div 
                  onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                  className="flex items-center gap-1 cursor-pointer select-none text-left min-w-[130px] sm:min-w-[160px]"
                >
                  <span className="text-xs sm:text-[12.5px] font-semibold text-slate-700 truncate max-w-[150px]">
                    {selectedLocation}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0 ml-auto" />
                </div>

                {/* GPS Current Location Target Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  title="Use current location"
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#DEAA38] transition-colors cursor-pointer shrink-0"
                >
                  <Crosshair size={14} />
                </button>

                {/* Location Dropdown Options */}
                {isLocationDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 md:left-auto md:right-0 mt-2 w-full md:w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation('Hyderabad, Telangana');
                        setIsLocationDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-amber-50/70 hover:text-[#DEAA38] transition-colors flex items-center justify-between"
                    >
                      <span>All Hyderabad</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-medium">Default</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <div className="max-h-48 overflow-y-auto no-scrollbar">
                      {HYDERABAD_AREAS.map((area) => (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(`${area.name}, Hyderabad`);
                            setIsLocationDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors truncate"
                        >
                          {area.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Explore Caterers Button */}
              <button
                type="button"
                onClick={handleSearch}
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-[#DEAA38] to-[#C28824] hover:from-[#E6B84A] hover:to-[#D1972D] active:scale-95 text-[#031E17] font-bold text-xs sm:text-[13px] rounded-xl md:rounded-full tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Explore Caterers</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </button>

            </div>
          </div>

        </div>
      </section>

      {/* 2. POPULAR CATERERS SECTION (Immediately below hero, matching Reference image_3d9d44db.png) */}
      <section className="py-7 sm:py-9 bg-[#FFFDFB] border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Row with Top Picks Eyebrow & View All Caterers on Right */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-6 pb-2 gap-3">
            <div>
              <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-wider block mb-1">
                — OUR TOP PICKS
              </span>
              <h2 
                className="text-xl sm:text-2xl md:text-[25px] font-display font-bold text-slate-900 tracking-tight"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
              >
                Explore Popular Caterers
              </h2>
              <p className="text-slate-500 text-xs sm:text-[13px] font-medium mt-0.5">
                Discover trusted caterers with delicious menus and great reviews.
              </p>
            </div>

            <Link 
              to="/explore"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full border border-[#DEAA38] text-[#C28824] hover:bg-amber-50/60 font-bold text-xs transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>View All Caterers</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </Link>
          </div>

          {/* Caterers Grid (Matching image_3d9d44db.png) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5 mb-2">
            {popularCaterers.map((caterer) => (
              <div
                key={caterer.id}
                onClick={() => navigate(`/caterer/${caterer.id}`)}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-[#DEAA38] shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col justify-between"
              >
                {/* Caterer Image */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-100 shrink-0">
                  <img 
                    src={caterer.image} 
                    alt={caterer.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

                  {/* Rating Badge (top-left) */}
                  <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-slate-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <Star size={11} className="text-[#DEAA38] fill-[#DEAA38]" />
                    <span>{Number(caterer.rating).toFixed(1)}</span>
                    <span className="text-slate-500 font-normal">({caterer.reviewCount})</span>
                  </span>

                  {/* Heart Favorite Icon (top-right) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-500 hover:text-rose-500 shadow-2xs transition-colors cursor-pointer"
                    title="Save to favorites"
                  >
                    <Heart size={13} />
                  </button>
                </div>

                {/* Caterer Info Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-[14.5px] text-slate-900 group-hover:text-[#DEAA38] transition-colors line-clamp-1 mb-1">
                      {caterer.name}
                    </h3>
                    
                    {/* Location and Cuisines line with icons */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10.5px] font-medium mb-3">
                      <span className="flex items-center gap-0.5 shrink-0">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span>{caterer.location}</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-0.5 truncate text-slate-500">
                        <Utensils size={10} className="text-slate-400 shrink-0" />
                        <span className="truncate">{caterer.cuisines || caterer.type}</span>
                      </span>
                    </div>

                    {/* Category Tags at bottom of card */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {caterer.tags && caterer.tags.map((tag: any, i: number) => {
                        const tagLabel = typeof tag === 'string' ? tag : tag.label;
                        const isVeg = tagLabel.toLowerCase() === 'veg';
                        const isNonVeg = tagLabel.toLowerCase() === 'non-veg';
                        return (
                          <span 
                            key={i} 
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-semibold border flex items-center gap-1 ${
                              isVeg 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : isNonVeg 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {isVeg && <span className="text-[10px]">🌱</span>}
                            {isNonVeg && <span className="text-[10px]">🍗</span>}
                            {!isVeg && !isNonVeg && <span className="text-[9px] text-slate-400">✓</span>}
                            <span>{tagLabel}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 2. SERVICES SECTION (Premium showcase of active catering and placeholder coming soon services) */}
      <section className="py-8 md:py-10 border-b border-slate-100" style={{ backgroundColor: '#f2faf4' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Comprehensive Event Platform
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Explore Our <span className="text-[#DEAA38]">Premium Services</span>
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              We connect you with highly trusted event specialists. Currently Catering is fully active; more curated services are launching soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Catering Services (ACTIVE) */}
            <div 
              onClick={() => navigate('/explore')}
              className="bg-white rounded-xl border-2 border-brand-gold-500/40 hover:border-brand-gold-500 shadow-xs hover:shadow-sm transition-all duration-300 overflow-hidden cursor-pointer group text-left flex flex-col justify-between h-[260px] md:h-[270px]"
            >
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-100 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=600"
                  alt="Catering Services"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white font-extrabold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-2xs">
                  ✓ FULLY ACTIVE
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#DEAA38] transition-colors flex items-center gap-1.5">
                    <ChefHat size={16} className="text-[#DEAA38] shrink-0" /> Catering Services
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Discover verified caterers for weddings, birthdays, corporate events, and every special occasion.
                  </p>
                </div>
                <div className="flex items-center text-xs font-bold text-[#DEAA38] group-hover:underline mt-2">
                  <span>Explore Caterers</span>
                  <ArrowRight size={13} className="ml-1" />
                </div>
              </div>
            </div>

            {/* Decoration Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=600"
                  alt="Floral Decoration"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Paintbrush size={16} className="text-slate-400 shrink-0" /> Event Decoration
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Stunning theme stages, luxurious floral arrangements, and premium lighting.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Photography Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600"
                  alt="Photography"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Camera size={16} className="text-slate-400 shrink-0" /> Photography
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Candid photoshoots, pre-wedding films, traditional shoots and drone capture.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Music & DJ Services (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=600"
                  alt="Music & DJ"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Music size={16} className="text-slate-400 shrink-0" /> Music & DJ
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Professional event sound systems, certified DJs, and acoustic live setups.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

            {/* Event Host / MC (COMING SOON) */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/60 shadow-2xs transition-all duration-300 overflow-hidden text-left flex flex-col justify-between h-[260px] md:h-[270px] opacity-90 select-none">
              <div className="relative h-28 md:h-30 w-full overflow-hidden bg-slate-200 shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600"
                  alt="Event Host"
                  className="w-full h-full object-cover grayscale opacity-45"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#DEAA38]/80 text-[#03130e] font-bold text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                  COMING SOON
                </span>
              </div>
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-500 flex items-center gap-1.5">
                    <Mic size={16} className="text-slate-400 shrink-0" /> Event Host / MC
                  </h3>
                  <p className="text-slate-500 text-xs font-medium mt-1 line-clamp-2">
                    Charming emcees, live stage coordinators, and crowd engagement hosts.
                  </p>
                </div>
                <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Stay Tuned
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE PLANMYCHOICE SECTION (Premium feature cards with luxurious aesthetic layout) */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#e9f6e3' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Uncompromising Quality
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Why Choose <span className="text-[#DEAA38]">PlanMyChoice</span>
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              We eliminate booking uncertainty to let you focus on what truly matters—celebrating with your loved ones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Card 1: Verified Professionals */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100/50">
                <ShieldCheck size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Verified Professionals</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Every vendor listed goes through a detailed background, legal, and quality audit.
              </p>
            </div>

            {/* Card 2: Transparent Pricing */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#DEAA38] flex items-center justify-center mb-3 border border-amber-100/50">
                <Tag size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Transparent Pricing</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Enjoy transparent rates with no hidden commissions, broker markups, or unexpected add-on costs.
              </p>
            </div>

            {/* Card 3: Easy Booking */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 border border-sky-100/50">
                <Calendar size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Easy Booking</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Browse detailed food packages, select customizable add-ons, and book verified slots in under five minutes.
              </p>
            </div>

            {/* Card 4: One Platform */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 border border-purple-100/50">
                <Sparkles size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">One Platform</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Keep your event planning highly organized. Track catering checklists, stage decor status, and photography notes in one place.
              </p>
            </div>

            {/* Card 5: Trusted Reviews */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-[#DEAA38]/10 text-[#DEAA38] flex items-center justify-center mb-3 border border-[#DEAA38]/20">
                <Star size={20} className="stroke-[1.5] fill-[#DEAA38]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Trusted Reviews</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Access absolute authentic customer testimonials, star ratings, and real photos shared by hosts of previous events.
              </p>
            </div>

            {/* Card 6: Dedicated Support */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/60 shadow-2xs hover:shadow-xs transition-shadow text-left flex flex-col items-start">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 border border-rose-100/50">
                <Smartphone size={20} className="stroke-[1.5]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">Dedicated Support</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Our support team and event managers assist you at every step—from selecting menus to ensuring timely service execution on-stage.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Badges row */}
      <section className="py-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              { title: 'Verified & Trusted', desc: 'Only verified & top-rated caterers', icon: ShieldCheck },
              { title: 'Transparent Pricing', desc: 'No hidden charges, clear & honest pricing', icon: Tag },
              { title: 'Instant Quotes', desc: 'Get quotes in just a few minutes', icon: Smartphone },
              { title: '24x7 Support', desc: "We're here to help you anytime", icon: ChefHat }
            ].map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-slate-100/80 hover:shadow-2xs transition-shadow group">
                <div className="w-9 h-9 rounded-full bg-brand-gold-500/10 text-[#DEAA38] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <badge.icon size={16} className="stroke-[1.5]" />
                </div>
                <h5 className="text-[11px] font-bold text-slate-800 leading-tight mb-0.5">{badge.title}</h5>
                <p className="text-[9px] text-slate-500 font-medium leading-tight">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION (Elegant 4-step premium pipeline with visual connections) */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#bdd4bd' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Simplified Process
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              How It <span className="text-[#DEAA38]">Works</span>
            </h2>
            <p className="text-slate-600 text-xs font-medium">
              We have condensed complicated vendor contracts and food trials into four seamless steps.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-5 px-4 sm:px-0">
            {/* Visual dashed connector line between steps (Desktop only) */}
            <div className="hidden md:block absolute top-[22px] left-[12%] right-[12%] h-0.5 border-t border-dashed border-slate-400/40 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#051410] text-white flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide">Choose Service</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Select gourmet catering and input your event's venue, date, guest count, and starting budget.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#051410] text-white flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide">Select Vendor</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Compare packages, customize dishes from digital menu cards, and view verified customer reviews.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#051410] text-white flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/30 group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide">Book Easily</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Finalize customization items, lock-in transparent plate costs, and secure your event date.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-11 h-11 rounded-full bg-[#DEAA38] text-[#03130e] flex items-center justify-center text-sm font-bold font-display shadow-md border border-[#DEAA38]/20 group-hover:scale-105 transition-transform">
                4
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-950 mt-2.5 mb-1 uppercase tracking-wide text-[#8C6D1F]">Celebrate</h3>
              <p className="text-slate-600 text-[11px] sm:text-xs font-medium leading-relaxed max-w-[180px]">
                Relax as our verified experts execute your customized menu and services with immaculate excellence.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. COMING SOON SERVICES SECTION (Polished placeholder cards displaying Coming Soon only) */}
      <section className="py-8 md:py-10 border-t border-b border-slate-200/50" style={{ backgroundColor: '#d1e1d2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <span className="text-[#DEAA38] font-bold text-[10px] uppercase tracking-widest bg-[#DEAA38]/10 px-2.5 py-0.5 rounded-full">
              Future Extensions
            </span>
            <h2 
              className="text-xl md:text-[22px] font-display font-bold text-slate-900 mt-2 mb-1.5 tracking-tight"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Launching <span className="text-[#DEAA38]">Soon</span>
            </h2>
            <p className="text-slate-600 text-xs font-medium">
              We are expanding to bring a comprehensive fleet of verified service artists to your celebrations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {[
              { title: 'Mehendi Artist', icon: Paintbrush, bg: 'from-emerald-500/5 to-transparent' },
              { title: 'Makeup Artist', icon: Sparkle, bg: 'from-pink-500/5 to-transparent' },
              { title: 'Wedding Planner', icon: Heart, bg: 'from-rose-500/5 to-transparent' },
              { title: 'Invitation Cards', icon: Mail, bg: 'from-indigo-500/5 to-transparent' },
              { title: 'Return Gifts', icon: Gift, bg: 'from-amber-500/5 to-transparent' },
              { title: 'Transport Services', icon: Car, bg: 'from-blue-500/5 to-transparent' },
              { title: 'Magician & Illusionist', icon: Sparkles, bg: 'from-purple-500/5 to-transparent' },
              { title: 'Live Music Bands', icon: Music, bg: 'from-red-500/5 to-transparent' }
            ].map((srv, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/60 shadow-2xs relative overflow-hidden flex flex-col items-center justify-center text-center h-32 sm:h-36 group hover:shadow-xs transition-shadow select-none"
              >
                {/* Visual glow background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${srv.bg} opacity-100 z-0`} />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-slate-100 shadow-2xs">
                    <srv.icon size={16} className="stroke-[1.5]" />
                  </div>
                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-700">{srv.title}</h4>
                  <span className="mt-1.5 inline-block px-2 py-0.5 text-[7.5px] font-bold tracking-widest uppercase bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                    COMING SOON
                  </span>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* 6. PARTNER PROMOTION & APP DOWNLOAD SECTION */}
      <section className="py-8 md:py-10" style={{ backgroundColor: '#d6f4e6' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Promo Card 1: Become Catering Partner */}
            <div className="bg-gradient-to-br from-[#051410] to-[#0f2922] text-white rounded-2xl p-5 md:p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group border border-slate-800 shadow-sm">
              <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400" 
                  alt="Premium Chef Kitchen" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/20 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest inline-block mb-2">
                  Catering Network
                </span>
                <h3 className="text-lg sm:text-xl font-display font-extrabold tracking-tight mb-2 text-white">
                  Become a Catering Partner
                </h3>
                <p className="text-slate-300 text-xs sm:text-[12.5px] font-medium leading-relaxed mb-4">
                  List your kitchens, showcase your menus and start receiving high-volume bookings for premium events across Hyderabad.
                </p>
              </div>
              <Link 
                to="/partner-selection" 
                className="relative z-10 self-start py-2 px-4 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Register Your Kitchen</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Promo Card 2: Download App (Coming Soon) */}
            <div className="bg-slate-50 border border-slate-200/80 text-slate-900 rounded-2xl p-5 md:p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group shadow-sm">
              <div className="absolute right-[-10px] bottom-[-10px] w-32 h-36 opacity-30 group-hover:opacity-40 transition-opacity flex items-end pointer-events-none">
                <div className="border-[3px] border-slate-950 rounded-lg w-full h-28 bg-slate-900 overflow-hidden relative shadow-2xs">
                  <div className="bg-[#DEAA38] h-1 w-8 mx-auto mt-1 rounded-full" />
                  <div className="p-1.5 text-[5px] text-white font-black">PlanMyChoice App</div>
                </div>
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/15 text-[#886C1D] border border-[#DEAA38]/30 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                  <Clock size={10} className="text-[#DEAA38]" /> Coming Soon
                </span>
                <h3 className="text-lg sm:text-xl font-display font-extrabold tracking-tight mb-2 text-slate-900">
                  Download App
                </h3>
                <p className="text-slate-500 text-xs sm:text-[12.5px] font-medium leading-relaxed mb-4">
                  Book premium caterers, customize dishes, and track your events seamlessly on the go.
                </p>
              </div>
              
              {/* Coming Soon status box - No fake store buttons */}
              <div className="relative z-10 self-start flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <Smartphone size={14} className="text-[#DEAA38]" />
                <span className="text-[11px] font-bold text-slate-700">iOS & Android App Launching Soon</span>
              </div>
            </div>

            {/* Promo Card 3: Become Service Partner */}
            <div className="bg-gradient-to-br from-[#0f2922] to-[#051410] text-white rounded-2xl p-5 md:p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group border border-slate-800 shadow-sm">
              <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=400" 
                  alt="Event decoration showcase" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/20 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest inline-block mb-2">
                  Service Fleet
                </span>
                <h3 className="text-lg sm:text-xl font-display font-extrabold tracking-tight mb-2 text-white">
                  Become an Event Partner
                </h3>
                <p className="text-slate-300 text-xs sm:text-[12.5px] font-medium leading-relaxed mb-4">
                  Are you a professional decorator, photographer, planner, or stage emcee? Secure certified bookings through PlanMyChoice.
                </p>
              </div>
              <Link 
                to="/partner-selection" 
                className="relative z-10 self-start py-2 px-4 bg-white hover:bg-slate-50 text-[#051410] rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Register Your Service</span>
                <ArrowRight size={13} />
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
