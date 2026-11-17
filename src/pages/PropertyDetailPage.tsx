import { useState, useMemo } from 'react';
import { MessageCircle, Share2, Maximize2 } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';
import { propertyService } from '../services/propertyService';
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

export function PropertyDetailPage({ slug }: PropertyDetailPageProps) {
  const { navigate, searchParams } = useRouter();
  const { isSaved, toggleSave } = useSavedProperties();
  const { formatPrice, currency } = useCurrency();
  const { isInCompare, addToCompare } = useCompare();
  const isPreviewParam = searchParams.get('preview') === 'true';

  const allAuthoritative = propertyService.getAllAuthoritativeProperties();
  const property = useMemo(() => {
    return allAuthoritative.find((p) => p.slug === slug || p.id === slug) || null;
  }, [slug, allAuthoritative]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [compareMessage, setCompareMessage] = useState<string | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'floorplans'>('photos');

  // Handle missing properties
  if (!property) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#C93636]">
          Property Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E]">
          The requested listing does not exist.
        </h1>
        <p className="text-sm text-[#5F6B63]">
          The address link may have changed or the listing has concluded.
        </p>
        <button
          onClick={() => navigate('/properties')}
          className="px-6 py-2.5 bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors hover:bg-[#115236] cursor-pointer"
        >
          Explore All Marketplace Listings
        </button>
      </div>
    );
  }

  const isPublished = property.publicationStatus === 'published';
  const showAsDraftPreview = isPreviewParam || !isPublished;

  if (!isPublished && !isPreviewParam) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#C93636]">
          Listing Unavailable
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E]">
          This property listing is not currently published.
        </h1>
        <p className="text-sm text-[#5F6B63]">
          This record is either in draft preparation or undergoing title authentication.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/properties')}
            className="px-6 py-2.5 bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer"
          >
            Browse Active Properties
          </button>
        </div>
      </div>
    );
  }

  const saved = isSaved(property.id);
  const compared = isInCompare(property.id);

  // Similar properties in same district or category
  const similarProperties = allAuthoritative.filter(
    (p) =>
      p.publicationStatus === 'published' &&
      p.id !== property.id &&
      (p.location.district === property.location.district || p.type === property.type)
  ).slice(0, 3);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${property.title} | LankaProperty.lk`,
          text: `Check out this listing: ${property.title} in ${property.location.city}, Sri Lanka.`,
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
    const priceText = property.priceLkr > 0 ? formatPrice(property.priceLkr, false) : 'Price on Application (POA)';
    const specsArr: string[] = [];
    if (property.specs.bedrooms) specsArr.push(`${property.specs.bedrooms} Beds`);
    if (property.specs.bathrooms) specsArr.push(`${property.specs.bathrooms} Baths`);
    if (property.specs.floorAreaSqFt) specsArr.push(`${property.specs.floorAreaSqFt.toLocaleString()} sq ft`);
    if (property.specs.landPerches) specsArr.push(`${property.specs.landPerches} Perches`);
    const specsStr = specsArr.length > 0 ? ` · ${specsArr.join(' | ')}` : '';

    const text = encodeURIComponent(
      `*${property.title}*\n📍 ${property.location.city}, ${property.location.district}\n💰 Price: ${priceText}${specsStr}\n\n✨ View Full-Screen HD Photos & Verified Title:\n${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCompareClick = () => {
    const added = addToCompare(property);
    setCompareMessage(added ? 'Added to comparison dossier (3 Max)' : 'Removed from comparison dossier');
    setTimeout(() => setCompareMessage(null), 3000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${property.agent.name}, I am interested in inquiring about "${property.title}" in ${property.location.city}, Sri Lanka. URL: ${window.location.href}`
    );
    window.open(`https://wa.me/${property.agent.whatsapp.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const hasFloorPlans = Boolean(property.floorPlans && property.floorPlans.length > 0);
  const activeGalleryImages = activeMediaTab === 'floorplans' && hasFloorPlans
    ? (property.floorPlans as string[])
    : property.images;

  return (
    <div className="bg-white min-h-screen pb-28 md:pb-20">
      <SeoHead
        title={`${property.title} in ${property.location.city}, ${property.location.district} | LankaProperty.lk`}
        description={`${property.summary || property.description.slice(0, 155)} — Located in ${property.location.city}, ${property.location.district} District, Sri Lanka.`}
        canonicalPath={`/properties/${property.slug}`}
        ogImage={property.images[0]}
        ogType="product"
        geoPlacename={`${property.location.city}, ${property.location.district}, Sri Lanka`}
        geoPosition={property.location.coordinates || { lat: 6.9271, lng: 79.8612 }}
        jsonLd={[
          {
            '@type': 'RealEstateListing',
            name: property.title,
            description: property.description,
            url: `https://lankaproperty.lk/properties/${property.slug}`,
            image: property.images,
            datePosted: property.listedAt || '2026-10-01',
            offers: {
              '@type': 'Offer',
              price: property.priceLkr,
              priceCurrency: 'LKR',
              availability: 'https://schema.org/InStock',
              url: `https://lankaproperty.lk/properties/${property.slug}`,
            },
            about: {
              '@type': property.type === 'apartment' ? 'Apartment' : 'SingleFamilyResidence',
              name: property.title,
              numberOfRooms: property.specs.beds || undefined,
              numberOfBathroomsTotal: property.specs.baths || undefined,
              floorSize: property.specs.sqft
                ? {
                    '@type': 'QuantitativeValue',
                    value: property.specs.sqft,
                    unitCode: 'FTK',
                  }
                : undefined,
              address: {
                '@type': 'PostalAddress',
                streetAddress: property.location.address,
                addressLocality: property.location.city,
                addressRegion: property.location.district,
                addressCountry: 'LK',
              },
              geo: property.location.coordinates
                ? {
                    '@type': 'GeoCoordinates',
                    latitude: property.location.coordinates.lat,
                    longitude: property.location.coordinates.lng,
                  }
                : undefined,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://lankaproperty.lk/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Properties',
                item: 'https://lankaproperty.lk/properties',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${property.location.district} District`,
                item: `https://lankaproperty.lk/properties?district=${encodeURIComponent(property.location.district)}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: property.title,
                item: `https://lankaproperty.lk/properties/${property.slug}`,
              },
            ],
          },
        ]}
      />

      {/* Top Breadcrumb Bar */}
      <div className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-3 text-xs text-[#5F6B63]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="hover:text-[#18251E] cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <button
              onClick={() => navigate('/properties')}
              className="hover:text-[#18251E] cursor-pointer"
            >
              Properties
            </button>
            <span>/</span>
            <button
              onClick={() => navigate(`/properties?district=${encodeURIComponent(property.location.district)}`)}
              className="hover:text-[#18251E] cursor-pointer"
            >
              {property.location.district}
            </button>
            <span>/</span>
            <span className="text-[#18251E] font-semibold line-clamp-1">{property.title}</span>
          </nav>

          <button
            onClick={() => navigate('/properties')}
            className="hidden sm:inline-flex items-center gap-1.5 font-bold text-[#103D2C] hover:text-[#176B45] cursor-pointer"
          >
            <span>← Back to Properties Discovery</span>
          </button>
        </div>
      </div>

      <main className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-6 sm:pt-8 space-y-8">
        {/* Draft Preview Banner */}
        {showAsDraftPreview && (
          <div className="bg-[#103D2C] text-white p-4 rounded-[3px] border-l-4 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-black rounded-[2px]">
                Draft Preview
              </span>
              <span className="text-xs sm:text-sm text-[#E8F3EC]">
                This is an administrative preview of a {property.publicationStatus} listing.
                It is currently excluded from public marketplace search.
              </span>
            </div>
            <button
              onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
              className="px-4 py-1.5 bg-white text-[#103D2C] hover:bg-[#E8F3EC] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Edit in Superadmin
            </button>
          </div>
        )}

        {/* Title, Location & Quick Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[#DDE5DF]">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#E8F3EC] text-[#176B45] rounded-[2px]">
                {property.purpose === 'rent'
                  ? 'For Long-Term Rent'
                  : property.type === 'land'
                  ? 'Residential / Beach Land'
                  : 'For Sale · Freehold'}
              </span>
              {property.isUrgent && (
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#C93636] text-white rounded-[2px]">
                  Direct Seller Mandate
                </span>
              )}
              <span className="text-xs text-[#5F6B63] font-medium">Ref ID: {property.id}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-[#18251E] tracking-tight leading-tight">
              {property.title}
            </h1>

            <p className="text-sm sm:text-base text-[#5F6B63] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-[1px] bg-[#176B45]" />
              <span>{property.location.address}, {property.location.city}, {property.location.district} ({property.location.province})</span>
            </p>
          </div>

          {/* Pricing & Actions */}
          <div className="flex flex-col md:items-end gap-3.5">
            <div className="space-y-1 md:text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B63]">
                Purchase Valuation
              </span>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#103D2C] tabular-nums tracking-tight">
                {property.priceLkr > 0 ? formatPrice(property.priceLkr) : 'Price on request'}
                {property.purpose === 'rent' && <span className="text-sm font-normal text-[#5F6B63] ml-1">/ month</span>}
              </p>
              {currency !== 'LKR' && property.priceLkr > 0 && (
                <p className="text-xs text-[#5F6B63] tabular-nums font-semibold">
                  Rs. {property.priceLkr.toLocaleString('en-US')} LKR
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Save */}
              <button
                onClick={() => toggleSave(property.id)}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] border transition-colors cursor-pointer ${
                  saved
                    ? 'bg-[#C93636] text-white border-[#C93636]'
                    : 'bg-white text-[#18251E] border-[#DDE5DF] hover:bg-[#F5F8F5]'
                }`}
              >
                {saved ? 'Saved in Portfolio' : 'Save Property'}
              </button>

              {/* Compare */}
              <button
                onClick={handleCompareClick}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] border transition-colors cursor-pointer ${
                  compared
                    ? 'bg-[#103D2C] text-white border-[#103D2C]'
                    : 'bg-white text-[#18251E] border-[#DDE5DF] hover:bg-[#F5F8F5]'
                }`}
              >
                {compared ? 'In Compare Dossier' : 'Compare Dossier'}
              </button>

              {/* WhatsApp Share with Client-Optimized Format */}
              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] bg-[#128C7E] hover:bg-[#075E54] text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Share this listing directly on WhatsApp with full formatted details"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Share</span>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] border border-[#DDE5DF] bg-white text-[#18251E] hover:bg-[#F5F8F5] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-[#5F6B63]" />
                <span>{copiedShare ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {compareMessage && (
              <p className="text-xs text-[#176B45] font-semibold bg-[#E8F3EC] px-2.5 py-1 rounded-[2px]">
                {compareMessage}
              </p>
            )}
          </div>
        </div>

        {/* Media Tabs */}
        {hasFloorPlans && (
          <div className="flex items-center gap-2 border-b border-[#DDE5DF] pb-3">
            <button
              onClick={() => setActiveMediaTab('photos')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                activeMediaTab === 'photos'
                  ? 'bg-[#103D2C] text-white'
                  : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Photography ({property.images.length})
            </button>

            <button
              onClick={() => setActiveMediaTab('floorplans')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                activeMediaTab === 'floorplans'
                  ? 'bg-[#103D2C] text-white'
                  : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Floor Plans Scheme (1)
            </button>
          </div>
        )}

        {/* =========================================================================
            ARCHITECTURAL GALLERY (UP TO 20 IMAGES WITH INTERACTIVE FILMSTRIP)
            ========================================================================= */}
        <section aria-label="Property Media View" className="space-y-3">
          {activeMediaTab === 'photos' ? (
            <div className="space-y-3">
              {/* Mosaic Display: Primary Photo + 2 Side Previews */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                {/* Main Hero Photo (Spans 12 columns if single photo, 8 columns if multi-photo) */}
                <div
                  onClick={() => {
                    setSelectedPhotoIndex(0);
                    setLightboxOpen(true);
                  }}
                  className={`${
                    property.images.length > 1
                      ? 'md:col-span-8 aspect-16/10'
                      : 'md:col-span-12 aspect-16/10 sm:aspect-16/9 md:aspect-21/9'
                  } relative overflow-hidden rounded-[3px] border border-[#DDE5DF] group cursor-pointer bg-[#F5F8F5] shadow-xs`}
                >
                  <img
                    src={property.images[0]}
                    alt={`${property.title} primary architectural perspective`}
                    loading="eager"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />

                  {/* Top-Right Badge: Inspect Full Screen HD */}
                  <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded-[2px] backdrop-blur-xs flex items-center gap-1.5 transition-all shadow-md">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Inspect Full Screen HD</span>
                  </div>

                  {/* Bottom-Right Count Badge */}
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/80 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] backdrop-blur-xs flex items-center gap-1.5">
                    <span>View All {property.images.length} {property.images.length === 1 ? 'Photo' : 'Photos'} ↗</span>
                  </div>
                </div>

                {/* Secondary Views (Spans 4 columns on desktop only if multi-photo) */}
                {property.images.length > 1 && (
                  <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-3 sm:gap-4">
                    {property.images.slice(1, 3).map((img, idx) => (
                      <div
                        key={img + idx}
                        onClick={() => {
                          setSelectedPhotoIndex(idx + 1);
                          setLightboxOpen(true);
                        }}
                        className="aspect-16/10 relative overflow-hidden rounded-[3px] border border-[#DDE5DF] group cursor-pointer bg-[#F5F8F5]"
                      >
                        <img
                          src={img}
                          alt={`${property.title} view ${idx + 2}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold uppercase rounded-[1px]">
                          Perspective 0{idx + 2}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 20-Photo Filmstrip Carousel Rail */}
              {property.images.length > 1 && (
                <div className="bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] p-3">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDE5DF]/60 text-xs">
                    <span className="font-bold text-[#103D2C] uppercase tracking-wider text-[10px]">
                      Complete Photographic Dossier ({property.images.length} Images)
                    </span>
                    <span className="text-[#5F6B63] text-[10px]">
                      Click any frame to inspect high-resolution gallery
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                    {property.images.map((img, index) => (
                      <button
                        key={img + index}
                        type="button"
                        onClick={() => {
                          setSelectedPhotoIndex(index);
                          setLightboxOpen(true);
                        }}
                        className={`relative shrink-0 w-24 sm:w-28 aspect-16/10 rounded-[2px] overflow-hidden border transition-all cursor-pointer group ${
                          selectedPhotoIndex === index
                            ? 'border-[#103D2C] ring-2 ring-[#176B45]/40 shadow-xs'
                            : 'border-[#DDE5DF] hover:border-[#103D2C]'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/70 text-white text-[9px] tabular-nums font-bold rounded-[1px]">
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Floor Plan Diagram Frame */
            <div className="p-8 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#18251E]">Architectural Floor Plan Scheme</h3>
                  <p className="text-xs text-[#5F6B63]">Detailed pavilion layout and structural room dimensions.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPhotoIndex(0);
                    setLightboxOpen(true);
                  }}
                  className="text-xs font-bold text-[#103D2C] hover:underline cursor-pointer"
                >
                  Inspect in Lightbox →
                </button>
              </div>

              <div
                onClick={() => {
                  setSelectedPhotoIndex(0);
                  setLightboxOpen(true);
                }}
                className="max-h-[520px] overflow-hidden rounded-[2px] border border-[#DDE5DF] bg-white cursor-pointer"
              >
                <img
                  src={property.floorPlans?.[0]}
                  alt={`${property.title} floor plan`}
                  className="w-full h-auto object-contain max-h-[520px] mx-auto p-4"
                />
              </div>
            </div>
          )}
        </section>

        {/* Main Details Grid (Content Left 8 cols, Sticky Inquiry Right 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-10">
            {/* =========================================================================
                KEY SPECIFICATIONS (ARCHITECTURAL MATRIX, ZERO ICONS)
                ========================================================================= */}
            <section className="p-6 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDE5DF]">
                <h2 className="text-xs uppercase font-extrabold tracking-wider text-[#103D2C]">
                  Key Specifications
                </h2>
                <span className="text-[10px] font-bold text-[#5F6B63] uppercase">
                  Survey Record Validated
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                {property.type !== 'land' && property.specs.bedrooms !== undefined && (
                  <div className="p-3 bg-white rounded-[2px] border border-[#DDE5DF]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] block">
                      Bedrooms
                    </span>
                    <span className="text-base font-extrabold text-[#18251E] block mt-1 tabular-nums">
                      {property.specs.bedrooms} Suites
                    </span>
                  </div>
                )}

                {property.type !== 'land' && property.specs.bathrooms !== undefined && (
                  <div className="p-3 bg-white rounded-[2px] border border-[#DDE5DF]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] block">
                      Bathrooms
                    </span>
                    <span className="text-base font-extrabold text-[#18251E] block mt-1 tabular-nums">
                      {property.specs.bathrooms} En-Suite
                    </span>
                  </div>
                )}

                {property.specs.floorAreaSqFt !== undefined && (
                  <div className="p-3 bg-white rounded-[2px] border border-[#DDE5DF]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] block">
                      Floor Area
                    </span>
                    <span className="text-base font-extrabold text-[#18251E] block mt-1 tabular-nums">
                      {property.specs.floorAreaSqFt.toLocaleString()} sq ft
                    </span>
                  </div>
                )}

                {property.specs.landPerches !== undefined && (
                  <div className="p-3 bg-white rounded-[2px] border border-[#DDE5DF]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] block">
                      Land Extent
                    </span>
                    <span className="text-base font-extrabold text-[#18251E] block mt-1 tabular-nums">
                      {property.specs.landPerches} Perches
                    </span>
                  </div>
                )}

                {property.type !== 'land' && property.specs.furnishing && (
                  <div className="p-3 bg-white rounded-[2px] border border-[#DDE5DF]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] block">
                      Furnishing
                    </span>
                    <span className="text-base font-extrabold text-[#18251E] block mt-1">
                      {property.specs.furnishing}
                    </span>
                  </div>
                )}

                {property.specs.parkingSpaces !== undefined && (
                  <div className="p-3 bg-white rounded-[2px] border border-[#DDE5DF]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] block">
                      Vehicle Parking
                    </span>
                    <span className="text-base font-extrabold text-[#18251E] block mt-1 tabular-nums">
                      {property.specs.parkingSpaces} Bays
                    </span>
                  </div>
                )}

                {property.specs.yearBuilt && (
                  <div className="p-3 bg-white rounded-[2px] border border-[#DDE5DF]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] block">
                      Construction Year
                    </span>
                    <span className="text-base font-extrabold text-[#18251E] block mt-1 tabular-nums">
                      {property.specs.yearBuilt}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Architectural Overview & Description */}
            <section className="space-y-4">
              <h2 className="text-xl font-extrabold text-[#18251E] border-b border-[#DDE5DF] pb-3">
                Property Overview
              </h2>
              <div className="space-y-3.5 text-base text-[#18251E]/90 leading-relaxed font-normal">
                {property.description
                  .replace(/\\n/g, '\n')
                  .split('\n')
                  .filter((p) => p.trim())
                  .map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
              </div>

              {/* Additional Buyer Information */}
              {property.additionalInfo && (
                <div className="mt-6 p-6 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] space-y-3">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#103D2C]">
                    Additional Architectural Details
                  </h3>
                  <div className="text-sm text-[#18251E] leading-relaxed whitespace-pre-line font-medium">
                    {property.additionalInfo.replace(/\\n/g, '\n')}
                  </div>
                </div>
              )}

              {/* Material Specifications */}
              {property.materialSpecs && (
                <div className="mt-4 p-5 bg-white border border-[#DDE5DF] rounded-[3px] space-y-2">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#103D2C]">
                    Material Specifications & Finishes
                  </h3>
                  <p className="text-sm text-[#5F6B63] leading-relaxed">
                    {property.materialSpecs}
                  </p>
                </div>
              )}

              {/* Video Tour Link */}
              {property.videoUrl && (
                <div className="mt-4 p-4 bg-[#E8F3EC] border border-[#176B45]/30 rounded-[3px] flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-[#103D2C]">
                    Video Tour & Aerial Footage Available
                  </div>
                  <a
                    href={property.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-extrabold uppercase tracking-wider text-[#103D2C] hover:text-[#176B45]"
                  >
                    Watch Architectural Tour →
                  </a>
                </div>
              )}

              {property.editorialStory && (
                <div className="mt-6 p-6 bg-[#FAFBF9] border-l-4 border-[#103D2C] space-y-2">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#103D2C]">
                    Spatial Narrative
                  </h3>
                  <p className="text-sm text-[#5F6B63] italic leading-relaxed">
                    &ldquo;{property.editorialStory.space}&rdquo;
                  </p>
                </div>
              )}
            </section>

            {/* =========================================================================
                FEATURES & AMENITIES (ZERO CHECKMARK ICONS, CRISP GEOMETRIC ACCENTS)
                ========================================================================= */}
            {property.amenities && property.amenities.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-extrabold text-[#18251E] border-b border-[#DDE5DF] pb-3">
                  Property Features & Finishes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {property.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2.5 text-[#18251E] font-medium p-2.5 bg-[#FAFBF9] rounded-[2px] border border-[#DDE5DF]/60">
                      <span className="w-1.5 h-1.5 rounded-[1px] bg-[#103D2C] shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Statutory Stamp Duty & Acquisition Cost Calculator */}
            {property.priceLkr > 0 && (
              <section className="space-y-6">
                <AcquisitionCalculator
                  priceLkr={property.priceLkr}
                  propertyType={property.type}
                />
                <MortgageCalculator
                  priceLkr={property.priceLkr}
                  propertyTitle={property.title}
                  propertyLocation={`${property.location.city}, ${property.location.district}`}
                />
              </section>
            )}

            {/* Legal Title & Foreign Buyer Eligibility Dossier */}
            <section className="space-y-3">
              <h2 className="text-xl font-extrabold text-[#18251E] border-b border-[#DDE5DF] pb-3">
                Legal Provenance & Title Security
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#176B45]">
                    Title Deed Verification
                  </span>
                  <h3 className="font-extrabold text-sm text-[#18251E]">
                    {property.type === 'apartment' ? 'Condominium Deed of Declaration' : 'Sinnakkara Freehold Deed'}
                  </h3>
                  <p className="text-xs text-[#5F6B63] leading-relaxed">
                    Pedigree authenticated with zero encumbrances recorded at the regional Land Registry.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#176B45]">
                    Foreign Buyer Eligibility
                  </span>
                  <h3 className="font-extrabold text-sm text-[#18251E]">
                    {property.type === 'apartment' ? '100% Direct Foreign Freehold' : 'Local Entity / 99-Yr Lease'}
                  </h3>
                  <p className="text-xs text-[#5F6B63] leading-relaxed">
                    {property.type === 'apartment'
                      ? 'Compliant with the Sri Lanka Condominium Management Authority Act from 1st floor upwards.'
                      : 'Available to dual citizens unconditionally, or foreign investors via registered local enterprise.'}
                  </p>
                </div>
              </div>
            </section>

            {/* Location Information */}
            <section className="space-y-3">
              <h2 className="text-xl font-extrabold text-[#18251E] border-b border-[#DDE5DF] pb-3">
                Regional Location & Enclave
              </h2>
              <div className="p-5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] text-xs text-[#5F6B63] space-y-2.5">
                <p className="font-bold text-sm text-[#18251E]">Surveyed Cadastral Coordinates</p>
                <p className="leading-relaxed">
                  Located in {property.location.city}, {property.location.district} ({property.location.province}).
                  Precise road boundaries, surveyed title cadastral plans, and certified folios are released directly upon private broker consultation.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[#103D2C] font-extrabold">
                  <span className="w-2 h-2 rounded-[1px] bg-[#103D2C]" />
                  <span>Freehold Title Deed Pedigree Authenticated</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right: Sticky Desktop Inquiry Sidebar (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] p-6 space-y-6 shadow-xs">
            <div className="space-y-1 pb-4 border-b border-[#DDE5DF]">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#176B45]">
                Direct Inquiries
              </span>
              <h3 className="text-lg font-extrabold text-[#18251E]">Contact Listing Broker</h3>
              <p className="text-xs text-[#5F6B63]">
                Direct representation for verified documentation and private viewings.
              </p>
            </div>

            {/* Agent Info */}
            <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] space-y-1 text-xs">
              <span className="font-extrabold text-sm text-[#18251E] block">{property.agent.name}</span>
              <span className="text-[#5F6B63] block">{property.agent.role}</span>
              <span className="text-[#103D2C] font-extrabold block pt-1">{property.agent.phone}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setInquiryModalOpen(true)}
                className="w-full py-3.5 px-4 bg-[#103D2C] hover:bg-[#176B45] text-white font-extrabold text-xs uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center shadow-xs"
              >
                Request Verified Inspection Dossier →
              </button>

              <button
                onClick={handleWhatsApp}
                className="w-full py-3 px-4 border border-[#103D2C] text-[#103D2C] hover:bg-[#E8F3EC] font-extrabold text-xs uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center"
              >
                Direct WhatsApp Broker Line →
              </button>

              {property.agent.phone && (
                <a
                  href={`tel:${property.agent.phone.replace(/[^0-9+]/g, '')}`}
                  className="w-full py-2.5 px-4 border border-[#DDE5DF] bg-white text-[#18251E] hover:bg-[#F5F8F5] font-bold text-xs uppercase tracking-wider rounded-[2px] transition-colors block text-center"
                >
                  Call Direct: {property.agent.phone}
                </a>
              )}
            </div>

            <div className="text-[11px] text-[#5F6B63] leading-relaxed pt-2 border-t border-[#DDE5DF]">
              All inquiries are managed directly with authorized listing agents. Zero hidden broker commission fees.
            </div>
          </aside>
        </div>

        {/* Similar Properties Section */}
        {similarProperties.length > 0 && (
          <section className="pt-12 border-t border-[#DDE5DF] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#18251E]">
                  Similar Properties in {property.location.district}
                </h2>
              </div>
              <button
                onClick={() => navigate(`/properties?district=${property.location.district}`)}
                className="text-xs font-bold uppercase tracking-wider text-[#103D2C] hover:text-[#176B45] cursor-pointer"
              >
                View all in {property.location.district} →
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
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#DDE5DF] p-3 sm:p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">Valuation</span>
          <span className="text-sm font-extrabold text-[#103D2C] truncate block">
            {property.priceLkr > 0 ? formatPrice(property.priceLkr) : 'Price on request'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleWhatsApp}
            className="px-3.5 py-2 bg-[#E8F3EC] text-[#103D2C] text-xs font-extrabold uppercase rounded-[2px] border border-[#176B45]/40 cursor-pointer"
          >
            WhatsApp
          </button>
          <button
            onClick={() => setInquiryModalOpen(true)}
            className="px-4 py-2 bg-[#103D2C] text-white text-xs font-extrabold uppercase rounded-[2px] cursor-pointer"
          >
            Inquire
          </button>
        </div>
      </div>

      {/* Lightbox Component for up to 20 Photos */}
      <GalleryLightbox
        images={activeGalleryImages}
        initialIndex={selectedPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={property.title}
      />

      {/* Contact Broker Inquiry Modal */}
      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        propertyTitle={property.title}
        agentName={property.agent.name}
        agentPhone={property.agent.phone}
        agentWhatsapp={property.agent.whatsapp}
      />
    </div>
  );
}
