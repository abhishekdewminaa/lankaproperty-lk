import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { propertyService } from '../services/propertyService';
import { PropertyCard } from '../components/PropertyCard';
import { formatPriceLkr } from '../utils/formatters';
import {
  Bookmark,
  GitCompare,
  Trash2,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Check,
} from 'lucide-react';

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

  // Saved properties instances from authoritative store
  const savedProperties = useMemo(() => {
    return allAuthoritative.filter((p) => savedIds.includes(p.id));
  }, [savedIds, allAuthoritative, storeTick]);

  // Compared properties instances from authoritative store
  const comparedProperties = useMemo(() => {
    return allAuthoritative.filter((p) => compareIds.includes(p.id));
  }, [compareIds, allAuthoritative, storeTick]);

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-[#F5F8F5] border-b border-[#DDE5DF] py-10 sm:py-12">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#18251E] tracking-tight">
              Your Curated Portfolio
            </h1>
            <p className="text-sm text-[#5F6B63]">
              Review your saved architectural properties and perform side-by-side spec comparison of up to 3 listings.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 pt-10 space-y-16">
        {/* SECTION 1: COMPARISON TABLE (Up to 3 properties) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#E8F3EC] text-[#176B45] rounded-[2px] flex items-center justify-center">
                <GitCompare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#18251E]">Property Comparison Matrix</h2>
                <span className="text-xs text-[#5F6B63] tabular-nums">
                  {compareCount} of 3 maximum properties selected
                </span>
              </div>
            </div>

            {compareCount > 0 && (
              <button
                onClick={clearCompare}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C93636] hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Comparison</span>
              </button>
            )}
          </div>

          {comparedProperties.length > 0 ? (
            /* Horizontal Scroll Containment for Comparison Table */
            <div className="overflow-x-auto border border-[#DDE5DF] rounded-[3px] shadow-2xs">
              <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F5F8F5] border-b border-[#DDE5DF]">
                    <th className="p-4 w-48 text-xs uppercase font-extrabold text-[#5F6B63] tracking-wider">
                      Specification
                    </th>
                    {comparedProperties.map((p) => (
                      <th key={p.id} className="p-4 w-72 align-top">
                        <div className="space-y-2">
                          <div className="aspect-16/10 rounded-[2px] overflow-hidden bg-neutral-200">
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="font-bold text-base text-[#18251E] line-clamp-1">{p.title}</h3>
                          <p className="text-xs font-semibold text-[#5F6B63]">{p.location.city}, {p.location.district}</p>
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => navigate(`/properties/${p.slug}`)}
                              className="text-xs font-bold text-[#176B45] hover:underline flex items-center gap-1"
                            >
                              <span>View Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => toggleCompare(p.id)}
                              className="text-xs text-[#C93636] hover:underline"
                              aria-label={`Remove ${p.title} from comparison`}
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
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Pricing & Unit</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4 font-extrabold text-base text-[#103D2C] tabular-nums">
                        {formatPriceLkr(p.priceLkr, p.priceUnit)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Property Type</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4 capitalize font-semibold">
                        {p.type} ({p.purpose})
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Bedrooms</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        {p.specs.bedrooms !== undefined ? `${p.specs.bedrooms} Suites` : 'Not provided'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Bathrooms</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        {p.specs.bathrooms !== undefined ? `${p.specs.bathrooms} Baths` : 'Not provided'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Floor Area</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4 font-semibold">
                        {p.specs.floorAreaSqFt !== undefined ? `${p.specs.floorAreaSqFt} sq ft` : 'Not provided'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Land Extent</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        {p.specs.landPerches !== undefined ? `${p.specs.landPerches} perches` : 'Not provided'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Furnishing</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        {p.specs.furnishing || 'Not provided'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-xs uppercase text-[#5F6B63] bg-[#F5F8F5]">Status</td>
                    {comparedProperties.map((p) => (
                      <td key={p.id} className="p-4">
                        <span className="capitalize font-bold text-[#176B45]">
                          {p.status}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] space-y-2">
              <p className="text-sm font-semibold text-[#18251E]">No properties selected for comparison yet</p>
              <p className="text-xs text-[#5F6B63] max-w-md mx-auto">
                Click the "Compare" button on any listing details page or select from your saved listings below to compare up to 3 properties side by side.
              </p>
            </div>
          )}
        </section>

        {/* SECTION 2: SAVED PROPERTIES LIST */}
        <section className="space-y-6 pt-6 border-t border-[#DDE5DF]">
          <div className="flex items-center justify-between pb-4 border-b border-[#DDE5DF]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#E8F3EC] text-[#176B45] rounded-[2px] flex items-center justify-center">
                <Bookmark className="w-4 h-4 fill-[#176B45]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#18251E]">Saved Properties Registry</h2>
                <span className="text-xs text-[#5F6B63] tabular-nums">
                  {savedCount} items stored in your local session
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/properties')}
              className="text-xs font-bold text-[#176B45] hover:underline flex items-center gap-1"
            >
              <span>Browse More Properties</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
                      className="font-bold text-[#176B45] hover:underline flex items-center gap-1"
                    >
                      <GitCompare className="w-3 h-3" />
                      <span>{compareIds.includes(property.id) ? 'Remove Compare' : 'Add to Compare'}</span>
                    </button>
                    <button
                      onClick={() => toggleSave(property.id)}
                      className="text-[#C93636] hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] space-y-4">
              <Bookmark className="w-8 h-8 text-[#5F6B63] mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#18251E]">You have no saved properties yet</h3>
                <p className="text-xs text-[#5F6B63] max-w-sm mx-auto">
                  When browsing homes and land on LankaProperty.lk, tap the bookmark icon on any card to save it for quick review.
                </p>
              </div>
              <button
                onClick={() => navigate('/properties')}
                className="px-6 py-2.5 bg-[#176B45] hover:bg-[#115236] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors"
              >
                Browse Marketplace Listings
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
