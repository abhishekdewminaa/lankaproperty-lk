import { useState, useEffect, useRef } from 'react';
import { Property } from '../types/property';
import { useRouter } from '../hooks/useRouter';
import { useCurrency } from '../context/CurrencyContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { ArrowRight, Compass, Bed, Bath, Maximize2 } from 'lucide-react';

interface SignatureStoryProps {
  property: Property;
}

interface Chapter {
  id: number;
  label: string;
  title: string;
  theme: 'Space' | 'Light' | 'Surroundings';
  text: string;
  imageIndex: number;
}

export function SignatureStory({ property }: SignatureStoryProps) {
  const { navigate } = useRouter();
  const { formatPrice } = useCurrency();
  const prefersReduced = usePrefersReducedMotion();

  // Three supported content chapters grounded in property data
  const chapters: Chapter[] = [
    {
      id: 1,
      theme: 'Space',
      label: '01 / SPACE',
      title: 'Double-Height Pavilion Living',
      text:
        property.editorialStory?.space ||
        '4,800 sq ft of open-plan living seamlessly merges internal halls with sprawling outdoor stone pavilions, sheltered by double-height timber ceilings.',
      imageIndex: 0,
    },
    {
      id: 2,
      theme: 'Light',
      label: '02 / LIGHT',
      title: 'Equatorial Shade & Cross-Ventilation',
      text:
        property.editorialStory?.light ||
        'Designed to capture prevailing ocean cross-breezes while filtering equatorial sunlight through handcrafted teak louvers and natural stone courtyards.',
      imageIndex: Math.min(1, property.images.length - 1),
    },
    {
      id: 3,
      theme: 'Surroundings',
      label: '03 / SURROUNDINGS',
      title: 'Talpe Coastal Coconut Grove',
      text:
        property.editorialStory?.location ||
        'Situated in the quiet coastal enclave of Talpe, Mihiripenna, just 12 minutes south of the UNESCO Galle Fort and walking distance to tranquil swimming lagoons.',
      imageIndex: Math.min(2, property.images.length - 1),
    },
  ];

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // IntersectionObserver to sync active chapter during native vertical scrolling
  useEffect(() => {
    if (prefersReduced) return;

    const observers: IntersectionObserver[] = [];

    chapterRefs.current.forEach((el, index) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveChapterIndex(index);
          }
        },
        {
          rootMargin: '-30% 0px -40% 0px',
          threshold: 0.2,
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [prefersReduced]);

  const activeChapter = chapters[activeChapterIndex] || chapters[0];

  return (
    <section
      aria-label={`Signature Property: ${property.title}`}
      className="py-16 sm:py-24 max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 w-full"
    >
      {/* Header Eyebrow & Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#DDE5DF]">
        <div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#18251E] tracking-tight">
            {property.title}
          </h2>
          <p className="text-sm text-[#5F6B63] mt-1">
            {property.location.city}, {property.location.district} · {property.specs.landPerches} Perches Freehold
          </p>
        </div>

        <button
          onClick={() => navigate(`/properties/${property.slug}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors self-start sm:self-auto shrink-0"
        >
          <span>Explore Property Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DESKTOP LAYOUT (>= 1024px): 58% Photography sticky / 42% Text scrolling */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-10 xl:gap-14 items-start relative">
        {/* Sticky 58% Photography Frame (7 cols) */}
        <div className="lg:col-span-7 sticky top-24 z-10">
          <div className="relative aspect-16/10 w-full overflow-hidden bg-[#F5F8F5] rounded-[3px] border border-[#DDE5DF] shadow-xs">
            {/* Stable crossfading image stack */}
            {chapters.map((chap, idx) => {
              const imageSrc = property.images[chap.imageIndex] || property.images[0];
              const isActive = activeChapterIndex === idx;

              return (
                <img
                  key={chap.id}
                  src={imageSrc}
                  alt={`${property.title} - ${chap.theme}`}
                  referrerPolicy="no-referrer"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-350 ease-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                />
              );
            })}

            {/* Top Chapter Status Marker */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-[2px] shadow-xs backdrop-blur-xs text-xs font-extrabold text-[#103D2C]">
              <span>Chapter {activeChapter.label}</span>
            </div>

            {/* Bottom Specs Strip Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between bg-black/75 px-4 py-2 text-white rounded-[2px] text-xs backdrop-blur-xs">
              <span className="font-bold tabular-nums">
                {formatPrice(property.priceLkr)}
              </span>
              <div className="flex items-center gap-4 text-white/90">
                {property.specs.bedrooms && (
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3 text-[#E8F3EC]" />
                    {property.specs.bedrooms} Suites
                  </span>
                )}
                {property.specs.floorAreaSqFt && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-[#E8F3EC]" />
                    {property.specs.floorAreaSqFt} sq ft
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Chapter Jump Bar */}
          <div className="mt-4 flex items-center gap-2">
            {chapters.map((chap, idx) => (
              <button
                key={chap.id}
                onClick={() => {
                  chapterRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-[2px] border text-left transition-colors ${
                  activeChapterIndex === idx
                    ? 'bg-[#103D2C] text-white border-[#103D2C]'
                    : 'bg-[#F5F8F5] text-[#5F6B63] border-[#DDE5DF] hover:bg-white'
                }`}
              >
                <span>{chap.theme}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrolling 42% Text Story Columns (5 cols) */}
        <div className="lg:col-span-5 space-y-16 py-6">
          {chapters.map((chap, idx) => (
            <div
              key={chap.id}
              ref={(el) => {
                chapterRefs.current[idx] = el;
              }}
              className={`p-8 rounded-[3px] border transition-all duration-300 ${
                activeChapterIndex === idx
                  ? 'bg-white border-[#176B45] shadow-xs'
                  : 'bg-[#F5F8F5] border-[#DDE5DF] opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDE5DF]">
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
                  {chap.label}
                </span>
                <span className="text-xs font-semibold text-[#5F6B63]">{chap.theme}</span>
              </div>

              <h3 className="text-xl font-bold text-[#18251E] mb-3 leading-snug">
                {chap.title}
              </h3>

              <p className="text-sm text-[#5F6B63] leading-relaxed">
                {chap.text}
              </p>

              <div className="mt-6 pt-4 border-t border-[#DDE5DF] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#18251E]">
                  Verified Sri Lankan Title
                </span>
                <button
                  onClick={() => navigate(`/properties/${property.slug}`)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#176B45] hover:text-[#115236]"
                >
                  <span>View Residence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE / TABLET LAYOUT (< 1024px): Normal Stacked Sequence (No Sticky or Artificial Spacer) */}
      <div className="lg:hidden space-y-10">
        {chapters.map((chap) => {
          const imageSrc = property.images[chap.imageIndex] || property.images[0];
          return (
            <div
              key={chap.id}
              className="bg-white border border-[#DDE5DF] rounded-[3px] overflow-hidden flex flex-col"
            >
              <div className="relative aspect-16/10 w-full overflow-hidden bg-[#F5F8F5]">
                <img
                  src={imageSrc}
                  alt={`${property.title} - ${chap.theme}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#103D2C] rounded-[2px]">
                  {chap.label}
                </span>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-[#18251E]">{chap.title}</h3>
                <p className="text-sm text-[#5F6B63] leading-relaxed">{chap.text}</p>
                <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#103D2C] tabular-nums">
                    {formatPrice(property.priceLkr)}
                  </span>
                  <button
                    onClick={() => navigate(`/properties/${property.slug}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#176B45]"
                  >
                    <span>Explore Property</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
