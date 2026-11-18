import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { PropertyPurpose, PropertyType, PriceUnit } from '../types/property';
import { propertyService } from '../services/propertyService';
import { useCurrency } from '../context/CurrencyContext';
import { SRI_LANKA_DISTRICTS, getCitiesForDistrict } from '../data/locations';
import { AdminPropertyRecord } from '../admin/types/admin';
import { userPortalService } from '../services/userPortalService';
import { compressImagesBatch, formatBytes } from '../utils/imageCompressor';
import { uploadBatchPropertyPhotosToHostinger } from '../services/mediaStorageService';
import { advertisingPackageService, AdvertisedPackage } from '../services/advertisingPackageService';
import { ensureValidUUID } from '../services/propertyService';

interface ListingDraft {
  purpose: PropertyPurpose;
  type: PropertyType;
  title: string;
  address: string;
  city: string;
  district: string;
  province: string;
  bedrooms: string;
  bathrooms: string;
  floorArea: string;
  landPerches: string;
  furnishing: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished';
  parking: string;
  price: string;
  priceUnit: PriceUnit;
  description: string;
  amenities: string[];
  photos: string[];
  packageId: string;
  selectedAddons: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  whatsappAvailable: boolean;
  advertiserRole: 'Direct Owner' | 'Licensed Broker' | 'Property Developer';
}

const AVAILABLE_AMENITIES = [
  { category: 'Climate & Energy', items: ['Air Conditioning', 'Solar Hot Water', 'Backup Power Generator', 'Double Glazed Windows'] },
  { category: 'Security & Access', items: ['24/7 Security Patrol', 'Gated Community', 'CCTV Surveillance', 'Video Doorphone / Intercom'] },
  { category: 'Lifestyle & Leisure', items: ['Swimming Pool', 'Rooftop Terrace', 'Landscaped Courtyard', 'Private Gym Pavilion', 'Servant Quarters'] },
  { category: 'Neighborhood & Views', items: ['Ocean / Beachfront View', 'Lake View', 'Mountain / Tea Country View', 'Golf Course Proximity'] },
];

const LOCAL_STORAGE_USER_LISTINGS_KEY = 'lankaproperty_user_listed_ids';

const getPackageHelper = (pkgId: string, packages: AdvertisedPackage[]): AdvertisedPackage => {
  const norm = (pkgId || '').toLowerCase().trim();
  const found = packages.find(
    (p) =>
      p.id === norm ||
      p.id.replace('-package', '') === norm ||
      p.id.replace('starter-', '') === norm
  );
  if (found) return found;
  return packages[0] || {
    id: 'starter-free',
    category: 'direct',
    name: 'Starter Free',
    priceLkr: 0,
    duration: '30 Days',
    description: 'Standard property listing',
    maxPhotos: 5,
    featuredTopSearch: false,
    syndicationWebsitesCount: 1,
    whatsAppButton: false,
    virtualTourEnabled: false,
    verifiedSellerBadge: false,
    features: ['30 Days listing', 'Up to 5 photos'],
    active: true,
  };
};

export function ListPropertyPage() {
  const { searchParams, navigate } = useRouter();
  const { formatPrice, currency } = useCurrency();

  // Read initial package from URL (?package=...)
  const initialPackageFromUrl = searchParams.get('package') || 'platinum';
  const activePortalUser = userPortalService.getCurrentUser();

  // Wizard active section / step
  const [activeStep, setActiveStep] = useState<number>(1);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingPhotos, setIsCompressingPhotos] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    count: number;
    original: string;
    compressed: string;
    percentSaved: number;
  } | null>(null);
  const [publishedProperty, setPublishedProperty] = useState<AdminPropertyRecord | null>(null);
  const [showMyListingsModal, setShowMyListingsModal] = useState(false);
  const [myListedProperties, setMyListedProperties] = useState<AdminPropertyRecord[]>([]);

  // Draft form state
  const [draft, setDraft] = useState<ListingDraft>({
    purpose: 'buy',
    type: 'house',
    title: '',
    address: '',
    city: 'Colombo 07 (Cinnamon Gardens)',
    district: activePortalUser?.district || 'Colombo',
    province: 'Western Province',
    bedrooms: '4',
    bathrooms: '4',
    floorArea: '3800',
    landPerches: '18',
    furnishing: 'Fully Furnished',
    parking: '3',
    price: '165000000',
    priceUnit: 'total',
    description: 'Distinctive tropical modernist residence featuring soaring double-height ceilings, central reflective courtyard, imported Italian marble flooring, and private swimming pavilion.',
    amenities: ['Air Conditioning', 'Solar Hot Water', '24/7 Security Patrol', 'Swimming Pool', 'Landscaped Courtyard'],
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    ],
    packageId: activePortalUser?.activePackageId || initialPackageFromUrl,
    selectedAddons: [],
    contactName: activePortalUser?.name || '',
    contactPhone: activePortalUser?.phone || '',
    contactEmail: activePortalUser?.email || '',
    whatsappAvailable: true,
    advertiserRole: activePortalUser?.role === 'agent' ? 'Licensed Broker' : 'Direct Owner',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Dynamic Advertised Packages & Addons from Super Admin
  const [availablePackages, setAvailablePackages] = useState<AdvertisedPackage[]>(() =>
    advertisingPackageService.getAllPackages()
  );
  const [availableAddons, setAvailableAddons] = useState(() =>
    advertisingPackageService.getAllAddOns()
  );

  useEffect(() => {
    const unsub = advertisingPackageService.subscribe(() => {
      setAvailablePackages(advertisingPackageService.getAllPackages());
      setAvailableAddons(advertisingPackageService.getAllAddOns());
    });
    return () => unsub();
  }, []);

  // Sync package if URL changes
  useEffect(() => {
    const pkg = searchParams.get('package');
    if (pkg && availablePackages.some((p) => p.id === pkg || p.id.replace('-package', '') === pkg || p.id.replace('starter-', '') === pkg)) {
      setDraft((prev) => ({ ...prev, packageId: pkg }));
    }
  }, [searchParams, availablePackages]);

  // Load user's previously listed properties in this browser
  useEffect(() => {
    const updateMyListings = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_LISTINGS_KEY);
        if (stored) {
          const ids: string[] = JSON.parse(stored);
          if (Array.isArray(ids) && ids.length > 0) {
            const all = propertyService.getAllAuthoritativeProperties();
            const userProps = all.filter((p) => ids.includes(p.id));
            setMyListedProperties(userProps);
          }
        }
      } catch {
        // ignore
      }
    };

    updateMyListings();
    const unsub = propertyService.subscribe(updateMyListings);
    return () => unsub();
  }, [publishedProperty]);

  const isLand = draft.purpose === 'land' || draft.type === 'land';

  // Cascading cities for selected district
  const availableCities = useMemo(() => {
    return getCitiesForDistrict(draft.district);
  }, [draft.district]);

  const handleDistrictChange = (districtName: string) => {
    const matched = SRI_LANKA_DISTRICTS.find(
      (d) => d.district.toLowerCase() === districtName.toLowerCase()
    );
    const cities = getCitiesForDistrict(districtName);
    setDraft({
      ...draft,
      district: districtName,
      province: matched ? matched.province : 'Western Province',
      city: cities[0] || '',
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    setDraft((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddPhoto = () => {
    if (!customPhotoUrl.trim()) return;
    if (draft.photos.length >= 20) {
      alert('Maximum 20 photos allowed per listing.');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      photos: [...prev.photos, customPhotoUrl.trim()],
    }));
    setCustomPhotoUrl('');
  };

  const handleAddSamplePhotos = () => {
    const samplePool = [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
    ];
    const availableSlots = 20 - draft.photos.length;
    if (availableSlots <= 0) {
      alert('Maximum 20 photos reached.');
      return;
    }
    const toAdd = samplePool.slice(0, Math.min(availableSlots, 4));
    setDraft((prev) => ({
      ...prev,
      photos: [...prev.photos, ...toAdd],
    }));
  };

  const handleFileCompressionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 20 - draft.photos.length;
    if (availableSlots <= 0) {
      alert('Maximum 20 photos allowed per listing.');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    setIsCompressingPhotos(true);
    setCompressionStats(null);

    try {
      const summary = await compressImagesBatch(selectedFiles, 1280, 0.65);
      const rawUrls = summary.results.map((r) => r.dataUrl);
      const hostedUrls = await uploadBatchPropertyPhotosToHostinger(rawUrls);

      setDraft((prev) => ({
        ...prev,
        photos: [...prev.photos, ...hostedUrls],
      }));

      setCompressionStats({
        count: summary.results.length,
        original: formatBytes(summary.totalOriginalBytes),
        compressed: formatBytes(summary.totalCompressedBytes),
        percentSaved: summary.overallPercentSaved,
      });
    } catch (err: any) {
      alert(`Image compression failed: ${err.message || 'Please choose valid image files.'}`);
    } finally {
      setIsCompressingPhotos(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSetCoverPhoto = (index: number) => {
    if (index === 0) return;
    setDraft((prev) => {
      const selected = prev.photos[index];
      const rest = prev.photos.filter((_, i) => i !== index);
      return {
        ...prev,
        photos: [selected, ...rest],
      };
    });
  };

  const handleDescriptionPreset = (type: string) => {
    if (type === 'villa') {
      setDraft((prev) => ({
        ...prev,
        title: 'Tropical Modernist Villa with Private Pool & Courtyard',
        type: 'house',
        description: 'Bespoke architect-designed tropical modern villa with soaring 18ft ceilings, central reflective pool, imported terrazzo finishes, expansive master suite with outdoor rain shower, and rooftop entertainment terrace.',
      }));
    } else if (type === 'land') {
      setDraft((prev) => ({
        ...prev,
        title: 'Prime Freehold Residential Land Plot with Broad Road Frontage',
        type: 'land',
        purpose: 'land',
        priceUnit: 'perch',
        price: '3200000',
        landPerches: '25',
        description: 'Exceptional rectangular high-elevation residential land parcel situated in an exclusive private enclave. Clear freehold deeds, statutory municipal approval, 20ft carpeted road access, 3-phase electricity, and pipe-borne water.',
      }));
    } else if (type === 'apartment') {
      setDraft((prev) => ({
        ...prev,
        title: 'High-Floor Luxury Condominium with Panoramic Ocean Panorama',
        type: 'apartment',
        bedrooms: '3',
        bathrooms: '3',
        floorArea: '2250',
        description: 'Prestigious waterfront condominium on a prime high floor offering unobstructed Indian Ocean and port city vistas. Designer kitchen with integrated German appliances, smart home automation, and dedicated dual parking.',
      }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!draft.title.trim()) errors.title = 'Listing title or architectural headline is required.';
    if (!draft.address.trim()) errors.address = 'Street address or plot location is required.';
    if (!draft.price || Number(draft.price) <= 0) errors.price = 'Valid asking valuation is required.';
    if (draft.photos.length === 0) errors.photos = 'Please provide at least 1 property photograph.';
    if (!draft.contactName.trim()) errors.contactName = 'Your name or representative name is required.';
    if (!draft.contactPhone.trim() || draft.contactPhone.length < 8) errors.contactPhone = 'Valid WhatsApp or contact phone number is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePublishProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please complete the required fields highlighted in red.');
      return;
    }

    setIsSubmitting(true);

    const generatedId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : ensureValidUUID(`prop-${Date.now()}`);
    const districtPrefix = (draft.district || 'COL').slice(0, 3).toUpperCase();
    const generatedRef = `LP-${districtPrefix}-2026-${Date.now().toString().slice(-4)}`;
    const baseSlug = draft.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `property-${Date.now()}`;
    const generatedSlug = `${baseSlug}-${Date.now().toString().slice(-3)}`;

    const selectedPkg = getPackageHelper(draft.packageId, availablePackages);

    const isFeaturedPaid =
      draft.selectedAddons.includes('addon-featured-placement') ||
      draft.selectedAddons.includes('addon-omni-boost') ||
      selectedPkg.featuredTopSearch ||
      selectedPkg.id.includes('platinum') ||
      selectedPkg.id.includes('diamond');

    const isTrendingPaid =
      draft.selectedAddons.includes('addon-trending-placement') ||
      draft.selectedAddons.includes('addon-omni-boost');

    const collections: ('featured' | 'trending' | 'architectural' | 'land' | 'signature')[] = [];
    if (isFeaturedPaid) collections.push('featured');
    if (isTrendingPaid) collections.push('trending');
    if (selectedPkg.featuredTopSearch) collections.push('architectural');
    if (draft.purpose === 'land' || draft.type === 'land') collections.push('land');
    if (selectedPkg.id.includes('diamond')) collections.push('signature');

    const newRecord: AdminPropertyRecord = {
      id: generatedId,
      slug: generatedSlug,
      title: draft.title,
      purpose: draft.purpose,
      type: draft.type,
      priceLkr: Number(draft.price) || 0,
      priceUnit: draft.priceUnit,
      status: 'available',
      // Published immediately so the user's property is live on the site!
      publicationStatus: 'published',
      listingRef: generatedRef,
      isFeatured: isFeaturedPaid,
      isTrending: isTrendingPaid,
      trendingVelocityText: isTrendingPaid ? 'High Inquiry Velocity (New Verified Listing)' : undefined,
      promotionalPlacements: {
        isFeaturedPaid,
        isTrendingPaid,
        featuredExpiry: isFeaturedPaid ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined,
        trendingExpiry: isTrendingPaid ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined,
      },
      isSignature: selectedPkg.id.includes('diamond'),
      packageTier: selectedPkg.id.includes('diamond') ? 'platinum' : selectedPkg.id.includes('platinum') ? 'platinum' : selectedPkg.id.includes('premium') || selectedPkg.id.includes('gold') ? 'gold' : 'standard',
      collections,
      viewCount: 1,
      inquiryCount: 0,
      saveCount: 0,
      lastModifiedBy: draft.contactName || 'Owner Listing Desk',
      lastModifiedAt: new Date().toLocaleString(),
      recordVersion: 1,
      location: {
        address: draft.address,
        city: draft.city,
        district: draft.district,
        province: draft.province,
      },
      specs: {
        bedrooms: isLand ? undefined : Number(draft.bedrooms) || 0,
        bathrooms: isLand ? undefined : Number(draft.bathrooms) || 0,
        floorAreaSqFt: Number(draft.floorArea) || undefined,
        landPerches: Number(draft.landPerches) || undefined,
        furnishing: isLand ? undefined : draft.furnishing,
        parkingSpaces: isLand ? undefined : Number(draft.parking) || undefined,
      },
      images: draft.photos.length > 0 ? draft.photos : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
      ],
      description: draft.description,
      amenities: draft.amenities,
      agent: {
        name: draft.contactName || 'Property Owner',
        role: draft.advertiserRole,
        phone: draft.contactPhone || '+94 77 123 4567',
        whatsapp: (draft.contactPhone || '94771234567').replace(/[^0-9]/g, ''),
      },
      publishedDate: new Date().toISOString().split('T')[0],
    };

    try {
      const res = propertyService.saveProperty(newRecord);
      setPublishedProperty(res.property);

      // Save ID to local storage of user listings
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_LISTINGS_KEY);
        const ids: string[] = stored ? JSON.parse(stored) : [];
        if (!ids.includes(res.property.id)) {
          localStorage.setItem(LOCAL_STORAGE_USER_LISTINGS_KEY, JSON.stringify([res.property.id, ...ids]));
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error saving property:', err);
      setPublishedProperty(newRecord);
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const selectedPkgConfig = getPackageHelper(draft.packageId, availablePackages);

  // ==========================================
  // RENDER SUCCESS PUBLISHED SCREEN
  // ==========================================
  if (publishedProperty) {
    return (
      <div className="bg-[#FAFBF9] min-h-screen py-16">
        <div className="max-w-3xl mx-auto px-5">
          <div className="bg-white border-2 border-[#176B45] rounded-[2px] p-8 md:p-12 shadow-lg text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8F3EC] text-[#103D2C] text-xs font-bold uppercase tracking-widest rounded-[2px] border border-[#176B45]">
              <span>✓</span>
              <span>Listing Published Live On LankaProperty.lk</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[#103D2C] tracking-tight">
              Congratulations! Your Property Is Officially Live
            </h1>

            <p className="text-sm md:text-base text-[#5F6B63] max-w-xl mx-auto leading-relaxed">
              Your property has been indexed in the live marketplace and is now discoverable across <strong>{publishedProperty.location.district}</strong> and all 25 district directories.
            </p>

            {/* Published Property Snapshot Card */}
            <div className="bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] p-5 text-left flex flex-col sm:flex-row gap-5 items-center">
              <img
                src={publishedProperty.images[0]}
                alt={publishedProperty.title}
                className="w-full sm:w-44 h-32 object-cover rounded-[2px] border border-[#DDE5DF]"
              />
              <div className="space-y-1.5 flex-1 w-full">
                <div className="flex items-center justify-between text-xs text-[#5F6B63]">
                  <span className="font-bold text-[#176B45] uppercase">{publishedProperty.listingRef}</span>
                  <span className="px-2 py-0.5 bg-[#103D2C] text-white font-bold text-[10px] uppercase rounded-[2px]">
                    {selectedPkgConfig.name}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#103D2C] leading-snug line-clamp-1">
                  {publishedProperty.title}
                </h3>
                <div className="text-sm font-extrabold text-[#18251E]">
                  {formatPrice(publishedProperty.priceLkr)} {publishedProperty.priceUnit !== 'total' && `/${publishedProperty.priceUnit}`}
                </div>
                <div className="text-xs text-[#5F6B63]">
                  {publishedProperty.location.city}, {publishedProperty.location.district} · {publishedProperty.images.length} Photos Attached
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(`/properties/${publishedProperty.slug}`)}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#176B45] hover:bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-md"
              >
                View Your Live Listing
              </button>
              <button
                onClick={() => {
                  setPublishedProperty(null);
                  setDraft((prev) => ({
                    ...prev,
                    title: '',
                    address: '',
                    price: '',
                  }));
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#DDE5DF] hover:bg-[#F5F8F5] text-[#103D2C] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
              >
                List Another Property
              </button>
              <button
                onClick={() => navigate('/properties')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#DDE5DF] hover:bg-[#F5F8F5] text-[#5F6B63] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
              >
                Browse Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN LISTING FORM
  // ==========================================
  return (
    <div className="bg-[#FAFBF9] min-h-screen text-[#18251E] pb-24">
      {/* Header Stepper Navigation */}
      <div className="w-full bg-white border-b border-[#DDE5DF] py-4 sticky top-[72px] z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#176B45]">
              Seller Portal
            </span>
            <span className="text-xs text-[#A3B8AD]">/</span>
            <span className="text-sm font-bold text-[#103D2C]">Post Your Property Listing</span>
          </div>

          <div className="flex items-center gap-3">
            {myListedProperties.length > 0 && (
              <button
                onClick={() => setShowMyListingsModal(true)}
                className="text-xs font-bold text-[#176B45] bg-[#E8F3EC] hover:bg-[#d4e8db] px-3 py-1.5 rounded-[2px] border border-[#176B45]/30 cursor-pointer transition-colors"
              >
                Your Listed Properties ({myListedProperties.length})
              </button>
            )}
            <div className="text-[11px] font-semibold text-[#5F6B63]">
              Up to <strong className="text-[#103D2C]">20 Ultra-HD Photos</strong> supported
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-8 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================== */}
          {/* LEFT COLUMN: THE COMPLETE PROPERTY FORM   */}
          {/* ========================================== */}
          <div className="lg:col-span-8 space-y-6">

            {/* SECTION 1: WHAT TYPE OF PROPERTY ARE YOU LISTING? */}
            <div className="bg-white border border-[#DDE5DF] p-6 md:p-8 rounded-[4px] space-y-5">
              <div className="border-b border-[#DDE5DF] pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">Step 1 of 5</span>
                <h2 className="text-lg md:text-xl font-bold text-[#103D2C] tracking-tight">
                  Property Category & Listing Type
                </h2>
                <p className="text-xs text-[#5F6B63]">Select the property category and whether it is for sale or rent.</p>
              </div>

              {/* Property Category Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'land', label: 'Land', sub: 'Residential, agricultural & beach plots' },
                  { id: 'house', label: 'House', sub: 'Standalone houses, villas & bungalows' },
                  { id: 'apartment', label: 'Apartment', sub: 'Condominiums & luxury suites' },
                  { id: 'hotel', label: 'Hotel', sub: 'Boutique hotels, resorts & guesthouses' },
                  { id: 'business', label: 'Business', sub: 'Commercial & enterprise units' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      const newType = item.id as PropertyType;
                      setDraft((prev) => ({
                        ...prev,
                        type: newType,
                        purpose: newType === 'land' ? 'land' : prev.purpose === 'land' ? 'buy' : prev.purpose,
                      }));
                    }}
                    className={`p-4 border rounded-[2px] text-left transition-all cursor-pointer ${
                      draft.type === item.id
                        ? 'bg-[#103D2C] text-white border-[#103D2C] shadow-xs'
                        : 'bg-[#FAFBF9] text-[#18251E] border-[#DDE5DF] hover:border-[#176B45]'
                    }`}
                  >
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className={`text-[11px] mt-1 ${draft.type === item.id ? 'text-[#E8F3EC]' : 'text-[#5F6B63]'}`}>
                      {item.sub}
                    </div>
                  </button>
                ))}
              </div>

              {/* Transaction Purpose */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-2">
                  Transaction Purpose:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'buy', label: 'For Sale (Freehold)' },
                    { id: 'rent', label: 'For Rent (Long-Term)' },
                    { id: 'land', label: 'Residential / Beach Land' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setDraft({ ...draft, purpose: p.id as PropertyPurpose })}
                      className={`py-2 px-3 text-xs font-semibold rounded-[2px] border text-center transition-colors cursor-pointer ${
                        draft.purpose === p.id
                          ? 'bg-[#176B45] text-white border-[#176B45]'
                          : 'bg-[#FAFBF9] text-[#18251E] border-[#DDE5DF] hover:border-[#176B45]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: CORE LISTING SPECIFICATIONS & VALUATION */}
            <div className="bg-white border border-[#DDE5DF] p-6 md:p-8 rounded-[2px] shadow-xs space-y-5">
              <div className="border-b border-[#DDE5DF] pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#176B45]">STEP 2 OF 5</span>
                <h2 className="text-lg md:text-xl font-bold text-[#103D2C] tracking-tight">
                  Core Listing Specifications
                </h2>
                <p className="text-xs text-[#5F6B63]">Headline, asking valuation in LKR, and spatial dimensions.</p>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                  Property Title / Architectural Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modernist Courtyard Villa with Lap Pool, Cinnamon Gardens"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className={`w-full px-4 py-2.5 text-xs md:text-sm bg-[#FAFBF9] border rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white transition-colors ${
                    formErrors.title ? 'border-[#C93636]' : 'border-[#DDE5DF]'
                  }`}
                />
                {formErrors.title && <p className="text-[11px] text-[#C93636] mt-1">{formErrors.title}</p>}
              </div>

              {/* Price & Price Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                    Asking Price (in Sri Lankan Rupees - LKR) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 165000000"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    className={`w-full px-4 py-2.5 text-xs md:text-sm bg-[#FAFBF9] border rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white ${
                      formErrors.price ? 'border-[#C93636]' : 'border-[#DDE5DF]'
                    }`}
                  />
                  {/* Live Currency Equivalency Display */}
                  {draft.price && Number(draft.price) > 0 && (
                    <div className="mt-1.5 text-xs text-[#176B45] font-semibold flex items-center gap-2">
                      <span>Equivalency:</span>
                      <span className="font-bold">{formatPrice(Number(draft.price))}</span>
                      <span className="text-[#5F6B63]">(Rs. {Number(draft.price).toLocaleString('en-US')} LKR)</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                    Price Unit
                  </label>
                  <select
                    value={draft.priceUnit}
                    onChange={(e) => setDraft({ ...draft, priceUnit: e.target.value as PriceUnit })}
                    className="w-full px-3 py-2.5 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white font-medium cursor-pointer"
                  >
                    <option value="total">Total Price (Full Asset)</option>
                    <option value="perch">Price Per Perch (Land)</option>
                    <option value="month">Per Month (Rent)</option>
                  </select>
                </div>
              </div>

              {/* Physical Dimensions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                    Land (Perches)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 20"
                    value={draft.landPerches}
                    onChange={(e) => setDraft({ ...draft, landPerches: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                {!isLand && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                      Floor Area (Sq Ft)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 3800"
                      value={draft.floorArea}
                      onChange={(e) => setDraft({ ...draft, floorArea: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                )}

                {!isLand && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                      Bedrooms
                    </label>
                    <select
                      value={draft.bedrooms}
                      onChange={(e) => setDraft({ ...draft, bedrooms: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>{n} Bedrooms</option>
                      ))}
                    </select>
                  </div>
                )}

                {!isLand && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                      Bathrooms
                    </label>
                    <select
                      value={draft.bathrooms}
                      onChange={(e) => setDraft({ ...draft, bathrooms: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} Bathrooms</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Furnishing & Parking */}
              {!isLand && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                      Furnishing Status
                    </label>
                    <select
                      value={draft.furnishing}
                      onChange={(e) => setDraft({ ...draft, furnishing: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                    >
                      <option value="Fully Furnished">Fully Furnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Unfurnished">Unfurnished</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1">
                      Covered Parking Spaces
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2"
                      value={draft.parking}
                      onChange={(e) => setDraft({ ...draft, parking: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                    />
                  </div>
                </div>
              )}

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                  Detailed Architectural Description *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the layout, architectural pedigree, floor materials, natural light, joinery, and boundary walls..."
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45] focus:bg-white resize-y"
                />
              </div>
            </div>

            {/* SECTION 3: LOCATION & FEATURES */}
            <div className="bg-white border border-[#DDE5DF] p-6 md:p-8 rounded-[4px] space-y-6">
              <div className="border-b border-[#DDE5DF] pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">Step 3 of 5</span>
                <h2 className="text-lg md:text-xl font-bold text-[#103D2C] tracking-tight">
                  Property Location & Features
                </h2>
                <p className="text-xs text-[#5F6B63]">Select your district, city, street address, and property amenities.</p>
              </div>

              {/* District & City Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                    District *
                  </label>
                  <select
                    value={draft.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] focus:outline-none focus:border-[#103D2C] font-semibold cursor-pointer"
                  >
                    {SRI_LANKA_DISTRICTS.map((dist) => (
                      <option key={dist.district} value={dist.district}>
                        {dist.district} ({dist.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                    City / Town *
                  </label>
                  <select
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] focus:outline-none focus:border-[#103D2C] font-semibold cursor-pointer"
                  >
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Road / Street Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                  Street Address / Road Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 42 Alfred House Gardens, Off Galle Road"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  className={`w-full px-4 py-2.5 text-xs bg-[#FAFBF9] border rounded-[3px] focus:outline-none focus:border-[#103D2C] ${
                    formErrors.address ? 'border-[#C93636]' : 'border-[#DDE5DF]'
                  }`}
                />
                {formErrors.address && <p className="text-[11px] text-[#C93636] mt-1">{formErrors.address}</p>}
              </div>

              {/* Amenities Grid */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-3">
                  Property Features & Amenities
                </label>
                <div className="space-y-4">
                  {AVAILABLE_AMENITIES.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">
                        {group.category}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.items.map((amenity) => {
                          const isChecked = draft.amenities.includes(amenity);
                          return (
                            <button
                              type="button"
                              key={amenity}
                              onClick={() => handleAmenityToggle(amenity)}
                              className={`p-2.5 text-xs text-left rounded-[3px] border transition-colors flex items-center justify-between cursor-pointer ${
                                isChecked
                                  ? 'bg-[#E8F3EC] border-[#103D2C] text-[#103D2C] font-bold'
                                  : 'bg-[#FAFBF9] border-[#DDE5DF] text-[#18251E] hover:border-[#103D2C]'
                              }`}
                            >
                              <span className="truncate">{amenity}</span>
                              <span className="text-[10px] uppercase font-bold ml-1.5 shrink-0">
                                {isChecked ? 'Added' : 'Add'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 4: PROPERTY PHOTOS */}
            <div className="bg-white border border-[#DDE5DF] p-6 md:p-8 rounded-[4px] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#DDE5DF] pb-3 gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">Step 4 of 5</span>
                  <h2 className="text-lg md:text-xl font-bold text-[#103D2C] tracking-tight">
                    Property Photos
                  </h2>
                  <p className="text-xs text-[#5F6B63]">Upload up to 20 photos. Click any photo to set it as the cover image.</p>
                </div>
                <span className="px-2.5 py-1 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] self-start sm:self-auto">
                  {draft.photos.length} / 20 Photos
                </span>
              </div>

              {/* Photo Upload Zone (Automatic Client-Side WebP Compression) */}
              <div className="space-y-3">
                <div className="border-2 border-dashed border-[#176B45]/40 hover:border-[#176B45] bg-[#FAFBF9] hover:bg-[#E8F3EC]/30 rounded-[3px] p-6 text-center transition-colors">
                  <input
                    type="file"
                    id="property-file-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileCompressionUpload}
                    disabled={isCompressingPhotos || draft.photos.length >= 20}
                    className="sr-only"
                  />
                  <label
                    htmlFor="property-file-upload"
                    className={`inline-flex flex-col items-center justify-center cursor-pointer ${
                      isCompressingPhotos || draft.photos.length >= 20 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="text-sm font-bold text-[#103D2C] block">
                      {isCompressingPhotos
                        ? 'Compressing & Uploading Photos...'
                        : 'Select Photos from Device (Up to 20)'}
                    </span>
                    <span className="text-xs text-[#5F6B63] mt-1 block">
                      Automatic Client-Side WebP Compression (Max 1920px · 95% storage savings · 0ms cloud cost)
                    </span>
                  </label>
                </div>

                {/* Compression Result Banner */}
                {compressionStats && (
                  <div className="bg-[#E8F3EC] border border-[#176B45]/30 rounded-[2px] p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#103D2C]">
                      {compressionStats.count} photo{compressionStats.count > 1 ? 's' : ''} compressed: {compressionStats.original} {compressionStats.compressed} ({compressionStats.percentSaved}% bandwidth & storage saved)
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#176B45] bg-white px-2 py-0.5 rounded-[2px]">
                      WebP Optimized
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL (Unsplash, CDN)..."
                    value={customPhotoUrl}
                    onChange={(e) => setCustomPhotoUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-4 py-2 bg-[#176B45] hover:bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                  >
                    Add URL
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSamplePhotos}
                    className="px-4 py-2 bg-[#F5F8F5] border border-[#DDE5DF] hover:bg-[#E8F3EC] text-[#103D2C] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                  >
                    + Add Sample Pack
                  </button>
                </div>
                {formErrors.photos && <p className="text-[11px] text-[#C93636]">{formErrors.photos}</p>}
              </div>

              {/* Photos Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {draft.photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group border border-[#DDE5DF] rounded-[2px] overflow-hidden bg-black/5"
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-24 sm:h-28 object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#103D2C] text-white text-[9px] font-bold uppercase rounded-[2px]">
                        Primary Cover
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCoverPhoto(idx)}
                          className="px-2 py-1 bg-white text-[#103D2C] text-[10px] font-bold uppercase rounded-[2px] cursor-pointer"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="px-2 py-1 bg-[#C93636] text-white text-[10px] font-bold uppercase rounded-[2px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: CHOOSE YOUR LISTING PLAN */}
            <div className="bg-white border border-[#DDE5DF] p-6 md:p-8 rounded-[4px] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#DDE5DF] pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">Step 5 of 5</span>
                  <h2 className="text-lg md:text-xl font-bold text-[#103D2C] tracking-tight">
                    Select a Listing Plan
                  </h2>
                  <p className="text-xs text-[#5F6B63]">Choose a free listing or upgrade for featured visibility.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/advertising-packages')}
                  className="text-xs font-bold text-[#176B45] hover:underline cursor-pointer self-start sm:self-auto"
                >
                  Compare All Plans
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePackages.filter((p) => p.active).map((pkg) => {
                  const isSelected =
                    draft.packageId === pkg.id ||
                    (pkg.id.includes('free') && draft.packageId === 'free') ||
                    (pkg.id.includes('platinum') && draft.packageId === 'platinum') ||
                    (pkg.id.includes('diamond') && draft.packageId === 'diamond') ||
                    (pkg.id.includes('gold') && draft.packageId === 'gold') ||
                    (pkg.id.includes('premium-pro') && draft.packageId === 'premium-pro') ||
                    (pkg.id.includes('elite-pro') && draft.packageId === 'elite-pro');
                  const formattedPrice = pkg.priceLkr === 0 ? 'Free' : formatPrice(pkg.priceLkr);

                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => setDraft({ ...draft, packageId: pkg.id })}
                      className={`p-4 border rounded-[4px] cursor-pointer transition-all text-left flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-[#103D2C] bg-[#E8F3EC]/50 ring-1 ring-[#103D2C]'
                          : 'border-[#DDE5DF] bg-[#FAFBF9] hover:border-[#103D2C]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="text-sm font-bold text-[#103D2C]">{pkg.name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[2px] ${
                            isSelected ? 'bg-[#103D2C] text-white' : 'bg-white border border-[#DDE5DF] text-[#5F6B63]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-[#18251E] tabular-nums">
                          {formattedPrice}
                        </div>
                        <div className="text-[11px] text-[#5F6B63] mt-0.5">
                          {pkg.duration} · Up to {pkg.maxPhotos} photos
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Optional Listing Upgrades */}
              <div className="pt-5 border-t border-[#DDE5DF] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#103D2C]">
                    Optional Visibility Upgrades
                  </h3>
                  <span className="text-xs font-semibold text-[#5F6B63]">
                    {draft.selectedAddons.length} Selected
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      id: 'addon-featured-placement',
                      name: 'Homepage Featured Placement (30 Days)',
                      priceLkr: 12500,
                      description: 'Pin your property to the Featured section on the homepage.',
                    },
                    {
                      id: 'addon-trending-placement',
                      name: 'Trending Listings Placement (30 Days)',
                      priceLkr: 8500,
                      description: 'Include your property in the Latest & Trending listings section.',
                    },
                    {
                      id: 'addon-omni-boost',
                      name: 'Featured + Trending Bundle (Save 15%)',
                      priceLkr: 18000,
                      description: 'Includes both Homepage Featured and Trending placement for 30 days.',
                    },
                  ].map((addon) => {
                    const isSelected = draft.selectedAddons.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => {
                          if (isSelected) {
                            setDraft((prev) => ({
                              ...prev,
                              selectedAddons: prev.selectedAddons.filter((a) => a !== addon.id),
                            }));
                          } else {
                            if (addon.id === 'addon-omni-boost') {
                              setDraft((prev) => ({
                                ...prev,
                                selectedAddons: ['addon-omni-boost'],
                              }));
                            } else {
                              setDraft((prev) => ({
                                ...prev,
                                selectedAddons: [
                                  ...prev.selectedAddons.filter((a) => a !== 'addon-omni-boost'),
                                  addon.id,
                                ],
                              }));
                            }
                          }
                        }}
                        className={`p-3.5 border rounded-[3px] cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'border-[#103D2C] bg-[#E8F3EC]/50'
                            : 'border-[#DDE5DF] bg-[#FAFBF9] hover:border-[#103D2C]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#18251E]">{addon.name}</div>
                          <p className="text-[11px] text-[#5F6B63] mt-0.5">{addon.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-extrabold text-[#103D2C] tabular-nums">
                            +{formatPrice(addon.priceLkr)}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-[2px] border text-[10px] font-bold uppercase ${
                              isSelected
                                ? 'bg-[#103D2C] text-white border-[#103D2C]'
                                : 'bg-white text-[#18251E] border-[#DDE5DF]'
                            }`}
                          >
                            {isSelected ? 'Added' : 'Add'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 6: CONTACT DETAILS FOR INQUIRIES */}
            <div className="bg-white border border-[#DDE5DF] p-6 md:p-8 rounded-[2px] shadow-xs space-y-5">
              <div className="border-b border-[#DDE5DF] pb-3">
                <h2 className="text-lg md:text-xl font-bold text-[#103D2C] tracking-tight">
                  Contact Details for Direct Buyer Inquiries
                </h2>
                <p className="text-xs text-[#5F6B63]">Inquiries will route directly to your WhatsApp and phone number (0% commission).</p>
              </div>

              {/* Advertiser Role */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-2">
                  Your Representation Role:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Direct Owner', 'Licensed Broker', 'Property Developer'].map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setDraft({ ...draft, advertiserRole: role as any })}
                      className={`py-2 px-3 text-xs font-semibold rounded-[2px] border text-center transition-colors cursor-pointer ${
                        draft.advertiserRole === role
                          ? 'bg-[#103D2C] text-white border-[#103D2C]'
                          : 'bg-[#FAFBF9] text-[#18251E] border-[#DDE5DF] hover:border-[#176B45]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roshan Senanayake"
                    value={draft.contactName}
                    onChange={(e) => setDraft({ ...draft, contactName: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs bg-[#FAFBF9] border rounded-[2px] focus:outline-none focus:border-[#176B45] ${
                      formErrors.contactName ? 'border-[#C93636]' : 'border-[#DDE5DF]'
                    }`}
                  />
                  {formErrors.contactName && <p className="text-[11px] text-[#C93636] mt-1">{formErrors.contactName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                    Contact Telephone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={draft.contactPhone}
                    onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-xs bg-[#FAFBF9] border rounded-[2px] focus:outline-none focus:border-[#176B45] ${
                      formErrors.contactPhone ? 'border-[#C93636]' : 'border-[#DDE5DF]'
                    }`}
                  />
                  {formErrors.contactPhone && <p className="text-[11px] text-[#C93636] mt-1">{formErrors.contactPhone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18251E] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="owner@domain.lk"
                    value={draft.contactEmail}
                    onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#176B45]"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#18251E]">
                    <input
                      type="checkbox"
                      checked={draft.whatsappAvailable}
                      onChange={(e) => setDraft({ ...draft, whatsappAvailable: e.target.checked })}
                      className="rounded-[2px] border-[#DDE5DF] text-[#176B45] focus:ring-[#176B45]"
                    />
                    <span>WhatsApp is available on this telephone number</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON (MOBILE & BOTTOM) */}
            <div className="pt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePublishProperty}
                className="w-full py-4 px-8 bg-[#176B45] hover:bg-[#103D2C] active:bg-[#0B2B1F] text-white text-sm font-bold uppercase tracking-widest rounded-[2px] transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Publishing Property Live...' : 'Publish Property Live to Marketplace'}
              </button>
              <p className="text-[11px] text-[#5F6B63] text-center mt-2.5">
                Zero sales commission. Your listing will immediately appear in search and the district cadastre.
              </p>
            </div>

          </div>

          {/* ========================================== */}
          {/* RIGHT COLUMN: STICKY LIVE DOSSIER PREVIEW  */}
          {/* ========================================== */}
          <div className="lg:col-span-4 sticky top-[140px] space-y-5">
            
            {/* Live Listing Summary Dossier Card */}
            <div className="bg-white border border-[#DDE5DF] rounded-[2px] shadow-sm overflow-hidden">
              <div className="p-4 bg-[#FAFBF9] border-b border-[#DDE5DF] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#103D2C]">
                  Live Listing Dossier
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E8F3EC] text-[#176B45] rounded-[2px] uppercase">
                  Real-Time Preview
                </span>
              </div>

              {/* Cover Photo */}
              <div className="relative h-48 bg-black/5">
                {draft.photos.length > 0 ? (
                  <img
                    src={draft.photos[0]}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#5F6B63]">
                    No Cover Image Added
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#103D2C] text-white text-[10px] font-bold uppercase rounded-[2px]">
                  {draft.purpose === 'buy' ? 'For Sale' : draft.purpose === 'rent' ? 'For Rent' : 'Land Plot'}
                </span>
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded-[2px]">
                  {draft.photos.length} Photos
                </span>
              </div>

              {/* Card Meta */}
              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">
                    {draft.city}, {draft.district}
                  </div>
                  <h3 className="text-base font-bold text-[#103D2C] leading-snug line-clamp-2 mt-0.5">
                    {draft.title || 'Untitled Architectural Listing'}
                  </h3>
                </div>

                {/* Valuation */}
                <div className="pt-2 border-t border-[#DDE5DF]">
                  <div className="text-xl font-extrabold text-[#18251E]">
                    {draft.price && Number(draft.price) > 0 ? (
                      <>
                        {formatPrice(Number(draft.price))}
                        {draft.priceUnit !== 'total' && (
                          <span className="text-xs font-normal text-[#5F6B63]"> / {draft.priceUnit}</span>
                        )}
                      </>
                    ) : (
                      'Valuation Pending'
                    )}
                  </div>
                  {draft.price && Number(draft.price) > 0 && currency !== 'LKR' && (
                    <div className="text-[11px] text-[#5F6B63]">
                      Base: Rs. {Number(draft.price).toLocaleString('en-US')} LKR
                    </div>
                  )}
                </div>

                {/* Specs Chips */}
                <div className="pt-2 border-t border-[#DDE5DF] flex flex-wrap gap-2 text-xs text-[#5F6B63]">
                  {!isLand && draft.bedrooms && (
                    <span className="px-2 py-1 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
                      {draft.bedrooms} Beds
                    </span>
                  )}
                  {!isLand && draft.bathrooms && (
                    <span className="px-2 py-1 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
                      {draft.bathrooms} Baths
                    </span>
                  )}
                  {draft.landPerches && (
                    <span className="px-2 py-1 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
                      {draft.landPerches} Perches
                    </span>
                  )}
                  {!isLand && draft.floorArea && (
                    <span className="px-2 py-1 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
                      {draft.floorArea} Sq Ft
                    </span>
                  )}
                </div>

                {/* Amenities counter */}
                {draft.amenities.length > 0 && (
                  <div className="text-xs text-[#5F6B63]">
                    Features: <strong className="text-[#103D2C]">{draft.amenities.length} amenities</strong> selected
                  </div>
                )}
              </div>
            </div>

            {/* Selected Package Callout Box (Green Highlight Box) */}
            <div className="bg-[#103D2C] text-white p-5 rounded-[2px] border border-[#176B45] space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#9FE3B8]">
                ACTIVE PUBLISHING PLAN
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold">{selectedPkgConfig.name}</span>
                <span className="text-sm font-bold text-[#9FE3B8]">
                  {selectedPkgConfig.priceLkr === 0 ? 'FREE' : formatPrice(selectedPkgConfig.priceLkr)}
                </span>
              </div>
              {draft.selectedAddons.length > 0 && (
                <div className="pt-2 border-t border-[#176B45] text-xs space-y-1">
                  <div className="flex justify-between text-[#E8F3EC]">
                    <span>Promotional Upgrades ({draft.selectedAddons.length}):</span>
                    <span className="font-bold text-[#9FE3B8]">
                      +{formatPrice(
                        draft.selectedAddons.reduce((sum, id) => {
                          const addon = availableAddons.find((a) => a.id === id);
                          return (
                            sum +
                            (addon?.priceLkr ||
                              (id === 'addon-featured-placement'
                                ? 12500
                                : id === 'addon-trending-placement'
                                ? 8500
                                : id === 'addon-omni-boost'
                                ? 18000
                                : 0))
                          );
                        }, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-extrabold text-sm pt-1 border-t border-[#176B45]">
                    <span>Total Investment:</span>
                    <span className="text-[#9FE3B8]">
                      {formatPrice(
                        (selectedPkgConfig.priceLkr || 0) +
                          draft.selectedAddons.reduce((sum, id) => {
                            const addon = availableAddons.find((a) => a.id === id);
                            return (
                              sum +
                              (addon?.priceLkr ||
                                (id === 'addon-featured-placement'
                                  ? 12500
                                  : id === 'addon-trending-placement'
                                  ? 8500
                                  : id === 'addon-omni-boost'
                                  ? 18000
                                  : 0))
                            );
                          }, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-[#E8F3EC] leading-relaxed">
                {selectedPkgConfig.description}. Includes duration of <strong>{selectedPkgConfig.duration}</strong> and support for up to <strong>{selectedPkgConfig.maxPhotos} Ultra-HD photographs</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('step-packages');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[11px] text-[#9FE3B8] underline hover:text-white font-bold block pt-1 cursor-pointer"
              >
                Change Publishing Plan
              </button>
            </div>

            {/* Sticky Publish Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublishProperty}
              className="w-full py-3.5 px-4 bg-[#C93636] hover:bg-[#A92828] active:bg-[#8F2020] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-md disabled:opacity-50 text-center block"
            >
              {isSubmitting ? 'Publishing Property...' : 'Publish Property Live'}
            </button>

            {/* Trust Assurances */}
            <div className="bg-white border border-[#DDE5DF] p-4 rounded-[2px] text-xs text-[#5F6B63] space-y-2">
              <div className="font-bold text-[#103D2C]">LankaProperty.lk Guarantee:</div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#176B45] font-bold">✓</span>
                <span>Zero sales commission cuts on standard sales.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#176B45] font-bold">✓</span>
                <span>Indexed across all 25 Sri Lanka Districts.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-[#176B45] font-bold">✓</span>
                <span>Direct WhatsApp & phone lead routing.</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================== */}
      {/* MY LISTED PROPERTIES MODAL                 */}
      {/* ========================================== */}
      {showMyListingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-[#DDE5DF] rounded-[2px] max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <h3 className="text-lg font-bold text-[#103D2C]">
                Your Listed Properties ({myListedProperties.length})
              </h3>
              <button
                onClick={() => setShowMyListingsModal(false)}
                className="text-xs font-bold px-2.5 py-1 bg-[#FAFBF9] border border-[#DDE5DF] hover:bg-[#E8F3EC] rounded-[2px]"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {myListedProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="p-4 border border-[#DDE5DF] rounded-[2px] flex items-center justify-between gap-4 bg-[#FAFBF9]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-16 h-14 object-cover rounded-[2px]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#103D2C]">{prop.title}</div>
                      <div className="text-[11px] text-[#5F6B63]">{prop.location.city}, {prop.location.district}</div>
                      <div className="text-xs font-extrabold text-[#18251E] mt-0.5">
                        {formatPrice(prop.priceLkr)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowMyListingsModal(false);
                      navigate(`/properties/${prop.slug}`);
                    }}
                    className="px-3 py-1.5 bg-[#176B45] text-white text-xs font-bold uppercase rounded-[2px] hover:bg-[#103D2C] shrink-0"
                  >
                    View Live
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
