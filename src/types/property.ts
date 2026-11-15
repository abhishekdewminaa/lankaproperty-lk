export type PropertyPurpose = 'buy' | 'rent' | 'land';
export type PropertyType = 'house' | 'apartment' | 'land' | 'commercial';
export type PriceUnit = 'total' | 'month' | 'perch';
export type ListingStatus = 'available' | 'reserved' | 'sold';

export interface PropertySpecs {
  bedrooms?: number;
  bathrooms?: number;
  floorAreaSqFt?: number;
  landPerches?: number;
  landAcres?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  landExtentPerches?: number;
  furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  parkingSpaces?: number;
  yearBuilt?: number;
}

export interface PropertyLocation {
  address: string;
  city: string;
  district: string;
  province: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    isApproximate: boolean;
    lat?: number;
    lng?: number;
  };
}

export interface PropertyAgent {
  name: string;
  role: string;
  phone: string;
  whatsapp: string;
}

export interface Property {
  id: string;
  slug: string;
  title: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  priceLkr: number;
  priceUnit: PriceUnit;
  status: ListingStatus;
  isFeatured?: boolean;
  isSignature?: boolean;
  isUrgent?: boolean;
  isTrending?: boolean;
  trendingVelocityText?: string;
  promotionalPlacements?: {
    isFeaturedPaid?: boolean;
    isTrendingPaid?: boolean;
    featuredExpiry?: string;
    trendingExpiry?: string;
  };
  nearbyLandmarks?: {
    type: 'school' | 'hospital' | 'transit' | 'location';
    name: string;
    distanceKm: number;
  }[];
  location: PropertyLocation;
  specs: PropertySpecs;
  images: string[];
  floorPlans?: string[];
  description: string;
  additionalInfo?: string;
  materialSpecs?: string;
  videoUrl?: string;
  mapUrl?: string;
  listingRef?: string;
  isNegotiable?: boolean;
  priceOnRequest?: boolean;
  calculationNote?: string;
  packageTier?: 'standard' | 'gold' | 'platinum';
  listedByUserId?: string;
  listedByRole?: 'owner' | 'agent' | 'super_admin';
  listedByName?: string;
  listedByEmail?: string;
  selectedPackageId?: string;
  privateStaffNotes?: string;
  editorialStory?: {
    space: string;
    light: string;
    location: string;
  };
  amenities: string[];
  agent: PropertyAgent;
  publishedDate: string;
  summary?: string;
  listedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterplanUnit {
  id: string;
  code: string;
  title: string;
  type: string;
  status: ListingStatus;
  floorAreaSqFt: number;
  landPerches?: number;
  bedrooms?: number;
  bathrooms?: number;
  priceLkr: number;
  view: string;
  svgPath: string;
  labelPosition: { x: number; y: number };
}

export interface DevelopmentUnitType {
  name: string;
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  startingPriceLkr: number;
  availableCount: number;
}

export interface Development {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  projectType: string;
  status: 'Under Construction' | 'Pre-Launch' | 'Completed' | 'Ready for Occupancy' | 'Selling Fast';
  location: PropertyLocation;
  description: string;
  architecturalStory: string;
  coverImage: string;
  gallery: string[];
  floorPlans?: string[];
  startingPriceLkr: number;
  completionDate: string;
  totalUnits: number;
  amenities: string[];
  unitTypes: DevelopmentUnitType[];
  masterplan?: {
    title: string;
    subtext: string;
    viewBox: string;
    units: MasterplanUnit[];
  };
  faqs: { question: string; answer: string }[];
}

export interface PropertyFilters {
  purpose?: string;
  district?: string;
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnishing?: string;
  searchQuery?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
  featured?: boolean | string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface InquiryFormData {
  name: string;
  phone: string;
  email?: string;
  message: string;
  propertyContext?: string;
  propertyId?: string;
  preferredChannel?: 'phone' | 'whatsapp' | 'email';
}
