import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import {
  Search,
  Plus,
  Minus,
  ArrowLeft,
  Check,
  ChevronRight,
  ChefHat,
  Package,
  X,
  User,
  MapPin,
  Users,
  Star,
  Sparkles,
  Flame,
  Coffee,
  IceCream,
  Pizza,
  Soup,
  Utensils,
  Award,
  ShieldCheck,
  Truck,
  Smile,
  Trash2,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DEMO_CATERERS } from "../data";
import { toast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { storeNotification } from "../lib/orderUtils";
import { saveWithSupabaseSync } from "../lib/supabase";
import { MapPickerModal } from "../components/MapPickerModal";
import { AddressAutocomplete } from "../components/AddressAutocomplete";

const getCategoryIcon = (categoryName: string) => {
  const norm = categoryName.toLowerCase();
  if (norm.includes("starter") || norm.includes("appetizer")) {
    return <Sparkles size={18} />;
  }
  if (
    norm.includes("bread") ||
    norm.includes("roti") ||
    norm.includes("naan") ||
    norm.includes("rumali")
  ) {
    return <Coffee size={18} />;
  }
  if (norm.includes("sweet") || norm.includes("dessert")) {
    return <Award size={18} />;
  }
  if (
    norm.includes("biryani") ||
    norm.includes("rice") ||
    norm.includes("pulao")
  ) {
    return <Soup size={18} />;
  }
  if (
    norm.includes("curry") ||
    norm.includes("gravy") ||
    norm.includes("sabji")
  ) {
    return <Utensils size={18} />;
  }
  if (norm.includes("fry") || norm.includes("dry")) {
    return <Flame size={18} />;
  }
  if (norm.includes("ice cream")) {
    return <IceCream size={18} />;
  }
  return <Pizza size={18} />;
};

const getFoodImage = (itemName: string) => {
  const name = itemName.toLowerCase();

  if (name.includes("spring roll")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("gobi 65") ||
    name.includes("gobi") ||
    name.includes("cauliflower")
  ) {
    return "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80";
  }
  if (name.includes("manchurian")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80";
  }
  if (name.includes("nugget")) {
    return "https://images.unsplash.com/photo-1562967914-608f82629710?w=450&auto=format&fit=crop&q=80";
  }
  if (name.includes("gold coin") || name.includes("coin")) {
    return "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80";
  }
  if (name.includes("samosa")) {
    return "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("bajji") ||
    name.includes("bhaji") ||
    name.includes("pakora") ||
    name.includes("fritter")
  ) {
    return "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("paneer") &&
    (name.includes("tikka") || name.includes("kabab"))
  ) {
    return "https://images.unsplash.com/photo-1567184109411-47a7a3746aed?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("paneer") &&
    (name.includes("butter") ||
      name.includes("masala") ||
      name.includes("curry"))
  ) {
    return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80";
  }
  if (name.includes("chicken") && name.includes("65")) {
    return "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("chicken") ||
    name.includes("mutton") ||
    name.includes("fish") ||
    name.includes("prawn")
  ) {
    return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("roti") ||
    name.includes("naan") ||
    name.includes("bread") ||
    name.includes("paratha") ||
    name.includes("kulcha")
  ) {
    return "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("biryani") ||
    name.includes("pulao") ||
    name.includes("rice") ||
    name.includes("fried rice")
  ) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("dal") ||
    name.includes("dall") ||
    name.includes("tadka") ||
    name.includes("makhani")
  ) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("sweet") ||
    name.includes("gulab") ||
    name.includes("jamun") ||
    name.includes("halwa") ||
    name.includes("kheer")
  ) {
    return "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80";
  }
  if (name.includes("ice cream") || name.includes("kulfi")) {
    return "https://images.unsplash.com/photo-1501443712940-3decff3f6d90?w=450&auto=format&fit=crop&q=80";
  }
  if (
    name.includes("curry") ||
    name.includes("masala") ||
    name.includes("kofta") ||
    name.includes("korma")
  ) {
    return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80";
  }

  const placeholders = [
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=450&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=450&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=450&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=450&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=450&auto=format&fit=crop&q=80",
  ];
  const charSum = itemName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return placeholders[Math.abs(charSum) % placeholders.length];
};

const getFoodDescription = (itemName: string): string => {
  const name = itemName.toLowerCase().trim();

  if (name.includes("paneer butter masala")) {
    return "Fresh cottage cheese cubes cooked in creamy tomato gravy.";
  }
  if (name.includes("chicken 65")) {
    return "Spicy South Indian fried chicken appetizer.";
  }
  if (name.includes("paneer") && name.includes("tikka")) {
    return "Delectable cottage cheese chunks marinated in spiced yogurt and grilled to golden perfection.";
  }
  if (name.includes("paneer")) {
    return "Fresh cottage cheese cubes cooked in rich tomato and butter-infused legacy gravy.";
  }
  if (
    name.includes("chicken") &&
    (name.includes("tikka") ||
      name.includes("tandoori") ||
      name.includes("kebab") ||
      name.includes("kabab"))
  ) {
    return "Tender juicy chicken chunks cooked in traditional clay oven with secret blends of spices.";
  }
  if (
    name.includes("chicken") &&
    (name.includes("masala") ||
      name.includes("butter") ||
      name.includes("curry") ||
      name.includes("gravy"))
  ) {
    return "Homestyle juicy chicken pieces slow-cooked in a rich spiced traditional curry mixture.";
  }
  if (name.includes("chicken")) {
    return "Crispy seasoned chicken preparation garnished with chopped herbs and fresh curry leaves.";
  }
  if (name.includes("gobi") || name.includes("cauliflower")) {
    return "Fresh cauliflower florets seasoned with handpicked spices and cooked crispy.";
  }
  if (name.includes("manchurian")) {
    return "Crispy savory fritters tossed in classic sweet, sour, and mildly spicy Indo-Chinese sauce.";
  }
  if (name.includes("spring roll")) {
    return "Golden crispy wrappers stuffed with seasoned julienned fresh farm vegetables.";
  }
  if (name.includes("samosa")) {
    return "Crispy golden pastry triangles shell filled with spiced peas and mashed potatoes.";
  }
  if (name.includes("biryani")) {
    return "Fragrant basmati rice layered with rich herbs, saffron, and slow-cooked in traditional style.";
  }
  if (name.includes("pulao") || name.includes("fried rice")) {
    return "Aromatic long-grain basmati rice tossed with fresh garden vegetables and mild spices.";
  }
  if (name.includes("rice") || name.includes("jeera")) {
    return "Steaming aromatic basmati rice tossed with roasted cumin seeds and fresh herbs.";
  }
  if (
    name.includes("dal") ||
    name.includes("tadka") ||
    name.includes("makhani")
  ) {
    return "Slow-cooked lentils with fresh cream, melted butter, and tempered with cumin and garlic.";
  }
  if (
    name.includes("roti") ||
    name.includes("naan") ||
    name.includes("paratha") ||
    name.includes("kulcha") ||
    name.includes("bread")
  ) {
    return "Freshly baked traditional flatbread prepared in a hot tandoor clay oven.";
  }
  if (name.includes("jamun") || name.includes("gulab")) {
    return "Golden fried milk-solid dumplings soaked in aromatic rose and cardamom flavored sugar syrup.";
  }
  if (name.includes("halwa")) {
    return "Warm premium traditional dessert cooked slow with ghee, milk solids, and dry fruits.";
  }
  if (name.includes("ice cream") || name.includes("kulfi")) {
    return "Rich, creamy frozen dessert churned with authentic culinary flavors and sweet delight.";
  }
  if (name.includes("fruit") || name.includes("salad")) {
    return "Assortment of fresh seasonal garden fruits dressed with dynamic light sweet syrups.";
  }
  if (name.includes("soup") || name.includes("shorba")) {
    return "Warm comforting seasoned broth infused with fine herbs and aromatic local spices.";
  }
  if (name.includes("dry") || name.includes("fry")) {
    return "Roasted to perfection in a traditional hot wok with authentic Indian spices.";
  }

  const genericDescriptions = [
    "Traditional chef special preparation crafted with handpicked high-quality local ingredients.",
    "Carefully crafted culinary highlight seasoned with authentic fresh herbs and house spices.",
    "A delicious classic preparation designed to delight your senses with every single bite.",
    "Perfectly balanced premium recipe slow-cooked to lock in rich authentic textures and flavor.",
  ];

  let hash = 0;
  for (let i = 0; i < itemName.length; i++) {
    hash = itemName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const descIdx = Math.abs(hash) % genericDescriptions.length;
  return `Authentic ${itemName}. ${genericDescriptions[descIdx]}`;
};

const isItemPremium = (itemName: string): boolean => {
  const name = itemName.toLowerCase();
  return (
    name.includes("biryani") ||
    name.includes("mutton") ||
    name.includes("fish") ||
    name.includes("prawn") ||
    name.includes("royal") ||
    name.includes("deluxe") ||
    name.includes("premium") ||
    name.includes("tikka") ||
    name.includes("kabab") ||
    name.includes("kebab") ||
    name.includes("special") ||
    name.includes("butter") ||
    name.includes("paneer") ||
    name.includes("tandoori")
  );
};

const isItemNonVeg = (itemName: string, categoryName: string = ""): boolean => {
  const name = itemName.toLowerCase().trim();
  const cat = categoryName.toLowerCase().trim();
  if (
    cat.includes("non-veg") ||
    cat.includes("non veg") ||
    cat.includes("mutton") ||
    cat.includes("chicken") ||
    cat.includes("fish") ||
    cat.includes("egg")
  ) {
    return true;
  }
  return (
    name.includes("chicken") ||
    name.includes("mutton") ||
    name.includes("fish") ||
    name.includes("prawn") ||
    name.includes("egg") ||
    (name.includes("kebab") &&
      !name.includes("veg") &&
      !name.includes("paneer") &&
      !name.includes("gobi") &&
      !name.includes("hara bhara"))
  );
};

const getItemPrice = (itemName: string, categoryName: string = ""): number => {
  const lower = itemName.toLowerCase().trim();
  // Exact prices matching reference image:
  if (lower.includes("fresh lime")) return 50;
  if (lower.includes("guava punch")) return 60;
  if (lower.includes("virgin mojito")) return 70;
  if (lower.includes("sweet lassi") || lower.includes("salted lassi")) return 50;
  if (lower.includes("mango juice")) return 60;
  if (lower.includes("orange juice")) return 60;
  if (lower.includes("watermelon")) return 50;
  if (lower.includes("masala chaas") || lower.includes("chaas") || lower.includes("butter milk")) return 40;
  if (lower.includes("pineapple")) return 60;
  if (lower.includes("fruit punch") || lower.includes("rose milk") || lower.includes("badam milk")) return 60;
  if (lower.includes("blue lagoon") || lower.includes("smoothie") || lower.includes("kiwi")) return 70;
  if (lower.includes("jal jeera") || lower.includes("aam panna")) return 50;
  if (lower.includes("cold coffee") || lower.includes("mint lemon")) return 50;
  if (lower.includes("mocktail")) return 70;

  // Curries, Breads & Rice, Desserts:
  if (lower.includes("biryani") || lower.includes("mutton") || lower.includes("prawn")) return 120;
  if (lower.includes("chicken") || lower.includes("fish")) return 90;
  if (lower.includes("paneer") || lower.includes("tikka") || lower.includes("kebab") || lower.includes("kabab")) return 80;
  if (lower.includes("kofta") || lower.includes("korma") || lower.includes("curry") || lower.includes("masala")) return 70;
  if (lower.includes("ice cream") || lower.includes("gulab") || lower.includes("halwa") || lower.includes("sweet") || lower.includes("dessert")) return 60;
  if (lower.includes("naan") || lower.includes("roti") || lower.includes("kulcha") || lower.includes("bread")) return 40;
  if (lower.includes("dal") || lower.includes("rice") || lower.includes("sambar") || lower.includes("raita") || lower.includes("salad")) return 40;

  let hash = 0;
  for (let i = 0; i < itemName.length; i++) {
    hash = (hash << 5) - hash + itemName.charCodeAt(i);
    hash |= 0;
  }
  const tiers = [40, 50, 60, 70, 80];
  return tiers[Math.abs(hash) % tiers.length];
};

const getFallbackPackage = (pkgId: string, startingPrice: number) => {
  const basePrice = startingPrice || 350;

  // Veg categories
  const vegCategories = [
    {
      categoryName: "Welcome Drinks",
      selectionRule: "Select Any 1 Item",
      items: [
        "Fresh Lime Soda",
        "Guava Punch",
        "Virgin Mojito",
        "Sweet Lassi",
        "Mango Juice",
        "Orange Juice",
        "Watermelon Juice",
        "Masala Chaas",
        "Pineapple Juice",
      ],
    },
    {
      categoryName: "Starters (Veg)",
      selectionRule: "Select Any 2 Items",
      items: [
        "Paneer Tikka",
        "Gobi 65",
        "Veg Spring Roll",
        "Veg Samosa",
        "Crispy Corn",
      ],
    },
    {
      categoryName: "Main Course (Paneer)",
      selectionRule: "Select Any 1 Item",
      items: ["Paneer Butter Masala", "Kadhai Paneer", "Shahi Paneer"],
    },
    {
      categoryName: "Main Course (Veg)",
      selectionRule: "Select Any 2 Items",
      items: [
        "Dal Makhani",
        "Mixed Veg Curry",
        "Veg Diwani Handi",
        "Aloo Gobi Fry",
      ],
    },
    {
      categoryName: "Breads & Rice",
      selectionRule: "Select Any 3 Items",
      items: [
        "Butter Naan",
        "Tandoori Roti",
        "Rumali Roti",
        "Veg Biryani",
        "Jeera Rice",
        "Steamed Rice",
      ],
    },
    {
      categoryName: "Sweets & Desserts",
      selectionRule: "Select Any 2 Items",
      items: [
        "Gulab Jamun with Ice Cream",
        "Double Ka Meetha",
        "Gajar Ka Halwa",
        "Vanilla Ice Cream",
      ],
    },
  ];

  // Non-veg categories
  const nonVegCategories = [
    {
      categoryName: "Welcome Drinks",
      selectionRule: "Select Any 1 Item",
      items: [
        "Fresh Lime Soda",
        "Blue Lagoon Cooler",
        "Watermelon Mojito",
        "Masala Cola",
      ],
    },
    {
      categoryName: "Starters (Veg)",
      selectionRule: "Select Any 2 Items",
      items: ["Paneer Tikka", "Gobi 65", "Crispy Corn Fry", "Veg Gold Coin"],
    },
    {
      categoryName: "Starters (Non-Veg)",
      selectionRule: "Select Any 2 Items",
      items: [
        "Chicken 65",
        "Chicken Tikka Kebab",
        "Fish Fingers",
        "Tandoori Chicken",
      ],
    },
    {
      categoryName: "Main Course (Meat)",
      selectionRule: "Select Any 2 Items",
      items: [
        "Hyderabad Mutton Curry",
        "Butter Chicken Masala",
        "Andhra Fish Curry",
        "Chicken Kadai",
      ],
    },
    {
      categoryName: "Main Course (Veg)",
      selectionRule: "Select Any 2 Items",
      items: ["Dal Makhani", "Paneer Butter Masala", "Mixed Veg Kurma"],
    },
    {
      categoryName: "Breads & Rice",
      selectionRule: "Select Any 3 Items",
      items: [
        "Butter Naan",
        "Tandoori Roti",
        "Rumali Roti",
        "Special Hyderabadi Chicken Biryani",
        "Mutton Dum Biryani",
        "Jeera Rice",
      ],
    },
    {
      categoryName: "Sweets & Desserts",
      selectionRule: "Select Any 2 Items",
      items: [
        "Gulab Jamun with Ice Cream",
        "Qubani Ka Meetha",
        "Double Ka Meetha",
        "Vanilla Ice Cream",
        "Mango Kulfi",
      ],
    },
  ];

  const fallbacks: Record<string, any> = {
    v_silver: {
      id: "v_silver",
      packageName: "Silver Package",
      packageType: "Veg",
      pricePerPlate: basePrice,
      minimumGuests: 100,
      categories: vegCategories.slice(0, 4),
      description: "Simple & elegant vegetarian spread for family gatherings.",
    },
    v_gold: {
      id: "v_gold",
      packageName: "Gold Package",
      packageType: "Veg",
      pricePerPlate: basePrice + 100,
      minimumGuests: 150,
      categories: vegCategories.slice(0, 5),
      description:
        "Slightly richer premium veg spread with extra paneer delicacies.",
    },
    v_platinum: {
      id: "v_platinum",
      packageName: "Platinum Package",
      packageType: "Veg",
      pricePerPlate: basePrice + 250,
      minimumGuests: 200,
      categories: vegCategories,
      description: "Ultra luxury premium veg spread for signature events.",
    },
    nv_premium: {
      id: "nv_premium",
      packageName: "Premium Package",
      packageType: "Non-veg",
      pricePerPlate: basePrice + 450,
      minimumGuests: 150,
      categories: nonVegCategories.slice(0, 5),
      description: "Classic non-veg catering with double choice meat courses.",
    },
    nv_royal: {
      id: "nv_royal",
      packageName: "Royal Package",
      packageType: "Non-veg",
      pricePerPlate: basePrice + 750,
      minimumGuests: 200,
      categories: nonVegCategories.slice(0, 6),
      description:
        "Exquisite regal non-veg banquet for elite wedding celebrations.",
    },
    nv_grand: {
      id: "nv_grand",
      packageName: "Grand Royal",
      packageType: "Non-veg",
      pricePerPlate: basePrice + 1150,
      minimumGuests: 250,
      categories: nonVegCategories,
      description:
        "The ultimate royal banquet with exotic seafood, mutton, and dessert options.",
    },
  };

  return fallbacks[pkgId] || null;
};

const VegHeaderIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M12 22C12 22 12 14 16 11C18 9.5 20 9.5 21 10.5C22 11.5 21 13.5 19.5 15.5C16.5 19.5 12 22 12 22Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 22C12 22 12 14 8 11C6 9.5 4 9.5 3 10.5C2 11.5 3 13.5 4.5 15.5C7.5 19.5 12 22 12 22Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 15V3" strokeLinecap="round" />
    <path d="M12 11C13.5 9 15.5 8.5 17 9.5" strokeLinecap="round" />
    <path d="M12 9C10.5 7 8.5 6.5 7 7.5" strokeLinecap="round" />
  </svg>
);

const NonVegHeaderIcon = ({
  className = "w-7 h-7",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 16c2.5-2.5 2.5-6.5 0-9-1.5-1.5-4-1.5-5.5 0-2 2-2.5 5.5-5.5 8.5a1.5 1.5 0 0 0 0 2.1c1.5 1.5 4.5 1 6.5-1 1-1 3-1.5 4.5-0.6Z" />
    <path d="M5 19c-.5-.5-1-.2-1.5-.7a1.5 1.5 0 0 1 0-2.1c.5-.5.7-1 1.2-1.5" />
    <path d="M18.5 5.5A2.5 2.5 0 1 0 15 2c0 .5-.5 1-1 1" />
  </svg>
);

const DynamicCateringIcon = ({
  packageType = "",
  className = "w-8 h-8",
}: {
  packageType?: string;
  className?: string;
}) => {
  const lower = packageType.toLowerCase();
  const isVeg = lower.includes("veg") && !lower.includes("non");
  const isNonVeg =
    lower.includes("non-veg") ||
    lower.includes("non veg") ||
    lower.includes("nonveg");
  const isMixed =
    lower.includes("both") ||
    lower.includes("+") ||
    lower.includes("&") ||
    lower.includes("allow") ||
    (!isVeg && !isNonVeg);

  if (isVeg) {
    return <VegHeaderIcon className={cn("text-[#0F3D2E]", className)} />;
  } else if (isNonVeg && !isMixed) {
    return <NonVegHeaderIcon className={cn("text-red-700", className)} />;
  } else {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <VegHeaderIcon className="w-5.5 h-5.5 text-[#0F3D2E]" />
        <span className="text-[#D4AF37] font-black text-[10px]">&</span>
        <NonVegHeaderIcon className="w-5.5 h-5.5 text-red-700" />
      </div>
    );
  }
};

const CrownIcon = ({
  tier = "gold",
  className = "w-10 h-10",
}: {
  tier?: "bronze" | "silver" | "gold";
  className?: string;
}) => {
  let color = "#D4AF37"; // gold
  if (tier === "silver") color = "#A0A0A0";
  else if (tier === "bronze") color = "#CD7F32";

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path
        d="M2.5 19h19a.5.5 0 0 0 .5-.5V12l-4.5 4.5L12 6.5 6.5 16.5 2 12v6.5a.5.5 0 0 0 .5.5Z"
        fill={color}
        stroke={color}
        fillOpacity="0.15"
      />
      <circle cx="2" cy="11.5" r="1" fill={color} />
      <circle cx="6.5" cy="15.5" r="1" fill={color} />
      <circle cx="12" cy="5.5" r="1" fill={color} />
      <circle cx="17.5" cy="15.5" r="1" fill={color} />
      <circle cx="22" cy="11.5" r="1" fill={color} />
      <path d="M4 19v1.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V19" fill="none" />
    </svg>
  );
};

const getPackageTier = (packageName: string = "", idx: number) => {
  const name = packageName.toLowerCase();
  if (
    name.includes("platinum") ||
    name.includes("diamond") ||
    name.includes("royal")
  )
    return "gold";
  if (name.includes("gold") || name.includes("classic") || idx === 1)
    return "gold";
  if (name.includes("silver") || idx === 2) return "silver";
  return "bronze"; // basic / others
};

const renderVegNonVegBadge = (packageType: string = "") => {
  const lower = packageType.toLowerCase();
  let isVeg = true;
  let isNonVeg = false;

  if (
    lower.includes("non-veg") ||
    lower.includes("non veg") ||
    lower.includes("nonveg")
  ) {
    if (
      lower.includes("both") ||
      lower.includes("allow") ||
      lower.includes("+") ||
      lower.includes("&")
    ) {
      isVeg = true;
      isNonVeg = true;
    } else {
      isVeg = false;
      isNonVeg = true;
    }
  } else if (
    lower.includes("both") ||
    lower.includes("+") ||
    lower.includes("&") ||
    lower.includes("mixed")
  ) {
    isVeg = true;
    isNonVeg = true;
  } else if (lower.includes("veg")) {
    isVeg = true;
    isNonVeg = false;
  } else {
    isVeg = true;
    isNonVeg = true;
  }

  const VegSymbol = () => (
    <div className="w-3.5 h-3.5 border border-green-600 p-[1px] flex items-center justify-center bg-white shrink-0 rounded-[1px]">
      <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
    </div>
  );

  const NonVegSymbol = () => (
    <div className="w-3.5 h-3.5 border border-red-600 p-[1px] flex items-center justify-center bg-white shrink-0 rounded-[1px]">
      <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
    </div>
  );

  let text = "VEG";
  if (isVeg && isNonVeg) text = "VEG + NON-VEG";
  else if (isNonVeg) text = "NON-VEG";

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-[#D4AF37]/35 shadow-sm select-none">
      {isVeg && <VegSymbol />}
      {isNonVeg && <NonVegSymbol />}
      <span className="text-[9px] font-black tracking-wider text-[#0F3D2E] uppercase font-sans leading-none pl-0.5">
        {text}
      </span>
    </div>
  );
};

const getSelectionRuleLabel = (rule: string | undefined): string => {
  if (!rule) return "Select Items From This Category";
  const clean = rule.trim();
  const match = clean.match(/(Select|Choose)\s+Any\s+(\d+)\s*(Items?)?/i);
  if (match) {
    const num = match[2];
    return `Select Any ${num} Items From This Category`;
  }
  return clean;
};

const OCCASIONS = [
  "Wedding", "Reception", "Birthday", "Anniversary", "Baby Shower",
  "House Warming", "Corporate Event", "Engagement", "Naming Ceremony",
  "Pooja", "Festival", "Kitty Party", "Kids Party", "Outdoor Party",
  "Office Party", "Pool Party", "Bachelor Party", "Others"
];

const MEAL_TIME_OPTIONS: Record<string, string[]> = {
  Breakfast: ["7 AM onwards", "8 AM onwards", "9 AM onwards"],
  Lunch: ["11 AM onwards", "12 PM onwards", "1 PM onwards", "2 PM onwards", "3 PM onwards", "4 PM onwards"],
  "Evening Snacks": ["4 PM onwards", "5 PM onwards", "6 PM onwards", "7 PM onwards"],
  Dinner: ["6 PM onwards", "7 PM onwards", "8 PM onwards", "9 PM onwards", "10 PM onwards"]
};

export default function OrderFlow() {
  const { id } = useParams();
  const { user } = useAuth();
  const [caterer, setCaterer] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<boolean | null>(null); // true = quote, false = booking
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [foodImages, setFoodImages] = useState<Record<string, string>>({});
  const [platformFeePerPlate, setPlatformFeePerPlate] = useState(() => {
    return parseFloat(localStorage.getItem("platformFeePerPlate") || "1");
  });

  const location = useLocation();

  useEffect(() => {
    import("../lib/supabase").then(({ fetchPlatformFeePerPlate }) => {
      fetchPlatformFeePerPlate().then((fee) => {
        setPlatformFeePerPlate(fee);
      });
    });
  }, []);

  useEffect(() => {
    fetch("/api/food-images")
      .then((res) => {
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error(
          `Response was not JSON. Status: ${res.status}, Type: ${contentType}`,
        );
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.images)) {
          const mapping: Record<string, string> = {};
          data.images.forEach((img: any) => {
            if (img.image_url) {
              mapping[img.item_name.toLowerCase().trim()] = img.image_url;
            }
          });
          setFoodImages(mapping);
        }
      })
      .catch((err) => console.error("Error fetching custom food images:", err));
  }, []);

  useEffect(() => {
    if (caterer) {
      let selectedPkg = null;
      if (location.state?.packageIdx !== undefined) {
        if (
          typeof location.state.packageIdx === "number" &&
          caterer.menuPackages &&
          caterer.menuPackages.length > location.state.packageIdx
        ) {
          selectedPkg = caterer.menuPackages[location.state.packageIdx];
        } else {
          selectedPkg = getFallbackPackage(
            location.state.packageIdx,
            caterer.startingPrice || 350,
          );
        }
      }

      if (!selectedPkg) {
        if (caterer.menuPackages && caterer.menuPackages.length > 0) {
          selectedPkg = caterer.menuPackages[0];
        } else {
          selectedPkg = getFallbackPackage("v_silver", caterer.startingPrice || 350);
        }
      }

      if (selectedPkg) {
        setSelectedPackage(selectedPkg);
        setViewMode("package_detail");
        
        const targetGuestCount = location.state?.customGuestCount;
        if (targetGuestCount !== undefined) {
          setGuests(targetGuestCount);
        } else if (selectedPkg.pricingSlabs && selectedPkg.pricingSlabs.length > 0) {
          const sortedSlabs = [...selectedPkg.pricingSlabs].sort(
            (a: any, b: any) => a.minGuests - b.minGuests,
          );
          setGuests(sortedSlabs[0].minGuests);
        } else if (selectedPkg.minimumGuests) {
          setGuests(selectedPkg.minimumGuests);
        } else if (selectedPkg.guests) {
          setGuests(selectedPkg.guests);
        }
      }
    }
  }, [caterer, location.state]);

  useEffect(() => {
    let allCaterers = [...DEMO_CATERERS];
    const raw = localStorage.getItem("registrations");
    if (raw) {
      try {
        const allRegs = JSON.parse(raw);
        const regMapped = allRegs.map((r: any) => ({
          id: r.id,
          name: r.businessName,
          location: r.location || "Hyderabad",
          type: r.type || "Veg + Non-Veg",
          startingPrice: 350,
          description:
            r.description || "Welcome to our premium catering service.",
          menuPackages: r.menuPackages || r.packages || [],
          packages: r.packages || r.menuPackages || [],
        }));
        allCaterers = [...allCaterers, ...regMapped];
      } catch (e) {}
    }

    const found = allCaterers.find((c) => c.id === id);
    if (found) {
      setCaterer(found);
      if (false /* legacy check disabled, handled in main useEffect */) {
        const selectedPkg = found.menuPackages[location.state.packageIdx];
        setSelectedPackage(selectedPkg);
        setViewMode("package_detail");

        // Pre-fill Min Guests from active slab or package
        if (selectedPkg.pricingSlabs && selectedPkg.pricingSlabs.length > 0) {
          // Slabs should be sorted by minGuests
          const sortedSlabs = [...selectedPkg.pricingSlabs].sort(
            (a: any, b: any) => a.minGuests - b.minGuests,
          );
          setGuests(sortedSlabs[0].minGuests);
        } else if (selectedPkg.minimumGuests) {
          setGuests(selectedPkg.minimumGuests);
        }
      }
    }
  }, [id, location.state]);

  const [viewMode, setViewMode] = useState<
    "custom" | "package_detail" | "checkout"
  >("package_detail");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const [guests, setGuests] = useState(100);
  const [guestInputVal, setGuestInputVal] = useState("100");
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  useEffect(() => {
    setGuestInputVal(String(guests));
  }, [guests]);

  const minGuests = selectedPackage?.minimumGuests || 50;
  const maxGuests = selectedPackage?.maximumGuests || 5000;

  const handleGuestSubmit = (valStr: string) => {
    const trimmed = valStr.trim();
    if (!trimmed) {
      setGuestInputVal(String(guests));
      return;
    }
    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed) || parsed < 1) {
      setGuestInputVal(String(guests));
      toast("Please enter a valid positive number of guests", "error");
      return;
    }
    if (parsed < minGuests) {
      toast(`Minimum requirement for this package is ${minGuests} guests`, "error");
    } else if (parsed > maxGuests) {
      toast(`Maximum guest limit is ${maxGuests} guests`, "error");
    }
    const validCount = Math.max(minGuests, Math.min(maxGuests, parsed));
    setGuests(validCount);
    setGuestInputVal(String(validCount));
  };

  const decrementGuests = () => {
    const newCount = Math.max(minGuests, guests - 10);
    setGuests(newCount);
    setGuestInputVal(String(newCount));
  };

  const incrementGuests = () => {
    const newCount = Math.min(maxGuests, guests + 10);
    setGuests(newCount);
    setGuestInputVal(String(newCount));
  };

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  const [mobileCartExpanded, setMobileCartExpanded] = useState(false);

  // Restore session state on load
  useEffect(() => {
    const savedSession = sessionStorage.getItem("orderFlowSession");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.catererId === id) {
          if (parsed.viewMode && parsed.viewMode !== "packages") setViewMode(parsed.viewMode);
          if (parsed.guests) setGuests(parsed.guests);
          if (parsed.selectedPackage)
            setSelectedPackage(parsed.selectedPackage);
          if (parsed.orderForm) setOrderForm(parsed.orderForm);
          if (parsed.selectedItems) setSelectedItems(parsed.selectedItems);
        }
      } catch (e) {}
      sessionStorage.removeItem("orderFlowSession");
    }
  }, [id]);

  // Extract categories & items globally if building their own, or limit to package
  let packageDefinitions: any[] = [];
  if (caterer?.menuPackages && caterer.menuPackages.length > 0) {
    packageDefinitions = caterer.menuPackages;
  } else if (caterer) {
    // Fallback standard packages
    packageDefinitions = [
      getFallbackPackage("v_silver", caterer.startingPrice),
      getFallbackPackage("v_gold", caterer.startingPrice),
      getFallbackPackage("v_platinum", caterer.startingPrice),
      getFallbackPackage("nv_premium", caterer.startingPrice),
      getFallbackPackage("nv_royal", caterer.startingPrice),
      getFallbackPackage("nv_grand", caterer.startingPrice),
    ].filter(Boolean);
  }

  // Derive menu states based on selected package or fallback
  const [orderForm, setOrderForm] = useState({
    date: "",
    type: "Wedding",
    venue: "",
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  // Premium Event Details states
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["Lunch"]);
  const [mealTimings, setMealTimings] = useState<Record<string, string>>({ Lunch: "12 PM onwards" });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState<"Indoor" | "Outdoor" | "">("");
  const [mapLocation, setMapLocation] = useState("");
  const [isVenueMapOpen, setIsVenueMapOpen] = useState(false);
  const [venueLat, setVenueLat] = useState<number | null>(null);
  const [venueLng, setVenueLng] = useState<number | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast("Geolocation is not supported by your browser", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setVenueLat(latitude);
        setVenueLng(longitude);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
                "User-Agent": "CaterNest-Location-Picker",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setOrderForm({ ...orderForm, venue: data.display_name });
              setMapLocation(data.display_name);
              const parts = data.display_name.split(",");
              if (parts.length > 0 && parts[0].trim()) {
                setVenueName(parts[0].trim());
              }
              toast("Location detected successfully!", "success");
            } else {
              const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
              setOrderForm({ ...orderForm, venue: coords });
              setMapLocation(coords);
              toast("Location coordinates saved", "success");
            }
          }
        } catch (e) {
          console.warn("Reverse geocode failed", e);
          const coords = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setOrderForm({ ...orderForm, venue: coords });
          setMapLocation(coords);
          toast("Location coordinates saved", "success");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast("Unable to retrieve your current location.", "error");
      }
    );
  };

  const [isOccasionDropdownOpen, setIsOccasionDropdownOpen] = useState(false);
  const [occasionSearchQuery, setOccasionSearchQuery] = useState("");

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const dateInputRef = useRef<HTMLInputElement>(null);

  const addDate = (dateStr: string) => {
    if (!dateStr) return;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return;
    const formatted = d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      weekday: "short",
    });
    if (!selectedDates.includes(formatted)) {
      const newDates = [...selectedDates, formatted];
      setSelectedDates(newDates);
      setOrderForm(prev => ({ ...prev, date: newDates.join(", ") }));
    }
  };

  const removeDate = (dateToRemove: string) => {
    const newDates = selectedDates.filter(d => d !== dateToRemove);
    setSelectedDates(newDates);
    setOrderForm(prev => ({ ...prev, date: newDates.join(", ") }));
  };

  const formatCalendarDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      weekday: "short",
    });
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.includes(formatCalendarDate(date));
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const toggleCalendarDate = (date: Date) => {
    if (isDatePast(date)) return;
    const formatted = formatCalendarDate(date);
    if (selectedDates.includes(formatted)) {
      removeDate(formatted);
    } else {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      addDate(`${y}-${m}-${d}`);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArray: (Date | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      daysArray.push(new Date(year, month, d));
    }
    return daysArray;
  };

  useEffect(() => {
    if (orderForm.date && selectedDates.length === 0) {
      const dates = orderForm.date.split(", ").map(d => d.trim()).filter(Boolean);
      setSelectedDates(dates);
    }
  }, [orderForm.date]);

  const navigate = useNavigate();

  const handleBooking = async (isQuote: boolean) => {
    console.log("[TRACE_LOG #2] handleBooking() entry, isQuote:", isQuote);

    console.log("[TRACE_LOG #3] user validation block, user:", user);
    if (!user) {
      console.log(
        "[TRACE_LOG #3.1] User validation FAILED. Redirecting to loginmodal.",
      );
      setPendingAction(isQuote);
      setShowLoginModal(true);
      return;
    }
    console.log("[TRACE_LOG #3.2] User validation PASSED.");

    console.log(
      "[TRACE_LOG #4] selectedPackage validation, selectedPackage:",
      selectedPackage,
    );
    console.log("[TRACE_LOG #5] guest count validation, guests:", guests);

    console.log("[TRACE_LOG #7] Before localStorage.getItem('orders')");
    const currentOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    console.log(
      "[TRACE_LOG #7.1] currentOrders loaded, count:",
      currentOrders.length,
    );

    const platformFee =
      appliedCoupon === "NEW" ? 0 : guests * platformFeePerPlate;

    let matchingSlab = selectedPackage?.pricingSlabs?.find(
      (slab: any) =>
        guests >= slab.minGuests &&
        (slab.maxGuests === null || guests <= slab.maxGuests),
    );
    if (
      !matchingSlab &&
      selectedPackage?.pricingSlabs &&
      selectedPackage.pricingSlabs.length > 0
    ) {
      const sorted = [...selectedPackage.pricingSlabs].sort(
        (a: any, b: any) => a.minGuests - b.minGuests,
      );
      if (guests < sorted[0].minGuests) matchingSlab = sorted[0];
      else matchingSlab = sorted[sorted.length - 1];
    }

    // Direct Validation of Booking details in the "Contact Information" step
    if (!orderForm.name || !orderForm.name.trim()) {
      toast("Please enter your name in the Contact Information section.", "error");
      return;
    }
    if (!orderForm.phone || !orderForm.phone.trim()) {
      toast("Please enter your phone number in the Contact Information section.", "error");
      return;
    }
    if (!orderForm.venue || !orderForm.venue.trim()) {
      toast("Please provide the venue details in Hyderabad.", "error");
      return;
    }

    console.log("[TRACE_LOG #6] Before newOrder object creation");
    const compiledVenue = venueName 
      ? `${venueName} ${venueType ? `(${venueType})` : ""}, Address: ${orderForm.venue}` 
      : orderForm.venue;

    const compiledNotes = [
      selectedMeals.length > 0 ? `Meals: ${selectedMeals.join(", ")}` : "",
      selectedMeals.length > 0 ? `Timings: ${selectedMeals.map(m => `${m} (${mealTimings[m] || "N/A"})`).join(" | ")}` : "",
      mapLocation ? `Google Map: ${mapLocation}` : "",
      orderForm.notes ? `Special Instructions: ${orderForm.notes}` : ""
    ].filter(Boolean).join("\n");

    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id || "",
      customerEmail: orderForm.email && orderForm.email.trim() ? orderForm.email.trim() : (user.email || ""),
      catererId: caterer.id,
      catererName: caterer.name,
      customerName: orderForm.name.trim(),
      phone: orderForm.phone.trim(),
      customerPhone: orderForm.phone.trim(),
      eventDate: orderForm.date || selectedDates.join(", "),
      eventType: orderForm.type,
      guests: guests,
      guestCount: guests,
      venue: compiledVenue || "",
      address: compiledVenue || "",
      latitude: venueLat,
      longitude: venueLng,
      specialNotes: compiledNotes || "",
      notes: compiledNotes || "",
      packageDetails: selectedPackage,
      matchedSlab: matchingSlab,
      selectedItems: Object.keys(selectedItems).filter(
        (k: string) => selectedItems[k],
      ),
      totalEstimate: currentPerPlatePrice * guests + platformFee,
      platformFeePerPlate: platformFeePerPlate,
      pricePerPlate: currentPerPlatePrice,
      platformFee: platformFee,
      status: "Pending Approval",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    console.log("[TRACE_LOG #6.1] Created newOrder object:", newOrder);

    console.log("[TRACE_LOG #8] Before localStorage.setItem('orders')");
    try {
      await saveWithSupabaseSync("orders", "orders", [
        ...currentOrders,
        newOrder,
      ]);
    } catch (syncErr) {
      console.error("Synced order failed, writing locally:", syncErr);
      localStorage.setItem(
        "orders",
        JSON.stringify([...currentOrders, newOrder]),
      );
    }
    console.log("[TRACE_LOG #8.1] After localStorage.setItem('orders')");

    console.log("ORDER CREATED", newOrder);

    // Store notifications for Customer, Caterer, and Admin Real-time flows
    try {
      storeNotification(
        newOrder.id,
        "New Booking Submitted 📨",
        `Your booking request for ${newOrder.catererName} on ${newOrder.eventDate} has been submitted and is waiting for caterer approval.`,
        "customer",
        newOrder.catererId,
      );
    } catch (err) {
      console.warn("Notification logging warn", err);
    }

    try {
      storeNotification(
        newOrder.id,
        "New Order Received 🧑‍🍳",
        `A new booking request has been received from ${newOrder.customerName} for ${newOrder.eventDate}.`,
        "caterer",
        newOrder.catererId,
      );
    } catch (err) {
      console.warn("Notification logging warn", err);
    }

    try {
      storeNotification(
        newOrder.id,
        "New Order Created 🔔",
        `Customer ${newOrder.customerName} submitted a new order request #${newOrder.id} for ${newOrder.catererName}.`,
        "admin",
      );
    } catch (err) {
      console.warn("Notification logging warn", err);
    }

    console.log("[TRACE_LOG #9] Before navigate('/orders')");
    toast(
      "Your booking request has been submitted and is waiting for caterer approval.",
      "success",
    );
    navigate("/orders");
  };

  const handleProceedToLogin = () => {
    sessionStorage.setItem(
      "orderFlowSession",
      JSON.stringify({
        catererId: caterer.id,
        viewMode,
        guests,
        selectedPackage,
        orderForm,
        selectedItems,
      }),
    );
    navigate("/login", { state: { from: `/order/${id}` } });
  };

  const menuCategories =
    selectedPackage?.categories?.map((c: any) => c.categoryName) || [];

  const [activeCategory, setActiveCategory] = useState(menuCategories[0] || "");
  const [highlightIncomplete, setHighlightIncomplete] = useState(false);
  const [validationTriggered, setValidationTriggered] = useState(false);
  const categoryTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    if (activeCategory && categoryTabRefs.current[activeCategory]) {
      categoryTabRefs.current[activeCategory]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  useEffect(() => {
    if (highlightIncomplete) {
      const timer = setTimeout(() => {
        setHighlightIncomplete(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightIncomplete]);

  useEffect(() => {
    // Reset active category when package changes
    if (selectedPackage?.categories && selectedPackage.categories.length > 0) {
      setActiveCategory(selectedPackage.categories[0].categoryName);
    }
  }, [selectedPackage]);

  const limitPerCategory = (() => {
    if (!selectedPackage || !activeCategory) return 0;
    const cat = selectedPackage.categories?.find(
      (c: any) => c.categoryName === activeCategory,
    );
    if (!cat || !cat.selectionRule) return 0;
    const match = cat.selectionRule.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  })();

  const toggleItem = (itemName: string, catName: string) => {
    setSelectedItems((prev) => {
      const isSelected = !!prev[itemName];
      const cat = selectedPackage.categories?.find(
        (c: any) => c.categoryName === catName,
      );
      let limit = 0;
      if (cat && cat.selectionRule) {
        const match = cat.selectionRule.match(/\d+/);
        limit = match ? parseInt(match[0], 10) : 0;
      }

      if (!isSelected && limit > 0) {
        const itemsInCat = cat?.items || [];
        const selectedCount = itemsInCat.filter((i: string) => prev[i]).length;
        if (selectedCount >= limit) {
          return prev; // Reached limit, do not select
        }
      }
      return { ...prev, [itemName]: !isSelected };
    });
  };

  const handleQuantityChange = (itemName: string, catName: string, newQty: number) => {
    if (newQty <= 0) {
      if (selectedItems[itemName]) {
        toggleItem(itemName, catName);
      }
      setItemQuantities((prev) => ({ ...prev, [itemName]: 0 }));
    } else {
      if (!selectedItems[itemName]) {
        toggleItem(itemName, catName);
      }
      setItemQuantities((prev) => ({ ...prev, [itemName]: newQty }));
    }
  };

  const toggleItemWithQty = (itemName: string, catName: string) => {
    const isCurrentlySelected = !!selectedItems[itemName];
    toggleItem(itemName, catName);
    if (!isCurrentlySelected) {
      setItemQuantities((prev) => ({ ...prev, [itemName]: 1 }));
    } else {
      setItemQuantities((prev) => ({ ...prev, [itemName]: 0 }));
    }
  };

  const isCategoryComplete = (catName: string) => {
    if (!selectedPackage) return true;
    const cat = selectedPackage.categories?.find(
      (c: any) => c.categoryName === catName,
    );
    if (!cat) return true;
    const match = cat.selectionRule?.match(/\d+/);
    const limit = match ? parseInt(match[0], 10) : 0;
    if (limit === 0) return true;

    const itemsInCat = cat.items || [];
    const selectedCount = itemsInCat.filter(
      (i: string) => selectedItems[i],
    ).length;
    return selectedCount >= limit;
  };

  const getCategoryRemainingCount = (catName: string) => {
    if (!selectedPackage) return 0;
    const cat = selectedPackage.categories?.find(
      (c: any) => c.categoryName === catName,
    );
    if (!cat) return 0;
    const match = cat.selectionRule?.match(/\d+/);
    const limit = match ? parseInt(match[0], 10) : 0;
    if (limit === 0) return 0;

    const itemsInCat = cat.items || [];
    const selectedCount = itemsInCat.filter(
      (i: string) => selectedItems[i],
    ).length;
    return Math.max(0, limit - selectedCount);
  };

  const navigateToCategory = (catName: string) => {
    setActiveCategory(catName);
    const categoryContent = document.getElementById("active-category-content");
    if (categoryContent) {
      categoryContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const allCategoriesComplete =
    menuCategories.length > 0 && menuCategories.every(isCategoryComplete);
  const totalCategoriesCount = menuCategories.length;
  const doneCategoriesCount = menuCategories.filter(isCategoryComplete).length;
  const selectedItemsCount = Object.keys(selectedItems).filter(
    (k) => selectedItems[k],
  ).length;

  const currentPerPlatePrice = (() => {
    if (
      selectedPackage &&
      selectedPackage.pricingSlabs &&
      selectedPackage.pricingSlabs.length > 0
    ) {
      const matchingSlab = selectedPackage.pricingSlabs.find(
        (slab: any) =>
          guests >= slab.minGuests &&
          (slab.maxGuests === null || guests <= slab.maxGuests),
      );
      if (matchingSlab) return matchingSlab.price;

      // Fallback to highest bound if exceeded, or lowest if below
      const sorted = [...selectedPackage.pricingSlabs].sort(
        (a: any, b: any) => a.minGuests - b.minGuests,
      );
      if (guests < sorted[0].minGuests) return sorted[0].price;
      return sorted[sorted.length - 1].price;
    }
    return selectedPackage?.pricePerPlate || caterer?.startingPrice || 350;
  })();

  const platformFee = guests * platformFeePerPlate;

  if (!caterer)
    return (
      <div className="min-h-screen pt-32 pb-24 text-center">Loading...</div>
    );

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col font-poppins transition-colors duration-300 bg-[#FAF8F3] pt-[88px] md:pt-[104px]"
      )}
    >
      {/* Build Header */}
      {viewMode === "custom" ? (
        <div className="bg-[#FAF7F2] border-b border-[#D6B15E]/30 sticky top-[72px] md:top-[80px] z-20 select-none shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-3">
            {/* Left Controls & Title Branding */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setViewMode("package_detail")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFEFA] border border-[#D6B15E]/50 hover:border-[#D6B15E] text-[#0B2D23] rounded-full font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} className="text-[#0B2D23]" />
                <span>Back</span>
              </button>

              {/* Brand Title */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex flex-col text-left min-w-0">
                  <h1 className="font-serif font-bold text-base sm:text-lg lg:text-xl tracking-tight text-[#0B2D23] uppercase leading-tight truncate">
                    {caterer.name || "ELITE CATERING"}
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8860B] font-sans leading-none mt-0.5 truncate">
                    {caterer.tagline || caterer.location || "Curated Catering Menu"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Guests Selector with Editable Numeric Input */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-[#FFFEFA] border border-[#D6B15E]/50 rounded-lg overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={decrementGuests}
                  className="w-7 sm:w-8 h-7.5 sm:h-8 flex items-center justify-center text-[#0B2D23] hover:bg-[#FAF6EE] border-r border-[#D6B15E]/40 transition-colors font-bold text-sm cursor-pointer"
                  title="Decrease Guests"
                >
                  −
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={guestInputVal}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setGuestInputVal(val);
                  }}
                  onBlur={() => handleGuestSubmit(guestInputVal)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-11 sm:w-14 h-7.5 sm:h-8 text-center font-bold text-xs sm:text-sm text-[#0B2D23] bg-[#FFFEFA] outline-none focus:bg-[#FFFDF7] focus:ring-1 focus:ring-[#D6B15E]/50"
                  title="Click to type guest count directly"
                />
                <button
                  type="button"
                  onClick={incrementGuests}
                  className="w-7 sm:w-8 h-7.5 sm:h-8 flex items-center justify-center text-[#0B2D23] hover:bg-[#FAF6EE] border-l border-[#D6B15E]/40 transition-colors font-bold text-sm cursor-pointer"
                  title="Increase Guests"
                >
                  +
                </button>
              </div>
              <span className="font-bold text-xs text-[#0B2D23] hidden xs:inline">
                Guests
              </span>
            </div>
          </div>

          {/* Horizontal Category Tabs Row */}
          <div className="border-t border-[#D6B15E]/30 bg-[#FFFEFA]/95 backdrop-blur-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2">
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
                {menuCategories.map((cat: string) => {
                  const catData = selectedPackage?.categories?.find(
                    (c: any) => c.categoryName === cat,
                  );
                  const catItems = catData?.items || [];
                  const selectedCount = catItems.filter(
                    (i: string) => selectedItems[i],
                  ).length;
                  const match = catData?.selectionRule?.match(/\d+/);
                  const catLimit = match ? parseInt(match[0], 10) : 0;
                  const isDone = selectedCount >= catLimit;
                  const isActive = activeCategory === cat;
                  const isHighlighted = highlightIncomplete && !isDone;

                  return (
                    <button
                      key={cat}
                      ref={(el) => (categoryTabRefs.current[cat] = el)}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 border select-none shrink-0",
                        isActive
                          ? "bg-[#0B2D23] text-white border-[#D6B15E]/80 shadow-2xs"
                          : "bg-[#FFFEFA] text-[#0B2D23] hover:text-[#061D16] hover:bg-[#FAF6EE] border-[#D6B15E]/50 hover:border-[#D6B15E] shadow-2xs",
                        isHighlighted && "border-red-500 bg-red-50 text-red-700 animate-pulse",
                      )}
                    >
                      <span>{cat}</span>
                      {catLimit > 0 ? (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                            isActive
                              ? isDone
                                ? "bg-[#D6B15E]/30 text-[#FDF3D6] border border-[#D6B15E]/40"
                                : "bg-white/15 text-white/90"
                              : isDone
                                ? "bg-[#E8F5EE] text-[#0B2D23] border border-[#A3D9BA]/60"
                                : "bg-[#FAF6EE] text-[#7A6A4E] border border-[#D6B15E]/30",
                          )}
                        >
                          {selectedCount}/{catLimit}
                        </span>
                      ) : selectedCount > 0 ? (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                            isActive
                              ? "bg-white/15 text-white"
                              : "bg-[#FAF6EE] text-[#7A6A4E] border border-[#D6B15E]/30",
                          )}
                        >
                          {selectedCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "package_detail" ? (
        <div className="bg-transparent py-3 sm:py-4 z-20 relative select-none">
          <div className="max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-2.5 sm:gap-3">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-stone-500 font-sans tracking-wide">
              <Link to="/" className="hover:text-[#BB9C4A] transition-colors font-bold text-stone-600">Home</Link>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <Link to="/explore" className="hover:text-[#BB9C4A] transition-colors font-bold text-stone-600">Explore Caterers</Link>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <Link to={`/caterer/${id}`} className="hover:text-[#BB9C4A] transition-colors font-bold text-stone-600 truncate max-w-[140px] sm:max-w-[220px]">{caterer?.name}</Link>
              <ChevronRight size={12} className="text-stone-400 shrink-0" />
              <span className="text-[#BB9C4A] font-extrabold truncate max-w-[160px] sm:max-w-[240px]">{selectedPackage?.packageName || selectedPackage?.name || "Gold Package"}</span>
            </div>

            <div className="flex items-center justify-start gap-3 sm:gap-3.5">
              {/* Elegant Back Arrow button */}
              <button
                onClick={() => {
                  navigate(`/caterer/${id}`, { state: { fromOrder: true, selectedPackageId: selectedPackage?.id, guests: guests } });
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-[#D5A859]/15 text-[#C2BB8B] active:scale-95 transition-all bg-white/80 border border-[#DECC9C]/60 hover:border-[#BB9C4A] cursor-pointer shrink-0 shadow-xs"
                title="Back to Caterer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#BB9C4A"
                  strokeWidth="2.5"
                  className="transition-transform hover:-translate-x-0.5"
                >
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>

              {/* Brand Title with elegant styling and balanced scale */}
              <div className="flex flex-col text-left">
                <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#0B1F17] uppercase leading-tight">
                  {selectedPackage?.packageName || "Veg Silver"}
                </h1>
                <span className="text-[10px] sm:text-xs font-sans font-semibold text-[#B8860B] uppercase tracking-[0.2em] mt-1">
                  {caterer.name} • {caterer.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-stone-200/50 py-4.5 shadow-sm z-10 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {viewMode === "checkout" ? (
                <button
                  onClick={() => setViewMode("custom")}
                  className="hover:bg-stone-50 border border-stone-200 p-2 rounded-full transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <ArrowLeft size={18} className="text-stone-800" />
                </button>
              ) : (
                <button
                  onClick={() => setViewMode("package_detail")}
                  className="hover:bg-stone-50 border border-stone-200 p-2 rounded-full transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <ArrowLeft size={18} className="text-stone-800" />
                </button>
              )}
              <div className="text-left">
                <h1
                  className={cn(
                    "font-display font-bold text-xl sm:text-2xl leading-tight text-stone-900 tracking-tight",
                    viewMode === "checkout" && "font-serif text-[22px] sm:text-[28px] text-[#0F3D2E] font-extrabold tracking-tight"
                  )}
                >
                  {viewMode === "checkout"
                    ? "Book Your Event"
                    : selectedPackage?.packageName || selectedPackage?.name || "Build Your Menu"}
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 font-medium">
                  {caterer.name} • {caterer.location}
                </p>
              </div>
            </div>

            {viewMode === "checkout" ? (
              <div className="flex items-center gap-1.5 text-stone-600 font-sans text-xs border border-stone-200 px-3.5 py-2 rounded-full bg-stone-50/50 shrink-0 font-bold tracking-wide">
                <ShieldCheck size={16} className="text-[#0F3D2E]" />
                <span className="hidden xs:inline text-stone-700">Secure Booking</span>
                <span className="xs:hidden text-stone-700">Secure</span>
              </div>
            ) : (
              viewMode !== "package_detail" && (
                <div className="flex items-center gap-4 hidden sm:flex">
                  <div className="bg-slate-100 rounded-lg p-1.5 flex items-center">
                    <button
                      onClick={() => setGuests(Math.max(50, guests - 10))}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-brand-green-900 border border-slate-200 hover:bg-slate-50"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="px-4 font-bold text-brand-green-900 w-28 text-center">
                      {guests} Guests
                    </div>
                    <button
                      onClick={() => setGuests(guests + 10)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-brand-green-900 border border-slate-200 hover:bg-slate-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {false && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-green-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-brand-green-900">
                {caterer.name}
              </h2>
              <p className="flex items-center gap-1 text-slate-600 text-sm mt-1">
                <MapPin size={16} className="text-slate-400" />{" "}
                {caterer.location}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 min-w-max">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:hidden">
                Need Help?
              </span>
              <button className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                📞 Call
              </button>
              <button className="px-4 py-2 bg-[#25D366]/10 text-[#25D366] font-bold text-sm rounded-xl hover:bg-[#25D366]/20 transition-colors">
                📱 WhatsApp
              </button>
              <button className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-100 transition-colors">
                📍 Location
              </button>
            </div>
          </div>

          {packageDefinitions.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
              <ChefHat className="mx-auto mb-4 text-slate-300" size={48} />
              <h3 className="font-bold text-xl text-slate-700 mb-2">
                No Packages Found
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                This caterer has not uploaded their menu packages yet. Please
                check back later.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-center mb-10">
                <h2 className="text-4xl font-display font-bold text-slate-900 mb-4 tracking-tight">
                  Choose Your Package
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px bg-brand-gold-300 w-12 border-0"></div>
                  <Star
                    size={12}
                    className="text-brand-gold-500 fill-brand-gold-500"
                  />
                  <div className="h-px bg-brand-gold-300 w-12 border-0"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packageDefinitions.map((pkg, idx) => {
                  const sortedSlabs = pkg.pricingSlabs
                    ? [...pkg.pricingSlabs].sort(
                        (a: any, b: any) => a.minGuests - b.minGuests,
                      )
                    : [];
                  const minGuests =
                    sortedSlabs.length > 0
                      ? sortedSlabs[0].minGuests
                      : pkg.minimumGuests || 100;
                  const minPrice =
                    sortedSlabs.length > 0
                      ? Math.min(...sortedSlabs.map((s: any) => s.price))
                      : pkg.pricePerPlate || caterer?.startingPrice || 350;
                  const totalCategories = pkg.categories
                    ? pkg.categories.length
                    : 0;

                  const tier = getPackageTier(pkg.packageName, idx);

                  let cardBgAndBorder =
                    "bg-gradient-to-b from-white to-slate-50/70 border-slate-200 hover:border-slate-350 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]";
                  let headerColor = "text-[#0F3D2E]";
                  let buttonColor =
                    "bg-[#0F3D2E] text-white hover:bg-[#0A2F24] border-[1.5px] border-[#D4AF37]/50 hover:border-[#D4AF37] hover:shadow-[0_4px_15px_rgba(11,61,46,0.15)]";

                  if (tier === "gold") {
                    cardBgAndBorder =
                      "bg-gradient-to-b from-white to-[#FCFAF5] border-2 border-[#D4AF37]/45 hover:border-[#D4AF37] hover:shadow-[0_20px_50px_rgba(212,175,55,0.16)]";
                    headerColor = "text-[#886C1D]";
                    buttonColor =
                      "bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white border-[1.5px] border-[#D4AF37]/65 hover:from-[#E4BC50] hover:to-[#C8A437] shadow-[0_4px_20px_rgba(212,175,55,0.22)]";
                  } else if (tier === "silver") {
                    cardBgAndBorder =
                      "bg-gradient-to-b from-white to-slate-50 border-2 border-slate-300 hover:border-slate-450 hover:shadow-[0_20px_50px_rgba(15,41,34,0.08)]";
                    headerColor = "text-slate-700";
                    buttonColor =
                      "bg-slate-800 text-white hover:bg-slate-900 border-[1.5px] border-[#C0C0C0]/50 hover:border-[#C0C0C0]/80 hover:shadow-[0_4px_15px_rgba(0,0,0,0.15)]";
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setSelectedItems({});
                        setViewMode("package_detail");
                      }}
                      className={cn(
                        "rounded-2xl sm:rounded-[32px] p-4 sm:p-8 cursor-pointer hover:-translate-y-1.5 transition-all duration-350 flex flex-col relative overflow-visible group shadow-sm hover:shadow-md text-center mt-5 sm:mt-7",
                        cardBgAndBorder,
                      )}
                    >
                      {/* Luxury overlapping Crown design with 3D shadow */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-white border border-[#D4AF37]/35 shadow-[0_4px_12px_rgba(212,175,55,0.15)] flex items-center justify-center p-1.5 sm:p-2.5">
                          <CrownIcon
                            tier={tier}
                            className="w-6 h-6 sm:w-10 sm:h-10"
                          />
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/3 rounded-bl-full -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform blur-xl"></div>

                      <div className="mb-5 mt-4 relative z-10 flex flex-col items-center">
                        {/* Premium Veg / Non-Veg Badge */}
                        <div className="mb-3.5">
                          {renderVegNonVegBadge(pkg.packageType)}
                        </div>

                        <h4
                          className={cn(
                            "font-display font-bold text-2xl uppercase tracking-wider mb-1 line-clamp-1 h-8",
                            headerColor,
                          )}
                        >
                          {pkg.packageName || "Catering Package"}
                        </h4>
                      </div>

                      <div className="mb-6 relative z-10 flex-1 flex flex-col justify-between">
                        {/* Center-aligned Pricing with serif font (Requirement 3) */}
                        <div className="my-2 sm:my-4 py-2 sm:py-4 px-3 sm:px-6 bg-gradient-to-br from-[#FCFAF5] to-[#F5EFE1]/20 rounded-xl sm:rounded-2xl border border-[#D4AF37]/18 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#D4AF37]/50 transition-all duration-300">
                          {/* Subtle background motif */}
                          <div className="absolute right-2 bottom-0 top-0 w-1/4 opacity-[0.06] pointer-events-none flex items-center justify-end select-none">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-10 h-10 text-[#D4AF37]"
                              stroke="currentColor"
                            >
                              <path
                                d="M10 90 C10 90 10 40 50 20 C65 12 75 15 80 22 C85 29 80 45 65 60 C45 80 10 90 10 90 Z"
                                fill="none"
                                strokeWidth="1"
                              />
                            </svg>
                          </div>

                          <div className="text-xl sm:text-4.5xl font-display font-black text-[#0F3D2E] tracking-tight">
                            ₹{minPrice}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-sans font-black text-slate-450 uppercase tracking-widest mt-0.5">
                            / Plate
                          </div>
                        </div>

                        <p className="text-[10px] sm:text-[11px] italic text-slate-400 font-medium mb-3 sm:mb-5 px-3 line-clamp-1 sm:line-clamp-none">
                          "
                          {pkg.description ||
                            "Special selection carefully curated for your prestigious guests."}
                          "
                        </p>

                        {/* Premium Features Card styling inspired by the mockup (Requirement 5) */}
                        <div className="bg-[#FAF8F5]/85 rounded-xl sm:rounded-2xl border border-[#D4AF37]/12 py-2.5 sm:py-4 px-3 sm:px-4.5 space-y-2 sm:space-y-3.5 text-left shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-5.5 h-5.5 rounded-full bg-white border border-[#D4AF37]/25 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-3xs">
                              <svg
                                className="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </div>
                            <span className="font-sans font-extrabold text-[10px] uppercase tracking-wider text-slate-700">
                              {totalCategories} Categories Included
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-5.5 h-5.5 rounded-full bg-white border border-[#D4AF37]/25 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-3xs">
                              <svg
                                className="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                            </div>
                            <span className="font-sans font-extrabold text-[10px] uppercase tracking-wider text-slate-700">
                              Select Any 1 Item
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-5.5 h-5.5 rounded-full bg-white border border-[#D4AF37]/25 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-3xs">
                              <svg
                                className="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                              </svg>
                            </div>
                            <span className="font-sans font-extrabold text-[10px] uppercase tracking-wider text-slate-700">
                              {minGuests}+ Guests Limit
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto relative z-10 pt-2">
                        <button
                          type="button"
                          className={cn(
                            "w-full py-2 sm:py-3.5 px-4 sm:px-6 font-sans font-black uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-1.5 text-[10px] sm:text-2xs cursor-pointer group",
                            buttonColor,
                          )}
                        >
                          <span>View Details</span>
                          <ChevronRight
                            size={13}
                            className="stroke-[3] transition-transform group-hover:translate-x-1"
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === "package_detail" && selectedPackage && (
        <div className="flex-1 w-full max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pb-8 pt-1 relative box-border">
          {/* Outer Luxury 2-layer Bezel Frame */}
          <div className="bg-[#FAF5EA] rounded-2xl md:rounded-3xl p-1 md:p-1.5 shadow-[0_15px_45px_rgba(21,21,21,0.08)] border border-[#DECC9C] md:border-2 md:border-[#BB9C4A] relative overflow-hidden w-full max-w-full box-border">
            <div className="bg-[#FFFDF9] rounded-[14px] md:rounded-[22px] border border-slate-200 md:border-[#DECC9C] overflow-hidden flex flex-col relative w-full max-w-full box-border">
              {/* Premium Emerald Green Header with Leaf motif */}
              <div className="bg-gradient-to-br from-[#021B1A] via-[#032D29] to-[#0A3A34] text-white px-4 py-3.5 sm:px-6 sm:py-4.5 relative overflow-hidden select-none border-b border-[#BB9C4A]/40">
                {/* Detailed decorative leaf watermark on the right */}
                <svg
                  viewBox="0 0 100 100"
                  className="absolute -right-2 bottom-0 top-0 w-32 sm:w-48 h-full text-[#032D29] opacity-45 pointer-events-none select-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M15 85 C 30 65, 45 40, 80 15 C 75 35, 60 75, 15 85 Z" />
                  <path d="M15 85 L 80 15" strokeDasharray="2 2" />
                  <path d="M35 65 Q 45 55 57 57" strokeWidth="0.8" />
                  <path d="M45 53 Q 55 43 67 45" strokeWidth="0.8" />
                  <path d="M55 41 Q 65 31 77 33" strokeWidth="0.8" />
                  <path d="M22 75 Q 30 67 40 70" strokeWidth="0.8" />
                </svg>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Elegant circular brand gold crest logo */}
                    <div className="w-11 h-11 sm:w-13 sm:h-13 bg-white rounded-full border-2 border-transparent bg-gradient-to-br from-[#F4E2B6] via-[#D4AF37] to-[#886C1D] flex items-center justify-center shadow-[0_4px_16px_rgba(184,150,46,0.25)] shrink-0 p-[2px] relative z-10 transition-transform hover:scale-105 duration-300">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <svg
                          viewBox="0 0 100 100"
                          className="w-6 sm:w-8 h-6 sm:h-8 text-[#0F3D2E] fill-none"
                          stroke="currentColor"
                          strokeWidth="5.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M50 82 L50 22" />
                          <path
                            d="M50 45 C40 35, 42 20, 50 15 C58 20, 60 35, 50 45 Z"
                            fill="#0F3D2E"
                            fillOpacity="0.08"
                          />
                          <path
                            d="M50 62 C28 58, 22 42, 34 34 C42 45, 48 53, 50 57"
                            strokeWidth="5"
                          />
                          <path
                            d="M50 62 C72 58, 78 42, 66 34 C58 45, 52 53, 50 57"
                            strokeWidth="5"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="text-left flex-1 min-w-0">
                      <h2 className="text-base sm:text-xl lg:text-2xl font-display font-semibold text-[#F4E2B6] tracking-wider uppercase leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] truncate">
                        {selectedPackage.packageName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] sm:text-[11px] text-[#E0D4BA] font-medium tracking-wide">
                          {caterer.name} • {caterer.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {renderVegNonVegBadge(selectedPackage.packageType || "Veg")}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#D4AF37]/30 text-[9.5px] font-bold text-[#F4E2B6] font-sans">
                      <Users size={12} className="text-[#D4AF37]" />
                      Min {selectedPackage.minimumGuests || 50}+
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-7 bg-[#FFFDF9]">
                {/* 2-Column Responsive Layout on Desktop, 1-Column on Mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
                  
                  {/* LEFT COLUMN: Package Information & Pricing Tiers */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    {/* Package Price Box */}
                    <div className="relative bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EA] rounded-2xl border border-[#DECC9C] p-4 sm:p-5 hover:border-[#D4AF37]/50 hover:shadow-[0_8px_24px_rgba(212,175,55,0.08)] transition-all duration-350 overflow-hidden shadow-xs flex flex-col items-center justify-center text-center">
                      {/* Corner bevel/flourish details */}
                      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#BB9C4A]/40 rounded-tl-[3px]"></div>
                      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#BB9C4A]/40 rounded-tr-[3px]"></div>
                      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#BB9C4A]/40 rounded-bl-[3px]"></div>
                      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#BB9C4A]/40 rounded-br-[3px]"></div>

                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 relative z-10 w-full px-2">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#DECC9C] to-[#C29D38] opacity-60"></div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[#C29D38] text-[8px] select-none">⚜️</span>
                          <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[2px] text-[#8C6D1F] uppercase text-center">
                            PACKAGE PRICE
                          </span>
                          <span className="text-[#C29D38] text-[8px] select-none">⚜️</span>
                        </div>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#DECC9C] to-[#C29D38] opacity-60"></div>
                      </div>

                      <div className="relative z-10 flex flex-col items-center justify-center text-center my-1">
                        <span
                          className="font-semibold text-4xl sm:text-5xl lg:text-5.5xl leading-none select-all text-transparent bg-clip-text"
                          style={{
                            fontFamily: '"Cinzel", "Libre Baskerville", "Georgia", serif',
                            fontWeight: 600,
                            letterSpacing: "-1px",
                            background: "linear-gradient(180deg, #D4AF37 0%, #C9A227 50%, #B8860B 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.06))",
                          }}
                        >
                          ₹{currentPerPlatePrice}
                        </span>
                        <span className="text-[11px] sm:text-[12px] font-sans font-black text-[#5C5750] uppercase tracking-[0.2em] mt-1.5">
                          Per Plate
                        </span>
                      </div>

                      {/* Package Description / Feature highlights */}
                      <p className="text-[11px] sm:text-xs text-stone-500 italic mt-2 text-center max-w-md">
                        "{selectedPackage.description || "Curated premium catering spread with chef-crafted delicacies tailored for your event."}"
                      </p>

                      {selectedPackage.categories && selectedPackage.categories.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-2.5 border-t border-[#DECC9C]/50 w-full">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F3D2E] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                            <Sparkles size={11} className="text-[#D4AF37]" />
                            {selectedPackage.categories.length} Food Categories
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                            <Utensils size={11} className="text-stone-500" />
                            Fully Customizable
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pricing Slabs (Interactive Tiers) */}
                    {selectedPackage.pricingSlabs && selectedPackage.pricingSlabs.length > 0 && (
                      <div className="bg-white/90 border border-[#DECC9C] rounded-2xl p-3.5 sm:p-4 shadow-xs">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[10.5px] font-sans font-bold text-[#8A6715] uppercase tracking-wider">
                            Pricing Tiers
                          </span>
                          <span className="text-[9.5px] text-stone-500">
                            Click tier to update guest count
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(() => {
                            const sortedSlabs = [...selectedPackage.pricingSlabs].sort(
                              (a: any, b: any) => a.minGuests - b.minGuests
                            );
                            return sortedSlabs.map((slab: any, idx: number) => {
                              let isActive = false;
                              if (
                                guests >= slab.minGuests &&
                                (slab.maxGuests === null || guests <= slab.maxGuests)
                              ) {
                                isActive = true;
                              } else if (guests < sortedSlabs[0].minGuests && idx === 0) {
                                isActive = true;
                              } else if (
                                sortedSlabs[sortedSlabs.length - 1].maxGuests !== null &&
                                guests > sortedSlabs[sortedSlabs.length - 1].maxGuests &&
                                idx === sortedSlabs.length - 1
                              ) {
                                isActive = true;
                              } else if (slab.maxGuests === null && guests >= slab.minGuests) {
                                isActive = true;
                              }

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setGuests(slab.minGuests)}
                                  className={cn(
                                    "flex flex-col justify-center items-start px-3 py-2 sm:py-2.5 rounded-xl border transition-all duration-200 text-left cursor-pointer",
                                    isActive
                                      ? "border-[#D4AF37] bg-gradient-to-br from-[#FFFDF9] to-[#FCFAF5] shadow-xs ring-1 ring-[#D4AF37]/50"
                                      : "border-[#DECC9C]/50 bg-[#FAF8F5] hover:border-[#DECC9C] hover:bg-white"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "text-[9px] font-black uppercase tracking-wider font-sans",
                                      isActive ? "text-[#8A6715]" : "text-stone-500"
                                    )}
                                  >
                                    {slab.minGuests} {slab.maxGuests ? `- ${slab.maxGuests}` : "+"} Guests
                                  </span>
                                  <span
                                    className={cn(
                                      "text-sm sm:text-base font-black font-display mt-0.5",
                                      isActive ? "text-[#0F3D2E]" : "text-stone-800"
                                    )}
                                  >
                                    ₹{slab.price}{" "}
                                    <span className="text-[10px] font-sans font-medium text-stone-400">
                                      / plate
                                    </span>
                                  </span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Guest Count Controls, Estimate Summary & Continue Button */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    {/* Enter Guest Count Controls */}
                    <div className="bg-white/95 border border-[#DECC9C] rounded-2xl p-3.5 sm:p-4 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] sm:text-[12px] font-sans font-semibold text-[#123326] uppercase tracking-[2px]">
                          ENTER GUEST COUNT
                        </label>
                        <span className="text-[10px] font-medium text-stone-500">
                          Min: {selectedPackage.minimumGuests || 50} guests
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setGuests(
                              Math.max(
                                selectedPackage.minimumGuests || 50,
                                guests - 10
                              )
                            )
                          }
                          className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-b from-[#FCFAF5] to-[#EFE7D5] hover:from-white hover:to-[#FCFAF5] active:scale-95 text-[#123326] rounded-xl border border-[#DECC9C] hover:border-[#C29D38] transition-all cursor-pointer shadow-xs text-lg font-bold shrink-0"
                          title="Decrease 10 guests"
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>

                        <input
                          type="number"
                          value={guests}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setGuests(val);
                          }}
                          className="flex-1 w-full h-11 sm:h-12 text-center font-sans font-black text-xl text-[#123326] bg-[#FAF8F5] focus:bg-white border border-[#DECC9C] hover:border-[#C29D38] focus:border-[#C29D38] rounded-xl outline-none transition-all shadow-inner select-all"
                        />

                        <button
                          type="button"
                          onClick={() => setGuests(guests + 10)}
                          className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-gradient-to-b from-[#FCFAF5] to-[#EFE7D5] hover:from-white hover:to-[#FCFAF5] active:scale-95 text-[#123326] rounded-xl border border-[#DECC9C] hover:border-[#C29D38] transition-all cursor-pointer shadow-xs text-lg font-bold shrink-0"
                          title="Increase 10 guests"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Gold Detail Estimate Summary Card */}
                    <div className="bg-[#FCFAF7] border border-[#DECC9C] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden text-left w-full box-border">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#E5D2A6]">
                        <div className="w-6.5 h-6.5 rounded-full border border-[#DECC9C] bg-[#FCFAF5] text-[#8C6D1F] flex items-center justify-center shadow-xs shrink-0">
                          <svg
                            className="w-3.5 h-3.5 text-[#8A6715]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="9" x2="15" y2="9" />
                            <line x1="9" y1="13" x2="15" y2="13" />
                            <line x1="9" y1="17" x2="15" y2="17" />
                          </svg>
                        </div>
                        <h4 className="font-sans font-semibold text-[11px] sm:text-xs tracking-[2px] text-[#123326] uppercase">
                          ESTIMATE SUMMARY
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-left">
                          <span className="text-[#5C5750] font-semibold text-[10px] sm:text-[11px] uppercase tracking-[1px] font-sans">
                            CATERING PACKAGE
                          </span>
                          <span className="font-sans font-bold text-[#123326] text-xs uppercase tracking-tight truncate max-w-[200px]">
                            {selectedPackage.packageName}
                          </span>
                        </div>

                        <div className="w-full border-t border-dashed border-[#DECC9C]/60"></div>

                        <div className="flex justify-between items-center text-left">
                          <span className="text-[#5C5750] font-semibold text-[10px] sm:text-[11px] uppercase tracking-[1px] font-sans">
                            PRICE PER PLATE
                          </span>
                          <span className="font-sans font-bold text-[#123326] text-xs sm:text-sm">
                            ₹{currentPerPlatePrice}
                          </span>
                        </div>

                        <div className="w-full border-t border-dashed border-[#DECC9C]/60"></div>

                        <div className="flex justify-between items-center text-left">
                          <span className="text-[#5C5750] font-semibold text-[10px] sm:text-[11px] uppercase tracking-[1px] font-sans">
                            EXPECTED GUEST COUNT
                          </span>
                          <span className="font-sans font-bold text-[#123326] text-xs sm:text-sm">
                            {guests} Guests
                          </span>
                        </div>

                        {/* Estimated Total Highlight Banner */}
                        <div className="pt-1">
                          <div className="bg-gradient-to-r from-[#F6F0DF] to-[#EFE5CD] border border-[#DECC9C] rounded-xl p-3 sm:p-3.5 flex justify-between items-center shadow-xs">
                            <div className="flex flex-col text-left">
                              <span className="text-[9.5px] font-sans font-bold text-[#B8860B] uppercase tracking-[2px]">
                                ESTIMATED TOTAL
                              </span>
                              <span className="text-[9px] text-[#5C5750] font-medium tracking-tight">
                                Inclusive of all taxes
                              </span>
                            </div>
                            <span
                              className="font-bold text-2xl sm:text-3xl lg:text-3.5xl leading-none"
                              style={{
                                fontFamily: '"Cinzel", "Libre Baskerville", "Georgia", serif',
                                letterSpacing: "-0.5px",
                                background: "linear-gradient(180deg, #D4AF37 0%, #C9A227 50%, #B8860B 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.06))",
                              }}
                            >
                              ₹{(currentPerPlatePrice * guests).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer Policy */}
                    <div className="flex items-center gap-1.5 text-[10.5px] text-[#7A7369] font-medium text-left px-1">
                      <span className="text-xs text-[#C29D38] font-bold shrink-0">ⓘ</span>
                      <span>Taxes and additional charges may apply as per venue policy.</span>
                    </div>

                    {/* Call To Action Button (Premium Emerald / Gold outline) */}
                    <button
                      type="button"
                      onClick={() => setViewMode("custom")}
                      className="w-full bg-gradient-to-br from-[#021B1A] via-[#032D29] to-[#0A3A34] text-[#FDE5A9] font-sans font-bold text-xs sm:text-[13px] uppercase tracking-[2px] sm:tracking-[3px] py-3.5 px-6 rounded-xl shadow-[0_8px_24px_rgba(2,27,26,0.2)] hover:shadow-[0_12px_32px_rgba(184,150,46,0.25)] border-2 border-[#BB9C4A] hover:border-[#F4E2B6] hover:scale-[1.008] active:scale-[0.99] transition-all outline-none flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <span>CONTINUE WITH MENU</span>
                      <ChevronRight
                        size={15}
                        className="transition-transform group-hover:translate-x-1 text-[#FDE5A9] stroke-[3]"
                      />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "custom" && selectedPackage && (
        <>
          <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
              {/* LEFT COLUMN: Main Menu Selection Area */}
              <div id="active-category-content" className="flex-1 min-w-0 w-full">
                <div className="bg-[#FFFEFA] rounded-3xl border border-[#D6B15E]/40 shadow-[0_4px_24px_rgba(214,177,94,0.06)] p-4 sm:p-6 lg:p-7">
                  {/* Category Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D6B15E]/30">
                    <div>
                      <h2
                        className="font-serif font-bold text-2xl sm:text-3xl lg:text-3.5xl text-[#0B2D23] leading-tight tracking-tight"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        {activeCategory}
                      </h2>
                      <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#8B6E4A] uppercase tracking-wider font-sans">
                          {getSelectionRuleLabel(
                            selectedPackage.categories?.find(
                              (c: any) => c.categoryName === activeCategory,
                            )?.selectionRule,
                          )}
                        </span>
                        {limitPerCategory > 0 && (
                          <>
                            <span className="text-[#D6B15E]/60">•</span>
                            {(() => {
                              const catData = selectedPackage.categories?.find(
                                (c: any) => c.categoryName === activeCategory,
                              );
                              const itemsInCat = catData?.items || [];
                              const selectedCount = itemsInCat.filter(
                                (i: string) => selectedItems[i],
                              ).length;
                              const isFull = selectedCount >= limitPerCategory;
                              return isFull ? (
                                <span className="inline-flex items-center gap-1.5 bg-[#E8F5EE] text-[#0B2D23] font-bold px-2.5 py-0.5 rounded-full text-xs border border-[#A3D9BA]/70">
                                  <Check size={12} strokeWidth={3} />
                                  Completed ({selectedCount}/{limitPerCategory})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 bg-[#FFFDF7] text-[#8B6E32] font-bold px-2.5 py-0.5 rounded-full text-xs border border-[#D6B15E]/50">
                                  Requires {limitPerCategory} ({selectedCount} selected)
                                </span>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Search Bar for filtering items within category */}
                    <div className="relative w-full sm:w-[240px] shrink-0">
                      <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D6B15E]"
                      />
                      <input
                        type="text"
                        placeholder="Search dishes..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-[#FFFEFA] border border-[#D6B15E]/50 rounded-full text-xs sm:text-sm font-medium text-[#0B2D23] placeholder:text-stone-400 outline-none focus:border-[#D6B15E] focus:ring-1 focus:ring-[#D6B15E]/50 transition-all shadow-2xs"
                      />
                      {categorySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCategorySearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#0B2D23] cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Completion Alert message */}
                  {highlightIncomplete && !isCategoryComplete(activeCategory) && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 text-xs font-semibold animate-pulse">
                      <span>⚠️</span>
                      <span>
                        Please select {getCategoryRemainingCount(activeCategory)} more item{getCategoryRemainingCount(activeCategory) > 1 ? "s" : ""} from {activeCategory}.
                      </span>
                    </div>
                  )}

                  {/* Menu Items Grid: Cards with thin gold borders and warm cream bg */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                    {(() => {
                      const allCatItems =
                        selectedPackage.categories?.find(
                          (c: any) => c.categoryName === activeCategory,
                        )?.items || [];

                      const filteredItems = allCatItems.filter((item: string) =>
                        categorySearchQuery.trim() === ""
                          ? true
                          : item
                              .toLowerCase()
                              .includes(categorySearchQuery.toLowerCase().trim()),
                      );

                      if (filteredItems.length === 0) {
                        return (
                          <div className="col-span-full py-12 text-center text-stone-400">
                            <p className="text-sm font-medium">
                              No dishes found matching "{categorySearchQuery}"
                            </p>
                            <button
                              type="button"
                              onClick={() => setCategorySearchQuery("")}
                              className="mt-2 text-xs font-bold text-[#D6B15E] hover:underline cursor-pointer"
                            >
                              Clear search
                            </button>
                          </div>
                        );
                      }

                      return filteredItems.map((itemName: string, idx: number) => {
                        const isSelected = !!selectedItems[itemName];
                        const itemsInCat = allCatItems;
                        const selectedCount = itemsInCat.filter(
                          (i: string) => selectedItems[i],
                        ).length;
                        const isAtLimit =
                          limitPerCategory > 0 &&
                          selectedCount >= limitPerCategory;
                        const isDisabled = !isSelected && isAtLimit;
                        const isPremium = isItemPremium(itemName);
                        const isNonVeg = isItemNonVeg(
                          itemName,
                          activeCategory,
                        );

                        return (
                          <div
                            key={idx}
                            data-name={itemName}
                            onClick={() => {
                              if (!isDisabled) {
                                toggleItem(itemName, activeCategory);
                              }
                            }}
                            className={cn(
                              "relative bg-[#FFFEFA] rounded-xl p-3 sm:p-3.5 border transition-all duration-200 flex flex-col justify-between min-h-[90px] sm:min-h-[100px] select-none",
                              isSelected
                                ? "border-[#D6B15E] ring-1 ring-[#D6B15E]/40 bg-[#FFFDF7] shadow-[0_4px_16px_rgba(214,177,94,0.18)]"
                                : isDisabled
                                  ? "border-[#D6B15E]/20 bg-[#FAF9F5] opacity-55 cursor-not-allowed shadow-none"
                                  : "border-[#D6B15E]/50 hover:border-[#D6B15E] shadow-[0_2px_10px_rgba(214,177,94,0.08)] hover:shadow-[0_4px_16px_rgba(214,177,94,0.16)] cursor-pointer",
                            )}
                          >
                            {/* Top Row: Dietary Indicator (Veg / Non-Veg) & Status Badge */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div>
                                {isNonVeg ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                    Non-Veg
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B2D23] font-sans">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                    Veg
                                  </span>
                                )}
                              </div>

                              <div>
                                {isPremium ? (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B6E32] bg-[#FFFDF7] border border-[#D6B15E]/50 px-1.5 py-0.5 rounded">
                                    Premium
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-semibold text-stone-500 uppercase tracking-wider">
                                    Included
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Middle: Dish Name in Clean High-Readability Serif Text (NO images, NO logos, NO initials) */}
                            <div className="my-0.5">
                              <h3
                                className="font-serif font-bold text-sm sm:text-[15px] text-[#0B2D23] leading-snug"
                                style={{
                                  fontFamily: '"Playfair Display", Georgia, serif',
                                }}
                              >
                                {itemName}
                              </h3>
                            </div>

                            {/* Bottom Row: Control button */}
                            <div className="mt-2 pt-1.5 border-t border-[#D6B15E]/20 flex items-center justify-between">
                              <span className="text-[11px] font-medium text-stone-500">
                                {isSelected ? (
                                  <span className="text-[#0B2D23] font-bold">
                                    In your menu
                                  </span>
                                ) : isDisabled ? (
                                  <span className="text-stone-400">
                                    Limit reached
                                  </span>
                                ) : (
                                  <span>Tap to add</span>
                                )}
                              </span>

                              {isSelected ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(itemName, activeCategory);
                                  }}
                                  className="px-2.5 py-1 bg-[#0B2D23] hover:bg-[#061D16] text-[#FDF8EE] border border-[#D6B15E]/70 rounded-md text-[11px] font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                                >
                                  <Check size={11} strokeWidth={3} />
                                  <span>Selected</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isDisabled) {
                                      toggleItem(itemName, activeCategory);
                                    }
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 select-none",
                                    isDisabled
                                      ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                                      : "bg-[#FFFEFA] hover:bg-[#FAF6EE] text-[#0B2D23] border border-[#D6B15E]/60 hover:border-[#D6B15E] cursor-pointer shadow-2xs",
                                  )}
                                >
                                  <Plus size={11} strokeWidth={2.5} />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Order Summary Panel (Desktop Sticky) */}
              <div className="hidden lg:block lg:w-[320px] xl:w-[350px] shrink-0">
                <div className="bg-[#FFFEFA] rounded-2xl border border-[#D6B15E]/50 shadow-[0_4px_20px_rgba(214,177,94,0.06)] sticky top-[150px] max-h-[calc(100vh-170px)] flex flex-col overflow-hidden">
                  {/* Panel Header */}
                  <div className="p-3.5 pb-3 border-b border-[#D6B15E]/30 bg-[#FAF7F2]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#B8860B] font-sans">
                          ORDER SUMMARY
                        </span>
                        <h3
                          className="font-serif font-bold text-lg sm:text-xl text-[#0B2D23] leading-tight mt-0.5"
                          style={{
                            fontFamily: '"Playfair Display", Georgia, serif',
                          }}
                        >
                          {selectedPackage.packageName || "Curated Menu"}
                        </h3>
                        <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                          {caterer.name}
                        </p>
                      </div>

                      {selectedItemsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to clear your selected menu items?",
                              )
                            ) {
                              setSelectedItems({});
                            }
                          }}
                          className="text-[10px] font-bold text-stone-400 hover:text-rose-600 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-50"
                          title="Clear all selected items"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {/* Guest & Base Price Row */}
                    <div className="mt-2.5 pt-2 border-t border-[#D6B15E]/30 flex items-center justify-between text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Users size={12} className="text-[#D6B15E]" />
                        <span className="text-[#0B2D23]">{guests} Guests</span>
                      </div>
                      <div className="text-[#0B2D23]">
                        <span>₹{currentPerPlatePrice} / plate</span>
                      </div>
                    </div>

                    {/* Category Completion Progress Bar */}
                    <div className="mt-2.5 pt-2 border-t border-[#D6B15E]/30">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-[#0B2D23]">Menu Completion</span>
                        <span
                          className={
                            doneCategoriesCount === totalCategoriesCount
                              ? "text-[#0B2D23] font-bold"
                              : "text-[#B8860B] font-bold"
                          }
                        >
                          {doneCategoriesCount} of {totalCategoriesCount} Categories
                        </span>
                      </div>
                      <div className="w-full bg-[#FAF4E8] border border-[#D6B15E]/30 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#D6B15E] to-[#0B2D23] h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              (doneCategoriesCount /
                                (totalCategoriesCount || 1)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Scrollable List of Selected Items grouped by category */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar">
                    {selectedItemsCount === 0 ? (
                      <div className="py-8 text-center text-stone-400">
                        <p className="font-serif text-sm text-stone-600 font-bold mb-0.5">
                          Your Menu is Empty
                        </p>
                        <p className="text-[11px] text-stone-500 max-w-[200px] mx-auto leading-relaxed">
                          Select dishes from the categories to build your custom
                          catering package.
                        </p>
                      </div>
                    ) : (
                      menuCategories.map((cat: string) => {
                        const itemsInCat = (
                          selectedPackage.categories?.find(
                            (c: any) => c.categoryName === cat,
                          )?.items || []
                        ).filter((i: string) => selectedItems[i]);

                        if (itemsInCat.length === 0) return null;

                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 pb-0.5 border-b border-[#D6B15E]/20">
                              <span className="uppercase tracking-wider text-[10px] text-[#0B2D23] font-sans">
                                {cat}
                              </span>
                              <span className="text-[9.5px] text-[#8B6E32]">
                                {itemsInCat.length} selected
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {itemsInCat.map((item: string) => (
                                <li
                                  key={item}
                                  className="flex items-center justify-between py-1 px-2 rounded-md bg-[#FAF7F2] hover:bg-[#FAF4E8] transition-colors text-[11px] font-semibold text-[#0B2D23] border border-[#D6B15E]/20 group"
                                >
                                  <span className="truncate pr-1.5">{item}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleItem(item, cat)}
                                    className="text-stone-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                                    title={`Remove ${item}`}
                                  >
                                    <X size={12} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Footer: Pricing Breakdown & CTA */}
                  <div className="p-3.5 pt-3 border-t border-[#D6B15E]/30 bg-[#FAF7F2] shrink-0 space-y-2.5">
                    {/* Price breakdown */}
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-stone-600">
                        <span>Package Subtotal ({guests} guests)</span>
                        <span className="font-semibold text-[#0B2D23]">
                          ₹{(currentPerPlatePrice * guests).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {platformFee > 0 && (
                        <div className="flex justify-between text-stone-600">
                          <span>Platform Service Fee</span>
                          <span className="font-semibold text-[#0B2D23]">
                            ₹{platformFee.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-[#D6B15E]/30 flex justify-between items-baseline">
                        <span className="font-bold text-stone-800 text-xs">
                          Estimated Total
                        </span>
                        <span className="font-serif font-bold text-xl text-[#0B2D23]">
                          ₹
                          {(
                            currentPerPlatePrice * guests +
                            platformFee
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-stone-500 text-right">
                        Inclusive of taxes & package curation
                      </p>
                    </div>

                    {/* CTA Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const incomplete = menuCategories.filter(
                          (cat) => !isCategoryComplete(cat),
                        );
                        if (incomplete.length === 0) {
                          setViewMode("checkout");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        } else {
                          const firstIncomplete = incomplete[0];
                          navigateToCategory(firstIncomplete);
                          setHighlightIncomplete(true);
                          setValidationTriggered(true);
                          toast(
                            `Please complete selections for ${firstIncomplete}`,
                            "error",
                          );
                        }
                      }}
                      className="w-full py-2.5 px-4 bg-[#0B2D23] hover:bg-[#061D16] text-[#FDF8EE] rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-[0.99] border border-[#D6B15E]"
                    >
                      <span>Proceed to Booking</span>
                      <ArrowRight size={14} />
                    </button>

                    {/* Incomplete warning banner */}
                    {!allCategoriesComplete && (
                      <div className="text-[10px] text-[#8B6E32] bg-[#FFFDF7] border border-[#D6B15E]/50 rounded-lg p-2 text-center font-medium">
                        Select required items in all categories to proceed.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM PREMIUM TRUST SECTION */}
          <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pb-12 select-none">
            <div className="bg-[#FFFEFA] border border-[#D6B15E]/40 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(214,177,94,0.06)] flex flex-col md:flex-row items-center justify-around gap-6 text-[13px] font-semibold text-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#FFF8EC] text-[#B8860B] flex items-center justify-center shrink-0 border border-[#D6B15E]/30">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-[#0B2D23] font-bold leading-tight">
                    Premium Ingredients
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    100% Quality Assurance
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-[#D6B15E]/30 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#E8F5EE] text-[#0B2D23] flex items-center justify-center shrink-0 border border-[#A3D9BA]/50">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-[#0B2D23] font-bold leading-tight">
                    Food Safety Standards
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    FSSAI Certified Protocols
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-[#D6B15E]/30 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#FFF8EC] text-[#B8860B] flex items-center justify-center shrink-0 border border-[#D5A859]/30">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h4 className="text-[#0B2D23] font-bold leading-tight">
                    Professional Chefs
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    5-Star Culinary Mastery
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-[#D6B15E]/30 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#E8F5EE] text-[#0B2D23] flex items-center justify-center shrink-0 border border-[#A3D9BA]/50">
                  <Smile size={20} />
                </div>
                <div>
                  <h4 className="text-[#0B2D23] font-bold leading-tight">
                    Guaranteed Delight
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Loved By 20,000+ Guests
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE STICKY BOTTOM ORDER BAR & EXPANDABLE DRAWER */}
          <div className="block lg:hidden">
            {/* Backdrop overlay */}
            {mobileCartExpanded && (
              <div
                className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
                onClick={() => setMobileCartExpanded(false)}
              />
            )}

            {/* Bottom Sheet Card */}
            <div
              className={cn(
                "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
                mobileCartExpanded
                  ? "h-[85vh] rounded-t-[2rem] bg-[#FFFEFA] border-t border-[#D6B15E]/60 shadow-2xl"
                  : "h-[56px] bg-[#0B2D23] text-white border-t border-[#D6B15E]/50 shadow-lg",
              )}
            >
              {!mobileCartExpanded ? (
                /* Collapsed Mobile Bar */
                <div
                  className="w-full h-full flex items-center justify-between px-4 cursor-pointer select-none"
                  onClick={() => setMobileCartExpanded(true)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-sm font-bold text-white">
                      ₹{(currentPerPlatePrice * guests).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-[#D6B15E] font-medium">
                      ({selectedItemsCount} {selectedItemsCount === 1 ? "item" : "items"})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#FDF3D6] uppercase tracking-wider">
                    <span>View Order</span>
                    <ChevronUp size={14} />
                  </div>
                </div>
              ) : (
                /* Expanded Mobile Drawer */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Drawer Handle */}
                  <div
                    className="w-full py-2.5 flex items-center justify-center cursor-pointer select-none border-b border-[#D6B15E]/30"
                    onClick={() => setMobileCartExpanded(false)}
                  >
                    <div className="w-12 h-1 bg-[#D6B15E]/50 rounded-full" />
                  </div>

                  {/* Drawer Header */}
                  <div className="px-5 py-3 border-b border-[#D6B15E]/30 flex items-center justify-between bg-[#FAF7F2]">
                    <div>
                      <h3
                        className="font-serif font-bold text-xl text-[#0B2D23]"
                        style={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                        }}
                      >
                        Your Curated Feast
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">
                        {guests} Guests • ₹{currentPerPlatePrice} / plate
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedItemsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to clear your selected menu items?",
                              )
                            ) {
                              setSelectedItems({});
                            }
                          }}
                          className="text-xs font-bold text-stone-400 hover:text-rose-600 px-2 py-1"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setMobileCartExpanded(false)}
                        className="w-8 h-8 rounded-full bg-[#FFFEFA] border border-[#D6B15E]/40 flex items-center justify-center text-[#0B2D23] cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Drawer Items List */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                    {selectedItemsCount === 0 ? (
                      <div className="py-12 text-center text-stone-400">
                        <p className="font-serif text-base text-stone-600 font-bold mb-1">
                          Your Menu is Empty
                        </p>
                        <p className="text-xs text-stone-500 max-w-[220px] mx-auto leading-relaxed">
                          Select dishes from the categories to build your custom
                          catering package.
                        </p>
                      </div>
                    ) : (
                      menuCategories.map((cat: string) => {
                        const itemsInCat = (
                          selectedPackage.categories?.find(
                            (c: any) => c.categoryName === cat,
                          )?.items || []
                        ).filter((i: string) => selectedItems[i]);

                        if (itemsInCat.length === 0) return null;

                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-stone-600 pb-1 border-b border-[#D6B15E]/20">
                              <span className="uppercase tracking-wider text-[11px] text-[#0B2D23] font-sans">
                                {cat}
                              </span>
                              <span className="text-[10px] text-[#8B6E32]">
                                {itemsInCat.length} selected
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {itemsInCat.map((item: string) => (
                                <li
                                  key={item}
                                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#FAF7F2] text-xs font-semibold text-[#0B2D23] border border-[#D6B15E]/20"
                                >
                                  <span className="truncate pr-2">{item}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleItem(item, cat)}
                                    className="text-stone-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                                  >
                                    <X size={13} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-[#D6B15E]/30 bg-[#FAF7F2] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                        Estimated Total
                      </span>
                      <span className="font-serif font-bold text-xl text-[#0B2D23]">
                        ₹
                        {(
                          currentPerPlatePrice * guests +
                          platformFee
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const incomplete = menuCategories.filter(
                          (cat) => !isCategoryComplete(cat),
                        );
                        if (incomplete.length === 0) {
                          setMobileCartExpanded(false);
                          setViewMode("checkout");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        } else {
                          const firstIncomplete = incomplete[0];
                          navigateToCategory(firstIncomplete);
                          setHighlightIncomplete(true);
                          setValidationTriggered(true);
                          setMobileCartExpanded(false);
                          toast(
                            `Please complete selections for ${firstIncomplete}`,
                            "error",
                          );
                        }
                      }}
                      className="w-full py-3.5 px-5 bg-[#0B2D23] text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md border border-[#D6B15E]"
                    >
                      <span>Proceed to Booking</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === "checkout" && (
        <div className="flex-1 max-w-7xl mx-auto w-full px-3 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-10 pb-24 md:pb-10 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
          {/* Left Column: Event Details Form */}
          <div className="flex-1 w-full bg-transparent md:bg-white md:rounded-3xl md:border md:border-stone-200/60 md:shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-0 md:p-8 space-y-5 md:space-y-10 text-left animate-fade-in">
            
            {/* Form Section 1: Event Details */}
            <div className="bg-white rounded-3xl border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 sm:p-8 space-y-6 md:bg-transparent md:border-none md:shadow-none md:p-0">
              <div className="flex items-start gap-4 border-b border-stone-100 pb-5">
                {/* Rotated gold squares badge */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#C29D38]" fill="currentColor">
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(0 50 50)" />
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(45 50 50)" />
                  </svg>
                  <span className="relative z-10 font-serif text-[17px] font-black text-white">1</span>
                </div>
                
                {/* Title & Subtitle */}
                <div className="flex-1 text-left">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#8C6512] tracking-tight leading-tight">
                      Event Details
                    </h2>
                    <svg className="h-3 w-16 sm:w-24 text-[#C29D38]/50 shrink-0" viewBox="0 0 120 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M0,10 Q30,2 60,10 T120,10" />
                      <path d="M45,10 C50,6 55,6 60,10 C55,14 50,14 45,10" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-stone-600 mt-1 font-medium font-sans">
                    Specify your occasion and date preferences. We support multiple dates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Occasion Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Select Occasion
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOccasionDropdownOpen(!isOccasionDropdownOpen)}
                      className="w-full flex items-center justify-between border border-stone-200 hover:border-stone-400 bg-white rounded-xl px-5 py-4 shadow-sm transition-all text-left cursor-pointer h-14"
                    >
                      <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 text-[#C29D38] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="9" cy="12" r="4" />
                          <circle cx="15" cy="12" r="4" />
                        </svg>
                        <span className="text-base font-semibold text-stone-800">
                          {orderForm.type || "Select Occasion"}
                        </span>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-stone-400 transition-transform duration-200 shrink-0", isOccasionDropdownOpen ? "transform rotate-90" : "transform rotate-0")} />
                    </button>
                    {isOccasionDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="p-2.5 border-b border-stone-100 flex items-center gap-2 bg-stone-50">
                          <Search size={16} className="text-stone-400 shrink-0" />
                          <input
                            type="text"
                            value={occasionSearchQuery}
                            onChange={(e) => setOccasionSearchQuery(e.target.value)}
                            placeholder="Search occasion..."
                            className="w-full bg-transparent border-none text-sm outline-none text-stone-800"
                            autoFocus
                          />
                          {occasionSearchQuery && (
                            <button onClick={() => setOccasionSearchQuery("")} className="text-stone-400 hover:text-stone-600">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1">
                          {OCCASIONS.filter(o => o.toLowerCase().includes(occasionSearchQuery.toLowerCase())).length > 0 ? (
                            OCCASIONS.filter(o => o.toLowerCase().includes(occasionSearchQuery.toLowerCase())).map((o) => (
                              <button
                                key={o}
                                type="button"
                                onClick={() => {
                                  setOrderForm(prev => ({ ...prev, type: o }));
                                  setIsOccasionDropdownOpen(false);
                                  setOccasionSearchQuery("");
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-[#FAF6EE] text-stone-700 hover:text-[#0F3D2E] transition-all flex items-center justify-between cursor-pointer"
                              >
                                <span>{o}</span>
                                {orderForm.type === o && <Check size={14} className="text-[#0F3D2E]" />}
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-4 text-xs text-stone-400 italic">
                              No occasions found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Dates Selector */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Event Dates
                  </label>
                  <div className="relative z-25">
                    <button 
                      type="button"
                      onClick={() => {
                        console.log("Toggle custom calendar popup:", !isCalendarOpen);
                        setIsCalendarOpen(!isCalendarOpen);
                      }}
                      className="w-full flex items-center gap-3 border border-stone-200 hover:border-stone-400 bg-white rounded-xl px-5 py-4 shadow-sm transition-all cursor-pointer relative z-10 text-left h-14"
                    >
                      <svg className="w-5 h-5 text-[#C29D38] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <div className="flex-1 text-left overflow-hidden">
                        <span className="text-base font-semibold text-stone-800 truncate block">
                          {selectedDates.length > 0 ? selectedDates[0] : "Select Date"}
                        </span>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 text-stone-400 transform transition-transform shrink-0", isCalendarOpen ? "rotate-90" : "rotate-0")} />
                    </button>

                    {/* Background Click dismiss overlay */}
                    {isCalendarOpen && (
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setIsCalendarOpen(false)}
                      />
                    )}

                    {/* Premium Custom Calendar Popover */}
                    {isCalendarOpen && (
                      <div className="absolute left-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl z-40 p-4 w-72 sm:w-80 select-none animate-fade-in">
                        {/* Header: Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            disabled={currentMonth.getFullYear() <= new Date().getFullYear() && currentMonth.getMonth() <= new Date().getMonth()}
                            onClick={() => {
                              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#FAF6EE] text-stone-600 hover:text-[#0F3D2E] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <span className="text-sm font-bold text-[#0F3D2E] font-serif">
                            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#FAF6EE] text-stone-600 hover:text-[#0F3D2E] cursor-pointer transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Weekday Labels Row */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                            <span key={dayName} className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                              {dayName}
                            </span>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {getDaysInMonth(currentMonth).map((date, idx) => {
                            if (!date) {
                              return <div key={`empty-${idx}`} />;
                            }

                            const isSelected = isDateSelected(date);
                            const isPast = isDatePast(date);

                            return (
                              <button
                                key={date.toISOString()}
                                type="button"
                                disabled={isPast}
                                onClick={() => {
                                  toggleCalendarDate(date);
                                }}
                                className={cn(
                                  "h-8 sm:h-9 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer",
                                  isPast 
                                    ? "text-stone-300 cursor-not-allowed opacity-40" 
                                    : isSelected
                                      ? "bg-[#0F3D2E] text-white font-bold shadow-md"
                                      : "text-stone-700 hover:bg-[#FAF6EE] hover:text-[#0F3D2E]"
                                )}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer info/controls */}
                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                          <span className="text-stone-500 font-medium">
                            {selectedDates.length} date{selectedDates.length !== 1 ? "s" : ""} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsCalendarOpen(false)}
                            className="bg-[#0F3D2E]/10 text-[#0F3D2E] px-3 py-1.5 rounded-lg font-bold hover:bg-[#0F3D2E]/20 transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Dates Chips row */}
              {selectedDates.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
                  {selectedDates.map((d) => (
                    <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF2EE] text-[#0F3D2E] text-xs font-bold border border-[#0F3D2E]/10 shadow-sm">
                      {d}
                      <button
                        type="button"
                        onClick={() => removeDate(d)}
                        className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form Section 2: Meal Selection & Timings */}
            <div className="bg-white rounded-3xl border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 sm:p-8 space-y-6 md:bg-transparent md:border-none md:shadow-none md:p-0 pt-2">
              <div className="flex items-start gap-4 border-b border-stone-100 pb-5">
                {/* Rotated gold squares badge */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#C29D38]" fill="currentColor">
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(0 50 50)" />
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(45 50 50)" />
                  </svg>
                  <span className="relative z-10 font-serif text-[17px] font-black text-white">2</span>
                </div>
                
                {/* Title & Subtitle */}
                <div className="flex-1 text-left">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#8C6512] tracking-tight leading-tight">
                      Meal Selection & Timing
                    </h2>
                    <svg className="h-3 w-16 sm:w-24 text-[#C29D38]/50 shrink-0" viewBox="0 0 120 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M0,10 Q30,2 60,10 T120,10" />
                      <path d="M45,10 C50,6 55,6 60,10 C55,14 50,14 45,10" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-stone-600 mt-1 font-medium font-sans">
                    Select which meals will be served. You can specify exact times for each meal.
                  </p>
                </div>
              </div>

              {/* Meal interactive chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Breakfast", "Lunch", "Evening Snacks", "Dinner"].map((meal) => {
                  const isSelected = selectedMeals.includes(meal);
                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const updated = selectedMeals.filter((m) => m !== meal);
                          setSelectedMeals(updated);
                          const updatedTimings = { ...mealTimings };
                          delete updatedTimings[meal];
                          setMealTimings(updatedTimings);
                        } else {
                          setSelectedMeals([...selectedMeals, meal]);
                          const defaultTime = meal === "Breakfast" ? "8 AM onwards" : meal === "Lunch" ? "12 PM onwards" : meal === "Evening Snacks" ? "5 PM onwards" : "8 PM onwards";
                          setMealTimings(prev => ({ ...prev, [meal]: defaultTime }));
                        }
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2.5 px-3 py-4 rounded-xl border transition-all font-bold text-sm cursor-pointer min-h-[48px]",
                        isSelected
                          ? "bg-[#0F3D2E] border-transparent text-white shadow-md shadow-[#0F3D2E]/20"
                          : "bg-white border-stone-200 hover:border-stone-300 text-stone-700"
                      )}
                    >
                      {meal === "Breakfast" && <Coffee size={16} className="shrink-0" />}
                      {meal === "Lunch" && <Utensils size={16} className="shrink-0" />}
                      {meal === "Evening Snacks" && <Pizza size={16} className="shrink-0" />}
                      {meal === "Dinner" && <Soup size={16} className="shrink-0" />}
                      <span>{meal}</span>
                      {isSelected && <Check size={12} className="ml-1 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Meal Timings options inside custom container */}
              {selectedMeals.length > 0 && (
                <div className="space-y-5 bg-[#FAF8F5] border border-stone-200/40 rounded-2xl p-4 sm:p-5 animate-fade-in">
                  {selectedMeals.map((meal) => (
                    <div key={meal} className="space-y-3">
                      <label className="block text-sm font-semibold text-[#0F3D2E] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <svg className="w-5 h-5 text-[#C29D38] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {meal} Ready-By Time
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {MEAL_TIME_OPTIONS[meal]?.map((time) => {
                          const isTimeSelected = mealTimings[meal] === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setMealTimings(prev => ({ ...prev, [meal]: time }))}
                              className={cn(
                                "px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px]",
                                isTimeSelected
                                  ? "bg-[#0F3D2E] border-transparent text-white shadow-sm"
                                  : "bg-white border-stone-200 hover:border-stone-300 text-stone-600"
                              )}
                            >
                              {time}
                              {isTimeSelected && <Check size={12} className="inline ml-1.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Section 3: Guest Count */}
            <div className="bg-white rounded-3xl border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 sm:p-8 space-y-6 md:bg-transparent md:border-none md:shadow-none md:p-0 pt-2">
              <div className="flex items-start gap-4 border-b border-stone-100 pb-5">
                {/* Rotated gold squares badge */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#C29D38]" fill="currentColor">
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(0 50 50)" />
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(45 50 50)" />
                  </svg>
                  <span className="relative z-10 font-serif text-[17px] font-black text-white">3</span>
                </div>
                
                {/* Title & Subtitle */}
                <div className="flex-1 text-left">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#8C6512] tracking-tight leading-tight">
                      Guest Count
                    </h2>
                    <svg className="h-3 w-16 sm:w-24 text-[#C29D38]/50 shrink-0" viewBox="0 0 120 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M0,10 Q30,2 60,10 T120,10" />
                      <path d="M45,10 C50,6 55,6 60,10 C55,14 50,14 45,10" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-stone-600 mt-1 font-medium font-sans">
                    Adjust your total guests. Prices adapt based on dynamic volume slabs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-stone-50/50 border border-stone-200/50 rounded-2xl p-2 w-full max-w-sm select-none shadow-sm">
                <button
                  type="button"
                  onClick={() => setGuests(Math.max(selectedPackage?.minimumGuests || 50, guests - 10))}
                  className="w-14 h-14 flex items-center justify-center bg-white border border-stone-200 hover:border-stone-400 rounded-xl text-[#0F3D2E] hover:bg-stone-50 transition-all font-black shadow-sm cursor-pointer shrink-0 active:scale-95"
                >
                  <Minus size={18} strokeWidth={2.5} />
                </button>
                <div className="flex-1 text-center flex flex-col justify-center">
                  <span className="font-serif text-2xl font-black text-stone-800 leading-none">
                    {guests}
                  </span>
                  <span className="text-[11px] text-stone-500 uppercase tracking-widest font-sans font-bold mt-1">
                    Guests
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGuests(guests + 10)}
                  className="w-14 h-14 flex items-center justify-center bg-white border border-stone-200 hover:border-stone-400 rounded-xl text-[#0F3D2E] hover:bg-stone-50 transition-all font-black shadow-sm cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0F3D2E] mt-3 bg-[#EAF2EE]/50 border border-[#D4E4DC] rounded-xl p-3.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0F3D2E] text-white text-xs font-serif font-black select-none shrink-0">i</span>
                <span>Min. guests required for {selectedPackage?.packageName || "this package"} is <span className="font-bold text-[#0F3D2E]">{selectedPackage?.minimumGuests || 50}</span>.</span>
              </div>
            </div>

            {/* Form Section 4: Venue Location & Type */}
            <div className="bg-white rounded-3xl border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 sm:p-8 space-y-6 md:bg-transparent md:border-none md:shadow-none md:p-0 pt-2">
              <div className="flex items-start gap-4 border-b border-stone-100 pb-5">
                {/* Rotated gold squares badge */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#C29D38]" fill="currentColor">
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(0 50 50)" />
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(45 50 50)" />
                  </svg>
                  <span className="relative z-10 font-serif text-[17px] font-black text-white">4</span>
                </div>
                
                {/* Title & Subtitle */}
                <div className="flex-1 text-left">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#8C6512] tracking-tight leading-tight">
                      Venue Details
                    </h2>
                    <svg className="h-3 w-16 sm:w-24 text-[#C29D38]/50 shrink-0" viewBox="0 0 120 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M0,10 Q30,2 60,10 T120,10" />
                      <path d="M45,10 C50,6 55,6 60,10 C55,14 50,14 45,10" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-stone-600 mt-1 font-medium font-sans">
                    Tell us where the feast takes place.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Kondapur, Taj Krishna, or Residence"
                    className="w-full border border-stone-200 hover:border-stone-400 rounded-xl px-5 py-4 text-base focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none transition-all placeholder:text-stone-400 bg-white h-14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Google Map Location (Optional)
                  </label>
                  <AddressAutocomplete
                    useTextarea={false}
                    value={mapLocation}
                    onChange={(val) => setMapLocation(val)}
                    onSelect={(data) => {
                      setVenueLat(data.latitude);
                      setVenueLng(data.longitude);
                      setOrderForm({ ...orderForm, venue: data.address });
                      if (data.address) {
                        const parts = data.address.split(",");
                        if (parts.length > 0 && parts[0].trim()) {
                           setVenueName(parts[0].trim());
                        }
                      }
                      setMapLocation(data.address);
                    }}
                    placeholder="Type location or paste link..."
                    theme="green"
                    leftIcon={<MapPin className="text-[#0F3D2E] w-4 h-4 hover:text-[#1F5C46] transition-colors" />}
                    onIconClick={() => setIsVenueMapOpen(true)}
                    className="w-full border border-stone-200 hover:border-stone-400 rounded-xl py-4 text-base focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none transition-all placeholder:text-stone-400 bg-white h-14"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 mb-1.5">
                    <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide">
                      Venue Address
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="text-xs font-bold text-[#0F3D2E]/80 hover:text-[#0F3D2E] hover:underline transition flex items-center gap-0.5 cursor-pointer"
                      >
                        📍 Use Current Location
                      </button>
                      <span className="text-stone-300 text-xs hidden sm:inline">|</span>
                      <button
                        type="button"
                        onClick={() => setIsVenueMapOpen(true)}
                        className="text-xs font-bold text-[#0F3D2E] hover:underline transition flex items-center gap-0.5 cursor-pointer"
                      >
                        🗺️ Select Event Location
                      </button>
                    </div>
                  </div>
                  <AddressAutocomplete
                    useTextarea={true}
                    rows={2}
                    value={orderForm.venue}
                    onChange={(val) => setOrderForm({ ...orderForm, venue: val })}
                    onSelect={(data) => {
                      setVenueLat(data.latitude);
                      setVenueLng(data.longitude);
                      setOrderForm({ ...orderForm, venue: data.address });
                      if (data.address) {
                        const parts = data.address.split(",");
                        if (parts.length > 0 && parts[0].trim()) {
                          setVenueName(parts[0].trim());
                        }
                      }
                      setMapLocation(data.address);
                    }}
                    placeholder="Enter Street Address, Hall No, Landmark in Hyderabad..."
                    theme="green"
                    leftIcon={<MapPin className="text-[#0F3D2E] w-4 h-4 hover:text-[#1F5C46] transition-colors" />}
                    onIconClick={() => setIsVenueMapOpen(true)}
                    className="w-full border border-stone-200 hover:border-stone-400 rounded-xl px-5 py-4 text-base focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none transition-all placeholder:text-stone-400 bg-white"
                  />
                  <MapPickerModal
                    isOpen={isVenueMapOpen}
                    onClose={() => setIsVenueMapOpen(false)}
                    initialLat={venueLat}
                    initialLng={venueLng}
                    initialAddress={orderForm.venue}
                    onSave={(data) => {
                      setVenueLat(data.latitude);
                      setVenueLng(data.longitude);
                      setOrderForm({ ...orderForm, venue: data.address });
                      if (data.address) {
                        const parts = data.address.split(",");
                        if (parts.length > 0 && parts[0].trim()) {
                          setVenueName(parts[0].trim());
                        }
                      }
                      setMapLocation(data.address);
                    }}
                    title="Select Event Location"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Venue Type
                  </label>
                  <div className="grid grid-cols-2 gap-3 h-auto sm:h-[86px] items-center">
                    <button
                      type="button"
                      onClick={() => setVenueType("Indoor")}
                      className={cn(
                        "h-14 flex items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all cursor-pointer",
                        venueType === "Indoor"
                          ? "bg-[#0F3D2E] border-transparent text-white shadow-md shadow-[#0F3D2E]/15"
                          : "bg-white border-stone-200 hover:border-stone-300 text-stone-700"
                      )}
                    >
                      Indoor Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setVenueType("Outdoor")}
                      className={cn(
                        "h-14 flex items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all cursor-pointer",
                        venueType === "Outdoor"
                          ? "bg-[#0F3D2E] border-transparent text-white shadow-md shadow-[#0F3D2E]/15"
                          : "bg-white border-stone-200 hover:border-stone-300 text-stone-700"
                      )}
                    >
                      Outdoor Event
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section 5: Special Instructions */}
            <div className="bg-white rounded-3xl border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 sm:p-8 space-y-6 md:bg-transparent md:border-none md:shadow-none md:p-0 pt-2">
              <div className="flex items-start gap-4 border-b border-stone-100 pb-5">
                {/* Rotated gold squares badge */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#C29D38]" fill="currentColor">
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(0 50 50)" />
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(45 50 50)" />
                  </svg>
                  <span className="relative z-10 font-serif text-[17px] font-black text-white">5</span>
                </div>
                
                {/* Title & Subtitle */}
                <div className="flex-1 text-left">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#8C6512] tracking-tight leading-tight">
                      Special Instructions
                    </h2>
                    <svg className="h-3 w-16 sm:w-24 text-[#C29D38]/50 shrink-0" viewBox="0 0 120 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M0,10 Q30,2 60,10 T120,10" />
                      <path d="M45,10 C50,6 55,6 60,10 C55,14 50,14 45,10" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-stone-600 mt-1 font-medium font-sans">
                    Specify dietary needs, spices, or separate serving request tag filters.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={250}
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    placeholder="Any special requests, preferences or notes for the chef..."
                    className="w-full border border-stone-200 hover:border-stone-400 rounded-xl px-5 py-4 text-base focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none transition-all pr-12 placeholder:text-stone-400 bg-white"
                  ></textarea>
                  <span className="absolute bottom-3 right-4 text-[11px] font-bold font-mono text-stone-400">
                    {orderForm.notes.length}/250
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 select-none">
                  {["No Onion", "Jain Food", "Less Spice", "Kids Menu", "Separate Serving"].map((tag) => {
                    const isTagSelected = orderForm.notes.toLowerCase().includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = orderForm.notes.trim();
                          const normalizedTag = tag.toLowerCase();
                          
                          if (current.toLowerCase().includes(normalizedTag)) {
                            // Simple removal logic
                            const regex = new RegExp(`(,\\s*)?${tag}|${tag}(,\\s*)?`, 'gi');
                            let cleaned = current.replace(regex, '').trim();
                            if (cleaned.startsWith(",")) cleaned = cleaned.substring(1).trim();
                            if (cleaned.endsWith(",")) cleaned = cleaned.substring(0, cleaned.length - 1).trim();
                            setOrderForm({ ...orderForm, notes: cleaned });
                          } else {
                            const separator = current ? ", " : "";
                            setOrderForm({ ...orderForm, notes: `${current}${separator}${tag}` });
                          }
                        }}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all border cursor-pointer min-h-[36px] flex items-center justify-center",
                          isTagSelected
                            ? "bg-[#EAF2EE] border-[#0F3D2E]/20 text-[#0F3D2E]"
                            : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                        )}
                      >
                        {isTagSelected ? `× ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form Section 6: Contact Information */}
            <div className="bg-white rounded-3xl border border-stone-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 sm:p-8 space-y-6 md:bg-transparent md:border-none md:shadow-none md:p-0 pt-2">
              <div className="flex items-start gap-4 border-b border-stone-100 pb-5">
                {/* Rotated gold squares badge */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#C29D38]" fill="currentColor">
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(0 50 50)" />
                    <rect x="18" y="18" width="64" height="64" rx="10" transform="rotate(45 50 50)" />
                  </svg>
                  <span className="relative z-10 font-serif text-[17px] font-black text-white">6</span>
                </div>
                
                {/* Title & Subtitle */}
                <div className="flex-1 text-left">
                  <div className="flex items-center flex-wrap gap-2">
                    <h2 className="text-2xl sm:text-3xl font-serif font-extrabold text-[#8C6512] tracking-tight leading-tight">
                      Contact Information
                    </h2>
                    <svg className="h-3 w-16 sm:w-24 text-[#C29D38]/50 shrink-0" viewBox="0 0 120 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M0,10 Q30,2 60,10 T120,10" />
                      <path d="M45,10 C50,6 55,6 60,10 C55,14 50,14 45,10" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-stone-600 mt-1 font-medium font-sans">
                    How can we contact you regarding customization?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.name}
                    onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                    placeholder="e.g. Himaja"
                    className="w-full border border-stone-200 hover:border-stone-400 rounded-xl px-5 py-4 text-base focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none transition-all placeholder:text-stone-400 bg-white h-14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                    placeholder="e.g. 9180121-281-2"
                    className="w-full border border-stone-200 hover:border-stone-400 rounded-xl px-5 py-4 text-base focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none transition-all placeholder:text-stone-400 bg-white h-14"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-stone-700 font-sans tracking-wide mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={orderForm.email || ""}
                    onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                    placeholder="e.g. himaja@example.com"
                    className="w-full border border-stone-200 hover:border-stone-400 rounded-xl px-5 py-4 text-base focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] outline-none transition-all placeholder:text-stone-400 bg-white h-14"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary Card */}
          <div className="w-full lg:w-[420px] shrink-0 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-stone-200/60 p-6 sm:p-8 shadow-[0_8px_30px_rgba(15,61,46,0.03)] text-left space-y-6">
              
              <div>
                <h3 className="font-serif text-[24px] font-bold text-[#8C6512] text-center">
                  Order Summary
                </h3>
                
                {/* Gold Center Swirl Divider */}
                <div className="flex items-center justify-center gap-3 my-3">
                  <div className="h-[1px] bg-[#D4AF37]/30 flex-1"></div>
                  <svg className="w-8 h-4 text-[#C29D38]" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10,10 Q20,3 30,10 T40,10" />
                    <circle cx="20" cy="10" r="3" fill="currentColor" />
                  </svg>
                  <div className="h-[1px] bg-[#D4AF37]/30 flex-1"></div>
                </div>
              </div>

              {/* Package Metadata */}
              <div className="space-y-4">
                <div className="flex justify-between items-start text-sm">
                  <span className="text-stone-500 font-semibold font-sans">Selected Package</span>
                  <div className="text-right">
                    <span className="font-serif font-black text-stone-900 block text-[15px] leading-tight">
                      {selectedPackage?.packageName}
                    </span>
                    <span className="text-[10px] text-[#B8860B] font-black uppercase tracking-wider block mt-1">
                      {selectedPackage?.vegNonVeg || "Catering Package"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500 font-semibold font-sans">Selected Menu</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900">
                      {Object.keys(selectedItems).filter((k) => selectedItems[k]).length} Items
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMode("custom")}
                      className="text-xs text-[#8C6512] hover:text-[#0F3D2E] font-black underline cursor-pointer hover:bg-[#FAF6EE] px-2 py-1 rounded-lg transition-colors"
                    >
                      Edit Menu
                    </button>
                  </div>
                </div>

                {selectedMeals.length > 0 && (
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-stone-500 font-semibold font-sans">Meals Included</span>
                    <span className="font-bold text-stone-900 text-right max-w-[200px] leading-snug">
                      {selectedMeals.join(", ")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500 font-semibold font-sans">Guests Sizing</span>
                  <span className="font-black text-stone-900">
                    {guests} Guests
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500 font-semibold font-sans">Est. Price per Plate</span>
                  <span className="font-black text-stone-900">
                    ₹{currentPerPlatePrice}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-stone-200 my-4"></div>

              {/* Platform Fee & Coupons */}
              <div className="bg-[#FAF8F5] border border-stone-200/40 rounded-2xl p-4.5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone-500 font-semibold font-sans flex items-center gap-1">
                    Platform Fee
                    <span className="text-[10px] text-stone-400 font-normal">
                      (₹{platformFeePerPlate}/plate)
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-black text-stone-900",
                      appliedCoupon === "NEW"
                        ? "text-stone-400 line-through"
                        : "text-stone-900"
                    )}
                  >
                    ₹{(guests * platformFeePerPlate).toLocaleString()}
                  </span>
                </div>

                {appliedCoupon !== "NEW" ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon Code? (Try 'NEW')"
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0F3D2E] uppercase font-bold text-stone-800 h-12"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (couponCode === "NEW") {
                          setAppliedCoupon("NEW");
                          toast("Welcome Offer Applied!", "success");
                        } else {
                          toast("Invalid coupon code", "error");
                        }
                      }}
                      className="bg-[#0F3D2E] hover:bg-[#0B2F22] text-white px-5 py-3 rounded-xl text-sm font-black transition-colors cursor-pointer shrink-0 h-12 flex items-center justify-center"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs text-green-800 bg-green-50 border border-green-100 px-3 py-2.5 rounded-xl">
                      <span className="font-bold flex items-center gap-1.5">
                        <Check size={14} className="text-green-600 shrink-0" />
                        Code 'NEW' Applied
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-black">
                          -₹{(guests * platformFeePerPlate).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon("");
                            setCouponCode("");
                          }}
                          className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs sm:text-sm pt-3 border-t border-stone-200/50">
                  <span className="text-stone-600 font-bold">
                    Payable Platform Fee
                  </span>
                  <span className="font-black text-[#0F3D2E]">
                    ₹
                    {appliedCoupon === "NEW"
                      ? "0"
                      : (guests * platformFeePerPlate).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Total Summary Block */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-end">
                  <span className="font-serif text-[18px] sm:text-[20px] font-bold text-[#8C6512] pb-0.5">
                    Total Estimate
                  </span>
                  <div className="text-right">
                    <span className="font-serif text-3xl sm:text-4xl font-black text-[#0F3D2E] tracking-tight block">
                      ₹
                      {(
                        currentPerPlatePrice * guests +
                        (appliedCoupon === "NEW" ? 0 : guests * platformFeePerPlate)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] sm:text-xs text-stone-500 uppercase tracking-widest font-black pt-1">
                  <span>Inclusive of taxes</span>
                  <span>(No hidden charges)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log("[TRACE_LOG #1] Confirm Booking button clicked (isQuote = false)");
                    handleBooking(false);
                  }}
                  className="w-full bg-[#0F3D2E] hover:bg-[#0B2F22] text-white py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0F3D2E]/10 select-none text-base min-h-[52px]"
                >
                  Confirm Booking
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log("[TRACE_LOG #1] Request Quote button clicked (isQuote = true)");
                    handleBooking(true);
                  }}
                  className="w-full bg-white border border-[#C29D38] hover:bg-stone-50 text-[#8C6512] py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none text-base min-h-[52px]"
                >
                  Request Quote
                </button>
              </div>

              {/* Security Shield Callout */}
              <p className="text-center text-[10px] text-stone-400 mt-2 uppercase tracking-widest font-black flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-[#0F3D2E]" />
                No payment required today • Failsafe Lock
              </p>

            </div>
          </div>

          {/* Mobile Sticky Booking Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200/60 px-4 py-3.5 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4 animate-slide-up">
            <div className="text-left">
              <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block leading-none mb-1">Total Estimate</span>
              <span className="font-serif text-lg font-black text-[#0F3D2E]">
                ₹{(currentPerPlatePrice * guests + (appliedCoupon === "NEW" ? 0 : guests * platformFeePerPlate)).toLocaleString("en-IN")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                console.log("[TRACE_LOG #1] Confirm Booking via Sticky Mobile clicked");
                handleBooking(false);
              }}
              className="px-5 py-3 bg-[#0F3D2E] hover:bg-[#0B2F22] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md select-none flex-1 max-w-[200px] text-center min-h-[48px] flex items-center justify-center active:scale-95 transition-transform"
            >
              Confirm Booking
            </button>
          </div>

        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative shadow-2xl">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 relative text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors flex items-center justify-center"
            >
              <X size={18} />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-gold-50 text-brand-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} />
              </div>
              <h3 className="text-2xl font-bold font-display text-slate-900 mb-2">
                Login Required
              </h3>
              <p className="text-slate-500 text-sm mb-8">
                Please login to continue your{" "}
                {pendingAction ? "quote request" : "booking"}. Your progress
                will be saved.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleProceedToLogin}
                  className="w-full bg-brand-green-900 text-white font-bold py-3.5 rounded-xl hover:bg-brand-green-800 transition-colors shadow-md"
                >
                  Login to Continue
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full bg-white text-slate-600 font-bold py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
