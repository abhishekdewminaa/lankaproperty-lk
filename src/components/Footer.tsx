import { useRouter } from '../hooks/useRouter';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-[#103D2C] text-[#E8F3EC] border-t border-[#176B45]/40 pt-14 pb-10">
      <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#176B45]/30">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <BrandLogo variant="dark" />
            </div>
            <p className="text-sm text-[#A3B8AD] leading-relaxed max-w-sm">
              Sri Lanka’s property marketplace for buying, selling, and renting land, houses, apartments, hotels, and business properties across all 25 districts.
            </p>
          </div>

          {/* Property Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Property Categories</h4>
            <ul className="space-y-2 text-sm text-[#A3B8AD]">
              <li>
                <button
                  onClick={() => navigate('/properties?type=land')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Land for Sale
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?type=house')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Houses for Sale & Rent
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?type=apartment')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Apartments
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?type=hotel')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Hotels & Resorts
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?type=business')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Business & Commercial
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Districts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Popular Districts</h4>
            <ul className="space-y-2 text-sm text-[#A3B8AD]">
              <li>
                <button
                  onClick={() => navigate('/properties?district=Colombo')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Colombo District
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?district=Gampaha')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Gampaha District
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?district=Galle')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Galle District
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/properties?district=Kandy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Kandy District
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/#district-directory');
                    const el = document.getElementById('district-directory');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[#9FE3B8] font-semibold hover:text-white transition-colors cursor-pointer"
                >
                  Browse All 25 Districts
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm text-[#A3B8AD]">
              <li>
                <button
                  onClick={() => navigate('/developments')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  New Developments
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/wanted-properties')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Wanted Properties
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/saved')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Saved Properties
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/advertising-packages')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Advertising Packages
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/list-property')}
                  className="text-[#9FE3B8] hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Post Your Property Free
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#A3B8AD]">
          <p>© {new Date().getFullYear()} LankaProperty.lk. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Sri Lanka Real Estate Marketplace</span>
            <span>|</span>
            <span>All 25 Districts</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
