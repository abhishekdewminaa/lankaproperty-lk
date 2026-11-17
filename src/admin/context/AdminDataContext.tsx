import React, { createContext, useContext, useState, useEffect } from 'react';
import { propertyService } from '../../services/propertyService';
import {
  AdminPropertyRecord,
  AdminInquiry,
  ViewingAppointment,
  AuditLogEntry,
  HomepageDraftConfig,
  BillingPlan,
  AdminInvoice,
  PublicationStatus,
} from '../types/admin';
import { useAdminAuth } from './AdminAuthContext';

// Initial Inquiries
const INITIAL_INQUIRIES: AdminInquiry[] = [
  {
    id: 'inq-101',
    referenceNumber: 'LP-INQ-2026-089',
    customerName: 'Ashok Vethanayagam',
    customerPhone: '+94 77 445 9988',
    customerEmail: 'ashok.v@capitalholdings.lk',
    propertyId: 'prop-1',
    propertyTitle: 'The Frangipani Courtyard Villa',
    propertyType: 'house',
    message: 'Interested in arranging a private viewing this Saturday afternoon. Can overseas remittance escrow be coordinated?',
    source: 'website_modal',
    stage: 'viewing_scheduled',
    assignedStaffId: 'staff-2',
    assignedStaffName: 'Chamari Perera',
    privateNotes: [
      {
        id: 'n-1',
        author: 'Chamari Perera',
        text: 'Buyer is visiting from Singapore for 4 days. Verified proof of funds.',
        createdAt: '2026-10-04 11:30 AM',
      },
    ],
    followUpDate: '2026-10-08',
    createdAt: '2026-10-03 16:45',
    updatedAt: '2026-10-04 11:30',
  },
  {
    id: 'inq-102',
    referenceNumber: 'LP-INQ-2026-090',
    customerName: 'Dr. Senaka Bandara',
    customerPhone: '+94 71 334 1122',
    customerEmail: 's.bandara@kandyhealth.lk',
    propertyId: 'prop-3',
    propertyTitle: 'The Heritage Teak Bungalow',
    propertyType: 'house',
    message: 'Please send title deed registration details and municipal clearance certificates.',
    source: 'direct_whatsapp',
    stage: 'contacted',
    assignedStaffId: 'staff-3',
    assignedStaffName: 'Rohan Senanayake',
    privateNotes: [
      {
        id: 'n-2',
        author: 'Rohan Senanayake',
        text: 'Sent title report summary. Customer requested video tour of the spice garden boundary.',
        createdAt: '2026-10-04 03:15 PM',
      },
    ],
    followUpDate: '2026-10-07',
    createdAt: '2026-10-04 09:10',
    updatedAt: '2026-10-04 15:15',
  },
  {
    id: 'inq-103',
    referenceNumber: 'LP-INQ-2026-091',
    customerName: 'Fatima Nazeer',
    customerPhone: '+94 77 889 0011',
    customerEmail: 'fatima@nazeerpartners.com',
    propertyId: 'prop-2',
    propertyTitle: 'Altair Ocean & Lake Penthouse',
    propertyType: 'apartment',
    message: 'Inquiring about immediate occupancy terms and dual parking slot allotment.',
    source: 'website_modal',
    stage: 'new',
    privateNotes: [],
    createdAt: '2026-10-05 08:20',
    updatedAt: '2026-10-05 08:20',
  },
  {
    id: 'inq-104',
    referenceNumber: 'LP-INQ-2026-092',
    customerName: 'David MacIntyre',
    customerPhone: '+44 7911 123456',
    customerEmail: 'david.m@cinnamoninvest.co.uk',
    propertyId: 'prop-5',
    propertyTitle: 'Coconut Grove Beachfront Land',
    propertyType: 'land',
    message: 'Seeking 24 perch parcel for boutique surf resort project. Need UDA coastal clearance status.',
    source: 'website_modal',
    stage: 'negotiating',
    assignedStaffId: 'staff-2',
    assignedStaffName: 'Chamari Perera',
    privateNotes: [
      {
        id: 'n-3',
        author: 'Chamari Perera',
        text: 'Draft term sheet prepared. Price firm at Rs. 4.2 Mn per perch.',
        createdAt: '2026-10-02 14:00',
      },
    ],
    followUpDate: '2026-10-06',
    createdAt: '2026-10-01 10:15',
    updatedAt: '2026-10-04 16:00',
  },
];

// Initial Viewings
const INITIAL_VIEWINGS: ViewingAppointment[] = [
  {
    id: 'view-1',
    propertyId: 'prop-1',
    propertyTitle: 'The Frangipani Courtyard Villa',
    customerName: 'Ashok Vethanayagam',
    customerPhone: '+94 77 445 9988',
    assignedStaffId: 'staff-2',
    assignedStaffName: 'Chamari Perera',
    scheduledDate: '2026-10-10',
    scheduledTime: '15:30',
    timezone: 'Asia/Colombo',
    status: 'confirmed',
    notes: 'Meet at Talpe main gate. Caretaker has opened courtyard pavilions.',
    createdAt: '2026-10-04 11:35 AM',
  },
  {
    id: 'view-2',
    propertyId: 'prop-3',
    propertyTitle: 'The Heritage Teak Bungalow',
    customerName: 'Dr. Senaka Bandara',
    customerPhone: '+94 71 334 1122',
    assignedStaffId: 'staff-3',
    assignedStaffName: 'Rohan Senanayake',
    scheduledDate: '2026-10-11',
    scheduledTime: '10:00',
    timezone: 'Asia/Colombo',
    status: 'scheduled',
    notes: 'Access via Hanthana mountain road. Tea room inspection requested.',
    createdAt: '2026-10-04 03:20 PM',
  },
];

// Initial Audit Logs
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    actorName: 'Mr Lalith Ranatunga',
    actorEmail: 'lalith.ranatunga@lankaproperty.lk',
    actorRole: 'super_admin',
    action: 'PUBLISH_HOMEPAGE',
    targetRecord: 'Homepage v2.4',
    recordType: 'homepage',
    timestamp: '2026-10-05 09:30 AM',
    outcome: 'success',
    details: 'Published new curated showcase featuring dual Architectural Homes & Land tabs.',
  },
  {
    id: 'log-2',
    actorName: 'Chamari Perera',
    actorEmail: 'chamari.p@lankaproperty.lk',
    actorRole: 'listing_manager',
    action: 'APPROVE_LISTING',
    targetRecord: 'The Dutch Merchant Mansion (prop-10)',
    recordType: 'property',
    timestamp: '2026-10-04 04:15 PM',
    outcome: 'success',
    details: 'Verified UNESCO conservation guidelines and approved commercial listing.',
    previousValue: 'pending_review',
    newValue: 'published',
  },
  {
    id: 'log-3',
    actorName: 'Rohan Senanayake',
    actorEmail: 'rohan.s@lankaproperty.lk',
    actorRole: 'sales_manager',
    action: 'SCHEDULE_VIEWING',
    targetRecord: 'Viewing #view-1 (Talpe Courtyard)',
    recordType: 'inquiry',
    timestamp: '2026-10-04 11:35 AM',
    outcome: 'success',
    details: 'Scheduled site viewing with Ashok Vethanayagam for Oct 10 at 15:30.',
  },
  {
    id: 'log-4',
    actorName: 'Mr Lalith Ranatunga',
    actorEmail: 'lalith.ranatunga@lankaproperty.lk',
    actorRole: 'super_admin',
    action: 'UPDATE_COLLECTION',
    targetRecord: 'Featured Properties Collection',
    recordType: 'property',
    timestamp: '2026-10-03 02:40 PM',
    outcome: 'success',
    details: 'Assigned 4 active properties with verified eligibility checks.',
  },
];

// Initial Homepage Config
const INITIAL_HOMEPAGE_CONFIG: HomepageDraftConfig = {
  version: 3,
  lastSavedAt: '2026-10-05 09:15 AM',
  lastPublishedAt: '2026-10-05 09:30 AM',
  hero: {
    headline: 'Find a place that feels like yours.',
    subheadline: 'Modern Tropical Editorial Property Discovery',
    supportingCopy: 'Explore homes, land, apartments, and new developments across Sri Lanka with transparent pricing and direct inquiry.',
    exploreBtnText: 'Explore Properties',
    discoverBtnText: 'Discover New Projects',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2000&q=85',
  },
  editorialStatement: {
    headline: 'More room for the life you want.',
    supportingText: 'Tropical modern homes designed for equatorial shade, oceanic breezes, and enduring architectural calm across Sri Lanka.',
  },
  featuredSectionTitle: 'Featured Properties',
  curatedSectionTitle: 'Exceptional Homes & Land',
  motionPreset: 'gentle_reveal',
  isDraft: false,
};

// Billing Plans
export const INITIAL_PLANS: BillingPlan[] = [
  {
    id: 'plan-starter',
    name: 'Individual Broker Starter',
    priceLkr: 25000,
    durationDays: 30,
    listingLimit: 5,
    featuredPromotionsLimit: 1,
    supportLevel: 'Standard Email & Ticket',
    isActive: true,
  },
  {
    id: 'plan-agency-pro',
    name: 'Agency Professional',
    priceLkr: 75000,
    durationDays: 30,
    listingLimit: 25,
    featuredPromotionsLimit: 5,
    supportLevel: 'Dedicated Relationship Manager & Priority WhatsApp',
    isActive: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Developer & Corporate Portfolio',
    priceLkr: 180000,
    durationDays: 30,
    listingLimit: 100,
    featuredPromotionsLimit: 15,
    supportLevel: 'Executive 24/7 SLA & Masterplan 3D Tagging',
    isActive: true,
  },
];

// Invoices
export const INITIAL_INVOICES: AdminInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-0901',
    clientName: 'Southern Coastline Properties Ltd',
    amountLkr: 75000,
    status: 'paid',
    issuedDate: '2026-09-28',
    dueDate: '2026-10-12',
    items: 'Agency Professional Subscription (October)',
    paymentMethod: 'Commercial Bank Direct Deposit (Ref #CB-9982)',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-0902',
    clientName: 'Galle Heritage Real Estate',
    amountLkr: 25000,
    status: 'paid',
    issuedDate: '2026-10-01',
    dueDate: '2026-10-15',
    items: 'Individual Broker Starter + 1 Featured Add-on',
    paymentMethod: 'Sampath Vishwa Transfer (Ref #SV-4411)',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-0903',
    clientName: 'Cinnamon Valley Holdings',
    amountLkr: 180000,
    status: 'pending',
    issuedDate: '2026-10-03',
    dueDate: '2026-10-17',
    items: 'Developer Corporate Portfolio Subscription',
  },
];

interface AdminDataContextType {
  properties: AdminPropertyRecord[];
  inquiries: AdminInquiry[];
  viewings: ViewingAppointment[];
  auditLogs: AuditLogEntry[];
  homepageConfig: HomepageDraftConfig;
  publishedHomepageConfig: HomepageDraftConfig;
  invoices: AdminInvoice[];
  plans: BillingPlan[];

  // Property Actions
  saveProperty: (property: AdminPropertyRecord) => { success: boolean; property?: AdminPropertyRecord; message?: string };
  deleteProperty: (id: string) => { success: boolean; message?: string };
  updatePropertyStatus: (id: string, status: PublicationStatus, reason?: string) => void;
  bulkUpdateProperties: (ids: string[], updates: Partial<AdminPropertyRecord>) => { successCount: number; failureCount: number };
  toggleCollectionPlacement: (
    propertyId: string,
    collection: 'featured' | 'trending' | 'architectural' | 'land' | 'signature'
  ) => void;

  // Inquiry Actions
  updateInquiryStage: (inquiryId: string, newStage: AdminInquiry['stage']) => void;
  assignInquiry: (inquiryId: string, staffId: string, staffName: string) => void;
  addInquiryNote: (inquiryId: string, noteText: string) => void;

  // Viewing Actions
  createViewing: (viewing: Omit<ViewingAppointment, 'id' | 'createdAt'>) => ViewingAppointment;
  updateViewingStatus: (viewingId: string, status: ViewingAppointment['status']) => void;

  // Homepage Actions
  saveHomepageDraft: (draft: Partial<HomepageDraftConfig>) => void;
  publishHomepageDraft: () => void;

  // Audit Action
  logAuditEvent: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorName' | 'actorEmail' | 'actorRole'>) => void;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAdminAuth();

  const [properties, setProperties] = useState<AdminPropertyRecord[]>(() =>
    propertyService.getAllAuthoritativeProperties()
  );

  useEffect(() => {
    return propertyService.subscribe(() => {
      setProperties(propertyService.getAllAuthoritativeProperties());
    });
  }, []);

  const [inquiries, setInquiries] = useState<AdminInquiry[]>(() => {
    try {
      const saved = localStorage.getItem('lankaproperty_admin_inquiries');
      return saved ? JSON.parse(saved) : INITIAL_INQUIRIES;
    } catch {
      return INITIAL_INQUIRIES;
    }
  });

  const [viewings, setViewings] = useState<ViewingAppointment[]>(() => {
    try {
      const saved = localStorage.getItem('lankaproperty_admin_viewings');
      return saved ? JSON.parse(saved) : INITIAL_VIEWINGS;
    } catch {
      return INITIAL_VIEWINGS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('lankaproperty_admin_audit_logs');
      const parsed: AuditLogEntry[] = saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
      // #8 Auto-Purge Audit Logs older than 60 days (mirrors pg_cron rule)
      const sixtyDaysAgoMs = Date.now() - 60 * 24 * 60 * 60 * 1000;
      return parsed.filter((entry) => {
        const ts = new Date(entry.timestamp).getTime();
        return isNaN(ts) || ts >= sixtyDaysAgoMs;
      });
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [homepageConfig, setHomepageConfig] = useState<HomepageDraftConfig>(() => {
    try {
      const saved = localStorage.getItem('lankaproperty_admin_homepage_draft');
      return saved ? JSON.parse(saved) : INITIAL_HOMEPAGE_CONFIG;
    } catch {
      return INITIAL_HOMEPAGE_CONFIG;
    }
  });

  const [publishedHomepageConfig, setPublishedHomepageConfig] = useState<HomepageDraftConfig>(() => {
    try {
      const saved = localStorage.getItem('lankaproperty_admin_homepage_published');
      return saved ? JSON.parse(saved) : INITIAL_HOMEPAGE_CONFIG;
    } catch {
      return INITIAL_HOMEPAGE_CONFIG;
    }
  });

  const [invoices, setInvoices] = useState<AdminInvoice[]>(INITIAL_INVOICES);
  const [plans, setPlans] = useState<BillingPlan[]>(INITIAL_PLANS);

  // Persistence helpers
  useEffect(() => {
    try {
      localStorage.setItem('lankaproperty_admin_inquiries', JSON.stringify(inquiries));
    } catch (e) {
      console.warn('Could not persist inquiries:', e);
    }
  }, [inquiries]);

  useEffect(() => {
    try {
      localStorage.setItem('lankaproperty_admin_viewings', JSON.stringify(viewings));
    } catch (e) {
      console.warn('Could not persist viewings:', e);
    }
  }, [viewings]);

  useEffect(() => {
    try {
      localStorage.setItem('lankaproperty_admin_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Could not persist audit logs:', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('lankaproperty_admin_homepage_draft', JSON.stringify(homepageConfig));
    } catch (e) {
      console.warn('Could not persist homepage draft config:', e);
    }
  }, [homepageConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('lankaproperty_admin_homepage_published', JSON.stringify(publishedHomepageConfig));
    } catch (e) {
      console.warn('Could not persist published homepage config:', e);
    }
  }, [publishedHomepageConfig]);

  const logAuditEvent = (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'actorName' | 'actorEmail' | 'actorRole'>
  ) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actorName: currentUser.name,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const saveProperty = (
    property: AdminPropertyRecord
  ): { success: boolean; property?: AdminPropertyRecord; message?: string } => {
    try {
      const existingIndex = properties.findIndex((p) => p.id === property.id);

      if (existingIndex >= 0) {
        const existing = properties[existingIndex];
        // Concurrent edit version check
        if (property.recordVersion < existing.recordVersion) {
          return {
            success: false,
            message: 'Conflict detected: A newer revision of this property was saved by another administrator. Please refresh before saving.',
          };
        }
      }

      const { property: savedRecord, isNew } = propertyService.saveProperty({
        ...property,
        lastModifiedBy: currentUser.name,
      });

      logAuditEvent({
        action: isNew ? 'CREATE_PROPERTY' : 'UPDATE_PROPERTY',
        targetRecord: `${savedRecord.title} (${savedRecord.id})`,
        recordType: 'property',
        outcome: 'success',
        details: isNew
          ? `Created new property listing with status: ${savedRecord.publicationStatus}.`
          : `Saved property edits (rev ${savedRecord.recordVersion}).`,
      });

      return { success: true, property: savedRecord };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to save property to authoritative store' };
    }
  };

  const deleteProperty = (id: string): { success: boolean; message?: string } => {
    const target = properties.find((p) => p.id === id);
    if (!target) return { success: false, message: 'Property not found.' };

    const res = propertyService.deleteProperty(id);

    logAuditEvent({
      action: 'DELETE_PROPERTY',
      targetRecord: `${target.title} (${target.id})`,
      recordType: 'property',
      outcome: 'warning',
      details: 'Deleted property record from inventory.',
    });

    return res;
  };

  const updatePropertyStatus = (id: string, status: PublicationStatus, reason?: string) => {
    propertyService.updatePropertyStatus(id, status, reason);

    logAuditEvent({
      action: `STATUS_CHANGE_${status.toUpperCase()}`,
      targetRecord: id,
      recordType: 'property',
      outcome: 'success',
      details: reason ? `Reason: ${reason}` : `Changed publication status to ${status}.`,
    });
  };

  const bulkUpdateProperties = (
    ids: string[],
    updates: Partial<AdminPropertyRecord>
  ): { successCount: number; failureCount: number } => {
    const res = propertyService.bulkUpdateProperties(ids, updates);

    logAuditEvent({
      action: 'BULK_UPDATE_PROPERTIES',
      targetRecord: `${res.successCount} properties`,
      recordType: 'property',
      outcome: 'success',
      details: `Bulk updated fields: ${Object.keys(updates).join(', ')}`,
    });

    return { successCount: res.successCount, failureCount: ids.length - res.successCount };
  };

  const toggleCollectionPlacement = (
    propertyId: string,
    collection: 'featured' | 'trending' | 'architectural' | 'land' | 'signature'
  ) => {
    propertyService.toggleCollectionPlacement(propertyId, collection);

    logAuditEvent({
      action: 'TOGGLE_COLLECTION',
      targetRecord: `${propertyId} -> ${collection}`,
      recordType: 'property',
      outcome: 'success',
      details: `Toggled placement for collection ${collection}.`,
    });
  };

  const updateInquiryStage = (inquiryId: string, newStage: AdminInquiry['stage']) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId
          ? { ...inq, stage: newStage, updatedAt: new Date().toLocaleString() }
          : inq
      )
    );

    logAuditEvent({
      action: 'UPDATE_INQUIRY_STAGE',
      targetRecord: inquiryId,
      recordType: 'inquiry',
      outcome: 'success',
      details: `Moved lead to stage: ${newStage}`,
    });
  };

  const assignInquiry = (inquiryId: string, staffId: string, staffName: string) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId
          ? {
              ...inq,
              assignedStaffId: staffId,
              assignedStaffName: staffName,
              stage: inq.stage === 'new' ? 'assigned' : inq.stage,
              updatedAt: new Date().toLocaleString(),
            }
          : inq
      )
    );

    logAuditEvent({
      action: 'ASSIGN_INQUIRY',
      targetRecord: inquiryId,
      recordType: 'inquiry',
      outcome: 'success',
      details: `Assigned lead to staff: ${staffName}`,
    });
  };

  const addInquiryNote = (inquiryId: string, noteText: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      author: currentUser.name,
      text: noteText,
      createdAt: new Date().toLocaleString(),
    };

    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId
          ? {
              ...inq,
              privateNotes: [...inq.privateNotes, newNote],
              updatedAt: new Date().toLocaleString(),
            }
          : inq
      )
    );
  };

  const createViewing = (viewing: Omit<ViewingAppointment, 'id' | 'createdAt'>): ViewingAppointment => {
    const newViewing: ViewingAppointment = {
      ...viewing,
      id: `view-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
    };

    setViewings((prev) => [newViewing, ...prev]);

    logAuditEvent({
      action: 'SCHEDULE_VIEWING',
      targetRecord: `${newViewing.propertyTitle} (${newViewing.id})`,
      recordType: 'inquiry',
      outcome: 'success',
      details: `Viewing booked for ${newViewing.customerName} on ${newViewing.scheduledDate} at ${newViewing.scheduledTime} Asia/Colombo.`,
    });

    return newViewing;
  };

  const updateViewingStatus = (viewingId: string, status: ViewingAppointment['status']) => {
    setViewings((prev) =>
      prev.map((v) => (v.id === viewingId ? { ...v, status } : v))
    );

    logAuditEvent({
      action: 'UPDATE_VIEWING_STATUS',
      targetRecord: viewingId,
      recordType: 'inquiry',
      outcome: 'success',
      details: `Viewing status updated to ${status}.`,
    });
  };

  const saveHomepageDraft = (draftUpdates: Partial<HomepageDraftConfig>) => {
    setHomepageConfig((prev) => ({
      ...prev,
      ...draftUpdates,
      version: prev.version + 1,
      lastSavedAt: new Date().toLocaleString(),
      isDraft: true,
    }));

    logAuditEvent({
      action: 'SAVE_HOMEPAGE_DRAFT',
      targetRecord: `Homepage Draft v${homepageConfig.version + 1}`,
      recordType: 'homepage',
      outcome: 'success',
      details: 'Updated draft configuration.',
    });
  };

  const publishHomepageDraft = () => {
    const published = {
      ...homepageConfig,
      lastPublishedAt: new Date().toLocaleString(),
      isDraft: false,
    };
    setHomepageConfig(published);
    setPublishedHomepageConfig(published);

    try {
      localStorage.setItem('lankaproperty_admin_homepage_draft', JSON.stringify(published));
      localStorage.setItem('lankaproperty_admin_homepage_published', JSON.stringify(published));
    } catch (e) {
      console.warn('Could not persist published homepage config:', e);
    }

    logAuditEvent({
      action: 'PUBLISH_HOMEPAGE',
      targetRecord: `Homepage v${homepageConfig.version}`,
      recordType: 'homepage',
      outcome: 'success',
      details: 'Published active homepage changes live to public site.',
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lankaproperty:homepage-update'));
    }
  };

  return (
    <AdminDataContext.Provider
      value={{
        properties,
        inquiries,
        viewings,
        auditLogs,
        homepageConfig,
        publishedHomepageConfig,
        invoices,
        plans,
        saveProperty,
        deleteProperty,
        updatePropertyStatus,
        bulkUpdateProperties,
        toggleCollectionPlacement,
        updateInquiryStage,
        assignInquiry,
        addInquiryNote,
        createViewing,
        updateViewingStatus,
        saveHomepageDraft,
        publishHomepageDraft,
        logAuditEvent,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}
