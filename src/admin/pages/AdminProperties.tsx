import React, { useState, useMemo } from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { AdminPropertyRecord, PublicationStatus } from '../types/admin';
import { formatPriceLkr } from '../../utils/formatters';
import {
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  RotateCcw,
  EyeOff,
  Eye,
  X,
  Copy,
  ExternalLink,
  Edit,
  Trash2,
  Sparkles,
  AlertCircle,
  ChevronDown,
  Layers,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  LayoutGrid,
  List,
  ZoomIn,
} from 'lucide-react';

export function AdminProperties() {
  const { navigate, searchParams } = useRouter();
  const { hasPermission } = useAdminAuth();
  const {
    properties,
    updatePropertyStatus,
    bulkUpdateProperties,
    toggleCollectionPlacement,
    deleteProperty,
    saveProperty,
  } = useAdminData();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string>('all');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  // Reject Dialog
  const [rejectDialogPropertyId, setRejectDialogPropertyId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Details Modal
  const [selectedDetailsProperty, setSelectedDetailsProperty] = useState<AdminPropertyRecord | null>(null);

  // Permanent Delete Dialog & Toast State
  const [propertyToDelete, setPropertyToDelete] = useState<AdminPropertyRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // View Mode & Image Lightbox (Cards with Big Images vs Table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          p.title.toLowerCase().includes(query) ||
          p.location.city.toLowerCase().includes(query) ||
          p.location.district.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && p.publicationStatus !== statusFilter) return false;
      if (typeFilter !== 'all') {
        if (typeFilter === 'business') {
          if (p.type !== 'business' && p.type !== 'commercial') return false;
        } else if (p.type !== typeFilter) {
          return false;
        }
      }
      if (purposeFilter !== 'all' && p.purpose !== purposeFilter) return false;
      if (collectionFilter !== 'all') {
        if (!p.collections.includes(collectionFilter as any)) return false;
      }
      return true;
    });
  }, [properties, searchQuery, statusFilter, typeFilter, purposeFilter, collectionFilter]);

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProperties.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkArchive = () => {
    if (!confirm(`Are you sure you want to archive ${selectedIds.length} properties?`)) return;
    bulkUpdateProperties(selectedIds, { publicationStatus: 'archived' });
    setSelectedIds([]);
  };

  const handleBulkApprove = () => {
    bulkUpdateProperties(selectedIds, { publicationStatus: 'published' });
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} properties from the database? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const res = await deleteProperty(id);
        if (res.success) count++;
      }
      setSelectedIds([]);
      setToastMessage({
        text: `Successfully deleted ${count} properties from database and inventory.`,
        type: 'success',
      });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!propertyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteProperty(propertyToDelete.id);
      if (res.success) {
        setToastMessage({
          text: res.supabaseDeleted
            ? `Property "${propertyToDelete.title}" permanently deleted from database and marketplace.`
            : `Property removed locally. (Supabase notice: Run RLS DELETE policy in SQL Editor)`,
          type: res.supabaseDeleted ? 'success' : 'warning',
        });
        if (selectedDetailsProperty?.id === propertyToDelete.id) {
          setSelectedDetailsProperty(null);
        }
      } else {
        alert(res.message || 'Failed to delete property.');
      }
    } catch (err: any) {
      alert(`Delete error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setPropertyToDelete(null);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  const handleDuplicate = (property: AdminPropertyRecord) => {
    const duplicated: AdminPropertyRecord = {
      ...property,
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `prop-${Date.now()}`,
      title: `${property.title} (Draft Copy)`,
      slug: `${property.slug}-copy-${Date.now().toString().slice(-4)}`,
      publicationStatus: 'draft',
      recordVersion: 1,
      viewCount: 0,
      inquiryCount: 0,
      saveCount: 0,
    };
    saveProperty(duplicated);
    navigate(`/admin/properties/${duplicated.id}/edit`);
  };

  const handleConfirmReject = () => {
    if (!rejectDialogPropertyId) return;
    updatePropertyStatus(rejectDialogPropertyId, 'rejected', rejectionReason || 'Missing verified title deed documentation.');
    setRejectDialogPropertyId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#176B45]">
            Inventory Management
          </span>
          <h1 className="text-2xl font-extrabold text-[#18251E]">Property Directory</h1>
          <p className="text-xs text-[#5F6B63] mt-0.5">
            Manage public marketplace visibility, review broker deeds, and assign collection placements.
          </p>
        </div>

        {hasPermission('canCreateListings') && (
          <button
            onClick={() => navigate('/admin/properties/new')}
            className="px-4 py-2 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Listing</span>
          </button>
        )}
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: `All Listings (${properties.length})` },
          {
            key: 'featured',
            label: `Featured Showcase (${properties.filter((p) => p.isFeatured || p.collections?.includes('featured')).length})`,
          },
          {
            key: 'trending',
            label: `Trending Velocity (${properties.filter((p) => p.isTrending || p.collections?.includes('trending')).length})`,
          },
          {
            key: 'published',
            label: `Published (${properties.filter((p) => p.publicationStatus === 'published').length})`,
          },
          {
            key: 'pending_review',
            label: `Pending Review (${properties.filter((p) => p.publicationStatus === 'pending_review').length})`,
          },
        ].map((chip) => {
          const isActive =
            (chip.key === 'all' && statusFilter === 'all' && collectionFilter === 'all') ||
            (chip.key === 'featured' && collectionFilter === 'featured') ||
            (chip.key === 'trending' && collectionFilter === 'trending') ||
            (chip.key === 'published' && statusFilter === 'published' && collectionFilter === 'all') ||
            (chip.key === 'pending_review' && statusFilter === 'pending_review' && collectionFilter === 'all');

          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                if (chip.key === 'all') {
                  setStatusFilter('all');
                  setCollectionFilter('all');
                } else if (chip.key === 'featured') {
                  setCollectionFilter('featured');
                  setStatusFilter('all');
                } else if (chip.key === 'trending') {
                  setCollectionFilter('trending');
                  setStatusFilter('all');
                } else {
                  setStatusFilter(chip.key);
                  setCollectionFilter('all');
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-[2px] border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#103D2C] text-white border-[#103D2C] shadow-2xs'
                  : 'bg-white text-[#5F6B63] border-[#DDE5DF] hover:text-[#18251E] hover:border-stone-400'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5F6B63] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, city, district, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs font-medium text-[#18251E] focus:outline-none focus:border-[#176B45]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DDE5DF] rounded-[3px] text-xs font-semibold text-[#18251E] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="pending_review">Pending Review</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DDE5DF] rounded-[3px] text-xs font-semibold text-[#18251E] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Categories</option>
              <option value="land">Land</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="hotel">Hotel</option>
              <option value="business">Business</option>
            </select>

            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#DDE5DF] rounded-[3px] text-xs font-semibold text-[#18251E] focus:outline-none focus:border-[#176B45]"
            >
              <option value="all">All Collections</option>
              <option value="featured">Featured Showcase</option>
              <option value="trending">Trending Properties</option>
              <option value="architectural">Architectural Showcase</option>
              <option value="land">Curated Land</option>
              <option value="signature">Signature Residence</option>
            </select>
          </div>
        </div>

        {/* View Mode & Count Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#DDE5DF]/60 text-xs text-[#5F6B63]">
          <div>
            Showing <strong className="text-[#103D2C]">{filteredProperties.length}</strong> authoritative property records
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A8880]">View Mode:</span>
            <div className="flex border border-[#DDE5DF] rounded-[3px] overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 flex items-center gap-1.5 font-bold transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-[#103D2C] text-white'
                    : 'text-[#5F6B63] hover:text-[#18251E]'
                }`}
                title="Large Showcase Cards with Big Architectural Photos"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Large Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 flex items-center gap-1.5 font-bold transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#103D2C] text-white'
                    : 'text-[#5F6B63] hover:text-[#18251E]'
                }`}
                title="Detailed Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="bg-[#E8F3EC] border border-[#176B45]/30 rounded-[3px] px-3.5 py-2 flex items-center justify-between text-xs animate-in fade-in">
            <span className="font-bold text-[#103D2C]">
              {selectedIds.length} propert{selectedIds.length > 1 ? 'ies' : 'y'} selected
            </span>
            <div className="flex items-center gap-2">
              {hasPermission('canPublishListings') && (
                <button
                  onClick={handleBulkApprove}
                  className="px-2.5 py-1 bg-[#176B45] text-white font-bold rounded-[2px] hover:bg-[#115236]"
                >
                  Publish Selected
                </button>
              )}
              {hasPermission('canArchiveListings') && (
                <button
                  onClick={handleBulkArchive}
                  className="px-2.5 py-1 bg-white text-[#5F6B63] border border-[#DDE5DF] font-bold rounded-[2px] hover:bg-stone-50"
                >
                  Archive Selected
                </button>
              )}
              {hasPermission('canDeleteListings') && (
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-[#C93636] text-white font-bold rounded-[2px] hover:bg-[#A92828] flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Selected</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Properties Display: Large Cards View vs Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#103D2C]/60 hover:shadow-md transition-all group"
              >
                <div>
                  {/* Big Image Container (h-56) */}
                  <div
                    className="relative h-56 bg-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedDetailsProperty(p)}
                  >
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80'}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Top Overlays */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-[2px] shadow-xs ${
                          p.publicationStatus === 'published'
                            ? 'bg-[#176B45] text-white'
                            : p.publicationStatus === 'pending_review'
                            ? 'bg-[#C93636] text-white'
                            : 'bg-stone-800 text-white'
                        }`}
                      >
                        {p.publicationStatus.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-1 text-[10px] font-bold uppercase bg-white/95 text-[#103D2C] rounded-[2px] shadow-xs">
                        {p.purpose.toUpperCase()}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(p.images[0]);
                        }}
                        className="px-2 py-1 bg-black/70 hover:bg-black text-white text-[10px] font-bold rounded-[2px] backdrop-blur-xs flex items-center gap-1"
                        title="Enlarge photo"
                      >
                        <ZoomIn className="w-3 h-3" />
                        <span>{p.images.length} photos</span>
                      </button>
                    </div>

                    {/* Bottom Gradient with District & City */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-white flex items-end justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#9FE3B8] block">
                          {p.location.city}, {p.location.district}
                        </span>
                        <div className="text-base font-extrabold text-white">
                          {formatPriceLkr(p.priceLkr, p.priceUnit, true)}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-white/80">
                        {p.type === 'commercial' ? 'Business' : p.type}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <h3
                      onClick={() => setSelectedDetailsProperty(p)}
                      className="font-extrabold text-sm text-[#18251E] hover:text-[#176B45] cursor-pointer line-clamp-1"
                      title={p.title}
                    >
                      {p.title}
                    </h3>

                    {/* Specs Pills */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F6B63] pt-1">
                      {p.specs.bedrooms && (
                        <span className="flex items-center gap-1 font-semibold text-[#18251E]">
                          <Bed className="w-3.5 h-3.5 text-[#5F6B63]" /> {p.specs.bedrooms} Beds
                        </span>
                      )}
                      {p.specs.bathrooms && (
                        <span className="flex items-center gap-1 font-semibold text-[#18251E]">
                          <Bath className="w-3.5 h-3.5 text-[#5F6B63]" /> {p.specs.bathrooms} Baths
                        </span>
                      )}
                      {p.specs.landExtentPerches && (
                        <span className="flex items-center gap-1 font-semibold text-[#18251E]">
                          <Maximize2 className="w-3.5 h-3.5 text-[#5F6B63]" /> {p.specs.landExtentPerches} Perches
                        </span>
                      )}
                    </div>

                    {/* Seller Attribution & ID */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#DDE5DF]/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#5F6B63]">Listed by:</span>
                        <span className="font-bold text-[#18251E] truncate max-w-[130px]">
                          {p.listedByName || 'LankaProperty'}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-[1px] ${
                            p.listedByRole === 'agent'
                              ? 'bg-[#103D2C] text-white'
                              : 'bg-[#E8F3EC] text-[#176B45]'
                          }`}
                        >
                          {p.listedByRole === 'agent' ? 'Agent' : 'Owner'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7A8880] font-mono">{p.id}</span>
                    </div>

                    {/* 1-Click Homepage Curation Toggles for Super Admin */}
                    <div className="pt-2 border-t border-[#DDE5DF]/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63]">
                        Homepage:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCollectionPlacement(p.id, 'featured');
                          }}
                          className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-[2px] transition-colors cursor-pointer ${
                            p.isFeatured || p.collections?.includes('featured')
                              ? 'bg-[#103D2C] text-white border border-[#103D2C]'
                              : 'bg-white text-[#5F6B63] border border-[#DDE5DF] hover:border-[#103D2C]'
                          }`}
                          title="Toggle placement in Homepage Featured section"
                        >
                          {p.isFeatured || p.collections?.includes('featured') ? 'FEATURED' : '+ FEATURE'}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCollectionPlacement(p.id, 'trending');
                          }}
                          className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-[2px] transition-colors cursor-pointer ${
                            p.isTrending || p.collections?.includes('trending')
                              ? 'bg-[#C93636] text-white border border-[#C93636]'
                              : 'bg-white text-[#5F6B63] border border-[#DDE5DF] hover:border-[#C93636]'
                          }`}
                          title="Toggle placement in Homepage Trending section"
                        >
                          {p.isTrending || p.collections?.includes('trending') ? 'TRENDING' : '+ TRENDING'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-[#FAFBF9] border-t border-[#DDE5DF] flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    {p.publicationStatus === 'pending_review' && hasPermission('canPublishListings') && (
                      <button
                        onClick={() => updatePropertyStatus(p.id, 'published')}
                        className="px-2.5 py-1 bg-[#176B45] hover:bg-[#115236] text-white font-bold rounded-[2px] flex items-center gap-1 text-[11px]"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Approve</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedDetailsProperty(p)}
                      className="px-2 py-1 border border-[#DDE5DF] text-[#5F6B63] hover:text-[#18251E] rounded-[2px] text-[11px] font-semibold"
                    >
                      Details
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasPermission('canEditListings') && (
                      <button
                        onClick={() => navigate(`/admin/properties/${p.id}/edit`)}
                        className="px-2.5 py-1 bg-[#103D2C] hover:bg-[#176B45] text-white font-bold rounded-[2px] flex items-center gap-1 text-[11px]"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    <a
                      href={`/properties/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-[#5F6B63] hover:text-[#176B45] rounded-[2px]"
                      title="View public live listing"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {hasPermission('canDeleteListings') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPropertyToDelete(p);
                        }}
                        className="px-2 py-1 bg-white hover:bg-red-50 text-[#C93636] border border-[#DDE5DF] hover:border-[#C93636] rounded-[2px] flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Permanently delete property from database"
                      >
                        <Trash2 className="w-3 h-3 text-[#C93636]" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-xs text-[#5F6B63] bg-white border border-[#DDE5DF] rounded-[4px]">
              No properties found matching your filter criteria.
            </div>
          )}
        </div>
      ) : (
        /* Properties Table */
        <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F8F5] border-b border-[#DDE5DF] text-[#5F6B63] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredProperties.length && filteredProperties.length > 0}
                    onChange={handleSelectAll}
                    className="rounded-[2px]"
                  />
                </th>
                <th className="py-3 px-3">Listing</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Type & Purpose</th>
                <th className="py-3 px-3">Valuation</th>
                <th className="py-3 px-3">Listed By</th>
                <th className="py-3 px-3">Publication Status</th>
                <th className="py-3 px-3">Collections</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF]">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F8F5]/60 transition-colors">
                    {/* Checkbox */}
                    <td className="py-3.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                        className="rounded-[2px]"
                      />
                    </td>

                    {/* Listing Thumbnail (Enlarged) & Title */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative group shrink-0">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80'}
                            alt={p.title}
                            onClick={() => setPreviewImage(p.images[0])}
                            className="w-32 h-20 object-cover rounded-[3px] bg-[#F5F8F5] border border-[#DDE5DF] cursor-pointer group-hover:opacity-90 transition-opacity shadow-2xs"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[9px] font-bold bg-black/75 text-white rounded-[2px]">
                            {p.images.length} photos
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(p.images[0]);
                            }}
                            className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white text-[#18251E] rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Inspect image full size"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="min-w-0 max-w-[240px]">
                          <button
                            onClick={() => setSelectedDetailsProperty(p)}
                            className="font-bold text-[#18251E] hover:text-[#176B45] truncate block text-left"
                            title={`View details for ${p.title}`}
                          >
                            {p.title}
                          </button>
                          <span className="text-[10px] text-[#5F6B63] block font-medium">
                            ID: {p.id} · Ref: {p.assignedAgentName || 'Broker Desk'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-[#18251E] block">{p.location.city}</span>
                      <span className="text-[11px] text-[#5F6B63]">{p.location.district}</span>
                    </td>

                    {/* Type & Purpose */}
                    <td className="py-3.5 px-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45] block">
                        {p.purpose.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-[#5F6B63] capitalize">
                        {p.type === 'commercial' ? 'Business' : p.type}
                      </span>
                    </td>

                    {/* Valuation */}
                    <td className="py-3.5 px-3 font-extrabold text-[#103D2C] tabular-nums whitespace-nowrap">
                      {formatPriceLkr(p.priceLkr, p.priceUnit, true)}
                    </td>

                    {/* Listed By / Ownership */}
                    <td className="py-3.5 px-3">
                      {p.listedByName ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-[#18251E] block truncate max-w-[130px]" title={p.listedByName}>
                            {p.listedByName}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px] ${
                                p.listedByRole === 'agent'
                                  ? 'bg-[#103D2C] text-white'
                                  : 'bg-[#E8F3EC] text-[#176B45]'
                              }`}
                            >
                              {p.listedByRole === 'agent' ? 'Agent' : 'Owner'}
                            </span>
                            {p.selectedPackageId && (
                              <span className="text-[9px] text-[#5F6B63] capitalize">
                                {p.selectedPackageId.replace('-', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#5F6B63] italic">LankaProperty</span>
                      )}
                    </td>

                    {/* Publication Status Pill */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                          p.publicationStatus === 'published'
                            ? 'bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/30'
                            : p.publicationStatus === 'pending_review'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : p.publicationStatus === 'draft'
                            ? 'bg-gray-100 text-gray-700'
                            : p.publicationStatus === 'rejected'
                            ? 'bg-red-100 text-[#C93636] border border-red-300'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {p.publicationStatus.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Collection Tags with Direct Toggles */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-[200px]">
                        <button
                          type="button"
                          onClick={() => toggleCollectionPlacement(p.id, 'featured')}
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer ${
                            p.isFeatured || p.collections?.includes('featured')
                              ? 'bg-[#103D2C] text-white border-[#103D2C]'
                              : 'bg-white text-[#5F6B63] border-[#DDE5DF] hover:border-[#103D2C]'
                          }`}
                          title="Toggle Featured"
                        >
                          {p.isFeatured || p.collections?.includes('featured') ? 'FEATURED' : '+ FEATURE'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCollectionPlacement(p.id, 'trending')}
                          className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer ${
                            p.isTrending || p.collections?.includes('trending')
                              ? 'bg-[#C93636] text-white border-[#C93636]'
                              : 'bg-white text-[#5F6B63] border-[#DDE5DF] hover:border-[#C93636]'
                          }`}
                          title="Toggle Trending"
                        >
                          {p.isTrending || p.collections?.includes('trending') ? 'TRENDING' : '+ TRENDING'}
                        </button>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Open Details */}
                        <button
                          onClick={() => setSelectedDetailsProperty(p)}
                          className="p-1.5 text-[#5F6B63] hover:text-[#176B45] hover:bg-[#F5F8F5] rounded-[2px]"
                          title="Open listing details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        {hasPermission('canEditListings') && (
                          <button
                            onClick={() => navigate(`/admin/properties/${p.id}/edit`)}
                            className="p-1.5 text-[#5F6B63] hover:text-[#176B45] hover:bg-[#F5F8F5] rounded-[2px]"
                            title="Edit Property"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Public Preview */}
                        <a
                          href={`/properties/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-[#5F6B63] hover:text-[#176B45] hover:bg-[#F5F8F5] rounded-[2px]"
                          title="View on live website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Approve Quick Action */}
                        {p.publicationStatus === 'pending_review' && hasPermission('canPublishListings') && (
                          <button
                            onClick={() => updatePropertyStatus(p.id, 'published')}
                            className="p-1.5 text-[#176B45] hover:bg-[#E8F3EC] rounded-[2px]"
                            title="Approve & Publish to Marketplace"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Unpublish to Draft */}
                        {p.publicationStatus === 'published' && hasPermission('canPublishListings') && (
                          <button
                            onClick={() => {
                              if (confirm(`Unpublish "${p.title}" and move back to draft?`)) {
                                updatePropertyStatus(p.id, 'draft');
                              }
                            }}
                            className="p-1.5 text-[#5F6B63] hover:text-amber-700 hover:bg-amber-50 rounded-[2px]"
                            title="Unpublish to draft"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reject Quick Action */}
                        {p.publicationStatus === 'pending_review' && hasPermission('canPublishListings') && (
                          <button
                            onClick={() => setRejectDialogPropertyId(p.id)}
                            className="p-1.5 text-[#C93636] hover:bg-red-50 rounded-[2px]"
                            title="Reject with explanatory notes"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Duplicate */}
                        {hasPermission('canCreateListings') && (
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5] rounded-[2px]"
                            title="Duplicate as draft"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Archive */}
                        {p.publicationStatus !== 'archived' && hasPermission('canArchiveListings') && (
                          <button
                            onClick={() => {
                              if (confirm(`Archive "${p.title}"?`)) {
                                updatePropertyStatus(p.id, 'archived');
                              }
                            }}
                            className="p-1.5 text-[#5F6B63] hover:text-[#C93636] hover:bg-red-50 rounded-[2px]"
                            title="Archive Property"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Restore Archived */}
                        {p.publicationStatus === 'archived' && hasPermission('canArchiveListings') && (
                          <button
                            onClick={() => {
                              updatePropertyStatus(p.id, 'draft');
                            }}
                            className="p-1.5 text-[#176B45] hover:bg-[#E8F3EC] rounded-[2px]"
                            title="Restore to Draft"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Permanently Delete */}
                        {hasPermission('canDeleteListings') && (
                          <button
                            onClick={() => setPropertyToDelete(p)}
                            className="p-1.5 text-[#5F6B63] hover:text-[#C93636] hover:bg-red-50 rounded-[2px] transition-colors cursor-pointer"
                            title="Permanently delete listing from database"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#C93636]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#5F6B63]">
                    No properties found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-[#F5F8F5] border-t border-[#DDE5DF] flex items-center justify-between text-xs text-[#5F6B63]">
          <span>
            Showing <strong className="text-[#18251E]">{filteredProperties.length}</strong> of{' '}
            <strong className="text-[#18251E]">{properties.length}</strong> records
          </span>
          <span className="text-[11px] font-medium text-[#5F6B63]">LankaProperty Inventory v3.0</span>
        </div>
      </div>
      )}

      {/* Photo Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] bg-stone-900 border border-stone-800 rounded-[4px] overflow-hidden shadow-2xl flex flex-col"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-sm"
              title="Close image"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Property inspection"
              className="max-h-[80vh] w-auto object-contain mx-auto"
            />
            <div className="p-3 bg-stone-950 text-xs text-stone-400 flex items-center justify-between">
              <span>Superadmin High-Resolution Preview (WebP Optimized)</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-[#176B45] hover:bg-[#103D2C] text-white text-xs font-bold rounded-[2px]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal Dialog */}
      {rejectDialogPropertyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-[#C93636]">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-[#18251E] uppercase tracking-wider">
                Reject Listing Submission
              </h3>
            </div>
            <p className="text-xs text-[#5F6B63]">
              Provide an explanatory reason for the listing agent before marking this property as rejected.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Missing survey plan registration number or land extent mismatch."
              className="w-full p-2.5 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs font-medium focus:outline-none focus:border-[#C93636]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectDialogPropertyId(null)}
                className="px-3 py-1.5 bg-white border border-[#DDE5DF] text-xs font-semibold text-[#5F6B63] rounded-[2px]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-[#C93636] hover:bg-[#A92828] text-white text-xs font-bold uppercase rounded-[2px]"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedDetailsProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#DDE5DF] flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#176B45]">
                  Property Overview
                </span>
                <span className="text-[10px] font-semibold text-[#5F6B63]">
                  ID: {selectedDetailsProperty.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailsProperty(null)}
                className="p-1 text-[#5F6B63] hover:text-[#18251E] rounded-[2px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Media Banner */}
              {selectedDetailsProperty.images && selectedDetailsProperty.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 aspect-16/10 rounded-[3px] overflow-hidden bg-[#F5F8F5] border border-[#DDE5DF]">
                    <img
                      src={selectedDetailsProperty.images[0]}
                      alt={selectedDetailsProperty.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-rows-2 gap-2">
                    {selectedDetailsProperty.images.slice(1, 3).map((img, idx) => (
                      <div key={idx} className="rounded-[3px] overflow-hidden bg-[#F5F8F5] border border-[#DDE5DF]">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Title & Valuation */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#18251E]">
                    {selectedDetailsProperty.title}
                  </h2>
                  <p className="text-xs text-[#5F6B63] flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#176B45]" />
                    <span>
                      {selectedDetailsProperty.location.address ? `${selectedDetailsProperty.location.address}, ` : ''}
                      {selectedDetailsProperty.location.city}, {selectedDetailsProperty.location.district}
                    </span>
                  </p>
                </div>
                <div className="text-right sm:shrink-0">
                  <div className="text-xl font-extrabold text-[#103D2C]">
                    {formatPriceLkr(selectedDetailsProperty.priceLkr, selectedDetailsProperty.priceUnit, true)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                    {selectedDetailsProperty.purpose.toUpperCase()} · {(selectedDetailsProperty.type === 'commercial' ? 'BUSINESS' : selectedDetailsProperty.type).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs">
                <div>
                  <span className="text-[10px] text-[#5F6B63] block">Status</span>
                  <span className="font-bold text-[#18251E] capitalize">
                    {selectedDetailsProperty.publicationStatus.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5F6B63] block">Bedrooms / Baths</span>
                  <span className="font-bold text-[#18251E]">
                    {selectedDetailsProperty.specs?.bedrooms ?? '—'} Beds / {selectedDetailsProperty.specs?.bathrooms ?? '—'} Baths
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5F6B63] block">Land Extent</span>
                  <span className="font-bold text-[#18251E]">
                    {selectedDetailsProperty.specs?.landPerches ? `${selectedDetailsProperty.specs.landPerches} Perches` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5F6B63] block">Floor Area</span>
                  <span className="font-bold text-[#18251E]">
                    {selectedDetailsProperty.specs?.floorAreaSqFt ? `${selectedDetailsProperty.specs.floorAreaSqFt} sq ft` : '—'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {selectedDetailsProperty.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#18251E]">
                    Description
                  </span>
                  <p className="text-xs text-[#5F6B63] leading-relaxed line-clamp-4">
                    {selectedDetailsProperty.description}
                  </p>
                </div>
              )}

              {/* Agent & Collections */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t border-[#DDE5DF] text-xs">
                <div>
                  <span className="text-[10px] text-[#5F6B63] block">Assigned Broker</span>
                  <span className="font-semibold text-[#18251E]">
                    {selectedDetailsProperty.agent?.name || 'In-House Desk'} ({selectedDetailsProperty.agent?.phone || 'No phone'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5F6B63] block">Collections</span>
                  <div className="flex gap-1 mt-0.5">
                    {selectedDetailsProperty.collections && selectedDetailsProperty.collections.length > 0 ? (
                      selectedDetailsProperty.collections.map((c) => (
                        <span key={c} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-[2px] bg-[#E8F3EC] text-[#103D2C]">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-[#F5F8F5] border-t border-[#DDE5DF] flex items-center justify-between">
              <a
                href={`/properties/${selectedDetailsProperty.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#176B45] hover:underline inline-flex items-center gap-1"
              >
                <span>View Public Marketplace Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDetailsProperty(null)}
                  className="px-3 py-1.5 bg-white border border-[#DDE5DF] text-xs font-semibold text-[#5F6B63] rounded-[2px]"
                >
                  Close
                </button>
                {hasPermission('canDeleteListings') && (
                  <button
                    onClick={() => {
                      setPropertyToDelete(selectedDetailsProperty);
                    }}
                    className="px-3 py-1.5 bg-white border border-[#C93636]/40 text-[#C93636] hover:bg-red-50 text-xs font-bold uppercase rounded-[2px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                {hasPermission('canEditListings') && (
                  <button
                    onClick={() => {
                      const id = selectedDetailsProperty.id;
                      setSelectedDetailsProperty(null);
                      navigate(`/admin/properties/${id}/edit`);
                    }}
                    className="px-4 py-1.5 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase rounded-[2px] inline-flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Listing</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Safety Confirmation Dialog */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xl max-w-lg w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#C93636]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#18251E]">
                  Permanently Delete Property?
                </h3>
                <p className="text-xs text-[#5F6B63] mt-0.5">
                  This action is irreversible. The listing will be permanently purged from both the local inventory and the live Supabase cloud database.
                </p>
              </div>
            </div>

            {/* Target Property Summary Card */}
            <div className="p-3 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] flex items-center gap-3">
              <div className="w-16 h-12 rounded-[2px] overflow-hidden bg-gray-200 shrink-0 border border-[#DDE5DF]">
                <img
                  src={propertyToDelete.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-[#18251E] truncate" title={propertyToDelete.title}>
                  {propertyToDelete.title}
                </h4>
                <div className="text-[11px] font-extrabold text-[#103D2C]">
                  {formatPriceLkr(propertyToDelete.priceLkr, propertyToDelete.priceUnit, true)}
                </div>
                <div className="text-[10px] text-[#5F6B63]">
                  {propertyToDelete.location.city}, {propertyToDelete.location.district} · Ref: {propertyToDelete.listingRef || propertyToDelete.id}
                </div>
              </div>
            </div>

            {/* Warning Checklist */}
            <div className="space-y-1.5 text-xs text-[#5F6B63] bg-red-50/60 p-3 rounded-[3px] border border-red-200/60">
              <div className="flex items-center gap-2 text-[#C93636] font-bold text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>What will happen upon deletion:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#7A2E2E] pl-1">
                <li>Removed permanently from public search and homepage collections</li>
                <li>Database row deleted from Supabase PostgreSQL (<code>public.properties</code>)</li>
                <li>Uploaded listing photos deleted from Supabase Storage (<code>property-images</code>)</li>
                <li>Associated buyer inquiries cascade-deleted to prevent orphaned records</li>
                <li>Local storage cache flushed across mobile and desktop devices</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setPropertyToDelete(null);
                }}
                className="px-4 py-2 bg-white border border-[#DDE5DF] text-xs font-semibold text-[#5F6B63] hover:text-[#18251E] rounded-[2px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmPermanentDelete}
                className="px-4 py-2 bg-[#C93636] hover:bg-[#A92828] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from Cloud...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Permanent Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`p-4 rounded-[4px] shadow-lg border text-xs font-bold flex items-center gap-2.5 max-w-md ${
              toastMessage.type === 'success'
                ? 'bg-[#103D2C] text-white border-[#176B45]'
                : 'bg-amber-900 text-white border-amber-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#9FE3B8] shrink-0" />
            <span>{toastMessage.text}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-auto text-white/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
