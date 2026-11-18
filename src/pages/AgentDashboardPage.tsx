import { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { userPortalService, PortalUser } from '../services/userPortalService';
import { propertyService } from '../services/propertyService';
import { useCurrency } from '../context/CurrencyContext';
import { AdminPropertyRecord } from '../admin/types/admin';
import { compressImagesBatch, formatBytes } from '../utils/imageCompressor';
import { uploadBatchPropertyPhotosToHostinger } from '../services/mediaStorageService';
import { wantedPropertyService, WantedPropertyLead } from '../services/wantedPropertyService';
import { advertisingPackageService, AdvertisedPackage } from '../services/advertisingPackageService';

export function AgentDashboardPage() {
  const { navigate } = useRouter();
  const { formatPrice } = useCurrency();

  const [packagesList, setPackagesList] = useState<AdvertisedPackage[]>(() =>
    advertisingPackageService.getAllPackages()
  );

  useEffect(() => {
    const unsub = advertisingPackageService.subscribe(() => {
      setPackagesList(advertisingPackageService.getAllPackages());
    });
    return () => unsub();
  }, []);

  const [currentUser, setCurrentUser] = useState<PortalUser | null>(() => {
    const user = userPortalService.getCurrentUser();
    if (!user || user.role !== 'agent') {
      // Auto-fallback to demo agent
      return userPortalService.loginDemoUser('agent-rohan');
    }
    return user;
  });

  const [activeTab, setActiveTab] = useState<'inventory' | 'leads' | 'wanted' | 'packages' | 'profile'>('inventory');
  const [agentProperties, setAgentProperties] = useState<AdminPropertyRecord[]>([]);
  const [wantedLeads, setWantedLeads] = useState<WantedPropertyLead[]>([]);
  const [matchingLeadForProposal, setMatchingLeadForProposal] = useState<WantedPropertyLead | null>(null);
  const [selectedInventoryPropId, setSelectedInventoryPropId] = useState<string>('');
  const [proposalCustomPrice, setProposalCustomPrice] = useState<number>(0);
  const [proposalNotes, setProposalNotes] = useState<string>('');
  const [proposalSuccess, setProposalSuccess] = useState<boolean>(false);

  // Modals & Editing
  const [editingProperty, setEditingProperty] = useState<AdminPropertyRecord | null>(null);
  const [boostTargetProperty, setBoostTargetProperty] = useState<AdminPropertyRecord | null>(null);
  const [selectedBoostType, setSelectedBoostType] = useState<'featured' | 'trending' | 'both'>('featured');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isCompressingAgentPhotos, setIsCompressingAgentPhotos] = useState(false);
  const [agentCompressionStats, setAgentCompressionStats] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProperties = () => {
    if (!currentUser) return;
    const props = userPortalService.getUserProperties(currentUser.id);
    setAgentProperties(props);
    setWantedLeads(wantedPropertyService.getWantedLeads());
  };

  useEffect(() => {
    loadProperties();
    const unsubProp = propertyService.subscribe(() => loadProperties());
    const unsubAuth = userPortalService.subscribe(() => {
      const u = userPortalService.getCurrentUser();
      setCurrentUser(u);
    });
    return () => {
      unsubProp();
      unsubAuth();
    };
  }, [currentUser?.id]);

  if (!currentUser) {
    return (
      <div className="bg-[#FAFBF9] min-h-[70vh] flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="text-xl font-bold text-[#103D2C]">Agent Authentication Required</h2>
        <p className="text-xs text-[#5F6B63]">Please sign in to access your certified agency console.</p>
        <button
          onClick={() => navigate('/auth?mode=login&role=agent')}
          className="px-6 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase rounded-[2px]"
        >
          Sign In as Real Estate Agent
        </button>
      </div>
    );
  }

  // KPIs
  const totalListings = agentProperties.length;
  const totalPortfolioValue = agentProperties.reduce((sum, p) => sum + (p.priceLkr || 0), 0);
  const activePlan =
    packagesList.find(
      (p) =>
        p.id === currentUser.activePackageId ||
        p.id.replace('-package', '') === currentUser.activePackageId ||
        p.id.replace('starter-', '') === currentUser.activePackageId
    ) || packagesList[0];

  const filteredProperties = agentProperties.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.location.city.toLowerCase().includes(q) ||
        p.location.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (id: string, newStatus: 'available' | 'reserved' | 'sold') => {
    const found = agentProperties.find((p) => p.id === id);
    if (!found) return;
    propertyService.saveProperty({
      ...found,
      status: newStatus,
    });
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this listing from the database?')) {
      await propertyService.deleteProperty(id);
      loadProperties();
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    propertyService.saveProperty(editingProperty);
    setEditingProperty(null);
    loadProperties();
  };

  const handleUpgradePlan = (planId: string) => {
    userPortalService.updateUserPackage(currentUser.id, planId);
    const targetName = packagesList.find((p) => p.id === planId)?.name || 'Selected Plan';
    alert(`Agency upgraded to ${targetName}!`);
  };

  return (
    <div className="bg-[#FAFBF9] min-h-screen text-[#18251E] pb-24">
      {/* Top Banner Bar */}
      <div className="bg-[#18251E] text-white py-6 border-b border-[#2D3E35]">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#9FE3B8] bg-[#103D2C] px-2 py-0.5 rounded-[2px] border border-[#2D3E35]">
                Licensed Real Estate Agent Portal
              </span>
              <span className="text-xs text-[#A3B8AD]">· Lic: {currentUser.licenseNumber || 'Verified Broker'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              {currentUser.agencyName || currentUser.name}
            </h1>
            <p className="text-xs text-[#A3B8AD] mt-0.5">
              Principal Broker: {currentUser.name} · Phone / WhatsApp: {currentUser.phone}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/list-property')}
              className="px-5 py-2.5 bg-[#C93636] hover:bg-[#A92828] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-xs"
            >
              + List New Property
            </button>
            <button
              onClick={() => userPortalService.logout()}
              className="px-3.5 py-2.5 bg-white/10 border border-white/20 hover:bg-white/20 text-[#E8F3EC] text-xs font-bold rounded-[2px] transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 pt-8 space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#DDE5DF] p-5 rounded-[2px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">Agency Listings</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] mt-1">{totalListings}</div>
            <div className="text-[10px] text-[#176B45] font-semibold mt-1">Live in catalog</div>
          </div>
          <div className="bg-white border border-[#DDE5DF] p-5 rounded-[2px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">Portfolio Value</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
              {formatPrice(totalPortfolioValue, true)}
            </div>
            <div className="text-[10px] text-[#5F6B63] mt-1">Total asking value</div>
          </div>
          <div className="bg-white border border-[#DDE5DF] p-5 rounded-[2px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">Active Buyer Leads</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#176B45] mt-1">
              {Math.max(6, totalListings * 3)}
            </div>
            <div className="text-[10px] text-[#5F6B63] mt-1">Inquiries this month</div>
          </div>
          <div className="bg-white border border-[#DDE5DF] p-5 rounded-[2px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">Agency Plan</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#C93636] mt-1">{activePlan.name}</div>
            <button
              onClick={() => setActiveTab('packages')}
              className="text-[10px] text-[#176B45] underline font-bold mt-1 cursor-pointer block"
            >
              Manage Agency Plan
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#DDE5DF] text-xs font-bold">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-[#103D2C] text-[#103D2C]'
                : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
            }`}
          >
            Agency Property Inventory ({totalListings})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'leads'
                ? 'border-[#103D2C] text-[#103D2C]'
                : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
            }`}
          >
            Buyer Leads & CRM
          </button>
          <button
            onClick={() => setActiveTab('wanted')}
            className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'wanted'
                ? 'border-[#103D2C] text-[#103D2C]'
                : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
            }`}
          >
            Wanted Buyer Demands ({wantedLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'packages'
                ? 'border-[#103D2C] text-[#103D2C]'
                : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
            }`}
          >
            Agency Packages
          </button>
        </div>

        {/* TAB 1: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-[#DDE5DF] p-4 rounded-[2px] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                placeholder="Search by title, city, or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#5F6B63]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
                <button
                  onClick={() => navigate('/list-property')}
                  className="px-4 py-1.5 bg-[#103D2C] text-white text-xs font-bold rounded-[2px]"
                >
                  + Add Property
                </button>
              </div>
            </div>

            {/* Properties Grid */}
            {filteredProperties.length === 0 ? (
              <div className="bg-white border border-[#DDE5DF] rounded-[2px] p-12 text-center space-y-4">
                <div className="text-base font-bold text-[#103D2C]">No properties found.</div>
                <p className="text-xs text-[#5F6B63]">
                  List properties on behalf of your agency clients to market them to domestic and diaspora buyers.
                </p>
                <button
                  onClick={() => navigate('/list-property')}
                  className="px-6 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase rounded-[2px]"
                >
                  List New Property Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white border border-[#DDE5DF] rounded-[2px] overflow-hidden shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-44 bg-black/5">
                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#103D2C] text-white text-[10px] font-bold uppercase rounded-[2px]">
                          {prop.purpose}
                        </span>
                        {prop.isFeatured && (
                          <span className="absolute top-8 left-2.5 px-2 py-0.5 bg-[#103D2C] text-white text-[9px] font-extrabold uppercase rounded-[2px] tracking-wider">
                            FEATURED
                          </span>
                        )}
                        {prop.isTrending && (
                          <span className="absolute top-13.5 left-2.5 px-2 py-0.5 bg-[#C93636] text-white text-[9px] font-extrabold uppercase rounded-[2px] tracking-wider">
                            TRENDING
                          </span>
                        )}
                        <span
                          className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-[2px] ${
                            prop.status === 'sold'
                              ? 'bg-[#C93636] text-white'
                              : prop.status === 'reserved'
                              ? 'bg-amber-600 text-white'
                              : 'bg-[#176B45] text-white'
                          }`}
                        >
                          {prop.status}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded-[2px]">
                          {prop.images.length} Photos
                        </span>
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">
                          {prop.location.city}, {prop.location.district}
                        </div>
                        <h3 className="text-base font-bold text-[#103D2C] line-clamp-1">{prop.title}</h3>
                        <div className="text-lg font-extrabold text-[#18251E]">
                          {formatPrice(prop.priceLkr)} {prop.priceUnit !== 'total' && `/${prop.priceUnit}`}
                        </div>
                        <p className="text-xs text-[#5F6B63] line-clamp-2">{prop.description}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#FAFBF9] border-t border-[#DDE5DF] flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => navigate(`/properties/${prop.slug}`)}
                        className="text-[#176B45] font-bold hover:underline"
                      >
                        View Live
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBoostTargetProperty(prop)}
                          className="px-2.5 py-1 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold rounded-[2px] transition-colors cursor-pointer"
                        >
                          Boost
                        </button>
                        <button
                          onClick={() => setEditingProperty(prop)}
                          className="px-2.5 py-1 bg-white border border-[#DDE5DF] font-semibold rounded-[2px]"
                        >
                          Edit
                        </button>
                        <select
                          value={prop.status}
                          onChange={(e) => handleStatusChange(prop.id, e.target.value as any)}
                          className="px-2 py-1 bg-white border border-[#DDE5DF] rounded-[2px] font-medium"
                        >
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="sold">Sold</option>
                        </select>
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="px-2 py-1 bg-white border border-[#DDE5DF] text-[#C93636] font-semibold rounded-[2px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUYER LEADS */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#DDE5DF] p-6 rounded-[2px] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#103D2C]">Agency Inquiries & Leads Pipeline</h2>
                <p className="text-xs text-[#5F6B63] mt-0.5">Direct buyer contacts for your agency listings.</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-[#E8F3EC] text-[#176B45] font-bold rounded-[2px]">
                Active Pipeline
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  client: 'Suren De Mel',
                  property: 'Altair Ocean & Lake Facing Residence',
                  phone: '+94 77 111 2233',
                  email: 'suren.demel@gmail.com',
                  message: 'Requesting a private weekend inspection for a client visiting from Dubai.',
                  stage: 'Viewing Scheduled',
                },
                {
                  client: 'Global Lanka Diaspora Fund',
                  property: 'The Frangipani Courtyard Villa',
                  phone: '+61 400 987 654',
                  email: 'acquisitions@globallankafund.com',
                  message: 'Looking to acquire freehold boutique villa. Please confirm title status and vacant possession.',
                  stage: 'Negotiating',
                },
              ].map((lead, idx) => (
                <div key={idx} className="bg-white border border-[#DDE5DF] p-5 rounded-[2px] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#103D2C]">{lead.client}</span>
                    <span className="px-2 py-0.5 bg-[#176B45] text-white font-bold text-[10px] uppercase rounded-[2px]">
                      {lead.stage}
                    </span>
                  </div>
                  <div className="text-xs text-[#176B45] font-semibold">Re: {lead.property}</div>
                  <p className="text-xs text-[#5F6B63] bg-[#FAFBF9] p-3 rounded-[2px]">"{lead.message}"</p>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[#5F6B63]">{lead.phone}</span>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#176B45] text-white font-bold rounded-[2px] text-[11px]"
                    >
                      Connect on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2.5: WANTED BUYER DEMANDS */}
        {activeTab === 'wanted' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#DDE5DF] p-6 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#103D2C]">Live Buyer Property Demands</h2>
                <p className="text-xs text-[#5F6B63] mt-0.5">
                  Pre-screened active buyer requirements. Match your agency inventory directly to these active inquiries.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-[#103D2C] text-white font-bold rounded-[2px] self-start sm:self-auto">
                {wantedLeads.length} Demands Active
              </span>
            </div>

            <div className="space-y-4">
              {wantedLeads.map((wLead) => (
                <div
                  key={wLead.id}
                  className="bg-white border border-[#DDE5DF] p-5 rounded-[2px] hover:border-[#103D2C]/40 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <span className="px-2 py-0.5 bg-[#103D2C] text-white rounded-[2px]">{wLead.district}</span>
                        <span className="px-2 py-0.5 bg-[#E8F3EC] text-[#176B45] rounded-[2px]">{wLead.propertyType}</span>
                        {wLead.verifiedBuyer && (
                          <span className="px-2 py-0.5 bg-[#E6F3EB] text-[#176B45] border border-[#176B45]/20 rounded-[2px]">
                            Verified Buyer
                          </span>
                        )}
                        <span className="text-[#5F6B63]">Ref: {wLead.id}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#18251E]">{wLead.title}</h3>
                    </div>

                    <div className="sm:text-right shrink-0 bg-[#FAFBF9] border border-[#DDE5DF] p-2.5 rounded-[2px]">
                      <span className="text-[10px] font-bold text-[#5F6B63] uppercase block">Budget Allocation</span>
                      <div className="text-sm font-extrabold text-[#103D2C]">
                        {formatPrice(wLead.budgetMinLkr)} – {formatPrice(wLead.budgetMaxLkr)}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A5750] leading-relaxed">{wLead.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F6B63] pt-1 border-t border-[#DDE5DF]/60">
                    <div>
                      <span className="font-bold text-[#18251E]">Target Localities:</span> {wLead.specificAreas.join(', ')}
                    </div>
                    {wLead.minBedrooms && (
                      <div>
                        <span className="font-bold text-[#18251E]">Bedrooms:</span> {wLead.minBedrooms}+
                      </div>
                    )}
                    {wLead.minLandPerches && (
                      <div>
                        <span className="font-bold text-[#18251E]">Land:</span> {wLead.minLandPerches}+ Perches
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#DDE5DF]">
                    <div className="text-xs text-[#5F6B63]">
                      Buyer: <span className="font-bold text-[#18251E]">{wLead.buyerName}</span> ({wLead.phone}) · <span className="capitalize">{wLead.buyerType.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${wLead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 border border-[#176B45] text-[#176B45] hover:bg-[#176B45]/5 font-bold rounded-[2px] text-xs"
                      >
                        WhatsApp Buyer
                      </a>
                      <button
                        onClick={() => {
                          setMatchingLeadForProposal(wLead);
                          if (agentProperties.length > 0) {
                            setSelectedInventoryPropId(agentProperties[0].id);
                            setProposalCustomPrice(agentProperties[0].priceLkr);
                          }
                        }}
                        className="px-3 py-1.5 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold rounded-[2px] text-xs transition-colors"
                      >
                        Propose Inventory Listing
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agency Matching Proposal Modal */}
        {matchingLeadForProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-lg w-full p-6 shadow-2xl relative space-y-4">
              <button
                onClick={() => setMatchingLeadForProposal(null)}
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
                    Proposal Dispatched Successfully
                  </h4>
                  <p className="text-xs text-[#5F6B63] max-w-sm mx-auto">
                    Your property recommendation from agency inventory has been delivered to {matchingLeadForProposal.buyerName}.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!currentUser) return;
                    const selectedProp = agentProperties.find(p => p.id === selectedInventoryPropId);
                    const propTitle = selectedProp ? selectedProp.title : 'Direct Agency Recommendation';
                    const propPrice = selectedProp ? selectedProp.priceLkr : (proposalCustomPrice || matchingLeadForProposal.budgetMinLkr);
                    const propUrl = selectedProp ? `https://lankaproperty.lk/properties/${selectedProp.slug}` : undefined;

                    wantedPropertyService.submitProposal({
                      leadId: matchingLeadForProposal.id,
                      senderName: currentUser.name,
                      senderPhone: currentUser.phone || '+94 77 123 4567',
                      senderRole: 'agent',
                      propertyTitle: propTitle,
                      priceLkr: propPrice,
                      propertyUrl: propUrl,
                      notes: proposalNotes,
                    });

                    setProposalSuccess(true);
                    setWantedLeads(wantedPropertyService.getWantedLeads());
                    setTimeout(() => {
                      setMatchingLeadForProposal(null);
                      setProposalSuccess(false);
                      setProposalNotes('');
                    }, 2200);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                      Agency Direct Matching Desk
                    </span>
                    <h4 className="text-lg font-extrabold text-[#103D2C] mt-0.5">
                      Propose Agency Listing to {matchingLeadForProposal.buyerName}
                    </h4>
                    <p className="text-xs text-[#5F6B63] mt-1">
                      Lead: <span className="font-bold text-[#18251E]">{matchingLeadForProposal.title}</span> ({matchingLeadForProposal.district})
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Select from your active inventory
                      </label>
                      {agentProperties.length > 0 ? (
                        <select
                          value={selectedInventoryPropId}
                          onChange={(e) => {
                            setSelectedInventoryPropId(e.target.value);
                            const p = agentProperties.find(item => item.id === e.target.value);
                            if (p) setProposalCustomPrice(p.priceLkr);
                          }}
                          className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white focus:outline-none focus:border-[#103D2C]"
                        >
                          {agentProperties.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} ({formatPrice(p.priceLkr)})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] text-[#5F6B63]">
                          No active properties in your agency inventory yet. You can still submit a custom property summary.
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Proposed Asking Price (LKR)
                      </label>
                      <input
                        type="number"
                        step="500000"
                        value={proposalCustomPrice || ''}
                        onChange={(e) => setProposalCustomPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Broker Pitch & Inspection Availability
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Highlight clear title, road access, floor level, key features matching their request..."
                        value={proposalNotes}
                        onChange={(e) => setProposalNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
                    <button
                      type="button"
                      onClick={() => setMatchingLeadForProposal(null)}
                      className="px-4 py-2 border border-[#DDE5DF] text-xs font-bold text-[#5F6B63] rounded-[2px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[2px] transition-colors"
                    >
                      Dispatch Proposal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#DDE5DF] p-6 rounded-[2px]">
              <h2 className="text-xl font-bold text-[#103D2C]">Agency Advertising Packages</h2>
              <p className="text-xs text-[#5F6B63] mt-1">
                Elevate your agency branding across all 25 districts and overseas diaspora networks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packagesList.filter((p) => p.active).map((pkg) => {
                const isCurrent =
                  currentUser.activePackageId === pkg.id ||
                  (pkg.id.includes('free') && currentUser.activePackageId === 'free') ||
                  (pkg.id.includes('platinum') && currentUser.activePackageId === 'platinum') ||
                  (pkg.id.includes('diamond') && currentUser.activePackageId === 'diamond') ||
                  (pkg.id.includes('gold') && currentUser.activePackageId === 'gold') ||
                  (pkg.id.includes('premium-pro') && currentUser.activePackageId === 'premium-pro');
                return (
                  <div
                    key={pkg.id}
                    className={`bg-white border rounded-[2px] p-6 flex flex-col justify-between ${
                      isCurrent ? 'border-[#176B45] ring-2 ring-[#176B45] shadow-sm' : 'border-[#DDE5DF]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#103D2C] text-lg">{pkg.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#176B45] text-white text-[9px] font-bold uppercase rounded-[2px]">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#DDE5DF]">
                        <span className="text-2xl font-extrabold text-[#18251E]">{formatPrice(pkg.priceLkr)}</span>
                        <span className="text-xs text-[#5F6B63] ml-1">/ {pkg.duration}</span>
                      </div>
                      <ul className="mt-4 pt-3 border-t border-[#DDE5DF] space-y-2 text-xs text-[#18251E]">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#176B45] font-bold">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-4 border-t border-[#DDE5DF]">
                      <button
                        onClick={() => handleUpgradePlan(pkg.id)}
                        disabled={isCurrent}
                        className={`w-full py-2.5 text-xs font-bold uppercase rounded-[2px] transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#E8F3EC] text-[#176B45] border border-[#176B45]/40 cursor-default'
                            : 'bg-[#103D2C] hover:bg-[#176B45] text-white'
                        }`}
                      >
                        {isCurrent ? 'Active Agency Plan' : `Activate ${pkg.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROPERTY MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-[#DDE5DF] rounded-[2px] max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <h3 className="text-lg font-bold text-[#103D2C]">Edit Property: {editingProperty.title}</h3>
              <button
                onClick={() => setEditingProperty(null)}
                className="text-xs font-bold px-2.5 py-1 bg-[#FAFBF9] border border-[#DDE5DF] hover:bg-[#E8F3EC] rounded-[2px]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#18251E] mb-1">Property Title *</label>
                <input
                  type="text"
                  required
                  value={editingProperty.title}
                  onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Asking Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    value={editingProperty.priceLkr}
                    onChange={(e) => setEditingProperty({ ...editingProperty, priceLkr: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Status</label>
                  <select
                    value={editingProperty.status}
                    onChange={(e) => setEditingProperty({ ...editingProperty, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18251E] mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  value={editingProperty.description}
                  onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] resize-y"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#18251E]">
                    Photographs ({editingProperty.images.length} / 20 Photos)
                  </label>
                  <label className="text-xs font-bold text-[#176B45] hover:underline cursor-pointer">
                    {isCompressingAgentPhotos ? 'Compressing...' : '+ Upload from Device'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={isCompressingAgentPhotos || editingProperty.images.length >= 20}
                      className="sr-only"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const available = 20 - editingProperty.images.length;
                        if (available <= 0) return;
                        setIsCompressingAgentPhotos(true);
                        try {
                          const summary = await compressImagesBatch(Array.from(files).slice(0, available), 1920, 0.82);
                          const rawUrls = summary.results.map((r) => r.dataUrl);
                          const hostedUrls = await uploadBatchPropertyPhotosToHostinger(rawUrls);
                          setEditingProperty({
                            ...editingProperty,
                            images: [...editingProperty.images, ...hostedUrls],
                          });
                          setAgentCompressionStats(`${summary.results.length} photos uploaded to Hostinger SSD (${summary.overallPercentSaved}% space saved)`);
                        } catch (err: any) {
                          alert(`Compression failed: ${err.message}`);
                        } finally {
                          setIsCompressingAgentPhotos(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {agentCompressionStats && (
                  <div className="bg-[#E8F3EC] text-[#103D2C] p-2 rounded-[2px] text-xs font-semibold mb-2">
                    {agentCompressionStats}
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder="Add direct photo URL..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPhotoUrl.trim() || editingProperty.images.length >= 20) return;
                      setEditingProperty({
                        ...editingProperty,
                        images: [...editingProperty.images, newPhotoUrl.trim()],
                      });
                      setNewPhotoUrl('');
                    }}
                    className="px-3 py-1.5 bg-[#176B45] text-white font-bold rounded-[2px]"
                  >
                    Add
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {editingProperty.images.map((img, idx) => (
                    <div key={idx} className="relative group border border-[#DDE5DF] rounded-[2px] overflow-hidden">
                      <img src={img} alt="Photo" className="w-full h-16 object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProperty({
                            ...editingProperty,
                            images: editingProperty.images.filter((_, i) => i !== idx),
                          });
                        }}
                        className="absolute inset-0 bg-red-600/70 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE5DF] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 bg-[#FAFBF9] border border-[#DDE5DF] text-[#18251E] font-bold rounded-[2px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold rounded-[2px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Promotional Boost Modal */}
      {boostTargetProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE5DF] rounded-[3px] max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#176B45]">
                  AGENT PROMOTION DESK
                </span>
                <h3 className="text-lg font-bold text-[#103D2C]">
                  Boost Listing: {boostTargetProperty.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBoostTargetProperty(null)}
                className="text-[#5F6B63] hover:text-[#18251E] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#5F6B63] leading-relaxed">
              Place your mandate into prime homepage showcase slots to accelerate buyer lead generation and close transactions faster.
            </p>

            <div className="space-y-3">
              {[
                {
                  id: 'featured',
                  name: 'Homepage Featured Showcase Placement',
                  badge: 'HOMEPAGE PIN',
                  priceLkr: 12500,
                  description:
                    'Pins listing to the top of the homepage Featured Showcase and guarantees priority placement in city searches for 30 days.',
                },
                {
                  id: 'trending',
                  name: 'Trending Market Velocity Spotlight',
                  badge: 'HIGH DEMAND',
                  priceLkr: 8500,
                  description:
                    'Places listing into the Homepage Trending section with real-time velocity tags highlighting buyer demand for 30 days.',
                },
                {
                  id: 'both',
                  name: 'Omni-Boost Bundle (Both Featured + Trending)',
                  badge: 'SAVE 15%',
                  priceLkr: 18000,
                  description:
                    'Maximum reach: Featured Showcase + Trending Spotlight + Top Pinned Ranking across all 25 districts.',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedBoostType(opt.id as any)}
                  className={`p-4 border rounded-[2px] cursor-pointer transition-all ${
                    selectedBoostType === opt.id
                      ? 'border-[#176B45] bg-[#E8F3EC]/50 ring-1 ring-[#176B45]'
                      : 'border-[#DDE5DF] bg-[#FAFBF9] hover:border-[#176B45]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-[#103D2C] text-white rounded-[2px]">
                      {opt.badge}
                    </span>
                    <span className="text-sm font-extrabold text-[#103D2C]">
                      {formatPrice(opt.priceLkr)}{' '}
                      <span className="text-[10px] font-normal text-[#5F6B63]">/ 30 Days</span>
                    </span>
                  </div>
                  <div className="font-bold text-xs text-[#18251E]">{opt.name}</div>
                  <p className="text-[11px] text-[#5F6B63] mt-1 leading-snug">{opt.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#DDE5DF] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setBoostTargetProperty(null)}
                className="px-4 py-2 border border-[#DDE5DF] text-xs font-bold text-[#5F6B63] rounded-[2px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedBoostType === 'featured') {
                    propertyService.toggleFeatured(boostTargetProperty.id, true);
                  } else if (selectedBoostType === 'trending') {
                    propertyService.toggleTrending(
                      boostTargetProperty.id,
                      true,
                      'High Demand: Agent Boosted'
                    );
                  } else {
                    propertyService.toggleFeatured(boostTargetProperty.id, true);
                    propertyService.toggleTrending(
                      boostTargetProperty.id,
                      true,
                      'High Demand: Omni-Boosted'
                    );
                  }
                  alert(
                    `Listing successfully boosted to ${
                      selectedBoostType === 'both' ? 'Featured & Trending' : selectedBoostType
                    } showcase!`
                  );
                  setBoostTargetProperty(null);
                  loadProperties();
                }}
                className="px-6 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-extrabold uppercase tracking-wider rounded-[2px] transition-colors"
              >
                Activate Boost Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
