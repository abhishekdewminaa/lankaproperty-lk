import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { Property, PropertyPurpose, PropertyType } from '../types/property';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';
import { propertyService } from '../services/propertyService';
import { SRI_LANKA_DISTRICTS, getCitiesForDistrict } from '../data/locations';
import { calculateHaversineDistanceKm } from '../data/landmarks';
import { useCurrency } from '../context/CurrencyContext';
import { useCompare } from '../context/CompareContext';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Scale,
  Check,
} from 'lucide-react';

export function PropertiesPage() {
  const { searchParams, navigate } = useRouter();
  const { formatPrice, currency } = useCurrency();
  const { isInCompare, addToCompare } = useCompare();

  // View Mode: 'grid' (spacious 3-col) | 'dossier' (wide horizontal magazine spread)
  const [viewMode, setViewMode] = useState<'grid' | 'dossier'>('grid');

  // Read URL params
  const purposeParam = searchParams.get('purpose') || '';
  const featuredParam = searchParams.get('featured') || '';
  const districtParam = searchParams.get('district') || '';
  const cityParam = searchParams.get('city') || '';
  const typeParam = searchParams.get('type') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const bedroomsParam = searchParams.get('bedrooms') || '';
  const bathroomsParam = searchParams.get('bathrooms') || '';
  const minAreaParam = searchParams.get('minArea') || '';
  const furnishingParam = searchParams.get('furnishing') || '';
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const sortByParam = searchParams.get('sort') || 'newest';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const nearMeParam = searchParams.get('nearMe') === 'true';
  const landmarkParam = searchParams.get('landmark') || '';
  const latParam = Number(searchParams.get('lat')) || 0;
  const lngParam = Number(searchParams.get('lng')) || 0;
  const radiusParam = Number(searchParams.get('radius')) || 0;

  // Local filter states
  const [localPurpose, setLocalPurpose] = useState<string>(purposeParam);
  const [localDistrict, setLocalDistrict] = useState<string>(districtParam);
  const [localCity, setLocalCity] = useState<string>(cityParam);
  const [localType, setLocalType] = useState<string>(typeParam);
  const [localMinPrice, setLocalMinPrice] = useState<string>(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(maxPriceParam);
  const [localBedrooms, setLocalBedrooms] = useState<string>(bedroomsParam);
  const [localQuery, setLocalQuery] = useState<string>(queryParam);
  const [sortBy, setSortBy] = useState<string>(sortByParam);

  // Synchronize state whenever URL query params change
  useEffect(() => {
    setLocalPurpose(searchParams.get('purpose') || '');
    setLocalDistrict(searchParams.get('district') || '');
    setLocalCity(searchParams.get('city') || '');
    setLocalType(searchParams.get('type') || '');
    setLocalMinPrice(searchParams.get('minPrice') || '');
    setLocalMaxPrice(searchParams.get('maxPrice') || '');
    setLocalBedrooms(searchParams.get('bedrooms') || '');
    setLocalQuery(searchParams.get('q') || searchParams.get('search') || '');
    setSortBy(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  // District city dependencies
  const availableCities = useMemo(() => {
    return getCitiesForDistrict(localDistrict);
  }, [localDistrict]);

  // Apply filters to URL and reset pagination to page 1
  const applyFilters = (overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();

    const purposeVal = overrides.purpose !== undefined ? overrides.purpose : localPurpose;
    const districtVal = overrides.district !== undefined ? overrides.district : localDistrict;
    const cityVal = overrides.city !== undefined ? overrides.city : localCity;
    const typeVal = overrides.type !== undefined ? overrides.type : localType;
    const minPriceVal = overrides.minPrice !== undefined ? overrides.minPrice : localMinPrice;
    const maxPriceVal = overrides.maxPrice !== undefined ? overrides.maxPrice : localMaxPrice;
    const bedroomsVal = overrides.bedrooms !== undefined ? overrides.bedrooms : localBedrooms;
    const qVal = overrides.q !== undefined ? overrides.q : localQuery;
    const sortVal = overrides.sort !== undefined ? overrides.sort : sortBy;
    const pageVal = overrides.page !== undefined ? overrides.page : '1';

    if (purposeVal && purposeVal !== 'all') params.set('purpose', purposeVal);
    if (districtVal) params.set('district', districtVal);
    if (cityVal) params.set('city', cityVal);
    if (typeVal && typeVal !== 'all') params.set('type', typeVal);
    if (minPriceVal) params.set('minPrice', minPriceVal);
    if (maxPriceVal) params.set('maxPrice', maxPriceVal);
    if (bedroomsVal) params.set('bedrooms', bedroomsVal);
    if (qVal) params.set('search', qVal);
    if (sortVal && sortVal !== 'newest') params.set('sort', sortVal);
    if (pageVal && pageVal !== '1') params.set('page', pageVal);

    if (featuredParam === 'true' && overrides.featured !== 'false') {
      params.set('featured', 'true');
    }

    navigate(`/properties?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setLocalPurpose('');
    setLocalDistrict('');
    setLocalCity('');
    setLocalType('');
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setLocalBedrooms('');
    setLocalQuery('');
    setSortBy('newest');
    navigate('/properties');
  };

  // Authoritative published listings
  const filteredProperties = useMemo(() => {
    let result = propertyService.getPublicEligibleProperties();

    if (featuredParam === 'true') {
      result = result.filter((p) => p.isFeatured);
    }
    if (purposeParam && purposeParam !== 'all') {
      result = result.filter((p) => p.purpose === purposeParam);
    }
    if (districtParam) {
      result = result.filter((p) => p.location.district.toLowerCase() === districtParam.toLowerCase());
    }
    if (cityParam) {
      result = result.filter((p) => p.location.city.toLowerCase() === cityParam.toLowerCase());
    }
    if (typeParam && typeParam !== 'all') {
      result = result.filter((p) => p.type === typeParam);
    }
    if (minPriceParam) {
      result = result.filter((p) => p.priceLkr >= Number(minPriceParam));
    }
    if (maxPriceParam) {
      result = result.filter((p) => p.priceLkr <= Number(maxPriceParam));
    }
    if (bedroomsParam) {
      result = result.filter((p) => (p.specs.bedrooms || 0) >= Number(bedroomsParam));
    }
    if (queryParam) {
      const q = queryParam.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.district.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Proximity calculation if coordinates are present
    if (latParam && lngParam) {
      result = result
        .map((p) => {
          const coords = p.location.coordinates || { latitude: 6.9271, longitude: 79.8612 };
          const dist = calculateHaversineDistanceKm(
            latParam,
            lngParam,
            coords.latitude,
            coords.longitude
          );
          return {
            ...p,
            distanceKm: dist,
          };
        })
        .filter((p: any) => (radiusParam > 0 ? p.distanceKm <= radiusParam : true));

      if (nearMeParam || landmarkParam || sortBy === 'proximity') {
        return [...result].sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));
      }
    }

    // Sort order
    return [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceLkr - b.priceLkr;
      if (sortBy === 'price_desc') return b.priceLkr - a.priceLkr;
      if (sortBy === 'area_desc') return (b.specs.floorAreaSqFt || 0) - (a.specs.floorAreaSqFt || 0);
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    });
  }, [
    featuredParam,
    purposeParam,
    districtParam,
    cityParam,
    typeParam,
    minPriceParam,
    maxPriceParam,
    bedroomsParam,
    queryParam,
    sortBy,
    latParam,
    lngParam,
    radiusParam,
    nearMeParam,
    landmarkParam,
  ]);

  // Pagination (9 items per page)
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const currentPage = Math.min(pageParam, totalPages);
  const pagedProperties = filteredProperties.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount = [
    purposeParam,
    districtParam,
    cityParam,
    typeParam,
    minPriceParam,
    maxPriceParam,
    bedroomsParam,
    queryParam,
    featuredParam === 'true' ? 'featured' : '',
  ].filter(Boolean).length;

  const dynamicSeoTitle = [
    localType ? `${localType.charAt(0).toUpperCase() + localType.slice(1)}s` : 'Properties',
    localPurpose === 'rent' ? 'for Rent' : localPurpose === 'land' ? '& Land Plots' : 'for Sale & Rent',
    localCity ? `in ${localCity},` : '',
    localDistrict ? `${localDistrict} District, Sri Lanka` : 'in Sri Lanka (All 25 Districts)',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-20">
      <SeoHead
        title={`${dynamicSeoTitle} | LankaProperty.lk`}
        description={`Browse ${filteredProperties.length} verified ${dynamicSeoTitle.toLowerCase()} with clear title deeds, transparent LKR/USD valuations, and direct owner or agent WhatsApp contact.`}
        canonicalPath={localDistrict ? `/properties?district=${encodeURIComponent(localDistrict)}` : '/properties'}
        geoPlacename={localDistrict ? `${localCity ? `${localCity}, ` : ''}${localDistrict}, Sri Lanka` : 'Colombo, Sri Lanka'}
        jsonLd={{
          '@type': 'CollectionPage',
          name: dynamicSeoTitle,
          url: `https://lankaproperty.lk/properties${localDistrict ? `?district=${encodeURIComponent(localDistrict)}` : ''}`,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: filteredProperties.length,
            itemListElement: filteredProperties.slice(0, 12).map((p, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              url: `https://lankaproperty.lk/properties/${p.slug}`,
              name: p.title,
            })),
          },
        }}
      />

      {/* =========================================================================
          PAGE HEADER BANNER
          ========================================================================= */}
      <section className="bg-[#F5F8F5] border-b border-[#DDE5DF] py-10 sm:py-14">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-5 h-[2px] bg-[#176B45]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#176B45]">
                  MARKETPLACE INVENTORY · SRI LANKA
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-[#103D2C] tracking-tight leading-[1.1]">
                Sri Lanka Architectural Properties
              </h1>
              <p className="text-sm sm:text-base text-[#5F6B63] leading-relaxed">
                Explore authenticated freehold residences, beachfront land plots, and luxury condominium assets across prime Sri Lankan destinations.
              </p>
            </div>

            {/* Search Input & Live Stats */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyFilters({ q: localQuery });
                }}
                className="relative flex items-center w-full sm:w-80"
              >
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Search city, neighborhood, or title..."
                  className="w-full h-10 pl-3.5 pr-20 bg-white border border-[#DDE5DF] rounded-[2px] text-xs font-semibold text-[#18251E] focus:outline-none focus:border-[#103D2C] shadow-2xs"
                />
                <button
                  type="submit"
                  className="absolute right-1 px-3 h-8 bg-[#103D2C] hover:bg-[#176B45] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              <div className="bg-white border border-[#DDE5DF] px-4 py-2 rounded-[2px] shadow-2xs text-right shrink-0">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#5F6B63] block">
                  ACTIVE PORTFOLIO
                </span>
                <span className="text-base font-extrabold text-[#103D2C] tabular-nums">
                  {filteredProperties.length} Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FULL-WIDTH TOP ARCHITECTURAL FILTER COMMAND BAR
          Replaces awkward left sidebar with clean, comprehensive horizontal controls
          ========================================================================= */}
      <section className="bg-white border-b border-[#DDE5DF] py-5 sticky top-[72px] z-30 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/95">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-4">
          {/* Row 1: Primary Architectural Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Purpose */}
            <div>
              <label htmlFor="filter-purpose" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                Transaction Purpose
              </label>
              <select
                id="filter-purpose"
                value={localPurpose}
                onChange={(e) => {
                  setLocalPurpose(e.target.value);
                  applyFilters({ purpose: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#F5F8F5] border border-[#DDE5DF] rounded-[2px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">All Purposes</option>
                <option value="buy">Buy Freehold</option>
                <option value="rent">Long-Term Rent</option>
                <option value="land">Land Parcels</option>
              </select>
            </div>

            {/* 2. District */}
            <div>
              <label htmlFor="filter-district" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                District / Region
              </label>
              <select
                id="filter-district"
                value={localDistrict}
                onChange={(e) => {
                  setLocalDistrict(e.target.value);
                  setLocalCity('');
                  applyFilters({ district: e.target.value, city: '' });
                }}
                className="w-full h-10 px-3 text-xs bg-[#F5F8F5] border border-[#DDE5DF] rounded-[2px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">All Sri Lanka</option>
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. City (Dependent) */}
            <div>
              <label htmlFor="filter-city" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                City / Enclave
              </label>
              <select
                id="filter-city"
                value={localCity}
                disabled={!localDistrict}
                onChange={(e) => {
                  setLocalCity(e.target.value);
                  applyFilters({ city: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#F5F8F5] border border-[#DDE5DF] rounded-[2px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:bg-[#EAEAEA] disabled:text-[#888888]"
              >
                <option value="">{localDistrict ? 'All Cities' : 'Select District First'}</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Category */}
            <div>
              <label htmlFor="filter-type" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                Property Category
              </label>
              <select
                id="filter-type"
                value={localType}
                onChange={(e) => {
                  setLocalType(e.target.value);
                  applyFilters({ type: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#F5F8F5] border border-[#DDE5DF] rounded-[2px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="house">Houses & Villas</option>
                <option value="apartment">Condominiums</option>
                <option value="land">Residential & Beach Land</option>
                <option value="commercial">Commercial Buildings</option>
              </select>
            </div>

            {/* 5. Budget Tier */}
            <div>
              <label htmlFor="filter-budget" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                Budget Threshold
              </label>
              <select
                id="filter-budget"
                value={localMinPrice ? `${localMinPrice}-${localMaxPrice}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setLocalMinPrice('');
                    setLocalMaxPrice('');
                    applyFilters({ minPrice: '', maxPrice: '' });
                  } else {
                    const [min, max] = val.split('-');
                    setLocalMinPrice(min || '');
                    setLocalMaxPrice(max || '');
                    applyFilters({ minPrice: min || '', maxPrice: max || '' });
                  }
                }}
                className="w-full h-10 px-3 text-xs bg-[#F5F8F5] border border-[#DDE5DF] rounded-[2px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">Any Budget</option>
                <option value="0-25000000">Under Rs. 25M</option>
                <option value="25000000-50000000">Rs. 25M – 50M</option>
                <option value="50000000-100000000">Rs. 50M – 100M</option>
                <option value="100000000-250000000">Rs. 100M – 250M</option>
                <option value="250000000-">Rs. 250M+</option>
              </select>
            </div>

            {/* 6. Bedrooms */}
            <div>
              <label htmlFor="filter-bedrooms" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                Minimum Bedrooms
              </label>
              <select
                id="filter-bedrooms"
                value={localBedrooms}
                disabled={localType === 'land' || localPurpose === 'land'}
                onChange={(e) => {
                  setLocalBedrooms(e.target.value);
                  applyFilters({ bedrooms: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#F5F8F5] border border-[#DDE5DF] rounded-[2px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:bg-[#EAEAEA] disabled:text-[#888888]"
              >
                <option value="">Any Bedrooms</option>
                <option value="1">1+ Bedrooms</option>
                <option value="2">2+ Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
                <option value="5">5+ Bedrooms</option>
              </select>
            </div>
          </div>

          {/* Row 2: Quick Curated Filter Chips & Clear */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DDE5DF]/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mr-1">
                CURATED COLLECTIONS:
              </span>
              <button
                type="button"
                onClick={() => applyFilters({ type: 'apartment' })}
                className={`px-3 py-1 text-xs rounded-[2px] border transition-colors cursor-pointer ${
                  localType === 'apartment'
                    ? 'bg-[#103D2C] text-white border-[#103D2C] font-bold'
                    : 'bg-[#F5F8F5] text-[#18251E] border-[#DDE5DF] hover:bg-[#E8F3EC]'
                }`}
              >
                Freehold Condominiums (CMA Act)
              </button>
              <button
                type="button"
                onClick={() => applyFilters({ district: 'Galle' })}
                className={`px-3 py-1 text-xs rounded-[2px] border transition-colors cursor-pointer ${
                  localDistrict === 'Galle'
                    ? 'bg-[#103D2C] text-white border-[#103D2C] font-bold'
                    : 'bg-[#F5F8F5] text-[#18251E] border-[#DDE5DF] hover:bg-[#E8F3EC]'
                }`}
              >
                Southern Beachfront & Galle
              </button>
              <button
                type="button"
                onClick={() => applyFilters({ district: 'Colombo', q: 'Cinnamon Gardens' })}
                className="px-3 py-1 text-xs bg-[#F5F8F5] text-[#18251E] border border-[#DDE5DF] hover:bg-[#E8F3EC] rounded-[2px] transition-colors cursor-pointer"
              >
                Colombo 07 Estates
              </button>
              <button
                type="button"
                onClick={() => applyFilters({ type: 'land' })}
                className={`px-3 py-1 text-xs rounded-[2px] border transition-colors cursor-pointer ${
                  localType === 'land'
                    ? 'bg-[#103D2C] text-white border-[#103D2C] font-bold'
                    : 'bg-[#F5F8F5] text-[#18251E] border-[#DDE5DF] hover:bg-[#E8F3EC]'
                }`}
              >
                Coastal Land Plots
              </button>
            </div>

            {/* Reset All */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C93636] hover:text-[#A92828] uppercase tracking-wider cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All ({activeFilterCount})</span>
              </button>
            )}
          </div>

          {/* Active Filter Tags Strip (matching screenshot: ACTIVE FILTERS: Purpose: BUY x | Clear All) */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-[#DDE5DF]/60 text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63]">
                ACTIVE FILTERS:
              </span>
              {purposeParam && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalPurpose('');
                    applyFilters({ purpose: '' });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] font-bold rounded-[2px] border border-[#176B45]/30 hover:bg-[#D4E8DC] transition-colors cursor-pointer"
                >
                  <span>Purpose: {purposeParam.toUpperCase()}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {districtParam && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalDistrict('');
                    setLocalCity('');
                    applyFilters({ district: '', city: '' });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] font-bold rounded-[2px] border border-[#176B45]/30 hover:bg-[#D4E8DC] transition-colors cursor-pointer"
                >
                  <span>District: {districtParam}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {cityParam && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalCity('');
                    applyFilters({ city: '' });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] font-bold rounded-[2px] border border-[#176B45]/30 hover:bg-[#D4E8DC] transition-colors cursor-pointer"
                >
                  <span>City: {cityParam}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {typeParam && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalType('');
                    applyFilters({ type: '' });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] font-bold rounded-[2px] border border-[#176B45]/30 hover:bg-[#D4E8DC] transition-colors cursor-pointer"
                >
                  <span>Category: {typeParam.toUpperCase()}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {queryParam && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalQuery('');
                    applyFilters({ q: '' });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] font-bold rounded-[2px] border border-[#176B45]/30 hover:bg-[#D4E8DC] transition-colors cursor-pointer"
                >
                  <span>Search: "{queryParam}"</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              {bedroomsParam && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalBedrooms('');
                    applyFilters({ bedrooms: '' });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] font-bold rounded-[2px] border border-[#176B45]/30 hover:bg-[#D4E8DC] transition-colors cursor-pointer"
                >
                  <span>{bedroomsParam}+ Beds</span>
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#C93636] hover:underline uppercase tracking-wider ml-2 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          RESULTS CONTROL TOOLBAR & VIEW MODE SWITCHER
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-8 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#103D2C] tracking-tight">
              Marketplace Portfolio ({filteredProperties.length})
            </h2>
            <p className="text-xs text-[#5F6B63] mt-0.5">
              Showing page {currentPage} of {totalPages} · Price values in <span className="font-bold text-[#103D2C]">{currency}</span>
            </p>
          </div>

          {/* Controls: View Mode & Sort */}
          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#F5F8F5] border border-[#DDE5DF] p-1 rounded-[2px]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#103D2C] text-white'
                    : 'text-[#5F6B63] hover:text-[#18251E]'
                }`}
                title="3-Column Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('dossier')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'dossier'
                    ? 'bg-[#103D2C] text-white'
                    : 'text-[#5F6B63] hover:text-[#18251E]'
                }`}
                title="Architectural Dossier List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dossier List</span>
              </button>
            </div>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                applyFilters({ sort: e.target.value });
              }}
              className="h-9 px-3 text-xs bg-white border border-[#DDE5DF] rounded-[2px] font-bold text-[#18251E] focus:border-[#103D2C] focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Floor Area: Largest</option>
            </select>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN PROPERTY INVENTORY DISPLAY
          ========================================================================= */}
      <main className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
        {(nearMeParam || landmarkParam) && (
          <div className="mb-6 p-4 bg-[#E8F3EC] border border-[#176B45]/40 rounded-[2px] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#176B45] animate-pulse" />
              <span className="font-bold text-[#103D2C]">
                {landmarkParam
                  ? `Showing properties sorted by proximity to landmark: ${landmarkParam}`
                  : `Showing properties sorted by proximity to current GPS coordinates`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/properties')}
              className="text-xs font-bold text-[#176B45] hover:underline cursor-pointer"
            >
              Reset Proximity Filter ✕
            </button>
          </div>
        )}

        {pagedProperties.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              /* Spacious 3-Column Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {pagedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              /* Architectural Dossier List View (Wide horizontal cards) */
              <div className="space-y-6">
                {pagedProperties.map((property) => {
                  const compared = isInCompare(property.id);
                  return (
                    <article
                      key={property.id}
                      onClick={() => navigate(`/properties/${property.slug}`)}
                      className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[3px] overflow-hidden shadow-2xs hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-200 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-0"
                    >
                      {/* Left: 16:10 Photo (5 cols) */}
                      <div className="md:col-span-5 relative aspect-16/10 md:aspect-auto overflow-hidden bg-[#F5F8F5]">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-[#103D2C] rounded-[2px] shadow-xs">
                            {property.purpose.toUpperCase()}
                          </span>
                          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#103D2C]/90 text-white rounded-[2px]">
                            {property.type === 'apartment' ? 'Condominium Title' : 'Freehold Title'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Detailed Architectural Dossier Specs (7 cols) */}
                      <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] uppercase font-extrabold tracking-wider text-[#176B45]">
                              {property.location.city}, {property.location.district}
                            </span>
                            <span className="text-xs text-[#5F6B63] tabular-nums font-medium">
                              Ref: {property.listingRef || 'LP-SRI-2026'}
                            </span>
                          </div>

                          <h3 className="text-xl sm:text-2xl font-extrabold text-[#18251E] group-hover:text-[#103D2C] transition-colors mt-1 leading-snug">
                            {property.title}
                          </h3>

                          <p className="text-xs sm:text-sm text-[#5F6B63] mt-2 line-clamp-2 leading-relaxed">
                            {property.description}
                          </p>

                          {/* Specifications Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#DDE5DF]">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">Bedrooms</span>
                              <span className="text-sm font-extrabold text-[#18251E] tabular-nums">
                                {property.specs.bedrooms ? `${property.specs.bedrooms} Beds` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">Bathrooms</span>
                              <span className="text-sm font-extrabold text-[#18251E] tabular-nums">
                                {property.specs.bathrooms ? `${property.specs.bathrooms} Baths` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">Floor Area</span>
                              <span className="text-sm font-extrabold text-[#18251E] tabular-nums">
                                {property.specs.floorAreaSqFt ? `${property.specs.floorAreaSqFt.toLocaleString()} sq.ft.` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">Land Extent</span>
                              <span className="text-sm font-extrabold text-[#18251E] tabular-nums">
                                {property.specs.landPerches ? `${property.specs.landPerches} Perches` : property.specs.landAcres ? `${property.specs.landAcres} Acres` : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer Strip */}
                        <div className="pt-4 border-t border-[#DDE5DF] flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-extrabold text-[#5F6B63] block">
                              VALUATION
                            </span>
                            <div className="text-2xl font-extrabold text-[#103D2C] tabular-nums">
                              {formatPrice(property.priceLkr)}
                              {property.purpose === 'rent' && <span className="text-xs text-[#5F6B63] font-normal ml-1">/ month</span>}
                            </div>
                            {currency !== 'LKR' && (
                              <span className="text-xs text-[#5F6B63] tabular-nums block">
                                Rs. {(property.priceLkr / 1000000).toFixed(1)}M LKR
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCompare(property);
                              }}
                              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                compared
                                  ? 'bg-[#103D2C] text-white border-[#103D2C]'
                                  : 'bg-white text-[#18251E] border-[#DDE5DF] hover:bg-[#F5F8F5]'
                              }`}
                            >
                              <Scale className="w-3.5 h-3.5" />
                              <span>{compared ? 'In Compare' : 'Compare'}</span>
                            </button>
                            <span className="px-4 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider rounded-[2px] transition-colors">
                              View Dossier →
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="pt-12 flex items-center justify-between border-t border-[#DDE5DF] mt-12">
                <button
                  type="button"
                  onClick={() => applyFilters({ page: String(currentPage - 1) })}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-[2px] border border-[#DDE5DF] text-[#18251E] hover:bg-[#F5F8F5] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => applyFilters({ page: String(pNum) })}
                      className={`w-8 h-8 rounded-[2px] text-xs font-bold transition-colors ${
                        currentPage === pNum
                          ? 'bg-[#103D2C] text-white'
                          : 'bg-white text-[#18251E] border border-[#DDE5DF] hover:bg-[#F5F8F5]'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => applyFilters({ page: String(currentPage + 1) })}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider rounded-[2px] border border-[#DDE5DF] text-[#18251E] hover:bg-[#F5F8F5] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        ) : (
          /* Helpful Empty State */
          <div className="py-20 text-center bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] p-8 space-y-4">
            <div className="w-12 h-12 bg-white border border-[#DDE5DF] text-[#176B45] rounded-[3px] flex items-center justify-center mx-auto shadow-xs">
              <SlidersHorizontal className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-extrabold text-[#18251E]">No properties match your filter criteria</h3>
              <p className="text-xs text-[#5F6B63] leading-relaxed">
                Try broadening your budget thresholds, removing specific bedroom or district constraints, or clearing all filters to view all available Sri Lankan listings.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
