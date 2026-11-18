import { useState, useEffect } from 'react';
import { useRouter } from '../hooks/useRouter';
import { userPortalService, PortalUser } from '../services/userPortalService';
import { propertyService } from '../services/propertyService';
import { useCurrency } from '../context/CurrencyContext';
import { AdminPropertyRecord } from '../admin/types/admin';
import { compressImagesBatch, formatBytes } from '../utils/imageCompressor';
import { uploadBatchPropertyPhotosToHostinger } from '../services/mediaStorageService';
import { advertisingPackageService, AdvertisedPackage } from '../services/advertisingPackageService';

export function OwnerDashboardPage() {
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
    if (!user || user.role !== 'owner') {
      // Auto-fallback to demo owner if direct accessing
      return userPortalService.loginDemoUser('owner-roshan');
    }
    return user;
  });

  const [activeTab, setActiveTab] = useState<'properties' | 'packages' | 'inquiries'>('properties');
  const [ownerProperties, setOwnerProperties] = useState<AdminPropertyRecord[]>([]);

  // Edit Modal State
  const [editingProperty, setEditingProperty] = useState<AdminPropertyRecord | null>(null);
  const [boostTargetProperty, setBoostTargetProperty] = useState<AdminPropertyRecord | null>(null);
  const [selectedBoostType, setSelectedBoostType] = useState<'featured' | 'trending' | 'both'>('featured');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isCompressingOwnerPhotos, setIsCompressingOwnerPhotos] = useState(false);
  const [ownerCompressionStats, setOwnerCompressionStats] = useState<string | null>(null);

  const loadProperties = () => {
    if (!currentUser) return;
    const props = userPortalService.getUserProperties(currentUser.id);
    setOwnerProperties(props);
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
        <h2 className="text-xl font-bold text-[#103D2C]">Property Owner Sign-In Required</h2>
        <p className="text-xs text-[#5F6B63]">Please authenticate to access your personal owner dashboard.</p>
        <button
          onClick={() => navigate('/auth?mode=login&role=owner')}
          className="px-6 py-2.5 bg-[#103D2C] text-white text-xs font-bold uppercase rounded-[2px]"
        >
          Sign In as Property Owner →
        </button>
      </div>
    );
  }

  // KPIs
  const totalListings = ownerProperties.length;
  const totalPortfolioValue = ownerProperties.reduce((sum, p) => sum + (p.priceLkr || 0), 0);
  const totalViews = ownerProperties.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const activePlan =
    packagesList.find(
      (p) =>
        p.id === currentUser.activePackageId ||
        p.id.replace('-package', '') === currentUser.activePackageId ||
        p.id.replace('starter-', '') === currentUser.activePackageId
    ) || packagesList[0];

  const handleStatusChange = (id: string, newStatus: 'available' | 'reserved' | 'sold') => {
    const found = ownerProperties.find((p) => p.id === id);
    if (!found) return;
    propertyService.saveProperty({
      ...found,
      status: newStatus,
    });
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm('Are you sure you want to delete this listing from the database and marketplace?')) {
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
    alert(`Successfully activated the ${targetName}!`);
  };

  return (
    <div className="bg-[#FAFBF9] min-h-screen text-[#18251E] pb-24">
      {/* Top Banner Bar */}
      <div className="bg-white border-b border-[#DDE5DF] py-6">
        <div className="max-w-[1360px] mx-auto px-5 md:px-8 lg:px-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#176B45] bg-[#E8F3EC] px-2 py-0.5 rounded-[2px]">
                Property Owner Dashboard
              </span>
              <span className="text-xs text-[#5F6B63]">· {currentUser.district || 'Colombo'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tracking-tight mt-1">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-[#5F6B63] mt-0.5">
              Email: {currentUser.email} · Phone: {currentUser.phone}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/list-property')}
              className="px-5 py-2.5 bg-[#C93636] hover:bg-[#A92828] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-xs"
            >
              + Post New Property
            </button>
            <button
              onClick={() => userPortalService.logout()}
              className="px-3.5 py-2.5 bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#C93636] text-[#5F6B63] hover:text-[#C93636] text-xs font-bold rounded-[2px] transition-colors cursor-pointer"
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">My Properties</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] mt-1">{totalListings}</div>
            <div className="text-[10px] text-[#176B45] font-semibold mt-1">Active in marketplace</div>
          </div>
          <div className="bg-white border border-[#DDE5DF] p-5 rounded-[2px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">Total Portfolio Value</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
              {formatPrice(totalPortfolioValue, true)}
            </div>
            <div className="text-[10px] text-[#5F6B63] mt-1">LKR market valuation</div>
          </div>
          <div className="bg-white border border-[#DDE5DF] p-5 rounded-[2px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">Listing Views</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#176B45] mt-1">
              {Math.max(totalViews, totalListings * 142)}
            </div>
            <div className="text-[10px] text-[#5F6B63] mt-1">Impressions this month</div>
          </div>
          <div className="bg-white border border-[#DDE5DF] p-5 rounded-[2px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63]">Active Plan</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#C93636] mt-1">{activePlan.name}</div>
            <button
              onClick={() => setActiveTab('packages')}
              className="text-[10px] text-[#176B45] underline font-bold mt-1 cursor-pointer block"
            >
              Upgrade Plan →
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#DDE5DF] text-xs font-bold">
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'properties'
                ? 'border-[#103D2C] text-[#103D2C]'
                : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
            }`}
          >
            My Listed Properties ({totalListings})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'packages'
                ? 'border-[#103D2C] text-[#103D2C]'
                : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
            }`}
          >
            Choose & Upgrade Advertising Plan
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`py-3 px-6 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'inquiries'
                ? 'border-[#103D2C] text-[#103D2C]'
                : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
            }`}
          >
            Buyer Inquiries ({totalListings > 0 ? 3 : 0})
          </button>
        </div>

        {/* TAB 1: MY PROPERTIES */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            {ownerProperties.length === 0 ? (
              <div className="bg-white border border-[#DDE5DF] rounded-[2px] p-12 text-center space-y-4">
                <div className="text-base font-bold text-[#103D2C]">You have not listed any properties yet.</div>
                <p className="text-xs text-[#5F6B63] max-w-md mx-auto">
                  Post your home, land plot, or apartment to reach over 500,000 buyers across Sri Lanka and overseas.
                </p>
                <button
                  onClick={() => navigate('/list-property')}
                  className="px-6 py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase rounded-[2px]"
                >
                  Post Your First Property Free →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownerProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white border border-[#DDE5DF] rounded-[2px] overflow-hidden shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Property Image & Status */}
                      <div className="relative h-44 bg-black/5">
                        <img
                          src={prop.images[0]}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#103D2C] text-white text-[10px] font-bold uppercase rounded-[2px]">
                          {prop.purpose === 'buy' ? 'For Sale' : prop.purpose === 'rent' ? 'For Rent' : 'Land'}
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

                      {/* Content */}
                      <div className="p-5 space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">
                          {prop.location.city}, {prop.location.district}
                        </div>
                        <h3 className="text-base font-bold text-[#103D2C] leading-snug line-clamp-2">
                          {prop.title}
                        </h3>
                        <div className="text-lg font-extrabold text-[#18251E] pt-1">
                          {formatPrice(prop.priceLkr)} {prop.priceUnit !== 'total' && `/${prop.priceUnit}`}
                        </div>
                        <p className="text-xs text-[#5F6B63] line-clamp-2 leading-relaxed">
                          {prop.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="p-4 bg-[#FAFBF9] border-t border-[#DDE5DF] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => navigate(`/properties/${prop.slug}`)}
                        className="text-[#176B45] hover:underline font-bold"
                      >
                        View Live →
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBoostTargetProperty(prop)}
                          className="px-2.5 py-1 bg-[#103D2C] hover:bg-[#176B45] text-white text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                        >
                          Boost
                        </button>
                        <button
                          onClick={() => setEditingProperty(prop)}
                          className="px-2.5 py-1 bg-white border border-[#DDE5DF] hover:border-[#103D2C] text-[#103D2C] font-semibold rounded-[2px]"
                        >
                          Edit
                        </button>
                        <select
                          value={prop.status}
                          onChange={(e) => handleStatusChange(prop.id, e.target.value as any)}
                          className="px-2 py-1 bg-white border border-[#DDE5DF] text-[#18251E] rounded-[2px] font-medium"
                        >
                          <option value="available">Available</option>
                          <option value="reserved">Reserved</option>
                          <option value="sold">Sold</option>
                        </select>
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="px-2 py-1 bg-white border border-[#DDE5DF] hover:border-[#C93636] text-[#C93636] font-semibold rounded-[2px]"
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

        {/* TAB 2: CHOOSE & UPGRADE ADVERTISING PLANS */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#DDE5DF] p-6 rounded-[2px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#176B45]">
                UPGRADE YOUR REACH
              </span>
              <h2 className="text-xl font-bold text-[#103D2C] mt-1">
                Choose the Right Exposure Plan for Your Properties
              </h2>
              <p className="text-xs text-[#5F6B63] mt-1">
                Upgrading unlocks top-of-search placement, 20 high-resolution photos, and verified title trust badges.
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
                      isCurrent
                        ? 'border-[#176B45] ring-2 ring-[#176B45] shadow-sm'
                        : 'border-[#DDE5DF] hover:border-[#103D2C]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-[#103D2C] text-lg">{pkg.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#176B45] text-white text-[9px] font-bold uppercase rounded-[2px]">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#DDE5DF]">
                        <span className="text-2xl font-extrabold text-[#18251E]">
                          {pkg.priceLkr === 0 ? 'FREE' : formatPrice(pkg.priceLkr)}
                        </span>
                        <span className="text-xs text-[#5F6B63] ml-1">/ {pkg.duration}</span>
                      </div>

                      <ul className="mt-5 pt-3 border-t border-[#DDE5DF] space-y-2 text-xs text-[#18251E]">
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
                        {isCurrent ? 'Active Plan' : `Activate ${pkg.name} →`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BUYER INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#DDE5DF] p-6 rounded-[2px]">
              <h2 className="text-lg font-bold text-[#103D2C]">Direct Buyer & Expat Inquiries</h2>
              <p className="text-xs text-[#5F6B63] mt-0.5">
                Prospective buyers who contacted you regarding your listed properties.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: 'inq-1',
                  buyerName: 'Kavinda Alwis (London Diaspora)',
                  phone: '+44 7911 123456',
                  email: 'kavinda.alwis@gmail.com',
                  message: 'I am interested in inspecting the property while visiting Colombo this month. Are the freehold deeds certified?',
                  date: '2 hours ago',
                },
                {
                  id: 'inq-2',
                  buyerName: 'Dhammika Ranatunga',
                  phone: '+94 77 987 6543',
                  email: 'dhammika.r@sltnet.lk',
                  message: 'Can you confirm if the valuation is negotiable for an upfront payment?',
                  date: 'Yesterday',
                },
                {
                  id: 'inq-3',
                  buyerName: 'Australian Diaspora Fund (Melbourne)',
                  phone: '+61 412 345 678',
                  email: 'invest@melbournediaspora.com.au',
                  message: 'Looking to purchase prime residential property in Colombo. Please share detailed floorplan and title survey.',
                  date: '3 days ago',
                },
              ].map((inq) => (
                <div key={inq.id} className="bg-white border border-[#DDE5DF] rounded-[2px] p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#103D2C]">{inq.buyerName}</span>
                    <span className="text-[#5F6B63]">{inq.date}</span>
                  </div>
                  <p className="text-xs text-[#18251E] bg-[#FAFBF9] p-3 rounded-[2px] leading-relaxed">
                    "{inq.message}"
                  </p>
                  <div className="flex flex-wrap items-center justify-between text-xs pt-1">
                    <span className="text-[#5F6B63]">{inq.phone} · {inq.email}</span>
                    <a
                      href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#176B45] text-white font-bold rounded-[2px] text-[11px]"
                    >
                      Reply on WhatsApp →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROPERTY MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-[#DDE5DF] rounded-[2px] max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <h3 className="text-lg font-bold text-[#103D2C]">
                Edit Property: {editingProperty.title}
              </h3>
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
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] font-medium"
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
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Status</label>
                  <select
                    value={editingProperty.status}
                    onChange={(e) => setEditingProperty({ ...editingProperty, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] font-medium"
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
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] font-medium resize-y"
                />
              </div>

              {/* Photos Management (Up to 20 Photos) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-[#18251E]">
                    Photographs ({editingProperty.images.length} / 20 Photos)
                  </label>
                  <label className="text-xs font-bold text-[#176B45] hover:underline cursor-pointer">
                    {isCompressingOwnerPhotos ? 'Compressing...' : '+ Upload from Device'}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={isCompressingOwnerPhotos || editingProperty.images.length >= 20}
                      className="sr-only"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const available = 20 - editingProperty.images.length;
                        if (available <= 0) return;
                        setIsCompressingOwnerPhotos(true);
                        try {
                          const summary = await compressImagesBatch(Array.from(files).slice(0, available), 1920, 0.82);
                          const rawUrls = summary.results.map((r) => r.dataUrl);
                          const hostedUrls = await uploadBatchPropertyPhotosToHostinger(rawUrls);
                          setEditingProperty({
                            ...editingProperty,
                            images: [...editingProperty.images, ...hostedUrls],
                          });
                          setOwnerCompressionStats(`✓ ${summary.results.length} photos uploaded to Hostinger SSD (${summary.overallPercentSaved}% space saved)`);
                        } catch (err: any) {
                          alert(`Compression failed: ${err.message}`);
                        } finally {
                          setIsCompressingOwnerPhotos(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {ownerCompressionStats && (
                  <div className="bg-[#E8F3EC] text-[#103D2C] p-2 rounded-[2px] text-xs font-semibold mb-2">
                    {ownerCompressionStats}
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
                    Add Photo
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
                  Save Changes →
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
                  PROMOTIONAL SHOWCASE UPGRADE
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
              Elevate your property to priority placement on LankaProperty.lk. Boosted properties receive 3x more buyer inquiries and higher conversion rates.
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
                      'High Demand: Owner Boosted'
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
                Activate Boost Placement →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
