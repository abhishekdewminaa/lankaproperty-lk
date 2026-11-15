import { useState, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { DEVELOPMENTS_DATA } from '../data/developments';
import { formatPriceLkr } from '../utils/formatters';
import { InteractiveMasterplan } from '../components/InteractiveMasterplan';
import { GalleryLightbox } from '../components/GalleryLightbox';
import { InquiryModal } from '../components/InquiryModal';
import { MasterplanUnit } from '../types/property';
import {
  MapPin,
  Calendar,
  Building,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Phone,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface DevelopmentDetailPageProps {
  slug: string;
}

export function DevelopmentDetailPage({ slug }: DevelopmentDetailPageProps) {
  const { navigate } = useRouter();

  const project = useMemo(() => {
    return DEVELOPMENTS_DATA.find((d) => d.slug === slug) || DEVELOPMENTS_DATA[0];
  }, [slug]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryContext, setInquiryContext] = useState<string>(project.title);

  const handleInquireUnit = (unit: MasterplanUnit) => {
    setInquiryContext(`${project.title} - ${unit.code} (${unit.title})`);
    setInquiryModalOpen(true);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello, I am inquiring regarding "${project.title}" on LankaProperty.lk. Please share the masterplan documentation. URL: ${window.location.href}`
    );
    window.open(`https://wa.me/94772345678?text=${text}`, '_blank');
  };

  return (
    <div className="bg-[#FFFFFF] min-h-screen pb-20">
      {/* Top Breadcrumb Bar */}
      <div className="bg-[#F5F8F5] border-b border-[#DDE5DF] py-3 text-xs text-[#5F6B63]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hover:text-[#18251E]">
              Home
            </button>
            <span>/</span>
            <button onClick={() => navigate('/developments')} className="hover:text-[#18251E]">
              Developments
            </button>
            <span>/</span>
            <span className="text-[#18251E] font-semibold line-clamp-1">{project.title}</span>
          </nav>

          <button
            onClick={() => navigate('/developments')}
            className="inline-flex items-center gap-1 font-semibold text-[#176B45] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Developments</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative aspect-21/9 min-h-[380px] max-h-[560px] w-full overflow-hidden bg-[#103D2C]">
        <img
          src={project.coverImage}
          alt={project.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 pb-8 sm:pb-12 text-white">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-white text-[#103D2C] rounded-[2px]">
                {project.status}
              </span>
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px]">
                {project.projectType}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {project.title}
            </h1>

            <p className="text-sm sm:text-base text-[#DDE5DF] font-medium leading-relaxed">
              {project.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 pt-10 space-y-16">
        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs">
          <div>
            <span className="text-[#5F6B63] block">Starting Valuation</span>
            <span className="text-lg sm:text-xl font-bold text-[#103D2C] block mt-0.5 tabular-nums">
              {formatPriceLkr(project.startingPriceLkr, 'total')}
            </span>
          </div>

          <div>
            <span className="text-[#5F6B63] block">Target Handover</span>
            <span className="text-lg sm:text-xl font-bold text-[#18251E] block mt-0.5">
              {project.completionDate}
            </span>
          </div>

          <div>
            <span className="text-[#5F6B63] block">Total Units</span>
            <span className="text-lg sm:text-xl font-bold text-[#18251E] block mt-0.5">
              {project.totalUnits} Residences
            </span>
          </div>

          <div>
            <span className="text-[#5F6B63] block">Regional Location</span>
            <span className="text-lg sm:text-xl font-bold text-[#18251E] block mt-0.5">
              {project.location.city}, {project.location.district}
            </span>
          </div>
        </div>

        {/* Project Architectural Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
                Architectural Vision
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
                Tropical Modern Vernacular
              </h2>
            </div>
            <p className="text-base text-[#18251E]/90 leading-relaxed">
              {project.description}
            </p>
            <div className="p-6 bg-[#F5F8F5] border-l-4 border-[#176B45] space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#103D2C]">
                Spatial & Environmental Design Strategy
              </h3>
              <p className="text-sm text-[#5F6B63] leading-relaxed italic">
                "{project.architecturalStory}"
              </p>
            </div>
          </div>

          {/* Gallery Preview Box */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
              Project Photography ({project.gallery.length} Images)
            </span>
            <div
              onClick={() => {
                setSelectedPhotoIndex(0);
                setLightboxOpen(true);
              }}
              className="relative aspect-16/10 rounded-[3px] overflow-hidden border border-[#DDE5DF] group cursor-pointer"
            >
              <img
                src={project.gallery[0]}
                alt={`${project.title} gallery`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                <span className="px-4 py-2 bg-white/95 text-[#103D2C] text-xs font-bold rounded-[2px] shadow-sm">
                  View Full Gallery
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE MASTERPLAN SECTION (Mandatory Requirement) */}
        {project.masterplan && (
          <section className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
                Masterplan Exploration
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
                {project.masterplan.title}
              </h2>
              <p className="text-sm text-[#5F6B63]">
                {project.masterplan.subtext}
              </p>
            </div>

            <InteractiveMasterplan
              units={project.masterplan.units}
              viewBox={project.masterplan.viewBox}
              onInquireUnit={handleInquireUnit}
            />
          </section>
        )}

        {/* Unit Types Table */}
        <section className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
              Inventory Types
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
              Residential Configurations
            </h2>
          </div>

          <div className="overflow-x-auto border border-[#DDE5DF] rounded-[3px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F5F8F5] text-[#18251E] border-b border-[#DDE5DF] text-xs uppercase font-bold tracking-wider">
                  <th className="p-4">Unit Plan</th>
                  <th className="p-4">Bedrooms</th>
                  <th className="p-4">Bathrooms</th>
                  <th className="p-4">Floor Area</th>
                  <th className="p-4">Starting Price</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Inquire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {project.unitTypes.map((type) => (
                  <tr key={type.name} className="hover:bg-[#F5F8F5] transition-colors">
                    <td className="p-4 font-bold text-[#103D2C]">{type.name}</td>
                    <td className="p-4">{type.bedrooms} Beds</td>
                    <td className="p-4">{type.bathrooms} Baths</td>
                    <td className="p-4">{type.areaSqFt} sq ft</td>
                    <td className="p-4 font-extrabold text-[#103D2C] tabular-nums">
                      {formatPriceLkr(type.startingPriceLkr, 'total')}
                    </td>
                    <td className="p-4">
                      {type.availableCount > 0 ? (
                        <span className="text-[#176B45] font-semibold">{type.availableCount} Available</span>
                      ) : (
                        <span className="text-[#5F6B63]">Sold Out</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setInquiryContext(`${project.title} - ${type.name}`);
                          setInquiryModalOpen(true);
                        }}
                        className="text-xs font-bold text-[#176B45] hover:underline"
                      >
                        Inquire Unit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Amenities Grid */}
        <section className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
              Facilities & Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
              Master-Planned Amenities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.amenities.map((amenity) => (
              <div
                key={amenity}
                className="p-4 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] flex items-center gap-3 text-sm text-[#18251E]"
              >
                <CheckCircle2 className="w-5 h-5 text-[#176B45] shrink-0" />
                <span className="font-semibold">{amenity}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Supplied FAQs */}
        {project.faqs && project.faqs.length > 0 && (
          <section className="space-y-6 pt-6 border-t border-[#DDE5DF]">
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
                Buyer Questions
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#18251E]">
                Frequently Asked Inquiries
              </h2>
            </div>

            <div className="space-y-4">
              {project.faqs.map((faq, idx) => (
                <div key={idx} className="p-6 bg-white border border-[#DDE5DF] rounded-[3px] space-y-2">
                  <h3 className="text-base font-bold text-[#18251E] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#176B45] shrink-0" />
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-sm text-[#5F6B63] leading-relaxed pl-6">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Development Bottom Inquiry Banner */}
        <section className="p-8 sm:p-12 bg-[#103D2C] text-white rounded-[4px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs uppercase font-bold tracking-widest text-[#E8F3EC]/80">
              Developer Sales Desk
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold">
              Schedule a Private Presentation on {project.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#A3B8AD]">
              Speak directly with our dedicated project directors for structural architectural drawings and payment milestone schedules.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setInquiryContext(project.title);
                setInquiryModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#C93636] hover:bg-[#A92828] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors"
            >
              Request Brochure & Feasibility
            </button>
            <button
              onClick={handleWhatsApp}
              className="w-full sm:w-auto px-6 py-3.5 border border-white/40 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Sales</span>
            </button>
          </div>
        </section>
      </main>

      {/* Gallery Lightbox */}
      <GalleryLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={project.gallery}
        initialIndex={selectedPhotoIndex}
        title={project.title}
      />

      {/* Inquiry Modal */}
      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        propertyTitle={inquiryContext}
      />
    </div>
  );
}
