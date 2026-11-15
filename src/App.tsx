import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from './hooks/useRouter';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { CurrencyProvider } from './context/CurrencyContext';
import { CompareProvider } from './context/CompareContext';
import { CompareTray } from './components/CompareTray';
import { SuperAdminSecurityModal } from './components/SuperAdminSecurityModal';
import { SeoHead } from './components/SeoHead';
import { superAdminSecurityService } from './services/superAdminSecurityService';

// Code-split pages for high-speed initial bundle performance
const DistrictDetailPage = lazy(() =>
  import('./pages/DistrictDetailPage').then((m) => ({ default: m.DistrictDetailPage }))
);
const WantedPropertiesPage = lazy(() =>
  import('./pages/WantedPropertiesPage').then((m) => ({ default: m.WantedPropertiesPage }))
);
const DevelopmentsPage = lazy(() =>
  import('./pages/DevelopmentsPage').then((m) => ({ default: m.DevelopmentsPage }))
);
const DevelopmentDetailPage = lazy(() =>
  import('./pages/DevelopmentDetailPage').then((m) => ({ default: m.DevelopmentDetailPage }))
);
const SavedPage = lazy(() =>
  import('./pages/SavedPage').then((m) => ({ default: m.SavedPage }))
);
const ListPropertyPage = lazy(() =>
  import('./pages/ListPropertyPage').then((m) => ({ default: m.ListPropertyPage }))
);
const AdvertisingPackagesPage = lazy(() =>
  import('./pages/AdvertisingPackagesPage').then((m) => ({ default: m.AdvertisingPackagesPage }))
);
const AuthPortalPage = lazy(() =>
  import('./pages/AuthPortalPage').then((m) => ({ default: m.AuthPortalPage }))
);
const OwnerDashboardPage = lazy(() =>
  import('./pages/OwnerDashboardPage').then((m) => ({ default: m.OwnerDashboardPage }))
);
const AgentDashboardPage = lazy(() =>
  import('./pages/AgentDashboardPage').then((m) => ({ default: m.AgentDashboardPage }))
);
const AdminRouter = lazy(() =>
  import('./admin/AdminRouter').then((m) => ({ default: m.AdminRouter }))
);

const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
    <div className="w-8 h-8 border-2 border-[#103D2C] border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs uppercase tracking-widest text-[#5F6B63] font-bold">
      Loading LankaProperty Intelligence...
    </span>
  </div>
);

export default function App() {
  const { pathname, segments, navigate } = useRouter();

  // Hidden Super Admin security gate state
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => superAdminSecurityService.isAuthenticated());

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Subscribe to Superadmin authentication status changes
  useEffect(() => {
    const unsub = superAdminSecurityService.subscribe(() => {
      setIsAdminAuthenticated(superAdminSecurityService.isAuthenticated());
    });
    return unsub;
  }, []);

  // Global Stealth Keyboard Listener: Ctrl + Shift + L triggers hidden Admin Login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l' || e.code === 'KeyL')) {
        e.preventDefault();
        setIsSecurityModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle dedicated Superadmin workspace routes with high-security route guard
  if (pathname.startsWith('/admin')) {
    if (!isAdminAuthenticated) {
      return (
        <CurrencyProvider>
          <SeoHead
            title="Restricted Security Gateway | LankaProperty.lk"
            description="Restricted system access."
            canonicalPath="/admin"
            noIndex={true}
          />
          <SuperAdminSecurityModal
            isOpen={true}
            isDirectRoute={true}
            onClose={() => navigate('/')}
            onSuccess={() => {
              setIsAdminAuthenticated(true);
            }}
          />
        </CurrencyProvider>
      );
    }

    return (
      <CurrencyProvider>
        <SeoHead
          title="Super Admin Master Console | LankaProperty.lk"
          description="Internal management console."
          canonicalPath="/admin"
          noIndex={true}
        />
        <Suspense fallback={<PageLoadingFallback />}>
          <AdminRouter />
        </Suspense>
      </CurrencyProvider>
    );
  }

  // Route Dispatcher for Public Website
  const renderRoute = () => {
    // Root Homepage
    if (pathname === '/' || pathname === '') {
      return <HomePage />;
    }

    // Properties list / search
    if (pathname === '/properties') {
      return <PropertiesPage />;
    }

    // Single Property detail: /properties/:slug
    if (segments[0] === 'properties' && segments[1]) {
      return <PropertyDetailPage slug={segments[1]} />;
    }

    // Programmatic SEO District Hubs: /districts/:districtSlug
    if (segments[0] === 'districts' && segments[1]) {
      return <DistrictDetailPage districtSlug={segments[1]} />;
    }

    // Wanted Properties Buyer Demands Board
    if (pathname === '/wanted-properties') {
      return <WantedPropertiesPage />;
    }

    // Developments list
    if (pathname === '/developments') {
      return (
        <>
          <SeoHead
            title="New Residential Developments & Luxury Condominiums in Sri Lanka | LankaProperty.lk"
            description="Explore master-planned condominiums, off-plan apartments in Colombo, and gated coastal villa developments across Sri Lanka with CMA strata titles."
            canonicalPath="/developments"
          />
          <DevelopmentsPage />
        </>
      );
    }

    // Single Development detail: /developments/:slug
    if (segments[0] === 'developments' && segments[1]) {
      return (
        <>
          <SeoHead
            title={`${segments[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — New Development | LankaProperty.lk`}
            description="Master-planned residential development in Sri Lanka with verified CMA strata titles, interactive floor plans, and direct developer pricing."
            canonicalPath={`/developments/${segments[1]}`}
          />
          <DevelopmentDetailPage slug={segments[1]} />
        </>
      );
    }

    // Saved & Comparison
    if (pathname === '/saved') {
      return (
        <>
          <SeoHead
            title="Saved Properties & Dossier Comparison | LankaProperty.lk"
            description="Review your shortlisted Sri Lankan properties and compare specifications side by side."
            canonicalPath="/saved"
            noIndex={true}
          />
          <SavedPage />
        </>
      );
    }

    // List Property Seller Wizard
    if (pathname === '/list-property') {
      return (
        <>
          <SeoHead
            title="Post Your Property Free in Sri Lanka — Sell or Rent Houses, Land & Apartments | LankaProperty.lk"
            description="List your house, villa, apartment, or land plot across all 25 districts of Sri Lanka. Upload up to 20 high-resolution photos and receive direct WhatsApp buyer leads."
            canonicalPath="/list-property"
          />
          <ListPropertyPage />
        </>
      );
    }

    // Advertising Packages Matrix & Syndication
    if (pathname === '/advertising-packages') {
      return (
        <>
          <SeoHead
            title="Property Advertising Packages & Seller Plans in Sri Lanka | LankaProperty.lk"
            description="Compare property listing packages on LankaProperty.lk: Starter Free, Premium Pro, Platinum Until Sold, and Diamond Sovereign plans for owners and real estate agencies."
            canonicalPath="/advertising-packages"
          />
          <AdvertisingPackagesPage />
        </>
      );
    }

    // Role-based Authentication Portal (Login & Register for Owners & Agents)
    if (pathname === '/auth') {
      return (
        <>
          <SeoHead
            title="Property Owner & Real Estate Agent Login | LankaProperty.lk"
            description="Sign in or register as a Property Owner or Licensed Real Estate Agent on LankaProperty.lk."
            canonicalPath="/auth"
            noIndex={true}
          />
          <AuthPortalPage />
        </>
      );
    }

    // Property Owner Dashboard
    if (pathname === '/owner/dashboard') {
      return (
        <>
          <SeoHead
            title="Property Owner Dashboard | LankaProperty.lk"
            description="Manage your listed properties and buyer inquiries."
            canonicalPath="/owner/dashboard"
            noIndex={true}
          />
          <OwnerDashboardPage />
        </>
      );
    }

    // Real Estate Agent Dashboard
    if (pathname === '/agent/dashboard') {
      return (
        <>
          <SeoHead
            title="Real Estate Agent Dashboard | LankaProperty.lk"
            description="Manage agency inventory and CRM buyer leads."
            canonicalPath="/agent/dashboard"
            noIndex={true}
          />
          <AgentDashboardPage />
        </>
      );
    }

    // Fallback 404
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 space-y-4">
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
          Page Not Found
        </span>
        <h1 className="text-3xl font-extrabold text-[#18251E]">The requested property page does not exist.</h1>
        <p className="text-sm text-[#5F6B63] max-w-md">
          The listing may have concluded or the address link has shifted.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px]"
        >
          Return to LankaProperty Homepage
        </button>
      </div>
    );
  };

  const isHome = pathname === '/' || pathname === '';

  return (
    <CurrencyProvider>
      <CompareProvider>
        <div className="min-h-screen flex flex-col bg-white text-[#18251E]">
          {/* Accessible Skip Link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#103D2C] text-white font-bold text-xs rounded-[3px] shadow-lg"
          >
            Skip to main content
          </a>

          {/* Persistent Site Header */}
          <Header isHomePage={isHome} />

          {/* Main Semantic Landmark */}
          <main id="main-content" className="flex-1">
            <Suspense fallback={<PageLoadingFallback />}>
              {renderRoute()}
            </Suspense>
          </main>

          {/* Persistent Deep Green Footer */}
          <Footer />

          {/* Floating Comparison Tray */}
          <CompareTray />

          {/* Hidden Super Admin Security Challenge Terminal (Triggered via Ctrl + Shift + L) */}
          <SuperAdminSecurityModal
            isOpen={isSecurityModalOpen}
            isDirectRoute={false}
            onClose={() => setIsSecurityModalOpen(false)}
            onSuccess={() => {
              setIsSecurityModalOpen(false);
              setIsAdminAuthenticated(true);
              navigate('/admin');
            }}
          />
        </div>
      </CompareProvider>
    </CurrencyProvider>
  );
}
