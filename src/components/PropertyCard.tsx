import { useState } from 'react';
import { Property } from '../types/property';
import { useRouter } from '../hooks/useRouter';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { useCurrency } from '../context/CurrencyContext';
import { useCompare } from '../context/CompareContext';

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
}

export function PropertyCard({ property, priority = false }: PropertyCardProps) {
  const { navigate } = useRouter();
  const { isSaved, toggleSave } = useSavedProperties();
  const { formatPrice, currency } = useCurrency();
  const { isInCompare, addToCompare } = useCompare();

  const saved = isSaved(property.id);
  const compared = isInCompare(property.id);
  const [imageError, setImageError] = useState(false);

  const getPurposeLabel = (purpose: string, type: string) => {
    if (purpose === 'land' || type === 'land') return 'Land';
    if (purpose === 'rent') return 'For Rent';
    if (type === 'commercial') return 'Commercial';
    return 'For Sale';
  };

  const getTenureLabel = (type: string) => {
    if (type === 'apartment') return 'Condominium Deed';
    return 'Freehold Title';
  };

  const handleCardClick = () => {
    navigate(`/properties/${property.slug}`);
  };

  // Build clean, icon-free architectural spec items
  const specItems: { value: string; label: string }[] = [];
  if (property.type !== 'land' && property.specs.bedrooms !== undefined && property.specs.bedrooms > 0) {
    specItems.push({ value: String(property.specs.bedrooms), label: property.specs.bedrooms === 1 ? 'Bed' : 'Beds' });
  }
  if (property.type !== 'land' && property.specs.bathrooms !== undefined && property.specs.bathrooms > 0) {
    specItems.push({ value: String(property.specs.bathrooms), label: property.specs.bathrooms === 1 ? 'Bath' : 'Baths' });
  }
  if (property.specs.floorAreaSqFt !== undefined && property.specs.floorAreaSqFt > 0) {
    specItems.push({ value: property.specs.floorAreaSqFt.toLocaleString(), label: 'sq ft' });
  }
  if (property.specs.landPerches !== undefined && property.specs.landPerches > 0) {
    specItems.push({ value: String(property.specs.landPerches), label: 'Perches' });
  }

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col bg-white border border-[#DDE5DF] shadow-[0_8px_24px_rgba(16,61,44,0.08),0_2px_6px_rgba(0,0,0,0.04)] hover:border-[#103D2C] hover:shadow-[0_18px_40px_rgba(16,61,44,0.14),0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 rounded-[2px] overflow-hidden cursor-pointer"
    >
      {/* Pure, Unobstructed 16:10 Architectural Photography */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-[#F5F8F5]">
        {!imageError ? (
          <img
            src={
              property.images?.[0] ||
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
            }
            alt={property.title}
            loading={priority ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#F5F8F5] text-[#5F6B63]">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#103D2C]">
              {property.type.toUpperCase()} · {property.location.city}
            </span>
          </div>
        )}
      </div>

      {/* Editorial Information Panel */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4 bg-white">
        <div className="space-y-2">
          {/* Eyebrow Metadata Line (Moved off the photo for zero visual clutter) */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="text-[#5F6B63] truncate">
              {property.location.city}, {property.location.district} · {getPurposeLabel(property.purpose, property.type)} · {getTenureLabel(property.type)}
            </span>

            {(property.isFeatured || property.isTrending) && (
              <div className="flex items-center gap-2 shrink-0">
                {property.isFeatured && (
                  <span className="text-[#103D2C] font-extrabold">Featured</span>
                )}
                {property.isFeatured && property.isTrending && (
                  <span className="text-[#DDE5DF]">/</span>
                )}
                {property.isTrending && (
                  <span className="text-[#C93636] font-extrabold">Trending</span>
                )}
              </div>
            )}
          </div>

          {/* Property Headline */}
          <h3 className="text-[18px] sm:text-[19px] font-bold text-[#18251E] group-hover:text-[#103D2C] transition-colors duration-150 line-clamp-1 leading-snug tracking-tight">
            {property.title}
          </h3>

          {/* Clean Hairline-Separated Specification Strip (Zero Icons) */}
          {specItems.length > 0 && (
            <div className="flex items-center flex-wrap gap-y-1 pt-1 text-[12.5px] text-[#5F6B63]">
              {specItems.map((spec, idx) => (
                <span key={spec.label} className="flex items-center">
                  {idx > 0 && <span className="mx-2.5 text-[#DDE5DF]">|</span>}
                  <strong className="font-semibold text-[#18251E] tabular-nums mr-1">{spec.value}</strong>
                  <span>{spec.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Valuation & Text-Only Action Footer */}
        <div className="pt-3.5 border-t border-[#DDE5DF] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[18px] sm:text-[20px] font-extrabold text-[#103D2C] tabular-nums leading-none truncate">
              {property.priceLkr > 0 ? formatPrice(property.priceLkr, false) : 'Price on request'}
              {property.purpose === 'rent' && (
                <span className="text-xs text-[#5F6B63] font-normal ml-1">/ mo</span>
              )}
            </div>
            {currency !== 'LKR' && property.priceLkr > 0 && (
              <div className="text-[11px] text-[#5F6B63] tabular-nums mt-1">
                LKR {(property.priceLkr / 1000000).toFixed(1)}M
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCompare(property);
              }}
              aria-label={compared ? 'Remove from compare' : 'Add to compare'}
              className={`px-2.5 py-1 rounded-[2px] border transition-colors cursor-pointer ${
                compared
                  ? 'bg-[#103D2C] text-white border-[#103D2C]'
                  : 'bg-[#FAFBF9] text-[#5F6B63] border-[#DDE5DF] hover:border-[#103D2C] hover:text-[#103D2C]'
              }`}
            >
              {compared ? 'Comparing' : 'Compare'}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSave(property.id);
              }}
              aria-label={saved ? 'Remove from saved' : 'Save property'}
              className={`px-2.5 py-1 rounded-[2px] border transition-colors cursor-pointer ${
                saved
                  ? 'bg-[#C93636] text-white border-[#C93636]'
                  : 'bg-[#FAFBF9] text-[#5F6B63] border-[#DDE5DF] hover:border-[#C93636] hover:text-[#C93636]'
              }`}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
