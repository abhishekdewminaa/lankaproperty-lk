export type ExtractionConfidence = 'high' | 'medium' | 'low';
export type ExtractionMethod = 'heuristic' | 'ai';

export interface FieldExtractionResult<T = any> {
  fieldKey: string;
  fieldLabel: string;
  category: 'core' | 'location' | 'price' | 'specs' | 'content' | 'contact' | 'media';
  currentValue: T;
  proposedValue: T;
  normalizedUnit?: string;
  sourceExcerpt?: string;
  method: ExtractionMethod;
  confidence: ExtractionConfidence;
  conflictOrAmbiguity?: string;
  isAmbiguous?: boolean;
  isConflict?: boolean;
  selectedToApply: boolean;
}

export interface ParserSummary {
  fieldsFilledCount: number;
  needReviewCount: number;
  detectedLanguage: string;
  conflicts: string[];
  ambiguities: string[];
  rawTextLength: number;
  methodUsed: ExtractionMethod;
}

export interface AIPropertyParseResponse {
  title?: string | null;
  purpose?: 'buy' | 'rent' | 'land' | null;
  type?: 'house' | 'apartment' | 'land' | 'commercial' | null;
  location?: {
    district?: string | null;
    city?: string | null;
    address?: string | null;
    mapUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  price?: {
    priceLkr?: number | null;
    priceUnit?: 'total' | 'perch' | 'month' | 'per_year' | null;
    isNegotiable?: boolean | null;
    priceOnRequest?: boolean | null;
    calculationNote?: string | null;
    priceDisplay?: string | null;
  };
  specs?: {
    bedrooms?: number | null;
    bathrooms?: number | null;
    floorAreaSqFt?: number | null;
    landPerches?: number | null;
    landAcres?: number | null;
    parkingSpaces?: number | null;
    furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully Furnished' | null;
  };
  content?: {
    description?: string | null;
    additionalInfo?: string | null;
    materialSpecs?: string | null;
    amenities?: string[];
  };
  contact?: {
    primaryPhone?: string | null;
    secondaryPhone?: string | null;
    contactName?: string | null;
  };
  media?: {
    videoUrl?: string | null;
  };
  analysis: {
    detectedLanguage: string;
    conflicts: string[];
    ambiguities: string[];
    missingCriticalInfo: string[];
    fieldExcerpts: Record<
      string,
      {
        excerpt: string;
        confidence: ExtractionConfidence;
        ambiguityMessage?: string;
      }
    >;
  };
}
