import React, { createContext, useContext, useState, useEffect } from 'react';
import { Property } from '../types/property';

interface CompareContextType {
  compareItems: Property[];
  addToCompare: (property: Property) => boolean;
  removeFromCompare: (propertyId: string) => void;
  isInCompare: (propertyId: string) => boolean;
  clearCompare: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const STORAGE_KEY = 'lankaproperty_compare_ids';

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareItems, setCompareItems] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchronize with local storage IDs if needed
  const addToCompare = (property: Property): boolean => {
    if (compareItems.some((item) => item.id === property.id)) {
      removeFromCompare(property.id);
      return false;
    }
    if (compareItems.length >= 3) {
      alert('You can compare up to 3 properties at a time. Remove one first.');
      return false;
    }
    setCompareItems((prev) => [...prev, property]);
    return true;
  };

  const removeFromCompare = (propertyId: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== propertyId));
  };

  const isInCompare = (propertyId: string): boolean => {
    return compareItems.some((item) => item.id === propertyId);
  };

  const clearCompare = () => {
    setCompareItems([]);
    setIsModalOpen(false);
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = (): CompareContextType => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
