import { useEffect, useState, useCallback } from 'react';

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => new URLSearchParams(window.location.search));

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname || '/');
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('app-navigation', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('app-navigation', handleLocationChange);
    };
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean; preserveScroll?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }

    if (!options?.preserveScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.dispatchEvent(new Event('app-navigation'));
  }, []);

  // Parse path segments, e.g. /properties/slug -> ['properties', 'slug']
  const segments = currentPath
    .split('/')
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });

  return {
    pathname: currentPath,
    searchParams,
    segments,
    navigate,
  };
}
