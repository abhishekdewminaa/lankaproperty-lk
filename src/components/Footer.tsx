import { useRouter } from '../hooks/useRouter';
import { ArrowUpRight, Home } from 'lucide-react';

export function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-[#103D2C] text-[#E8F3EC] border-t border-[#176B45]/40 pt-16 pb-12">
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-14 border-b border-[#176B45]/30">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-2xl font-bold tracking-tight text-white block">
              Lanka<span className="text-[#E8F3EC]">Property</span>
              <span className="text-xs uppercase tracking-wider text-[#A3B8AD] ml-1.5">.lk</span>
            </span>
            <p className="text-sm text-[#A3B8AD] leading-relaxed max-w-sm">
              Sri Lanka’s architectural property marketplace. Curated houses, luxury coastal villas, prime residential land, and premier master-planned developments.
            </p>
            <div className="pt-2">
              <span className="inline-block text-xs uppercase tracking-widest text-[#E8F3EC]/70 font-semibold border-l-2 border-[#C93636] pl-2.5">
                Modern Tropical Editorial
              </span>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Marketplace</h4>
            <ul className="space-y-2 text-sm text-[#A3B8AD]">
              <li>
                <button
                  onClick={() => navigate('/properties?purpose=buy')}
                  className="hover:text-white transition-colors"
                >
                  Properties for Sale
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?purpose=rent')}
                  className="hover:text-white transition-colors"
                >
                  Properties for Rent
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?purpose=land')}
                  className="hover:text-white transition-colors"
                >
                  Residential & Beach Land
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?type=apartment')}
                  className="hover:text-white transition-colors"
                >
                  Colombo Luxury Apartments
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/wanted-properties')}
                  className="hover:text-white transition-colors font-bold text-[#9FE3B8]"
                >
                  Wanted Property Board →
                </button>
              </li>
            </ul>
          </div>

          {/* Prime Locations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Curated Regions</h4>
            <ul className="space-y-2 text-sm text-[#A3B8AD]">
              <li>
                <button
                  onClick={() => navigate('/districts/colombo')}
                  className="hover:text-white transition-colors"
                >
                  Colombo District Hub
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/districts/galle')}
                  className="hover:text-white transition-colors"
                >
                  Galle & Southern Coast Hub
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/districts/kandy')}
                  className="hover:text-white transition-colors"
                >
                  Kandy Central Highlands
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/districts/matara')}
                  className="hover:text-white transition-colors"
                >
                  Matara & Mirissa Coast
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/#district-cadastral-explorer');
                    const el = document.getElementById('district-cadastral-explorer');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[#9FE3B8] font-bold hover:text-white transition-colors"
                >
                  All 25 Districts Cadastre →
                </button>
              </li>
            </ul>
          </div>

          {/* New Projects & Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/90">Projects & Sellers</h4>
            <ul className="space-y-2 text-sm text-[#A3B8AD]">
              <li>
                <button
                  onClick={() => navigate('/developments')}
                  className="hover:text-white transition-colors"
                >
                  New Developments
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/developments/galle-fort-terraces-talpe-bay')}
                  className="hover:text-white transition-colors"
                >
                  Interactive Masterplans
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/saved')}
                  className="hover:text-white transition-colors"
                >
                  Compare Listings
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/advertising-packages')}
                  className="hover:text-white transition-colors"
                >
                  Advertising Packages
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/list-property')}
                  className="inline-flex items-center gap-1 text-[#E8F3EC] hover:text-white font-semibold transition-colors"
                >
                  <span>List Property</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C93636]" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A3B8AD]">
          <p>© {new Date().getFullYear()} LankaProperty.lk. Demonstration Property Marketplace Platform.</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <span>Prices displayed in LKR</span>
            <span>·</span>
            <span>Real Estate Sri Lanka</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
