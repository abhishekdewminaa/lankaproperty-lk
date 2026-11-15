import { useState } from 'react';
import { Heart, Bed, Bath, Maximize2, MapPin, Compass, Scale, Check } from 'lucide-react';
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

  const getStatusLabel = (purpose: string, type: string) => {
    if (purpose === 'land' || type === 'land') return 'Land';
    if (purpose === 'rent') return 'For Rent';
    if (type === 'commercial') return 'Commercial';
    return 'For Sale';
  };

  const getTitleBadge = (type: string) => {
    if (type === 'apartment') return 'Condominium Deed';
    return 'Freehold Title';
  };

  const handleCardClick = () => {
    navigate(`/properties/${property.slug}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col bg-white border border-[#DDE5DF] hover:border-[#176B45]/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-200 rounded-[4px] overflow-hidden cursor-pointer"
    >
      {/* 16:10 Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-[#F5F8F5]">
        {!imageError ? (
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}
            alt={property.title}
            loading={priority ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#F5F8F5] text-[#5F6B63]">
            <Compass className="w-8 h-8 text-[#176B45] mb-2 stroke-[1.5]" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[#18251E]">
              {property.type.toUpperCase()} · {property.location.city}
            </span>
          </div>
        )}

        {/* Top-Left Promotion Badges */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          {property.isFeatured && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#103D2C] text-white rounded-[2px] shadow-xs">
              FEATURED
            </span>
          )}
          {property.isTrending && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#C93636] text-white rounded-[2px] shadow-xs">
              TRENDING
            </span>
          )}
        </div>

        {/* Small Status & Tenure Badges (Lower Left) */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-white/95 text-[#103D2C] rounded-[2px] shadow-xs backdrop-blur-xs">
            {getStatusLabel(property.purpose, property.type)}
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#103D2C]/90 text-white rounded-[2px] backdrop-blur-xs">
            {getTitleBadge(property.type)}
          </span>
        </div>

        {/* Top-Right Action Controls (Compare & Heart) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {/* Compare Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCompare(property);
            }}
            aria-label={compared ? 'Remove from compare' : 'Add to compare'}
            title={compared ? 'In Comparison Tray' : 'Compare property'}
            className={`p-2 rounded-[2px] shadow-xs transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#176B45] ${
              compared
                ? 'bg-[#176B45] text-white'
                : 'bg-white/90 hover:bg-white text-[#5F6B63] hover:text-[#103D2C]'
            }`}
          >
            {compared ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
          </button>

          {/* Heart Save Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(property.id);
            }}
            aria-label={saved ? 'Remove from saved' : 'Save property'}
            className="p-2 bg-white/90 hover:bg-white text-[#18251E] rounded-[2px] shadow-xs transition-[background-color] duration-150 focus-visible:outline-2 focus-visible:outline-[#176B45] cursor-pointer"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-[color,fill] duration-150 ${
                saved
                  ? 'fill-[#C93636] text-[#C93636]'
                  : 'text-[#5F6B63] hover:text-[#C93636]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Solid White Information Panel Below Image */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div className="space-y-1.5">
          {/* Location with small MapPin icon */}
          <div className="flex items-center gap-1 text-[13px] text-[#5F6B63]">
            <MapPin className="w-3.5 h-3.5 text-[#176B45] shrink-0" />
            <span className="truncate">
              {property.location.city}, {property.location.district}
            </span>
          </div>

          {/* Property Title */}
          <h3 className="text-[17px] sm:text-[18px] font-bold text-[#18251E] group-hover:text-[#176B45] transition-[color] duration-150 line-clamp-1 leading-snug">
            {property.title}
          </h3>

          {/* Specifications Strip (Type-Aware) */}
          <div className="flex items-center gap-3 pt-1 text-[13px] text-[#5F6B63] flex-wrap">
            {property.type !== 'land' && property.specs.bedrooms !== undefined && property.specs.bedrooms > 0 && (
              <span className="flex items-center gap-1" title="Bedrooms">
                <Bed className="w-3.5 h-3.5 text-[#5F6B63]" />
                <span className="font-semibold text-[#18251E] tabular-nums">{property.specs.bedrooms}</span>
                <span className="text-[12px]">Beds</span>
              </span>
            )}

            {property.type !== 'land' && property.specs.bathrooms !== undefined && property.specs.bathrooms > 0 && (
              <span className="flex items-center gap-1" title="Bathrooms">
                <Bath className="w-3.5 h-3.5 text-[#5F6B63]" />
                <span className="font-semibold text-[#18251E] tabular-nums">{property.specs.bathrooms}</span>
                <span className="text-[12px]">Baths</span>
              </span>
            )}

            {property.specs.floorAreaSqFt !== undefined && property.specs.floorAreaSqFt > 0 && (
              <span className="flex items-center gap-1" title="Floor Area">
                <Maximize2 className="w-3.5 h-3.5 text-[#5F6B63]" />
                <span className="font-semibold text-[#18251E] tabular-nums">{property.specs.floorAreaSqFt.toLocaleString()}</span>
                <span className="text-[12px]">sq ft</span>
              </span>
            )}

            {property.specs.landPerches !== undefined && property.specs.landPerches > 0 && (
              <span className="flex items-center gap-1" title="Land Extent">
                <span className="font-semibold text-[#18251E] tabular-nums">{property.specs.landPerches}</span>
                <span className="text-[12px]">perches</span>
              </span>
            )}
          </div>
        </div>

        {/* Price Strip with dynamic multi-currency and secondary LKR readout */}
        <div className="pt-2.5 border-t border-[#DDE5DF] flex items-baseline justify-between">
          <div>
            <span className="text-[19px] sm:text-[20px] font-extrabold text-[#176B45] tabular-nums">
              {property.priceLkr > 0
                ? formatPrice(property.priceLkr, false)
                : 'Price on request'}
            </span>
            {property.purpose === 'rent' && (
              <span className="text-xs text-[#5F6B63] font-normal ml-1">/ month</span>
            )}
          </div>

          {currency !== 'LKR' && property.priceLkr > 0 && (
            <span className="text-[11px] text-[#5F6B63] tabular-nums">
              Rs. {(property.priceLkr / 1000000).toFixed(1)}M LKR
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
