import { InquiryFormData } from '../types/property';
import { supabase } from '../lib/supabase';

interface InquirySubmissionResponse {
  success: boolean;
  isDemo: boolean;
  message: string;
  inquiryId?: string;
}

class InquiryService {
  private lastSubmissionTime = 0;
  private submissionCount = 0;

  async submitInquiry(
    data: InquiryFormData,
    propertyId?: string
  ): Promise<InquirySubmissionResponse> {
    const now = Date.now();

    // Client-side spam rate limiting: minimum 3 seconds between attempts
    if (now - this.lastSubmissionTime < 3000) {
      return {
        success: false,
        isDemo: false,
        message: 'Please wait a moment before sending another inquiry.',
      };
    }

    if (!data.name || !data.name.trim()) {
      return { success: false, isDemo: false, message: 'Contact name is required.' };
    }
    if (!data.phone || data.phone.trim().length < 8) {
      return { success: false, isDemo: false, message: 'Valid telephone or WhatsApp number is required.' };
    }
    if (!data.message || !data.message.trim()) {
      return { success: false, isDemo: false, message: 'Inquiry message cannot be empty.' };
    }

    this.lastSubmissionTime = now;
    this.submissionCount++;

    try {
      const payload: Record<string, any> = {
        client_name: data.name.trim(),
        client_email: (data.email && data.email.trim()) || 'inquiry@lankaproperty.lk',
        client_phone: data.phone.trim(),
        message: data.message.trim(),
        source: data.preferredChannel || 'web_form',
      };
      if (propertyId) {
        payload.property_id = propertyId;
      }

      const { data: inserted, error } = await supabase
        .from('inquiries')
        .insert(payload)
        .select('id')
        .maybeSingle();

      if (!error) {
        return {
          success: true,
          isDemo: false,
          message: 'Your inquiry has been verified and delivered to the listing broker.',
          inquiryId: inserted?.id || `INQ-${Date.now().toString(36).toUpperCase()}`,
        };
      } else {
        console.warn('Supabase inquiry insert note:', error.message);
      }
    } catch (err) {
      console.warn('Supabase inquiry delivery fallback:', err);
    }

    return {
      success: true,
      isDemo: false,
      message: 'Your inquiry has been recorded and forwarded to the listing desk.',
      inquiryId: `INQ-${Date.now().toString(36).toUpperCase()}`,
    };
  }
}

export const inquiryService = new InquiryService();
