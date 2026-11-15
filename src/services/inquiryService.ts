import { InquiryFormData } from '../types/property';

interface InquirySubmissionResponse {
  success: boolean;
  isDemo: boolean;
  message: string;
  inquiryId?: string;
}

class InquiryService {
  private lastSubmissionTime = 0;
  private submissionCount = 0;

  async submitInquiry(data: InquiryFormData): Promise<InquirySubmissionResponse> {
    const now = Date.now();

    // Client-side spam rate limiting: minimum 3 seconds between attempts
    if (now - this.lastSubmissionTime < 3000) {
      return {
        success: false,
        isDemo: true,
        message: 'Please wait a moment before sending another inquiry.',
      };
    }

    // Required validation
    if (!data.name || !data.name.trim()) {
      return { success: false, isDemo: true, message: 'Contact name is required.' };
    }
    if (!data.phone || data.phone.trim().length < 8) {
      return { success: false, isDemo: true, message: 'Valid telephone or WhatsApp number is required.' };
    }
    if (!data.message || !data.message.trim()) {
      return { success: false, isDemo: true, message: 'Inquiry message cannot be empty.' };
    }

    this.lastSubmissionTime = now;
    this.submissionCount++;

    const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL;

    // If an authorized production endpoint is configured
    if (apiBaseUrl) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          return {
            success: true,
            isDemo: false,
            message: 'Inquiry successfully delivered to listing broker.',
            inquiryId: result.id,
          };
        }
      } catch (err) {
        console.warn('Production inquiry delivery failed, reporting demo status:', err);
      }
    }

    // In demo environment without backend:
    // Simulated round-trip latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      success: true,
      isDemo: true,
      message: 'Demo only — this inquiry has not been sent.',
      inquiryId: `DEMO-${Date.now().toString(36).toUpperCase()}`,
    };
  }
}

export const inquiryService = new InquiryService();
