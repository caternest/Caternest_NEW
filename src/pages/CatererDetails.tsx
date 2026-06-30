import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
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
  Bell,
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
  GripVertical,
  Trophy,
  Clipboard,
} from "lucide-react";
import { DEMO_REVIEWS, DEMO_CATERERS } from "../data";
import { cn, compressImageFile, getCatererSlug } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { getSupabase, uploadToSupabaseBucket } from "../lib/supabase";
import { toast } from "../components/Toast";
import { Trophy as TrophyIcon, Award as AwardIcon, Users as UsersIcon, Clipboard as ClipboardIcon, ChefHat as ChefHatIcon, Star as StarIcon } from "lucide-react";

export const DEFAULT_ACHIEVEMENTS = [
  { value: "400+", title: "Events Completed", icon: "trophy" },
  { value: "15+", title: "Years Experience", icon: "award" },
  { value: "2500+", title: "Happy Customers", icon: "users" },
  { value: "120+", title: "Menu Items", icon: "clipboard" },
  { value: "75+", title: "Premium Events Served", icon: "chef-hat" },
  { value: "4.9", title: "Average Rating", icon: "star" }
];

export const achievementIconsMap: Record<string, any> = {
  "trophy": TrophyIcon,
  "award": AwardIcon,
  "users": UsersIcon,
  "clipboard": ClipboardIcon,
  "chef-hat": ChefHatIcon,
  "star": StarIcon
};

export const AVAILABLE_ICONS = [
  { key: "trophy", label: "Events Completed", emoji: "🍽️" },
  { key: "award", label: "Years Experience", emoji: "👨‍🍳" },
  { key: "users", label: "Happy Customers", emoji: "😊" },
  { key: "clipboard", label: "Menu Items", emoji: "📋" },
  { key: "chef-hat", label: "Premium Events Served", emoji: "🏆" },
  { key: "star", label: "Average Rating", emoji: "⭐" }
];
import {
  AboutCatererCard,
  ServicesOfferCard,
  FoodGalleryCard,
  MenuPackagesCard,
  BranchDetailsCard,
  ServiceAreasCard,
  ContactSidebarCard,
  QuickInfoCard,
  AchievementsCard
} from "../components/PremiumCatererSections";
import { MapPickerModal } from "../components/MapPickerModal";
import { AddressAutocomplete } from "../components/AddressAutocomplete";

// Highly polished, realistic decorative crown vector asset to perfectly mimic the image design
const CrownOrnament = ({
  theme,
  size = 64,
}: {
  theme: "silver" | "gold" | "platinum" | "premium" | "royal" | "grand";
  size?: number;
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

  const topOffset = Math.round(size * 0.36);

  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none pointer-events-none"
      style={{ top: `-${topOffset}px` }}
    >
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
        width={size}
        height={Math.round(size * 0.68)}
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

const getHeroIconComponent = (iconName: string, defaultIcon: any) => {
  const icons: Record<string, any> = {
    ChefHat: ChefHat,
    Award: Award,
    MapPin: MapPin,
    Location: MapPin,
    Briefcase: Briefcase,
    Sparkles: Sparkles,
    Users: Users,
    Clock: Clock,
    Heart: Heart,
    Trophy: Trophy,
  };
  return icons[iconName] || defaultIcon;
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
  const location = useLocation();
  const [caterer, setCaterer] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaterer, setEditedCaterer] = useState<any>(null);
  const [activeBranchIndexForMap, setActiveBranchIndexForMap] = useState<number | 'hq' | null>(null);

  // Premium Unified Modal states
  const [activeEditSection, setActiveEditSection] = useState<string | null>(null);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | number | null>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);

  const openEditModal = (section: string) => {
    let sec = section;
    if (section === "food_gallery") sec = "gallery";
    if (section === "branch_details") sec = "branches";
    if (section === "service_areas") sec = "areas";

    const currentGallery = caterer?.galleryPhotos || caterer?.gallery || caterer?.images || [];
    const currentPackages = caterer?.menuPackages || caterer?.packages || [];
    const currentServices = caterer?.services || DEFAULT_SERVICES;
    const currentAwards = caterer?.awards || [];
    const currentCertifications = caterer?.certifications || [];
    const currentSpecializations = caterer?.specializations || [];

    // Construct clean list of existing branches with Name & Address
    const primaryLocation = caterer?.address || caterer?.location || "Hyderabad, Telangana";
    const rawBranchesVal = caterer?.branches !== undefined && caterer?.branches !== null
      ? parseInt(caterer.branches.toString())
      : 2;
    const branchesVal = isNaN(rawBranchesVal) || rawBranchesVal <= 0 ? 2 : rawBranchesVal;

    let defaultBranches = [];
    defaultBranches.push({
      name: primaryLocation.includes("Hyderabad") ? "Hyderabad Head Office" : `${primaryLocation.split(",")[0]} Head Office`,
      address: primaryLocation
    });
    if (branchesVal >= 2) {
      defaultBranches.push({
        name: "Secunderabad Branch",
        address: "Paradise Circle, Secunderabad"
      });
    }
    if (branchesVal >= 3) {
      defaultBranches.push({
        name: "Gachibowli Branch",
        address: "Gachibowli, Hyderabad"
      });
    }

    const currentBranchesList = caterer?.branchesList && caterer.branchesList.length > 0
      ? caterer.branchesList.map((b: any) => ({
          name: b.name || "",
          address: b.address || b.location || "Madhapur, Hyderabad"
        }))
      : defaultBranches;

    const rawAreas = caterer?.serviceAreas;
    let normalizedAreas: string[] = [];
    if (rawAreas) {
      if (Array.isArray(rawAreas)) {
        normalizedAreas = [...rawAreas];
      } else if (typeof rawAreas === "string") {
        if (rawAreas.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(rawAreas);
            if (Array.isArray(parsed)) {
              normalizedAreas = parsed;
            }
          } catch (e) {
            // fallback
          }
        }
        if (normalizedAreas.length === 0) {
          normalizedAreas = rawAreas.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }

    const rawAchievements = caterer?.achievements;
    let achievementsList: any[] = [];
    if (Array.isArray(rawAchievements) && rawAchievements.length > 0) {
      achievementsList = rawAchievements;
    } else if (typeof rawAchievements === "string" && rawAchievements.trim().startsWith("[")) {
      try {
        achievementsList = JSON.parse(rawAchievements);
      } catch (e) {
        achievementsList = DEFAULT_ACHIEVEMENTS;
      }
    } else if (typeof rawAchievements === "string" && rawAchievements.trim() !== "") {
      achievementsList = rawAchievements.split(",").map(item => {
        const parts = item.trim().split(" ");
        const val = parts[0] || "10+";
        const lbl = parts.slice(1).join(" ") || "Successful Events";
        return { value: val, title: lbl, icon: "award" };
      });
    } else {
      achievementsList = DEFAULT_ACHIEVEMENTS;
    }

    setEditedCaterer({
      ...caterer,
      gallery: currentGallery,
      menuPackages: currentPackages,
      packages: currentPackages,
      services: currentServices,
      awards: currentAwards,
      certifications: currentCertifications,
      specializations: currentSpecializations,
      branchesList: currentBranchesList,
      serviceAreas: normalizedAreas,
      achievementsList: achievementsList,
      achievements: achievementsList,
    });
    
    setNewAreaInput("");
    
    // Reset selection sub-states
    setSelectedPackageId(null);
    setSelectedServiceIndex(null);
    
    setActiveEditSection(sec);
  };

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
        
        // Map keys to match the exact database columns in "caterer_registrations"
        if (cleanedPayload.name !== undefined) {
          cleanedPayload.businessName = cleanedPayload.name;
          delete cleanedPayload.name;
        }
        if (cleanedPayload.fssai !== undefined) {
          cleanedPayload.fssaiNumber = cleanedPayload.fssai;
          delete cleanedPayload.fssai;
        }
        if (cleanedPayload.gst !== undefined) {
          cleanedPayload.gstNumber = cleanedPayload.gst;
          delete cleanedPayload.gst;
        }
        if (cleanedPayload.pan !== undefined) {
          cleanedPayload.panNumber = cleanedPayload.pan;
          delete cleanedPayload.pan;
        }
        if (cleanedPayload.ownerName !== undefined && cleanedPayload.owner === undefined) {
          cleanedPayload.owner = cleanedPayload.ownerName;
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

  useEffect(() => {
    if (location.state?.fromOrder) {
      if (location.state.guests !== undefined) {
        setGuestCount(location.state.guests);
      }
      setActiveTab("Packages");
      setTimeout(() => {
        const element = document.getElementById("menu-packages");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);
    }
  }, [location.state]);
  const [builderTab, setBuilderTab] = useState<"branding" | "highlights" | "location" | "gallery">("branding");
  const [mobileEditorView, setMobileEditorView] = useState<"editor" | "preview">("editor");

  // Mobile-specific UX states
  const [isBranchesOpen, setIsBranchesOpen] = useState(false);
  const [isAreasOpen, setIsAreasOpen] = useState(false);
  const [mobileGalleryIndex, setMobileGalleryIndex] = useState(0);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedDetailPkg, setSelectedDetailPkg] = useState<any | null>(null);

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
        id: pkg.id !== undefined && pkg.id !== null ? pkg.id : idx,
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
        type: pkg.packageType === "Veg" ? "veg" : (pkg.packageType === "Non-Veg" ? "nonVeg" : "veg"),
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
        categories: pkg.categories || ["Welcome Drinks", "Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts"],
        items: pkg.items || ["Mocktail Selection", "Paneer Tikka / Veg Kebab", "Special Paneer Curry / Veg Jaipuri", "Assorted Roti & Naan", "Veg Dum Biryani with Raita", "Double Ka Meetha / Gulab Jamun"],
        buttonText: pkg.buttonText || "View Details",
        selectItems:
          themeIndex < 3 ? "Select Any 1 Item" : "Select Any 2 Items",
        theme: pkg.cardTheme || theme,
        desc: pkg.description || `Special selection for your guests.`,
        popular: pkg.popular || themeIndex === 4,
        visible: pkg.visible !== false,
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
        categories: ["Welcome Drinks", "Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts"],
        items: ["Mocktail Selection", "Paneer Tikka / Veg Kebab", "Special Paneer Curry / Veg Jaipuri", "Assorted Roti & Naan", "Veg Dum Biryani with Raita", "Double Ka Meetha / Gulab Jamun"],
        buttonText: "View Details",
        selectItems: "Select Any 1 Item",
        theme: "silver",
        desc: "Simple & elegant vegetarian spread for family gatherings.",
        visible: true,
      },
      {
        id: "v_gold",
        name: "Gold Package",
        type: "veg",
        price: (caterer.startingPrice || 350) + 100,
        guests: 150,
        categoriesCount: 7,
        categories: ["Welcome Drinks", "Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts", "Salads"],
        items: ["Mocktail Selection", "Paneer Tikka / Veg Kebab", "Special Paneer Curry / Veg Jaipuri", "Assorted Roti & Naan", "Veg Dum Biryani with Raita", "Double Ka Meetha / Gulab Jamun", "Fresh Salads"],
        buttonText: "View Details",
        selectItems: "Select Any 1 Item",
        theme: "gold",
        desc: "Slightly richer premium veg spread with extra paneer delicacies.",
        visible: true,
      },
      {
        id: "v_platinum",
        name: "Platinum Package",
        type: "veg",
        price: (caterer.startingPrice || 350) + 250,
        guests: 200,
        categoriesCount: 8,
        categories: ["Welcome Drinks", "Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts", "Salads", "Soups"],
        items: ["Mocktail Selection", "Paneer Tikka / Veg Kebab", "Special Paneer Curry / Veg Jaipuri", "Assorted Roti & Naan", "Veg Dum Biryani with Raita", "Double Ka Meetha / Gulab Jamun", "Fresh Salads", "Hot & Sour Soup"],
        buttonText: "View Details",
        selectItems: "Select Any 1 Item",
        theme: "platinum",
        desc: "Ultra luxury premium veg spread for signature events.",
        visible: true,
      },
      {
        id: "nv_premium",
        name: "Premium Package",
        type: "nonVeg",
        price: (caterer.startingPrice || 350) + 450,
        guests: 150,
        categoriesCount: 10,
        categories: ["Welcome Drinks", "Starters (Veg)", "Starters (Non-Veg)", "Mains (Veg)", "Mains (Non-Veg)", "Breads", "Rice & Biryani", "Desserts", "Salads", "Accompaniments"],
        items: ["Mocktail Selection", "Paneer Tikka", "Chicken Tikka", "Veg Curry", "Butter Chicken", "Assorted Bread", "Chicken Biryani", "Ice Cream with Gulab Jamun", "Green Salad", "Raita / Mirchi Ka Salan"],
        buttonText: "View Details",
        selectItems: "Select Any 2 Items",
        theme: "premium",
        desc: "Classic non-veg catering with double choice meat courses.",
        visible: true,
      },
      {
        id: "nv_royal",
        name: "Royal Package",
        type: "nonVeg",
        price: (caterer.startingPrice || 350) + 750,
        guests: 200,
        categoriesCount: 12,
        categories: ["Welcome Drinks", "Soups", "Starters (Veg)", "Starters (Non-Veg)", "Mains (Veg)", "Mains (Non-Veg)", "Breads", "Rice & Biryani", "Desserts", "Salads", "Accompaniments", "Live Counter"],
        items: ["Mocktails & Juices", "Tomato Soup", "Paneer Tikka", "Mutton Seekh Kebab", "Dal Makhani", "Mutton Rogan Josh", "Naan / Roti", "Royal Mutton Biryani", "Double Ka Meetha", "Chef Salad", "Raita / Salan", "Live Chat Counter"],
        buttonText: "View Details",
        selectItems: "Select Any 2 Items",
        theme: "royal",
        desc: "Exquisite regal non-veg banquet for elite wedding celebrations.",
        popular: true,
        visible: true,
      },
      {
        id: "nv_grand",
        name: "Grand Royal",
        type: "nonVeg",
        price: (caterer.startingPrice || 350) + 1150,
        guests: 250,
        categoriesCount: 14,
        categories: ["Welcome Drinks", "Soups", "Starters (Veg)", "Starters (Non-Veg)", "Mains (Veg)", "Mains (Non-Veg)", "Breads", "Rice & Biryani", "Desserts", "Salads", "Accompaniments", "Live Counter", "Ice Cream", "Exotic Fruits"],
        items: ["Mocktails, Juices, Tea", "Sweetcorn Soup", "Paneer Tikka", "Fish Tikka", "Dal Bukhara", "Fish Curry", "Mutton Dum Biryani", "Kala Jamun with Kulfi", "Assorted Salads", "Raita / Salan", "Live Tandoor Counter", "Fresh Fruits Bowl"],
        buttonText: "View Details",
        selectItems: "Select Any 2 Items",
        theme: "grand",
        desc: "The ultimate royal banquet with exotic seafood, mutton, and dessert options.",
        visible: true,
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
  if (Array.isArray(rawAchievements) && rawAchievements.length > 0) {
    achievementsList = rawAchievements;
  } else if (typeof rawAchievements === "string" && rawAchievements.trim().startsWith("[")) {
    try {
      achievementsList = JSON.parse(rawAchievements);
    } catch (e) {
      achievementsList = DEFAULT_ACHIEVEMENTS;
    }
  } else if (typeof rawAchievements === "string" && rawAchievements.trim() !== "") {
    achievementsList = rawAchievements.split(",").map(item => {
      const parts = item.trim().split(" ");
      const val = parts[0] || "10+";
      const lbl = parts.slice(1).join(" ") || "Successful Events";
      return { value: val, title: lbl, icon: "award" };
    });
  } else if (targetCatererObj.achievementsList && Array.isArray(targetCatererObj.achievementsList) && targetCatererObj.achievementsList.length > 0) {
    achievementsList = targetCatererObj.achievementsList;
  } else {
    achievementsList = DEFAULT_ACHIEVEMENTS;
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

  const primaryLocation = targetCatererObj.address || targetCatererObj.location || "Hyderabad, Telangana";
  const numBranches = branchesVal && !isNaN(branchesVal) && branchesVal > 0 ? branchesVal : 3;

  const defaultBranchesList = [
    {
      name: primaryLocation.includes("Hyderabad") ? "Hyderabad Head Office" : `${primaryLocation.split(",")[0]} Head Office`,
      address: primaryLocation
    }
  ];
  if (numBranches >= 2) {
    defaultBranchesList.push({
      name: "Secunderabad Branch",
      address: "Paradise Circle, Secunderabad"
    });
  }
  if (numBranches >= 3) {
    defaultBranchesList.push({
      name: "Gachibowli Branch",
      address: "Gachibowli, Hyderabad"
    });
  }
  if (numBranches > 3) {
    const defaultLocalities = ["Kondapur", "Jubilee Hills", "Banjara Hills", "Madhapur", "Begumpet"];
    for (let i = 4; i <= numBranches; i++) {
      const locality = defaultLocalities[(i - 4) % defaultLocalities.length];
      defaultBranchesList.push({
        name: `${locality} Branch`,
        address: `${locality}, Hyderabad`
      });
    }
  }

  const branchesToShow = targetCatererObj.branchesList || defaultBranchesList;

  const rawServiceAreas = targetCatererObj.serviceAreas;
  const areas: string[] = (() => {
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
        } catch (e) {}
      }
      return rawServiceAreas
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    return [];
  })();

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
                <AddressAutocomplete
                  value={editedCaterer.address || ""}
                  onChange={(val) => setEditedCaterer({ ...editedCaterer, address: val })}
                  onSelect={(data) => {
                    setEditedCaterer({
                      ...editedCaterer,
                      address: data.address,
                      latitude: data.latitude,
                      longitude: data.longitude
                    });
                  }}
                  className="bg-black/40 border border-emerald-900/40 rounded-xl px-4 py-3 text-xs text-white/95 placeholder:text-white/20 outline-none focus:border-[#DEAA38] transition font-sans"
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  theme="gold"
                  leftIcon={<MapPin className="text-[#DEAA38] w-4 h-4 hover:text-[#E5C158] transition-colors" />}
                  onIconClick={() => setActiveBranchIndexForMap('hq')}
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string, subIndex?: number, subField?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertFileToBase64(file);
        if (subIndex !== undefined && subField !== undefined) {
          if (field === "services") {
            const list = [...(editedCaterer.services || [])];
            list[subIndex] = { ...list[subIndex], [subField]: base64 };
            setEditedCaterer({ ...editedCaterer, services: list });
          } else if (field === "menuPackages") {
            const list = [...(editedCaterer.menuPackages || [])];
            list[subIndex] = { ...list[subIndex], [subField]: base64 };
            setEditedCaterer({ ...editedCaterer, menuPackages: list });
          }
        } else {
          setEditedCaterer({ ...editedCaterer, [field]: base64 });
        }
        toast("Image uploaded & processed successfully!", "success");
      } catch (err) {
        toast("Failed to process image file", "error");
      }
    }
  };

  const handleSaveFields = async (fieldsPayload: any) => {
    try {
      console.log("[FIELDS SAVE] Starting save for fields:", fieldsPayload);
      
      // 1. Immediately update local React state so the UI updates instantly
      const updatedCaterer = { ...caterer, ...fieldsPayload };
      setCaterer(updatedCaterer);
      
      if (editedCaterer) {
        setEditedCaterer({ ...editedCaterer, ...fieldsPayload });
      }

      // 2. Save to Supabase
      const supabase = getSupabase();
      if (supabase && caterer?.id) {
        const dbPayload: any = {};
        
        // Dynamically map all incoming fields from fieldsPayload to dbPayload safely
        Object.keys(fieldsPayload).forEach((key) => {
          if (fieldsPayload[key] !== undefined) {
            if (['experience', 'eventsCompleted', 'menuCount', 'branches', 'minGuests'].includes(key)) {
              dbPayload[key] = fieldsPayload[key] !== "" && fieldsPayload[key] !== null
                ? parseInt(fieldsPayload[key].toString())
                : null;
            } else if (key === 'rating') {
              dbPayload[key] = fieldsPayload[key] !== "" && fieldsPayload[key] !== null
                ? parseFloat(fieldsPayload[key].toString())
                : null;
            } else {
              dbPayload[key] = fieldsPayload[key];
            }
          }
        });

        if (Object.keys(dbPayload).length > 0) {
          console.log("[FIELDS SAVE] Supabase update payload:", dbPayload);
          const { error } = await supabase
            .from("caterer_registrations")
            .update(dbPayload)
            .eq("id", caterer.id);

          if (error) {
            console.error("[FIELDS SAVE] Supabase update error:", error);
            throw error;
          }
          console.log("[FIELDS SAVE] Supabase update successful.");
        } else {
          console.log("[FIELDS SAVE] Empty dbPayload, skipping Supabase update.");
        }
      }

      // 3. Update in LocalStorage to keep offline fallback sync'ed
      const rawRegistrations = localStorage.getItem("registrations");
      if (rawRegistrations) {
        try {
          const all = JSON.parse(rawRegistrations);
          const updated = all.map((c: any) => {
            if (c.id === caterer.id) {
              const merged = { ...c, ...fieldsPayload };
              if (fieldsPayload.experience !== undefined) merged.experience = fieldsPayload.experience;
              if (fieldsPayload.eventsCompleted !== undefined) merged.eventsCompleted = fieldsPayload.eventsCompleted;
              if (fieldsPayload.menuCount !== undefined) merged.menuCount = fieldsPayload.menuCount;
              if (fieldsPayload.rating !== undefined) merged.rating = fieldsPayload.rating;
              if (fieldsPayload.description !== undefined) merged.description = fieldsPayload.description;
              if (fieldsPayload.branchesList !== undefined) merged.branchesList = fieldsPayload.branchesList;
              if (fieldsPayload.branches !== undefined) merged.branches = fieldsPayload.branches;
              if (fieldsPayload.serviceAreas !== undefined) merged.serviceAreas = fieldsPayload.serviceAreas;
              return merged;
            }
            return c;
          });
          localStorage.setItem("registrations", JSON.stringify(updated));
          console.log("[FIELDS SAVE] LocalStorage copy updated successfully.");
        } catch (e) {
          console.error("[FIELDS SAVE] LocalStorage update error parsing/saving:", e);
        }
      }

      toast("Saved successfully!", "success");

      // 4. Force state alignment to guarantee UI updates
      const raw = localStorage.getItem("registrations");
      if (raw) {
        try {
          const allRegs = JSON.parse(raw);
          const found = allRegs.find((c: any) => c.id === caterer.id);
          if (found) {
            const mapped = {
              ...found,
              id: found.id,
              name: found.businessName,
              location: found.location || "Banjara Hills",
              type: found.type || "Veg + Non-Veg",
              startingPrice: 350,
              rating: found.rating || null,
              reviewCount: found.reviewCount || null,
              description: found.description || "Welcome to our premium catering service.",
              images: found.images || [],
              logo: found.logo || "",
              address: found.address || found.location || "Hyderabad, Telangana",
              phone: found.phone || "+91 98765 43210",
              menus: [],
              menuPackages: found.menuPackages || found.packages || [],
              packages: found.packages || found.menuPackages || [],
              menuItems: found.menuItems || [],
              coverBanner: found.coverBanner,
              ownerPhoto: found.ownerPhoto,
              ownerName: found.owner || "Business Owner",
              galleryPhotos: found.galleryPhotos || [],
              achievements: found.achievements,
              awards: found.awards,
              highlights: found.highlights || null,
              teamPhotos: found.teamPhotos || [],
              kitchenPhotos: found.kitchenPhotos || [],
              specializations: found.specializations || (found.serviceAreas ? [] : null),
              services: found.services || null,
              menuCount: found.menuCount || null,
              branchesList: found.branchesList || [],
              branches: found.branches || null,
              serviceAreas: found.serviceAreas || null,
            };
            setCaterer(mapped);
            setEditedCaterer({ ...mapped });
          }
        } catch (err) {
          console.error("[FIELDS SAVE] Refetch alignment error:", err);
        }
      }
    } catch (err: any) {
      console.error("[FIELDS SAVE] Failed to save fields:", err);
      toast(`Failed to save changes: ${err.message || err}`, "error");
    }
  };

  const handleSaveSection = async (sectionKey: string) => {
    setIsSavingSection(true);
    try {
      const payload: any = {};
      
      if (sectionKey === "hero") {
        payload.brandName = editedCaterer.brandName;
        payload.tagline = editedCaterer.tagline;
        payload.logo = editedCaterer.logo;
        payload.coverBanner = editedCaterer.coverBanner;
        if (editedCaterer.brandName) {
          payload.businessName = editedCaterer.brandName;
          payload.name = editedCaterer.brandName;
        }

        // Save Hero Info Cards
        payload.heroCard1Title = editedCaterer.heroCard1Title !== undefined ? editedCaterer.heroCard1Title : "Fine Dining";
        payload.heroCard1Text = editedCaterer.heroCard1Text !== undefined ? editedCaterer.heroCard1Text : "Premium Catering";
        payload.heroCard1Icon = editedCaterer.heroCard1Icon !== undefined ? editedCaterer.heroCard1Icon : "ChefHat";

        payload.heroCard2Value = editedCaterer.heroCard2Value !== undefined ? editedCaterer.heroCard2Value : (editedCaterer.experience ? (editedCaterer.experience.toString().includes("Year") ? editedCaterer.experience : `${editedCaterer.experience}+ Years`) : "20+ Years");
        payload.heroCard2Text = editedCaterer.heroCard2Text !== undefined ? editedCaterer.heroCard2Text : "Experience";
        payload.heroCard2Icon = editedCaterer.heroCard2Icon !== undefined ? editedCaterer.heroCard2Icon : "Award";

        payload.heroCard3Value = editedCaterer.heroCard3Value !== undefined ? editedCaterer.heroCard3Value : (editedCaterer.address || "Hyderabad, Telangana");
        payload.heroCard3Text = editedCaterer.heroCard3Text !== undefined ? editedCaterer.heroCard3Text : "Serving Across Telangana";
        payload.heroCard3Icon = editedCaterer.heroCard3Icon !== undefined ? editedCaterer.heroCard3Icon : "MapPin";
      } else if (sectionKey === "about") {
        payload.description = editedCaterer.description;
        payload.owner = editedCaterer.owner;
        payload.ownerPhoto = editedCaterer.ownerPhoto;
      } else if (sectionKey === "quick_info") {
        let specs = editedCaterer.specializations;
        if (typeof specs === "string") {
          specs = specs.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        payload.specializations = specs;
        payload.minGuests = editedCaterer.minGuests ? parseInt(editedCaterer.minGuests.toString()) : null;
        payload.priceRange = editedCaterer.priceRange;
        payload.bookingLeadTime = editedCaterer.bookingLeadTime;
        payload.responseTime = editedCaterer.responseTime;
        payload.established = editedCaterer.established;
      } else if (sectionKey === "statistics" || sectionKey === "stats") {
        payload.experience = editedCaterer.experience ? parseInt(editedCaterer.experience.toString()) : null;
        payload.eventsCompleted = editedCaterer.eventsCompleted ? parseInt(editedCaterer.eventsCompleted.toString()) : null;
      } else if (sectionKey === "branches" || sectionKey === "branch_details") {
        payload.branches = editedCaterer.branches ? parseInt(editedCaterer.branches.toString()) : null;
        payload.operatingHours = editedCaterer.operatingHours;
        payload.branchPhoto = editedCaterer.branchPhoto;
        payload.latitude = editedCaterer.latitude || null;
        payload.longitude = editedCaterer.longitude || null;
        payload.address = editedCaterer.address || null;
        if (editedCaterer.branchesList) {
          payload.branchesList = editedCaterer.branchesList;
        }
      } else if (sectionKey === "areas" || sectionKey === "service_areas") {
        const isEntire = !!editedCaterer.serveEntireHyderabad;
        const currentAreas = Array.isArray(editedCaterer.serviceAreas) ? editedCaterer.serviceAreas : [];
        if (!isEntire && currentAreas.length === 0) {
          toast("At least one service area is required when not serving Entire Hyderabad.", "error");
          setIsSavingSection(false);
          return;
        }
        payload.serveEntireHyderabad = isEntire;
        payload.serviceAreas = isEntire ? [] : currentAreas;
      } else if (sectionKey === "achievements") {
        payload.achievementsList = editedCaterer.achievementsList || [];
        payload.achievements = editedCaterer.achievementsList || [];
        
        let aw = editedCaterer.awards;
        if (typeof aw === "string") {
          aw = aw.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        let cert = editedCaterer.certifications;
        if (typeof cert === "string") {
          cert = cert.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
        payload.awards = aw;
        payload.certifications = cert;
      } else if (sectionKey === "services") {
        payload.services = editedCaterer.services;
      } else if (sectionKey === "gallery") {
        payload.gallery = editedCaterer.gallery;
        payload.galleryPhotos = editedCaterer.gallery;
        payload.images = editedCaterer.gallery;
      } else if (sectionKey === "menu_packages") {
        payload.menuPackages = editedCaterer.menuPackages;
        payload.packages = editedCaterer.menuPackages;
      } else if (sectionKey === "contact_details") {
        payload.phone = editedCaterer.phone;
        payload.alternatePhone = editedCaterer.alternatePhone;
        payload.email = editedCaterer.email;
        payload.whatsappNumber = editedCaterer.whatsappNumber;
      }

      // Save to Supabase
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from("caterer_registrations")
          .update(payload)
          .eq("id", caterer.id);
        if (error) throw error;
      }

      // Save to LocalStorage
      const rawRegistrations = localStorage.getItem("registrations");
      if (rawRegistrations) {
        const all = JSON.parse(rawRegistrations);
        const updated = all.map((c: any) => {
          if (c.id === caterer.id) {
            const merged = { ...c, ...payload };
            if (payload.brandName) {
              merged.businessName = payload.brandName;
              merged.name = payload.brandName;
            }
            if (payload.owner) merged.owner = payload.owner;
            return merged;
          }
          return c;
        });
        localStorage.setItem("registrations", JSON.stringify(updated));
      }

      // Sync local state
      const updatedCaterer = { ...caterer, ...payload };
      setCaterer(updatedCaterer);
      setEditedCaterer(updatedCaterer);
      
      toast("Changes saved and deployed successfully!", "success");
      setActiveEditSection(null);
    } catch (err: any) {
      console.error("Save section error:", err);
      toast(`Failed to save changes: ${err.message || err}`, "error");
    } finally {
      setIsSavingSection(false);
    }
  };

  const renderActiveEditModal = () => {
    if (!activeEditSection || !editedCaterer) return null;

    let title = "Section Settings";
    if (activeEditSection === "hero") title = "Edit Hero Section";
    else if (activeEditSection === "about") title = "Edit About us";
    else if (activeEditSection === "quick_info") title = "Edit Quick Info";
    else if (activeEditSection === "statistics") title = "Edit Statistics";
    else if (activeEditSection === "branches") title = "Edit Branch Details";
    else if (activeEditSection === "areas") title = "Edit Service Areas";
    else if (activeEditSection === "achievements") title = "Edit Achievements & Awards";
    else if (activeEditSection === "services") title = "Edit Services We Offer";
    else if (activeEditSection === "gallery") title = "Edit Food Gallery Portfolio";
    else if (activeEditSection === "menu_packages") title = "Edit Menu Packages";
    else if (activeEditSection === "contact_details") title = "Edit Contact Details";

    const renderFileInput = (label: string, field: string, subIndex?: number, subField?: string) => {
      return (
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">{label}</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 bg-[#F7F4EE] hover:bg-[#E7D4A4]/30 text-[#1E1E1E] border border-[#E7D4A4] px-5 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider font-sans transition-all cursor-pointer shadow-sm hover:shadow-md">
              <ImageIcon size={13} className="text-[#D4AF37]" />
              Upload Photo File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, field, subIndex, subField)}
              />
            </label>
            <span className="text-[#6D6D6D] text-xs font-medium font-sans">or paste direct image URL below</span>
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#FFFFFF] border border-[#E7D4A4] rounded-[28px] shadow-[0_32px_80px_rgba(212,175,55,0.08),0_16px_32px_rgba(0,0,0,0.03)] w-full max-w-[1180px] p-12 text-[#1E1E1E] relative flex flex-col max-h-[90vh] my-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E7D4A4]/40 pb-5 mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold font-mono">Profile Builder</span>
              <h3 className="text-[#1E1E1E] font-serif font-black text-2xl md:text-3xl mt-1 tracking-tight">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveEditSection(null)}
              className="text-[#6D6D6D] hover:text-[#1E1E1E] bg-[#F7F4EE] hover:bg-[#E7D4A4]/40 p-2.5 rounded-full transition cursor-pointer border border-[#E7D4A4]/20 animate-none flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#D4AF37]/50 scrollbar-track-transparent space-y-6 py-1 text-left select-text">
            
            {/* HERO SECTION FORM */}
            {activeEditSection === "hero" && (
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Brand Name / Public Profile Title</label>
                  <input
                    type="text"
                    value={editedCaterer.brandName || editedCaterer.name || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, brandName: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-5 py-3.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. Royal Banquet Caterers"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Profile Tagline / Slogan</label>
                  <textarea
                    rows={3}
                    value={editedCaterer.tagline || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, tagline: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl p-4 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all leading-relaxed resize-none font-medium"
                    placeholder="Enter a compelling premium brand subtitle..."
                  />
                </div>
                <div className="border-t border-[#E7D4A4]/40 pt-5 space-y-4">
                  {renderFileInput("Brand Logo", "logo")}
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editedCaterer.logo || ""}
                      onChange={(e) => setEditedCaterer({ ...editedCaterer, logo: e.target.value })}
                      className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-5 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                      placeholder="Logo image URL address"
                    />
                  </div>
                </div>
                <div className="border-t border-[#E7D4A4]/40 pt-5 space-y-4">
                  {renderFileInput("Cover Banner Artwork", "coverBanner")}
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editedCaterer.coverBanner || ""}
                      onChange={(e) => setEditedCaterer({ ...editedCaterer, coverBanner: e.target.value })}
                      className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-5 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                      placeholder="Cover banner image URL address"
                    />
                  </div>
                </div>

                {/* Hero Information Card #1 */}
                <div className="border-t border-[#E7D4A4]/40 pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Hero Information Card #1</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Primary Title</label>
                      <input
                        type="text"
                        value={editedCaterer.heroCard1Title !== undefined ? editedCaterer.heroCard1Title : "Fine Dining"}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard1Title: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                        placeholder="e.g. Fine Dining"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Secondary Text</label>
                      <input
                        type="text"
                        value={editedCaterer.heroCard1Text !== undefined ? editedCaterer.heroCard1Text : "Premium Catering"}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard1Text: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                        placeholder="e.g. Premium Catering"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Card Icon Picker</label>
                      <select
                        value={editedCaterer.heroCard1Icon || "ChefHat"}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard1Icon: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-semibold"
                      >
                        <option value="ChefHat">Chef Hat (Cuisine)</option>
                        <option value="Briefcase">Briefcase (Service)</option>
                        <option value="Award">Award (Quality)</option>
                        <option value="MapPin">Location (Map Pin)</option>
                        <option value="Sparkles">Sparkles (Special)</option>
                        <option value="Users">Users (Clients)</option>
                        <option value="Clock">Clock (Timing)</option>
                        <option value="Heart">Heart (Passion)</option>
                        <option value="Trophy">Trophy (Success)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hero Information Card #2 */}
                <div className="border-t border-[#E7D4A4]/40 pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Hero Information Card #2</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Primary Value</label>
                      <input
                        type="text"
                        value={editedCaterer.heroCard2Value !== undefined ? editedCaterer.heroCard2Value : (editedCaterer.experience ? (editedCaterer.experience.toString().includes("Year") ? editedCaterer.experience : `${editedCaterer.experience}+ Years`) : "20+ Years")}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard2Value: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                        placeholder="e.g. 30+ Years"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Secondary Text</label>
                      <input
                        type="text"
                        value={editedCaterer.heroCard2Text !== undefined ? editedCaterer.heroCard2Text : "Experience"}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard2Text: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                        placeholder="e.g. Experience"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Card Icon Picker</label>
                      <select
                        value={editedCaterer.heroCard2Icon || "Award"}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard2Icon: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-semibold"
                      >
                        <option value="ChefHat">Chef Hat (Cuisine)</option>
                        <option value="Briefcase">Briefcase (Service)</option>
                        <option value="Award">Award (Quality)</option>
                        <option value="MapPin">Location (Map Pin)</option>
                        <option value="Sparkles">Sparkles (Special)</option>
                        <option value="Users">Users (Clients)</option>
                        <option value="Clock">Clock (Timing)</option>
                        <option value="Heart">Heart (Passion)</option>
                        <option value="Trophy">Trophy (Success)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Hero Information Card #3 */}
                <div className="border-t border-[#E7D4A4]/40 pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Hero Information Card #3</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Primary Value</label>
                      <input
                        type="text"
                        value={editedCaterer.heroCard3Value !== undefined ? editedCaterer.heroCard3Value : (editedCaterer.address || "Hyderabad, Telangana")}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard3Value: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                        placeholder="e.g. Hyderabad, Telangana"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Secondary Text</label>
                      <input
                        type="text"
                        value={editedCaterer.heroCard3Text !== undefined ? editedCaterer.heroCard3Text : "Serving Across Telangana"}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard3Text: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                        placeholder="e.g. Serving Across Telangana"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase font-mono">Card Icon Picker</label>
                      <select
                        value={editedCaterer.heroCard3Icon || "MapPin"}
                        onChange={(e) => setEditedCaterer({ ...editedCaterer, heroCard3Icon: e.target.value })}
                        className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-semibold"
                      >
                        <option value="ChefHat">Chef Hat (Cuisine)</option>
                        <option value="Briefcase">Briefcase (Service)</option>
                        <option value="Award">Award (Quality)</option>
                        <option value="MapPin">Location (Map Pin)</option>
                        <option value="Sparkles">Sparkles (Special)</option>
                        <option value="Users">Users (Clients)</option>
                        <option value="Clock">Clock (Timing)</option>
                        <option value="Heart">Heart (Passion)</option>
                        <option value="Trophy">Trophy (Success)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABOUT US FORM */}
            {activeEditSection === "about" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Executive Chef / Founder Name</label>
                  <input
                    type="text"
                    value={editedCaterer.owner || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, owner: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. Master Chef Sanjay"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Caterer Biography / About Description</label>
                  <textarea
                    rows={6}
                    value={editedCaterer.description || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, description: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl p-4 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all leading-relaxed resize-y font-medium"
                    placeholder="Describe your culinary heritage, standards, style, and hospitality story..."
                  />
                </div>
                <div className="border-t border-[#E7D4A4]/40 pt-4 space-y-4">
                  {renderFileInput("Founder / Chef Photo", "ownerPhoto")}
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={editedCaterer.ownerPhoto || ""}
                      onChange={(e) => setEditedCaterer({ ...editedCaterer, ownerPhoto: e.target.value })}
                      className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                      placeholder="Chef photo image URL address"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* QUICK INFO FORM */}
            {activeEditSection === "quick_info" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Cuisine Specializations (comma separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editedCaterer.specializations) ? editedCaterer.specializations.join(", ") : editedCaterer.specializations || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, specializations: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="Veg+Non-Veg, North Indian, South Indian, Mughlai"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Minimum Guest Count</label>
                  <input
                    type="number"
                    value={editedCaterer.minGuests || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, minGuests: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Price Range Per Plate</label>
                  <input
                    type="text"
                    value={editedCaterer.priceRange || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, priceRange: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. ₹350 - ₹1,200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Booking Lead Time Required</label>
                  <input
                    type="text"
                    value={editedCaterer.bookingLeadTime || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, bookingLeadTime: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. 5 - 7 Days"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Average Response Time</label>
                  <input
                    type="text"
                    value={editedCaterer.responseTime || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, responseTime: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. Under 2 Hours"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Year Established</label>
                  <input
                    type="text"
                    value={editedCaterer.established || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, established: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. 2012 (14 Years of Legacy)"
                  />
                </div>
              </div>
            )}

            {/* STATISTICS FORM */}
            {activeEditSection === "statistics" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Years of Experience</label>
                  <input
                    type="number"
                    value={editedCaterer.experience || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, experience: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. 15"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Events Completed Successfully</label>
                  <input
                    type="number"
                    value={editedCaterer.eventsCompleted || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, eventsCompleted: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. 450"
                  />
                </div>
              </div>
            )}

            {/* BRANCH DETAILS FORM */}
            {activeEditSection === "branches" && (
              <div className="space-y-6">
                <div className="text-sm text-[#6D6D6D] mb-4 font-sans leading-relaxed">
                  Manage your business branch offices here. Each branch office only requires a branch name and a physical address. All layouts and labels will be generated dynamically on your public profile.
                </div>

                <div className="space-y-5 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#D4AF37]/50 scrollbar-track-transparent">
                  {(editedCaterer.branchesList || []).map((b: any, bIdx: number) => (
                    <div 
                      key={bIdx} 
                      className="bg-[#F7F4EE] border border-[#E7D4A4] rounded-2xl p-6 relative transition-all duration-300 hover:shadow-sm"
                    >
                      {/* Branch Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-[#E7D4A4]/40 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] font-mono">
                            Branch #{bIdx + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={bIdx === 0}
                            onClick={() => {
                              if (bIdx > 0) {
                                const list = [...editedCaterer.branchesList];
                                const temp = list[bIdx];
                                list[bIdx] = list[bIdx - 1];
                                list[bIdx - 1] = temp;
                                setEditedCaterer({ ...editedCaterer, branchesList: list });
                              }
                            }}
                            className="p-1 rounded-md border border-[#E7D4A4] bg-white text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                            title="Move Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          
                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={bIdx === (editedCaterer.branchesList || []).length - 1}
                            onClick={() => {
                              if (bIdx < (editedCaterer.branchesList || []).length - 1) {
                                const list = [...editedCaterer.branchesList];
                                const temp = list[bIdx];
                                list[bIdx] = list[bIdx + 1];
                                list[bIdx + 1] = temp;
                                setEditedCaterer({ ...editedCaterer, branchesList: list });
                              }
                            }}
                            className="p-1 rounded-md border border-[#E7D4A4] bg-white text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                            title="Move Down"
                          >
                            <ChevronDown size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              const list = (editedCaterer.branchesList || []).filter((_: any, i: number) => i !== bIdx);
                              setEditedCaterer({ ...editedCaterer, branchesList: list });
                            }}
                            className="p-1 rounded-md border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition cursor-pointer flex items-center justify-center"
                            title="Remove Branch"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Branch Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                            ✏ Branch Name
                          </label>
                          <input
                            type="text"
                            value={b.name || ""}
                            onChange={(e) => {
                              const list = [...editedCaterer.branchesList];
                              list[bIdx] = { ...list[bIdx], name: e.target.value };
                              setEditedCaterer({ ...editedCaterer, branchesList: list });
                            }}
                            className="w-full bg-white border border-[#E7D4A4] rounded-xl px-4 py-3 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                            placeholder="e.g. Hyderabad Head Office"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                              📍 Address
                            </label>
                            <button
                              type="button"
                              onClick={() => setActiveBranchIndexForMap(bIdx)}
                              className="text-[10px] font-bold text-[#D4AF37] hover:text-[#06281E] uppercase tracking-wider transition cursor-pointer flex items-center gap-0.5"
                            >
                              📍 Change Location
                            </button>
                          </div>
                          <AddressAutocomplete
                            value={b.address || b.location || ""}
                            onChange={(val) => {
                              const list = [...editedCaterer.branchesList];
                              list[bIdx] = { ...list[bIdx], address: val, location: val };
                              setEditedCaterer({ ...editedCaterer, branchesList: list });
                            }}
                            onSelect={(data) => {
                              const list = [...editedCaterer.branchesList];
                              list[bIdx] = { 
                                ...list[bIdx], 
                                address: data.address, 
                                location: data.address,
                                latitude: data.latitude,
                                longitude: data.longitude
                              };
                              setEditedCaterer({ ...editedCaterer, branchesList: list });
                            }}
                            className="w-full bg-white border border-[#E7D4A4] rounded-xl px-4 py-3 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                            placeholder="e.g. Madhapur, Hyderabad"
                            theme="gold"
                            leftIcon={<MapPin className="text-[#DEAA38] w-4 h-4 hover:text-[#E5C158] transition-colors" />}
                            onIconClick={() => setActiveBranchIndexForMap(bIdx)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(editedCaterer.branchesList || []).length === 0 && (
                    <div className="text-center py-12 border border-dashed border-[#E7D4A4] rounded-2xl bg-[#F7F4EE]/50 text-[#6D6D6D] italic text-sm font-sans">
                      No branches listed. Click the button below to add your first branch office.
                    </div>
                  )}
                </div>

                {activeBranchIndexForMap !== null && (
                  <MapPickerModal
                    isOpen={activeBranchIndexForMap !== null}
                    onClose={() => setActiveBranchIndexForMap(null)}
                    initialLat={
                      activeBranchIndexForMap === 'hq'
                        ? editedCaterer.latitude
                        : editedCaterer.branchesList[activeBranchIndexForMap]?.latitude
                    }
                    initialLng={
                      activeBranchIndexForMap === 'hq'
                        ? editedCaterer.longitude
                        : editedCaterer.branchesList[activeBranchIndexForMap]?.longitude
                    }
                    initialAddress={
                      activeBranchIndexForMap === 'hq'
                        ? editedCaterer.address
                        : (editedCaterer.branchesList[activeBranchIndexForMap]?.address || editedCaterer.branchesList[activeBranchIndexForMap]?.location)
                    }
                    showRadius={activeBranchIndexForMap === 'hq'}
                    initialRadius={editedCaterer.serviceRadiusKm || 15}
                    onSave={(data) => {
                      if (activeBranchIndexForMap === 'hq') {
                        setEditedCaterer({
                          ...editedCaterer,
                          address: data.address,
                          latitude: data.latitude,
                          longitude: data.longitude,
                          serviceRadiusKm: data.serviceRadiusKm ?? editedCaterer.serviceRadiusKm
                        });
                      } else {
                        const list = [...editedCaterer.branchesList];
                        list[activeBranchIndexForMap] = {
                          ...list[activeBranchIndexForMap],
                          address: data.address,
                          location: data.address,
                          latitude: data.latitude,
                          longitude: data.longitude
                        };
                        // Also update primary branch details on first branch edit
                        const updatedCaterer = { ...editedCaterer, branchesList: list };
                        if (activeBranchIndexForMap === 0) {
                          updatedCaterer.address = data.address;
                          updatedCaterer.latitude = data.latitude;
                          updatedCaterer.longitude = data.longitude;
                        }
                        setEditedCaterer(updatedCaterer);
                      }
                      setActiveBranchIndexForMap(null);
                    }}
                    title={
                      activeBranchIndexForMap === 'hq'
                        ? "Select HQ Office Location"
                        : `Change Location for Branch #${activeBranchIndexForMap + 1}`
                    }
                  />
                )}

                {/* Add New Branch Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(editedCaterer.branchesList || [])];
                      list.push({ name: "", address: "" });
                      setEditedCaterer({ ...editedCaterer, branchesList: list });
                    }}
                    className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C158] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(212,175,55,0.15)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.25)] uppercase tracking-wider cursor-pointer font-sans"
                  >
                    <Plus size={15} /> Add New Branch
                  </button>
                </div>
              </div>
            )}

            {/* SERVICE AREAS FORM */}
            {activeEditSection === "areas" && (
              <div className="space-y-6">
                <div className="text-sm text-[#6D6D6D] mb-2 font-sans leading-relaxed">
                  Add the locations where your catering service is available.
                </div>

                {/* Serve Entire Hyderabad option */}
                <div className="bg-white border border-[#E7D4A4] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!editedCaterer.serveEntireHyderabad}
                      onChange={(e) => {
                        setEditedCaterer({
                          ...editedCaterer,
                          serveEntireHyderabad: e.target.checked
                        });
                      }}
                      className="w-5 h-5 text-[#D4AF37] border-[#E7D4A4] focus:ring-[#D4AF37]/20 rounded cursor-pointer accent-[#D4AF37]"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#1E1E1E] font-sans">
                        Serve Entire Hyderabad
                      </span>
                      <p className="text-xs text-[#6D6D6D]/70 font-sans mt-0.5">
                        Select this if you provide services throughout all locations in Hyderabad.
                      </p>
                    </div>
                  </label>
                </div>

                <div className={cn("bg-[#F7F4EE]/50 border border-[#E7D4A4]/45 rounded-2xl p-6 transition-all duration-300", editedCaterer.serveEntireHyderabad && "opacity-40 pointer-events-none")}>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                      Service Area
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        disabled={!!editedCaterer.serveEntireHyderabad}
                        value={newAreaInput}
                        onChange={(e) => setNewAreaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (editedCaterer.serveEntireHyderabad) return;
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newAreaInput.trim();
                            if (!trimmed) return;
                            const current = Array.isArray(editedCaterer.serviceAreas) ? editedCaterer.serviceAreas : [];
                            if (current.some((item: string) => item.toLowerCase() === trimmed.toLowerCase())) {
                              setNewAreaInput("");
                              return;
                            }
                            setEditedCaterer({
                              ...editedCaterer,
                              serviceAreas: [...current, trimmed]
                            });
                            setNewAreaInput("");
                          }
                        }}
                        placeholder={editedCaterer.serveEntireHyderabad ? "Serving entire Hyderabad (disabled)" : "e.g. Jubilee Hills"}
                        className="flex-1 bg-white border border-[#E7D4A4] rounded-xl px-4 py-3 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium font-sans placeholder:text-[#6D6D6D]/40 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                      <button
                        type="button"
                        disabled={!!editedCaterer.serveEntireHyderabad}
                        onClick={() => {
                          if (editedCaterer.serveEntireHyderabad) return;
                          const trimmed = newAreaInput.trim();
                          if (!trimmed) return;
                          const current = Array.isArray(editedCaterer.serviceAreas) ? editedCaterer.serviceAreas : [];
                          if (current.some((item: string) => item.toLowerCase() === trimmed.toLowerCase())) {
                            setNewAreaInput("");
                            return;
                          }
                          setEditedCaterer({
                            ...editedCaterer,
                            serviceAreas: [...current, trimmed]
                          });
                          setNewAreaInput("");
                        }}
                        className="bg-[#D4AF37] hover:bg-[#E5C158] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(212,175,55,0.15)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.25)] uppercase tracking-wider cursor-pointer font-sans shrink-0 flex items-center justify-center gap-1.5 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
                      >
                        <Plus size={14} /> Add Area
                      </button>
                    </div>
                  </div>
                </div>

                {!editedCaterer.serveEntireHyderabad && (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#D4AF37]/30 scrollbar-track-transparent">
                    {((Array.isArray(editedCaterer.serviceAreas) ? editedCaterer.serviceAreas : [])).map((area: string, idx: number) => (
                      <div 
                        key={idx}
                        draggable
                        onDragStart={(e) => {
                          setDraggedIndex(idx);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedIndex === null || draggedIndex === idx) return;
                          const list = [...editedCaterer.serviceAreas];
                          const draggedItem = list[draggedIndex];
                          list.splice(draggedIndex, 1);
                          list.splice(idx, 0, draggedItem);
                          setEditedCaterer({ ...editedCaterer, serviceAreas: list });
                          setDraggedIndex(null);
                        }}
                        className={cn(
                          "flex items-center justify-between bg-[#FFFFFF] border border-[#E7D4A4]/40 hover:border-[#D4AF37]/50 rounded-xl px-5 py-3.5 transition-all duration-300 hover:shadow-sm group cursor-grab active:cursor-grabbing",
                          draggedIndex === idx && "opacity-40 border-dashed border-[#D4AF37]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[#6D6D6D]/35 hover:text-[#D4AF37] transition cursor-move hidden sm:inline" title="Drag to reorder">
                            <GripVertical size={14} />
                          </span>
                          <span className="text-[#D4AF37] font-medium text-base">📍</span>
                          <span className="text-sm font-semibold text-[#1E1E1E] font-sans tracking-tight">
                            {area}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx > 0) {
                                const list = [...editedCaterer.serviceAreas];
                                const temp = list[idx];
                                list[idx] = list[idx - 1];
                                list[idx - 1] = temp;
                                setEditedCaterer({ ...editedCaterer, serviceAreas: list });
                              }
                            }}
                            className="p-1.5 rounded-lg border border-[#E7D4A4]/50 bg-[#F7F4EE]/30 text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                            title="Move Up"
                          >
                            <ChevronUp size={13} />
                          </button>
                          
                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={idx === editedCaterer.serviceAreas.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx < editedCaterer.serviceAreas.length - 1) {
                                const list = [...editedCaterer.serviceAreas];
                                const temp = list[idx];
                                list[idx] = list[idx + 1];
                                list[idx + 1] = temp;
                                setEditedCaterer({ ...editedCaterer, serviceAreas: list });
                              }
                            }}
                            className="p-1.5 rounded-lg border border-[#E7D4A4]/50 bg-[#F7F4EE]/30 text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-20 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                            title="Move Down"
                          >
                            <ChevronDown size={13} />
                          </button>

                          <div className="w-[1px] h-4 bg-[#E7D4A4]/40 my-auto mx-1" />

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const list = editedCaterer.serviceAreas.filter((_: any, i: number) => i !== idx);
                              setEditedCaterer({ ...editedCaterer, serviceAreas: list });
                            }}
                            className="p-1.5 rounded-lg border border-red-100 bg-red-50/50 text-red-500 hover:bg-red-100/70 transition cursor-pointer flex items-center justify-center"
                            title="Remove Area"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {(!Array.isArray(editedCaterer.serviceAreas) || editedCaterer.serviceAreas.length === 0) && (
                      <div className="text-center py-12 border border-dashed border-[#E7D4A4] rounded-2xl bg-[#F7F4EE]/20 text-[#6D6D6D] italic text-sm font-sans">
                        No service areas listed yet. Add one above to get started.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ACHIEVEMENTS FORM */}
            {activeEditSection === "achievements" && (
              <div className="space-y-6">
                <div className="text-sm text-[#6D6D6D] mb-4 font-sans leading-relaxed font-medium">
                  Show your business highlights that customers can instantly trust.
                </div>

                <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2 pb-2">
                  {(editedCaterer.achievementsList || []).map((ach: any, achIdx: number) => (
                    <div 
                      key={achIdx} 
                      draggable
                      onDragStart={(e) => {
                        setDraggedIndex(achIdx);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIndex === null || draggedIndex === achIdx) return;
                        const list = [...editedCaterer.achievementsList];
                        const draggedItem = list[draggedIndex];
                        list.splice(draggedIndex, 1);
                        list.splice(achIdx, 0, draggedItem);
                        setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                        setDraggedIndex(null);
                      }}
                      className={cn(
                        "bg-[#FAF6EC] border border-[#E7D4A4] rounded-2xl p-5 relative transition-all duration-300 hover:shadow-md",
                        draggedIndex === achIdx && "opacity-40 border-dashed border-[#D4AF37]"
                      )}
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-center pb-3 border-b border-[#E7D4A4]/45 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#6D6D6D]/40 hover:text-[#D4AF37] transition cursor-move hidden sm:inline" title="Drag to reorder">
                            <GripVertical size={14} />
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] font-mono">
                            Achievement #{achIdx + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Move Up */}
                          <button
                            type="button"
                            disabled={achIdx === 0}
                            onClick={() => {
                              if (achIdx > 0) {
                                const list = [...editedCaterer.achievementsList];
                                const temp = list[achIdx];
                                list[achIdx] = list[achIdx - 1];
                                list[achIdx - 1] = temp;
                                setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                              }
                            }}
                            className="p-1.5 rounded-lg border border-[#E7D4A4] bg-white text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                            title="Move Up"
                          >
                            <ChevronUp size={13} />
                          </button>
                          
                          {/* Move Down */}
                          <button
                            type="button"
                            disabled={achIdx === (editedCaterer.achievementsList || []).length - 1}
                            onClick={() => {
                              if (achIdx < (editedCaterer.achievementsList || []).length - 1) {
                                const list = [...editedCaterer.achievementsList];
                                const temp = list[achIdx];
                                list[achIdx] = list[achIdx + 1];
                                list[achIdx + 1] = temp;
                                setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                              }
                            }}
                            className="p-1.5 rounded-lg border border-[#E7D4A4] bg-white text-[#6D6D6D] hover:text-[#D4AF37] hover:border-[#D4AF37] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                            title="Move Down"
                          >
                            <ChevronDown size={13} />
                          </button>

                          {/* Delete Card */}
                          <button
                            type="button"
                            disabled={(editedCaterer.achievementsList || []).length <= 1}
                            onClick={() => {
                              const list = (editedCaterer.achievementsList || []).filter((_: any, i: number) => i !== achIdx);
                              setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                            }}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center"
                            title="Remove Achievement"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="space-y-4 font-sans text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-[#D4AF37] font-extrabold uppercase tracking-wider font-mono">Metric Number</label>
                            <input
                              type="text"
                              value={ach.value || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.achievementsList];
                                list[achIdx] = { ...list[achIdx], value: e.target.value };
                                setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                              }}
                              className="w-full bg-white border border-[#E7D4A4] rounded-xl px-4 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] transition font-semibold"
                              placeholder="e.g. 400+"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-[#D4AF37] font-extrabold uppercase tracking-wider font-mono">Achievement Title</label>
                            <input
                              type="text"
                              value={ach.title || ach.label || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.achievementsList];
                                list[achIdx] = { ...list[achIdx], title: e.target.value, label: e.target.value };
                                setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                              }}
                              className="w-full bg-white border border-[#E7D4A4] rounded-xl px-4 py-2.5 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] transition font-semibold"
                              placeholder="e.g. Events Completed"
                            />
                          </div>
                        </div>

                        {/* Icon Selection */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-[#D4AF37] font-extrabold uppercase tracking-wider font-mono">Icon Picker</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {AVAILABLE_ICONS.map((opt) => {
                              const isSelected = (ach.icon || "award") === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    const list = [...editedCaterer.achievementsList];
                                    list[achIdx] = { ...list[achIdx], icon: opt.key };
                                    setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                                  }}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 text-[11px] rounded-xl border text-left font-sans transition-all cursor-pointer",
                                    isSelected 
                                      ? "bg-[#FAF6EC] border-[#D4AF37] text-[#1E1E1E] font-black shadow-xs scale-[1.02]" 
                                      : "bg-white border-stone-200 text-[#6D6D6D] hover:bg-[#FAF6EC]/40"
                                  )}
                                >
                                  <span className="text-sm">{opt.emoji}</span>
                                  <span className="truncate">{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(editedCaterer.achievementsList || []).length === 0 && (
                    <div className="text-center py-8 border border-dashed border-[#E7D4A4] rounded-2xl bg-[#FAF6EC]/30 text-stone-400 italic text-xs">
                      No achievements custom cards. Click "+ Add Achievement" to begin.
                    </div>
                  )}
                </div>

                {/* Add Achievement Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={(editedCaterer.achievementsList || []).length >= 6}
                    onClick={() => {
                      const list = [...(editedCaterer.achievementsList || [])];
                      if (list.length < 6) {
                        list.push({ value: "", title: "", icon: "award" });
                        setEditedCaterer({ ...editedCaterer, achievementsList: list, achievements: list });
                      }
                    }}
                    className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#E5C158] text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(212,175,55,0.15)] disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider cursor-pointer font-sans"
                  >
                    <Plus size={14} /> Add Achievement
                  </button>
                </div>
              </div>
            )}

            {/* SERVICES WE OFFER FORM */}
            {activeEditSection === "services" && (
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Services List ({editedCaterer.services?.length || 0})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(editedCaterer.services || [])];
                      list.push({
                        title: "New Catering Service",
                        desc: "Signature select premium dining setups customized for your celebrations.",
                        image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop",
                        iconName: "ChefHat"
                      });
                      setEditedCaterer({ ...editedCaterer, services: list });
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#F7F4EE] hover:bg-[#E7D4A4]/35 text-[#D4AF37] border border-[#E7D4A4] px-4 py-2 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer hover:shadow-xs active:scale-95 duration-200"
                  >
                    + Add New Service Card
                  </button>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#D4AF37]/50 scrollbar-track-transparent">
                  {(editedCaterer.services || []).map((ser: any, serIdx: number) => (
                    <div key={serIdx} className="bg-[#FCFAF5] border border-[#E7D4A4] p-5 rounded-2xl relative space-y-3 hover:shadow-xs transition duration-300">
                      <div className="flex justify-between items-center pb-2 border-b border-[#E7D4A4]/40">
                        <span className="text-xs font-black text-[#D4AF37] uppercase tracking-wider font-mono">Service #{serIdx + 1}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const list = (editedCaterer.services || []).filter((_: any, i: number) => i !== serIdx);
                              setEditedCaterer({ ...editedCaterer, services: list });
                            }}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-100/50 text-xs font-bold bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Service Title</label>
                          <input
                            type="text"
                            value={ser.title || ""}
                            onChange={(e) => {
                              const list = [...editedCaterer.services];
                              list[serIdx] = { ...list[serIdx], title: e.target.value };
                              setEditedCaterer({ ...editedCaterer, services: list });
                            }}
                            className="w-full bg-white border border-[#E7D4A4] rounded-lg px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                            placeholder="e.g. Wedding Catering"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Icon Category</label>
                          <select
                            value={ser.iconName || "ChefHat"}
                            onChange={(e) => {
                              const list = [...editedCaterer.services];
                              list[serIdx] = { ...list[serIdx], iconName: e.target.value };
                              setEditedCaterer({ ...editedCaterer, services: list });
                            }}
                            className="w-full bg-white border border-[#E7D4A4] rounded-lg px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                          >
                            {Object.keys(serviceIcons).map((iconKey) => (
                              <option key={iconKey} value={iconKey}>{iconKey}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Description</label>
                          <textarea
                            rows={2}
                            value={ser.desc || ""}
                            onChange={(e) => {
                              const list = [...editedCaterer.services];
                              list[serIdx] = { ...list[serIdx], desc: e.target.value };
                              setEditedCaterer({ ...editedCaterer, services: list });
                            }}
                            className="w-full bg-white border border-[#E7D4A4] rounded-lg p-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all leading-relaxed resize-none font-medium"
                            placeholder="Brief description..."
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:col-span-2 border-t border-[#E7D4A4]/40 pt-2.5">
                          {renderFileInput("Service Showcase Image", "services", serIdx, "image")}
                          <input
                            type="text"
                            value={ser.image || ""}
                            onChange={(e) => {
                              const list = [...editedCaterer.services];
                              list[serIdx] = { ...list[serIdx], image: e.target.value };
                              setEditedCaterer({ ...editedCaterer, services: list });
                            }}
                            className="w-full bg-white border border-[#E7D4A4] rounded-lg px-3 py-2 text-[10px] text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                            placeholder="Image URL"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FOOD GALLERY FORM */}
            {activeEditSection === "gallery" && (
              <div className="space-y-6 text-left">
                <div className="bg-[#FCFAF5] border border-[#E7D4A4] p-6 rounded-2xl space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Upload Local Portfolio Images</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E7D4A4] rounded-2xl p-8 hover:bg-[#F7F4EE] bg-white transition cursor-pointer text-center shadow-xs">
                      <ImageIcon size={32} className="text-[#D4AF37] mb-2" />
                      <span className="text-xs font-bold text-[#1E1E1E] font-sans">Click to Select Multiple Files</span>
                      <span className="text-[10px] text-[#6D6D6D] mt-1 font-medium font-sans">Accepts any portrait or landscape cuisine shots</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            try {
                              const newPhotos = [...(editedCaterer.gallery || [])];
                              for (let i = 0; i < files.length; i++) {
                                const base64 = await convertFileToBase64(files[i]);
                                newPhotos.push(base64);
                              }
                              setEditedCaterer({ ...editedCaterer, gallery: newPhotos });
                              toast(`Successfully queued ${files.length} images to your draft gallery!`, "success");
                            } catch (err) {
                              toast("Error converting file to base64", "error");
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-1.5 font-sans">
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Or Paste Direct Image Address Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="direct-gallery-url-input"
                        placeholder="https://images.unsplash.com/photo-..."
                        className="flex-1 bg-white border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setEditedCaterer({ ...editedCaterer, gallery: [...(editedCaterer.gallery || []), val] });
                              (e.target as HTMLInputElement).value = "";
                              toast("Image URL added to showcase!", "success");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("direct-gallery-url-input") as HTMLInputElement;
                          const val = el?.value?.trim();
                          if (val) {
                            setEditedCaterer({ ...editedCaterer, gallery: [...(editedCaterer.gallery || []), val] });
                            el.value = "";
                            toast("Image URL added to showcase!", "success");
                          }
                        }}
                        className="bg-[#D4AF37] hover:bg-[#E5C158] text-white font-extrabold text-xs px-5 rounded-xl cursor-pointer transition-all duration-300 shadow-sm flex items-center justify-center uppercase tracking-wider"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono block">Current Portfolio Showcase ({editedCaterer.gallery?.length || 0})</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-1">
                    {(editedCaterer.gallery || []).map((imgUrl: string, idx: number) => (
                      <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-[#E7D4A4]/40 bg-white shadow-xs group">
                        <img src={imgUrl} className="w-full h-full object-cover" alt="Portfolio cuisine" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editedCaterer.gallery || []).filter((_: any, i: number) => i !== idx);
                            setEditedCaterer({ ...editedCaterer, gallery: updated });
                          }}
                          className="absolute inset-0 bg-red-950/70 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center text-rose-200 text-xs cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(editedCaterer.gallery || []).length === 0 && (
                      <div className="col-span-4 text-center py-8 text-stone-400 text-xs font-medium">Your portfolio gallery is empty. Upload image files above to showcase your catering creations!</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MENU PACKAGES FORM */}
            {activeEditSection === "menu_packages" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-[#DEAA38] uppercase tracking-wider">Menu Packages List ({editedCaterer.menuPackages?.length || 0})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(editedCaterer.menuPackages || [])];
                      const newId = `custom_${Date.now()}`;
                      list.push({
                        id: newId,
                        packageName: "Gold Luxury Feast",
                        packageType: "Veg",
                        pricePerPlate: 450,
                        minimumGuests: 100,
                        description: "Exclusive grand celebration buffet set.",
                        categories: ["Welcome Drinks", "Starters", "Main Course", "Desserts"],
                        items: ["Fresh Lime Punch", "Paneer Tikka / Hara Bhara Kebab", "Special Kadai Paneer with Roti", "Ice Cream & Gulab Jamun"],
                        buttonText: "View Details",
                        cardTheme: "gold",
                        popular: false,
                        visible: true
                      });
                      setEditedCaterer({ ...editedCaterer, menuPackages: list });
                      setSelectedPackageId(newId);
                      toast("Custom menu package created!", "success");
                    }}
                    className="text-xs font-bold bg-[#DEAA38]/20 hover:bg-[#DEAA38]/30 border border-[#DEAA38]/40 px-3 py-1.5 rounded-xl text-[#DEAA38] transition cursor-pointer"
                  >
                    + Add New Package Tier
                  </button>
                </div>

                {/* Package tiers selector tab bar */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
                  {(editedCaterer.menuPackages || []).map((pkg: any) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap snap-start border shrink-0 cursor-pointer",
                        selectedPackageId === pkg.id
                          ? "bg-[#DEAA38] text-[#052118] border-[#DEAA38] shadow-md"
                          : "bg-[#03140F] text-stone-300 border-[#DEAA38]/20 hover:border-[#DEAA38]/40"
                      )}
                    >
                      {pkg.packageName || pkg.name || "Unnamed Tier"} ({pkg.packageType})
                    </button>
                  ))}
                </div>

                {/* Active Package Editor sub-form */}
                {selectedPackageId !== null && (
                  (() => {
                    const pkgIdx = (editedCaterer.menuPackages || []).findIndex((p: any) => p.id === selectedPackageId);
                    if (pkgIdx === -1) return null;
                    const pkg = editedCaterer.menuPackages[pkgIdx];
                    return (
                      <div className="bg-[#03140F] border-2 border-[#DEAA38]/25 p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-[#DEAA38]/10">
                          <span className="text-xs font-black text-[#DEAA38] uppercase tracking-wider">Package Specification</span>
                          <button
                            type="button"
                            onClick={() => {
                              const list = (editedCaterer.menuPackages || []).filter((p: any) => p.id !== selectedPackageId);
                              setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              setSelectedPackageId(list.length > 0 ? list[0].id : null);
                              toast("Package tier deleted", "success");
                            }}
                            className="text-rose-400 hover:text-rose-300 text-xs font-bold bg-rose-950/40 px-2.5 py-1.5 rounded-lg border border-rose-500/20 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Delete Package
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Package Name</label>
                            <input
                              type="text"
                              value={pkg.packageName || pkg.name || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.menuPackages];
                                list[pkgIdx] = { ...list[pkgIdx], packageName: e.target.value };
                                setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              }}
                              className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                              placeholder="e.g. Gold Tier Feast"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Type</label>
                            <select
                              value={pkg.packageType || "Veg"}
                              onChange={(e) => {
                                const list = [...editedCaterer.menuPackages];
                                list[pkgIdx] = { ...list[pkgIdx], packageType: e.target.value };
                                setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              }}
                              className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                            >
                              <option value="Veg">Veg</option>
                              <option value="Non-Veg">Non-Veg</option>
                              <option value="Veg + Non-Veg">Veg + Non-Veg</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Price Per Plate (₹)</label>
                            <input
                              type="number"
                              value={pkg.pricePerPlate || pkg.price || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.menuPackages];
                                list[pkgIdx] = { ...list[pkgIdx], pricePerPlate: parseInt(e.target.value) || 0 };
                                setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              }}
                              className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                              placeholder="350"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Minimum Guests Required</label>
                            <input
                              type="number"
                              value={pkg.minimumGuests || pkg.guests || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.menuPackages];
                                list[pkgIdx] = { ...list[pkgIdx], minimumGuests: parseInt(e.target.value) || 0 };
                                setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              }}
                              className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                              placeholder="50"
                            />
                          </div>
                          <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Description / Highlights</label>
                            <textarea
                              rows={2}
                              value={pkg.description || pkg.desc || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.menuPackages];
                                list[pkgIdx] = { ...list[pkgIdx], description: e.target.value };
                                setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              }}
                              className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg p-3 text-xs text-white focus:outline-none resize-none"
                              placeholder="Brief description..."
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 sm:col-span-2 border-t border-[#DEAA38]/10 pt-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-stone-400 uppercase">Card Theme</label>
                              <select
                                value={pkg.cardTheme || pkg.theme || "silver"}
                                onChange={(e) => {
                                  const list = [...editedCaterer.menuPackages];
                                  list[pkgIdx] = { ...list[pkgIdx], cardTheme: e.target.value, theme: e.target.value };
                                  setEditedCaterer({ ...editedCaterer, menuPackages: list });
                                }}
                                className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                              >
                                <option value="silver">Silver</option>
                                <option value="gold">Gold</option>
                                <option value="platinum">Platinum</option>
                                <option value="premium">Premium Red</option>
                                <option value="royal">Royal Gold</option>
                                <option value="grand">Grand Amber</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-1.5 justify-center mt-2.5">
                              <input
                                type="checkbox"
                                id={`chk-pop-${pkg.id}`}
                                checked={pkg.popular || false}
                                onChange={(e) => {
                                  const list = [...editedCaterer.menuPackages];
                                  list[pkgIdx] = { ...list[pkgIdx], popular: e.target.checked };
                                  setEditedCaterer({ ...editedCaterer, menuPackages: list });
                                }}
                                className="w-3.5 h-3.5 accent-[#DEAA38] cursor-pointer"
                              />
                              <label htmlFor={`chk-pop-${pkg.id}`} className="text-[10px] font-bold text-stone-200 cursor-pointer uppercase">Popular Tag</label>
                            </div>
                            <div className="flex items-center gap-1.5 justify-center mt-2.5">
                              <input
                                type="checkbox"
                                id={`chk-vis-${pkg.id}`}
                                checked={pkg.visible !== false}
                                onChange={(e) => {
                                  const list = [...editedCaterer.menuPackages];
                                  list[pkgIdx] = { ...list[pkgIdx], visible: e.target.checked };
                                  setEditedCaterer({ ...editedCaterer, menuPackages: list });
                                }}
                                className="w-3.5 h-3.5 accent-[#DEAA38] cursor-pointer"
                              />
                              <label htmlFor={`chk-vis-${pkg.id}`} className="text-[10px] font-bold text-stone-200 cursor-pointer uppercase font-sans">Active/Visible</label>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 sm:col-span-2 border-t border-[#DEAA38]/10 pt-2">
                            <label className="text-[10px] font-bold text-[#DEAA38] uppercase">Menu Course Categories (comma separated)</label>
                            <textarea
                              rows={2}
                              value={Array.isArray(pkg.categories) ? pkg.categories.join(", ") : pkg.categories || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.menuPackages];
                                list[pkgIdx] = { ...list[pkgIdx], categories: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) };
                                setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              }}
                              className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                              placeholder="Drinks, Starters, Main Course, Breads, Dessert"
                            />
                          </div>

                          <div className="flex flex-col gap-1 sm:col-span-2">
                            <label className="text-[10px] font-bold text-[#DEAA38] uppercase">Menu Items / Dishes list (comma separated)</label>
                            <textarea
                              rows={3}
                              value={Array.isArray(pkg.items) ? pkg.items.join(", ") : pkg.items || ""}
                              onChange={(e) => {
                                const list = [...editedCaterer.menuPackages];
                                list[pkgIdx] = { ...list[pkgIdx], items: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) };
                                setEditedCaterer({ ...editedCaterer, menuPackages: list });
                              }}
                              className="bg-[#052118] border border-[#DEAA38]/25 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-y"
                              placeholder="Virgin Mojito, Paneer Tikka, Veg Biryani, Gulab Jamun"
                            />
                          </div>

                        </div>
                      </div>
                    );
                  })()
                )}
                {selectedPackageId === null && (
                  <div className="text-center py-10 border border-dashed border-[#DEAA38]/20 rounded-2xl text-stone-400 text-xs">
                    Select an existing package above or click 'Add New Package Tier' to customize event feeds!
                  </div>
                )}
              </div>
            )}

            {/* CONTACT DETAILS FORM */}
            {activeEditSection === "contact_details" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Official Telephone / Phone</label>
                  <input
                    type="text"
                    value={editedCaterer.phone || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, phone: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. +91 90000 12345"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Alternate / Backup Phone</label>
                  <input
                    type="text"
                    value={editedCaterer.alternatePhone || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, alternatePhone: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. +91 90000 54321"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">Official Email Address</label>
                  <input
                    type="email"
                    value={editedCaterer.email || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, email: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. contact@royalbanquet.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">WhatsApp Business Link Number</label>
                  <input
                    type="text"
                    value={editedCaterer.whatsappNumber || ""}
                    onChange={(e) => setEditedCaterer({ ...editedCaterer, whatsappNumber: e.target.value })}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. 919000012345"
                  />
                  <span className="text-[10px] text-[#6D6D6D] font-sans font-medium">Include country code without special characters (e.g. 919000012345 for India) for direct chat integration.</span>
                </div>
              </div>
            )}

          </div>

          {/* Action buttons footer */}
          <div className="pt-5 border-t border-[#E7D4A4]/40 bg-[#FFFFFF] flex items-center justify-between gap-4 shrink-0 font-sans mt-6">
            <button
              type="button"
              disabled={isSavingSection}
              onClick={() => setActiveEditSection(null)}
              className="px-6 py-3.5 bg-[#F7F4EE] hover:bg-[#E7D4A4]/35 text-[#1E1E1E] rounded-xl text-xs font-bold transition duration-300 border border-[#E7D4A4] grow text-center uppercase tracking-widest cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSavingSection}
              onClick={() => handleSaveSection(activeEditSection)}
              className="px-6 py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-white rounded-xl text-xs font-extrabold transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.35)] grow text-center uppercase tracking-widest cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingSection ? (
                <>
                  <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving Live...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </motion.div>
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FFFFFF] border border-[#E7D4A4] rounded-[28px] shadow-[0_32px_80px_rgba(212,175,55,0.08),0_16px_32px_rgba(0,0,0,0.03)] w-full max-w-xl p-8 text-[#1E1E1E] overflow-hidden relative flex flex-col"
            >
              <button
                type="button"
                onClick={() => setIsAddServiceModalOpen(false)}
                className="absolute top-5 right-5 text-[#6D6D6D] hover:text-[#1E1E1E] bg-[#F7F4EE] hover:bg-[#E7D4A4]/40 p-2.5 rounded-full transition cursor-pointer border border-[#E7D4A4]/20 flex items-center justify-center"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col mb-4 text-left">
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold font-mono">Service Templates</span>
                <h3 className="text-[#1E1E1E] font-serif font-black text-2xl mt-1 tracking-tight">
                  Add Custom Service
                </h3>
              </div>
              <p className="text-[#6D6D6D] text-xs mb-5 font-sans font-medium text-left">
                Create a custom service card or select one of the pre-designed popular templates below.
              </p>

              {/* Suggestions Panel Inside Modal */}
              <div className="mb-5 bg-[#FCFAF5] rounded-2xl p-4 border border-[#E8DCC7] text-left">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest block mb-2.5 font-mono">
                  Recommended Service Templates (Click to prefill)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#D4AF37]/50 scrollbar-track-transparent">
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
                          "text-[10px] px-3 py-1.5 rounded-lg transition font-sans font-bold flex items-center gap-1 cursor-pointer border",
                          isPrefilled
                            ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]"
                            : "bg-[#F7F4EE] hover:bg-[#E7D4A4]/20 text-[#1E1E1E] border-[#E7D4A4]/30"
                        )}
                      >
                        + {sug.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Input Form */}
              <div className="space-y-4 pt-1 text-left">
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                    Service Title
                  </label>
                  <input
                    type="text"
                    value={newServiceTitle}
                    onChange={(e) => setNewServiceTitle(e.target.value)}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                    placeholder="e.g. Traditional Royal Buffet"
                  />
                </div>

                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                    Service Description
                  </label>
                  <textarea
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all leading-relaxed resize-none font-medium h-18"
                    placeholder="Briefly describe what's included in this premium service package..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={newServiceImage}
                      onChange={(e) => setNewServiceImage(e.target.value)}
                      className="w-full bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-4 py-3 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all font-medium"
                      placeholder="Paste cover image URL..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 font-sans">
                    <label className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider font-mono">
                      Choose Icon Style
                    </label>
                    <div className="flex items-center gap-1.5 bg-[#F7F4EE] border border-[#E7D4A4] rounded-xl px-2.5 py-1 h-[42px]">
                      {Object.keys(serviceIcons).map((iconKey) => {
                        const IconComp = serviceIcons[iconKey];
                        const isSelected = newServiceIcon === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            onClick={() => setNewServiceIcon(iconKey)}
                            className={cn(
                              "p-1.5 rounded-md transition hover:bg-[#E7D4A4]/40 select-none cursor-pointer flex items-center justify-center",
                              isSelected ? "text-[#D4AF37] bg-white border border-[#E7D4A4]/60 shadow-xs" : "text-[#6D6D6D]"
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

                <div className="flex gap-4 pt-5 border-t border-[#E7D4A4]/40 mt-6 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsAddServiceModalOpen(false)}
                    className="bg-[#F7F4EE] hover:bg-[#E7D4A4]/35 text-[#1E1E1E] font-bold text-xs px-5 py-3.5 rounded-xl transition duration-300 border border-[#E7D4A4] cursor-pointer text-center uppercase tracking-widest grow"
                  >
                    Cancel
                  </button>
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
                    className="bg-[#D4AF37] hover:bg-[#E5C158] text-white font-extrabold text-xs px-5 py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.35)] cursor-pointer text-center uppercase tracking-widest grow"
                  >
                    Add Service
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
      {activeEditSection && renderActiveEditModal()}

      {/* Live profile display panel */}
      <div className="w-full bg-[#FCFAF6] md:bg-[#e9f6e3] relative overflow-x-hidden min-h-screen pb-12">

        {/* TOP ROW: BREADCRUMBS & NAVIGATION BUTTONS */}
        <div className="max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5 mt-[85px] sm:mt-[96px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-sans relative z-30 border-b border-[#D4AF37]/20">
          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-stone-600 font-medium">
            <Link to="/" className="hover:text-[#D4AF37] transition-all">Home</Link>
            <ChevronRight size={12} className="text-stone-400" />
            <Link to="/explore" className="hover:text-[#D4AF37] transition-all">Caterers</Link>
            <ChevronRight size={12} className="text-stone-400" />
            <span className="font-semibold text-[#D4AF37] bg-stone-100 px-2.5 py-1 rounded-md border border-[#D4AF37]/30">{targetCatererObj.brandName || targetCatererObj.name}</span>
          </div>

          {/* Action Row */}
          <div className="flex gap-2 items-center font-sans w-full md:w-auto justify-end">
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
              className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 text-stone-800 px-4 py-2 rounded-full font-bold transition-all duration-300 border border-[#D4AF37]/35 text-[10px] cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              Share
            </button>
          </div>
        </div>

        {/* SECTION 1: HERO CONTAINER WITH INTEGRATED COVER BANNER */}
        <div className="hidden md:block max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mb-[20px] mt-[1px] relative z-20 lg:h-[364.875px]">
          <div className="bg-[#0b0b0b] rounded-[2rem] border border-[#D4AF37]/30 overflow-hidden relative shadow-[0_12px_40px_rgba(0,0,0,0.5)] h-full">
            
            {/* Split layout: text and details on left, image with gradient overlay on right */}
            <div className="flex flex-col lg:flex-row h-full min-h-[220px]">
              
              {/* Left Details Panel */}
              <div className="flex-1 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between relative z-10 text-left h-full">
                
                {/* Brand Logo & Name Block */}
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6 lg:gap-8">
                  
                  {/* Circular Crest Logo */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 sm:w-30 sm:h-30 md:w-38 md:h-38 lg:w-44 lg:h-44 bg-[#0b0b0b] rounded-full border-2 border-[#D4AF37] flex items-center justify-center relative shadow-[0_8px_24px_rgba(0,0,0,0.4)] overflow-hidden ring-4 ring-[#D4AF37]/20 ring-offset-4 ring-offset-[#0b0b0b]">
                      {editedCaterer && isEditing ? (
                        <>
                          {editedCaterer.logo ? (
                            <img src={editedCaterer.logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="font-serif font-bold text-[#D4AF37] text-2xl md:text-3xl">{editedCaterer.brandName?.substring(0, 2) || "CN"}</span>
                          )}
                          <label className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white text-[9px] font-bold uppercase cursor-pointer rounded-full opacity-0 hover:opacity-100 transition duration-200">
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
                        <img src={targetCatererObj.logo} alt="Logo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2 rounded-full">
                          <span className="text-[#D4AF37] text-2xl sm:text-3xl">👑</span>
                          <span className="font-serif font-black text-[#D4AF37] text-base sm:text-lg">
                            {targetCatererObj.brandName?.substring(0, 2) || targetCatererObj.name?.substring(0, 2) || "CN"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Brand details */}
                  <div className="text-center sm:text-left flex flex-col justify-center">
                    <div className="flex flex-row flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                        {targetCatererObj.brandName || targetCatererObj.name}
                      </h1>
                      {targetCatererObj.status === "Approved" && (
                        <span className="inline-flex items-center justify-center text-[#D4AF37] ml-1 shrink-0" title="Verified Check">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l2.4 1.4 2.7-.4.9 2.6 2.5 1.1-.4 2.7 1.8 2-1.3 2.4.9 2.7-2.2 1.6-.9 2.6-2.7-.4-2.1 1.8-2.1-1.8-2.7.4-.9-2.6-2.2-1.6.9-2.7-1.3-2.4 1.8-2-.4-2.7 2.5-1.1.9-2.6 2.7.4L12 2zm-1 13.5l5.5-5.5-1.4-1.4-4.1 4.1-1.9-1.9-1.4 1.4 3.3 3.3z" />
                          </svg>
                        </span>
                      )}
                    </div>

                    {targetCatererObj.tagline && (
                      <p className="text-[#D4AF37] text-xs sm:text-sm font-extrabold tracking-widest uppercase mt-1.5 opacity-95">
                        ✦ {targetCatererObj.tagline}
                      </p>
                    )}
                  </div>

                </div>

                {/* Experience Information Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-5 border-t border-[#D4AF37]/20 w-full font-sans">
                  
                  {/* Block 1 */}
                  <div className="flex items-center gap-3.5 text-left">
                    {(() => {
                      const IconComp = getHeroIconComponent(targetCatererObj.heroCard1Icon, ChefHat);
                      return <IconComp size={22} className="text-[#D4AF37] shrink-0 stroke-[1.5]" />;
                    })()}
                    <div className="flex flex-col">
                      <span className="font-sans font-black text-white text-sm md:text-base tracking-wide leading-tight">
                        {targetCatererObj.heroCard1Title || "Fine Dining"}
                      </span>
                      <span className="font-sans text-[11px] text-[#D4AF37] font-extrabold tracking-wider uppercase leading-tight mt-0.5 opacity-85">
                        {targetCatererObj.heroCard1Text || "Premium Catering"}
                      </span>
                    </div>
                  </div>

                  {/* Block 2 */}
                  <div className="flex items-center gap-3.5 text-left">
                    {(() => {
                      const IconComp = getHeroIconComponent(targetCatererObj.heroCard2Icon, Award);
                      return <IconComp size={22} className="text-[#D4AF37] shrink-0 stroke-[1.5]" />;
                    })()}
                    <div className="flex flex-col">
                      <span className="font-sans font-black text-white text-sm md:text-base tracking-wide leading-tight">
                        {targetCatererObj.heroCard2Value || (targetCatererObj.experience ? (targetCatererObj.experience.toString().includes("Year") ? targetCatererObj.experience : `${targetCatererObj.experience}+ Years`) : "20+ Years")}
                      </span>
                      <span className="font-sans text-[11px] text-[#D4AF37] font-extrabold tracking-wider uppercase leading-tight mt-0.5 opacity-85">
                        {targetCatererObj.heroCard2Text || "Experience"}
                      </span>
                    </div>
                  </div>

                  {/* Block 3 */}
                  <div className="flex items-center gap-3.5 text-left">
                    {(() => {
                      const IconComp = getHeroIconComponent(targetCatererObj.heroCard3Icon, MapPin);
                      return <IconComp size={22} className="text-[#D4AF37] shrink-0 stroke-[1.5]" />;
                    })()}
                    <div className="flex flex-col">
                      <span className="font-sans font-black text-white text-sm md:text-base tracking-wide leading-tight">
                        {targetCatererObj.heroCard3Value || targetCatererObj.address || "Hyderabad, Telangana"}
                      </span>
                      <span className="font-sans text-[11px] text-[#D4AF37] font-extrabold tracking-wider uppercase leading-tight mt-0.5 opacity-85">
                        {targetCatererObj.heroCard3Text || "Serving Across Telangana"}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Cover Image Panel with gradient overlay */}
              <div className="w-full lg:w-[45%] h-48 lg:h-full relative overflow-hidden shrink-0">
                <img 
                  src={editedCaterer && isEditing ? (editedCaterer.coverBanner || fallbackBanner) : (fallbackBanner || "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200&auto=format&fit=crop")} 
                  alt="Cover Banner" 
                  className="w-full h-full object-cover lg:h-[366.891px]"
                  referrerPolicy="no-referrer"
                />
                
                {/* Horizontal gradient overlap on desktop, vertical on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#0b0b0b] lg:via-[#0b0b0b]/30 lg:to-transparent z-10"></div>
                
                {/* Heart/Wishlist Button */}
                <div className="absolute top-4 right-4 z-25 flex items-center gap-2">
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      onClick={() => openEditModal("hero")}
                      className="w-10 h-10 rounded-full bg-[#0b0b0b]/80 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0b0b0b] transition-all flex items-center justify-center shadow-md border border-[#D4AF37]/35 cursor-pointer"
                      title="Edit Hero & Profile Details"
                    >
                      <Pencil size={15} className="stroke-current stroke-[2]" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-[#0b0b0b]/80 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#0b0b0b] transition-all flex items-center justify-center shadow-md border border-[#D4AF37]/35 cursor-pointer"
                    title="Save to Shortlist"
                  >
                    <Heart size={16} className="fill-none stroke-current stroke-[2.5]" />
                  </button>
                </div>

                {isOwnerOrAdmin && isEditing && (
                  <label className="absolute bottom-4 right-4 z-25 flex items-center gap-1.5 bg-[#0b0b0b]/90 hover:bg-[#D4AF37]/95 text-[#D4AF37] hover:text-[#0b0b0b] px-3.5 py-1.5 rounded-full font-bold transition-all border border-[#D4AF37]/35 shadow-sm text-xs cursor-pointer font-sans">
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

            </div>

          </div>
        </div>

        {/* SECTION 1.5: TABS BAR SYSTEM */}
        <div className="hidden md:block max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6 relative z-30 font-sans">
          <div className="bg-[#0b0b0b]/95 p-1.5 rounded-2xl border border-[#D4AF37]/35 flex flex-wrap md:flex-nowrap gap-1 shadow-lg overflow-x-auto no-scrollbar justify-start md:justify-center w-full backdrop-blur-md">
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
                    "px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer border",
                    isActive
                      ? "bg-[#D4AF37] text-[#0b0b0b] border-[#D4AF37] shadow-md"
                      : "bg-transparent text-slate-300 hover:text-white hover:bg-white/5 border-transparent",
                  )}
                >
                  {tab === "Overview" && (
                    <LayoutGrid size={13} className={isActive ? "text-[#0b0b0b]" : "text-slate-400"} />
                  )}
                  {tab === "Packages" && (
                    <Package size={13} className={isActive ? "text-[#0b0b0b]" : "text-slate-400"} />
                  )}
                  {tab === "Menu" && (
                    <MenuSquare size={13} className={isActive ? "text-[#0b0b0b]" : "text-slate-400"} />
                  )}
                  {tab === "Gallery" && (
                    <ImageIcon size={13} className={isActive ? "text-[#0b0b0b]" : "text-slate-400"} />
                  )}
                  {tab === "Reviews" && (
                    <Star size={13} className={isActive ? "text-[#0b0b0b]" : "text-slate-400"} />
                  )}
                  {tab === "About Us" && (
                    <User size={13} className={isActive ? "text-[#0b0b0b]" : "text-slate-400"} />
                  )}
                  <span>{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

      <div className="hidden md:block max-w-[1280px] lg:max-w-[1320px] xl:max-w-[1360px] w-[95%] mx-auto px-4 sm:px-6 lg:px-8 relative z-30 pb-16">
        
        {/* SECTION 2: REDESIGNED LUXURY CARDS SYSTEM - TWO-COLUMN BENTO */}
        <div id="overview-section" className="scroll-mt-24 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
            
            {/* Left 2 Columns: About Us, Services, and Gallery */}
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
                openEditModal={openEditModal}
                handleSaveFields={handleSaveFields}
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
                openEditModal={openEditModal}
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
                openEditModal={openEditModal}
              />

            </div> {/* Closes Left Column */}

            {/* Right Column: Quick Info, Branch Details, Service Areas, Achievements */}
            <div className="lg:col-span-1 flex flex-col gap-6 w-full">
              <QuickInfoCard
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
                openEditModal={openEditModal}
              />

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
                openEditModal={openEditModal}
                handleSaveFields={handleSaveFields}
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
                openEditModal={openEditModal}
                handleSaveFields={handleSaveFields}
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
                openEditModal={openEditModal}
              />
            </div> {/* Closes Right Column */}

          </div> {/* Closes bento grid wrapper */}
        </div> {/* Closes overview-section */}

        {/* Full-width Menu Packages, Video Showcase, and Support Notice */}
        <div className="mt-10 flex flex-col gap-8 w-full text-left">
          
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
            openEditModal={openEditModal}
          />

          {/* SECTION 6: VIDEO SHOWCASE SYSTEM */}
          <section id="video-showcase" className="w-full text-left">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Video */}
              <div className="lg:col-span-1 bg-white rounded-[24px] border border-[#D4AF37]/25 p-6 flex flex-col shadow-md">
                <h2 className="text-xl font-serif font-black text-[#173D32] mb-1">Video Showcase</h2>
                <p className="text-xs text-slate-500 mb-4">To protect cuisine and service in action</p>
                
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 group cursor-pointer flex-1 min-h-[180px]">
                  <img 
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop" 
                    alt="Video Thumbnail" 
                    className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-4">
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 w-fit text-white text-[10px] font-bold">
                      {targetCatererObj.brandName || targetCatererObj.name}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#06281E] flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                        <PlayCircle size={28} fill="currentColor" className="text-white" />
                      </div>
                    </div>
                    <span className="text-[10px] text-white/80 font-medium self-start">By CaterNest</span>
                  </div>
                </div>
              </div>

              {/* Right Video (Featured Film) */}
              <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#D4AF37]/25 p-6 flex flex-col shadow-md">
                <h2 className="text-xl font-serif font-black text-[#173D32] mb-1">Gala Showcase Film</h2>
                <p className="text-xs text-slate-500 mb-4">Explore events in real life</p>
                
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 group cursor-pointer flex-1 min-h-[180px]">
                  <img 
                    src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop" 
                    alt="Featured Film Thumbnail" 
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div className="flex-1 text-left max-w-xl">
                        <span className="inline-block bg-[#D4AF37] text-[#06281E] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-2.5">
                          FEATURED FILM • 2:36
                        </span>
                        <h3 className="text-white font-serif font-bold text-lg sm:text-xl md:text-2xl leading-snug mb-2">
                          Grand Banquet orchestration & royal wedding experience (Official Film)
                        </h3>
                        <p className="text-white/80 text-xs leading-relaxed hidden sm:block">
                          Take a look at spectacular setups, signature menus and the care we bring to every event — turning moments into unforgettable experiences.
                        </p>
                      </div>
                      <div className="shrink-0 self-center md:self-end">
                        <div className="w-14 h-14 rounded-full bg-white text-[#06281E] flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                          <PlayCircle size={32} fill="currentColor" className="text-[#06281E]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: CONTACT PROTECTION NOTICE */}
          <div className="bg-[#FAF6EC] border border-[#D4AF37]/25 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-md w-full text-left">
            <div className="w-16 h-16 bg-[#06281E] text-[#D4AF37] rounded-full flex flex-shrink-0 items-center justify-center border border-[#D4AF37]/40 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-serif font-bold text-[#173D32] mb-1.5 text-xl">
                Privacy Protected Contact
              </h4>
              <p className="text-slate-600 font-sans text-sm leading-relaxed">
                To protect caterer confidentiality, direct contact details
                (Phone & WhatsApp) will be securely shared only after your
                order is confirmed.
              </p>
            </div>
            {user?.role === "admin" && (
              <div className="flex gap-4 items-center border-t md:border-t-0 md:border-l border-[#D4AF37]/20 pt-4 md:pt-0 md:pl-6 w-full md:w-auto shrink-0">
                <div className="text-[#173D32] font-bold flex flex-col font-sans">
                  <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-extrabold font-mono">
                    Admin View
                  </span>
                  <span className="flex items-center gap-2 text-sm text-[#06281E] mt-1">
                    <Phone size={14} /> {caterer.phone}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ==================================================== */}
        {/* MOBILE VIEW LAYOUT (VISIBLE ONLY ON MOBILE < 768px) */}
        {/* ==================================================== */}
        <div className="block md:hidden max-w-[100vw] overflow-x-hidden pb-36 space-y-5 bg-[#FCFAF6] relative z-20">
          <style dangerouslySetInnerHTML={{__html: `
            @media (max-width: 767px) {
              #main-navigation-navbar { display: none !important; }
            }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          {/* Sticky Mobile Header */}
          <div className="sticky top-0 z-[100] bg-[#FCFAF6]/95 backdrop-blur-md border-b border-[#D4AF37]/25 px-4 py-3 flex items-center justify-between shadow-xs">
            <button 
              type="button" 
              onClick={() => alert("Menu: Use active page sections below or explore our curated packages.")}
              className="p-1 text-[#173D32] hover:text-[#D4AF37] transition"
            >
              <MenuSquare size={20} className="stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#D4AF37] p-1.5 rounded-lg text-white">
                <ChefHat size={15} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold font-serif leading-none text-[#173D32] tracking-tight">CaterNest</span>
                <span className="text-[6.5px] uppercase font-sans tracking-widest text-[#D4AF37] font-black leading-none mt-0.5">Making Every Event Special</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button type="button" className="relative p-1 text-[#173D32] hover:text-[#D4AF37] transition">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D4AF37] rounded-full ring-2 ring-white"></span>
              </button>
              <Link to="/profile" className="w-7 h-7 rounded-full border border-[#D4AF37] bg-[#FAF8F3] overflow-hidden flex items-center justify-center">
                <User size={14} className="text-[#173D32]" />
              </Link>
            </div>
          </div>

          {/* 1. MOBILE BREADCRUMBS */}
          <div className="px-4 pt-1 font-sans">
            <div className="flex items-center gap-1.5 text-[9.5px] text-stone-500 font-extrabold uppercase tracking-wider">
              <Link to="/" className="hover:text-[#D4AF37] transition-all">Home</Link>
              <ChevronRight size={8} className="text-stone-400 shrink-0 stroke-[3]" />
              <Link to="/explore" className="hover:text-[#D4AF37] transition-all">Caterers</Link>
              <ChevronRight size={8} className="text-stone-400 shrink-0 stroke-[3]" />
              <span className="text-[#D4AF37] truncate max-w-[140px]">{targetCatererObj.brandName || targetCatererObj.name}</span>
            </div>
          </div>

          {/* 2. HERO SECTION */}
          <div id="overview-mobile" className="px-4 scroll-mt-[130px]">
            <div className="bg-white rounded-[20px] border border-[#D4AF37]/20 overflow-hidden shadow-[0_4px_25px_rgba(23,61,50,0.03)] relative">
              {/* Cover Image */}
              <div className="w-full h-44 relative overflow-hidden">
                <img 
                  src={editedCaterer && isEditing ? (editedCaterer.coverBanner || fallbackBanner) : (fallbackBanner || "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1200&auto=format&fit=crop")} 
                  alt="Cover Banner" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/30 z-10"></div>
                
                {/* Floating Heart Button */}
                <div className="absolute top-3 right-3 z-20">
                  <button
                    type="button"
                    onClick={() => alert("Added to your favorites list!")}
                    className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/35 text-[#D4AF37] flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
                  >
                    <Heart size={15} className="fill-[#D4AF37] stroke-[#D4AF37] stroke-[2]" />
                  </button>
                </div>
              </div>

              {/* Profile Stack Content */}
              <div className="px-5 pb-6 flex flex-col items-center -mt-11 relative z-20">
                {/* Logo Crest */}
                <div className="w-22 h-22 bg-[#FCFAF6] rounded-full border-2 border-[#D4AF37] flex items-center justify-center shadow-md overflow-hidden ring-4 ring-[#D4AF37]/15">
                  {targetCatererObj.logo ? (
                    <img src={targetCatererObj.logo} alt="Logo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="font-serif font-bold text-[#D4AF37] text-2xl">👑</span>
                  )}
                </div>

                {/* Business Name & Badge */}
                <div className="flex items-center gap-1.5 mt-4 justify-center">
                  <h1 className="text-xl font-serif font-black text-[#173D32] text-center tracking-tight leading-tight">
                    {targetCatererObj.brandName || targetCatererObj.name}
                  </h1>
                  {targetCatererObj.status === "Approved" && (
                    <span className="text-[#D4AF37] shrink-0" title="Verified Check">
                      <svg className="w-4.5 h-4.5 filter drop-shadow-[0_1px_2px_rgba(212,175,55,0.2)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2.4 1.4 2.7-.4.9 2.6 2.5 1.1-.4 2.7 1.8 2-1.3 2.4.9 2.7-2.2 1.6-.9 2.6-2.7-.4-2.1 1.8-2.1-1.8-2.7.4-.9-2.6-2.2-1.6.9-2.7-1.3-2.4 1.8-2-.4-2.7 2.5-1.1.9-2.6 2.7.4L12 2zm-1 13.5l5.5-5.5-1.4-1.4-4.1 4.1-1.9-1.9-1.4 1.4 3.3 3.3z" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Tagline */}
                {targetCatererObj.tagline && (
                  <p className="text-[#A27008] text-[10px] font-extrabold tracking-wider uppercase mt-1.5 text-center font-sans">
                    ✦ {targetCatererObj.tagline} ✦
                  </p>
                )}

                {/* Divider */}
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-transparent my-4"></div>

                {/* Experience and Location row */}
                <div className="grid grid-cols-3 gap-1 w-full text-center font-sans">
                  <div className="flex flex-col items-center">
                    <ChefHat size={16} className="text-[#D4AF37] mb-1" />
                    <span className="text-[#173D32] font-black text-[11px] leading-tight">
                      {targetCatererObj.heroCard1Title || "Fine Dining"}
                    </span>
                    <span className="text-slate-400 text-[8px] uppercase tracking-wider font-extrabold mt-0.5">
                      Style
                    </span>
                  </div>

                  <div className="flex flex-col items-center border-x border-[#D4AF37]/20">
                    <Award size={16} className="text-[#D4AF37] mb-1" />
                    <span className="text-[#173D32] font-black text-[11px] leading-tight">
                      {experienceVal ? `${experienceVal}+ Years` : "15+ Years"}
                    </span>
                    <span className="text-slate-400 text-[8px] uppercase tracking-wider font-extrabold mt-0.5">
                      Experience
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <MapPin size={16} className="text-[#D4AF37] mb-1" />
                    <span className="text-[#173D32] font-black text-[11px] leading-tight truncate max-w-[85px]">
                      {targetCatererObj.city || "Hyderabad"}
                    </span>
                    <span className="text-slate-400 text-[8px] uppercase tracking-wider font-extrabold mt-0.5">
                      Central
                    </span>
                  </div>
                </div>

                {/* Service area radius banner */}
                <div className="mt-4.5 bg-[#FAF6EC] border border-[#D4AF37]/25 rounded-xl py-2 px-3.5 w-full flex items-center justify-between text-[10px] font-sans text-[#173D32]">
                  <span className="font-semibold">📍 Area Radius:</span>
                  <span className="font-black text-[#A27008]">
                    {targetCatererObj.serveEntireHyderabad ? "Entire Hyderabad" : `Within ${targetCatererObj.serviceRadiusKm || 15} KM`}
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Top Quick Actions Row */}
          <div className="px-4">
            <div className="bg-[#FAF6EC]/50 border border-[#D4AF37]/20 rounded-[20px] p-4.5 space-y-4">
              <div className="grid grid-cols-4 gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => alert("Direct mobile lines are kept confidential. Verified contact number will unlock automatically once booking order gets placed.")}
                  className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-stone-100 hover:border-[#D4AF37]/40 transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#173D32]/5 text-[#173D32] flex items-center justify-center">
                    <Phone size={14} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">Call Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert("WhatsApp support portal is secured. Link will be forwarded directly via WhatsApp message after scheduling.")}
                  className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-stone-100 hover:border-[#D4AF37]/40 transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#01A378]/5 text-[#01A378] flex items-center justify-center">
                    <MessageCircle size={14} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-stone-100 hover:border-[#D4AF37]/40 transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-500/5 text-[#A27008] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">Share Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsBranchesOpen(true);
                    document.getElementById("branches-section-mobile")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-stone-100 hover:border-[#D4AF37]/40 transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-500/5 text-blue-700 flex items-center justify-center">
                    <Map size={14} className="stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-600">Location</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className="h-10 rounded-xl border border-[#D4AF37] text-[#A27008] bg-white font-extrabold text-[10.5px] uppercase tracking-wider flex items-center justify-center active:scale-95 transition cursor-pointer hover:bg-[#FAF6EC]/50"
                >
                  Request Quote
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("packages-mobile")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="h-10 rounded-xl bg-[#01A378] hover:bg-[#028b67] text-white font-extrabold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition shadow-sm"
                >
                  Book Now <ChevronRight size={12} className="stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. STICKY MOBILE TABS */}
          <div className="sticky top-[56px] z-40 bg-[#FCFAF6]/95 backdrop-blur-md border-y border-[#D4AF37]/15 py-3 px-4 overflow-x-auto no-scrollbar scroll-smooth flex gap-2 shadow-xs">
            {[
              { id: "about-mobile", label: "About" },
              { id: "packages-mobile", label: "Packages" },
              { id: "services-mobile", label: "Services" },
              { id: "gallery-mobile", label: "Gallery" },
              { id: "videos-mobile", label: "Videos" },
              { id: "reviews-mobile", label: "Reviews" }
            ].map((tab) => {
              const isActive = activeTab === tab.label;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.label);
                    document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "px-4.5 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all duration-300 border cursor-pointer",
                    isActive
                      ? "bg-[#D4AF37] text-[#0b0b0b] border-[#D4AF37] shadow-sm font-black"
                      : "bg-white text-stone-600 border-stone-200 hover:border-[#D4AF37]/50"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 4. ABOUT US SECTION */}
          <div id="about-mobile" className="px-4 scroll-mt-[115px]">
            <div className="bg-white rounded-[20px] p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(23,61,50,0.02)] text-left">
              <h2 className="text-lg font-serif font-black text-[#173D32] mb-1">
                About Us
              </h2>
              <div className="h-[1px] bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/45 to-[#D4AF37]/10 my-3.5"></div>

              {/* Meet Chef block */}
              <div className="flex items-start gap-3.5 bg-[#FFFDF9] border border-[#DFC27A]/20 rounded-xl p-4 mb-4 shadow-2xs">
                <img 
                  src={targetCatererObj.ownerPhoto || "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=150"} 
                  alt={targetCatererObj.ownerName || "Executive Chef"} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] text-[#A27008] font-black uppercase tracking-widest block mb-0.5 font-mono">Executive Planner & Owner</span>
                  <h3 className="font-serif font-bold text-xs text-[#173D32] leading-tight">{targetCatererObj.ownerName || "Chef Vikram S. Oberoi"}</h3>
                  <p className="text-[10px] italic text-slate-500 font-medium leading-relaxed mt-1">
                    "Every grand banquet we orchestrate is a canvas of culinary heritage, rich flavor profiling, and pristine visual luxury."
                  </p>
                </div>
              </div>

              {/* Main description */}
              <p className="text-slate-600 text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap mb-5">
                {targetCatererObj.description || "Welcome to our premium catering service. We bring extraordinary food, luxury arrangements, and top tier hospitality to elevate your special day."}
              </p>

              {/* STATISTICS GRID */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#DFC27A]/15 font-sans">
                <div className="bg-[#FAF6EC]/40 p-3.5 rounded-xl border border-[#DFC27A]/20 flex flex-col items-center text-center">
                  <ChefHat size={18} className="text-[#D4AF37] mb-1.5" />
                  <span className="text-sm font-black text-[#173D32] leading-tight">
                    {experienceVal ? `${experienceVal}+ Years` : "15+ Years"}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Heritage</span>
                </div>

                <div className="bg-[#FAF6EC]/40 p-3.5 rounded-xl border border-[#DFC27A]/20 flex flex-col items-center text-center">
                  <Award size={18} className="text-[#D4AF37] mb-1.5" />
                  <span className="text-sm font-black text-[#173D32] leading-tight">1,200+</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Grand Banquets</span>
                </div>

                <div className="bg-[#FAF6EC]/40 p-3.5 rounded-xl border border-[#DFC27A]/20 flex flex-col items-center text-center">
                  <Users size={18} className="text-[#D4AF37] mb-1.5" />
                  <span className="text-sm font-black text-[#173D32] leading-tight">
                    {targetCatererObj.minGuests || 50} Pax
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Min Booking</span>
                </div>

                <div className="bg-[#FAF6EC]/40 p-3.5 rounded-xl border border-[#DFC27A]/20 flex flex-col items-center text-center">
                  <Star size={18} className="text-[#D4AF37] mb-1.5" fill="currentColor" />
                  <span className="text-sm font-black text-[#173D32] leading-tight">
                    {targetCatererObj.rating || "4.9"} ★
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Avg Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Specifications Stacked Rows */}
          <div className="px-4">
            <div className="bg-white rounded-[20px] p-5 border border-[#D4AF37]/20 shadow-[0_4px_20px_rgba(23,61,50,0.02)] text-left">
              <h2 className="text-base font-serif font-black text-[#173D32] mb-1">
                Quick Specifications
              </h2>
              <div className="h-[1px] bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/45 to-[#D4AF37]/10 my-3.5"></div>

              <div className="space-y-3 font-sans">
                {[
                  { icon: <ChefHat size={14} />, label: "Cuisine Specialties", value: targetCatererObj.cuisineType || "Deccani, Hyderabadi, Royal Awadhi" },
                  { icon: <Users size={14} />, label: "Guest Scale Limits", value: targetCatererObj.minGuests ? `${targetCatererObj.minGuests} to 10,000+ guests` : "50 to 5,000+ guests" },
                  { icon: <Clipboard size={14} />, label: "Estimated Price Per Plate", value: targetCatererObj.priceRange || "₹550 - ₹1,500 (Base)" },
                  { icon: <MapPin size={14} />, label: "Centralized Kitchen", value: targetCatererObj.kitchenLocation || targetCatererObj.address || "Jubilee Hills, Hyderabad" },
                  { icon: <Clock size={14} />, label: "Minimum Booking Lead Time", value: targetCatererObj.bookingLeadTime || "2 - 6 Weeks Prior" },
                  { icon: <ShieldCheck size={14} />, label: "Average Response Rate", value: targetCatererObj.responseTime || "Within 3 Hours" },
                  { icon: <Map size={14} />, label: "Service Radius limit", value: targetCatererObj.serviceRadiusKm ? `${targetCatererObj.serviceRadiusKm} Kilometers` : "15 Kilometers" },
                  { icon: <Award size={14} />, label: "Year Established", value: targetCatererObj.establishedYear || "2015" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-3 border-b border-[#DFC27A]/10 last:border-0 last:pb-0 gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#173D32]/5 text-[#D4AF37] flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 truncate leading-none">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-black text-[#173D32] text-right truncate max-w-[150px]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. BRANCH DETAILS ACCORDION */}
          <div id="branches-section-mobile" className="px-4">
            <div className="bg-white rounded-[20px] border border-[#D4AF37]/20 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsBranchesOpen(!isBranchesOpen)}
                className="w-full px-5 py-4.5 flex items-center justify-between text-left font-serif font-black text-[#173D32] text-sm tracking-tight cursor-pointer animate-none bg-white outline-none"
              >
                <span className="flex items-center gap-2">
                  <Building size={16} className="text-[#D4AF37]" />
                  Branch Details ({branchesToShow.length})
                </span>
                {isBranchesOpen ? <ChevronUp size={16} className="text-[#D4AF37]" /> : <ChevronDown size={16} className="text-[#D4AF37]" />}
              </button>
              
              {isBranchesOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-[#D4AF37]/10 space-y-4 bg-white">
                  {branchesToShow.map((branch: any, idx: number) => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address || branch.location || "")}`;
                    return (
                      <div key={idx} className="flex gap-3 items-start font-sans pb-3 border-b border-[#DFC27A]/10 last:border-0 last:pb-0">
                        <MapPin size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{branch.name}</span>
                          <span className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{branch.address || branch.location}</span>
                          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#A27008] hover:underline mt-1 flex items-center gap-0.5">
                            🗺️ Open in Google Maps
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 6. SERVICE AREAS ACCORDION */}
          <div className="px-4">
            <div className="bg-white rounded-[20px] border border-[#D4AF37]/20 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setIsAreasOpen(!isAreasOpen)}
                className="w-full px-5 py-4.5 flex items-center justify-between text-left font-serif font-black text-[#173D32] text-sm tracking-tight cursor-pointer animate-none bg-white outline-none"
              >
                <span className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#D4AF37]" />
                  Service Areas & Limits
                </span>
                {isAreasOpen ? <ChevronUp size={16} className="text-[#D4AF37]" /> : <ChevronDown size={16} className="text-[#D4AF37]" />}
              </button>
              
              {isAreasOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-[#D4AF37]/10 space-y-4 bg-white">
                  {targetCatererObj.serviceRadiusKm && (
                    <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[11px] font-sans">
                      <span className="text-base">📍</span>
                      <div>
                        <p className="font-bold text-slate-800">Serving within {targetCatererObj.serviceRadiusKm} KM</p>
                        <p className="text-[9px] text-slate-500">from primary centralized kitchen</p>
                      </div>
                    </div>
                  )}
                  {targetCatererObj.serveEntireHyderabad && (
                    <div className="inline-flex items-center gap-1.5 bg-[#173D32]/10 text-[#173D32] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest font-sans">
                      ✨ Covers Entire Hyderabad Region
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {areas.map((area, idx) => (
                      <div key={idx} className="bg-stone-50 border border-stone-200 text-stone-600 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans">
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 7. MENU PACKAGES SECTION */}
          <div id="packages-mobile" className="px-4 scroll-mt-[130px]">
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
              openEditModal={openEditModal}
            />
          </div>

          {/* 8. SERVICES SECTION */}
          <div id="services-mobile" className="px-4 scroll-mt-[130px]">
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
              openEditModal={openEditModal}
            />
          </div>

          {/* 9. FOOD GALLERY */}
          <div id="gallery-mobile" className="px-4 scroll-mt-[130px]">
            <div className="bg-white rounded-[24px] p-5 border border-[#D4AF37]/25 shadow-sm text-left">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-serif font-black text-[#173D32]">
                  Food Gallery
                </h2>
                {/* Image Counter */}
                <div className="bg-[#173D32]/10 text-[#173D32] px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-widest shrink-0">
                  {mobileGalleryIndex + 1} / {allGalleryPhotos.length}
                </div>
              </div>
              
              <div className="h-[1px] bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/45 to-[#D4AF37]/10 mb-4"></div>

              {/* Slider container */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md group bg-stone-100">
                <img 
                  src={allGalleryPhotos[mobileGalleryIndex]} 
                  alt="Gallery highlight" 
                  className="w-full h-full object-cover cursor-zoom-in active:scale-95 transition-all duration-300"
                  onClick={() => openLightbox(allGalleryPhotos, mobileGalleryIndex)}
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 z-10">
                  <span className="text-white font-sans text-[10px] font-bold uppercase tracking-wider">
                    CaterNest Signature Plating
                  </span>
                </div>

                {/* Slider Controls */}
                <button 
                  type="button"
                  onClick={() => setMobileGalleryIndex((prev) => (prev - 1 + allGalleryPhotos.length) % allGalleryPhotos.length)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/35 cursor-pointer active:scale-90 transition"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} />
                </button>

                <button 
                  type="button"
                  onClick={() => setMobileGalleryIndex((prev) => (prev + 1) % allGalleryPhotos.length)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/35 cursor-pointer active:scale-90 transition"
                >
                  <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>
              
              {/* Gallery Mini Dots */}
              <div className="flex justify-center gap-1.5 mt-3 overflow-x-auto py-1 max-w-full">
                {allGalleryPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMobileGalleryIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300 shrink-0 cursor-pointer",
                      mobileGalleryIndex === idx ? "bg-[#D4AF37] w-4" : "bg-stone-300"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 10. VIDEOS SECTION */}
          <div id="videos-mobile" className="px-4 scroll-mt-[130px] space-y-4">
            <div className="bg-white rounded-[24px] p-5 border border-[#D4AF37]/25 shadow-sm text-left">
              <h2 className="text-lg font-serif font-black text-[#173D32] mb-1">
                Video Showcase
              </h2>
              <div className="h-[1px] bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/45 to-[#D4AF37]/10 mb-4"></div>

              {/* Video Card 1 */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 group cursor-pointer mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop" 
                  alt="Video Thumbnail" 
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-black/35 flex flex-col justify-between p-3.5">
                  <span className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 text-white text-[9px] font-bold w-fit">
                    {targetCatererObj.brandName || targetCatererObj.name}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-white flex items-center justify-center shadow-md">
                      <PlayCircle size={24} fill="currentColor" className="text-white" />
                    </div>
                  </div>
                  <span className="text-[9px] text-white/80 font-semibold self-start">Cuisine & Service in Action</span>
                </div>
              </div>

              {/* Video Card 2 */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 group cursor-pointer">
                <img 
                  src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1200&auto=format&fit=crop" 
                  alt="Featured Film Thumbnail" 
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-black/35 flex flex-col justify-between p-3.5">
                  <span className="bg-[#D4AF37] text-[#06281E] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest w-fit">
                    GALA FILM • 2:36
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white text-[#06281E] flex items-center justify-center shadow-md">
                      <PlayCircle size={24} fill="currentColor" className="text-[#06281E]" />
                    </div>
                  </div>
                  <h3 className="text-white font-serif font-bold text-xs leading-snug self-start truncate max-w-[200px]">
                    Royal banquet & wedding catering official showcase
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* 11. REVIEWS SECTION */}
          <div id="reviews-mobile" className="px-4 scroll-mt-[130px]">
            <div className="bg-white rounded-[24px] p-5 border border-[#D4AF37]/25 shadow-sm text-left">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-serif font-black text-[#173D32]">
                  Customer Reviews
                </h2>
                <div className="flex items-center gap-1 text-[#D4AF37] shrink-0">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-black text-[#173D32]">{targetCatererObj.rating || "4.9"}</span>
                  <span className="text-[10px] text-slate-500 font-bold">(112)</span>
                </div>
              </div>
              <div className="h-[1px] bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/45 to-[#D4AF37]/10 mb-4"></div>

              {/* Single column scroll list */}
              <div className="space-y-4">
                {[
                  {
                    name: "Ananya Rao",
                    rating: 5,
                    date: "June 15, 2026",
                    review: "Outstanding experience! The mutton biryani was cooked to absolute perfection, and the luxury plating left all our guests amazed.",
                    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                  },
                  {
                    name: "Vikram Reddy",
                    rating: 5,
                    date: "May 28, 2026",
                    review: "Elite Catering managed our corporate banquet flawlessly. From exquisite taste to prompt service, they deserve every bit of praise.",
                    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
                  },
                  {
                    name: "Sneha Kapoor",
                    rating: 4.8,
                    date: "April 12, 2026",
                    review: "Very professional and organized team. The live counters were a huge hit at our engagement party.",
                    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
                  }
                ].map((rev, i) => (
                  <div key={i} className="bg-[#FFFDFB] border border-[#DFC27A]/25 rounded-2xl p-4 flex flex-col gap-3 font-sans shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={rev.image} 
                          alt={rev.name} 
                          className="w-9 h-9 rounded-full object-cover border border-[#DFC27A]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-800">{rev.name}</span>
                          <span className="text-[9px] text-slate-400 font-semibold">{rev.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-[#D4AF37]">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} size={9} fill={idx < Math.floor(rev.rating) ? "currentColor" : "none"} className="stroke-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed select-text font-medium text-left">
                      "{rev.review}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 12. PRIVACY PROTECTED CONTACT / FORM */}
          <div className="px-4">
            <div className="bg-[#FAF6EC] border border-[#D4AF37]/25 rounded-[24px] p-5 flex flex-col gap-4 text-left shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#173D32] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-[#173D32] text-sm leading-tight">
                    Privacy Protected Contact
                  </h4>
                  <p className="text-[10px] text-[#A27008] font-semibold mt-0.5">Secure verification via CaterNest</p>
                </div>
              </div>

              <p className="text-slate-600 text-[11px] leading-relaxed">
                To protect caterer confidentiality, direct contact details (Phone & WhatsApp) will be securely shared only after your order is confirmed.
              </p>

              {/* Quick form mock fields */}
              <div className="space-y-3 font-sans pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Your Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Rahul Sharma" 
                    className="w-full bg-white border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 h-10 text-xs outline-none transition font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Estimated Guest Count</label>
                  <input 
                    type="number" 
                    value={guestCount} 
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 100)}
                    className="w-full bg-white border border-stone-200 focus:border-[#D4AF37] rounded-xl px-3.5 h-10 text-xs outline-none transition font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(true)}
                  className="w-full h-11 rounded-xl bg-[#01A378] hover:bg-[#028b67] text-white font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  Request Custom Quote
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 13. STICKY BOTTOM MOBILE FOOTER CTA BAR */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#D4AF37]/30 py-3.5 px-4 z-[50] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => {
                alert("For confidentiality, contact lines are private. Direct phone call will be unlocked upon booking confirmation.");
              }}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-stone-200 text-[#173D32] hover:text-[#D4AF37] flex items-center justify-center shadow-xs active:scale-90 transition cursor-pointer"
              title="Call Caterer"
            >
              <Phone size={15} className="stroke-[2.5]" />
            </button>
            
            <button 
              type="button"
              onClick={() => {
                alert("WhatsApp direct link will be automatically unlocked and sent to you upon booking confirmation.");
              }}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-stone-200 text-[#01A378] hover:text-[#D4AF37] flex items-center justify-center shadow-xs active:scale-90 transition cursor-pointer"
              title="WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex gap-2.5">
            <button
              type="button"
              onClick={() => setQuoteModalOpen(true)}
              className="flex-1 h-11 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-300 font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center active:scale-95 transition cursor-pointer"
            >
              Quote
            </button>
            <button
              type="button"
              onClick={() => {
                const element = document.getElementById("packages-mobile");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="flex-[2] h-11 rounded-xl bg-[#01A378] hover:bg-[#028b67] text-white font-extrabold text-[11px] uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition shadow-md"
            >
              Book Now <ChevronRight size={13} className="stroke-[3]" />
            </button>
          </div>
        </div>

        {/* 14. REQUEST CUSTOM QUOTE POPUP MODAL */}
        {quoteModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-[24px] border border-[#DFC27A] shadow-[0_15px_50px_rgba(0,0,0,0.3)] w-full max-w-sm p-6 text-slate-800 relative">
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition cursor-pointer"
              >
                <X size={14} />
              </button>
              
              <div className="text-center mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="text-base font-serif font-black text-[#173D32] tracking-tight uppercase mt-1">
                  Request Custom Quote
                </h3>
                <p className="text-stone-500 text-[10px] mt-1 font-sans">For {targetCatererObj.brandName || targetCatererObj.name}</p>
              </div>

              <div className="space-y-3 font-sans text-left">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Event Date</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-stone-200 rounded-xl px-3 h-10 text-xs outline-none focus:border-[#D4AF37] transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Number of Guests</label>
                  <input 
                    type="number" 
                    value={guestCount} 
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 100)}
                    className="w-full bg-slate-50 border border-stone-200 rounded-xl px-3 h-10 text-xs outline-none focus:border-[#D4AF37] transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Dietary Preferences</label>
                  <select className="w-full bg-slate-50 border border-stone-200 rounded-xl px-3 h-10 text-xs outline-none focus:border-[#D4AF37] transition cursor-pointer">
                    <option>Standard (Veg & Non-Veg)</option>
                    <option>Strictly Vegetarian (Sattvik/Jain)</option>
                    <option>Halal Certified Menu</option>
                    <option>Multi-Cuisine Premium Buffet</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    alert(`Thank you! Your custom quote request for ${guestCount} guests has been sent successfully. One of our luxury planners will contact you shortly.`);
                    setQuoteModalOpen(false);
                  }}
                  className="w-full h-11 rounded-xl bg-[#01A378] hover:bg-[#028b67] text-white font-extrabold text-xs uppercase tracking-widest transition shadow-sm mt-3 flex items-center justify-center gap-1 cursor-pointer"
                >
                  Submit Request <Check size={14} className="stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
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
