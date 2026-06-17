export interface Dish {
  id: string;
  name: string;
  description: string;
  image: string;
  isVeg: boolean;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  dishes: Dish[];
}

export interface PriceBasedMenu {
  id: string;
  pricePerPlate: number;
  categories: MenuCategory[];
}

export interface Caterer {
  id: string;
  name: string;
  location: string;
  type: 'Veg' | 'Veg + Non-Veg' | string;
  startingPrice: number;
  rating: number;
  reviewCount: number;
  description: string;
  images: string[];
  logo: string;
  address: string;
  phone: string;
  menus: PriceBasedMenu[];
  menuItems?: any;
  menuPackages?: any[];
  experience?: number;
  eventsCompleted?: number;
  awards?: string;
  certifications?: string;
  brandName?: string;
  tagline?: string;
  whatsappNumber?: string;
  operatingHours?: string;
  branches?: number;
  serviceAreas?: string;
  pendingUpdates?: any;
}

export interface LocationOption {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  catererId: string;
  authorName: string;
  authorImage: string;
  rating: number;
  content: string;
  date: string;
}
