import React, { useState, useMemo } from 'react';
import {
  advertisingPackageService,
  AdvertisedPackage,
  AdvertisingAddOn,
} from '../../services/advertisingPackageService';
import { formatPriceLkr } from '../../utils/formatters';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Tag,
  DollarSign,
  Radio,
} from 'lucide-react';

export function AdminPackageEditor() {
  const [mainTab, setMainTab] = useState<'packages' | 'addons'>('packages');

  // Core Packages State
  const [packages, setPackages] = useState<AdvertisedPackage[]>(() =>
    advertisingPackageService.getAllPackages()
  );
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'direct' | 'strategic'>('all');
  const [editingPackage, setEditingPackage] = useState<AdvertisedPackage | null>(null);

  // Add-Ons State
  const [addons, setAddons] = useState<AdvertisingAddOn[]>(() =>
    advertisingPackageService.getAllAddOns()
  );
  const [selectedAddonCategory, setSelectedAddonCategory] = useState<'all' | 'visibility' | 'media' | 'syndication' | 'verification'>('all');
  const [editingAddon, setEditingAddon] = useState<AdvertisingAddOn | null>(null);
  const [isCreatingAddon, setIsCreatingAddon] = useState<boolean>(false);

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Form states for editing Package
  const [formName, setFormName] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDuration, setFormDuration] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formMaxPhotos, setFormMaxPhotos] = useState<number>(10);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formPopular, setFormPopular] = useState<boolean>(false);

  // Form states for Add-On
  const [addonName, setAddonName] = useState('');
  const [addonCategory, setAddonCategory] = useState<'visibility' | 'media' | 'syndication' | 'verification'>('visibility');
  const [addonPrice, setAddonPrice] = useState<number>(5000);
  const [addonBillingType, setAddonBillingType] = useState<'one-time' | 'monthly' | 'per-blast'>('monthly');
  const [addonDesc, setAddonDesc] = useState('');
  const [addonBadge, setAddonBadge] = useState('');
  const [addonActive, setAddonActive] = useState<boolean>(true);
  const [addonPopular, setAddonPopular] = useState<boolean>(false);

  const filteredPackages = useMemo(() => {
    if (selectedCategory === 'all') return packages;
    return packages.filter((p) => p.category === selectedCategory);
  }, [packages, selectedCategory]);

  const filteredAddons = useMemo(() => {
    if (selectedAddonCategory === 'all') return addons;
    return addons.filter((a) => a.category === selectedAddonCategory);
  }, [addons, selectedAddonCategory]);

  const handleOpenEditPackage = (pkg: AdvertisedPackage) => {
    setEditingPackage(pkg);
    setFormName(pkg.name);
    setFormBadge(pkg.badge || '');
    setFormPrice(pkg.priceLkr);
    setFormDuration(pkg.duration);
    setFormDesc(pkg.description);
    setFormMaxPhotos(pkg.maxPhotos);
    setFormFeatures([...pkg.features]);
    setFormActive(pkg.active);
    setFormPopular(!!pkg.popular);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFormFeatures([...formFeatures, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== idx));
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    advertisingPackageService.updatePackage(editingPackage.id, {
      name: formName.trim(),
      badge: formBadge.trim() || undefined,
      priceLkr: Number(formPrice),
      duration: formDuration.trim(),
      description: formDesc.trim(),
      maxPhotos: Number(formMaxPhotos),
      features: formFeatures,
      active: formActive,
      popular: formPopular,
    });

    const updated = advertisingPackageService.getAllPackages();
    setPackages(updated);
    setSaveSuccessMessage(`Successfully updated package: "${formName}"`);
    setTimeout(() => {
      setEditingPackage(null);
      setSaveSuccessMessage(null);
    }, 1800);
  };

  const handleTogglePackageActive = (pkg: AdvertisedPackage) => {
    advertisingPackageService.updatePackage(pkg.id, { active: !pkg.active });
    setPackages(advertisingPackageService.getAllPackages());
  };

  const handleResetPackageDefaults = () => {
    if (confirm('Reset all advertising packages back to system defaults? Any custom prices or features will be restored.')) {
      const reset = advertisingPackageService.resetToDefaults();
      setPackages(reset);
      setSaveSuccessMessage('All packages reset to default specifications.');
      setTimeout(() => setSaveSuccessMessage(null), 2500);
    }
  };

  // Add-On Actions
  const handleOpenEditAddon = (addon: AdvertisingAddOn) => {
    setEditingAddon(addon);
    setIsCreatingAddon(false);
    setAddonName(addon.name);
    setAddonCategory(addon.category);
    setAddonPrice(addon.priceLkr);
    setAddonBillingType(addon.billingType);
    setAddonDesc(addon.description);
    setAddonBadge(addon.badge || '');
    setAddonActive(addon.active);
    setAddonPopular(!!addon.popular);
  };

  const handleOpenCreateAddon = () => {
    setEditingAddon(null);
    setIsCreatingAddon(true);
    setAddonName('');
    setAddonCategory('visibility');
    setAddonPrice(5000);
    setAddonBillingType('monthly');
    setAddonDesc('');
    setAddonBadge('');
    setAddonActive(true);
    setAddonPopular(false);
  };

  const handleSaveAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingAddon) {
      advertisingPackageService.createAddOn({
        name: addonName.trim(),
        category: addonCategory,
        priceLkr: Number(addonPrice),
        billingType: addonBillingType,
        description: addonDesc.trim(),
        badge: addonBadge.trim() || undefined,
        active: addonActive,
        popular: addonPopular,
      });
      setSaveSuccessMessage(`Created new Add-On: "${addonName}"`);
    } else if (editingAddon) {
      advertisingPackageService.updateAddOn(editingAddon.id, {
        name: addonName.trim(),
        category: addonCategory,
        priceLkr: Number(addonPrice),
        billingType: addonBillingType,
        description: addonDesc.trim(),
        badge: addonBadge.trim() || undefined,
        active: addonActive,
        popular: addonPopular,
      });
      setSaveSuccessMessage(`Updated Add-On: "${addonName}"`);
    }

    setAddons(advertisingPackageService.getAllAddOns());
    setTimeout(() => {
      setEditingAddon(null);
      setIsCreatingAddon(false);
      setSaveSuccessMessage(null);
    }, 1800);
  };

  const handleToggleAddonActive = (addon: AdvertisingAddOn) => {
    advertisingPackageService.updateAddOn(addon.id, { active: !addon.active });
    setAddons(advertisingPackageService.getAllAddOns());
  };

  const handleDeleteAddon = (id: string) => {
    if (confirm('Permanently remove this advertising add-on?')) {
      advertisingPackageService.deleteAddOn(id);
      setAddons(advertisingPackageService.getAllAddOns());
    }
  };

  const handleResetAddons = () => {
    if (confirm('Reset all advertising add-ons back to system defaults?')) {
      const reset = advertisingPackageService.resetAddOnsToDefaults();
      setAddons(reset);
      setSaveSuccessMessage('All add-ons reset to defaults.');
      setTimeout(() => setSaveSuccessMessage(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
            Monetization & Commercial Strategy
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
            Advertised Packages & Add-Ons Manager
          </h1>
          <p className="text-sm text-[#5F6B63] mt-1">
            Configure listing plans, media enhancements, high-impact add-ons, and prices across LankaProperty.lk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mainTab === 'packages' ? (
            <button
              onClick={handleResetPackageDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#5F6B63] hover:text-[#C93636] border border-[#DDE5DF] rounded-[3px] bg-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Packages</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetAddons}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#5F6B63] hover:text-[#C93636] border border-[#DDE5DF] rounded-[3px] bg-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Add-Ons</span>
              </button>
              <button
                onClick={handleOpenCreateAddon}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#103D2C] hover:bg-[#176B45] rounded-[3px] shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Add-On</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3 bg-[#E8F3EC] border border-[#176B45]/40 text-[#103D2C] text-xs font-bold rounded-[3px] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#176B45]" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Switcher: Core Packages vs Add-Ons Manager */}
      <div className="flex items-center gap-3 border-b-2 border-[#103D2C]/20 pb-2">
        <button
          onClick={() => setMainTab('packages')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-all cursor-pointer ${
            mainTab === 'packages'
              ? 'bg-[#103D2C] text-white shadow-xs'
              : 'bg-white text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
          }`}
        >
          Core Listing Packages ({packages.length})
        </button>
        <button
          onClick={() => setMainTab('addons')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-all cursor-pointer ${
            mainTab === 'addons'
              ? 'bg-[#103D2C] text-white shadow-xs'
              : 'bg-white text-[#5F6B63] hover:text-[#103D2C] border border-[#DDE5DF]'
          }`}
        >
          Advertising Add-Ons ({addons.length})
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: CORE LISTING PACKAGES
          ========================================================================= */}
      {mainTab === 'packages' && (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 border-b border-[#DDE5DF] text-xs font-bold pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              All Packages ({packages.length})
            </button>
            <button
              onClick={() => setSelectedCategory('direct')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedCategory === 'direct'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Direct Publishing Plans ({packages.filter((p) => p.category === 'direct').length})
            </button>
            <button
              onClick={() => setSelectedCategory('strategic')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedCategory === 'strategic'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Strategic Listing Packages ({packages.filter((p) => p.category === 'strategic').length})
            </button>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => {
              const isFree = pkg.priceLkr === 0;

              return (
                <div
                  key={pkg.id}
                  className={`bg-white border rounded-[3px] p-5 flex flex-col justify-between transition-all duration-200 relative ${
                    pkg.active ? 'border-[#DDE5DF] shadow-xs' : 'border-gray-200 opacity-60 bg-gray-50'
                  }`}
                >
                  {pkg.badge && (
                    <span
                      className="absolute -top-2.5 right-4 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white rounded-[2px]"
                      style={{ backgroundColor: pkg.badgeColor || '#103D2C' }}
                    >
                      {pkg.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5F6B63]">
                        {pkg.category.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleTogglePackageActive(pkg)}
                        className={`text-[11px] font-bold flex items-center gap-1 ${
                          pkg.active ? 'text-[#176B45]' : 'text-gray-400'
                        }`}
                        title={pkg.active ? 'Active on public site' : 'Hidden from public site'}
                      >
                        {pkg.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{pkg.active ? 'Live' : 'Hidden'}</span>
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-[#103D2C] tracking-tight mt-1">
                      {pkg.name}
                    </h3>

                    <div className="mt-3 pt-3 border-t border-[#DDE5DF]">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-extrabold ${isFree ? 'text-[#C93636]' : 'text-[#103D2C]'}`}>
                          {isFree ? 'FREE' : formatPriceLkr(pkg.priceLkr)}
                        </span>
                        <span className="text-xs text-[#5F6B63]">/ {pkg.duration}</span>
                      </div>
                      <p className="text-xs text-[#5F6B63] mt-1.5 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Features list preview */}
                    <div className="mt-4 pt-3 border-t border-[#DDE5DF] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-[#5F6B63] block">
                        Included Features ({pkg.features.length})
                      </span>
                      <ul className="space-y-1 text-xs text-[#18251E]">
                        {pkg.features.slice(0, 4).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#176B45] font-bold">✓</span>
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                        {pkg.features.length > 4 && (
                          <li className="text-[10px] text-[#5F6B63] pl-4 font-semibold">
                            +{pkg.features.length - 4} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#DDE5DF] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#5F6B63] font-medium">
                      Up to <strong>{pkg.maxPhotos}</strong> photos
                    </span>
                    <button
                      onClick={() => handleOpenEditPackage(pkg)}
                      className="px-3 py-1.5 bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C] text-[#103D2C] text-xs font-bold rounded-[2px] flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Package</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ADVERTISING ADD-ONS MANAGER
          ========================================================================= */}
      {mainTab === 'addons' && (
        <div className="space-y-6">
          {/* Addons Category Filter */}
          <div className="flex items-center gap-2 border-b border-[#DDE5DF] text-xs font-bold pb-1">
            <button
              onClick={() => setSelectedAddonCategory('all')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedAddonCategory === 'all'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              All Add-Ons ({addons.length})
            </button>
            <button
              onClick={() => setSelectedAddonCategory('visibility')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedAddonCategory === 'visibility'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Visibility & Banners ({addons.filter((a) => a.category === 'visibility').length})
            </button>
            <button
              onClick={() => setSelectedAddonCategory('media')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedAddonCategory === 'media'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Cinematic Media & 4K ({addons.filter((a) => a.category === 'media').length})
            </button>
            <button
              onClick={() => setSelectedAddonCategory('syndication')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedAddonCategory === 'syndication'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Diaspora & Syndication ({addons.filter((a) => a.category === 'syndication').length})
            </button>
            <button
              onClick={() => setSelectedAddonCategory('verification')}
              className={`py-2 px-4 border-b-2 transition-colors cursor-pointer ${
                selectedAddonCategory === 'verification'
                  ? 'border-[#103D2C] text-[#103D2C]'
                  : 'border-transparent text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Deed Verification & Legal ({addons.filter((a) => a.category === 'verification').length})
            </button>
          </div>

          {/* Add-Ons Table & Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAddons.map((addon) => (
              <div
                key={addon.id}
                className={`bg-white border rounded-[3px] p-5 flex flex-col justify-between transition-all duration-200 relative ${
                  addon.active ? 'border-[#DDE5DF] shadow-xs' : 'border-gray-200 opacity-60 bg-gray-50'
                }`}
              >
                {addon.badge && (
                  <span
                    className="absolute -top-2.5 right-4 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white rounded-[2px]"
                    style={{ backgroundColor: addon.badgeColor || '#176B45' }}
                  >
                    {addon.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#176B45]">
                      {addon.category.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleToggleAddonActive(addon)}
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        addon.active ? 'text-[#176B45]' : 'text-gray-400'
                      }`}
                    >
                      {addon.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{addon.active ? 'Active' : 'Disabled'}</span>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#103D2C] tracking-tight mt-1">
                    {addon.name}
                  </h3>

                  <div className="mt-3 pt-3 border-t border-[#DDE5DF]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-[#18251E]">
                        {formatPriceLkr(addon.priceLkr)}
                      </span>
                      <span className="text-xs text-[#5F6B63]">
                        / {addon.billingType.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6B63] mt-2 leading-relaxed">
                      {addon.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#DDE5DF] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDeleteAddon(addon.id)}
                    className="text-[#C93636] hover:text-red-700 font-bold text-xs p-1"
                    title="Delete add-on"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditAddon(addon)}
                    className="px-3 py-1.5 bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C] text-[#103D2C] text-xs font-bold rounded-[2px] flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Price & Copy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: EDIT PACKAGE
          ========================================================================= */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                  Package Configuration
                </span>
                <h3 className="text-lg font-extrabold text-[#103D2C]">
                  Edit {editingPackage.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPackage(null)}
                className="text-gray-400 hover:text-[#18251E] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BEST VALUE, MOST POPULAR"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Price (LKR)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Duration Text</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 60 Days Exposure"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Max Photos</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formMaxPhotos}
                    onChange={(e) => setFormMaxPhotos(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18251E] mb-1">Description / Subtitle</label>
                <textarea
                  rows={2}
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                />
              </div>

              {/* Status Toggles */}
              <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#18251E]">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded-[2px]"
                  />
                  <span>Active & Visible on Public Site</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#18251E]">
                  <input
                    type="checkbox"
                    checked={formPopular}
                    onChange={(e) => setFormPopular(e.target.checked)}
                    className="rounded-[2px]"
                  />
                  <span>Mark as Highlighted</span>
                </label>
              </div>

              {/* Feature Bullets Editor */}
              <div className="space-y-2 pt-2 border-t border-[#DDE5DF]">
                <label className="block text-[11px] font-bold text-[#18251E]">
                  Edit Feature Bullet Points
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a new feature bullet in clear simple English..."
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-2 bg-[#176B45] text-white font-bold rounded-[2px] hover:bg-[#103D2C]"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
                  {formFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]"
                    >
                      <span className="text-xs text-[#18251E]">{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-[#C93636] hover:text-red-700 font-bold px-2 py-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#DDE5DF]">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="px-4 py-2 border border-[#DDE5DF] text-xs font-bold text-[#5F6B63] rounded-[2px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[2px] transition-colors"
                >
                  Save Package Changes →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT OR CREATE ADD-ON
          ========================================================================= */}
      {(editingAddon || isCreatingAddon) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDE5DF] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                  Advertising Add-On Configuration
                </span>
                <h3 className="text-lg font-extrabold text-[#103D2C]">
                  {isCreatingAddon ? 'Create New Add-On' : `Edit ${editingAddon?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAddon(null);
                  setIsCreatingAddon(false);
                }}
                className="text-gray-400 hover:text-[#18251E] font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#18251E] mb-1">Add-On Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4K Aerial Drone & Walkthrough Video"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Category</label>
                  <select
                    value={addonCategory}
                    onChange={(e) => setAddonCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C] bg-white font-medium"
                  >
                    <option value="visibility">Visibility & Banners</option>
                    <option value="media">Cinematic Media & 4K</option>
                    <option value="syndication">Diaspora & Syndication</option>
                    <option value="verification">Deed Verification & Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Billing Duration</label>
                  <select
                    value={addonBillingType}
                    onChange={(e) => setAddonBillingType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C] bg-white font-medium"
                  >
                    <option value="monthly">Monthly / 30 Days</option>
                    <option value="one-time">One-Time Placement</option>
                    <option value="per-blast">Per Direct Blast</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Price (LKR) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={addonPrice}
                    onChange={(e) => setAddonPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#18251E] mb-1">Badge Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. HIGH TRAFFIC, 50K REACH"
                    value={addonBadge}
                    onChange={(e) => setAddonBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18251E] mb-1">Commercial Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail the reach, placement dimensions, or buyer guarantees included in this add-on..."
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[2px] focus:outline-none focus:border-[#103D2C]"
                />
              </div>

              <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#18251E]">
                  <input
                    type="checkbox"
                    checked={addonActive}
                    onChange={(e) => setAddonActive(e.target.checked)}
                    className="rounded-[2px]"
                  />
                  <span>Active & Available for Add-On Selection</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#18251E]">
                  <input
                    type="checkbox"
                    checked={addonPopular}
                    onChange={(e) => setAddonPopular(e.target.checked)}
                    className="rounded-[2px]"
                  />
                  <span>Mark as Recommended</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#DDE5DF]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddon(null);
                    setIsCreatingAddon(false);
                  }}
                  className="px-4 py-2 border border-[#DDE5DF] text-xs font-bold text-[#5F6B63] rounded-[2px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[2px] transition-colors"
                >
                  {isCreatingAddon ? 'Create Add-On →' : 'Save Add-On →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
