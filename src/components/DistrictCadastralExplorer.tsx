import React, { useState, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import {
  SRI_LANKA_DISTRICTS,
  PROVINCES_OF_SRI_LANKA,
  DistrictLocation,
  getDistrictInfo,
} from '../data/locations';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from './PropertyCard';

interface DistrictCadastralExplorerProps {
  initialDistrict?: string;
  onSelectDistrict?: (district: string) => void;
}

export function DistrictCadastralExplorer({
  initialDistrict = 'Colombo',
  onSelectDistrict,
}: DistrictCadastralExplorerProps) {
  const { navigate } = useRouter();

  const [activeProvince, setActiveProvince] = useState<string>('all');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(initialDistrict);

  React.useEffect(() => {
    if (initialDistrict) {
      setSelectedDistrictName(initialDistrict);
    }
  }, [initialDistrict]);

  const filteredDistricts = useMemo(() => {
    if (activeProvince === 'all') return SRI_LANKA_DISTRICTS;
    return SRI_LANKA_DISTRICTS.filter(
      (d) => d.province.toLowerCase() === activeProvince.toLowerCase()
    );
  }, [activeProvince]);

  const selectedDistrict: DistrictLocation = useMemo(() => {
    return getDistrictInfo(selectedDistrictName) || SRI_LANKA_DISTRICTS[0];
  }, [selectedDistrictName]);

  const districtProperties = useMemo(() => {
    const allProps = propertyService.getPublicEligibleProperties();
    return allProps.filter(
      (p) => p.location.district.toLowerCase() === selectedDistrict.district.toLowerCase()
    );
  }, [selectedDistrict]);

  const handleDistrictClick = (districtName: string) => {
    setSelectedDistrictName(districtName);
    if (onSelectDistrict) {
      onSelectDistrict(districtName);
    }
  };

  const handleCityClick = (cityName: string) => {
    const params = new URLSearchParams();
    params.set('district', selectedDistrict.district);
    params.set('city', cityName);
    navigate(`/properties?${params.toString()}`);
  };

  const handleExploreAllDistrict = () => {
    const slug = selectedDistrict.district.toLowerCase().replace(/\s+/g, '-');
    navigate(`/districts/${slug}`);
  };

  return (
    <section
      id="district-directory"
      className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-14 sm:py-20"
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#DDE5DF]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
              All 25 Districts & Major Towns
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#103D2C] mt-1 tracking-tight">
              Browse Properties by District
            </h2>
          </div>
          <p className="text-sm text-[#5F6B63] max-w-xl leading-relaxed">
            Select a province and district to explore land, houses, apartments, hotels, and business properties across Sri Lanka.
          </p>
        </div>

        {/* Province Filter Tabs */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
              Filter by Province
            </span>
            <span className="text-xs text-[#5F6B63] font-semibold">
              Showing {filteredDistricts.length} of 25 Districts
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveProvince('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer ${
                activeProvince === 'all'
                  ? 'bg-[#103D2C] text-white border-[#103D2C]'
                  : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
              }`}
            >
              All 9 Provinces (25)
            </button>

            {PROVINCES_OF_SRI_LANKA.map((prov) => {
              const isSelected = activeProvince.toLowerCase() === prov.toLowerCase();
              const count = SRI_LANKA_DISTRICTS.filter(
                (d) => d.province.toLowerCase() === prov.toLowerCase()
              ).length;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setActiveProvince(prov)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-[3px] border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#176B45] text-white border-[#176B45]'
                      : 'bg-white text-[#5F6B63] border-[#DDE5DF] hover:border-[#103D2C] hover:text-[#18251E]'
                  }`}
                >
                  {prov.replace(' Province', '')} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* District Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {filteredDistricts.map((dist) => {
            const isSelected =
              dist.district.toLowerCase() === selectedDistrict.district.toLowerCase();

            return (
              <button
                key={dist.district}
                type="button"
                onClick={() => handleDistrictClick(dist.district)}
                className={`p-3.5 rounded-[4px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#103D2C] text-white border-[#103D2C] shadow-sm'
                    : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isSelected ? 'text-[#9FE3B8]' : 'text-[#5F6B63]'
                    }`}
                  >
                    {dist.province.replace(' Province', '')}
                  </span>
                  <div className="text-sm font-bold mt-0.5 truncate">{dist.district}</div>
                </div>

                <div
                  className={`mt-2.5 pt-2 border-t text-[11px] flex items-center justify-between ${
                    isSelected
                      ? 'border-white/15 text-[#E8F3EC]'
                      : 'border-[#DDE5DF]/60 text-[#5F6B63]'
                  }`}
                >
                  <span>{dist.cities.length} Towns</span>
                  <span className="font-bold">Select</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected District Detail Panel */}
        <div className="bg-white border border-[#DDE5DF] rounded-[4px] overflow-hidden shadow-xs">
          {/* Top District Summary Banner */}
          <div className="bg-[#103D2C] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px]">
                  {selectedDistrict.province}
                </span>
                <span className="text-xs text-[#9FE3B8] font-semibold">
                  {selectedDistrict.cities.length} Major Cities & Towns
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {selectedDistrict.district} District Properties
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {selectedDistrict.headline ||
                  `Browse residential houses, apartments, commercial buildings, and land plots in ${selectedDistrict.district} District.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleExploreAllDistrict}
                className="px-4 py-2.5 bg-white text-[#103D2C] hover:bg-[#E8F3EC] font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                District Guide
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(`/properties?district=${encodeURIComponent(selectedDistrict.district)}`)
                }
                className="px-4 py-2.5 bg-[#176B45] hover:bg-[#115236] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                View All in {selectedDistrict.district} ({districtProperties.length})
              </button>
            </div>
          </div>

          {/* Cities & District Listings Preview */}
          <div className="p-6 sm:p-8 space-y-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6B63] mb-4">
                Popular Cities & Towns in {selectedDistrict.district}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {selectedDistrict.cities.map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => handleCityClick(cityName)}
                    className="px-3.5 py-2.5 bg-[#FAFBF9] hover:bg-[#E8F3EC] border border-[#DDE5DF] hover:border-[#103D2C] rounded-[3px] text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#18251E] block truncate">
                      {cityName}
                    </span>
                    <span className="text-[10px] text-[#5F6B63] block mt-0.5">
                      View Listings
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* District Properties Preview */}
            {districtProperties.length > 0 && (
              <div className="pt-6 border-t border-[#DDE5DF]">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-bold text-[#18251E]">
                    Available Listings in {selectedDistrict.district} ({districtProperties.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/properties?district=${encodeURIComponent(selectedDistrict.district)}`)
                    }
                    className="text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#103D2C] cursor-pointer"
                  >
                    See All {districtProperties.length} Listings
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {districtProperties.slice(0, 3).map((prop) => (
                    <PropertyCard key={prop.id} property={prop} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
