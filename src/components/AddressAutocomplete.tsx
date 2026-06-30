import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Star, Clock } from 'lucide-react';
import { searchLocations, saveRecentSearch, getRecentSearches, getFavoriteLocations } from '../lib/locationIntelligence';


export interface HyderabadLocation {
  id: string;
  display_name: string;
  mainLabel: string;
  subLabel: string;
  lat: number;
  lon: number;
}

export const LOCAL_HYDERABAD_LOCATIONS: HyderabadLocation[] = [
  {
    id: "loc_madhapur",
    display_name: "Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Madhapur",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4483,
    lon: 78.3915
  },
  {
    id: "loc_madhapur_metro",
    display_name: "Madhapur Metro Station, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Madhapur Metro Station",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4424,
    lon: 78.3962
  },
  {
    id: "loc_madhapur_main_rd",
    display_name: "Madhapur Main Road, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Madhapur Main Road",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4455,
    lon: 78.3900
  },
  {
    id: "loc_madhapur_police",
    display_name: "Madhapur Police Station, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Madhapur Police Station",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4447,
    lon: 78.3855
  },
  {
    id: "loc_inorbit",
    display_name: "Inorbit Mall, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Inorbit Mall",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4345,
    lon: 78.3867
  },
  {
    id: "loc_kondapur",
    display_name: "Kondapur, Hyderabad, Telangana, 500084, India",
    mainLabel: "Kondapur",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4622,
    lon: 78.3568
  },
  {
    id: "loc_gachibowli",
    display_name: "Gachibowli, Hyderabad, Telangana, 500032, India",
    mainLabel: "Gachibowli",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4401,
    lon: 78.3489
  },
  {
    id: "loc_jubilee_hills",
    display_name: "Jubilee Hills, Hyderabad, Telangana, 500033, India",
    mainLabel: "Jubilee Hills",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4325,
    lon: 78.4071
  },
  {
    id: "loc_banjara_hills",
    display_name: "Banjara Hills, Hyderabad, Telangana, 500034, India",
    mainLabel: "Banjara Hills",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4165,
    lon: 78.4347
  },
  {
    id: "loc_hitech_city",
    display_name: "Hitech City, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Hitech City",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4504,
    lon: 78.3808
  },
  {
    id: "loc_kukatpally",
    display_name: "Kukatpally, Hyderabad, Telangana, 500072, India",
    mainLabel: "Kukatpally",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4855,
    lon: 78.3958
  },
  {
    id: "loc_begumpet",
    display_name: "Begumpet, Hyderabad, Telangana, 500016, India",
    mainLabel: "Begumpet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4448,
    lon: 78.4530
  },
  {
    id: "loc_secunderabad",
    display_name: "Secunderabad, Hyderabad, Telangana, 500003, India",
    mainLabel: "Secunderabad",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4399,
    lon: 78.4983
  },
  {
    id: "loc_charminar",
    display_name: "Charminar, Char Kaman, Ghansi Bazaar, Hyderabad, Telangana, 500002, India",
    mainLabel: "Charminar",
    subLabel: "Ghansi Bazaar, Hyderabad, India",
    lat: 17.3616,
    lon: 78.4747
  },
  {
    id: "loc_dlf",
    display_name: "DLF Cyber City, Indira Nagar, Gachibowli, Hyderabad, Telangana, 500032, India",
    mainLabel: "DLF Cyber City",
    subLabel: "Gachibowli, Hyderabad, India",
    lat: 17.4474,
    lon: 78.3575
  },
  {
    id: "loc_ikea",
    display_name: "IKEA Hyderabad, Mindspace, Hitech City, Hyderabad, Telangana, 500081, India",
    mainLabel: "IKEA Hyderabad",
    subLabel: "Hitech City, Hyderabad, India",
    lat: 17.4385,
    lon: 78.3745
  },
  {
    id: "loc_novotel",
    display_name: "Novotel Hyderabad Convention Centre, Hitec City, Hyderabad, Telangana, 500084, India",
    mainLabel: "Novotel Hyderabad Convention Centre",
    subLabel: "Hitec City, Hyderabad, India",
    lat: 17.4721,
    lon: 78.3734
  },
  {
    id: "loc_taj_krishna",
    display_name: "Taj Krishna, Road No. 1, Banjara Hills, Hyderabad, Telangana, 500034, India",
    mainLabel: "Taj Krishna",
    subLabel: "Banjara Hills, Hyderabad, India",
    lat: 17.4168,
    lon: 78.4485
  },
  {
    id: "loc_mindspace",
    display_name: "Mindspace IT Park, Hitech City, Madhapur, Hyderabad, Telangana, 500081, India",
    mainLabel: "Mindspace IT Park",
    subLabel: "Madhapur, Hyderabad, India",
    lat: 17.4411,
    lon: 78.3794
  },
  {
    id: "loc_miyapur",
    display_name: "Miyapur, Hyderabad, Telangana, 500049, India",
    mainLabel: "Miyapur",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4966,
    lon: 78.3411
  },
  {
    id: "loc_chandanagar",
    display_name: "Chanda Nagar, Hyderabad, Telangana, 500050, India",
    mainLabel: "Chanda Nagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4831,
    lon: 78.3297
  },
  {
    id: "loc_yusufguda",
    display_name: "Yousufguda, Hyderabad, Telangana, 500045, India",
    mainLabel: "Yousufguda",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4348,
    lon: 78.4281
  },
  {
    id: "loc_sr_nagar",
    display_name: "Sanjeeva Reddy Nagar, Hyderabad, Telangana, 500038, India",
    mainLabel: "SR Nagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4442,
    lon: 78.4429
  },
  {
    id: "loc_ameerpet",
    display_name: "Ameerpet, Hyderabad, Telangana, 500016, India",
    mainLabel: "Ameerpet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4375,
    lon: 78.4482
  },
  {
    id: "loc_somajiguda",
    display_name: "Somajiguda, Hyderabad, Telangana, 500082, India",
    mainLabel: "Somajiguda",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4265,
    lon: 78.4534
  },
  {
    id: "loc_khairatabad",
    display_name: "Khairatabad, Hyderabad, Telangana, 500004, India",
    mainLabel: "Khairatabad",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4116,
    lon: 78.4611
  },
  {
    id: "loc_panjagutta",
    display_name: "Punjagutta, Hyderabad, Telangana, 500082, India",
    mainLabel: "Punjagutta",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4278,
    lon: 78.4503
  },
  {
    id: "loc_mehdipatnam",
    display_name: "Mehdipatnam, Hyderabad, Telangana, 500028, India",
    mainLabel: "Mehdipatnam",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3916,
    lon: 78.4419
  },
  {
    id: "loc_tolichowki",
    display_name: "Tolichowki, Hyderabad, Telangana, 500008, India",
    mainLabel: "Tolichowki",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3992,
    lon: 78.4146
  },
  {
    id: "loc_shaikpet",
    display_name: "Shaikpet, Hyderabad, Telangana, 500008, India",
    mainLabel: "Shaikpet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4048,
    lon: 78.3972
  },
  {
    id: "loc_narsingi",
    display_name: "Narsingi, Hyderabad, Telangana, 500075, India",
    mainLabel: "Narsingi",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3872,
    lon: 78.3524
  },
  {
    id: "loc_kokapet",
    display_name: "Kokapet, Hyderabad, Telangana, 500075, India",
    mainLabel: "Kokapet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3881,
    lon: 78.3274
  },
  {
    id: "loc_manikonda",
    display_name: "Manikonda, Hyderabad, Telangana, 500089, India",
    mainLabel: "Manikonda",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3978,
    lon: 78.3692
  },
  {
    id: "loc_gandipet",
    display_name: "Gandipet, Hyderabad, Telangana, 500075, India",
    mainLabel: "Gandipet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3952,
    lon: 78.2981
  },
  {
    id: "loc_koti",
    display_name: "Koti, Hyderabad, Telangana, 500095, India",
    mainLabel: "Koti",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3831,
    lon: 78.4811
  },
  {
    id: "loc_abids",
    display_name: "Abids, Hyderabad, Telangana, 500001, India",
    mainLabel: "Abids",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3898,
    lon: 78.4744
  },
  {
    id: "loc_himayatnagar",
    display_name: "Himayatnagar, Hyderabad, Telangana, 500029, India",
    mainLabel: "Himayatnagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4025,
    lon: 78.4842
  },
  {
    id: "loc_tarnaka",
    display_name: "Tarnaka, Hyderabad, Telangana, 500007, India",
    mainLabel: "Tarnaka",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4289,
    lon: 78.5378
  },
  {
    id: "loc_uppal",
    display_name: "Uppal, Hyderabad, Telangana, 500039, India",
    mainLabel: "Uppal",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4019,
    lon: 78.5602
  },
  {
    id: "loc_nagole",
    display_name: "Nagole, Hyderabad, Telangana, 500068, India",
    mainLabel: "Nagole",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3792,
    lon: 78.5655
  },
  {
    id: "loc_lb_nagar",
    display_name: "L.B. Nagar, Hyderabad, Telangana, 500074, India",
    mainLabel: "LB Nagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3458,
    lon: 78.5484
  },
  {
    id: "loc_dilsukhnagar",
    display_name: "Dilsukhnagar, Hyderabad, Telangana, 500060, India",
    mainLabel: "Dilsukhnagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3688,
    lon: 78.5247
  },
  {
    id: "loc_malakpet",
    display_name: "Malakpet, Hyderabad, Telangana, 500036, India",
    mainLabel: "Malakpet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3724,
    lon: 78.4998
  },
  {
    id: "loc_saroornagar",
    display_name: "Saroornagar, Hyderabad, Telangana, 500035, India",
    mainLabel: "Saroornagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.3552,
    lon: 78.5268
  },
  {
    id: "loc_nacharam",
    display_name: "Nacharam, Hyderabad, Telangana, 500076, India",
    mainLabel: "Nacharam",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4255,
    lon: 78.5562
  },
  {
    id: "loc_malkajgiri",
    display_name: "Malkajgiri, Hyderabad, Telangana, 500047, India",
    mainLabel: "Malkajgiri",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4533,
    lon: 78.5284
  },
  {
    id: "loc_alwal",
    display_name: "Alwal, Hyderabad, Telangana, 500010, India",
    mainLabel: "Alwal",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4984,
    lon: 78.5024
  },
  {
    id: "loc_sainikpuri",
    display_name: "Sainikpuri, Hyderabad, Telangana, 500094, India",
    mainLabel: "Sainikpuri",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4795,
    lon: 78.5395
  },
  {
    id: "loc_maredpally",
    display_name: "Maredpally, Secunderabad, Telangana, 500026, India",
    mainLabel: "Maredpally",
    subLabel: "Secunderabad, Telangana, India",
    lat: 17.4475,
    lon: 78.5098
  },
  {
    id: "loc_tirumalagiri",
    display_name: "Trimulgherry, Secunderabad, Telangana, 500015, India",
    mainLabel: "Trimulgherry",
    subLabel: "Secunderabad, Telangana, India",
    lat: 17.4682,
    lon: 78.5032
  },
  {
    id: "loc_bowenpally",
    display_name: "Bowenpally, Secunderabad, Telangana, 500011, India",
    mainLabel: "Bowenpally",
    subLabel: "Secunderabad, Telangana, India",
    lat: 17.4725,
    lon: 78.4722
  },
  {
    id: "loc_sanathnagar",
    display_name: "Sanath Nagar, Hyderabad, Telangana, 500018, India",
    mainLabel: "Sanath Nagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4552,
    lon: 78.4328
  },
  {
    id: "loc_erragadda",
    display_name: "Erragadda, Hyderabad, Telangana, 500018, India",
    mainLabel: "Erragadda",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4542,
    lon: 78.4239
  },
  {
    id: "loc_moosapet",
    display_name: "Moosapet, Hyderabad, Telangana, 500018, India",
    mainLabel: "Moosapet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4695,
    lon: 78.4195
  },
  {
    id: "loc_hydernagar",
    display_name: "Hyder Nagar, Hyderabad, Telangana, 500085, India",
    mainLabel: "Hyder Nagar",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.4942,
    lon: 78.3811
  },
  {
    id: "loc_nizampet",
    display_name: "Nizampet, Hyderabad, Telangana, 500090, India",
    mainLabel: "Nizampet",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.5144,
    lon: 78.3789
  },
  {
    id: "loc_bachupally",
    display_name: "Bachupally, Hyderabad, Telangana, 500090, India",
    mainLabel: "Bachupally",
    subLabel: "Hyderabad, Telangana, India",
    lat: 17.5342,
    lon: 78.3644
  },
  {
    id: "loc_pragathi_nagar",
    display_name: "Pragathi Nagar, Kukatpally, Hyderabad, Telangana, 500090, India",
    mainLabel: "Pragathi Nagar",
    subLabel: "Kukatpally, Hyderabad, India",
    lat: 17.4995,
    lon: 78.3878
  },
  {
    id: "loc_gachibowli_stadium",
    display_name: "Gachibowli Stadium, Gachibowli, Hyderabad, Telangana, 500032, India",
    mainLabel: "Gachibowli Stadium",
    subLabel: "Gachibowli, Hyderabad, India",
    lat: 17.4444,
    lon: 78.3435
  },
  {
    id: "loc_gachibowli_orridge",
    display_name: "Outer Ring Road, Gachibowli, Hyderabad, Telangana, 500032, India",
    mainLabel: "Gachibowli ORR Junction",
    subLabel: "Gachibowli, Hyderabad, India",
    lat: 17.4251,
    lon: 78.3414
  }
];

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (data: { address: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
  className?: string;
  theme?: 'gold' | 'green';
  useTextarea?: boolean;
  rows?: number;
  leftIcon?: React.ReactNode;
  onIconClick?: () => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Type address...',
  className = '',
  theme = 'gold',
  useTextarea = false,
  rows = 2,
  leftIcon,
  onIconClick,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerFetchRef = useRef<any>(null);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync favorites and recent searches
  useEffect(() => {
    if (isOpen) {
      setFavorites(getFavoriteLocations());
      setRecents(getRecentSearches());
    }
  }, [isOpen]);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (triggerFetchRef.current) {
      clearTimeout(triggerFetchRef.current);
    }

    const trimmedValue = value?.trim();
    if (!trimmedValue || trimmedValue.length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    // Don't search if the value was just selected (exactly matches a suggestion)
    const isExactMatch = suggestions.some((s) => s.display_name === trimmedValue);
    if (isExactMatch) {
      return;
    }

    triggerFetchRef.current = setTimeout(async () => {
      setIsLoading(true);
      setIsOpen(true);
      
      try {
        const fetched = await searchLocations(trimmedValue);
        setSuggestions(fetched);
      } catch (err) {
        console.warn('Autocomplete live fetch failed:', err);
      } finally {
        setIsLoading(false);
        setActiveIndex(-1);
      }
    }, 300); // Debounce 300ms

    return () => {
      if (triggerFetchRef.current) {
        clearTimeout(triggerFetchRef.current);
      }
    };
  }, [value]);

  const handleSelect = (item: any) => {
    onChange(item.display_name);
    onSelect({
      address: item.display_name,
      latitude: item.latitude || item.lat,
      longitude: item.longitude || item.lon,
    });
    saveRecentSearch(item.display_name);
    setIsOpen(false);
  };

  const trimmedLength = value?.trim().length || 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const listToNavigate = trimmedLength >= 2 ? suggestions : [...favorites, ...recents.map(r => ({ display_name: r, mainLabel: r, subLabel: "Recent Search" }))];
    if (!isOpen || listToNavigate.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % listToNavigate.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + listToNavigate.length) % listToNavigate.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < listToNavigate.length) {
        e.preventDefault();
        handleSelect(listToNavigate[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const renderHighlighted = (text: string, search: string) => {
    if (!search || !text) return <span>{text}</span>;
    const terms = search.trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return <span>{text}</span>;
    
    // Sort terms descending by length to avoid shorter matches within longer terms
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
    const regexStr = `(${sortedTerms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`;
    const regex = new RegExp(regexStr, 'gi');
    
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-amber-100 text-[#DEAA38] font-bold px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const ringColor = theme === 'gold' ? 'focus:ring-brand-gold-500/15 focus:border-[#DEAA38]/80' : 'focus:ring-[#0F3D2E]/10 focus:border-[#0F3D2E]';
  const hasBg = className.includes('bg-');
  const defaultInputStyles = hasBg 
    ? '' 
    : 'bg-white text-stone-900 border border-stone-200 hover:border-stone-300';

  const rightPaddingClass = onIconClick || isLoading ? 'pr-11' : 'pr-4';
  const paddingClass = `${leftIcon ? 'pl-11' : 'pl-4'} ${rightPaddingClass}`;

  return (
    <div ref={containerRef} className="relative w-full font-sans">
      <div className="relative">
        {leftIcon && (
          <div className={`absolute left-3.5 z-10 flex items-center justify-center ${useTextarea ? 'top-4.5' : 'top-1/2 -translate-y-1/2'}`}>
            {onIconClick ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onIconClick();
                }}
                className="cursor-pointer hover:scale-110 active:scale-95 transition-all p-1 rounded-lg hover:bg-amber-50 text-[#DEAA38]"
                title="Open Map Picker"
              >
                {leftIcon}
              </button>
            ) : (
              <div className="pointer-events-none">
                {leftIcon}
              </div>
            )}
          </div>
        )}

        {useTextarea ? (
          <textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full ${defaultInputStyles} rounded-xl ${paddingClass} py-3.5 text-sm focus:ring-4 outline-none transition-all placeholder:text-stone-400 ${ringColor} ${className}`}
            onFocus={() => {
              setIsOpen(true);
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full ${defaultInputStyles} rounded-xl ${paddingClass} py-3.5 text-sm focus:ring-4 outline-none transition-all placeholder:text-stone-400 ${ringColor} ${className}`}
            onFocus={() => {
              setIsOpen(true);
            }}
          />
        )}
        
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
          {isLoading && (
            <Loader2 className="animate-spin text-stone-400 shrink-0" size={16} />
          )}
          {onIconClick && !isLoading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIconClick();
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer hover:scale-110 active:scale-95 shrink-0 ${
                theme === 'gold' 
                  ? 'text-[#DEAA38] hover:bg-amber-50' 
                  : 'text-[#0F3D2E] hover:bg-emerald-50'
              }`}
              title="Open Map Picker"
            >
              <MapPin size={18} className="stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-stone-100 rounded-[12px] shadow-2xl max-h-[320px] overflow-y-auto z-[9999] animate-in fade-in slide-in-from-top-1 duration-250">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-stone-500 font-sans text-xs flex flex-col items-center justify-center gap-3">
              <div className="p-2 rounded-full bg-amber-50 text-[#DEAA38]">
                <Loader2 className="animate-spin text-[#DEAA38]" size={20} />
              </div>
              <span className="font-semibold text-[#DEAA38] text-sm animate-pulse">Searching locations...</span>
            </div>
          ) : trimmedLength >= 2 ? (
            suggestions.length > 0 ? (
              <div className="p-2 space-y-1">
                {suggestions.map((item, index) => {
                  const isSelected = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-amber-50/40 rounded-xl transition-all duration-200 flex items-start gap-4 group cursor-pointer border ${
                        isSelected 
                          ? 'bg-amber-50/60 border-amber-200/80 shadow-sm' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-amber-50 text-[#DEAA38] group-hover:bg-[#DEAA38] group-hover:text-white transition-all duration-200 shrink-0 shadow-sm flex items-center justify-center">
                        <MapPin size={18} className="stroke-[2.5]" />
                      </div>
                      <div className="truncate font-sans flex-1">
                        <div className="flex items-center justify-between">
                          <span className="block text-base font-semibold text-stone-900 truncate leading-snug group-hover:text-black">
                            {renderHighlighted(item.mainLabel, value)}
                          </span>
                          {item.rank && (
                            <span className="text-amber-500 text-xs font-bold shrink-0 ml-2">
                              {"★".repeat(item.rank)}
                            </span>
                          )}
                        </div>
                        {item.subLabel && (
                          <span className="block text-xs text-stone-500 font-medium leading-relaxed mt-1">
                            {item.subLabel}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-stone-500 font-sans text-xs flex flex-col items-center justify-center gap-2">
                <div className="p-2 rounded-full bg-stone-50 text-stone-400">
                  <MapPin size={24} className="text-stone-300" />
                </div>
                <span className="font-bold text-stone-600 text-sm">No matching location found.</span>
                <span className="text-[11px] text-stone-400 max-w-[240px] leading-normal space-y-1 block mt-1">
                  <span className="block italic text-stone-500">Try searching:</span>
                  <span className="block">🏢 Apartment Name (e.g. My Home, Aparna)</span>
                  <span className="block">📍 Nearby Landmark (e.g. Inorbit, Metro)</span>
                  <span className="block">🛣️ Road Name or Street</span>
                  <span className="block">🏫 School or Hospital</span>
                </span>
              </div>
            )
          ) : (
            // Empty search state - show favorites & recents
            <div className="p-2 space-y-3">
              {/* Favorites */}
              {favorites.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Saved Favorites
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {favorites.map((fav, index) => {
                      const isSelected = index === activeIndex;
                      return (
                        <button
                          key={fav.id}
                          type="button"
                          onClick={() => handleSelect({ display_name: fav.address, latitude: fav.latitude, longitude: fav.longitude, mainLabel: fav.label, subLabel: fav.address })}
                          className={`w-full text-left px-3 py-2 hover:bg-amber-50/40 rounded-lg transition flex items-center gap-3 group border ${
                            isSelected ? 'bg-amber-50/60 border-amber-200' : 'border-transparent'
                          }`}
                        >
                          <span className="text-lg shrink-0">{fav.icon}</span>
                          <div className="truncate flex-1">
                            <span className="block text-sm font-bold text-stone-800 leading-tight">
                              {fav.label}
                            </span>
                            <span className="block text-xs text-stone-400 truncate mt-0.5">
                              {fav.address}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recents */}
              {recents.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Recent Searches
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {recents.map((rec, index) => {
                      const listIndex = favorites.length + index;
                      const isSelected = listIndex === activeIndex;
                      return (
                        <button
                          key={rec}
                          type="button"
                          onClick={() => handleSelect({ display_name: rec, mainLabel: rec, subLabel: "Recent Search" })}
                          className={`w-full text-left px-3 py-2 hover:bg-amber-50/40 rounded-lg transition flex items-center gap-3 group border ${
                            isSelected ? 'bg-amber-50/60 border-amber-200' : 'border-transparent'
                          }`}
                        >
                          <Clock size={14} className="text-stone-400 shrink-0" />
                          <span className="block text-sm font-medium text-stone-600 truncate flex-1 leading-tight">
                            {rec}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {favorites.length === 0 && recents.length === 0 && (
                <div className="px-4 py-6 text-center text-stone-400 text-xs">
                  Start typing to search Hyderabad locations...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
