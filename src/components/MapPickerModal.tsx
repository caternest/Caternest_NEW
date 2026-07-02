import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X, Check, Search, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { LOCAL_HYDERABAD_LOCATIONS } from './AddressAutocomplete';
import { searchLocations, reverseGeocode as libReverseGeocode } from '../lib/locationIntelligence';


interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onSave: (data: { address: string; latitude: number; longitude: number; serviceRadiusKm?: number }) => void;
  title?: string;
  showRadius?: boolean;
  initialRadius?: number | null;
}

// Global cached promise to prevent double loading
let leafletLoadedPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (leafletLoadedPromise) return leafletLoadedPromise;

  leafletLoadedPromise = new Promise((resolve, reject) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      resolve((window as any).L);
    };
    script.onerror = () => {
      reject(new Error('Failed to load Leaflet script'));
    };
    document.body.appendChild(script);
  });

  return leafletLoadedPromise;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialAddress = '',
  onSave,
  title = 'Pick Location',
  showRadius = false,
  initialRadius = 15,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState(initialAddress);
  const [latitude, setLatitude] = useState<number>(initialLat || 17.3850); // Default Hyderabad Lat
  const [longitude, setLongitude] = useState<number>(initialLng || 78.4867); // Default Hyderabad Lng
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [radiusKm, setRadiusKm] = useState<number>(initialRadius || 15);
  const [isCustomRadius, setIsCustomRadius] = useState<boolean>(![5, 10, 15, 20, 25, 30, 40, 50].includes(initialRadius || 15));

  const [modalSuggestions, setModalSuggestions] = useState<any[]>([]);
  const [isModalSuggestionsOpen, setIsModalSuggestionsOpen] = useState(false);
  const [isLoadingModalSuggestions, setIsLoadingModalSuggestions] = useState(false);
  const [modalActiveIndex, setModalActiveIndex] = useState<number>(-1);
  const modalSuggestionsRef = useRef<HTMLDivElement>(null);

  // Close modal suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalSuggestionsRef.current && !modalSuggestionsRef.current.contains(event.target as Node)) {
        setIsModalSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch live suggestions inside the modal as user types
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setModalSuggestions([]);
      setIsModalSuggestionsOpen(false);
      setModalActiveIndex(-1);
      return;
    }

    // Skip if search matches an existing suggestion exactly (it means they selected it)
    if (modalSuggestions.some(s => s.display_name === trimmed)) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingModalSuggestions(true);
      setIsModalSuggestionsOpen(true); // Open immediately to show "Searching locations..."
      
      try {
        const results = await searchLocations(trimmed);
        setModalSuggestions(results);
      } catch (e) {
        console.warn('Modal geocoding search failed', e);
      } finally {
        setModalActiveIndex(-1);
        setIsLoadingModalSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update circle radius when radiusKm state changes
  useEffect(() => {
    if (mapRef.current && circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
      mapRef.current.fitBounds(circleRef.current.getBounds());
    }
  }, [radiusKm]);

  const bounceMarker = () => {
    if (markerRef.current) {
      const element = markerRef.current.getElement();
      if (element) {
        element.classList.remove('animate-marker-selection');
        void element.offsetWidth; // force reflow
        element.classList.add('animate-marker-selection');
        setTimeout(() => {
          if (markerRef.current) {
            const el = markerRef.current.getElement();
            if (el) el.classList.remove('animate-marker-selection');
          }
        }, 2000);
      }
    }
  };

  const renderModalHighlighted = (text: string, search: string) => {
    if (!search || !text) return <span>{text}</span>;
    const terms = search.trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return <span>{text}</span>;
    
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
    const regexStr = `(${sortedTerms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`;
    const regex = new RegExp(regexStr, 'gi');
    
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) => {
          const isMatch = terms.some(term => part.toLowerCase() === term.toLowerCase());
          return isMatch ? (
            <span key={index} className="font-extrabold text-[#DEAA38] drop-shadow-sm">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </>
    );
  };

  const handleSelectModalSuggestion = (item: any) => {
    const lat = item.latitude !== undefined ? item.latitude : parseFloat(item.lat);
    const lng = item.longitude !== undefined ? item.longitude : parseFloat(item.lon);
    setLatitude(lat);
    setLongitude(lng);
    setAddress(item.display_name);
    setSearchQuery(item.display_name);
    setIsModalSuggestionsOpen(false);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 17);
      markerRef.current.setLatLng([lat, lng]);
      setTimeout(bounceMarker, 100);
    }
  };

  // Load Leaflet and initialize map
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    loadLeaflet()
      .then((L) => {
        if (!active || !mapContainerRef.current) return;

        // Clean up previous map instance if any
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        }

        const startLat = initialLat || 17.3850;
        const startLng = initialLng || 78.4867;

        // Initialize map
        const map = L.map(mapContainerRef.current, {
          zoomControl: false // custom placement or just clean
        }).setView([startLat, startLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add custom controls (Zoom)
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Add premium gold pin icon with gold outer circle, white center and soft shadow
        const goldIcon = L.divIcon({
          html: `
            <div class="caternest-gold-marker-wrapper">
              <div class="caternest-gold-marker-glow"></div>
              <div class="caternest-gold-marker-pin">
                <div class="caternest-gold-marker-inner"></div>
              </div>
              <div class="caternest-gold-marker-shadow"></div>
            </div>
          `,
          className: 'caternest-custom-marker-container',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        // Add draggable marker
        const marker = L.marker([startLat, startLng], {
          icon: goldIcon,
          draggable: true
        }).addTo(map);

        mapRef.current = map;
        markerRef.current = marker;

        if (showRadius) {
          const circle = L.circle([startLat, startLng], {
            color: '#DEAA38',
            fillColor: '#DEAA38',
            fillOpacity: 0.15,
            radius: radiusKm * 1000,
            weight: 2
          }).addTo(map);
          circleRef.current = circle;
          map.fitBounds(circle.getBounds());
        }

        setIsLoading(false);

        // Geocode initial position if address is empty but coordinates exist
        if (!initialAddress && (initialLat && initialLng)) {
          reverseGeocode(startLat, startLng);
        }

        // Setup dragging and click events
        const updateCoords = (lat: number, lng: number) => {
          setLatitude(lat);
          setLongitude(lng);
          reverseGeocode(lat, lng);
          if (circleRef.current) {
            circleRef.current.setLatLng([lat, lng]);
          }
        };

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          updateCoords(position.lat, position.lng);
          setTimeout(bounceMarker, 100);
        });

        map.on('click', (e: any) => {
          marker.setLatLng(e.latlng);
          updateCoords(e.latlng.lat, e.latlng.lng);
          setTimeout(bounceMarker, 100);
        });
      })
      .catch((err) => {
        console.error('Error loading Leaflet', err);
        setIsLoading(false);
      });

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // Reverse Geocode using Nominatim API (Free, OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const result = await libReverseGeocode(lat, lng);
      if (result && result.address) {
        setAddress(result.address);
        setSearchQuery(result.address);
      }
    } catch (err) {
      console.warn('Reverse geocoding failed, using local/manual details', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Search Address using Nominatim API (Free, OpenStreetMap)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryStr = searchQuery.trim();
    if (!queryStr) return;

    setIsSearching(true);
    
    try {
      const results = await searchLocations(queryStr);
      if (results && results.length > 0) {
        const bestResult = results[0];
        const lat = bestResult.latitude;
        const lng = bestResult.longitude;
        
        setLatitude(lat);
        setLongitude(lng);
        setAddress(bestResult.display_name);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
          setTimeout(bounceMarker, 100);
        }
      }
    } catch (err) {
      console.warn('Geocoding search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleModalUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lng], 17);
          markerRef.current.setLatLng([lat, lng]);
          setTimeout(bounceMarker, 100);
        }
        reverseGeocode(lat, lng);
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  };

  const handleSaveLocation = () => {
    onSave({
      address: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
      serviceRadiusKm: showRadius ? radiusKm : undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <style dangerouslySetInnerHTML={{__html: `
        /* Container styles */
        .caternest-custom-marker-container {
          background: transparent !important;
          border: none !important;
        }

        /* Wrapper */
        .caternest-gold-marker-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Pin design: Gold outer circle, White center */
        .caternest-gold-marker-pin {
          width: 24px;
          height: 24px;
          background-color: #DEAA38;
          border: 3.5px solid #FFFFFF;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          position: absolute;
          top: 4px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: all 0.3s ease;
        }

        /* White center of the pin */
        .caternest-gold-marker-inner {
          width: 8px;
          height: 8px;
          background-color: #FFFFFF;
          border-radius: 50%;
          transform: rotate(45deg);
        }

        /* Soft shadow below the marker */
        .caternest-gold-marker-shadow {
          width: 12px;
          height: 4px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          position: absolute;
          bottom: 2px;
          filter: blur(1.5px);
          z-index: 1;
        }

        /* Glowing effect (2 seconds duration) */
        .caternest-gold-marker-glow {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(222, 170, 56, 0.4);
          z-index: 0;
          opacity: 0;
          transform: scale(0.6);
          pointer-events: none;
        }

        /* Selection Animations: single bounce and 2 seconds glow */
        @keyframes markerSingleBounce {
          0%, 100% {
            transform: translateY(0) rotate(-45deg);
          }
          50% {
            transform: translateY(-20px) rotate(-45deg);
          }
        }

        @keyframes markerGlowEffect {
          0% {
            opacity: 0.8;
            transform: scale(0.4);
            filter: blur(1px);
          }
          40% {
            opacity: 0.5;
            transform: scale(1.3);
            filter: blur(2px);
          }
          80% {
            opacity: 0.1;
            transform: scale(1.8);
            filter: blur(3px);
          }
          100% {
            opacity: 0;
            transform: scale(2.0);
            filter: blur(4px);
          }
        }

        .animate-marker-selection .caternest-gold-marker-pin {
          animation: markerSingleBounce 0.5s ease-out 1;
        }

        .animate-marker-selection .caternest-gold-marker-glow {
          animation: markerGlowEffect 2.0s cubic-bezier(0.16, 1, 0.3, 1) 1;
        }
      `}} />
      <div className="bg-white border border-[#E7D4A4] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-800 relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <MapPin className="text-[#D4AF37]" size={20} />
            <h3 className="text-base font-serif font-bold text-[#1E1E1E] uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-stone-50/50 relative">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div ref={modalSuggestionsRef} className="relative flex-1">
              <input
                type="text"
                placeholder="Search location in Hyderabad (e.g. Gachibowli)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsModalSuggestionsOpen(true);
                }}
                onKeyDown={(e) => {
                  if (!isModalSuggestionsOpen || modalSuggestions.length === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setModalActiveIndex((prev) => (prev + 1) % modalSuggestions.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setModalActiveIndex((prev) => (prev - 1 + modalSuggestions.length) % modalSuggestions.length);
                  } else if (e.key === 'Enter') {
                    if (modalActiveIndex >= 0 && modalActiveIndex < modalSuggestions.length) {
                      e.preventDefault();
                      handleSelectModalSuggestion(modalSuggestions[modalActiveIndex]);
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsModalSuggestionsOpen(false);
                  }
                }}
                onFocus={() => setIsModalSuggestionsOpen(true)}
                className="w-full bg-white border border-[#E7D4A4] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none transition"
              />
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              
              {isLoadingModalSuggestions && (
                <div className="absolute right-3.5 top-3.5 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-slate-400" size={14} />
                </div>
              )}

              {isModalSuggestionsOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-stone-100 rounded-[12px] shadow-2xl max-h-[320px] overflow-y-auto z-[9999] p-2 animate-in fade-in slide-in-from-top-1 duration-250">
                  {isLoadingModalSuggestions ? (
                    <div className="px-4 py-8 text-center text-stone-500 font-sans text-xs flex flex-col items-center justify-center gap-3">
                      <div className="p-2 rounded-full bg-amber-50 text-[#DEAA38]">
                        <RefreshCw className="animate-spin text-[#DEAA38]" size={20} />
                      </div>
                      <span className="font-semibold text-[#DEAA38] text-sm animate-pulse">Searching locations...</span>
                    </div>
                  ) : modalSuggestions.length > 0 ? (
                    <div className="space-y-1">
                      {modalSuggestions.map((item, index) => {
                        const isSelected = index === modalActiveIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectModalSuggestion(item)}
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
                              <span className="block text-base font-semibold text-stone-900 truncate leading-snug group-hover:text-black">
                                {renderModalHighlighted(item.mainLabel, searchQuery)}
                              </span>
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
                  ) : searchQuery.trim().length >= 3 ? (
                    <div className="px-4 py-8 text-center text-stone-500 font-sans text-xs flex flex-col items-center justify-center gap-2">
                      <div className="p-2 rounded-full bg-stone-50 text-stone-400">
                        <MapPin size={24} className="text-stone-300" />
                      </div>
                      <span className="font-bold text-stone-600 text-sm">No matching location found.</span>
                      <span className="text-[11px] text-stone-400 max-w-[200px] leading-normal mx-auto">
                        Try another nearby landmark.
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#D4AF37] hover:bg-[#b59223] disabled:opacity-50 text-white font-bold text-xs px-5 rounded-xl transition cursor-pointer uppercase tracking-wider shrink-0 flex items-center gap-1.5 font-sans"
            >
              {isSearching ? <RefreshCw className="animate-spin" size={13} /> : 'Search'}
            </button>
          </form>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[350px] bg-slate-100">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4AF37]"></div>
              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-sans">Loading Interactive Map...</span>
            </div>
          )}
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '350px' }} />
          
          {/* Floating Use Current Location Button */}
          <button
            type="button"
            onClick={handleModalUseCurrentLocation}
            className="absolute top-4 right-4 z-40 bg-white/95 hover:bg-white text-stone-800 font-extrabold text-[11px] px-4 py-2.5 rounded-xl border border-stone-200/80 hover:border-stone-300 shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 uppercase tracking-wider font-sans"
          >
            <MapPin size={12} className="text-[#DEAA38]" /> Use Current Location
          </button>

          {/* Floating Address Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E7D4A4]/40 shadow-xl space-y-3 max-h-[190px] overflow-y-auto">
            <div className="flex items-start gap-2.5">
              <MapPin className="text-[#D4AF37] shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <span className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Selected Address</span>
                {isGeocoding ? (
                  <span className="text-xs text-slate-400 italic flex items-center gap-1.5">
                    <RefreshCw className="animate-spin text-[#D4AF37]" size={12} /> Resolving street address...
                  </span>
                ) : (
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {address || "Drag pin or tap map to update..."}
                  </p>
                )}
              </div>
            </div>

            {showRadius && (
              <div className="border-t border-slate-100 pt-3 space-y-2 font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    📍 Service Coverage Radius
                  </span>
                  <span className="text-xs font-bold text-[#DEAA38] font-mono">
                    {radiusKm} KM
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <select
                    value={isCustomRadius ? "custom" : radiusKm}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "custom") {
                        setIsCustomRadius(true);
                      } else {
                        setIsCustomRadius(false);
                        setRadiusKm(Number(val));
                      }
                    }}
                    className="bg-stone-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    {[5, 10, 15, 20, 25, 30, 40, 50].map((km) => (
                      <option key={km} value={km}>{km} KM</option>
                    ))}
                    <option value="custom">Custom Radius...</option>
                  </select>

                  {isCustomRadius && (
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="flex-1 accent-[#DEAA38] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info & Coordinates */}
        <div className="px-6 py-4 border-t border-slate-100 bg-stone-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-4 text-[10px] text-slate-500 font-mono">
            <div>
              <span className="text-slate-400 mr-1">LAT:</span>
              <span>{latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">LNG:</span>
              <span>{longitude.toFixed(6)}</span>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto font-sans">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-6 py-3 rounded-xl transition cursor-pointer uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLocation}
              disabled={isGeocoding}
              className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
            >
              <Check size={14} /> Confirm Location
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
