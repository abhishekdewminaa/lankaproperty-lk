interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
}

/**
 * Modernized vector edition of the original LankaProperty.lk brand mark:
 * Crimson pitched roof + rising tropical sun + Sri Lankan palm motif paired with bold 900-weight typography.
 */
export function BrandLogo({ variant = 'light', size = 'md' }: BrandLogoProps) {
  const isDarkBg = variant === 'dark';

  return (
    <span className="inline-flex items-center gap-2 select-none">
      {/* Vector Architectural Roof, Rising Sun & Tropical Palm Emblem */}
      <svg
        viewBox="0 0 42 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={size === 'sm' ? 'w-7 h-5 shrink-0' : 'w-8 h-6 xl:w-9 xl:h-7 shrink-0'}
        aria-hidden="true"
      >
        {/* Warm Tropical Sun */}
        <circle cx="17.5" cy="14.5" r="5.5" fill="#F59E0B" />

        {/* Crimson Architectural Pitched Roof & Plinth */}
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

        {/* Stylized Tropical Palm Silhouette */}
        <path
          d="M9.5 24.5C9.5 19.5 10 14.5 11.5 10.5M11.5 10.5C9 9.5 6.5 10.5 5 12M11.5 10.5C13.5 9 16 9.5 17 11M11.5 10.5C10.5 7.5 11.5 5 13.5 4"
          stroke={isDarkBg ? '#9FE3B8' : '#176B45'}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Bold 900-Weight Wordmark */}
      <span
        className={`${
          size === 'sm' ? 'text-lg sm:text-xl' : 'text-lg sm:text-xl xl:text-2xl'
        } font-black tracking-tight leading-none ${
          isDarkBg ? 'text-white' : 'text-[#103D2C]'
        }`}
      >
        Lanka
        <span className={isDarkBg ? 'text-[#9FE3B8]' : 'text-[#176B45]'}>Property</span>
        <span
          className={`text-[11px] sm:text-xs font-extrabold uppercase tracking-wider ml-1 ${
            isDarkBg ? 'text-white/90' : 'text-[#103D2C]/80'
          }`}
        >
          .lk
        </span>
      </span>
    </span>
  );
}
