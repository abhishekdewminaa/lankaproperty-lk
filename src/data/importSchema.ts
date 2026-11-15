/**
 * LankaProperty.lk - Production Data Import Specification & Validator
 *
 * This file defines the standard external JSON and CSV schema for real property feeds
 * from MLS aggregators, developer CRM feeds, and licensed Sri Lankan brokerage systems.
 */

export interface PropertyImportRecord {
  id: string;
  slug: string;
  title: string;
  purpose: 'buy' | 'rent';
  type: 'house' | 'apartment' | 'land' | 'commercial';
  priceLkr: number;
  priceUnit: 'total' | 'month' | 'perch';
  status: 'available' | 'reserved' | 'sold';
  district: string;
  city: string;
  address: string;
  province?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorAreaSqFt?: number | null;
  landPerches?: number | null;
  furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished' | null;
  parkingSpaces?: number | null;
  yearBuilt?: number | null;
  images: string[];
  floorPlans?: string[];
  description: string;
  amenities: string[];
  agentName: string;
  agentPhone: string;
  agentWhatsapp?: string;
  publishedDate: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePropertyImport(data: Partial<PropertyImportRecord>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required identifiers
  if (!data.id) errors.push('Missing unique property identifier "id"');
  if (!data.slug) errors.push('Missing URL slug "slug"');
  if (!data.title) errors.push('Missing property title "title"');

  // Purpose & Type
  if (!data.purpose || !['buy', 'rent'].includes(data.purpose)) {
    errors.push('Purpose must be either "buy" or "rent"');
  }
  if (!data.type || !['house', 'apartment', 'land', 'commercial'].includes(data.type)) {
    errors.push('Type must be "house", "apartment", "land", or "commercial"');
  }

  // Price & Units
  if (data.priceLkr === undefined || data.priceLkr <= 0) {
    errors.push('Price amount "priceLkr" must be a positive integer in LKR');
  }
  if (!data.priceUnit || !['total', 'month', 'perch'].includes(data.priceUnit)) {
    errors.push('Price unit "priceUnit" must be "total", "month", or "perch"');
  }
  if (data.purpose === 'rent' && data.priceUnit !== 'month') {
    warnings.push('Rental properties should generally use "month" price unit');
  }
  if (data.type === 'land' && data.priceUnit === 'month') {
    errors.push('Land listings cannot use "month" price unit');
  }

  // Location
  if (!data.district) errors.push('Missing district field "district"');
  if (!data.city) errors.push('Missing city field "city"');
  if (!data.address) errors.push('Missing address field "address"');

  // Images
  if (!data.images || data.images.length === 0) {
    errors.push('At least one photograph URL is required in "images" array');
  }

  // Agent contact
  if (!data.agentName) errors.push('Missing broker or agent name "agentName"');
  if (!data.agentPhone) errors.push('Missing contact phone number "agentPhone"');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Standard CSV Header columns for CSV bulk import:
 * id,slug,title,purpose,type,priceLkr,priceUnit,status,district,city,address,bedrooms,bathrooms,floorAreaSqFt,landPerches,furnishing,images,agentName,agentPhone,agentWhatsapp,publishedDate
 */
export const CSV_IMPORT_COLUMNS = [
  'id',
  'slug',
  'title',
  'purpose',
  'type',
  'priceLkr',
  'priceUnit',
  'status',
  'district',
  'city',
  'address',
  'bedrooms',
  'bathrooms',
  'floorAreaSqFt',
  'landPerches',
  'furnishing',
  'images',
  'agentName',
  'agentPhone',
  'agentWhatsapp',
  'publishedDate',
];
