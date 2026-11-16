import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from '../hooks/useRouter';
import { propertyService } from '../services/propertyService';
import { homepageConfigService } from '../services/homepageConfigService';
import { DEVELOPMENTS_DATA } from '../data/developments';
import { SRI_LANKA_DISTRICTS, getCitiesForDistrict } from '../data/locations';
import { PropertyCard } from '../components/PropertyCard';
import { AcquisitionCalculator } from '../components/AcquisitionCalculator';
import { DistrictCadastralExplorer } from '../components/DistrictCadastralExplorer';
import { SeoHead } from '../components/SeoHead';
import { useCurrency } from '../context/CurrencyContext';
import { Property } from '../types/property';
import { advertisingPackageService, AdvertisedPackage } from '../services/advertisingPackageService';
import {
  LandmarkItem,
  SRI_LANKA_SCHOOLS,
  SRI_LANKA_HOSPITALS,
  SRI_LANKA_CITY_CENTROIDS,
  DEFAULT_COLOMBO_COORDINATES,
} from '../data/landmarks';

export function HomePage() {
  const { navigate, searchParams } = useRouter();
  const { formatPrice, currency } = useCurrency();

  // Preview Mode indicator if admin draft preview param is set
  const isPreviewHomepage = searchParams.get('previewHomepage') === 'true';

  // Live Homepage Configuration from Admin CMS
  const [homepageConfig, setHomepageConfig] = useState(() => {
    return isPreviewHomepage
      ? homepageConfigService.getDraftConfig()
      : homepageConfigService.getPublishedConfig();
  });

  // Live Authoritative Properties State
  const [storeVersion, setStoreVersion] = useState(0);

  // Subscribe to live admin updates for both homepage config and properties
  useEffect(() => {
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

  // Dynamic Advertised Packages State (Synced with Super Admin)
  const [activePackageTab, setActivePackageTab] = useState<'direct' | 'strategic'>('direct');
  const [packagesList, setPackagesList] = useState<AdvertisedPackage[]>(() =>
    advertisingPackageService.getAllPackages()
  );

  useEffect(() => {
    const unsubPackages = advertisingPackageService.subscribe(() => {
      setPackagesList(advertisingPackageService.getAllPackages());
    });
    return () => {
      unsubPackages();
    };
  }, []);

  // Hero Search Form State
  const [heroPurpose, setHeroPurpose] = useState<'buy' | 'rent' | 'land'>('buy');
  const [heroLocation, setHeroLocation] = useState('');
  const [heroCity, setHeroCity] = useState('');
  const [heroType, setHeroType] = useState('all');
  const [heroBudgetRange, setHeroBudgetRange] = useState('');
  const [heroKeyword, setHeroKeyword] = useState('');

  // Smart Landmark & Proximity Multi-Mode Search State
  const [searchMode, setSearchMode] = useState<'near_me' | 'school' | 'hospital' | 'location'>('location');
  const [isSearchModeDropdownOpen, setIsSearchModeDropdownOpen] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkItem | null>(null);
  const [userGeolocation, setUserGeolocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'active' | 'denied'>('idle');
  const [geoRadiusKm, setGeoRadiusKm] = useState<number>(15);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Authoritative Featured & Trending Properties
  const featuredProperties = useMemo(() => {
    return propertyService.getFeaturedProperties(6);
  }, [storeVersion]);

  const trendingProperties = useMemo(() => {
    return propertyService.getTrendingProperties(6);
  }, [storeVersion]);

  // Request HTML5 Geolocation
  const requestUserGeolocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGeoStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGeolocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setGeoStatus('active');
        },
        () => {
          setUserGeolocation(DEFAULT_COLOMBO_COORDINATES);
          setGeoStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserGeolocation(DEFAULT_COLOMBO_COORDINATES);
      setGeoStatus('denied');
    }
  };

  const handleSelectSearchMode = (mode: 'near_me' | 'school' | 'hospital' | 'location') => {
    setSearchMode(mode);
    setIsSearchModeDropdownOpen(false);
    setSelectedLandmark(null);
    setIsSuggestionsOpen(false);
    if (mode === 'near_me') {
      setHeroKeyword('');
      requestUserGeolocation();
    } else {
      setHeroKeyword('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  // Autocomplete Suggestions based on mode
  const landmarkSuggestions = useMemo(() => {
    const q = heroKeyword.trim().toLowerCase();
    if (searchMode === 'school') {
      if (!q) return SRI_LANKA_SCHOOLS.slice(0, 8);
      return SRI_LANKA_SCHOOLS.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.typeLabel.toLowerCase().includes(q)
      );
    }
    if (searchMode === 'hospital') {
      if (!q) return SRI_LANKA_HOSPITALS.slice(0, 8);
      return SRI_LANKA_HOSPITALS.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          h.typeLabel.toLowerCase().includes(q)
      );
    }
    if (searchMode === 'location') {
      if (!q) return SRI_LANKA_CITY_CENTROIDS.slice(0, 8);
      return SRI_LANKA_CITY_CENTROIDS.filter(
        (c) =>
          c.city.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q)
      );
    }
    return [];
  }, [searchMode, heroKeyword]);

  const searchPlaceholder = useMemo(() => {
    switch (searchMode) {
      case 'near_me':
        return geoStatus === 'active'
          ? 'Properties Near Current GPS Position (Filtered by Radius)'
          : geoStatus === 'requesting'
          ? 'Acquiring GPS location coordinates...'
          : 'Show properties near me (Click Search to activate GPS)';
      case 'school':
        return 'Type school or university name';
      case 'hospital':
        return 'Type hospital or healthcare hub name';
      case 'location':
      default:
        return 'Type district, city, or enclave name';
    }
  }, [searchMode, geoStatus]);

  // Close suggestions and mode dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSearchModeDropdownOpen(false);
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHeroDistrictChange = (district: string) => {
    setHeroLocation(district);
    setHeroCity('');
  };

  const heroDistrictCities = useMemo(() => {
    return getCitiesForDistrict(heroLocation);
  }, [heroLocation]);

  // Trophy Showcase Tab Filter: 'all' | 'villas' | 'penthouses' | 'land' | 'heritage'
  const [showcaseTab, setShowcaseTab] = useState<'all' | 'villas' | 'penthouses' | 'land' | 'heritage'>('all');

  // Calculator valuation state (default Rs. 125M)
  const [calculatorPrice, setCalculatorPrice] = useState(125000000);

  // Authoritative published listings (reactive to storeVersion)
  const eligibleProperties = useMemo(() => {
    return propertyService.getPublicEligibleProperties();
  }, [storeVersion]);

  // Live Inventory Counts for the Hero Segmented Switcher
  const tabCounts = useMemo(() => {
    return {
      buy: eligibleProperties.filter((p) => p.purpose === 'buy' && p.type !== 'land').length,
      rent: eligibleProperties.filter((p) => p.purpose === 'rent').length,
      land: eligibleProperties.filter((p) => p.purpose === 'land' || p.type === 'land').length,
    };
  }, [eligibleProperties]);

  // Dynamic Multi-Currency Budget Options
  const budgetOptions = useMemo(() => {
    if (currency === 'USD') {
      return [
        { label: 'Any Valuation Threshold', val: '' },
        { label: 'Under $150,000 USD', val: '0-45000000' },
        { label: '$150,000 – $350,000 USD', val: '45000000-105000000' },
        { label: '$350,000 – $800,000 USD', val: '105000000-240000000' },
        { label: '$800,000 – $1.6M USD (Trophy)', val: '240000000-480000000' },
        { label: '$1.6M+ USD (Sovereign Estates)', val: '480000000-' },
      ];
    }
    if (currency === 'GBP') {
      return [
        { label: 'Any Valuation Threshold', val: '' },
        { label: 'Under £120,000 GBP', val: '0-45000000' },
        { label: '£120,000 – £275,000 GBP', val: '45000000-105000000' },
        { label: '£275,000 – £650,000 GBP', val: '105000000-240000000' },
        { label: '£650,000 – £1.3M GBP (Trophy)', val: '240000000-480000000' },
        { label: '£1.3M+ GBP (Sovereign Estates)', val: '480000000-' },
      ];
    }
    if (currency === 'EUR') {
      return [
        { label: 'Any Valuation Threshold', val: '' },
        { label: 'Under €140,000 EUR', val: '0-45000000' },
        { label: '€140,000 – €320,000 EUR', val: '45000000-105000000' },
        { label: '€320,000 – €750,000 EUR', val: '105000000-240000000' },
        { label: '€750,000 – €1.5M EUR (Trophy)', val: '240000000-480000000' },
        { label: '€1.5M+ EUR (Sovereign Estates)', val: '480000000-' },
      ];
    }
    if (currency === 'AUD') {
      return [
        { label: 'Any Valuation Threshold', val: '' },
        { label: 'Under A$225,000 AUD', val: '0-45000000' },
        { label: 'A$225,000 – A$500,000 AUD', val: '45000000-105000000' },
        { label: 'A$500,000 – A$1.2M AUD', val: '105000000-240000000' },
        { label: 'A$1.2M – A$2.5M AUD (Trophy)', val: '240000000-480000000' },
        { label: 'A$2.5M+ AUD (Sovereign Estates)', val: '480000000-' },
      ];
    }
    return [
      { label: 'Any Valuation Threshold', val: '' },
      { label: 'Under Rs. 50 Million', val: '0-50000000' },
      { label: 'Rs. 50M – 100 Million', val: '50000000-100000000' },
      { label: 'Rs. 100M – 250 Million', val: '100000000-250000000' },
      { label: 'Rs. 250M – 500 Million (Trophy)', val: '250000000-500000000' },
      { label: 'Rs. 500 Million+ (Sovereign)', val: '500000000-' },
    ];
  }, [currency]);

  // Curate 6 DISTINCT, unique properties for the Trophy Showcase (ZERO DUPLICATES)
  const showcaseProperties = useMemo(() => {
    let pool = [...eligibleProperties];

    if (showcaseTab === 'villas') {
      pool = pool.filter((p) => p.type === 'house');
    } else if (showcaseTab === 'penthouses') {
      pool = pool.filter((p) => p.type === 'apartment');
    } else if (showcaseTab === 'land') {
      pool = pool.filter((p) => p.type === 'land' || p.purpose === 'land');
    } else if (showcaseTab === 'heritage') {
      pool = pool.filter((p) => p.type === 'commercial' || p.location.district === 'Kandy' || p.location.district === 'Nuwara Eliya');
    }

    // Curate a hand-picked, diverse list ensuring NO DUPLICATE properties
    // If 'all', ensure we showcase one penthouse, one coastal villa, one colonial mansion, one golf estate, one beachfront land, one chalet
    if (showcaseTab === 'all') {
      const preferredIds = ['prop-2', 'prop-10', 'prop-7', 'prop-5', 'prop-12', 'prop-4'];
      const curated: Property[] = [];
      preferredIds.forEach((id) => {
        const found = eligibleProperties.find((p) => p.id === id);
        if (found) curated.push(found);
      });
      // Fill remainder up to 6 if needed
      pool.forEach((p) => {
        if (curated.length < 6 && !curated.some((c) => c.id === p.id)) {
          curated.push(p);
        }
      });
      return curated;
    }

    return pool.slice(0, 6);
  }, [eligibleProperties, showcaseTab]);

  // Handle hero search form submission
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

    if (searchMode === 'near_me') {
      params.set('nearMe', 'true');
      const lat = userGeolocation?.latitude ?? DEFAULT_COLOMBO_COORDINATES.latitude;
      const lon = userGeolocation?.longitude ?? DEFAULT_COLOMBO_COORDINATES.longitude;
      params.set('lat', lat.toString());
      params.set('lng', lon.toString());
      params.set('radius', geoRadiusKm.toString());
    } else if (searchMode === 'school' || searchMode === 'hospital') {
      if (selectedLandmark) {
        params.set('landmark', selectedLandmark.name);
        params.set('lat', selectedLandmark.coordinates.latitude.toString());
        params.set('lng', selectedLandmark.coordinates.longitude.toString());
        params.set('radius', '15');
      } else if (heroKeyword.trim()) {
        params.set('search', heroKeyword.trim());
      }
    } else {
      if (heroLocation) {
        params.set('district', heroLocation);
      }
      if (heroCity) {
        params.set('city', heroCity);
      }
      if (heroKeyword.trim()) {
        params.set('search', heroKeyword.trim());
      }
    }

    if (heroBudgetRange) {
      const [min, max] = heroBudgetRange.split('-');
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    }

    navigate(`/properties?${params.toString()}`);
  };

  const microMarkets = [
    { label: 'Colombo 07 · Cinnamon Gardens', district: 'Colombo', query: 'Cinnamon Gardens' },
    { label: 'Colombo 03 · Seafront Skyline', district: 'Colombo', query: 'Kollupitiya' },
    { label: 'Galle Fort · UNESCO Heritage', district: 'Galle', query: 'Fort' },
    { label: 'Talpe · Golden Mile Coast', district: 'Galle', query: 'Talpe' },
    { label: 'Victoria Golf · Digana Valley', district: 'Kandy', query: 'Digana' },
    { label: 'Nuwara Eliya · Pedro Tea Country', district: 'Nuwara Eliya', query: 'Nuwara Eliya' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#18251E]">
      <SeoHead
        title="LankaProperty.lk — Sri Lanka Real Estate, Houses, Villas, Apartments & Land for Sale"
        description="Sri Lanka's property marketplace across all 25 districts. Buy or rent verified houses, luxury coastal villas, Colombo apartments, and freehold land plots with direct owner and agent contact."
        canonicalPath="/"
        jsonLd={[
          {
            '@type': 'ItemList',
            name: 'Featured Sri Lanka Properties for Sale & Rent',
            numberOfItems: showcaseProperties.length,
            itemListElement: showcaseProperties.map((p, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `https://lankaproperty.lk/properties/${p.slug}`,
              name: p.title,
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Can foreigners and overseas diaspora buy property in Sri Lanka?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Foreign nationals can buy 100% freehold condominium apartments in Sri Lanka funded through an Inward Investment Account (IIA) at any licensed commercial bank. For landed houses, villas, and land plots, overseas buyers can acquire up to a 99-year registered leasehold or purchase through a Sri Lankan company with 50%+ local shareholding.',
                },
              },
              {
                '@type': 'Question',
                name: 'How is land measured in Sri Lanka (Perches, Roods, and Acres)?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sri Lankan land is measured in Perches, Roods, and Acres. 1 Perch equals 272.25 square feet (25.29 square meters). 40 Perches equal 1 Rood, and 160 Perches equal 1 Acre (43,560 square feet).',
                },
              },
              {
                '@type': 'Question',
                name: 'How much is property stamp duty in Sri Lanka?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Statutory Sri Lankan transfer stamp duty is 3% on the first LKR 100,000 of property valuation and 4% on the balance amount above LKR 100,000.',
                },
              },
              {
                '@type': 'Question',
                name: 'How can I list my house, land, or apartment on LankaProperty.lk?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Property owners and licensed real estate agents can publish directly using the Post Your Property Free portal on LankaProperty.lk, uploading up to 20 high-resolution photos with instant WhatsApp and email buyer routing.',
                },
              },
            ],
          },
        ]}
      />

      {/* Draft Preview Indicator Banner */}
      {isPreviewHomepage && (
        <aside
          aria-label="Editorial draft preview banner"
          className="bg-amber-400 text-amber-950 font-bold text-xs py-2.5 px-4 text-center sticky top-[72px] z-30 flex items-center justify-center gap-3 shadow-xs"
        >
          <span>Editorial Draft Preview Mode: You are viewing unpublished homepage CMS modifications.</span>
          <a href="/" className="underline text-amber-950 hover:opacity-80 font-black">
            Exit Preview
          </a>
        </aside>
      )}

      {/* =========================================================================
          ENVIRONMENT 1: FULL-WIDTH CINEMATIC HERO & HORIZONTAL COMMAND BAR
          Authentic dusk estate visual (distinct from all property cards),
          authoritative headline, micro-trust indicators, and sleek search bar
          ========================================================================= */}
      <section className="relative w-full bg-[#0B2519] text-white min-h-[640px] lg:min-h-[700px] flex flex-col justify-between overflow-hidden">
        {/* Full-Bleed Atmospheric Background Photo (Dusk estate, NOT repeating villa!) */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
            alt="Sri Lanka Architectural Estate at Dusk"
            className="w-full h-full object-cover object-center opacity-45 scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2519] via-[#0B2519]/40 to-black/60" />
        </div>

        {/* Hero Headline & Trust Signals */}
        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-5 md:px-8 lg:px-12 pt-24 sm:pt-28 lg:pt-32 pb-8">
          <div className="max-w-3xl space-y-4">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-white tracking-tight leading-[1.08]">
              Sri Lanka's Premier Freehold Residences, Sky Penthouses & Coastal Estates.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-neutral-200 leading-relaxed max-w-2xl font-normal">
              A curated institutional registry of authenticated luxury residences, tropical modernist pavilions, and high-yield beachfront land with transparent legal tenure.
            </p>

            {/* Micro-Trust Signals (Zero icons, crisp typographic markers) */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#E8F3EC] font-semibold tracking-wider">
              <span>· 100% TITLE SEARCH DEEDS</span>
              <span>· CENTRAL BANK ESCROW COMPLIANT</span>
              <span>· DIASPORA IIA DIRECT REPATRIATION</span>
              <span>· ZERO BUYER COMMISSION</span>
            </div>
          </div>
        </div>

        {/* Floating Horizontal Architectural Search Command Bar */}
        <div className="relative z-20 max-w-[1360px] w-full mx-auto px-5 md:px-8 lg:px-12 pb-10 sm:pb-14">
          <div className="bg-white rounded-[4px] shadow-[0_20px_50px_rgba(0,0,0,0.28)] border border-[#DDE5DF] overflow-hidden">
            {/* 1. Sleek Architectural Segmented Switcher */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#DDE5DF] bg-[#F7F9F7] px-3 pt-2.5 pb-0">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setHeroPurpose('buy')}
                  className={`px-5 py-3 text-xs uppercase tracking-wider rounded-t-[3px] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    heroPurpose === 'buy'
                      ? 'bg-white text-[#103D2C] font-black border-t-2 border-x border-t-[#103D2C] border-x-[#DDE5DF] shadow-xs'
                      : 'text-[#5F6B63] hover:text-[#18251E] font-bold border-t-2 border-transparent'
                  }`}
                >
                  <span>Buy Freehold</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-[2px] tabular-nums font-extrabold ${
                    heroPurpose === 'buy' ? 'bg-[#E8F3EC] text-[#176B45]' : 'bg-[#EAEAEA] text-[#777777]'
                  }`}>
                    {tabCounts.buy}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroPurpose('rent')}
                  className={`px-5 py-3 text-xs uppercase tracking-wider rounded-t-[3px] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    heroPurpose === 'rent'
                      ? 'bg-white text-[#103D2C] font-black border-t-2 border-x border-t-[#103D2C] border-x-[#DDE5DF] shadow-xs'
                      : 'text-[#5F6B63] hover:text-[#18251E] font-bold border-t-2 border-transparent'
                  }`}
                >
                  <span>Long-Term Rent</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-[2px] tabular-nums font-extrabold ${
                    heroPurpose === 'rent' ? 'bg-[#E8F3EC] text-[#176B45]' : 'bg-[#EAEAEA] text-[#777777]'
                  }`}>
                    {tabCounts.rent}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroPurpose('land')}
                  className={`px-5 py-3 text-xs uppercase tracking-wider rounded-t-[3px] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    heroPurpose === 'land'
                      ? 'bg-white text-[#103D2C] font-black border-t-2 border-x border-t-[#103D2C] border-x-[#DDE5DF] shadow-xs'
                      : 'text-[#5F6B63] hover:text-[#18251E] font-bold border-t-2 border-transparent'
                  }`}
                >
                  <span>Residential & Beach Land</span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-[2px] tabular-nums font-extrabold ${
                    heroPurpose === 'land' ? 'bg-[#E8F3EC] text-[#176B45]' : 'bg-[#EAEAEA] text-[#777777]'
                  }`}>
                    {tabCounts.land}
                  </span>
                </button>
              </div>

              {/* Right: Currency Indicator in Tab Bar */}
              <div className="hidden sm:flex items-center gap-2 pb-2 text-[11px] font-bold text-[#5F6B63]">
                <span>PRICING CURRENCY:</span>
                <span className="px-2 py-0.5 bg-white border border-[#DDE5DF] text-[#103D2C] rounded-[2px] font-extrabold">
                  {currency}
                </span>
              </div>
            </div>

            {/* 2. Interactive Input Matrix */}
            <form onSubmit={handleHeroSearch} className="p-5 sm:p-6 space-y-4">
              {/* Row 1: Smart Multi-Mode Landmark & Proximity Search */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="hero-keyword" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63]">
                    {searchMode === 'near_me'
                      ? 'Proximity Geolocation Radar'
                      : searchMode === 'school'
                      ? 'School & University Catchment Search'
                      : searchMode === 'hospital'
                      ? 'Hospital & Healthcare Access Search'
                      : 'District, City, or Prime Enclave Search'}
                  </label>
                  <span className="text-[10px] font-bold text-[#176B45] uppercase tracking-wider">
                    Mode: {searchMode.replace('_', ' ')}
                  </span>
                </div>

                {/* Input Container with Toggle Chevron and Orange Search CTA */}
                <div className="relative flex items-center bg-white border border-[#DDE5DF] rounded-[3px] shadow-xs focus-within:border-[#103D2C] transition-colors">
                  <input
                    ref={searchInputRef}
                    type="text"
                    id="hero-keyword"
                    value={
                      searchMode === 'near_me'
                        ? geoStatus === 'active'
                          ? 'Current GPS Coordinates Active'
                          : geoStatus === 'requesting'
                          ? 'Acquiring GPS Signal...'
                          : heroKeyword
                        : heroKeyword
                    }
                    readOnly={searchMode === 'near_me'}
                    onChange={(e) => {
                      setHeroKeyword(e.target.value);
                      setSelectedLandmark(null);
                      setIsSuggestionsOpen(true);
                    }}
                    onFocus={() => {
                      if (searchMode !== 'near_me') {
                        setIsSuggestionsOpen(true);
                      }
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full h-12 pl-4 pr-12 bg-transparent text-xs font-semibold text-[#18251E] placeholder:text-[#8A968E] focus:outline-none"
                  />

                  {/* Mode Dropdown Toggle Button (Chevron) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchModeDropdownOpen(!isSearchModeDropdownOpen);
                      setIsSuggestionsOpen(false);
                    }}
                    className="h-12 px-3 text-[#18251E] hover:text-[#103D2C] hover:bg-[#F5F8F5] transition-colors cursor-pointer flex items-center justify-center border-l border-[#DDE5DF]"
                    title="Change search mode"
                    aria-label="Toggle search mode options"
                  >
                    <span className="text-[11px] font-extrabold tracking-tighter">
                      {isSearchModeDropdownOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Primary Orange Search Button */}
                  <button
                    type="submit"
                    className="h-12 px-6 bg-[#FA541C] hover:bg-[#D4380D] text-white text-xs font-extrabold uppercase tracking-wider rounded-r-[2px] transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap shadow-xs"
                  >
                    Search
                  </button>
                </div>

                {/* Mode Selector Dropdown (Exact match to screenshot options) */}
                {isSearchModeDropdownOpen && (
                  <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-[#DDE5DF] rounded-[3px] shadow-lg overflow-hidden py-1">
                    <button
                      type="button"
                      onClick={() => handleSelectSearchMode('near_me')}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                        searchMode === 'near_me' ? 'bg-[#E8F3EC] text-[#103D2C]' : 'hover:bg-[#FAFBF9] text-[#18251E]'
                      }`}
                    >
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-[#103D2C] text-white rounded-[1px] tracking-wider">
                        GPS
                      </span>
                      <span className="text-xs font-bold">Show properties near me</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSearchMode('school')}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer border-t border-[#F0F2F0] ${
                        searchMode === 'school' ? 'bg-[#E8F3EC] text-[#103D2C]' : 'hover:bg-[#FAFBF9] text-[#18251E]'
                      }`}
                    >
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-[#176B45] text-white rounded-[1px] tracking-wider">
                        EDU
                      </span>
                      <span className="text-xs font-bold">Search by school</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSearchMode('hospital')}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer border-t border-[#F0F2F0] ${
                        searchMode === 'hospital' ? 'bg-[#E8F3EC] text-[#103D2C]' : 'hover:bg-[#FAFBF9] text-[#18251E]'
                      }`}
                    >
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-[#C93636] text-white rounded-[1px] tracking-wider">
                        MED
                      </span>
                      <span className="text-xs font-bold">Search by hospital</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSearchMode('location')}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors cursor-pointer border-t border-[#F0F2F0] ${
                        searchMode === 'location' ? 'bg-[#E8F3EC] text-[#103D2C]' : 'hover:bg-[#FAFBF9] text-[#18251E]'
                      }`}
                    >
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-stone-700 text-white rounded-[1px] tracking-wider">
                        LOC
                      </span>
                      <span className="text-xs font-bold">Search by location</span>
                    </button>
                  </div>
                )}

                {/* Autocomplete Suggestions Box */}
                {isSuggestionsOpen && landmarkSuggestions.length > 0 && searchMode !== 'near_me' && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 bg-white border border-[#DDE5DF] rounded-[3px] shadow-lg overflow-y-auto py-1">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] bg-[#FAFBF9] border-b border-[#DDE5DF]">
                      Suggested {searchMode === 'school' ? 'Schools & Universities' : searchMode === 'hospital' ? 'Hospitals & Medical Hubs' : 'Districts & Enclaves'}
                    </div>
                    {landmarkSuggestions.map((item: any) => (
                      <div
                        key={item.id || item.city}
                        onClick={() => {
                          if (searchMode === 'location') {
                            setHeroKeyword(item.city);
                            if (item.district) setHeroLocation(item.district);
                          } else {
                            setSelectedLandmark(item);
                            setHeroKeyword(item.name);
                          }
                          setIsSuggestionsOpen(false);
                        }}
                        className="px-4 py-2.5 hover:bg-[#F5F8F5] cursor-pointer flex items-center justify-between border-b border-[#F0F2F0] last:border-b-0"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#18251E]">
                            {item.name || item.city}
                          </div>
                          <div className="text-[11px] text-[#5F6B63]">
                            {item.typeLabel || `${item.district} District`} · {item.city || item.address || ''}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#176B45] uppercase tracking-wider">
                          Select
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-bar for Proximity 'Near Me' Radius Selection */}
                {searchMode === 'near_me' && (
                  <div className="mt-2.5 p-3 bg-[#E8F3EC] border border-[#176B45]/30 rounded-[2px] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[#103D2C]">
                      <span className="w-2 h-2 rounded-full bg-[#176B45] animate-pulse" />
                      <span className="font-bold">
                        {geoStatus === 'active'
                          ? 'GPS position locked. Properties sorted by proximity:'
                          : geoStatus === 'requesting'
                          ? 'Requesting browser GPS permission...'
                          : 'GPS fallback active (Colombo Central Reference):'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-[#5F6B63]">Search Radius:</span>
                      {[5, 15, 30, 50].map((radius) => (
                        <button
                          key={radius}
                          type="button"
                          onClick={() => setGeoRadiusKm(radius)}
                          className={`px-2 py-0.5 text-[11px] font-extrabold rounded-[2px] transition-colors cursor-pointer ${
                            geoRadiusKm === radius
                              ? 'bg-[#103D2C] text-white shadow-2xs'
                              : 'bg-white text-[#18251E] border border-[#DDE5DF] hover:bg-stone-50'
                          }`}
                        >
                          {radius} km
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: District, Major City, Category, Budget, and Search CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                {/* 1. Location / District */}
                <div className="lg:col-span-3">
                  <label htmlFor="hero-location" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                    District or Region
                  </label>
                  <select
                    id="hero-location"
                    value={heroLocation}
                    onChange={(e) => handleHeroDistrictChange(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-[#F8FAF8] border border-[#DDE5DF] rounded-[3px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none transition-colors"
                  >
                    <option value="">All 25 Sri Lanka Districts</option>
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district} ({d.province.replace(' Province', '')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Major City / Prime Enclave (Dynamic dependent) */}
                <div className="lg:col-span-3">
                  <label htmlFor="hero-city" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                    {heroLocation ? `Major City in ${heroLocation}` : 'Major City or Enclave'}
                  </label>
                  <select
                    id="hero-city"
                    value={heroCity}
                    disabled={!heroLocation}
                    onChange={(e) => setHeroCity(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-[#F8FAF8] border border-[#DDE5DF] rounded-[3px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:bg-[#EAEAEA] disabled:text-[#888888] transition-colors"
                  >
                    <option value="">{heroLocation ? `All ${heroLocation} Cities` : 'Select District First'}</option>
                    {heroDistrictCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Property Category */}
                <div className="lg:col-span-2">
                  <label htmlFor="hero-type" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                    Category
                  </label>
                  <select
                    id="hero-type"
                    value={heroType}
                    disabled={heroPurpose === 'land'}
                    onChange={(e) => setHeroType(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-[#F8FAF8] border border-[#DDE5DF] rounded-[3px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none disabled:bg-[#EAEAEA] disabled:text-[#888888] transition-colors"
                  >
                    <option value="all">All Categories</option>
                    <option value="house">Villas & Houses</option>
                    <option value="apartment">Condominiums</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land Plots</option>
                  </select>
                </div>

                {/* 4. Valuation / Budget Tier (Multi-Currency Aware!) */}
                <div className="lg:col-span-2">
                  <label htmlFor="hero-budget" className="block text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mb-1">
                    Budget ({currency})
                  </label>
                  <select
                    id="hero-budget"
                    value={heroBudgetRange}
                    onChange={(e) => setHeroBudgetRange(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-[#F8FAF8] border border-[#DDE5DF] rounded-[3px] font-bold text-[#18251E] focus:bg-white focus:border-[#103D2C] focus:outline-none transition-colors"
                  >
                    {budgetOptions.map((opt) => (
                      <option key={opt.val} value={opt.val}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Action Button */}
                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-11 bg-[#103D2C] hover:bg-[#176B45] text-white font-extrabold text-xs uppercase tracking-wider rounded-[3px] transition-[background-color] duration-150 cursor-pointer shadow-xs"
                  >
                    Search →
                  </button>
                </div>
              </div>

              {/* 3. Dynamic Curated Enclaves / Cities Quick-Chips */}
              <div className="pt-3.5 border-t border-[#DDE5DF]/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B63] mr-1">
                    {heroLocation
                      ? `MAJOR CITIES & ENCLAVES IN ${heroLocation.toUpperCase()}:`
                      : 'PRIME MICRO-MARKETS:'}
                  </span>
                  {heroLocation && heroDistrictCities.length > 0
                    ? heroDistrictCities.slice(0, 6).map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setHeroCity(city);
                            navigate(
                              `/properties?district=${encodeURIComponent(
                                heroLocation
                              )}&city=${encodeURIComponent(city)}`
                            );
                          }}
                          className={`group text-xs px-3 py-1.5 rounded-[2px] border transition-colors cursor-pointer font-medium flex items-center gap-1.5 ${
                            heroCity === city
                              ? 'bg-[#103D2C] text-white border-[#103D2C]'
                              : 'bg-[#F8FAF8] hover:bg-[#E8F3EC] text-[#18251E] hover:text-[#103D2C] border-[#DDE5DF] hover:border-[#176B45]/50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-[1px] ${
                              heroCity === city
                                ? 'bg-[#9FE3B8]'
                                : 'bg-[#176B45]/40 group-hover:bg-[#176B45]'
                            }`}
                          />
                          <span>{city}</span>
                        </button>
                      ))
                    : microMarkets.map((m) => (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => {
                            setHeroLocation(m.district);
                            setHeroKeyword(m.query);
                            navigate(
                              `/properties?district=${encodeURIComponent(
                                m.district
                              )}&search=${encodeURIComponent(m.query)}`
                            );
                          }}
                          className="group text-xs px-3 py-1.5 bg-[#F8FAF8] hover:bg-[#E8F3EC] text-[#18251E] hover:text-[#103D2C] rounded-[2px] border border-[#DDE5DF] hover:border-[#176B45]/50 transition-colors cursor-pointer font-medium flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-[1px] bg-[#176B45]/40 group-hover:bg-[#176B45]" />
                          <span>{m.label}</span>
                        </button>
                      ))}
                </div>

                <a
                  href="#district-cadastral-explorer"
                  className="text-[11px] font-extrabold uppercase tracking-wider text-[#176B45] hover:text-[#103D2C] flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore All 25 Districts Cadastre</span>
                  <span>↓</span>
                </a>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: FEATURED PROPERTIES SHOWCASE
          Dedicated showcase for priority-promoted residences & verified estates
          ========================================================================= */}
      <section id="featured-properties" className="bg-[#FAFBF9] py-14 sm:py-20 border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#DDE5DF] mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#103D2C] text-white text-[10px] font-extrabold uppercase tracking-widest rounded-[2px] mb-2">
                FEATURED SHOWCASE
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#103D2C] tracking-tight">
                Featured Properties & Flagship Estates
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5 leading-relaxed max-w-xl">
                Priority-promoted properties by verified property owners and certified real estate agents across Sri Lanka.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/properties?featured=true')}
              className="px-5 py-2.5 bg-white border border-[#DDE5DF] hover:border-[#103D2C] text-[#103D2C] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs"
            >
              View All Featured Listings ({featuredProperties.length}) →
            </button>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              featuredProperties.length === 2 || featuredProperties.length === 4
                ? 'lg:grid-cols-2'
                : 'lg:grid-cols-3'
            } gap-6 sm:gap-8`}
          >
            {featuredProperties.map((property, idx) => (
              <PropertyCard key={property.id} property={property} priority={idx < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENVIRONMENT 2: TROPHY ARCHITECTURAL SHOWCASE (ZERO DUPLICATES)
          Replaces the repetitive "Curated", "Featured", and "Latest" sections with
          one consolidated, world-class editorial showcase of distinct properties!
          ========================================================================= */}
      <section className="bg-white py-14 sm:py-20 border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          {/* Header & Category Tab Filters */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#DDE5DF] mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#103D2C] tracking-tight">
                Curated Sri Lankan Trophy Masterpieces
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5 leading-relaxed max-w-xl">
                Every residence and land holding is verified by our legal desk with certified freehold title deeds, surveyed boundaries, and direct seller authorization.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F8F5] p-1 rounded-[3px] border border-[#DDE5DF]">
              {[
                { key: 'all', label: 'All Trophy Assets' },
                { key: 'villas', label: 'Villas & Houses' },
                { key: 'penthouses', label: 'Sky Condos' },
                { key: 'land', label: 'Beachfront Land' },
                { key: 'heritage', label: 'Highland Estates' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setShowcaseTab(tab.key as any)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
                    showcaseTab === tab.key
                      ? 'bg-[#103D2C] text-white shadow-2xs'
                      : 'text-[#5F6B63] hover:text-[#18251E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Architectural Cards Grid (Every property is DISTINCT!) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {showcaseProperties.map((property, idx) => (
              <PropertyCard key={property.id} property={property} priority={idx < 3} />
            ))}
          </div>

          {/* Bottom Bar: Direct Link to Full Discovery */}
          <div className="mt-12 pt-6 border-t border-[#DDE5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-[#5F6B63]">
              Displaying {showcaseProperties.length} verified trophy assets · All valuations converted dynamically to <strong className="text-[#103D2C]">{currency}</strong>
            </span>
            <button
              onClick={() => navigate('/properties')}
              className="px-6 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider rounded-[2px] transition-colors self-start sm:self-auto cursor-pointer"
            >
              Browse Full Sri Lanka Marketplace ({eligibleProperties.length} Listings) →
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENVIRONMENT 3: CADASTRAL MARKET INTELLIGENCE & DIASPORA ACQUISITION CENTER
          Unifies:
          - Q4 2026 Real Estate Benchmark Index (id="market-benchmark")
          - 4-Stage Foreign & Diaspora Legal Roadmap (id="acquisition-protocol")
          - Interactive Sri Lanka Stamp Duty & Cost Estimator
          ========================================================================= */}
      <section id="market-benchmark" className="bg-[#103D2C] text-white py-16 sm:py-20 border-b border-[#176B45]/40">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-16">
          {/* Part A: Cadastral Benchmark Index */}
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#176B45]/50 mb-10">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#E8F3EC] block font-extrabold">
                  OFFICIAL CADASTRAL BENCHMARK · Q4 2026
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-1.5 tracking-tight">
                  Sri Lanka Real Estate Market Index
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md leading-relaxed">
                Consolidated cadastral statistics, median land appreciation per perch, and foreign investment absorption compiled from the Central Bank of Sri Lanka (CBSL) and District Land Registries.
              </p>
            </div>

            {/* 4 High-Contrast Benchmark Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat 1 */}
              <div className="border border-[#176B45]/60 bg-white/5 p-6 rounded-[3px] backdrop-blur-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#E8F3EC] block font-bold">
                    INDEX 01 · PRIME RESIDENTIAL
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mt-3 tabular-nums">
                    +14.2%
                  </div>
                  <h3 className="text-sm font-bold text-neutral-100 mt-2">
                    Colombo 03 & 07 Capital Growth
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                    Year-on-year appreciation for freehold residential land and diplomatic compound parcels.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-bold tracking-wider">
                  SOURCE: LAND REGISTRY INDEX
                </div>
              </div>

              {/* Stat 2 */}
              <div className="border border-[#176B45]/60 bg-white/5 p-6 rounded-[3px] backdrop-blur-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#E8F3EC] block font-bold">
                    INDEX 02 · COASTAL VALUATION
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mt-3 tabular-nums">
                    +18.6%
                  </div>
                  <h3 className="text-sm font-bold text-neutral-100 mt-2">
                    Southern Beachfront Acreage
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                    Weighted land price escalation across Talpe, Mirissa, Dikwella, and Tangalle beach strips.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-bold tracking-wider">
                  SOURCE: SOUTHERN COASTAL REGISTER
                </div>
              </div>

              {/* Stat 3 */}
              <div className="border border-[#176B45]/60 bg-white/5 p-6 rounded-[3px] backdrop-blur-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#E8F3EC] block font-bold">
                    INDEX 03 · RENTAL YIELDS
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mt-3 tabular-nums">
                    7.4% – 11.2%
                  </div>
                  <h3 className="text-sm font-bold text-neutral-100 mt-2">
                    Gross Foreign Currency Yields
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                    Annual returns generated through managed luxury boutique villas and Colombo serviced residences.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-bold tracking-wider">
                  SOURCE: HOSPITALITY BROKER NETWORK
                </div>
              </div>

              {/* Stat 4 */}
              <div className="border border-[#176B45]/60 bg-white/5 p-6 rounded-[3px] backdrop-blur-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#E8F3EC] block font-bold">
                    INDEX 04 · FOREIGN ABSORPTION
                  </span>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white mt-3 tabular-nums">
                    88.4%
                  </div>
                  <h3 className="text-sm font-bold text-neutral-100 mt-2">
                    CMA Act Freehold Clearance
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                    Statutory foreign quota fulfillment across completed Colombo and coastal condominium towers.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-bold tracking-wider">
                  SOURCE: CONDOMINIUM AUTHORITY
                </div>
              </div>
            </div>
          </div>

          {/* Part B: 4-Stage Statutory Foreign & Diaspora Acquisition Protocol */}
          <div id="acquisition-protocol" className="pt-10 border-t border-[#176B45]/50">
            <div className="max-w-3xl mb-10">
              <span className="text-[11px] uppercase tracking-wider text-[#E8F3EC] block font-extrabold">
                STATUTORY LEGAL BLUEPRINT FOR OVERSEAS BUYERS
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                Four-Step Sri Lanka Property Acquisition Protocol
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
                A legally secured acquisition framework for overseas diaspora, dual citizens, and international investors under Sri Lankan statutory property acts.
              </p>
            </div>

            {/* 4 Structured Protocol Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 border border-[#176B45]/60 p-6 rounded-[3px] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#E8F3EC] tracking-wider block">STAGE 01</span>
                  <h4 className="text-base font-extrabold text-white mt-1">30-Year Title Search</h4>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                    Extract cadastral registry folios to ensure clear pedigree, verify Bim Saviya 1st Class title status, and confirm absence of lis pendens or encumbrances.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-semibold">
                  RESULT: NON-ENCUMBRANCE CERTIFICATE
                </div>
              </div>

              <div className="bg-white/5 border border-[#176B45]/60 p-6 rounded-[3px] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#E8F3EC] tracking-wider block">STAGE 02</span>
                  <h4 className="text-base font-extrabold text-white mt-1">Tenure Classification</h4>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                    100% direct freehold ownership for foreign nationals in condominiums from ground-floor up under the CMA Act, or 99-year registered lease / BOI enterprise for land parcels.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-semibold">
                  RESULT: STATUTORY TENURE ALLOCATION
                </div>
              </div>

              <div className="bg-white/5 border border-[#176B45]/60 p-6 rounded-[3px] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#E8F3EC] tracking-wider block">STAGE 03</span>
                  <h4 className="text-base font-extrabold text-white mt-1">Central Bank IIA Routing</h4>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                    All foreign inward remittances must flow through an approved Inward Investment Account (IIA) in a licensed commercial bank to guarantee statutory repatriation of capital gains.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-semibold">
                  RESULT: FULL REPATRIATION GUARANTEE
                </div>
              </div>

              <div className="bg-white/5 border border-[#176B45]/60 p-6 rounded-[3px] flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-[#E8F3EC] tracking-wider block">STAGE 04</span>
                  <h4 className="text-base font-extrabold text-white mt-1">Notarial Deed Execution</h4>
                  <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                    Formal deed execution before a licensed Notary Public, statutory 4% stamp duty settlement, and registration at the District Land Registry to issue authenticated title.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-[#176B45]/40 text-[10px] text-[#E8F3EC] font-semibold">
                  RESULT: AUTHENTIC DEED DISPATCH
                </div>
              </div>
            </div>
          </div>

          {/* Part C: Interactive Sri Lanka Stamp Duty & Closing Cost Estimator */}
          <div className="pt-10 border-t border-[#176B45]/50">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#176B45]/40 mb-8">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#E8F3EC] block font-extrabold">
                  STATUTORY TAXATION & COST ESTIMATOR
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                  Sri Lanka Stamp Duty & Legal Fee Estimator
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed max-w-xl">
                  Calculate statutory 4% stamp duty, 1% notarial attestation fee, cadastral registration costs, and financing requirements in real time.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-300 mr-1">
                  PRESET VALUATION:
                </span>
                {[
                  { label: 'Rs. 45M', val: 45000000 },
                  { label: 'Rs. 95M', val: 95000000 },
                  { label: 'Rs. 185M', val: 185000000 },
                  { label: 'Rs. 250M', val: 250000000 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setCalculatorPrice(p.val)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-[2px] border transition-colors cursor-pointer ${
                      calculatorPrice === p.val
                        ? 'bg-white text-[#103D2C] border-white'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculator Card */}
            <div className="bg-white text-[#18251E] rounded-[4px] p-6 sm:p-8 shadow-xl">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#103D2C] block">
                    Assessed Property Purchase Valuation:
                  </label>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tabular-nums mt-0.5">
                    {formatPrice(calculatorPrice)}
                  </div>
                </div>
                <div className="w-full sm:w-80">
                  <input
                    type="range"
                    min={20000000}
                    max={500000000}
                    step={5000000}
                    value={calculatorPrice}
                    onChange={(e) => setCalculatorPrice(Number(e.target.value))}
                    className="w-full accent-[#103D2C] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-[#5F6B63] mt-1 tabular-nums">
                    <span>Rs. 20M</span>
                    <span>Rs. 250M</span>
                    <span>Rs. 500M</span>
                  </div>
                </div>
              </div>

              <AcquisitionCalculator priceLkr={calculatorPrice} propertyType="house" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENVIRONMENT 4: SRI LANKA 25 DISTRICTS & REGIONAL CADASTRAL EXPLORER
          Interactive provincial & district directory revealing major cities,
          tenure status, land benchmarks, and verified deed registries
          ========================================================================= */}
      <DistrictCadastralExplorer
        initialDistrict={heroLocation || 'Colombo'}
        onSelectDistrict={(d) => {
          setHeroLocation(d);
          setHeroCity('');
        }}
      />

      {/* =========================================================================
          SECTION: TRENDING PROPERTIES & MARKET VELOCITY
          High-engagement listings with recent inquiry spikes and diaspora interest
          ========================================================================= */}
      <section id="trending-properties" className="bg-white py-14 sm:py-20 border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#DDE5DF] mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#C93636] text-white text-[10px] font-extrabold uppercase tracking-widest rounded-[2px] mb-2">
                MARKET VELOCITY
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#103D2C] tracking-tight">
                Trending Properties in Sri Lanka This Week
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5 leading-relaxed max-w-xl">
                High-demand listings experiencing significant inquiry acceleration, viewing schedules, and diaspora interest over the last 7 days.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-bold text-[#5F6B63] uppercase tracking-wider">Live Activity:</span>
              <span className="px-2.5 py-1 bg-[#F5F8F5] border border-[#DDE5DF] text-[#176B45] text-xs font-black rounded-[2px]">
                {trendingProperties.length} Properties Trending
              </span>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${
              trendingProperties.length === 2 || trendingProperties.length === 4
                ? 'lg:grid-cols-2'
                : 'lg:grid-cols-3'
            } gap-6 sm:gap-8`}
          >
            {trendingProperties.map((property, idx) => (
              <div key={property.id} className="relative group flex flex-col">
                <PropertyCard property={property} priority={idx < 3} />
                {property.trendingVelocityText && (
                  <div className="mt-2 px-3 py-1.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#C93636] uppercase tracking-wider">
                      Velocity Signal
                    </span>
                    <span className="font-semibold text-[#18251E]">
                      {property.trendingVelocityText}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENVIRONMENT 5: PRIME REGIONAL CORRIDORS & SIGNATURE DEVELOPMENTS
          Showcases Sri Lanka's 4 core macro investment corridors and masterplans
          ========================================================================= */}
      <section className="bg-[#F7F6F2] py-16 sm:py-20 border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-16">
          {/* Part A: 4 Macro Investment Corridors */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#DDE5DF] mb-8">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#103D2C] tracking-tight">
                  Sri Lanka's Core Investment Corridors
                </h2>
              </div>
              <p className="text-xs text-[#5F6B63] sm:text-right">
                Targeted yields & capital appreciation across Sri Lanka's 4 key economic zones
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Corridor 1: Colombo */}
              <div
                onClick={() => navigate('/properties?district=Colombo')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[3px] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-[#F5F8F5]">
                  <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
                    alt="Colombo Metropolitan Core"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#103D2C]/90 text-white text-[10px] font-extrabold uppercase rounded-[2px]">
                    METROPOLITAN CORE
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-bold text-[#176B45]">COLOMBO 01 – 07</div>
                  <h3 className="text-base font-extrabold text-[#18251E] group-hover:text-[#103D2C]">
                    Diplomatic Residences & Sky Towers
                  </h3>
                  <p className="text-xs text-[#5F6B63] leading-relaxed">
                    Cinnamon Gardens estates and oceanfront high-rises commanding high foreign currency rental yields.
                  </p>
                  <div className="pt-3 border-t border-[#DDE5DF] flex justify-between text-xs font-bold text-[#103D2C]">
                    <span>Rate: Rs. 18M – 28M / perch</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>

              {/* Corridor 2: Southern Riviera */}
              <div
                onClick={() => navigate('/properties?district=Galle')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[3px] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-[#F5F8F5]">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                    alt="Southern Coastal Riviera"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#103D2C]/90 text-white text-[10px] font-extrabold uppercase rounded-[2px]">
                    COASTAL RIVIERA
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-bold text-[#176B45]">GALLE · TALPE · MIRISSA</div>
                  <h3 className="text-base font-extrabold text-[#18251E] group-hover:text-[#103D2C]">
                    Oceanfront Pavilions & Coconut Groves
                  </h3>
                  <p className="text-xs text-[#5F6B63] leading-relaxed">
                    Bawa-style tropical architecture and prime beachfront land for boutique hospitality.
                  </p>
                  <div className="pt-3 border-t border-[#DDE5DF] flex justify-between text-xs font-bold text-[#103D2C]">
                    <span>Rate: Rs. 4M – 7.5M / perch</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>

              {/* Corridor 3: Central Highlands */}
              <div
                onClick={() => navigate('/properties?district=Kandy')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[3px] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-[#F5F8F5]">
                  <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
                    alt="Central Highlands & Tea Country"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#103D2C]/90 text-white text-[10px] font-extrabold uppercase rounded-[2px]">
                    HIGHLAND ESTATES
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-bold text-[#176B45]">KANDY · NUWARA ELIYA</div>
                  <h3 className="text-base font-extrabold text-[#18251E] group-hover:text-[#103D2C]">
                    Colonial Bungalows & Golf Chalets
                  </h3>
                  <p className="text-xs text-[#5F6B63] leading-relaxed">
                    Mountain foothill retreats, Victoria Golf championship fairways, and cool-climate tea sanctuaries.
                  </p>
                  <div className="pt-3 border-t border-[#DDE5DF] flex justify-between text-xs font-bold text-[#103D2C]">
                    <span>Rate: Rs. 2.2M – 4.5M / perch</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>

              {/* Corridor 4: Strategic Commercial Land Banks */}
              <div
                onClick={() => navigate('/properties?type=land')}
                className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[3px] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-[#F5F8F5]">
                  <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80"
                    alt="Strategic Commercial & Tourism Land Banks"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#103D2C]/90 text-white text-[10px] font-extrabold uppercase rounded-[2px]">
                    STRATEGIC LAND BANKS
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="text-[11px] font-bold text-[#176B45]">COLOMBO PORT CITY & LOGISTICS</div>
                  <h3 className="text-base font-extrabold text-[#18251E] group-hover:text-[#103D2C]">
                    Commercial Zoned Acreage
                  </h3>
                  <p className="text-xs text-[#5F6B63] leading-relaxed">
                    Acreage situated near expressways, airport logistics hubs, and designated tourism Special Economic Zones.
                  </p>
                  <div className="pt-3 border-t border-[#DDE5DF] flex justify-between text-xs font-bold text-[#103D2C]">
                    <span>Rate: Rs. 1.5M – 3.8M / perch</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Part B: Signature Masterplanned Developments */}
          <div className="pt-10 border-t border-[#DDE5DF]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#DDE5DF] mb-8">
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight">
                  Featured Masterplanned Communities
                </h3>
              </div>
              <button
                onClick={() => navigate('/developments')}
                className="text-xs font-extrabold uppercase tracking-wider text-[#103D2C] hover:text-[#176B45] cursor-pointer"
              >
                View All Developments →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {DEVELOPMENTS_DATA.slice(0, 2).map((dev) => (
                <div
                  key={dev.id}
                  onClick={() => navigate(`/developments/${dev.slug}`)}
                  className="group bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-[#F5F8F5]">
                    <img
                      src={dev.coverImage}
                      alt={dev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#103D2C]/90 text-white text-[10px] font-extrabold uppercase rounded-[2px]">
                      {dev.status}
                    </div>
                  </div>
                  <div className="p-6 sm:p-7 space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#5F6B63]">
                      <span className="font-bold text-[#176B45] uppercase">{dev.location.city}, {dev.location.district}</span>
                      <span>Completion: {dev.completionDate}</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-[#18251E] group-hover:text-[#103D2C]">
                      {dev.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#5F6B63] line-clamp-2 leading-relaxed">
                      {dev.tagline}
                    </p>
                    <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#5F6B63] block">Starting Valuation</span>
                        <span className="text-lg font-extrabold text-[#103D2C] tabular-nums">
                          {formatPrice(dev.startingPriceLkr)}
                        </span>
                      </div>
                      <span className="px-4 py-2 bg-[#F5F8F5] group-hover:bg-[#103D2C] group-hover:text-white text-[#18251E] text-xs font-bold uppercase rounded-[2px] transition-colors">
                        Explore Masterplan →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENVIRONMENT 5: PRIVATE OFFICE CONCIERGE & SELLER DISPATCH
          id="private-office" for header anchor navigation
          ========================================================================= */}
      <section id="private-office" className="bg-[#103D2C] text-white py-16 sm:py-20 border-b border-[#176B45]/40">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8 space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                Private Client Concierge & Off-Market Portfolio
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed pt-1">
                Certain premier assets in Sri Lanka—including historic Cinnamon Gardens diplomatic compounds, private oceanfront islands, and century-old tea plantations—are transacted strictly off-market under bilateral Non-Disclosure Agreements (NDA).
              </p>
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#E8F3EC] font-semibold tracking-wider">
                <span>· DISCREET BUYER SCREENING</span>
                <span>· DIRECT PROVENANCE AUDIT</span>
                <span>· DEDICATED SOVEREIGN ESCROW</span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5">
              <button
                onClick={() => navigate('/list-property')}
                className="w-full px-6 py-4 bg-[#C93636] hover:bg-[#A92828] text-white font-extrabold text-xs uppercase tracking-wider rounded-[2px] transition-colors text-center cursor-pointer shadow-md"
              >
                Request Confidential Portfolio Brief →
              </button>
              <button
                onClick={() => navigate('/list-property')}
                className="w-full px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs uppercase tracking-wider rounded-[2px] transition-colors text-center cursor-pointer"
              >
                List a Private Estate (&gt; LKR 250M)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENVIRONMENT 6: PROPERTY LISTING & ADVERTISING PACKAGES
          Dedicated homepage section for property owners, landlords & brokers
          ========================================================================= */}
      <section className="bg-white py-16 sm:py-20 border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 pb-4 border-b border-[#DDE5DF]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] text-[10px] font-black uppercase tracking-widest rounded-[2px] border border-[#176B45]/30 mb-2">
                <span>▪</span>
                <span>For Property Owners & Certified Brokers</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#103D2C] tracking-tight">
                List Your Property on LankaProperty.lk
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5 max-w-xl">
                Reach over 500,000 active buyers and renters every month across Sri Lanka and the overseas diaspora. Simple plans with zero sales commissions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/advertising-packages')}
                className="px-4 py-2.5 bg-[#F5F8F5] hover:bg-[#E8F3EC] border border-[#DDE5DF] text-[#103D2C] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
              >
                View Full Media Kit →
              </button>
              <button
                onClick={() => navigate('/list-property')}
                className="px-5 py-2.5 bg-[#C93636] hover:bg-[#A92828] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-xs"
              >
                Post Your Property →
              </button>
            </div>
          </div>

          {/* Category Switcher Tabs for Packages */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setActivePackageTab('direct')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                activePackageTab === 'direct'
                  ? 'bg-[#103D2C] text-white shadow-xs'
                  : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] hover:bg-[#E8F3EC] border border-[#DDE5DF]'
              }`}
            >
              Direct Publishing Plans (30 – 90 Days)
            </button>
            <button
              type="button"
              onClick={() => setActivePackageTab('strategic')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                activePackageTab === 'strategic'
                  ? 'bg-[#103D2C] text-white shadow-xs'
                  : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] hover:bg-[#E8F3EC] border border-[#DDE5DF]'
              }`}
            >
              Strategic Listing Packages (Until Sold · 12 Mo)
            </button>
          </div>

          {/* Dynamic Listing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {packagesList
              .filter((p) => p.category === activePackageTab && p.active)
              .map((pkg) => {
                const isFree = pkg.priceLkr === 0;
                const isHighlight = pkg.popular || pkg.badge === 'BEST VALUE' || pkg.badge === 'MOST POPULAR';

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-[2px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                      isHighlight
                        ? 'bg-white border-2 border-[#C93636] shadow-md ring-1 ring-[#C93636]/20'
                        : 'bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C] shadow-2xs'
                    }`}
                  >
                    {pkg.badge && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-white text-[10px] font-black uppercase tracking-widest rounded-[2px] shadow-xs"
                        style={{ backgroundColor: pkg.badgeColor || (isHighlight ? '#C93636' : '#103D2C') }}
                      >
                        {pkg.badge}
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#5F6B63]">
                        {pkg.category === 'direct' ? 'SELF-SERVICE PLAN' : 'STRATEGIC CAMPAIGN'}
                      </span>
                      <h3 className="text-xl font-bold text-[#103D2C] tracking-tight mt-1">
                        {pkg.name}
                      </h3>

                      <div className="mt-3 pt-3 border-t border-[#DDE5DF]">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`text-2xl sm:text-3xl font-extrabold ${
                              isFree ? 'text-[#C93636]' : 'text-[#103D2C]'
                            }`}
                          >
                            {isFree ? 'FREE' : formatPrice(pkg.priceLkr)}
                          </span>
                          <span className="text-xs font-semibold text-[#5F6B63]">
                            / {pkg.duration}
                          </span>
                        </div>
                        {!isFree && currency !== 'LKR' && (
                          <div className="text-[10px] text-[#5F6B63] mt-0.5">
                            Base: Rs. {pkg.priceLkr.toLocaleString()} LKR
                          </div>
                        )}
                        <p className="text-xs text-[#5F6B63] mt-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      </div>

                      {/* Simple English Features */}
                      <ul className="mt-6 pt-4 border-t border-[#DDE5DF] space-y-2.5 text-xs text-[#18251E]">
                        {pkg.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 leading-relaxed">
                            <span className="text-[#176B45] font-bold mt-0.5">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-6 border-t border-[#DDE5DF]">
                      <button
                        type="button"
                        onClick={() => navigate(`/list-property?package=${pkg.id}`)}
                        className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center ${
                          isHighlight
                            ? 'bg-[#C93636] hover:bg-[#A92828] text-white shadow-xs'
                            : isFree
                            ? 'bg-white hover:bg-[#E8F3EC] text-[#103D2C] border border-[#DDE5DF]'
                            : 'bg-[#103D2C] hover:bg-[#176B45] text-white shadow-xs'
                        }`}
                      >
                        {isFree ? 'Start Free Listing →' : `Select ${pkg.name} →`}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Bottom Banner Footnote */}
          <div className="mt-10 bg-[#FAFBF9] border border-[#DDE5DF] p-5 rounded-[2px] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5F6B63]">
            <div>
              <strong className="text-[#103D2C]">Need higher exposure?</strong> Diamond packages include top web slider banners, 4K aerial drone video, and broadcasts to 15,000+ overseas diaspora buyers.
            </div>
            <button
              onClick={() => navigate('/advertising-packages')}
              className="text-[#176B45] font-bold hover:underline shrink-0 cursor-pointer"
            >
              Explore All Advertising Packages & Rates →
            </button>
          </div>
        </div>
      </section>

      {/* Institutional Dual Action Desk */}
      <section className="bg-white py-12 sm:py-16 border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Box 1: For Sellers */}
            <div className="bg-[#F5F8F5] border border-[#DDE5DF] p-6 sm:p-8 rounded-[3px] flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#18251E]">
                  List Your Property with Cadastral Verification
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6B63] mt-2 leading-relaxed">
                  Gain exposure to thousands of verified overseas diaspora buyers, local institutional investors, and international high-net-worth individuals.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DDE5DF]">
                <button
                  onClick={() => navigate('/list-property')}
                  className="px-5 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                >
                  Submit Listing for Review →
                </button>
              </div>
            </div>

            {/* Box 2: For Diaspora Buyers */}
            <div className="bg-[#F5F8F5] border border-[#DDE5DF] p-6 sm:p-8 rounded-[3px] flex flex-col justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#18251E]">
                  Direct Title Search & Escrow Support
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6B63] mt-2 leading-relaxed">
                  Connect with licensed notaries and conveyancers to verify 30-year deed folios, Bim Saviya registration, and Central Bank IIA fund routing.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DDE5DF]">
                <button
                  onClick={() => {
                    const el = document.getElementById('acquisition-protocol');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-extrabold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                >
                  Review 4-Step Legal Protocol →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENVIRONMENT 7: GOOGLE CRAWLER, GEO & AIO KNOWLEDGE INDEX
          Visible FAQ answers + semantic anchor links for all 25 Sri Lankan Districts
          so search spiders and AI answer engines index every regional market.
          ========================================================================= */}
      <section aria-labelledby="sri-lanka-property-faq-heading" className="bg-[#FAFBF9] py-14 sm:py-16 border-b border-[#DDE5DF]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-12">
          {/* Part 1: Structured FAQ for Google Rich Snippets & AI Overviews */}
          <div>
            <h2 id="sri-lanka-property-faq-heading" className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight">
              Sri Lanka Real Estate Buying Guide & Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5 max-w-2xl">
              Clear answers on property ownership, land measurements, stamp duty taxes, and direct listing rules in Sri Lanka.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <article className="bg-white border border-[#DDE5DF] rounded-[3px] p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-[#18251E]">
                  Can foreigners and overseas diaspora buy property in Sri Lanka?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  Yes. Foreign citizens can purchase 100% freehold condominium apartments registered under the Condominium Management Authority (CMA) using funds routed through an Inward Investment Account (IIA) at any licensed commercial bank in Sri Lanka. For landed villas, houses, and land plots, overseas buyers can acquire up to a 99-year registered lease or purchase via a Sri Lankan company with 50% or more local shareholding.
                </p>
              </article>

              <article className="bg-white border border-[#DDE5DF] rounded-[3px] p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-[#18251E]">
                  How is land measured in Sri Lanka (Perches, Roods, and Acres)?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  In Sri Lanka, residential and commercial land is measured in Perches and Acres. Exactly 1 Perch equals 272.25 square feet (25.29 square meters). 40 Perches equal 1 Rood, and 160 Perches equal 1 full Acre (43,560 square feet).
                </p>
              </article>

              <article className="bg-white border border-[#DDE5DF] rounded-[3px] p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-[#18251E]">
                  How much is property transfer stamp duty in Sri Lanka?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  Statutory Sri Lankan property transfer stamp duty is calculated at 3% on the first LKR 100,000 of the property valuation and 4% on the balance amount above LKR 100,000, payable upon title deed registration.
                </p>
              </article>

              <article className="bg-white border border-[#DDE5DF] rounded-[3px] p-5 space-y-2">
                <h3 className="text-sm font-extrabold text-[#18251E]">
                  How can I list my house, land, or apartment on LankaProperty.lk?
                </h3>
                <p className="text-xs text-[#5F6B63] leading-relaxed">
                  Property owners and licensed real estate agents can publish directly using the Post Your Property Free button in the header, uploading up to 20 high-resolution photos with direct WhatsApp and phone lead routing.
                </p>
              </article>
            </div>
          </div>

          {/* Part 2: Crawlable All 25 Districts Internal Link Matrix */}
          <nav aria-label="Sri Lanka 25 Districts Real Estate Directory" className="pt-8 border-t border-[#DDE5DF]">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#103D2C] mb-4">
              Browse Properties for Sale & Rent Across All 25 Sri Lankan Districts
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
                    className="block px-3 py-2 bg-white border border-[#DDE5DF] hover:border-[#176B45] hover:text-[#176B45] rounded-[2px] font-semibold text-[#18251E] transition-colors truncate"
                  >
                    {d.name} District ({d.province.replace(' Province', '')})
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
