import { useEffect, useRef, useState, useCallback } from 'react';

interface GalleryLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function GalleryLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  if (!isOpen || images.length === 0) return null;

  const handleImageFallback = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgEl = e.currentTarget;
    const currentSrc = imgEl.src;
    const filename = currentSrc.split('/').pop() || '';
    const defaultFallback =
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';
    if (currentSrc.includes('supabase.co') && filename && !imgEl.dataset.triedLocal) {
      imgEl.dataset.triedLocal = 'true';
      imgEl.src = `/uploads/properties/${filename}`;
    } else if (currentSrc !== defaultFallback) {
      imgEl.src = defaultFallback;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo Gallery for ${title}`}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200 overscroll-contain"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between text-white/90 z-10 max-w-[1360px] mx-auto w-full">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">{title}</h2>
          <span className="text-xs text-white/70 tabular-nums">
            Photo {currentIndex + 1} of {images.length}{' '}
            {isZoomed ? '· Zoomed (Click image to reset)' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="px-3.5 py-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-[3px] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            {isZoomed ? 'Reset Zoom' : 'Zoom'}
          </button>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="px-3.5 py-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-[3px] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="relative flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`${title} - Photo ${currentIndex + 1}`}
          referrerPolicy="no-referrer"
          onError={handleImageFallback}
          onClick={() => setIsZoomed((prev) => !prev)}
          className={`max-h-[82vh] max-w-full object-contain select-none transition-transform duration-300 ease-out cursor-pointer ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
          }`}
        />

        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 px-3.5 py-2.5 text-white/90 hover:text-white bg-black/50 hover:bg-black/80 rounded-[3px] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
            aria-label="Previous photo"
          >
            Prev
          </button>
        )}

        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 px-3.5 py-2.5 text-white/90 hover:text-white bg-black/50 hover:bg-black/80 rounded-[3px] transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
            aria-label="Next photo"
          >
            Next
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 max-w-[1360px] mx-auto overflow-x-auto py-2 z-10">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              onClick={() => {
                setIsZoomed(false);
                setCurrentIndex(idx);
              }}
              className={`relative w-14 h-10 sm:w-20 sm:h-14 shrink-0 overflow-hidden rounded-[2px] transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'ring-2 ring-[#176B45] opacity-100 scale-105'
                  : 'opacity-50 hover:opacity-80'
              }`}
              aria-label={`View photo ${idx + 1}`}
            >
              <img
                src={img}
                alt=""
                referrerPolicy="no-referrer"
                onError={handleImageFallback}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
