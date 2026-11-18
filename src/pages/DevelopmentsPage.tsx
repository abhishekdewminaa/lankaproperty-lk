import { useState, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { DEVELOPMENTS_DATA } from '../data/developments';
import { useCurrency } from '../context/CurrencyContext';

export function DevelopmentsPage() {
  const { navigate } = useRouter();
  const { currency, formatPrice } = useCurrency();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'galle' | 'colombo' | 'kandy'>('all');

  const filteredProjects = useMemo(() => {
    if (selectedFilter === 'all') return DEVELOPMENTS_DATA;
    if (selectedFilter === 'galle')
      return DEVELOPMENTS_DATA.filter((p) => p.location.district.toLowerCase() === 'galle');
    if (selectedFilter === 'colombo')
      return DEVELOPMENTS_DATA.filter((p) => p.location.district.toLowerCase() === 'colombo');
    if (selectedFilter === 'kandy')
      return DEVELOPMENTS_DATA.filter((p) => p.location.district.toLowerCase() === 'kandy');
    return DEVELOPMENTS_DATA;
  }, [selectedFilter]);

  const flagshipProject = DEVELOPMENTS_DATA[0];

  return (
    <div className="bg-[#FAFBF9] min-h-screen pb-20 text-[#18251E]">
      {/* Top Breadcrumb Bar */}
      <div className="w-full bg-white border-b border-[#DDE5DF] py-3">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex items-center justify-between text-xs text-[#5F6B63]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="hover:text-[#176B45] font-semibold transition-colors cursor-pointer"
            >
              Home
            </button>
            <span className="text-[#DDE5DF]">/</span>
            <span className="text-[#103D2C] font-bold">New Developments</span>
          </div>
          <div className="text-xs font-semibold text-[#5F6B63]">
            Currency: <strong className="text-[#103D2C]">{currency}</strong>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-[#DDE5DF] py-10 sm:py-14">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-3xl space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
              Residential & Commercial Projects
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#103D2C] tracking-tight leading-tight">
              New Developments in Sri Lanka
            </h1>
            <p className="text-sm sm:text-base text-[#5F6B63] leading-relaxed">
              Explore new apartment towers, gated residential communities, and coastal villa developments across Colombo, Galle, and Kandy.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DDE5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-[#103D2C] text-white'
                    : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                All Projects ({DEVELOPMENTS_DATA.length})
              </button>
              <button
                onClick={() => setSelectedFilter('colombo')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                  selectedFilter === 'colombo'
                    ? 'bg-[#103D2C] text-white'
                    : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                Colombo
              </button>
              <button
                onClick={() => setSelectedFilter('galle')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                  selectedFilter === 'galle'
                    ? 'bg-[#103D2C] text-white'
                    : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                Galle & South Coast
              </button>
              <button
                onClick={() => setSelectedFilter('kandy')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                  selectedFilter === 'kandy'
                    ? 'bg-[#103D2C] text-white'
                    : 'bg-[#FAFBF9] text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
                }`}
              >
                Kandy
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Project */}
      {selectedFilter === 'all' && (
        <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-12">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45]">
              Featured Development
            </span>
            <span className="text-xs text-[#5F6B63] font-semibold">
              {flagshipProject.location.city}, {flagshipProject.location.district}
            </span>
          </div>

          <div className="bg-white border border-[#DDE5DF] rounded-[4px] overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 relative bg-[#F5F8F5] min-h-[320px] lg:min-h-[420px]">
              <img
                src={flagshipProject.coverImage}
                alt={flagshipProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#103D2C] text-white text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                  {flagshipProject.status}
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5F6B63]">
                  <span>
                    {flagshipProject.location.city}, {flagshipProject.location.district}
                  </span>
                  <span>·</span>
                  <span>Completion {flagshipProject.completionDate}</span>
                </div>

                <h2 className="text-2xl font-bold text-[#103D2C] tracking-tight leading-snug">
                  {flagshipProject.title}
                </h2>

                <p className="text-xs font-semibold text-[#176B45]">{flagshipProject.tagline}</p>

                <p className="text-xs text-[#5F6B63] leading-relaxed line-clamp-4">
                  {flagshipProject.description}
                </p>

                <div className="p-3.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">
                      Starting Price
                    </span>
                    <span className="text-base font-extrabold text-[#103D2C]">
                      {formatPrice(flagshipProject.startingPriceLkr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">
                      Total Units
                    </span>
                    <span className="text-xs font-bold text-[#18251E]">
                      {flagshipProject.totalUnits} Units
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDE5DF]">
                <button
                  onClick={() => navigate(`/developments/${flagshipProject.slug}`)}
                  className="w-full py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
                >
                  View Project Details & Units
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Developments Grid */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-12">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#103D2C] tracking-tight">
            All Active Developments ({filteredProjects.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              onClick={() => navigate(`/developments/${project.slug}`)}
              className="bg-white border border-[#DDE5DF] hover:border-[#103D2C] rounded-[4px] overflow-hidden transition-all shadow-2xs flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="relative aspect-16/10 bg-[#FAFBF9] overflow-hidden">
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-[#103D2C] text-white text-[10px] font-bold uppercase rounded-[2px]">
                      {project.status}
                    </span>
                  </div>
                  <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded-[2px]">
                    {project.totalUnits} Units
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#5F6B63]">
                    <span>
                      {project.location.city}, {project.location.district}
                    </span>
                    <span>·</span>
                    <span>Delivery {project.completionDate}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#18251E] leading-snug group-hover:text-[#103D2C] transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-xs text-[#5F6B63] leading-relaxed line-clamp-2">
                    {project.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 bg-white">
                <div className="pt-3.5 border-t border-[#DDE5DF] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">
                      Starting From
                    </span>
                    <span className="text-base font-extrabold text-[#103D2C] tabular-nums">
                      {formatPrice(project.startingPriceLkr)}
                    </span>
                  </div>

                  <span className="px-3.5 py-2 bg-[#103D2C] group-hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors">
                    View Project
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
