import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from '../components/PropertyCard';
import { formatPriceLkr } from '../utils/formatters';

export function SavedPage() {
  const { navigate } = useRouter();
  const {
    savedIds,
    savedCount,
    compareIds,
    compareCount,
    toggleCompare,
    clearCompare,
    toggleSave,
  } = useSavedProperties();

  const [storeTick, setStoreTick] = useState(0);
  useEffect(() => {
    return propertyService.subscribe(() => setStoreTick((t) => t + 1));
  }, []);

  const allAuthoritative = propertyService.getAllAuthoritativeProperties();

  const savedProperties = useMemo(() => {
    return allAuthoritative.filter((p) => savedIds.includes(p.id));
  }, [savedIds, allAuthoritative, storeTick]);

  const comparedProperties = useMemo(() => {
    return allAuthoritative.filter((p) => compareIds.includes(p.id));
  }, [compareIds, allAuthoritative, storeTick]);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-8 sm:py-12">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-2xl space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
              Shortlisted Properties
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#103D2C] tracking-tight">
              Saved & Compared Properties
            </h1>
            <p className="text-sm text-[#5F6B63]">
              Review your saved properties and compare specifications side by side.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-8 space-y-14">
        {/* SECTION 1: COMPARISON TABLE */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#18251E]">
                Property Comparison ({compareCount} of 3)
              </h2>
              <span className="text-xs text-[#5F6B63]">
                Select up to 3 properties to compare side by side
              </span>
            </div>

            {compareCount > 0 && (
              <button
                onClick={clearCompare}
                className="text-xs font-bold text-[#C93636] hover:underline uppercase tracking-wider cursor-pointer"
              >
                Clear Comparison
              </button>
            )}
          </div>

          {comparedProperties.length > 0 ? (
            <div className="overflow-x-auto border border-[#DDE5DF] rounded-[4px]">
              <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FAFBF9] border-b border-[#DDE5DF]">
                    <th className="p-4 w-48 text-xs uppercase font-bold text-[#5F6B63] tracking-wider">
                      Specification
                    </th>
                    {comparedProperties.map((p) => (
                      <th key={p.id} className="p-4 w-72 align-top">
                        <div className="space-y-2">
                          <div className="aspect-16/10 rounded-[3px] overflow-hidden bg-neutral-200">
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-bold text-base text-[#18251E] line-clamp-1">
                            {p.title}
                          </h3>
                          <p className="text-xs font-semibold text-[#5F6B63]">
                            {p.location.city}, {p.location.district}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => navigate(`/properties/${p.slug}`)}
                              className="text-xs font-bold text-[#176B45] hover:underline cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => toggleCompare(p.id)}
                              className="text-xs font-semibold text-[#C93636] hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF]">
                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#FAFBF9]">
                      Price
                    </td>
                    {comparedProperties.map((p) => (
                      <td
                        key={p.id}
                        className="p-4 font-extrabold text-base text-[#103D2C] tabular-nums"
                      >
                        {formatPriceLkr(p.priceLkr, p.priceUnit)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#FAFBF9]">
                      Category
                    </td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4 capitalize font-semibold">
                        {p.type} ({p.purpose === 'rent' ? 'For Rent' : 'For Sale'})
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#FAFBF9]">
                      Bedrooms
                    </td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        {p.specs.bedrooms !== undefined ? `${p.specs.bedrooms} Beds` : '—'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#FAFBF9]">
                      Bathrooms
                    </td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        {p.specs.bathrooms !== undefined ? `${p.specs.bathrooms} Baths` : '—'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#FAFBF9]">
                      Floor Area
                    </td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4 font-semibold">
                        {p.specs.floorAreaSqFt !== undefined
                          ? `${p.specs.floorAreaSqFt.toLocaleString()} sq ft`
                          : '—'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#FAFBF9]">
                      Land Area
                    </td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        {p.specs.landPerches !== undefined
                          ? `${p.specs.landPerches} Perches`
                          : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] space-y-2">
              <p className="text-sm font-bold text-[#18251E]">
                No properties selected for comparison
              </p>
              <p className="text-xs text-[#5F6B63] max-w-md mx-auto">
                Click the Compare button on any property card or detail page to compare up to 3 properties side by side.
              </p>
            </div>
          )}
        </section>

        {/* SECTION 2: SAVED PROPERTIES LIST */}
        <section className="space-y-6 pt-6 border-t border-[#DDE5DF]">
          <div className="flex items-center justify-between pb-4 border-b border-[#DDE5DF]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#18251E]">
                Saved Properties ({savedCount})
              </h2>
              <span className="text-xs text-[#5F6B63]">
                Properties bookmarked in your browser
              </span>
            </div>

            <button
              onClick={() => navigate('/properties')}
              className="text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#103D2C] cursor-pointer"
            >
              Browse All Properties
            </button>
          </div>

          {savedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((property) => (
                <div key={property.id} className="relative group">
                  <PropertyCard property={property} />
                  <div className="mt-2 flex items-center justify-between px-1 text-xs">
                    <button
                      onClick={() => toggleCompare(property.id)}
                      className="font-bold text-[#176B45] hover:underline cursor-pointer"
                    >
                      {compareIds.includes(property.id) ? 'Remove from Compare' : 'Add to Compare'}
                    </button>
                    <button
                      onClick={() => toggleSave(property.id)}
                      className="font-semibold text-[#C93636] hover:underline cursor-pointer"
                    >
                      Remove Saved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#18251E]">
                  You have no saved properties yet
                </h3>
                <p className="text-xs text-[#5F6B63] max-w-sm mx-auto">
                  Click the Save button on any property card to bookmark it here for quick access.
                </p>
              </div>
              <button
                onClick={() => navigate('/properties')}
                className="px-6 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                Browse Properties
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
