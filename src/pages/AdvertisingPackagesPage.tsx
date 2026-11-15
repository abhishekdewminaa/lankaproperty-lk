import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useCurrency } from '../context/CurrencyContext';
import { SRI_LANKA_DISTRICTS } from '../data/locations';
import {
  advertisingPackageService,
  AdvertisedPackage,
  AdvertisingAddOn,
} from '../services/advertisingPackageService';
import {
  Check,
  Plus,
  ShieldCheck,
  Video,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Globe,
  Award,
  ChevronDown,
  Layers,
  CheckCircle2,
  DollarSign,
  Radio,
  FileCheck,
  PhoneCall,
  Sliders,
} from 'lucide-react';

export function AdvertisingPackagesPage() {
  const { navigate } = useRouter();
  const { currency, formatPrice } = useCurrency();

  // Active Category View for Tiers
  const [activeTierCategory, setActiveTierCategory] = useState<'strategic' | 'direct' | 'all'>('strategic');

  // Selected base package for custom campaign
  const [selectedPackageId, setSelectedPackageId] = useState<string>('platinum-package');

  // Selected Add-On IDs
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([
    'addon-web-slider',
    'addon-deed-verification',
  ]);

  // Add-on filter category
  const [addonCategoryFilter, setAddonCategoryFilter] = useState<'all' | 'visibility' | 'media' | 'syndication' | 'verification'>('all');

  // Booking Form State
  const [formData, setFormData] = useState({
    advertiserType: 'Private Property Owner',
    fullName: '',
    email: '',
    phone: '',
    district: 'Colombo',
    city: 'Colombo 07 (Cinnamon Gardens)',
    propertyTitle: '',
    askingPrice: '',
    notes: '',
  });

  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Dynamic state from service
  const [packagesList, setPackagesList] = useState<AdvertisedPackage[]>(() =>
    advertisingPackageService.getAllPackages()
  );
  const [addonsList, setAddonsList] = useState<AdvertisingAddOn[]>(() =>
    advertisingPackageService.getAllAddOns()
  );

  useEffect(() => {
    const unsub = advertisingPackageService.subscribe(() => {
      setPackagesList(advertisingPackageService.getAllPackages());
      setAddonsList(advertisingPackageService.getAllAddOns());
    });
    return () => unsub();
  }, []);

  const strategicPackages = useMemo(
    () => packagesList.filter((p) => p.category === 'strategic' && p.active),
    [packagesList]
  );
  const directPackages = useMemo(
    () => packagesList.filter((p) => p.category === 'direct' && p.active),
    [packagesList]
  );
  const displayedPackages = useMemo(() => {
    if (activeTierCategory === 'strategic') return strategicPackages;
    if (activeTierCategory === 'direct') return directPackages;
    return packagesList.filter((p) => p.active);
  }, [activeTierCategory, strategicPackages, directPackages, packagesList]);

  const activeAddOns = useMemo(
    () => addonsList.filter((a) => a.active),
    [addonsList]
  );

  const filteredAddOns = useMemo(() => {
    if (addonCategoryFilter === 'all') return activeAddOns;
    return activeAddOns.filter((a) => a.category === addonCategoryFilter);
  }, [activeAddOns, addonCategoryFilter]);

  // Selected package object
  const selectedPackage = useMemo(() => {
    return (
      packagesList.find(
        (p) =>
          p.id === selectedPackageId ||
          p.id.replace('-package', '') === selectedPackageId ||
          p.id.replace('starter-', '') === selectedPackageId
      ) || strategicPackages[1] || packagesList[0]
    );
  }, [packagesList, selectedPackageId, strategicPackages]);

  // Selected add-on objects
  const selectedAddOns = useMemo(() => {
    return activeAddOns.filter((a) => selectedAddOnIds.includes(a.id));
  }, [activeAddOns, selectedAddOnIds]);

  // Live Investment Total
  const basePriceLkr = selectedPackage ? selectedPackage.priceLkr : 0;
  const addOnsTotalLkr = selectedAddOns.reduce((sum, a) => sum + a.priceLkr, 0);
  const grandTotalLkr = basePriceLkr + addOnsTotalLkr;

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectPackageAndCustomize = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const studioEl = document.getElementById('addons-studio');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const faqs = [
    {
      q: 'How quickly does my advertising placement go live on the platform?',
      a: 'Direct Publishing Plans (Starter Free, Premium Pro, Elite Pro) go live immediately upon form completion. Strategic packages and customized media bundles undergo rapid editorial review by our Colombo brokerage desk and are published within 4 to 12 business hours.',
    },
    {
      q: 'Can I add or remove Advertising Add-Ons after publishing my property?',
      a: 'Yes. Sellers, landlords, and certified agents can add high-impact placements (such as the Homepage Top Web Slider, 4K Drone Video Walkthrough, or Diaspora Email Blast) at any point directly from their Owner or Agent Dashboard.',
    },
    {
      q: 'What is the "Advertised Until Sold" policy on Platinum and Diamond packages?',
      a: 'Unlike monthly subscription portals that bill recurring charges, our Platinum (Rs. 25,000) and Diamond (Rs. 45,000) tiers keep your property prominently featured on LankaProperty.lk until the deed transfer is finalized, with zero renewal charges or sales commissions.',
    },
    {
      q: 'How does the Certified Legal Title Deed & Cadastral Badge work?',
      a: 'Our in-house legal desk cross-references your survey plan, local council street line certification, and title deed extract. Verified listings receive the prominent Green Cadastral Seal, generating over 3.4x more qualified inquiries from expatriate buyers.',
    },
    {
      q: 'Do you charge a commission cut when my property sells?',
      a: 'No. LankaProperty.lk operates as a zero-commission architectural advertising publication. All buyer leads, telephone calls, and WhatsApp messages connect directly to you.',
    },
  ];

  return (
    <div className="bg-[#FAFBF9] min-h-screen text-[#18251E] pb-24">
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
            <span className="text-[#103D2C] font-bold">Commercial Media Kit & Advertising Placements</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#176B45] bg-[#E8F3EC] px-3 py-1 rounded-[2px] border border-[#176B45]/20">
            <span>Marketplace Currency:</span>
            <span className="font-bold uppercase tracking-wider">{currency}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HERO: INSTITUTIONAL MEDIA KIT HEADER
          ========================================================================= */}
      <section className="bg-white border-b border-[#DDE5DF] py-14 lg:py-18">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8F3EC] text-[#103D2C] text-[11px] font-black uppercase tracking-widest rounded-[2px] border border-[#176B45]/30 mb-4">
              <span>▪</span>
              <span>Commercial Media Kit & Placement Suite · 2026</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#103D2C] leading-tight">
              Architectural Advertising & High-Exposure Campaigns
            </h1>
            <p className="text-sm md:text-base text-[#5F6B63] leading-relaxed mt-3 max-w-3xl">
              Connect directly with over 500,000 monthly high-intent property searchers across Sri Lanka and the overseas diaspora. Select an authoritative base tier and configure high-impact promotional add-ons with zero sales commission.
            </p>
          </div>

          {/* Circulation Benchmarks Ribbon */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#DDE5DF] pt-8">
            <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tabular-nums">500,000+</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mt-1">
                Monthly Active Buyers & Tenants
              </span>
            </div>
            <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#176B45] tabular-nums">42%</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mt-1">
                Overseas Diaspora (UK, AU, UAE, US)
              </span>
            </div>
            <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#C93636] tabular-nums">Up to 20</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mt-1">
                Ultra-HD Architectural Photos
              </span>
            </div>
            <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tabular-nums">0%</span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] mt-1">
                Commission Deductions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 1: CORE LISTING TIERS WITH SOPHISTICATED EDITORIAL CARDS
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-14">
        {/* Category Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#176B45]">Step 1</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight">
              Select Your Publishing Tier
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F8F5] p-1 rounded-[2px] border border-[#DDE5DF]">
            <button
              onClick={() => setActiveTierCategory('strategic')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                activeTierCategory === 'strategic'
                  ? 'bg-[#103D2C] text-white shadow-xs'
                  : 'text-[#5F6B63] hover:text-[#103D2C]'
              }`}
            >
              Strategic Campaigns (Until Sold · 12 Mo)
            </button>
            <button
              onClick={() => setActiveTierCategory('direct')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                activeTierCategory === 'direct'
                  ? 'bg-[#103D2C] text-white shadow-xs'
                  : 'text-[#5F6B63] hover:text-[#103D2C]'
              }`}
            >
              Direct Publishing Plans (30 – 90 Days)
            </button>
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {displayedPackages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            const isFree = pkg.priceLkr === 0;
            const isHighlight = pkg.popular || pkg.badge === 'MOST POPULAR' || pkg.badge === 'BEST VALUE';

            return (
              <div
                key={pkg.id}
                className={`bg-white border rounded-[3px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative ${
                  isSelected
                    ? 'border-[#176B45] ring-2 ring-[#176B45] shadow-md bg-white'
                    : isHighlight
                    ? 'border-[#C93636] shadow-sm'
                    : 'border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                {pkg.badge && (
                  <div
                    className="absolute -top-3 left-6 px-3 py-0.5 text-white text-[10px] font-black uppercase tracking-widest rounded-[2px] shadow-xs"
                    style={{ backgroundColor: pkg.badgeColor || (isHighlight ? '#C93636' : '#103D2C') }}
                  >
                    {pkg.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5F6B63]">
                      {pkg.category === 'direct' ? 'SELF-SERVICE LISTING' : 'STRATEGIC CAMPAIGN'}
                    </span>
                    <span className="text-[11px] font-semibold text-[#176B45] bg-[#E8F3EC] px-2 py-0.5 rounded-[2px]">
                      Up to {pkg.maxPhotos} Photos
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#103D2C] tracking-tight mt-1.5">
                    {pkg.name}
                  </h3>

                  <div className="mt-4 pt-4 border-t border-[#DDE5DF]">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-3xl font-extrabold tracking-tight ${isFree ? 'text-[#C93636]' : 'text-[#103D2C]'}`}>
                        {isFree ? 'FREE' : formatPrice(pkg.priceLkr)}
                      </span>
                      <span className="text-xs font-semibold text-[#5F6B63]">
                        / {pkg.duration}
                      </span>
                    </div>
                    {!isFree && currency !== 'LKR' && (
                      <div className="text-[11px] text-[#5F6B63] font-medium mt-0.5">
                        Base: Rs. {pkg.priceLkr.toLocaleString('en-US')} LKR
                      </div>
                    )}
                    <p className="text-xs text-[#5F6B63] mt-2.5 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Bullet points */}
                  <ul className="mt-6 pt-4 border-t border-[#DDE5DF] space-y-2.5 text-xs text-[#18251E]">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[#176B45] font-bold mt-0.5">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-[#DDE5DF] space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPackageAndCustomize(pkg.id)}
                    className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#176B45] text-white shadow-xs'
                        : isHighlight
                        ? 'bg-[#C93636] hover:bg-[#A92828] text-white shadow-xs'
                        : 'bg-[#103D2C] hover:bg-[#176B45] text-white shadow-xs'
                    }`}
                  >
                    {isSelected ? '✓ Plan Selected — Customize Below' : `Select ${pkg.name} →`}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/list-property?package=${pkg.id}`)}
                    className="w-full py-1.5 text-[11px] text-[#5F6B63] hover:text-[#103D2C] hover:underline text-center font-semibold block"
                  >
                    Direct Publish with this tier only →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: BRAND NEW INTERACTIVE ADVERTISING ADD-ONS STUDIO (AS REQUESTED)
          ========================================================================= */}
      <section id="addons-studio" className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-14 border-t border-[#DDE5DF]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F3EC] text-[#103D2C] text-[10px] font-black uppercase tracking-widest rounded-[2px] border border-[#176B45]/30 mb-2">
              <span>▪</span>
              <span>Step 2 · High-Impact Campaign Enhancements</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#103D2C] tracking-tight">
              Select Advertising Add-Ons
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5 max-w-2xl">
              Elevate your property placement with custom web slider banners, 4K aerial drone productions, Title Deed legal seals, and international expat email broadcasts.
            </p>
          </div>

          {/* Addon Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {(
              [
                ['all', 'All Add-Ons'],
                ['visibility', 'Banners & Ranking'],
                ['media', '4K Drone & Video'],
                ['syndication', 'Expat Broadcasts'],
                ['verification', 'Legal Trust Seals'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setAddonCategoryFilter(key)}
                className={`px-3 py-1.5 rounded-[2px] border text-xs font-bold transition-colors cursor-pointer ${
                  addonCategoryFilter === key
                    ? 'bg-[#103D2C] text-white border-[#103D2C]'
                    : 'bg-white text-[#5F6B63] border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Studio Grid: Left = Addons Selection / Right = Live Order Desk */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Add-On Cards (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAddOns.map((addon) => {
              const isChecked = selectedAddOnIds.includes(addon.id);

              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddOn(addon.id)}
                  className={`border rounded-[3px] p-5 cursor-pointer transition-all flex flex-col justify-between ${
                    isChecked
                      ? 'border-[#176B45] bg-[#E8F3EC]/40 ring-2 ring-[#176B45] shadow-sm'
                      : 'border-[#DDE5DF] bg-white hover:border-[#176B45] shadow-2xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#176B45]">
                        {addon.category.toUpperCase()}
                      </span>
                      {addon.badge && (
                        <span
                          className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white rounded-[2px]"
                          style={{ backgroundColor: addon.badgeColor || '#176B45' }}
                        >
                          {addon.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#103D2C] leading-snug">
                      {addon.name}
                    </h4>

                    <div className="text-base font-extrabold text-[#18251E]">
                      {formatPrice(addon.priceLkr)}{' '}
                      <span className="text-xs font-normal text-[#5F6B63]">
                        / {addon.billingType.replace('-', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-[#5F6B63] leading-relaxed">
                      {addon.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#DDE5DF]/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#176B45]">
                      {isChecked ? '✓ Add-On Added' : '+ Click to Include'}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-[2px] border flex items-center justify-center text-xs font-bold ${
                        isChecked
                          ? 'bg-[#176B45] text-white border-[#176B45]'
                          : 'border-[#DDE5DF] bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Campaign Investment Summary Desk (Sticky 4 cols) */}
          <div className="lg:col-span-4 sticky top-6 bg-white border-2 border-[#103D2C] rounded-[4px] p-6 shadow-md space-y-5">
            <div className="border-b border-[#DDE5DF] pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#176B45]">
                CAMPAIGN ORDER SUMMARY
              </span>
              <h3 className="text-lg font-extrabold text-[#103D2C] mt-0.5">
                Live Investment Calculator
              </h3>
            </div>

            {/* Base Plan Line */}
            <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#5F6B63] block">
                Selected Base Plan
              </span>
              <div className="flex items-center justify-between text-xs font-bold text-[#18251E]">
                <span className="line-clamp-1">{selectedPackage?.name}</span>
                <span className="text-[#103D2C] shrink-0 font-extrabold">
                  {basePriceLkr === 0 ? 'FREE' : formatPrice(basePriceLkr)}
                </span>
              </div>
              <span className="text-[11px] text-[#5F6B63] block">
                {selectedPackage?.duration} · {selectedPackage?.maxPhotos} photos
              </span>
            </div>

            {/* Selected Add-Ons Itemized */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#18251E]">
                  Included Add-Ons ({selectedAddOns.length})
                </span>
                {selectedAddOns.length > 0 && (
                  <button
                    onClick={() => setSelectedAddOnIds([])}
                    className="text-[11px] text-[#C93636] hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedAddOns.length === 0 ? (
                <div className="p-3 bg-[#FAFBF9] border border-dashed border-[#DDE5DF] rounded-[2px] text-xs text-[#5F6B63] text-center">
                  No add-ons selected yet. Choose any from the list to boost visibility.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedAddOns.map((addon) => (
                    <div
                      key={addon.id}
                      className="p-2 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[2px] flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[#103D2C] block truncate">
                          {addon.name}
                        </span>
                        <span className="text-[10px] text-[#5F6B63]">
                          {formatPrice(addon.priceLkr)} ({addon.billingType.replace('-', ' ')})
                        </span>
                      </div>
                      <button
                        onClick={() => toggleAddOn(addon.id)}
                        className="text-gray-400 hover:text-[#C93636] font-bold px-1"
                        title="Remove add-on"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Calculation */}
            <div className="pt-3 border-t border-[#DDE5DF] space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#5F6B63]">
                <span>Base Listing Plan:</span>
                <span className="font-bold text-[#18251E]">{basePriceLkr === 0 ? 'FREE' : formatPrice(basePriceLkr)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#5F6B63]">
                <span>Marketing Add-Ons:</span>
                <span className="font-bold text-[#18251E]">{formatPrice(addOnsTotalLkr)}</span>
              </div>
              <div className="pt-2 border-t border-[#DDE5DF] flex items-baseline justify-between">
                <span className="text-sm font-extrabold text-[#103D2C]">Total Campaign Investment:</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#103D2C] tabular-nums block">
                    {formatPrice(grandTotalLkr)}
                  </span>
                  {currency !== 'LKR' && (
                    <span className="text-[10px] text-[#5F6B63] block">
                      Base: Rs. {grandTotalLkr.toLocaleString('en-US')} LKR
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const bookingEl = document.getElementById('booking-desk');
                  if (bookingEl) bookingEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center shadow-xs"
              >
                Book Custom Media Bundle →
              </button>
              <button
                type="button"
                onClick={() => navigate(`/list-property?package=${selectedPackageId}`)}
                className="w-full py-2 bg-white hover:bg-[#F5F8F5] text-[#103D2C] border border-[#DDE5DF] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center"
              >
                Proceed to Self-Service Listing Portal →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: COMPARISON MATRIX TABLE (EDITORIAL FIN-TIMES STYLE)
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-14 border-t border-[#DDE5DF]">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#176B45]">
            Authoritative Breakdown
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight mt-0.5">
            Placement Inclusions & Feature Matrix
          </h2>
        </div>

        <div className="bg-white border border-[#DDE5DF] rounded-[3px] overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFBF9] border-b border-[#DDE5DF] text-[#103D2C]">
                <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Placement Metric</th>
                <th className="p-4 font-bold">Starter Free</th>
                <th className="p-4 font-bold text-[#C93636]">Premium Pro</th>
                <th className="p-4 font-bold">Elite Pro</th>
                <th className="p-4 font-bold">Gold Package</th>
                <th className="p-4 font-bold text-[#176B45]">Platinum Monograph</th>
                <th className="p-4 font-bold text-[#C93636]">Diamond Sovereign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF] text-[#18251E]">
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Investment Rate</td>
                <td className="p-4 font-extrabold text-[#C93636]">FREE</td>
                <td className="p-4 font-extrabold">Rs. 4,500</td>
                <td className="p-4 font-extrabold">Rs. 8,500</td>
                <td className="p-4 font-extrabold">Rs. 15,000</td>
                <td className="p-4 font-extrabold text-[#176B45]">Rs. 25,000</td>
                <td className="p-4 font-extrabold text-[#C93636]">Rs. 45,000</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Active Duration</td>
                <td className="p-4">30 Days</td>
                <td className="p-4">60 Days</td>
                <td className="p-4">90 Days</td>
                <td className="p-4">12 Months (1 Year)</td>
                <td className="p-4 font-bold text-[#176B45]">Advertised Until Sold</td>
                <td className="p-4 font-bold text-[#C93636]">Advertised Until Sold</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Ultra-HD Photographs</td>
                <td className="p-4">Up to 5</td>
                <td className="p-4">Up to 12</td>
                <td className="p-4">Up to 20</td>
                <td className="p-4">Up to 20</td>
                <td className="p-4 font-bold">Up to 20</td>
                <td className="p-4 font-bold text-[#C93636]">Up to 20 + 4K Drone</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Search Positioning</td>
                <td className="p-4">Standard General</td>
                <td className="p-4 font-bold">Top 10 in District</td>
                <td className="p-4 font-bold">Top 5 in District</td>
                <td className="p-4 font-bold">Featured Listing</td>
                <td className="p-4 font-bold text-[#176B45]">City & District #1-3</td>
                <td className="p-4 font-bold text-[#C93636]">Top Platform Slider</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Direct WhatsApp Button</td>
                <td className="p-4 text-gray-300">—</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Included</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Included</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Included</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Included</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Included</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Verified Legal Deed Seal</td>
                <td className="p-4 text-gray-300">—</td>
                <td className="p-4 text-gray-300">—</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Included</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Included</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Certified Seal</td>
                <td className="p-4 text-[#176B45] font-bold">✓ Certified Seal</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Overseas Expat Broadcast</td>
                <td className="p-4 text-gray-300">—</td>
                <td className="p-4 text-gray-300">—</td>
                <td className="p-4 text-gray-300">—</td>
                <td className="p-4 text-gray-300">—</td>
                <td className="p-4 font-bold">Social Diaspora</td>
                <td className="p-4 font-bold text-[#C93636]">15,000+ Direct EDM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: DIRECT BOOKING / INQUIRY DESK
          ========================================================================= */}
      <section id="booking-desk" className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-14 border-t border-[#DDE5DF]">
        <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#176B45]">
              Direct Booking & Concierge Desk
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight mt-0.5">
              Submit Your Property for Campaign Placement
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6B63] mt-1.5">
              Fill in your contact details below. Our senior media concierge will coordinate photo assets, legal checks, and publish your custom placement package within 12 business hours.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-8 bg-[#E8F3EC] border border-[#176B45] rounded-[3px] text-center space-y-3 animate-fadeIn">
              <CheckCircle2 className="w-12 h-12 text-[#176B45] mx-auto" />
              <h3 className="text-xl font-bold text-[#103D2C]">
                Campaign Booking Request Received
              </h3>
              <p className="text-xs text-[#18251E] max-w-md mx-auto">
                Thank you, <strong>{formData.fullName}</strong>. Your campaign for <strong>"{formData.propertyTitle || 'Property'}"</strong> on the <strong>{selectedPackage?.name}</strong> plan (Total: {formatPrice(grandTotalLkr)}) has been recorded. Our Senior Concierge Desk will contact you on <strong>{formData.phone}</strong> shortly.
              </p>
              <button
                type="button"
                onClick={() => setFormSubmitted(false)}
                className="mt-4 px-5 py-2 bg-[#103D2C] text-white text-xs font-bold rounded-[2px]"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-6 text-xs">
              {/* Selected Plan Summary Banner */}
              <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">Configured Media Package:</span>
                  <span className="text-sm font-extrabold text-[#103D2C]">
                    {selectedPackage?.name} ({selectedPackage?.duration})
                  </span>
                  {selectedAddOns.length > 0 && (
                    <span className="text-xs text-[#176B45] block font-semibold">
                      +{selectedAddOns.length} Add-Ons ({selectedAddOns.map((a) => a.name.split('(')[0].trim()).join(', ')})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">Total Investment:</span>
                  <span className="text-xl font-extrabold text-[#103D2C]">{formatPrice(grandTotalLkr)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roshan Perera"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[2px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[2px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="roshan.perera@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[2px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Property Title / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modernist Residence in Cinnamon Gardens"
                    value={formData.propertyTitle}
                    onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[2px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">District</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[2px] bg-white font-medium focus:outline-none focus:border-[#103D2C]"
                  >
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Asking Valuation (LKR)</label>
                  <input
                    type="text"
                    placeholder="e.g. 145,000,000"
                    value={formData.askingPrice}
                    onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[2px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18251E] mb-1">Campaign Notes or Specific Placements Requested</label>
                <textarea
                  rows={3}
                  placeholder="Specify key architectural features, drone schedule preferences, or target buyer demographics..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[2px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-[#5F6B63]">
                  All requests processed under strict confidentiality agreements.
                </span>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-xs"
                >
                  Submit Property for Advertising Review →
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: CORPORATE SYNDICATION BAR & ENTERPRISE SERVICES
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-8">
        <div className="bg-[#18251E] text-white rounded-[3px] p-8 md:p-12 border border-[#2D3E35]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#9FE3B8]">
                Real Estate Agencies & Institutional Developers
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Multi-Development Portfolios & Enterprise Agency Feeds
              </h3>
              <p className="text-xs text-[#A3B8AD] leading-relaxed max-w-2xl">
                Are you marketing a 50+ unit condominium, master-planned coastal enclave, or brokerage firm with 20+ active listings? Access automated XML / CRM inventory sync, dedicated account managers, and bulk agency rate cards.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <button
                onClick={() => navigate('/auth?role=agent&mode=register')}
                className="px-6 py-3 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors text-center cursor-pointer shadow-xs"
              >
                Open Real Estate Agency Account →
              </button>
              <button
                onClick={() => navigate('/developments')}
                className="px-6 py-3 bg-transparent hover:bg-white/10 text-white border border-[#A3B8AD] text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors text-center cursor-pointer"
              >
                View Premier Masterplans →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FREQUENTLY ASKED QUESTIONS
          ========================================================================= */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-12">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#176B45]">
              Commercial Guidelines
            </span>
            <h2 className="text-2xl font-extrabold text-[#103D2C] tracking-tight mt-0.5">
              Frequently Asked Questions About Advertising
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#DDE5DF] rounded-[3px] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-[#103D2C] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAFBF9]"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#176B45] font-extrabold text-sm">
                    {activeFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="p-4 sm:p-5 pt-0 text-xs text-[#5F6B63] leading-relaxed border-t border-[#DDE5DF]/60 bg-[#FAFBF9]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
