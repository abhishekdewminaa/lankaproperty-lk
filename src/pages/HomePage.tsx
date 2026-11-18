import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { propertyService } from '../services/propertyService';
import { homepageConfigService } from '../services/homepageConfigService';
import { DEVELOPMENTS_DATA } from '../data/developments';
import { SRI_LANKA_DISTRICTS, getCitiesForDistrict } from '../data/locations';
import { PropertyCard } from '../components/PropertyCard';
import { DistrictCadastralExplorer } from '../components/DistrictCadastralExplorer';
import { SeoHead } from '../components/SeoHead';
import { useCurrency } from '../context/CurrencyContext';
import { advertisingPackageService, AdvertisedPackage } from '../services/advertisingPackageService';

export function HomePage() {
  const { navigate, searchParams } = useRouter();
  const { formatPrice, currency } = useCurrency();

  const isPreviewHomepage = searchParams.get('previewHomepage') === 'true';

  const [homepageConfig, setHomepageConfig] = useState(() => {
    return isPreviewHomepage
      ? homepageConfigService.getDraftConfig()
      : homepageConfigService.getPublishedConfig();
  });

  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    propertyService.syncWithSupabase(false);

    const unsubHomepage = homepageConfigService.subscribe(() => {
      setHomepageConfig(
        isPreviewHomepage
          ? homepageConfigService.getDraftConfig()
          : homepageConfigService.getPublishedConfig()
      );
    });

    const unsubProperties = propertyService.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });

    return () => {
      unsubHomepage();
      unsubProperties();
    };
  }, [isPreviewHomepage]);

  // Hero Search Form State
  const [heroPurpose, setHeroPurpose] = useState<'buy' | 'rent' | 'land'>('buy');
  const [heroLocation, setHeroLocation] = useState('');
  const [heroCity, setHeroCity] = useState('');
  const [heroType, setHeroType] = useState('all');
  const [heroBudgetRange, setHeroBudgetRange] = useState('');
  const [heroKeyword, setHeroKeyword] = useState('');

  // Category Filter Tabs
  const [featuredCategoryFilter, setFeaturedCategoryFilter] = useState<string>('all');
  const [trendingCategoryFilter, setTrendingCategoryFilter] = useState<string>('all');

  // Advertising Packages
  const [activePackageTab, setActivePackageTab] = useState<'direct' | 'strategic'>('direct');
  const [packagesList, setPackagesList] = useState<AdvertisedPackage[]>(() =>
    advertisingPackageService.getAllPackages()
  );

  useEffect(() => {
    return advertisingPackageService.subscribe(() => {
      setPackagesList(advertisingPackageService.getAllPackages());
    });
  }, []);

  const heroAvailableCities = useMemo(() => {
    return getCitiesForDistrict(heroLocation);
  }, [heroLocation]);

  const eligibleProperties = useMemo(() => {
    return propertyService.getPublicEligibleProperties();
  }, [storeVersion]);

  // Category Counts
  const categoryStats = useMemo(() => {
    const counts = {
      land: 0,
      house: 0,
      apartment: 0,
      hotel: 0,
      business: 0,
    };
    eligibleProperties.forEach((p) => {
      if (p.type === 'land') counts.land++;
      else if (p.type === 'house') counts.house++;
      else if (p.type === 'apartment') counts.apartment++;
      else if (p.type === 'hotel') counts.hotel++;
      else if (p.type === 'business' || p.type === 'commercial') counts.business++;
    });
    return counts;
  }, [eligibleProperties]);

  // Featured Properties (Strictly balanced 6 items for 3-column grid so no orphan card ever appears)
  const featuredShowcaseProperties = useMemo(() => {
    const flaggedFeatured = eligibleProperties.filter((p) => p.isFeatured);
    let pool = flaggedFeatured.length > 0 ? [...flaggedFeatured] : [...eligibleProperties];

    if (featuredCategoryFilter !== 'all') {
      pool = eligibleProperties.filter((p) =>
        featuredCategoryFilter === 'business'
          ? p.type === 'business' || p.type === 'commercial'
          : p.type === featuredCategoryFilter
      );
    } else if (pool.length < 6) {
      // Backfill with remaining eligible properties so the 3x2 grid is always complete and balanced
      const existingIds = new Set(pool.map((p) => p.id));
      for (const prop of eligibleProperties) {
        if (!existingIds.has(prop.id)) {
          pool.push(prop);
          existingIds.add(prop.id);
        }
        if (pool.length >= 6) break;
      }
    }

    return pool.slice(0, 6);
  }, [eligibleProperties, featuredCategoryFilter]);

  // Latest & Trending Properties (Strictly balanced 6 items for 3-column grid)
  const trendingShowcaseProperties = useMemo(() => {
    const flaggedTrending = eligibleProperties.filter((p) => p.isTrending);
    let pool = flaggedTrending.length > 0 ? [...flaggedTrending] : [...eligibleProperties];

    if (trendingCategoryFilter !== 'all') {
      pool = eligibleProperties.filter((p) =>
        trendingCategoryFilter === 'business'
          ? p.type === 'business' || p.type === 'commercial'
          : p.type === trendingCategoryFilter
      );
    } else if (pool.length < 6) {
      const existingIds = new Set(pool.map((p) => p.id));
      for (const prop of eligibleProperties) {
        if (!existingIds.has(prop.id)) {
          pool.push(prop);
          existingIds.add(prop.id);
        }
        if (pool.length >= 6) break;
      }
    }

    return pool.slice(0, 6);
  }, [eligibleProperties, trendingCategoryFilter]);

  // District counts
  const locationCounts = useMemo(() => {
    const counts: { [key: string]: number } = {
      Colombo: 0,
      Kandy: 0,
      Galle: 0,
      Gampaha: 0,
    };
    eligibleProperties.forEach((p) => {
      const d = p.location.district;
      if (counts[d] !== undefined) {
        counts[d]++;
      }
    });
    return counts;
  }, [eligibleProperties]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (heroPurpose === 'land') {
      params.set('purpose', 'buy');
      params.set('type', 'land');
    } else {
      params.set('purpose', heroPurpose);
      if (heroType && heroType !== 'all') {
        params.set('type', heroType);
      }
    }

    if (heroLocation) {
      params.set('district', heroLocation);
    }
    if (heroCity) {
      params.set('city', heroCity);
    }
    if (heroKeyword.trim()) {
      params.set('search', heroKeyword.trim());
    }

    if (heroBudgetRange) {
      const [min, max] = heroBudgetRange.split('-');
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    }

    navigate(`/properties?${params.toString()}`);
  };

  const quickLocations = [
    { label: 'Colombo', district: 'Colombo' },
    { label: 'Gampaha', district: 'Gampaha' },
    { label: 'Galle', district: 'Galle' },
    { label: 'Kandy', district: 'Kandy' },
    { label: 'Kalutara', district: 'Kalutara' },
    { label: 'Nuwara Eliya', district: 'Nuwara Eliya' },
  ];

  const categoryCards = [
    {
      key: 'land',
      label: 'Land',
      description: 'Residential plots, agricultural estates, and commercial land',
      count: categoryStats.land,
    },
    {
      key: 'house',
      label: 'House',
      description: 'Single-family homes, modern residences, and private villas',
      count: categoryStats.house,
    },
    {
      key: 'apartment',
      label: 'Apartment',
      description: 'City apartments, sea-view units, and residential towers',
      count: categoryStats.apartment,
    },
    {
      key: 'hotel',
      label: 'Hotel',
      description: 'Boutique hotels, coastal resorts, and guest properties',
      count: categoryStats.hotel,
    },
    {
      key: 'business',
      label: 'Business',
      description: 'Office buildings, retail spaces, and commercial properties',
      count: categoryStats.business,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#18251E]">
      <SeoHead
        title="LankaProperty.lk — Sri Lanka Real Estate: Land, Houses, Apartments, Hotels & Business Properties"
        description="Buy, sell, or rent verified land, houses, apartments, hotels, and commercial properties across all 25 districts of Sri Lanka."
        canonicalPath="/"
        jsonLd={[
          {
            '@type': 'ItemList',
            name: 'Featured Sri Lanka Properties for Sale & Rent',
            numberOfItems: featuredShowcaseProperties.length,
            itemListElement: featuredShowcaseProperties.map((p, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `https://lankaproperty.lk/properties/${p.slug}`,
              name: p.title,
            })),
          },
        ]}
      />

      {isPreviewHomepage && (
        <aside className="bg-amber-400 text-amber-950 font-bold text-xs py-2.5 px-4 text-center sticky top-[72px] z-30 flex items-center justify-center gap-3">
          <span>Preview Mode: Viewing unpublished homepage configuration.</span>
          <a href="/" className="underline text-amber-950 font-extrabold">
            Exit Preview
          </a>
        </aside>
      )}

      {/* =========================================================================
          SECTION 1: CLEAN PROFESSIONAL REAL ESTATE HERO & SEARCH BAR
          ========================================================================= */}
      <section className="relative w-full bg-[#103D2C] text-white pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden border-b border-[#176B45]/40">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=85"
            alt="Sri Lanka Real Estate"
            loading="eager"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B2519]/90 via-[#103D2C]/85 to-[#103D2C]" />
        </div>

        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-5 md:px-8 lg:px-12 space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#9FE3B8]">
              Sri Lanka Property Marketplace · All 25 Districts
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] text-white">
              Find Land, Houses, Apartments, Hotels & Business Properties in Sri Lanka
            </h1>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl">
              Search verified properties for sale and rent across Sri Lanka with transparent pricing and direct owner or agent contact.
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white text-[#18251E] rounded-[4px] shadow-xl border border-[#DDE5DF] p-5 sm:p-6">
            {/* Purpose Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDE5DF] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHeroPurpose('buy')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    heroPurpose === 'buy'
                      ? 'bg-[#103D2C] text-white'
                      : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#18251E]'
                  }`}
                >
                  Buy Property
                </button>
                <button
                  type="button"
                  onClick={() => setHeroPurpose('rent')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    heroPurpose === 'rent'
                      ? 'bg-[#103D2C] text-white'
                      : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#18251E]'
                  }`}
                >
                  Rent Property
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeroPurpose('land');
                    setHeroType('land');
                  }}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    heroPurpose === 'land'
                      ? 'bg-[#103D2C] text-white'
                      : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#18251E]'
                  }`}
                >
                  Buy Land
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/wanted-properties')}
                className="text-xs font-bold text-[#176B45] hover:text-[#103D2C] uppercase tracking-wider cursor-pointer"
              >
                Post a Buyer Requirement
              </button>
            </div>

            {/* Search Inputs Grid */}
            <form onSubmit={handleHeroSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Keyword */}
                <div>
                  <label
                    htmlFor="hero-keyword"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1.5"
                  >
                    Keyword or Reference
                  </label>
                  <input
                    id="hero-keyword"
                    type="text"
                    value={heroKeyword}
                    onChange={(e) => setHeroKeyword(e.target.value)}
                    placeholder="City, road, or title..."
                    className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none"
                  />
                </div>

                {/* 2. District */}
                <div>
                  <label
                    htmlFor="hero-district"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1.5"
                  >
                    District
                  </label>
                  <select
                    id="hero-district"
                    value={heroLocation}
                    onChange={(e) => {
                      setHeroLocation(e.target.value);
                      setHeroCity('');
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
                    htmlFor="hero-city"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1.5"
                  >
                    City / Town
                  </label>
                  <select
                    id="hero-city"
                    value={heroCity}
                    disabled={!heroLocation}
                    onChange={(e) => setHeroCity(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {heroLocation ? `All ${heroLocation} Towns` : 'Select District First'}
                    </option>
                    {heroAvailableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Category */}
                <div>
                  <label
                    htmlFor="hero-category"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="hero-category"
                    value={heroPurpose === 'land' ? 'land' : heroType}
                    disabled={heroPurpose === 'land'}
                    onChange={(e) => setHeroType(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] font-semibold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:opacity-60"
                  >
                    <option value="all">All Categories</option>
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
                    htmlFor="hero-budget"
                    className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mb-1.5"
                  >
                    Price Range (LKR)
                  </label>
                  <select
                    id="hero-budget"
                    value={heroBudgetRange}
                    onChange={(e) => setHeroBudgetRange(e.target.value)}
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
              </div>

              {/* Search Footer Row */}
              <div className="pt-3 border-t border-[#DDE5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mr-1">
                    Popular Districts:
                  </span>
                  {quickLocations.map((loc) => (
                    <button
                      key={loc.label}
                      type="button"
                      onClick={() =>
                        navigate(`/properties?district=${encodeURIComponent(loc.district)}`)
                      }
                      className="px-2.5 py-1 text-xs font-semibold text-[#18251E] bg-[#F5F8F5] hover:bg-[#E8F3EC] hover:text-[#103D2C] rounded-[3px] border border-[#DDE5DF] transition-colors cursor-pointer"
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="px-8 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer shrink-0"
                >
                  Search Properties
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: BROWSE BY CATEGORY BAR (5 STANDARD CATEGORIES)
          ========================================================================= */}
      <section className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-10">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoryCards.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => navigate(`/properties?type=${cat.key}`)}
                className="p-5 bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] text-left transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-[#18251E] group-hover:text-[#103D2C]">
                      {cat.label}
                    </h2>
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-[#E8F3EC] text-[#103D2C] rounded-[2px] tabular-nums">
                      {cat.count}
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6B63] mt-1.5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-4 pt-2.5 border-t border-[#DDE5DF]/60 text-[11px] font-bold uppercase tracking-wider text-[#176B45] group-hover:text-[#103D2C]">
                  Browse {cat.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: FEATURED PROPERTIES (BALANCED 3-COLUMN GRID, 6 ITEMS)
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-white border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#DDE5DF]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
                Featured Listings
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#103D2C] mt-1 tracking-tight">
                Featured Properties for Sale & Rent
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'land', label: 'Land' },
                { key: 'house', label: 'House' },
                { key: 'apartment', label: 'Apartment' },
                { key: 'hotel', label: 'Hotel' },
                { key: 'business', label: 'Business' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFeaturedCategoryFilter(tab.key)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer ${
                    featuredCategoryFilter === tab.key
                      ? 'bg-[#103D2C] text-white border-[#103D2C]'
                      : 'bg-[#FAFBF9] text-[#5F6B63] border-[#DDE5DF] hover:border-[#103D2C] hover:text-[#18251E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {featuredShowcaseProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredShowcaseProperties.map((property, idx) => (
                <PropertyCard key={property.id} property={property} priority={idx < 3} />
              ))}
            </div>
          ) : (
            <div className="p-10 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] text-center space-y-3">
              <p className="text-sm font-bold text-[#18251E]">
                No featured properties found in this category.
              </p>
              <button
                type="button"
                onClick={() => setFeaturedCategoryFilter('all')}
                className="px-4 py-2 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] cursor-pointer"
              >
                Show All Featured Properties
              </button>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-[#5F6B63]">
              Showing {featuredShowcaseProperties.length} of {eligibleProperties.length} published properties · Prices displayed in{' '}
              <strong className="text-[#103D2C]">{currency}</strong>
            </span>
            <button
              type="button"
              onClick={() => navigate('/properties')}
              className="px-6 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors self-start sm:self-auto cursor-pointer"
            >
              View All {eligibleProperties.length} Properties
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: BROWSE BY DISTRICT & CITY DIRECTORY
          ========================================================================= */}
      <DistrictCadastralExplorer initialDistrict={heroLocation || 'Colombo'} />

      {/* =========================================================================
          SECTION 5: LATEST & TRENDING PROPERTIES (BALANCED 3-COLUMN GRID, 6 ITEMS)
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-white border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#DDE5DF]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
                Recent Market Activity
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#103D2C] mt-1 tracking-tight">
                Latest & Trending Properties
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'land', label: 'Land' },
                { key: 'house', label: 'House' },
                { key: 'apartment', label: 'Apartment' },
                { key: 'hotel', label: 'Hotel' },
                { key: 'business', label: 'Business' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTrendingCategoryFilter(tab.key)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer ${
                    trendingCategoryFilter === tab.key
                      ? 'bg-[#103D2C] text-white border-[#103D2C]'
                      : 'bg-[#FAFBF9] text-[#5F6B63] border-[#DDE5DF] hover:border-[#103D2C] hover:text-[#18251E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {trendingShowcaseProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingShowcaseProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="p-10 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] text-center space-y-3">
              <p className="text-sm font-bold text-[#18251E]">
                No properties found in this category.
              </p>
              <button
                type="button"
                onClick={() => setTrendingCategoryFilter('all')}
                className="px-4 py-2 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] cursor-pointer"
              >
                Show All Properties
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: POPULAR REGIONAL MARKETS & NEW DEVELOPMENTS
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-[#FAFBF9] border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-16">
          {/* Regional Markets */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#DDE5DF]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
                  Key Locations
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#103D2C] mt-1 tracking-tight">
                  Popular Property Markets in Sri Lanka
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/properties')}
                className="text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#103D2C] cursor-pointer"
              >
                Browse All Locations
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <article
                onClick={() => navigate('/properties?district=Colombo')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden cursor-pointer flex flex-col justify-between transition-all shadow-2xs"
              >
                <div className="aspect-16/10 overflow-hidden bg-[#E8F3EC] relative">
                  <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
                    alt="Colombo Real Estate"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px]">
                    Western Province
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#18251E] group-hover:text-[#103D2C]">
                      Colombo District
                    </h3>
                    <p className="text-xs text-[#5F6B63] mt-1 leading-relaxed">
                      Colombo 01–15, Dehiwala, Mount Lavinia, Rajagiriya, Battaramulla, and Maharagama.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between text-xs font-bold text-[#103D2C]">
                    <span>{locationCounts.Colombo || 6} Active Listings</span>
                    <span>View Properties</span>
                  </div>
                </div>
              </article>

              <article
                onClick={() => navigate('/properties?district=Gampaha')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden cursor-pointer flex flex-col justify-between transition-all shadow-2xs"
              >
                <div className="aspect-16/10 overflow-hidden bg-[#E8F3EC] relative">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                    alt="Gampaha & Negombo Real Estate"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px]">
                    Western Province
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#18251E] group-hover:text-[#103D2C]">
                      Gampaha & Negombo
                    </h3>
                    <p className="text-xs text-[#5F6B63] mt-1 leading-relaxed">
                      Gampaha, Negombo, Kadawatha, Wattala, Ja-Ela, and residential commuter towns.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between text-xs font-bold text-[#103D2C]">
                    <span>{locationCounts.Gampaha || 3} Active Listings</span>
                    <span>View Properties</span>
                  </div>
                </div>
              </article>

              <article
                onClick={() => navigate('/properties?district=Galle')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden cursor-pointer flex flex-col justify-between transition-all shadow-2xs"
              >
                <div className="aspect-16/10 overflow-hidden bg-[#E8F3EC] relative">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                    alt="Galle & Southern Coast Real Estate"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px]">
                    Southern Province
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#18251E] group-hover:text-[#103D2C]">
                      Galle & Southern Coast
                    </h3>
                    <p className="text-xs text-[#5F6B63] mt-1 leading-relaxed">
                      Galle Fort, Talpe, Unawatuna, Habaraduwa, Ahangama, and coastal properties.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between text-xs font-bold text-[#103D2C]">
                    <span>{locationCounts.Galle || 3} Active Listings</span>
                    <span>View Properties</span>
                  </div>
                </div>
              </article>

              <article
                onClick={() => navigate('/properties?district=Kandy')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden cursor-pointer flex flex-col justify-between transition-all shadow-2xs"
              >
                <div className="aspect-16/10 overflow-hidden bg-[#E8F3EC] relative">
                  <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
                    alt="Kandy & Central Highlands Real Estate"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px]">
                    Central Province
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#18251E] group-hover:text-[#103D2C]">
                      Kandy & Hill Country
                    </h3>
                    <p className="text-xs text-[#5F6B63] mt-1 leading-relaxed">
                      Kandy, Peradeniya, Digana, Hanthana, Kundasale, and hill country estates.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between text-xs font-bold text-[#103D2C]">
                    <span>{locationCounts.Kandy || 4} Active Listings</span>
                    <span>View Properties</span>
                  </div>
                </div>
              </article>
            </div>
          </div>

          {/* New Developments Showcase */}
          <div className="pt-6 border-t border-[#DDE5DF] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
                  Residential Projects
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#103D2C] mt-1 tracking-tight">
                  New Developments & Condominium Projects
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/developments')}
                className="text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#103D2C] cursor-pointer"
              >
                View All Developments
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DEVELOPMENTS_DATA.slice(0, 2).map((dev) => (
                <article
                  key={dev.id}
                  onClick={() => navigate(`/developments/${dev.slug}`)}
                  className="bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden cursor-pointer group transition-all flex flex-col justify-between shadow-2xs"
                >
                  <div className="aspect-16/9 overflow-hidden bg-[#E8F3EC] relative">
                    <img
                      src={dev.coverImage}
                      alt={dev.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px]">
                        {dev.status}
                      </span>
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#18251E] rounded-[2px]">
                        Delivery {dev.completionDate}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div>
                      <span className="text-xs font-bold text-[#176B45] uppercase tracking-wider">
                        {dev.location.city}, {dev.location.district} · {dev.projectType}
                      </span>
                      <h3 className="text-xl font-bold text-[#18251E] group-hover:text-[#103D2C] mt-1">
                        {dev.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5 line-clamp-2 leading-relaxed">
                        {dev.tagline}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">
                          Starting Price
                        </span>
                        <span className="text-lg font-extrabold text-[#103D2C] tabular-nums">
                          {formatPrice(dev.startingPriceLkr)}
                        </span>
                      </div>
                      <span className="px-4 py-2 bg-[#FAFBF9] group-hover:bg-[#103D2C] group-hover:text-white text-xs font-bold uppercase tracking-wider text-[#103D2C] border border-[#DDE5DF] rounded-[3px] transition-colors">
                        View Project
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: ADVERTISING PACKAGES FOR SELLERS & AGENTS
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-white border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-5 border-b border-[#DDE5DF]">
            <div className="space-y-1.5 max-w-2xl">
              <span className="text-xs uppercase font-bold tracking-wider text-[#176B45] block">
                For Property Owners & Real Estate Agents
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#103D2C] tracking-tight">
                Property Advertising Packages
              </h2>
              <p className="text-sm text-[#5F6B63] leading-relaxed">
                Start with a free listing or upgrade to featured placement for higher visibility across Sri Lanka and international buyers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/advertising-packages')}
                className="px-4 py-2.5 bg-[#FAFBF9] hover:bg-[#E8F3EC] text-[#103D2C] border border-[#103D2C] font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                Compare All Plans
              </button>
              <button
                type="button"
                onClick={() => navigate('/list-property')}
                className="px-5 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                Post Property Free
              </button>
            </div>
          </div>

          {/* Package Category Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePackageTab('direct')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                activePackageTab === 'direct'
                  ? 'bg-[#103D2C] text-white'
                  : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
              }`}
            >
              Standard Plans (30 – 90 Days)
            </button>
            <button
              type="button"
              onClick={() => setActivePackageTab('strategic')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                activePackageTab === 'strategic'
                  ? 'bg-[#103D2C] text-white'
                  : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
              }`}
            >
              Long-Term Plans (Up to 12 Months)
            </button>
          </div>

          {/* Listing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {packagesList
              .filter((p) => p.category === activePackageTab && p.active)
              .map((pkg) => {
                const isFree = pkg.priceLkr === 0;
                const isHighlight =
                  pkg.popular || pkg.badge === 'BEST VALUE' || pkg.badge === 'MOST POPULAR';

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-[4px] p-6 flex flex-col justify-between transition-all relative ${
                      isHighlight
                        ? 'bg-white border-2 border-[#103D2C] shadow-md'
                        : 'bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C]'
                    }`}
                  >
                    {pkg.badge && (
                      <div className="mb-3">
                        <span className="inline-block px-2.5 py-0.5 bg-[#103D2C] text-white text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                          {pkg.badge}
                        </span>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-bold text-[#103D2C]">{pkg.name}</h3>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-[#18251E] tabular-nums">
                          {isFree ? 'Free' : `Rs. ${pkg.priceLkr.toLocaleString()}`}
                        </span>
                        <span className="text-xs text-[#5F6B63] font-medium">
                          / {pkg.duration}
                        </span>
                      </div>
                      <p className="text-xs text-[#5F6B63] mt-2 leading-relaxed">{pkg.description}</p>

                      <ul className="mt-5 pt-4 border-t border-[#DDE5DF] space-y-2 text-xs text-[#18251E]">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                          <span>
                            Up to <strong>{pkg.maxPhotos}</strong> property photos
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                          <span>
                            Syndicated across <strong>{pkg.syndicationWebsitesCount}</strong> partner portals
                          </span>
                        </li>
                        {pkg.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          isFree
                            ? `/list-property?plan=${pkg.id}`
                            : `/advertising-packages?plan=${pkg.id}`
                        )
                      }
                      className={`mt-6 w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                        isHighlight
                          ? 'bg-[#103D2C] hover:bg-[#176B45] text-white'
                          : 'bg-white border border-[#103D2C] text-[#103D2C] hover:bg-[#103D2C] hover:text-white'
                      }`}
                    >
                      {isFree ? 'Post Property Free' : `Select ${pkg.name}`}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FREQUENTLY ASKED QUESTIONS & 25 DISTRICTS DIRECTORY
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-[#FAFBF9]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
              Buyer & Seller Guide
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#103D2C] mt-1">
              Frequently Asked Questions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <article className="bg-white border border-[#DDE5DF] p-5 rounded-[4px] space-y-2">
                <h3 className="text-sm font-bold text-[#18251E]">
                  Can overseas buyers purchase property in Sri Lanka?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  Foreign nationals can purchase condominium apartments in Sri Lanka funded through an Inward Investment Account (IIA) at a licensed commercial bank, or acquire landed property via long-term lease or local company structures.
                </p>
              </article>

              <article className="bg-white border border-[#DDE5DF] p-5 rounded-[4px] space-y-2">
                <h3 className="text-sm font-bold text-[#18251E]">
                  How is land measured in Sri Lanka?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  Land in Sri Lanka is measured in Perches, Roods, and Acres. 1 Perch equals 272.25 square feet (25.29 square meters), 40 Perches equal 1 Rood, and 160 Perches equal 1 Acre.
                </p>
              </article>

              <article className="bg-white border border-[#DDE5DF] p-5 rounded-[4px] space-y-2">
                <h3 className="text-sm font-bold text-[#18251E]">
                  How much is stamp duty when buying property in Sri Lanka?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  Government transfer stamp duty is 3% on the first LKR 100,000 of the property value and 4% on the remaining balance, in addition to standard legal and notarial conveyancing fees.
                </p>
              </article>

              <article className="bg-white border border-[#DDE5DF] p-5 rounded-[4px] space-y-2">
                <h3 className="text-sm font-bold text-[#18251E]">
                  How can I list my property on LankaProperty.lk?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  Property owners and real estate agents can publish listings directly using the Post Property Free button in the top navigation bar, uploading up to 20 photos with direct phone and WhatsApp contact details.
                </p>
              </article>
            </div>
          </div>

          <nav
            aria-label="Sri Lanka 25 Districts Real Estate Directory"
            className="pt-8 border-t border-[#DDE5DF]"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#103D2C] mb-4">
              Browse Properties Across All 25 Districts of Sri Lanka
            </h3>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              {SRI_LANKA_DISTRICTS.map((d) => (
                <li key={d.name}>
                  <a
                    href={`/properties?district=${encodeURIComponent(d.name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/properties?district=${encodeURIComponent(d.name)}`);
                    }}
                    className="block px-3 py-2 bg-white border border-[#DDE5DF] hover:border-[#103D2C] hover:text-[#103D2C] rounded-[3px] font-semibold text-[#18251E] transition-colors truncate"
                  >
                    {d.name} District
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </div>
  );
}
