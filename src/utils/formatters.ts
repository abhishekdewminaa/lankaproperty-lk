import { PriceUnit } from '../types/property';

export function formatPriceLkr(price: number, unit: PriceUnit = 'total', compact: boolean = false): string {
  if (price === 0) return 'Price on Application';

  if (compact) {
    if (price >= 1_000_000_000) {
      const billions = (price / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
      const suffix = unit === 'month' ? '/mo' : unit === 'perch' ? '/perch' : '';
      return `LKR ${billions} Bn ${suffix}`.trim();
    }
    if (price >= 1_000_000) {
      const millions = (price / 1_000_000).toFixed(1).replace(/\.0$/, '');
      const suffix = unit === 'month' ? '/mo' : unit === 'perch' ? '/perch' : '';
      return `LKR ${millions} Mn ${suffix}`.trim();
    }
  }

  const formattedNum = new Intl.NumberFormat('en-LK').format(price);
  if (unit === 'month') {
    return `LKR ${formattedNum} / month`;
  }
  if (unit === 'perch') {
    return `LKR ${formattedNum} / perch`;
  }
  return `LKR ${formattedNum}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-LK').format(num);
}

export function getPriceUnitLabel(unit: PriceUnit): string {
  switch (unit) {
    case 'month':
      return 'per month';
    case 'perch':
      return 'per perch';
    case 'total':
    default:
      return 'total';
  }
}
