import React, { useState, useMemo, useEffect } from 'react';
import { SeoHead } from '../components/SeoHead';
import { useCurrency } from '../context/CurrencyContext';
import {
  wantedPropertyService,
  WantedPropertyLead,
} from '../services/wantedPropertyService';
import { SRI_LANKA_DISTRICTS } from '../data/locations';

export function WantedPropertiesPage() {
  const { formatPrice, currency } = useCurrency();

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBuyerType, setSelectedBuyerType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Post modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [postSuccessMessage, setPostSuccessMessage] = useState<string>('');

  // Form state
  const [postName, setPostName] = useState<string>('');
  const [postPhone, setPostPhone] = useState<string>('');
  const [postEmail, setPostEmail] = useState<string>('');
  const [postBuyerType, setPostBuyerType] = useState<WantedPropertyLead['buyerType']>('private_buyer');
  const [postContactMethod, setPostContactMethod] = useState<WantedPropertyLead['preferredContactMethod']>('whatsapp');
  const [postPropType, setPostPropType] = useState<WantedPropertyLead['propertyType']>('house');
  const [postDistrict, setPostDistrict] = useState<string>('Colombo');
  const [postAreas, setPostAreas] = useState<string>('');
  const [postMinBudget, setPostMinBudget] = useState<number>(30000000);
  const [postMaxBudget, setPostMaxBudget] = useState<number>(60000000);
  const [postMinBeds, setPostMinBeds] = useState<number>(3);
  const [postMinLand, setPostMinLand] = useState<number>(10);
  const [postUrgency, setPostUrgency] = useState<WantedPropertyLead['urgency']>('within_30_days');
  const [postTitle, setPostTitle] = useState<string>('');
  const [postDesc, setPostDesc] = useState<string>('');
  const [honeypotValue, setHoneypotValue] = useState<string>('');

  // Match proposal modal state
  const [matchingLead, setMatchingLead] = useState<WantedPropertyLead | null>(null);
  const [proposerName, setProposerName] = useState<string>('');
  const [proposerPhone, setProposerPhone] = useState<string>('');
  const [proposerRole, setProposerRole] = useState<'agent' | 'owner'>('agent');
  const [propTitle, setPropTitle] = useState<string>('');
  const [propPriceLkr, setPropPriceLkr] = useState<number>(45000000);
  const [propUrl, setPropUrl] = useState<string>('');
  const [propNotes, setPropNotes] = useState<string>('');
  const [proposalSuccess, setProposalSuccess] = useState<boolean>(false);

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    wantedPropertyService.syncWithSupabase();
    return wantedPropertyService.subscribe(() => {
      setRefreshKey((prev) => prev + 1);
    });
  }, []);

  // Filtered leads
  const leads = useMemo(() => {
    let result = wantedPropertyService.getWantedLeads({
      district: selectedDistrict,
      propertyType: selectedType,
      searchQuery: searchQuery,
    });

    if (selectedBuyerType !== 'all') {
      result = result.filter((l) => l.buyerType === selectedBuyerType);
    }

    return result;
  }, [selectedDistrict, selectedType, selectedBuyerType, searchQuery, refreshKey]);

  // Handle post submit
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypotValue) return;

    const areaArray = postAreas
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const res = wantedPropertyService.submitWantedLead({
      buyerName: postName,
      buyerType: postBuyerType,
      phone: postPhone,
      email: postEmail || undefined,
      preferredContactMethod: postContactMethod,
      propertyType: postPropType,
      district: postDistrict,
      specificAreas: areaArray.length > 0 ? areaArray : [postDistrict],
      budgetMinLkr: Number(postMinBudget),
      budgetMaxLkr: Number(postMaxBudget),
      minBedrooms: postPropType === 'house' || postPropType === 'apartment' ? Number(postMinBeds) : undefined,
      minLandPerches: postPropType === 'land' || postPropType === 'house' ? Number(postMinLand) : undefined,
      urgency: postUrgency,
      title: postTitle,
      description: postDesc,
      honeypot: honeypotValue,
    });

    if (res.success) {
      setPostSuccessMessage(res.message);
      setRefreshKey((k) => k + 1);
      setTimeout(() => {
        setIsPostModalOpen(false);
        setPostSuccessMessage('');
        setPostTitle('');
        setPostDesc('');
      }, 2000);
    }
  };

  // Handle match proposal
  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchingLead || !proposerName || !proposerPhone) return;

    const success = wantedPropertyService.submitProposal({
      leadId: matchingLead.id,
      senderName: proposerName,
      senderPhone: proposerPhone,
      senderRole: proposerRole,
      propertyTitle: propTitle || 'Matching Available Property',
      priceLkr: Number(propPriceLkr),
      propertyUrl: propUrl || undefined,
      notes: propNotes,
    });

    if (success) {
      setProposalSuccess(true);
      setRefreshKey((k) => k + 1);
      setTimeout(() => {
        setMatchingLead(null);
        setProposalSuccess(false);
        setPropTitle('');
        setPropNotes('');
      }, 2200);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBF9]">
      <SeoHead
        title="Wanted Properties Sri Lanka | Verified Buyer & Investor Demands Board"
        description="Connect directly with verified cash buyers, diaspora investors, and corporate acquirers seeking houses, apartments, lands, and commercial developments across Sri Lanka."
        canonicalUrl="/wanted-properties"
        keywords="wanted property sri lanka, buyer requests colombo, buyers seeking houses kandy, buyer board galle property"
      />

      {/* Header Banner */}
      <section className="bg-[#103D2C] text-white py-12 px-4 border-b border-[#18251E]">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Sri Lanka Wanted Property Board
              </h1>
              <p className="text-sm text-[#DDE5DF] leading-relaxed">
                Pre-qualified local buyers, high-net-worth diaspora returnees, and corporate funds actively seeking properties. Have a matching listing? Submit directly to the buyer or authorized broker.
              </p>
            </div>

            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-6 py-3 bg-[#C93636] hover:bg-[#B02828] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] shadow-sm transition-colors self-start md:self-auto shrink-0"
            >
              Post Your Wanted Property Request →
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-xs">
            <div>
              <div className="text-[#66C296] font-bold uppercase tracking-wider text-[10px]">
                Active Demands
              </div>
              <div className="text-xl font-extrabold text-white mt-0.5">
                {leads.length}+ Leads Active
              </div>
            </div>
            <div>
              <div className="text-[#66C296] font-bold uppercase tracking-wider text-[10px]">
                Combined Buyer Capital
              </div>
              <div className="text-xl font-extrabold text-white mt-0.5">
                Rs. 3.4B+ Allocated
              </div>
            </div>
            <div>
              <div className="text-[#66C296] font-bold uppercase tracking-wider text-[10px]">
                Average Closing Window
              </div>
              <div className="text-xl font-extrabold text-white mt-0.5">
                21 Days
              </div>
            </div>
            <div>
              <div className="text-[#66C296] font-bold uppercase tracking-wider text-[10px]">
                Verification Standard
              </div>
              <div className="text-xl font-extrabold text-white mt-0.5">
                NIC & Phone Vetted
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Filter Bar */}
        <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-bold text-[#5F6B63] mb-1">
                Search Requirements
              </label>
              <input
                type="text"
                placeholder="e.g. Sea-view, Warehouse, Perches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
              />
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#5F6B63] mb-1">
                District / Region
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
              >
                <option value="all">All 25 Districts</option>
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d.slug} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#5F6B63] mb-1">
                Property Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
              >
                <option value="all">All Types</option>
                <option value="house">House / Residential Villa</option>
                <option value="apartment">Apartment / Condominium</option>
                <option value="land">Bare Land / Estate</option>
                <option value="commercial">Commercial / Industrial</option>
              </select>
            </div>

            {/* Buyer Type Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#5F6B63] mb-1">
                Buyer Classification
              </label>
              <select
                value={selectedBuyerType}
                onChange={(e) => setSelectedBuyerType(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
              >
                <option value="all">All Buyer Profiles</option>
                <option value="diaspora">Diaspora / Overseas Returnee</option>
                <option value="corporate">Corporate / Institutional</option>
                <option value="investor">HNW Investor</option>
                <option value="private_buyer">Private Residential Buyer</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-[#5F6B63] pt-2 border-t border-[#DDE5DF]/60">
            <div>
              Showing <span className="font-bold text-[#103D2C]">{leads.length}</span> verified buyer requests
            </div>
            {(selectedDistrict !== 'all' || selectedType !== 'all' || selectedBuyerType !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDistrict('all');
                  setSelectedType('all');
                  setSelectedBuyerType('all');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-[#C93636] hover:underline"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Lead Listings Stream */}
        {leads.length === 0 ? (
          <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-12 text-center space-y-3">
            <div className="text-xl font-extrabold text-[#103D2C]">
              No Buyer Demands Match This Filter
            </div>
            <p className="text-xs text-[#5F6B63] max-w-md mx-auto">
              There are currently no active buyer requests matching your selected criteria. Try broadening your district or property category, or submit your own request.
            </p>
            <button
              onClick={() => {
                setSelectedDistrict('all');
                setSelectedType('all');
                setSelectedBuyerType('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#103D2C] text-white text-xs font-bold rounded-[2px]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white border border-[#DDE5DF] rounded-[3px] p-5 hover:border-[#103D2C]/60 transition-all space-y-4 shadow-sm"
              >
                {/* Top Row: Badges, Title, Urgency */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#103D2C] text-white">
                        {lead.district}
                      </span>
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#EAEFEA] text-[#176B45]">
                        {lead.propertyType}
                      </span>
                      {lead.verifiedBuyer && (
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#E6F3EB] text-[#176B45] border border-[#176B45]/20">
                          ✓ Verified Buyer
                        </span>
                      )}
                      <span className="text-[#5F6B63] font-normal normal-case">
                        Ref: {lead.id}
                      </span>
                    </div>

                    <h2 className="text-lg font-extrabold text-[#18251E] pt-1">
                      {lead.title}
                    </h2>
                  </div>

                  {/* Budget Box */}
                  <div className="sm:text-right shrink-0 bg-[#FAFBF9] border border-[#DDE5DF] p-3 rounded-[2px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] block">
                      Target Budget
                    </span>
                    <div className="text-base font-extrabold text-[#103D2C]">
                      {formatPrice(lead.budgetMinLkr)} – {formatPrice(lead.budgetMaxLkr)}
                    </div>
                    <div className="text-[10px] text-[#5F6B63] mt-0.5">
                      {lead.urgency === 'immediate'
                        ? '▪ Immediate closing'
                        : lead.urgency === 'within_30_days'
                        ? '▪ Ready within 30 days'
                        : '▪ Standard timeframe'}
                    </div>
                  </div>
                </div>

                {/* Description Body */}
                <p className="text-xs text-[#4A5750] leading-relaxed">
                  {lead.description}
                </p>

                {/* Criteria Pills */}
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 border-t border-[#DDE5DF]/60 text-[#5F6B63]">
                  <div>
                    <span className="font-bold text-[#18251E]">Preferred Areas:</span>{' '}
                    {lead.specificAreas.join(', ')}
                  </div>
                  {lead.minBedrooms && (
                    <div>
                      <span className="font-bold text-[#18251E]">Bedrooms:</span> {lead.minBedrooms}+
                    </div>
                  )}
                  {lead.minLandPerches && (
                    <div>
                      <span className="font-bold text-[#18251E]">Land:</span> {lead.minLandPerches}+ Perches
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-[#18251E]">Buyer Category:</span>{' '}
                    <span className="capitalize">{lead.buyerType.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Footer Bar: Buyer Contact & Action CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#DDE5DF]">
                  <div className="text-xs text-[#5F6B63] space-y-0.5">
                    <div className="font-bold text-[#18251E]">
                      {lead.buyerName}{' '}
                      <span className="text-[11px] font-normal text-[#5F6B63]">
                        (Prefers {lead.preferredContactMethod.toUpperCase()})
                      </span>
                    </div>
                    <div className="text-[11px]">
                      Contact: <span className="font-semibold text-[#103D2C]">{lead.phone}</span>
                      {lead.email && <span className="ml-2 text-[#7A8880]">▪ {lead.email}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setMatchingLead(lead);
                        setPropPriceLkr(lead.budgetMinLkr);
                      }}
                      className="px-4 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[2px] transition-colors"
                    >
                      I Have a Matching Listing →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post A Wanted Requirement Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 text-sm text-[#7A8880] hover:text-[#18251E]"
            >
              ✕
            </button>

            {postSuccessMessage ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#103D2C]/10 text-[#103D2C] flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-xl font-extrabold text-[#103D2C]">
                  Wanted Requirement Published
                </h4>
                <p className="text-xs text-[#5F6B63] max-w-sm mx-auto">
                  {postSuccessMessage}
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                    LankaProperty Buyer Network
                  </span>
                  <h3 className="text-xl font-extrabold text-[#103D2C] mt-0.5">
                    Post a Wanted Property Requirement
                  </h3>
                  <p className="text-xs text-[#5F6B63] mt-1">
                    Describe what you are looking to purchase. Verified property owners and licensed brokers will review your brief and offer matching deeds.
                  </p>
                </div>

                {/* Honeypot field for bot trap */}
                <input
                  type="text"
                  name="website_verification_code"
                  value={honeypotValue}
                  onChange={(e) => setHoneypotValue(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Asela Perera"
                      value={postName}
                      onChange={(e) => setPostName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+94 77 123 4567"
                      value={postPhone}
                      onChange={(e) => setPostPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="asela@example.com"
                      value={postEmail}
                      onChange={(e) => setPostEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Buyer Category
                    </label>
                    <select
                      value={postBuyerType}
                      onChange={(e) => setPostBuyerType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
                    >
                      <option value="private_buyer">Private Buyer</option>
                      <option value="diaspora">Diaspora Returnee / NRI</option>
                      <option value="investor">HNW Investor</option>
                      <option value="corporate">Corporate / Institutional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Preferred Contact
                    </label>
                    <select
                      value={postContactMethod}
                      onChange={(e) => setPostContactMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
                    >
                      <option value="whatsapp">WhatsApp Message</option>
                      <option value="call">Direct Phone Call</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#DDE5DF]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Property Type Needed *
                    </label>
                    <select
                      value={postPropType}
                      onChange={(e) => setPostPropType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
                    >
                      <option value="house">House / Residential Villa</option>
                      <option value="apartment">Apartment / Condominium</option>
                      <option value="land">Bare Land / Estate</option>
                      <option value="commercial">Commercial / Industrial Property</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Target District *
                    </label>
                    <select
                      value={postDistrict}
                      onChange={(e) => setPostDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
                    >
                      {SRI_LANKA_DISTRICTS.map((d) => (
                        <option key={d.slug} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                    Specific Localities / Towns (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cinnamon Gardens, Colpetty, Rajagiriya"
                    value={postAreas}
                    onChange={(e) => setPostAreas(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Minimum Budget (LKR)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={postMinBudget}
                      onChange={(e) => setPostMinBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                    <span className="text-[10px] text-[#5F6B63] mt-0.5 block">
                      Approx. {formatPrice(postMinBudget)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Maximum Budget (LKR)
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      value={postMaxBudget}
                      onChange={(e) => setPostMaxBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                    <span className="text-[10px] text-[#5F6B63] mt-0.5 block">
                      Approx. {formatPrice(postMaxBudget)}
                    </span>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                    Headline Summary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent: Looking for 3BR Sea-View Apartment in Colombo 03"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>

                <div className="text-xs">
                  <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                    Detailed Specification / Deed Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe essential specifications: road width, power capacity, deed type, timeframe, etc."
                    value={postDesc}
                    onChange={(e) => setPostDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-[#DDE5DF]">
                  <button
                    type="button"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-4 py-2 border border-[#DDE5DF] text-xs font-bold text-[#5F6B63] rounded-[2px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[2px] transition-colors"
                  >
                    Publish Wanted Requirement →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Match Proposal Modal */}
      {matchingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setMatchingLead(null)}
              className="absolute top-4 right-4 text-sm text-[#7A8880] hover:text-[#18251E]"
            >
              ✕
            </button>

            {proposalSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#103D2C]/10 text-[#103D2C] flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-lg font-extrabold text-[#103D2C]">
                  Listing Transmitted to Buyer
                </h4>
                <p className="text-xs text-[#5F6B63] max-w-sm mx-auto">
                  Your property recommendation has been forwarded directly to {matchingLead.buyerName} via their preferred channel ({matchingLead.preferredContactMethod}).
                </p>
              </div>
            ) : (
              <form onSubmit={handleProposalSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                    Direct Matching Proposal
                  </span>
                  <h4 className="text-lg font-extrabold text-[#103D2C] mt-0.5">
                    Propose Matching Property to Buyer
                  </h4>
                  <p className="text-xs text-[#5F6B63] mt-1">
                    Matching lead: <span className="font-bold text-[#18251E]">{matchingLead.title}</span> ({matchingLead.district})
                  </p>
                </div>

                <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#5F6B63]">Buyer Budget:</span>
                    <span className="font-bold text-[#103D2C]">{formatPrice(matchingLead.budgetMinLkr)} – {formatPrice(matchingLead.budgetMaxLkr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B63]">Buyer:</span>
                    <span className="font-bold text-[#18251E]">{matchingLead.buyerName} ({matchingLead.phone})</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Your Name / Agency *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Colombo Premier Realty"
                        value={proposerName}
                        onChange={(e) => setProposerName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Your Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+94 77 000 0000"
                        value={proposerPhone}
                        onChange={(e) => setProposerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Property Title / Short Summary *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3BR Condominium, 1,650 sq.ft at Kollupitiya"
                      value={propTitle}
                      onChange={(e) => setPropTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Asking Price (LKR) *
                      </label>
                      <input
                        type="number"
                        required
                        step="500000"
                        value={propPriceLkr}
                        onChange={(e) => setPropPriceLkr(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Your Role
                      </label>
                      <select
                        value={proposerRole}
                        onChange={(e) => setProposerRole(e.target.value as any)}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
                      >
                        <option value="agent">Registered Real Estate Agent</option>
                        <option value="owner">Direct Property Owner</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Property URL / Listing Link (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://lankaproperty.lk/properties/..."
                      value={propUrl}
                      onChange={(e) => setPropUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Notes for Buyer
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief deed confirmation, inspection availability, key features..."
                      value={propNotes}
                      onChange={(e) => setPropNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
                  <button
                    type="button"
                    onClick={() => setMatchingLead(null)}
                    className="px-4 py-2 border border-[#DDE5DF] text-xs font-bold text-[#5F6B63] rounded-[2px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[2px] transition-colors"
                  >
                    Send Proposal to Buyer →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
