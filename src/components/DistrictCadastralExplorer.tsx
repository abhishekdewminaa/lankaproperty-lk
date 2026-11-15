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

  // Active province filter ('all' or specific province)
  const [activeProvince, setActiveProvince] = useState<string>('all');

  // Currently selected district
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>(initialDistrict);

  // Synchronize when initialDistrict prop changes
  React.useEffect(() => {
    if (initialDistrict) {
      setSelectedDistrictName(initialDistrict);
    }
  }, [initialDistrict]);

  // Filtered districts list based on province tab
  const filteredDistricts = useMemo(() => {
    if (activeProvince === 'all') return SRI_LANKA_DISTRICTS;
    return SRI_LANKA_DISTRICTS.filter(
      (d) => d.province.toLowerCase() === activeProvince.toLowerCase()
    );
  }, [activeProvince]);

  // Selected district detailed metadata
  const selectedDistrict: DistrictLocation = useMemo(() => {
    return (
      getDistrictInfo(selectedDistrictName) ||
      SRI_LANKA_DISTRICTS[0]
    );
  }, [selectedDistrictName]);

  // Live properties matching the selected district
  const districtProperties = useMemo(() => {
    const all = propertyService.getPublicEligibleProperties();
    return all.filter(
      (p) =>
        p.location.district.toLowerCase() === selectedDistrict.district.toLowerCase() ||
        (selectedDistrict.cities &&
          selectedDistrict.cities.some((c) =>
            p.location.city.toLowerCase().includes(c.toLowerCase())
          ))
    );
  }, [selectedDistrict]);

  const handleDistrictClick = (districtName: string) => {
    setSelectedDistrictName(districtName);
    if (onSelectDistrict) {
      onSelectDistrict(districtName);
    }
  };

  const handleCityClick = (cityName: string) => {
    navigate(
      `/properties?district=${encodeURIComponent(selectedDistrict.district)}&city=${encodeURIComponent(
        cityName
      )}`
    );
  };

  return (
    <section id="district-cadastral-explorer" className="bg-[#FAFBF9] py-16 sm:py-24 border-b border-[#DDE5DF]">
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#176B45] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-[1px] bg-[#176B45]" />
            <span>Sri Lanka 25 Administrative Districts · Regional Cadastre</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#18251E] tracking-tight mb-4">
            Regional Cadastral Directory & Major Cities
          </h2>
          <p className="text-sm sm:text-base text-[#5F6B63] leading-relaxed">
            Select any of Sri Lanka&apos;s 25 administrative districts across 9 provinces to inspect surveyed municipal enclaves, land tenure benchmarks, and verified freehold properties.
          </p>
        </div>

        {/* 1. Provincial Filter Switcher */}
        <div className="mb-6 overflow-x-auto pb-2 border-b border-[#DDE5DF]/80">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveProvince('all')}
              className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                activeProvince === 'all'
                  ? 'bg-[#103D2C] text-white shadow-xs'
                  : 'bg-white text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F0F4F1] border border-[#DDE5DF]'
              }`}
            >
              All 25 Districts
            </button>
            {PROVINCES_OF_SRI_LANKA.map((prov) => {
              const count = SRI_LANKA_DISTRICTS.filter((d) => d.province === prov).length;
              const shortName = prov.replace(' Province', '');
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setActiveProvince(prov)}
                  className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeProvince === prov
                      ? 'bg-[#103D2C] text-white shadow-xs'
                      : 'bg-white text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F0F4F1] border border-[#DDE5DF]'
                  }`}
                >
                  <span>{shortName}</span>
                  <span className={`text-[10px] tabular-nums font-extrabold px-1 py-0.2 rounded-[1px] ${
                    activeProvince === prov ? 'bg-[#176B45] text-white' : 'bg-[#EAEAEA] text-[#777777]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Districts Horizontal Grid / Badges */}
        <div className="mb-10">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#5F6B63] mb-3">
            SELECT A DISTRICT TO REVEAL MAJOR CITIES & CADASTRAL INTELLIGENCE:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {filteredDistricts.map((d) => {
              const isSelected = selectedDistrict.district.toLowerCase() === d.district.toLowerCase();
              return (
                <button
                  key={d.district}
                  type="button"
                  onClick={() => handleDistrictClick(d.district)}
                  className={`p-3 text-left rounded-[3px] border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#103D2C] text-white border-[#103D2C] shadow-md ring-2 ring-[#176B45]/30'
                      : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#176B45]/60 hover:bg-[#F5F8F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-extrabold ${isSelected ? 'text-white' : 'text-[#18251E]'}`}>
                      {d.district}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-[1px] ${
                        isSelected ? 'bg-[#9FE3B8]' : 'bg-[#DDE5DF]'
                      }`}
                    />
                  </div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-[#C5DEC8]' : 'text-[#7A867E]'}`}>
                    {d.province.replace(' Province', '')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DYNAMIC MAJOR CITIES & CADASTRAL DOSSIER FOR CHOSEN DISTRICT */}
        <div className="bg-white rounded-[4px] border border-[#DDE5DF] shadow-[0_12px_32px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Dossier Header Banner */}
          <div className="bg-[#103D2C] text-white p-6 sm:p-8 border-b border-[#0A261B]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-extrabold uppercase tracking-wider text-[#9FE3B8]">
                  <span>{selectedDistrict.province}</span>
                  <span>·</span>
                  <span>{selectedDistrict.cities.length} Municipal Enclaves</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                  {selectedDistrict.district} District Cadastral Dossier
                </h3>
                <p className="text-sm text-neutral-200 max-w-2xl leading-relaxed">
                  {selectedDistrict.character}
                </p>
              </div>

              {/* Cadastral Key Performance Metrics */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-[3px] border border-white/15 min-w-[150px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-300">
                    Land Benchmark
                  </div>
                  <div className="text-sm font-black text-white mt-0.5 tabular-nums">
                    {selectedDistrict.landBenchmark}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-[3px] border border-white/15 min-w-[150px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-300">
                    Tenure Status
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    100% Freehold Deeds
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/properties?district=${encodeURIComponent(selectedDistrict.district)}`)
                  }
                  className="w-full sm:w-auto px-5 py-3.5 bg-white text-[#103D2C] hover:bg-[#E8F3EC] font-extrabold text-xs uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center whitespace-nowrap shadow-xs"
                >
                  All {selectedDistrict.district} Listings →
                </button>
              </div>
            </div>
          </div>

          {/* Dossier Body: Major Cities Showcase */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#DDE5DF]">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-[#18251E]">
                  Major Cities & Prime Micro-Markets in {selectedDistrict.district}
                </h4>
                <p className="text-xs text-[#5F6B63] mt-0.5">
                  Click any city to explore active listings, land parcels, and investment deeds.
                </p>
              </div>
              <span className="text-xs font-bold text-[#176B45] tabular-nums">
                {selectedDistrict.cities.length} Cities Registered
              </span>
            </div>

            {/* Major Cities Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {selectedDistrict.cityDetails && selectedDistrict.cityDetails.length > 0 ? (
                selectedDistrict.cityDetails.map((city) => (
                  <div
                    key={city.name}
                    className="p-4 bg-[#F8FAF8] rounded-[3px] border border-[#DDE5DF] hover:border-[#176B45]/70 hover:bg-white transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-[#18251E] group-hover:text-[#103D2C] transition-colors">
                          {city.name}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[#176B45]/40 group-hover:bg-[#176B45]" />
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#176B45] mb-2">
                        {city.tag}
                      </div>
                      {city.description && (
                        <p className="text-xs text-[#5F6B63] leading-relaxed line-clamp-2">
                          {city.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCityClick(city.name)}
                      className="mt-4 pt-3 border-t border-[#DDE5DF]/60 text-xs font-black text-[#103D2C] hover:text-[#176B45] flex items-center justify-between cursor-pointer"
                    >
                      <span>Explore City Listings</span>
                      <span>→</span>
                    </button>
                  </div>
                ))
              ) : (
                selectedDistrict.cities.map((cityName) => (
                  <div
                    key={cityName}
                    className="p-4 bg-[#F8FAF8] rounded-[3px] border border-[#DDE5DF] hover:border-[#176B45]/70 hover:bg-white transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-[#18251E] group-hover:text-[#103D2C] transition-colors">
                          {cityName}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[#176B45]/40 group-hover:bg-[#176B45]" />
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#176B45] mb-2">
                        {selectedDistrict.district} Administrative Enclave
                      </div>
                      <p className="text-xs text-[#5F6B63] leading-relaxed">
                        Surveyed urban municipal and residential plots registered under {selectedDistrict.district} title registry.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCityClick(cityName)}
                      className="mt-4 pt-3 border-t border-[#DDE5DF]/60 text-xs font-black text-[#103D2C] hover:text-[#176B45] flex items-center justify-between cursor-pointer"
                    >
                      <span>Explore {cityName}</span>
                      <span>→</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* District Properties Preview or Private Office Brokerage Alert */}
            <div className="pt-6 border-t border-[#DDE5DF]">
              <div className="flex items-center justify-between mb-5">
                <div className="text-xs font-black uppercase tracking-wider text-[#18251E] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-[1px] bg-[#103D2C]" />
                  <span>
                    Current Indexed Listings in {selectedDistrict.district} ({districtProperties.length})
                  </span>
                </div>
                {districtProperties.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/properties?district=${encodeURIComponent(selectedDistrict.district)}`)
                    }
                    className="text-xs font-extrabold text-[#176B45] hover:text-[#103D2C] cursor-pointer"
                  >
                    View All {districtProperties.length} Properties in {selectedDistrict.district} →
                  </button>
                )}
              </div>

              {districtProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {districtProperties.slice(0, 3).map((prop) => (
                    <PropertyCard key={prop.id} property={prop} />
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#F5F8F5] rounded-[3px] border border-[#DDE5DF] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-[#18251E] mb-1">
                      Private Office Cadastral Registry for {selectedDistrict.district}
                    </h5>
                    <p className="text-xs text-[#5F6B63] max-w-2xl leading-relaxed">
                      While public marketplace inventory for {selectedDistrict.district} is undergoing title authentication, private deeds, agricultural tea acreages, and high-yield coastal parcels are available via confidential broker mandate.
                    </p>
                  </div>
                  <a
                    href="#private-office"
                    className="px-5 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white font-extrabold text-xs uppercase tracking-wider rounded-[2px] transition-colors text-center whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    Request {selectedDistrict.district} Dossier →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
