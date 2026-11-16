import { useState } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  isCompact?: boolean;
}

/**
 * Interactive vector edition of the original LankaProperty.lk brand mark:
 * Crimson pitched roof + rising tropical sun + Sri Lankan palm motif paired with bold 900-weight typography.
 * Reacts smoothly to hover, tap/click, and scroll depth.
 */
export function BrandLogo({ variant = 'light', size = 'md', isCompact = false }: BrandLogoProps) {
  const isDarkBg = variant === 'dark';
  const prefersReduced = usePrefersReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.span
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      animate={
        prefersReduced
          ? undefined
          : {
              scale: isCompact ? 0.92 : 1,
            }
      }
      whileTap={prefersReduced ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className="inline-flex items-center gap-2.5 select-none origin-left"
    >
      {/* Vector Architectural Roof, Rising Sun & Tropical Palm Emblem */}
      <svg
        viewBox="0 0 42 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={size === 'sm' ? 'w-8 h-6 shrink-0 overflow-visible' : 'w-9 h-7 sm:w-10 sm:h-8 xl:w-11 xl:h-9 shrink-0 overflow-visible'}
        aria-hidden="true"
      >
        {/* Warm Tropical Sun — rises & warms on hover or scroll */}
        <motion.circle
          cx="17.5"
          cy="14.5"
          r="5.5"
          fill="#F59E0B"
          animate={
            prefersReduced
              ? undefined
              : {
                  scale: isHovered ? 1.16 : isCompact ? 0.95 : 1,
                  y: isHovered ? -1.4 : isCompact ? 0.5 : 0,
                }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          style={{ transformOrigin: '17.5px 14.5px' }}
        />

        {/* Crimson Architectural Pitched Roof & Plinth — subtle architectural lift on hover */}
        <motion.g
          animate={
            prefersReduced
              ? undefined
              : {
                  y: isHovered ? -1.2 : 0,
                }
          }
          transition={{ type: 'spring', stiffness: 340, damping: 22 }}
        >
          <path
            d="M4 26H16.5V19.5L26 10.5L36.5 20.5"
            stroke="#C93636"
            strokeWidth="3.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M12.5 16L26 4L39.5 16.5"
            stroke="#C93636"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Stylized Tropical Palm Silhouette — gentle coastal breeze sway on hover */}
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
              ? { rotate: [0, -6, 4, -2, 0] }
              : { rotate: 0 }
          }
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          style={{ transformOrigin: '9.5px 24.5px' }}
        />
      </svg>

      {/* Bold 900-Weight Wordmark */}
      <span
        className={`${
          size === 'sm' ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl xl:text-[26px]'
        } font-black tracking-tight leading-none ${
          isDarkBg ? 'text-white' : 'text-[#103D2C]'
        }`}
      >
        Lanka
        <span className={isDarkBg ? 'text-white' : 'text-[#176B45]'}>Property</span>
        <span
          className={`text-xs sm:text-[13px] font-extrabold uppercase tracking-wider ml-1 ${
            isDarkBg ? 'text-white' : 'text-[#103D2C]/85'
          }`}
        >
          .lk
        </span>
      </span>
    </motion.span>
  );
}
