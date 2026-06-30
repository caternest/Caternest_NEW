import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  Phone,
  Mail,
  X
} from "lucide-react";
import { cn } from "../lib/utils";
import { serviceIcons, DEFAULT_SERVICES, achievementIconsMap, DEFAULT_ACHIEVEMENTS } from "../pages/CatererDetails";
import { calculateDistanceKm, estimateDrivingTimeMinutes } from "../lib/locationIntelligence";

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
  CrownOrnament: React.ComponentType<{ theme: any; size?: number }>;
  experienceVal?: any;
  handleSaveFields?: (val: any) => Promise<void>;
  convertFileToBase64?: (file: File) => Promise<string>;
  openEditModal?: (section: string) => void;
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
  caterer,
  handleSaveFields,
  openEditModal
}) => {
  const chefPhoto = targetCatererObj.ownerPhoto || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=400";
  const chefName = targetCatererObj.ownerName || targetCatererObj.owner || "Executive Chef";
  const brandName = targetCatererObj.brandName || targetCatererObj.name || "Elite Catering";

  const [editingStat, setEditingStat] = React.useState<{ key: string; label: string; value: any } | null>(null);

  return (
    <div 
      id="about-us-section"
      className="bg-[#f0e9e9] rounded-[24px] p-6 md:p-8 border border-[#D4AF37]/25 hover:border-[#D4AF37]/65 transition-all shadow-md duration-300 flex flex-col relative text-left"
    >
      {editingStat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0D0D0D] border-2 border-[#D4AF37] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] w-full max-w-md p-6 text-white relative">
            <button
              type="button"
              onClick={() => setEditingStat(null)}
              className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer"
            >
              <X size={14} />
            </button>
            <h3 className="text-base font-bold uppercase text-[#D4AF37] tracking-wider mb-4 font-serif">
              Edit {editingStat.label}
            </h3>
            <div className="space-y-4 font-sans">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">{editingStat.label}</label>
                {editingStat.key === "description" ? (
                  <textarea
                    value={editingStat.value}
                    onChange={(e) => setEditingStat({ ...editingStat, value: e.target.value })}
                    className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-white text-sm h-32 outline-none transition resize-none w-full"
                  />
                ) : (
                  <input
                    type={editingStat.key === "rating" ? "text" : "number"}
                    step={editingStat.key === "rating" ? "0.1" : "1"}
                    value={editingStat.value}
                    onChange={(e) => setEditingStat({ ...editingStat, value: e.target.value })}
                    className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 h-12 text-white text-sm outline-none transition w-full"
                  />
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (handleSaveFields) {
                      let val = editingStat.value;
                      if (editingStat.key !== "description" && editingStat.key !== "rating") {
                        val = val !== "" ? parseInt(val) : 0;
                      }
                      await handleSaveFields({ [editingStat.key]: val });
                    }
                    setEditingStat(null);
                  }}
                  className="bg-[#D4AF37] hover:bg-[#b08427] text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStat(null)}
                  className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
            About {brandName}
          </h2>
          {isOwnerOrAdmin && openEditModal && (
            <button
              type="button"
              onClick={() => openEditModal("about")}
              className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all cursor-pointer"
              title="Edit About Section"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>
        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setEditingStat({
                key: "description",
                label: "About Description",
                value: targetCatererObj.description || ""
              });
            }}
            className="flex items-center gap-1.5 text-[#D4AF37] hover:text-[#06281E] font-bold text-xs font-sans transition-colors cursor-pointer"
          >
            <Pencil size={12} className="text-[#D4AF37]" /> Edit About Description
          </button>
        )}
      </div>

      <LuxuryDivider />

      <div className="mb-6 font-sans">
        <div className="flex flex-col gap-6">
          {/* Chef Profile Layout */}
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-[#fff7eb] border border-[#D4AF37]/10 rounded-2xl p-4 md:p-5 text-[16px]">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-xs" />
              <img 
                src={chefPhoto} 
                alt={chefName} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-[#D4AF37] relative z-10 shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <span className="text-[12px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">Meet Our</span>
              <h3 className="text-[20px] font-serif font-bold text-[#173D32] mb-2">{chefName}</h3>
              <p className="text-slate-600 text-[15px] leading-relaxed italic">
                "Extraordinary culinary orchestration isn't just about premium plating, it's about translating rich heritage and refined hospitality into memorable guest stories."
              </p>
            </div>
          </div>

          {/* Caterer Description Text */}
          <div className="flex flex-col items-start w-full relative group">
            <p className="text-[#444444] text-[14px] sm:text-[15px] md:text-[16px] font-sans leading-[1.8] text-left whitespace-pre-wrap select-text font-medium pr-8 w-full">
              {targetCatererObj.description || "Welcome to our premium catering service. We bring extraordinary food, luxury arrangements, and top tier hospitality to elevate your special day."}
            </p>
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingStat({
                    key: "description",
                    label: "About Description",
                    value: targetCatererObj.description || ""
                  });
                }}
                className="absolute right-0 top-0 text-[#D4AF37] hover:text-[#06281E] opacity-50 group-hover:opacity-100 transition duration-200 cursor-pointer"
                title="Edit Description"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2 border-t border-[#E8DCC7]/50 pt-6">
        {/* Years Experience Metric */}
        <div className="flex flex-col items-center p-4 bg-white rounded-[18px] border border-[#DFC27A]/35 hover:border-[#D4AF37]/70 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative group">
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingStat({
                  key: "experience",
                  label: "Years Experience",
                  value: targetCatererObj.experience || 15
                });
              }}
              className="absolute right-2 top-2 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
              title="Edit Experience"
            >
              <Pencil size={11} />
            </button>
          )}
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <Award size={18} strokeWidth={2} />
          </div>
          <>
            <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
              {experienceVal ? `${experienceVal}+` : "15+"}
            </span>
            <span className="text-[10px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
              Experience
            </span>
          </>
        </div>

        {/* Events Completed Metric */}
        <div className="flex flex-col items-center p-4 bg-white rounded-[18px] border border-[#DFC27A]/35 hover:border-[#D4AF37]/70 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative group">
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingStat({
                  key: "eventsCompleted",
                  label: "Events Completed",
                  value: targetCatererObj.eventsCompleted || 400
                });
              }}
              className="absolute right-2 top-2 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
              title="Edit Events Completed"
            >
              <Pencil size={11} />
            </button>
          )}
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <CalendarDays size={18} strokeWidth={2} />
          </div>
          <>
            <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
              {targetCatererObj.eventsCompleted ? `${parseInt(targetCatererObj.eventsCompleted.toString()).toLocaleString()}+` : "400+"}
            </span>
            <span className="text-[10px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
              Events Catered
            </span>
          </>
        </div>

        {/* Team Members Metric */}
        <div className="flex flex-col items-center p-4 bg-white rounded-[18px] border border-[#DFC27A]/35 hover:border-[#D4AF37]/70 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative group">
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingStat({
                  key: "menuCount",
                  label: "Menu Selection Count",
                  value: targetCatererObj.menuCount || 52
                });
              }}
              className="absolute right-2 top-2 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
              title="Edit Menu Selections"
            >
              <Pencil size={11} />
            </button>
          )}
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <Users size={18} strokeWidth={2} />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
            {targetCatererObj.menuCount || "52"}+
          </span>
          <span className="text-[10px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
            Menu Selections
          </span>
        </div>

        {/* Customer Rating Metric */}
        <div className="flex flex-col items-center p-4 bg-white rounded-[18px] border border-[#DFC27A]/35 hover:border-[#D4AF37]/70 shadow-xs text-center hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative group">
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingStat({
                  key: "rating",
                  label: "Customer Rating",
                  value: targetCatererObj.rating || "4.9"
                });
              }}
              className="absolute right-2 top-2 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
              title="Edit Rating"
            >
              <Pencil size={11} />
            </button>
          )}
          <div className="w-11 h-11 rounded-full bg-[#FCFAF5] flex items-center justify-center text-[#D4AF37] mb-2.5 border border-[#E8DCC7] shadow-xs">
            <Star size={18} fill="#D4AF37" className="text-[#D4AF37]" strokeWidth={2} />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-[#173D32] font-serif">
            {targetCatererObj.rating || "4.9"}
          </span>
          <span className="text-[10px] text-[#666666] font-sans font-semibold mt-1 uppercase tracking-wider">
            Client Rating
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
  setIsAddServiceModalOpen,
  openEditModal
}) => {
  return (
    <div className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] flex flex-col hover:shadow-md">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
            Services We Offer
          </h2>
          {isOwnerOrAdmin && openEditModal && (
            <button
              type="button"
              onClick={() => openEditModal("services")}
              className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all cursor-pointer"
              title="Edit Services"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>
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

      <div className="flex overflow-x-auto gap-4 pb-4 w-full md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-6 mt-2 scrollbar-none snap-x snap-mandatory">
         {(editedCaterer?.services || caterer?.services || DEFAULT_SERVICES).map((item: any, idx: number) => {
            const IconComp = serviceIcons[item.iconName] || ChefHat;
            const currentServicesLength = (editedCaterer?.services || caterer?.services || DEFAULT_SERVICES).length;
            
            if (isEditing) {
              return (
                <div key={idx} className="bg-[#FFFDFB] rounded-2xl overflow-hidden border-2 border-[#D4AF37] shadow-[0_8px_24px_rgba(15,61,46,0.08)] flex flex-col items-center text-center pb-5 group relative h-full w-[260px] shrink-0 md:w-full md:shrink snap-start">
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
              <div key={idx} className="bg-[#FFFDFB] rounded-2xl overflow-hidden border-2 border-[#E8DCC7] hover:border-[#DFC27A]/85 shadow-[0_8px_24px_rgba(15,61,46,0.06)] hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center pb-5 group h-full w-[260px] shrink-0 md:w-full md:shrink snap-start">
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
  convertFileToBase64,
  openEditModal,
  isOwnerOrAdmin
}) => {
  return (
    <div
      id="gallery-section"
      className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] scroll-mt-24"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-[22px] md:text-[25px] font-serif font-black text-[#173D32] tracking-tight">
            Food Gallery
          </h2>
          {isOwnerOrAdmin && openEditModal && (
            <button
              type="button"
              onClick={() => openEditModal("food_gallery")}
              className="inline-flex items-center justify-center p-1.5 rounded-full hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all cursor-pointer"
              title="Edit Food Gallery"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>
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
export const MenuPackagesCard: React.FC<SectionProps & {
  guestCount: number;
  setGuestCount: React.Dispatch<React.SetStateAction<number>>;
  packageTiers: any[];
}> = ({
  guestCount,
  setGuestCount,
  packageTiers,
  caterer,
  CrownOrnament,
  isOwnerOrAdmin,
  handleSaveFields
}) => {
  const getInitialPackagesList = () => {
    if (caterer.menuPackages && caterer.menuPackages.length > 0) {
      return caterer.menuPackages.map((pkg: any, idx: number) => ({
        id: pkg.id !== undefined && pkg.id !== null ? pkg.id : idx,
        packageName: pkg.packageName || pkg.name || `Package ${idx + 1}`,
        packageType: pkg.packageType || (pkg.type === "nonVeg" ? "Non-Veg" : "Veg"),
        pricePerPlate: pkg.pricePerPlate || pkg.price || 350,
        minimumGuests: pkg.minimumGuests || pkg.guests || 50,
        description: pkg.description || pkg.desc || "",
        categories: pkg.categories || [],
        items: pkg.items || [],
        buttonText: pkg.buttonText || "View Details",
        cardTheme: pkg.cardTheme || pkg.theme || "silver",
        popular: pkg.popular || false,
        visible: pkg.visible !== false
      }));
    }
    
    return packageTiers.map((p: any, idx: number) => ({
      id: p.id !== undefined && p.id !== null ? p.id : idx,
      packageName: p.name,
      packageType: p.type === "nonVeg" ? "Non-Veg" : "Veg",
      pricePerPlate: p.price,
      minimumGuests: p.guests,
      description: p.desc,
      categories: p.categories || ["Welcome Drinks", "Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts"],
      items: p.items || ["Mocktail Selection", "Paneer Tikka / Veg Kebab", "Special Paneer Curry", "Assorted Roti", "Dum Biryani", "Gulab Jamun"],
      buttonText: p.buttonText || "View Details",
      cardTheme: p.theme || "silver",
      popular: p.popular || false,
      visible: p.visible !== false
    }));
  };

  const location = useLocation();
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [detailPkg, setDetailPkg] = React.useState<any | null>(null);

  const [isEditingPackage, setIsEditingPackage] = React.useState(false);
  const [selectedPkg, setSelectedPkg] = React.useState<any | null>(null);

  // Modal form states
  const [packageNameInput, setPackageNameInput] = React.useState("");
  const [packageTypeInput, setPackageTypeInput] = React.useState("Veg");
  const [priceInput, setPriceInput] = React.useState(350);
  const [minGuestsInput, setMinGuestsInput] = React.useState(50);
  const [descInput, setDescInput] = React.useState("");
  const [categoriesInput, setCategoriesInput] = React.useState("");
  const [itemsInput, setItemsInput] = React.useState("");
  const [themeInput, setThemeInput] = React.useState("silver");
  const [buttonTextInput, setButtonTextInput] = React.useState("View Details");
  const [popularInput, setPopularInput] = React.useState(false);
  const [visibleInput, setVisibleInput] = React.useState(true);

  const handleOpenEdit = (pkgId: any) => {
    const list = getInitialPackagesList();
    const found = list.find((p) => p.id === pkgId);
    if (found) {
      setSelectedPkg(found);
      setPackageNameInput(found.packageName);
      setPackageTypeInput(found.packageType);
      setPriceInput(found.pricePerPlate);
      setMinGuestsInput(found.minimumGuests);
      setDescInput(found.description);
      setCategoriesInput(found.categories.join(", "));
      setItemsInput(found.items.join(", "));
      setThemeInput(found.cardTheme);
      setButtonTextInput(found.buttonText);
      setPopularInput(found.popular);
      setVisibleInput(found.visible);
      setIsEditingPackage(true);
    }
  };

  const handleAddNewPackage = async () => {
    const list = getInitialPackagesList();
    const newId = `custom_${Date.now()}`;
    const newPkg = {
      id: newId,
      packageName: "New Custom Package",
      packageType: "Veg",
      pricePerPlate: 500,
      minimumGuests: 100,
      description: "A signature select luxury menu package tailored for your premium guests.",
      categories: ["Welcome Drinks", "Starters", "Main Course", "Desserts"],
      items: ["Fresh Fruit Punch", "Paneer Tikka", "Veg Jalfrezi with Naan", "Ice Cream Bowl"],
      buttonText: "View Details",
      cardTheme: "gold",
      popular: false,
      visible: true
    };

    const updatedList = [...list, newPkg];
    if (handleSaveFields) {
      await handleSaveFields({
        menuPackages: updatedList,
        packages: updatedList
      });
    }

    // Immediately open edit modal for the newly added package
    setPackageNameInput(newPkg.packageName);
    setPackageTypeInput(newPkg.packageType);
    setPriceInput(newPkg.pricePerPlate);
    setMinGuestsInput(newPkg.minimumGuests);
    setDescInput(newPkg.description);
    setCategoriesInput(newPkg.categories.join(", "));
    setItemsInput(newPkg.items.join(", "));
    setThemeInput(newPkg.cardTheme);
    setButtonTextInput(newPkg.buttonText);
    setPopularInput(newPkg.popular);
    setVisibleInput(newPkg.visible);
    setSelectedPkg(newPkg);
    setIsEditingPackage(true);
  };

  const handleDeletePackage = async () => {
    if (!selectedPkg) return;
    const list = getInitialPackagesList();
    const updatedList = list.filter((p) => p.id !== selectedPkg.id);
    if (handleSaveFields) {
      await handleSaveFields({
        menuPackages: updatedList,
        packages: updatedList
      });
    }
    setIsEditingPackage(false);
  };

  const handleSavePackage = async () => {
    if (!selectedPkg) return;
    const list = getInitialPackagesList();
    
    const updatedList = list.map((p) => {
      if (p.id === selectedPkg.id) {
        return {
          id: p.id,
          packageName: packageNameInput,
          packageType: packageTypeInput,
          pricePerPlate: Number(priceInput),
          minimumGuests: Number(minGuestsInput),
          description: descInput,
          categories: categoriesInput.split(",").map(s => s.trim()).filter(Boolean),
          items: itemsInput.split(",").map(s => s.trim()).filter(Boolean),
          buttonText: buttonTextInput,
          cardTheme: themeInput,
          popular: popularInput,
          visible: visibleInput
        };
      }
      return p;
    });

    if (handleSaveFields) {
      await handleSaveFields({
        menuPackages: updatedList,
        packages: updatedList
      });
    }
    setIsEditingPackage(false);
  };

  return (
    <section
      id="menu-packages"
      className="bg-[#FFFDFB] rounded-[24px] p-6 md:p-8 border-2 border-[#DFC27A]/50 hover:border-[#D4AF37]/80 transition-all shadow-[0_12px_40px_rgba(15,61,46,0.06)] relative overflow-hidden select-none scroll-mt-24 w-full"
    >
      <div className="absolute top-0 right-0 w-85 h-85 bg-gradient-to-bl from-amber-100/10 to-transparent rounded-bl-full pointer-events-none"></div>

      {/* Edit Package Modal */}
      {isEditingPackage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0D0D0D] border-2 border-[#D4AF37] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] w-full max-w-2xl p-6 text-white relative flex flex-col max-h-[90vh]">
            <button
              type="button"
              onClick={() => setIsEditingPackage(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer"
            >
              <X size={14} />
            </button>
            
            <h3 className="text-lg font-serif font-bold text-[#D4AF37] mb-4 uppercase tracking-wide">
              Edit Menu Package
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 font-sans text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Package Name</label>
                  <input
                    type="text"
                    value={packageNameInput}
                    onChange={(e) => setPackageNameInput(e.target.value)}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Package Type</label>
                  <select
                    value={packageTypeInput}
                    onChange={(e) => setPackageTypeInput(e.target.value)}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition cursor-pointer"
                  >
                    <option value="Veg">Veg Package</option>
                    <option value="Non-Veg">Non-Veg Package</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Price per Plate (₹)</label>
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(Number(e.target.value))}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Minimum Guests</label>
                  <input
                    type="number"
                    value={minGuestsInput}
                    onChange={(e) => setMinGuestsInput(Number(e.target.value))}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Short Description</label>
                  <textarea
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    rows={2}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl p-3.5 text-white text-sm outline-none transition resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Categories Included (Comma-separated)</label>
                  <input
                    type="text"
                    value={categoriesInput}
                    onChange={(e) => setCategoriesInput(e.target.value)}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition"
                    placeholder="Welcome Drinks, Starters, Main Course, Desserts"
                  />
                </div>

                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Key Items Sample List (Comma-separated)</label>
                  <input
                    type="text"
                    value={itemsInput}
                    onChange={(e) => setItemsInput(e.target.value)}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition"
                    placeholder="Paneer Tikka, Veg Dum Biryani, Kala Jamun"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Button Action Text</label>
                  <input
                    type="text"
                    value={buttonTextInput}
                    onChange={(e) => setButtonTextInput(e.target.value)}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Luxury Color Theme</label>
                  <select
                    value={themeInput}
                    onChange={(e) => setThemeInput(e.target.value)}
                    className="bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-sm outline-none transition cursor-pointer"
                  >
                    <option value="silver">Premium Silver</option>
                    <option value="gold">Exquisite Gold</option>
                    <option value="platinum">Royal Platinum</option>
                    <option value="premium">Ruby Premium</option>
                    <option value="royal">Imperial Royal</option>
                    <option value="grand">Grand Royal Deluxe</option>
                  </select>
                </div>

                <div className="flex gap-4 col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={popularInput}
                      onChange={(e) => setPopularInput(e.target.checked)}
                      className="w-4 h-4 rounded text-black accent-[#D4AF37] cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">Feature as "Popular" badge</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visibleInput}
                      onChange={(e) => setVisibleInput(e.target.checked)}
                      className="w-4 h-4 rounded text-black accent-[#D4AF37] cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">Visible on Profile Page</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/10 font-sans mt-4">
              <button
                type="button"
                onClick={handleDeletePackage}
                className="bg-red-900/40 hover:bg-red-900/60 text-red-200 font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete Package
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSavePackage}
                  className="bg-[#D4AF37] hover:bg-[#b08427] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPackage(false)}
                  className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-[#E8DCC7]/40">
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <h2 className="text-[22px] md:text-[25px] font-georgia font-black text-[#173D32] tracking-tight">
              Menu Packages
            </h2>
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={handleAddNewPackage}
                className="bg-[#DEAA38] hover:bg-[#A27008] text-white font-sans font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer transition flex items-center gap-1 shadow-xs animate-pulse"
              >
                <Plus size={10} /> Add Custom
              </button>
            )}
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1 text-[#DEAA38] mt-1.5 font-serif">
            <span className="opacity-50 text-sm">──</span>
            <span className="text-sm">❃</span>
            <span className="font-extrabold uppercase tracking-[1.5px] text-[13px] text-[#A27008] font-sans mx-1.5">
              Premium Event Selections
            </span>
            <span className="text-sm">❃</span>
            <span className="opacity-50 text-sm inline-block">──</span>
          </div>
        </div>

        {/* Guest Selector Counter */}
        <div className="bg-[#FCFAF5] border border-amber-200/60 rounded-xl p-1.5 px-4 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setGuestCount((prev) => Math.max(10, prev - 10))}
            className="w-8.5 h-8.5 rounded-full bg-stone-100/90 text-stone-700 hover:bg-stone-200 active:scale-90 transition-all flex items-center justify-center font-bold text-lg cursor-pointer border border-stone-200/40"
          >
            −
          </button>
          <div className="text-center min-w-[65px]">
            <span className="block text-lg font-black text-slate-800 leading-none">
              {guestCount}
            </span>
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-widest mt-1 block font-sans">
              Guests
            </span>
          </div>
          <button
            onClick={() => setGuestCount((prev) => Math.min(3000, prev + 10))}
            className="w-8.5 h-8.5 rounded-full bg-stone-100/90 text-stone-700 hover:bg-stone-200 active:scale-90 transition-all flex items-center justify-center font-bold text-lg cursor-pointer border border-stone-200/40"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2 max-w-[1100px] mx-auto justify-center">
        {packageTiers.map((pkg) => {
          // If hidden and user is not owner/admin, hide it from the UI completely
          if (pkg.visible === false && !isOwnerOrAdmin) return null;

          const theme = pkg.theme || "silver";

          const themeStyles: Record<
            "silver" | "gold" | "platinum" | "premium" | "royal" | "grand",
            {
              background: string;
              borderColor: string;
              titleColor: string;
              subtitleColor: string;
              buttonClass: string;
            }
          > = {
            silver: {
              background: "linear-gradient(180deg, #FFFFFF 0%, #F7F7F5 100%)",
              borderColor: "#D9D9D6",
              titleColor: "text-[#474745]",
              subtitleColor: "text-[#75737d]",
              buttonClass: "bg-[#173D32] hover:bg-[#0f2922] text-white",
            },
            gold: {
              background: "linear-gradient(180deg, #FFFDF6 0%, #FFF3D8 100%)",
              borderColor: "#E3B23C",
              titleColor: "text-[#925F02]",
              subtitleColor: "text-[#A27008]",
              buttonClass: "bg-gradient-to-r from-[#D4AF37] via-[#F5E6B3] to-[#AA7C11] text-[#051410] border border-[#DEAA38]/30 hover:brightness-105",
            },
            platinum: {
              background: "linear-gradient(180deg, #FFFFFF 0%, #F5F5F3 100%)",
              borderColor: "#C8C8C8",
              titleColor: "text-[#334155]",
              subtitleColor: "text-[#64748b]",
              buttonClass: "bg-[#173D32] hover:bg-[#0f2922] text-white",
            },
            premium: {
              background: "linear-gradient(180deg, #FFF9F9 0%, #FFE7E7 100%)",
              borderColor: "#F28B82",
              titleColor: "text-[#991B1B]",
              subtitleColor: "text-[#B91C1C]",
              buttonClass: "bg-gradient-to-r from-[#991B1B] to-[#7F1D1D] text-white hover:brightness-105",
            },
            royal: {
              background: "linear-gradient(180deg, #FFFDF8 0%, #FFF1CF 100%)",
              borderColor: "#D4A017",
              titleColor: "text-[#71520D]",
              subtitleColor: "text-[#8A640F]",
              buttonClass: "bg-[#173D32] hover:bg-[#0f2922] text-white",
            },
            grand: {
              background: "linear-gradient(180deg, #FFFDF8 0%, #FFEFC9 100%)",
              borderColor: "#D89C1D",
              titleColor: "text-[#784F07]",
              subtitleColor: "text-[#8A640F]",
              buttonClass: "bg-[#173D32] hover:bg-[#0f2922] text-white",
            },
          };

          const tStyle = themeStyles[theme as keyof typeof themeStyles] || themeStyles.silver;

          const highlightedPkgId = location.state?.selectedPackageId;
          const isHighlighted = highlightedPkgId !== undefined && String(highlightedPkgId) === String(pkg.id);

          return (
            <div
              key={pkg.id}
              className={cn(
                "rounded-[18px] p-5 pt-[31px] pb-5 transition-all duration-300 relative flex flex-col justify-between group hover:-translate-y-1.5 hover:shadow-xl max-w-[285px] mx-auto w-full min-h-[380px] border",
                pkg.visible === false && "opacity-60 border-dashed bg-stone-100",
                isHighlighted ? "ring-4 ring-[#DEAA38] ring-offset-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] border-[#DEAA38] scale-[1.02]" : ""
              )}
              style={{
                background: tStyle.background,
                borderColor: isHighlighted ? "#DEAA38" : tStyle.borderColor,
                boxShadow: isHighlighted ? "0 12px 35px rgba(212,175,55,0.25)" : "0 8px 30px rgba(0,0,0,0.06)",
              }}
            >
              <CrownOrnament theme={theme} size={36} />

              {/* Floating edit button */}
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenEdit(pkg.id)}
                  className="absolute top-3 left-3 bg-white/95 text-slate-800 hover:text-black border border-stone-200 shadow-sm p-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition z-40"
                  title="Edit Package"
                >
                  <Pencil size={11} />
                </button>
              )}

              {isHighlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#DEAA38] text-white font-sans font-black text-[9px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-[0_4px_12px_rgba(222,170,56,0.25)] border border-amber-300 z-50">
                  Last Selected
                </div>
              )}

              {pkg.popular && !isHighlighted && (
                <div className="absolute -top-2.5 right-4 bg-[#C21111] text-white font-extrabold text-[8px] uppercase px-3 py-0.5 rounded-full shadow-sm tracking-wider border border-red-500/10 z-35">
                  Popular
                </div>
              )}

              {pkg.visible === false && (
                <div className="absolute top-2.5 right-4 bg-slate-800 text-slate-100 font-extrabold text-[8px] uppercase px-2.5 py-0.5 rounded-full shadow-sm tracking-wider z-35">
                  Hidden
                </div>
              )}

              <div className="flex flex-col flex-1 justify-between">
                <div>
                  <div className="text-center">
                    <h3 
                      className="font-bold text-center tracking-[0.4px] line-clamp-1"
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: "26px",
                        lineHeight: "30px",
                        color: "#2A2A2A",
                        marginTop: "16px",
                        marginBottom: "10px"
                      }}
                    >
                      {pkg.name}
                    </h3>
                    <div className="flex justify-center mb-4">
                      {pkg.type === "veg" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Veg Package
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          Non-Veg Package
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center" style={{ marginBottom: "16px" }}>
                    <div className="inline-flex items-baseline text-[#1E1E1E] justify-center font-sans">
                      <span 
                        className="font-extrabold tracking-tight leading-none"
                        style={{
                          fontSize: "36px",
                          color: "#1E1E1E",
                        }}
                      >
                        ₹{pkg.price}
                      </span>
                      <span 
                        className="font-medium leading-none ml-1 uppercase"
                        style={{
                          fontSize: "13px",
                          color: "#8C8C8C",
                        }}
                      >
                        /plate
                      </span>
                    </div>
                  </div>

                  {pkg.desc && (
                    <p 
                      className="font-sans font-normal text-center mx-auto max-w-[90%] line-clamp-2 italic text-slate-500"
                      style={{
                        fontSize: "13px",
                        lineHeight: "18px",
                        marginBottom: "20px"
                      }}
                    >
                      "{pkg.desc}"
                    </p>
                  )}
                </div>

                <div 
                  className="space-y-3 p-3.5 bg-white rounded-[14px] border border-[#EFE7DA] font-sans w-full"
                  style={{ marginBottom: "20px" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-[#D4AF37] shrink-0">
                      <Users size={16} strokeWidth={2.2} />
                    </div>
                    <span 
                      className="font-sans font-semibold text-left leading-tight text-slate-700"
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      Min {pkg.guests || 50}+ Guests
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-[#D4AF37] shrink-0">
                      <ChefHat size={16} strokeWidth={2.2} />
                    </div>
                    <span 
                      className="font-sans font-semibold text-left leading-tight text-slate-700"
                      style={{
                        fontSize: "13px",
                      }}
                    >
                      {pkg.items ? pkg.items.length : (pkg.categoriesCount * 2 || 12)} Custom Dishes
                    </span>
                  </div>

                  <div className="flex justify-center pt-1 border-t border-amber-100/40">
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-amber-700/80">
                      ✦ Customizable Menu
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <Link
                  to={`/order/${caterer.id}`}
                  state={{ packageIdx: pkg.id, customGuestCount: guestCount }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 w-full h-[40px] rounded-[10px] font-sans font-bold text-xs uppercase tracking-[0.5px] transition-all duration-300 active:scale-95 cursor-pointer shadow-sm hover:brightness-105",
                    tStyle.buttonClass,
                  )}
                >
                  Book Now <ChevronRight size={12} className="stroke-[3]" />
                </Link>

                <button
                  onClick={() => {
                    setDetailPkg(pkg);
                    setDetailModalOpen(true);
                  }}
                  className="w-full text-center font-sans font-bold text-[11px] uppercase tracking-[0.5px] text-[#A27008] hover:text-[#71520D] transition cursor-pointer mt-1"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium View Details Modal */}
      {detailModalOpen && detailPkg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in select-none">
          <div className="bg-[#FFFDF9] rounded-2xl md:rounded-[32px] border-2 border-[#BB9C4A] shadow-[0_30px_70px_rgba(0,0,0,0.3)] max-w-lg w-full overflow-hidden relative transform transition-all scale-100 flex flex-col max-h-[90vh]">
            
            {/* Elegant Header */}
            <div className="bg-gradient-to-br from-[#021B1A] via-[#032D29] to-[#0A3A34] text-white p-6 relative select-none border-b border-[#BB9C4A]/45 shrink-0 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <h3 className="font-display font-bold text-2xl uppercase tracking-wider text-[#FDE5A9] leading-tight">
                  {detailPkg.name}
                </h3>
                <span className="text-[10px] font-sans font-semibold text-[#DEAA38]/90 uppercase tracking-[0.2em] mt-1.5">
                  Package Details • {caterer.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setDetailPkg(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-white/10"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-left flex-1 font-sans">
              
              {/* Type, Price and Guest requirements */}
              <div className="grid grid-cols-3 gap-3 bg-[#FCFAF5] p-4 rounded-xl border border-amber-200/40 text-center">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Cuisine</span>
                  <span className={`inline-block font-extrabold text-xs px-2 py-0.5 rounded-md ${detailPkg.type === "veg" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                    {detailPkg.type === "veg" ? "Veg" : "Non-Veg"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Per Plate</span>
                  <span className="font-black text-slate-800 text-lg">₹{detailPkg.price}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Min Guests</span>
                  <span className="font-black text-slate-800 text-lg">{detailPkg.guests}+</span>
                </div>
              </div>

              {/* Description */}
              {detailPkg.desc && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#A27008] mb-1.5 font-sans">Description</h4>
                  <p className="text-stone-650 text-[14px] leading-relaxed italic">
                    "{detailPkg.desc}"
                  </p>
                </div>
              )}

              {/* Included Categories */}
              {detailPkg.categories && detailPkg.categories.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#A27008] mb-2 font-sans">Included Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailPkg.categories.map((cat: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white border border-[#EFE7DA] rounded-lg text-xs font-medium text-slate-700 shadow-sm flex items-center gap-1.5">
                        <Check size={11} className="text-[#DEAA38] stroke-[3]" /> {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Preview / Custom Dishes */}
              {detailPkg.items && detailPkg.items.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#A27008] mb-2 font-sans">Menu Preview</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailPkg.items.map((item: string, i: number) => (
                      <div key={i} className="p-2.5 bg-[#FAF8F5]/85 border border-[#DECC9C]/30 rounded-lg text-xs font-semibold text-slate-700 flex items-start gap-2">
                        <span className="text-[#DEAA38] mt-0.5 shrink-0">✦</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Benefits */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[#A27008] mb-2 font-sans">CaterNest Benefits</h4>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 shrink-0">✓</span> Elegant Buffet Setup & Premium Chafing Dishes included
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 shrink-0">✓</span> Professional Uniformed Service Staff & Kitchen Assistants
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 shrink-0">✓</span> Premium Eco-friendly Biodegradable Cutlery & Plates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600 shrink-0">✓</span> Live Counter support & On-time Setup guarantee
                  </li>
                </ul>
              </div>

            </div>

            {/* Footer Book Now Action */}
            <div className="p-6 bg-[#FCFAF5] border-t border-[#EFE7DA] shrink-0 flex gap-3">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setDetailPkg(null);
                }}
                className="w-1/3 py-3 border border-[#DECC9C] text-[#8C6D1F] bg-white rounded-xl font-sans font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition cursor-pointer text-center"
              >
                Close
              </button>
              <Link
                to={`/order/${caterer.id}`}
                state={{ packageIdx: detailPkg.id, customGuestCount: guestCount }}
                onClick={() => {
                  setDetailModalOpen(false);
                  setDetailPkg(null);
                }}
                className="w-2/3 py-3 bg-[#173D32] hover:bg-[#0f2922] text-[#FDE5A9] rounded-xl font-sans font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(23,61,50,0.2)]"
              >
                Book This Package <ChevronRight size={14} className="stroke-[3]" />
              </Link>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};


/* ==========================================================================
   RIGHT COLUMN COMPONENTS
   ========================================================================== */

export const BranchItem: React.FC<{ branch: any }> = ({ branch }) => {
  const hasCoordinates = branch.latitude !== undefined && branch.latitude !== null && branch.longitude !== undefined && branch.longitude !== null;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address || branch.location || "")}`;

  return (
    <div className="flex gap-3 items-start font-sans">
      <MapPin 
        size={16} 
        className="text-[#D4AF37] shrink-0 mt-[2px] mb-0 pt-[1px] ml-0 mr-0 h-[18px] w-[19px]" 
        strokeWidth={2.5} 
      />
      <div className="flex flex-col">
        <span className="font-georgia font-bold text-[#75737d] text-[15px] leading-snug">
          {branch.name}
        </span>
        <span className="text-[#75737d]/80 text-[13px] font-verdana mt-0.5 leading-relaxed">
          {branch.address || branch.location || ""}
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-[#D4AF37] hover:text-[#b47a00] hover:underline mt-1 font-sans inline-flex items-center gap-0.5"
        >
          🗺️ Open in Maps
        </a>
      </div>
    </div>
  );
};

export const ServiceAreaItem: React.FC<{ area: string }> = ({ area }) => {
  return (
    <div className="flex items-center gap-3 font-sans">
      <MapPin 
        size={16} 
        className="text-[#D4AF37] shrink-0 w-[18px] h-[19px]" 
        strokeWidth={2.5} 
      />
      <span className="font-georgia font-bold text-[#75737d] text-[16px] leading-[20.625px]">
        {area}
      </span>
    </div>
  );
};

// 1. BRANCH DETAILS CARD
export const BranchDetailsCard: React.FC<SectionProps> = ({
  isEditing,
  editedCaterer,
  setEditedCaterer,
  isOwnerOrAdmin,
  setIsEditing,
  targetCatererObj,
  caterer,
  handleSaveFields,
  openEditModal
}) => {
  const brandName = targetCatererObj.brandName || targetCatererObj.name || "Elite Catering";
  const slug = brandName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const baseEmailDomain = `${slug || "elitecatering"}.com`;

  const primaryPhone = targetCatererObj.phone || caterer?.phone || "+91 90000 12345";
  const primaryEmail = targetCatererObj.email || caterer?.email || `hyderabad@${baseEmailDomain}`;
  const primaryLocation = targetCatererObj.address || targetCatererObj.location || "Hyderabad, Telangana";

  const rawBranchesVal = targetCatererObj.branches !== undefined && targetCatererObj.branches !== null
    ? parseInt(targetCatererObj.branches.toString())
    : 3; // Default to 3 for complete look as in reference

  const branchesVal = isNaN(rawBranchesVal) || rawBranchesVal <= 0 ? 3 : rawBranchesVal;

  const defaultBranchesList = React.useMemo(() => {
    const list = [];
    list.push({
      name: primaryLocation.includes("Hyderabad") ? "Hyderabad Head Office" : `${primaryLocation.split(",")[0]} Head Office`,
      address: primaryLocation
    });

    if (branchesVal >= 2) {
      list.push({
        name: "Secunderabad Branch",
        address: "Paradise Circle, Secunderabad"
      });
    }

    if (branchesVal >= 3) {
      list.push({
        name: "Gachibowli Branch",
        address: "Gachibowli, Hyderabad"
      });
    }

    if (branchesVal > 3) {
      const defaultLocalities = ["Kondapur", "Jubilee Hills", "Banjara Hills", "Madhapur", "Begumpet"];
      for (let i = 4; i <= branchesVal; i++) {
        const locality = defaultLocalities[(i - 4) % defaultLocalities.length];
        list.push({
          name: `${locality} Branch`,
          address: `${locality}, Hyderabad`
        });
      }
    }
    return list;
  }, [branchesVal, primaryLocation]);

  const branchesToShow = targetCatererObj.branchesList || defaultBranchesList;

  const [isEditingBranches, setIsEditingBranches] = React.useState(false);
  const [editedList, setEditedList] = React.useState<any[]>([]);

  const handleOpenEdit = () => {
    if (openEditModal) {
      openEditModal("branches");
    } else {
      const initialList = (branchesToShow || []).map((b: any) => ({
        name: b.name || "",
        address: b.address || b.location || ""
      }));
      setEditedList(initialList);
      setIsEditingBranches(true);
    }
  };

  const handleSave = async () => {
    if (handleSaveFields) {
      await handleSaveFields({
        branchesList: editedList,
        branches: editedList.length
      });
    }
    setIsEditingBranches(false);
  };

  const handleAddBranch = () => {
    setEditedList([
      ...editedList,
      {
        name: "",
        address: ""
      }
    ]);
  };

  const handleRemoveBranch = (idx: number) => {
    setEditedList(editedList.filter((_, i) => i !== idx));
  };

  const handleMoveUpBranch = (idx: number) => {
    if (idx > 0) {
      const list = [...editedList];
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
      setEditedList(list);
    }
  };

  const handleMoveDownBranch = (idx: number) => {
    if (idx < editedList.length - 1) {
      const list = [...editedList];
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
      setEditedList(list);
    }
  };

  const handleUpdateBranchField = (idx: number, field: string, val: string) => {
    const updated = [...editedList];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditedList(updated);
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group text-left relative">
      {isEditingBranches && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7D4A4] rounded-[28px] shadow-[0_32px_80px_rgba(212,175,55,0.08),0_16px_32px_rgba(0,0,0,0.03)] w-full max-w-2xl p-10 text-[#1E1E1E] relative flex flex-col max-h-[85vh]">
            <button
              type="button"
              onClick={() => setIsEditingBranches(false)}
              className="absolute top-6 right-6 text-[#6D6D6D] hover:text-[#1E1E1E] bg-[#F7F4EE] hover:bg-[#E7D4A4]/40 p-2 rounded-full transition cursor-pointer border border-[#E7D4A4]/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col border-b border-[#E7D4A4]/40 pb-4 mb-5">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold font-mono">Profile Builder</span>
              <h3 className="text-xl font-serif font-black text-[#1E1E1E] mt-1 tracking-tight uppercase">
                Edit Branch Details
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-6 scrollbar-thin scrollbar-thumb-[#D4AF37]/50 scrollbar-track-transparent">
              {editedList.map((branch, idx) => (
                <div key={idx} className="bg-[#F7F4EE] border border-[#E7D4A4] rounded-2xl p-5 space-y-4 relative transition-all duration-300 hover:shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E7D4A4]/30">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] font-mono">
                      Branch #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUpBranch(idx)}
                        className="p-1 rounded-md border border-[#E7D4A4] bg-white text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === editedList.length - 1}
                        onClick={() => handleMoveDownBranch(idx)}
                        className="p-1 rounded-md border border-[#E7D4A4] bg-white text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBranch(idx)}
                        className="p-1 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition cursor-pointer flex items-center justify-center"
                        title="Remove Branch"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-left">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider font-mono">✏ Branch Name</label>
                      <input
                        type="text"
                        value={branch.name}
                        onChange={(e) => handleUpdateBranchField(idx, "name", e.target.value)}
                        placeholder="e.g. Hyderabad Head Office"
                        className="w-full bg-white border border-[#E7D4A4] rounded-xl px-4 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] transition font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider font-mono">📍 Address</label>
                      <input
                        type="text"
                        value={branch.address}
                        onChange={(e) => handleUpdateBranchField(idx, "address", e.target.value)}
                        placeholder="e.g. Madhapur, Hyderabad"
                        className="w-full bg-white border border-[#E7D4A4] rounded-xl px-4 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] transition font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {editedList.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-[#E7D4A4] rounded-2xl bg-[#F7F4EE]/50 text-stone-500 italic text-sm font-sans">
                  No branch offices listed. Click below to add one.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#E7D4A4]/40 font-sans shrink-0">
              <button
                type="button"
                onClick={handleAddBranch}
                className="bg-[#D4AF37] hover:bg-[#E5C158] text-white font-extrabold text-xs px-5 py-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Plus size={14} /> Add New Branch
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#D4AF37] hover:bg-[#E5C158] text-white font-extrabold text-xs px-5 py-3 rounded-xl transition cursor-pointer uppercase tracking-wider"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBranches(false)}
                  className="bg-[#F7F4EE] hover:bg-[#E7D4A4]/35 text-[#1E1E1E] font-extrabold text-xs px-5 py-3 rounded-xl transition cursor-pointer border border-[#E7D4A4] uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center w-full mb-4">
        <h3 className="font-georgia font-bold text-[#b47a00] text-[18px] uppercase tracking-wide">
          Branch Details
        </h3>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="text-[#D4AF37] hover:text-[#06281E] opacity-50 group-hover:opacity-100 transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-sans font-bold"
            title="Edit Branches"
          >
            <Pencil size={12} /> Edit Branches
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 text-left">
        {branchesToShow.map((branch: any, index: number) => (
          <BranchItem key={index} branch={branch} />
        ))}
      </div>
    </div>
  );
};

// 2. SERVICE AREAS CARD
export const ServiceAreasCard: React.FC<SectionProps> = ({
  isOwnerOrAdmin,
  targetCatererObj,
  handleSaveFields,
  openEditModal
}) => {
  const rawServiceAreas = targetCatererObj.serviceAreas;
  
  const areas: string[] = React.useMemo(() => {
    if (targetCatererObj.serveEntireHyderabad) {
      return ["Entire Hyderabad"];
    }
    if (!rawServiceAreas) return [];
    if (Array.isArray(rawServiceAreas)) return rawServiceAreas;
    if (typeof rawServiceAreas === "string") {
      if (rawServiceAreas.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(rawServiceAreas);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          // Fallback
        }
      }
      return rawServiceAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [rawServiceAreas]);

  const [isEditingAreas, setIsEditingAreas] = React.useState(false);
  const [localAreas, setLocalAreas] = React.useState<string[]>([]);
  const [newAreaInput, setNewAreaInput] = React.useState("");
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingTextInput, setEditingTextInput] = React.useState("");

  const isEntireHyderabad = localAreas.length === 1 && (localAreas[0] === "All Hyderabad" || localAreas[0] === "Serve Entire City");

  const handleOpenEdit = () => {
    if (openEditModal) {
      openEditModal("areas");
    } else {
      setLocalAreas([...areas]);
      setNewAreaInput("");
      setEditingIndex(null);
      setIsEditingAreas(true);
    }
  };

  const handleSave = async () => {
    if (handleSaveFields) {
      await handleSaveFields({
        serviceAreas: localAreas
      });
    }
    setIsEditingAreas(false);
  };

  const handleAddArea = () => {
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    if (localAreas.includes(trimmed)) {
      setNewAreaInput("");
      return;
    }
    setLocalAreas([...localAreas, trimmed]);
    setNewAreaInput("");
  };

  const handleRemoveArea = (idx: number) => {
    setLocalAreas(localAreas.filter((_, i) => i !== idx));
    if (editingIndex === idx) setEditingIndex(null);
  };

  const startRename = (idx: number) => {
    setEditingIndex(idx);
    setEditingTextInput(localAreas[idx]);
  };

  const saveRename = (idx: number) => {
    const trimmed = editingTextInput.trim();
    if (!trimmed) return;
    const updated = [...localAreas];
    updated[idx] = trimmed;
    setLocalAreas(updated);
    setEditingIndex(null);
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#D4AF37]/25 hover:border-[#D4AF37]/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group text-left relative">
      {isEditingAreas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0D0D0D] border-2 border-[#D4AF37] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] w-full max-w-lg p-6 text-white relative flex flex-col max-h-[85vh]">
            <button
              type="button"
              onClick={() => setIsEditingAreas(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer"
            >
              <X size={14} />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#D4AF37] mb-4 uppercase tracking-wide">
              Edit Service Areas
            </h3>

            {/* Serve Entire City toggle */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer select-none bg-[#151515] border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 rounded-xl px-4 py-3 transition">
                <input
                  type="checkbox"
                  checked={isEntireHyderabad}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setLocalAreas(["All Hyderabad"]);
                    } else {
                      setLocalAreas([]);
                    }
                  }}
                  className="w-4 h-4 text-black focus:ring-0 border-gray-300 rounded cursor-pointer accent-[#D4AF37]"
                />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Serve Entire City ("All Hyderabad")
                </span>
              </label>
            </div>

            {!isEntireHyderabad && (
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAreaInput}
                    onChange={(e) => setNewAreaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddArea();
                      }
                    }}
                    placeholder="e.g. Jubilee Hills"
                    className="flex-1 bg-[#151515] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl px-4 h-11 text-white text-xs outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddArea}
                    className="bg-[#D4AF37] hover:bg-[#b08427] text-black font-extrabold text-xs px-4 rounded-xl transition cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
                  {localAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#151515] border border-white/5 rounded-xl px-4 py-2 text-xs">
                      {editingIndex === idx ? (
                        <div className="flex gap-2 flex-1 items-center">
                          <input
                            type="text"
                            value={editingTextInput}
                            onChange={(e) => setEditingTextInput(e.target.value)}
                            className="bg-black border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-lg px-2 py-1 text-white text-xs outline-none flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => saveRename(idx)}
                            className="text-[#D4AF37] font-bold text-[11px] uppercase"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="text-white font-medium flex-1 cursor-pointer hover:text-[#D4AF37]" onClick={() => startRename(idx)} title="Click to rename">
                          {area} <span className="text-[10px] text-slate-500 font-normal ml-1">(click to edit)</span>
                        </span>
                      )}

                      <div className="flex items-center gap-2 ml-2">
                        {editingIndex !== idx && (
                          <button
                            type="button"
                            onClick={() => startRename(idx)}
                            className="text-slate-400 hover:text-white p-1"
                            title="Rename Area"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(idx)}
                          className="text-red-400 hover:text-red-500 p-1"
                          title="Delete Area"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {localAreas.length === 0 && (
                    <div className="text-center py-8 text-slate-500 italic">
                      No service areas added yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-white/10 font-sans mt-4">
              <button
                type="button"
                onClick={handleSave}
                className="bg-[#D4AF37] hover:bg-[#b08427] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditingAreas(false)}
                className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center w-full mb-4 text-[#b47a00]">
        <h3 className="font-georgia font-bold text-[#b47a00] text-[18px] uppercase tracking-wide">
          Service Areas
        </h3>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="text-[#D4AF37] hover:text-[#06281E] opacity-50 group-hover:opacity-100 transition duration-200 cursor-pointer flex items-center gap-1 text-xs font-sans font-bold"
            title="Edit Service Areas"
          >
            <Pencil size={12} /> Edit Areas
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3.5 text-left mt-2">
        {(targetCatererObj.serviceRadiusKm || targetCatererObj.latitude) && (
          <div className="flex items-center gap-3 font-sans text-brand-gold-950 bg-amber-500/5 border border-brand-gold-300/35 rounded-xl px-3.5 py-2.5 text-xs">
            <span className="text-lg">📍</span>
            <div>
              <p className="font-bold text-slate-800">Serving within {targetCatererObj.serviceRadiusKm || 15} KM radius</p>
              <p className="text-[10px] text-slate-500 mt-0.5">from our central kitchen location</p>
            </div>
          </div>
        )}

        {areas.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {areas.map((area, idx) => (
              <ServiceAreaItem key={idx} area={area} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 font-sans text-stone-500 italic text-xs">
            <MapPin size={16} className="text-stone-300 shrink-0" strokeWidth={2} />
            <span>No service areas configured</span>
          </div>
        )}
      </div>
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

// 7. QUICK INFO CARD
export const QuickInfoCard: React.FC<SectionProps> = ({
  targetCatererObj,
  isOwnerOrAdmin,
  handleSaveFields,
  openEditModal
}) => {
  const specializations = targetCatererObj.specializations
    ? Array.isArray(targetCatererObj.specializations)
      ? targetCatererObj.specializations.join(", ")
      : typeof targetCatererObj.specializations === "string"
        ? targetCatererObj.specializations
        : "Italian, Mediterranean, American"
    : "Italian, Mediterranean, American";
  
  const minGuests = targetCatererObj.minGuests || "20 Guests";
  const priceRange = targetCatererObj.priceRange || "$$$ ($35 - ₹1,500 per person)";
  const bookingLeadTime = targetCatererObj.bookingLeadTime || "2 - 6 Weeks";
  const responseTime = targetCatererObj.responseTime || "Within 6 Hours";
  const established = targetCatererObj.established || "2015";

  const [isEditingQuickInfo, setIsEditingQuickInfo] = React.useState(false);
  const [specInput, setSpecInput] = React.useState(specializations);
  const [minGuestsInput, setMinGuestsInput] = React.useState(minGuests);
  const [priceRangeInput, setPriceRangeInput] = React.useState(priceRange);
  const [leadTimeInput, setLeadTimeInput] = React.useState(bookingLeadTime);
  const [responseTimeInput, setResponseTimeInput] = React.useState(responseTime);
  const [establishedInput, setEstablishedInput] = React.useState(established);

  const handleOpenEdit = () => {
    if (openEditModal) {
      openEditModal("quick_info");
    } else {
      setSpecInput(specializations);
      setMinGuestsInput(minGuests);
      setPriceRangeInput(priceRange);
      setLeadTimeInput(bookingLeadTime);
      setResponseTimeInput(responseTime);
      setEstablishedInput(established);
      setIsEditingQuickInfo(true);
    }
  };

  const handleSave = async () => {
    if (handleSaveFields) {
      const specArray = specInput.split(",").map(s => s.trim()).filter(Boolean);
      await handleSaveFields({
        specializations: specArray,
        minGuests: minGuestsInput,
        priceRange: priceRangeInput,
        bookingLeadTime: leadTimeInput,
        responseTime: responseTimeInput,
        established: establishedInput
      });
    }
    setIsEditingQuickInfo(false);
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#D4AF37]/25 hover:border-[#D4AF37]/65 transition-all shadow-md duration-300 flex flex-col group text-left relative">
      {isEditingQuickInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0D0D0D] border-2 border-[#D4AF37] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] w-full max-w-lg p-6 text-white relative">
            <button
              type="button"
              onClick={() => setIsEditingQuickInfo(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer"
            >
              <X size={14} />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#D4AF37] mb-5 uppercase tracking-wide">
              Edit Quick Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cuisine Type (Comma separated)</label>
                <input
                  type="text"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 h-12 text-white text-sm outline-none transition w-full"
                  placeholder="e.g. Italian, Indian, Chinese"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Min. Guest Count</label>
                <input
                  type="text"
                  value={minGuestsInput}
                  onChange={(e) => setMinGuestsInput(e.target.value)}
                  className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 h-12 text-white text-sm outline-none transition w-full"
                  placeholder="e.g. 20 Guests"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Price Range</label>
                <input
                  type="text"
                  value={priceRangeInput}
                  onChange={(e) => setPriceRangeInput(e.target.value)}
                  className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 h-12 text-white text-sm outline-none transition w-full"
                  placeholder="e.g. ₹350 - ₹1,500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Booking Lead Time</label>
                <input
                  type="text"
                  value={leadTimeInput}
                  onChange={(e) => setLeadTimeInput(e.target.value)}
                  className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 h-12 text-white text-sm outline-none transition w-full"
                  placeholder="e.g. 2 - 6 Weeks"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Response Time</label>
                <input
                  type="text"
                  value={responseTimeInput}
                  onChange={(e) => setResponseTimeInput(e.target.value)}
                  className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 h-12 text-white text-sm outline-none transition w-full"
                  placeholder="e.g. Within 6 Hours"
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Established Year</label>
                <input
                  type="text"
                  value={establishedInput}
                  onChange={(e) => setEstablishedInput(e.target.value)}
                  className="bg-[#151515] border border-[#D4AF37]/40 focus:border-[#D4AF37] rounded-xl px-4 h-12 text-white text-sm outline-none transition w-full"
                  placeholder="e.g. 2015"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-6 font-sans">
              <button
                type="button"
                onClick={handleSave}
                className="bg-[#D4AF37] hover:bg-[#b08427] text-black font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditingQuickInfo(false)}
                className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center w-full">
        <h3 className="font-georgia font-bold text-[#b47a00] text-[16px] leading-[23px] uppercase tracking-wide flex items-center gap-2">
          <Clock size={18} className="text-[#D4AF37]" strokeWidth={2} /> Quick Info
        </h3>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="text-[#D4AF37] hover:text-[#06281E] opacity-50 group-hover:opacity-100 transition duration-200 cursor-pointer"
            title="Edit Quick Info"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
      <LuxuryDivider />
      <div className="space-y-4 font-sans text-sm text-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF6EC] border border-[#E8DCC7] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <ChefHat size={14} />
          </div>
          <div>
            <span className="block text-[12px] font-georgia leading-[26.2857px] text-black font-bold uppercase tracking-wider">Cuisine Type</span>
            <span className="font-semibold text-slate-800">{specializations}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF6EC] border border-[#E8DCC7] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <Users size={14} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#75737d] uppercase tracking-wider">Min. Guest Count</span>
            <span className="font-semibold text-slate-800">{minGuests}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF6EC] border border-[#E8DCC7] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <Star size={14} fill="#D4AF37" className="text-[#D4AF37]" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#75737d] uppercase tracking-wider">Price Range</span>
            <span className="font-semibold text-slate-800">{priceRange}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF6EC] border border-[#E8DCC7] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <Clock size={14} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#75737d] uppercase tracking-wider">Booking Lead Time</span>
            <span className="font-semibold text-slate-800">{bookingLeadTime}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF6EC] border border-[#E8DCC7] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <Clock size={14} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#75737d] uppercase tracking-wider">Response Time</span>
            <span className="font-semibold text-slate-800">{responseTime}</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF6EC] border border-[#E8DCC7] flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
            <Building size={14} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#75737d] uppercase tracking-wider">Established</span>
            <span className="font-semibold text-slate-800">{established}</span>
          </div>
        </div>

        {/* Location Intelligence Profile Metrics */}
        <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
              <span className="text-sm">📍</span>
            </div>
            <div className="flex-1">
              <span className="block text-[10px] font-bold text-[#75737d] uppercase tracking-wider">Kitchen Location</span>
              <p className="font-semibold text-slate-800 text-xs leading-relaxed">{targetCatererObj.address || "Hyderabad, Telangana"}</p>
              {targetCatererObj.latitude && targetCatererObj.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${targetCatererObj.latitude},${targetCatererObj.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#b47a00] hover:underline mt-1.5"
                >
                  🌐 Open in Maps
                </a>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
              <span className="text-sm">🎯</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-[#75737d] uppercase tracking-wider">Service Radius</span>
              <span className="font-semibold text-slate-800">Serving within {targetCatererObj.serviceRadiusKm || 15} KM</span>
            </div>
          </div>

          {(() => {
            const customerLat = localStorage.getItem('customer_lat') ? parseFloat(localStorage.getItem('customer_lat')!) : null;
            const customerLng = localStorage.getItem('customer_lng') ? parseFloat(localStorage.getItem('customer_lng')!) : null;
            if (customerLat && customerLng && targetCatererObj.latitude && targetCatererObj.longitude) {
              const dist = calculateDistanceKm(customerLat, customerLng, Number(targetCatererObj.latitude), Number(targetCatererObj.longitude));
              const mins = estimateDrivingTimeMinutes(dist);
              return (
                <div className="flex items-start gap-3 bg-[#FAF6EC]/50 border border-[#E8DCC7]/30 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E8DCC7] flex items-center justify-center text-[#D4AF37] shrink-0">
                    <span className="text-sm">🚗</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#b47a00] uppercase tracking-wider">Distance from You</span>
                    <span className="font-mono text-xs font-bold text-slate-800">{dist.toFixed(1)} KM</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Estimated Driving Time: <strong className="text-slate-700">{mins} mins</strong></span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

// 8. ACHIEVEMENTS CARD
export const AchievementsCard: React.FC<SectionProps> = ({
  isOwnerOrAdmin,
  targetCatererObj,
  handleSaveFields,
  openEditModal
}) => {
  const rawAchievements = targetCatererObj.achievements;
  let achievements: any[] = [];
  if (Array.isArray(rawAchievements) && rawAchievements.length > 0) {
    achievements = rawAchievements;
  } else if (typeof rawAchievements === "string" && rawAchievements.trim().startsWith("[")) {
    try {
      achievements = JSON.parse(rawAchievements);
    } catch (e) {
      achievements = DEFAULT_ACHIEVEMENTS;
    }
  } else if (typeof rawAchievements === "string" && rawAchievements.trim() !== "") {
    achievements = rawAchievements.split(",").map(item => {
      const parts = item.trim().split(" ");
      const val = parts[0] || "10+";
      const lbl = parts.slice(1).join(" ") || "Successful Events";
      return { value: val, title: lbl, icon: "award" };
    });
  } else if (targetCatererObj.achievementsList && Array.isArray(targetCatererObj.achievementsList) && targetCatererObj.achievementsList.length > 0) {
    achievements = targetCatererObj.achievementsList;
  } else {
    achievements = DEFAULT_ACHIEVEMENTS;
  }

  const [isEditingAchievements, setIsEditingAchievements] = React.useState(false);
  const [editedList, setEditedList] = React.useState<any[]>([]);

  const handleOpenEdit = () => {
    if (openEditModal) {
      openEditModal("achievements");
    } else {
      setEditedList(JSON.parse(JSON.stringify(achievements)));
      setIsEditingAchievements(true);
    }
  };

  const handleSave = async () => {
    if (handleSaveFields) {
      await handleSaveFields({
        achievementsList: editedList
      });
    }
    setIsEditingAchievements(false);
  };

  const handleAddAchievement = () => {
    setEditedList([
      ...editedList,
      { value: "10+", label: "New Achievement" }
    ]);
  };

  const handleRemoveAchievement = (idx: number) => {
    setEditedList(editedList.filter((_, i) => i !== idx));
  };

  const handleUpdateAchievement = (idx: number, field: string, val: string) => {
    const updated = [...editedList];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditedList(updated);
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#D4AF37]/25 hover:border-[#D4AF37]/65 transition-all shadow-md duration-300 flex flex-col group text-left relative">
      {isEditingAchievements && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0D0D0D] border-2 border-[#D4AF37] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] w-full max-w-lg p-6 text-white relative flex flex-col max-h-[85vh]">
            <button
              type="button"
              onClick={() => setIsEditingAchievements(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer"
            >
              <X size={14} />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#D4AF37] mb-4 uppercase tracking-wide">
              Edit Achievements
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {editedList.map((ach, idx) => (
                <div key={idx} className="bg-[#151515] border border-[#D4AF37]/20 rounded-xl p-3 relative flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRemoveAchievement(idx)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-500 bg-red-500/10 p-1 rounded-lg transition cursor-pointer"
                    title="Remove Achievement"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37]/70 font-mono">
                    Achievement #{idx + 1}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Value / Count</label>
                      <input
                        type="text"
                        value={ach.value}
                        onChange={(e) => handleUpdateAchievement(idx, "value", e.target.value)}
                        className="bg-[#0D0D0D] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-lg px-3 h-10 text-white text-xs outline-none transition"
                        placeholder="e.g. 150+ or 15+"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Title / Label</label>
                      <input
                        type="text"
                        value={ach.label}
                        onChange={(e) => handleUpdateAchievement(idx, "label", e.target.value)}
                        className="bg-[#0D0D0D] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-lg px-3 h-10 text-white text-xs outline-none transition"
                        placeholder="e.g. Events Completed"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {editedList.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic">
                  No achievements listed. Click below to add one.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10 font-sans">
              <button
                type="button"
                onClick={handleAddAchievement}
                className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Achievement
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#D4AF37] hover:bg-[#b08427] text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAchievements(false)}
                  className="bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center w-full">
        <h3 className="font-georgia font-bold text-[#b47a00] text-[16px] uppercase tracking-wide flex items-center gap-2">
          <Award size={18} className="text-[#D4AF37]" strokeWidth={2} /> Achievements
        </h3>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="text-[#D4AF37] hover:text-[#06281E] opacity-50 group-hover:opacity-100 transition duration-200 cursor-pointer"
            title="Edit Achievements"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
      <LuxuryDivider />
      <div className="space-y-4 font-sans text-sm text-slate-700">
        {achievements.map((item: any, idx: number) => {
          const IconComponent = achievementIconsMap[item.icon?.toLowerCase()] || Award;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="rounded-full border border-[#DFC27A]/35 w-[42px] h-[42px] flex items-center justify-center shrink-0 bg-[#FAF6EC] text-[#D4AF37] shadow-xs">
                <IconComponent size={20} className="text-[#D4AF37]" strokeWidth={2} />
              </div>
              <div>
                <span className="block text-base font-extrabold text-[#173D32]">{item.value}</span>
                <span className="text-xs text-slate-500 font-medium">{item.title || item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};




