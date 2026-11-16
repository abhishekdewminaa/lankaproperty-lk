import { Development } from '../types/property';
import { useRouter } from '../hooks/useRouter';
import { formatPriceLkr } from '../utils/formatters';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { MapPin, Calendar, Layers, ArrowRight, Compass } from 'lucide-react';

interface DevelopmentShowcaseProps {
  developments: Development[];
}

export function DevelopmentShowcase({ developments }: DevelopmentShowcaseProps) {
  const { navigate } = useRouter();
  const prefersReduced = usePrefersReducedMotion();

  // Limit to at most 3 projects
  const projects = developments.slice(0, 3);

  return (
    <section
      aria-label="New Developments Showcase"
      className="py-16 sm:py-24 max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16 w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#DDE5DF]">
        <div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#18251E] tracking-tight">
            New Project Portfolio
          </h2>
          <p className="text-sm text-[#5F6B63] mt-1">
            Exclusive multi-unit residential schemes and coastal enclaves in Sri Lanka.
          </p>
        </div>

        <button
          onClick={() => navigate('/developments')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#176B45] hover:text-[#115236] self-start sm:self-auto"
        >
          <span>View All Projects</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DESKTOP STACKING CARDS (when not reduced motion) */}
      {!prefersReduced ? (
        <div className="hidden lg:block space-y-12">
          {projects.map((project, index) => {
            // Sequential sticky offsets to create a crisp architectural stacking sequence
            const topOffset = 112 + index * 24; // 112px, 136px, 160px beneath header

            return (
              <div
                key={project.id}
                style={{ top: `${topOffset}px` }}
                className="sticky bg-white border border-[#DDE5DF] rounded-[4px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow"
              >
                <div className="grid grid-cols-12 items-stretch">
                  {/* Left: Project Photography */}
                  <div className="col-span-6 relative aspect-16/10 xl:aspect-16/9 overflow-hidden bg-[#F5F8F5]">
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-white/95 text-[#103D2C] rounded-[2px] shadow-xs">
                        {project.status}
                      </span>
                      {project.masterplan && (
                        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px]">
                          Interactive Masterplan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Project Information */}
                  <div className="col-span-6 p-8 xl:p-10 flex flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#5F6B63]">
                        <MapPin className="w-3.5 h-3.5 text-[#176B45]" />
                        <span>{project.location.city}, {project.location.district}</span>
                        <span>·</span>
                        <Calendar className="w-3.5 h-3.5 text-[#176B45]" />
                        <span>Target {project.completionDate}</span>
                      </div>

                      <h3 className="text-2xl font-bold text-[#18251E]">
                        {project.title}
                      </h3>

                      <p className="text-xs uppercase font-extrabold tracking-wider text-[#176B45]">
                        {project.projectType}
                      </p>

                      <p className="text-sm text-[#5F6B63] leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                    </div>

                    {/* Specs & Pricing */}
                    <div className="pt-6 border-t border-[#DDE5DF] space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <span className="text-xs text-[#5F6B63] block">Starting Valuation</span>
                          <span className="text-2xl font-extrabold text-[#103D2C] tabular-nums">
                            {formatPriceLkr(project.startingPriceLkr, 'total')}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-[#18251E] bg-[#F5F8F5] px-3 py-1.5 rounded-[2px] border border-[#DDE5DF]">
                          {project.totalUnits} Units Total
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/developments/${project.slug}`)}
                          className="px-6 py-3 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors inline-flex items-center gap-2"
                        >
                          <span>Explore Development</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* MOBILE & REDUCED MOTION (Standard Vertical List) */}
      <div className={`space-y-6 ${!prefersReduced ? 'lg:hidden' : 'block'}`}>
        {projects.map((project) => (
          <article
            key={project.id}
            className="bg-white border border-[#DDE5DF] rounded-[3px] overflow-hidden flex flex-col"
          >
            <div className="relative aspect-16/10 w-full overflow-hidden bg-[#F5F8F5]">
              <img
                src={project.coverImage}
                alt={project.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-white text-[#103D2C] rounded-[2px]">
                  {project.status}
                </span>
                {project.masterplan && (
                  <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#176B45] text-white rounded-[2px]">
                    Masterplan
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs text-[#5F6B63] font-semibold">
                  {project.location.city}, {project.location.district} · Completion {project.completionDate}
                </p>
                <h3 className="text-xl font-bold text-[#18251E]">{project.title}</h3>
                <p className="text-xs font-bold text-[#176B45] uppercase">{project.projectType}</p>
                <p className="text-sm text-[#5F6B63] line-clamp-2 leading-relaxed">{project.description}</p>
              </div>

              <div className="pt-4 border-t border-[#DDE5DF] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#5F6B63] block">Starting From</span>
                  <span className="text-lg font-bold text-[#103D2C] tabular-nums">
                    {formatPriceLkr(project.startingPriceLkr, 'total')}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/developments/${project.slug}`)}
                  className="px-4 py-2.5 bg-[#176B45] text-white font-bold text-xs uppercase tracking-wider rounded-[3px] inline-flex items-center gap-1.5"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
