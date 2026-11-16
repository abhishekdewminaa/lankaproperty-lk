import { useMemo, useEffect, useRef, useState } from 'react';
import { Property } from '../types/property';
import { propertyService } from '../services/propertyService';
import { useRouter } from '../hooks/useRouter';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { formatPriceLkr } from '../utils/formatters';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Compass,
  Bookmark,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface FeaturedPropertiesProps {
  properties?: Property[];
}

// Session-level flag to ensure the entrance animation plays once
let globalFeaturedPropertiesHasRevealed = false;

export function FeaturedProperties({ properties }: FeaturedPropertiesProps) {
  const { navigate } = useRouter();
  const { isSaved, toggleSave } = useSavedProperties();
  const prefersReduced = usePrefersReducedMotion();

  const [sectionInView, setSectionInView] = useState(
    () => globalFeaturedPropertiesHasRevealed || prefersReduced
  );
  const sectionRef = useRef<HTMLElement | null>(null);

  // Filter only publicly eligible, active listings marked as featured
  const featuredListings = useMemo(() => {
    const source = properties && properties.length > 0 ? properties : propertyService.getPublicEligibleProperties();
    return source.filter((p: any) => (p.isFeatured || p.collections?.includes('featured')) && p.status !== 'sold');
  }, [properties]);

  // Viewport entrance observer (runs once)
  useEffect(() => {
    if (globalFeaturedPropertiesHasRevealed || prefersReduced) {
      setSectionInView(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setSectionInView(true);
      globalFeaturedPropertiesHasRevealed = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionInView(true);
          globalFeaturedPropertiesHasRevealed = true;
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [prefersReduced]);

  const formatPurposeAndType = (p: Property) => {
    const purposeText =
      p.purpose === 'buy' ? 'For Sale' : p.purpose === 'rent' ? 'For Rent' : 'Land';
    const typeText =
      p.type === 'house'
        ? 'House & Villa'
        : p.type === 'apartment'
        ? 'Apartment'
        : p.type === 'land'
        ? 'Land Parcel'
        : 'Commercial Property';
    return `${purposeText} · ${typeText}`;
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Featured Properties"
      className="py-16 sm:py-24 max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 w-full"
    >
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 pb-4 border-b border-[#DDE5DF]">
        <div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#18251E] tracking-tight">
            Featured Properties
          </h2>
          <p className="text-sm sm:text-base text-[#5F6B63] mt-1 max-w-2xl leading-relaxed">
            Explore selected homes, apartments, land, and investment properties across Sri Lanka.
          </p>
        </div>

        {/* Right-side link linking to property-results route with supported featured filter */}
        <a
          href="/properties?featured=true"
          onClick={(e) => {
            e.preventDefault();
            navigate('/properties?featured=true');
          }}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#115236] transition-colors self-start sm:self-auto py-1 focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px]"
        >
          <span>View All Featured Properties</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* FEATURED PROPERTIES LIST */}
      {featuredListings.length > 0 ? (
        <div className="space-y-7 sm:space-y-8">
          {featuredListings.map((property, index) => {
            const hasSpecs =
              (property.type !== 'land' &&
                ((property.specs.bedrooms && property.specs.bedrooms > 0) ||
                  (property.specs.bathrooms && property.specs.bathrooms > 0))) ||
              (property.specs.floorAreaSqFt && property.specs.floorAreaSqFt > 0) ||
              (property.specs.landPerches && property.specs.landPerches > 0);

            return (
              <article
                key={property.id}
                style={{
                  transitionDelay: prefersReduced ? '0ms' : `${index * 80}ms`,
                  transitionDuration: prefersReduced ? '0ms' : '550ms',
                }}
                className={`group relative bg-white border border-[#DDE5DF] hover:border-[#176B45]/60 rounded-[4px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-350 ease-out ${
                  sectionInView || prefersReduced
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-5'
                }`}
              >
                {/* Clean CSS Grid with explicit 52% image / 48% information ratio in normal document flow */}
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] items-stretch">
                  {/* Media Wrapper (52% width on desktop, 4:3 aspect ratio, zoom clipped inside) */}
                  <div className="relative w-full aspect-4/3 overflow-hidden bg-[#F5F8F5] block min-w-0">
                    <a
                      href={`/properties/${property.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/properties/${property.slug}`);
                      }}
                      className="block w-full h-full focus-visible:outline-2 focus-visible:outline-[#176B45] focus-visible:outline-offset-[-2px]"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover block transition-transform duration-350 ease-out ${
                          prefersReduced ? '' : 'group-hover:scale-[1.025]'
                        }`}
                        loading="lazy"
                      />
                    </a>

                    {/* Top-Left Badges: Featured and Purpose */}
                    <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 flex items-center gap-2 pointer-events-none">
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white/95 text-[#103D2C] rounded-[2px] shadow-xs backdrop-blur-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#176B45]" />
                        <span>Featured</span>
                      </span>
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px] shadow-xs">
                        {property.purpose === 'buy'
                          ? 'For Sale'
                          : property.purpose === 'rent'
                          ? 'For Rent'
                          : 'Land'}
                      </span>
                      {property.isUrgent && (
                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#C93636] text-white rounded-[2px] shadow-xs">
                          Urgent Sale
                        </span>
                      )}
                    </div>

                    {/* Top-Right Save Action: Independent button with accessible label */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleSave(property.id);
                      }}
                      className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 w-9 h-9 bg-white/95 hover:bg-white text-[#18251E] rounded-[2px] shadow-xs backdrop-blur-xs flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45]"
                      aria-label={
                        isSaved(property.id)
                          ? `Remove ${property.title} from saved`
                          : `Save ${property.title}`
                      }
                    >
                      <Bookmark
                        className={`w-4.5 h-4.5 transition-colors ${
                          isSaved(property.id)
                            ? 'fill-[#C93636] text-[#C93636]'
                            : 'text-[#18251E] hover:text-[#176B45]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Information Panel (48% width on desktop, 28-32px padding, normal flow) */}
                  <div className="min-w-0 p-5 sm:p-6 lg:p-7 xl:p-8 flex flex-col justify-between gap-6">
                    <div className="space-y-3 sm:space-y-3.5">
                      {/* 1. Location */}
                      <div className="flex items-center gap-1.5 text-sm text-[#5F6B63] font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#176B45] shrink-0" aria-hidden="true" />
                        <span>
                          {property.location.city}, {property.location.district}
                        </span>
                      </div>

                      {/* 2. Property Title (wraps naturally without clipping) */}
                      <h3 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[#18251E] leading-[1.25] break-words text-balance">
                        <a
                          href={`/properties/${property.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/properties/${property.slug}`);
                          }}
                          className="hover:text-[#176B45] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px]"
                        >
                          {property.title}
                        </a>
                      </h3>

                      {/* 3. Property Purpose and Type */}
                      <p className="text-xs uppercase font-extrabold tracking-wider text-[#176B45]">
                        {formatPurposeAndType(property)}
                      </p>

                      {/* 4. Short Description (Clamped to 3 lines) */}
                      <p className="text-[15px] sm:text-base text-[#5F6B63] leading-relaxed line-clamp-3">
                        {property.description}
                      </p>

                      {/* 5. Key Specifications (relevant facts only, no placeholder counts for land) */}
                      {hasSpecs && (
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2 text-xs sm:text-sm font-semibold text-[#18251E]">
                          {property.type !== 'land' &&
                            property.specs.bedrooms !== undefined &&
                            property.specs.bedrooms > 0 && (
                              <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                                <Bed className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                                <span>{property.specs.bedrooms} Beds</span>
                              </span>
                            )}
                          {property.type !== 'land' &&
                            property.specs.bathrooms !== undefined &&
                            property.specs.bathrooms > 0 && (
                              <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                                <Bath className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                                <span>{property.specs.bathrooms} Baths</span>
                              </span>
                            )}
                          {property.specs.floorAreaSqFt !== undefined &&
                            property.specs.floorAreaSqFt > 0 && (
                              <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                                <Maximize2 className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                                <span>{property.specs.floorAreaSqFt.toLocaleString()} sq ft</span>
                              </span>
                            )}
                          {property.specs.landPerches !== undefined &&
                            property.specs.landPerches > 0 && (
                              <span className="flex items-center gap-1.5 bg-[#F5F8F5] px-2.5 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                                <Compass className="w-4 h-4 text-[#176B45]" aria-hidden="true" />
                                <span>{property.specs.landPerches} Perches</span>
                              </span>
                            )}
                        </div>
                      )}
                    </div>

                    {/* 6. Divider & 7. Price and Action (wraps gracefully on mobile/tablet) */}
                    <div className="pt-5 sm:pt-6 border-t border-[#DDE5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-[#5F6B63] block font-medium">Valuation</span>
                        <span className="text-2xl sm:text-[26px] font-extrabold text-[#103D2C] tabular-nums block">
                          {property.priceLkr > 0
                            ? formatPriceLkr(property.priceLkr, property.priceUnit)
                            : 'Price on request'}
                        </span>
                      </div>

                      <a
                        href={`/properties/${property.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/properties/${property.slug}`);
                        }}
                        className="px-6 py-3 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[#176B45] w-full sm:w-auto"
                      >
                        <span>View Property</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-350 ease-out group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-[#F5F8F5] border border-[#DDE5DF] rounded-[4px] space-y-4">
          <p className="text-base text-[#5F6B63] font-medium">
            No featured properties currently available meeting the selected criteria.
          </p>
          <a
            href="/properties"
            onClick={(e) => {
              e.preventDefault();
              navigate('/properties');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px]"
          >
            <span>Explore All Marketplace Listings</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </section>
  );
}
