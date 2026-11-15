import { useRef, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface EditorialStatementProps {
  headline?: string;
  supportingText?: string;
}

export function EditorialStatement({
  headline = 'More room for the life you want.',
  supportingText = 'Curated Sri Lankan homes built for equatorial daylight, oceanic cross-breezes, and enduring calm.',
}: EditorialStatementProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [prefersReduced]);

  return (
    <section
      ref={containerRef}
      aria-label="Editorial Statement"
      className="bg-white py-20 sm:py-28 border-y border-[#DDE5DF] overflow-hidden"
    >
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16">
        <div className="max-w-4xl space-y-6">
          {/* Subtle Red Accent Line */}
          <div
            className={`w-12 h-0.5 bg-[#C93636] transition-all duration-700 ease-out ${
              isVisible || prefersReduced ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50 origin-left'
            }`}
            aria-hidden="true"
          />

          {/* Large Manrope Heading (Whole-line reveal) */}
          <div className="overflow-hidden">
            <h2
              className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#18251E] tracking-tight leading-[1.12] transition-all duration-750 ease-out ${
                isVisible || prefersReduced
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              }`}
            >
              {headline}
            </h2>
          </div>

          {/* Supporting Text Line */}
          <div className="overflow-hidden">
            <p
              className={`text-base sm:text-xl text-[#5F6B63] font-normal max-w-2xl leading-relaxed transition-all duration-750 ease-out delay-150 ${
                isVisible || prefersReduced
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              }`}
            >
              {supportingText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
