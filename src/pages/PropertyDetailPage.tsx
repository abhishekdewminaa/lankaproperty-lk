import React, { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { propertyService } from '../services/propertyService';
import { AdminPropertyRecord } from '../admin/types/admin';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { useCurrency } from '../context/CurrencyContext';
import { useCompare } from '../context/CompareContext';
import { AcquisitionCalculator } from '../components/AcquisitionCalculator';
import { MortgageCalculator } from '../components/MortgageCalculator';
import { GalleryLightbox } from '../components/GalleryLightbox';
import { InquiryModal } from '../components/InquiryModal';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

interface PropertyDetailPageProps {
  slug: string;
}

function stripEmojiSlop(input: string): string {
  if (!input) return '';
  return input
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}✔✅✓☑️⭐✨🔥💎📍🏡🏠🏢📞☎️💰💵🏷️🔹🔸▪️▫️►▸→←↗↓]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatCleanReference(property: AdminPropertyRecord): string {
  const ref = property.listingRef || '';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(ref);
  if (ref && !isUuid && ref.length <= 20) {
    return ref.toUpperCase();
  }
  const distCode = (property.location?.district || 'COL').slice(0, 3).toUpperCase();
  const shortCode = (property.id || '1001').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `LP-${distCode}-${shortCode}`;
}

function formatCategoryName(type: string): string {
  switch ((type || '').toLowerCase()) {
    case 'land':
      return 'Land';
    case 'house':
      return 'House';
    case 'apartment':
      return 'Apartment';
    case 'hotel':
      return 'Hotel';
    case 'business':
    case 'commercial':
      return 'Business';
    default:
      return 'Property';
  }
}

function buildCleanContentSections(description?: string, additionalInfo?: string): {
  paragraphs: string[];
  highlights: string[];
} {
  const rawCombined = [description || '', additionalInfo || '']
    .join('\n')
    .replace(/\\n/g, '\n');

  const lines = rawCombined
    .split('\n')
    .map((line) => line.replace(/^#{1,4}\s*/, '').trim())
    .filter(Boolean);

  const seenFingerprints = new Set<string>();
  const paragraphs: string[] = [];
  const highlights: string[] = [];

  for (const rawLine of lines) {
    const isBullet = /^[-•*]|^[✔✅✓☑️🔹🔸▪▫]/.test(rawLine);
    const cleaned = stripEmojiSlop(rawLine.replace(/^[-•*]\s*/, '')).trim();
    if (!cleaned || cleaned.length < 3) continue;

    if (
      /^(property highlights|additional architectural details|key features|luxury living|overview):?$/i.test(
        cleaned
      )
    ) {
      continue;
    }

    const fingerprint = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!fingerprint || seenFingerprints.has(fingerprint)) continue;

    let isRedundantSubstring = false;
    for (const existing of seenFingerprints) {
      if (existing.length > 25 && fingerprint.length > 25) {
        if (existing.includes(fingerprint) || fingerprint.includes(existing)) {
          isRedundantSubstring = true;
          break;
        }
      }
    }
    if (isRedundantSubstring) continue;

    seenFingerprints.add(fingerprint);

    if (isBullet || (cleaned.length < 95 && !cleaned.endsWith('.'))) {
      highlights.push(cleaned);
    } else {
      paragraphs.push(cleaned);
    }
  }

  return { paragraphs, highlights };
}

export function PropertyDetailPage({ slug }: PropertyDetailPageProps) {
  const { navigate, searchParams } = useRouter();
  const { isSaved, toggleSave } = useSavedProperties();
  const { formatPrice, currency } = useCurrency();
  const { isInCompare, addToCompare } = useCompare();
  const isPreviewParam = searchParams.get('preview') === 'true';

  const [property, setProperty] = useState<AdminPropertyRecord | null>(() => {
    return propertyService.findPropertyInMemory(slug);
  });
  const [loading, setLoading] = useState<boolean>(!property);

  useEffect(() => {
    let isCurrent = true;

    const immediate = propertyService.findPropertyInMemory(slug);
    if (immediate) {
      setProperty(immediate);
      setLoading(false);
    }

    const safetyTimer = setTimeout(() => {
      if (isCurrent) {
        const retryLocal = propertyService.findPropertyInMemory(slug);
        if (retryLocal) setProperty(retryLocal);
        setLoading(false);
      }
    }, 4500);

    propertyService
      .getPropertyBySlug(slug, { allowDraft: true })
      .then((fetched) => {
        if (isCurrent) {
          if (fetched) {
            setProperty(fetched);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isCurrent) setLoading(false);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
      });

    const unsub = propertyService.subscribe(() => {
      if (!isCurrent) return;
      const updated = propertyService.findPropertyInMemory(slug);
      if (updated) {
        setProperty(updated);
        setLoading(false);
      }
    });

    return () => {
      isCurrent = false;
      clearTimeout(safetyTimer);
      unsub();
    };
  }, [slug, isPreviewParam]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [compareMessage, setCompareMessage] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'floorplans'>('photos');
  const [activeCalcTab, setActiveCalcTab] = useState<'mortgage' | 'stamp_duty'>('mortgage');

  if (loading && !property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 space-y-3 max-w-md mx-auto">
        <div className="w-8 h-8 border-2 border-[#103D2C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[#18251E]">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
        <span className="text-xs uppercase font-bold tracking-wider text-[#C93636]">
          Property Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
          This listing is no longer available.
        </h1>
        <p className="text-sm text-[#5F6B63]">
          The link may have changed or the property has been sold or removed.
        </p>
        <button
          onClick={() => navigate('/properties')}
          className="px-6 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors hover:bg-[#176B45] cursor-pointer"
        >
          Browse All Properties
        </button>
      </div>
    );
  }

  const isPublished = property.publicationStatus === 'published';
  const showAsDraftPreview = isPreviewParam || !isPublished;

  if (!isPublished && !isPreviewParam) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
        <span className="text-xs uppercase font-bold tracking-wider text-[#C93636]">
          Listing Unavailable
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
          This property listing is not currently published.
        </h1>
        <div className="pt-2">
          <button
            onClick={() => navigate('/properties')}
            className="px-6 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] cursor-pointer"
          >
            Browse Active Properties
          </button>
        </div>
      </div>
    );
  }

  const saved = isSaved(property.id);
  const compared = isInCompare(property.id);
  const cleanTitle = stripEmojiSlop(property.title);
  const cleanRef = formatCleanReference(property);
  const categoryLabel = formatCategoryName(property.type);
  const { paragraphs, highlights } = buildCleanContentSections(
    property.description,
    property.additionalInfo
  );
  const cleanMaterialSpecs = property.materialSpecs ? stripEmojiSlop(property.materialSpecs) : '';

  const locationParts = [
    property.location.address ? stripEmojiSlop(property.location.address) : '',
    property.location.city ? stripEmojiSlop(property.location.city) : '',
    property.location.district ? stripEmojiSlop(property.location.district) : '',
  ].filter(Boolean);
  const uniqueLocationParts: string[] = [];
  for (const part of locationParts) {
    if (!uniqueLocationParts.some((existing) => existing.toLowerCase() === part.toLowerCase())) {
      uniqueLocationParts.push(part);
    }
  }
  const formattedLocation = uniqueLocationParts.join(', ');

  const similarProperties = propertyService
    .getAllAuthoritativeProperties()
    .filter(
      (p) =>
        p.publicationStatus === 'published' &&
        p.id !== property.id &&
        (p.location.district === property.location.district || p.type === property.type)
    )
    .slice(0, 3);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cleanTitle} | LankaProperty.lk`,
          text: `${cleanTitle} in ${property.location.city}, ${property.location.district}`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleShareToWhatsApp = () => {
    const priceText =
      property.priceLkr > 0 ? formatPrice(property.priceLkr, false) : 'Price on Request';
    const specsArr: string[] = [];
    if (property.specs.bedrooms) specsArr.push(`${property.specs.bedrooms} Beds`);
    if (property.specs.bathrooms) specsArr.push(`${property.specs.bathrooms} Baths`);
    if (property.specs.floorAreaSqFt)
      specsArr.push(`${property.specs.floorAreaSqFt.toLocaleString()} sq ft`);
    if (property.specs.landPerches) specsArr.push(`${property.specs.landPerches} Perches`);
    const specsStr = specsArr.length > 0 ? ` | ${specsArr.join(' · ')}` : '';

    const text = encodeURIComponent(
      `*${cleanTitle}*\nLocation: ${formattedLocation}\nPrice: ${priceText}${specsStr}\n\nView Property:\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCompareClick = () => {
    const added = addToCompare(property);
    setCompareMessage(
      added ? 'Added to property comparison (Max 3)' : 'Removed from comparison'
    );
    setTimeout(() => setCompareMessage(null), 3000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${property.agent.name}, I would like to inquire about "${cleanTitle}" (Ref: ${cleanRef}) in ${property.location.city}. Link: ${window.location.href}`
    );
    window.open(
      `https://wa.me/${property.agent.whatsapp.replace(/[^0-9]/g, '')}?text=${text}`,
      '_blank'
    );
  };

  const hasFloorPlans = Boolean(property.floorPlans && property.floorPlans.length > 0);
  const activeGalleryImages =
    activeMediaTab === 'floorplans' && hasFloorPlans
      ? (property.floorPlans as string[])
      : property.images;

  const handleImageFallback = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgEl = e.currentTarget;
    const currentSrc = imgEl.src;
    const filename = currentSrc.split('/').pop() || '';
    const localMirror = `/uploads/properties/${filename}`;
    const defaultArchitecturalFallback =
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

    if (currentSrc.includes('supabase.co') && filename && !imgEl.dataset.triedLocal) {
      imgEl.dataset.triedLocal = 'true';
      imgEl.src = localMirror;
    } else if (currentSrc !== defaultArchitecturalFallback) {
      imgEl.src = defaultArchitecturalFallback;
    }
  };

  const specItems: { label: string; value: string }[] = [];
  if (
    property.type !== 'land' &&
    property.specs.bedrooms !== undefined &&
    property.specs.bedrooms > 0
  ) {
    specItems.push({
      label: 'Bedrooms',
      value: `${property.specs.bedrooms} ${
        property.specs.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'
      }`,
    });
  }
  if (
    property.type !== 'land' &&
    property.specs.bathrooms !== undefined &&
    property.specs.bathrooms > 0
  ) {
    specItems.push({
      label: 'Bathrooms',
      value: `${property.specs.bathrooms} ${
        property.specs.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'
      }`,
    });
  }
  if (property.specs.floorAreaSqFt !== undefined && property.specs.floorAreaSqFt > 0) {
    specItems.push({
      label: 'Floor Area',
      value: `${property.specs.floorAreaSqFt.toLocaleString()} sq ft`,
    });
  }
  if (property.specs.landPerches !== undefined && property.specs.landPerches > 0) {
    specItems.push({
      label: 'Land Area',
      value: `${property.specs.landPerches} Perches`,
    });
  }
  if (property.type !== 'land' && property.specs.furnishing) {
    specItems.push({
      label: 'Furnishing',
      value: property.specs.furnishing,
    });
  }
  if (property.specs.parkingSpaces !== undefined && property.specs.parkingSpaces > 0) {
    specItems.push({
      label: 'Parking',
      value: `${property.specs.parkingSpaces} ${
        property.specs.parkingSpaces === 1 ? 'Space' : 'Spaces'
      }`,
    });
  }
  if (property.specs.yearBuilt) {
    specItems.push({
      label: 'Year Built',
      value: String(property.specs.yearBuilt),
    });
  }

  return (
    <div className="bg-white min-h-screen pb-28 lg:pb-20">
      <SeoHead
        title={`${cleanTitle} in ${property.location.city}, ${property.location.district} | LankaProperty.lk`}
        description={`${
          paragraphs[0] ? paragraphs[0].slice(0, 155) : cleanTitle
        } — Located in ${property.location.city}, ${property.location.district}, Sri Lanka.`}
        canonicalPath={`/properties/${property.slug}`}
        ogImage={property.images[0]}
        ogType="product"
        geoPlacename={`${property.location.city}, ${property.location.district}, Sri Lanka`}
        geoPosition={property.location.coordinates || { lat: 6.9271, lng: 79.8612 }}
        jsonLd={[
          {
            '@type': 'RealEstateListing',
            name: cleanTitle,
            url: `https://lankaproperty.lk/properties/${property.slug}`,
            datePosted: property.publishedDate,
            description: paragraphs[0] || cleanTitle,
            image: property.images,
            offers: {
              '@type': 'Offer',
              price: property.priceLkr,
              priceCurrency: 'LKR',
              availability:
                property.status === 'available'
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            },
            address: {
              '@type': 'PostalAddress',
              streetAddress: property.location.address || property.location.city,
              addressLocality: property.location.city,
              addressRegion: property.location.district,
              addressCountry: 'LK',
            },
          },
        ]}
      />

      {/* Top Breadcrumb Bar */}
      <div className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-3 text-xs text-[#5F6B63]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <button
              onClick={() => navigate('/')}
              className="hover:text-[#18251E] shrink-0 cursor-pointer"
            >
              Home
            </button>
            <span className="text-[#DDE5DF]">/</span>
            <button
              onClick={() => navigate('/properties')}
              className="hover:text-[#18251E] shrink-0 cursor-pointer"
            >
              Properties
            </button>
            <span className="text-[#DDE5DF]">/</span>
            <button
              onClick={() =>
                navigate(`/properties?district=${encodeURIComponent(property.location.district)}`)
              }
              className="hover:text-[#18251E] shrink-0 cursor-pointer"
            >
              {property.location.district}
            </button>
            <span className="text-[#DDE5DF]">/</span>
            <span className="text-[#18251E] font-semibold truncate">{cleanTitle}</span>
          </nav>

          <button
            onClick={() => navigate('/properties')}
            className="hidden sm:inline-block font-bold text-[#103D2C] hover:text-[#176B45] shrink-0 cursor-pointer"
          >
            Back to Listings
          </button>
        </div>
      </div>

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {showAsDraftPreview && (
          <div className="bg-[#103D2C] text-white p-4 rounded-[3px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-black rounded-[2px]">
                Preview Mode
              </span>
              <span className="text-xs sm:text-sm text-[#E8F3EC]">
                Viewing listing in {property.publicationStatus} state.
              </span>
            </div>
            <button
              onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
              className="px-3.5 py-1.5 bg-white text-[#103D2C] hover:bg-[#E8F3EC] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Edit Listing
            </button>
          </div>
        )}

        {/* =========================================================================
            PROPERTY HEADER: TITLE, LOCATION, ASKING PRICE & ACTION BAR
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#DDE5DF]">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px]">
                {property.purpose === 'rent' ? 'For Rent' : 'For Sale'}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#E8F3EC] text-[#103D2C] rounded-[2px]">
                {categoryLabel}
              </span>
              {property.isNegotiable && (
                <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#F5F8F5] text-[#5F6B63] border border-[#DDE5DF] rounded-[2px]">
                  Negotiable
                </span>
              )}
              <span className="text-xs text-[#5F6B63] font-medium">Ref: {cleanRef}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#18251E] tracking-tight leading-snug">
              {cleanTitle}
            </h1>

            <p className="text-sm text-[#5F6B63] font-medium">{formattedLocation}</p>
          </div>

          {/* Asking Price & Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-4 shrink-0">
            <div className="lg:text-right">
              <span className="text-[11px] uppercase font-semibold tracking-wider text-[#5F6B63] block">
                {property.purpose === 'rent' ? 'Monthly Rent' : 'Asking Price'}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tabular-nums tracking-tight">
                {property.priceLkr > 0 ? formatPrice(property.priceLkr) : 'Price on Request'}
                {property.purpose === 'rent' && property.priceLkr > 0 && (
                  <span className="text-sm font-medium text-[#5F6B63] ml-1">/ month</span>
                )}
                {property.priceUnit === 'perch' && property.priceLkr > 0 && (
                  <span className="text-sm font-medium text-[#5F6B63] ml-1">/ perch</span>
                )}
              </div>
              {currency !== 'LKR' && property.priceLkr > 0 && (
                <p className="text-xs text-[#5F6B63] tabular-nums font-medium mt-0.5">
                  Rs. {Math.round(property.priceLkr).toLocaleString('en-US')} LKR
                </p>
              )}
            </div>

            {/* Clean Typographic Action Buttons (Zero Icons) */}
            <div className="grid grid-cols-4 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => toggleSave(property.id)}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] border transition-colors cursor-pointer text-center ${
                  saved
                    ? 'bg-[#C93636] text-white border-[#C93636]'
                    : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                {saved ? 'Saved' : 'Save'}
              </button>

              <button
                type="button"
                onClick={handleCompareClick}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] border transition-colors cursor-pointer text-center ${
                  compared
                    ? 'bg-[#103D2C] text-white border-[#103D2C]'
                    : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                {compared ? 'Comparing' : 'Compare'}
              </button>

              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] bg-[#128C7E] hover:bg-[#075E54] text-white transition-colors cursor-pointer text-center"
              >
                WhatsApp
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] border border-[#DDE5DF] bg-white text-[#18251E] hover:border-[#103D2C] transition-colors cursor-pointer text-center"
              >
                {copiedShare ? 'Copied' : 'Share'}
              </button>
            </div>

            {compareMessage && (
              <p className="text-xs text-[#176B45] font-semibold bg-[#E8F3EC] px-2.5 py-1 rounded-[2px]">
                {compareMessage}
              </p>
            )}
          </div>
        </div>

        {/* Media Switcher if Floor Plans exist */}
        {hasFloorPlans && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMediaTab('photos')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                activeMediaTab === 'photos'
                  ? 'bg-[#103D2C] text-white'
                  : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Photos ({property.images.length})
            </button>
            <button
              onClick={() => setActiveMediaTab('floorplans')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                activeMediaTab === 'floorplans'
                  ? 'bg-[#103D2C] text-white'
                  : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Floor Plans ({property.floorPlans?.length || 1})
            </button>
          </div>
        )}

        {/* =========================================================================
            PHOTO GALLERY
            ========================================================================= */}
        <section aria-label="Property Gallery" className="space-y-3">
          {activeMediaTab === 'photos' ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3">
                {/* Main Hero Photo */}
                <div
                  onClick={() => {
                    setSelectedPhotoIndex(0);
                    setLightboxOpen(true);
                  }}
                  className={`${
                    property.images.length >= 3
                      ? 'md:col-span-8 aspect-16/10'
                      : property.images.length === 2
                      ? 'md:col-span-6 aspect-16/10'
                      : 'md:col-span-12 aspect-16/10 sm:aspect-16/9'
                  } relative overflow-hidden rounded-[4px] border border-[#DDE5DF] group cursor-pointer bg-[#F5F8F5]`}
                >
                  <img
                    src={property.images[0]}
                    alt={cleanTitle}
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onError={handleImageFallback}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPhotoIndex(0);
                      setLightboxOpen(true);
                    }}
                    className="absolute bottom-3 right-3 px-3.5 py-2 bg-black/75 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[3px] backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    View All {property.images.length} Photos
                  </button>
                </div>

                {/* Secondary Side Photos */}
                {property.images.length >= 3 && (
                  <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-3">
                    {property.images.slice(1, 3).map((img, idx) => (
                      <div
                        key={img + idx}
                        onClick={() => {
                          setSelectedPhotoIndex(idx + 1);
                          setLightboxOpen(true);
                        }}
                        className="relative overflow-hidden rounded-[4px] border border-[#DDE5DF] group cursor-pointer bg-[#F5F8F5]"
                      >
                        <img
                          src={img}
                          alt={`${cleanTitle} - Photo ${idx + 2}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={handleImageFallback}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        />
                        {idx === 1 && property.images.length > 3 && (
                          <div className="absolute inset-0 bg-black/45 hover:bg-black/55 transition-colors flex items-center justify-center">
                            <span className="text-white font-bold text-sm tracking-wide">
                              +{property.images.length - 3} More Photos
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {property.images.length === 2 && (
                  <div
                    onClick={() => {
                      setSelectedPhotoIndex(1);
                      setLightboxOpen(true);
                    }}
                    className="hidden md:block md:col-span-6 aspect-16/10 relative overflow-hidden rounded-[4px] border border-[#DDE5DF] group cursor-pointer bg-[#F5F8F5]"
                  >
                    <img
                      src={property.images[1]}
                      alt={`${cleanTitle} - Photo 2`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={handleImageFallback}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                  </div>
                )}
              </div>

              {/* Clean Thumbnail Filmstrip */}
              {property.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                  {property.images.map((img, index) => (
                    <button
                      key={img + index}
                      type="button"
                      onClick={() => {
                        setSelectedPhotoIndex(index);
                        setLightboxOpen(true);
                      }}
                      className={`relative shrink-0 w-20 sm:w-24 aspect-16/10 rounded-[3px] overflow-hidden border transition-all cursor-pointer ${
                        selectedPhotoIndex === index
                          ? 'border-[#103D2C] ring-2 ring-[#103D2C]/25'
                          : 'border-[#DDE5DF] opacity-85 hover:opacity-100 hover:border-[#103D2C]'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Photo ${index + 1}`}
                        loading="lazy"
                        onError={handleImageFallback}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#18251E]">Floor Plan</h3>
                <button
                  onClick={() => {
                    setSelectedPhotoIndex(0);
                    setLightboxOpen(true);
                  }}
                  className="text-xs font-semibold text-[#103D2C] hover:underline cursor-pointer"
                >
                  Open Full Screen
                </button>
              </div>
              <div
                onClick={() => {
                  setSelectedPhotoIndex(0);
                  setLightboxOpen(true);
                }}
                className="max-h-[520px] overflow-hidden rounded-[3px] border border-[#DDE5DF] bg-white cursor-pointer"
              >
                <img
                  src={property.floorPlans?.[0]}
                  alt={`${cleanTitle} floor plan`}
                  className="w-full h-auto object-contain max-h-[520px] mx-auto p-4"
                />
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            MAIN CONTENT GRID (8 COLS LEFT, 4 COLS STICKY AGENT CARD RIGHT)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start pt-2">
          <div className="lg:col-span-8 space-y-8">
            {/* Key Property Specifications Bar */}
            {specItems.length > 0 && (
              <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {specItems.map((spec) => (
                  <div
                    key={spec.label}
                    className="p-4 bg-[#FAFBF9] rounded-[4px] border border-[#DDE5DF]"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6B63] block">
                      {spec.label}
                    </span>
                    <span className="text-base font-bold text-[#18251E] block mt-1 tabular-nums">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </section>
            )}

            {/* Clean, Deduplicated Property Description & Key Highlights */}
            <section className="space-y-5">
              <h2 className="text-lg sm:text-xl font-bold text-[#18251E] border-b border-[#DDE5DF] pb-3">
                About This Property
              </h2>

              {paragraphs.length > 0 && (
                <div className="space-y-3.5 text-[15px] text-[#2C3A32] leading-relaxed">
                  {paragraphs.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}

              {highlights.length > 0 && (
                <div className="pt-2 space-y-3">
                  <h3 className="text-sm font-bold text-[#18251E]">Key Highlights</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#2C3A32]">
                    {highlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#176B45] mt-2 shrink-0" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {cleanMaterialSpecs && (
                <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] space-y-1.5">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-[#103D2C]">
                    Construction & Finishes
                  </h3>
                  <p className="text-sm text-[#5F6B63] leading-relaxed">{cleanMaterialSpecs}</p>
                </div>
              )}

              {property.videoUrl && (
                <div className="p-4 bg-[#E8F3EC] border border-[#176B45]/30 rounded-[3px] flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#103D2C]">Property Video Tour</span>
                  <a
                    href={property.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold uppercase tracking-wider text-[#103D2C] hover:underline"
                  >
                    Watch Video
                  </a>
                </div>
              )}
            </section>

            {/* Amenities & Facilities */}
            {property.amenities && property.amenities.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#18251E] border-b border-[#DDE5DF] pb-3">
                  Features & Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2.5 text-[#18251E] font-medium p-3 bg-[#FAFBF9] rounded-[3px] border border-[#DDE5DF]"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#103D2C] shrink-0" />
                      <span className="truncate">{stripEmojiSlop(amenity)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Structured Property Details Table */}
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#18251E] border-b border-[#DDE5DF] pb-3">
                Property Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#DDE5DF] rounded-[4px] overflow-hidden text-sm">
                <div className="flex justify-between p-3.5 border-b border-[#DDE5DF] bg-[#FAFBF9]">
                  <span className="text-[#5F6B63]">Reference ID</span>
                  <span className="font-semibold text-[#18251E]">{cleanRef}</span>
                </div>
                <div className="flex justify-between p-3.5 border-b border-[#DDE5DF] sm:border-l bg-[#FAFBF9]">
                  <span className="text-[#5F6B63]">Category</span>
                  <span className="font-semibold text-[#18251E]">{categoryLabel}</span>
                </div>
                <div className="flex justify-between p-3.5 border-b border-[#DDE5DF] bg-white">
                  <span className="text-[#5F6B63]">Listing Type</span>
                  <span className="font-semibold text-[#18251E]">
                    {property.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                  </span>
                </div>
                <div className="flex justify-between p-3.5 border-b border-[#DDE5DF] sm:border-l bg-white">
                  <span className="text-[#5F6B63]">Availability</span>
                  <span className="font-semibold text-[#176B45] capitalize">
                    {property.status || 'Available'}
                  </span>
                </div>
                <div className="flex justify-between p-3.5 border-b sm:border-b-0 border-[#DDE5DF] bg-[#FAFBF9]">
                  <span className="text-[#5F6B63]">City / Town</span>
                  <span className="font-semibold text-[#18251E]">{property.location.city}</span>
                </div>
                <div className="flex justify-between p-3.5 sm:border-l border-[#DDE5DF] bg-[#FAFBF9]">
                  <span className="text-[#5F6B63]">District</span>
                  <span className="font-semibold text-[#18251E]">{property.location.district}</span>
                </div>
              </div>
            </section>

            {/* Compact Tabbed Financial & Stamp Duty Calculator */}
            {property.priceLkr > 0 && property.purpose !== 'rent' && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE5DF] pb-3">
                  <h2 className="text-lg sm:text-xl font-bold text-[#18251E]">
                    Financial & Cost Estimator
                  </h2>
                  <div className="inline-flex bg-[#F5F8F5] p-1 rounded-[3px] border border-[#DDE5DF] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveCalcTab('mortgage')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
                        activeCalcTab === 'mortgage'
                          ? 'bg-[#103D2C] text-white'
                          : 'text-[#5F6B63] hover:text-[#18251E]'
                      }`}
                    >
                      Mortgage Calculator
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCalcTab('stamp_duty')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
                        activeCalcTab === 'stamp_duty'
                          ? 'bg-[#103D2C] text-white'
                          : 'text-[#5F6B63] hover:text-[#18251E]'
                      }`}
                    >
                      Stamp Duty & Legal Fees
                    </button>
                  </div>
                </div>

                {activeCalcTab === 'mortgage' ? (
                  <MortgageCalculator
                    priceLkr={property.priceLkr}
                    propertyTitle={cleanTitle}
                    propertyLocation={`${property.location.city}, ${property.location.district}`}
                  />
                ) : (
                  <AcquisitionCalculator
                    priceLkr={property.priceLkr}
                    propertyType={property.type}
                  />
                )}
              </section>
            )}
          </div>

          {/* Right: Sticky Desktop Agent Inquiry Card (4 cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] p-6 space-y-5">
            <div className="space-y-1 pb-4 border-b border-[#DDE5DF]">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#176B45]">
                Property Inquiry
              </span>
              <h3 className="text-lg font-bold text-[#18251E]">Contact Listing Agent</h3>
              <p className="text-xs text-[#5F6B63]">
                Schedule a viewing or request property details directly.
              </p>
            </div>

            {/* Agent Profile Box */}
            <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#103D2C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(property.agent.name || 'L').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-[#18251E] block truncate">
                  {property.agent.name}
                </span>
                <span className="text-xs text-[#5F6B63] block truncate">
                  {property.agent.role || 'Authorized Representative'}
                </span>
                {property.agent.phone && (
                  <span className="text-xs text-[#103D2C] font-bold block mt-0.5">
                    {property.agent.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Contact CTAs (Zero Icons) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setInquiryModalOpen(true)}
                className="w-full py-3 px-4 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer text-center"
              >
                Send Inquiry
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full py-3 px-4 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer text-center"
              >
                WhatsApp Agent
              </button>

              {property.agent.phone && (
                <a
                  href={`tel:${property.agent.phone.replace(/[^0-9+]/g, '')}`}
                  className="block w-full py-2.5 px-4 border border-[#DDE5DF] bg-white text-[#18251E] hover:border-[#103D2C] font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors text-center"
                >
                  Call {property.agent.phone}
                </a>
              )}
            </div>

            <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between text-[11px] text-[#5F6B63]">
              <span>
                Reference: <strong className="text-[#18251E]">{cleanRef}</strong>
              </span>
              <span>Listed: {property.publishedDate}</span>
            </div>
          </aside>
        </div>

        {/* Similar Properties Section */}
        {similarProperties.length > 0 && (
          <section className="pt-10 border-t border-[#DDE5DF] space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#18251E]">
                Similar Properties in {property.location.district}
              </h2>
              <button
                onClick={() => navigate(`/properties?district=${property.location.district}`)}
                className="text-xs font-bold uppercase tracking-wider text-[#103D2C] hover:text-[#176B45] cursor-pointer"
              >
                View All in {property.location.district}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Bottom Contact Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DDE5DF] px-4 py-3 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-semibold text-[#5F6B63] block">
            {property.purpose === 'rent' ? 'Monthly Rent' : 'Asking Price'}
          </span>
          <span className="text-base font-extrabold text-[#103D2C] truncate block tabular-nums">
            {property.priceLkr > 0 ? formatPrice(property.priceLkr) : 'Price on Request'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="px-3.5 py-2.5 bg-[#128C7E] text-white text-xs font-bold uppercase rounded-[3px] cursor-pointer"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setInquiryModalOpen(true)}
            className="px-4 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase rounded-[3px] cursor-pointer"
          >
            Inquire
          </button>
        </div>
      </div>

      <GalleryLightbox
        images={activeGalleryImages}
        initialIndex={selectedPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={cleanTitle}
      />

      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        propertyTitle={cleanTitle}
        agentName={property.agent.name}
        agentPhone={property.agent.phone}
        agentWhatsapp={property.agent.whatsapp}
      />
    </div>
  );
}
