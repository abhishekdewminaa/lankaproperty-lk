import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Property } from '../types/property';
import { propertyService } from '../services/propertyService';
import { useRouter } from '../hooks/useRouter';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { useCurrency } from '../context/CurrencyContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import {
  ArrowRight,
  Bed,
  Bath,
  Maximize2,
  Compass,
  Bookmark,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CuratedCollectionProps {
  properties?: Property[];
}

let globalCuratedHasRevealed = false;

export function CuratedCollection({ properties }: CuratedCollectionProps) {
  const { navigate } = useRouter();
  const { isSaved, toggleSave } = useSavedProperties();
  const { formatPrice, currency } = useCurrency();
  const prefersReduced = usePrefersReducedMotion();

  const [activeTab, setActiveTab] = useState<'homes' | 'land'>('homes');
  const [isSwitching, setIsSwitching] = useState(false);
  const [sectionInView, setSectionInView] = useState(
    () => globalCuratedHasRevealed || prefersReduced
  );

  const sectionRef = useRef<HTMLElement | null>(null);
  const tabHomesRef = useRef<HTMLButtonElement | null>(null);
  const tabLandRef = useRef<HTMLButtonElement | null>(null);

  const allProps = properties && properties.length > 0 ? properties : propertyService.getPublicEligibleProperties();

  // Curated Architectural Homes: specifically signature/architectural properties
  const architecturalHomes = useMemo(() => {
    return allProps.filter(
      (p: any) =>
        (p.isSignature || p.isFeatured || p.collections?.includes('architectural')) &&
        p.type !== 'land' &&
        p.status !== 'sold'
    );
  }, [allProps]);

  // Curated Land Parcels: specifically land properties
  const landListings = useMemo(() => {
    return allProps.filter(
      (p: any) =>
        (p.type === 'land' || p.purpose === 'land' || p.collections?.includes('land')) &&
        p.status !== 'sold'
    );
  }, [allProps]);

  const primaryHome = architecturalHomes[0] || allProps[0];
  const secondaryHome1 = architecturalHomes[1] || allProps[1];
  const secondaryHome2 = architecturalHomes[2] || allProps[2];

  const primaryLand = landListings[0];
  const secondaryLand1 = landListings[1];
  const secondaryLand2 = landListings[2];

  // Scroll entrance observer (runs once)
  useEffect(() => {
    if (globalCuratedHasRevealed || prefersReduced) {
      setSectionInView(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setSectionInView(true);
      globalCuratedHasRevealed = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionInView(true);
          globalCuratedHasRevealed = true;
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [prefersReduced]);

  // Tab switch handler with coordinated group transition
  const handleTabChange = (newTab: 'homes' | 'land') => {
    if (newTab === activeTab || isSwitching) return;

    if (prefersReduced) {
      setActiveTab(newTab);
      return;
    }

    setIsSwitching(true);
    // 120ms fade out outgoing collection, then swap and fade in over 250ms
    setTimeout(() => {
      setActiveTab(newTab);
      setIsSwitching(false);
    }, 120);
  };

  // Keyboard navigation for accessible tabs (Left/Right Arrow)
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: 'homes' | 'land') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const targetTab = currentTab === 'homes' ? 'land' : 'homes';
      handleTabChange(targetTab);
      if (targetTab === 'homes') {
        tabHomesRef.current?.focus();
      } else {
        tabLandRef.current?.focus();
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Curated Collection"
      className="py-16 sm:py-24 max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 w-full"
    >
      {/* SECTION HEADER */}
      <div
        className={`transition-opacity duration-550 ease-out mb-8 sm:mb-10 pb-4 border-b border-[#DDE5DF] ${
          sectionInView || prefersReduced ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
              02 / CURATED COLLECTION
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#18251E] mt-1.5 tracking-tight">
              Exceptional Homes & Land
            </h2>
            <p className="text-sm sm:text-base text-[#5F6B63] mt-1 max-w-xl leading-relaxed">
              Explore distinctive homes and land for your next chapter.
            </p>
          </div>

          {/* Contextual Browse Link */}
          <a
            href={activeTab === 'homes' ? '/properties?purpose=buy' : '/properties?type=land'}
            onClick={(e) => {
              e.preventDefault();
              navigate(activeTab === 'homes' ? '/properties?purpose=buy' : '/properties?type=land');
            }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#115236] transition-colors self-start sm:self-auto py-1 focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px]"
          >
            <span>{activeTab === 'homes' ? 'Explore Architectural Homes' : 'Explore All Land'}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* ACCESSIBLE TABS (Rectangular, Pale-green active, thin green underline) */}
        <div
          role="tablist"
          aria-label="Curated collection categories"
          className="flex items-center gap-2 mt-6 sm:mt-7 p-1 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[4px] w-fit"
        >
          {/* Tab 1: Architectural Homes */}
          <button
            ref={tabHomesRef}
            role="tab"
            id="tab-homes"
            aria-selected={activeTab === 'homes'}
            aria-controls="panel-curated"
            tabIndex={activeTab === 'homes' ? 0 : -1}
            onClick={() => handleTabChange('homes')}
            onKeyDown={(e) => handleTabKeyDown(e, 'homes')}
            className={`relative px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide rounded-[3px] transition-all duration-200 select-none focus-visible:outline-2 focus-visible:outline-[#176B45] focus-visible:outline-offset-2 ${
              activeTab === 'homes'
                ? 'bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/30 shadow-2xs'
                : 'bg-white text-[#5F6B63] hover:text-[#18251E] border border-transparent'
            }`}
          >
            <span>Architectural Homes</span>
            {activeTab === 'homes' && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#176B45] rounded-[2px] transition-[opacity] duration-200" />
            )}
          </button>

          {/* Tab 2: Land */}
          <button
            ref={tabLandRef}
            role="tab"
            id="tab-land"
            aria-selected={activeTab === 'land'}
            aria-controls="panel-curated"
            tabIndex={activeTab === 'land' ? 0 : -1}
            onClick={() => handleTabChange('land')}
            onKeyDown={(e) => handleTabKeyDown(e, 'land')}
            className={`relative px-5 py-2.5 text-xs sm:text-sm font-bold tracking-wide rounded-[3px] transition-all duration-200 select-none focus-visible:outline-2 focus-visible:outline-[#176B45] focus-visible:outline-offset-2 ${
              activeTab === 'land'
                ? 'bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/30 shadow-2xs'
                : 'bg-white text-[#5F6B63] hover:text-[#18251E] border border-transparent'
            }`}
          >
            <span>Land</span>
            {activeTab === 'land' && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#176B45] rounded-[2px] transition-[opacity] duration-200" />
            )}
          </button>
        </div>
      </div>

      {/* CURATED PANEL (Animated group transition without distortion or layout shift) */}
      <div
        id="panel-curated"
        role="tabpanel"
        aria-labelledby={activeTab === 'homes' ? 'tab-homes' : 'tab-land'}
        className={`transition-all duration-250 ease-out ${
          isSwitching ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* TAB 1 CONTENT: ARCHITECTURAL HOMES */}
        {activeTab === 'homes' && primaryHome && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Balanced Primary Feature Card (Fixed empty space defect: items-start, natural height, compact info panel) */}
            <div
              className={`lg:col-span-7 flex flex-col transition-all duration-600 ease-out ${
                sectionInView || prefersReduced
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-5'
              }`}
            >
              <article className="group bg-white border border-[#DDE5DF] hover:border-[#176B45]/60 rounded-[4px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
                {/* Media Wrapper */}
                <div className="relative aspect-16/10 sm:aspect-16/10 w-full overflow-hidden bg-[#F5F8F5]">
                  <a
                    href={`/properties/${primaryHome.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/properties/${primaryHome.slug}`);
                    }}
                    className="block w-full h-full focus-visible:outline-2 focus-visible:outline-[#176B45]"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={primaryHome.images[0]}
                      alt={primaryHome.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover block transition-transform duration-350 ease-out ${
                        prefersReduced ? '' : 'group-hover:scale-[1.03]'
                      }`}
                    />
                  </a>
                  <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white/95 text-[#103D2C] rounded-[2px] shadow-xs backdrop-blur-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#176B45]" />
                      <span>Curated Signature</span>
                    </span>
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px] shadow-xs">
                      For Sale
                    </span>
                  </div>

                  {/* Independent Save Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleSave(primaryHome.id);
                    }}
                    className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/95 hover:bg-white text-[#18251E] rounded-[2px] shadow-xs backdrop-blur-xs flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45]"
                    aria-label={
                      isSaved(primaryHome.id)
                        ? `Remove ${primaryHome.title} from saved`
                        : `Save ${primaryHome.title}`
                    }
                  >
                    <Bookmark
                      className={`w-4.5 h-4.5 transition-colors ${
                        isSaved(primaryHome.id)
                          ? 'fill-[#C93636] text-[#C93636]'
                          : 'text-[#18251E] hover:text-[#176B45]'
                      }`}
                    />
                  </button>
                </div>

                {/* Compact Info Panel (Natural flow, 12-20px gaps, no artificial stretch) */}
                <div className="p-6 sm:p-7 flex flex-col gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-[#5F6B63]">
                      <MapPin className="w-3.5 h-3.5 text-[#176B45]" aria-hidden="true" />
                      <span>
                        {primaryHome.location.city}, {primaryHome.location.district}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-[#18251E] leading-snug">
                      <a
                        href={`/properties/${primaryHome.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/properties/${primaryHome.slug}`);
                        }}
                        className="hover:text-[#176B45] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px]"
                      >
                        {primaryHome.title}
                      </a>
                    </h3>

                    <p className="text-sm text-[#5F6B63] line-clamp-2 leading-relaxed">
                      {primaryHome.description}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#18251E]">
                    <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                      <Bed className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                      <span>{primaryHome.specs.bedrooms} Beds</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                      <Bath className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                      <span>{primaryHome.specs.bathrooms} Baths</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                      <Maximize2 className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                      <span>{primaryHome.specs.floorAreaSqFt?.toLocaleString()} sq ft</span>
                    </span>
                    {primaryHome.specs.landPerches && (
                      <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                        <Compass className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                        <span>{primaryHome.specs.landPerches} Perches</span>
                      </span>
                    )}
                  </div>

                  {/* Price and Action (Positioned right below specs with 16px gap, no empty void) */}
                  <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <span className="text-xs text-[#5F6B63] block font-medium">Valuation</span>
                      <span className="text-2xl font-extrabold text-[#103D2C] tabular-nums">
                        {formatPrice(primaryHome.priceLkr)}
                      </span>
                      {currency !== 'LKR' && (
                        <span className="text-[11px] text-[#5F6B63] block tabular-nums">
                          Rs. {(primaryHome.priceLkr / 1000000).toFixed(1)}M LKR
                        </span>
                      )}
                    </div>

                    <a
                      href={`/properties/${primaryHome.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/properties/${primaryHome.slug}`);
                      }}
                      className="px-6 py-3 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#176B45] w-full sm:w-auto"
                    >
                      <span>Explore Featured Residence</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-350 ease-out group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
              </article>
            </div>

            {/* Right: Stacked Secondary Cards */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              {secondaryHome1 && (
                <div
                  style={{ transitionDelay: prefersReduced ? '0ms' : '70ms' }}
                  className={`transition-all duration-600 ease-out ${
                    sectionInView || prefersReduced
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-5'
                  }`}
                >
                  <CuratedMiniCard
                    property={secondaryHome1}
                    actionLabel="View Property"
                    onNavigate={(slug) => navigate(`/properties/${slug}`)}
                    isSaved={isSaved(secondaryHome1.id)}
                    onToggleSave={() => toggleSave(secondaryHome1.id)}
                  />
                </div>
              )}

              {secondaryHome2 && (
                <div
                  style={{ transitionDelay: prefersReduced ? '0ms' : '140ms' }}
                  className={`transition-all duration-600 ease-out ${
                    sectionInView || prefersReduced
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-5'
                  }`}
                >
                  <CuratedMiniCard
                    property={secondaryHome2}
                    actionLabel="View Property"
                    onNavigate={(slug) => navigate(`/properties/${slug}`)}
                    isSaved={isSaved(secondaryHome2.id)}
                    onToggleSave={() => toggleSave(secondaryHome2.id)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2 CONTENT: LAND LISTINGS (Strictly land imagery, extent, road access, NO bedrooms/bathrooms) */}
        {activeTab === 'land' && primaryLand && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Primary Featured Land Card */}
            <div
              className={`lg:col-span-7 flex flex-col transition-all duration-600 ease-out ${
                sectionInView || prefersReduced
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-5'
              }`}
            >
              <article className="group bg-white border border-[#DDE5DF] hover:border-[#176B45]/60 rounded-[4px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden transition-colors">
                {/* Media Wrapper */}
                <div className="relative aspect-16/10 sm:aspect-16/10 w-full overflow-hidden bg-[#F5F8F5]">
                  <a
                    href={`/properties/${primaryLand.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/properties/${primaryLand.slug}`);
                    }}
                    className="block w-full h-full focus-visible:outline-2 focus-visible:outline-[#176B45]"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={primaryLand.images[0]}
                      alt={primaryLand.title}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover block transition-transform duration-350 ease-out ${
                        prefersReduced ? '' : 'group-hover:scale-[1.03]'
                      }`}
                    />
                  </a>

                  <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white/95 text-[#103D2C] rounded-[2px] shadow-xs backdrop-blur-xs">
                      Curated Land
                    </span>
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px] shadow-xs">
                      Land Parcel
                    </span>
                  </div>

                  {/* Independent Save Action */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleSave(primaryLand.id);
                    }}
                    className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/95 hover:bg-white text-[#18251E] rounded-[2px] shadow-xs backdrop-blur-xs flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45]"
                    aria-label={
                      isSaved(primaryLand.id)
                        ? `Remove ${primaryLand.title} from saved`
                        : `Save ${primaryLand.title}`
                    }
                  >
                    <Bookmark
                      className={`w-4.5 h-4.5 transition-colors ${
                        isSaved(primaryLand.id)
                          ? 'fill-[#C93636] text-[#C93636]'
                          : 'text-[#18251E] hover:text-[#176B45]'
                      }`}
                    />
                  </button>
                </div>

                {/* Compact Info Panel for Land */}
                <div className="p-6 sm:p-7 flex flex-col gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-[#5F6B63]">
                      <MapPin className="w-3.5 h-3.5 text-[#176B45]" aria-hidden="true" />
                      <span>
                        {primaryLand.location.city}, {primaryLand.location.district}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-[#18251E] leading-snug">
                      <a
                        href={`/properties/${primaryLand.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/properties/${primaryLand.slug}`);
                        }}
                        className="hover:text-[#176B45] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px]"
                      >
                        {primaryLand.title}
                      </a>
                    </h3>

                    <p className="text-sm text-[#5F6B63] line-clamp-2 leading-relaxed">
                      {primaryLand.description}
                    </p>
                  </div>

                  {/* Land-Specific Attributes: Extent, Frontage, Road access (Strictly NO bedroom/bathroom placeholders) */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#18251E]">
                    {primaryLand.specs.landPerches && (
                      <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                        <Compass className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                        <span>{primaryLand.specs.landPerches} Perches Extent</span>
                      </span>
                    )}
                    {primaryLand.amenities
                      .filter(
                        (a) =>
                          a.toLowerCase().includes('frontage') ||
                          a.toLowerCase().includes('road') ||
                          a.toLowerCase().includes('access')
                      )
                      .slice(0, 2)
                      .map((amenity, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#176B45]" aria-hidden="true" />
                          <span>{amenity}</span>
                        </span>
                      ))}
                  </div>

                  {/* Price and Action */}
                  <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <span className="text-xs text-[#5F6B63] block font-medium">Valuation</span>
                      <span className="text-2xl font-extrabold text-[#103D2C] tabular-nums">
                        {formatPrice(primaryLand.priceLkr)}
                      </span>
                      {currency !== 'LKR' && (
                        <span className="text-[11px] text-[#5F6B63] block tabular-nums">
                          Rs. {(primaryLand.priceLkr / 1000000).toFixed(1)}M LKR
                        </span>
                      )}
                    </div>

                    <a
                      href={`/properties/${primaryLand.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/properties/${primaryLand.slug}`);
                      }}
                      className="px-6 py-3 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#176B45] w-full sm:w-auto"
                    >
                      <span>Explore Land</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-350 ease-out group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
              </article>
            </div>

            {/* Right: Stacked Secondary Land Cards */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              {secondaryLand1 && (
                <div
                  style={{ transitionDelay: prefersReduced ? '0ms' : '70ms' }}
                  className={`transition-all duration-600 ease-out ${
                    sectionInView || prefersReduced
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-5'
                  }`}
                >
                  <CuratedLandMiniCard
                    property={secondaryLand1}
                    onNavigate={(slug) => navigate(`/properties/${slug}`)}
                    isSaved={isSaved(secondaryLand1.id)}
                    onToggleSave={() => toggleSave(secondaryLand1.id)}
                  />
                </div>
              )}

              {secondaryLand2 && (
                <div
                  style={{ transitionDelay: prefersReduced ? '0ms' : '140ms' }}
                  className={`transition-all duration-600 ease-out ${
                    sectionInView || prefersReduced
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-5'
                  }`}
                >
                  <CuratedLandMiniCard
                    property={secondaryLand2}
                    onNavigate={(slug) => navigate(`/properties/${slug}`)}
                    isSaved={isSaved(secondaryLand2.id)}
                    onToggleSave={() => toggleSave(secondaryLand2.id)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty Collection State */}
        {((activeTab === 'homes' && !primaryHome) || (activeTab === 'land' && !primaryLand)) && (
          <div className="p-12 text-center bg-[#F5F8F5] border border-[#DDE5DF] rounded-[4px] space-y-4">
            <p className="text-base text-[#5F6B63] font-medium">
              No curated {activeTab === 'homes' ? 'homes' : 'land listings'} currently available in this section.
            </p>
            <a
              href="/properties"
              onClick={(e) => {
                e.preventDefault();
                navigate('/properties');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px]"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// Sub-component for Secondary Homes Card
interface MiniCardProps {
  property: Property;
  actionLabel: string;
  onNavigate: (slug: string) => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

function CuratedMiniCard({
  property,
  actionLabel,
  onNavigate,
  isSaved,
  onToggleSave,
}: MiniCardProps) {
  const { formatPrice } = useCurrency();
  return (
    <article className="group bg-white border border-[#DDE5DF] hover:border-[#176B45]/60 rounded-[4px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden transition-colors flex flex-col sm:flex-row items-stretch">
      {/* Media Wrapper */}
      <div className="relative aspect-16/10 sm:aspect-square sm:w-44 shrink-0 overflow-hidden bg-[#F5F8F5]">
        <a
          href={`/properties/${property.slug}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(property.slug);
          }}
          className="block w-full h-full focus-visible:outline-2 focus-visible:outline-[#176B45]"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={property.images[0]}
            alt={property.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-350 ease-out group-hover:scale-[1.03]"
          />
        </a>

        {/* Independent Save Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleSave();
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/95 hover:bg-white text-[#18251E] rounded-[2px] shadow-xs backdrop-blur-xs flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45]"
          aria-label={
            isSaved ? `Remove ${property.title} from saved` : `Save ${property.title}`
          }
        >
          <Bookmark
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-[#C93636] text-[#C93636]' : 'text-[#18251E] hover:text-[#176B45]'
            }`}
          />
        </button>
      </div>

      {/* Info Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs uppercase font-bold tracking-wider text-[#5F6B63]">
            {property.location.city}, {property.location.district}
          </p>

          <h4 className="text-base font-bold text-[#18251E] leading-snug line-clamp-1">
            <a
              href={`/properties/${property.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(property.slug);
              }}
              className="hover:text-[#176B45] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px]"
            >
              {property.title}
            </a>
          </h4>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs font-semibold text-[#5F6B63]">
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-[#176B45]" />
              {property.specs.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-[#176B45]" />
              {property.specs.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-[#176B45]" />
              {property.specs.floorAreaSqFt} sq ft
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between">
          <span className="text-base font-extrabold text-[#103D2C] tabular-nums">
            {formatPrice(property.priceLkr, true)}
          </span>

          <a
            href={`/properties/${property.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(property.slug);
            }}
            className="text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#115236] inline-flex items-center gap-1"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-350 ease-out group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </article>
  );
}

// Sub-component for Secondary Land Card (Clean land-specific fields, NO bedrooms/bathrooms)
interface LandMiniCardProps {
  property: Property;
  onNavigate: (slug: string) => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

function CuratedLandMiniCard({
  property,
  onNavigate,
  isSaved,
  onToggleSave,
}: LandMiniCardProps) {
  const { formatPrice } = useCurrency();
  return (
    <article className="group bg-white border border-[#DDE5DF] hover:border-[#176B45]/60 rounded-[4px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden transition-colors flex flex-col sm:flex-row items-stretch">
      {/* Media Wrapper */}
      <div className="relative aspect-16/10 sm:aspect-square sm:w-44 shrink-0 overflow-hidden bg-[#F5F8F5]">
        <a
          href={`/properties/${property.slug}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(property.slug);
          }}
          className="block w-full h-full focus-visible:outline-2 focus-visible:outline-[#176B45]"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={property.images[0]}
            alt={property.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-350 ease-out group-hover:scale-[1.03]"
          />
        </a>

        {/* Independent Save Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleSave();
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/95 hover:bg-white text-[#18251E] rounded-[2px] shadow-xs backdrop-blur-xs flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45]"
          aria-label={
            isSaved ? `Remove ${property.title} from saved` : `Save ${property.title}`
          }
        >
          <Bookmark
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-[#C93636] text-[#C93636]' : 'text-[#18251E] hover:text-[#176B45]'
            }`}
          />
        </button>
      </div>

      {/* Info Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs uppercase font-bold tracking-wider text-[#5F6B63]">
            {property.location.city}, {property.location.district}
          </p>

          <h4 className="text-base font-bold text-[#18251E] leading-snug line-clamp-1">
            <a
              href={`/properties/${property.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(property.slug);
              }}
              className="hover:text-[#176B45] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px]"
            >
              {property.title}
            </a>
          </h4>

          {/* Land Extent Specification */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#176B45]">
            <Compass className="w-3.5 h-3.5" />
            <span>{property.specs.landPerches} Perches Extent</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between">
          <span className="text-base font-extrabold text-[#103D2C] tabular-nums">
            {formatPrice(property.priceLkr, true)}
          </span>

          <a
            href={`/properties/${property.slug}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(property.slug);
            }}
            className="text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#115236] inline-flex items-center gap-1"
          >
            <span>Explore Land</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-350 ease-out group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </article>
  );
}
