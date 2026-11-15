import { useState, useEffect, useCallback } from 'react';

const SAVED_STORAGE_KEY = 'lankaproperty_saved_ids';
const COMPARE_STORAGE_KEY = 'lankaproperty_compare_ids';

export function useSavedProperties() {
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedSaved = localStorage.getItem(SAVED_STORAGE_KEY);
        setSavedIds(storedSaved ? JSON.parse(storedSaved) : []);

        const storedCompare = localStorage.getItem(COMPARE_STORAGE_KEY);
        setCompareIds(storedCompare ? JSON.parse(storedCompare) : []);
      } catch {
        // Fallback
      }
    };

    window.addEventListener('saved-properties-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('saved-properties-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('saved-properties-changed'));
      } catch {
        // storage disabled or quota
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleCompare = useCallback((id: string): { success: boolean; message?: string } => {
    let result = { success: true, message: '' };

    setCompareIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        try {
          localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event('saved-properties-changed'));
        } catch {}
        result = { success: true, message: 'Removed from comparison' };
        return next;
      }

      if (prev.length >= 3) {
        result = { success: false, message: 'You can compare a maximum of 3 properties simultaneously.' };
        return prev;
      }

      const next = [...prev, id];
      try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('saved-properties-changed'));
      } catch {}
      result = { success: true, message: 'Added to comparison' };
      return next;
    });

    return result;
  }, []);

  const isCompared = useCallback((id: string) => compareIds.includes(id), [compareIds]);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    try {
      localStorage.removeItem(COMPARE_STORAGE_KEY);
      window.dispatchEvent(new Event('saved-properties-changed'));
    } catch {}
  }, []);

  return {
    savedIds,
    savedCount: savedIds.length,
    toggleSave,
    isSaved,
    compareIds,
    compareCount: compareIds.length,
    toggleCompare,
    isCompared,
    clearCompare,
  };
}
