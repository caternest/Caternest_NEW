import React, { useState, useRef, useEffect } from 'react';
import { 
  Search,
  MapPin,
  Crosshair,
  ChevronDown,
  ArrowRight,
  Clock,
  Smartphone,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { HYDERABAD_AREAS } from '../data';

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

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans overflow-x-hidden pt-14 sm:pt-[58px]">
      
      {/* 1. ONE UNIFIED EMERALD-GREEN HERO */}
      <section 
        className="relative w-full overflow-hidden text-center py-10 sm:py-14 md:py-16 select-none"
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

      {/* 2. PARTNER PROMOTION & APP DOWNLOAD SECTION (Only Two Tiles: Catering Partner & Download App) */}
      <section className="py-10 sm:py-14" style={{ backgroundColor: '#d6f4e6' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            
            {/* Promo Card 1: Become Catering Partner */}
            <div className="bg-gradient-to-br from-[#051410] to-[#0f2922] text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between min-h-[230px] relative overflow-hidden group border border-slate-800 shadow-sm">
              <div className="absolute right-[-20px] bottom-[-20px] w-44 h-44 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
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
                <h3 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight mb-2 text-white">
                  Become a Catering Partner
                </h3>
                <p className="text-slate-300 text-xs sm:text-[13px] font-medium leading-relaxed mb-5">
                  List your kitchens, showcase your menus and start receiving high-volume bookings for premium events across Hyderabad.
                </p>
              </div>
              <Link 
                to="/partner-selection" 
                className="relative z-10 self-start py-2.5 px-5 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <span>Register Your Kitchen</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Promo Card 2: Download App (Coming Soon) */}
            <div className="bg-slate-50 border border-slate-200/80 text-slate-900 rounded-2xl p-6 sm:p-7 flex flex-col justify-between min-h-[230px] relative overflow-hidden group shadow-sm">
              <div className="absolute right-[-10px] bottom-[-10px] w-36 h-40 opacity-30 group-hover:opacity-40 transition-opacity flex items-end pointer-events-none">
                <div className="border-[3px] border-slate-950 rounded-lg w-full h-32 bg-slate-900 overflow-hidden relative shadow-2xs">
                  <div className="bg-[#DEAA38] h-1 w-8 mx-auto mt-1 rounded-full" />
                  <div className="p-1.5 text-[5px] text-white font-black">PlanMyChoice App</div>
                </div>
              </div>
              <div className="relative z-10 max-w-sm">
                <span className="bg-[#DEAA38]/15 text-[#886C1D] border border-[#DEAA38]/30 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                  <Clock size={10} className="text-[#DEAA38]" /> Coming Soon
                </span>
                <h3 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight mb-2 text-slate-900">
                  Download App
                </h3>
                <p className="text-slate-500 text-xs sm:text-[13px] font-medium leading-relaxed mb-5">
                  Book premium caterers, customize dishes, and track your events seamlessly on the go.
                </p>
              </div>
              
              {/* Coming Soon status badge */}
              <div className="relative z-10 self-start flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <Smartphone size={14} className="text-[#DEAA38]" />
                <span className="text-xs font-bold text-slate-700">iOS & Android App Launching Soon</span>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
