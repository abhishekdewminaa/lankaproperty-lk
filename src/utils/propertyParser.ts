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
CITY_TO_DISTRICT_MAP['mount-lavinia'] = 'Colombo';
CITY_TO_DISTRICT_MAP['moratuwa'] = 'Colombo';
CITY_TO_DISTRICT_MAP['kohuwala'] = 'Colombo';
CITY_TO_DISTRICT_MAP['nugegoda'] = 'Colombo';
CITY_TO_DISTRICT_MAP['maharagama'] = 'Colombo';
CITY_TO_DISTRICT_MAP['orugodawatta'] = 'Colombo';
CITY_TO_DISTRICT_MAP['colombo 14'] = 'Colombo';
CITY_TO_DISTRICT_MAP['talpe'] = 'Galle';
CITY_TO_DISTRICT_MAP['ahangama'] = 'Galle';
CITY_TO_DISTRICT_MAP['unawatuna'] = 'Galle';
CITY_TO_DISTRICT_MAP['induruwa'] = 'Galle';
CITY_TO_DISTRICT_MAP['bentota'] = 'Galle';
CITY_TO_DISTRICT_MAP['benthota'] = 'Galle';
CITY_TO_DISTRICT_MAP['weligama'] = 'Matara';
CITY_TO_DISTRICT_MAP['mirissa'] = 'Matara';
CITY_TO_DISTRICT_MAP['dikwella'] = 'Matara';
CITY_TO_DISTRICT_MAP['peradeniya'] = 'Kandy';
CITY_TO_DISTRICT_MAP['digana'] = 'Kandy';
CITY_TO_DISTRICT_MAP['mahawela'] = 'Matale';
CITY_TO_DISTRICT_MAP['katunayake'] = 'Gampaha';
CITY_TO_DISTRICT_MAP['negombo'] = 'Gampaha';
CITY_TO_DISTRICT_MAP['nilaveli'] = 'Trincomalee';
CITY_TO_DISTRICT_MAP['trincomalee'] = 'Trincomalee';

/**
 * Helper: Extract structured key-value lines from Sri Lankan property portal dumps
 * (e.g., "Property Overview\nLocation\nThambilideniya, Mahawela\nPrice (LKR)\n215,000,000")
 */
function extractOverviewKeyValues(rawText: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const knownKeys = [
    'location',
    'price (lkr)',
    'price',
    'city',
    'district',
    'land area (acres)',
    'land area (perches)',
    'land extent',
    'floor area',
    'rooms',
    'bedrooms',
    'bathrooms',
    'floors',
    'property status',
    'furnished/unfurnished',
    'year of construction',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Check "Key: Value" or "Key – Value" on single line
    const inlineMatch = line.match(/^([^:–\-]{2,35})[:–]\s*(.+)$/);
    if (inlineMatch) {
      const k = inlineMatch[1].trim().toLowerCase();
      const v = inlineMatch[2].trim();
      if (knownKeys.some((known) => k === known || k.startsWith(known))) {
        result[k] = v;
        continue;
      }
    }

    // Check exact 2-line pair ("District\nMatale")
    if (knownKeys.includes(lineLower) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (!knownKeys.includes(nextLine.toLowerCase())) {
        result[lineLower] = nextLine;
        i++;
      }
    }
  }

  return result;
}

/**
 * Helper: Split raw listing dump into clean Description prose & formatted Additional Information
 */
function stripEmojiSymbols(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}✔✅✓☑️⭐✨🔥💎📍🏡🏠🏢📞☎️💰💵🏷️🔹🔸▪️▫️►▸]/gu, '')
    .replace(/[ \t]{2,}/g, ' ');
}

function splitListingSections(rawText: string): {
  titleCandidate: string | null;
  listingRef: string | null;
  cleanDescription: string;
  cleanAdditionalInfo: string;
} {
  const normalized = stripEmojiSymbols(rawText.replace(/\\n/g, '\n').replace(/\r\n/g, '\n')).trim();
  const lines = normalized.split('\n').map((l) => l.trim());

  // Extract Reference Code like (LK-000286)
  const refMatch = normalized.match(/\((LK-\d{4,})\)|\b(LK-\d{4,})\b/i);
  const listingRef = refMatch ? (refMatch[1] || refMatch[2]).toUpperCase() : null;

  // Title Candidate: First non-empty line under 180 chars (excluding section headers)
  const firstNonEmpty = lines.find((l) => l.length > 0) || '';
  const isHeaderLine = /^(property description|property overview|additional information)/i.test(firstNonEmpty);
  const titleCandidate =
    firstNonEmpty && !isHeaderLine && firstNonEmpty.length < 180 && !firstNonEmpty.includes('http')
      ? firstNonEmpty
      : null;

  // Locate major section headers
  const descHeaderIdx = normalized.search(/(?:^|\n)\s*Property Description\s*(?:\n|$)/i);
  const overviewHeaderIdx = normalized.search(/(?:^|\n)\s*Property Overview\s*(?:\n|$)/i);
  const addInfoHeaderIdx = normalized.search(/(?:^|\n)\s*Additional Information\s*(?:\n|$)/i);

  let cleanDescription = '';
  if (descHeaderIdx !== -1) {
    const start = normalized.indexOf('\n', descHeaderIdx + 1);
    const bodyStart = start !== -1 ? start + 1 : descHeaderIdx + 'Property Description'.length;
    const end =
      overviewHeaderIdx > bodyStart
        ? overviewHeaderIdx
        : addInfoHeaderIdx > bodyStart
        ? addInfoHeaderIdx
        : normalized.length;
    cleanDescription = normalized.slice(bodyStart, end).trim();
  } else if (overviewHeaderIdx !== -1) {
    // Take prose between title and Property Overview
    const afterTitle = titleCandidate ? normalized.indexOf(titleCandidate) + titleCandidate.length : 0;
    cleanDescription = normalized.slice(afterTitle, overviewHeaderIdx).trim();
  } else {
    cleanDescription = titleCandidate
      ? normalized.slice(normalized.indexOf(titleCandidate) + titleCandidate.length).trim()
      : normalized;
  }

  // Strip standalone (LK-000xxx) reference line from description prose
  cleanDescription = cleanDescription
    .replace(/^\s*\(LK-\d+\)\s*/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  let cleanAdditionalInfo = '';
  if (addInfoHeaderIdx !== -1) {
    const start = normalized.indexOf('\n', addInfoHeaderIdx + 1);
    const bodyStart = start !== -1 ? start + 1 : addInfoHeaderIdx + 'Additional Information'.length;
    cleanAdditionalInfo = normalized
      .slice(bodyStart)
      .replace(/^\s*~\s*/gm, '• ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return {
    titleCandidate,
    listingRef,
    cleanDescription,
    cleanAdditionalInfo,
  };
}

/**
 * Stage A: Instant Heuristic Parser
 * Deterministic regex and pattern extraction for Sri Lankan property dumps.
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

  const overview = extractOverviewKeyValues(rawText);
  const sections = splitListingSections(rawText);

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
  const purposeConfidence: ExtractionConfidence = 'high';

  if (
    /\b(?:for rent|rental|monthly rent|to let|lease|කුලියට|வாடகைக்கு)\b/i.test(rawText) ||
    /\b(?:per month|\/month|p\.m\.|pm)\b/i.test(rawText)
  ) {
    proposedPurpose = 'rent';
    proposedPriceUnit = 'month';
    const match = rawText.match(/\b(?:for rent|rental|to let|lease|කුලියට|per month|\/month)\b/i);
    purposeExcerpt = match ? match[0] : 'Rent keyword';
  } else if (/\b(?:for sale|sale|selling|විකිණීමට|விற்பனைக்கு)\b/i.test(rawText)) {
    proposedPurpose = 'buy';
    proposedPriceUnit = 'total';
    const match = rawText.match(/\b(?:for sale|sale|selling|විකිණීමට|விற்பனைக்கு)\b/i);
    purposeExcerpt = match ? match[0] : 'Sale keyword';
  } else if (
    /\b(?:bare land|land for sale|perch price|per perch|\/perch|පර්චස් එකක්|காணி விற்பனை)\b/i.test(rawText)
  ) {
    proposedPurpose = 'land';
    proposedPriceUnit = 'perch';
    const match = rawText.match(/\b(?:bare land|land for sale|per perch|\/perch)\b/i);
    purposeExcerpt = match ? match[0] : 'Land keyword';
  }

  // 2. Property Category / Type (Check Headline/Overview first so "Land for Sale... ideal for building a house" stays Land)
  let proposedType: 'house' | 'apartment' | 'land' | 'hotel' | 'business' | null = null;
  let typeExcerpt = '';
  const overviewType = (overview['property type'] || overview['category'] || overview['type'] || '').toLowerCase();
  const headlineText = `${overviewType} ${sections.titleCandidate || ''} ${rawText.split(/\r?\n/).slice(0, 2).join(' ')}`;
  const titleAndStart = `${sections.titleCandidate || ''} ${rawText.slice(0, 350)}`;

  const detectCategoryFromSegment = (seg: string): { type: 'house' | 'apartment' | 'land' | 'hotel' | 'business'; excerpt: string } | null => {
    const landMatch = seg.match(/\b(?:bare land|residential land|commercial land|agricultural land|paddy land|tea estate|coconut estate|rubber estate|beachfront land|land|plot|plots|ඉඩම|காணி)\b/i);
    const aptMatch = seg.match(/\b(?:apartment|condo|condominium|residencies|flat|penthouse|ඇපාර්ට්මන්ට්|அபார்ட்மெண்ட்)\b/i);
    const hotelMatch = seg.match(/\b(?:boutique hotel|guest house|guesthouse|hotel|resort|cabana|eco lodge)\b/i);
    const bizMatch = seg.match(/\b(?:commercial|office building|factory|warehouse|showroom|shop|වාණිජ)\b/i);
    const houseMatch = seg.match(/\b(?:villa|house|bungalow|residence|mansion|නිවස|வீடு)\b/i);

    if (landMatch && !aptMatch && !houseMatch && !hotelMatch) {
      return { type: 'land', excerpt: landMatch[0] };
    }
    if (aptMatch) return { type: 'apartment', excerpt: aptMatch[0] };
    if (hotelMatch) return { type: 'hotel', excerpt: hotelMatch[0] };
    if (bizMatch && !landMatch) return { type: 'business', excerpt: bizMatch[0] };
    if (houseMatch) return { type: 'house', excerpt: houseMatch[0] };
    if (landMatch) return { type: 'land', excerpt: landMatch[0] };
    return null;
  };

  const detected = detectCategoryFromSegment(headlineText) || detectCategoryFromSegment(titleAndStart);
  if (detected) {
    proposedType = detected.type;
    typeExcerpt = detected.excerpt;
  }

  // 3. Currency and Valuation Extraction
  let proposedPrice: number | null = null;
  let priceExcerpt = '';
  const priceConfidence: ExtractionConfidence = 'high';
  let calculationNote: string | undefined = undefined;

  // Priority A: Explicit "Total Asking Price: LKR 575 Million"
  const totalAskingMatch = rawText.match(
    /Total\s+Asking\s+Price\s*:\s*(?:LKR|Rs\.?)?\s*([\d,]+(?:\.\d+)?)\s*(Million|Mn|Crores?|Lakhs?)?/i
  );

  // Priority B: Overview Price ("Price (LKR)\n215,000,000" or "58,000,000 Whole property")
  const overviewPriceRaw = overview['price (lkr)'] || overview['price'] || '';
  const overviewPriceNumMatch = overviewPriceRaw.match(/([\d,]{5,})/);

  // Priority C: Per-perch / Lakhs / Crores / Millions / Rs.
  const perPerchMatch = rawText.match(
    /(?:rs\.?|lkr)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|mn|million)?\s*(?:per\s*perch|\/perch|\/p\b|pp\b)/i
  );
  const lakhsMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|ලක්ෂ)\b/i);
  const croreMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:crores?|කෝටි)\b/i);
  const millionMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:million|mn|මිලියන)\b/i);
  const plainRsMatch = rawText.match(/(?:rs\.?|lkr)\s*([\d,]{4,})/i);

  if (totalAskingMatch) {
    const rawNum = parseFloat(totalAskingMatch[1].replace(/,/g, ''));
    const unit = (totalAskingMatch[2] || '').toLowerCase();
    if (!isNaN(rawNum)) {
      if (unit.startsWith('m')) proposedPrice = Math.round(rawNum * 1000000);
      else if (unit.startsWith('c')) proposedPrice = Math.round(rawNum * 10000000);
      else if (unit.startsWith('l')) proposedPrice = Math.round(rawNum * 100000);
      else proposedPrice = Math.round(rawNum);
      proposedPriceUnit = 'total';
      priceExcerpt = totalAskingMatch[0];
      calculationNote = `Total asking price extracted: Rs. ${proposedPrice.toLocaleString()}`;
    }
  } else if (overviewPriceNumMatch) {
    const cleanNum = parseFloat(overviewPriceNumMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanNum) && cleanNum > 10000) {
      proposedPrice = cleanNum;
      proposedPriceUnit = 'total';
      priceExcerpt = `Overview Price: ${overviewPriceRaw}`;
    }
  } else if (millionMatch) {
    const val = parseFloat(millionMatch[1]);
    if (!isNaN(val)) {
      proposedPrice = Math.round(val * 1000000);
      priceExcerpt = millionMatch[0];
      calculationNote = `${val} Million = Rs. ${proposedPrice.toLocaleString()}`;
    }
  } else if (croreMatch) {
    const val = parseFloat(croreMatch[1]);
    if (!isNaN(val)) {
      proposedPrice = Math.round(val * 10000000);
      priceExcerpt = croreMatch[0];
      calculationNote = `${val} Crore = Rs. ${proposedPrice.toLocaleString()}`;
    }
  } else if (lakhsMatch) {
    const val = parseFloat(lakhsMatch[1]);
    if (!isNaN(val)) {
      proposedPrice = Math.round(val * 100000);
      priceExcerpt = lakhsMatch[0];
      calculationNote = `${val} Lakhs = Rs. ${proposedPrice.toLocaleString()}`;
    }
  } else if (perPerchMatch) {
    const rawVal = parseFloat(perPerchMatch[1].replace(/,/g, ''));
    if (!isNaN(rawVal)) {
      if (/lakh|lac/i.test(perPerchMatch[0])) proposedPrice = rawVal * 100000;
      else if (/mn|million/i.test(perPerchMatch[0])) proposedPrice = rawVal * 1000000;
      else proposedPrice = rawVal;
      proposedPriceUnit = 'perch';
      priceExcerpt = perPerchMatch[0];
      calculationNote = `Stated rate: Rs. ${proposedPrice.toLocaleString()} per perch.`;
    }
  } else if (plainRsMatch) {
    const cleanNum = parseFloat(plainRsMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanNum) && cleanNum > 1000 && cleanNum < 0x7ffffffff) {
      proposedPrice = cleanNum;
      priceExcerpt = plainRsMatch[0];
    }
  }

  // Negotiable detection
  const isNegotiable = /\b(?:negotiable|neg\b|මිල සාකච්ඡා කරගත හැක|பேசித் தீர்மானிக்கலாம்)\b/i.test(rawText);

  // 4. Bedrooms & Bathrooms
  let proposedBedrooms: number | null = null;
  let bedExcerpt = '';
  let bedConfidence: ExtractionConfidence = 'high';
  let bedConflict: string | undefined = undefined;

  const wordToNumMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const contraMatch = rawText.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*\(\s*(\d+)\s*\)\s*(?:bed|bedroom)/i);
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
    if (overview['rooms'] && /^\d+$/.test(overview['rooms'])) {
      proposedBedrooms = parseInt(overview['rooms'], 10);
      bedExcerpt = `Rooms: ${overview['rooms']}`;
    } else if (overview['bedrooms'] && /^\d+$/.test(overview['bedrooms'])) {
      proposedBedrooms = parseInt(overview['bedrooms'], 10);
      bedExcerpt = `Bedrooms: ${overview['bedrooms']}`;
    } else {
      const bedMatch = rawText.match(/(\d+)\s*(?:bed|beds|bedrooms?|b\/r|කාමර)\b/i);
      if (bedMatch) {
        proposedBedrooms = parseInt(bedMatch[1], 10);
        bedExcerpt = bedMatch[0];
      }
    }
  }

  let proposedBathrooms: number | null = null;
  let bathExcerpt = '';
  if (overview['bathrooms'] && /^\d+$/.test(overview['bathrooms'])) {
    proposedBathrooms = parseInt(overview['bathrooms'], 10);
    bathExcerpt = `Bathrooms: ${overview['bathrooms']}`;
  } else {
    const bathMatch = rawText.match(/(\d+)\s*(?:bath|baths|bathrooms?|washrooms?|නාන කාමර)\b/i);
    if (bathMatch) {
      proposedBathrooms = parseInt(bathMatch[1], 10);
      bathExcerpt = bathMatch[0];
    }
  }

  // 5. Land Extent (Perches & Acres)
  let proposedPerches: number | null = null;
  let proposedAcres: number | null = null;
  let landExcerpt = '';

  if (overview['land area (acres)']) {
    const aVal = parseFloat(overview['land area (acres)'].replace(/[^0-9.]/g, ''));
    if (!isNaN(aVal)) {
      proposedAcres = aVal;
      proposedPerches = Math.round(aVal * 160);
      landExcerpt = `Land Area (Acres): ${aVal}`;
    }
  } else if (overview['land area (perches)']) {
    const pVal = parseFloat(overview['land area (perches)'].replace(/[^0-9.]/g, ''));
    if (!isNaN(pVal)) {
      proposedPerches = pVal;
      landExcerpt = `Land Area (Perches): ${pVal}`;
    }
  } else {
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
  }

  // 6. Floor Area (Sq Ft)
  let proposedFloorArea: number | null = null;
  let floorAreaExcerpt = '';
  if (overview['floor area']) {
    const numMatch = overview['floor area'].replace(/,/g, '').match(/(\d+)/);
    if (numMatch) {
      proposedFloorArea = parseInt(numMatch[1], 10);
      floorAreaExcerpt = `Floor Area: ${overview['floor area']}`;
    }
  } else {
    const sqftMatch = rawText.match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|square\s*feet|වර්ග අඩි)\b/i);
    if (sqftMatch) {
      const cleanSqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(cleanSqft) && cleanSqft > 50) {
        proposedFloorArea = cleanSqft;
        floorAreaExcerpt = sqftMatch[0];
      }
    }
  }

  // 7. Extra Specs: Furnishing, Year Built, Parking Spaces
  let proposedFurnishing: 'Furnished' | 'Semi-Furnished' | 'Unfurnished' | null = null;
  if (/\bsemi[\s\-]?furnished\b/i.test(rawText)) proposedFurnishing = 'Semi-Furnished';
  else if (/\bunfurnished\b/i.test(rawText)) proposedFurnishing = 'Unfurnished';
  else if (/\b(?:fully\s+)?furnished\b/i.test(rawText)) proposedFurnishing = 'Furnished';

  let proposedYearBuilt: number | null = null;
  const yearMatch = rawText.match(/(?:year of construction|built in|year built)\s*[:–\-]?\s*(?:19|20)\d{2}(?:\/((?:19|20)?\d{2,4}))?/i);
  if (yearMatch) {
    const allYears = yearMatch[0].match(/(?:19|20)\d{2}/g);
    if (allYears && allYears.length > 0) {
      proposedYearBuilt = parseInt(allYears[allYears.length - 1], 10);
    }
  }

  let proposedParking: number | null = null;
  const parkingMatch = rawText.match(/(?:parking\s*slots?|vehicle\s*parking|cars?)\s*[:–\-]?\s*(?:approximately\s*)?(\d+)\b|(\d+)\s*(?:car\s*slots?|parking\s*slots?|cars)\b/i);
  if (parkingMatch) {
    const val = parseInt(parkingMatch[1] || parkingMatch[2], 10);
    if (!isNaN(val) && val > 0 && val < 500) {
      proposedParking = val;
    }
  }

  // 8. Location Detection (Explicit Overview fields first, then fallback scan)
  let proposedDistrict: string | null = null;
  let proposedCity: string | null = null;
  const proposedAddress: string | null = overview['location'] || null;
  let locationExcerpt = '';
  let districtSuggestionNote: string | undefined = undefined;

  if (overview['district']) {
    const matchedDistrict = SRI_LANKA_DISTRICTS.find(
      (d) => d.district.toLowerCase() === overview['district'].toLowerCase()
    );
    if (matchedDistrict) {
      proposedDistrict = matchedDistrict.district;
      locationExcerpt = `District: ${matchedDistrict.district}`;
    }
  }

  if (overview['city']) {
    proposedCity = overview['city'].replace(/benthota/i, 'Bentota');
    locationExcerpt = locationExcerpt || `City: ${proposedCity}`;
  }

  if (!proposedDistrict) {
    for (const d of SRI_LANKA_DISTRICTS) {
      const dRegex = new RegExp(`\\b${d.district}\\b`, 'i');
      if (dRegex.test(rawText)) {
        proposedDistrict = d.district;
        locationExcerpt = d.district;
        break;
      }
    }
  }

  if (!proposedCity) {
    for (const [cityKey, mappedDistrict] of Object.entries(CITY_TO_DISTRICT_MAP)) {
      const cRegex = new RegExp(`\\b${cityKey}\\b`, 'i');
      if (cRegex.test(rawText)) {
        proposedCity = cityKey
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        locationExcerpt = locationExcerpt || proposedCity;

        if (!proposedDistrict) {
          proposedDistrict = mappedDistrict;
          districtSuggestionNote = `Suggested "${mappedDistrict}" based on detected city "${proposedCity}".`;
        }
        break;
      }
    }
  }

  // 9. Amenities Detection
  const detectedAmenities: string[] = [];
  const amenityMatchers: [RegExp, string][] = [
    [/\bswimming\s*pool|infinity\s*pool|\bpool\b/i, 'Swimming Pool'],
    [/\bsolar\s*power|solar\s*pv\b/i, 'Solar Power'],
    [/\bair\s*condition|\bac['’]?s?\b/i, 'Air Conditioning'],
    [/\bgym|gymnasium\b/i, 'Gymnasium'],
    [/\b24[\s\-]?hour\s*security|security\b/i, '24-Hour Security'],
    [/\bcctv\b/i, 'CCTV Surveillance'],
    [/\bbackup\s*power|generator\b/i, 'Backup Power'],
    [/\belevator|lift\b/i, 'High-Speed Elevators'],
    [/\bsea\s*view|ocean\s*view|beach\/sea\s*view\b/i, 'Ocean / Sea View'],
    [/\bmountain\s*view\b/i, 'Mountain View'],
    [/\bgarden|lawn\b/i, 'Landscaped Garden'],
    [/\bparking\b/i, 'Private Parking'],
  ];
  amenityMatchers.forEach(([regex, label]) => {
    if (regex.test(rawText)) detectedAmenities.push(label);
  });

  // 10. Telephone Number Extraction
  let proposedPhone: string | null = null;
  let phoneExcerpt = '';
  const phoneRegex = /(?:\+94|0094|0)\s*(?:7[0-9]|11|21|23|24|25|26|27|31|32|33|34|35|36|37|38|41|45|47|51|52|54|55|57|63|65|66|67|81|91)[\s\-]*[0-9]{3}[\s\-]*[0-9]{4}/g;
  const phoneMatches = rawText.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    proposedPhone = phoneMatches[0].trim();
    phoneExcerpt = proposedPhone;
  }

  // 11. Map & Video URLs
  const mapMatch = rawText.match(/https?:\/\/(?:maps\.google\.com|goo\.gl\/maps|maps\.app\.goo\.gl)[\S]+/i);
  const proposedMapUrl = mapMatch ? mapMatch[0] : null;
  const videoMatch = rawText.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)[\w\-]+/i);
  const proposedVideoUrl = videoMatch ? videoMatch[0] : null;

  // Assemble Field Extraction Results
  if (sections.titleCandidate) {
    fields.push({
      fieldKey: 'title',
      fieldLabel: 'Property Title',
      category: 'core',
      currentValue: currentForm.title || '',
      proposedValue: sections.titleCandidate,
      sourceExcerpt: sections.titleCandidate,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  if (sections.listingRef) {
    fields.push({
      fieldKey: 'listingRef',
      fieldLabel: 'Listing Reference',
      category: 'core',
      currentValue: currentForm.listingRef || '',
      proposedValue: sections.listingRef,
      sourceExcerpt: sections.listingRef,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

  if (proposedAddress) {
    fields.push({
      fieldKey: 'location.address',
      fieldLabel: 'Street / Locality Address',
      category: 'location',
      currentValue: currentForm.location?.address || '',
      proposedValue: proposedAddress,
      sourceExcerpt: `Location: ${proposedAddress}`,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  const hasExtractedPrice = proposedPrice !== null && proposedPrice > 0;
  const explicitlyFixedPrice = /\b(?:non[- ]?negotiable|fixed price|strictly fixed)\b/i.test(rawText);

  if (hasExtractedPrice) {
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
      conflictOrAmbiguity: calculationNote,
      selectedToApply: true,
    });
  } else {
    fields.push({
      fieldKey: 'priceLkr',
      fieldLabel: 'Asking Price (LKR)',
      category: 'price',
      currentValue: currentForm.priceLkr || 0,
      proposedValue: 0,
      normalizedUnit: 'LKR',
      sourceExcerpt: 'No price listed — Price on Request',
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

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

  fields.push({
    fieldKey: 'isNegotiable',
    fieldLabel: 'Price Negotiable',
    category: 'price',
    currentValue: Boolean(currentForm.isNegotiable),
    proposedValue: explicitlyFixedPrice ? false : true,
    sourceExcerpt: isNegotiable ? 'Negotiable stated in text' : 'Default negotiable enabled',
    method: 'heuristic',
    confidence: 'high',
    selectedToApply: true,
  });

  fields.push({
    fieldKey: 'priceOnRequest',
    fieldLabel: 'Price on Request',
    category: 'price',
    currentValue: Boolean(currentForm.priceOnRequest),
    proposedValue: !hasExtractedPrice,
    sourceExcerpt: hasExtractedPrice ? 'Price provided' : 'No price found — Price on Request enabled',
    method: 'heuristic',
    confidence: 'high',
    selectedToApply: true,
  });

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
      selectedToApply: !bedConflict,
    });
  }

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
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

  if (proposedAcres !== null) {
    fields.push({
      fieldKey: 'specs.landAcres',
      fieldLabel: 'Land Extent (Acres)',
      category: 'specs',
      currentValue: currentForm.specs?.landAcres ?? '',
      proposedValue: proposedAcres,
      normalizedUnit: 'Acres',
      sourceExcerpt: landExcerpt,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

  if (proposedFurnishing) {
    fields.push({
      fieldKey: 'specs.furnishing',
      fieldLabel: 'Furnishing',
      category: 'specs',
      currentValue: currentForm.specs?.furnishing || '',
      proposedValue: proposedFurnishing,
      sourceExcerpt: proposedFurnishing,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  if (proposedYearBuilt) {
    fields.push({
      fieldKey: 'specs.yearBuilt',
      fieldLabel: 'Year Built',
      category: 'specs',
      currentValue: currentForm.specs?.yearBuilt ?? '',
      proposedValue: proposedYearBuilt,
      sourceExcerpt: `Built ${proposedYearBuilt}`,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  if (proposedParking) {
    fields.push({
      fieldKey: 'specs.parkingSpaces',
      fieldLabel: 'Parking Spaces',
      category: 'specs',
      currentValue: currentForm.specs?.parkingSpaces ?? '',
      proposedValue: proposedParking,
      sourceExcerpt: `${proposedParking} parking slots`,
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  if (detectedAmenities.length > 0) {
    fields.push({
      fieldKey: 'amenities',
      fieldLabel: 'Detected Amenities',
      category: 'specs',
      currentValue: (currentForm.amenities || []).join(', '),
      proposedValue: detectedAmenities,
      sourceExcerpt: detectedAmenities.join(', '),
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

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
      selectedToApply: true,
    });
  }

  // Content: Clean Description (without raw Overview table lines)
  if (sections.cleanDescription && sections.cleanDescription.length > 20) {
    fields.push({
      fieldKey: 'description',
      fieldLabel: 'Property Description',
      category: 'content',
      currentValue: currentForm.description || '',
      proposedValue: sections.cleanDescription.slice(0, 2000),
      sourceExcerpt: 'Clean overview prose extracted',
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
    });
  }

  // Content: Structured Additional Information
  if (sections.cleanAdditionalInfo && sections.cleanAdditionalInfo.length > 20) {
    fields.push({
      fieldKey: 'additionalInfo',
      fieldLabel: 'Additional Information',
      category: 'content',
      currentValue: currentForm.additionalInfo || '',
      proposedValue: sections.cleanAdditionalInfo.slice(0, 4000),
      sourceExcerpt: 'Additional Information section formatted',
      method: 'heuristic',
      confidence: 'high',
      selectedToApply: true,
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

  if (aiResult.type) {
    const normalizedAiType = aiResult.type === 'commercial' ? 'business' : aiResult.type;
    fields.push({
      fieldKey: 'type',
      fieldLabel: 'Property Type',
      category: 'core',
      currentValue: currentForm.type,
      proposedValue: normalizedAiType,
      sourceExcerpt: excerpts['type']?.excerpt,
      method: 'ai',
      confidence: excerpts['type']?.confidence || 'high',
      selectedToApply: true,
    });
  }

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

  const aiHasPrice = Boolean(aiResult.price?.priceLkr && aiResult.price.priceLkr > 0);
  fields.push({
    fieldKey: 'isNegotiable',
    fieldLabel: 'Price Negotiable',
    category: 'price',
    currentValue: Boolean(currentForm.isNegotiable),
    proposedValue: aiResult.price?.isNegotiable !== undefined && aiResult.price.isNegotiable !== null
      ? aiResult.price.isNegotiable
      : true,
    sourceExcerpt: excerpts['negotiable']?.excerpt || 'Default negotiable enabled',
    method: 'ai',
    confidence: 'high',
    selectedToApply: true,
  });

  fields.push({
    fieldKey: 'priceOnRequest',
    fieldLabel: 'Price on Request',
    category: 'price',
    currentValue: Boolean(currentForm.priceOnRequest),
    proposedValue: !aiHasPrice,
    sourceExcerpt: aiHasPrice ? 'Price provided' : 'No price found — Price on Request enabled',
    method: 'ai',
    confidence: 'high',
    selectedToApply: true,
  });

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
