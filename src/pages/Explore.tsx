import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import heroBg from '../assets/images/Hero-bg.png';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  ChefHat, 
  Tag, 
  CheckCircle2, 
  ImageIcon, 
  Heart, 
  Users, 
  Calendar, 
  Sparkles,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Award,
  Filter,
  X,
  Clock
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HYDERABAD_AREAS, DEMO_CATERERS, DEMO_REVIEWS } from '../data';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { getSupabase } from '../lib/supabase';
import { MapPickerModal } from '../components/MapPickerModal';
import { calculateDistanceKm, estimateDrivingTimeMinutes, searchLocations } from '../lib/locationIntelligence';

// Helper to return beautiful, premium fallback images for caterers
export function getCatererImagesFallback(name: string, images?: string[]): string[] {
  const defaultImages = [
    'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800', // Party catering table
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800', // Assorted food
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800', // Indian buffet
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800'  // Premium dining
  ];

  // Clean the existing images array of any falsy or broken placeholder values
  const cleanImages = (images || []).filter(img => 
    img && 
    typeof img === 'string' && 
    img.trim() !== '' && 
    !img.includes('placeholder') && 
    !img.includes('broken') &&
    img.startsWith('http')
  );

  if (cleanImages.length > 0) {
    return cleanImages;
  }

  // Assign high quality specific images based on caterer name keywords
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('south') || lowerName.includes('venue')) {
    return [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800', // South Indian traditional spread
      'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&q=80&w=800'  // South Indian delicacies
    ];
  }
  if (lowerName.includes('elite')) {
    return [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800', // Luxury wedding buffet
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800'
    ];
  }
  if (lowerName.includes('grand') || lowerName.includes('feast')) {
    return [
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800'
    ];
  }
  if (lowerName.includes('royal') || lowerName.includes('flavour')) {
    return [
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
    ];
  }
  if (lowerName.includes('spice') || lowerName.includes('affair')) {
    return [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800'
    ];
  }

  // Dynamic assignment based on string hash to vary fallbacks nicely
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % defaultImages.length;
  return [defaultImages[index], defaultImages[(index + 1) % defaultImages.length]];
}

// Reusable Image component that handles error fallbacks elegantly without broken placeholder icons
export function SafeImage({ src, alt, className, style, fallbackType = 'catering' }: { 
  src: string | null | undefined; 
  alt: string; 
  className?: string; 
  style?: React.CSSProperties;
  fallbackType?: 'catering' | 'occasion' | 'cuisine' | 'avatar' | 'logo'
}) {
  const getFallback = () => {
    if (fallbackType === 'cuisine') {
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=60&w=400';
    }
    if (fallbackType === 'occasion') {
      return 'https://images.unsplash.com/photo-1531058020387-3be344559be6?auto=format&fit=crop&q=60&w=400';
    }
    if (fallbackType === 'avatar') {
      return 'https://i.pravatar.cc/150?u=fallback';
    }
    if (fallbackType === 'logo') {
      return '';
    }
    return 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800'; // luxury wedding buffet
  };

  const initialSrc = src && typeof src === 'string' && src.trim() !== '' ? src : getFallback();
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src && typeof src === 'string' && src.trim() !== '') {
      setImgSrc(src);
      setHasError(false);
    } else {
      setImgSrc(getFallback());
    }
  }, [src, fallbackType]);

  if (fallbackType === 'logo' && (!src || src.trim() === '')) {
    return null; // Let the text-based circle logo render instead
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(getFallback());
        }
      }}
    />
  );
}

function GoldOrnamentalCorner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const rotationClass = {
    'top-left': 'top-2.5 left-2.5',
    'top-right': 'top-2.5 right-2.5 rotate-90',
    'bottom-left': 'bottom-2.5 left-2.5 -rotate-90',
    'bottom-right': 'bottom-2.5 right-2.5 rotate-180',
  }[position];

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("absolute w-10 h-10 md:w-12 md:h-12 text-[#DEAA38]/80 pointer-events-none select-none z-10", rotationClass)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer corner frame line */}
      <path d="M 6,90 L 6,10 C 6,7 7,6 10,6 L 90,6" strokeWidth="1.2" />
      <path d="M 14,90 L 14,14 L 90,14" strokeWidth="0.8" opacity="0.5" />
      
      {/* Elegant scroll curls */}
      <path d="M 6,6 C 18,6 26,14 26,26 C 26,38 14,32 20,20 C 24,12 34,6 48,6" strokeWidth="1" />
      <path d="M 6,6 C 6,18 14,26 26,26 C 38,26 32,14 20,20 C 12,24 6,34 6,48" strokeWidth="1" />
      
      {/* Inner accent fleur-de-lis style leaf */}
      <path d="M 14,14 L 32,32" strokeWidth="0.8" />
      <path d="M 32,32 C 34,28 34,22 28,24 Z" fill="currentColor" opacity="0.15" />
      <path d="M 32,32 C 28,34 22,34 24,28 Z" fill="currentColor" opacity="0.15" />
      
      {/* Tiny ornamental dots */}
      <circle cx="14" cy="14" r="1.5" fill="currentColor" />
      <circle cx="21" cy="21" r="1.2" fill="currentColor" />
      <circle cx="27" cy="27" r="0.9" fill="currentColor" />
    </svg>
  );
}

const OCCASIONS = [
  { name: 'Wedding', img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Reception', img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=600' },
  { name: 'Birthday', img: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=600' },
  { name: 'Housewarming', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600' },
  { name: 'Corporate', img: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=600' },
  { name: 'Engagement', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600' },
  { name: 'Baby Shower', img: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600' },
  { name: 'Festival', img: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&q=80&w=600' }
];

const CUISINES = [
  { name: 'Hyderabadi', img: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=60&w=400' },
  { name: 'South Indian', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=60&w=400' },
  { name: 'North Indian', img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=60&w=400' },
  { name: 'Chinese', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=60&w=400' },
  { name: 'Continental', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=60&w=400' },
  { name: 'Live Counters', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=60&w=400' },
  { name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=60&w=400' },
  { name: 'Multi Cuisine', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=60&w=400' }
];

// Horizontal Image Slider for Caterer Cards
function CardImageSlider({ images, name }: { images: string[]; name: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Clean and prepare valid images list using our helper
  const fallbackList = getCatererImagesFallback(name, images);
  const [validImages, setValidImages] = useState<string[]>(fallbackList);

  useEffect(() => {
    setValidImages(getCatererImagesFallback(name, images));
    setCurrentIndex(0);
  }, [images, name]);

  const handleImageError = (index: number) => {
    const updated = [...validImages];
    if (updated.length > 1) {
      updated.splice(index, 1);
      setValidImages(updated);
      if (currentIndex >= updated.length) {
        setCurrentIndex(0);
      }
    } else {
      // Fallback to beautiful default single images based on name
      setValidImages(['https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800']);
      setCurrentIndex(0);
    }
  };

  if (!validImages || validImages.length === 0) {
    return (
      <div className="w-full h-full bg-slate-150 flex items-center justify-center">
        <ImageIcon className="text-slate-300 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group overflow-hidden">
      <img
        src={validImages[currentIndex]}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        referrerPolicy="no-referrer"
        onError={() => handleImageError(currentIndex)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % validImages.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <ChevronRight size={14} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {validImages.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentIndex === idx ? "w-3 bg-brand-gold-500" : "w-1.5 bg-white/60"
                )}
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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Search Form State
  const [searchLocation, setSearchLocation] = useState('Hyderabad');
  const [searchOccasion, setSearchOccasion] = useState('');
  const [searchGuests, setSearchGuests] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Customer Precise Location States for intelligence/filtering
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [isExploreMapOpen, setIsExploreMapOpen] = useState(false);

  // Caterers & Filtering State
  const [caterers, setCaterers] = useState<any[]>([]);
  const [filteredCaterers, setFilteredCaterers] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  
  // Active Filter States
  const [cuisineFilter, setCuisineFilter] = useState<string>('Both'); // Veg, Non-Veg, Both, Pure Veg
  const [occasionFilter, setOccasionFilter] = useState<string[]>(['Wedding']); // Pre-selected 'Wedding'
  const [budgetFilter, setBudgetFilter] = useState<number>(600); // Pre-selected ₹300 - ₹600
  const [guestsFilter, setGuestsFilter] = useState<string[]>(['200 - 500']); // Pre-selected '200 - 500'
  const [sortOption, setSortOption] = useState<string>('Popularity');
  const [isLiveCounters, setIsLiveCounters] = useState<boolean>(false);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState<boolean>(false);

  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qLocation = searchParams.get('location') || 'Hyderabad';
    const qBudget = searchParams.get('budget') || '';
    const qGuests = searchParams.get('guests') || '';

    if (qSearch) {
      setSearchKeyword(qSearch);
      const matchedOcc = ['Wedding', 'Reception', 'Birthday', 'Corporate', 'Housewarming', 'Engagement', 'Baby Shower', 'Festival'].find(
        o => o.toLowerCase() === qSearch.toLowerCase() || qSearch.toLowerCase().includes(o.toLowerCase())
      );
      if (matchedOcc) {
        setOccasionFilter([matchedOcc]);
      } else {
        setOccasionFilter([]);
      }
    }
    if (qLocation) {
      setSearchLocation(qLocation);
    }
    const qLat = searchParams.get('lat');
    const qLng = searchParams.get('lng');
    if (qLat && qLng) {
      setCustomerLat(parseFloat(qLat));
      setCustomerLng(parseFloat(qLng));
    } else {
      const savedLat = localStorage.getItem('customer_lat');
      const savedLng = localStorage.getItem('customer_lng');
      const savedAddr = localStorage.getItem('customer_address');
      if (savedLat && savedLng) {
        setCustomerLat(parseFloat(savedLat));
        setCustomerLng(parseFloat(savedLng));
        if (savedAddr) setSearchLocation(savedAddr);
      }
    }
    if (qBudget) {
      setSearchBudget(qBudget);
      if (qBudget === '300-400') setBudgetFilter(400);
      else if (qBudget === '400-600') setBudgetFilter(600);
      else if (qBudget === '600-800') setBudgetFilter(800);
      else if (qBudget === '800+') setBudgetFilter(1000);
    }
    if (qGuests) {
      setSearchGuests(qGuests);
      if (qGuests === 'Upto 50') setGuestsFilter(['Upto 50']);
      else if (qGuests === '50-100') setGuestsFilter(['50 - 105']);
      else if (qGuests === '100-200') setGuestsFilter(['100 - 200']);
      else if (qGuests === '200-500') setGuestsFilter(['200 - 500']);
      else if (qGuests === '500-1000') setGuestsFilter(['500 - 1000']);
      else if (qGuests === '1000+') setGuestsFilter(['1000+']);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('scroll') === 'true') {
      const timer = setTimeout(() => {
        const element = document.getElementById('explore-marketplace');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          
          const newParams = new URLSearchParams(window.location.search);
          newParams.delete('scroll');
          const newSearch = newParams.toString();
          navigate({
            pathname: window.location.pathname,
            search: newSearch ? `?${newSearch}` : '',
          }, { replace: true });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

  // Accordion Open states
  const [openCuisine, setOpenCuisine] = useState(true);
  const [openOccasion, setOpenOccasion] = useState(true);
  const [openBudget, setOpenBudget] = useState(true);
  const [openGuests, setOpenGuests] = useState(true);
  const [openMoreFilters, setOpenMoreFilters] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Fetch active customer orders
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
        .channel('explore-active-orders-channel-upgraded')
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

  // Fetch approved caterers
  useEffect(() => {
    const fetchCaterersData = async () => {
      let allCaterers: any[] = [];
      const supabase = getSupabase();
      
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('caterer_registrations')
            .select('*')
            .or('status.eq.Approved,status.eq.approved');
          
          if (!error && data && Array.isArray(data)) {
            const formatted = data.map((r: any) => ({
              id: r.id,
              name: r.businessName || 'Premium Caterer',
              location: r.address || r.location || 'Hyderabad', 
              type: r.type || 'Veg + Non-Veg',
              startingPrice: Number(r.startingPrice) || 350,
              rating: typeof r.rating === 'number' ? r.rating : 5.0,
              reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
              description: r.description || 'Welcome to our premium catering service.',
              images: getCatererImagesFallback(r.businessName || 'Premium Caterer', r.galleryPhotos || r.gallery || r.images || []),
              logo: r.logo || null,
              coverBanner: r.coverBanner || null,
              address: r.address || 'Hyderabad, Telangana',
              phone: r.phone || '+91 00000 00000',
              isVerified: r.isVerified || true,
              isPremium: r.isPremium || true,
              latitude: r.latitude ? Number(r.latitude) : null,
              longitude: r.longitude ? Number(r.longitude) : null,
              serviceRadiusKm: r.serviceRadiusKm ? Number(r.serviceRadiusKm) : 15,
            }));
            allCaterers = [...formatted];
          }
        } catch (e) {
          console.error("Failed to fetch from Supabase:", e);
        }
      }

      // Check local storage for registrations
      const raw = localStorage.getItem('registrations');
      if (raw) {
        try {
          const allRegs = JSON.parse(raw);
          if (Array.isArray(allRegs)) {
            const approved = allRegs.filter((r: any) => r && (r.status === 'Approved' || r.status === 'approved'));
            const formatted = approved.map((r: any) => ({
              id: r.id,
              name: r.businessName || 'Premium Caterer',
              location: r.location || 'Hyderabad', 
              type: r.type || 'Veg + Non-Veg',
              startingPrice: Number(r.startingPrice) || 350,
              rating: typeof r.rating === 'number' ? r.rating : 5.0,
              reviewCount: typeof r.reviewCount === 'number' ? r.reviewCount : 0,
              description: r.description || 'Welcome to our premium catering service.',
              images: getCatererImagesFallback(r.businessName || 'Premium Caterer', r.galleryPhotos || r.images || []),
              logo: r.logo || null,
              coverBanner: r.coverBanner || null,
              address: r.address || 'Hyderabad, Telangana',
              phone: r.phone || '+91 00000 00000',
              isVerified: true,
              isPremium: true,
              latitude: r.latitude ? Number(r.latitude) : null,
              longitude: r.longitude ? Number(r.longitude) : null,
              serviceRadiusKm: r.serviceRadiusKm ? Number(r.serviceRadiusKm) : 15,
            }));

            const existingIds = new Set(allCaterers.map(c => c.id));
            formatted.forEach(c => {
              if (!existingIds.has(c.id)) {
                allCaterers.push(c);
              }
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Populate default high-quality catering businesses
      if (allCaterers.length === 0) {
        allCaterers = [
          {
            id: 'c1',
            name: 'Elite Catering',
            location: 'Banjara Hills, Hyderabad',
            type: 'Veg + Non-Veg',
            startingPrice: 350,
            rating: 4.9,
            reviewCount: 1230,
            description: 'Award winning wedding & premium event caterers specializing in rich Hyderabadi biryani and continental cuisines.',
            images: [
              'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800'
            ],
            logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=150',
            coverBanner: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=1200',
            address: 'Banjara Hills, Hyderabad',
            isVerified: true,
            isPremium: true,
            years: '5+ Years',
            latitude: 17.4156,
            longitude: 78.4414,
            serviceRadiusKm: 15
          },
          {
            id: 'c2',
            name: 'The Grand Feast',
            location: 'Jubilee Hills, Hyderabad',
            type: 'Veg + Non-Veg',
            startingPrice: 320,
            rating: 4.8,
            reviewCount: 680,
            description: 'Delicious traditional and modern fusion menus curated for massive receptions, corporate galas, and fine gatherings.',
            images: [
              'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800'
            ],
            logo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=150',
            coverBanner: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=1200',
            address: 'Jubilee Hills, Hyderabad',
            isVerified: true,
            isPremium: true,
            years: '4+ Years',
            latitude: 17.4300,
            longitude: 78.4000,
            serviceRadiusKm: 12
          },
          {
            id: 'c3',
            name: 'Royal Flavours',
            location: 'Somajiguda, Hyderabad',
            type: 'Veg + Non-Veg',
            startingPrice: 400,
            rating: 4.9,
            reviewCount: 2360,
            description: 'Royal Mughlai delicacies, traditional Telangana delights and premium live counters for luxury events.',
            images: [
              'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
            ],
            logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=150',
            coverBanner: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=80&w=1200',
            address: 'Somajiguda, Hyderabad',
            isVerified: true,
            isPremium: true,
            years: '7+ Years',
            latitude: 17.4265,
            longitude: 78.4530,
            serviceRadiusKm: 20
          },
          {
            id: 'c4',
            name: 'Spice Affair',
            location: 'Madhapur, Hyderabad',
            type: 'Veg + Non-Veg',
            startingPrice: 300,
            rating: 4.7,
            reviewCount: 700,
            description: 'Gourmet wedding spreads and luxury multi-cuisine buffet tables with specialized global desserts.',
            images: [
              'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
              'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800'
            ],
            logo: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=150',
            coverBanner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
            address: 'Madhapur, Hyderabad',
            isVerified: true,
            isPremium: true,
            years: '3+ Years',
            latitude: 17.4485,
            longitude: 78.3741,
            serviceRadiusKm: 10
          }
        ];
      }

      setCaterers(allCaterers);
    };

    fetchCaterersData();
  }, []);

  // Filter & Sort Logic
  useEffect(() => {
    let result = [...caterers];

    // Compute distances if customer location is set
    if (customerLat !== null && customerLng !== null) {
      result = result.map(c => {
        if (c.latitude !== null && c.longitude !== null) {
          const dist = calculateDistanceKm(customerLat, customerLng, c.latitude, c.longitude);
          const time = estimateDrivingTimeMinutes(dist);
          return { ...c, distanceKm: dist, drivingTimeMins: time };
        }
        return { ...c, distanceKm: null, drivingTimeMins: null };
      });

      // Filter: Show caterers whose service radius includes the customer's location
      result = result.filter(c => c.distanceKm === null || c.distanceKm <= (c.serviceRadiusKm || 15));
    }

    // Cuisine Preference
    if (cuisineFilter === 'Veg') {
      result = result.filter(c => c.type?.toLowerCase() === 'veg' || c.type?.toLowerCase().includes('pure veg'));
    } else if (cuisineFilter === 'Non-Veg') {
      result = result.filter(c => c.type?.toLowerCase().includes('non-veg') || c.type?.toLowerCase().includes('both') || c.type?.toLowerCase().includes('+'));
    } else if (cuisineFilter === 'Pure Veg') {
      result = result.filter(c => c.type?.toLowerCase().includes('pure veg') || c.type?.toLowerCase() === 'veg');
    }

    // Occasion Filters
    if (occasionFilter.length > 0) {
      result = result.filter(c => {
        const desc = (c.description || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        return occasionFilter.some(occ => desc.includes(occ.toLowerCase()) || name.includes(occ.toLowerCase()) || occ.toLowerCase() === 'wedding');
      });
    }

    // Budget range Filter
    result = result.filter(c => (c.startingPrice || 300) <= budgetFilter);

    // Live Counters toggle
    if (isLiveCounters) {
      result = result.filter(c => (c.description || '').toLowerCase().includes('live') || c.name.toLowerCase().includes('elite') || c.name.toLowerCase().includes('spice'));
    }

    // Verified only toggle
    if (isVerifiedOnly) {
      result = result.filter(c => c.isVerified);
    }

    // Search keyword pre-filter if typed in search panel
    if (searchKeyword.trim() !== '') {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(kw) || c.description.toLowerCase().includes(kw) || c.location.toLowerCase().includes(kw));
    }

    // Sort options
    if (sortOption === 'Price: Low to High') {
      result.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortOption === 'Price: High to Low') {
      result.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortOption === 'Highest Rated' || sortOption === 'Popularity') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'Nearest First' || sortOption === 'Lowest Delivery Distance') {
      result.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortOption === 'Fastest Arrival') {
      result.sort((a, b) => {
        if (a.drivingTimeMins === null && b.drivingTimeMins === null) return 0;
        if (a.drivingTimeMins === null) return 1;
        if (b.drivingTimeMins === null) return -1;
        return a.drivingTimeMins - b.drivingTimeMins;
      });
    } else if (sortOption === 'Highest Rated Nearby') {
      result.sort((a, b) => {
        const aInRadius = a.distanceKm !== null && a.distanceKm <= (a.serviceRadiusKm || 15);
        const bInRadius = b.distanceKm !== null && b.distanceKm <= (b.serviceRadiusKm || 15);
        if (aInRadius && !bInRadius) return -1;
        if (!aInRadius && bInRadius) return 1;
        return b.rating - a.rating;
      });
    }

    setFilteredCaterers(result);
  }, [caterers, cuisineFilter, occasionFilter, budgetFilter, isLiveCounters, isVerifiedOnly, sortOption, searchKeyword, customerLat, customerLng]);

  const toggleOccasionFilter = (occName: string) => {
    setOccasionFilter((prev) => 
      prev.includes(occName) ? prev.filter(o => o !== occName) : [...prev, occName]
    );
  };

  const clearAllFilters = () => {
    setCuisineFilter('Both');
    setOccasionFilter([]);
    setBudgetFilter(1000);
    setGuestsFilter([]);
    setIsLiveCounters(false);
    setIsVerifiedOnly(false);
    setSearchKeyword('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For Explore page, search can be handled inline directly by updating filter keyword
    if (searchKeyword) {
      setSearchKeyword(searchKeyword);
    } else if (searchOccasion) {
      setSearchKeyword(searchOccasion);
    }
    const el = document.getElementById('explore-marketplace');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      
      {/* 1. Hero Section: Static, 1:1 expected design, rich dark green gradient overlay */}
      <div 
        className="relative min-h-[460px] md:h-[480px] w-full flex flex-col justify-start pt-24 pb-20 overflow-visible"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(2, 27, 20, 0.92) 0%, rgba(2, 27, 20, 0.82) 28%, rgba(2, 27, 20, 0.55) 55%, rgba(2, 27, 20, 0.20) 75%, rgba(2, 27, 20, 0.00) 100%), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          paddingBottom: '112px',
          paddingLeft: '1px',
          marginBottom: '0px',
          marginTop: '-51px'
        }}
      >
        {/* Real image layer positioned absolutely to bypass sandbox background-image CSS loading issues */}
        <img 
          src={heroBg} 
          alt="Luxury banquet dinner table setting"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
        />
        {/* Explicit gradient overlay layer above the image and under the text */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(2, 27, 20, 0.92) 0%, rgba(2, 27, 20, 0.82) 28%, rgba(2, 27, 20, 0.55) 55%, rgba(2, 27, 20, 0.20) 75%, rgba(2, 27, 20, 0.00) 100%)'
          }}
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-start text-left">
          
          <div className="max-w-2xl mt-4 sm:mt-8 pl-4 sm:pl-8 md:pl-12 lg:pl-16">
            <h1 
              className="text-[2.75rem] md:text-[3.8rem] font-display text-white tracking-tight leading-[1.1] mb-5 font-semibold"
              style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
            >
              Premium <br />
              <span className="text-[#DEAA38]" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>Catering Marketplace</span>
            </h1>
            
            <p 
              className="text-white/85 text-xs sm:text-[13px] max-w-lg mb-6 font-sans font-light leading-relaxed"
              style={{
                width: '450px',
                maxWidth: '100%',
                paddingLeft: '6px',
                fontFamily: 'Inter',
                color: 'rgba(255, 255, 255, 0.75)'
              }}
            >
              Discover top verified caterers, customized menus and unforgettable experiences for every occasion.
            </p>
          </div>

          {/* White floating search panel overlapping the bottom boundary exactly (50% in, 50% out) */}
          <div 
            className="absolute bottom-0 left-1/2 w-[calc(100%-2rem)] max-w-4xl bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(3,19,14,0.12)] border border-slate-100 flex flex-col gap-4 z-20"
            style={{ 
              transform: 'translate(-50%, 50%)',
              height: 'auto',
              backgroundColor: '#ffffff',
              paddingLeft: '23px',
              paddingTop: '26px',
              paddingBottom: '20px',
              paddingRight: '20px',
              marginBottom: '-150px'
            }}
          >
            
            {/* Row 1: Search Form Grid + Find Caterers Button */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 border border-slate-100 rounded-2xl md:border-0 md:rounded-none">
                
                {/* Field 1: Location */}
                <div 
                  onClick={() => setIsExploreMapOpen(true)}
                  className="relative flex items-center px-4 py-2 text-left gap-3 h-12 cursor-pointer hover:bg-stone-50/50 transition-colors rounded-l-2xl"
                >
                  <MapPin size={18} className="text-[#DEAA38] shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
                      Location
                    </span>
                    <span className="font-bold text-slate-800 text-xs truncate mt-1">
                      {searchLocation || "Select Location..."}
                    </span>
                  </div>
                  <ChevronRight size={10} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                </div>

                {/* Field 2: Occasion */}
                <div className="relative flex items-center px-4 py-2 text-left gap-3 h-12">
                  <Clock size={18} className="text-[#DEAA38] shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
                      Occasion
                    </span>
                    <div className="relative mt-1">
                      <select 
                        value={searchOccasion} 
                        onChange={(e) => setSearchOccasion(e.target.value)}
                        className="font-bold text-slate-800 text-xs focus:outline-none bg-transparent cursor-pointer w-full appearance-none pr-4"
                      >
                        <option value="">Select Occasion</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Reception">Reception</option>
                        <option value="Birthday">Birthday Party</option>
                        <option value="Corporate">Corporate Event</option>
                        <option value="Housewarming">House Warming</option>
                        <option value="Engagement">Engagement</option>
                      </select>
                      <ChevronRight size={10} className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Field 3: Guests */}
                <div className="relative flex items-center px-4 py-2 text-left gap-3 h-12">
                  <Users size={18} className="text-[#DEAA38] shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
                      Guests
                    </span>
                    <div className="relative mt-1">
                      <select 
                        value={searchGuests} 
                        onChange={(e) => setSearchGuests(e.target.value)}
                        className="font-bold text-slate-800 text-xs focus:outline-none bg-transparent cursor-pointer w-full appearance-none pr-4"
                      >
                        <option value="">No. of Guests</option>
                        <option value="Upto 50">Upto 50</option>
                        <option value="50-100">50 - 100</option>
                        <option value="100-200">100 - 200</option>
                        <option value="200-500">200 - 500</option>
                        <option value="500-1000">500 - 1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                      <ChevronRight size={10} className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Field 4: Budget */}
                <div className="relative flex items-center px-4 py-2 text-left gap-3 h-12">
                  <Tag size={18} className="text-[#DEAA38] shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
                      Budget
                    </span>
                    <div className="relative mt-1">
                      <select 
                        value={searchBudget} 
                        onChange={(e) => setSearchBudget(e.target.value)}
                        className="font-bold text-slate-800 text-xs focus:outline-none bg-transparent cursor-pointer w-full appearance-none pr-4"
                      >
                        <option value="">Select Budget</option>
                        <option value="300-400">₹300 - ₹400</option>
                        <option value="400-600">₹400 - ₹600</option>
                        <option value="600-800">₹600 - ₹800</option>
                        <option value="800+">₹800+</option>
                      </select>
                      <ChevronRight size={10} className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Find Caterers Button with search icon on right */}
              <button 
                type="submit"
                className="bg-[#051410] hover:bg-[#112921] hover:text-[#DEAA38] text-white px-7 py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap md:self-stretch cursor-pointer border border-[#DEAA38]/10"
              >
                <span>Find Caterers</span>
                <Search size={14} />
              </button>
            </form>

            {/* Row 2: Popular Searches inside the white card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Popular Searches:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Wedding Catering', val: 'Wedding' },
                  { label: 'Birthday Party', val: 'Birthday' },
                  { label: 'Corporate Events', val: 'Corporate' },
                  { label: 'House Warming', val: 'Housewarming' },
                  { label: 'Engagement', val: 'Engagement' }
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchOccasion(chip.val);
                      setSearchKeyword(chip.val);
                      const el = document.getElementById('explore-marketplace');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-4 py-1.5 bg-[#fdf8f0] hover:bg-[#DEAA38] hover:text-[#051410] text-[#825021] rounded-full text-[11px] font-extrabold transition-all cursor-pointer border border-[#eed5a7]/35 shadow-2xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 2. Browse by Occasion Section - Tighter margins, custom horizontal carousel cards */}
      <section className="pt-44 md:pt-28 pb-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Luxury Gold Ornamental Border Container */}
          <div 
            className="relative border border-[#DEAA38]/35 rounded-[2rem] bg-white shadow-xs"
            style={{
              width: '1219px',
              maxWidth: '100%',
              minHeight: '249.583px',
              marginBottom: '-12px',
              marginTop: '44px',
              marginRight: '0px',
              paddingLeft: '43px',
              paddingBottom: '24px',
              paddingRight: '46px',
              paddingTop: '20px'
            }}
          >
            {/* Corner Ornaments */}
            <GoldOrnamentalCorner position="top-left" />
            <GoldOrnamentalCorner position="top-right" />
            <GoldOrnamentalCorner position="bottom-left" />
            <GoldOrnamentalCorner position="bottom-right" />

            <div className="flex justify-between items-end mb-6 px-1 md:px-3">
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  Browse By <span className="text-[#DEAA38]">Occasion</span>
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  const el = document.getElementById('explore-marketplace');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="text-xs font-bold text-[#DEAA38] hover:text-[#c28824] flex items-center gap-1 hover:underline transition-all mr-1 md:mr-3 cursor-pointer bg-transparent border-0"
              >
                <span>View All Occasions</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Carousel wrapper with navigation arrows matching the expected design */}
            <div className="relative px-0 md:px-6">
              <button
                type="button"
                className="absolute left-0 md:left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#DEAA38]/40 bg-white flex items-center justify-center text-[#DEAA38] hover:bg-[#DEAA38] hover:text-[#051410] transition-all cursor-pointer shadow-xs z-10 hidden sm:flex -ml-4"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Compact visual cards matching the expected design grid dimensions and roundedness */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {OCCASIONS.map((occ, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSearchKeyword(occ.name);
                      toggleOccasionFilter(occ.name);
                      const el = document.getElementById('explore-marketplace');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white rounded-[1.25rem] border border-slate-100 shadow-xs overflow-hidden text-center cursor-pointer group hover:scale-103 hover:shadow-md hover:border-amber-500/20 transition-all duration-300"
                  >
                    <div className="w-full aspect-[4/3] overflow-hidden bg-slate-50">
                      <SafeImage src={occ.img} alt={occ.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="occasion" />
                    </div>
                    <div className="py-2.5 px-1 text-center bg-white">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-[#DEAA38] transition-colors">{occ.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="absolute right-0 md:right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#DEAA38]/40 bg-white flex items-center justify-center text-[#DEAA38] hover:bg-[#DEAA38] hover:text-[#051410] transition-all cursor-pointer shadow-xs z-10 hidden sm:flex -mr-4"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Browse by Cuisine Section - Tighter padding, compact aspect cards */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ marginTop: '-22px' }}>
          
          {/* Luxury Gold Ornamental Border Container */}
          <div 
            className="relative border border-[#DEAA38]/35 rounded-[2rem] bg-white shadow-xs"
            style={{
              paddingTop: '16px',
              paddingBottom: '38px',
              paddingRight: '41px',
              paddingLeft: '41px',
              minHeight: '261.583px'
            }}
          >
            {/* Corner Ornaments */}
            <GoldOrnamentalCorner position="top-left" />
            <GoldOrnamentalCorner position="top-right" />
            <GoldOrnamentalCorner position="bottom-left" />
            <GoldOrnamentalCorner position="bottom-right" />

            <div className="flex justify-between items-end mb-6 px-1 md:px-3">
              <div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 tracking-tight">
                  Browse By <span className="text-[#DEAA38]">Cuisine</span>
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  const el = document.getElementById('explore-marketplace');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="text-xs font-bold text-[#DEAA38] hover:text-[#c28824] flex items-center gap-1 hover:underline transition-all mr-1 md:mr-3 cursor-pointer bg-transparent border-0"
              >
                <span>View All Cuisines</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Carousel wrapper with navigation arrows matching the expected design */}
            <div className="relative px-0 md:px-6">
              <button
                type="button"
                className="absolute left-0 md:left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#DEAA38]/40 bg-white flex items-center justify-center text-[#DEAA38] hover:bg-[#DEAA38] hover:text-[#051410] transition-all cursor-pointer shadow-xs z-10 hidden sm:flex -ml-4"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {CUISINES.map((cui, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setSearchKeyword(cui.name);
                      const el = document.getElementById('explore-marketplace');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white rounded-[1.25rem] border border-slate-100 shadow-xs overflow-hidden text-center cursor-pointer group hover:scale-103 hover:shadow-md hover:border-amber-500/20 transition-all duration-300"
                  >
                    <div className="w-full aspect-[4/3] overflow-hidden bg-slate-50">
                      <SafeImage src={cui.img} alt={cui.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallbackType="cuisine" />
                    </div>
                    <div className="py-2.5 px-1 text-center bg-white">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-[#DEAA38] transition-colors">{cui.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="absolute right-0 md:right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#DEAA38]/40 bg-white flex items-center justify-center text-[#DEAA38] hover:bg-[#DEAA38] hover:text-[#051410] transition-all cursor-pointer shadow-xs z-10 hidden sm:flex -mr-4"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Explore Premium Caterers Section - 1:1 Design Layout with Left Sidebar & Horizontal Cards */}
      <section id="explore-marketplace" className="py-14 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div 
            className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-100"
            style={{ marginTop: '-35px' }}
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Explore <span className="text-[#DEAA38]">Premium</span> Caterers
              </h2>
              <p className="text-slate-400 text-xs font-bold mt-1">Hyderabad, Telangana, India</p>
            </div>
            
            <div className="flex items-center gap-4 mt-4 md:mt-0 justify-between md:justify-end w-full md:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{filteredCaterers.length} Caterers Found</span>
              <div className="flex items-center relative">
                <span className="text-xs font-bold text-slate-500 mr-2 whitespace-nowrap">Sort by:</span>
                 <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-full px-5 py-2 pr-9 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer hover:border-brand-gold-500/50 transition-colors"
                >
                  <option value="Popularity">Popularity</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Highest Rated">Highest Rated</option>
                  {customerLat !== null && customerLng !== null && (
                    <>
                      <option value="Nearest First">Nearest First</option>
                      <option value="Lowest Delivery Distance">Lowest Delivery Distance</option>
                      <option value="Highest Rated Nearby">Highest Rated Nearby</option>
                      <option value="Fastest Arrival">Fastest Arrival</option>
                    </>
                  )}
                </select>
                <ChevronRight size={12} className="absolute right-3.5 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick filter action bar at top of results grid */}
          <div 
            className="flex flex-wrap items-center gap-2.5 mb-6 bg-slate-50/50 p-3 rounded-2xl border border-slate-100"
            style={{ marginTop: '-17px' }}
          >
            
            <button 
              type="button"
              onClick={() => setCuisineFilter('Veg')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer",
                cuisineFilter === 'Veg' ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-700"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Veg
            </button>
            
            <button 
              type="button"
              onClick={() => setCuisineFilter('Non-Veg')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer",
                cuisineFilter === 'Non-Veg' ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-white border-slate-200 text-slate-700"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Non-Veg
            </button>

            <button 
              type="button"
              onClick={() => setCuisineFilter('Both')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer",
                cuisineFilter === 'Both' ? "bg-slate-100 border-slate-300 text-slate-900" : "bg-white border-slate-200 text-slate-700"
              )}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Both
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

            <button 
              type="button"
              onClick={() => setOpenMoreFilters(!openMoreFilters)}
              className="px-4 py-2 text-xs font-bold rounded-xl border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>More Filters</span>
              <ChevronRight size={12} className={cn("transition-transform", openMoreFilters && "rotate-90")} />
            </button>

            <button 
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors ml-auto cursor-pointer"
            >
              Clear All
            </button>

            <button 
              type="button"
              onClick={() => {
                const el = document.getElementById('explore-marketplace');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0f2922] hover:bg-[#173D32] rounded-xl transition-all cursor-pointer uppercase tracking-wider"
            >
              Apply Filters
            </button>
          </div>

          {/* Active filter badge tags */}
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-slate-600 font-bold">
            {occasionFilter.map((occ) => (
              <span key={occ} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full flex items-center gap-1">
                Occasion: {occ} <button type="button" onClick={() => toggleOccasionFilter(occ)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
              </span>
            ))}
            {guestsFilter.map((gst) => (
              <span key={gst} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full flex items-center gap-1">
                Guests: {gst} <button type="button" onClick={() => setGuestsFilter([])} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
              </span>
            ))}
            {budgetFilter < 1000 && (
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full flex items-center gap-1">
                Budget: ≤ ₹{budgetFilter} <button type="button" onClick={() => setBudgetFilter(1000)} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
              </span>
            )}
            {(occasionFilter.length > 0 || guestsFilter.length > 0 || budgetFilter < 1000) && (
              <button type="button" onClick={clearAllFilters} className="text-rose-600 hover:underline hover:text-rose-700 ml-1.5">
                Clear All
              </button>
            )}
          </div>

          {/* Mobile Filters Trigger */}
          <div className="lg:hidden mb-5">
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="w-full py-3.5 bg-[#051410] hover:bg-[#112921] text-white rounded-xl font-bold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 border border-[#DEAA38]/10 cursor-pointer active:scale-95 min-h-[48px]"
            >
              <Filter size={14} className="text-[#DEAA38]" />
              <span>{isMobileFiltersOpen ? "HIDE FILTERS" : "SHOW FILTERS"}</span>
            </button>
          </div>

          {/* Grid setup */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Column Sidebar Filters (Tightly formatted, compact margin) */}
            <div className={cn(
              "lg:col-span-1 self-start bg-slate-50/80 rounded-3xl p-5 border border-slate-200/50 shadow-2xs transition-all",
              isMobileFiltersOpen ? "block" : "hidden lg:block"
            )}>
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
                <span className="font-display font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Filter size={15} className="text-slate-700" /> Filters
                </span>
                <button 
                  type="button"
                  onClick={clearAllFilters} 
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Sidebar Accordions */}
              <div className="space-y-4">
                {/* 1. Cuisine Preference */}
                <div className="border-b border-slate-200/85 pb-3">
                  <button 
                    type="button"
                    onClick={() => setOpenCuisine(!openCuisine)} 
                    className="flex justify-between items-center w-full text-left font-bold text-slate-800 text-[11px] uppercase tracking-wider cursor-pointer"
                  >
                    <span>Cuisine Preference</span>
                    <ChevronRight size={12} className={cn("text-slate-400 transition-transform", openCuisine && "rotate-90")} />
                  </button>
                  {openCuisine && (
                    <div className="space-y-2.5 pt-2.5">
                      {['Veg', 'Non-Veg', 'Both', 'Pure Veg'].map((option) => (
                        <label key={option} className="flex items-center gap-2.5 text-xs text-slate-600 font-bold cursor-pointer select-none">
                          <input 
                            type="radio" 
                            name="sidebar-cuisine-pref"
                            checked={cuisineFilter === option}
                            onChange={() => setCuisineFilter(option)}
                            className="w-4 h-4 rounded border-slate-300 text-brand-gold-500 focus:ring-brand-gold-500/20"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Occasion Checkboxes */}
                <div className="border-b border-slate-200/85 pb-3">
                  <button 
                    type="button"
                    onClick={() => setOpenOccasion(!openOccasion)} 
                    className="flex justify-between items-center w-full text-left font-bold text-slate-800 text-[11px] uppercase tracking-wider cursor-pointer"
                  >
                    <span>Occasion</span>
                    <ChevronRight size={12} className={cn("text-slate-400 transition-transform", openOccasion && "rotate-90")} />
                  </button>
                  {openOccasion && (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pt-2.5 pr-1">
                      {['Wedding', 'Reception', 'Birthday Party', 'Corporate Events', 'House Warming', 'Engagement', 'Baby Shower', 'Festival'].map((occ) => (
                        <label key={occ} className="flex items-center gap-2.5 text-xs text-slate-600 font-bold cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={occasionFilter.includes(occ)}
                            onChange={() => toggleOccasionFilter(occ)}
                            className="w-4 h-4 rounded border-slate-300 text-brand-gold-500 focus:ring-brand-gold-500/20 cursor-pointer"
                          />
                          <span>{occ}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Budget Range Slider */}
                <div className="border-b border-slate-200/85 pb-3">
                  <button 
                    type="button"
                    onClick={() => setOpenBudget(!openBudget)} 
                    className="flex justify-between items-center w-full text-left font-bold text-slate-800 text-[11px] uppercase tracking-wider cursor-pointer"
                  >
                    <span>Budget (Per Plate)</span>
                    <ChevronRight size={12} className={cn("text-slate-400 transition-transform", openBudget && "rotate-90")} />
                  </button>
                  {openBudget && (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>₹300</span>
                        <span className="text-[#DEAA38]">Max: ₹{budgetFilter}</span>
                      </div>
                      <input 
                        type="range" 
                        min="300" 
                        max="1000" 
                        step="20"
                        value={budgetFilter}
                        onChange={(e) => setBudgetFilter(Number(e.target.value))}
                        className="w-full accent-[#DEAA38] h-1 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {[400, 600, 800, 1000].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setBudgetFilter(v)}
                            className={cn(
                              "py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                              budgetFilter === v 
                                ? "bg-[#0f2922] border-transparent text-white" 
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            )}
                          >
                            ₹{v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Guests Selection */}
                <div className="border-b border-slate-200/85 pb-3">
                  <button 
                    type="button"
                    onClick={() => setOpenGuests(!openGuests)} 
                    className="flex justify-between items-center w-full text-left font-bold text-slate-800 text-[11px] uppercase tracking-wider cursor-pointer"
                  >
                    <span>Guests Capacity</span>
                    <ChevronRight size={12} className={cn("text-slate-400 transition-transform", openGuests && "rotate-90")} />
                  </button>
                  {openGuests && (
                    <div className="space-y-2.5 pt-2.5">
                      {['Upto 50', '50 - 105', '100 - 200', '200 - 500', '500 - 1000', '1000+'].map((cap) => (
                        <label key={cap} className="flex items-center gap-2.5 text-xs text-slate-600 font-bold cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={guestsFilter.includes(cap)}
                            onChange={() => {
                              setGuestsFilter(prev => prev.includes(cap) ? prev.filter(g => g !== cap) : [...prev, cap]);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-brand-gold-500 focus:ring-brand-gold-500/20 cursor-pointer"
                          />
                          <span>{cap}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. More Filters */}
                <div>
                  <button 
                    type="button"
                    onClick={() => setOpenMoreFilters(!openMoreFilters)} 
                    className="flex justify-between items-center w-full text-left font-bold text-slate-800 text-[11px] uppercase tracking-wider cursor-pointer"
                  >
                    <span>More Filters</span>
                    <ChevronRight size={12} className={cn("text-slate-400 transition-transform", openMoreFilters && "rotate-90")} />
                  </button>
                  {openMoreFilters && (
                    <div className="space-y-3 pt-2.5">
                      <label className="flex items-center justify-between text-xs text-slate-600 font-bold cursor-pointer select-none">
                        <span>Verified Caterers</span>
                        <input 
                          type="checkbox" 
                          checked={isVerifiedOnly}
                          onChange={(e) => setIsVerifiedOnly(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-brand-gold-500 focus:ring-brand-gold-500/20 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs text-slate-600 font-bold cursor-pointer select-none">
                        <span>Live Counters Only</span>
                        <input 
                          type="checkbox" 
                          checked={isLiveCounters}
                          onChange={(e) => setIsLiveCounters(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-brand-gold-500 focus:ring-brand-gold-500/20 cursor-pointer"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column Grid Results: Compact premium horizontal cards exactly matching Image 1 layout */}
            <div className="lg:col-span-3 space-y-5">
              {filteredCaterers.length === 0 ? (
                <div className="bg-[#FFFDFB] rounded-3xl p-12 text-center border border-slate-100 max-w-md mx-auto">
                  <ChefHat className="text-slate-300 w-12 h-12 mx-auto mb-3" />
                  <h3 className="text-base font-display font-extrabold text-slate-900 mb-1">No matching caterers found</h3>
                  <p className="text-slate-400 text-xs font-semibold">Try adjusting your budget slider or occasion filters.</p>
                  <button 
                    type="button"
                    onClick={clearAllFilters} 
                    className="mt-4 px-5 py-2 bg-[#0f2922] text-white font-bold text-xs rounded-xl hover:bg-[#173D32] transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredCaterers.map((caterer) => (
                  <div 
                    key={caterer.id}
                    className="bg-white rounded-[1.5rem] border border-slate-200/80 hover:border-brand-gold-500/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row overflow-hidden relative group"
                  >
                    {/* Image Column */}
                    <div className="relative w-full md:w-[260px] h-48 md:h-auto shrink-0 overflow-hidden">
                      <CardImageSlider images={caterer.images} name={caterer.name} />
                      
                      {/* Overlapping circular brand logo placed on the image like Image 1 */}
                      <div className="absolute bottom-3 left-3 w-14 h-14 bg-white rounded-full p-1 border border-[#DEAA38] shadow-md z-10 flex items-center justify-center overflow-hidden">
                        {caterer.logo ? (
                          <SafeImage src={caterer.logo} alt="Logo" className="w-full h-full object-contain rounded-full" fallbackType="avatar" />
                        ) : (
                          <span className="font-display font-black text-[#DEAA38] text-sm uppercase">
                            {(caterer.name || 'CR').substring(0, 2)}
                          </span>
                        )}
                      </div>

                      <button type="button" className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex justify-center items-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm z-10">
                        <Heart size={14} />
                      </button>
                    </div>

                    {/* Middle Column Details */}
                    <div className="flex-1 p-5 md:p-6 flex flex-col justify-between text-left md:pr-4">
                      <div>
                        {/* Badges/Tags */}
                        <div className="flex flex-wrap gap-2 mb-2 items-center">
                          {caterer.isVerified && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                              ✓ Verified
                            </span>
                          )}
                          {caterer.isPremium && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                              ✦ Premium Partner
                            </span>
                          )}
                        </div>

                        {/* Title with verified check icon */}
                        <h3 className="text-lg md:text-xl font-display font-extrabold text-slate-900 group-hover:text-brand-gold-600 transition-colors leading-tight mb-1 flex items-center gap-1.5">
                          {caterer.name}
                          <span className="w-4.5 h-4.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold shadow-xs shrink-0">✓</span>
                        </h3>

                        {/* Rating, Reviews & Location info */}
                        <div className="flex flex-wrap items-center text-slate-500 text-xs font-semibold mb-3 gap-2.5">
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-[#DEAA38] fill-[#DEAA38]" /> 
                            <span>{Number(caterer.rating).toFixed(1)}</span>
                            <span className="text-slate-400 font-normal">({caterer.reviewCount.toLocaleString()} Reviews)</span>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="flex items-center gap-0.5"><MapPin size={12} className="text-slate-400" /> {caterer.location}</span>
                          {caterer.distanceKm !== undefined && caterer.distanceKm !== null && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="flex items-center gap-1.5 text-[#b47a00] bg-amber-500/5 px-2.5 py-0.5 rounded-full font-mono border border-amber-500/10 text-[11px]">
                                📍 {caterer.distanceKm.toFixed(1)} KM • {caterer.drivingTimeMins} mins away
                              </span>
                            </>
                          )}
                        </div>

                        {/* Dietary preferences pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="px-2 py-0.5 text-[8px] font-black tracking-wider uppercase bg-slate-50 text-slate-600 rounded border border-slate-150 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Veg
                          </span>
                          <span className="px-2 py-0.5 text-[8px] font-black tracking-wider uppercase bg-slate-50 text-slate-600 rounded border border-slate-150 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Non-Veg
                          </span>
                          <span className="px-2 py-0.5 text-[8px] font-black tracking-wider uppercase bg-slate-50 text-slate-600 rounded border border-slate-150 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#DEAA38]" /> Live Counters
                          </span>
                        </div>

                        {/* Micro performance indicators */}
                        <div className="flex items-center gap-3.5 text-[11px] font-bold text-slate-500 mb-2">
                          <div className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> 800+ Events</div>
                          <div className="flex items-center gap-1"><Award size={12} className="text-slate-400" /> {caterer.years || '5+ Years'}</div>
                        </div>
                      </div>

                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider line-clamp-1 border-t border-slate-50 pt-2">
                        Speciality: <span className="text-slate-600">Hyderabadi, North Indian, Chinese</span>
                      </p>
                    </div>

                    {/* Right Column: Pricing & Action buttons */}
                    <div className="w-full md:w-[180px] p-5 md:p-6 bg-slate-50/50 md:border-l border-dashed border-slate-200 flex flex-col sm:flex-row md:flex-col justify-between md:justify-center items-center md:text-center shrink-0 gap-4 md:gap-0">
                      <div className="text-left md:text-center flex sm:flex-col justify-between sm:justify-start items-center sm:items-start md:items-center w-full sm:w-auto md:w-full mb-0 md:mb-4">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Starting from</p>
                          <p className="font-display font-extrabold text-2xl text-slate-900 leading-none">
                            ₹{caterer.startingPrice} 
                            <span className="text-[10px] font-sans font-medium text-slate-400 inline-block ml-0.5">/ plate</span>
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 sm:mt-1.5 whitespace-nowrap">Min. {caterer.minimumGuests || 50} Plates</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-1 gap-2 w-full">
                        <button 
                          type="button"
                          onClick={() => navigate(`/caterer/${caterer.id}?tab=menu`)} 
                          className="w-full py-3.5 md:py-2 bg-[#0f2922] hover:bg-[#173D32] text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex justify-center items-center min-h-[48px] active:scale-95"
                        >
                          View Menu
                        </button>
                        <button 
                          type="button"
                          onClick={() => navigate(`/caterer/${caterer.id}`)} 
                          className="w-full py-3.5 md:py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer min-h-[48px] active:scale-95"
                        >
                          Quick View
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 5. Trust Badges row - Compact padding, perfect alignment */}
      <section className="py-8 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { title: 'Verified & Trusted', desc: 'Only verified & top-rated caterers', icon: ShieldCheck },
              { title: 'Transparent Pricing', desc: 'No hidden charges, clear & honest pricing', icon: Tag },
              { title: 'AI Menu Builder', desc: 'Custom menu recommended by AI', icon: Sparkles },
              { title: 'Hygiene Certified', desc: 'Food safety & hygiene is our priority', icon: Award },
              { title: 'Instant Quotes', desc: 'Get quotes in just a few minutes', icon: Smartphone },
              { title: '24x7 Support', desc: "We're here to help you anytime", icon: ChefHat }
            ].map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-3.5 bg-white rounded-xl border border-slate-100/80 hover:shadow-sm transition-shadow group">
                <div className="w-10 h-10 rounded-full bg-brand-gold-500/10 text-[#DEAA38] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <badge.icon size={18} className="stroke-[1.5]" />
                </div>
                <h5 className="text-[11px] font-black text-slate-800 leading-tight mb-0.5">{badge.title}</h5>
                <p className="text-[9px] text-slate-400 font-semibold leading-tight">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Bottom Bento Promotional Section - Tightly aligned, compact gaps, high graphic polish */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Block 1: AI Menu Builder Promo */}
            <div className="bg-gradient-to-br from-[#051410] to-[#0f2922] text-white rounded-[2rem] p-7 flex flex-col justify-between h-[280px] relative overflow-hidden group border border-slate-800 shadow-lg">
              <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-20 group-hover:opacity-30 transition-opacity">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400" 
                  alt="Elegant Food Plate" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <span className="bg-[#DEAA38]/20 text-[#DEAA38] border border-[#DEAA38]/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block mb-2">
                  New Feature
                </span>
                <h3 className="text-xl font-display font-extrabold tracking-tight mb-1 text-white">AI Menu Builder</h3>
                <p className="text-slate-300 text-[11px] font-medium leading-relaxed max-w-[200px]">Create the perfect custom menu for your event with AI suggestions.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const el = document.getElementById('explore-marketplace');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="self-start py-2 px-4 bg-[#DEAA38] hover:bg-[#c28824] text-[#051410] rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-md cursor-pointer"
              >
                <span>Try Now</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {/* Block 2: Download CaterNest App Promo */}
            <div className="bg-slate-50 border border-slate-200/80 text-slate-900 rounded-[2rem] p-7 flex flex-col justify-between h-[280px] relative overflow-hidden group shadow-md">
              <div className="absolute right-[-10px] bottom-[-10px] w-36 h-40 opacity-30 group-hover:opacity-40 transition-opacity flex items-end">
                <div className="border-[4px] border-slate-950 rounded-xl w-full h-32 bg-slate-900 overflow-hidden relative shadow-sm">
                  <div className="bg-[#DEAA38] h-1.5 w-10 mx-auto mt-1 rounded-full" />
                  <div className="p-2 text-[6px] text-white font-black">CaterNest App</div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-display font-extrabold tracking-tight mb-1 text-slate-900">Download App</h3>
                <p className="text-slate-400 text-[11px] font-semibold leading-relaxed max-w-[190px] mb-2">Book premium caterers and track deliveries on the go.</p>
                <div className="flex gap-1.5">
                  <div className="w-20 py-1 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-white font-bold text-[8px]">Google Play</div>
                  <div className="w-20 py-1 bg-slate-950 rounded border border-slate-800 flex items-center justify-center text-white font-bold text-[8px]">App Store</div>
                </div>
              </div>
              
              {/* QR Code section */}
              <div className="self-start flex items-center gap-2.5">
                <div className="w-10 h-10 bg-white border border-slate-200 p-1 rounded flex items-center justify-center">
                  <div className="w-full h-full bg-slate-200 border border-dashed border-slate-400" />
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Scan to download</p>
                  <p className="text-[10px] font-extrabold text-slate-700 leading-none">Get 10% Off First Order</p>
                </div>
              </div>
            </div>

            {/* Block 3: Become a Partner Promo */}
            <div className="bg-gradient-to-br from-[#0f2922] to-[#051410] text-white rounded-[2rem] p-7 flex flex-col justify-between h-[280px] relative overflow-hidden group border border-slate-800 shadow-lg">
              <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-20 group-hover:opacity-30 transition-opacity">
                <img 
                  src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400" 
                  alt="Become a partner chef" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <h3 className="text-xl font-display font-extrabold tracking-tight mb-1 text-white">Become a Partner</h3>
                <p className="text-slate-300 text-[11px] font-medium leading-relaxed max-w-[200px]">Grow your brand and business with India's best marketplace network.</p>
              </div>
              <Link 
                to="/partner-selection" 
                className="self-start py-2 px-4 bg-white hover:bg-slate-50 text-[#051410] rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-md cursor-pointer"
              >
                <span>Register Now</span>
                <ArrowRight size={12} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      <MapPickerModal
        isOpen={isExploreMapOpen}
        onClose={() => setIsExploreMapOpen(false)}
        initialLat={customerLat || 17.3850}
        initialLng={customerLng || 78.4867}
        initialAddress={searchLocation === 'Hyderabad' ? '' : searchLocation}
        onSave={(data) => {
          setSearchLocation(data.address);
          setCustomerLat(data.latitude);
          setCustomerLng(data.longitude);
          if (data.latitude) localStorage.setItem('customer_lat', String(data.latitude));
          if (data.longitude) localStorage.setItem('customer_lng', String(data.longitude));
          if (data.address) localStorage.setItem('customer_address', data.address);
          setIsExploreMapOpen(false);
        }}
        title="Choose Your Event Venue Location"
      />

    </div>
  );
}
