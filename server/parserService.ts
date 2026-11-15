import { GoogleGenAI, Type } from '@google/genai';
import { SRI_LANKA_DISTRICTS } from '../src/data/locations';
import { AIPropertyParseResponse, ExtractionConfidence } from '../src/types/propertyParser';

// Validated list of known Sri Lankan districts
const VALID_DISTRICTS = new Set(SRI_LANKA_DISTRICTS.map((d) => d.district.toLowerCase()));

// Validated list of known cities
const VALID_CITIES = new Set<string>();
SRI_LANKA_DISTRICTS.forEach((d) => {
  d.cities.forEach((c) => VALID_CITIES.add(c.toLowerCase()));
});

export interface ParseOptions {
  text: string;
  apiKey?: string;
  model?: string;
  userRole?: string;
}

/**
 * Validate and sanitize unstructured prompt text to prevent prompt injection or denial of service
 */
export function sanitizeInputText(input: string): string {
  if (typeof input !== 'string') return '';
  // Trim and limit to 15,000 characters
  let sanitized = input.trim().slice(0, 15000);
  // Remove dangerous control characters (except common whitespace)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return sanitized;
}

/**
 * Server-side runtime schema validator for Gemini response
 */
export function validateAndNormalizeAIResponse(data: any): AIPropertyParseResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response structure: expected JSON object');
  }

  // Purpose validation
  let purpose: 'buy' | 'rent' | 'land' | undefined;
  if (['buy', 'rent', 'land'].includes(data.purpose)) {
    purpose = data.purpose;
  }

  // Type validation
  let type: 'house' | 'apartment' | 'land' | 'commercial' | undefined;
  if (['house', 'apartment', 'land', 'commercial'].includes(data.type)) {
    type = data.type;
  }

  // Location validation
  const locRaw = data.location || {};
  let district: string | undefined;
  if (typeof locRaw.district === 'string' && locRaw.district.trim()) {
    const cleanedDistrict = locRaw.district.trim();
    if (VALID_DISTRICTS.has(cleanedDistrict.toLowerCase())) {
      const match = SRI_LANKA_DISTRICTS.find(
        (d) => d.district.toLowerCase() === cleanedDistrict.toLowerCase()
      );
      district = match ? match.district : cleanedDistrict;
    }
  }

  let city: string | undefined;
  if (typeof locRaw.city === 'string' && locRaw.city.trim()) {
    city = locRaw.city.trim().slice(0, 100);
  }

  let address: string | undefined;
  if (typeof locRaw.address === 'string' && locRaw.address.trim()) {
    address = locRaw.address.trim().slice(0, 250);
  }

  let latitude: number | undefined;
  if (typeof locRaw.latitude === 'number' && locRaw.latitude >= 5.5 && locRaw.latitude <= 10.0) {
    latitude = locRaw.latitude;
  }

  let longitude: number | undefined;
  if (typeof locRaw.longitude === 'number' && locRaw.longitude >= 79.5 && locRaw.longitude <= 82.5) {
    longitude = locRaw.longitude;
  }

  // Price validation
  const priceRaw = data.price || {};
  let priceLkr: number | undefined;
  if (typeof priceRaw.priceLkr === 'number' && priceRaw.priceLkr > 0 && priceRaw.priceLkr < 100_000_000_000) {
    priceLkr = Math.round(priceRaw.priceLkr);
  }

  let priceUnit: 'total' | 'perch' | 'month' | 'per_year' = 'total';
  if (['total', 'perch', 'month', 'per_year'].includes(priceRaw.priceUnit)) {
    priceUnit = priceRaw.priceUnit;
  }

  // Specs validation
  const specsRaw = data.specs || {};
  const specs: AIPropertyParseResponse['specs'] = {};
  if (typeof specsRaw.bedrooms === 'number' && specsRaw.bedrooms >= 0 && specsRaw.bedrooms <= 100) {
    specs.bedrooms = Math.round(specsRaw.bedrooms);
  }
  if (typeof specsRaw.bathrooms === 'number' && specsRaw.bathrooms >= 0 && specsRaw.bathrooms <= 100) {
    specs.bathrooms = Math.round(specsRaw.bathrooms);
  }
  if (typeof specsRaw.floorAreaSqFt === 'number' && specsRaw.floorAreaSqFt > 0 && specsRaw.floorAreaSqFt <= 1_000_000) {
    specs.floorAreaSqFt = Math.round(specsRaw.floorAreaSqFt);
  }
  if (typeof specsRaw.landPerches === 'number' && specsRaw.landPerches > 0 && specsRaw.landPerches <= 100_000) {
    specs.landPerches = Number(specsRaw.landPerches.toFixed(2));
  }
  if (typeof specsRaw.landAcres === 'number' && specsRaw.landAcres > 0 && specsRaw.landAcres <= 10_000) {
    specs.landAcres = Number(specsRaw.landAcres.toFixed(2));
  }
  if (['Unfurnished', 'Semi-Furnished', 'Fully Furnished'].includes(specsRaw.furnishing)) {
    specs.furnishing = specsRaw.furnishing;
  }
  if (typeof specsRaw.parkingSpaces === 'number' && specsRaw.parkingSpaces >= 0 && specsRaw.parkingSpaces <= 100) {
    specs.parkingSpaces = Math.round(specsRaw.parkingSpaces);
  }

  // Content validation
  const contentRaw = data.content || {};
  const content: AIPropertyParseResponse['content'] = {
    description: typeof contentRaw.description === 'string' ? contentRaw.description.trim().slice(0, 10000) : '',
    additionalInfo: typeof contentRaw.additionalInfo === 'string' ? contentRaw.additionalInfo.trim().slice(0, 8000) : '',
    materialSpecs: typeof contentRaw.materialSpecs === 'string' ? contentRaw.materialSpecs.trim().slice(0, 4000) : '',
    amenities: Array.isArray(contentRaw.amenities)
      ? contentRaw.amenities
          .filter((a: any) => typeof a === 'string' && a.trim().length > 0)
          .map((a: string) => a.trim().slice(0, 80))
          .slice(0, 30)
      : [],
  };

  // Contact validation
  const contactRaw = data.contact || {};
  const contact: AIPropertyParseResponse['contact'] = {
    primaryPhone: typeof contactRaw.primaryPhone === 'string' ? contactRaw.primaryPhone.trim().slice(0, 30) : undefined,
    secondaryPhone: typeof contactRaw.secondaryPhone === 'string' ? contactRaw.secondaryPhone.trim().slice(0, 30) : undefined,
    contactName: typeof contactRaw.contactName === 'string' ? contactRaw.contactName.trim().slice(0, 100) : undefined,
  };

  // Analysis validation
  const analysisRaw = data.analysis || {};
  const fieldExcerpts: Record<string, { excerpt: string; confidence: ExtractionConfidence }> = {};
  if (analysisRaw.fieldExcerpts && typeof analysisRaw.fieldExcerpts === 'object') {
    Object.entries(analysisRaw.fieldExcerpts).forEach(([key, val]: [string, any]) => {
      if (val && typeof val === 'object') {
        const conf: ExtractionConfidence = ['high', 'medium', 'low'].includes(val.confidence)
          ? val.confidence
          : 'medium';
        fieldExcerpts[key] = {
          excerpt: typeof val.excerpt === 'string' ? val.excerpt.slice(0, 200) : '',
          confidence: conf,
        };
      }
    });
  }

  const analysis: AIPropertyParseResponse['analysis'] = {
    detectedLanguage: typeof analysisRaw.detectedLanguage === 'string' ? analysisRaw.detectedLanguage.slice(0, 50) : 'English',
    conflicts: Array.isArray(analysisRaw.conflicts)
      ? analysisRaw.conflicts.filter((c: any) => typeof c === 'string').map((c: string) => c.slice(0, 200))
      : [],
    ambiguities: Array.isArray(analysisRaw.ambiguities)
      ? analysisRaw.ambiguities.filter((a: any) => typeof a === 'string').map((a: string) => a.slice(0, 200))
      : [],
    missingCriticalInfo: Array.isArray(analysisRaw.missingCriticalInfo)
      ? analysisRaw.missingCriticalInfo.filter((m: any) => typeof m === 'string').map((m: string) => m.slice(0, 200))
      : [],
    fieldExcerpts,
  };

  return {
    title: typeof data.title === 'string' ? data.title.trim().slice(0, 200) : undefined,
    purpose,
    type,
    location: {
      district,
      city,
      address,
      latitude,
      longitude,
    },
    price: {
      priceLkr,
      priceUnit,
      priceDisplay: typeof priceRaw.priceDisplay === 'string' ? priceRaw.priceDisplay.slice(0, 80) : undefined,
      isNegotiable: Boolean(priceRaw.isNegotiable),
      priceOnRequest: Boolean(priceRaw.priceOnRequest),
      calculationNote: typeof priceRaw.calculationNote === 'string' ? priceRaw.calculationNote.slice(0, 250) : undefined,
    },
    specs,
    content,
    contact,
    media: {
      videoUrl: typeof data.media?.videoUrl === 'string' ? data.media.videoUrl.slice(0, 500) : undefined,
    },
    analysis,
  };
}

/**
 * Execute AI extraction with Gemini
 */
export async function parsePropertyWithAI(options: ParseOptions): Promise<AIPropertyParseResponse> {
  const sanitizedText = sanitizeInputText(options.text);
  if (!sanitizedText) {
    throw new Error('Property text is empty or invalid.');
  }

  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error: any = new Error('GEMINI_API_KEY is not configured on the server.');
    error.status = 503;
    throw error;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const model = options.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const systemInstruction = `You are a senior Sri Lankan real estate analyst and data extraction specialist for LankaProperty.lk.
Your task is to analyze raw, unstructured property listings (written in English, Sinhala, Tamil, or mixed Sri Lankan advertisements) and extract structured property data adhering to exact domain rules.

STRICT DOMAIN RULES:
1. No Guessed Defaults:
   - If bedrooms, bathrooms, floor area, or land extent are not mentioned or cannot be inferred with certainty, leave them null. Never output 0 unless explicitly stated (e.g. "0 bedrooms / bare land").
   - Do not guess or invent nearby schools, distances, approvals, investment returns, or architect names.
2. Sri Lankan Number & Unit Handling:
   - "Lakh" or "Lac" = 100,000 LKR (e.g. 785 lakhs = 78,500,000 LKR).
   - "Crore" = 10,000,000 LKR (e.g. 7.85 crore = 78,500,000 LKR).
   - "Million" or "M" = 1,000,000 LKR (e.g. 78.5 million = 78,500,000 LKR).
   - "Perch" = Sri Lankan land measure. 1 Acre = 160 perches.
   - If per-perch price is stated (e.g. "Rs. 500,000 per perch"), set priceLkr to 500000, priceUnit to 'perch'.
   - If total price for land is stated (e.g. "20 perches, Rs. 10,000,000 total"), set priceLkr to 10000000, priceUnit to 'total'.
   - If monthly rent is stated (e.g. "Rs. 150,000/month"), set priceLkr to 150000, priceUnit to 'month'.
   - Ambiguous shorthand: If "75M" appears without "million" or context, flag it in ambiguities.
3. Phone numbers vs prices:
   - Numbers with prefixes 07x, +94, or listed near contact/call/phone are telephone numbers, NOT prices.
4. Conflict Detection:
   - If contradictory facts appear (e.g. "Five (3) bedrooms"), record the conflict in analysis.conflicts and lower confidence.
5. Description Auto-Arrangement:
   - "description": Write a clean introductory prose summary (2-3 paragraphs) based solely on supplied facts. Do NOT output literal escaped "\\n", use actual newline characters.
   - "additionalInfo": Group buyer-facing details into distinct markdown sections: "### Property Highlights", "### Access & Location", "### Utilities & Facilities".
   - "materialSpecs": Extract any mentioned construction materials, Kumbuk/teak timber, fittings, etc.
6. Location:
   - Identify Sri Lankan District and City/Town. Validate against known Sri Lankan administrative boundaries.

Return strictly valid JSON matching the schema.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [{ text: `Analyze and extract this property listing advertisement:\n\n${sanitizedText}` }],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          purpose: { type: Type.STRING, enum: ['buy', 'rent', 'land'] },
          type: { type: Type.STRING, enum: ['house', 'apartment', 'land', 'commercial'] },
          location: {
            type: Type.OBJECT,
            properties: {
              district: { type: Type.STRING },
              city: { type: Type.STRING },
              address: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
            },
          },
          price: {
            type: Type.OBJECT,
            properties: {
              priceLkr: { type: Type.NUMBER },
              priceUnit: { type: Type.STRING, enum: ['total', 'perch', 'month', 'per_year'] },
              priceDisplay: { type: Type.STRING },
              isNegotiable: { type: Type.BOOLEAN },
              priceOnRequest: { type: Type.BOOLEAN },
              calculationNote: { type: Type.STRING },
            },
          },
          specs: {
            type: Type.OBJECT,
            properties: {
              bedrooms: { type: Type.NUMBER },
              bathrooms: { type: Type.NUMBER },
              floorAreaSqFt: { type: Type.NUMBER },
              landPerches: { type: Type.NUMBER },
              landAcres: { type: Type.NUMBER },
              furnishing: { type: Type.STRING, enum: ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'] },
              parkingSpaces: { type: Type.NUMBER },
            },
          },
          content: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              additionalInfo: { type: Type.STRING },
              materialSpecs: { type: Type.STRING },
              amenities: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          contact: {
            type: Type.OBJECT,
            properties: {
              primaryPhone: { type: Type.STRING },
              secondaryPhone: { type: Type.STRING },
              contactName: { type: Type.STRING },
            },
          },
          media: {
            type: Type.OBJECT,
            properties: {
              videoUrl: { type: Type.STRING },
            },
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: { type: Type.STRING },
              conflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
              ambiguities: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingCriticalInfo: { type: Type.ARRAY, items: { type: Type.STRING } },
              fieldExcerpts: { type: Type.OBJECT },
            },
            required: ['detectedLanguage', 'conflicts', 'ambiguities'],
          },
        },
      },
    },
  });

  const outputText = response.text;
  if (!outputText) {
    throw new Error('Empty response received from AI model.');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(outputText);
  } catch (err: any) {
    throw new Error('AI output was not valid JSON.');
  }

  return validateAndNormalizeAIResponse(parsed);
}
