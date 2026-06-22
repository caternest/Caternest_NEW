import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Star,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Mail,
  ShieldCheck,
  Award,
  Users,
  ChefHat,
  X,
  CalendarDays,
  Building,
  Clock,
  Briefcase,
  PlayCircle,
  BookOpen,
  Map,
  Heart,
  LayoutGrid,
  Package,
  MenuSquare,
  FileText,
  User,
  Trash2,
  Plus,
  Pencil,
  Sparkles,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { DEMO_REVIEWS, DEMO_CATERERS } from "../data";
import { cn, compressImageFile, getCatererSlug } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { getSupabase, uploadToSupabaseBucket } from "../lib/supabase";
import { toast } from "../components/Toast";
import {
  AboutCatererCard,
  ServicesOfferCard,
  FoodGalleryCard,
  MenuPackagesCard,
  ReviewsCard,
  AdditionalMediaCard,
  BranchDetailsCard,
  ServiceAreasCard,
  OperatingHoursCard,
  AchievementsCard,
  AwardsCertsCard,
  ContactSidebarCard,
  ContactInfoCard
} from "../components/PremiumCatererSections";

// Highly polished, realistic decorative crown vector asset to perfectly mimic the image design
const CrownOrnament = ({
  theme,
}: {
  theme: "silver" | "gold" | "platinum" | "premium" | "royal" | "grand";
}) => {
  let baseColor = "#DEAA38"; // Gold color matching the palette
  let gradStart = "#FFEAA7";
  let gradEnd = "#8A640F";

  if (theme === "silver") {
    baseColor = "#A0AEC0"; // Silver
    gradStart = "#FFFFFF";
    gradEnd = "#4A5568";
  } else if (theme === "platinum") {
    baseColor = "#CBD5E0"; // Platinum
    gradStart = "#FFFFFF";
    gradEnd = "#64748B";
  } else if (theme === "premium") {
    baseColor = "#D4AF37"; // Rose gold base with ruby highlight
    gradStart = "#FFF2F2";
    gradEnd = "#8B0000";
  } else if (theme === "royal" || theme === "grand") {
    baseColor = "#DEAA38";
    gradStart = "#FFF9E6";
    gradEnd = "#A27008";
  }

  return (
    <div className="absolute -top-[23px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none pointer-events-none">
      {/* Glowing backdrop shadow */}
      <div
        className={cn(
          "absolute -inset-1 rounded-full blur-[8px] opacity-35 -z-10",
          theme === "gold" || theme === "royal" || theme === "grand"
            ? "bg-amber-400/45"
            : theme === "premium"
              ? "bg-red-400/35"
              : "bg-slate-300/35",
        )}
      />

      {/* SVG Crown Vector mirroring the elegant curls from the design image */}
      <svg
        width="64"
        height="42"
        viewBox="0 0 100 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_3px_5px_rgba(0,0,0,0.22)]"
      >
        <defs>
          <linearGradient
            id={`crown-grad-${theme}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
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
          stroke={theme === "silver" ? "#718096" : "#AA7C11"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Velvet interior cushion backing */}
        <path
          d="M17 60 C25 44, 75 44, 83 60 Z"
          fill={
            theme === "premium"
              ? "#991B1B"
              : theme === "royal" || theme === "grand"
                ? "#451A03"
                : "#1E293B"
          }
          opacity="0.25"
        />

        {/* Velvet cushion bar */}
        <path
          d="M12 56 C12 56, 50 61, 88 56"
          stroke={theme === "silver" ? "#CBD5E0" : "#DEAA38"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Master headband bottom */}
        <rect
          x="15"
          y="58"
          width="70"
          height="6"
          fill={`url(#crown-grad-${theme})`}
          rx="2"
          stroke={theme === "silver" ? "#4A5568" : "#8A640F"}
          strokeWidth="1"
        />

        {/* Small ruby/diamond decals in bands */}
        <circle cx="26" cy="61" r="1.5" fill="#FFF" />
        <circle
          cx="38"
          cy="61"
          r="1.5"
          fill={theme === "premium" ? "#F43F5E" : "#DEAA38"}
        />
        <circle cx="50" cy="61" r="1.5" fill="#FFF" />
        <circle
          cx="62"
          cy="61"
          r="1.5"
          fill={theme === "premium" ? "#F43F5E" : "#DEAA38"}
        />
        <circle cx="74" cy="61" r="1.5" fill="#FFF" />

        {/* Floating peak jewels */}
        <circle
          cx="8"
          cy="28"
          r="4.5"
          fill="#FFF"
          stroke={theme === "silver" ? "#718096" : "#D4AF37"}
          strokeWidth="1"
          filter="url(#gold-glowing-jewel)"
        />
        <circle
          cx="50"
          cy="14"
          r="5.5"
          fill="#FFFDF0"
          stroke={theme === "silver" ? "#718096" : "#D4AF37"}
          strokeWidth="1.2"
          filter="url(#gold-glowing-jewel)"
        />
        <circle
          cx="92"
          cy="28"
          r="4.5"
          fill="#FFF"
          stroke={theme === "silver" ? "#718096" : "#D4AF37"}
          strokeWidth="1"
          filter="url(#gold-glowing-jewel)"
        />

        {/* Side mini peak jewels */}
        <circle
          cx="32"
          cy="42"
          r="2.5"
          fill={theme === "premium" ? "#EF4444" : "#60A5FA"}
        />
        <circle
          cx="68"
          cy="42"
          r="2.5"
          fill={theme === "premium" ? "#EF4444" : "#60A5FA"}
        />
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
  if (normalized.includes("5000") || normalized.includes("5,000")) {
    return { number: "5,000+", label: "Successful Events" };
  }
  if (
    normalized.includes("100,000") ||
    normalized.includes("1,00,000") ||
    normalized.includes("100000")
  ) {
    return { number: "100,000+", label: "Happy Customers" };
  }
  if (normalized.includes("150")) {
    return { number: "150+", label: "Expert Professionals" };
  }
  if (
    normalized.includes("10") &&
    (normalized.includes("year") || normalized.includes("trust"))
  ) {
    return { number: "10+", label: "Years of Trust" };
  }

  // Fallback regex parsing
  const matchNum = ach.match(/(\d[\d,kKmM+]*\+?)/);
  if (matchNum) {
    const num = matchNum[0];
    const label = ach
      .replace(num, "")
      .replace(/^[-\s:text]+/, "")
      .trim();
    return { number: num, label: label || "Achieved" };
  }
  return { number: "✦", label: ach };
};

// Deluxe 3D Golden Medal award emblem
const GoldMedalIcon = ({
  title,
  isShield = false,
}: {
  title: string;
  isShield?: boolean;
}) => (
  <div className="flex flex-col items-center text-center">
    <div className="relative w-24 h-24 mb-3 drop-shadow-[0_8px_16px_rgba(212,175,55,0.25)] hover:scale-105 transition-transform duration-300">
      {/* Outer subtle glow */}
      <div className="absolute inset-2 bg-[#D4AF37]/15 rounded-full blur-md"></div>

      <svg className="w-full h-full relative z-10" viewBox="0 0 100 100">
        <defs>
          <linearGradient
            id="gold-metallic"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFF2D1" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#AA7C11" />
            <stop offset="100%" stopColor="#FFF2D1" />
          </linearGradient>
        </defs>

        {/* Ribbon decoration behind the medal */}
        <path
          d="M35 48 L22 84 L38 77 L50 84 L45 48"
          fill="#0F3D2E"
          stroke="#D4AF37"
          strokeWidth="1"
        />
        <path
          d="M65 48 L78 84 L62 77 L50 84 L55 48"
          fill="#0F3D2E"
          stroke="#D4AF37"
          strokeWidth="1"
        />
        <path
          d="M38 48 L27 82 L38 76 L45 82 L43 48"
          fill="#D4AF37"
          opacity="0.6"
        />
        <path
          d="M62 48 L73 82 L62 76 L55 82 L57 48"
          fill="#D4AF37"
          opacity="0.6"
        />

        {/* Main Medal border */}
        <circle
          cx="50"
          cy="42"
          r="32"
          fill="url(#gold-metallic)"
          stroke="#FFF"
          strokeWidth="1"
        />
        {/* Inner medal ring */}
        <circle
          cx="50"
          cy="42"
          r="27"
          fill="#0F3D2E"
          stroke="url(#gold-metallic)"
          strokeWidth="2"
        />
        {/* Outer dotted accent circle */}
        <circle
          cx="50"
          cy="42"
          r="23"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="0.8"
          strokeDasharray="2 2"
        />

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
        <path
          d="M28 42 Q28 55 50 55 Q72 55 72 42"
          fill="none"
          stroke="url(#gold-metallic)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>

    <span className="font-sans font-bold text-[#1C1C1C] text-xs leading-tight max-w-[150px]">
      {title}
    </span>
  </div>
);

const DEFAULT_HIGHLIGHTS = [
  { title: "100% Customer", subtitle: "Satisfaction" },
  { title: "Hygienic", subtitle: "Food" },
  { title: "On-time", subtitle: "Service" }
];

const SUGGESTED_HIGHLIGHTS = [
  { title: "Hygienic", subtitle: "Food" },
  { title: "On-time", subtitle: "Service" },
  { title: "Wedding", subtitle: "Specialist" },
  { title: "Corporate", subtitle: "Events" },
  { title: "Live", subtitle: "Counters" },
  { title: "FSSAI", subtitle: "Certified" },
  { title: "Premium", subtitle: "Catering" },
  { title: "Outdoor", subtitle: "Events" },
  { title: "Luxury", subtitle: "Catering" },
  { title: "Multi", subtitle: "Cuisine" }
];

const getHighlightIcon = (title: string, subtitle: string) => {
  const text = `${title} ${subtitle}`.toLowerCase();
  if (text.includes("experience") || text.includes("year")) return Award;
  if (text.includes("event") || text.includes("completed") || text.includes("guest") || text.includes("served")) return Users;
  if (text.includes("hygienic") || text.includes("hygiene") || text.includes("clean") || text.includes("food") || text.includes("cuisine") || text.includes("chef") || text.includes("veg")) return ChefHat;
  if (text.includes("time") || text.includes("service") || text.includes("delivery") || text.includes("clock")) return Clock;
  if (text.includes("satisfaction") || text.includes("customer") || text.includes("rating") || text.includes("love") || text.includes("wedding") || text.includes("specialist")) return Heart;
  if (text.includes("fssai") || text.includes("certified") || text.includes("cert") || text.includes("licens")) return ShieldCheck;
  if (text.includes("corporate") || text.includes("business") || text.includes("office")) return Briefcase;
  return CheckCircle2;
};

export const serviceIcons: Record<string, any> = {
  ChefHat: ChefHat,
  Sparkles: Sparkles,
  Briefcase: Briefcase,
  Award: Award,
  Users: Users,
  Clock: Clock,
  Heart: Heart,
};

export const DEFAULT_SERVICES = [
  {
    title: "Wedding Catering",
    desc: "Make your big day memorable with our luxury custom royal feasts.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
    iconName: "ChefHat",
  },
  {
    title: "Birthday Parties",
    desc: "Delicious menus and vibrant spreads for birthday celebrations of all sizes.",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=600&auto=format&fit=crop",
    iconName: "Sparkles",
  },
  {
    title: "Corporate Events",
    desc: "Professional elite catering for meetings, conferences, and formal galas.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop",
    iconName: "Briefcase",
  }
];

export const SERVICE_SUGGESTIONS = [
  {
    title: "Wedding Catering",
    desc: "Make your big day memorable with our luxury custom royal feasts.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
    iconName: "ChefHat",
  },
  {
    title: "Birthday Parties",
    desc: "Delicious menus and vibrant spreads for birthday celebrations of all sizes.",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=600&auto=format&fit=crop",
    iconName: "Sparkles",
  },
  {
    title: "Corporate Events",
    desc: "Professional elite catering for meetings, conferences, and formal galas.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop",
    iconName: "Briefcase",
  },
  {
    title: "Engagement Catering",
    desc: "Curated menu selections for a romantic, high-end engagement celebration.",
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=600&auto=format&fit=crop",
    iconName: "Heart",
  },
  {
    title: "Housewarming Catering",
    desc: "Traditional food warmers with warm cuisine to welcome you to your brand new house.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop",
    iconName: "ChefHat",
  },
  {
    title: "Reception Catering",
    desc: "Sumptuous spread options with premium cutlery and gold standard service hosts.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&auto=format&fit=crop",
    iconName: "Award",
  },
  {
    title: "Outdoor Catering",
    desc: "Beautiful alfresco food stalls to accompany a fresh open lawn setup safely.",
    image: "https://images.unsplash.com/photo-1504387828636-abeb50775c09?q=80&w=600&auto=format&fit=crop",
    iconName: "Sparkles",
  },
  {
    title: "Live Food Counters",
    desc: "Interactive hot food hubs prep cooking custom items directly on order.",
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop",
    iconName: "ChefHat",
  },
  {
    title: "Buffet Services",
    desc: "Efficient gourmet multi-cuisine buffet grids that keep dishes warm and fresh.",
    image: "https://images.unsplash.com/photo-1555244161-0b5c10ad7f48?q=80&w=600&auto=format&fit=crop",
    iconName: "Users",
  },
  {
    title: "Traditional South Indian Catering",
    desc: "Authentic spices and traditional recipes plated beautifully on classic banana leaves.",
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600&auto=format&fit=crop",
    iconName: "ChefHat",
  },
  {
    title: "North Indian Catering",
    desc: "Exquisite rich tandoori grills, rich layered biryanis, and fresh hand-stretched naans.",
    image: "https://images.unsplash.com/photo-1585938338392-50a599307c78?q=80&w=600&auto=format&fit=crop",
    iconName: "ChefHat",
  },
  {
    title: "Premium Catering Packages",
    desc: "Luxury, bespoke food presentation using elite culinary styling and menu curation.",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop",
    iconName: "Award",
  },
  {
    title: "Event Management",
    desc: "Full planning, bespoke themes, styling setups, and smooth timeline coordination.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop",
    iconName: "Briefcase",
  },
  {
    title: "Destination Wedding Catering",
    desc: "Gourmet kitchens anywhere, delivering outstanding taste scales without boundaries.",
    image: "https://images.unsplash.com/photo-1519225495810-7512c696505a?q=80&w=600&auto=format&fit=crop",
    iconName: "Sparkles",
  },
  {
    title: "Festival Catering",
    desc: "Sattvik options matching strict cultural purity with traditional festive menus.",
    image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?q=80&w=600&auto=format&fit=crop",
    iconName: "Heart",
  }
];

export default function CatererDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [caterer, setCaterer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaterer, setEditedCaterer] = useState<any>(null);

  // Dynamic Profile Highlights States
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [editingHighlightIndex, setEditingHighlightIndex] = useState<number | 'experience' | 'eventsCompleted' | null>(null);
  const [highlightForm, setHighlightForm] = useState({ title: "", subtitle: "" });
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Add Service Modal States
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newServiceTitle, setNewServiceTitle] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceImage, setNewServiceImage] = useState("https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop");
  const [newServiceIcon, setNewServiceIcon] = useState("ChefHat");

  const openEditHighlightModal = (type: number | 'experience' | 'eventsCompleted' | null) => {
    setEditingHighlightIndex(type);
    setShowCustomInput(false);
    if (type === 'experience') {
      const expVal = editedCaterer?.experience !== undefined && editedCaterer?.experience !== null ? editedCaterer.experience : (caterer?.experience || "");
      setHighlightForm({
        title: expVal.toString(),
        subtitle: "Experience"
      });
      setShowCustomInput(true);
    } else if (type === 'eventsCompleted') {
      const evVal = editedCaterer?.eventsCompleted !== undefined && editedCaterer?.eventsCompleted !== null ? editedCaterer.eventsCompleted : (caterer?.eventsCompleted || "");
      setHighlightForm({
        title: evVal.toString(),
        subtitle: "Completed"
      });
      setShowCustomInput(true);
    } else if (typeof type === 'number') {
      const hList = editedCaterer?.highlights || caterer?.highlights || DEFAULT_HIGHLIGHTS;
      const item = hList[type];
      setHighlightForm({
        title: item?.title || "",
        subtitle: item?.subtitle || ""
      });
      setShowCustomInput(true);
    } else {
      // Adding new
      setHighlightForm({ title: "", subtitle: "" });
    }
    setHighlightModalOpen(true);
  };

  const handleSaveHighlight = () => {
    let updatedCaterer = { ...editedCaterer };
    if (!updatedCaterer.highlights) {
      updatedCaterer.highlights = [...(caterer?.highlights || DEFAULT_HIGHLIGHTS)];
    }

    if (editingHighlightIndex === 'experience') {
      const val = parseInt(highlightForm.title);
      updatedCaterer.experience = isNaN(val) ? null : val;
    } else if (editingHighlightIndex === 'eventsCompleted') {
      const val = parseInt(highlightForm.title);
      updatedCaterer.eventsCompleted = isNaN(val) ? null : val;
    } else if (typeof editingHighlightIndex === 'number' && editingHighlightIndex >= 0) {
      const hList = [...updatedCaterer.highlights];
      hList[editingHighlightIndex] = {
        title: highlightForm.title.trim(),
        subtitle: highlightForm.subtitle.trim()
      };
      updatedCaterer.highlights = hList;
    } else {
      // Adding new highlight
      const hList = [...updatedCaterer.highlights];
      hList.push({
        title: highlightForm.title.trim(),
        subtitle: highlightForm.subtitle.trim()
      });
      updatedCaterer.highlights = hList;
    }

    setEditedCaterer(updatedCaterer);
    setHighlightModalOpen(false);
    setEditingHighlightIndex(null);
    toast("Highlight updated successfully (Save changes to publish)", "success");
  };

  const handleDeleteHighlight = (type: number | 'experience' | 'eventsCompleted') => {
    let updatedCaterer = { ...editedCaterer };
    if (!updatedCaterer.highlights) {
      updatedCaterer.highlights = [...(caterer?.highlights || DEFAULT_HIGHLIGHTS)];
    }

    if (type === 'experience') {
      updatedCaterer.experience = null;
    } else if (type === 'eventsCompleted') {
      updatedCaterer.eventsCompleted = null;
    } else if (typeof type === 'number') {
      const hList = [...updatedCaterer.highlights];
      hList.splice(type, 1);
      updatedCaterer.highlights = hList;
    }

    setEditedCaterer(updatedCaterer);
    toast("Highlight deleted (Save changes to publish)", "success");
  };

  useEffect(() => {
    if (isEditing && editedCaterer) {
      if (!editedCaterer.highlights || !editedCaterer.services) {
        setEditedCaterer((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            highlights: prev.highlights || caterer?.highlights || DEFAULT_HIGHLIGHTS,
            services: prev.services || caterer?.services || DEFAULT_SERVICES
          };
        });
      }
    }
  }, [isEditing, editedCaterer, caterer]);

  const handleShare = async () => {
    if (!caterer) return;
    const slug = getCatererSlug(caterer);
    const shareUrl = `${window.location.origin}/caterer/${slug}`;
    const shareTitle = caterer.brandName || caterer.businessName || caterer.name || "Caterer Profile";
    const shareText = caterer.tagline || `Check out ${shareTitle}'s premium catering services on CaterNest!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Share cancelled by user");
          return;
        }
        console.warn("Native share failed, falling back to copy:", err);
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Profile link copied successfully", "success");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        toast("Profile link copied successfully", "success");
      } catch (copyErr) {
        console.error("execCommand fallback failed:", copyErr);
      }
      document.body.removeChild(textarea);
    }
  };

  const convertFileToBase64 = async (file: File): Promise<string> => {
    try {
      // Attempt to compress
      const compressed = await compressImageFile(file, 800, 800, 0.7);
      return compressed;
    } catch (err) {
      console.warn("Compression failed, reading as standard data URL:", err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) resolve(e.target.result as string);
          else reject(new Error("File read failure"));
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!editedCaterer) return;

    const sensitiveKeys = [
      "businessName",
      "logo",
      "coverBanner",
      "ownerPhoto",
      "branchPhoto",
      "ownerName",
      "phone",
      "email",
      "fssai",
      "gst",
      "pan",
    ];

    const allKeys = [
      "businessName",
      "logo",
      "coverBanner",
      "ownerPhoto",
      "branchPhoto",
      "ownerName",
      "phone",
      "email",
      "fssai",
      "gst",
      "pan",
      "brandName",
      "tagline",
      "description",
      "experience",
      "eventsCompleted",
      "serviceAreas",
      "operatingHours",
      "awards",
      "certifications",
      "whatsappNumber",
      "branches",
      "specializations",
      "galleryPhotos",
      "highlights",
      "services",
      "achievements",
    ];

    const changes: any = {};
    const directPayload: any = {};
    let hasSensitiveChanges = false;

    allKeys.forEach((k) => {
      let origVal = caterer[k];
      let newVal = editedCaterer[k];

      if (k === "businessName" && origVal === undefined) origVal = caterer.name;
      if (k === "ownerName" && origVal === undefined) origVal = caterer.owner;

      if (k === "experience" || k === "eventsCompleted" || k === "branches") {
        newVal =
          newVal !== undefined && newVal !== null && newVal !== ""
            ? parseInt(newVal.toString())
            : null;
        origVal =
          origVal !== undefined && origVal !== null && origVal !== ""
            ? parseInt(origVal.toString())
            : null;
      }

      if (k === "specializations" && Array.isArray(newVal)) {
        newVal = newVal.map((s: string) => s.trim()).filter(Boolean);
      }
      if (k === "specializations" && Array.isArray(origVal)) {
        origVal = origVal.map((s: string) => s.trim()).filter(Boolean);
      }

      const isSame = JSON.stringify(origVal) === JSON.stringify(newVal);
      if (!isSame) {
        changes[k] = newVal;
        if (sensitiveKeys.includes(k)) {
          hasSensitiveChanges = true;
        }
      }
    });

    const isAdmin = user?.role === "admin";
    const finalPendingUpdates = { ...(caterer.pendingUpdates || {}) };
    const tableUpdatePayload: any = {};
    let finalLocalCatererState = { ...caterer };

    allKeys.forEach((k) => {
      if (editedCaterer[k] !== undefined) {
        let val = editedCaterer[k];
        if (k === "experience" || k === "eventsCompleted" || k === "branches") {
          val =
            val !== undefined && val !== null && val !== ""
              ? parseInt(val.toString())
              : null;
        }

        if (isAdmin || !sensitiveKeys.includes(k)) {
          tableUpdatePayload[k] = val;
          if (k === "businessName") tableUpdatePayload["name"] = val;
          if (k === "ownerName") tableUpdatePayload["owner"] = val;

          finalLocalCatererState[k] = val;
          if (k === "businessName") finalLocalCatererState["name"] = val;
          if (k === "ownerName") finalLocalCatererState["owner"] = val;
        } else {
          if (changes[k] !== undefined) {
            finalPendingUpdates[k] = val;
            if (k === "phone") finalPendingUpdates["mobile"] = val;
            if (k === "ownerName") finalPendingUpdates["ownerName"] = val;
            if (k === "businessName") finalPendingUpdates["businessName"] = val;
          }
        }
      }
    });

    if (
      !isAdmin &&
      Object.keys(changes).filter((k) => sensitiveKeys.includes(k)).length > 0
    ) {
      finalPendingUpdates._requestedBy = caterer.owner || caterer.name || "Caterer";
      finalPendingUpdates._requestedAt = new Date().toISOString();
      tableUpdatePayload["pendingUpdates"] = finalPendingUpdates;
      finalLocalCatererState["pendingUpdates"] = finalPendingUpdates;
    }

    // ADDED DEBUG LOGS
    console.log("=== CATERNEST DATA SYNCHRONIZATION AUDIT LOGS ===");
    const directKeys = [
        { name: "Brand Public Name", field: "brandName", col: "includedItems._fallback_brandName" },
        { name: "Brand Tagline", field: "tagline", col: "includedItems._fallback_tagline" },
        { name: "Description", field: "description", col: "includedItems._fallback_description" },
        { name: "Experience Years", field: "experience", col: "includedItems._fallback_experience" },
        { name: "Events Completed", field: "eventsCompleted", col: "includedItems._fallback_eventsCompleted" },
        { name: "Awards", field: "awards", col: "includedItems._fallback_awards" },
        { name: "Certifications", field: "certifications", col: "includedItems._fallback_certifications" },
        { name: "Operating Hours", field: "operatingHours", col: "includedItems._fallback_operatingHours" },
        { name: "Branch Count", field: "branches", col: "includedItems._fallback_branches" },
        { name: "Service Areas", field: "serviceAreas", col: "includedItems._fallback_serviceAreas" },
        { name: "WhatsApp Number", field: "whatsappNumber", col: "includedItems._fallback_whatsappNumber" },
        { name: "HQ Address", field: "address", col: "address" },
        { name: "City", field: "city", col: "city" },
        { name: "Services", field: "services", col: "includedItems._fallback_services" },
        { name: "Achievements", field: "achievements", col: "includedItems._fallback_achievements" },
        { name: "Highlights", field: "highlights", col: "includedItems._fallback_highlights" },
        { name: "Specializations", field: "specializations", col: "includedItems._fallback_specializations" }
    ];
    directKeys.forEach(({ name, field, col }) => {
        const oldVal = (caterer as any)[field];
        const newVal = tableUpdatePayload[field];
        if (oldVal !== newVal && newVal !== undefined) {
            console.log(`[SYNC DEBUG] Field: "${name}", Old Value: ${JSON.stringify(oldVal)}, New Value: ${JSON.stringify(newVal)}, Database Column Updated: "${col}"`);
        }
    });

    const sensitiveKeysMapping = [
        { name: "Founder Name", field: "ownerName", col: "owner" },
        { name: "Legal Business Name", field: "businessName", col: "businessName" },
        { name: "Phone/Mobile", field: "phone", col: "phone" },
        { name: "Alternate Phone", field: "alternatePhone", col: "alternatePhone" },
        { name: "Email", field: "email", col: "email" },
        { name: "FSSAI", field: "fssai", col: "fssaiNumber" },
        { name: "GST", field: "gst", col: "gstNumber" },
        { name: "PAN", field: "pan", col: "panNumber" },
        { name: "Logo", field: "logo", col: "logo" },
        { name: "Cover Banner", field: "coverBanner", col: "coverBanner" },
        { name: "Founder Photo", field: "ownerPhoto", col: "ownerPhoto" },
        { name: "Branch Photo", field: "branchPhoto", col: "branchPhoto" }
    ];
    sensitiveKeysMapping.forEach(({ name, field, col }) => {
        const oldVal = (caterer as any)[field];
        const newVal = editedCaterer[field];
        if (oldVal !== newVal && newVal !== undefined) {
             if (isAdmin) {
                 console.log(`[SYNC DEBUG] Field: "${name}" (SENSITIVE - Admin Direct Save), Old Value: ${JSON.stringify(oldVal)}, New Value: ${JSON.stringify(newVal)}, Database Column Updated: "${col}"`);
             } else {
                 console.log(`[SYNC DEBUG] Field: "${name}" (SENSITIVE), Old Value: ${JSON.stringify(oldVal)}, New Value: ${JSON.stringify(newVal)}, Database Column Updated: "pendingUpdates.${field} (Admin review required)"`);
             }
        }
    });
    console.log("================================================");

    // 1. Update in Supabase
    const supabase = getSupabase() as any;
    if (supabase) {
      try {
        const cleanedPayload = { ...tableUpdatePayload };
        if (cleanedPayload.businessName !== undefined) {
          cleanedPayload.name = cleanedPayload.businessName;
          delete cleanedPayload.businessName;
        }
        if (cleanedPayload.ownerName !== undefined) {
          cleanedPayload.owner = cleanedPayload.ownerName;
          delete cleanedPayload.ownerName;
        }

        const { error } = await supabase
          .from("caterer_registrations")
          .update(cleanedPayload)
          .eq("id", caterer.id);

        if (error) throw error;
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }

    // 2. Update in LocalStorage
    const rawRegistrations = localStorage.getItem("registrations");
    if (rawRegistrations) {
      try {
        const all = JSON.parse(rawRegistrations);
        const updated = all.map((c: any) => {
          if (c.id === caterer.id) {
            const merged = { ...c, ...tableUpdatePayload };
            if (tableUpdatePayload.name)
              merged.businessName = tableUpdatePayload.name;
            if (tableUpdatePayload.owner)
              merged.owner = tableUpdatePayload.owner;
            return merged;
          }
          return c;
        });

        try {
          localStorage.setItem("registrations", JSON.stringify(updated));
        } catch (error: any) {
          if (error.name === "QuotaExceededError" || error.message?.includes("quota") || error.message?.includes("exceeded")) {
            console.warn("[QuotaExceededError] localStorage quota exceeded in Details. Cleaning large datasets inside cache.");
            const cleaned = updated.map((c: any) => {
              const copy = { ...c };
              delete copy.galleryPhotos;
              delete copy.menuPackages;
              delete copy.packages;
              delete copy.draftMenuPackages;
              delete copy.images;
              if (copy.includedItems && typeof copy.includedItems === "object") {
                const incCopy = { ...copy.includedItems };
                delete incCopy._fallback_galleryPhotos;
                delete incCopy._fallback_menuPackages;
                delete incCopy._fallback_packages;
                delete incCopy._fallback_draftMenuPackages;
                delete incCopy._fallback_images;
                copy.includedItems = incCopy;
              }
              return copy;
            });
            localStorage.setItem("registrations", JSON.stringify(cleaned));
            console.log("[QuotaExceededError Resolved] Successfully saved cleaned registrations cache inside Details.");
          } else {
            throw error;
          }
        }
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }
    }

    setCaterer(finalLocalCatererState);
    setIsEditing(false);

    if (!isAdmin && hasSensitiveChanges) {
      alert(
        "Sensitive changes (marked with 🔒) submitted for Admin Approval. Non-sensitive changes published immediately.",
      );
    } else {
      alert("Profile changes successfully published!");
    }
  };

  useEffect(() => {
    let allCaterers = [...DEMO_CATERERS];
    const raw = localStorage.getItem("registrations");
    if (raw) {
      try {
        const allRegs = JSON.parse(raw);
        const regMapped = allRegs.map((r: any) => ({
          ...r,
          id: r.id,
          name: r.businessName,
          location: r.location || "Banjara Hills",
          type: r.type || "Veg + Non-Veg",
          startingPrice: 350,
          rating: r.rating || null,
          reviewCount: r.reviewCount || null,
          description:
            r.description || "Welcome to our premium catering service.",
          images: r.images || [],
          logo: r.logo || "",
          address: r.address || r.location || "Hyderabad, Telangana",
          phone: r.phone || "+91 98765 43210",
          menus: [],
          menuPackages: r.menuPackages || r.packages || [],
          packages: r.packages || r.menuPackages || [],
          menuItems: r.menuItems || [],
          coverBanner: r.coverBanner,
          ownerPhoto: r.ownerPhoto,
          ownerName: r.owner || "Business Owner",
          galleryPhotos: r.galleryPhotos || [],
          achievements: r.achievements,
          awards: r.awards,
          highlights: r.highlights || null,
          teamPhotos: r.teamPhotos || [],
          kitchenPhotos: r.kitchenPhotos || [],
          specializations: r.specializations || (r.serviceAreas ? [] : null),
          services: r.services || null,
        }));
        allCaterers = [...allCaterers, ...regMapped];
      } catch (e) {}
    }

    const found = allCaterers.find((c) => c.id === id || getCatererSlug(c) === id);
    if (found) {
      setCaterer(found);
      if (!isEditing) {
        setEditedCaterer({ ...found });
      }
    }

    // Dynamic database refresh load to prevent stale caching issues across sessions
    const fetchFreshContent = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      try {
        console.log("[CATERER DETAILS] Performing background live sync with database for profile ID/Slug:", id);
        let query = supabase.from('caterer_registrations').select('*');
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
        if (isUuid) {
          query = query.eq('id', id);
        }
        
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const localRegs = JSON.parse(localStorage.getItem("registrations") || "[]");
          const updatedLocalRegs = [...localRegs];
          
          data.forEach((freshRecord: any) => {
            const index = updatedLocalRegs.findIndex((r: any) => r.id === freshRecord.id);
            if (index > -1) {
              updatedLocalRegs[index] = { ...updatedLocalRegs[index], ...freshRecord };
            } else {
              updatedLocalRegs.push(freshRecord);
            }
          });
          
          localStorage.setItem("registrations", JSON.stringify(updatedLocalRegs));
          console.log("[CATERER DETAILS] Local registrations copy synced to database.");

          let freshAllCaterers = [...DEMO_CATERERS];
          const freshRegMapped = updatedLocalRegs.map((r: any) => ({
            ...r,
            id: r.id,
            name: r.businessName,
            location: r.location || "Banjara Hills",
            type: r.type || "Veg + Non-Veg",
            startingPrice: 350,
            rating: r.rating || null,
            reviewCount: r.reviewCount || null,
            description: r.description || "Welcome to our premium catering service.",
            images: r.images || [],
            logo: r.logo || "",
            address: r.address || r.location || "Hyderabad, Telangana",
            phone: r.phone || "+91 98765 43210",
            menus: [],
            menuPackages: r.menuPackages || r.packages || [],
            packages: r.packages || r.menuPackages || [],
            menuItems: r.menuItems || [],
            coverBanner: r.coverBanner,
            ownerPhoto: r.ownerPhoto,
            ownerName: r.owner || "Business Owner",
            galleryPhotos: r.galleryPhotos || [],
            achievements: r.achievements,
            awards: r.awards,
            highlights: r.highlights || null,
            teamPhotos: r.teamPhotos || [],
            kitchenPhotos: r.kitchenPhotos || [],
            specializations: r.specializations || (r.serviceAreas ? [] : null),
            services: r.services || null,
          }));
          freshAllCaterers = [...freshAllCaterers, ...freshRegMapped];
          const brandNewFound = freshAllCaterers.find((c) => c.id === id || getCatererSlug(c) === id);
          if (brandNewFound) {
            setCaterer(brandNewFound);
            if (!isEditing) {
              setEditedCaterer({ ...brandNewFound });
            }
          }
        }
      } catch (err) {
        console.error("[CATERER DETAILS] Background sync exception:", err);
      }
    };
    fetchFreshContent();
  }, [id, isEditing]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [activeGalleryTab, setActiveGalleryTab] = useState("All");
  const [guestCount, setGuestCount] = useState(100);
  const [activeTab, setActiveTab] = useState("Overview");
  const [builderTab, setBuilderTab] = useState<"branding" | "highlights" | "location" | "gallery">("branding");
  const [mobileEditorView, setMobileEditorView] = useState<"editor" | "preview">("editor");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === "Overview") {
      document
        .getElementById("overview-section")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "Packages" || tab === "Menu") {
      document
        .getElementById("menu-packages")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "Gallery") {
      document
        .getElementById("gallery-section")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "Reviews") {
      document
        .getElementById("reviews-section")
        ?.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "About Us") {
      document
        .getElementById("overview-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!caterer)
    return (
      <div className="min-h-screen pt-32 pb-24 text-center text-slate-500 font-medium">
        Loading Caterer Profile...
      </div>
    );

  const fallbackBanner =
    caterer.coverBanner || (caterer.images && caterer.images[0]) || "";
  const fallbackOwnerPhoto = caterer.ownerPhoto || "";
  const allGalleryPhotos = [
    ...(caterer.galleryPhotos || caterer.images || []),
    ...(caterer.kitchenPhotos || []),
    ...(caterer.teamPhotos || []),
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
    setLightboxIndex(
      (prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length,
    );
  };

  let packageTiers: any[] = [];
  if (caterer.menuPackages && caterer.menuPackages.length > 0) {
    packageTiers = caterer.menuPackages.map((pkg: any, idx: number) => {
      const sorted = pkg.pricingSlabs
        ? [...pkg.pricingSlabs].sort(
            (a: any, b: any) => a.minGuests - b.minGuests,
          )
        : [];
      const priceValue = sorted.length
        ? sorted[0].price
        : pkg.pricePerPlate || (caterer.startingPrice || 350) + idx * 150;
      const minGuestsValue = sorted.length
        ? sorted[0].minGuests
        : pkg.minimumGuests || 50;

      const themeIndex = idx % 6;
      const themes: (
        | "silver"
        | "gold"
        | "platinum"
        | "premium"
        | "royal"
        | "grand"
      )[] = ["silver", "gold", "platinum", "premium", "royal", "grand"];
      const theme = themes[themeIndex];

      return {
        id: idx,
        name:
          pkg.packageName ||
          (themeIndex === 0
            ? "Silver Package"
            : themeIndex === 1
              ? "Gold Package"
              : themeIndex === 2
                ? "Platinum Package"
                : themeIndex === 3
                  ? "Premium Package"
                  : themeIndex === 4
                    ? "Royal Package"
                    : "Grand Royal"),
        type: pkg.packageType === "Veg" ? "veg" : "nonVeg",
        price: priceValue,
        guests: minGuestsValue,
        categoriesCount:
          pkg.categories?.length ||
          (themeIndex === 0
            ? 6
            : themeIndex === 1
              ? 7
              : themeIndex === 2
                ? 8
                : themeIndex === 3
                  ? 10
                  : themeIndex === 4
                    ? 12
                    : 14),
        selectItems:
          themeIndex < 3 ? "Select Any 1 Item" : "Select Any 2 Items",
        theme: theme,
        desc: pkg.description || `Special selection for your guests.`,
        popular: themeIndex === 4,
      };
    });
  } else {
    packageTiers = [
      {
        id: "v_silver",
        name: "Silver Package",
        type: "veg",
        price: caterer.startingPrice || 350,
        guests: 100,
        categoriesCount: 6,
        selectItems: "Select Any 1 Item",
        theme: "silver",
        desc: "Simple & elegant vegetarian spread for family gatherings.",
      },
      {
        id: "v_gold",
        name: "Gold Package",
        type: "veg",
        price: (caterer.startingPrice || 350) + 100,
        guests: 150,
        categoriesCount: 7,
        selectItems: "Select Any 1 Item",
        theme: "gold",
        desc: "Slightly richer premium veg spread with extra paneer delicacies.",
      },
      {
        id: "v_platinum",
        name: "Platinum Package",
        type: "veg",
        price: (caterer.startingPrice || 350) + 250,
        guests: 200,
        categoriesCount: 8,
        selectItems: "Select Any 1 Item",
        theme: "platinum",
        desc: "Ultra luxury premium veg spread for signature events.",
      },
      {
        id: "nv_premium",
        name: "Premium Package",
        type: "nonVeg",
        price: (caterer.startingPrice || 350) + 450,
        guests: 150,
        categoriesCount: 10,
        selectItems: "Select Any 2 Items",
        theme: "premium",
        desc: "Classic non-veg catering with double choice meat courses.",
      },
      {
        id: "nv_royal",
        name: "Royal Package",
        type: "nonVeg",
        price: (caterer.startingPrice || 350) + 750,
        guests: 200,
        categoriesCount: 12,
        selectItems: "Select Any 2 Items",
        theme: "royal",
        desc: "Exquisite regal non-veg banquet for elite wedding celebrations.",
        popular: true,
      },
      {
        id: "nv_grand",
        name: "Grand Royal",
        type: "nonVeg",
        price: (caterer.startingPrice || 350) + 1150,
        guests: 250,
        categoriesCount: 14,
        selectItems: "Select Any 2 Items",
        theme: "grand",
        desc: "The ultimate royal banquet with exotic seafood, mutton, and dessert options.",
      },
    ];
  }

  const isOwnerOrAdmin =
    user && (user.id === caterer.userId || user.role === "admin");
  const targetCatererObj = isEditing && editedCaterer ? editedCaterer : caterer;

  const specializations = targetCatererObj.specializations
    ? Array.isArray(targetCatererObj.specializations)
      ? targetCatererObj.specializations
      : typeof targetCatererObj.specializations === "string"
        ? (targetCatererObj.specializations as string)
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : []
    : [];
  const awardsList = targetCatererObj.awards
    ? typeof targetCatererObj.awards === "string"
      ? targetCatererObj.awards
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : Array.isArray(targetCatererObj.awards)
        ? targetCatererObj.awards
        : []
    : [];
  const certificationsList = targetCatererObj.certifications
    ? typeof targetCatererObj.certifications === "string"
      ? targetCatererObj.certifications
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : Array.isArray(targetCatererObj.certifications)
        ? targetCatererObj.certifications
        : []
    : [];

  const rawAchievements = targetCatererObj.achievements;
  let achievementsList: any[] = [];
  if (Array.isArray(rawAchievements)) {
    achievementsList = rawAchievements;
  } else if (typeof rawAchievements === "string" && rawAchievements.trim().startsWith("[")) {
    try {
      achievementsList = JSON.parse(rawAchievements);
    } catch (e) {
      achievementsList = [];
    }
  } else if (typeof rawAchievements === "string" && rawAchievements.trim() !== "") {
    achievementsList = rawAchievements.split(",").map(item => {
      const parts = item.trim().split(" ");
      const val = parts[0] || "10+";
      const lbl = parts.slice(1).join(" ") || "Successful Events";
      return { value: val, title: lbl };
    });
  } else {
    const items = [];
    const evVal = targetCatererObj.eventsCompleted;
    const expVal = targetCatererObj.experience;
    if (evVal !== undefined && evVal !== null && evVal !== "") {
      items.push({
        value: `${parseInt(evVal.toString()).toLocaleString()}+`,
        title: "Successful Events"
      });
    } else {
      items.push({
        value: "5,000+",
        title: "Successful Events"
      });
    }
    if (expVal !== undefined && expVal !== null && expVal !== "") {
      items.push({
        value: `${parseInt(expVal.toString()).toLocaleString()}+`,
        title: "Years of Trust"
      });
    } else {
      items.push({
        value: "10+",
        title: "Years of Trust"
      });
    }
    items.push({
      value: "100,000+",
      title: "Happy Customers"
    });
    items.push({
      value: "150+",
      title: "Expert Professionals"
    });
    achievementsList = items;
  }
  const branchesVal = targetCatererObj.branches
    ? parseInt(targetCatererObj.branches.toString())
    : null;
  const serviceAreasList = targetCatererObj.serviceAreas
    ? typeof targetCatererObj.serviceAreas === "string"
      ? targetCatererObj.serviceAreas
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : Array.isArray(targetCatererObj.serviceAreas)
        ? targetCatererObj.serviceAreas
        : []
    : [];
  const operatingHours = targetCatererObj.operatingHours || null;
  const experienceVal = targetCatererObj.experience
    ? parseInt(targetCatererObj.experience.toString())
    : null;

  const renderEditSettingsModal = () => {
    return null;
    if (!isEditing || !editedCaterer) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
        <div className="bg-[#051410] border border-[#DEAA38]/45 w-full max-w-3xl rounded-[2rem] shadow-[0_24px_64px_rgba(0,0,0,0.6)] text-white overflow-hidden flex flex-col my-8 h-auto max-h-[85vh]">
          {/* Sidebar Header */}
        <div className="p-5 border-b border-[#DEAA38]/20 flex items-center justify-between bg-[#0B3D2E]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#DEAA38]" />
            <span className="font-display font-medium text-sm tracking-widest text-[#DEAA38] uppercase">
              Brand Builder
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-sans">
            <span className="bg-[#DEAA38]/10 text-[#DEAA38] border border-[#DEAA38]/25 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
              DESIGN MODE
            </span>
          </div>
        </div>
        
        {/* Tab Selectors */}
        <div className="grid grid-cols-4 bg-[#03110D] border-b border-[#DEAA38]/15 text-[10px] uppercase font-bold tracking-wider relative shrink-0">
          <button 
            type="button"
            onClick={() => setBuilderTab("branding")}
            className={cn(
              "py-3.5 flex flex-col items-center gap-1 transition-all border-b-2 hover:bg-[#0B3D2E]/20 cursor-pointer", 
              builderTab === "branding" ? "text-[#DEAA38] border-[#DEAA38] bg-[#0B3D2E]/10 font-bold" : "text-white/40 border-transparent"
            )}
            title="Branding & Contact Info"
          >
            <ImageIcon size={15} />
            <span className="text-[8px] tracking-tight mt-0.5">Branding</span>
          </button>
          <button 
            type="button"
            onClick={() => setBuilderTab("highlights")}
            className={cn(
              "py-3.5 flex flex-col items-center gap-1 transition-all border-b-2 hover:bg-[#0B3D2E]/20 cursor-pointer", 
              builderTab === "highlights" ? "text-[#DEAA38] border-[#DEAA38] bg-[#0B3D2E]/10 font-bold" : "text-white/40 border-transparent"
            )}
            title="Custom Highlights & Impact stats"
          >
            <Sparkles size={15} />
            <span className="text-[8px] tracking-tight mt-0.5">Highlights</span>
          </button>
          <button 
            type="button"
            onClick={() => setBuilderTab("location")}
            className={cn(
              "py-3.5 flex flex-col items-center gap-1 transition-all border-b-2 hover:bg-[#0B3D2E]/20 cursor-pointer", 
              builderTab === "location" ? "text-[#DEAA38] border-[#DEAA38] bg-[#0B3D2E]/10 font-bold" : "text-white/40 border-transparent"
            )}
            title="Branches, Areas & Hours"
          >
            <MapPin size={15} />
            <span className="text-[8px] tracking-tight mt-0.5">Logistics</span>
          </button>
          <button 
            type="button"
            onClick={() => setBuilderTab("gallery")}
            className={cn(
              "py-3.5 flex flex-col items-center gap-1 transition-all border-b-2 hover:bg-[#0B3D2E]/20 cursor-pointer", 
              builderTab === "gallery" ? "text-[#DEAA38] border-[#DEAA38] bg-[#0B3D2E]/10 font-bold" : "text-white/40 border-transparent"
            )}
            title="Awards & Image Gallery"
          >
            <LayoutGrid size={15} />
            <span className="text-[8px] tracking-tight mt-0.5">Portfolio</span>
          </button>
        </div>

        {/* Scrollable inputs Container with gorgeous styling */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gradient-to-b from-[#051410] to-[#020b08] scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent">
          {builderTab === "branding" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pb-1.5 font-mono">Brand Identity</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Brand Public Name</label>
                <input
                  type="text"
                  value={editedCaterer.brandName || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, brandName: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/20 outline-none focus:border-[#DEAA38] focus:ring-1 focus:ring-[#DEAA38] transition font-sans"
                  placeholder="e.g. Royal Wedding Feasts"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1">Legal Business Name <ShieldCheck size={12} className="text-[#DEAA38]/70 font-sans" /></label>
                <input
                  type="text"
                  value={editedCaterer.businessName || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, businessName: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/20 outline-none focus:border-[#DEAA38] focus:ring-1 focus:ring-[#DEAA38] transition font-sans"
                  placeholder="e.g. Royal Banquet Services Private Limited"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Brand Tagline</label>
                <textarea
                  value={editedCaterer.tagline || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, tagline: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/20 outline-none focus:border-[#DEAA38] h-20 resize-none transition font-sans"
                  placeholder="e.g. Crafting Curated Culinary Journeys"
                />
              </div>

              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pt-4 pb-1.5 font-mono">Contact & Location</h4>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Official HQ Address</label>
                <input
                  type="text"
                  value={editedCaterer.address || editedCaterer.location || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, address: e.target.value, location: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/20 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1">Official Mobile <Phone size={12} className="text-[#DEAA38]/70" /></label>
                <input
                  type="text"
                  value={editedCaterer.phone || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, phone: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/20 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pt-4 pb-1.5 font-mono">Brand Media Assets</h4>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Brand Logo Shield</label>
                <div className="flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-emerald-950/20">
                  {editedCaterer.logo ? (
                    <img src={editedCaterer.logo} className="w-14 h-14 object-cover rounded-full border border-[#DEAA38]" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-950/40 flex items-center justify-center text-[#DEAA38] border border-[#DEAA38]/20">
                      <User size={20} />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer bg-emerald-900/60 border border-emerald-500/20 hover:bg-emerald-800 text-white font-bold text-[10px] px-3 py-2 rounded-lg flex items-center gap-1.5 justify-center transition w-fit shadow-xs">
                      <ImageIcon size={12} /> Choose Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await convertFileToBase64(file);
                            setEditedCaterer({ ...editedCaterer, logo: base64 });
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={editedCaterer.logo || ""}
                      onChange={(e) => setEditedCaterer({ ...editedCaterer, logo: e.target.value })}
                      placeholder="Or paste Logo Image URL"
                      className="bg-black/50 border border-emerald-950/80 rounded-lg px-2.5 py-1 text-[10px] w-full text-white/80 select-all font-sans"
                    />
                  </div>
                </div>

                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block pt-3">Cover Banner Backdrop</label>
                <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-emerald-950/20">
                  <div className="h-20 w-full overflow-hidden rounded-lg bg-black/40 border border-emerald-900/20 relative">
                    {editedCaterer.coverBanner ? (
                      <img src={editedCaterer.coverBanner} className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-sans text-center">No Cover Banner</div>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <label className="cursor-pointer bg-emerald-900/60 border border-emerald-500/20 hover:bg-emerald-800 text-white font-bold text-[10px] px-3 py-2 rounded-lg flex items-center gap-1.5 justify-center transition shadow-xs flex-1">
                      <ImageIcon size={12} /> Upload Banner
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await convertFileToBase64(file);
                            setEditedCaterer({ ...editedCaterer, coverBanner: base64 });
                          }
                        }}
                      />
                    </label>
                    {editedCaterer.coverBanner && (
                      <button
                        type="button"
                        onClick={() => setEditedCaterer({ ...editedCaterer, coverBanner: "" })}
                        className="text-red-400 hover:text-red-300 text-[10px] font-bold font-sans cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editedCaterer.coverBanner || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, coverBanner: e.target.value })}
                    placeholder="Or enter Cover Photo URL"
                    className="bg-black/50 border border-emerald-950/80 rounded-lg px-2.5 py-1 text-[10px] w-full text-white/80 font-sans"
                  />
                </div>
              </div>

              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pt-4 pb-1.5 font-mono">Our Specialties</h4>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Services Specializations</label>
                <input
                  type="text"
                  value={
                    Array.isArray(editedCaterer.specializations)
                      ? editedCaterer.specializations.join(", ")
                      : typeof editedCaterer.specializations === "string"
                        ? editedCaterer.specializations
                        : ""
                  }
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, specializations: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/20 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. Weddings, Birthdays, Corporate Galas"
                />
                <span className="text-[9px] text-[#DEAA38]/60 font-mono italic">Separate specialties with commas</span>
              </div>

            </div>
          )}

          {builderTab === "highlights" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pb-1.5 font-mono">Performance Numbers</h4>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Experience (Years)</label>
                  <input
                    type="number"
                    value={editedCaterer.experience !== undefined && editedCaterer.experience !== null ? editedCaterer.experience : ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, experience: e.target.value })}
                    className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 outline-none focus:border-[#DEAA38] transition font-sans"
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Events Completed</label>
                  <input
                    type="number"
                    value={editedCaterer.eventsCompleted !== undefined && editedCaterer.eventsCompleted !== null ? editedCaterer.eventsCompleted : ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, eventsCompleted: e.target.value })}
                    className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 outline-none focus:border-[#DEAA38] transition font-sans"
                    placeholder="e.g. 2500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Interactive WhatsApp Link</label>
                <input
                  type="text"
                  value={editedCaterer.whatsappNumber || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, whatsappNumber: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. +919876543210"
                />
              </div>

              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pt-4 pb-1.5 font-mono">Custom Highlight Cards</h4>
              
              <div className="space-y-2.5">
                {/* Custom Highlights List */}
                {editedCaterer.highlights && editedCaterer.highlights.map((hl: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl font-sans">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-[#DEAA38]/10 text-[#DEAA38] flex items-center justify-center">
                        <Sparkles size={14} />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white max-w-[170px] truncate">{hl.title}</div>
                        <div className="text-[9px] text-[#DEAA38] uppercase tracking-widest">{hl.subtitle}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHighlightIndex(idx);
                          setHighlightForm({ title: hl.title, subtitle: hl.subtitle, iconName: hl.iconName });
                          setHighlightModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-emerald-900/50 rounded-lg text-white/70 hover:text-white transition duration-300 cursor-pointer"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHighlight(idx)}
                        className="p-1.5 hover:bg-red-950/40 rounded-lg text-rose-400 hover:text-rose-355 transition duration-300 border border-red-500/10 cursor-pointer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setEditingHighlightIndex(null);
                    setHighlightForm({ title: "", subtitle: "", iconName: "Users" });
                    setHighlightModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-3 border border-dashed border-[#DEAA38]/30 hover:border-[#DEAA38] rounded-xl text-[10px] text-white/80 hover:text-white uppercase font-bold tracking-widest transition duration-300 hover:bg-[#DEAA38]/5 cursor-pointer font-sans"
                >
                  <Plus size={12} /> Add Highlight
                </button>
              </div>
            </div>
          )}

          {builderTab === "location" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pb-1.5 font-mono">Branches & Service Area</h4>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Number of Branches</label>
                <input
                  type="number"
                  value={editedCaterer.branches !== undefined && editedCaterer.branches !== null ? editedCaterer.branches : ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, branches: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. 3"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Operating Timings Info</label>
                <input
                  type="text"
                  value={editedCaterer.operatingHours || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, operatingHours: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/10 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. Mon-Sat: 9:00 AM - 10:00 PM"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Operational Service Areas</label>
                <textarea
                  value={editedCaterer.serviceAreas || ""}
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, serviceAreas: e.target.value })}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/10 outline-none focus:border-[#DEAA38] h-20 resize-none transition font-sans"
                  placeholder="e.g. Jubilee Hills, Banjara Hills (Comma separated)"
                />
              </div>

              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pt-4 pb-1.5 font-mono">Branch Landmark Photo</h4>
              
              <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-emerald-955/20">
                <div className="h-20 w-full overflow-hidden rounded-lg bg-black/40 border border-emerald-900/20 relative">
                  {editedCaterer.branchPhoto ? (
                    <img src={editedCaterer.branchPhoto} className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-sans text-center">No Photo Selected</div>
                  )}
                </div>
                <div className="flex gap-2.5">
                  <label className="cursor-pointer bg-emerald-900/60 border border-emerald-500/20 hover:bg-emerald-800 text-white font-bold text-[10px] px-3 py-2 rounded-lg flex items-center gap-1.5 justify-center transition shadow-xs flex-1">
                    <ImageIcon size={12} /> Upload Branch Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await convertFileToBase64(file);
                          setEditedCaterer({ ...editedCaterer, branchPhoto: base64 });
                        }
                      }}
                    />
                  </label>
                  {editedCaterer.branchPhoto && (
                    <button
                      type="button"
                      onClick={() => setEditedCaterer({ ...editedCaterer, branchPhoto: "" })}
                      className="text-[#DEAA38] hover:text-white text-[10px] font-bold font-sans cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {builderTab === "gallery" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pb-1.5 font-mono">Awards & Honors</h4>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Awards Won</label>
                <input
                  type="text"
                  value={
                    Array.isArray(editedCaterer.awards)
                      ? editedCaterer.awards.join(", ")
                      : typeof editedCaterer.awards === "string"
                        ? editedCaterer.awards
                        : ""
                  }
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, awards: e.target.value })}
                  className="bg-black/40 border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/25 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. Best Caterer 2024, Times Hospitality Award"
                />
                <span className="text-[9px] text-[#DEAA38]/60 font-mono italic">Comma separated list</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Official Certifications</label>
                <input
                  type="text"
                  value={
                    Array.isArray(editedCaterer.certifications)
                      ? editedCaterer.certifications.join(", ")
                      : typeof editedCaterer.certifications === "string"
                        ? editedCaterer.certifications
                        : ""
                  }
                  onChange={(e) => setEditedCaterer({ ...editedCaterer, certifications: e.target.value })}
                  className="bg-black/40 border border-[#D4AF37]/20 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/25 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. ISO 22000, HACCP Verified"
                />
                <span className="text-[9px] text-[#DEAA38]/60 font-mono italic">Comma separated list</span>
              </div>

              <h4 className="text-[10px] uppercase tracking-widest text-[#DEAA38] font-bold border-b border-[#DEAA38]/10 pt-4 pb-1.5 font-mono">Curated Gallery Portfolio</h4>
              
              <div className="space-y-3 font-sans">
                <label className="cursor-pointer w-full bg-emerald-990/40 hover:bg-emerald-900 border border-dashed border-emerald-500/30 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-xs mb-3">
                  <Plus size={14} className="text-[#DEAA38]" /> Add Portfolio Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const newImages: string[] = [];
                        for (let i = 0; i < files.length; i++) {
                          const file = files[i];
                          const base64 = await convertFileToBase64(file);
                          newImages.push(base64);
                        }
                        const currentGallery = Array.isArray(editedCaterer.gallery) ? editedCaterer.gallery : [];
                        setEditedCaterer({
                          ...editedCaterer,
                          gallery: [...currentGallery, ...newImages]
                        });
                        toast(`Loaded ${files.length} images! Press Save in builder footer to publish.`, "success");
                      }
                    }}
                  />
                </label>

                {/* Portfolio Grid display */}
                <div className="grid grid-cols-4 gap-2 border border-emerald-900/20 bg-black/10 p-2 rounded-xl max-h-[180px] overflow-y-auto no-scrollbar">
                  {editedCaterer.gallery && Array.isArray(editedCaterer.gallery) ? (
                    editedCaterer.gallery.map((imgUrl: string, gIdx: number) => (
                      <div key={gIdx} className="relative aspect-square group rounded-lg overflow-hidden bg-black border border-emerald-950">
                        <img src={imgUrl} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newGallery = [...editedCaterer.gallery];
                            newGallery.splice(gIdx, 1);
                            setEditedCaterer({
                              ...editedCaterer,
                              gallery: newGallery
                            });
                          }}
                          className="absolute inset-0 bg-red-950/70 opacity-0 hover:opacity-100 flex items-center justify-center transition duration-300 text-rose-300 text-xs cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/30 text-[10px] col-span-4 text-center py-4">Gallery is empty</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons footer */}
        <div className="p-4 border-t border-[#DEAA38]/20 bg-[#0B3D2E] flex items-center justify-between gap-3 shrink-0 font-sans">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditedCaterer({ ...caterer });
            }}
            className="px-4 py-2 bg-black/20 hover:bg-black/35 text-white/90 hover:text-white rounded-xl text-xs font-bold transition duration-300 border border-[#DEAA38]/30 grow text-center uppercase tracking-widest cursor-pointer"
          >
            Cancel Draft
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-5 py-2.5 bg-gradient-to-r from-[#DEAA38] to-[#C28824] hover:from-[#E2B34B] hover:to-[#DEAA38] text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(222,170,56,0.25)] hover:shadow-[0_8px_25px_rgba(222,170,56,0.38)] grow text-center uppercase tracking-widest cursor-pointer"
          >
            Deploy Live
          </button>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div className="bg-[#FAF8F3] min-h-screen">
      {/* Dynamic Highlight Edit Modal */}
      <AnimatePresence>
        {highlightModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#052118] border border-[#D4A437]/40 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] w-full max-w-xl p-6 text-white overflow-hidden relative"
            >
              <button
                type="button"
                onClick={() => setHighlightModalOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-lg font-black uppercase text-[#D4A437] tracking-wider mb-2 font-sans">
                {editingHighlightIndex === null 
                  ? "Add Highlight Card" 
                  : editingHighlightIndex === 'experience' || editingHighlightIndex === 'eventsCompleted'
                    ? "Edit Core Stat"
                    : "Edit Highlight Card"}
              </h3>
              <p className="text-white/70 text-xs mb-5">
                {editingHighlightIndex === null 
                  ? "Create a premium highlight for your profile. Select one of the recommended features below or write your own custom stat." 
                  : "Update your profile highlight. You can customize the title and subtitle levels below."}
              </p>

              {/* Suggested Highlights (Only on Addition or if editing is dynamic) */}
              {editingHighlightIndex === null && (
                <div className="mb-6">
                  <span className="text-[10px] uppercase font-bold text-[#D4A437] tracking-widest block mb-2.5 font-mono">
                    Suggested Highlights
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1 no-scrollbar">
                    {SUGGESTED_HIGHLIGHTS.map((sh, sIdx) => (
                      <button
                        type="button"
                        key={sIdx}
                        onClick={() => {
                          setHighlightForm({ title: sh.title, subtitle: sh.subtitle });
                          setShowCustomInput(true);
                        }}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/15 border border-white/5 hover:border-[#D4A437]/45 rounded-xl px-3 py-2 text-left text-xs transition active:scale-98 cursor-pointer"
                      >
                        <div className="text-[#D4A437]/85">
                          <CheckCircle2 size={13} />
                        </div>
                        <div>
                          <div className="font-bold text-white leading-none mb-0.5">{sh.title}</div>
                          <div className="text-[9px] text-[#D4A437]/70 font-sans leading-none">{sh.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Input Form */}
              <div className="space-y-4 border-t border-white/10 pt-4">
                <span className="text-[10px] uppercase font-bold text-[#D4A437] tracking-widest block font-mono">
                  Highlight Content
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/60 font-bold uppercase tracking-wider font-mono">
                      {editingHighlightIndex === 'experience' 
                        ? "Years of Experience" 
                        : editingHighlightIndex === 'eventsCompleted' 
                          ? "Events Completed Number" 
                          : "Title / value (e.g. 100% or Hygienic)"}
                    </label>
                    <input
                      type={editingHighlightIndex === 'experience' || editingHighlightIndex === 'eventsCompleted' ? "number" : "text"}
                      value={highlightForm.title}
                      onChange={(e) => setHighlightForm({ ...highlightForm, title: e.target.value })}
                      placeholder={editingHighlightIndex === 'experience' ? "e.g. 15" : editingHighlightIndex === 'eventsCompleted' ? "e.g. 500" : "e.g. Multi"}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-[#D4A437]"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-white/60 font-bold uppercase tracking-wider font-mono">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={highlightForm.subtitle}
                      disabled={editingHighlightIndex === 'experience' || editingHighlightIndex === 'eventsCompleted'}
                      onChange={(e) => setHighlightForm({ ...highlightForm, subtitle: e.target.value })}
                      placeholder={editingHighlightIndex === 'experience' ? "Experience" : editingHighlightIndex === 'eventsCompleted' ? "Completed" : "e.g. Cuisine"}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white/80 text-xs outline-none focus:border-[#D4A437] disabled:opacity-50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setHighlightModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/85 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHighlight}
                  disabled={!highlightForm.title.trim()}
                  className="px-4 py-2 bg-[#D4A437] hover:bg-[#E0B84C] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  Save Highlight
                </button>
              </div>

            </motion.div>
          </div>
        )}

        {isAddServiceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#052118] border border-[#D4A437]/40 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.6)] w-full max-w-xl p-6 text-white overflow-hidden relative"
            >
              <button
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-lg font-black uppercase text-[#D4A437] tracking-wider mb-2 font-display">
                Add Custom Service
              </h3>
              <p className="text-white/70 text-xs mb-4 font-sans">
                Create a custom service card or select one of the pre-designed popular templates below.
              </p>

              {/* Suggestions Panel Inside Modal */}
              <div className="mb-5 bg-[#03150F] rounded-2xl p-3 border border-[#D4A437]/10">
                <span className="text-[9px] uppercase font-bold text-[#D4A437] tracking-widest block mb-2 font-mono">
                  Recommended Service Templates (Click to prefill)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {SERVICE_SUGGESTIONS.map((sug) => {
                    const isPrefilled = newServiceTitle === sug.title;
                    return (
                      <button
                        key={sug.title}
                        type="button"
                        onClick={() => {
                          setNewServiceTitle(sug.title);
                          setNewServiceDesc(sug.desc);
                          setNewServiceImage(sug.image);
                          setNewServiceIcon(sug.iconName);
                          toast(`Loaded template: ${sug.title}`, "success");
                        }}
                        className={cn(
                          "text-[10px] px-2.5 py-1.5 rounded-lg transition font-sans font-bold flex items-center gap-1 cursor-pointer border",
                          isPrefilled
                            ? "bg-[#D4A437]/20 text-[#D4A437] border-[#D4A437]"
                            : "bg-white/5 hover:bg-white/10 text-white/90 border-transparent"
                        )}
                      >
                        + {sug.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Input Form */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[10px] uppercase font-bold text-[#D4A437] tracking-widest font-mono">
                    Service Title
                  </label>
                  <input
                    type="text"
                    value={newServiceTitle}
                    onChange={(e) => setNewServiceTitle(e.target.value)}
                    className="bg-black/40 border border-white/10 focus:border-[#D4A437] rounded-xl px-3 py-2 text-xs outline-none transition text-white w-full"
                    placeholder="e.g. Traditional Royal Buffet"
                  />
                </div>

                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[10px] uppercase font-bold text-[#D4A437] tracking-widest font-mono">
                    Service Description
                  </label>
                  <textarea
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="bg-black/40 border border-white/10 focus:border-[#D4A437] rounded-xl px-3 py-2 text-xs outline-none transition text-white w-full h-18 resize-none"
                    placeholder="Briefly describe what's included in this premium service package..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#D4A437] tracking-widest font-mono">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={newServiceImage}
                      onChange={(e) => setNewServiceImage(e.target.value)}
                      className="bg-black/40 border border-white/10 focus:border-[#D4A437] rounded-xl px-3 py-2 text-xs outline-none transition text-white w-full"
                      placeholder="Paste cover image URL..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 font-sans">
                    <label className="text-[10px] uppercase font-bold text-[#D4A437] tracking-widest font-mono">
                      Choose Icon Style
                    </label>
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 h-[34px]">
                      {Object.keys(serviceIcons).map((iconKey) => {
                        const IconComp = serviceIcons[iconKey];
                        const isSelected = newServiceIcon === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => setNewServiceIcon(iconKey)}
                            className={cn(
                              "p-1 rounded-md transition hover:bg-white/15 select-none cursor-pointer",
                              isSelected ? "text-[#D4A437] bg-white/10" : "text-white/40"
                            )}
                            title={iconKey}
                          >
                            <IconComp size={15} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-white/10 mt-6 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newServiceTitle.trim()) {
                        toast("Please enter a service title", "error");
                        return;
                      }
                      const servicesList = [...(editedCaterer?.services || caterer?.services || DEFAULT_SERVICES)];
                      servicesList.push({
                        title: newServiceTitle,
                        desc: newServiceDesc || "Premium custom service prepared according to special design tastes.",
                        image: newServiceImage || "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
                        iconName: newServiceIcon
                      });
                      setEditedCaterer({ ...editedCaterer, services: servicesList });
                      setIsAddServiceModalOpen(false);
                      toast("Successfully added service to the list!", "success");
                    }}
                    className="bg-[#D4A437] hover:bg-[#b08427] text-[#052118] font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Add Service
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddServiceModalOpen(false)}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={32} />
            </button>
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4"
              onClick={prevLightboxEvent}
            >
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

            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4"
              onClick={nextLightboxEvent}
            >
              <ChevronRight size={48} strokeWidth={1} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 tracking-widest text-sm font-medium">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESTORED CLEAN CATERER DETAILS PAGE LAYOUT */}
      {isEditing && renderEditSettingsModal()}

      {/* Live profile display panel */}
      <div className="w-full bg-[#FDF7F2] relative overflow-x-hidden min-h-screen">

        {/* TOP ROW: BREADCRUMBS & NAVIGATION BUTTONS */}
        <div className="max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5 mt-[85px] sm:mt-[96px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-sans relative z-30 border-b border-[#E8DCC7]/40">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
            <Link to="/" className="hover:text-[#0B3D2E] hover:font-bold transition-all">Home</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <Link to="/explore" className="hover:text-[#0B3D2E] hover:font-bold transition-all">Caterers</Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-semibold text-[#0B3D2E] bg-[#0F3D2E]/5 px-2.5 py-1 rounded-md">{targetCatererObj.brandName || targetCatererObj.name}</span>
          </div>

          {/* Action Row */}
          <div className="flex gap-2 items-center font-sans">
            {isOwnerOrAdmin && isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="flex items-center gap-1.5 bg-[#01A378] hover:bg-[#028b67] text-white px-4 py-2 rounded-full font-extrabold tracking-widest uppercase transition-all duration-300 text-[10px] cursor-pointer shadow-[0_4px_15px_rgba(1,163,120,0.25)] hover:scale-105 active:scale-95"
                >
                  SAVE CHANGES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedCaterer({ ...caterer });
                  }}
                  className="flex items-center gap-1.5 bg-[#D11A2A] hover:bg-[#b01421] text-white px-4 py-2 rounded-full font-extrabold tracking-widest uppercase transition-all duration-300 text-[10px] cursor-pointer shadow-[0_4px_15px_rgba(209,26,42,0.25)] hover:scale-105 active:scale-95"
                >
                  CANCEL
                </button>
              </>
            )}
            {isOwnerOrAdmin && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  if (!isEditing) {
                    setEditedCaterer({ ...caterer });
                  }
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#DEAA38] via-[#E2B34B] to-[#C28824] hover:from-[#E2B34B] hover:to-[#DEAA38] text-white px-4.5 py-2 rounded-full font-extrabold tracking-widest uppercase transition-all duration-300 border border-[#DEAA38]/30 shadow-[0_4px_15px_rgba(222,170,56,0.25)] text-[10px] cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                Edit Profile
              </button>
            )}
            <button 
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-bold transition-all duration-300 border border-slate-200 shadow-sm text-[10px] cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              Share
            </button>
          </div>
        </div>

        {/* SECTION 1: HERO CONTAINER WITH INTEGRATED COVER BANNER */}
        <div className="max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mb-6 mt-1 relative z-20">
          <div className="bg-[#FFFDFB] rounded-[2rem] sm:rounded-[2.5rem] border border-[#E8DCC7] p-4 sm:p-6 shadow-[0_8px_30px_rgba(15,61,46,0.08)] relative">
            
            {/* Cover Banner Area Wrapper with Overflow-Visible */}
            <div className="relative w-full overflow-visible">
              {/* Background Cover Banner */}
              <div className="relative w-full h-44 sm:h-56 md:h-64 lg:h-72 rounded-2xl sm:rounded-[1.8rem] overflow-hidden bg-[#0F3D2E]">
                {editedCaterer && isEditing ? (
                  editedCaterer.coverBanner ? (
                    <img
                      src={editedCaterer.coverBanner}
                      alt={targetCatererObj.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0F3D2E]/80 to-[#0A5A42]/80 flex items-center justify-center">
                      <ImageIcon className="text-[#DFC27A]/25 w-32 h-32" />
                    </div>
                  )
                ) : fallbackBanner ? (
                  <img
                    src={fallbackBanner}
                    alt={targetCatererObj.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0F3D2E]/80 to-[#0A5A42]/80 flex items-center justify-center">
                    <ImageIcon className="text-[#DFC27A]/25 w-32 h-32" />
                  </div>
                )}
                {/* Optional Subtle dark overlay to keep image legible */}
                <div className="absolute inset-0 bg-black/10" />

                {/* Heart/Wishlist Button mimicking Screenshot 1 */}
                <button
                  type="button"
                  className="absolute top-4 right-4 z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#FFFDFB]/95 hover:bg-[#FFFDFB] text-slate-700 hover:text-red-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md border border-[#E8DCC7] cursor-pointer"
                >
                  <Heart size={16} className="fill-none stroke-current" />
                </button>

                {/* "Change Cover" overlay button inside edit mode */}
                {isOwnerOrAdmin && isEditing && (
                  <label className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full font-bold transition-all border border-white/10 shadow-sm text-[11px] cursor-pointer font-sans">
                    Change Cover 🔒
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await convertFileToBase64(file);
                          setEditedCaterer({ ...editedCaterer, coverBanner: base64 });
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* LOGO block (Premium Rounded Circular Luxury Branding, Verified Badge) */}
              <div 
                id="profile-logo-container"
                className="absolute left-[20px] sm:left-[28px] lg:left-[36px] -bottom-[60px] sm:-bottom-[80px] lg:-bottom-[105px] z-40 font-sans select-none overflow-visible"
              >
                <div className="w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:w-[160px] lg:h-[160px] bg-[#FFFDFB] rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.18)] border-[3px] border-[#D4AF37] flex flex-col items-center justify-center relative group overflow-visible">
                  <div className="w-full h-full bg-[#FFFDFB] flex flex-col items-center justify-center relative rounded-full overflow-hidden">
                    {editedCaterer && isEditing ? (
                      <>
                        {editedCaterer.logo ? (
                          <img
                            src={editedCaterer.logo}
                            alt="Logo"
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-3 bg-[#051410] w-full h-full rounded-full">
                            <div className="border border-[#D4AF37]/40 rounded-full p-2 flex flex-col items-center justify-center">
                              <span className="font-serif font-semibold text-[#D4AF37] text-md sm:text-lg uppercase tracking-wider">
                                {editedCaterer.brandName?.substring(0, 2) || "RF"}
                              </span>
                            </div>
                            <span className="text-[#D4AF37] text-[8px] sm:text-[9px] font-bold font-sans uppercase mt-2 leading-tight tracking-wider">No Logo</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white text-[10px] font-bold uppercase cursor-pointer text-center p-2 font-sans opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                          <span>Upload 🔒</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const base64 = await convertFileToBase64(file);
                                setEditedCaterer({ ...editedCaterer, logo: base64 });
                              }
                            }}
                          />
                        </label>
                      </>
                    ) : targetCatererObj.logo ? (
                      <img
                        src={targetCatererObj.logo}
                        alt="Logo"
                        className="w-full h-full object-cover object-center rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      // Gorgeous luxury default crest inside the circle
                      <div className="flex flex-col items-center justify-center text-center bg-[#051410] w-full h-full p-2.5 sm:p-4 select-none rounded-full">
                        <div className="flex flex-col items-center justify-center">
                          {/* Crown Icon */}
                          <p className="text-[#D4AF37] text-xs sm:text-sm lg:text-base mb-0.5">👑</p>
                          <div className="w-8 h-8 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-full border border-[#D4AF37]/40 flex items-center justify-center relative shadow-inner">
                            <span className="font-serif font-bold text-[#D4AF37] text-xs sm:text-sm lg:text-base tracking-wider">
                              {targetCatererObj.brandName?.substring(0, 2) || targetCatererObj.name?.substring(0, 2) || "RF"}
                            </span>
                          </div>
                          <span className="font-serif font-semibold text-[#D4AF37] text-[8px] sm:text-[9px] lg:text-[10px] uppercase tracking-widest leading-tight mt-1 truncate max-w-[70px] sm:max-w-[90px] lg:max-w-[120px]">
                            {targetCatererObj.brandName || targetCatererObj.name || "Royal"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Elegant Gold Verified shield tag on the bottom-right of the circular card */}
                  {targetCatererObj.status === "Approved" && (
                    <div
                      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-white p-1 rounded-full shadow-md border border-[#FFFDFB] select-none w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center z-50 animate-pulse"
                      title="Verified Caterer"
                    >
                      <Check className="text-white stroke-[4] w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overlapping Profile Details Row */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6 mt-1 flex-wrap">
              
              {/* Left & Center section container - always row aligned so spacer keeps details tidy */}
              <div className="flex flex-row items-start gap-4 sm:gap-6 md:gap-8 flex-1">
                
                {/* Responsive spacing matching the absolute-positioned logo to avoid text overlap */}
                <div className="shrink-0 w-[128px] sm:w-[160px] lg:w-[200px] h-1 select-none pointer-events-none" />

                {/* CENTER Identity Details */}
                <div className="flex-1 text-left mt-3 sm:mt-5">
                  {isEditing ? (
                    <div className="space-y-3 font-sans w-full max-w-xl text-slate-800">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
                          Brand Public Name (Non-Sensitive)
                        </span>
                        <input
                          type="text"
                          value={editedCaterer.brandName || ""}
                          onChange={(e) => setEditedCaterer({ ...editedCaterer, brandName: e.target.value })}
                          className="bg-white border border-[#DFC27A] rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none w-full focus:border-[#D4AF37]"
                          placeholder="Public Brand Name"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono flex items-center gap-1">
                          Legal Business Name (Sensitive 🔒) <ShieldCheck size={11} className="text-[#DEAA38]" />
                        </span>
                        <input
                          type="text"
                          value={editedCaterer.businessName || ""}
                          onChange={(e) => setEditedCaterer({ ...editedCaterer, businessName: e.target.value })}
                          className="bg-white border border-[#DFC27A] rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none w-full focus:border-[#D4AF37]"
                          placeholder="Legal Business Name"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
                          Brand Tagline (Non-Sensitive)
                        </span>
                        <input
                          type="text"
                          value={editedCaterer.tagline || ""}
                          onChange={(e) => setEditedCaterer({ ...editedCaterer, tagline: e.target.value })}
                          className="bg-white border border-[#DFC27A] rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none w-full focus:border-[#D4AF37]"
                          placeholder="Brand Tagline"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
                          Official HQ Address (Non-Sensitive)
                        </span>
                        <input
                          type="text"
                          value={editedCaterer.address || editedCaterer.location || ""}
                          onChange={(e) => setEditedCaterer({ ...editedCaterer, address: e.target.value, location: e.target.value })}
                          className="bg-white border border-[#DFC27A] rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none w-full focus:border-[#D4AF37]"
                          placeholder="HQ Address / Area"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
                          Contact Phone (Non-Sensitive)
                        </span>
                        <input
                          type="text"
                          value={editedCaterer.phone || ""}
                          onChange={(e) => setEditedCaterer({ ...editedCaterer, phone: e.target.value })}
                          className="bg-white border border-[#DFC27A] rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none w-full focus:border-[#D4AF37]"
                          placeholder="Phone or Mobile Number"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col font-sans text-left">
                      <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3">
                        <h1 className="text-2xl sm:text-3xl md:text-3.5xl lg:text-4xl font-display font-semibold text-[#173D32] tracking-tight leading-tight select-text">
                          {targetCatererObj.brandName || targetCatererObj.name || targetCatererObj.businessName}
                        </h1>
                        {targetCatererObj.status === "Approved" && (
                          <span
                            className="inline-flex items-center gap-1 bg-[#FAF4EE] text-[#D4AF37] border border-[#DFC27A] rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest select-none align-middle"
                            title="Verified and vetted"
                          >
                            Verified
                          </span>
                        )}
                      </div>
                      {targetCatererObj.tagline && (
                        <p className="text-[#D4AF37]/90 text-[10px] sm:text-[11px] font-semibold tracking-[0.15em] uppercase mt-1 px-1">
                          ✦ {targetCatererObj.tagline}
                        </p>
                      )}

                      {/* Premium rating & detail strip aligned beautifully with Screenshot 1 */}
                      <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1.5 mt-3 text-xs font-sans text-[#555555]">
                        {targetCatererObj.rating && (
                          <div className="flex items-center gap-1 font-bold">
                            <span className="text-[#D4AF37] text-sm">★</span>
                            <span className="text-slate-900 font-extrabold">{targetCatererObj.rating}</span>
                            {targetCatererObj.reviewCount && (
                              <span className="text-[#8A8A8A] font-medium font-sans ml-0.5 hover:underline cursor-pointer" onClick={() => handleTabClick("Reviews")}>
                                ({targetCatererObj.reviewCount} Reviews)
                              </span>
                            )}
                          </div>
                        )}
                        {targetCatererObj.rating && targetCatererObj.eventsCompleted && (
                          <span className="text-slate-300">|</span>
                        )}
                        {targetCatererObj.eventsCompleted && (
                          <span className="text-slate-700 font-semibold font-sans flex items-center gap-1">
                            <span className="text-[#0F3D2E]">🎉</span> {targetCatererObj.eventsCompleted}+ Events Completed
                          </span>
                        )}
                      </div>

                      {/* Location HQ */}
                      <div className="flex items-center justify-start gap-1.5 text-[#555555] font-medium text-xs mt-2 transition-colors font-sans">
                        <MapPin size={13} className="text-[#D4AF37] shrink-0" />
                        <span>{targetCatererObj.address || targetCatererObj.location}</span>
                      </div>

                      {/* Experience indicator */}
                      {targetCatererObj.experience && (
                        <div className="flex items-center justify-start gap-1.5 text-[#555555] font-semibold text-xs mt-1.5 font-sans">
                          <Award size={13} className="text-[#D4AF37] shrink-0" />
                          <span>{targetCatererObj.experience}+ Years of Experience</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT BLOCK (Pricing card, Customizable Packages & prominent BOOK NOW button) */}
              {(() => {
                const computedLowestPrice = packageTiers.length > 0 
                  ? Math.min(...packageTiers.map(p => typeof p.price === 'number' && !isNaN(p.price) ? p.price : 299)) 
                  : (targetCatererObj.startingPrice || 299);
                return (
                  <div className="w-full lg:w-72 shrink-0 flex flex-col justify-between gap-3 self-center lg:self-stretch mt-4 lg:mt-0 font-sans relative z-10">
                    
                    {/* Micro-Pricing Card */}
                    <div className="bg-[#FFFDFB] border border-[#E8DCC7] rounded-3xl p-5 flex flex-col justify-center shadow-[0_8px_30px_rgba(15,61,46,0.08)] relative">
                      <span className="text-[10px] text-[#8A8A8A] font-bold uppercase tracking-widest mb-1 font-sans">Starting from</span>
                      
                      <div className="flex items-baseline gap-1 mt-1">
                        <span 
                          className="text-4xl text-[#D4AF37]"
                          style={{
                            fontFamily: '"Cormorant Garamond", "Playfair Display", "Georgia", serif',
                            fontWeight: 600,
                          }}
                        >
                          ₹{computedLowestPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-[#555555] font-medium ml-1">/ Plate</span>
                      </div>

                      <div className="h-[1px] bg-[#E8DCC7]/60 my-3 w-full"></div>

                      <div className="flex items-center gap-1.5 text-[10px] text-[#555555] font-bold uppercase tracking-wider">
                        <Package size={13} className="text-[#D4AF37] shrink-0" />
                        <span>Customizable Packages</span>
                      </div>
                    </div>

                    {/* Prominent EMERALD BOOK NOW CTA button */}
                    <button
                      onClick={() => {
                        document
                          .getElementById("menu-packages")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="w-full px-5 py-3.5 text-white font-extrabold tracking-widest text-[11px] uppercase rounded-2xl bg-[#0F3D2E] border border-[#DFC27A]/40 shadow-[0_8px_30px_rgba(15,61,46,0.15)] flex items-center justify-center gap-2.5 transition-all duration-300 hover:bg-[#0A5A42] hover:scale-[1.02] active:scale-95 group/btn cursor-pointer font-sans"
                    >
                      <BookOpen
                        size={14}
                        className="text-[#D4AF37] group-hover/btn:scale-110 transition-transform"
                      />
                      <span>BOOK NOW</span>
                    </button>

                  </div>
                );
              })()}

            </div>

          </div>
        </div>

        {/* SECTION 1.5: TABS BAR SYSTEM (Cream Palette - Compact & Pro spacing matching Screenshot 1) */}
        <div className="max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6 relative z-30 font-sans">
          <div className="bg-white p-2 rounded-2xl border border-[#E8DCC7]/80 flex flex-wrap md:flex-nowrap gap-1.5 shadow-[0_4px_25px_rgba(15,61,46,0.04)] overflow-x-auto no-scrollbar justify-start md:justify-center w-full">
            {[
              "Overview",
              "Packages",
              "Menu",
              "Gallery",
              "Reviews",
              "About Us",
            ].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "px-6 py-3 rounded-xl font-bold text-xs tracking-wide uppercase whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer border",
                    isActive
                      ? "bg-[#0F3D2E] text-white border-[#D4AF37] shadow-[0_4px_12px_rgba(15,61,46,0.15)] scale-[1.01]"
                      : "bg-transparent text-slate-600 hover:text-[#0F3D2E] hover:bg-[#FAF6EC]/50 border-transparent",
                  )}
                >
                  {tab === "Overview" && (
                    <LayoutGrid
                      size={14}
                      className={cn(isActive ? "text-[#D4AF37]" : "text-slate-400")}
                    />
                  )}
                  {tab === "Packages" && (
                    <Package
                      size={14}
                      className={cn(isActive ? "text-[#D4AF37]" : "text-slate-400")}
                    />
                  )}
                  {tab === "Menu" && (
                    <MenuSquare
                      size={14}
                      className={cn(isActive ? "text-[#D4AF37]" : "text-slate-400")}
                    />
                  )}
                  {tab === "Gallery" && (
                    <ImageIcon
                      size={14}
                      className={cn(isActive ? "text-[#D4AF37]" : "text-slate-400")}
                    />
                  )}
                  {tab === "Reviews" && (
                    <Star
                      size={14}
                      className={cn(isActive ? "text-[#D4AF37]" : "text-slate-400")}
                    />
                  )}
                  {tab === "About Us" && (
                    <User
                      size={14}
                      className={cn(isActive ? "text-[#D4AF37]" : "text-slate-400")}
                    />
                  )}
                  <span>{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

      <div className="max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 relative z-30">
        <div className="grid grid-cols-1 gap-6 items-start my-6">
          {/* LEFT COLUMN (72% width) */}
          <div className="flex flex-col gap-6 w-full">
            {/* SECTION 2: REDESIGNED LUXURY CARDS SYSTEM - TWO-COLUMN BENTO */}
            <div id="overview-section" className="scroll-mt-24">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
                
                {/* Left 2 Columns: About Us & Services We Offer */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  <AboutCatererCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                    experienceVal={experienceVal}
                  />

                  <ServicesOfferCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    newServiceTitle={newServiceTitle}
                    setNewServiceTitle={setNewServiceTitle}
                    newServiceDesc={newServiceDesc}
                    setNewServiceDesc={setNewServiceDesc}
                    newServiceImage={newServiceImage}
                    setNewServiceImage={setNewServiceImage}
                    newServiceIcon={newServiceIcon}
                    setNewServiceIcon={setNewServiceIcon}
                    setIsAddServiceModalOpen={setIsAddServiceModalOpen}
                    CrownOrnament={CrownOrnament}
                  />

                  <FoodGalleryCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                    convertFileToBase64={convertFileToBase64}
                  />

                  <MenuPackagesCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                  />

                  {/* TESTIMONIALS & REVIEWS SECTION */}
                  <ReviewsCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                    reviews={DEMO_REVIEWS.filter(
                      (r) => r.catererId === caterer.id || r.catererId === String(caterer.id)
                    )}
                  />

                  <AdditionalMediaCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                  />

                  {/* SECTION 5: CONTACT PROTECTION NOTICE */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm w-full text-left">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex flex-shrink-0 items-center justify-center text-amber-600">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h4 className="font-bold text-amber-900 mb-1 text-xl">
                        Privacy Protected Contact
                      </h4>
                      <p className="text-amber-800 font-medium">
                        To protect caterer confidentiality, direct contact details
                        (Phone & WhatsApp) will be securely shared only after your
                        order is confirmed.
                      </p>
                    </div>
                    {user?.role === "admin" && (
                      <div className="flex gap-4 items-center border-t md:border-t-0 md:border-l border-amber-200 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                        <div className="text-amber-900 font-bold flex flex-col font-sans">
                          <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">
                            Admin View
                          </span>
                          <span className="flex items-center gap-2">
                            <Phone size={14} /> {caterer.phone}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  </div> {/* Closes Left 2 Columns wrapper: lg:col-span-2 flex flex-col gap-6 */}

                {/* Right Column: Service Areas, Operating Hours, Achievements, and Branches Details */}
                <div className="lg:col-span-1 flex flex-col gap-6 w-full">
                  <BranchDetailsCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                  />
                  <ServiceAreasCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                  />

                  <ContactInfoCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                  />

                  <OperatingHoursCard
                    caterer={caterer}
                    editedCaterer={editedCaterer}
                    setEditedCaterer={setEditedCaterer}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    handleSaveChanges={handleSaveChanges}
                    targetCatererObj={targetCatererObj}
                    allGalleryPhotos={allGalleryPhotos}
                    openLightbox={openLightbox}
                    guestCount={guestCount}
                    setGuestCount={setGuestCount}
                    packageTiers={packageTiers}
                    awardsList={awardsList}
                    certificationsList={certificationsList}
                    achievementsList={achievementsList}
                    user={user}
                    CrownOrnament={CrownOrnament}
                  />

                <AchievementsCard
                  caterer={caterer}
                  editedCaterer={editedCaterer}
                  setEditedCaterer={setEditedCaterer}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  isOwnerOrAdmin={isOwnerOrAdmin}
                  handleSaveChanges={handleSaveChanges}
                  targetCatererObj={targetCatererObj}
                  allGalleryPhotos={allGalleryPhotos}
                  openLightbox={openLightbox}
                  guestCount={guestCount}
                  setGuestCount={setGuestCount}
                  packageTiers={packageTiers}
                  awardsList={awardsList}
                  certificationsList={certificationsList}
                  achievementsList={achievementsList}
                  user={user}
                  CrownOrnament={CrownOrnament}
                />

              <AwardsCertsCard
                caterer={caterer}
                editedCaterer={editedCaterer}
                setEditedCaterer={setEditedCaterer}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isOwnerOrAdmin={isOwnerOrAdmin}
                handleSaveChanges={handleSaveChanges}
                targetCatererObj={targetCatererObj}
                allGalleryPhotos={allGalleryPhotos}
                openLightbox={openLightbox}
                guestCount={guestCount}
                setGuestCount={setGuestCount}
                packageTiers={packageTiers}
                awardsList={awardsList}
                certificationsList={certificationsList}
                achievementsList={achievementsList}
                user={user}
                CrownOrnament={CrownOrnament}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> {/* closes live preview panel */}
      </div>
  );
}

// Support Icon Helper Component inline
function GiftIcon({ size, strokeWidth, className }: any) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
  );
}
