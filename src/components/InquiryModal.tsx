import React, { useState } from 'react';
import { InquiryFormData } from '../types/property';
import { inquiryService } from '../services/inquiryService';
import { normalizeSriLankaWhatsApp } from '../utils/formatters';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  agentName?: string;
  agentPhone?: string;
  agentWhatsapp?: string;
}

export function InquiryModal({
  isOpen,
  onClose,
  propertyTitle,
  agentName = 'Property Specialist',
  agentPhone = '+94 77 234 5678',
  agentWhatsapp = '+94772345678',
}: InquiryModalProps) {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    phone: '',
    email: '',
    message: `I am interested in "${propertyTitle}". Please share additional details and viewing availability.`,
    preferredChannel: 'whatsapp',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string>('');

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errs.name = 'Please provide your full name.';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Please enter a contact telephone number.';
    } else if (formData.phone.trim().length < 8) {
      errs.phone = 'Please enter a valid telephone number.';
    }
    if (formData.email && !formData.email.includes('@')) {
      errs.email = 'Please provide a valid email address or leave blank.';
    }
    if (!formData.message.trim()) {
      errs.message = 'Please enter your inquiry message.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await inquiryService.submitInquiry(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSubmissionFeedback(result.message);
      setSubmitted(true);
    } else {
      setErrors({ form: result.message });
    }
  };

  const handleWhatsAppDirect = () => {
    const waDigits = normalizeSriLankaWhatsApp(agentWhatsapp, agentPhone);
    if (!waDigits) return;
    const text = encodeURIComponent(
      `Hello ${agentName}, I am inquiring regarding "${propertyTitle}" on LankaProperty.lk. Could you please share further details? URL: ${window.location.href}`
    );
    window.open(`https://wa.me/${waDigits}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Inquire about ${propertyTitle}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
    >
      <div className="relative w-full max-w-lg bg-white rounded-[4px] border border-[#DDE5DF] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-[#DDE5DF]">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#176B45]">
              Property Inquiry
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#18251E] mt-0.5 line-clamp-1">
              {propertyTitle}
            </h3>
            <p className="text-xs text-[#5F6B63]">
              Listing Agent: {agentName} ({agentPhone})
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#5F6B63] hover:text-[#18251E] border border-[#DDE5DF] rounded-[3px] cursor-pointer"
          >
            Close
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-[#103D2C]">Inquiry Sent Successfully</h4>
              <p className="text-xs text-[#5F6B63] max-w-sm mx-auto">
                {submissionFeedback ||
                  `Your inquiry has been sent to ${agentName}. You can also connect immediately via WhatsApp below.`}
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] cursor-pointer"
              >
                Open WhatsApp Chat
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 border border-[#DDE5DF] hover:bg-[#F5F8F5] text-[#18251E] text-xs font-bold uppercase tracking-wider rounded-[3px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="inquiry-name"
                className="text-xs font-bold uppercase tracking-wider text-[#18251E]"
              >
                Full Name <span className="text-[#C93636]">*</span>
              </label>
              <input
                id="inquiry-name"
                type="text"
                required
                placeholder="e.g. Priyantha Jayasuriya"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[3px] text-[#18251E] focus:outline-none ${
                  errors.name
                    ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]'
                    : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-[#C93636] mt-1 font-medium">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inquiry-phone"
                className="text-xs font-bold uppercase tracking-wider text-[#18251E]"
              >
                Phone / WhatsApp Number <span className="text-[#C93636]">*</span>
              </label>
              <input
                id="inquiry-phone"
                type="tel"
                required
                placeholder="+94 77 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[3px] text-[#18251E] focus:outline-none ${
                  errors.phone
                    ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]'
                    : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-[#C93636] mt-1 font-medium">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inquiry-email"
                className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]"
              >
                Email Address (Optional)
              </label>
              <input
                id="inquiry-email"
                type="email"
                placeholder="your.email@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[3px] text-[#18251E] focus:outline-none ${
                  errors.email
                    ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]'
                    : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-[#C93636] mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="inquiry-message"
                className="text-xs font-bold uppercase tracking-wider text-[#18251E]"
              >
                Message <span className="text-[#C93636]">*</span>
              </label>
              <textarea
                id="inquiry-message"
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[3px] text-[#18251E] focus:outline-none ${
                  errors.message
                    ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]'
                    : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.message && (
                <p className="text-xs text-[#C93636] mt-1 font-medium">{errors.message}</p>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3 px-4 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? 'Sending...' : 'Send Inquiry'}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-auto py-3 px-4 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                WhatsApp Agent
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
