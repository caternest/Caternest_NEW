import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, ChevronRight, ChevronLeft, Star, Quote, ChefHat, User, ShieldCheck, Tag, CheckCircle2, ImageIcon, Heart, Users, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { HYDERABAD_AREAS, DEMO_CATERERS, DEMO_REVIEWS } from '../data';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { getSupabase } from '../lib/supabase';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=2070',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=2070',
  'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=2070'
];

function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const fetchCustomerActiveOrders = async () => {
    if (!user) return;
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const filtered = data.filter((o: any) => 
            o.userId === user.id || 
            (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
            o.customerName === user.name
          );
          setActiveOrders(filtered);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      try {
        const raw = localStorage.getItem('orders') || '[]';
        const parsed = JSON.parse(raw);
        const filtered = parsed.filter((o: any) => 
          o.userId === user.id || 
          (o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
          o.customerName === user.name
        );
        setActiveOrders(filtered);
      } catch(e) {}
    }
  };

  useEffect(() => {
    fetchCustomerActiveOrders();

    const supabase = getSupabase();
    if (supabase) {
      const channel = supabase
        .channel('homepage-active-orders-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            fetchCustomerActiveOrders();
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const getStatusBadgeInfo = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('submit') || s === 'pending caterer review' || s.includes('pending')) {
      return { label: 'Submitted', bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
    }
    if (s.includes('approve') || s === 'approved') {
      return { label: 'Approved', bg: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' };
    }
    if (s.includes('change') || s === 'changes_requested') {
      return { label: 'Changes Requested', bg: 'bg-orange-100 text-orange-850 border-orange-200', dot: 'bg-orange-500' };
    }
    if (s.includes('reject') || s === 'rejected') {
      return { label: 'Rejected', bg: 'bg-red-100 text-red-800 border-red-250', dot: 'bg-red-500' };
    }
    if (s.includes('complete') || s === 'completed') {
      return { label: 'Completed', bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' };
    }
    return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500' };
  };

  return (
    <div className="relative h-[90vh] min-h-[750px] w-full overflow-hidden flex flex-col justify-center bg-brand-green-900 border-b-[12px] border-brand-green-950">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentImageIndex}
          src={HERO_IMAGES[currentImageIndex]}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover lg:object-[70%_center] object-center"
          alt="Premium Catering Setup"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-green-950 via-brand-green-900/90 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-green-950/40 via-transparent to-brand-green-900/90" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full mt-16 pb-20 flex flex-col lg:flex-row gap-12 items-center justify-between">
        <div className="max-w-3xl flex-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-tight leading-[1.1] mb-4">
              Find & Book <br />
              <span className="text-brand-gold-100 italic font-medium mt-3 block font-serif">For Your Special Events</span>
            </h1>
          </motion.div>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-white/90 text-lg md:text-xl md:pr-12 mb-8 mt-6 font-light leading-relaxed">
            Discover caterers, customize menus <br className="hidden md:block" />and make your celebrations unforgettable.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="flex flex-wrap items-center gap-6 mb-10 text-white/90 text-sm font-semibold tracking-wide">
             <span className="flex items-center gap-2"><ChefHat className="text-brand-gold-500" size={18} /> Best Menu Options</span>
             <span className="flex items-center gap-2"><Tag className="text-brand-gold-500" size={18} /> Affordable Prices</span>
             <span className="flex items-center gap-2"><CheckCircle2 className="text-brand-gold-500" size={18} /> Secure Booking</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="relative bg-white p-2.5 rounded-[2rem] shadow-2xl flex flex-col sm:flex-row gap-2 max-w-3xl">
            <div className="flex flex-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 flex-col sm:flex-row">
              {/* Static Location Hyderabad */}
              <div className="relative flex-1 flex flex-col justify-end px-5 pt-3 pb-3">
                <div className="absolute text-xs text-slate-500 px-1 top-2.5 font-semibold">Location</div>
                <div className="flex items-center gap-2 mt-4 text-slate-800 font-bold text-sm">
                  <MapPin className="text-brand-gold-500" size={18} />
                  <span>Hyderabad</span>
                </div>
              </div>

              <div className="relative flex-[1.5]">
                <div className="absolute inset-y-0 text-xs text-slate-500 px-4 top-2 font-semibold font-sans">Search cuisine or caterer</div>
                <div className="absolute inset-y-0 left-4 top-6 flex items-center pointer-events-none">
                  <Search className="text-slate-700" size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by cuisine, name..."
                  className="w-full pl-10 pr-4 pt-8 pb-3 rounded-b-3xl sm:rounded-none bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 transition-all font-bold text-sm"
                />
              </div>
            </div>
            
            <button 
              onClick={() => {
                navigate(`/explore?search=${encodeURIComponent(searchQuery)}&location=Hyderabad`);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-full font-bold transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap text-sm mt-2 sm:mt-0"
            >
              Search Caterers <ChevronRight size={18} />
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/explore" className="bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 px-8 py-3 rounded-full font-bold transition-colors shadow-[0_0_15px_rgba(222,170,56,0.3)] flex items-center gap-2 text-sm tracking-wide">
              <ChefHat size={16} /> Explore Caterers
            </Link>
          </motion.div>
        </div>

        {/* Homepage top-right area Customer Order Summary Widget */}
        {user && !user.roles.includes('partner') && !user.roles.includes('admin') && activeOrders.length > 0 && (
          <div className="w-full lg:w-[420px] bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/20 shrink-0 text-slate-900 self-start lg:mt-8">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                📦 My Orders <span className="text-xs font-sans px-2 py-0.5 bg-brand-green-50 text-brand-green-800 rounded-full font-bold">{activeOrders.length}</span>
              </h3>
              <Link to="/orders" className="text-xs text-brand-gold-600 hover:text-brand-gold-700 font-bold hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {activeOrders.map((order) => {
                const badge = getStatusBadgeInfo(order.status);
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate('/orders')}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-150 transition-all cursor-pointer group flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-950 text-sm group-hover:text-brand-green-900 transition-colors line-clamp-1">
                        {order.catererName}
                      </h4>
                      <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border shrink-0", badge.bg)}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 text-[11px] text-slate-600 font-medium border-t border-slate-100/80 pt-2">
                      <div>
                        <span className="text-slate-400">Date:</span> {order.eventDate || 'N/A'}
                      </div>
                      <div>
                        <span className="text-slate-400">Package:</span> {order.packageDetails?.packageName || 'Custom'}
                      </div>
                      <div>
                        <span className="text-slate-400">Guests:</span> {order.guests}
                      </div>
                      <div>
                        <span className="text-slate-400">Amount:</span> <span className="text-slate-900 font-bold">₹{order.totalEstimate?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slider Controls */}
      <div className="absolute bottom-10 right-10 flex items-center gap-4 z-10">
        <button 
          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}
          className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 backdrop-blur-md transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length)}
          className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 backdrop-blur-md transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Slider Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex justify-center gap-2.5 z-10">
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImageIndex(idx)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              currentImageIndex === idx ? "w-8 bg-brand-gold-500 shadow-[0_0_10px_rgba(222,170,56,0.6)]" : "w-2 bg-white/40 hover:bg-white/80"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function TrendingCaterers() {
  const navigate = useNavigate();
  const [caterers, setCaterers] = useState<any[]>(DEMO_CATERERS);

  useEffect(() => {
    let allCaterers: any[] = [...(DEMO_CATERERS || [])];
    const raw = localStorage.getItem('registrations');
    if (raw) {
      try {
        const allRegs = JSON.parse(raw);
        if (Array.isArray(allRegs)) {
          const approved = allRegs.filter((r: any) => r && r.status === 'Approved');
          
          const formattedCaterers = approved.map((r: any) => ({
             id: r.id,
             name: r.businessName || 'Premium Caterer',
             location: r.location || 'Hyderabad', 
             type: r.type || 'Veg + Non-Veg',
             startingPrice: r.startingPrice || 300,
             rating: typeof r.rating === 'number' ? r.rating : 5.0,
             reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
             description: r.description || 'Welcome to our premium catering service.',
             images: r.galleryPhotos || r.images || [],
             logo: r.logo || null,
             coverBanner: r.coverBanner || null,
             address: r.address || 'Hyderabad, Telangana',
          }));
          allCaterers = [...allCaterers, ...formattedCaterers];
        }
      } catch (e) {
        console.error("Error parsing registrations in Home page:", e);
      }
    }
    setCaterers(allCaterers.slice(0, 4));
  }, []);

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-brand-gold-600 font-semibold uppercase tracking-wider text-sm mb-2">
              <Star size={16} fill="currentColor" /> Handpicked Premium Caterers
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900">Explore Top Caterers</h2>
          </div>
          {caterers.length > 0 && (
            <Link to="/explore" className="hidden md:flex items-center gap-2 border border-slate-300 px-6 py-2.5 rounded-full text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm">
              View All Caterers <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {caterers.length === 0 ? (
           <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
             <div className="w-16 h-16 bg-brand-green-50 text-brand-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <ChefHat size={24} />
             </div>
             <h3 className="text-xl font-display font-bold text-slate-900 mb-2">No approved businesses available</h3>
             <p className="text-slate-500 font-poppins text-sm max-w-sm mx-auto">
               We're currently reviewing partner applications. Check back soon for premium catering options!
             </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {caterers.slice(0, 3).map((caterer) => (
              <motion.div 
                key={caterer.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => navigate(`/caterer/${caterer.id}`)}
                className="bg-white rounded-3xl shrink-0 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col group relative"
              >
              <div className="relative h-56 rounded-t-3xl overflow-hidden flex items-center justify-center bg-slate-100">
                {caterer.coverBanner || (caterer.images && caterer.images.length > 0) ? (
                    <img 
                      src={caterer.coverBanner || caterer.images[0]} 
                      alt={caterer.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <ImageIcon className="text-slate-300 w-16 h-16 opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
                
                <div className="absolute top-4 right-4 flex gap-2">
                    <div className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Star className="text-brand-gold-500 fill-brand-gold-500" size={14} />
                        {(Number(caterer.rating) || 5.0).toFixed(1)}
                    </div>
                </div>

                <div className="absolute bottom-0 translate-y-1/2 left-6 w-20 h-20 bg-white rounded-full p-1.5 shadow-lg z-10 border border-slate-100 flex items-center justify-center overflow-hidden">
                    {caterer.logo ? (
                        <img src={caterer.logo} alt="Logo" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="font-display font-bold text-slate-300 text-2xl uppercase">{(caterer.name || 'Caterer').substring(0,2)}</span>
                    )}
                </div>
              </div>
              <div className="p-6 pt-12 flex-1 flex flex-col relative z-0">
                <div className="mb-4">
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-1 line-clamp-1">{caterer.name}</h3>
                  <p className="text-slate-500 text-sm italic mb-2 line-clamp-1">{caterer.description}</p>
                  <div className="flex items-center text-slate-500 text-sm font-medium">
                    <MapPin size={16} className="mr-1 text-slate-400" />
                    <span>{caterer.location}</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"/> VEG</span>
                    <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"/> NON-VEG</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 mb-6 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5"><Users size={16} className="text-brand-gold-500"/> 800+ Events</div>
                    <div className="flex items-center gap-1.5"><Star size={16} className="text-brand-gold-500"/> {Number(caterer.rating).toFixed(1)} (120 reviews)</div>
                </div>

                <div className="mt-auto flex items-end justify-between pt-4 border-t border-slate-100 mb-6">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 pl-1">Starting at</p>
                        <p className="font-display font-bold text-2xl text-slate-900 leading-none">₹{caterer.startingPrice} <span className="text-sm font-sans font-medium text-slate-500">/ plate</span></p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/caterer/${caterer.id}`); }} className="flex-[0.8] py-3 bg-white text-slate-700 rounded-xl font-bold shadow-sm border border-slate-200 hover:bg-slate-50 text-sm transition-colors flex justify-center items-center">
                        View Details
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/caterer/${caterer.id}?tab=menu`); }} className="flex-1 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold shadow-md text-sm transition-all flex justify-center items-center gap-2">
                        Explore Menu <ChevronRight size={16} />
                    </button>
                </div>
              </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function WhyChooseUs() {
  const features = [
    { title: 'Easy Booking', description: 'Select menus, customize dishes, and book seamlessly online.', icon: 'Calendar' },
    { title: 'Transparent Pricing', description: 'No hidden charges. Clear per-plate pricing and cost breakdowns.', icon: 'Tag' }
  ];

  return (
    <section className="py-24 bg-brand-green-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-900/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 text-brand-gold-500 font-semibold uppercase tracking-wider text-sm mb-4">
            Why Choose Us
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">Why Choose CaterNest?</h2>
          <div className="w-24 h-1 bg-brand-gold-500 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-brand-green-800/50 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center hover:bg-brand-green-800 hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-brand-green-900/80 border border-brand-gold-500/30 text-brand-gold-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <ChefHat size={28} />
              </div>
              <h3 className="text-xl font-bold font-display text-brand-gold-100 mb-3">{feature.title}</h3>
              <p className="text-brand-green-100/70 leading-relaxed text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <TrendingCaterers />
      <WhyChooseUs />
    </div>
  );
}
