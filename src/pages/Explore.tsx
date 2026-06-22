import React, { useState, useEffect } from 'react';
import { DEMO_CATERERS } from '../data';
import { Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, Search, ChevronRight, ChevronLeft, Check, ChefHat, Heart, Users, Award, MenuSquare, ImageIcon } from 'lucide-react';
import { cn, safeSaveRegistrations } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../lib/supabase';

// Reusable Image Slider Component
function ImageSlider({ images, isHovered }: { images: string[], isHovered: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative h-64 w-full overflow-hidden bg-slate-100 group">
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          src={images[currentIndex]}
          alt="Caterer preview"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-800 transition-all opacity-0 pointer-events-none hover:bg-white hover:scale-110",
              isHovered && "opacity-100 pointer-events-auto"
            )}
          >
            <ChevronLeft size={18} />
          </button>
          
          <button
            onClick={nextImage}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-800 transition-all opacity-0 pointer-events-none hover:bg-white hover:scale-110",
              isHovered && "opacity-100 pointer-events-auto"
            )}
          >
            <ChevronRight size={18} />
          </button>
          
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={cn("h-1.5 rounded-full transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.5)]", currentIndex === idx ? "w-4 bg-white" : "w-1.5 bg-white/60")} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [caterers, setCaterers] = useState<any[]>(DEMO_CATERERS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'veg' | 'non-veg' | 'high-rated' | 'budget'>('all');
  const [sortOption, setSortOption] = useState<string>('Popular');

  console.log("Explore component initialized with DEMO_CATERERS count:", DEMO_CATERERS?.length, "caterers count state:", caterers?.length);

  useEffect(() => {
    const fetchCaterers = async () => {
      let allCaterers = [...(DEMO_CATERERS || [])];
      
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('caterer_registrations')
            .select('*')
            .or('status.eq.Approved,status.eq.approved');
            
          if (error) {
            throw error;
          }
          
          if (data && Array.isArray(data)) {
            const formattedCaterers = data.map((r: any) => ({
               id: r.id,
               name: r.businessName || 'Premium Caterer',
               location: r.address || r.location || 'Hyderabad', 
               type: r.type || 'Veg + Non-Veg',
               startingPrice: r.startingPrice || 350,
               rating: typeof r.rating === 'number' ? r.rating : 5.0,
               reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
               description: r.description || 'Welcome to our premium catering service.',
               images: r.galleryPhotos || r.gallery || r.images || [],
               logo: r.logo || null,
               coverBanner: r.coverBanner || null,
               address: r.address || 'Hyderabad, Telangana',
               phone: r.phone || '+91 00000 00000',
               menus: r.menus || [],
               menuPackages: r.menuPackages || r.packages || [],
               packages: r.packages || r.menuPackages || [],
               menuItems: r.menuItems || []
            }));
            
            allCaterers = [...allCaterers, ...formattedCaterers];
            // Cache locally
            safeSaveRegistrations(data);
          }
        } catch (e: any) {
          console.error("Error fetching registrations from Supabase in Explore page, falling back to local:", e);
          const raw = localStorage.getItem('registrations');
          if (raw) {
            try {
              const allRegs = JSON.parse(raw);
              if (Array.isArray(allRegs)) {
                const approved = allRegs.filter((r: any) => r && (r.status === 'Approved' || r.status === 'approved'));
                const formattedCaterers = approved.map((r: any) => ({
                   id: r.id,
                   name: r.businessName || 'Premium Caterer',
                   location: r.location || 'Hyderabad', 
                   type: r.type || 'Veg + Non-Veg',
                   startingPrice: r.startingPrice || 350,
                   rating: typeof r.rating === 'number' ? r.rating : 5.0,
                   reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
                   description: r.description || 'Welcome to our premium catering service.',
                   images: r.galleryPhotos || r.images || [],
                   logo: r.logo || null,
                   coverBanner: r.coverBanner || null,
                   address: r.address || 'Hyderabad, Telangana',
                   phone: r.phone || '+91 00000 00000',
                   menus: r.menus || [],
                   menuPackages: r.menuPackages || r.packages || [],
                   packages: r.packages || r.menuPackages || [],
                   menuItems: r.menuItems || []
                }));
                allCaterers = [...allCaterers, ...formattedCaterers];
              }
            } catch (localParseError) {
              console.error("Local parse error failed:", localParseError);
            }
          }
        }
      } else {
        const raw = localStorage.getItem('registrations');
        if (raw) {
          try {
            const allRegs = JSON.parse(raw);
            if (Array.isArray(allRegs)) {
              const approved = allRegs.filter((r: any) => r && (r.status === 'Approved' || r.status === 'approved'));
              const formattedCaterers = approved.map((r: any) => ({
                 id: r.id,
                 name: r.businessName || 'Premium Caterer',
                 location: r.location || 'Hyderabad', 
                 type: r.type || 'Veg + Non-Veg',
                 startingPrice: r.startingPrice || 350,
                 rating: typeof r.rating === 'number' ? r.rating : 5.0,
                 reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
                 description: r.description || 'Welcome to our premium catering service.',
                 images: r.galleryPhotos || r.images || [],
                 logo: r.logo || null,
                 coverBanner: r.coverBanner || null,
                 address: r.address || 'Hyderabad, Telangana',
                 phone: r.phone || '+91 00000 00000',
                 menus: r.menus || [],
                 menuPackages: r.menuPackages || r.packages || [],
                 packages: r.packages || r.menuPackages || [],
                 menuItems: r.menuItems || []
              }));
              allCaterers = [...allCaterers, ...formattedCaterers];
            }
          } catch (e) {
            console.error("Error parsing registrations in Explore page:", e);
          }
        }
      }
      setCaterers(allCaterers);
    };

    fetchCaterers();
  }, []);

  const filteredCaterers = (() => {
    let result = [...caterers];
    
    // Filter
    if (activeFilter === 'veg') {
       result = result.filter(c => c.type?.toLowerCase().includes('veg') && !c.type?.toLowerCase().includes('non'));
    } else if (activeFilter === 'non-veg') {
       result = result.filter(c => c.type?.toLowerCase().includes('non-veg') || c.type?.toLowerCase().includes('both') || c.type?.toLowerCase().includes('+'));
    } else if (activeFilter === 'high-rated') {
       result = result.filter(c => (Number(c.rating) || 5.0) >= 4.8);
    } else if (activeFilter === 'budget') {
       result = result.filter(c => (Number(c.startingPrice) || 0) <= 400);
    }

    // Sort
    if (sortOption === 'Price: Low to High') {
       result.sort((a, b) => (Number(a.startingPrice) || 0) - (Number(b.startingPrice) || 0));
    } else if (sortOption === 'Price: High to Low') {
       result.sort((a, b) => (Number(b.startingPrice) || 0) - (Number(a.startingPrice) || 0));
    } else if (sortOption === 'Highest Rated') {
       result.sort((a, b) => (Number(b.rating) || 5.0) - (Number(a.rating) || 5.0));
    }
    
    return result;
  })();

  try {
    return (
      <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 mb-4 tracking-tight">Explore Top Caterers</h1>
          <p className="text-[#0B3D2E] font-serif font-bold italic text-lg lg:text-xl">Handpicked premium wedding & party caterers near you</p>
          <div className="w-48 h-1 bg-brand-gold-500 mx-auto rounded-full mt-4 mb-8 relative">
              <div className="absolute left-1/2 -translate-x-1/2 -top-2 flex gap-1">
                 <Star className="text-brand-gold-500 fill-brand-gold-500" size={20} />
              </div>
          </div>
          
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
              <button 
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                      "px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md border-2 cursor-pointer",
                      activeFilter === 'all'
                          ? "bg-[#0B3D2E] text-white border-[#D4A437] shadow-[0_4px_12px_rgba(11,61,46,0.2)] scale-102"
                          : "bg-white border-slate-200 text-slate-800 hover:border-brand-gold-500 hover:text-brand-gold-600 hover:bg-slate-50"
                  )}
              >
                  All
              </button>
              <button 
                  onClick={() => setActiveFilter('veg')}
                  className={cn(
                      "px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md border-2 cursor-pointer flex items-center gap-2",
                      activeFilter === 'veg'
                          ? "bg-[#0B3D2E] text-white border-[#D4A437] shadow-[0_4px_12px_rgba(11,61,46,0.2)] scale-102"
                          : "bg-white border-slate-200 text-slate-800 hover:border-brand-gold-500 hover:text-brand-gold-600 hover:bg-slate-50"
                  )}
              >
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white"/>
                  Veg
              </button>
              <button 
                  onClick={() => setActiveFilter('non-veg')}
                  className={cn(
                      "px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md border-2 cursor-pointer flex items-center gap-2",
                      activeFilter === 'non-veg'
                          ? "bg-[#0B3D2E] text-white border-[#D4A437] shadow-[0_4px_12px_rgba(11,61,46,0.2)] scale-102"
                          : "bg-white border-slate-200 text-slate-800 hover:border-brand-gold-500 hover:text-brand-gold-600 hover:bg-slate-50"
                  )}
              >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white"/>
                  Non-Veg
              </button>
              <button 
                  onClick={() => setActiveFilter('high-rated')}
                  className={cn(
                      "px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md border-2 cursor-pointer flex items-center gap-2",
                      activeFilter === 'high-rated'
                          ? "bg-[#0B3D2E] text-white border-[#D4A437] shadow-[0_4px_12px_rgba(11,61,46,0.2)] scale-102"
                          : "bg-white border-slate-200 text-slate-800 hover:border-brand-gold-500 hover:text-brand-gold-600 hover:bg-slate-50"
                  )}
              >
                  <Star size={14} className="text-brand-gold-500 fill-brand-gold-500"/>
                  High Rated (4.8+)
              </button>
              <button 
                  onClick={() => setActiveFilter('budget')}
                  className={cn(
                      "px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md border-2 cursor-pointer flex items-center gap-2",
                      activeFilter === 'budget'
                          ? "bg-[#0B3D2E] text-white border-[#D4A437] shadow-[0_4px_12px_rgba(11,61,46,0.2)] scale-102"
                          : "bg-white border-slate-200 text-slate-800 hover:border-brand-gold-500 hover:text-brand-gold-600 hover:bg-slate-50"
                  )}
              >
                  Budget Friendly
              </button>
              
              <div className="ml-auto w-full md:w-auto mt-4 md:mt-0 relative flex items-center">
                  <span className="text-sm font-bold text-slate-700 mr-2">Sort by:</span>
                  <select 
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="appearance-none bg-white border-2 border-brand-gold-500/30 hover:border-brand-gold-500 rounded-xl px-4 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-brand-gold-500/10 cursor-pointer transition-all shadow-sm"
                  >
                      <option>Popular</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Highest Rated</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-3 rotate-90 text-slate-400 pointer-events-none" />
              </div>
          </div>
        </div>

        {/* Listing Grid */}
        {filteredCaterers.length === 0 ? (
           <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto w-full">
             <div className="w-16 h-16 bg-brand-green-50 text-brand-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <ChefHat size={24} />
             </div>
             <h3 className="text-xl font-display font-bold text-slate-900 mb-2">No caterers found</h3>
             <p className="text-slate-500 font-poppins text-sm max-w-sm mx-auto">
               We couldn't find any caterers matching your selection. Try changing filters or browse our complete catalog!
             </p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
             {filteredCaterers.map((caterer) => (
              <div 
                  key={caterer.id} 
                  onClick={() => navigate(`/caterer/${caterer.id}`)}
                  className="bg-white rounded-3xl shrink-0 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col group relative"
                  onMouseEnter={() => setHoveredCard(caterer.id)}
                  onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Image Background */}
                <div className="relative h-56 rounded-t-3xl overflow-hidden bg-slate-100 flex items-center justify-center">
                    {caterer.coverBanner || (caterer.images && caterer.images.length > 0) ? (
                        <img src={caterer.coverBanner || caterer.images[0]} alt={caterer.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <ImageIcon className="text-slate-300 w-16 h-16 opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
                    
                    {/* Top Badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        <div className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Star className="text-brand-gold-500 fill-brand-gold-500" size={14} />
                            {(Number(caterer.rating) || 5.0).toFixed(1)}
                        </div>
                    </div>

                    <button className="absolute top-4 left-4 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex justify-center items-center text-red-500 hover:bg-white transition-colors">
                        <Heart size={16} />
                    </button>
                </div>
                
                {/* Floating Logo Profile (positioned outside h-56 container so overflow-hidden doesn't crop it) */}
                <div className="absolute top-56 -translate-y-1/2 left-6 w-[80px] h-[80px] sm:w-[92px] sm:h-[92px] lg:w-[104px] lg:h-[104px] bg-[#FFFDFB] rounded-full p-1.5 border-2 border-[#D4AF37] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-10 flex items-center justify-center overflow-hidden">
                    {caterer.logo ? (
                        <img src={caterer.logo} alt="Logo" className="w-full h-full object-contain object-center rounded-full" />
                    ) : (
                        <span className="font-display font-bold text-[#D4AF37] text-lg sm:text-xl lg:text-2xl uppercase">{(caterer.name || 'Caterer').substring(0,2)}</span>
                    )}
                </div>
                
                <div className="p-6 pt-12 flex-1 flex flex-col relative z-0">
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold font-display text-slate-900 leading-tight mb-1">{caterer.name}</h3>
                        <p className="text-slate-500 text-sm italic mb-2 line-clamp-1">{caterer.description}</p>
                        <div className="flex items-center text-slate-500 text-sm font-medium">
                           <MapPin size={16} className="mr-1 text-slate-400" /> {caterer.location}
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"/> VEG</span>
                        <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"/> NON-VEG</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mb-6 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5"><Users size={16} className="text-brand-gold-500"/> 5000+ Events</div>
                        <div className="flex items-center gap-1.5"><Star size={16} className="text-brand-gold-500"/> 4.8 (210 reviews)</div>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100 mb-6">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 pl-1">Starting at</p>
                            <p className="font-display font-bold text-2xl text-slate-900 leading-none">₹{caterer.startingPrice} <span className="text-sm font-sans font-medium text-slate-500">/ plate</span></p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-auto">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/caterer/${caterer.id}`); }} className="flex-[0.8] py-3 bg-white text-slate-700 rounded-xl font-bold shadow-sm border border-slate-200 hover:bg-slate-50 text-sm transition-colors flex justify-center items-center">
                            View Details
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/caterer/${caterer.id}?tab=menu`); }} className="flex-1 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold shadow-md text-sm transition-all flex justify-center items-center gap-2">
                            Explore Menu <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
    );
  } catch (err: any) {
    console.error("Error rendering Explore page:", err);
    return (
      <div className="pt-32 pb-24 text-center min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <h1 className="text-red-500 font-bold text-3xl mb-4">Rendering Error</h1>
        <pre className="p-4 bg-slate-800 text-slate-100 rounded-lg text-left max-w-2xl overflow-auto text-sm">
          {err?.stack || err?.message || String(err)}
        </pre>
      </div>
    );
  }
}
