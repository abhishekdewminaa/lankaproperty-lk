import { Property, ListingStatus, PropertyType, PropertyPurpose } from '../../types/property';

export type AdminRole =
  | 'super_admin'
  | 'listing_manager'
  | 'sales_manager'
  | 'marketing_manager'
  | 'finance_manager'
  | 'readonly_analyst';

export interface AdminPermissionSet {
  canViewListings: boolean;
  canCreateListings: boolean;
  canEditListings: boolean;
  canPublishListings: boolean;
  canArchiveListings: boolean;
  canDeleteListings: boolean;
  canManageHomepage: boolean;
  canManageCollections: boolean;
  canManageInquiries: boolean;
  canAssignLeads: boolean;
  canScheduleViewings: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageBilling: boolean;
  canManageContentSeo: boolean;
  canManageMedia: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  canManageSettings: boolean;
  canViewAudit: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  department: string;
  title: string;
  phone: string;
  isActive: boolean;
  lastLogin: string;
  isProtected?: boolean; // Protects the primary superadmin
}

export type PublicationStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';

export interface AdminPropertyRecord extends Property {
  publicationStatus: PublicationStatus;
  rejectionReason?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  collections: ('featured' | 'trending' | 'architectural' | 'land' | 'signature')[];
  viewCount: number;
  inquiryCount: number;
  saveCount: number;
  lastModifiedBy: string;
  lastModifiedAt: string;
  publishedAt?: string;
  recordVersion: number;
}

export type InquiryStage =
  | 'new'
  | 'assigned'
  | 'contacted'
  | 'viewing_scheduled'
  | 'negotiating'
  | 'closed'
  | 'lost';

export interface AdminInquiry {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyType?: PropertyType;
  message: string;
  source: 'website_modal' | 'direct_whatsapp' | 'call_click' | 'agent_referral';
  stage: InquiryStage;
  assignedStaffId?: string;
  assignedStaffName?: string;
  privateNotes: { id: string; author: string; text: string; createdAt: string }[];
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';

export interface ViewingAppointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  customerName: string;
  customerPhone: string;
  assignedStaffId: string;
  assignedStaffName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  timezone: string; // "Asia/Colombo"
  status: ViewingStatus;
  notes?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorEmail: string;
  actorRole: AdminRole;
  action: string;
  targetRecord: string;
  recordType: 'property' | 'homepage' | 'user' | 'billing' | 'inquiry' | 'setting' | 'auth';
  timestamp: string;
  outcome: 'success' | 'warning' | 'denied' | 'failed';
  details?: string;
  previousValue?: string;
  newValue?: string;
}

export interface HomepageDraftConfig {
  version: number;
  lastSavedAt: string;
  lastPublishedAt: string;
  hero: {
    headline: string;
    subheadline: string;
    supportingCopy: string;
    exploreBtnText: string;
    discoverBtnText: string;
    backgroundImageUrl: string;
  };
  editorialStatement: {
    headline: string;
    supportingText: string;
  };
  featuredSectionTitle: string;
  curatedSectionTitle: string;
  motionPreset: 'none' | 'gentle_reveal' | 'signature_story';
  isDraft: boolean;
}

export interface BillingPlan {
  id: string;
  name: string;
  priceLkr: number;
  durationDays: number;
  listingLimit: number;
  featuredPromotionsLimit: number;
  supportLevel: string;
  isActive: boolean;
}

export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amountLkr: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  issuedDate: string;
  dueDate: string;
  items: string;
  paymentMethod?: string;
}

export interface MediaAsset {
  id: string;
  fileName: string;
  url: string;
  fileSizeBytes: number;
  dimensions: string;
  uploadedAt: string;
  uploadedBy: string;
  altText: string;
  usedInCount: number;
  tags: string[];
}
