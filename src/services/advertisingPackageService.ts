export interface AdvertisedPackage {
  id: string;
  category: 'direct' | 'strategic';
  name: string;
  badge?: string;
  badgeColor?: string;
  priceLkr: number;
  duration: string;
  description: string;
  maxPhotos: number;
  featuredTopSearch: boolean;
  syndicationWebsitesCount: number;
  whatsAppButton: boolean;
  virtualTourEnabled: boolean;
  verifiedSellerBadge: boolean;
  features: string[];
  active: boolean;
  popular?: boolean;
}

export interface AdvertisingAddOn {
  id: string;
  name: string;
  category: 'visibility' | 'media' | 'syndication' | 'verification';
  priceLkr: number;
  billingType: 'one-time' | 'monthly' | 'per-blast';
  description: string;
  badge?: string;
  badgeColor?: string;
  active: boolean;
  popular?: boolean;
}

const STORAGE_KEY_PACKAGES = 'lankaproperty_advertised_packages_v3';
const STORAGE_KEY_ADDONS = 'lankaproperty_advertised_addons_v2';

export const DEFAULT_PACKAGES: AdvertisedPackage[] = [
  // Direct Publishing Plans (Quick Self-Service)
  {
    id: 'starter-free',
    category: 'direct',
    name: 'Starter Free',
    priceLkr: 0,
    duration: '30 Days Duration',
    description: 'Standard property listing to test the marketplace with zero cost.',
    maxPhotos: 5,
    featuredTopSearch: false,
    syndicationWebsitesCount: 1,
    whatsAppButton: false,
    virtualTourEnabled: false,
    verifiedSellerBadge: false,
    active: true,
    features: [
      '30 Days active listing duration',
      'Listed in general property search directory',
      'Up to 5 clear property photographs',
      'Basic district & city cadastral index',
      'Direct buyer messages sent to your email'
    ]
  },
  {
    id: 'premium-pro',
    category: 'direct',
    name: 'Premium Pro',
    badge: 'BEST VALUE',
    badgeColor: '#C93636',
    priceLkr: 4500,
    duration: '60 Days Exposure',
    description: 'Featured position with top 10 visibility and direct WhatsApp buyer calls.',
    maxPhotos: 12,
    featuredTopSearch: true,
    syndicationWebsitesCount: 5,
    whatsAppButton: true,
    virtualTourEnabled: false,
    verifiedSellerBadge: false,
    active: true,
    popular: true,
    features: [
      '60 Days active listing visibility',
      'Top 10 position in district property search',
      'Up to 12 high-resolution photos',
      'Direct WhatsApp chat button for instant buyer leads',
      'Shared across partner social media buyer groups'
    ]
  },
  {
    id: 'elite-pro',
    category: 'direct',
    name: 'Elite Pro',
    badge: 'HIGH EXPOSURE',
    badgeColor: '#103D2C',
    priceLkr: 8500,
    duration: '90 Days Premium',
    description: 'Top-shelf branding, up to 20 photos, verified seller badge, and priority care.',
    maxPhotos: 20,
    featuredTopSearch: true,
    syndicationWebsitesCount: 10,
    whatsAppButton: true,
    virtualTourEnabled: false,
    verifiedSellerBadge: true,
    active: true,
    features: [
      '90 Days extended premium listing duration',
      'Up to 20 high-quality architectural photos',
      'Highlighted listing card with prominent emerald border',
      'Verified Seller badge for trusted buyer interest',
      'Priority customer support 7 days a week'
    ]
  },

  // Strategic Listing Packages (Extended High-Impact Marketing)
  {
    id: 'gold-package',
    category: 'strategic',
    name: 'Gold Package',
    badge: 'ANNUAL VALUE',
    badgeColor: '#B45309',
    priceLkr: 15000,
    duration: '12 Months Duration',
    description: 'Full-year website advertising with active social media promotion.',
    maxPhotos: 20,
    featuredTopSearch: true,
    syndicationWebsitesCount: 10,
    whatsAppButton: true,
    virtualTourEnabled: false,
    verifiedSellerBadge: true,
    active: true,
    features: [
      '12 Months active listing duration (Full Year)',
      'Featured listing rank in all district searches',
      'Up to 20 high-definition property photos',
      'Social media marketing campaign on WhatsApp and Facebook',
      'Direct phone call & WhatsApp forwarding to owner'
    ]
  },
  {
    id: 'platinum-package',
    category: 'strategic',
    name: 'Platinum Package',
    badge: 'MOST POPULAR',
    badgeColor: '#176B45',
    priceLkr: 25000,
    duration: 'Advertised Until Sold',
    description: 'Priority placement advertised until successful settlement with zero time limit.',
    maxPhotos: 20,
    featuredTopSearch: true,
    syndicationWebsitesCount: 10,
    whatsAppButton: true,
    virtualTourEnabled: false,
    verifiedSellerBadge: true,
    active: true,
    popular: true,
    features: [
      'Advertised until your property is sold (no expiry date)',
      'Top ranking in your city and district property search',
      'Featured placement on the LankaProperty homepage',
      'Featured across 10 major partner property portals',
      'Verified Title Deed badge for higher buyer trust'
    ]
  },
  {
    id: 'diamond-package',
    category: 'strategic',
    name: 'Diamond Package',
    badge: 'ULTIMATE EXPOSURE',
    badgeColor: '#C93636',
    priceLkr: 45000,
    duration: 'Advertised Until Sold',
    description: 'The highest exposure tier with homepage top web slider and overseas buyer broadcast.',
    maxPhotos: 20,
    featuredTopSearch: true,
    syndicationWebsitesCount: 10,
    whatsAppButton: true,
    virtualTourEnabled: false,
    verifiedSellerBadge: true,
    active: true,
    features: [
      'Advertised until sold with homepage top web slider',
      'Up to 20 Ultra-HD photos + 4K aerial drone video showcase',
      'Email broadcast to 15,000+ overseas Sri Lankan buyers',
      'Dedicated Senior Property Consultant & legal liaison',
      'Top priority ranking across all searches in Sri Lanka'
    ]
  }
];

export const DEFAULT_ADDONS: AdvertisingAddOn[] = [
  {
    id: 'addon-featured-placement',
    name: 'Homepage Featured Showcase Slot (30 Days)',
    category: 'visibility',
    priceLkr: 12500,
    billingType: 'monthly',
    description: 'Guaranteed top placement in the Homepage Featured Showcase carousel and priority position in district search.',
    badge: 'HOMEPAGE PIN',
    badgeColor: '#103D2C',
    active: true,
    popular: true,
  },
  {
    id: 'addon-trending-placement',
    name: 'Trending Market Velocity Spotlight (30 Days)',
    category: 'visibility',
    priceLkr: 8500,
    billingType: 'monthly',
    description: 'Places your listing in the Homepage Trending Properties section with live buyer inquiry velocity tags.',
    badge: 'HIGH DEMAND',
    badgeColor: '#C93636',
    active: true,
    popular: true,
  },
  {
    id: 'addon-omni-boost',
    name: 'Featured + Trending Omni-Boost Bundle (Save 15%)',
    category: 'visibility',
    priceLkr: 18000,
    billingType: 'monthly',
    description: 'Omni-channel visibility: Homepage Featured Showcase + Trending Market Spotlight + Pinned City Rank.',
    badge: 'MAX REACH',
    badgeColor: '#176B45',
    active: true,
    popular: true,
  },
  {
    id: 'addon-web-slider',
    name: 'Homepage Top Web Slider Banner (990 × 340 px)',
    category: 'visibility',
    priceLkr: 12500,
    billingType: 'monthly',
    description: 'Prominent headline position on the LankaProperty homepage, seen by 100% of marketplace visitors.',
    badge: 'HIGH TRAFFIC',
    badgeColor: '#C93636',
    active: true,
    popular: true,
  },
  {
    id: 'addon-drone-4k',
    name: '4K Aerial Drone & Cinematic Walkthrough',
    category: 'media',
    priceLkr: 18000,
    billingType: 'one-time',
    description: 'Professional drone cinematography and interior steady-cam 4K reel embedded directly into your listing.',
    badge: 'ARCHITECTURAL',
    badgeColor: '#176B45',
    active: true,
    popular: true,
  },
  {
    id: 'addon-deed-verification',
    name: 'Certified Legal Title Deed & Cadastral Seal',
    category: 'verification',
    priceLkr: 6500,
    billingType: 'one-time',
    description: 'Deed due diligence verified by licensed legal counsel, granting verified buyer trust seal (+340% leads).',
    badge: 'TRUST BADGE',
    badgeColor: '#103D2C',
    active: true,
  },
  {
    id: 'addon-social-boost',
    name: 'Targeted Social Media Campaign (WhatsApp, FB, IG)',
    category: 'visibility',
    priceLkr: 7500,
    billingType: 'monthly',
    description: 'Targeted sponsored campaign reaching 50,000+ pre-screened property seekers across Sri Lanka.',
    badge: '50K REACH',
    badgeColor: '#2563EB',
    active: true,
  },
  {
    id: 'addon-diaspora-blast',
    name: 'International Expat Email Broadcast (15,000+ Buyers)',
    category: 'syndication',
    priceLkr: 14000,
    billingType: 'per-blast',
    description: 'Dedicated email dispatch to pre-screened overseas Sri Lankans living in London, Melbourne, Sydney, Dubai & Toronto.',
    badge: 'GLOBAL EXPATS',
    badgeColor: '#7C3AED',
    active: true,
  },
  {
    id: 'addon-top3-pinned',
    name: 'Guaranteed Top-3 Pinned City Rank (Colombo / Kandy / Galle)',
    category: 'visibility',
    priceLkr: 8500,
    billingType: 'monthly',
    description: 'Guaranteed top 3 positioning in your city and district search results for 30 consecutive days.',
    active: true,
  },
  {
    id: 'addon-concierge',
    name: 'Dedicated Senior Broker Desk & WhatsApp Concierge',
    category: 'verification',
    priceLkr: 5000,
    billingType: 'monthly',
    description: 'Professional concierge pre-screens caller inquiries, filters spam, and forwards verified serious buyers.',
    active: true,
  },
  {
    id: 'addon-gazette-wire',
    name: 'Colombo Financial Wire & Diaspora Gazette Syndication',
    category: 'syndication',
    priceLkr: 9500,
    billingType: 'one-time',
    description: 'Syndicated publication across 5 partner financial journals and overseas expat real estate circulars.',
    active: true,
  },
];

type PackageChangeListener = () => void;

class AdvertisingPackageService {
  private listeners: PackageChangeListener[] = [];

  subscribe(listener: PackageChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Package change listener error:', e);
      }
    });
  }

  // ==========================================
  // CORE PACKAGES MANAGEMENT
  // ==========================================

  private getStoredPackages(): AdvertisedPackage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PACKAGES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(DEFAULT_PACKAGES));
        return DEFAULT_PACKAGES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PACKAGES;
    }
  }

  private savePackages(packages: AdvertisedPackage[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PACKAGES, JSON.stringify(packages));
      this.notify();
    } catch {
      // Ignore quota errors
    }
  }

  getAllPackages(): AdvertisedPackage[] {
    return this.getStoredPackages();
  }

  getDirectPackages(): AdvertisedPackage[] {
    return this.getStoredPackages().filter((p) => p.category === 'direct' && p.active);
  }

  getStrategicPackages(): AdvertisedPackage[] {
    return this.getStoredPackages().filter((p) => p.category === 'strategic' && p.active);
  }

  getPackageById(id: string): AdvertisedPackage | null {
    const list = this.getStoredPackages();
    const normalized = id.toLowerCase().trim();
    return (
      list.find(
        (p) =>
          p.id === normalized ||
          p.id.replace('-package', '') === normalized ||
          p.id.replace('starter-', '') === normalized
      ) || null
    );
  }

  updatePackage(id: string, updates: Partial<AdvertisedPackage>): boolean {
    const list = this.getStoredPackages();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    list[idx] = {
      ...list[idx],
      ...updates,
    };
    this.savePackages(list);
    return true;
  }

  createPackage(pkg: Omit<AdvertisedPackage, 'id'>): AdvertisedPackage {
    const list = this.getStoredPackages();
    const newPkg: AdvertisedPackage = {
      ...pkg,
      id: `pkg-${Date.now().toString().slice(-6)}`,
    };
    list.push(newPkg);
    this.savePackages(list);
    return newPkg;
  }

  deletePackage(id: string): boolean {
    const list = this.getStoredPackages();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length === list.length) return false;
    this.savePackages(filtered);
    return true;
  }

  resetToDefaults(): AdvertisedPackage[] {
    this.savePackages(DEFAULT_PACKAGES);
    return DEFAULT_PACKAGES;
  }

  // ==========================================
  // ADVERTISING ADD-ONS MANAGEMENT
  // ==========================================

  private getStoredAddOns(): AdvertisingAddOn[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADDONS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_ADDONS, JSON.stringify(DEFAULT_ADDONS));
        return DEFAULT_ADDONS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_ADDONS;
    }
  }

  private saveAddOns(addons: AdvertisingAddOn[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ADDONS, JSON.stringify(addons));
      this.notify();
    } catch {
      // Ignore quota errors
    }
  }

  getAllAddOns(): AdvertisingAddOn[] {
    return this.getStoredAddOns();
  }

  getActiveAddOns(): AdvertisingAddOn[] {
    return this.getStoredAddOns().filter((a) => a.active);
  }

  getAddOnById(id: string): AdvertisingAddOn | null {
    return this.getStoredAddOns().find((a) => a.id === id) || null;
  }

  updateAddOn(id: string, updates: Partial<AdvertisingAddOn>): boolean {
    const list = this.getStoredAddOns();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) return false;

    list[idx] = {
      ...list[idx],
      ...updates,
    };
    this.saveAddOns(list);
    return true;
  }

  createAddOn(addon: Omit<AdvertisingAddOn, 'id'>): AdvertisingAddOn {
    const list = this.getStoredAddOns();
    const newAddOn: AdvertisingAddOn = {
      ...addon,
      id: `addon-${Date.now().toString().slice(-6)}`,
    };
    list.push(newAddOn);
    this.saveAddOns(list);
    return newAddOn;
  }

  deleteAddOn(id: string): boolean {
    const list = this.getStoredAddOns();
    const filtered = list.filter((a) => a.id !== id);
    if (filtered.length === list.length) return false;
    this.saveAddOns(filtered);
    return true;
  }

  resetAddOnsToDefaults(): AdvertisingAddOn[] {
    this.saveAddOns(DEFAULT_ADDONS);
    return DEFAULT_ADDONS;
  }
}

export const advertisingPackageService = new AdvertisingPackageService();
