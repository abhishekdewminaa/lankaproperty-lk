import React, { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from '../hooks/useRouter';
import { SRI_LANKA_DISTRICTS, getCitiesForDistrict } from '../data/locations';

interface SearchPanelProps {
  initialPurpose?: string;
  className?: string;
}

export function SearchPanel({ initialPurpose = 'buy', className = '' }: SearchPanelProps) {
  const { navigate } = useRouter();

  const [purpose, setPurpose] = useState<string>(initialPurpose);
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Extended filters
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [furnishing, setFurnishing] = useState('');

  const isLandSearch = propertyType === 'land';

  const handlePurposeChange = (newTab: 'buy' | 'rent' | 'land') => {
    if (newTab === 'land') {
      setPurpose('buy');
      setPropertyType('land');
    } else {
      setPurpose(newTab);
      if (propertyType === 'land') {
        setPropertyType('all');
      }
    }
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setCity(''); // Clear incompatible city when district changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (purpose && purpose !== 'all') params.set('purpose', purpose);
    if (district) params.set('district', district);
    if (city) params.set('city', city);
    if (propertyType && propertyType !== 'all') params.set('type', propertyType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    if (!isLandSearch) {
      if (bedrooms) params.set('bedrooms', bedrooms);
      if (bathrooms) params.set('bathrooms', bathrooms);
      if (furnishing) params.set('furnishing', furnishing);
    }
    if (minArea) params.set('minArea', minArea);

    navigate(`/properties?${params.toString()}`);
  };

  const getBudgetUnit = () => {
    if (purpose === 'rent') return 'LKR / mo';
    if (propertyType === 'land') return 'LKR / perch';
    return 'LKR total';
  };

  const availableCities = getCitiesForDistrict(district);

  return (
    <div className={`w-full max-w-5xl bg-white border border-[#DDE5DF] shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-[4px] p-5 sm:p-6 ${className}`}>
      {/* Purpose Tabs: Buy / Rent / Land */}
      <div className="flex items-center gap-1 border-b border-[#DDE5DF] pb-4 mb-5 overflow-x-auto">
        <button
          type="button"
          onClick={() => handlePurposeChange('buy')}
          className={`px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-[3px] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#176B45] ${
            purpose === 'buy' && propertyType !== 'land'
              ? 'bg-[#176B45] text-white'
              : 'text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5]'
          }`}
        >
          Buy Property
        </button>
        <button
          type="button"
          onClick={() => handlePurposeChange('rent')}
          className={`px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-[3px] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#176B45] ${
            purpose === 'rent'
              ? 'bg-[#176B45] text-white'
              : 'text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5]'
          }`}
        >
          Rent
        </button>
        <button
          type="button"
          onClick={() => handlePurposeChange('land')}
          className={`px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-[3px] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#176B45] ${
            propertyType === 'land'
              ? 'bg-[#176B45] text-white'
              : 'text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5]'
          }`}
        >
          Land Plots
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Main Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* District */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-district" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
              District
            </label>
            <select
              id="search-district"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none focus:ring-1 focus:ring-[#176B45]"
            >
              <option value="">All Sri Lanka</option>
              {SRI_LANKA_DISTRICTS.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district} ({d.province})
                </option>
              ))}
            </select>
          </div>

          {/* City / Town (Dynamic dependent) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-city" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
              City / Town
            </label>
            <select
              id="search-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!district}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none focus:ring-1 focus:ring-[#176B45] disabled:bg-[#F5F8F5] disabled:text-[#5F6B63]"
            >
              <option value="">{district ? 'All Cities' : 'Select District First'}</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Property Type */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-type" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
              Property Type
            </label>
            <select
              id="search-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none focus:ring-1 focus:ring-[#176B45]"
            >
              <option value="all">All Property Types</option>
              <option value="house">Houses & Villas</option>
              <option value="apartment">Apartments & Penthouses</option>
              <option value="commercial">Commercial</option>
              <option value="land">Residential & Beach Land</option>
            </select>
          </div>

          {/* Min Budget */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-min-price" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
              Min ({getBudgetUnit()})
            </label>
            <input
              id="search-min-price"
              type="number"
              placeholder={`Min ${getBudgetUnit()}`}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none focus:ring-1 focus:ring-[#176B45]"
            />
          </div>

          {/* Max Budget */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="search-max-price" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
              Max ({getBudgetUnit()})
            </label>
            <input
              id="search-max-price"
              type="number"
              placeholder={`Max ${getBudgetUnit()}`}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none focus:ring-1 focus:ring-[#176B45]"
            />
          </div>
        </div>

        {/* More Filters Toggle Bar & Search Submit */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#115236] transition-colors focus-visible:outline-2 focus-visible:outline-[#176B45]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showMoreFilters ? 'Hide Specifications' : 'More Specifications'}</span>
            {showMoreFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Primary Search Submit Button */}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#176B45] hover:bg-[#115236] text-white font-bold text-sm tracking-wide rounded-[3px] transition-colors shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B45]"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
            <span>Search Properties</span>
          </button>
        </div>

        {/* Expandable Specifications Area (Property-Type Aware) */}
        {showMoreFilters && (
          <div className="pt-4 border-t border-[#DDE5DF] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {!isLandSearch ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="search-bedrooms" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
                    Min Bedrooms
                  </label>
                  <select
                    id="search-bedrooms"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none"
                  >
                    <option value="">Any Bedrooms</option>
                    <option value="1">1+ Bedroom</option>
                    <option value="2">2+ Bedrooms</option>
                    <option value="3">3+ Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                    <option value="5">5+ Bedrooms</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="search-bathrooms" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
                    Min Bathrooms
                  </label>
                  <select
                    id="search-bathrooms"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none"
                  >
                    <option value="">Any Bathrooms</option>
                    <option value="1">1+ Bathroom</option>
                    <option value="2">2+ Bathrooms</option>
                    <option value="3">3+ Bathrooms</option>
                    <option value="4">4+ Bathrooms</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="search-furnishing" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
                    Furnishing
                  </label>
                  <select
                    id="search-furnishing"
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none"
                  >
                    <option value="">Any Status</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="sm:col-span-3 text-xs text-[#5F6B63] p-3 bg-[#F5F8F5] rounded-[3px] border border-[#DDE5DF]">
                <p className="font-bold text-[#103D2C]">Land Discovery Mode</p>
                <p className="mt-0.5">Showing perches-based pricing and extent. Bedroom, bathroom, and furnishing filters are cleanly omitted for land parcels.</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="search-min-area" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
                {isLandSearch ? 'Min Land (Perches)' : 'Min Area (Sq Ft)'}
              </label>
              <input
                id="search-min-area"
                type="number"
                placeholder={isLandSearch ? 'e.g. 15 perches' : 'e.g. 2000 sq ft'}
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#DDE5DF] rounded-[3px] text-[#18251E] focus:border-[#176B45] focus:outline-none"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
