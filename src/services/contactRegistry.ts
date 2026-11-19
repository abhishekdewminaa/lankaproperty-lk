export interface RegisteredContact {
  id: string;
  name: string;
  role: string;
  phones: string[]; // Formatted local Sri Lankan numbers e.g. "077 610 4884"
  primaryPhone: string;
  whatsapp: string; // E.164 digits e.g. "94776104884"
  whatsappEnabled: boolean;
}

export const REGISTERED_CONTACTS: RegisteredContact[] = [
  {
    id: 'lalith-ranatunga',
    name: 'Mr. Lalith Ranatunga',
    role: 'CEO of LankaProperty',
    phones: ['077 610 4884', '072 395 1560'],
    primaryPhone: '077 610 4884',
    whatsapp: '94776104884',
    whatsappEnabled: true,
  },
  {
    id: 'buddhi-rasanjan',
    name: 'Mr. Buddhi Rasanjan',
    role: 'Property Advisor',
    phones: ['076 737 2534'],
    primaryPhone: '076 737 2534',
    whatsapp: '94767372534',
    whatsappEnabled: true,
  },
  {
    id: 'vimuthi-perera',
    name: 'Mr. Vimuthi Perera',
    role: 'Property Advisor',
    phones: ['075 035 0590'],
    primaryPhone: '075 035 0590',
    whatsapp: '94750350590',
    whatsappEnabled: true,
  },
  {
    id: 'rubi-ferando',
    name: 'Mrs. Rubi Ferando',
    role: 'Property Advisor',
    phones: ['076 795 1560'],
    primaryPhone: '076 795 1560',
    whatsapp: '94767951560',
    whatsappEnabled: true,
  },
];

/**
 * Normalizes any Sri Lankan phone string into canonical 11-digit "94XXXXXXXXX" format.
 * Returns "" if it doesn't look like a valid Sri Lankan 9/10-digit number.
 */
export function normalizeSriLankaPhoneKey(raw?: string): string {
  if (!raw) return '';
  let digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';

  if (digits.startsWith('0094')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('94') && digits.length === 11) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `94${digits.slice(1)}`;
  }
  if (digits.length === 9 && !digits.startsWith('0')) {
    return `94${digits}`;
  }
  return '';
}

/**
 * Formats canonical or raw Sri Lankan number as "07X XXX XXXX" for clean UI display.
 */
export function formatSriLankaDisplayPhone(raw?: string): string {
  const key = normalizeSriLankaPhoneKey(raw);
  if (key.length === 11 && key.startsWith('94')) {
    const local = `0${key.slice(2)}`;
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return (raw || '').trim();
}

/**
 * Validates whether a string is a valid Sri Lankan mobile number (070-078) or landline.
 */
export function isValidSriLankaPhone(raw?: string): boolean {
  const key = normalizeSriLankaPhoneKey(raw);
  return /^94[1-9]\d{8}$/.test(key);
}

export function isValidSriLankaMobile(raw?: string): boolean {
  const key = normalizeSriLankaPhoneKey(raw);
  return /^947[0-8]\d{7}$/.test(key);
}

// Lookup map from canonical "94XXXXXXXXX" -> RegisteredContact
const PHONE_TO_CONTACT_MAP = new Map<string, RegisteredContact>();
for (const contact of REGISTERED_CONTACTS) {
  for (const phone of contact.phones) {
    const key = normalizeSriLankaPhoneKey(phone);
    if (key) PHONE_TO_CONTACT_MAP.set(key, contact);
  }
}

export function findRegisteredContactByPhone(raw?: string): RegisteredContact | null {
  const key = normalizeSriLankaPhoneKey(raw);
  if (!key) return null;
  return PHONE_TO_CONTACT_MAP.get(key) || null;
}

export function findRegisteredContactByName(name?: string): RegisteredContact | null {
  if (!name) return null;
  const cleaned = name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return (
    REGISTERED_CONTACTS.find((c) => {
      const cClean = c.name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
      return cClean === cleaned || cClean.includes(cleaned) || cleaned.includes(cClean);
    }) || null
  );
}

export interface DetectedPhoneEntry {
  rawMatch: string;
  canonicalKey: string; // "94XXXXXXXXX"
  displayPhone: string; // "07X XXX XXXX"
  matchedContact: RegisteredContact | null;
  extractedNearbyName?: string;
}

export interface ContactDetectionSummary {
  detectedPhones: DetectedPhoneEntry[];
  matchedRegisteredContacts: RegisteredContact[];
  unknownPhones: DetectedPhoneEntry[];
  scenario:
    | 'none'
    | 'single_registered'
    | 'multiple_registered'
    | 'unknown_client'
    | 'mixed_registered_and_unknown';
  requiresConfirmation: boolean;
  recommendedManagingAgent: RegisteredContact;
  recommendedPublicName: string;
  recommendedPublicPhone: string;
  recommendedPublicWhatsapp: string;
  recommendedWhatsappEnabled: boolean;
  isExternalClient: boolean;
}

/**
 * Scans raw property text for all Sri Lankan phone numbers (supports spaces, hyphens, +94, 0094, 07x),
 * deduplicates by canonical key and registered contact profile, and classifies the contact scenario.
 */
export function analyzeContactsInText(rawText: string): ContactDetectionSummary {
  const defaultAgent = REGISTERED_CONTACTS[0]; // Mr. Lalith Ranatunga

  if (!rawText || !rawText.trim()) {
    return {
      detectedPhones: [],
      matchedRegisteredContacts: [],
      unknownPhones: [],
      scenario: 'none',
      requiresConfirmation: false,
      recommendedManagingAgent: defaultAgent,
      recommendedPublicName: defaultAgent.name,
      recommendedPublicPhone: defaultAgent.primaryPhone,
      recommendedPublicWhatsapp: defaultAgent.whatsapp,
      recommendedWhatsappEnabled: true,
      isExternalClient: false,
    };
  }

  // Match Sri Lankan mobile/landline numbers in formats:
  // +94 77 610 4884, 94-77-610-4884, 0094 776104884, 077 610 4884, 077-610-4884, 0776104884
  const phoneRegex = /(?:\+?94|0094|0)[\s.-]*(?:7[0-8]|[1-9]\d)[\s.-]*\d{3}[\s.-]*\d{4}\b/g;
  const seenKeys = new Set<string>();
  const detectedPhones: DetectedPhoneEntry[] = [];

  let match: RegExpExecArray | null;
  while ((match = phoneRegex.exec(rawText)) !== null) {
    const rawMatch = match[0].trim();
    const canonicalKey = normalizeSriLankaPhoneKey(rawMatch);
    if (!canonicalKey || seenKeys.has(canonicalKey)) continue;
    seenKeys.add(canonicalKey);

    const displayPhone = formatSriLankaDisplayPhone(canonicalKey);
    const matchedContact = findRegisteredContactByPhone(canonicalKey);

    let extractedNearbyName: string | undefined;
    if (!matchedContact) {
      // Check preceding ~80 chars on the same line for an explicit name label like "Contact: Mr. Silva"
      const contextStart = Math.max(0, match.index - 80);
      const before = rawText.slice(contextStart, match.index);
      const lastLine = before.split(/\r?\n/).pop() || '';
      const nameMatch = lastLine.match(
        /(?:contact|owner|agent|seller|mr\.?|mrs\.?|ms\.?)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*[-–:|]*\s*$/i
      );
      if (nameMatch && nameMatch[1]) {
        const candidate = nameMatch[1].trim();
        if (!/^(call|phone|mobile|whatsapp|tel|number|contact|owner|seller)$/i.test(candidate)) {
          extractedNearbyName = candidate;
        }
      }
    }

    detectedPhones.push({
      rawMatch,
      canonicalKey,
      displayPhone,
      matchedContact,
      extractedNearbyName,
    });
  }

  // Deduplicate registered contacts (e.g., if both 077 610 4884 & 072 395 1560 appear, keep Mr. Lalith once)
  const matchedContactMap = new Map<string, RegisteredContact>();
  const unknownPhones: DetectedPhoneEntry[] = [];

  for (const entry of detectedPhones) {
    if (entry.matchedContact) {
      if (!matchedContactMap.has(entry.matchedContact.id)) {
        matchedContactMap.set(entry.matchedContact.id, entry.matchedContact);
      }
    } else {
      unknownPhones.push(entry);
    }
  }

  const matchedRegisteredContacts = Array.from(matchedContactMap.values());

  // Classify scenario
  if (detectedPhones.length === 0) {
    return {
      detectedPhones,
      matchedRegisteredContacts,
      unknownPhones,
      scenario: 'none',
      requiresConfirmation: false,
      recommendedManagingAgent: defaultAgent,
      recommendedPublicName: defaultAgent.name,
      recommendedPublicPhone: defaultAgent.primaryPhone,
      recommendedPublicWhatsapp: defaultAgent.whatsapp,
      recommendedWhatsappEnabled: true,
      isExternalClient: false,
    };
  }

  if (matchedRegisteredContacts.length === 1 && unknownPhones.length === 0) {
    const agent = matchedRegisteredContacts[0];
    // Use the specific matched phone number for this agent if detected (e.g. 072 395 1560 or 077 610 4884)
    const matchedEntry = detectedPhones.find((d) => d.matchedContact?.id === agent.id);
    const chosenPhone = matchedEntry ? matchedEntry.displayPhone : agent.primaryPhone;
    const chosenWhatsapp = matchedEntry ? matchedEntry.canonicalKey : agent.whatsapp;

    return {
      detectedPhones,
      matchedRegisteredContacts,
      unknownPhones,
      scenario: 'single_registered',
      requiresConfirmation: false,
      recommendedManagingAgent: agent,
      recommendedPublicName: agent.name,
      recommendedPublicPhone: chosenPhone,
      recommendedPublicWhatsapp: chosenWhatsapp,
      recommendedWhatsappEnabled: agent.whatsappEnabled,
      isExternalClient: false,
    };
  }

  if (matchedRegisteredContacts.length > 1 && unknownPhones.length === 0) {
    const primary = matchedRegisteredContacts[0];
    const matchedEntry = detectedPhones.find((d) => d.matchedContact?.id === primary.id);
    return {
      detectedPhones,
      matchedRegisteredContacts,
      unknownPhones,
      scenario: 'multiple_registered',
      requiresConfirmation: true,
      recommendedManagingAgent: primary,
      recommendedPublicName: primary.name,
      recommendedPublicPhone: matchedEntry ? matchedEntry.displayPhone : primary.primaryPhone,
      recommendedPublicWhatsapp: matchedEntry ? matchedEntry.canonicalKey : primary.whatsapp,
      recommendedWhatsappEnabled: primary.whatsappEnabled,
      isExternalClient: false,
    };
  }

  if (matchedRegisteredContacts.length === 0 && unknownPhones.length >= 1) {
    const client = unknownPhones[0];
    return {
      detectedPhones,
      matchedRegisteredContacts,
      unknownPhones,
      scenario: 'unknown_client',
      requiresConfirmation: true,
      recommendedManagingAgent: defaultAgent, // Scenario A: Mr. Lalith Ranatunga manages client ads
      recommendedPublicName: client.extractedNearbyName || '',
      recommendedPublicPhone: client.displayPhone,
      recommendedPublicWhatsapp: client.canonicalKey,
      recommendedWhatsappEnabled: false, // Do not assume unknown number has WhatsApp until confirmed
      isExternalClient: true,
    };
  }

  // Mixed registered + unknown client number
  const managing = matchedRegisteredContacts[0] || defaultAgent;
  const client = unknownPhones[0];
  return {
    detectedPhones,
    matchedRegisteredContacts,
    unknownPhones,
    scenario: 'mixed_registered_and_unknown',
    requiresConfirmation: true,
    recommendedManagingAgent: managing,
    recommendedPublicName: client.extractedNearbyName || '',
    recommendedPublicPhone: client.displayPhone,
    recommendedPublicWhatsapp: client.canonicalKey,
    recommendedWhatsappEnabled: false,
    isExternalClient: true,
  };
}
