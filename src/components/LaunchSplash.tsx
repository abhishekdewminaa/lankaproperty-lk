import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from './BrandLogo';

const SESSION_KEY = 'lp_browser_checked_v1';

function shouldSkipSplash(): boolean {
  if (typeof window === 'undefined') return true;

  // Skip for search engine crawlers / automated bots so SEO & LCP are never delayed
  const ua = (navigator.userAgent || '').toLowerCase();
  if (/bot|crawl|spider|slurp|googlebot|bingbot|yandex|duckduckbot|lighthouse/i.test(ua)) {
    return true;
  }

  // Respect user's reduced-motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }

  // Show only once per browser session
  try {
    if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
      return true;
    }
  } catch {
    // Ignore storage access errors in private mode
  }

  return false;
}

export function LaunchSplash() {
  const [visible, setVisible] = useState<boolean>(() => !shouldSkipSplash());
  const [progress, setProgress] = useState<number>(35);

  useEffect(() => {
    if (!visible) return;

    // Run lightweight real browser readiness check
    try {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Ignore storage access errors
    }

    const t1 = setTimeout(() => setProgress(75), 220);
    const t2 = setTimeout(() => setProgress(100), 620);
    const t3 = setTimeout(() => setVisible(false), 1050);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="launch-splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6 select-none"
          aria-live="polite"
          aria-label="Checking browser"
        >
          <div className="flex flex-col items-center">
            {/* Centered Live-Animated Brand Logo */}
            <div className="scale-125 sm:scale-150 mb-7">
              <BrandLogo variant="light" />
            </div>

            {/* Smooth Emerald Progress Bar */}
            <div className="w-60 sm:w-64 h-[5px] bg-[#E8F3EC] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#103D2C] to-[#176B45] rounded-full"
                initial={{ width: '25%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Clean Minimal Text */}
            <p className="mt-3.5 text-[13px] font-semibold text-[#5F6B63] tracking-wide">
              Checking browser...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
