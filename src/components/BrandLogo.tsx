import { useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  isCompact?: boolean;
}

/**
 * Live-animated vector edition of the LankaProperty brand mark:
 * - Continuous gentle coastal breeze sway on the tropical palm
 * - Continuous warm solar breathing & halo pulse on the golden sun
 * - Architectural roofline draw-in on mount + scroll-linked sun parallax
 * - Crisp hover & tap micro-reactions
 */
export function BrandLogo({ variant = 'light', size = 'md', isCompact = false }: BrandLogoProps) {
  const isDarkBg = variant === 'dark';
  const prefersReduced = usePrefersReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const { scrollY } = useScroll();
  const sunScrollY = useTransform(scrollY, [0, 600], [0, -2.5]);
  const sunScrollX = useTransform(scrollY, [0, 600], [0, 1.8]);

  return (
    <motion.span
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={
        prefersReduced
          ? undefined
          : {
              scale: isCompact ? 0.93 : 1,
            }
      }
      whileTap={prefersReduced ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className="inline-flex items-center gap-2.5 select-none origin-left"
    >
      {/* Vector Architectural Roof, Rising Sun & Tropical Palm Emblem */}
      <svg
        viewBox="0 0 42 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={
          size === 'sm'
            ? 'w-8 h-6 shrink-0 overflow-visible'
            : 'w-9 h-7 sm:w-10 sm:h-8 xl:w-11 xl:h-9 shrink-0 overflow-visible'
        }
        aria-hidden="true"
      >
        {/* Live Solar Halo Ring */}
        {!prefersReduced && (
          <motion.circle
            cx="17.5"
            cy="14.5"
            r="5.5"
            fill="#F59E0B"
            style={{
              transformOrigin: '17.5px 14.5px',
              x: sunScrollX,
              y: sunScrollY,
            }}
            animate={{
              scale: [0.95, 1.65],
              opacity: [0.42, 0],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Warm Tropical Sun — continuous breathing + scroll arc + hover rise */}
        <motion.circle
          cx="17.5"
          cy="14.5"
          r="5.5"
          fill="#F59E0B"
          style={{
            transformOrigin: '17.5px 14.5px',
            x: prefersReduced ? 0 : sunScrollX,
            y: prefersReduced ? 0 : sunScrollY,
          }}
          animate={
            prefersReduced
              ? undefined
              : isHovered
              ? { scale: 1.18, opacity: 1 }
              : { scale: [1, 1.08, 1], opacity: [0.92, 1, 0.92] }
          }
          transition={
            isHovered
              ? { type: 'spring', stiffness: 320, damping: 18 }
              : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
          }
        />

        {/* Crimson Architectural Pitched Roof & Plinth — draws in on load & lifts on hover */}
        <motion.g
          animate={
            prefersReduced
              ? undefined
              : {
                  y: isHovered ? -1.4 : 0,
                }
          }
          transition={{ type: 'spring', stiffness: 340, damping: 22 }}
        >
          <motion.path
            d="M4 26H16.5V19.5L26 10.5L36.5 20.5"
            stroke="#C93636"
            strokeWidth="3.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            initial={prefersReduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          />
          <motion.path
            d="M12.5 16L26 4L39.5 16.5"
            stroke="#C93636"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={prefersReduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.85, delay: 0.15, ease: 'easeOut' }}
          />
        </motion.g>

        {/* Stylized Tropical Palm Silhouette — continuous living coastal breeze sway */}
        <motion.path
          d="M9.5 24.5C9.5 19.5 10 14.5 11.5 10.5M11.5 10.5C9 9.5 6.5 10.5 5 12M11.5 10.5C13.5 9 16 9.5 17 11M11.5 10.5C10.5 7.5 11.5 5 13.5 4"
          stroke={isDarkBg ? '#9FE3B8' : '#176B45'}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={
            prefersReduced
              ? undefined
              : isHovered
              ? { rotate: [0, -8, 6, -4, 0] }
              : { rotate: [-2.5, 3, -2.5] }
          }
          transition={
            isHovered
              ? { duration: 0.65, ease: 'easeInOut' }
              : { duration: 5.2, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{ transformOrigin: '9.5px 24.5px' }}
        />
      </svg>

      {/* Bold 900-Weight Wordmark */}
      <span
        className={`${
          size === 'sm' ? 'text-base sm:text-lg' : 'text-base sm:text-lg xl:text-[20px]'
        } font-black tracking-tight leading-none ${
          isDarkBg ? 'text-white' : 'text-[#103D2C]'
        }`}
      >
        Lanka<span className={isDarkBg ? 'text-white' : 'text-[#176B45]'}>Property</span>
      </span>
    </motion.span>
  );
}
