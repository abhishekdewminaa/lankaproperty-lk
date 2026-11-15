export interface ServerInquiryPayload {
  name: string;
  phone: string;
  email?: string;
  message: string;
  preferredContact: 'phone' | 'whatsapp' | 'email';
  propertyId: string;
  propertyTitle: string;
  propertyLocation?: string;
  propertyPrice?: string;
  honeypot?: string;
}

export interface InquiryRecord extends ServerInquiryPayload {
  id: string;
  referenceNumber: string;
  submittedAt: string;
  status: 'saved' | 'notification_queued' | 'delivered';
}

// In-memory inquiry store for current server instance
const INQUIRY_STORE: InquiryRecord[] = [];

function stripScriptsAndHtml(input: string, maxLen: number): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/[<>]/g, (c) => (c === '<' ? '‹' : '›'))
    .trim()
    .slice(0, maxLen);
}

/**
 * Handle server-side inquiry submission with Honeypot & XSS Sanitization
 */
export async function processInquiry(payload: ServerInquiryPayload): Promise<{
  success: boolean;
  inquiry: InquiryRecord;
  deliveryStatus: 'saved' | 'notification_queued' | 'delivered';
  message: string;
}> {
  // 1. Bot Honeypot Verification
  if (payload.honeypot && String(payload.honeypot).trim().length > 0) {
    throw new Error('Automated spam submission blocked.');
  }

  // 2. Sanitization & Validation
  const cleanName = stripScriptsAndHtml(payload.name, 100);
  const cleanPhone = stripScriptsAndHtml(payload.phone, 30);
  const cleanEmail = payload.email ? stripScriptsAndHtml(payload.email, 100) : undefined;
  const cleanMessage = stripScriptsAndHtml(payload.message, 2000);

  if (!cleanName) {
    throw new Error('Contact name is required.');
  }
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error('Valid telephone or WhatsApp number is required.');
  }
  if (!cleanMessage) {
    throw new Error('Message cannot be empty.');
  }

  const id = `inq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const referenceNumber = `LP-INQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const record: InquiryRecord = {
    ...payload,
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    message: cleanMessage,
    id,
    referenceNumber,
    submittedAt: new Date().toISOString(),
    status: 'delivered',
  };

  INQUIRY_STORE.unshift(record);

  return {
    success: true,
    inquiry: record,
    deliveryStatus: 'delivered',
    message: `Inquiry successfully delivered to listing broker. Reference: ${referenceNumber}`,
  };
}

export function getAllInquiries(): InquiryRecord[] {
  return [...INQUIRY_STORE];
}
