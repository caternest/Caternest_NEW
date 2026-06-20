import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  Search, Plus, Minus, ArrowLeft, Check, ChevronRight, ChefHat, 
  Package, X, User, MapPin, Users, Star, 
  Sparkles, Flame, Coffee, IceCream, Pizza, Soup, Utensils,
  Award, ShieldCheck, Truck, Smile
} from 'lucide-react';
import { DEMO_CATERERS } from '../data';
import { toast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { storeNotification } from '../lib/orderUtils';

const getCategoryIcon = (categoryName: string) => {
  const norm = categoryName.toLowerCase();
  if (norm.includes('starter') || norm.includes('appetizer')) {
    return <Sparkles size={18} />;
  }
  if (norm.includes('bread') || norm.includes('roti') || norm.includes('naan') || norm.includes('rumali')) {
    return <Coffee size={18} />;
  }
  if (norm.includes('sweet') || norm.includes('dessert')) {
    return <Award size={18} />;
  }
  if (norm.includes('biryani') || norm.includes('rice') || norm.includes('pulao')) {
    return <Soup size={18} />;
  }
  if (norm.includes('curry') || norm.includes('gravy') || norm.includes('sabji')) {
    return <Utensils size={18} />;
  }
  if (norm.includes('fry') || norm.includes('dry')) {
    return <Flame size={18} />;
  }
  if (norm.includes('ice cream')) {
    return <IceCream size={18} />;
  }
  return <Pizza size={18} />;
};

const getFoodImage = (itemName: string) => {
  const name = itemName.toLowerCase();
  
  if (name.includes('spring roll')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('gobi 65') || name.includes('gobi') || name.includes('cauliflower')) {
    return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('manchurian')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('nugget')) {
    return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('gold coin') || name.includes('coin')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('samosa')) {
    return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('bajji') || name.includes('bhaji') || name.includes('pakora') || name.includes('fritter')) {
    return 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('paneer') && (name.includes('tikka') || name.includes('kabab'))) {
    return 'https://images.unsplash.com/photo-1567184109411-47a7a3746aed?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('paneer') && (name.includes('butter') || name.includes('masala') || name.includes('curry'))) {
    return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('chicken') && name.includes('65')) {
    return 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('chicken') || name.includes('mutton') || name.includes('fish') || name.includes('prawn')) {
    return 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('roti') || name.includes('naan') || name.includes('bread') || name.includes('paratha') || name.includes('kulcha')) {
    return 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('biryani') || name.includes('pulao') || name.includes('rice') || name.includes('fried rice')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('dal') || name.includes('dall') || name.includes('tadka') || name.includes('makhani')) {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('sweet') || name.includes('gulab') || name.includes('jamun') || name.includes('halwa') || name.includes('kheer')) {
    return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('ice cream') || name.includes('kulfi')) {
    return 'https://images.unsplash.com/photo-1501443712940-3decff3f6d90?w=450&auto=format&fit=crop&q=80';
  }
  if (name.includes('curry') || name.includes('masala') || name.includes('kofta') || name.includes('korma')) {
     return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=450&auto=format&fit=crop&q=80';
  }
  
  const placeholders = [
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=450&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=450&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=450&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=450&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=450&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=450&auto=format&fit=crop&q=80'
  ];
  const charSum = itemName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return placeholders[Math.abs(charSum) % placeholders.length];
};

const getFoodDescription = (itemName: string): string => {
  const name = itemName.toLowerCase().trim();
  
  if (name.includes('paneer butter masala')) {
    return 'Fresh cottage cheese cubes cooked in creamy tomato gravy.';
  }
  if (name.includes('chicken 65')) {
    return 'Spicy South Indian fried chicken appetizer.';
  }
  if (name.includes('paneer') && name.includes('tikka')) {
    return 'Delectable cottage cheese chunks marinated in spiced yogurt and grilled to golden perfection.';
  }
  if (name.includes('paneer')) {
    return 'Fresh cottage cheese cubes cooked in rich tomato and butter-infused legacy gravy.';
  }
  if (name.includes('chicken') && (name.includes('tikka') || name.includes('tandoori') || name.includes('kebab') || name.includes('kabab'))) {
    return 'Tender juicy chicken chunks cooked in traditional clay oven with secret blends of spices.';
  }
  if (name.includes('chicken') && (name.includes('masala') || name.includes('butter') || name.includes('curry') || name.includes('gravy'))) {
    return 'Homestyle juicy chicken pieces slow-cooked in a rich spiced traditional curry mixture.';
  }
  if (name.includes('chicken')) {
    return 'Crispy seasoned chicken preparation garnished with chopped herbs and fresh curry leaves.';
  }
  if (name.includes('gobi') || name.includes('cauliflower')) {
    return 'Fresh cauliflower florets seasoned with handpicked spices and cooked crispy.';
  }
  if (name.includes('manchurian')) {
    return 'Crispy savory fritters tossed in classic sweet, sour, and mildly spicy Indo-Chinese sauce.';
  }
  if (name.includes('spring roll')) {
    return 'Golden crispy wrappers stuffed with seasoned julienned fresh farm vegetables.';
  }
  if (name.includes('samosa')) {
    return 'Crispy golden pastry triangles shell filled with spiced peas and mashed potatoes.';
  }
  if (name.includes('biryani')) {
    return 'Fragrant basmati rice layered with rich herbs, saffron, and slow-cooked in traditional style.';
  }
  if (name.includes('pulao') || name.includes('fried rice')) {
    return 'Aromatic long-grain basmati rice tossed with fresh garden vegetables and mild spices.';
  }
  if (name.includes('rice') || name.includes('jeera')) {
    return 'Steaming aromatic basmati rice tossed with roasted cumin seeds and fresh herbs.';
  }
  if (name.includes('dal') || name.includes('tadka') || name.includes('makhani')) {
    return 'Slow-cooked lentils with fresh cream, melted butter, and tempered with cumin and garlic.';
  }
  if (name.includes('roti') || name.includes('naan') || name.includes('paratha') || name.includes('kulcha') || name.includes('bread')) {
    return 'Freshly baked traditional flatbread prepared in a hot tandoor clay oven.';
  }
  if (name.includes('jamun') || name.includes('gulab')) {
    return 'Golden fried milk-solid dumplings soaked in aromatic rose and cardamom flavored sugar syrup.';
  }
  if (name.includes('halwa')) {
    return 'Warm premium traditional dessert cooked slow with ghee, milk solids, and dry fruits.';
  }
  if (name.includes('ice cream') || name.includes('kulfi')) {
    return 'Rich, creamy frozen dessert churned with authentic culinary flavors and sweet delight.';
  }
  if (name.includes('fruit') || name.includes('salad')) {
    return 'Assortment of fresh seasonal garden fruits dressed with dynamic light sweet syrups.';
  }
  if (name.includes('soup') || name.includes('shorba')) {
    return 'Warm comforting seasoned broth infused with fine herbs and aromatic local spices.';
  }
  if (name.includes('dry') || name.includes('fry')) {
    return 'Roasted to perfection in a traditional hot wok with authentic Indian spices.';
  }
  
  const genericDescriptions = [
    'Traditional chef special preparation crafted with handpicked high-quality local ingredients.',
    'Carefully crafted culinary highlight seasoned with authentic fresh herbs and house spices.',
    'A delicious classic preparation designed to delight your senses with every single bite.',
    'Perfectly balanced premium recipe slow-cooked to lock in rich authentic textures and flavor.'
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
  return name.includes('biryani') || 
         name.includes('mutton') || 
         name.includes('fish') || 
         name.includes('prawn') || 
         name.includes('royal') || 
         name.includes('deluxe') || 
         name.includes('premium') || 
         name.includes('tikka') || 
         name.includes('kabab') || 
         name.includes('kebab') || 
         name.includes('special') || 
         name.includes('butter') ||
         name.includes('paneer') ||
         name.includes('tandoori');
};

const isItemNonVeg = (itemName: string, categoryName: string = ''): boolean => {
  const name = itemName.toLowerCase().trim();
  const cat = categoryName.toLowerCase().trim();
  if (cat.includes('non-veg') || cat.includes('non veg') || cat.includes('mutton') || cat.includes('chicken') || cat.includes('fish') || cat.includes('egg')) {
    return true;
  }
  return name.includes('chicken') || 
         name.includes('mutton') || 
         name.includes('fish') || 
         name.includes('prawn') || 
         name.includes('egg') || 
         (name.includes('kebab') && !name.includes('veg') && !name.includes('paneer') && !name.includes('gobi') && !name.includes('hara bhara'));
};

const getFallbackPackage = (pkgId: string, startingPrice: number) => {
    const basePrice = startingPrice || 350;
    
    // Veg categories
    const vegCategories = [
        {
            categoryName: "Welcome Drinks",
            selectionRule: "Select Any 1 Item",
            items: ["Fresh Lime Soda", "Guava Punch", "Virgin Mojito", "Sweet Lassi"]
        },
        {
            categoryName: "Starters (Veg)",
            selectionRule: "Select Any 2 Items",
            items: ["Paneer Tikka", "Gobi 65", "Veg Spring Roll", "Veg Samosa", "Crispy Corn"]
        },
        {
            categoryName: "Main Course (Paneer)",
            selectionRule: "Select Any 1 Item",
            items: ["Paneer Butter Masala", "Kadhai Paneer", "Shahi Paneer"]
        },
        {
            categoryName: "Main Course (Veg)",
            selectionRule: "Select Any 2 Items",
            items: ["Dal Makhani", "Mixed Veg Curry", "Veg Diwani Handi", "Aloo Gobi Fry"]
        },
        {
            categoryName: "Breads & Rice",
            selectionRule: "Select Any 3 Items",
            items: ["Butter Naan", "Tandoori Roti", "Rumali Roti", "Veg Biryani", "Jeera Rice", "Steamed Rice"]
        },
        {
            categoryName: "Sweets & Desserts",
            selectionRule: "Select Any 2 Items",
            items: ["Gulab Jamun with Ice Cream", "Double Ka Meetha", "Gajar Ka Halwa", "Vanilla Ice Cream"]
        }
    ];

    // Non-veg categories
    const nonVegCategories = [
        {
            categoryName: "Welcome Drinks",
            selectionRule: "Select Any 1 Item",
            items: ["Fresh Lime Soda", "Blue Lagoon Cooler", "Watermelon Mojito", "Masala Cola"]
        },
        {
            categoryName: "Starters (Veg)",
            selectionRule: "Select Any 2 Items",
            items: ["Paneer Tikka", "Gobi 65", "Crispy Corn Fry", "Veg Gold Coin"]
        },
        {
            categoryName: "Starters (Non-Veg)",
            selectionRule: "Select Any 2 Items",
            items: ["Chicken 65", "Chicken Tikka Kebab", "Fish Fingers", "Tandoori Chicken"]
        },
        {
            categoryName: "Main Course (Meat)",
            selectionRule: "Select Any 2 Items",
            items: ["Hyderabad Mutton Curry", "Butter Chicken Masala", "Andhra Fish Curry", "Chicken Kadai"]
        },
        {
            categoryName: "Main Course (Veg)",
            selectionRule: "Select Any 2 Items",
            items: ["Dal Makhani", "Paneer Butter Masala", "Mixed Veg Kurma"]
        },
        {
            categoryName: "Breads & Rice",
            selectionRule: "Select Any 3 Items",
            items: ["Butter Naan", "Tandoori Roti", "Rumali Roti", "Special Hyderabadi Chicken Biryani", "Mutton Dum Biryani", "Jeera Rice"]
        },
        {
            categoryName: "Sweets & Desserts",
            selectionRule: "Select Any 2 Items",
            items: ["Gulab Jamun with Ice Cream", "Qubani Ka Meetha", "Double Ka Meetha", "Vanilla Ice Cream", "Mango Kulfi"]
        }
    ];

    const fallbacks: Record<string, any> = {
        'v_silver': {
             id: 'v_silver',
             packageName: 'Silver Package',
             packageType: 'Veg',
             pricePerPlate: basePrice,
             minimumGuests: 100,
             categories: vegCategories.slice(0, 4),
             description: 'Simple & elegant vegetarian spread for family gatherings.'
        },
        'v_gold': {
             id: 'v_gold',
             packageName: 'Gold Package',
             packageType: 'Veg',
             pricePerPlate: basePrice + 100,
             minimumGuests: 150,
             categories: vegCategories.slice(0, 5),
             description: 'Slightly richer premium veg spread with extra paneer delicacies.'
        },
        'v_platinum': {
             id: 'v_platinum',
             packageName: 'Platinum Package',
             packageType: 'Veg',
             pricePerPlate: basePrice + 250,
             minimumGuests: 200,
             categories: vegCategories,
             description: 'Ultra luxury premium veg spread for signature events.'
        },
        'nv_premium': {
             id: 'nv_premium',
             packageName: 'Premium Package',
             packageType: 'Non-veg',
             pricePerPlate: basePrice + 450,
             minimumGuests: 150,
             categories: nonVegCategories.slice(0, 5),
             description: 'Classic non-veg catering with double choice meat courses.'
        },
        'nv_royal': {
             id: 'nv_royal',
             packageName: 'Royal Package',
             packageType: 'Non-veg',
             pricePerPlate: basePrice + 750,
             minimumGuests: 200,
             categories: nonVegCategories.slice(0, 6),
             description: 'Exquisite regal non-veg banquet for elite wedding celebrations.'
        },
        'nv_grand': {
             id: 'nv_grand',
             packageName: 'Grand Royal',
             packageType: 'Non-veg',
             pricePerPlate: basePrice + 1150,
             minimumGuests: 250,
             categories: nonVegCategories,
             description: 'The ultimate royal banquet with exotic seafood, mutton, and dessert options.'
        }
    };

    return fallbacks[pkgId] || null;
};

const VegHeaderIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22C12 22 12 14 16 11C18 9.5 20 9.5 21 10.5C22 11.5 21 13.5 19.5 15.5C16.5 19.5 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 22C12 22 12 14 8 11C6 9.5 4 9.5 3 10.5C2 11.5 3 13.5 4.5 15.5C7.5 19.5 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15V3" strokeLinecap="round" />
        <path d="M12 11C13.5 9 15.5 8.5 17 9.5" strokeLinecap="round" />
        <path d="M12 9C10.5 7 8.5 6.5 7 7.5" strokeLinecap="round" />
    </svg>
);

const NonVegHeaderIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 16c2.5-2.5 2.5-6.5 0-9-1.5-1.5-4-1.5-5.5 0-2 2-2.5 5.5-5.5 8.5a1.5 1.5 0 0 0 0 2.1c1.5 1.5 4.5 1 6.5-1 1-1 3-1.5 4.5-0.6Z" />
        <path d="M5 19c-.5-.5-1-.2-1.5-.7a1.5 1.5 0 0 1 0-2.1c.5-.5.7-1 1.2-1.5" />
        <path d="M18.5 5.5A2.5 2.5 0 1 0 15 2c0 .5-.5 1-1 1" />
    </svg>
);

const DynamicCateringIcon = ({ packageType = "", className = "w-8 h-8" }: { packageType?: string, className?: string }) => {
    const lower = packageType.toLowerCase();
    const isVeg = lower.includes('veg') && !lower.includes('non');
    const isNonVeg = lower.includes('non-veg') || lower.includes('non veg') || lower.includes('nonveg');
    const isMixed = lower.includes('both') || lower.includes('+') || lower.includes('&') || lower.includes('allow') || (!isVeg && !isNonVeg);

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

const CrownIcon = ({ tier = "gold", className = "w-10 h-10" }: { tier?: 'bronze' | 'silver' | 'gold', className?: string }) => {
    let color = "#D4AF37"; // gold
    if (tier === 'silver') color = "#A0A0A0";
    else if (tier === 'bronze') color = "#CD7F32";
    
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2.5 19h19a.5.5 0 0 0 .5-.5V12l-4.5 4.5L12 6.5 6.5 16.5 2 12v6.5a.5.5 0 0 0 .5.5Z" fill={color} stroke={color} fillOpacity="0.15" />
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
    if (name.includes('platinum') || name.includes('diamond') || name.includes('royal')) return 'gold';
    if (name.includes('gold') || name.includes('classic') || idx === 1) return 'gold';
    if (name.includes('silver') || idx === 2) return 'silver';
    return 'bronze'; // basic / others
};

const renderVegNonVegBadge = (packageType: string = "") => {
    const lower = packageType.toLowerCase();
    let isVeg = true;
    let isNonVeg = false;
    
    if (lower.includes('non-veg') || lower.includes('non veg') || lower.includes('nonveg')) {
        if (lower.includes('both') || lower.includes('allow') || lower.includes('+') || lower.includes('&')) {
            isVeg = true;
            isNonVeg = true;
        } else {
            isVeg = false;
            isNonVeg = true;
        }
    } else if (lower.includes('both') || lower.includes('+') || lower.includes('&') || lower.includes('mixed')) {
        isVeg = true;
        isNonVeg = true;
    } else if (lower.includes('veg')) {
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

export default function OrderFlow() {
  const { id } = useParams();
  const { user } = useAuth();
  const [caterer, setCaterer] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<boolean | null>(null); // true = quote, false = booking
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [foodImages, setFoodImages] = useState<Record<string, string>>({});
  const [platformFeePerPlate, setPlatformFeePerPlate] = useState(() => {
    return parseFloat(localStorage.getItem('platformFeePerPlate') || '1');
  });
  
  const location = useLocation();

  useEffect(() => {
    import('../lib/supabase').then(({ fetchPlatformFeePerPlate }) => {
      fetchPlatformFeePerPlate().then(fee => {
        setPlatformFeePerPlate(fee);
      });
    });
  }, []);

  useEffect(() => {
    fetch('/api/food-images')
      .then(res => res.json())
      .then(data => {
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
      .catch(err => console.error("Error fetching custom food images:", err));
  }, []);

  useEffect(() => {
      if (caterer && location.state?.packageIdx !== undefined) {
          let selectedPkg = null;
          if (typeof location.state.packageIdx === 'number' && caterer.menuPackages && caterer.menuPackages.length > location.state.packageIdx) {
              selectedPkg = caterer.menuPackages[location.state.packageIdx];
          } else {
              selectedPkg = getFallbackPackage(location.state.packageIdx, caterer.startingPrice || 350);
          }
          if (selectedPkg) {
              setSelectedPackage(selectedPkg);
              setViewMode('package_detail');
              if (selectedPkg.pricingSlabs && selectedPkg.pricingSlabs.length > 0) {
                  const sortedSlabs = [...selectedPkg.pricingSlabs].sort((a: any, b: any) => a.minGuests - b.minGuests);
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
     const raw = localStorage.getItem('registrations');
     if(raw) {
         try {
           const allRegs = JSON.parse(raw);
           const regMapped = allRegs.map((r: any) => ({
                 id: r.id,
                 name: r.businessName,
                 location: r.location || 'Hyderabad', 
                 type: r.type || 'Veg + Non-Veg',
                 startingPrice: 350,
                 description: r.description || 'Welcome to our premium catering service.',
                 menuPackages: r.menuPackages || r.packages || [],
                  packages: r.packages || r.menuPackages || []
           }));
           allCaterers = [...allCaterers, ...regMapped];
         } catch(e) {}
     }
     
     const found = allCaterers.find(c => c.id === id);
     if (found) {
         setCaterer(found);
         if (false/* legacy check disabled, handled in main useEffect */) {
             const selectedPkg = found.menuPackages[location.state.packageIdx];
             setSelectedPackage(selectedPkg);
             setViewMode('package_detail');
             
             // Pre-fill Min Guests from active slab or package
             if (selectedPkg.pricingSlabs && selectedPkg.pricingSlabs.length > 0) {
                 // Slabs should be sorted by minGuests
                 const sortedSlabs = [...selectedPkg.pricingSlabs].sort((a: any, b: any) => a.minGuests - b.minGuests);
                 setGuests(sortedSlabs[0].minGuests);
             } else if (selectedPkg.minimumGuests) {
                 setGuests(selectedPkg.minimumGuests);
             }
         }
     }
  }, [id, location.state]);
  
  const [viewMode, setViewMode] = useState<'packages' | 'custom' | 'package_detail' | 'checkout'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const [guests, setGuests] = useState(100);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);

  // Restore session state on load
  useEffect(() => {
    const savedSession = sessionStorage.getItem('orderFlowSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.catererId === id) {
           if (parsed.viewMode) setViewMode(parsed.viewMode);
           if (parsed.guests) setGuests(parsed.guests);
           if (parsed.selectedPackage) setSelectedPackage(parsed.selectedPackage);
           if (parsed.orderForm) setOrderForm(parsed.orderForm);
           if (parsed.selectedItems) setSelectedItems(parsed.selectedItems);
        }
      } catch(e) {}
      sessionStorage.removeItem('orderFlowSession');
    }
  }, [id]);

  // Extract categories & items globally if building their own, or limit to package
  let packageDefinitions: any[] = [];
  if (caterer?.menuPackages && caterer.menuPackages.length > 0) {
      packageDefinitions = caterer.menuPackages;
  } else if (caterer) {
      // Fallback standard packages
      packageDefinitions = [
          getFallbackPackage('v_silver', caterer.startingPrice),
          getFallbackPackage('v_gold', caterer.startingPrice),
          getFallbackPackage('v_platinum', caterer.startingPrice),
          getFallbackPackage('nv_premium', caterer.startingPrice),
          getFallbackPackage('nv_royal', caterer.startingPrice),
          getFallbackPackage('nv_grand', caterer.startingPrice)
      ].filter(Boolean);
  }

  // Derive menu states based on selected package or fallback
  const [orderForm, setOrderForm] = useState({
      date: '',
      type: 'Wedding',
      venue: '',
      name: '',
      phone: '',
      notes: ''
  });
  const navigate = useNavigate();

   const handleBooking = (isQuote: boolean) => {
       console.log("[TRACE_LOG #2] handleBooking() entry, isQuote:", isQuote);

       console.log("[TRACE_LOG #3] user validation block, user:", user);
       if (!user) {
           console.log("[TRACE_LOG #3.1] User validation FAILED. Redirecting to loginmodal.");
           setPendingAction(isQuote);
           setShowLoginModal(true);
           return;
       }
       console.log("[TRACE_LOG #3.2] User validation PASSED.");

       console.log("[TRACE_LOG #4] selectedPackage validation, selectedPackage:", selectedPackage);
       console.log("[TRACE_LOG #5] guest count validation, guests:", guests);

       console.log("[TRACE_LOG #7] Before localStorage.getItem('orders')");
       const currentOrders = JSON.parse(localStorage.getItem('orders') || '[]');
       console.log("[TRACE_LOG #7.1] currentOrders loaded, count:", currentOrders.length);

       const platformFee = appliedCoupon === 'NEW' ? 0 : (guests * platformFeePerPlate);
       
       let matchingSlab = selectedPackage?.pricingSlabs?.find((slab: any) => 
            guests >= slab.minGuests && (slab.maxGuests === null || guests <= slab.maxGuests)
       );
       if (!matchingSlab && selectedPackage?.pricingSlabs && selectedPackage.pricingSlabs.length > 0) {
           const sorted = [...selectedPackage.pricingSlabs].sort((a: any, b: any) => a.minGuests - b.minGuests);
           if (guests < sorted[0].minGuests) matchingSlab = sorted[0];
           else matchingSlab = sorted[sorted.length - 1];
       }

       console.log("[TRACE_LOG #6] Before newOrder object creation");
       const newOrder = {
           id: Math.random().toString(36).substr(2, 9),
           userId: user.id || '',
           customerEmail: user.email || '',
           catererId: caterer.id,
           catererName: caterer.name,
           customerName: user.name || orderForm.name || 'Guest User',
           phone: user.phone || orderForm.phone || '',
           customerPhone: user.phone || orderForm.phone || '',
           eventDate: orderForm.date,
           eventType: orderForm.type,
           guests: guests,
           guestCount: guests,
           venue: orderForm.venue || '',
           address: orderForm.venue || '',
           specialNotes: orderForm.notes || '',
           notes: orderForm.notes || '',
           packageDetails: selectedPackage,
           matchedSlab: matchingSlab,
           selectedItems: Object.keys(selectedItems).filter((k: string)=>selectedItems[k]),
           totalEstimate: (currentPerPlatePrice * guests) + platformFee,
            platformFeePerPlate: platformFeePerPlate,
           pricePerPlate: currentPerPlatePrice,
           platformFee: platformFee,
           status: 'Submitted',
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
       };
       console.log("[TRACE_LOG #6.1] Created newOrder object:", newOrder);

       console.log("[TRACE_LOG #8] Before localStorage.setItem('orders')");
       localStorage.setItem('orders', JSON.stringify([...currentOrders, newOrder]));
       console.log("[TRACE_LOG #8.1] After localStorage.setItem('orders')");

       console.log("ORDER CREATED", newOrder);

       // Store notifications for Customer, Caterer, and Admin Real-time flows
       try {
           storeNotification(
               newOrder.id,
               "New Booking Submitted 📨",
               `Your booking request for ${newOrder.catererName} on ${newOrder.eventDate} has been submitted successfully. Wait for review!`,
               "customer",
               newOrder.catererId
           );
       } catch (err) {
           console.error("NOTIFICATION ERROR", err);
       }

       try {
           storeNotification(
               newOrder.id,
               "New Order Received 🧑‍🍳",
               `A new booking request has been received from ${newOrder.customerName} for ${newOrder.eventDate}.`,
               "caterer",
               newOrder.catererId
           );
       } catch (err) {
           console.error("NOTIFICATION ERROR", err);
       }

       try {
           storeNotification(
               newOrder.id,
               "New Order Created 🔔",
               `Customer ${newOrder.customerName} submitted a new order request #${newOrder.id} for ${newOrder.catererName}.`,
               "admin"
           );
       } catch (err) {
           console.error("NOTIFICATION ERROR", err);
       }

       console.log("[TRACE_LOG #9] Before navigate('/orders')");
       toast(isQuote ? "Quotation requested successfully!" : "Booking requested successfully!", "success");
       navigate('/orders');
   };

  const handleProceedToLogin = () => {
      sessionStorage.setItem('orderFlowSession', JSON.stringify({
          catererId: caterer.id,
          viewMode,
          guests,
          selectedPackage,
          orderForm,
          selectedItems
      }));
      navigate('/login', { state: { from: `/order/${id}` } });
  };

  const menuCategories = selectedPackage?.categories?.map((c: any) => c.categoryName) || [];
  
  const [activeCategory, setActiveCategory] = useState(menuCategories[0] || "");

  useEffect(() => {
      // Reset active category when package changes
      if (selectedPackage?.categories && selectedPackage.categories.length > 0) {
          setActiveCategory(selectedPackage.categories[0].categoryName);
      }
  }, [selectedPackage]);

  const limitPerCategory = (() => {
      if (!selectedPackage || !activeCategory) return 0;
      const cat = selectedPackage.categories?.find((c: any) => c.categoryName === activeCategory);
      if (!cat || !cat.selectionRule) return 0;
      const match = cat.selectionRule.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
  })();

  const toggleItem = (itemName: string, catName: string) => {
      setSelectedItems(prev => {
          const isSelected = !!prev[itemName];
          const cat = selectedPackage.categories?.find((c: any) => c.categoryName === catName);
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

  const isCategoryComplete = (catName: string) => {
      if (!selectedPackage) return true;
      const cat = selectedPackage.categories?.find((c: any) => c.categoryName === catName);
      if (!cat) return true;
      const match = cat.selectionRule?.match(/\d+/);
      const limit = match ? parseInt(match[0], 10) : 0;
      if (limit === 0) return true;
      
      const itemsInCat = cat.items || [];
      const selectedCount = itemsInCat.filter((i: string) => selectedItems[i]).length;
      return selectedCount >= limit;
  };
  
  const allCategoriesComplete = menuCategories.length > 0 && menuCategories.every(isCategoryComplete);

  const currentPerPlatePrice = (() => {
      if (selectedPackage && selectedPackage.pricingSlabs && selectedPackage.pricingSlabs.length > 0) {
          const matchingSlab = selectedPackage.pricingSlabs.find((slab: any) => 
               guests >= slab.minGuests && (slab.maxGuests === null || guests <= slab.maxGuests)
          );
          if (matchingSlab) return matchingSlab.price;
          
          // Fallback to highest bound if exceeded, or lowest if below
          const sorted = [...selectedPackage.pricingSlabs].sort((a: any, b: any) => a.minGuests - b.minGuests);
          if (guests < sorted[0].minGuests) return sorted[0].price;
          return sorted[sorted.length - 1].price;
      }
      return selectedPackage?.pricePerPlate || caterer?.startingPrice || 350;
  })();
  
  if (!caterer) return <div className="min-h-screen pt-32 pb-24 text-center">Loading...</div>;

  return (
    <div className={cn(
        "min-h-screen flex flex-col font-poppins transition-colors duration-300",
        (viewMode === "custom" || viewMode === "checkout") ? "bg-[#F8F4EC] pt-0" : "bg-slate-50 text-slate-800 pt-[72px]"
    )}>
      
      {/* Build Header */}
      {viewMode === 'custom' ? (
          <div className="bg-[#FAF6EE] border-b border-[#D5A859]/20 py-4 shadow-[0_4px_25px_rgba(213,168,89,0.03)] z-20 relative select-none">
              <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between">
                  {/* Left Controls & Title Branding */}
                  <div className="flex items-center gap-4.5">
                      {/* Back / Menu Hamburger button */}
                      <button 
                          onClick={() => setViewMode('package_detail')} 
                          className="w-12 h-12 flex items-center justify-center rounded-full border border-[#7A7369]/25 hover:border-[#D5A859] hover:bg-white text-[#0B1F17] transition-all bg-transparent cursor-pointer group shadow-sm shrink-0"
                          title="Back to Package Details"
                      >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:scale-105">
                              <line x1="4" y1="12" x2="20" y2="12"></line>
                              <line x1="4" y1="6" x2="20" y2="6"></line>
                              <line x1="4" y1="18" x2="20" y2="18"></line>
                          </svg>
                      </button>

                      {/* Brand Title with beautiful Gold Ornament */}
                      <div className="flex items-center gap-3">
                          {/* Elegant Gold abstract ornament SVG */}
                          <svg viewBox="0 0 100 100" className="w-8 h-8 text-[#D5A859] shrink-0 animate-pulse" fill="currentColor">
                              <path d="M50 15 C45 35 35 45 15 50 C35 55 45 65 50 85 C55 65 65 55 85 50 C65 45 55 35 50 15 Z" />
                              <circle cx="50" cy="50" r="6" fill="#0B1F17" />
                          </svg>
                          <div className="flex flex-col text-left">
                              <h1 className="font-display font-black text-2xl tracking-wide text-[#0B1F17] uppercase leading-none">
                                  {caterer.name || "Veg Silver"}
                              </h1>
                              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#7A7369] font-sans leading-none mt-1.5">
                                  The Gourmet Experience
                              </span>
                          </div>
                      </div>
                  </div>

                  {/* Right Guests Selector */}
                  <div className="bg-white/90 border border-[#D5A859]/30 rounded-2xl flex items-center px-2 py-1.5 shadow-[0_4px_20px_rgba(213,168,89,0.06)] shrink-0">
                      <button 
                          onClick={() => setGuests(Math.max(selectedPackage.minimumGuests || 50, guests - 10))} 
                          className="w-10 h-10 flex items-center justify-center bg-transparent border border-[#D5A859]/20 hover:border-[#D5A859]/60 hover:bg-[#FFF8EC] text-[#0B1F17] rounded-xl font-bold transition-all shrink-0 cursor-pointer"
                      >
                          <Minus size={13} strokeWidth={3} />
                      </button>
                      <div className="w-22 text-center flex flex-col justify-center select-none shrink-0 px-2.5">
                          <span className="font-sans text-[18px] font-black text-[#0B1F17] leading-none">{guests}</span>
                          <span className="text-[8.5px] text-[#7A7369] tracking-widest font-black uppercase leading-none mt-1">Guests</span>
                      </div>
                      <button 
                          onClick={() => setGuests(guests + 10)} 
                          className="w-10 h-10 flex items-center justify-center bg-transparent border border-[#D5A859]/20 hover:border-[#D5A859]/60 hover:bg-[#FFF8EC] text-[#0B1F17] rounded-xl font-bold transition-all shrink-0 cursor-pointer"
                      >
                          <Plus size={13} strokeWidth={3} />
                      </button>
                  </div>
              </div>
          </div>
      ) : (
          <div className="bg-white border-b border-slate-200 py-3 shadow-sm z-10 relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <div className="flex items-center gap-2">
                        {viewMode === 'checkout' ? (
                            <button onClick={() => setViewMode('custom')} className="hover:bg-slate-100 p-1.5 rounded-full mr-1 transition-colors"><ArrowLeft size={18} /></button>
                        ) : viewMode !== 'packages' ? (
                            <button onClick={() => { setViewMode('packages'); setSelectedPackage(null); }} className="hover:bg-slate-100 p-1.5 rounded-full mr-1 transition-colors"><ArrowLeft size={18} /></button>
                        ) : (
                            <button onClick={() => navigate(-1)} className="hover:bg-slate-100 p-1.5 rounded-full mr-1 transition-colors"><ArrowLeft size={18} /></button>
                        )}
                        <h1 className={cn("text-left tracking-wide", viewMode === 'package_detail' ? "font-serif text-[28px] text-[#0F3D2E] font-black uppercase" : "font-display font-bold text-2xl text-brand-green-900")}>
                            {viewMode === 'packages' ? "Select a Package" : viewMode === 'checkout' ? "Order Summary & Event Details" : selectedPackage?.packageName || "Build Your Menu"}
                        </h1>
                      </div>
                      <p className={cn("text-left pl-8", viewMode === 'package_detail' ? "text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5" : "text-sm text-slate-500")}>{caterer.name} • {caterer.location}</p>
                  </div>
                  {viewMode !== 'package_detail' && viewMode !== 'checkout' && (
                  <div className="flex items-center gap-4 hidden sm:flex">
                      <div className="bg-slate-100 rounded-lg p-1.5 flex items-center">
                          <button onClick={()=>setGuests(Math.max(50, guests - 10))} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-brand-green-900 border border-slate-200 hover:bg-slate-50"><Minus size={16}/></button>
                          <div className="px-4 font-bold text-brand-green-900 w-28 text-center">{guests} Guests</div>
                          <button onClick={()=>setGuests(guests + 10)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-brand-green-900 border border-slate-200 hover:bg-slate-50"><Plus size={16}/></button>
                      </div>
                  </div>
                  )}
              </div>
          </div>
      )}

      {viewMode === 'packages' && (
          <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative">
              <div className="bg-white rounded-2xl shadow-sm border border-brand-green-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                 <div>
                    <h2 className="text-2xl font-display font-bold text-brand-green-900">{caterer.name}</h2>
                    <p className="flex items-center gap-1 text-slate-600 text-sm mt-1">
                       <MapPin size={16} className="text-slate-400" /> {caterer.location}
                    </p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-3 min-w-max">
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:hidden">Need Help?</span>
                     <button className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">📞 Call</button>
                     <button className="px-4 py-2 bg-[#25D366]/10 text-[#25D366] font-bold text-sm rounded-xl hover:bg-[#25D366]/20 transition-colors">📱 WhatsApp</button>
                     <button className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-100 transition-colors">📍 Location</button>
                 </div>
              </div>
              
              {packageDefinitions.length === 0 ? (
                  <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
                      <ChefHat className="mx-auto mb-4 text-slate-300" size={48} />
                      <h3 className="font-bold text-xl text-slate-700 mb-2">No Packages Found</h3>
                      <p className="text-slate-500 max-w-md mx-auto">This caterer has not uploaded their menu packages yet. Please check back later.</p>
                  </div>
              ) : (
                  <div>
                      <div className="text-center mb-10">
                          <h2 className="text-4xl font-display font-bold text-slate-900 mb-4 tracking-tight">Choose Your Package</h2>
                          <div className="flex items-center justify-center gap-3">
                              <div className="h-px bg-brand-gold-300 w-12 border-0"></div>
                              <Star size={12} className="text-brand-gold-500 fill-brand-gold-500" />
                              <div className="h-px bg-brand-gold-300 w-12 border-0"></div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                         {packageDefinitions.map((pkg, idx) => {
                             const sortedSlabs = pkg.pricingSlabs ? [...pkg.pricingSlabs].sort((a: any, b: any) => a.minGuests - b.minGuests) : [];
                             const minGuests = sortedSlabs.length > 0 ? sortedSlabs[0].minGuests : (pkg.minimumGuests || 100);
                             const minPrice = sortedSlabs.length > 0 ? Math.min(...sortedSlabs.map((s: any) => s.price)) : (pkg.pricePerPlate || caterer?.startingPrice || 350);
                             const totalCategories = pkg.categories ? pkg.categories.length : 0;
                             
                             const tier = getPackageTier(pkg.packageName, idx);
                             
                             let cardBgAndBorder = "bg-gradient-to-b from-white to-slate-50/70 border-slate-200 hover:border-slate-350 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]";
                             let headerColor = "text-[#0F3D2E]";
                             let buttonColor = "bg-[#0F3D2E] text-white hover:bg-[#0A2F24] border-[1.5px] border-[#D4AF37]/50 hover:border-[#D4AF37] hover:shadow-[0_4px_15px_rgba(11,61,46,0.15)]";
                             
                             if (tier === 'gold') {
                                 cardBgAndBorder = "bg-gradient-to-b from-white to-[#FCFAF5] border-2 border-[#D4AF37]/45 hover:border-[#D4AF37] hover:shadow-[0_20px_50px_rgba(212,175,55,0.16)]";
                                 headerColor = "text-[#886C1D]";
                                 buttonColor = "bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white border-[1.5px] border-[#D4AF37]/65 hover:from-[#E4BC50] hover:to-[#C8A437] shadow-[0_4px_20px_rgba(212,175,55,0.22)]";
                             } else if (tier === 'silver') {
                                 cardBgAndBorder = "bg-gradient-to-b from-white to-slate-50 border-2 border-slate-300 hover:border-slate-450 hover:shadow-[0_20px_50px_rgba(15,41,34,0.08)]";
                                 headerColor = "text-slate-700";
                                 buttonColor = "bg-slate-800 text-white hover:bg-slate-900 border-[1.5px] border-[#C0C0C0]/50 hover:border-[#C0C0C0]/80 hover:shadow-[0_4px_15px_rgba(0,0,0,0.15)]";
                             }

                             return (
                                 <div 
                                     key={idx} 
                                     onClick={() => { setSelectedPackage(pkg); setSelectedItems({}); setViewMode('package_detail'); }}
                                     className={cn("rounded-[32px] p-6 sm:p-8 cursor-pointer hover:-translate-y-2.5 transition-all duration-350 flex flex-col relative overflow-visible group shadow-md text-center mt-7", cardBgAndBorder)}
                                 >
                                     {/* Luxury overlapping Crown design with 3D shadow */}
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                                         <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border border-[#D4AF37]/35 shadow-[0_8px_24px_rgba(212,175,55,0.15)] flex items-center justify-center p-2.5">
                                             <CrownIcon tier={tier} className="w-9 h-9 sm:w-10 sm:h-10" />
                                         </div>
                                     </div>
                                     
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/3 rounded-bl-full -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform blur-xl"></div>
                                     
                                     <div className="mb-5 mt-4 relative z-10 flex flex-col items-center">
                                         {/* Premium Veg / Non-Veg Badge */}
                                         <div className="mb-3.5">
                                             {renderVegNonVegBadge(pkg.packageType)}
                                         </div>
                                         
                                         <h4 className={cn("font-display font-bold text-2xl uppercase tracking-wider mb-1 line-clamp-1 h-8", headerColor)}>
                                             {pkg.packageName || 'Catering Package'}
                                         </h4>
                                     </div>
                                     
                                     <div className="mb-6 relative z-10 flex-1 flex flex-col justify-between">
                                         {/* Center-aligned Pricing with serif font (Requirement 3) */}
                                         <div className="my-4 py-4 px-6 bg-gradient-to-br from-[#FCFAF5] to-[#F5EFE1]/20 rounded-2xl border border-[#D4AF37]/18 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-[#D4AF37]/50 transition-all duration-300">
                                             {/* Subtle background motif */}
                                             <div className="absolute right-2 bottom-0 top-0 w-1/4 opacity-[0.06] pointer-events-none flex items-center justify-end select-none">
                                                 <svg viewBox="0 0 100 100" className="w-10 h-10 text-[#D4AF37]" stroke="currentColor">
                                                     <path d="M10 90 C10 90 10 40 50 20 C65 12 75 15 80 22 C85 29 80 45 65 60 C45 80 10 90 10 90 Z" fill="none" strokeWidth="1" />
                                                 </svg>
                                             </div>
                                             
                                             <div className="text-3xl sm:text-4.5xl font-display font-black text-[#0F3D2E] tracking-tight">
                                                 ₹{minPrice}
                                             </div>
                                             <div className="text-[10px] font-sans font-black text-slate-450 uppercase tracking-widest mt-1">
                                                 / Plate
                                             </div>
                                         </div>

                                         <p className="text-[11px] italic text-slate-400 font-medium mb-5 px-3">
                                             "{pkg.description || 'Special selection carefully curated for your prestigious guests.'}"
                                         </p>
 
                                         {/* Premium Features Card styling inspired by the mockup (Requirement 5) */}
                                         <div className="bg-[#FAF8F5]/85 rounded-2xl border border-[#D4AF37]/12 py-4 px-4.5 space-y-3.5 text-left shadow-2xs">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-5.5 h-5.5 rounded-full bg-white border border-[#D4AF37]/25 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-3xs">
                                                     <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                     </svg>
                                                 </div>
                                                 <span className="font-sans font-extrabold text-[10px] uppercase tracking-wider text-slate-700">
                                                     {totalCategories} Categories Included
                                                 </span>
                                             </div>
                                             
                                             <div className="flex items-center gap-3">
                                                 <div className="w-5.5 h-5.5 rounded-full bg-white border border-[#D4AF37]/25 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-3xs">
                                                     <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                     </svg>
                                                 </div>
                                                 <span className="font-sans font-extrabold text-[10px] uppercase tracking-wider text-slate-700">
                                                     Select Any 1 Item
                                                 </span>
                                             </div>
 
                                             <div className="flex items-center gap-3">
                                                 <div className="w-5.5 h-5.5 rounded-full bg-white border border-[#D4AF37]/25 flex items-center justify-center shrink-0 text-[#D4AF37] shadow-3xs">
                                                     <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                         <button type="button" className={cn("w-full py-3.5 px-6 font-sans font-black uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-1.5 text-2xs cursor-pointer group", buttonColor)}>
                                             <span>View Details</span>
                                             <ChevronRight size={13} className="stroke-[3] transition-transform group-hover:translate-x-1" />
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

      {viewMode === 'package_detail' && selectedPackage && (
          <div className="flex-1 max-w-[620px] mx-auto w-full px-4 sm:px-6 py-10 relative">
              <div className="bg-white rounded-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.06)] overflow-hidden border border-slate-150-custom">
                  {/* Premium Emerald Green Header with Leaf motif */}
                  <div className="bg-[#0F3D2E] text-white p-6 sm:p-8 relative overflow-hidden select-none">
                      {/* Decorative Leaf Vectors on the Right Side of Banner */}
                      <div className="absolute right-0 bottom-0 top-0 w-2/5 opacity-[0.12] pointer-events-none flex items-center justify-end select-none">
                          <svg viewBox="0 0 100 100" className="w-36 h-36 text-white" stroke="currentColor">
                              <path d="M20 90 C20 90 20 40 60 20 C75 12 85 15 90 22 C95 29 90 45 75 60 C55 80 20 90 20 90 Z" fill="none" strokeWidth="1.2" />
                              <path d="M20 90 Q 55 55 90 22" fill="none" strokeWidth="1.2" strokeDasharray="2 2" />
                              <path d="M50 55 Q 63 42 78 42" fill="none" strokeWidth="0.8" />
                              <path d="M40 65 Q 53 52 68 52" fill="none" strokeWidth="0.8" />
                              <path d="M60 45 Q 71 34 82 35" fill="none" strokeWidth="0.8" />
                          </svg>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                          {/* Elegant circular brand gold crest logo */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full border-2 border-[#D4AF37] flex items-center justify-center shadow-lg shrink-0">
                              <DynamicCateringIcon packageType={selectedPackage.packageType} className="w-8 h-8 sm:w-9 sm:h-9" />
                          </div>
                          
                          <div className="text-left flex-1">
                              <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-wide uppercase leading-tight">
                                  {selectedPackage.packageName}
                              </h2>
                              <div className="mt-1.5 flex items-center">
                                  {renderVegNonVegBadge(selectedPackage.packageType)}
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-6 sm:p-8">
                     {/* Package Price Redesign with Centermost aligned premium label */}
                     <div className="mb-6 text-left">
                        <label className="block text-xs font-black text-slate-450 uppercase tracking-widest mb-2.5 text-center">
                            Package Price
                        </label>
                        
                        <div className="relative bg-gradient-to-br from-[#FCFAF5] to-[#F5EFE1]/20 rounded-2xl border-2 border-[#D4AF37]/35 p-5 hover:border-[#D4AF37]/60 hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)] transition-all duration-300 overflow-hidden shadow-xs flex flex-col items-center justify-center">
                            {/* Golden Leaf motif in the backdrop */}
                            <div className="absolute right-4 bottom-0 top-0 w-1/3 opacity-[0.05] pointer-events-none flex items-center justify-end select-none">
                                <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#D4AF37]" stroke="currentColor">
                                    <path d="M10 90 C10 90 10 40 50 20 C65 12 75 15 80 22 C85 29 80 45 65 60 C45 80 10 90 10 90 Z" fill="none" strokeWidth="1.2" />
                                    <path d="M10 90 L80 22" fill="none" strokeWidth="1" strokeDasharray="2 2" />
                                </svg>
                            </div>
                            
                            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                                <span className="text-4xl sm:text-5xl font-display font-black text-[#0F3D2E] tracking-tight">
                                    ₹{currentPerPlatePrice}
                                </span>
                                <span className="text-xs font-sans font-black text-slate-450 uppercase tracking-widest mt-2">
                                    Per Plate
                                </span>
                            </div>
                        </div>
                     </div>

                     {/* Pricing Slabs (Interactive, if available) */}
                     {selectedPackage.pricingSlabs && selectedPackage.pricingSlabs.length > 0 && (
                        <div className="mb-6">
                            <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider text-left mb-2.5">
                                Pricing Tiers
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {(() => {
                                    const sortedSlabs = [...selectedPackage.pricingSlabs].sort((a: any, b: any) => a.minGuests - b.minGuests);
                                    return sortedSlabs.map((slab: any, idx: number) => {
                                        let isActive = false;
                                        if (guests >= slab.minGuests && (slab.maxGuests === null || guests <= slab.maxGuests)) {
                                            isActive = true;
                                        } else if (guests < sortedSlabs[0].minGuests && idx === 0) {
                                            isActive = true;
                                        } else if (sortedSlabs[sortedSlabs.length - 1].maxGuests !== null && guests > sortedSlabs[sortedSlabs.length - 1].maxGuests && idx === sortedSlabs.length - 1) {
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
                                                    "flex flex-col justify-center items-start px-4 py-3 rounded-2xl border-2 transition-all duration-300 text-left cursor-pointer", 
                                                    isActive 
                                                        ? "border-[#D4AF37] bg-gradient-to-br from-white to-[#FCFAF5] shadow-[0_6px_20px_rgba(212,175,55,0.18)] scale-[1.03] -translate-y-0.5 z-10" 
                                                        : "border-slate-100 bg-white hover:border-slate-250 opacity-75 hover:opacity-100"
                                                )}
                                            >
                                                <span className={cn("text-[9px] font-black uppercase tracking-widest font-sans", isActive ? "text-[#B8962E]" : "text-slate-400")}>
                                                    {slab.minGuests} {slab.maxGuests ? `- ${slab.maxGuests}` : '+'} Guests
                                                </span>
                                                <span className={cn("text-lg font-black font-display mt-0.5", isActive ? "text-[#0F3D2E]" : "text-slate-800")}>
                                                    ₹{slab.price} <span className="text-2xs font-sans font-medium text-slate-450">/ plate</span>
                                                </span>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                     )}

                     {/* Enter Guest Count Controls */}
                     <div className="mb-6 text-left">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                            Enter Guest Count
                        </label>
                        <div className="flex items-center gap-4">
                           {/* Minus Control */}
                           <button 
                              type="button"
                              onClick={() => setGuests(Math.max(selectedPackage.minimumGuests || 50, guests - 10))} 
                              className="w-14 h-14 flex items-center justify-center bg-[#F7F4EB] hover:bg-[#EFEADF] active:scale-95 text-slate-800 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all cursor-pointer shadow-xs text-xl font-bold"
                           >
                              <Minus size={18} strokeWidth={2.5} />
                           </button>
                           
                           {/* Main Counter input */}
                           <input 
                              type="number" 
                              value={guests} 
                              onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value));
                                  setGuests(val);
                              }}
                              className="flex-1 h-14 text-center font-sans font-extrabold text-xl text-slate-800 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 transition-all text-ellipsis select-all"
                           />
                           
                           {/* Plus Control */}
                           <button 
                              type="button"
                              onClick={() => setGuests(guests + 10)} 
                              className="w-14 h-14 flex items-center justify-center bg-[#F7F4EB] hover:bg-[#EFEADF] active:scale-95 text-slate-800 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all cursor-pointer shadow-xs text-xl font-bold"
                           >
                              <Plus size={18} strokeWidth={2.5} />
                           </button>
                        </div>
                     </div>

                     {/* Gold Detail Estimate Summary Card */}
                     <div className="bg-[#FAF8F5] border-2 border-[#D4AF37]/25 rounded-[28px] p-6 sm:p-7 mb-6 shadow-[0_12px_36px_rgba(212,175,55,0.04)] relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/8 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#0F3D2E]/5 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex items-center gap-2.5 mb-4 border-b border-[#D4AF37]/15 pb-3">
                           <div className="w-7 h-7 rounded-full border border-[#D4AF37]/35 bg-[#FCFAF5] text-[#D4AF37] flex items-center justify-center shadow-xs">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                 <polyline points="14 2 14 8 20 8"></polyline>
                                 <line x1="16" y1="13" x2="8" y2="13"></line>
                                 <line x1="16" y1="17" x2="8" y2="17"></line>
                              </svg>
                           </div>
                           <h4 className="font-sans font-black text-[10px] tracking-widest text-[#0F3D2E] uppercase">
                              Estimate Summary
                           </h4>
                        </div>

                        <div className="space-y-3.5">
                           <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Catering Package</span>
                              <span className="font-sans font-black text-slate-800 text-xs uppercase tracking-[0.05em]">{selectedPackage.packageName}</span>
                           </div>
                           
                           <div className="w-full border-t border-dashed border-[#D4AF37]/15"></div>
                           
                           <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Price Per Plate</span>
                              <span className="font-black text-[#0F3D2E] font-display text-sm">₹{currentPerPlatePrice}</span>
                           </div>
                           
                           <div className="w-full border-t border-dashed border-[#D4AF37]/15"></div>
                           
                           <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Expected Guest Count</span>
                              <span className="font-black text-slate-800 font-display text-sm">{guests}</span>
                           </div>
                           
                           {/* Elevated dynamic highlight for the total (Requirement 6) */}
                           <div className="pt-2">
                               <div className="bg-gradient-to-r from-[#FCFAF5] to-[#F5EFE1]/40 border border-[#D4AF37]/35 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                                  <div className="flex flex-col">
                                      <span className="text-[10px] font-sans font-black text-[#886C1D] uppercase tracking-widest">Estimated Total</span>
                                      <span className="text-[9px] text-slate-400 font-bold font-sans mt-0.5">Inclusive of curated menu</span>
                                  </div>
                                  <span className="text-2.5xl sm:text-3.5xl font-display font-black text-[#0F3D2E] tracking-tight">
                                     ₹{(currentPerPlatePrice * guests).toLocaleString('en-IN')}
                                  </span>
                               </div>
                           </div>
                        </div>
                     </div>

                     {/* Disclaimer Policy */}
                     <p className="flex items-start gap-1.5 text-[11px] text-slate-400 font-medium leading-relaxed mb-6 select-all text-left">
                        <span className="text-xs text-slate-400">ⓘ</span>
                        <span>Taxes and additional charges may apply as per venue policy.</span>
                     </p>

                     {/* Call To Action Button (Premium Emerald / Gold outline) */}
                     <button 
                        type="button"
                        onClick={() => setViewMode('custom')} 
                        className="w-full bg-gradient-to-r from-[#0F3D2E] to-[#0A2F24] text-white font-sans font-bold text-sm tracking-wide py-4 px-6 rounded-2xl shadow-[0_12px_30px_rgba(11,61,46,0.18)] hover:shadow-[0_16px_40px_rgba(212,175,55,0.25)] border-2 border-[#D4AF37]/45 hover:border-[#D4AF37]/80 hover:scale-[1.01] transition-all outline-none flex items-center justify-center gap-2 cursor-pointer group"
                     >
                        <span>Continue With Menu</span> 
                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                     </button>
                  </div>
              </div>
          </div>
       )}

       {viewMode === 'custom' && selectedPackage && (
      <div className="flex-1 max-w-full lg:max-w-full xl:max-w-[1380px] 2xl:max-w-[1550px] mx-auto w-full px-3 sm:px-4 lg:px-5 xl:px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-4.5 xl:gap-5">
              
              {/* LEFT PANEL - Categories */}
              <div className="w-full lg:w-[185px] xl:w-[200px] shrink-0">
                  <div className="bg-[#FDFBF6] rounded-[1.5rem] border border-[#D5A859]/22 p-3.5 sticky top-28 shadow-[0_10px_30px_rgba(120,90,40,0.04)] max-h-[calc(100vh-140px)] overflow-y-auto no-scrollbar">
                      {/* Completed Categories Circular Progress Indicator */}
                      {(() => {
                        const activeCats = menuCategories.filter((cat: string) => {
                          const catItems = selectedPackage?.categories?.find((c: any) => c.categoryName === cat)?.items || [];
                          return catItems.length > 0;
                        });
                        const totalCats = activeCats.length;
                        const doneCats = activeCats.filter((cat: string) => {
                          const catData = selectedPackage?.categories?.find((c: any) => c.categoryName === cat);
                          if (!catData) return false;
                          const match = catData.selectionRule?.match(/\d+/);
                          const limit = match ? parseInt(match[0], 10) : 0;
                          if (limit === 0) return true;
                          const selectedCount = (catData.items || []).filter((i: string) => selectedItems[i]).length;
                          return selectedCount >= limit;
                        }).length;
                        const pctDone = Math.round((doneCats / (totalCats || 1)) * 100);
                        return (
                          <div className="mb-3.5">
                              <p className="text-[9px] font-bold text-[#7A7369] uppercase tracking-widest mb-1.5 font-sans leading-none">Completed Categories</p>
                              
                              <div className="flex items-center gap-2.5 mb-2 select-none">
                                  <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                                      {/* SVG Circular Progress circle with gold stroke */}
                                      <svg className="w-11 h-11 transform -rotate-90">
                                          <circle cx="22" cy="22" r="18" className="stroke-[#F5EFE1]" strokeWidth="2.5" fill="transparent" />
                                          <circle cx="22" cy="22" r="18" strokeWidth="3" fill="transparent"
                                              strokeDasharray="113"
                                              strokeDashoffset={113 - (113 * (doneCats / (totalCats || 1)))}
                                              strokeLinecap="round"
                                              className="stroke-[#D5A859] transition-all duration-500"
                                          />
                                      </svg>
                                      <span className="absolute text-[10px] font-bold font-sans text-[#2A2A2A]">
                                          {doneCats}/{totalCats}
                                      </span>
                                  </div>
                                  <div>
                                      <span className="text-[10px] font-semibold text-[#7A7369] block leading-tight">Progress towards</span>
                                      <span className="text-xs font-bold font-display text-[#123326]">perfect dinner</span>
                                  </div>
                              </div>
                              <div className="w-full bg-[#F5EFE1] h-[4px] rounded-full overflow-hidden">
                                  <div 
                                      className="bg-gradient-to-r from-[#FCE6A9] via-[#D5A859] to-[#9E7730] h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${pctDone}%` }}
                                  ></div>
                              </div>
                          </div>
                        );
                      })()}

                      <div className="w-full my-3 border-t border-[#D5A859]/20"></div>

                      <h3 className="font-sans font-bold text-[9px] uppercase tracking-widest text-[#7A7369] mb-2 px-0.5">Categories</h3>
                      <div className="space-y-1.5 px-0.5">
                          {menuCategories.map((cat: string) => {
                              const catData = selectedPackage.categories?.find((c: any) => c.categoryName === cat);
                              const catItems = catData?.items || [];
                              if (catItems.length === 0) return null;
                              const selectedCount = catItems.filter((i: string) => selectedItems[i]).length;
                              
                              const match = catData.selectionRule?.match(/\d+/);
                              const catLimit = match ? parseInt(match[0], 10) : 0;
                              const isDone = selectedCount >= catLimit;
                              const isActive = activeCategory === cat;
                              
                              return (
                                  <button
                                      key={cat}
                                      onClick={() => setActiveCategory(cat)}
                                      className={cn(
                                          "w-full text-left px-3.5 py-2.5 rounded-xl transition-all border text-[12px] font-bold flex items-center justify-between select-none relative group cursor-pointer",
                                          isActive 
                                             ? "bg-[#0B1F17] text-white border-[#D4AF37] shadow-[0_6px_18px_rgba(11,31,23,0.15)]" 
                                             : "bg-[#FFFDF9]/95 text-[#123326] border-[#D4AF37]/15 hover:border-[#D4AF37]/40 hover:bg-[#FAF4E5] shadow-[0_2px_6px_rgba(120,90,40,0.02)]"
                                      )}
                                  >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                          <span className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-[#E6C77D]" : "text-[#123326] transition-colors group-hover:text-[#D5A859]")}>
                                              {getCategoryIcon(cat)}
                                          </span>
                                          <span className="truncate leading-none font-sans font-bold tracking-tight">{cat}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 shrink-0">
                                          {catLimit > 0 ? (
                                              isDone ? (
                                                  <span className={cn(
                                                      "text-[8.5px] px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5 uppercase tracking-wide shrink-0 border",
                                                      isActive 
                                                          ? "bg-white/10 text-[#E6C77D] border-transparent" 
                                                          : "bg-[#27AE60]/15 text-[#1E8E5A] border-transparent"
                                                  )}>
                                                      ✓
                                                  </span>
                                              ) : (
                                                  <span className={cn(
                                                      "text-[8.5px] px-1.5 py-0.5 rounded-full font-black tracking-wide shrink-0 border uppercase",
                                                      isActive 
                                                          ? "bg-white/15 text-white border-transparent" 
                                                          : "bg-slate-50 text-slate-500 border-slate-200/85"
                                                  )}>
                                                      {selectedCount}/{catLimit}
                                                  </span>
                                              )
                                          ) : (
                                              <span className={cn(
                                                  "text-[8.5px] px-1.5 py-0.5 rounded-full font-black shrink-0 border",
                                                  isActive 
                                                     ? "bg-white/15 text-white border-transparent" 
                                                     : "bg-slate-50 text-slate-500 border-slate-100"
                                              )}>
                                                  {selectedCount}
                                              </span>
                                          )}

                                          {isActive ? (
                                              <span className="text-[#E6C77D] translate-x-0.5 transition-transform">
                                                  <ChevronRight size={11} strokeWidth={3} />
                                              </span>
                                          ) : (
                                              <span className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#D5A859]/70">
                                                  <ChevronRight size={11} strokeWidth={2} />
                                              </span>
                                          )}
                                      </div>
                                  </button>
                              )
                          })}
                      </div>

                      {/* Great Choice Paragraph message Card - Premium style matching Screenshot 1 */}
                      <div className="mt-5 bg-[#FFFDF9] border border-[#D5A859]/30 rounded-xl p-3.5 relative overflow-hidden select-none shadow-[inset_0_1px_5px_rgba(213,168,89,0.05),0_8px_24px_rgba(213,168,89,0.04)]">
                          {/* Rich vertical highlight border tag */}
                          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#E6C77D] via-[#D5A859] to-[#9E7730] opacity-90"></div>
                          <div className="flex gap-2.5 items-start pl-0.5">
                              <div className="w-6.5 h-6.5 rounded-full bg-[#FFF8EC] flex items-center justify-center border border-[#D5A859]/25 shadow-sm text-xs shrink-0">
                                  👑
                              </div>
                              <div>
                                  <p className="text-[10px] font-bold text-[#123326] tracking-wider mb-0.5 font-sans uppercase">Great choice!</p>
                                  <p className="text-[11px] text-[#554F46] font-medium leading-normal">
                                      You are building a delicious menu
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* MIDDLE PANEL - Available Dishes */}
              <div 
                  className="flex-1 min-w-0 flex flex-col overflow-hidden mb-6"
                  style={{
                      backgroundColor: "#FDFBF6",
                      border: "1px solid rgba(212,175,55,0.35)",
                      borderRadius: "28px",
                      boxShadow: "0 15px 30px rgba(120,90,40,0.06), inset 0 0 0 1px rgba(255,240,200,0.3)",
                      minHeight: "650px"
                  }}
              >
                  {/* Category Header Area */}
                  <div className="p-6 md:p-8 pb-5 md:pb-6 border-b border-[#D5A859]/15 bg-transparent">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                          <div>
                              <h2 
                                  className="text-[34px] sm:text-[38px] lg:text-[42px] xl:text-[46px] font-bold font-serif font-display text-[#0B1F17] leading-none tracking-tight mb-2.5 max-w-[90%]"
                                  style={{
                                      whiteSpace: 'normal',
                                      wordBreak: 'keep-all',
                                      overflowWrap: 'normal'
                                  }}
                              >
                                  {activeCategory}
                              </h2>
                              
                              <div className="flex items-center gap-3.5 mt-2.5">
                                  <span className="text-[11.5px] font-black tracking-[0.22em] text-[#D5A859] uppercase font-sans">
                                      {getSelectionRuleLabel(selectedPackage.categories?.find((c: any) => c.categoryName === activeCategory)?.selectionRule)}
                                  </span>
                                  <div className="h-[1px] bg-[#D5A859]/25 flex-1 w-20"></div>
                              </div>

                              {limitPerCategory > 0 && (
                                  <div className="mt-5 flex items-center gap-2">
                                      {(() => {
                                          const catData = selectedPackage.categories?.find((c: any) => c.categoryName === activeCategory);
                                          const itemsInCat = catData?.items || [];
                                          const selectedCount = itemsInCat.filter((i: string) => selectedItems[i]).length;
                                          const isFull = selectedCount >= limitPerCategory;
                                          return isFull ? (
                                              <span className="inline-flex items-center gap-2 bg-[#1E8E5A]/8 border border-[#1E8E5A]/25 text-[#1E8E5A] font-extrabold px-3.5 py-1.5 rounded-full text-[11px] tracking-wide uppercase">
                                                  <Check size={12} strokeWidth={3.5} className="text-[#1E8E5A]" /> Completed selection ({selectedCount}/{limitPerCategory})
                                              </span>
                                          ) : (
                                              <span className="inline-flex items-center gap-2 bg-[#FFF8EC] border border-[#D5A859]/30 text-amber-850 font-extrabold px-3.5 py-1.5 rounded-full text-[11px] tracking-wide uppercase">
                                                  Requires any {limitPerCategory} ({selectedCount} selected)
                                              </span>
                                          );
                                      })()}
                                  </div>
                              )}
                          </div>

                          <div className="relative w-full sm:w-[260px] lg:w-[290px] shrink-0 self-center sm:self-end">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#D5A859] select-none">🍸</span>
                              <input 
                                  type="text" 
                                  placeholder="Search dishes..." 
                                  className="w-full pl-10 pr-5 bg-[#FFFDF9]/95 border border-[#D4AF37]/30 hover:border-[#D5A859]/60 focus:border-[#D4AF37] rounded-full text-[14px] font-semibold shadow-[inset_0_1px_3px_rgba(120,90,40,0.03)] outline-none transition-all placeholder:text-[#7A7369]/40 text-[#123326] h-[44px] tracking-wide"
                                  onChange={(e) => {
                                      const val = e.target.value.toLowerCase();
                                      document.querySelectorAll('.dish-card-item').forEach(el => {
                                          const name = el.getAttribute('data-name')?.toLowerCase() || '';
                                          if(name.includes(val)) el.classList.remove('hidden');
                                          else el.classList.add('hidden');
                                      });
                                  }}
                              />
                          </div>
                      </div>
                  </div>
                  
                  {/* Grid layout - Highly spacious & elevated matching Screenshot 1 */}
                  <div className="p-3 sm:p-4 lg:p-4.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-3 sm:gap-3.5 xl:gap-4 auto-rows-max overflow-y-auto h-full max-h-[calc(100vh-210px)] content-start bg-[#FAF6EE]/15 pb-16">
                      {(selectedPackage.categories?.find((c: any) => c.categoryName === activeCategory)?.items || []).map((itemName: string, idx: number) => {
                          const isSelected = selectedItems[itemName];
                          const itemsInCat = selectedPackage.categories?.find((c: any) => c.categoryName === activeCategory)?.items || [];
                          const selectedCount = itemsInCat.filter((i: string) => selectedItems[i]).length;
                          const isAtLimit = limitPerCategory > 0 && selectedCount >= limitPerCategory;
                          const isDisabled = !isSelected && isAtLimit;
                          
                          const isPremium = isItemPremium(itemName);
                          const isNonVeg = isItemNonVeg(itemName, activeCategory);
                          
                          return (
                              <div 
                                  key={idx} 
                                  data-name={itemName}
                                  onClick={() => {
                                      if (!isDisabled) toggleItem(itemName, activeCategory);
                                  }}
                                  onMouseEnter={() => setHoveredCardIdx(idx)}
                                  onMouseLeave={() => setHoveredCardIdx(null)}
                                  className={cn(
                                      "dish-card-item relative bg-[#FFFDF9] rounded-[16px] flex flex-col justify-between p-3.5 pt-4.5 pb-3 transition-all duration-300 cursor-pointer select-none min-h-[135px] xl:min-h-[145px]",
                                      isSelected 
                                          ? "bg-[#FFF8EC]/60" 
                                          : isDisabled 
                                             ? "bg-slate-50/70 opacity-45 cursor-not-allowed shadow-none" 
                                             : ""
                                  )}
                                  style={{
                                      border: isDisabled 
                                          ? "1px solid rgba(226,232,240,0.5)" 
                                          : isSelected 
                                              ? "2px solid rgba(212,175,55,0.85)" 
                                              : "1px solid rgba(212,175,55,0.35)",
                                      boxShadow: isDisabled 
                                          ? "none" 
                                          : isSelected 
                                              ? "0 14px 34px rgba(160,120,50,0.18), 0 4px 12px rgba(0,0,0,0.06)" 
                                              : (hoveredCardIdx === idx) 
                                                  ? "0 14px 28px rgba(160,120,50,0.2), 0 5px 12px rgba(0,0,0,0.08)" 
                                                  : "0 12px 25px rgba(160,120,50,0.12)",
                                      transform: isSelected 
                                          ? "translateY(0)" 
                                          : (hoveredCardIdx === idx) 
                                              ? "translateY(-2px)" 
                                              : "translateY(0)",
                                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                                  }}
                              >
                                  {/* Champagne Gold Gilded Top Accent bar */}
                                  {!isDisabled && (
                                      <div 
                                          className="absolute top-0 left-0 right-0 h-1 rounded-t-[16px] opacity-90"
                                          style={{
                                              background: "linear-gradient(90deg, #FCE6A9, #D4AF37, #B8872B, #D4AF37, #FCE6A9)"
                                          }}
                                      ></div>
                                  )}

                                  {/* Header Item Category & Type */}
                                  <div className="flex justify-between items-center gap-3 mb-3.5">
                                      {/* Veg / Non-Veg Indicator Badge */}
                                      {isNonVeg ? (
                                          <div className="flex items-center gap-2 text-xs font-bold text-[#8C2A2A]">
                                              <span className="flex items-center justify-center w-[15px] h-[15px] border-2 border-red-800 rounded-sm p-[2px] bg-white shrink-0">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-red-800"></span>
                                              </span>
                                              <span className="text-[10.5px] font-extrabold tracking-wider text-red-800 font-sans uppercase">Non-Veg</span>
                                          </div>
                                      ) : (
                                          <div className="flex items-center gap-2 text-xs font-bold text-[#1E8E5A]">
                                              <span className="flex items-center justify-center w-[15px] h-[15px] border-2 border-emerald-700 rounded-sm p-[2px] bg-white shrink-0">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700"></span>
                                              </span>
                                              <span className="text-[10.5px] font-extrabold tracking-wider text-emerald-700 font-sans uppercase">Veg</span>
                                          </div>
                                      )}

                                      {/* Top right crown indicating slot limit */}
                                      <div className="flex items-center gap-1.5 text-xs font-black text-[#D5A859]">
                                          <span>👑</span>
                                          <span className="text-13px font-bold font-sans">{limitPerCategory || 1}</span>
                                      </div>
                                  </div>

                                  {/* Item Name - Beautiful Playfair display serif, scaled up */}
                                  <div className="flex-1 flex flex-col justify-center my-1.5 px-0.5 min-h-[44px] xl:min-h-[48px]">
                                      <h4 
                                          className="text-[15.5px] sm:text-[16.5px] lg:text-[17px] xl:text-[17.5px] font-bold font-display text-[#0B1F17] leading-snug text-center line-clamp-2 select-all"
                                          style={{
                                              fontFamily: '"Playfair Display", Georgia, serif',
                                              whiteSpace: 'normal',
                                              wordBreak: 'keep-all',
                                              overflowWrap: 'break-word'
                                          }}
                                      >
                                          {itemName}
                                      </h4>
                                  </div>

                                  {/* Bottom Control Row */}
                                  <div className="flex items-center justify-between gap-2.5 mt-3 pt-3 border-t border-slate-100/90 shrink-0">
                                      {/* Left status badge */}
                                      {isPremium ? (
                                          <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[#9E7730] bg-[#FFF8EC] px-2.5 py-1 rounded-[6px] border border-[#D5A859]/20 w-fit">
                                              Premium
                                          </span>
                                      ) : (
                                          <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-[#1E8E5A] bg-[#1E8E5A]/8 px-2.5 py-1 rounded-[6px] border border-[#1E8E5A]/15 w-fit">
                                              Included
                                          </span>
                                      )}

                                      {/* Right Gold-accented Button */}
                                      {isSelected ? (
                                          <button 
                                              type="button"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!isDisabled) toggleItem(itemName, activeCategory);
                                              }}
                                              className="px-3.5 py-1 bg-[#123326] hover:bg-[#0B1F17] border border-[#D5A859]/20 text-[#FFF8EC] font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-200 shadow-sm cursor-pointer min-w-[76px] text-center"
                                          >
                                              ✓ Added
                                          </button>
                                      ) : (
                                          <button 
                                              type="button"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!isDisabled) toggleItem(itemName, activeCategory);
                                              }}
                                              disabled={isDisabled}
                                              className={cn(
                                                  "px-3.5 py-1 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all duration-200 select-none min-w-[76px] text-center cursor-pointer",
                                                  isDisabled 
                                                      ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none" 
                                                      : "bg-[#8B6E4A] hover:bg-[#7D5F3D] text-[#FFFDF9] shadow-[0_1.5px_4px_rgba(139,110,74,0.18)] active:scale-[0.97]"
                                              )}
                                          >
                                              + Add
                                          </button>
                                      )}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>

              {/* RIGHT PANEL - Live Order Summary */}
              <div className="w-full lg:w-[290px] xl:w-[310px] shrink-0">
                  <div className="rounded-[2rem] p-5 pb-6 sticky top-28 overflow-hidden relative flex flex-col h-[calc(100vh-140px)] border border-[#D4AF37]/28" style={{ background: "linear-gradient(135deg, #04140D 0%, #010604 100%)", boxShadow: "0 24px 75px rgba(5,20,13,0.45), 0 0 40px rgba(212,175,55,0.04), inset 0 0 0 1px rgba(255,240,200,0.07)" }}>
                      {/* Inner champagne-gold gilded luxury border double-line */}
                      <div className="absolute inset-2 md:inset-2.5 rounded-[1.6rem] border-2 border-[#D4AF37]/15 pointer-events-none z-0"></div>
                      {/* Ambient background luxury glows */}
                      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D5A859]/12 rounded-full pointer-events-none blur-3xl"></div>
                      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#FCE6A9]/6 rounded-full pointer-events-none blur-3xl"></div>
                      
                      {/* Floating panel top summary bar */}
                      <div className="mb-6 pb-5 border-b border-white/10 flex justify-between items-center relative z-10">
                          <div>
                              <h3 className="font-display font-black text-3.5xl tracking-tight text-[#FDFBFA] mb-1.5">Your Order</h3>
                              <p className="text-[10px] font-black text-[#D5A859] tracking-[0.16em] uppercase">{guests} GUESTS SELECTED</p>
                          </div>
                          
                          <div className="flex items-center gap-2 relative z-10 shrink-0">
                              <button 
                                  onClick={() => setSelectedItems({})}
                                  title="Clear entire selection"
                                  className="w-11 h-11 rounded-2xl bg-[#FFF8EC] border border-[#D5A859]/35 hover:border-[#D5A859] flex items-center justify-center transition-all cursor-pointer shadow-md text-[#5D4E40] hover:text-rose-900"
                              >
                                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                              </button>
                          </div>
                      </div>
                      
                      {/* Glassmorphic scrolling selected item list container */}
                      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-6 relative z-10 custom-scrollbar">
                          {menuCategories.map((cat: string) => {
                              const itemsInCat = (selectedPackage.categories?.find((c: any) => c.categoryName === cat)?.items || []).filter((i: string) => selectedItems[i]);
                              if (itemsInCat.length === 0) return null;
                              return (
                                  <div key={cat} className="space-y-2.5 mb-4 px-0.5">
                                      <h4 className="text-[10px] font-black text-[#D5A859] uppercase tracking-widest pl-1">
                                          {cat}
                                      </h4>
                                      <ul className="space-y-2">
                                          {itemsInCat.map((item: string, idx: number) => (
                                              <li 
                                                  key={idx} 
                                                  className="bg-white/5 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 text-sm flex items-center justify-between font-bold text-white/95 shadow-sm group transition-all hover:bg-white/10"
                                              >
                                                  <div className="flex items-center gap-2 py-0.5 min-w-0 pr-2">
                                                      <span className="text-[#D5A859] shrink-0 text-xs">◆</span>
                                                      <span className="leading-tight truncate font-sans text-[14.5px]">{item}</span>
                                                  </div>
                                                  <button
                                                      type="button"
                                                      onClick={() => toggleItem(item, cat)}
                                                      className="w-6.5 h-6.5 rounded-full bg-white/5 hover:bg-rose-900/40 hover:text-white text-white/50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                                  >
                                                      <X size={12} />
                                                  </button>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              )
                          })}
                          
                          {Object.keys(selectedItems).filter(k=>selectedItems[k]).length === 0 && (
                              <div className="text-center py-16 text-white/40 text-sm h-full flex flex-col justify-center items-center">
                                  {/* Beautiful gold wireframe cake/dessert tray SVG */}
                                  <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto mb-5 text-[#D5A859]/60" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      {/* Serve stand wireframe base */}
                                      <path d="M50 85 C35 85 30 92 30 95 L70 95 C70 92 65 85 50 85 Z" fill="rgba(213, 168, 89, 0.05)" />
                                      {/* Central pillar */}
                                      <line x1="50" y1="20" x2="50" y2="85" />
                                      {/* Serving ring handle */}
                                      <circle cx="50" cy="15" r="5" />
                                      {/* Tier 1 (Bottom tray) */}
                                      <path d="M25 75 Q50 80 75 75" />
                                      {/* Tier 2 (Middle tray) */}
                                      <path d="M30 50 Q50 54 70 50" />
                                      {/* Tier 3 (Top tray) */}
                                      <path d="M35 28 Q50 31 65 28" />
                                      {/* Mini cakes / pastries on trays */}
                                      <circle cx="42" cy="71" r="2.5" fill="#D5A859" />
                                      <circle cx="58" cy="71" r="2.5" fill="#D5A859" />
                                      <rect x="47" y="43" width="6" height="5" rx="1" fill="#D5A859" />
                                      <circle cx="48" cy="24" r="2" fill="#D5A859" />
                                  </svg>
                                  <p className="font-extrabold text-[#FCE6A9]/95 text-sm tracking-widest uppercase">Select dishes from the left</p>
                                  <p className="text-[12.5px] mt-1.5 text-white/50 leading-relaxed font-sans max-w-[85%]">To custom curate your luxury menu</p>
                              </div>
                          )}
                      </div>
                      
                      {/* Divider line before checkout stats */}
                      <div className="flex items-center justify-center my-6.5 relative z-10 font-sans">
                          <div className="w-full h-[1px] bg-[#D5A859]/25 font-sans"></div>
                          <span className="absolute text-[#D5A859] bg-[#06150D] px-3.5 text-[14px] font-sans">✧</span>
                      </div>
                      
                      {/* Total Estimate Highlight box */}
                      <div className="pt-3 relative z-10 mt-auto shrink-0 font-sans">
                          
                          {/* Rich Highlight Box style */}
                          <div className="bg-white/[0.06] border border-[#D5A859]/35 rounded-[1.75rem] p-7 mb-7 shadow-inner font-sans">
                              <div className="flex justify-between items-baseline mb-3 text-white/70 font-sans">
                                  <span className="text-[11px] font-black uppercase tracking-widest text-[#FFF8EC]/60 font-sans">Estimated Base Price</span>
                                  <span className="text-sm font-black text-[#E5C37A] font-sans">₹{currentPerPlatePrice} / guest</span>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-white/[0.08] font-sans">
                                  <span className="font-extrabold text-[#FDFBFA] text-[15px] tracking-tight font-sans">Total Estimate</span>
                                  <span className="text-[32px] lg:text-[36px] font-black font-display font-serif text-[#E5C37A] leading-none select-all tracking-tight">
                                      ₹{(currentPerPlatePrice * guests).toLocaleString('en-IN')}
                                  </span>
                              </div>
                          </div>

                          {/* Trust metrics */}
                          <div className="flex items-center justify-around text-[11px] text-[#F8F4EC]/75 font-bold mb-6 font-sans">
                              <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-[#D5A859] inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 11 13 15 9"/></svg>Secure</span>
                              <span className="text-white/20">|</span>
                              <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-[#D5A859] inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Safe</span>
                              <span className="text-white/20">|</span>
                              <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-[#D5A859] inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>Reliable</span>
                          </div>
                          
                          {/* Proceed CTA button */}
                          <button 
                              onClick={() => {
                                  if (allCategoriesComplete) {
                                      setViewMode('checkout');
                                  } else {
                                      // Soft scroll indicator to guide luxury experience completion
                                      const catProgress = document.getElementById('completed-categories-box') || document.querySelector('.progress-header');
                                      if (catProgress) {
                                          catProgress.scrollIntoView({ behavior: 'smooth' });
                                      }
                                  }
                              }}
                              className="w-full py-5 rounded-[18px] font-extrabold shadow-lg transition-all flex items-center justify-between px-7 uppercase tracking-wider text-xs duration-300 relative group overflow-hidden cursor-pointer text-[#0B1F17] hover:opacity-95 hover:shadow-[0_8px_25px_rgba(212,175,55,0.42)] border-[1.5px] border-white/40"
                              style={{
                                  background: "linear-gradient(135deg, #F4E2B6, #D4AF37, #B8872B)",
                                  boxShadow: "0 8px 24px rgba(212, 168, 89, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
                              }}
                          >
                              <span className="font-extrabold tracking-widest text-[11px]">Proceed to Order</span>
                              <div className="w-8.5 h-8.5 rounded-full bg-[#0B1F17] text-[#FCE6A9] flex items-center justify-center shadow-md grow-0 shrink-0">
                                  <ChevronRight size={17} strokeWidth={3} />
                              </div>
                          </button>
                          
                          {!allCategoriesComplete && (
                              <div className="mt-4 bg-white/[0.04] text-[#FCE6A9] border border-[#D5A859]/20 px-4 py-3 rounded-xl text-[11px] font-semibold text-center flex items-center justify-center gap-2">
                                  <span>ℹ️</span> Please complete all categories to proceed.
                              </div>
                          )}

                          {/* Details footprint */}
                          <div className="mt-3.5 text-center text-[10px] text-[#F8F4EC]/40 flex items-center justify-center gap-1 leading-none select-none">
                              <span>🔒 Your details are 100% safe with us</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* BOTTOM PREMIUM TRUST SECTION */}
          <div className="mt-12 bg-[#FDFCF9] border border-[#D5A859]/20 rounded-[2.5rem] p-8 shadow-[0_12px_40px_rgba(213,168,89,0.04)] flex flex-col md:flex-row items-center justify-around gap-8 text-[13px] font-semibold text-[#2A2A2A] select-none">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFF8EC] text-[#D5A859] flex items-center justify-center shrink-0 border border-[#D5A859]/25">
                      <Award size={22} />
                  </div>
                  <div>
                      <h4 className="text-slate-800 font-bold leading-tight">Premium Ingredients</h4>
                      <p className="text-[11px] text-[#7A7369] font-bold">100% Quality Assurance</p>
                  </div>
              </div>
              
              <div className="h-8 w-px bg-[#D5A859]/15 hidden md:block"></div>

              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-55 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100/50">
                      <ShieldCheck size={22} />
                  </div>
                  <div>
                      <h4 className="text-slate-800 font-bold leading-tight">Hygienic Kitchens</h4>
                      <p className="text-[11px] text-[#7A7369] font-bold">FSSAI Certified Standards</p>
                  </div>
              </div>

              <div className="h-8 w-px bg-[#D5A859]/15 hidden md:block"></div>

              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#123326] flex items-center justify-center shrink-0 border border-emerald-100/50">
                      <ChefHat size={22} />
                  </div>
                  <div>
                      <h4 className="text-slate-800 font-bold leading-tight">Professional Chefs</h4>
                      <p className="text-[11px] text-[#7A7369] font-bold">5-Star Culinary Expertise</p>
                  </div>
              </div>

              <div className="h-8 w-px bg-[#D5A859]/15 hidden md:block"></div>

              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFF8EC] text-[#D5A859] flex items-center justify-center shrink-0 border border-[#D5A859]/25">
                      <Truck size={22} />
                  </div>
                  <div>
                      <h4 className="text-slate-800 font-bold leading-tight">Punctual Delivery</h4>
                      <p className="text-[11px] text-[#7A7369] font-bold">Hot & Fresh On Time</p>
                  </div>
              </div>

              <div className="h-8 w-px bg-[#D5A859]/15 hidden md:block"></div>

              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#123326] flex items-center justify-center shrink-0 border border-emerald-200/30">
                      <Smile size={22} />
                  </div>
                  <div>
                      <h4 className="text-slate-800 font-bold leading-tight">100% Satisfaction</h4>
                      <p className="text-[11px] text-[#7A7369] font-bold">Loved By 20,000+ Guests</p>
                  </div>
              </div>
          </div>
      </div>
      )}

      {viewMode === 'checkout' && (
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-2xl font-bold font-display text-brand-green-900 mb-6 border-b border-slate-100 pb-4">Event Details</h2>
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Event Date</label>
                          <input type="date" value={orderForm.date} onChange={e => setOrderForm({...orderForm, date: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Event Type</label>
                          <select value={orderForm.type} onChange={e => setOrderForm({...orderForm, type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm flex-1 focus:border-brand-gold-500 outline-none bg-white">
                              <option>Wedding</option>
                              <option>Corporate Event</option>
                              <option>Birthday</option>
                              <option>Anniversary</option>
                              <option>Other</option>
                          </select>
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Venue Address</label>
                      <textarea rows={3} value={orderForm.venue} onChange={e => setOrderForm({...orderForm, venue: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm flex-1 focus:border-brand-gold-500 outline-none" placeholder="Enter venue location in Hyderabad..."></textarea>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Your Full Name</label>
                          <input type="text" value={orderForm.name} onChange={e => setOrderForm({...orderForm, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm flex-1 focus:border-brand-gold-500 outline-none" placeholder="Enter your name" />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                          <input type="tel" value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm flex-1 focus:border-brand-gold-500 outline-none" placeholder="+91" />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Special Requests (Optional)</label>
                      <textarea rows={2} value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-brand-gold-500 outline-none" placeholder="E.g., No onion/garlic for 20 guests..."></textarea>
                  </div>
              </div>
          </div>
          <div className="w-full lg:w-[380px] shrink-0">
             <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-brand-green-900/5 sticky top-32">
                <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-100 pb-3">Order Summary</h3>
                <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-slate-500">Selected Package</span>
                    <span className="font-bold text-slate-800">{selectedPackage?.packageName}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-slate-500">Total Items</span>
                    <span className="font-bold text-slate-800 text-right">{Object.keys(selectedItems).filter(k=>selectedItems[k]).length} Items</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-slate-500">Guests</span>
                    <span className="font-bold text-slate-800">{guests}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-4 mb-4">
                    <span className="text-slate-500">Est. Price per Plate</span>
                    <span className="font-bold text-slate-800">₹{currentPerPlatePrice}</span>
                </div>
                
                {/* Platform Fee & Offers */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                    <div className="flex justify-between items-center text-sm mb-3">
                        <span className="text-slate-600 font-medium">Platform Fee <span className="text-[10px] text-slate-400 font-normal">(₹{platformFeePerPlate}/plate)</span></span>
                        <span className={cn("font-bold", appliedCoupon === 'NEW' ? "text-slate-400 line-through" : "text-slate-800")}>₹{(guests * platformFeePerPlate).toLocaleString()}</span>
                    </div>

                    {appliedCoupon !== 'NEW' ? (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={couponCode} 
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Have a coupon? (Try 'NEW')" 
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-gold-500 uppercase"
                            />
                            <button 
                                onClick={() => {
                                    if(couponCode === 'NEW') {
                                        setAppliedCoupon('NEW');
                                        toast("Welcome Offer Applied!", "success");
                                    } else {
                                        toast("Invalid coupon code", "error");
                                    }
                                }}
                                className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                            >
                                Apply
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm text-green-700 bg-green-100/50 px-3 py-2 rounded-lg">
                                <span className="font-bold flex items-center gap-1.5"><Check size={14} className="text-green-600"/> Code 'NEW' Applied</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">-₹{(guests * platformFeePerPlate).toLocaleString()}</span>
                                    <button onClick={() => { setAppliedCoupon(''); setCouponCode(''); }} className="text-slate-400 hover:text-red-500 ml-1"><X size={14}/></button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-sm mt-4 pt-3 border-t border-slate-200">
                        <span className="text-slate-800 font-bold">Payable Platform Fee</span>
                        <span className="font-bold text-brand-green-900">₹{appliedCoupon === 'NEW' ? '0' : (guests * platformFeePerPlate).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-6 text-xl">
                    <span className="font-bold text-slate-800">Total Estimate</span>
                    <span className="font-display font-bold text-brand-green-900 text-2xl text-right">₹{((currentPerPlatePrice * guests) + (appliedCoupon === 'NEW' ? 0 : (guests * platformFeePerPlate))).toLocaleString('en-IN')}</span>
                </div>
                <div className="space-y-3">
                   <button onClick={() => { console.log("[TRACE_LOG #1] Confirm Booking button clicked (isQuote = false)"); handleBooking(false); }} className="w-full bg-brand-green-900 hover:bg-brand-green-800 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-green-900/30 transition-all flex items-center justify-center gap-2">Confirm Booking</button>
                   <button onClick={() => { console.log("[TRACE_LOG #1] Request Quote button clicked (isQuote = true)"); handleBooking(true); }} className="w-full bg-white border-2 border-brand-gold-500 text-brand-gold-600 hover:bg-brand-gold-50 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2">Request Quote</button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-medium flex items-center justify-center gap-2"><Check size={12}/> Platform fee waived! No payment required today</p>
             </div>
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
                 <h3 className="text-2xl font-bold font-display text-slate-900 mb-2">Login Required</h3>
                 <p className="text-slate-500 text-sm mb-8">Please login to continue your {pendingAction ? 'quote request' : 'booking'}. Your progress will be saved.</p>
                 <div className="space-y-3">
                    <button onClick={handleProceedToLogin} className="w-full bg-brand-green-900 text-white font-bold py-3.5 rounded-xl hover:bg-brand-green-800 transition-colors shadow-md">
                        Login to Continue
                    </button>
                    <button onClick={() => setShowLoginModal(false)} className="w-full bg-white text-slate-600 font-bold py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
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
