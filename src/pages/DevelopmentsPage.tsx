import React, { useState, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { DEVELOPMENTS_DATA } from '../data/developments';
import { formatPriceLkr } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import {
  ArrowRight,
  MapPin,
  Calendar,
  Building,
  Sparkles,
  Layers,
  Compass,
  CheckCircle2,
  FileText,
  Phone,
  ShieldCheck,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

export function DevelopmentsPage() {
  const { navigate } = useRouter();
  const { currency, formatPrice } = useCurrency();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'galle' | 'colombo' | 'kandy'>('all');

  const filteredProjects = useMemo(() => {
    if (selectedFilter === 'all') return DEVELOPMENTS_DATA;
    if (selectedFilter === 'galle') return DEVELOPMENTS_DATA.filter((p) => p.location.district.toLowerCase() === 'galle');
    if (selectedFilter === 'colombo') return DEVELOPMENTS_DATA.filter((p) => p.location.district.toLowerCase() === 'colombo');
    if (selectedFilter === 'kandy') return DEVELOPMENTS_DATA.filter((p) => p.location.district.toLowerCase() === 'kandy');
    return DEVELOPMENTS_DATA;
  }, [selectedFilter]);

  // Featured flagship project (Talpe Bay)
  const flagshipProject = DEVELOPMENTS_DATA[0];

  return (
    <div className="bg-[#FAFBF9] min-h-screen pb-24 text-[#18251E]">
      {/* Top Breadcrumb Bar */}
      <div className="w-full bg-white border-b border-[#DDE5DF] py-3.5">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex items-center justify-between text-xs text-[#5F6B63]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="hover:text-[#176B45] font-semibold transition-colors cursor-pointer"
            >
              LankaProperty.lk
            </button>
            <span className="text-[#A3B8AD]">/</span>
            <span className="text-[#103D2C] font-bold">Premier Developments & Masterplans</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#176B45] bg-[#E8F3EC] px-3 py-1 rounded-[2px] border border-[#176B45]/20">
            <span>Marketplace Currency:</span>
            <span className="font-bold uppercase tracking-wider">{currency}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HERO SECTION: ARCHITECTURAL EDITORIAL MASTHEAD
          ========================================================================= */}
      <section className="bg-white border-b border-[#DDE5DF] py-14 lg:py-18">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-4xl space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#103D2C] tracking-tight leading-tight">
              Premier Projects & Architectural Enclaves in Sri Lanka
            </h1>
            <p className="text-sm sm:text-base text-[#5F6B63] leading-relaxed max-w-3xl">
              Curated master-planned communities, oceanfront private pavilion villas, and sustainable high-rise residential towers across Colombo, the Galle Coastline, and the Central Highlands.
            </p>
          </div>

          {/* Quick Filter Tabs & Metrics Bar */}
          <div className="mt-10 pt-8 border-t border-[#DDE5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-[#103D2C] text-white shadow-xs'
                    : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                All Masterplans ({DEVELOPMENTS_DATA.length})
              </button>
              <button
                onClick={() => setSelectedFilter('galle')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                  selectedFilter === 'galle'
                    ? 'bg-[#103D2C] text-white shadow-xs'
                    : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                Southern Coastline (Galle)
              </button>
              <button
                onClick={() => setSelectedFilter('colombo')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                  selectedFilter === 'colombo'
                    ? 'bg-[#103D2C] text-white shadow-xs'
                    : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                Colombo Sky Towers
              </button>
              <button
                onClick={() => setSelectedFilter('kandy')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                  selectedFilter === 'kandy'
                    ? 'bg-[#103D2C] text-white shadow-xs'
                    : 'bg-[#F5F8F5] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                Kandy Highlands
              </button>
            </div>

            <span className="text-xs font-semibold text-[#5F6B63]">
              All projects verified with UDA / BOI approvals & clear freehold deeds.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: FLAGSHIP HERO SHOWCASE (TALPE BAY OCEAN RESIDENCES)
          ========================================================================= */}
      {selectedFilter === 'all' && (
        <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-14">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-[#176B45]">
              Featured Flagship Masterplan
            </span>
            <span className="text-xs text-[#5F6B63] font-semibold">
              Talpe Beachfront · Galle District
            </span>
          </div>

          <div className="bg-white border-2 border-[#103D2C] rounded-[4px] overflow-hidden shadow-md grid grid-cols-1 lg:grid-cols-12">
            {/* Visual Hero Side (7 cols) */}
            <div className="lg:col-span-7 relative bg-black/5 min-h-[360px] lg:min-h-[480px]">
              <img
                src={flagshipProject.coverImage}
                alt={flagshipProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#103D2C] text-white text-[10px] font-black uppercase tracking-widest rounded-[2px] shadow-xs">
                  {flagshipProject.status}
                </span>
                <span className="px-3 py-1 bg-white/95 text-[#176B45] text-[10px] font-black uppercase tracking-widest rounded-[2px] shadow-xs border border-[#176B45]/30">
                  Interactive Masterplan Live
                </span>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 rounded-[2px] text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FE3B8] block">
                  Tropical Modernist Architecture
                </span>
                <span className="text-lg font-bold">Direct lineage from Geoffrey Bawa's pavilion vernacular</span>
              </div>
            </div>

            {/* Content & Specs Side (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5F6B63]">
                  <MapPin className="w-3.5 h-3.5 text-[#176B45]" />
                  <span>{flagshipProject.location.city}, {flagshipProject.location.district}</span>
                  <span>·</span>
                  <Calendar className="w-3.5 h-3.5 text-[#176B45]" />
                  <span>Completion {flagshipProject.completionDate}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight leading-snug">
                  {flagshipProject.title}
                </h2>

                <p className="text-xs font-bold text-[#176B45]">
                  {flagshipProject.tagline}
                </p>

                <p className="text-xs text-[#5F6B63] leading-relaxed line-clamp-4">
                  {flagshipProject.description}
                </p>

                {/* Architectural Specs Strip */}
                <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">Starting Price:</span>
                    <span className="text-base font-black text-[#103D2C]">
                      {formatPrice(flagshipProject.startingPriceLkr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">Total Portfolio:</span>
                    <span className="text-xs font-bold text-[#18251E]">
                      {flagshipProject.totalUnits} Private Pavilion Villas
                    </span>
                  </div>
                </div>

                {/* Unit Mix Preview Pill */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase text-[#5F6B63] block">Unit Availability:</span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {flagshipProject.unitTypes.map((u, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded-[2px] border font-semibold ${
                          u.availableCount > 0
                            ? 'bg-[#E8F3EC] text-[#103D2C] border-[#176B45]/30'
                            : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                        }`}
                      >
                        {u.name} ({u.availableCount > 0 ? `${u.availableCount} Avail` : 'Sold'})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDE5DF] space-y-2">
                <button
                  onClick={() => navigate(`/developments/${flagshipProject.slug}`)}
                  className="w-full py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Explore Interactive Masterplan & Units</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: CURATED DEVELOPMENTS GRID (ASYNCHRONOUS EDITORIAL CARDS)
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-14">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#176B45]">
            Portfolio Directory
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight mt-0.5">
            Active Master-Planned Developments
          </h2>
          <p className="text-xs sm:text-sm text-[#5F6B63] mt-1">
            Explore complete architectural floorplans, unit availability breakdowns, and investment specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[3px] overflow-hidden transition-all duration-300 shadow-2xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Photo with aspect-ratio lock */}
                <div className="relative aspect-16/10 bg-[#FAFBF9] overflow-hidden">
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-[#103D2C] text-white text-[10px] font-bold uppercase rounded-[2px] shadow-xs">
                      {project.status}
                    </span>
                    {project.masterplan && (
                      <span className="px-2 py-0.5 bg-white/95 text-[#176B45] text-[10px] font-bold uppercase rounded-[2px] shadow-xs border border-[#176B45]/20">
                        Interactive Units
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded-[2px]">
                    {project.totalUnits} Residences
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#5F6B63]">
                    <MapPin className="w-3.5 h-3.5 text-[#176B45]" />
                    <span>{project.location.city}, {project.location.district}</span>
                    <span>·</span>
                    <Calendar className="w-3.5 h-3.5 text-[#176B45]" />
                    <span>Q{project.completionDate.replace(/[^0-9]/g, '') || '4'} Delivery</span>
                  </div>

                  <h3 className="text-xl font-bold text-[#103D2C] leading-snug group-hover:text-[#176B45] transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-xs font-semibold text-[#176B45] line-clamp-1">
                    {project.tagline}
                  </p>

                  <p className="text-xs text-[#5F6B63] leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  {/* Amenities Preview */}
                  <div className="pt-3 border-t border-[#DDE5DF]/60">
                    <div className="flex flex-wrap gap-1 text-[10px] text-[#18251E]">
                      {project.amenities.slice(0, 3).map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-5 pt-0 bg-white">
                <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">Starting From:</span>
                    <span className="text-lg font-black text-[#103D2C] tabular-nums">
                      {formatPrice(project.startingPriceLkr)}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/developments/${project.slug}`)}
                    className="px-4 py-2.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>View Units</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: INSTITUTIONAL DEVELOPER CONSULTATION & PRIVATE PRESENTATION
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-8">
        <div className="bg-[#18251E] text-white rounded-[3px] p-8 md:p-12 border border-[#2D3E35]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#9FE3B8]">
                Confidential Institutional Advisory
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Schedule a Private Masterplan Briefing
              </h3>
              <p className="text-xs sm:text-sm text-[#A3B8AD] leading-relaxed max-w-2xl">
                Are you an overseas buyer, institutional fund, or private family office seeking comprehensive survey blueprints, cadastral certifications, or whole-estate allocations?
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <button
                onClick={() => navigate('/advertising-packages')}
                className="px-6 py-3 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors text-center cursor-pointer shadow-xs"
              >
                Advertise New Masterplan →
              </button>
              <button
                onClick={() => navigate('/wanted-properties')}
                className="px-6 py-3 bg-transparent hover:bg-white/10 text-white border border-[#A3B8AD] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors text-center cursor-pointer"
              >
                Post Institutional Buyer Demand →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
