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

export function PropertyCard({ property, priority = false, variant = 'grid' }: PropertyCardProps) {
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

  const heroSrc =
    property.images?.[0] ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  const cardShellClass =
    'group bg-white border border-[#DDE5DF] shadow-[0_8px_24px_rgba(16,61,44,0.08),0_2px_6px_rgba(0,0,0,0.04)] hover:border-[#103D2C] hover:shadow-[0_18px_40px_rgba(16,61,44,0.14),0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 rounded-[2px] overflow-hidden cursor-pointer';

  const renderActionButtons = (showViewLink = false) => (
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

      {showViewLink && (
        <span className="hidden sm:inline-block px-3 py-1 bg-[#103D2C] text-white rounded-[2px] group-hover:bg-[#176B45] transition-colors">
          View →
        </span>
      )}
    </div>
  );

  const renderValuation = () => (
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
  );

  const renderEyebrow = () => (
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
  );

  const renderSpecs = () =>
    specItems.length > 0 ? (
      <div className="flex items-center flex-wrap gap-y-1 pt-1 text-[12.5px] text-[#5F6B63]">
        {specItems.map((spec, idx) => (
          <span key={spec.label} className="flex items-center">
            {idx > 0 && <span className="mx-2.5 text-[#DDE5DF]">|</span>}
            <strong className="font-semibold text-[#18251E] tabular-nums mr-1">{spec.value}</strong>
            <span>{spec.label}</span>
          </span>
        ))}
      </div>
    ) : null;

  const renderPhoto = (containerClass: string) => (
    <div className={`relative overflow-hidden bg-[#F5F8F5] ${containerClass}`}>
      {!imageError ? (
        <img
          src={heroSrc}
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
  );

  // LAYOUT 2: EDITORIAL SPLIT DOSSIER (Wide horizontal 45/55 card with description excerpt)
  if (variant === 'editorial') {
    return (
      <article onClick={handleCardClick} className={`${cardShellClass} flex flex-col lg:flex-row`}>
        {renderPhoto('w-full lg:w-[44%] aspect-16/10 lg:aspect-auto lg:min-h-[260px] shrink-0')}

        <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between gap-5 bg-white">
          <div className="space-y-2.5">
            {renderEyebrow()}
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#18251E] group-hover:text-[#103D2C] transition-colors leading-snug tracking-tight">
              {property.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6B63] leading-relaxed line-clamp-2">
              {property.description}
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

  // LAYOUT 3: COMPACT ARCHITECTURAL LEDGER (High-density scannable row card)
  if (variant === 'ledger') {
    return (
      <article onClick={handleCardClick} className={`${cardShellClass} flex flex-col md:flex-row items-stretch`}>
        {renderPhoto('w-full md:w-56 aspect-16/10 md:aspect-auto md:min-h-[124px] shrink-0')}

        <div className="p-4 sm:p-5 flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
          <div className="space-y-1.5 min-w-0 flex-1">
            {renderEyebrow()}
            <h3 className="text-[17px] sm:text-[18px] font-bold text-[#18251E] group-hover:text-[#103D2C] transition-colors truncate tracking-tight">
              {property.title}
            </h3>
            {renderSpecs()}
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#DDE5DF] lg:pl-6 shrink-0">
            {renderValuation()}
            {renderActionButtons(false)}
          </div>
        </div>
      </article>
    );
  }

  // LAYOUT 4: GALLERY OVERLAY SHOWCASE (Full-bleed architectural photography with bottom scrim)
  if (variant === 'gallery') {
    return (
      <article
        onClick={handleCardClick}
        className={`${cardShellClass} relative aspect-4/3 flex flex-col justify-end`}
      >
        <img
          src={heroSrc}
          alt={property.title}
          loading={priority ? 'eager' : 'lazy'}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2519]/95 via-[#0B2519]/45 to-transparent" />

        <div className="relative z-10 p-5 sm:p-6 text-white space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9FE3B8]">
            <span className="truncate">
              {property.location.city}, {property.location.district} · {getTenureLabel(property.type)}
            </span>
            {property.isFeatured && <span className="shrink-0 text-white">Featured</span>}
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-1 tracking-tight">
            {property.title}
          </h3>

          {specItems.length > 0 && (
            <div className="flex items-center flex-wrap gap-y-1 text-[12px] text-white/85">
              {specItems.map((spec, idx) => (
                <span key={spec.label} className="flex items-center">
                  {idx > 0 && <span className="mx-2 text-white/30">|</span>}
                  <strong className="font-bold text-white tabular-nums mr-1">{spec.value}</strong>
                  <span>{spec.label}</span>
                </span>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-white/20 flex items-center justify-between gap-3">
            <div className="text-[18px] sm:text-[19px] font-extrabold text-white tabular-nums truncate">
              {property.priceLkr > 0 ? formatPrice(property.priceLkr, false) : 'Price on request'}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCompare(property);
                }}
                className={`px-2.5 py-1 rounded-[2px] border transition-colors cursor-pointer ${
                  compared
                    ? 'bg-white text-[#103D2C] border-white'
                    : 'bg-white/15 text-white border-white/30 hover:bg-white/25'
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
                className={`px-2.5 py-1 rounded-[2px] border transition-colors cursor-pointer ${
                  saved
                    ? 'bg-[#C93636] text-white border-[#C93636]'
                    : 'bg-white/15 text-white border-white/30 hover:bg-white/25'
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

  // LAYOUT 5: COMPACT 4-COLUMN PORTFOLIO TILE (High-density investor scan)
  if (variant === 'compact') {
    return (
      <article onClick={handleCardClick} className={`${cardShellClass} flex flex-col`}>
        {renderPhoto('aspect-3/2 w-full')}

        <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#5F6B63] truncate">
              {property.location.city}, {property.location.district}
            </div>
            <h3 className="text-[15px] font-bold text-[#18251E] group-hover:text-[#103D2C] transition-colors line-clamp-1 leading-snug">
              {property.title}
            </h3>
            {specItems.length > 0 && (
              <div className="text-[11.5px] text-[#5F6B63] truncate">
                {specItems.slice(0, 3).map((s) => `${s.value} ${s.label}`).join(' · ')}
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-[#DDE5DF] flex items-center justify-between gap-2">
            <div className="text-[15px] font-extrabold text-[#103D2C] tabular-nums truncate">
              {property.priceLkr > 0 ? formatPrice(property.priceLkr, false) : 'POA'}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSave(property.id);
              }}
              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-[2px] border cursor-pointer shrink-0 ${
                saved
                  ? 'bg-[#C93636] text-white border-[#C93636]'
                  : 'bg-[#FAFBF9] text-[#5F6B63] border-[#DDE5DF] hover:border-[#103D2C]'
              }`}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </article>
    );
  }

  // LAYOUT 6: ARCHITECTURAL MONOGRAPH / MAGAZINE CARD (Header-first with left emerald accent)
  if (variant === 'magazine') {
    return (
      <article onClick={handleCardClick} className={`${cardShellClass} flex flex-col border-l-4 border-l-[#103D2C]`}>
        <div className="p-5 sm:p-6 pb-4 bg-[#FAFBF9] border-b border-[#DDE5DF] space-y-1.5">
          {renderEyebrow()}
          <h3 className="text-[19px] sm:text-[21px] font-extrabold text-[#103D2C] group-hover:text-[#176B45] transition-colors line-clamp-1 leading-snug tracking-tight">
            {property.title}
          </h3>
        </div>

        {renderPhoto('aspect-16/9 w-full')}

        <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4 bg-white">
          <div className="space-y-2.5">
            <p className="text-xs text-[#5F6B63] leading-relaxed line-clamp-2">
              {property.description}
            </p>
            {renderSpecs()}
          </div>

          <div className="pt-3.5 border-t border-[#DDE5DF] flex items-center justify-between gap-3">
            {renderValuation()}
            {renderActionButtons(true)}
          </div>
        </div>
      </article>
    );
  }

  // LAYOUT 1: STANDARD ARCHITECTURAL GRID CARD (Default)
  return (
    <article onClick={handleCardClick} className={`${cardShellClass} flex flex-col`}>
      {renderPhoto('aspect-16/10 w-full')}

      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4 bg-white">
        <div className="space-y-2">
          {renderEyebrow()}
          <h3 className="text-[18px] sm:text-[19px] font-bold text-[#18251E] group-hover:text-[#103D2C] transition-colors duration-150 line-clamp-1 leading-snug tracking-tight">
            {property.title}
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
