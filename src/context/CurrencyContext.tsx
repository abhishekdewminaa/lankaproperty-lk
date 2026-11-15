import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'LKR' | 'USD' | 'GBP' | 'EUR' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToLkr: number; // 1 Unit of foreign currency = X LKR
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  LKR: { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', rateToLkr: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToLkr: 310 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToLkr: 395 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToLkr: 335 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToLkr: 205 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  currencyConfig: CurrencyConfig;
  formatPrice: (priceLkr: number, compact?: boolean) => string;
  formatPriceWithLkr: (priceLkr: number) => { primary: string; secondaryLkr?: string };
  convertFromLkr: (priceLkr: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'lankaproperty_currency_pref';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
      if (saved && CURRENCIES[saved]) return saved;
    } catch {
      // fallback
    }
    return 'LKR';
  });

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
  };

  const currencyConfig = CURRENCIES[currency];

  const convertFromLkr = (priceLkr: number): number => {
    if (currency === 'LKR') return priceLkr;
    return priceLkr / currencyConfig.rateToLkr;
  };

  const formatPrice = (priceLkr: number, compact = false): string => {
    if (currency === 'LKR') {
      if (compact) {
        if (priceLkr >= 1000000000) {
          return `Rs. ${(priceLkr / 1000000000).toFixed(1)}B`;
        }
        if (priceLkr >= 1000000) {
          return `Rs. ${(priceLkr / 1000000).toFixed(1)}M`;
        }
        return `Rs. ${priceLkr.toLocaleString('en-US')}`;
      }
      return `Rs. ${priceLkr.toLocaleString('en-US')}`;
    }

    const converted = priceLkr / currencyConfig.rateToLkr;
    if (compact) {
      if (converted >= 1000000) {
        return `${currencyConfig.symbol}${(converted / 1000000).toFixed(2)}M`;
      }
      if (converted >= 1000) {
        return `${currencyConfig.symbol}${(converted / 1000).toFixed(0)}K`;
      }
      return `${currencyConfig.symbol}${Math.round(converted).toLocaleString('en-US')}`;
    }

    return `${currencyConfig.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  };

  const formatPriceWithLkr = (priceLkr: number): { primary: string; secondaryLkr?: string } => {
    const primary = formatPrice(priceLkr, false);
    if (currency === 'LKR') {
      return { primary };
    }
    const secondaryLkr = `Rs. ${priceLkr.toLocaleString('en-US')} LKR`;
    return { primary, secondaryLkr };
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencyConfig,
        formatPrice,
        formatPriceWithLkr,
        convertFromLkr,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
