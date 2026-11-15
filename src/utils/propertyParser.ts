import { SRI_LANKA_DISTRICTS } from '../data/locations';
import {
  FieldExtractionResult,
  ParserSummary,
  AIPropertyParseResponse,
  ExtractionConfidence,
} from '../types/propertyParser';
import { AdminPropertyRecord } from '../admin/types/admin';

// Known Sri Lanka cities mapped to districts for deterministic suggestions
const CITY_TO_DISTRICT_MAP: Record<string, string> = {};
SRI_LANKA_DISTRICTS.forEach((d) => {
  d.cities.forEach((c) => {
    CITY_TO_DISTRICT_MAP[c.toLowerCase()] = d.district;
  });
});
// Common regional additions
CITY_TO_DISTRICT_MAP['kollupitiya'] = 'Colombo';
CITY_TO_DISTRICT_MAP['bambalapitiya'] = 'Colombo';
CITY_TO_DISTRICT_MAP['wellawatte'] = 'Colombo';
CITY_TO_DISTRICT_MAP['cinnamon gardens'] = 'Colombo';
CITY_TO_DISTRICT_MAP['havelock'] = 'Colombo';
CITY_TO_DISTRICT_MAP['narahenpita'] = 'Colombo';
CITY_TO_DISTRICT_MAP['dehiwala'] = 'Colombo';
CITY_TO_DISTRICT_MAP['mount lavinia'] = 'Colombo';
CITY_TO_DISTRICT_MAP['moratuwa'] = 'Colombo';
CITY_TO_DISTRICT_MAP['kohuwala'] = 'Colombo';
CITY_TO_DISTRICT_MAP['nugegoda'] = 'Colombo';
CITY_TO_DISTRICT_MAP['maharagama'] = 'Colombo';
CITY_TO_DISTRICT_MAP['talpe'] = 'Galle';
CITY_TO_DISTRICT_MAP['ahagama'] = 'Galle';
CITY_TO_DISTRICT_MAP['unawatuna'] = 'Galle';
CITY_TO_DISTRICT_MAP['weligama'] = 'Matara';
CITY_TO_DISTRICT_MAP['mirissa'] = 'Matara';
CITY_TO_DISTRICT_MAP['dikwella'] = 'Matara';
CITY_TO_DISTRICT_MAP['peradeniya'] = 'Kandy';
CITY_TO_DISTRICT_MAP['digana'] = 'Kandy';
CITY_TO_DISTRICT_MAP['katunayake'] = 'Gampaha';
CITY_TO_DISTRICT_MAP['negombo'] = 'Gampaha';
CITY_TO_DISTRICT_MAP['bentota'] = 'Kalutara';
CITY_TO_DISTRICT_MAP['nilaveli'] = 'Trincomalee';
CITY_TO_DISTRICT_MAP['trincomalee'] = 'Trincomalee';

/**
 * Stage A: Instant Heuristic Parser
 * Deterministic regex and pattern extraction for explicit values.
 */
export function parseHeuristic(
  rawText: string,
  currentForm: AdminPropertyRecord
): {
  fields: FieldExtractionResult[];
  summary: ParserSummary;
} {
  const fields: FieldExtractionResult[] = [];
  const conflicts: string[] = [];
  const ambiguities: string[] = [];

  const textLower = rawText.toLowerCase();

  // Language Detection
  let detectedLanguage = 'English';
  const hasSinhala = /[\u0D80-\u0DFF]/.test(rawText);
  const hasTamil = /[\u0B80-\u0BFF]/.test(rawText);
  if (hasSinhala && hasTamil) detectedLanguage = 'Mixed (Sinhala & Tamil)';
  else if (hasSinhala) detectedLanguage = 'Sinhala / English';
  else if (hasTamil) detectedLanguage = 'Tamil / English';

  // 1. Transaction Purpose & Price Unit
  let proposedPurpose: 'buy' | 'rent' | 'land' | null = null;
  let proposedPriceUnit: 'total' | 'perch' | 'month' | null = null;
  let purposeExcerpt = '';
  let purposeConfidence: ExtractionConfidence = 'high';

  if (
    /\b(?:for rent|rental|monthly rent|to let|lease|කුලියට|வாடகைக்கு)\b/i.test(rawText) ||
    /\b(?:per month|\/month|p\.m\.|pm)\b/i.test(rawText)
  ) {
    proposedPurpose = 'rent';
    proposedPriceUnit = 'month';
    const match = rawText.match(/\b(?:for rent|rental|to let|lease|කුලියට|per month|\/month)\b/i);
    purposeExcerpt = match ? match[0] : 'Rent keyword';
  } else if (
    /\b(?:bare land|land for sale|perch price|per perch|\/perch|පර්චස් එකක්|காணி விற்பனை)\b/i.test(rawText)
  ) {
    proposedPurpose = 'land';
    proposedPriceUnit = 'perch';
    const match = rawText.match(/\b(?:bare land|land for sale|per perch|\/perch)\b/i);
    purposeExcerpt = match ? match[0] : 'Land keyword';
  } else if (/\b(?:for sale|sale|selling|විකිණීමට|விற்பனைக்கு)\b/i.test(rawText)) {
    proposedPurpose = 'buy';
    proposedPriceUnit = 'total';
    const match = rawText.match(/\b(?:for sale|sale|selling|විකිණීමට|விற்பனைக்கு)\b/i);
    purposeExcerpt = match ? match[0] : 'Sale keyword';
  }

  // 2. Property Category / Type
  let proposedType: 'house' | 'apartment' | 'land' | 'commercial' | null = null;
  let typeExcerpt = '';

  if (/\b(?:apartment|condo|condominium|flat|penthouse|ඇපාර්ට්මන්ට්|அபார்ட்மெண்ட்)\b/i.test(rawText)) {
    proposedType = 'apartment';
    const match = rawText.match(/\b(?:apartment|condo|condominium|penthouse)\b/i);
    typeExcerpt = match ? match[0] : 'Apartment';
  } else if (/\b(?:villa|house|bungalow|residence|mansion|නිවස|வீடு)\b/i.test(rawText)) {
    proposedType = 'house';
    const match = rawText.match(/\b(?:villa|house|bungalow|residence|mansion|නිවස)\b/i);
    typeExcerpt = match ? match[0] : 'House';
  } else if (/\b(?:commercial|office|shop|building|warehouse|hotel|වාණිජ)\b/i.test(rawText)) {
    proposedType = 'commercial';
    const match = rawText.match(/\b(?:commercial|office|shop|building|hotel)\b/i);
    typeExcerpt = match ? match[0] : 'Commercial';
  } else if (/\b(?:land|plot|estate|paddy|beachfront land|ඉඩම|காணி)\b/i.test(rawText)) {
    proposedType = 'land';
    const match = rawText.match(/\b(?:land|plot|estate|beachfront land)\b/i);
    typeExcerpt = match ? match[0] : 'Land';
  }

  // 3. Currency and Valuation Extraction
  let proposedPrice: number | null = null;
  let priceExcerpt = '';
  let priceConfidence: ExtractionConfidence = 'high';
  let priceAmbiguity: string | undefined = undefined;
  let calculationNote: string | undefined = undefined;

  // Ambiguous shorthand check: e.g. "75M" without "million"
  const ambiguous75M = rawText.match(/\b(\d+(?:\.\d+)?)\s*M\b(?!\w)/i);
  if (ambiguous75M && !rawText.match(/\bmillion\b/i)) {
    ambiguities.push(`"${ambiguous75M[0]}" found without explicit unit (could mean Million or Meters).`);
  }

  // Check Per-perch pricing
  const perPerchMatch = rawText.match(
    /(?:rs\.?|lkr)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|mn|million)?\s*(?:per\s*perch|\/perch|\/p\b|pp\b)/i
  );

  // Check Lakhs (1 Lakh = 100,000 LKR)
  const lakhsMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|ලක්ෂ)\b/i);
  // Check Crores (1 Crore = 10,000,000 LKR)
  const croreMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:crores?|කෝටි)\b/i);
  // Check Millions (1 Million = 1,000,000 LKR)
  const millionMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:million|mn|මිලියන)\b/i);
  // Check Standard Rs / LKR amount: e.g. Rs. 78,500,000 or LKR 78,500,000
  const plainRsMatch = rawText.match(/(?:rs\.?|lkr)\s*([\d,]{4,})/i);

  if (perPerchMatch) {
    const rawVal = parseFloat(perPerchMatch[1].replace(/,/g, ''));
    if (!isNaN(rawVal)) {
      if (/lakh|lac/i.test(perPerchMatch[0])) {
        proposedPrice = rawVal * 100000;
      } else if (/mn|million/i.test(perPerchMatch[0])) {
        proposedPrice = rawVal * 1000000;
      } else {
        proposedPrice = rawVal;
      }
      proposedPriceUnit = 'perch';
      priceExcerpt = perPerchMatch[0];
      calculationNote = `Stated rate: Rs. ${proposedPrice.toLocaleString()} per perch.`;
    }
  } else if (lakhsMatch) {
    const val = parseFloat(lakhsMatch[1]);
    if (!isNaN(val)) {
      proposedPrice = Math.round(val * 100000);
      priceExcerpt = lakhsMatch[0];
      calculationNote = `${val} Lakhs = Rs. ${proposedPrice.toLocaleString()}`;
    }
  } else if (croreMatch) {
    const val = parseFloat(croreMatch[1]);
    if (!isNaN(val)) {
      proposedPrice = Math.round(val * 10000000);
      priceExcerpt = croreMatch[0];
      calculationNote = `${val} Crore = Rs. ${proposedPrice.toLocaleString()}`;
    }
  } else if (millionMatch) {
    const val = parseFloat(millionMatch[1]);
    if (!isNaN(val)) {
      proposedPrice = Math.round(val * 1000000);
      priceExcerpt = millionMatch[0];
      calculationNote = `${val} Million = Rs. ${proposedPrice.toLocaleString()}`;
    }
  } else if (plainRsMatch) {
    const cleanNum = parseFloat(plainRsMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanNum) && cleanNum > 1000) {
      // Exclude telephone numbers mistakenly prefixed
      if (cleanNum < 0x7ffffffff) {
        proposedPrice = cleanNum;
        priceExcerpt = plainRsMatch[0];
      }
    }
  }

  // Negotiable detection
  const isNegotiable = /\b(?:negotiable|neg\b|මිල සාකච්ඡා කරගත හැක|பேசித் தீர்மானிக்கலாம்)\b/i.test(rawText);

  // 4. Bedrooms & Bathrooms with Conflict Check
  let proposedBedrooms: number | null = null;
  let bedExcerpt = '';
  let bedConfidence: ExtractionConfidence = 'high';
  let bedConflict: string | undefined = undefined;

  // Check for contradiction like "five (3) bedrooms" or conflicting digits
  const wordToNumMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const contradictoryBedRegex = /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*\(\s*(\d+)\s*\)\s*(?:bed|bedroom)/i;
  const contraMatch = rawText.match(contradictoryBedRegex);
  if (contraMatch) {
    const wordVal = wordToNumMap[contraMatch[1].toLowerCase()];
    const digitVal = parseInt(contraMatch[2], 10);
    if (wordVal !== digitVal) {
      bedConflict = `Contradictory room count: "${contraMatch[0]}" (Stated as both ${wordVal} and ${digitVal})`;
      conflicts.push(bedConflict);
      bedConfidence = 'low';
      bedExcerpt = contraMatch[0];
    }
  }

  if (!bedConflict) {
    const bedMatch = rawText.match(/(\d+)\s*(?:bed|beds|bedrooms?|b\/r|කාමර)\b/i);
    if (bedMatch) {
      proposedBedrooms = parseInt(bedMatch[1], 10);
      bedExcerpt = bedMatch[0];
    }
  }

  // Bathrooms
  let proposedBathrooms: number | null = null;
  let bathExcerpt = '';
  const bathMatch = rawText.match(/(\d+)\s*(?:bath|baths|bathrooms?|washrooms?|නාන කාමර)\b/i);
  if (bathMatch) {
    proposedBathrooms = parseInt(bathMatch[1], 10);
    bathExcerpt = bathMatch[0];
  }

  // 5. Land Extent (Perches & Acres)
  let proposedPerches: number | null = null;
  let proposedAcres: number | null = null;
  let landExcerpt = '';

  const acreMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:acres?|අක්කර)\b/i);
  const perchMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:perch|perches|p\b|පර්චස්)\b/i);

  if (acreMatch && perchMatch) {
    const aVal = parseFloat(acreMatch[1]);
    const pVal = parseFloat(perchMatch[1]);
    if (!isNaN(aVal) && !isNaN(pVal)) {
      proposedAcres = aVal;
      proposedPerches = aVal * 160 + pVal;
      landExcerpt = `${acreMatch[0]} and ${perchMatch[0]}`;
    }
  } else if (acreMatch) {
    const aVal = parseFloat(acreMatch[1]);
    if (!isNaN(aVal)) {
      proposedAcres = aVal;
      proposedPerches = Math.round(aVal * 160);
      landExcerpt = acreMatch[0];
    }
  } else if (perchMatch) {
    const pVal = parseFloat(perchMatch[1]);
    if (!isNaN(pVal)) {
      proposedPerches = pVal;
      landExcerpt = perchMatch[0];
    }
  }

  // 6. Floor Area (Sq Ft)
  let proposedFloorArea: number | null = null;
  let floorAreaExcerpt = '';
  const sqftMatch = rawText.match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet|වර්ග අඩි)\b/i);
  if (sqftMatch) {
    const cleanSqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(cleanSqft) && cleanSqft > 50) {
      proposedFloorArea = cleanSqft;
      floorAreaExcerpt = sqftMatch[0];
    }
  }

  // 7. Location Detection (District & City)
  let proposedDistrict: string | null = null;
  let proposedCity: string | null = null;
  let locationExcerpt = '';
  let districtSuggestionNote: string | undefined = undefined;

  // First check explicit districts
  for (const d of SRI_LANKA_DISTRICTS) {
    const dRegex = new RegExp(`\\b${d.district}\\b`, 'i');
    if (dRegex.test(rawText)) {
      proposedDistrict = d.district;
      locationExcerpt = d.district;
      break;
    }
  }

  // Then check cities
  for (const [cityKey, mappedDistrict] of Object.entries(CITY_TO_DISTRICT_MAP)) {
    const cRegex = new RegExp(`\\b${cityKey}\\b`, 'i');
    if (cRegex.test(rawText)) {
      // Capitalize city name properly
      proposedCity = cityKey
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      locationExcerpt = proposedCity;

      if (!proposedDistrict) {
        proposedDistrict = mappedDistrict;
        districtSuggestionNote = `Suggested "${mappedDistrict}" based on detected city "${proposedCity}".`;
      }
      break;
    }
  }

  // 8. Telephone Number Extraction
  let proposedPhone: string | null = null;
  let phoneExcerpt = '';
  const phoneRegex = /(?:\+94|0094|0)\s*(?:7[0-9]|11|21|23|24|25|26|27|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81|91)[\s\-]*[0-9]{3}[\s\-]*[0-9]{4}/g;
  const phoneMatches = rawText.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    proposedPhone = phoneMatches[0].trim();
    phoneExcerpt = proposedPhone;
  }

  // 9. Map & Video URLs
  let proposedMapUrl: string | null = null;
  let proposedVideoUrl: string | null = null;

  const mapMatch = rawText.match(/https?:\/\/(?:maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl)[\S]+/i);
  if (mapMatch) {
    proposedMapUrl = mapMatch[0];
  }

  const videoMatch = rawText.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)[\w\-]+/i);
  if (videoMatch) {
    proposedVideoUrl = videoMatch[0];
  }

  // 10. Clean Title Candidate
  const rawLines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  let proposedTitle: string | null = null;
  if (rawLines.length > 0 && rawLines[0].length < 80 && !rawLines[0].includes('http')) {
    proposedTitle = rawLines[0];
  }

  // 11. Clean Content Description (Real paragraphs, fixing literal "\n")
  const sanitizedText = rawText
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .trim();

  // Assemble Field Extraction Results
  // Core: Title
  if (proposedTitle) {
    fields.push({
      fieldKey: 'title',
      fieldLabel: 'Property Title',
      category: 'core',
      currentValue: currentForm.title || '',
      proposedValue: proposedTitle,
      sourceExcerpt: proposedTitle,
      method: 'heuristic',
      confidence: 'medium',
      selectedToApply: !currentForm.title,
    });
  }

  // Core: Transaction Purpose
  if (proposedPurpose) {
    fields.push({
      fieldKey: 'purpose',
      fieldLabel: 'Transaction Purpose',
      category: 'core',
      currentValue: currentForm.purpose,
      proposedValue: proposedPurpose,
      sourceExcerpt: purposeExcerpt,
      method: 'heuristic',
      confidence: purposeConfidence,
      selectedToApply: !currentForm.purpose || currentForm.purpose === 'buy',
    });
  }

  // Core: Property Category
  if (proposedType) {
    fields.push({
      fieldKey: 'type',
      fieldLabel: 'Property Type',
      category: 'core',
      currentValue: currentForm.type,
      proposedValue: proposedType,
      sourceExcerpt: typeExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Location: District
  if (proposedDistrict) {
    fields.push({
      fieldKey: 'location.district',
      fieldLabel: 'District',
      category: 'location',
      currentValue: currentForm.location?.district || '',
      proposedValue: proposedDistrict,
      sourceExcerpt: locationExcerpt,
      method: 'heuristic',
      confidence: districtSuggestionNote ? 'medium' : 'high',
      conflictOrAmbiguity: districtSuggestionNote,
      selectedToApply: !currentForm.location?.district,
    });
  }

  // Location: City
  if (proposedCity) {
    fields.push({
      fieldKey: 'location.city',
      fieldLabel: 'City',
      category: 'location',
      currentValue: currentForm.location?.city || '',
      proposedValue: proposedCity,
      sourceExcerpt: locationExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: !currentForm.location?.city,
    });
  }

  // Price: Amount in LKR
  if (proposedPrice !== null) {
    fields.push({
      fieldKey: 'priceLkr',
      fieldLabel: 'Asking Price (LKR)',
      category: 'price',
      currentValue: currentForm.priceLkr || 0,
      proposedValue: proposedPrice,
      normalizedUnit: 'LKR',
      sourceExcerpt: priceExcerpt,
      method: 'heuristic',
      confidence: priceConfidence,
      conflictOrAmbiguity: calculationNote || priceAmbiguity,
      selectedToApply: !currentForm.priceLkr || currentForm.priceLkr === 0,
    });
  }

  // Price: Price Unit
  if (proposedPriceUnit) {
    fields.push({
      fieldKey: 'priceUnit',
      fieldLabel: 'Price Unit',
      category: 'price',
      currentValue: currentForm.priceUnit || 'total',
      proposedValue: proposedPriceUnit,
      sourceExcerpt: purposeExcerpt || priceExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Price: Negotiable
  if (isNegotiable) {
    fields.push({
      fieldKey: 'isNegotiable',
      fieldLabel: 'Price Negotiable',
      category: 'price',
      currentValue: currentForm.isNegotiable || false,
      proposedValue: true,
      sourceExcerpt: 'Negotiable stated in text',
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Specs: Bedrooms
  if (proposedBedrooms !== null || bedConflict) {
    fields.push({
      fieldKey: 'specs.bedrooms',
      fieldLabel: 'Bedrooms',
      category: 'specs',
      currentValue: currentForm.specs?.bedrooms ?? '',
      proposedValue: proposedBedrooms ?? 0,
      sourceExcerpt: bedExcerpt,
      method: 'heuristic',
      confidence: bedConfidence,
      conflictOrAmbiguity: bedConflict,
      isConflict: !!bedConflict,
      selectedToApply: !bedConflict && (currentForm.specs?.bedrooms === undefined || currentForm.specs.bedrooms === 0),
    });
  }

  // Specs: Bathrooms
  if (proposedBathrooms !== null) {
    fields.push({
      fieldKey: 'specs.bathrooms',
      fieldLabel: 'Bathrooms',
      category: 'specs',
      currentValue: currentForm.specs?.bathrooms ?? '',
      proposedValue: proposedBathrooms,
      sourceExcerpt: bathExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: currentForm.specs?.bathrooms === undefined || currentForm.specs.bathrooms === 0,
    });
  }

  // Specs: Land Perches
  if (proposedPerches !== null) {
    fields.push({
      fieldKey: 'specs.landPerches',
      fieldLabel: 'Land Extent (Perches)',
      category: 'specs',
      currentValue: currentForm.specs?.landPerches ?? '',
      proposedValue: proposedPerches,
      normalizedUnit: 'Perches',
      sourceExcerpt: landExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: currentForm.specs?.landPerches === undefined || currentForm.specs.landPerches === 0,
    });
  }

  // Specs: Floor Area (Sq Ft)
  if (proposedFloorArea !== null) {
    fields.push({
      fieldKey: 'specs.floorAreaSqFt',
      fieldLabel: 'Floor Area (Sq Ft)',
      category: 'specs',
      currentValue: currentForm.specs?.floorAreaSqFt ?? '',
      proposedValue: proposedFloorArea,
      normalizedUnit: 'Sq Ft',
      sourceExcerpt: floorAreaExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: currentForm.specs?.floorAreaSqFt === undefined || currentForm.specs.floorAreaSqFt === 0,
    });
  }

  // Contact: Primary Phone
  if (proposedPhone) {
    fields.push({
      fieldKey: 'agent.phone',
      fieldLabel: 'Primary Phone',
      category: 'contact',
      currentValue: currentForm.agent?.phone || '',
      proposedValue: proposedPhone,
      sourceExcerpt: phoneExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: !currentForm.agent?.phone,
    });
  }

  // Media: Map URL
  if (proposedMapUrl) {
    fields.push({
      fieldKey: 'mapUrl',
      fieldLabel: 'Map URL',
      category: 'media',
      currentValue: currentForm.mapUrl || '',
      proposedValue: proposedMapUrl,
      sourceExcerpt: proposedMapUrl,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: !currentForm.mapUrl,
    });
  }

  // Media: Video URL
  if (proposedVideoUrl) {
    fields.push({
      fieldKey: 'videoUrl',
      fieldLabel: 'Video Tour URL',
      category: 'media',
      currentValue: currentForm.videoUrl || '',
      proposedValue: proposedVideoUrl,
      sourceExcerpt: proposedVideoUrl,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: !currentForm.videoUrl,
    });
  }

  // Content: Description
  if (sanitizedText && sanitizedText.length > 20) {
    fields.push({
      fieldKey: 'description',
      fieldLabel: 'Property Description',
      category: 'content',
      currentValue: currentForm.description || '',
      proposedValue: sanitizedText.slice(0, 1200),
      sourceExcerpt: 'Full text sanitized',
      method: 'heuristic',
      confidence: 'medium',
      selectedToApply: !currentForm.description,
    });
  }

  const fieldsFilledCount = fields.filter((f) => f.selectedToApply && !f.isConflict).length;
  const needReviewCount = fields.filter((f) => f.isConflict || f.confidence === 'low' || f.isAmbiguous).length;

  return {
    fields,
    summary: {
      fieldsFilledCount,
      needReviewCount,
      detectedLanguage,
      conflicts,
      ambiguities,
      rawTextLength: rawText.length,
      methodUsed: 'heuristic',
    },
  };
}

/**
 * Merge AI Extracted results into structured FieldExtractionResult list
 */
export function mergeAIResultsWithForm(
  aiResult: AIPropertyParseResponse,
  currentForm: AdminPropertyRecord
): {
  fields: FieldExtractionResult[];
  summary: ParserSummary;
} {
  const fields: FieldExtractionResult[] = [];
  const excerpts = aiResult.analysis?.fieldExcerpts || {};

  // Core: Title
  if (aiResult.title) {
    fields.push({
      fieldKey: 'title',
      fieldLabel: 'Property Title',
      category: 'core',
      currentValue: currentForm.title || '',
      proposedValue: aiResult.title,
      sourceExcerpt: excerpts['title']?.excerpt || aiResult.title,
      method: 'ai',
      confidence: excerpts['title']?.confidence || 'high',
      selectedToApply: true,
    });
  }

  // Core: Purpose
  if (aiResult.purpose) {
    fields.push({
      fieldKey: 'purpose',
      fieldLabel: 'Transaction Purpose',
      category: 'core',
      currentValue: currentForm.purpose,
      proposedValue: aiResult.purpose,
      sourceExcerpt: excerpts['purpose']?.excerpt,
      method: 'ai',
      confidence: excerpts['purpose']?.confidence || 'high',
      selectedToApply: true,
    });
  }

  // Core: Type
  if (aiResult.type) {
    fields.push({
      fieldKey: 'type',
      fieldLabel: 'Property Type',
      category: 'core',
      currentValue: currentForm.type,
      proposedValue: aiResult.type,
      sourceExcerpt: excerpts['type']?.excerpt,
      method: 'ai',
      confidence: excerpts['type']?.confidence || 'high',
      selectedToApply: true,
    });
  }

  // Location: District
  if (aiResult.location?.district) {
    fields.push({
      fieldKey: 'location.district',
      fieldLabel: 'District',
      category: 'location',
      currentValue: currentForm.location?.district || '',
      proposedValue: aiResult.location.district,
      sourceExcerpt: excerpts['district']?.excerpt,
      method: 'ai',
      confidence: excerpts['district']?.confidence || 'high',
      conflictOrAmbiguity: excerpts['district']?.ambiguityMessage,
      selectedToApply: true,
    });
  }

  // Location: City
  if (aiResult.location?.city) {
    fields.push({
      fieldKey: 'location.city',
      fieldLabel: 'City',
      category: 'location',
      currentValue: currentForm.location?.city || '',
      proposedValue: aiResult.location.city,
      sourceExcerpt: excerpts['city']?.excerpt,
      method: 'ai',
      confidence: excerpts['city']?.confidence || 'high',
      selectedToApply: true,
    });
  }

  // Location: Address / Locality
  if (aiResult.location?.address) {
    fields.push({
      fieldKey: 'location.address',
      fieldLabel: 'Address / Locality',
      category: 'location',
      currentValue: currentForm.location?.address || '',
      proposedValue: aiResult.location.address,
      sourceExcerpt: excerpts['address']?.excerpt,
      method: 'ai',
      confidence: 'medium',
      selectedToApply: true,
    });
  }

  // Price: Amount
  if (aiResult.price?.priceLkr !== undefined && aiResult.price.priceLkr !== null) {
    fields.push({
      fieldKey: 'priceLkr',
      fieldLabel: 'Asking Price (LKR)',
      category: 'price',
      currentValue: currentForm.priceLkr || 0,
      proposedValue: aiResult.price.priceLkr,
      normalizedUnit: 'LKR',
      sourceExcerpt: excerpts['price']?.excerpt || aiResult.price.priceDisplay || '',
      method: 'ai',
      confidence: excerpts['price']?.confidence || 'high',
      conflictOrAmbiguity: aiResult.price.calculationNote || excerpts['price']?.ambiguityMessage,
      selectedToApply: true,
    });
  }

  // Price: Unit
  if (aiResult.price?.priceUnit) {
    fields.push({
      fieldKey: 'priceUnit',
      fieldLabel: 'Price Unit',
      category: 'price',
      currentValue: currentForm.priceUnit || 'total',
      proposedValue: aiResult.price.priceUnit as any,
      sourceExcerpt: excerpts['priceUnit']?.excerpt,
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Price: Negotiable
  if (aiResult.price?.isNegotiable !== undefined && aiResult.price.isNegotiable !== null) {
    fields.push({
      fieldKey: 'isNegotiable',
      fieldLabel: 'Price Negotiable',
      category: 'price',
      currentValue: currentForm.isNegotiable || false,
      proposedValue: aiResult.price.isNegotiable,
      sourceExcerpt: excerpts['negotiable']?.excerpt,
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Specs: Bedrooms
  if (aiResult.specs?.bedrooms !== undefined && aiResult.specs.bedrooms !== null) {
    const isConflict = aiResult.analysis?.conflicts.some((c) => /bedroom|bed/i.test(c));
    fields.push({
      fieldKey: 'specs.bedrooms',
      fieldLabel: 'Bedrooms',
      category: 'specs',
      currentValue: currentForm.specs?.bedrooms ?? '',
      proposedValue: aiResult.specs.bedrooms,
      sourceExcerpt: excerpts['bedrooms']?.excerpt,
      method: 'ai',
      confidence: isConflict ? 'low' : excerpts['bedrooms']?.confidence || 'high',
      conflictOrAmbiguity: excerpts['bedrooms']?.ambiguityMessage,
      isConflict,
      selectedToApply: !isConflict,
    });
  }

  // Specs: Bathrooms
  if (aiResult.specs?.bathrooms !== undefined && aiResult.specs.bathrooms !== null) {
    fields.push({
      fieldKey: 'specs.bathrooms',
      fieldLabel: 'Bathrooms',
      category: 'specs',
      currentValue: currentForm.specs?.bathrooms ?? '',
      proposedValue: aiResult.specs.bathrooms,
      sourceExcerpt: excerpts['bathrooms']?.excerpt,
      method: 'ai',
      confidence: excerpts['bathrooms']?.confidence || 'high',
      selectedToApply: true,
    });
  }

  // Specs: Land Perches
  if (aiResult.specs?.landPerches !== undefined && aiResult.specs.landPerches !== null) {
    fields.push({
      fieldKey: 'specs.landPerches',
      fieldLabel: 'Land Extent (Perches)',
      category: 'specs',
      currentValue: currentForm.specs?.landPerches ?? '',
      proposedValue: aiResult.specs.landPerches,
      normalizedUnit: 'Perches',
      sourceExcerpt: excerpts['landPerches']?.excerpt,
      method: 'ai',
      confidence: excerpts['landPerches']?.confidence || 'high',
      selectedToApply: true,
    });
  }

  // Specs: Floor Area (Sq Ft)
  if (aiResult.specs?.floorAreaSqFt !== undefined && aiResult.specs.floorAreaSqFt !== null) {
    fields.push({
      fieldKey: 'specs.floorAreaSqFt',
      fieldLabel: 'Floor Area (Sq Ft)',
      category: 'specs',
      currentValue: currentForm.specs?.floorAreaSqFt ?? '',
      proposedValue: aiResult.specs.floorAreaSqFt,
      normalizedUnit: 'Sq Ft',
      sourceExcerpt: excerpts['floorArea']?.excerpt,
      method: 'ai',
      confidence: excerpts['floorArea']?.confidence || 'high',
      selectedToApply: true,
    });
  }

  // Content: Description
  if (aiResult.content?.description) {
    fields.push({
      fieldKey: 'description',
      fieldLabel: 'Property Description',
      category: 'content',
      currentValue: currentForm.description || '',
      proposedValue: aiResult.content.description,
      sourceExcerpt: 'AI Structured Paragraph',
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Content: Additional Information
  if (aiResult.content?.additionalInfo) {
    fields.push({
      fieldKey: 'additionalInfo',
      fieldLabel: 'Additional Information',
      category: 'content',
      currentValue: currentForm.additionalInfo || '',
      proposedValue: aiResult.content.additionalInfo,
      sourceExcerpt: 'Organized Buyer-Facing Headings',
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Content: Material Specs
  if (aiResult.content?.materialSpecs) {
    fields.push({
      fieldKey: 'materialSpecs',
      fieldLabel: 'Material Specifications',
      category: 'content',
      currentValue: currentForm.materialSpecs || '',
      proposedValue: aiResult.content.materialSpecs,
      sourceExcerpt: 'Explicit Materials Extracted',
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Contact: Primary Phone
  if (aiResult.contact?.primaryPhone) {
    fields.push({
      fieldKey: 'agent.phone',
      fieldLabel: 'Primary Phone',
      category: 'contact',
      currentValue: currentForm.agent?.phone || '',
      proposedValue: aiResult.contact.primaryPhone,
      sourceExcerpt: excerpts['phone']?.excerpt,
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Media: Map URL
  if (aiResult.location?.mapUrl) {
    fields.push({
      fieldKey: 'mapUrl',
      fieldLabel: 'Map URL',
      category: 'media',
      currentValue: currentForm.mapUrl || '',
      proposedValue: aiResult.location.mapUrl,
      sourceExcerpt: aiResult.location.mapUrl,
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Media: Video URL
  if (aiResult.media?.videoUrl) {
    fields.push({
      fieldKey: 'videoUrl',
      fieldLabel: 'Video Tour URL',
      category: 'media',
      currentValue: currentForm.videoUrl || '',
      proposedValue: aiResult.media.videoUrl,
      sourceExcerpt: aiResult.media.videoUrl,
      method: 'ai',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  const fieldsFilledCount = fields.filter((f) => f.selectedToApply && !f.isConflict).length;
  const needReviewCount = (aiResult.analysis?.conflicts?.length || 0) + (aiResult.analysis?.ambiguities?.length || 0);

  return {
    fields,
    summary: {
      fieldsFilledCount,
      needReviewCount,
      detectedLanguage: aiResult.analysis?.detectedLanguage || 'English',
      conflicts: aiResult.analysis?.conflicts || [],
      ambiguities: aiResult.analysis?.ambiguities || [],
      rawTextLength: 0,
      methodUsed: 'ai',
    },
  };
}
