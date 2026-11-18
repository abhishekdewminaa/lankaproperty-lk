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

/**
 * Normalizes any Sri Lankan or international phone/WhatsApp number into E.164 digits
 * required by https://wa.me/<digits> (e.g. "077 123 4567" -> "94771234567").
 */
export function normalizeSriLankaWhatsApp(primary?: string, fallback?: string): string {
  const pickDigits = (val?: string) => (val || '').replace(/[^0-9]/g, '');
  let digits = pickDigits(primary);
  if (digits.length < 7) {
    digits = pickDigits(fallback);
  }
  if (!digits) return '';

  // Strip international "00" prefix (e.g. 0094771234567 -> 94771234567)
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Convert local Sri Lankan 10-digit number starting with 0 (e.g. 0771234567 -> 94771234567)
  if (digits.startsWith('0') && digits.length === 10) {
    digits = `94${digits.slice(1)}`;
  } else if (digits.length === 9 && !digits.startsWith('94')) {
    // Handle 9-digit mobile/landline without leading 0 (e.g. 771234567 -> 94771234567)
    digits = `94${digits}`;
  }

  return digits;
}
