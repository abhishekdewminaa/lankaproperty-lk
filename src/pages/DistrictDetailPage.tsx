import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { SRI_LANKA_DISTRICTS } from '../data/locations';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';
import { useCurrency } from '../context/CurrencyContext';

interface DistrictDetailPageProps {
  districtSlug: string;
}

export function DistrictDetailPage({ districtSlug }: DistrictDetailPageProps) {
  const { navigate } = useRouter();
  const { currency } = useCurrency();
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    propertyService.syncWithSupabase(false);
    const unsub = propertyService.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  // Find matching district
  const districtData = useMemo(() => {
    return (
      SRI_LANKA_DISTRICTS.find(
        (d) =>
          d.district.toLowerCase().replace(/[^a-z0-9]+/g, '-') === districtSlug.toLowerCase() ||
          d.district.toLowerCase() === districtSlug.toLowerCase()
      ) || null
    );
  }, [districtSlug]);

  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');

  // Filter properties in this district
  const districtProperties = useMemo(() => {
    if (!districtData) return [];
    const allAuthoritative = propertyService.getAllAuthoritativeProperties();
    return allAuthoritative.filter((p) => {
      if (p.publicationStatus !== 'published') return false;
      const matchDistrict =
        p.location.district.toLowerCase() === districtData.district.toLowerCase();
      if (!matchDistrict) return false;

      if (selectedCity !== 'all' && !p.location.city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
      if (propertyTypeFilter !== 'all' && p.type !== propertyTypeFilter) {
        return false;
      }
      return true;
    });
  }, [districtData, storeVersion, selectedCity, propertyTypeFilter]);

  if (!districtData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#C93636]">
          District Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E]">
          The requested district cadastre does not exist.
        </h1>
        <p className="text-sm text-[#5F6B63]">
          Please browse the complete Sri Lanka 25-district directory on our homepage.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] hover:bg-[#176B45] cursor-pointer"
        >
          Return to All 25 Districts Directory
        </button>
      </div>
    );
  }

  const canonicalUrl = `/districts/${districtSlug}`;

  return (
    <div className="bg-white min-h-screen pb-20">
      <SeoHead
        title={`Properties for Sale & Rent in ${districtData.district} District (${districtData.province}), Sri Lanka | LankaProperty.lk`}
        description={`Explore verified houses, luxury villas, apartments, and land plots in ${districtData.district} District. Current cadastral benchmark: ${districtData.landBenchmark}. Direct owner and agent contact.`}
        canonicalPath={canonicalUrl}
        geoPlacename={`${districtData.district}, Sri Lanka`}
        jsonLd={[
          {
            '@type': 'Place',
            name: `${districtData.district} District`,
            description: districtData.character,
            address: {
              '@type': 'PostalAddress',
              addressRegion: districtData.district,
              addressCountry: 'LK',
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
                name: 'Districts',
                item: 'https://lankaproperty.lk/#district-cadastral-explorer',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `${districtData.district} District`,
                item: `https://lankaproperty.lk${canonicalUrl}`,
              },
            ],
          },
        ]}
      />

      {/* Breadcrumb Bar */}
      <div className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-3 text-xs text-[#5F6B63]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hover:text-[#18251E] cursor-pointer">
              Home
            </button>
            <span>/</span>
            <span className="text-[#5F6B63]">Districts</span>
            <span>/</span>
            <span className="text-[#103D2C] font-extrabold">{districtData.district} District</span>
          </nav>

          <button
            onClick={() => navigate('/properties')}
            className="hidden sm:inline-flex items-center gap-1.5 font-bold text-[#103D2C] hover:text-[#176B45] cursor-pointer text-xs"
          >
            <span>← All Sri Lanka Marketplace</span>
          </button>
        </div>
      </div>

      {/* Hero Regional Header */}
      <section className="bg-[#F5F8F5] border-b border-[#DDE5DF] py-12 sm:py-16">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#103D2C] tracking-tight">
                {districtData.district} District Real Estate
              </h1>
              <p className="text-sm sm:text-base text-[#5F6B63] leading-relaxed">
                {districtData.character}
              </p>
            </div>

            {/* Cadastral Metric Tile */}
            <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 sm:p-5 shadow-xs shrink-0 lg:text-right space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#5F6B63] block">
                LAND BENCHMARK PRICE
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#103D2C] tabular-nums block">
                {districtData.landBenchmark}
              </span>
              <span className="text-[11px] text-[#176B45] font-semibold block">
                Bim Saviya Cadastre Registered
              </span>
            </div>
          </div>

          {/* Quick City Micro-Markets Filter Pills */}
          <div className="pt-4 border-t border-[#DDE5DF]">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#18251E] block mb-2.5">
              Major Cities & Micro-Markets in {districtData.district}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
                  selectedCity === 'all'
                    ? 'bg-[#103D2C] text-white shadow-2xs'
                    : 'bg-white border border-[#DDE5DF] text-[#18251E] hover:border-[#176B45]'
                }`}
              >
                All {districtData.district} ({districtProperties.length})
              </button>
              {districtData.cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors cursor-pointer ${
                    selectedCity === city
                      ? 'bg-[#176B45] text-white font-bold'
                      : 'bg-white border border-[#DDE5DF] text-[#5F6B63] hover:text-[#18251E] hover:border-[#176B45]'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Properties Inventory in District */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#18251E]">
              Available Properties in {districtData.district}
            </h2>
            <p className="text-xs text-[#5F6B63] mt-0.5">
              Showing {districtProperties.length} verified listings in {selectedCity === 'all' ? districtData.district : selectedCity}
            </p>
          </div>

          {/* Property Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5F6B63]">Type:</span>
            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] text-[#18251E] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Categories</option>
              <option value="land">Land</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="hotel">Hotel</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>

        {districtProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {districtProperties.map((p, idx) => (
              <PropertyCard key={p.id} property={p} priority={idx < 3} />
            ))}
          </div>
        ) : (
          <div className="bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] p-10 text-center space-y-3">
            <h3 className="font-extrabold text-[#18251E] text-lg">
              No matching properties currently listed in {selectedCity === 'all' ? districtData.district : selectedCity}.
            </h3>
            <p className="text-xs text-[#5F6B63] max-w-md mx-auto">
              Be the first to list a property in this corridor, or post a Buyer Request to be notified when listings become available.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/list-property')}
                className="px-5 py-2.5 bg-[#176B45] text-white text-xs font-bold uppercase rounded-[2px] hover:bg-[#103D2C] cursor-pointer"
              >
                + List Property in {districtData.district} Free
              </button>
              <button
                onClick={() => navigate('/wanted-properties')}
                className="px-5 py-2.5 bg-white border border-[#DDE5DF] text-[#18251E] text-xs font-bold uppercase rounded-[2px] hover:border-[#176B45] cursor-pointer"
              >
                Post Buyer Request →
              </button>
            </div>
          </div>
        )}

        {/* Regional Investment Guide for GEO Citations */}
        <div className="mt-16 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-extrabold text-[#103D2C]">
            {districtData.district} Real Estate Investment & Acquisition FAQ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-4 border border-[#DDE5DF] rounded-[2px] space-y-1">
              <h4 className="font-extrabold text-[#18251E]">What is the land price in {districtData.district}?</h4>
              <p className="text-[#5F6B63] leading-relaxed">
                Prevailing residential and commercial land prices in {districtData.district} benchmark around {districtData.landBenchmark}, depending on exact road frontage, municipal council zones, and infrastructure connectivity.
              </p>
            </div>
            <div className="bg-white p-4 border border-[#DDE5DF] rounded-[2px] space-y-1">
              <h4 className="font-extrabold text-[#18251E]">Are freehold deeds available in {districtData.district}?</h4>
              <p className="text-[#5F6B63] leading-relaxed">
                Yes. Properties listed on LankaProperty.lk are verified for clean freehold (*Sinnakkara*) title deeds, surveyed cadastre diagrams, and local Pradeshiya Sabha / Municipal approvals.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
