import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { useRouter } from '../hooks/useRouter';
import { useSavedProperties } from '../hooks/useSavedProperties';
import { useCurrency, CurrencyCode, CURRENCIES } from '../context/CurrencyContext';
import { useCompare } from '../context/CompareContext';
import { userPortalService, PortalUser } from '../services/userPortalService';

interface HeaderProps {
  isHomePage?: boolean;
}

export function Header({ isHomePage = false }: HeaderProps) {
  const { pathname, searchParams, navigate } = useRouter();
  const { savedCount } = useSavedProperties();
  const { currency, setCurrency } = useCurrency();
  const { compareItems, setIsModalOpen } = useCompare();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
  const [portalUser, setPortalUser] = useState<PortalUser | null>(() => userPortalService.getCurrentUser());

  useEffect(() => {
    const unsub = userPortalService.subscribe(() => {
      setPortalUser(userPortalService.getCurrentUser());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const currentPurpose = searchParams.get('purpose');

  const navLinks = [
    {
      label: 'Buy',
      href: '/properties?purpose=buy',
      isActive: pathname === '/properties' && currentPurpose === 'buy',
    },
    {
      label: 'Rent',
      href: '/properties?purpose=rent',
      isActive: pathname === '/properties' && currentPurpose === 'rent',
    },
    {
      label: 'Land',
      href: '/properties?type=land',
      isActive: pathname === '/properties' && searchParams.get('type') === 'land',
    },
    {
      label: 'New Developments',
      href: '/developments',
      isActive: pathname.startsWith('/developments'),
    },
    {
      label: 'Wanted',
      href: '/wanted-properties',
      isActive: pathname === '/wanted-properties',
    },
    {
      label: 'Districts',
      href: '/#district-directory',
      isActive: pathname.startsWith('/districts'),
    },
    {
      label: 'Advertising Packages',
      href: '/advertising-packages',
      isActive: pathname === '/advertising-packages',
    },
  ];

  const handleNav = (href: string) => {
    if (href.startsWith('/#')) {
      const anchorId = href.substring(2);
      if (pathname === '/') {
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setMobileMenuOpen(false);
          return;
        }
      }
      navigate(href);
      setMobileMenuOpen(false);
      return;
    }
    navigate(href);
    setMobileMenuOpen(false);
  };

  const currencyOptions: CurrencyCode[] = ['LKR', 'USD', 'GBP', 'EUR', 'AUD'];

  const isTransparent = isHomePage && !isScrolled;

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <>
      <header
        className={`w-full ${
          isScrolled ? 'h-[64px]' : 'h-[72px]'
        } z-50 transition-all duration-300 ${
          isHomePage
            ? `fixed top-0 left-0 right-0 ${
                isTransparent
                  ? 'bg-[#0B2519]/85 backdrop-blur-md border-b border-white/15 text-white'
                  : 'bg-[#0B2519]/95 backdrop-blur-md border-b border-[#176B45]/40 text-white shadow-lg'
              }`
            : `sticky top-0 bg-white border-b border-[#DDE5DF] text-[#18251E] ${
                isScrolled ? 'shadow-[0_2px_10px_rgba(0,0,0,0.06)]' : ''
              }`
        }`}
      >
        <div className="max-w-[1440px] w-full h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 xl:gap-4">
          {/* Left: Brand Wordmark */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center text-left focus-visible:outline-2 focus-visible:outline-[#176B45] rounded-[2px] cursor-pointer shrink-0"
          >
            <BrandLogo variant={isHomePage ? 'dark' : 'light'} isCompact={isScrolled} />
          </button>

          {/* Centre: Navigation Links */}
          <nav className="hidden xl:flex items-center gap-5 2xl:gap-6 text-[13px] font-semibold shrink-0">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className={`relative py-1 transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[#176B45] ${
                  link.isActive
                    ? isHomePage
                      ? 'text-[#9FE3B8] font-bold'
                      : 'text-[#176B45] font-bold'
                    : isHomePage
                    ? 'text-white/90 hover:text-white'
                    : 'text-[#18251E] hover:text-[#176B45]'
                }`}
              >
                {link.label}
                {link.isActive && (
                  <motion.span
                    layoutId="header-active-nav"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                      isHomePage ? 'bg-[#9FE3B8]' : 'bg-[#176B45]'
                    }`}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Right: Actions Group */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            {/* Currency Switcher */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase rounded-[3px] border transition-colors cursor-pointer shrink-0 ${
                  isHomePage
                    ? 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                    : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C] hover:bg-[#F5F8F5]'
                }`}
                aria-expanded={currencyMenuOpen}
              >
                <span className={`hidden sm:inline ${isHomePage ? 'text-white/75 font-semibold' : 'text-[#5F6B63] font-semibold'}`}>
                  Currency:
                </span>
                <span className={isHomePage ? 'text-white font-bold' : 'text-[#103D2C] font-bold'}>
                  {currency}
                </span>
              </button>

              {currencyMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setCurrencyMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#DDE5DF] rounded-[3px] shadow-xl py-1 z-40 text-[#18251E]">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] border-b border-[#DDE5DF]/60">
                      Display Currency
                    </div>
                    {currencyOptions.map((code) => {
                      const cfg = CURRENCIES[code];
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setCurrency(code);
                            setCurrencyMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors duration-150 cursor-pointer ${
                            currency === code
                              ? 'bg-[#E8F3EC] text-[#176B45] font-bold'
                              : 'text-[#18251E] hover:bg-[#F5F8F5]'
                          }`}
                        >
                          <span>
                            {code} ({cfg.symbol})
                          </span>
                          {currency === code && (
                            <span className="text-[10px] font-semibold text-[#176B45]">Selected</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Compare Trigger */}
            {compareItems.length > 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-[3px] transition-colors cursor-pointer border shrink-0 ${
                  isHomePage
                    ? 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                    : 'bg-[#E8F3EC] text-[#103D2C] hover:bg-[#d5e8dc] border-[#176B45]/30'
                }`}
              >
                <span>Compare</span>
                <span className="inline-flex items-center justify-center text-[10px] font-bold px-1.5 h-4 bg-[#176B45] text-white rounded-[2px] tabular-nums">
                  {compareItems.length}
                </span>
              </button>
            )}

            {/* Saved Link (hidden on < sm since it's inside Mobile Menu) */}
            <button
              onClick={() => handleNav('/saved')}
              className={`hidden sm:flex relative items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 rounded-[3px] border cursor-pointer shrink-0 ${
                isHomePage
                  ? 'text-white border-white/25 bg-white/10 hover:bg-white/20'
                  : pathname === '/saved'
                  ? 'text-[#176B45] bg-[#E8F3EC] border-[#176B45]/30'
                  : 'text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C] hover:bg-[#F5F8F5]'
              }`}
            >
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="inline-flex items-center justify-center text-[10px] font-bold px-1.5 h-4 bg-[#176B45] text-white rounded-[2px] tabular-nums">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Logged-In User or Auth Actions */}
            {portalUser ? (
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-xs px-2.5 py-1.5 font-bold rounded-[3px] border ${
                    isHomePage
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-[#E8F3EC] text-[#103D2C] border-[#176B45]/20'
                  }`}
                >
                  <span
                    className={`uppercase text-[10px] mr-1 ${
                      isHomePage ? 'text-[#9FE3B8]' : 'text-[#176B45]'
                    }`}
                  >
                    {portalUser.role}:
                  </span>
                  <span>{portalUser.name}</span>
                </span>
                <button
                  onClick={() =>
                    handleNav(portalUser.role === 'agent' ? '/agent/dashboard' : '/owner/dashboard')
                  }
                  className="px-3 py-1.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[3px] transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => userPortalService.logout()}
                  className={`text-xs font-semibold transition-colors cursor-pointer px-1.5 ${
                    isHomePage ? 'text-white/80 hover:text-white' : 'text-[#5F6B63] hover:text-[#C93636]'
                  }`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 shrink-0 flex-nowrap">
                <button
                  onClick={() => handleNav('/list-property')}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isHomePage
                      ? 'bg-[#176B45] hover:bg-[#115236] text-white border border-[#9FE3B8]/30'
                      : 'bg-[#103D2C] hover:bg-[#176B45] text-white'
                  }`}
                >
                  Post Property Free
                </button>

                {/* Login Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMenuOpen(!loginMenuOpen);
                      setRegisterMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer whitespace-nowrap ${
                      isHomePage
                        ? loginMenuOpen
                          ? 'bg-white text-[#103D2C] border-white'
                          : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                        : loginMenuOpen
                        ? 'bg-[#103D2C] text-white border-[#103D2C]'
                        : 'bg-white text-[#103D2C] border-[#103D2C] hover:bg-[#F5F8F5]'
                    }`}
                  >
                    Login
                  </button>

                  {loginMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setLoginMenuOpen(false)} />
                      <div className="absolute right-0 mt-1.5 w-52 bg-white border border-[#DDE5DF] rounded-[3px] shadow-xl py-1 z-40 text-[#18251E]">
                        <button
                          onClick={() => {
                            setLoginMenuOpen(false);
                            handleNav('/auth?mode=login&role=owner');
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#18251E] hover:bg-[#F5F8F5] hover:text-[#103D2C] block cursor-pointer"
                        >
                          Property Owner Login
                        </button>
                        <button
                          onClick={() => {
                            setLoginMenuOpen(false);
                            handleNav('/auth?mode=login&role=agent');
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#18251E] hover:bg-[#F5F8F5] hover:text-[#103D2C] block cursor-pointer"
                        >
                          Real Estate Agent Login
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Register Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMenuOpen(!registerMenuOpen);
                      setLoginMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer whitespace-nowrap ${
                      isHomePage
                        ? registerMenuOpen
                          ? 'bg-[#176B45] text-white border-[#176B45]'
                          : 'bg-white text-[#103D2C] border-white hover:bg-neutral-100'
                        : registerMenuOpen
                        ? 'bg-[#103D2C] text-white border-[#103D2C]'
                        : 'bg-[#103D2C] text-white border-[#103D2C] hover:bg-[#176B45]'
                    }`}
                  >
                    Register
                  </button>

                  {registerMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setRegisterMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-56 bg-white border border-[#DDE5DF] rounded-[3px] shadow-xl py-1 z-40 text-[#18251E]">
                        <button
                          onClick={() => {
                            setRegisterMenuOpen(false);
                            handleNav('/auth?mode=register&role=owner');
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#18251E] hover:bg-[#F5F8F5] hover:text-[#103D2C] block cursor-pointer"
                        >
                          Property Owner Registration
                        </button>
                        <button
                          onClick={() => {
                            setRegisterMenuOpen(false);
                            handleNav('/auth?mode=register&role=agent');
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#18251E] hover:bg-[#F5F8F5] hover:text-[#103D2C] block cursor-pointer"
                        >
                          Real Estate Agent Registration
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mobile / Tablet Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`xl:hidden px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[3px] border cursor-pointer shrink-0 ${
                isHomePage
                  ? 'text-white border-white/30 bg-white/10 hover:bg-white/20'
                  : 'text-[#18251E] border-[#DDE5DF] bg-[#F5F8F5] hover:border-[#103D2C]'
              }`}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {/* 2px Scroll Progress Hairline Bar */}
        <motion.div
          style={{ scaleX }}
          className={`h-[2px] w-full origin-left ${
            isHomePage ? 'bg-[#9FE3B8]' : 'bg-[#176B45]'
          }`}
        />
      </header>

      {/* Accessible Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation"
          className="fixed inset-0 z-50 xl:hidden flex"
        >
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#DDE5DF]">
                <BrandLogo variant="light" size="sm" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#5F6B63] hover:text-[#18251E] border border-[#DDE5DF] rounded-[3px] cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Currency Selector inside Mobile Menu */}
              <div className="py-4 border-b border-[#DDE5DF]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mb-2">
                  Select Currency
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {currencyOptions.map((code) => (
                    <button
                      key={code}
                      onClick={() => setCurrency(code)}
                      className={`py-1.5 text-xs font-bold rounded-[3px] transition-colors border ${
                        currency === code
                          ? 'bg-[#103D2C] text-white border-[#103D2C]'
                          : 'bg-[#F5F8F5] text-[#18251E] border-[#DDE5DF]'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-4 space-y-1">
                <button
                  onClick={() => handleNav('/')}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-[3px] transition-colors ${
                    pathname === '/' ? 'text-[#176B45] bg-[#E8F3EC]' : 'text-[#18251E] hover:bg-[#F5F8F5]'
                  }`}
                >
                  Home
                </button>
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNav(link.href)}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-[3px] transition-colors ${
                      link.isActive ? 'text-[#176B45] bg-[#E8F3EC]' : 'text-[#18251E] hover:bg-[#F5F8F5]'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => handleNav('/saved')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-[3px] transition-colors ${
                    pathname === '/saved' ? 'text-[#176B45] bg-[#E8F3EC]' : 'text-[#18251E] hover:bg-[#F5F8F5]'
                  }`}
                >
                  <span>Saved Properties</span>
                  {savedCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-[#176B45] text-white rounded-[2px] tabular-nums">
                      {savedCount}
                    </span>
                  )}
                </button>

                {compareItems.length > 0 && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-[3px] text-[#103D2C] bg-[#E8F3EC]"
                  >
                    <span>Compare Properties</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-[#176B45] text-white rounded-[2px] tabular-nums">
                      {compareItems.length}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-5 border-t border-[#DDE5DF] space-y-2.5">
              {portalUser ? (
                <>
                  <button
                    onClick={() => handleNav(portalUser.role === 'agent' ? '/agent/dashboard' : '/owner/dashboard')}
                    className="w-full py-2.5 bg-[#103D2C] text-white font-bold text-center rounded-[3px] text-xs uppercase tracking-wider"
                  >
                    Open {portalUser.role === 'agent' ? 'Agent' : 'Owner'} Dashboard
                  </button>
                  <button
                    onClick={() => userPortalService.logout()}
                    className="w-full py-2 bg-[#F5F8F5] border border-[#DDE5DF] text-[#C93636] font-bold text-center rounded-[3px] text-xs"
                  >
                    Logout ({portalUser.name})
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNav('/auth?mode=login&role=owner')}
                      className="py-2.5 bg-[#FAFBF9] border border-[#103D2C] text-[#103D2C] font-bold text-center rounded-[3px] text-xs cursor-pointer"
                    >
                      Owner Login
                    </button>
                    <button
                      onClick={() => handleNav('/auth?mode=login&role=agent')}
                      className="py-2.5 bg-[#103D2C] text-white font-bold text-center rounded-[3px] text-xs cursor-pointer"
                    >
                      Agent Login
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNav('/auth?mode=register&role=owner')}
                      className="py-2.5 bg-white border border-[#176B45] text-[#176B45] font-bold text-center rounded-[3px] text-xs cursor-pointer"
                    >
                      Owner Register
                    </button>
                    <button
                      onClick={() => handleNav('/auth?mode=register&role=agent')}
                      className="py-2.5 bg-[#176B45] text-white font-bold text-center rounded-[3px] text-xs cursor-pointer"
                    >
                      Agent Register
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => handleNav('/list-property')}
                className="w-full py-3 bg-[#176B45] hover:bg-[#103D2C] text-white font-bold text-center rounded-[3px] cursor-pointer transition-colors text-xs uppercase tracking-wider"
              >
                Post Your Property Free
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
