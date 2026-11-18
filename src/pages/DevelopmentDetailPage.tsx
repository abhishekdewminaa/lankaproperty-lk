import { useState, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { DEVELOPMENTS_DATA } from '../data/developments';
import { formatPriceLkr } from '../utils/formatters';
import { InteractiveMasterplan } from '../components/InteractiveMasterplan';
import { GalleryLightbox } from '../components/GalleryLightbox';
import { InquiryModal } from '../components/InquiryModal';
import { MasterplanUnit } from '../types/property';

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
      `Hello, I am inquiring regarding "${project.title}" on LankaProperty.lk. Please share project details. URL: ${window.location.href}`
    );
    window.open(`https://wa.me/94772345678?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Top Breadcrumb Bar */}
      <div className="bg-[#FAFBF9] border-b border-[#DDE5DF] py-3 text-xs text-[#5F6B63]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hover:text-[#18251E] cursor-pointer">
              Home
            </button>
            <span>/</span>
            <button
              onClick={() => navigate('/developments')}
              className="hover:text-[#18251E] cursor-pointer"
            >
              Developments
            </button>
            <span>/</span>
            <span className="text-[#18251E] font-semibold line-clamp-1">{project.title}</span>
          </nav>

          <button
            onClick={() => navigate('/developments')}
            className="font-bold text-[#103D2C] hover:text-[#176B45] cursor-pointer"
          >
            Back to Developments
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative aspect-21/9 min-h-[340px] max-h-[520px] w-full overflow-hidden bg-[#103D2C]">
        <img
          src={project.coverImage}
          alt={project.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pb-8 sm:pb-10 text-white">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-white text-[#103D2C] rounded-[2px]">
                {project.status}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px]">
                {project.projectType}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {project.title}
            </h1>

            <p className="text-sm sm:text-base text-[#DDE5DF] font-medium leading-relaxed">
              {project.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-8 space-y-12">
        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] text-xs">
          <div>
            <span className="text-[#5F6B63] block">Starting Price</span>
            <span className="text-lg sm:text-xl font-bold text-[#103D2C] block mt-0.5 tabular-nums">
              {formatPriceLkr(project.startingPriceLkr, 'total')}
            </span>
          </div>

          <div>
            <span className="text-[#5F6B63] block">Completion Date</span>
            <span className="text-lg sm:text-xl font-bold text-[#18251E] block mt-0.5">
              {project.completionDate}
            </span>
          </div>

          <div>
            <span className="text-[#5F6B63] block">Total Units</span>
            <span className="text-lg sm:text-xl font-bold text-[#18251E] block mt-0.5">
              {project.totalUnits} Units
            </span>
          </div>

          <div>
            <span className="text-[#5F6B63] block">Location</span>
            <span className="text-lg sm:text-xl font-bold text-[#18251E] block mt-0.5">
              {project.location.city}, {project.location.district}
            </span>
          </div>
        </div>

        {/* Project Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#18251E] border-b border-[#DDE5DF] pb-3">
              Project Overview
            </h2>
            <p className="text-sm sm:text-base text-[#2C3A32] leading-relaxed">
              {project.description}
            </p>
            {project.architecturalStory && (
              <div className="p-5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#103D2C]">
                  Design & Construction Highlights
                </h3>
                <p className="text-sm text-[#5F6B63] leading-relaxed">
                  {project.architecturalStory}
                </p>
              </div>
            )}
          </div>

          {/* Gallery Preview Box */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-[#176B45] block">
              Project Gallery ({project.gallery.length} Photos)
            </span>
            <div
              onClick={() => {
                setSelectedPhotoIndex(0);
                setLightboxOpen(true);
              }}
              className="relative aspect-16/10 rounded-[4px] overflow-hidden border border-[#DDE5DF] group cursor-pointer"
            >
              <img
                src={project.gallery[0]}
                alt={`${project.title} gallery`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                <span className="px-4 py-2 bg-white/95 text-[#103D2C] text-xs font-bold uppercase tracking-wider rounded-[3px]">
                  Open Gallery
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Masterplan */}
        {project.masterplan && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#18251E]">
                {project.masterplan.title}
              </h2>
              <p className="text-sm text-[#5F6B63] mt-0.5">{project.masterplan.subtext}</p>
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#18251E]">
            Available Unit Types & Pricing
          </h2>

          <div className="overflow-x-auto border border-[#DDE5DF] rounded-[4px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAFBF9] text-[#18251E] border-b border-[#DDE5DF] text-xs uppercase font-bold tracking-wider">
                  <th className="p-4">Unit Type</th>
                  <th className="p-4">Bedrooms</th>
                  <th className="p-4">Bathrooms</th>
                  <th className="p-4">Floor Area</th>
                  <th className="p-4">Starting Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Inquire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]">
                {project.unitTypes.map((type) => (
                  <tr key={type.name} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="p-4 font-bold text-[#103D2C]">{type.name}</td>
                    <td className="p-4">{type.bedrooms} Beds</td>
                    <td className="p-4">{type.bathrooms} Baths</td>
                    <td className="p-4">{type.areaSqFt} sq ft</td>
                    <td className="p-4 font-extrabold text-[#103D2C] tabular-nums">
                      {formatPriceLkr(type.startingPriceLkr, 'total')}
                    </td>
                    <td className="p-4">
                      {type.availableCount > 0 ? (
                        <span className="text-[#176B45] font-semibold">
                          {type.availableCount} Available
                        </span>
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
                        className="text-xs font-bold text-[#176B45] hover:underline cursor-pointer"
                      >
                        Inquire
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
          <h2 className="text-xl sm:text-2xl font-bold text-[#18251E]">
            Project Features & Amenities
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {project.amenities.map((amenity) => (
              <div
                key={amenity}
                className="p-3.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] flex items-center gap-2.5 text-sm text-[#18251E]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#176B45] shrink-0" />
                <span className="font-medium">{amenity}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        {project.faqs && project.faqs.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-[#DDE5DF]">
            <h2 className="text-xl sm:text-2xl font-bold text-[#18251E]">
              Frequently Asked Questions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] space-y-2"
                >
                  <h3 className="text-sm font-bold text-[#18251E]">{faq.question}</h3>
                  <p className="text-xs text-[#5F6B63] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Inquiry Banner */}
        <section className="p-6 sm:p-10 bg-[#103D2C] text-white rounded-[4px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-xs uppercase font-bold tracking-wider text-[#9FE3B8]">
              Project Sales Desk
            </span>
            <h3 className="text-xl sm:text-2xl font-bold">
              Request Floor Plans & Pricing for {project.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#A3B8AD]">
              Contact our sales team for unit availability, payment schedules, and site viewings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setInquiryContext(project.title);
                setInquiryModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-white text-[#103D2C] hover:bg-[#E8F3EC] font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
            >
              Send Inquiry
            </button>
            <button
              onClick={handleWhatsApp}
              className="w-full sm:w-auto px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
            >
              WhatsApp Sales
            </button>
          </div>
        </section>
      </main>

      <GalleryLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={project.gallery}
        initialIndex={selectedPhotoIndex}
        title={project.title}
      />

      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        propertyTitle={inquiryContext}
      />
    </div>
  );
}
