import { useState } from 'react';
import { Property } from '../types/property';
import { useRouter } from '../hooks/useRouter';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { useCurrency } from '../context/CurrencyContext';
import { useCompare } from '../context/CompareContext';

export type PropertyCardVariant = 'grid' | 'editorial' | 'ledger' | 'gallery' | 'compact' | 'magazine';

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
  variant?: PropertyCardVariant;
}

function cleanText(input: string): string {
  if (!input) return '';
  return input
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}✔✅✓☑️⭐✨🔥💎📍🏡🏠🏢📞☎️💰💵🏷️🔹🔸▪️▫️►▸→←↗↓]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function PropertyCard({ property, priority = false, variant = 'grid' }: PropertyCardProps) {
  const { navigate } = useRouter();
  const { isSaved, toggleSave } = useSavedProperties();
  const { formatPrice, currency } = useCurrency();
  const { isInCompare, addToCompare } = useCompare();

  const saved = isSaved(property.id);
  const compared = isInCompare(property.id);
  const [imageError, setImageError] = useState(false);

  const getPurposeLabel = (purpose: string) => {
    if (purpose === 'rent') return 'For Rent';
    return 'For Sale';
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'land':
        return 'Land';
      case 'house':
        return 'House';
      case 'apartment':
        return 'Apartment';
      case 'hotel':
        return 'Hotel';
      case 'business':
      case 'commercial':
        return 'Business';
      default:
        return 'Property';
    }
  };

  const handleCardClick = () => {
    navigate(`/properties/${property.slug}`);
  };

  const specItems: { value: string; label: string }[] = [];
  if (property.type !== 'land' && property.specs.bedrooms !== undefined && property.specs.bedrooms > 0) {
    specItems.push({
      value: String(property.specs.bedrooms),
      label: property.specs.bedrooms === 1 ? 'Bed' : 'Beds',
    });
  }
  if (property.type !== 'land' && property.specs.bathrooms !== undefined && property.specs.bathrooms > 0) {
    specItems.push({
      value: String(property.specs.bathrooms),
      label: property.specs.bathrooms === 1 ? 'Bath' : 'Baths',
    });
  }
  if (property.specs.floorAreaSqFt !== undefined && property.specs.floorAreaSqFt > 0) {
    specItems.push({ value: property.specs.floorAreaSqFt.toLocaleString(), label: 'sq ft' });
  }
  if (property.specs.landPerches !== undefined && property.specs.landPerches > 0) {
    specItems.push({ value: String(property.specs.landPerches), label: 'Perches' });
  }

  const heroSrc =
    property.images?.[0] ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  const cleanTitle = cleanText(property.title);
  const cleanDescription = cleanText(property.description);

  const cardShellClass =
    'group bg-white border border-[#DDE5DF] shadow-[0_2px_10px_rgba(16,61,44,0.05)] hover:border-[#103D2C] hover:shadow-[0_10px_24px_rgba(16,61,44,0.10)] transition-all duration-200 rounded-[4px] overflow-hidden cursor-pointer h-full flex flex-col justify-between';

  const renderActionButtons = (showViewLink = false) => (
    <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold uppercase tracking-wider">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          addToCompare(property);
        }}
        className={`px-2.5 py-1.5 rounded-[3px] border transition-colors cursor-pointer ${
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
        className={`px-2.5 py-1.5 rounded-[3px] border transition-colors cursor-pointer ${
          saved
            ? 'bg-[#C93636] text-white border-[#C93636]'
            : 'bg-[#FAFBF9] text-[#5F6B63] border-[#DDE5DF] hover:border-[#C93636] hover:text-[#C93636]'
        }`}
      >
        {saved ? 'Saved' : 'Save'}
      </button>

      {showViewLink && (
        <span className="hidden sm:inline-block px-3 py-1.5 bg-[#103D2C] text-white rounded-[3px] group-hover:bg-[#176B45] transition-colors">
          View Details
        </span>
      )}
    </div>
  );

  const renderValuation = () => (
    <div className="min-w-0">
      <div className="text-[18px] sm:text-[19px] font-extrabold text-[#103D2C] tabular-nums leading-none truncate">
        {property.priceLkr > 0 ? formatPrice(property.priceLkr, false) : 'Price on Request'}
        {property.purpose === 'rent' && property.priceLkr > 0 && (
          <span className="text-xs text-[#5F6B63] font-normal ml-1">/ month</span>
        )}
        {property.priceUnit === 'perch' && property.priceLkr > 0 && (
          <span className="text-xs text-[#5F6B63] font-normal ml-1">/ perch</span>
        )}
      </div>
      {currency !== 'LKR' && property.priceLkr > 0 && (
        <div className="text-[11px] text-[#5F6B63] tabular-nums mt-1">
          Rs. {Math.round(property.priceLkr).toLocaleString('en-US')} LKR
        </div>
      )}
    </div>
  );

  const renderEyebrow = () => (
    <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider">
      <span className="text-[#176B45] truncate">
        {property.location.city}, {property.location.district}
      </span>
      <span className="text-[#5F6B63] shrink-0">
        {getCategoryLabel(property.type)} · {getPurposeLabel(property.purpose)}
      </span>
    </div>
  );

  const renderSpecs = () =>
    specItems.length > 0 ? (
      <div className="flex items-center flex-wrap gap-y-1 pt-1 text-xs text-[#5F6B63]">
        {specItems.map((spec, idx) => (
          <span key={spec.label} className="flex items-center">
            {idx > 0 && <span className="mx-2 text-[#DDE5DF]">|</span>}
            <strong className="font-bold text-[#18251E] tabular-nums mr-1">{spec.value}</strong>
            <span>{spec.label}</span>
          </span>
        ))}
      </div>
    ) : null;

  const renderPhoto = (containerClass: string) => (
    <div className={`relative overflow-hidden bg-[#F5F8F5] ${containerClass}`}>
      {!imageError ? (
        <>
          <img
            src={heroSrc}
            alt={cleanTitle}
            loading={priority ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          {/* Top-left clean category & purpose badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
            <span className="px-2 py-0.5 bg-[#103D2C]/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
              {getCategoryLabel(property.type)}
            </span>
            {property.isFeatured && (
              <span className="px-2 py-0.5 bg-white/95 text-[#103D2C] text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                Featured
              </span>
            )}
          </div>

          {/* Photo Count Badge */}
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/70 text-white text-[10px] font-semibold rounded-[2px] pointer-events-none tabular-nums">
              {property.images.length} Photos
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#F5F8F5] text-[#5F6B63]">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#103D2C]">
            {getCategoryLabel(property.type)} · {property.location.city}
          </span>
        </div>
      )}
    </div>
  );

  if (variant === 'editorial' || variant === 'ledger') {
    return (
      <article onClick={handleCardClick} className={`${cardShellClass} flex flex-col lg:flex-row`}>
        {renderPhoto('w-full lg:w-[42%] aspect-16/10 lg:aspect-auto lg:min-h-[240px] shrink-0')}

        <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4 bg-white">
          <div className="space-y-2">
            {renderEyebrow()}
            <h3 className="text-lg sm:text-xl font-bold text-[#18251E] group-hover:text-[#103D2C] transition-colors leading-snug">
              {cleanTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6B63] leading-relaxed line-clamp-2">
              {cleanDescription}
            </p>
            <div className="pt-1">{renderSpecs()}</div>
          </div>

          <div className="pt-4 border-t border-[#DDE5DF] flex flex-wrap items-center justify-between gap-4">
            {renderValuation()}
            {renderActionButtons(true)}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article onClick={handleCardClick} className={cardShellClass}>
      {renderPhoto('aspect-16/10 w-full shrink-0')}

      <div className="p-5 flex flex-col flex-1 justify-between gap-4 bg-white">
        <div className="space-y-2">
          {renderEyebrow()}
          <h3 className="text-[17px] font-bold text-[#18251E] group-hover:text-[#103D2C] transition-colors duration-150 line-clamp-2 min-h-[2.75rem] leading-snug">
            {cleanTitle}
          </h3>
          {renderSpecs()}
        </div>

        <div className="pt-3.5 border-t border-[#DDE5DF] flex items-center justify-between gap-3">
          {renderValuation()}
          {renderActionButtons(false)}
        </div>
      </div>
    </article>
  );
}
