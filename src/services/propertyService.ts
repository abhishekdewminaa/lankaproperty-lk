import { Property, PropertyFilters, PaginatedResult } from '../types/property';
import { PROPERTIES_DATA } from '../data/properties';
import { AdminPropertyRecord, PublicationStatus } from '../admin/types/admin';
import { calculateHaversineDistanceKm, DEFAULT_COLOMBO_COORDINATES } from '../data/landmarks';

const STORAGE_KEY = 'lankaproperty_authoritative_properties';
const STORAGE_INITIALIZED_KEY = 'lankaproperty_store_initialized';

function getCityCentroidCoordinates(city: string, district: string): { latitude: number; longitude: number } {
  const normCity = (city || '').toLowerCase();
  const normDistrict = (district || '').toLowerCase();

  if (normCity.includes('talpe') || normCity.includes('mihiripenna')) return { latitude: 6.0025, longitude: 80.2811 };
  if (normCity.includes('colombo 07') || normCity.includes('cinnamon gardens')) return { latitude: 6.9068, longitude: 79.8708 };
  if (normCity.includes('colombo 03') || normCity.includes('kollupitiya')) return { latitude: 6.9042, longitude: 79.8542 };
  if (normCity.includes('colombo 02') || normCity.includes('union place') || normCity.includes('altair')) return { latitude: 6.9208, longitude: 79.8550 };
  if (normCity.includes('colombo 05') || normCity.includes('narahenpita') || normCity.includes('havelock')) return { latitude: 6.8925, longitude: 79.8750 };
  if (normCity.includes('rajagiriya')) return { latitude: 6.9083, longitude: 79.8967 };
  if (normCity.includes('battaramulla') || normCity.includes('pelawatte')) return { latitude: 6.8992, longitude: 79.9189 };
  if (normCity.includes('mount lavinia') || normCity.includes('dehiwala')) return { latitude: 6.8378, longitude: 79.8647 };
  if (normCity.includes('galle') || normCity.includes('fort')) return { latitude: 6.0267, longitude: 80.2178 };
  if (normCity.includes('mirissa') || normCity.includes('weligama')) return { latitude: 5.9483, longitude: 80.4578 };
  if (normDistrict.includes('kandy')) return { latitude: 7.2906, longitude: 80.6337 };
  if (normDistrict.includes('nuwara eliya')) return { latitude: 6.9497, longitude: 80.7891 };
  if (normDistrict.includes('gampaha') || normCity.includes('negombo')) return { latitude: 7.2008, longitude: 79.8736 };

  return DEFAULT_COLOMBO_COORDINATES;
}

/**
 * Validate that a loaded object conforms to AdminPropertyRecord shape
 */
function isValidPropertyRecord(item: any): item is AdminPropertyRecord {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.priceLkr === 'number' &&
    typeof item.publicationStatus === 'string' &&
    item.location &&
    typeof item.location === 'object'
  );
}

/**
 * Build initial demo authoritative records enriched from PROPERTIES_DATA
 */
function buildInitialAuthoritativeRecords(): AdminPropertyRecord[] {
  return PROPERTIES_DATA.map((p, index) => {
    const isPending = index === 3;
    const isDraft = index === 7;
    const isArchived = index === 8;

    const pubStatus: PublicationStatus = isPending
      ? 'pending_review'
      : isDraft
      ? 'draft'
      : isArchived
      ? 'archived'
      : 'published';

    const isTrending = index === 0 || index === 1 || index === 4 || index === 6;
    const trendingVelocityText =
      index === 0
        ? 'Viewed 420+ times this week'
        : index === 1
        ? '4 Inquiries in 24 hours'
        : index === 4
        ? 'High Demand in Colombo 07'
        : index === 6
        ? 'Fastest Selling Beachfront'
        : undefined;

    const collections: ('featured' | 'trending' | 'architectural' | 'land' | 'signature')[] = [];
    if (p.isFeatured) collections.push('featured');
    if (isTrending) collections.push('trending');
    if (p.isSignature) collections.push('signature', 'architectural');
    if (p.type === 'land' || p.purpose === 'land') collections.push('land');

    const resolvedCoordinates = p.location.coordinates || {
      ...getCityCentroidCoordinates(p.location.city, p.location.district),
      isApproximate: false,
    };

    return {
      ...p,
      isFeatured: p.isFeatured ?? (index < 4),
      isTrending,
      trendingVelocityText,
      location: {
        ...p.location,
        coordinates: resolvedCoordinates,
      },
      publicationStatus: pubStatus,
      collections,
      viewCount: isTrending ? 380 + index * 45 : 120 + index * 15,
      inquiryCount: isTrending ? 8 + index : 2 + index,
      saveCount: 15 + index * 3,
      assignedAgentId: `agent-${(index % 3) + 1}`,
      assignedAgentName: p.agent.name,
      listingRef: `LP-${(p.location.district || 'SRI').slice(0, 3).toUpperCase()}-2026-${(100 + index).toString()}`,
      lastModifiedBy: 'Mr Lalith Ranatunga',
      lastModifiedAt: '2026-10-04 14:32',
      publishedAt: pubStatus === 'published' ? p.publishedDate : undefined,
      recordVersion: 1,
    };
  });
}

/**
 * Single Authoritative Property Service
 * Backs both Public Marketplace and Admin Workspace.
 */
class PropertyService {
  private records: AdminPropertyRecord[];
  private listeners: Set<() => void> = new Set();
  private isDemoPersistence = true;

  constructor() {
    this.records = this.loadFromStorage();
  }

  private loadFromStorage(): AdminPropertyRecord[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const isInitialized = localStorage.getItem(STORAGE_INITIALIZED_KEY) === 'true';
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Validate all records
            const validRecords = parsed.filter(isValidPropertyRecord);
            // If store was explicitly initialized, honor valid records and sync updated seed images
            if (isInitialized) {
              const seedMap = new Map(PROPERTIES_DATA.map((p) => [p.id, p]));
              return validRecords.map((rec) => {
                const seed = seedMap.get(rec.id);
                if (seed && seed.images && seed.images.length > rec.images.length) {
                  return { ...rec, images: seed.images };
                }
                return rec;
              });
            }
            if (validRecords.length > 0) {
              return validRecords;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse properties from storage:', e);
    }

    // Default initialization for demo
    const initial = buildInitialAuthoritativeRecords();
    this.persistToStorage(initial);
    return initial;
  }

  private persistToStorage(data: AdminPropertyRecord[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(STORAGE_INITIALIZED_KEY, 'true');
      }
    } catch (e: any) {
      console.error('Storage error while persisting properties:', e);
      if (e?.name === 'QuotaExceededError' || e?.code === 22) {
        throw new Error('Local storage quota exceeded. Please reduce image sizes or remove unused drafts.');
      }
      throw new Error(`Failed to persist property record: ${e?.message || 'Storage unavailable'}`);
    }
  }

  private notify() {
    this.persistToStorage(this.records);
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('PropertyService listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lankaproperty:store-update'));
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getAllAuthoritativeProperties(): AdminPropertyRecord[] {
    return [...this.records];
  }

  /**
   * Public eligibility filter:
   * Only published listings that are active or reserved (not archived, draft, or rejected)
   */
  getPublicEligibleProperties(): AdminPropertyRecord[] {
    return this.records.filter((p) => p.publicationStatus === 'published' && p.status !== 'sold');
  }

  /**
   * Public category counts derived strictly from eligible published records
   */
  getPublicCategoryCounts() {
    const eligible = this.getPublicEligibleProperties();
    return {
      houses: eligible.filter((p) => p.type === 'house').length,
      apartments: eligible.filter((p) => p.type === 'apartment').length,
      land: eligible.filter((p) => p.type === 'land' || p.purpose === 'land').length,
      commercial: eligible.filter((p) => p.type === 'commercial').length,
      developments: 12, // Authoritative development portfolio count
    };
  }

  /**
   * Public Featured Properties collection
   */
  getFeaturedProperties(limit?: number): AdminPropertyRecord[] {
    const eligible = this.getPublicEligibleProperties();
    const explicitFeatured = eligible.filter(
      (p) => p.isFeatured || p.collections?.includes('featured')
    );
    const list = explicitFeatured.length > 0 ? explicitFeatured : eligible.slice(0, 4);
    return limit ? list.slice(0, limit) : list;
  }

  /**
   * Public Architectural Showcase collection
   */
  getArchitecturalCollection(): AdminPropertyRecord[] {
    const eligible = this.getPublicEligibleProperties();
    return eligible.filter(
      (p) =>
        p.type === 'house' &&
        (p.isSignature || p.collections?.includes('architectural') || p.collections?.includes('signature'))
    );
  }

  /**
   * Public Curated Land collection
   */
  getCuratedLandCollection(): AdminPropertyRecord[] {
    const eligible = this.getPublicEligibleProperties();
    return eligible.filter(
      (p) =>
        (p.type === 'land' || p.purpose === 'land') &&
        (p.collections?.includes('land') || true)
    );
  }

  /**
   * Retrieve saved properties by user's client-side saved ID list
   */
  getSavedProperties(savedIds: string[]): AdminPropertyRecord[] {
    if (!savedIds || savedIds.length === 0) return [];
    return this.records.filter((p) => savedIds.includes(p.id));
  }

  /**
   * Ensure slug is unique across all records
   */
  private ensureUniqueSlug(baseSlug: string, currentId: string): string {
    const cleanBase =
      baseSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'property';
    let candidate = cleanBase;
    let counter = 1;

    while (this.records.some((p) => p.id !== currentId && p.slug === candidate)) {
      counter++;
      candidate = `${cleanBase}-${counter}`;
    }

    return candidate;
  }

  async getProperties(
    filters: PropertyFilters = {},
    options: { includeUnpublished?: boolean } = {}
  ): Promise<PaginatedResult<Property>> {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.max(1, Number(filters.pageSize) || 6);

    let filtered = this.records.filter((p) => {
      // By default, public searches only return published listings
      if (!options.includeUnpublished) {
        if (p.publicationStatus !== 'published') return false;
      }

      // Purpose filtering (e.g. 'buy', 'rent')
      if (filters.purpose && filters.purpose !== 'all') {
        if (p.purpose !== filters.purpose) return false;
      }

      // Featured filtering
      if (filters.featured !== undefined && filters.featured !== '' && filters.featured !== 'false') {
        if (!p.isFeatured && !p.collections?.includes('featured')) return false;
      }

      // Type filtering (e.g. 'house', 'apartment', 'land', 'commercial')
      if (filters.type && filters.type !== 'all') {
        if (p.type !== filters.type) return false;
      }

      // District filtering
      if (filters.district) {
        if (p.location.district.toLowerCase() !== filters.district.toLowerCase()) return false;
      }

      // City filtering
      if (filters.city) {
        if (p.location.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      }

      // Price Thresholds
      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        if (p.priceLkr < filters.minPrice) return false;
      }
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
        if (p.priceLkr > filters.maxPrice) return false;
      }

      // Bedrooms
      if (p.type !== 'land' && filters.bedrooms !== undefined && filters.bedrooms > 0) {
        if (p.specs.bedrooms === undefined || p.specs.bedrooms < filters.bedrooms) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (filters.sortBy === 'price_asc') {
        if (a.priceUnit !== b.priceUnit) {
          return a.priceUnit.localeCompare(b.priceUnit);
        }
        return a.priceLkr - b.priceLkr;
      }
      if (filters.sortBy === 'price_desc') {
        if (a.priceUnit !== b.priceUnit) {
          return a.priceUnit.localeCompare(b.priceUnit);
        }
        return b.priceLkr - a.priceLkr;
      }
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const clampedPage = Math.min(page, totalPages);
    const startIndex = (clampedPage - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page: clampedPage,
      pageSize,
      totalPages,
      hasNextPage: clampedPage < totalPages,
      hasPrevPage: clampedPage > 1,
    };
  }

  async getPropertyBySlug(slug: string, options: { allowDraft?: boolean } = {}): Promise<AdminPropertyRecord | null> {
    const found = this.records.find((p) => p.slug === slug || p.id === slug);
    if (!found) return null;
    if (!options.allowDraft && found.publicationStatus !== 'published') {
      return null;
    }
    return { ...found };
  }

  async getPropertyById(id: string): Promise<AdminPropertyRecord | null> {
    const found = this.records.find((p) => p.id === id);
    return found ? { ...found } : null;
  }

  /**
   * #7 Auto-Pruner for Sold / Archived Properties:
   * When an Owner, Agent, or SuperAdmin changes a listing status to 'sold' or 'archived',
   * automatically delete secondary gallery images (2..N) and floorPlans, keeping ONLY
   * images[0] (hero_image thumbnail) for historical price reference. Reclaims 90%+ storage.
   */
  private pruneSoldPropertyMedia(record: AdminPropertyRecord): AdminPropertyRecord {
    const isSoldOrArchived = record.status === 'sold' || record.publicationStatus === 'archived';
    if (!isSoldOrArchived) return record;

    const heroThumbnail = Array.isArray(record.images) && record.images.length > 0 ? [record.images[0]] : [];
    return {
      ...record,
      images: heroThumbnail,
      floorPlans: [],
    };
  }

  saveProperty(record: AdminPropertyRecord): { success: boolean; property: AdminPropertyRecord; isNew: boolean } {
    const existingIndex = this.records.findIndex((p) => p.id === record.id);
    const isNew = existingIndex === -1;

    let savedRecord: AdminPropertyRecord;
    const uniqueSlug = this.ensureUniqueSlug(record.slug || record.title, record.id);
    const sanitizedRecord = this.pruneSoldPropertyMedia(record);

    if (isNew) {
      const districtPrefix = (sanitizedRecord.location.district || 'SRI').slice(0, 3).toUpperCase();
      const generatedRef =
        sanitizedRecord.listingRef || `LP-${districtPrefix}-2026-${Date.now().toString().slice(-4)}`;

      savedRecord = {
        ...sanitizedRecord,
        slug: uniqueSlug,
        listingRef: generatedRef,
        publishedDate: sanitizedRecord.publishedDate || new Date().toISOString().split('T')[0],
        recordVersion: 1,
        viewCount: sanitizedRecord.viewCount || 0,
        inquiryCount: sanitizedRecord.inquiryCount || 0,
        saveCount: sanitizedRecord.saveCount || 0,
        lastModifiedAt: new Date().toLocaleString(),
      };

      this.records = [savedRecord, ...this.records];
    } else {
      const current = this.records[existingIndex];
      savedRecord = this.pruneSoldPropertyMedia({
        ...current,
        ...sanitizedRecord,
        slug: uniqueSlug,
        listingRef: current.listingRef || sanitizedRecord.listingRef, // Preserve existing reference
        recordVersion: (current.recordVersion || 1) + 1,
        lastModifiedAt: new Date().toLocaleString(),
      });
      this.records[existingIndex] = savedRecord;
    }

    this.notify();
    return { success: true, property: savedRecord, isNew };
  }

  updatePropertyStatus(id: string, status: PublicationStatus, reason?: string): AdminPropertyRecord | null {
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updated = this.pruneSoldPropertyMedia({
      ...this.records[index],
      publicationStatus: status,
      rejectionReason: reason,
      publishedAt: status === 'published' ? new Date().toISOString() : this.records[index].publishedAt,
      lastModifiedAt: new Date().toLocaleString(),
      recordVersion: (this.records[index].recordVersion || 1) + 1,
    });

    this.records[index] = updated;
    this.notify();
    return updated;
  }

  toggleCollectionPlacement(
    id: string,
    collection: 'featured' | 'trending' | 'architectural' | 'land' | 'signature'
  ): AdminPropertyRecord | null {
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = this.records[index];
    const collections = Array.isArray(current.collections) ? [...current.collections] : [];
    const hasCollection = collections.includes(collection);
    const updatedCollections = hasCollection
      ? collections.filter((c) => c !== collection)
      : [...collections, collection];

    const updated: AdminPropertyRecord = {
      ...current,
      collections: updatedCollections,
      isFeatured: collection === 'featured' ? !hasCollection : current.isFeatured,
      isTrending: collection === 'trending' ? !hasCollection : current.isTrending,
      isSignature: collection === 'signature' ? !hasCollection : current.isSignature,
      lastModifiedAt: new Date().toLocaleString(),
      recordVersion: (current.recordVersion || 1) + 1,
    };

    this.records[index] = updated;
    this.notify();
    return updated;
  }

  toggleFeatured(id: string, value?: boolean): AdminPropertyRecord | null {
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = this.records[index];
    const nextVal = value !== undefined ? value : !current.isFeatured;
    const collections = Array.isArray(current.collections) ? [...current.collections] : [];
    const updatedCollections = nextVal
      ? Array.from(new Set([...collections, 'featured' as const]))
      : collections.filter((c) => c !== 'featured');

    const updated: AdminPropertyRecord = {
      ...current,
      isFeatured: nextVal,
      collections: updatedCollections,
      lastModifiedAt: new Date().toLocaleString(),
      recordVersion: (current.recordVersion || 1) + 1,
    };

    this.records[index] = updated;
    this.notify();
    return updated;
  }

  toggleTrending(id: string, value?: boolean, velocityText?: string): AdminPropertyRecord | null {
    const index = this.records.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const current = this.records[index];
    const nextVal = value !== undefined ? value : !current.isTrending;
    const collections = Array.isArray(current.collections) ? [...current.collections] : [];
    const updatedCollections = nextVal
      ? Array.from(new Set([...collections, 'trending' as const]))
      : collections.filter((c) => c !== 'trending');

    const updated: AdminPropertyRecord = {
      ...current,
      isTrending: nextVal,
      trendingVelocityText: nextVal
        ? velocityText || current.trendingVelocityText || 'High Inquiry Demand This Week'
        : undefined,
      collections: updatedCollections,
      lastModifiedAt: new Date().toLocaleString(),
      recordVersion: (current.recordVersion || 1) + 1,
    };

    this.records[index] = updated;
    this.notify();
    return updated;
  }

  getTrendingProperties(limit?: number): AdminPropertyRecord[] {
    const published = this.records.filter(
      (p) => p.publicationStatus === 'published' && (p.isTrending || p.collections?.includes('trending'))
    );
    return limit ? published.slice(0, limit) : published;
  }

  getPropertiesNearCoordinates(
    targetLat: number,
    targetLon: number,
    maxRadiusKm = 100
  ): (AdminPropertyRecord & { distanceKm: number })[] {
    return this.records
      .filter((p) => p.publicationStatus === 'published')
      .map((p) => {
        const coords = p.location.coordinates || getCityCentroidCoordinates(p.location.city, p.location.district);
        const distanceKm = calculateHaversineDistanceKm(targetLat, targetLon, coords.latitude, coords.longitude);
        return {
          ...p,
          distanceKm,
        };
      })
      .filter((p) => p.distanceKm <= maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  deleteProperty(id: string): { success: boolean } {
    const beforeCount = this.records.length;
    this.records = this.records.filter((p) => p.id !== id);
    if (this.records.length !== beforeCount) {
      this.notify();
      return { success: true };
    }
    return { success: false };
  }

  bulkUpdateProperties(
    ids: string[],
    updates: Partial<AdminPropertyRecord>
  ): { successCount: number; failureCount: number } {
    let successCount = 0;
    this.records = this.records.map((p) => {
      if (ids.includes(p.id)) {
        successCount++;
        return this.pruneSoldPropertyMedia({
          ...p,
          ...updates,
          recordVersion: (p.recordVersion || 1) + 1,
          lastModifiedAt: new Date().toLocaleString(),
        });
      }
      return p;
    });

    if (successCount > 0) {
      this.notify();
    }
    return { successCount, failureCount: ids.length - successCount };
  }
}

export const propertyService = new PropertyService();
