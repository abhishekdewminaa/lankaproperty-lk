import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useCurrency } from '../context/CurrencyContext';
import { SRI_LANKA_DISTRICTS } from '../data/locations';
import {
  advertisingPackageService,
  AdvertisedPackage,
  AdvertisingAddOn,
} from '../services/advertisingPackageService';

export function AdvertisingPackagesPage() {
  const { navigate } = useRouter();
  const { currency, formatPrice } = useCurrency();

  const [activeTierCategory, setActiveTierCategory] = useState<'direct' | 'strategic'>('direct');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('platinum-package');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([
    'addon-web-slider',
    'addon-deed-verification',
  ]);
  const [addonCategoryFilter, setAddonCategoryFilter] = useState<
    'all' | 'visibility' | 'media' | 'syndication' | 'verification'
  >('all');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    district: 'Colombo',
    propertyTitle: '',
    askingPrice: '',
    notes: '',
  });

  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

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
    return activeTierCategory === 'strategic' ? strategicPackages : directPackages;
  }, [activeTierCategory, strategicPackages, directPackages]);

  const activeAddOns = useMemo(() => addonsList.filter((a) => a.active), [addonsList]);

  const filteredAddOns = useMemo(() => {
    if (addonCategoryFilter === 'all') return activeAddOns;
    return activeAddOns.filter((a) => a.category === addonCategoryFilter);
  }, [activeAddOns, addonCategoryFilter]);

  const selectedPackage = useMemo(() => {
    return (
      packagesList.find(
        (p) =>
          p.id === selectedPackageId ||
          p.id.replace('-package', '') === selectedPackageId ||
          p.id.replace('starter-', '') === selectedPackageId
      ) ||
      strategicPackages[1] ||
      packagesList[0]
    );
  }, [packagesList, selectedPackageId, strategicPackages]);

  const selectedAddOns = useMemo(() => {
    return activeAddOns.filter((a) => selectedAddOnIds.includes(a.id));
  }, [activeAddOns, selectedAddOnIds]);

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
    const studioEl = document.getElementById('addons-section');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="bg-[#FAFBF9] min-h-screen text-[#18251E] pb-20 max-sm:[zoom:0.9]">
      {/* Top Breadcrumb Bar */}
      <div className="w-full bg-white border-b border-[#DDE5DF] py-3">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex items-center justify-between gap-4 text-xs text-[#5F6B63]">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="hover:text-[#176B45] font-semibold transition-colors cursor-pointer shrink-0"
            >
              Home
            </button>
            <span className="text-[#DDE5DF]">/</span>
            <span className="text-[#103D2C] font-bold truncate">Advertising Packages</span>
          </div>
          <div className="text-xs font-semibold text-[#5F6B63] shrink-0">
            Currency: <strong className="text-[#103D2C]">{currency}</strong>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <section className="bg-white border-b border-[#DDE5DF] py-10 sm:py-14">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12">
          <div className="max-w-3xl space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
              For Property Owners & Real Estate Agents
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#103D2C] leading-tight">
              Property Advertising Packages
            </h1>
            <p className="text-sm sm:text-base text-[#5F6B63] leading-relaxed">
              Publish your property for free or choose a featured advertising plan to reach buyers across Sri Lanka with zero sales commission.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: Listing Plans */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DDE5DF] pb-5 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
              Step 1
            </span>
            <h2 className="text-2xl font-bold text-[#103D2C] tracking-tight mt-0.5">
              Choose a Listing Plan
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-[3px] border border-[#DDE5DF] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTierCategory('direct')}
              className={`px-4 py-2 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
                activeTierCategory === 'direct'
                  ? 'bg-[#103D2C] text-white'
                  : 'text-[#5F6B63] hover:text-[#103D2C]'
              }`}
            >
              Standard Plans (30 – 90 Days)
            </button>
            <button
              type="button"
              onClick={() => setActiveTierCategory('strategic')}
              className={`px-4 py-2 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
                activeTierCategory === 'strategic'
                  ? 'bg-[#103D2C] text-white'
                  : 'text-[#5F6B63] hover:text-[#103D2C]'
              }`}
            >
              Long-Term Plans (Up to 12 Months)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {displayedPackages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            const isFree = pkg.priceLkr === 0;
            const isHighlight =
              pkg.popular || pkg.badge === 'MOST POPULAR' || pkg.badge === 'BEST VALUE';

            return (
              <div
                key={pkg.id}
                className={`bg-white border rounded-[4px] p-6 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-[#103D2C] ring-2 ring-[#103D2C] shadow-sm'
                    : isHighlight
                    ? 'border-[#103D2C] shadow-xs'
                    : 'border-[#DDE5DF] hover:border-[#103D2C]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">
                      Up to {pkg.maxPhotos} Photos
                    </span>
                    {pkg.badge && (
                      <span className="px-2 py-0.5 bg-[#E8F3EC] text-[#103D2C] text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-[#103D2C]">{pkg.name}</h3>

                  <div className="mt-3 pb-4 border-b border-[#DDE5DF]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#18251E] tabular-nums">
                        {isFree ? 'Free' : formatPrice(pkg.priceLkr)}
                      </span>
                      <span className="text-xs text-[#5F6B63] font-medium">/ {pkg.duration}</span>
                    </div>
                    {!isFree && currency !== 'LKR' && (
                      <div className="text-[11px] text-[#5F6B63] mt-0.5 tabular-nums">
                        Rs. {pkg.priceLkr.toLocaleString('en-US')} LKR
                      </div>
                    )}
                    <p className="text-xs text-[#5F6B63] mt-2 leading-relaxed">{pkg.description}</p>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs text-[#18251E]">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-[#DDE5DF] space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPackageAndCustomize(pkg.id)}
                    className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#176B45] text-white'
                        : 'bg-[#103D2C] hover:bg-[#176B45] text-white'
                    }`}
                  >
                    {isSelected ? 'Selected Plan' : `Select ${pkg.name}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/list-property?package=${pkg.id}`)}
                    className="w-full py-1.5 text-xs text-[#5F6B63] hover:text-[#103D2C] font-semibold text-center block cursor-pointer"
                  >
                    Publish directly with this plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Optional Add-Ons & Order Summary */}
      <section
        id="addons-section"
        className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-12 border-t border-[#DDE5DF]"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#176B45] block">
              Step 2
            </span>
            <h2 className="text-2xl font-bold text-[#103D2C] tracking-tight mt-0.5">
              Optional Listing Upgrades
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6B63] mt-1 max-w-2xl">
              Add optional featured placements, photography, or verification to increase property inquiries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(
              [
                ['all', 'All'],
                ['visibility', 'Visibility'],
                ['media', 'Media & Video'],
                ['syndication', 'Promotions'],
                ['verification', 'Verification'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setAddonCategoryFilter(key)}
                className={`px-3 py-1.5 rounded-[3px] border text-xs font-semibold transition-colors cursor-pointer ${
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Clean Selectable List (Zero Orphan Cards) */}
          <div className="lg:col-span-8 space-y-2.5">
            {filteredAddOns.map((addon) => {
              const isChecked = selectedAddOnIds.includes(addon.id);

              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddOn(addon.id)}
                  className={`border rounded-[4px] p-4 sm:p-5 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isChecked
                      ? 'border-[#103D2C] bg-[#E8F3EC]/50'
                      : 'border-[#DDE5DF] bg-white hover:border-[#103D2C]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#18251E]">{addon.name}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAFBF9] border border-[#DDE5DF] text-[#5F6B63] rounded-[2px]">
                        {addon.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6B63] leading-relaxed">{addon.description}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#DDE5DF]">
                    <div className="text-sm font-extrabold text-[#103D2C] tabular-nums">
                      {formatPrice(addon.priceLkr)}
                      <span className="text-[11px] font-normal text-[#5F6B63] ml-1">
                        / {addon.billingType.replace('-', ' ')}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-[3px] border text-[11px] font-bold uppercase tracking-wider ${
                        isChecked
                          ? 'bg-[#103D2C] text-white border-[#103D2C]'
                          : 'bg-[#FAFBF9] text-[#18251E] border-[#DDE5DF]'
                      }`}
                    >
                      {isChecked ? 'Selected' : 'Add'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Sticky Summary Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 bg-white border border-[#DDE5DF] rounded-[4px] p-6 shadow-xs space-y-5">
            <div className="border-b border-[#DDE5DF] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                Package Summary
              </span>
              <h3 className="text-lg font-bold text-[#103D2C] mt-0.5">Estimated Total</h3>
            </div>

            <div className="p-3.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#5F6B63] block">
                Selected Plan
              </span>
              <div className="flex items-center justify-between text-xs font-bold text-[#18251E]">
                <span>{selectedPackage?.name}</span>
                <span className="text-[#103D2C] tabular-nums">
                  {basePriceLkr === 0 ? 'Free' : formatPrice(basePriceLkr)}
                </span>
              </div>
              <span className="text-[11px] text-[#5F6B63] block">
                {selectedPackage?.duration} · Up to {selectedPackage?.maxPhotos} photos
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#18251E]">
                  Selected Upgrades ({selectedAddOns.length})
                </span>
                {selectedAddOns.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAddOnIds([])}
                    className="text-[11px] text-[#C93636] hover:underline font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedAddOns.length === 0 ? (
                <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] text-xs text-[#5F6B63] text-center">
                  No upgrades selected.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedAddOns.map((addon) => (
                    <div
                      key={addon.id}
                      className="p-2.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] flex items-center justify-between text-xs gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-[#18251E] block truncate">
                          {addon.name}
                        </span>
                        <span className="text-[11px] text-[#5F6B63] tabular-nums">
                          {formatPrice(addon.priceLkr)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAddOn(addon.id)}
                        className="text-[11px] font-semibold text-[#C93636] hover:underline shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#DDE5DF] space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#5F6B63]">
                <span>Listing Plan</span>
                <span className="font-semibold text-[#18251E] tabular-nums">
                  {basePriceLkr === 0 ? 'Free' : formatPrice(basePriceLkr)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#5F6B63]">
                <span>Upgrades</span>
                <span className="font-semibold text-[#18251E] tabular-nums">
                  {formatPrice(addOnsTotalLkr)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#DDE5DF] flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#103D2C]">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[#103D2C] tabular-nums block">
                    {formatPrice(grandTotalLkr)}
                  </span>
                  {currency !== 'LKR' && (
                    <span className="text-[10px] text-[#5F6B63] block tabular-nums">
                      Rs. {grandTotalLkr.toLocaleString('en-US')} LKR
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const bookingEl = document.getElementById('booking-form');
                  if (bookingEl) bookingEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                Request Selected Package
              </button>
              <button
                type="button"
                onClick={() => navigate(`/list-property?package=${selectedPackageId}`)}
                className="w-full py-2.5 bg-white hover:bg-[#FAFBF9] text-[#103D2C] border border-[#DDE5DF] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                Post Property Directly
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Plan Comparison Table */}
      <section className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-12 border-t border-[#DDE5DF]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#103D2C] tracking-tight">Plan Comparison</h2>
        </div>

        <div className="bg-white border border-[#DDE5DF] rounded-[4px] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-[#FAFBF9] border-b border-[#DDE5DF] text-[#103D2C]">
                <th className="p-4 font-bold uppercase text-[10px] tracking-wider">Feature</th>
                <th className="p-4 font-bold">Starter Free</th>
                <th className="p-4 font-bold">Premium Pro</th>
                <th className="p-4 font-bold">Elite Pro</th>
                <th className="p-4 font-bold">Gold Package</th>
                <th className="p-4 font-bold">Platinum Plan</th>
                <th className="p-4 font-bold">Diamond Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF] text-[#18251E]">
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Price (LKR)</td>
                <td className="p-4 font-bold">Free</td>
                <td className="p-4 font-bold">Rs. 4,500</td>
                <td className="p-4 font-bold">Rs. 8,500</td>
                <td className="p-4 font-bold">Rs. 15,000</td>
                <td className="p-4 font-bold">Rs. 25,000</td>
                <td className="p-4 font-bold">Rs. 45,000</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Listing Duration</td>
                <td className="p-4">30 Days</td>
                <td className="p-4">60 Days</td>
                <td className="p-4">90 Days</td>
                <td className="p-4">12 Months</td>
                <td className="p-4 font-semibold">Until Sold</td>
                <td className="p-4 font-semibold">Until Sold</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Photos Allowed</td>
                <td className="p-4">Up to 5</td>
                <td className="p-4">Up to 12</td>
                <td className="p-4">Up to 20</td>
                <td className="p-4">Up to 20</td>
                <td className="p-4">Up to 20</td>
                <td className="p-4">Up to 20</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Search Placement</td>
                <td className="p-4">Standard</td>
                <td className="p-4">Top 10 District</td>
                <td className="p-4">Top 5 District</td>
                <td className="p-4">Featured</td>
                <td className="p-4">Top 3 City & District</td>
                <td className="p-4">Homepage Featured</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-[#5F6B63]">Direct WhatsApp Button</td>
                <td className="p-4 text-[#5F6B63]">—</td>
                <td className="p-4 text-[#176B45] font-semibold">Included</td>
                <td className="p-4 text-[#176B45] font-semibold">Included</td>
                <td className="p-4 text-[#176B45] font-semibold">Included</td>
                <td className="p-4 text-[#176B45] font-semibold">Included</td>
                <td className="p-4 text-[#176B45] font-semibold">Included</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Request Booking Form */}
      <section
        id="booking-form"
        className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 py-12 border-t border-[#DDE5DF]"
      >
        <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 sm:p-8">
          <div className="max-w-2xl mb-6">
            <h2 className="text-2xl font-bold text-[#103D2C] tracking-tight">
              Submit Advertising Request
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6B63] mt-1">
              Enter your details below and our team will help set up your selected package.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-6 bg-[#E8F3EC] border border-[#176B45] rounded-[4px] text-center space-y-3">
              <h3 className="text-lg font-bold text-[#103D2C]">Advertising Request Received</h3>
              <p className="text-xs text-[#18251E] max-w-md mx-auto">
                Thank you, <strong>{formData.fullName}</strong>. Your request for{' '}
                <strong>{selectedPackage?.name}</strong> (Total: {formatPrice(grandTotalLkr)}) has
                been recorded. We will contact you on <strong>{formData.phone}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setFormSubmitted(false)}
                className="mt-2 px-5 py-2 bg-[#103D2C] text-white text-xs font-bold rounded-[3px] cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="space-y-5 text-xs">
              <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">
                    Selected Package
                  </span>
                  <span className="text-sm font-bold text-[#103D2C]">
                    {selectedPackage?.name} ({selectedPackage?.duration})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#5F6B63] uppercase font-bold block">
                    Total
                  </span>
                  <span className="text-lg font-extrabold text-[#103D2C] tabular-nums">
                    {formatPrice(grandTotalLkr)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roshan Perera"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[3px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">
                    WhatsApp / Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[3px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
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
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[3px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">
                    Property Title / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3BR House in Maharagama"
                    value={formData.propertyTitle}
                    onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[3px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">District</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[3px] bg-white font-medium focus:outline-none focus:border-[#103D2C]"
                  >
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">
                    Asking Price (LKR)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 45,000,000"
                    value={formData.askingPrice}
                    onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[3px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18251E] mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any specific details or preferred contact time..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#DDE5DF] rounded-[3px] bg-[#FAFBF9] focus:bg-white focus:outline-none focus:border-[#103D2C]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-7 py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
