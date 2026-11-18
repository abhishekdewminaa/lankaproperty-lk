import { useState, useMemo, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { SRI_LANKA_DISTRICTS } from '../data/locations';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from '../components/PropertyCard';
import { SeoHead } from '../components/SeoHead';

interface DistrictDetailPageProps {
  districtSlug: string;
}

export function DistrictDetailPage({ districtSlug }: DistrictDetailPageProps) {
  const { navigate } = useRouter();
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    propertyService.syncWithSupabase(false);
    const unsub = propertyService.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

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

  const districtProperties = useMemo(() => {
    if (!districtData) return [];
    const allAuthoritative = propertyService.getAllAuthoritativeProperties();
    return allAuthoritative.filter((p) => {
      if (p.publicationStatus !== 'published') return false;
      const matchDistrict =
        p.location.district.toLowerCase() === districtData.district.toLowerCase();
      if (!matchDistrict) return false;

      if (
        selectedCity !== 'all' &&
        !p.location.city.toLowerCase().includes(selectedCity.toLowerCase())
      ) {
        return false;
      }
      if (propertyTypeFilter !== 'all') {
        if (propertyTypeFilter === 'business') {
          if (p.type !== 'business' && p.type !== 'commercial') return false;
        } else if (p.type !== propertyTypeFilter) {
          return false;
        }
      }
      return true;
    });
  }, [districtData, storeVersion, selectedCity, propertyTypeFilter]);

  if (!districtData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-lg mx-auto">
        <span className="text-xs uppercase font-bold tracking-wider text-[#C93636]">
          District Not Found
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
          The requested district page does not exist.
        </h1>
        <p className="text-sm text-[#5F6B63]">
          Browse all 25 Sri Lankan districts on the homepage.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] hover:bg-[#176B45] cursor-pointer"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  const canonicalUrl = `/districts/${districtSlug}`;

  return (
    <div className="bg-white min-h-screen pb-20">
      <SeoHead
        title={`Properties for Sale & Rent in ${districtData.district} District (${districtData.province}), Sri Lanka | LankaProperty.lk`}
        description={`Browse land, houses, apartments, hotels, and business properties in ${districtData.district} District, Sri Lanka.`}
        canonicalPath={canonicalUrl}
        geoPlacename={`${districtData.district}, Sri Lanka`}
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
            <span className="text-[#103D2C] font-bold">{districtData.district} District</span>
          </nav>

          <button
            onClick={() => navigate('/properties')}
            className="hidden sm:inline-block font-bold text-[#103D2C] hover:text-[#176B45] cursor-pointer text-xs"
          >
            All Properties
          </button>
        </div>
      </div>

      {/* Hero Regional Header */}
      <section className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-10 sm:py-14">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
                {districtData.province}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#103D2C] tracking-tight">
                {districtData.district} District Properties
              </h1>
              <p className="text-sm sm:text-base text-[#5F6B63] leading-relaxed">
                {districtData.character}
              </p>
            </div>

            <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-4 shrink-0 lg:text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#5F6B63] block">
                Active Listings
              </span>
              <span className="text-xl font-extrabold text-[#103D2C] tabular-nums block mt-0.5">
                {districtProperties.length} Properties
              </span>
            </div>
          </div>

          {/* City Filter Pills */}
          <div className="pt-4 border-t border-[#DDE5DF]">
            <span className="text-xs uppercase tracking-wider font-bold text-[#5F6B63] block mb-2.5">
              Filter by City or Town in {districtData.district}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-[3px] transition-colors cursor-pointer ${
                  selectedCity === 'all'
                    ? 'bg-[#103D2C] text-white'
                    : 'bg-white border border-[#DDE5DF] text-[#18251E] hover:border-[#103D2C]'
                }`}
              >
                All {districtData.district} ({districtProperties.length})
              </button>
              {districtData.cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer ${
                    selectedCity === city
                      ? 'bg-[#176B45] text-white font-bold'
                      : 'bg-white border border-[#DDE5DF] text-[#5F6B63] hover:text-[#18251E] hover:border-[#103D2C]'
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
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#18251E]">
              Properties in {selectedCity === 'all' ? districtData.district : selectedCity}
            </h2>
            <p className="text-xs text-[#5F6B63] mt-0.5">
              Showing {districtProperties.length} published listings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5F6B63]">Category:</span>
            <select
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:outline-none focus:border-[#103D2C]"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {districtProperties.map((p, idx) => (
              <PropertyCard key={p.id} property={p} priority={idx < 3} />
            ))}
          </div>
        ) : (
          <div className="bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] p-10 text-center space-y-3">
            <h3 className="font-bold text-[#18251E] text-lg">
              No properties currently listed in{' '}
              {selectedCity === 'all' ? districtData.district : selectedCity}
            </h3>
            <p className="text-xs text-[#5F6B63] max-w-md mx-auto">
              Publish a property in this area or post a buyer requirement.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/list-property')}
                className="px-5 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] hover:bg-[#176B45] cursor-pointer"
              >
                Post Property Free
              </button>
              <button
                onClick={() => navigate('/wanted-properties')}
                className="px-5 py-2.5 bg-white border border-[#DDE5DF] text-[#18251E] text-xs font-bold uppercase tracking-wider rounded-[3px] hover:border-[#103D2C] cursor-pointer"
              >
                Post Buyer Request
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
