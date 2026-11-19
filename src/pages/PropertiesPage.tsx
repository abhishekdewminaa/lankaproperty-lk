import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';
import { propertyService } from '../services/propertyService';
import { SRI_LANKA_DISTRICTS, getCitiesForDistrict } from '../data/locations';
import { calculateHaversineDistanceKm } from '../data/landmarks';
import { useCurrency } from '../context/CurrencyContext';
import { useCompare } from '../context/CompareContext';

function cleanText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}✔✅✓☑️⭐✨🔥💎📍🏡🏠🏢📞☎️💰💵🏷️🔹🔸▪️▫️►▸→←↗↓]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getCategoryLabel(type: string): string {
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

export function PropertiesPage() {
  const { searchParams, navigate } = useRouter();
  const { formatPrice, currency } = useCurrency();
  const { isInCompare, addToCompare } = useCompare();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    propertyService.syncWithSupabase(false);
    const unsub = propertyService.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  // Read URL params
  const purposeParam = searchParams.get('purpose') || '';
  const featuredParam = searchParams.get('featured') || '';
  const districtParam = searchParams.get('district') || '';
  const cityParam = searchParams.get('city') || '';
  const typeParam = searchParams.get('type') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const bedroomsParam = searchParams.get('bedrooms') || '';
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

  const availableCities = useMemo(() => {
    return getCitiesForDistrict(localDistrict);
  }, [localDistrict]);

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

  const filteredProperties = useMemo(() => {
    let result = propertyService.getPublicEligibleProperties();

    if (featuredParam === 'true') {
      result = result.filter((p) => p.isFeatured);
    }
    if (purposeParam && purposeParam !== 'all') {
      if (purposeParam === 'land') {
        result = result.filter((p) => p.type === 'land' || p.purpose === 'land');
      } else {
        result = result.filter((p) => p.purpose === purposeParam);
      }
    }
    if (districtParam) {
      result = result.filter(
        (p) => p.location.district.toLowerCase() === districtParam.toLowerCase()
      );
    }
    if (cityParam) {
      result = result.filter((p) => p.location.city.toLowerCase() === cityParam.toLowerCase());
    }
    if (typeParam && typeParam !== 'all') {
      result = result.filter((p) =>
        typeParam === 'business'
          ? p.type === 'business' || p.type === 'commercial'
          : p.type === typeParam
      );
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

    return [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceLkr - b.priceLkr;
      if (sortBy === 'price_desc') return b.priceLkr - a.priceLkr;
      if (sortBy === 'area_desc')
        return (b.specs.floorAreaSqFt || 0) - (a.specs.floorAreaSqFt || 0);
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
    storeVersion,
  ]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const currentPage = Math.min(pageParam, totalPages);
  const pagedProperties = filteredProperties.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
    localType ? `${getCategoryLabel(localType)} Properties` : 'Properties',
    localPurpose === 'rent' ? 'for Rent' : 'for Sale & Rent',
    localCity ? `in ${localCity},` : '',
    localDistrict ? `${localDistrict} District, Sri Lanka` : 'in Sri Lanka',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="bg-white min-h-screen pb-20 max-sm:[zoom:0.9]">
      <SeoHead
        title={`${dynamicSeoTitle} | LankaProperty.lk`}
        description={`Browse ${filteredProperties.length} verified ${dynamicSeoTitle.toLowerCase()} across Sri Lanka with direct owner and agent contact.`}
        canonicalPath={
          localDistrict
            ? `/properties?district=${encodeURIComponent(localDistrict)}`
            : '/properties'
        }
        geoPlacename={
          localDistrict
            ? `${localCity ? `${localCity}, ` : ''}${localDistrict}, Sri Lanka`
            : 'Colombo, Sri Lanka'
        }
        jsonLd={{
          '@type': 'CollectionPage',
          name: dynamicSeoTitle,
          url: `https://lankaproperty.lk/properties${
            localDistrict ? `?district=${encodeURIComponent(localDistrict)}` : ''
          }`,
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
      <section className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-8 sm:py-12">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
                Sri Lanka Property Directory
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#103D2C] tracking-tight leading-tight">
                {dynamicSeoTitle}
              </h1>
              <p className="text-sm text-[#5F6B63] leading-relaxed">
                Browse verified land, houses, apartments, hotels, and business properties across all 25 districts of Sri Lanka.
              </p>
            </div>

            {/* Search Input & Live Count */}
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
                  placeholder="Search city, road, or keyword..."
                  className="w-full h-10 pl-3.5 pr-20 bg-white border border-[#DDE5DF] rounded-[3px] text-xs font-semibold text-[#18251E] focus:outline-none focus:border-[#103D2C]"
                />
                <button
                  type="submit"
                  className="absolute right-1 px-3.5 h-8 bg-[#103D2C] hover:bg-[#176B45] text-white text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              <div className="bg-white border border-[#DDE5DF] px-4 py-2 rounded-[3px] text-right shrink-0">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#5F6B63] block">
                  Available Listings
                </span>
                <span className="text-base font-extrabold text-[#103D2C] tabular-nums">
                  {filteredProperties.length} Properties
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TOP FILTER BAR
          ========================================================================= */}
      <section className="bg-white border-b border-[#DDE5DF] py-5 sticky top-[64px] z-30 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-4">
          {/* Primary Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Purpose */}
            <div>
              <label
                htmlFor="filter-purpose"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1"
              >
                Purpose
              </label>
              <select
                id="filter-purpose"
                value={localPurpose}
                onChange={(e) => {
                  setLocalPurpose(e.target.value);
                  applyFilters({ purpose: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">All Listings</option>
                <option value="buy">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="land">Land</option>
              </select>
            </div>

            {/* 2. District */}
            <div>
              <label
                htmlFor="filter-district"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1"
              >
                District
              </label>
              <select
                id="filter-district"
                value={localDistrict}
                onChange={(e) => {
                  setLocalDistrict(e.target.value);
                  setLocalCity('');
                  applyFilters({ district: e.target.value, city: '' });
                }}
                className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">All 25 Districts</option>
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. City */}
            <div>
              <label
                htmlFor="filter-city"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1"
              >
                City / Town
              </label>
              <select
                id="filter-city"
                value={localCity}
                disabled={!localDistrict}
                onChange={(e) => {
                  setLocalCity(e.target.value);
                  applyFilters({ city: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:opacity-60"
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
              <label
                htmlFor="filter-type"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1"
              >
                Category
              </label>
              <select
                id="filter-type"
                value={localType}
                onChange={(e) => {
                  setLocalType(e.target.value);
                  applyFilters({ type: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="land">Land</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="hotel">Hotel</option>
                <option value="business">Business</option>
              </select>
            </div>

            {/* 5. Price Range */}
            <div>
              <label
                htmlFor="filter-budget"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1"
              >
                Price Range
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
                className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
              >
                <option value="">Any Price</option>
                <option value="0-25000000">Under Rs. 25M</option>
                <option value="25000000-50000000">Rs. 25M – 50M</option>
                <option value="50000000-100000000">Rs. 50M – 100M</option>
                <option value="100000000-250000000">Rs. 100M – 250M</option>
                <option value="250000000-">Above Rs. 250M</option>
              </select>
            </div>

            {/* 6. Bedrooms */}
            <div>
              <label
                htmlFor="filter-bedrooms"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1"
              >
                Bedrooms
              </label>
              <select
                id="filter-bedrooms"
                value={localBedrooms}
                disabled={localType === 'land' || localPurpose === 'land'}
                onChange={(e) => {
                  setLocalBedrooms(e.target.value);
                  applyFilters({ bedrooms: e.target.value });
                }}
                className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:opacity-60"
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

          {/* Row 2: Quick Category & District Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#DDE5DF]/60">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] mr-1">
                Quick Filter:
              </span>
              {[
                { label: 'All', type: '' },
                { label: 'Land', type: 'land' },
                { label: 'House', type: 'house' },
                { label: 'Apartment', type: 'apartment' },
                { label: 'Hotel', type: 'hotel' },
                { label: 'Business', type: 'business' },
              ].map((chip) => {
                const isActive = (localType || '') === chip.type;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setLocalType(chip.type);
                      applyFilters({ type: chip.type });
                    }}
                    className={`px-3 py-1 text-xs rounded-[3px] border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#103D2C] text-white border-[#103D2C] font-bold'
                        : 'bg-[#FAFBF9] text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#C93636] hover:underline uppercase tracking-wider cursor-pointer"
              >
                Clear All Filters ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          RESULTS CONTROL TOOLBAR
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-8 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#103D2C] tracking-tight">
              Showing {filteredProperties.length} Properties
            </h2>
            <p className="text-xs text-[#5F6B63] mt-0.5">
              Page {currentPage} of {totalPages} · Prices displayed in{' '}
              <span className="font-bold text-[#103D2C]">{currency}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#FAFBF9] border border-[#DDE5DF] p-1 rounded-[3px]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#103D2C] text-white'
                    : 'text-[#5F6B63] hover:text-[#18251E]'
                }`}
              >
                Grid View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#103D2C] text-white'
                    : 'text-[#5F6B63] hover:text-[#18251E]'
                }`}
              >
                List View
              </button>
            </div>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                applyFilters({ sort: e.target.value });
              }}
              className="h-9 px-3 text-xs bg-white border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:border-[#103D2C] focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Area: Largest First</option>
            </select>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN PROPERTY LISTINGS DISPLAY
          ========================================================================= */}
      <main className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
        {(nearMeParam || landmarkParam) && (
          <div className="mb-6 p-4 bg-[#E8F3EC] border border-[#176B45]/40 rounded-[3px] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[#103D2C]">
              {landmarkParam
                ? `Showing properties near: ${landmarkParam}`
                : `Showing properties sorted by distance from your location`}
            </span>
            <button
              type="button"
              onClick={() => navigate('/properties')}
              className="text-xs font-bold text-[#176B45] hover:underline cursor-pointer"
            >
              Clear Location Filter
            </button>
          </div>
        )}

        {pagedProperties.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {pagedProperties.map((property) => {
                  const compared = isInCompare(property.id);
                  const cleanTitle = cleanText(property.title);
                  const cleanDesc = cleanText(property.description);
                  return (
                    <article
                      key={property.id}
                      onClick={() => navigate(`/properties/${property.slug}`)}
                      className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden shadow-2xs transition-all cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-0"
                    >
                      <div className="md:col-span-5 relative aspect-16/10 md:aspect-auto overflow-hidden bg-[#F5F8F5]">
                        <img
                          src={property.images[0]}
                          alt={cleanTitle}
                          onError={(e) => {
                            const imgEl = e.currentTarget;
                            const filename = imgEl.src.split('/').pop() || '';
                            const fallback =
                              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';
                            if (
                              imgEl.src.includes('supabase.co') &&
                              filename &&
                              !imgEl.dataset.triedLocal
                            ) {
                              imgEl.dataset.triedLocal = 'true';
                              imgEl.src = `/uploads/properties/${filename}`;
                            } else if (imgEl.src !== fallback) {
                              imgEl.src = fallback;
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px]">
                            {getCategoryLabel(property.type)}
                          </span>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#103D2C] rounded-[2px]">
                            {property.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-7 p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider text-[#176B45]">
                              {property.location.city}, {property.location.district}
                            </span>
                            {property.listingRef && (
                              <span className="text-[#5F6B63] tabular-nums font-medium">
                                Ref: {property.listingRef}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-[#18251E] group-hover:text-[#103D2C] transition-colors mt-1 leading-snug">
                            {cleanTitle}
                          </h3>

                          <p className="text-xs sm:text-sm text-[#5F6B63] mt-2 line-clamp-2 leading-relaxed">
                            {cleanDesc}
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#DDE5DF]">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">
                                Bedrooms
                              </span>
                              <span className="text-sm font-bold text-[#18251E] tabular-nums">
                                {property.specs.bedrooms ? `${property.specs.bedrooms} Beds` : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">
                                Bathrooms
                              </span>
                              <span className="text-sm font-bold text-[#18251E] tabular-nums">
                                {property.specs.bathrooms
                                  ? `${property.specs.bathrooms} Baths`
                                  : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">
                                Floor Area
                              </span>
                              <span className="text-sm font-bold text-[#18251E] tabular-nums">
                                {property.specs.floorAreaSqFt
                                  ? `${property.specs.floorAreaSqFt.toLocaleString()} sq ft`
                                  : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">
                                Land Area
                              </span>
                              <span className="text-sm font-bold text-[#18251E] tabular-nums">
                                {property.specs.landPerches
                                  ? `${property.specs.landPerches} Perches`
                                  : property.specs.landAcres
                                  ? `${property.specs.landAcres} Acres`
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#DDE5DF] flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">
                              Price
                            </span>
                            <div className="text-xl sm:text-2xl font-extrabold text-[#103D2C] tabular-nums">
                              {property.priceLkr > 0
                                ? formatPrice(property.priceLkr)
                                : 'Price on Request'}
                              {property.purpose === 'rent' && property.priceLkr > 0 && (
                                <span className="text-xs text-[#5F6B63] font-normal ml-1">
                                  / month
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCompare(property);
                              }}
                              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] border transition-colors cursor-pointer ${
                                compared
                                  ? 'bg-[#103D2C] text-white border-[#103D2C]'
                                  : 'bg-white text-[#18251E] border-[#DDE5DF] hover:bg-[#F5F8F5]'
                              }`}
                            >
                              {compared ? 'Comparing' : 'Compare'}
                            </button>
                            <span className="px-4 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors">
                              View Details
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
              <nav
                aria-label="Pagination"
                className="pt-10 flex items-center justify-between border-t border-[#DDE5DF] mt-10"
              >
                <button
                  type="button"
                  onClick={() => applyFilters({ page: String(currentPage - 1) })}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] border border-[#DDE5DF] text-[#18251E] hover:bg-[#F5F8F5] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => applyFilters({ page: String(pNum) })}
                      className={`w-8 h-8 rounded-[3px] text-xs font-bold transition-colors cursor-pointer ${
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
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] border border-[#DDE5DF] text-[#18251E] hover:bg-[#F5F8F5] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <div className="py-16 text-center bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] p-8 space-y-4">
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[#18251E]">
                No properties match your selected filters
              </h3>
              <p className="text-xs text-[#5F6B63] leading-relaxed">
                Try adjusting your price range, category, or district filters, or reset all filters to view all available listings.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
