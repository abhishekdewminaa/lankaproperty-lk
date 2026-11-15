import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const touchStartX = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation & lock scroll
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

  // Touch swipe support
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
            Photo {currentIndex + 1} of {images.length}
          </span>
        </div>

        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-white"
          aria-label="Close photo gallery"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Viewport */}
      <div
        className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`${title} - Photo ${currentIndex + 1}`}
          referrerPolicy="no-referrer"
          className="max-h-[78vh] max-w-full object-contain select-none"
        />

        {/* Prev Button */}
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 p-3 text-white/90 hover:text-white bg-black/40 hover:bg-black/70 rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 p-3 text-white/90 hover:text-white bg-black/40 hover:bg-black/70 rounded-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="flex items-center justify-center gap-2 max-w-[1360px] mx-auto overflow-x-auto py-2 z-10">
        {images.map((img, idx) => (
          <button
            key={img + idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative w-14 h-10 sm:w-20 sm:h-14 shrink-0 overflow-hidden rounded-[2px] transition-all focus-visible:outline-2 focus-visible:outline-white ${
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
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
