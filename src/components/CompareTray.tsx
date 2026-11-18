import React from 'react';
import { useCompare } from '../context/CompareContext';
import { useCurrency } from '../context/CurrencyContext';

export const CompareTray: React.FC = () => {
  const { compareItems, removeFromCompare, clearCompare, isModalOpen, setIsModalOpen } =
    useCompare();
  const { formatPrice } = useCurrency();

  if (compareItems.length === 0) return null;

  return (
    <>
      <aside
        aria-label="Property comparison tray"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#103D2C] text-white px-5 py-3 rounded-[4px] shadow-2xl border border-[#176B45]/40 flex items-center gap-4 sm:gap-6 backdrop-blur-md max-w-[95vw]"
      >
        <span className="text-xs uppercase tracking-wider font-bold text-[#E8F3EC]">
          Compare ({compareItems.length}/3)
        </span>

        <div className="hidden sm:flex items-center gap-2">
          {compareItems.map((p) => (
            <div
              key={p.id}
              className="relative w-10 h-10 border border-[#176B45] overflow-hidden rounded-[2px] bg-black/40 group"
              title={p.title}
            >
              <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFromCompare(p.id)}
                className="absolute inset-0 bg-black/75 text-white text-[9px] font-bold uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={`Remove ${p.title} from comparison`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#176B45] hover:bg-[#115236] text-white rounded-[3px] transition-colors cursor-pointer"
          >
            Compare Now
          </button>
          <button
            type="button"
            onClick={clearCompare}
            className="px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </aside>

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-[4px] border border-[#DDE5DF] shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-4 mb-6">
              <div>
                <h2 id="compare-modal-title" className="text-xl sm:text-2xl font-bold text-[#103D2C]">
                  Compare Properties
                </h2>
                <p className="text-xs sm:text-sm text-[#5F6B63] mt-1">
                  Side-by-side comparison of specifications, location, and pricing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5F6B63] hover:text-[#103D2C] rounded-[3px] border border-[#DDE5DF] hover:border-[#103D2C] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {compareItems.map((property) => (
                <article
                  key={property.id}
                  className="border border-[#DDE5DF] rounded-[4px] p-4 flex flex-col justify-between bg-[#FAFBF9]"
                >
                  <div>
                    <div className="relative aspect-16/10 overflow-hidden rounded-[3px] mb-3">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCompare(property.id)}
                        className="absolute top-2 right-2 bg-white/95 hover:bg-white text-[#103D2C] px-2 py-0.5 text-[10px] font-bold uppercase rounded-[2px] shadow-xs cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-[#E8F3EC] text-[#176B45] rounded-[2px]">
                      {property.type} · {property.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                    </span>
                    <h3 className="font-bold text-base text-[#103D2C] mt-2 line-clamp-2">
                      {property.title}
                    </h3>
                    <p className="text-xs text-[#5F6B63] mt-1">
                      {property.location.city}, {property.location.district}
                    </p>

                    <div className="mt-4 pt-3 border-t border-[#DDE5DF]">
                      <div className="text-xs text-[#5F6B63]">Price</div>
                      <div className="text-lg font-extrabold text-[#103D2C] tabular-nums mt-0.5">
                        {property.priceLkr > 0 ? formatPrice(property.priceLkr) : 'Price on Request'}
                      </div>
                    </div>

                    <dl className="mt-4 space-y-2 text-xs border-t border-[#DDE5DF] pt-3">
                      <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                        <dt className="text-[#5F6B63]">Bedrooms</dt>
                        <dd className="font-semibold text-[#18251E] tabular-nums">
                          {property.specs.bedrooms ?? '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                        <dt className="text-[#5F6B63]">Bathrooms</dt>
                        <dd className="font-semibold text-[#18251E] tabular-nums">
                          {property.specs.bathrooms ?? '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                        <dt className="text-[#5F6B63]">Floor Area</dt>
                        <dd className="font-semibold text-[#18251E] tabular-nums">
                          {property.specs.floorAreaSqFt
                            ? `${property.specs.floorAreaSqFt.toLocaleString()} sq ft`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                        <dt className="text-[#5F6B63]">Land Area</dt>
                        <dd className="font-semibold text-[#18251E] tabular-nums">
                          {property.specs.landPerches
                            ? `${property.specs.landPerches} Perches`
                            : property.specs.landAcres
                            ? `${property.specs.landAcres} Acres`
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-6">
                    <a
                      href={`/properties/${property.slug}`}
                      className="block w-full text-center py-2.5 px-4 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors"
                      onClick={() => setIsModalOpen(false)}
                    >
                      View Property
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
