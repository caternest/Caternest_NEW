import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  Award,
  Building,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Star,
  PlayCircle,
  ShieldCheck,
  ChefHat,
  ChevronRight,
  CalendarDays,
  Users,
  Phone
} from "lucide-react";
import { cn } from "../lib/utils";
import { serviceIcons, DEFAULT_SERVICES } from "../pages/CatererDetails";

// Inline Luxury Divider
const LuxuryDivider = () => (
  <div className="flex items-center gap-1.5 my-4">
    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/45 to-[#D4AF37]/20"></div>
    <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]"></div>
    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#D4AF37]/20 via-[#D4AF37]/45 to-[#D4AF37]/10"></div>
  </div>
);

// Gold Medal Icon for Awards
const GoldMedalIcon = ({ title, isShield = false }: { title: string; isShield?: boolean }) => {
  return (
    <div className="flex flex-col items-center max-w-[120px] text-center group select-text">
       <div className="relative w-16 h-16 mb-2.5 flex items-center justify-center transform group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
         <div className="absolute inset-0 bg-[#DFC27A]/10 rounded-full blur-xs group-hover:blur-sm" />
         {isShield ? (
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#D4AF37] relative z-10 filter drop-shadow-sm">
             <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" fill="#FFFDFB" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round" />
             <path d="M12 6l1.5 3.5H17l-3 2.5 1 4-3-2.5-3 2.5 1-4-3-2.5h3.5L12 6z" fill="#D4AF37" />
           </svg>
         ) : (
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#D4AF37] relative z-10 filter drop-shadow-sm">
             <circle cx="12" cy="9" r="7" fill="#FFFDFB" stroke="#D4AF37" strokeWidth="2" />
             <path d="M8.5 14.5l-2.5 7.5L12 18.5l6 3.5-2.5-7.5" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#FAF6EC" />
             <path d="M12 5l1 2.5H15.5l-2 1.5.5 2.5-2-1.5-2 1.5.5-2.5-2-1.5H11L12 5z" fill="#D4AF37" />
           </svg>
         )}
       </div>
       <p className="text-[12.5px] font-sans font-bold text-slate-800 leading-tight select-text w-full break-words">
         {title}
       </p>
    </div>
  );
};

interface SectionProps {
  caterer: any;
  editedCaterer: any;
  setEditedCaterer: (val: any) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  isOwnerOrAdmin: boolean;
  handleSaveChanges: () => void;
  targetCatererObj: any;
  allGalleryPhotos: string[];
  openLightbox: (images: string[], index: number) => void;
  guestCount: number;
  setGuestCount: React.Dispatch<React.SetStateAction<number>>;
  packageTiers: any[];
  awardsList: string[];
  certificationsList: string[];
  achievementsList: any[];
  user: any;
  CrownOrnament: React.ComponentType<{ theme: any }>;
}

/* ==========================================================================
   LEFT COLUMN COMPONENTS
   ========================================================================== */

// 1. ABOUT CATERER CARD
export const AboutCatererCard: React.FC<SectionProps> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  targetCatererObj,
  experienceVal,
  caterer
}) => {
  return (
    <div 
      id="about-us-section"
      className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] hover:shadow-[0_16px_48px_rgba(15,61,46,0.1)] duration-300 flex flex-col relative"
    >
      <div className="flex justify-between items-center w-full">
        <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
          About {targetCatererObj.brandName || targetCatererObj.name}
        </h2>
        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setEditedCaterer({ ...caterer });
            }}
            className="flex items-center gap-1.5 text-[#D4AF37] hover:text-[#0F3D2E] font-bold text-xs font-sans transition-colors cursor-pointer"
          >
            <Pencil size={12} className="text-[#D4AF37]" /> Edit About
          </button>
        )}
      </div>

      <LuxuryDivider />

      <div className="mb-6 font-sans">
        {isEditing ? (
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
              About Caterer (Description)
            </span>
            <textarea
              value={editedCaterer.description || ""}
              onChange={(e) => setEditedCaterer({ ...editedCaterer, description: e.target.value })}
              className="bg-white border border-[#E8DCC7] focus:border-[#0F3D2E] rounded-xl px-4 py-3 text-slate-700 text-sm h-32 outline-none transition resize-none w-full shadow-xs"
              placeholder="Welcome to our premium catering service..."
            />
          </div>
        ) : (
          <p className="text-[#444444] text-[15px] md:text-[16px] font-sans leading-[1.8] text-left whitespace-pre-wrap select-text font-medium">
            {targetCatererObj.description || "Welcome to our premium catering service. We bring extraordinary food, luxury arrangements, and top tier hospitality to elevate your special day."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 border-t border-[#E8DCC7]/50 pt-6">
        {/* Years Experience Metric */}
        <div className="flex flex-col items-center p-4 bg-[#FFFDFB] rounded-[24px] border-2 border-[#DFC27A]/30 hover:border-[#D4AF37]/50 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <Award size={18} strokeWidth={2} />
          </div>
          {isEditing ? (
            <div className="flex flex-col items-center w-full">
              <input
                type="number"
                value={editedCaterer.experience !== undefined && editedCaterer.experience !== null ? editedCaterer.experience : ""}
                onChange={(e) => setEditedCaterer({ ...editedCaterer, experience: e.target.value })}
                className="bg-white border border-[#E8DCC7] rounded-lg p-1 text-xs text-center w-16"
                placeholder="Yrs"
              />
              <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">Years Exp</span>
            </div>
          ) : (
            <>
              <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
                {experienceVal ? `${experienceVal}+` : "15+"}
              </span>
              <span className="text-[11px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
                Years Experience
              </span>
            </>
          )}
        </div>

        {/* Events Completed Metric */}
        <div className="flex flex-col items-center p-4 bg-[#FFFDFB] rounded-[24px] border-2 border-[#DFC27A]/30 hover:border-[#D4AF37]/50 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <CalendarDays size={18} strokeWidth={2} />
          </div>
          {isEditing ? (
            <div className="flex flex-col items-center w-full">
              <input
                type="number"
                value={editedCaterer.eventsCompleted !== undefined && editedCaterer.eventsCompleted !== null ? editedCaterer.eventsCompleted : ""}
                onChange={(e) => setEditedCaterer({ ...editedCaterer, eventsCompleted: e.target.value })}
                className="bg-white border border-[#E8DCC7] rounded-lg p-1 text-xs text-center w-16"
                placeholder="Events"
              />
              <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider font-mono">Events</span>
            </div>
          ) : (
            <>
              <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
                {targetCatererObj.eventsCompleted ? `${parseInt(targetCatererObj.eventsCompleted.toString()).toLocaleString()}+` : "500+"}
              </span>
              <span className="text-[11px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
                Events Completed
              </span>
            </>
          )}
        </div>

        {/* Team Members Metric */}
        <div className="flex flex-col items-center p-4 bg-[#FFFDFB] rounded-[24px] border-2 border-[#DFC27A]/30 hover:border-[#D4AF37]/50 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <Users size={18} strokeWidth={2} />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
            50+
          </span>
          <span className="text-[11px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
            Team Members
          </span>
        </div>

        {/* Customer Rating Metric */}
        <div className="flex flex-col items-center p-4 bg-[#FFFDFB] rounded-[24px] border-2 border-[#DFC27A]/30 hover:border-[#D4AF37]/50 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300">
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <Star size={18} fill="#D4AF37" className="text-[#D4AF37]" strokeWidth={2} />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
            {targetCatererObj.rating || "4.8"}
          </span>
          <span className="text-[11px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
            Customer Rating
          </span>
        </div>
      </div>
    </div>
  );
};

// 2. SERVICES WE OFFER CARD
export const ServicesOfferCard: React.FC<SectionProps & {
  newServiceTitle: string;
  setNewServiceTitle: (val: string) => void;
  newServiceDesc: string;
  setNewServiceDesc: (val: string) => void;
  newServiceImage: string;
  setNewServiceImage: (val: string) => void;
  newServiceIcon: string;
  setNewServiceIcon: (val: string) => void;
  setIsAddServiceModalOpen: (val: boolean) => void;
}> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  targetCatererObj,
  caterer,
  setNewServiceTitle,
  setNewServiceDesc,
  setNewServiceImage,
  setNewServiceIcon,
  setIsAddServiceModalOpen
}) => {
  return (
    <div className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] flex flex-col hover:shadow-md">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
          Services We Offer
        </h2>
        {isOwnerOrAdmin && (
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setNewServiceTitle("");
                  setNewServiceDesc("");
                  setNewServiceImage("https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop");
                  setNewServiceIcon("ChefHat");
                  setIsAddServiceModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-[#0F3D2E] hover:bg-[#173D32] text-white border border-[#D4AF37]/30 px-3.5 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 duration-200"
              >
                <Plus size={13} className="text-[#D4AF37]" strokeWidth={2.5} />
                Add Service
              </button>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  setEditedCaterer({ ...caterer });
                }}
                className="flex items-center gap-1.5 text-[#D4AF37] hover:text-[#0F3D2E] font-bold text-xs font-sans transition-colors cursor-pointer"
              >
                <Pencil size={12} className="text-[#D4AF37]" /> Edit Services
              </button>
            )}
          </div>
        )}
      </div>

      <LuxuryDivider />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-2 w-full">
         {(editedCaterer?.services || caterer?.services || DEFAULT_SERVICES).map((item: any, idx: number) => {
            const IconComp = serviceIcons[item.iconName] || ChefHat;
            const currentServicesLength = (editedCaterer?.services || caterer?.services || DEFAULT_SERVICES).length;
            
            if (isEditing) {
              return (
                <div key={idx} className="bg-[#FFFDFB] rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-[0_8px_24px_rgba(15,61,46,0.08)] flex flex-col items-center text-center pb-5 group relative h-full w-full min-w-[240px]">
                  <div className="absolute top-2 right-2 flex gap-1 z-30">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const servicesList = [...(editedCaterer.services || DEFAULT_SERVICES)];
                          const temp = servicesList[idx];
                          servicesList[idx] = servicesList[idx - 1];
                          servicesList[idx - 1] = temp;
                          setEditedCaterer({ ...editedCaterer, services: servicesList });
                        }}
                        className="p-1.5 bg-white/95 hover:bg-white text-[#0F3D2E] rounded-full shadow-md border border-[#E8DCC7] hover:scale-105 transition-all cursor-pointer"
                        title="Move Up/Left"
                      >
                        <ArrowLeft size={10} />
                      </button>
                    )}
                    {idx < currentServicesLength - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const servicesList = [...(editedCaterer.services || DEFAULT_SERVICES)];
                          const temp = servicesList[idx];
                          servicesList[idx] = servicesList[idx + 1];
                          servicesList[idx + 1] = temp;
                          setEditedCaterer({ ...editedCaterer, services: servicesList });
                        }}
                        className="p-1.5 bg-white/95 hover:bg-white text-[#0F3D2E] rounded-full shadow-md border border-[#E8DCC7] hover:scale-105 transition-all cursor-pointer"
                        title="Move Down/Right"
                      >
                        <ArrowRight size={10} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const servicesList = [...(editedCaterer.services || DEFAULT_SERVICES)];
                        servicesList.splice(idx, 1);
                        setEditedCaterer({ ...editedCaterer, services: servicesList });
                      }}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full shadow-md border border-red-200 hover:scale-105 transition-all cursor-pointer"
                      title="Delete Service"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>

                  <div className="w-full h-48 md:h-52 overflow-hidden relative">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 flex flex-col justify-end p-2 font-sans">
                      <input
                        type="text"
                        value={item.image}
                        onChange={(e) => {
                          const servicesList = [...(editedCaterer.services || DEFAULT_SERVICES)];
                          servicesList[idx] = { ...servicesList[idx], image: e.target.value };
                          setEditedCaterer({ ...editedCaterer, services: servicesList });
                        }}
                        className="bg-black/80 text-[10px] text-white border border-white/20 rounded px-1.5 py-1 outline-none w-full placeholder:text-neutral-400 font-sans"
                        placeholder="Image URL"
                      />
                    </div>
                  </div>

                  <div className="relative -mt-5 z-10 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center shadow-md border-2 border-white">
                      <IconComp size={16} />
                    </div>
                    <div className="bg-white/95 border border-[#E8DCC7] rounded shadow shadow-md p-1 flex gap-1 mt-1 z-20 backdrop-blur-sm">
                      {Object.keys(serviceIcons).map((iconKey) => {
                        const SmallIcon = serviceIcons[iconKey];
                        const isSelected = item.iconName === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => {
                              const servicesList = [...(editedCaterer.services || DEFAULT_SERVICES)];
                              servicesList[idx] = { ...servicesList[idx], iconName: iconKey };
                              setEditedCaterer({ ...editedCaterer, services: servicesList });
                            }}
                            className={cn(
                              "p-1 rounded transition hover:bg-neutral-100 cursor-pointer",
                              isSelected ? "text-[#D4AF37] bg-[#FCFAF5]" : "text-neutral-400 hover:text-neutral-600"
                            )}
                            title={iconKey}
                          >
                            <SmallIcon size={12} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-full px-3 mt-4 mb-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const servicesList = [...(editedCaterer.services || DEFAULT_SERVICES)];
                        servicesList[idx] = { ...servicesList[idx], title: e.target.value };
                        setEditedCaterer({ ...editedCaterer, services: servicesList });
                      }}
                      className="font-sans font-semibold text-[#173D32] text-xs uppercase text-center border-b border-[#E8DCC7] focus:border-[#0F3D2E] outline-none w-full py-1 font-bold"
                      placeholder="Service Title"
                    />
                  </div>

                  <div className="w-full px-3 flex-1">
                    <textarea
                      value={item.desc}
                      onChange={(e) => {
                        const servicesList = [...(editedCaterer.services || DEFAULT_SERVICES)];
                        servicesList[idx] = { ...servicesList[idx], desc: e.target.value };
                        setEditedCaterer({ ...editedCaterer, services: servicesList });
                      }}
                      className="font-sans text-[11px] text-[#555555] text-center bg-white border border-[#E8DCC7] focus:border-[#0F3D2E] rounded p-1.5 outline-none w-full h-24 resize-none leading-relaxed"
                      placeholder="Service Description"
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="bg-[#FFFDFB] rounded-2xl overflow-hidden border-2 border-[#E8DCC7] hover:border-[#DFC27A]/85 shadow-[0_8px_24px_rgba(15,61,46,0.06)] hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center pb-5 group h-full w-full min-w-[240px]">
                <div className="w-full h-52 lg:h-56 overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"></div>
                </div>

                <div className="w-10 h-10 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center shadow-md relative -mt-5 z-10 border-2 border-white">
                  <IconComp size={16} />
                </div>

                <h3 className="font-sans font-bold text-[#173D32] text-[16px] uppercase mt-4 mb-2 tracking-wide px-3 select-text w-full">
                  {item.title}
                </h3>
                <p className="font-sans text-[13.5px] leading-relaxed text-[#555555] px-4 select-text flex-1">
                  {item.desc}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
};

// 3. FOOD GALLERY CARD
export const FoodGalleryCard: React.FC<SectionProps & {
  convertFileToBase64: (file: File) => Promise<string>;
}> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  allGalleryPhotos,
  openLightbox,
  convertFileToBase64
}) => {
  return (
    <div
      id="gallery-section"
      className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] scroll-mt-24"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
          Food Gallery
        </h2>
        {isEditing && (
          <div className="flex gap-2 font-sans">
            <label className="cursor-pointer bg-[#173D32] text-white hover:bg-[#0f2922] text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1">
              <Plus size={14} /> Add photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const base64 = await convertFileToBase64(file);
                    const currentPhotos = editedCaterer.galleryPhotos || editedCaterer.images || [];
                    setEditedCaterer({
                      ...editedCaterer,
                      galleryPhotos: [...currentPhotos, base64],
                      images: [...currentPhotos, base64],
                    });
                  }
                }}
              />
            </label>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4.5">
          {(editedCaterer && (editedCaterer.galleryPhotos || editedCaterer.images || [])).map((img: string, i: number) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl overflow-hidden relative shadow-sm border border-slate-200 group"
            >
              <img
                src={img}
                alt="Gallery item"
                className="w-full h-full object-cover"
              />
              <div className="bg-black/40 flex items-center justify-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => {
                    const currentPhotos = editedCaterer.galleryPhotos || editedCaterer.images || [];
                    const filtered = currentPhotos.filter((_: any, idx: number) => idx !== i);
                    setEditedCaterer({
                      ...editedCaterer,
                      galleryPhotos: filtered,
                      images: filtered,
                    });
                  }}
                  className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition"
                  title="Remove Photo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {(editedCaterer && (editedCaterer.galleryPhotos || editedCaterer.images || [])).length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-400 font-sans font-medium text-xs">
              No gallery photos uploaded yet. Click the button above to add photos.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4.5">
          {allGalleryPhotos.slice(0, 5).map((img: string, i: number) => (
            <div
              key={i}
              onClick={() => openLightbox(allGalleryPhotos, i)}
              className="aspect-[4/3] rounded-2xl overflow-hidden relative cursor-zoom-in group shadow-sm border-2 border-slate-100 hover:border-[#D4AF37]/65 transition-all duration-300 hover:scale-[1.03]"
            >
              <img
                src={img}
                alt="Gallery"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors"></div>
            </div>
          ))}
          {allGalleryPhotos.length > 5 ? (
            <div
              onClick={() => openLightbox(allGalleryPhotos, 5)}
              className="aspect-[4/3] rounded-2xl bg-slate-50 border-2 border-dashed border-[#DFC27A]/50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors group"
            >
              <div className="bg-[#0B3D2E] text-white rounded-full p-3 mb-2 group-hover:scale-110 transition-transform shadow-md">
                <PlayCircle size={24} className="text-[#DFC27A]" />
              </div>
              <span className="text-sm font-bold text-slate-700 font-sans">
                View More
              </span>
              <span className="text-xs text-slate-500 font-sans">
                Photos & Videos
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// 4. MENU PACKAGES SECTION CARD
export const MenuPackagesCard: React.FC<SectionProps> = ({
  guestCount,
  setGuestCount,
  packageTiers,
  caterer,
  CrownOrnament
}) => {
  return (
    <section
      id="menu-packages"
      className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] relative overflow-hidden select-none scroll-mt-24 w-full"
    >
      <div className="absolute top-0 right-0 w-85 h-85 bg-gradient-to-bl from-amber-100/10 to-transparent rounded-bl-full pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-[#E8DCC7]/40">
        <div className="text-center sm:text-left">
          <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
            Menu Packages
          </h2>
          <div className="flex items-center justify-center sm:justify-start gap-1 text-[#DEAA38] mt-1 font-serif">
            <span className="opacity-40">──</span>
            <span className="text-xs">❃</span>
            <span className="font-bold uppercase tracking-wider text-[9px] text-[#D4A437] font-sans mx-1">
              Premium Event Selections
            </span>
            <span className="text-xs">❃</span>
            <span className="opacity-40">──</span>
          </div>
        </div>

        {/* Guest Selector Counter */}
        <div className="bg-[#FCFAF5] border border-amber-200/50 rounded-xl p-1 px-3 flex items-center gap-3 shadow-xs">
          <button
            onClick={() => setGuestCount((prev) => Math.max(10, prev - 10))}
            className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-90 transition-all flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            −
          </button>
          <div className="text-center min-w-[55px]">
            <span className="block text-sm font-black text-slate-800 leading-none">
              {guestCount}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 block font-mono">
              Guests
            </span>
          </div>
          <button
            onClick={() => setGuestCount((prev) => Math.min(3000, prev + 10))}
            className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-90 transition-all flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6.5 mt-2">
        {packageTiers.map((pkg) => {
          const theme = pkg.theme || "silver";

          let bgBorderClass = "bg-gradient-to-b from-[#FFFDFB] to-white border border-[#E8DCC7] shadow-[0_8px_30px_rgba(15,61,46,0.06)] hover:border-[#D4AF37]/45";
          let badgeClass = "bg-[#FCFAF5] text-[#173D32] border-[#E8DCC7]";
          let badgeDotClass = "bg-[#D4AF37]";
          let titleClass = "text-[#173D32]";
          let buttonClass = "bg-[#173D32] hover:bg-[#0f2922] text-white shadow-md hover:scale-[1.01]";

          if (theme === "gold") {
            bgBorderClass = "bg-[#FCFAF5] border-[2.5px] border-[#DEAA38] shadow-[0_12px_35px_rgba(222,170,56,0.12)]";
            titleClass = "text-[#A27008]";
            buttonClass = "bg-gradient-to-r from-[#D4AF37] via-[#F5E6B3] to-[#AA7C11] text-[#051410] font-black border border-[#DEAA38]/30 shadow-md hover:brightness-105 active:scale-95";
          } else if (theme === "platinum") {
            bgBorderClass = "bg-gradient-to-b from-[#FFFDF9] to-white border-2 border-[#D4AF37]/50 shadow-[0_10px_30px_rgba(15,61,46,0.08)] hover:border-[#D4AF37]";
            titleClass = "text-[#173D32]";
          } else if (theme === "premium") {
            bgBorderClass = "bg-gradient-to-b from-stone-50 to-white border-[2.5px] border-[#DEAA38] shadow-[0_12px_35px_rgba(222,170,56,0.14)]";
            titleClass = "text-[#925F02]";
          } else if (theme === "royal" || theme === "grand") {
            bgBorderClass = "bg-[#FFFDF4] border-[2.5px] border-[#D4AF37] shadow-[0_12px_45px_rgba(222,170,56,0.22)]";
            titleClass = "text-[#8A640F]";
          }

          return (
            <div
              key={pkg.id}
              className={cn(
                "rounded-[2rem] p-6.5 transition-all duration-300 relative flex flex-col pt-10 h-full group hover:-translate-y-1.5",
                bgBorderClass,
              )}
            >
              <CrownOrnament theme={theme} />

              {pkg.popular && (
                <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#EF4444] to-[#C21111] text-white font-black text-[9px] uppercase px-4 py-1 rounded-full shadow-md tracking-widest border border-red-500/15 z-35">
                  Popular
                </div>
              )}

              <div className="text-center mb-4">
                <span className={cn("text-[9px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full mb-1 inline-flex items-center gap-1 border shadow-xs", badgeClass)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", badgeDotClass)}></span>
                  {pkg.type === "veg" ? "Pure Veg" : "Non-Veg Allowed"}
                </span>

                <h3 className={cn("text-[17px] sm:text-[18px] font-serif font-black tracking-wide uppercase leading-tight mt-1.5", titleClass)}>
                  {pkg.name}
                </h3>
              </div>

              <div className="text-center mb-5 pb-4 border-b border-dashed border-stone-200">
                <div className="inline-flex items-baseline text-[#0F3D2E]">
                  <span className="text-lg font-bold font-serif text-stone-400 mr-0.5">₹</span>
                  <span className="text-3xl font-extrabold font-serif leading-none tracking-tight">
                    {pkg.price}
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider ml-1">/ plate</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#555555] mb-5 text-center italic font-medium px-2 flex-1">
                "{pkg.desc}"
              </p>

              <div className="space-y-3 mb-6 bg-[#FCFAF5] p-4 rounded-xl border border-[#E8DCC7]/40 font-sans">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#DEAA38] shrink-0 border border-[#E8DCC7]">
                    <ChefHat size={14} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-[#444444] tracking-tight">
                    {pkg.categoriesCount} Categories Included
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#DEAA38] shrink-0 border border-[#E8DCC7]">
                    <Award size={14} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-[#444444] tracking-tight">
                    {pkg.selectItems}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#DEAA38] shrink-0 border border-[#E8DCC7]">
                    <Users size={14} strokeWidth={2} />
                  </div>
                  <span className="text-xs font-semibold text-[#444444] tracking-tight">
                    {pkg.guests}+ Guests Limit
                  </span>
                </div>
              </div>

              <Link
                to={`/order/${caterer.id}`}
                state={{ packageIdx: pkg.id, customGuestCount: guestCount }}
                className={cn(
                  "mt-auto flex items-center justify-center gap-1.5 w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 active:scale-95 cursor-pointer",
                  buttonClass,
                )}
              >
                View Details <ChevronRight size={14} className="stroke-[3]" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// 5. REVIEWS CARD (NEW)
export const ReviewsCard: React.FC<SectionProps & { reviews: any[] }> = ({ reviews }) => {
  return (
    <div
      id="reviews-section"
      className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] scroll-mt-24 w-full"
    >
      <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
        Client Testimonials
      </h2>
      <div className="flex items-center gap-1 text-[#DEAA38] mt-1 mb-6 font-serif">
        <span className="opacity-40">──</span>
        <span className="text-xs">❃</span>
        <span className="font-bold uppercase tracking-wider text-[9px] text-[#D4A437] font-sans mx-1">
          Words of Appreciation
        </span>
        <span className="text-xs">❃</span>
        <span className="opacity-40">──</span>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="border-b border-[#E8DCC7]/40 pb-5 last:border-0 last:pb-0 flex gap-4">
              <img
                src={rev.authorImage || "https://i.pravatar.cc/150"}
                alt={rev.authorName}
                className="w-12 h-12 rounded-full object-cover border border-[#D4AF37]/30 shrink-0 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-800 text-[15px]">{rev.authorName}</h4>
                  <span className="text-[11px] text-slate-400 font-medium font-sans">{rev.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill={i < Math.floor(rev.rating) ? "#D4AF37" : "none"}
                      className={i < Math.floor(rev.rating) ? "text-[#D4AF37]" : "text-slate-250"}
                    />
                  ))}
                  <span className="text-xs font-black text-slate-700 ml-1.5 mt-0.5">{rev.rating}</span>
                </div>
                <p className="text-[14px] leading-relaxed text-slate-600 font-sans italic">
                  "{rev.content}"
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-6 text-slate-400 italic text-sm">
          No verified client reviews listed yet.
        </p>
      )}
    </div>
  );
};

// 6. ADDITIONAL MEDIA CARD (NEW)
export const AdditionalMediaCard: React.FC<{}> = () => {
  return (
    <div
      id="additional-media-section"
      className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] scroll-mt-24 w-full"
    >
      <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
        Gala Showcase Film
      </h2>
      <div className="flex items-center gap-1 text-[#DEAA38] mt-1 mb-6 font-serif">
        <span className="opacity-40">──</span>
        <span className="text-xs">❃</span>
        <span className="font-bold uppercase tracking-wider text-[9px] text-[#D4A437] font-sans mx-1">
          Bespoke Events Film Reel
        </span>
        <span className="text-xs">❃</span>
        <span className="opacity-40">──</span>
      </div>

      <div className="relative rounded-2xl overflow-hidden aspect-video border-2 border-[#DFC27A]/30 group shadow-md">
        <img
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop"
          alt="Luxury Catering Film"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent flex flex-col justify-end p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#DFC27A]/35 text-white border border-[#DFC27A] text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono font-bold">
              Showcase film
            </span>
            <span className="text-xs text-[#DFC27A]">• 2:45 mins</span>
          </div>
          <h3 className="font-serif font-bold text-white text-[17px] tracking-wide leading-snug">
            Grand Banquet orchestrations & royal wedding experiences (Official Film)
          </h3>
          <p className="text-[12.5px] text-neutral-300 font-sans mt-1 max-w-md hidden sm:block">
            Take a deep cinematographic journey detailing how our visual culinary curators arrange bespoke reception spreads, catering bars, and premium banqueting layout arrangements.
          </p>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#173D32]/95 border-2 border-[#DFC27A] flex items-center justify-center text-white scale-100 hover:scale-[1.08] active:scale-95 transition-all shadow-lg cursor-pointer">
            <PlayCircle size={36} className="text-[#DFC27A] ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};


/* ==========================================================================
   RIGHT COLUMN COMPONENTS
   ========================================================================== */

// 1. BRANCH DETAILS CARD
export const BranchDetailsCard: React.FC<SectionProps> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  targetCatererObj,
  branchesVal,
  caterer
}) => {
  return (
    <div className="bg-[#FFFDFB] rounded-[24px] p-6 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] flex flex-col justify-between group">
      <div className="flex justify-between items-center w-full">
        <h3 className="font-serif font-black text-[#173D32] text-[16px] uppercase tracking-wide flex items-center gap-2">
          <Building size={18} className="text-[#D4AF37]" strokeWidth={2} /> BRANCHES DETAILS
        </h3>
        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setEditedCaterer({ ...caterer });
            }}
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#0F3D2E] font-bold text-xs font-sans transition-colors cursor-pointer"
          >
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>

      <LuxuryDivider />

      {isEditing ? (
        <div className="flex flex-col gap-3.5 py-1.5 flex-1 justify-between font-sans">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#DEAA38] uppercase tracking-widest font-mono">
              Active Branches Count
            </span>
            <input
              type="number"
              value={editedCaterer.branches !== undefined && editedCaterer.branches !== null ? editedCaterer.branches : ""}
              onChange={(e) => setEditedCaterer({ ...editedCaterer, branches: e.target.value })}
              className="bg-white border border-[#E8DCC7] focus:border-[#0F3D2E] rounded-xl px-3 py-2 text-slate-700 text-xs outline-none transition"
              placeholder="e.g. 3"
            />
          </div>
          <div className="flex flex-col gap-1.5 mt-2.5">
            <span className="text-[10px] font-bold text-[#DEAA38] uppercase tracking-widest font-mono">
              Branch Landmark Image
            </span>
            <div className="flex items-center gap-2">
              <label className="bg-[#FAF8F3] hover:bg-[#FAF6EC] border border-[#D4AF37]/35 text-[#0F3D2E] font-bold text-[10px] tracking-wider uppercase px-3 py-2 rounded-lg cursor-pointer transition">
                Upload 🔒
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const fr = new FileReader();
                      fr.onload = () => {
                        setEditedCaterer({ ...editedCaterer, branchPhoto: fr.result as string });
                      };
                      fr.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              {editedCaterer.branchPhoto && (
                <button
                  type="button"
                  onClick={() => setEditedCaterer({ ...editedCaterer, branchPhoto: "" })}
                  className="text-[10.5px] text-rose-550 hover:text-rose-600 font-bold underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3 font-sans text-sm font-bold text-[#444444]">
            <MapPin size={18} className="text-[#D4AF37]" strokeWidth={2} />
            <span>Head Office</span>
            <span className="bg-[#FAF6EC] border border-[#E8DCC7] text-[#D4AF37] font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono">
              HEAD OFFICE
            </span>
          </div>
          
          {branchesVal && branchesVal > 0 ? (
            <div className="mb-4 flex flex-col font-sans">
              <p className="text-[15px] text-[#173D32] font-semibold font-serif">
                {branchesVal} Active Region Branches
              </p>
              <p className="text-xs text-[#555555] mt-1.5 leading-[1.7]">
                Orchestrating bespoke culinary events across multiple localized branches.
              </p>
            </div>
          ) : null}

          {targetCatererObj.branchPhoto ? (
            <div className="h-44 bg-slate-50 rounded-2xl overflow-hidden relative flex items-center justify-center border-2 border-[#D4AF37]/25 shadow-inner group-hover:border-[#D4AF37]/45 transition-colors mt-auto">
              <img
                src={targetCatererObj.branchPhoto}
                alt="Branch Landscape"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F3D2E]/40 via-transparent to-transparent"></div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-2xl bg-[#FCFAF5]/30 mt-auto">
              <Building size={24} className="text-[#D4AF37]/40 mb-2" />
              <p className="text-xs text-slate-400 italic font-sans">No branch gallery photo available</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 2. SERVICE AREAS CARD
export const ServiceAreasCard: React.FC<SectionProps> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  targetCatererObj,
  caterer
}) => {
  return (
    <div className="bg-[#FFFDFB] rounded-[24px] p-6 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] flex flex-col justify-between group">
      <div className="flex justify-between items-center w-full">
        <h3 className="font-serif font-black text-[#173D32] text-[16px] uppercase tracking-wide flex items-center gap-2">
          <MapPin size={18} className="text-[#D4AF37]" strokeWidth={2} /> SERVICE AREAS
        </h3>
        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setEditedCaterer({ ...caterer });
            }}
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#0F3D2E] font-bold text-xs font-sans transition-colors cursor-pointer"
          >
            <Pencil size={11} className="text-[#D4AF37]" /> Edit
          </button>
        )}
      </div>

      <LuxuryDivider />

      {isEditing ? (
        <div className="flex flex-col gap-3.5 py-1.5 flex-1 justify-between font-sans">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#DEAA38] uppercase tracking-widest font-mono">
              Service Areas (Non-Sensitive)
            </span>
            <textarea
              value={editedCaterer.serviceAreas || ""}
              onChange={(e) => setEditedCaterer({ ...editedCaterer, serviceAreas: e.target.value })}
              className="bg-white border border-[#E8DCC7] focus:border-[#0F3D2E] rounded-xl px-3 py-3 text-[#444444] text-xs h-28 outline-none transition resize-none w-full shadow-xs"
              placeholder="e.g. Jubilee Hills, Banjara Hills, Gachibowli"
            />
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#DFC27A]/40 bg-[#FCFAF5]/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center flex-1 min-h-[140px] mt-2">
          {targetCatererObj.serviceAreas ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-10 h-10 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 shadow-sm border border-[#E8DCC7]">
                <MapPin size={18} strokeWidth={2} />
              </div>
              <p className="text-[14.5px] text-[#173D32] font-sans font-bold leading-relaxed select-text font-serif">
                {targetCatererObj.serviceAreas}
              </p>
              <p className="text-xs text-[#666666] mt-1.5 font-sans leading-relaxed">
                Operational and active across all regional specified venues and zones.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2 border border-[#E8DCC7]">
                <MapPin size={18} strokeWidth={2} />
              </div>
              <p className="text-xs font-bold text-[#444444] font-sans">
                No Service Areas Configured
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 3. OPERATING HOURS CARD
export const OperatingHoursCard: React.FC<SectionProps> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  targetCatererObj,
  caterer
}) => {
  return (
    <div className="bg-[#FFFDFB] rounded-[24px] p-6 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] flex flex-col justify-between group">
      <div className="flex justify-between items-center w-full">
        <h3 className="font-serif font-black text-[#173D32] text-[16px] uppercase tracking-wide flex items-center gap-2">
          <Clock size={18} className="text-[#D4AF37]" strokeWidth={2} /> OPERATING HOURS
        </h3>
        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setEditedCaterer({ ...caterer });
            }}
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#0F3D2E] font-bold text-xs font-sans transition-colors cursor-pointer"
          >
            <Pencil size={11} className="text-[#D4AF37]" /> Edit
          </button>
        )}
      </div>

      <LuxuryDivider />

      {isEditing ? (
        <div className="flex flex-col gap-3.5 py-1.5 flex-1 justify-between font-sans">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#DEAA38] uppercase tracking-widest font-mono">
              Operating Hours Schedule
            </span>
            <input
              type="text"
              value={editedCaterer.operatingHours || ""}
              onChange={(e) => setEditedCaterer({ ...editedCaterer, operatingHours: e.target.value })}
              className="bg-white border border-[#E8DCC7] focus:border-[#0F3D2E] rounded-xl px-3 py-2 text-slate-700 text-xs outline-none transition"
              placeholder="e.g. Mon-Sun: 9:00 AM - 10:50 PM"
            />
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-[#DFC27A]/40 bg-[#FCFAF5]/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center flex-1 min-h-[140px] mt-2">
          {targetCatererObj.operatingHours ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-10 h-10 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 shadow-sm border border-[#E8DCC7]">
                <Clock size={18} strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest leading-none mb-1.5 text-center font-mono font-extrabold">
                Weekly Schedule
              </p>
              <p className="text-[14.5px] text-[#173D32] font-sans font-bold leading-normal text-center select-text font-serif">
                {targetCatererObj.operatingHours}
              </p>
              <p className="text-xs text-[#666666] mt-1.5 italic font-sansOption font-sans">
                (Available on all public holidays)
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2 border border-[#E8DCC7]">
                <Clock size={18} strokeWidth={2} />
              </div>
              <p className="text-xs font-bold text-[#444444] font-sans">
                No Timings Configured
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 4. ACHIEVEMENTS CARD
export const AchievementsCard: React.FC<SectionProps> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  achievementsList,
  caterer
}) => {
  return (
    <div className="bg-[#FFFDFB] rounded-[24px] p-6 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)]">
      <div className="flex justify-between items-center w-full">
        <h3 className="font-serif font-black text-[#173D32] text-[16px] uppercase tracking-wide flex items-center gap-2">
          <Award size={18} className="text-[#D4AF37]" strokeWidth={2} /> ACHIEVEMENTS
        </h3>
        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setEditedCaterer({ ...caterer });
            }}
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#0F3D2E] font-bold text-xs font-sans transition-colors cursor-pointer"
          >
            <Pencil size={11} className="text-[#D4AF37]" /> Edit
          </button>
        )}
      </div>

      <LuxuryDivider />

      {isEditing ? (
        <div className="space-y-4 flex-1 flex flex-col justify-center py-1.5 font-sans select-text">
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {achievementsList.map((ach: any, achIdx: number) => (
              <div key={achIdx} className="bg-white/50 border border-[#E8DCC7]/50 rounded-xl p-3 space-y-2 relative group flex flex-col justify-between">
                <div className="absolute top-2 right-2 flex gap-1 z-30">
                  {achIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...achievementsList];
                        const temp = list[achIdx];
                        list[achIdx] = list[achIdx - 1];
                        list[achIdx - 1] = temp;
                        setEditedCaterer({ ...editedCaterer, achievements: list });
                      }}
                      className="p-1 bg-white hover:bg-neutral-50 text-[#0F3D2E] border border-slate-200 rounded-full shadow-xs cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp size={10} />
                    </button>
                  )}
                  {achIdx < achievementsList.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const list = [...achievementsList];
                        const temp = list[achIdx];
                        list[achIdx] = list[achIdx + 1];
                        list[achIdx + 1] = temp;
                        setEditedCaterer({ ...editedCaterer, achievements: list });
                      }}
                      className="p-1 bg-white hover:bg-neutral-50 text-[#0F3D2E] border border-slate-200 rounded-full shadow-xs cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown size={10} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...achievementsList];
                      list.splice(achIdx, 1);
                      setEditedCaterer({ ...editedCaterer, achievements: list });
                    }}
                    className="p-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-full shadow-xs cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-amber-800 font-mono">Value</span>
                    <input
                      type="text"
                      value={ach.value}
                      onChange={(e) => {
                        const list = [...achievementsList];
                        list[achIdx] = { ...list[achIdx], value: e.target.value };
                        setEditedCaterer({ ...editedCaterer, achievements: list });
                      }}
                      className="bg-white border text-center border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#D4AF37] font-semibold text-[#173D32]"
                      placeholder="e.g. 500+"
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1 pr-16">
                    <span className="text-[9px] uppercase font-bold text-amber-800 font-mono">Label</span>
                    <input
                      type="text"
                      value={ach.title}
                      onChange={(e) => {
                        const list = [...achievementsList];
                        list[achIdx] = { ...list[achIdx], title: e.target.value };
                        setEditedCaterer({ ...editedCaterer, achievements: list });
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#D4AF37] text-[#444444]"
                      placeholder="e.g. Successful Events"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#FCFAF5] rounded-xl border border-[#D4AF37]/25 p-3 space-y-2">
            <span className="text-[9px] font-bold text-[#DEAA38] uppercase tracking-wider block font-mono">
              + Suggestion Badge
            </span>
            <div className="flex flex-wrap gap-1">
              {[
                { value: "1,500+", title: "Successful Events" },
                { value: "10,000+", title: "Happy Customers" },
                { value: "15+", title: "Years of Trust" },
                { value: "120+", title: "Expert Professionals" }
              ].map((sug) => (
                <button
                  key={sug.title}
                  type="button"
                  onClick={() => {
                    const list = [...achievementsList];
                    list.push({ value: sug.value, title: sug.title });
                    setEditedCaterer({ ...editedCaterer, achievements: list });
                  }}
                  className="bg-white hover:bg-[#F2EDDF] border border-[#DEAA38]/20 hover:border-[#DEAA38] px-2 py-0.5 rounded-full text-[10px] font-bold text-[#173D32] transition cursor-pointer"
                >
                  + {sug.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col justify-center py-2 select-text font-sans">
          {achievementsList.length > 0 ? (
            achievementsList.map((ach: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 py-2 border-b border-[#E8DCC7]/30 last:border-0 font-sans">
                <div className="flex-shrink-0 bg-[#FCFAF5] border-2 border-[#D4AF37]/60 rounded-full p-1.5 text-[#D4AF37] shadow-xs">
                  <Check size={14} className="stroke-[3]" />
                </div>
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="text-2xl sm:text-3xl font-bold text-[#173D32] tracking-tight font-serif">
                    {ach.value}
                  </span>
                  <span className="text-[13px] font-semibold text-[#666666] uppercase tracking-wider mt-0.5">
                    {ach.title}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#666666] italic text-center py-4 font-sans">
              No achievements entered yet
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// 5. AWARDS & CERTS CARD
export const AwardsCertsCard: React.FC<SectionProps> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  awardsList,
  certificationsList,
  caterer
}) => {
  return (
    <div className="bg-[#FFFDFB] rounded-[24px] p-6 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] flex flex-col justify-between group">
      <div className="flex justify-between items-center w-full">
        <h3 className="font-serif font-black text-[#173D32] text-[16px] uppercase tracking-wide flex items-center gap-2">
          <Award size={18} className="text-[#D4AF37]" strokeWidth={2} /> AWARDS & CERTS
        </h3>
        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setEditedCaterer({ ...caterer });
            }}
            className="flex items-center gap-1 text-[#D4AF37] hover:text-[#0F3D2E] font-bold text-xs font-sans transition-colors cursor-pointer"
          >
            <Pencil size={11} className="text-[#D4AF37]" /> Edit
          </button>
        )}
      </div>

      <LuxuryDivider />

      {isEditing ? (
        <div className="space-y-4 flex-1 flex flex-col justify-center py-1.5 font-sans select-text">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#DEAA38] uppercase tracking-widest font-mono block">
              Awards & Credentials (Editable list)
            </span>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {awardsList.map((award: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={award}
                    onChange={(e) => {
                      const curr = [...awardsList];
                      curr[idx] = e.target.value;
                      setEditedCaterer({ ...editedCaterer, awards: curr });
                    }}
                    className="bg-white border text-xs text-[#444444] border-slate-200 focus:border-[#D4AF37] rounded-lg px-2 py-1 flex-1 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const curr = [...awardsList];
                      curr.splice(idx, 1);
                      setEditedCaterer({ ...editedCaterer, awards: curr });
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg border border-red-100 cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => {
                const curr = [...awardsList];
                curr.push("New Custom Award");
                setEditedCaterer({ ...editedCaterer, awards: curr });
              }}
              className="text-[10px] bg-[#0F3D2E] text-white hover:bg-[#173D32] px-2.5 py-1 rounded-md font-bold transition flex items-center gap-0.5 cursor-pointer mt-1"
            >
              + Add Award Badge
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-wrap items-center justify-center gap-x-8 gap-y-7 py-2.5">
          {awardsList.length > 0 || certificationsList.length > 0 ? (
            <>
               {awardsList.map((award: string, i: number) => (
                <div key={`aw-${i}`}>
                  <GoldMedalIcon title={award} />
                </div>
              ))}
              {certificationsList.map((cert: string, i: number) => (
                <div key={`c-${i}`}>
                  <GoldMedalIcon title={cert} isShield={true} />
                </div>
              ))}
            </>
          ) : (
            <>
              <GoldMedalIcon title="Best Wedding Caterer" />
              <GoldMedalIcon title="Excellence in Catering" isShield={true} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

// 6. CONTACT SIDEBAR CARD
export const ContactSidebarCard: React.FC<{
  caterer: any;
  user: any;
}> = ({ caterer, user }) => {
  return (
    <div className="border-2 border-[#DFC27A]/50 bg-stone-50 rounded-[24px] p-5.5 flex flex-col gap-4 shadow-sm text-center font-sans">
      <div className="flex items-center gap-2 mb-1 justify-center lg:justify-start">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
          <ShieldCheck size={18} />
        </div>
        <h4 className="font-bold text-amber-900 text-[16px]">
          Privacy Protected Contact
        </h4>
      </div>
      <p className="text-amber-800 text-[13px] leading-relaxed select-text font-medium text-left">
        To protect caterer confidentiality, direct contact details (Phone & WhatsApp) will be securely shared only after your order is confirmed.
      </p>

      {user?.role === "admin" && (
        <div className="border-t border-amber-200/65 pt-3.5 mt-1.5 flex flex-col items-start gap-1 select-text">
          <span className="text-[10px] uppercase tracking-widest text-amber-700 font-extrabold font-mono">
            Admin View
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-950">
            <Phone size={13} className="text-amber-700" /> {caterer.phone}
          </span>
        </div>
      )}
    </div>
  );
};
