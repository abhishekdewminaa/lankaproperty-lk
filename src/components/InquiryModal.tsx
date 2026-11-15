import React, { useState } from 'react';
import { X, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { InquiryFormData } from '../types/property';
import { inquiryService } from '../services/inquiryService';

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
  agentName = 'Southern Coast Specialist',
  agentPhone = '+94 77 234 5678',
  agentWhatsapp = '+94772345678',
}: InquiryModalProps) {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: '',
    phone: '',
    email: '',
    message: `I am interested in learning more about "${propertyTitle}". Please provide verified documentation and arrange a private viewing.`,
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
      errs.phone = 'Please enter a valid telephone number with country/area code.';
    }
    if (formData.email && !formData.email.includes('@')) {
      errs.email = 'Please provide a valid email address or leave blank.';
    }
    if (!formData.message.trim()) {
      errs.message = 'Please specify your inquiry message.';
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
    const text = encodeURIComponent(
      `Hello ${agentName}, I am inquiring regarding "${propertyTitle}" on LankaProperty.lk. Could you please share further details? URL: ${window.location.href}`
    );
    window.open(`https://wa.me/${agentWhatsapp.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Inquire about ${propertyTitle}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
    >
      <div className="relative w-full max-w-lg bg-white rounded-[4px] border border-[#DDE5DF] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#DDE5DF]">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#176B45]">Direct Inquiry</span>
            <h3 className="text-lg sm:text-xl font-bold text-[#18251E] mt-0.5 line-clamp-1">{propertyTitle}</h3>
            <p className="text-xs text-[#5F6B63]">Direct agent: {agentName} ({agentPhone})</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#5F6B63] hover:text-[#18251E] rounded-[2px] focus-visible:outline-2 focus-visible:outline-[#176B45] cursor-pointer"
            aria-label="Close inquiry window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-[#E8F3EC] text-[#176B45] rounded-[4px] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-[#103D2C]">Inquiry Received (Demo Mode)</h4>
              {/* Mandatory Prompt Copy */}
              <p className="text-sm font-semibold text-[#C93636] bg-[#C93636]/10 py-1.5 px-3 rounded-[3px] max-w-sm mx-auto">
                Demo only — this inquiry has not been sent.
              </p>
              <p className="text-xs text-[#5F6B63] max-w-sm mx-auto pt-2">
                In a live production deployment, this form triggers an authenticated lead notification to the listing broker ({agentName}).
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#176B45] hover:bg-[#115236] text-white text-sm font-bold rounded-[3px]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Chat Directly</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 border border-[#DDE5DF] hover:bg-[#F5F8F5] text-[#18251E] text-sm font-semibold rounded-[3px]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="inquiry-name" className="text-xs font-bold uppercase tracking-wider text-[#18251E]">
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
                  errors.name ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]' : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-[#C93636] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label htmlFor="inquiry-phone" className="text-xs font-bold uppercase tracking-wider text-[#18251E]">
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
                  errors.phone ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]' : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-[#C93636] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1">
              <label htmlFor="inquiry-email" className="text-xs font-bold uppercase tracking-wider text-[#5F6B63]">
                Email Address (Optional)
              </label>
              <input
                id="inquiry-email"
                type="email"
                placeholder="your.email@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[3px] text-[#18251E] focus:outline-none ${
                  errors.email ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]' : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-[#C93636] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label htmlFor="inquiry-message" className="text-xs font-bold uppercase tracking-wider text-[#18251E]">
                Message <span className="text-[#C93636]">*</span>
              </label>
              <textarea
                id="inquiry-message"
                rows={3}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[3px] text-[#18251E] focus:outline-none ${
                  errors.message ? 'border-[#C93636] focus:ring-1 focus:ring-[#C93636]' : 'border-[#DDE5DF] focus:border-[#176B45]'
                }`}
              />
              {errors.message && (
                <p className="text-xs text-[#C93636] flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.message}</span>
                </p>
              )}
            </div>

            {/* Demo Notice Banner */}
            <div className="p-3 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs text-[#5F6B63]">
              <p className="font-semibold text-[#18251E]">Privacy Guarantee</p>
              <p>Your contact details are strictly handled in accordance with demonstration protocols and are never shared with 3rd-party ad trackers.</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3 px-4 bg-[#176B45] hover:bg-[#115236] text-white font-bold text-sm rounded-[3px] flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Verifying...' : 'Submit Inquiry'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="w-full sm:w-auto py-3 px-4 border border-[#176B45] text-[#176B45] hover:bg-[#E8F3EC] font-bold text-sm rounded-[3px] flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
