import { supabase } from '../lib/supabase';

export interface WantedPropertyLead {
  id: string;
  buyerName: string;
  buyerType: 'private_buyer' | 'investor' | 'diaspora' | 'corporate';
  phone: string;
  email?: string;
  preferredContactMethod: 'whatsapp' | 'call' | 'email';
  propertyType: 'house' | 'apartment' | 'land' | 'commercial' | 'villa';
  district: string;
  specificAreas: string[];
  budgetMinLkr: number;
  budgetMaxLkr: number;
  minBedrooms?: number;
  minLandPerches?: number;
  urgency: 'immediate' | 'within_30_days' | 'within_90_days' | 'exploring';
  title: string;
  description: string;
  status: 'active' | 'fulfilled' | 'pending_review' | 'archived';
  createdAt: string;
  verifiedBuyer: boolean;
  proposalsCount: number;
}

export interface MatchProposal {
  id: string;
  leadId: string;
  senderName: string;
  senderPhone: string;
  senderRole: 'agent' | 'owner';
  propertyTitle: string;
  priceLkr: number;
  propertyUrl?: string;
  notes: string;
  submittedAt: string;
}

const STORAGE_KEY = 'lankaproperty_wanted_leads_v1';
const PROPOSALS_KEY = 'lankaproperty_wanted_proposals_v1';

const SEED_WANTED_LEADS: WantedPropertyLead[] = [
  {
    id: 'wnt-101',
    buyerName: 'Dr. Rohan Jayasinghe',
    buyerType: 'diaspora',
    phone: '+94 77 412 8890',
    email: 'rohan.j@sydneymed.au',
    preferredContactMethod: 'whatsapp',
    propertyType: 'apartment',
    district: 'Colombo',
    specificAreas: ['Colombo 03 (Colpetty)', 'Colombo 07 (Cinnamon Gardens)', 'Kollupitiya'],
    budgetMinLkr: 75000000,
    budgetMaxLkr: 120000000,
    minBedrooms: 3,
    urgency: 'immediate',
    title: 'Seeking 3BR Luxury Sea-View or Cinnamon Gardens Condominium',
    description: 'Relocating from Sydney in late 2026. Require higher-floor 3-bedroom unit with dual deeded parking and backup generator. Ready to close within 14 days for ready-to-move-in title deeds.',
    status: 'active',
    createdAt: '2026-11-12T08:30:00Z',
    verifiedBuyer: true,
    proposalsCount: 3,
  },
  {
    id: 'wnt-102',
    buyerName: 'Ocean Horizons Hospitality Ltd',
    buyerType: 'corporate',
    phone: '+94 71 890 2233',
    email: 'acquisitions@oceanhorizons.lk',
    preferredContactMethod: 'call',
    propertyType: 'land',
    district: 'Galle',
    specificAreas: ['Thalpe', 'Ahangama', 'Mirissa', 'Habaraduwa'],
    budgetMinLkr: 150000000,
    budgetMaxLkr: 350000000,
    minLandPerches: 80,
    urgency: 'within_30_days',
    title: 'Urgent: Beachfront or Prime Elevated Land for Boutique Eco-Resort',
    description: 'Looking for 80–200 perches with direct sea-frontage or 200m beach access in Galle southern belt. Sinnakkara deed with clear coastal conservation (CCD) setback clearances essential.',
    status: 'active',
    createdAt: '2026-11-13T10:15:00Z',
    verifiedBuyer: true,
    proposalsCount: 5,
  },
  {
    id: 'wnt-103',
    buyerName: 'Malik Wickremasinghe',
    buyerType: 'private_buyer',
    phone: '+94 76 331 9901',
    preferredContactMethod: 'whatsapp',
    propertyType: 'house',
    district: 'Kandy',
    specificAreas: ['Anniewatte', 'Peradeniya', 'Hantana Heights'],
    budgetMinLkr: 45000000,
    budgetMaxLkr: 70000000,
    minBedrooms: 4,
    minLandPerches: 20,
    urgency: 'within_90_days',
    title: 'Spacious Colonial or Contemporary Residence with Mountain Views',
    description: 'Family looking for minimum 20 perches landscaped garden with panoramic view of Hanthana. Must have minimum 20ft road frontage and municipal water connection.',
    status: 'active',
    createdAt: '2026-11-14T14:40:00Z',
    verifiedBuyer: false,
    proposalsCount: 2,
  },
  {
    id: 'wnt-104',
    buyerName: 'K. Sivalingam & Partners',
    buyerType: 'investor',
    phone: '+94 77 655 4321',
    preferredContactMethod: 'email',
    propertyType: 'commercial',
    district: 'Gampaha',
    specificAreas: ['Peliyagoda', 'Wattala', 'Kelaniya', 'Ja-Ela'],
    budgetMinLkr: 100000000,
    budgetMaxLkr: 250000000,
    minLandPerches: 60,
    urgency: 'immediate',
    title: 'Container Accessible Industrial Warehouse / Commercial Land',
    description: 'Urgent requirement for logistics distribution depot. Minimum 40ft container access from Colombo-Negombo highway or Colombo-Katunayake expressway junction.',
    status: 'active',
    createdAt: '2026-11-15T07:20:00Z',
    verifiedBuyer: true,
    proposalsCount: 1,
  },
];

class WantedPropertyService {
  /**
   * #8 Auto-Purge Expired Wanted Leads & Match Proposals (> 90 days old)
   * Mirrors the PostgreSQL pg_cron weekly cleanup job to keep storage lean.
   */
  purgeExpiredRecords(retentionDays = 90): { purgedLeads: number; purgedProposals: number } {
    const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let purgedLeads = 0;
    let purgedProposals = 0;

    try {
      const rawLeads = localStorage.getItem(STORAGE_KEY);
      if (rawLeads) {
        const leads: WantedPropertyLead[] = JSON.parse(rawLeads);
        const keptLeads = leads.filter((l) => {
          const createdMs = new Date(l.createdAt).getTime();
          const isClosedOrArchived = l.status === 'fulfilled' || l.status === 'archived';
          if (isClosedOrArchived && !isNaN(createdMs) && createdMs < cutoffMs) {
            purgedLeads++;
            return false;
          }
          return true;
        });
        if (purgedLeads > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(keptLeads));
        }
      }

      const rawProposals = localStorage.getItem(PROPOSALS_KEY);
      if (rawProposals) {
        const proposals: MatchProposal[] = JSON.parse(rawProposals);
        const keptProposals = proposals.filter((p) => {
          const submittedMs = new Date(p.submittedAt).getTime();
          if (!isNaN(submittedMs) && submittedMs < cutoffMs) {
            purgedProposals++;
            return false;
          }
          return true;
        });
        if (purgedProposals > 0) {
          localStorage.setItem(PROPOSALS_KEY, JSON.stringify(keptProposals));
        }
      }
    } catch {
      // Ignore storage access errors
    }

    return { purgedLeads, purgedProposals };
  }

  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  async syncWithSupabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('wanted_properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data) && data.length > 0) {
        const remoteLeads: WantedPropertyLead[] = data.map((row: any) => ({
          id: row.id,
          buyerName: row.buyer_name,
          buyerType: (row.buyer_type || 'private_buyer') as any,
          phone: row.phone,
          email: row.email || undefined,
          preferredContactMethod: (row.preferred_contact || 'whatsapp') as any,
          propertyType: (row.property_type || 'house') as any,
          district: row.district,
          specificAreas: Array.isArray(row.specific_areas) ? row.specific_areas : [],
          budgetMinLkr: Number(row.budget_min_lkr) || 0,
          budgetMaxLkr: Number(row.budget_max_lkr) || 0,
          minBedrooms: row.min_bedrooms ? Number(row.min_bedrooms) : undefined,
          minLandPerches: row.min_land_perches ? Number(row.min_land_perches) : undefined,
          urgency: (row.urgency || 'within_30_days') as any,
          title: row.title,
          description: row.description,
          status: (row.status || 'active') as any,
          createdAt: row.created_at || new Date().toISOString(),
          verifiedBuyer: Boolean(row.verified_buyer),
          proposalsCount: 0,
        }));

        const local = this.getStoredLeads();
        const remoteIds = new Set(remoteLeads.map((r) => r.id));
        const remoteTitles = new Set(remoteLeads.map((r) => r.title.toLowerCase()));
        const merged = [
          ...remoteLeads,
          ...local.filter((l) => !remoteIds.has(l.id) && !remoteTitles.has(l.title.toLowerCase())),
        ];
        this.saveLeads(merged);
        this.notify();
      }
    } catch (err) {
      console.warn('Wanted leads Supabase sync deferred:', err);
    }
  }

  private getStoredLeads(): WantedPropertyLead[] {
    try {
      this.purgeExpiredRecords(90);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_WANTED_LEADS));
        return SEED_WANTED_LEADS;
      }
      return JSON.parse(raw);
    } catch {
      return SEED_WANTED_LEADS;
    }
  }

  private saveLeads(leads: WantedPropertyLead[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {
      // Ignore storage quota in tests
    }
  }

  getWantedLeads(filter?: {
    district?: string;
    propertyType?: string;
    status?: string;
    searchQuery?: string;
  }): WantedPropertyLead[] {
    let leads = this.getStoredLeads();

    if (filter) {
      if (filter.district && filter.district !== 'all') {
        leads = leads.filter(
          (l) => l.district.toLowerCase() === filter.district!.toLowerCase()
        );
      }
      if (filter.propertyType && filter.propertyType !== 'all') {
        leads = leads.filter(
          (l) => l.propertyType.toLowerCase() === filter.propertyType!.toLowerCase()
        );
      }
      if (filter.status && filter.status !== 'all') {
        leads = leads.filter((l) => l.status === filter.status);
      } else {
        // Default to active leads unless explicitly querying all
        leads = leads.filter((l) => l.status !== 'archived');
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        leads = leads.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.buyerName.toLowerCase().includes(q) ||
            l.specificAreas.some((a) => a.toLowerCase().includes(q))
        );
      }
    }

    return leads.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getLeadById(id: string): WantedPropertyLead | null {
    const leads = this.getStoredLeads();
    return leads.find((l) => l.id === id) || null;
  }

  submitWantedLead(data: {
    buyerName: string;
    buyerType: WantedPropertyLead['buyerType'];
    phone: string;
    email?: string;
    preferredContactMethod: WantedPropertyLead['preferredContactMethod'];
    propertyType: WantedPropertyLead['propertyType'];
    district: string;
    specificAreas: string[];
    budgetMinLkr: number;
    budgetMaxLkr: number;
    minBedrooms?: number;
    minLandPerches?: number;
    urgency: WantedPropertyLead['urgency'];
    title: string;
    description: string;
    honeypot?: string;
  }): { success: boolean; leadId?: string; message: string } {
    // Bot honeypot check
    if (data.honeypot && data.honeypot.trim().length > 0) {
      return { success: false, message: 'Invalid submission signature detected.' };
    }

    if (!data.buyerName || !data.phone || !data.title || !data.district) {
      return { success: false, message: 'Please complete all required fields.' };
    }

    const leads = this.getStoredLeads();
    const newLead: WantedPropertyLead = {
      id: `wnt-${Date.now().toString().slice(-6)}`,
      buyerName: data.buyerName.trim(),
      buyerType: data.buyerType,
      phone: data.phone.trim(),
      email: data.email?.trim(),
      preferredContactMethod: data.preferredContactMethod,
      propertyType: data.propertyType,
      district: data.district,
      specificAreas: data.specificAreas,
      budgetMinLkr: data.budgetMinLkr,
      budgetMaxLkr: data.budgetMaxLkr,
      minBedrooms: data.minBedrooms,
      minLandPerches: data.minLandPerches,
      urgency: data.urgency,
      title: data.title.trim(),
      description: data.description.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      verifiedBuyer: false,
      proposalsCount: 0,
    };

    leads.unshift(newLead);
    this.saveLeads(leads);
    this.notify();

    // Asynchronously persist to Supabase cloud database for cross-device visibility
    supabase
      .from('wanted_properties')
      .insert({
        buyer_name: newLead.buyerName,
        buyer_type: newLead.buyerType,
        phone: newLead.phone,
        email: newLead.email || null,
        preferred_contact: newLead.preferredContactMethod,
        property_type: newLead.propertyType,
        district: newLead.district,
        specific_areas: newLead.specificAreas,
        budget_min_lkr: newLead.budgetMinLkr,
        budget_max_lkr: newLead.budgetMaxLkr,
        min_bedrooms: newLead.minBedrooms || null,
        min_land_perches: newLead.minLandPerches || null,
        urgency: newLead.urgency,
        title: newLead.title,
        description: newLead.description,
        status: 'active',
        verified_buyer: false,
      })
      .then(({ error }) => {
        if (error) console.warn('Supabase wanted_properties insert note:', error.message);
      });

    return {
      success: true,
      leadId: newLead.id,
      message: 'Wanted property requirement posted successfully to the verified network.',
    };
  }

  updateLeadStatus(id: string, status: WantedPropertyLead['status']): boolean {
    const leads = this.getStoredLeads();
    const idx = leads.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    leads[idx].status = status;
    this.saveLeads(leads);
    return true;
  }

  deleteLead(id: string): boolean {
    const leads = this.getStoredLeads();
    const filtered = leads.filter((l) => l.id !== id);
    if (filtered.length === leads.length) return false;
    this.saveLeads(filtered);
    return true;
  }

  submitProposal(proposal: Omit<MatchProposal, 'id' | 'submittedAt'>): boolean {
    try {
      const raw = localStorage.getItem(PROPOSALS_KEY);
      const proposals: MatchProposal[] = raw ? JSON.parse(raw) : [];
      const newProp: MatchProposal = {
        ...proposal,
        id: `prop-${Date.now().toString().slice(-6)}`,
        submittedAt: new Date().toISOString(),
      };
      proposals.unshift(newProp);
      localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));

      // Increment count on lead
      const leads = this.getStoredLeads();
      const lead = leads.find((l) => l.id === proposal.leadId);
      if (lead) {
        lead.proposalsCount = (lead.proposalsCount || 0) + 1;
        this.saveLeads(leads);
      }
      return true;
    } catch {
      return false;
    }
  }

  getProposalsForLead(leadId: string): MatchProposal[] {
    try {
      const raw = localStorage.getItem(PROPOSALS_KEY);
      if (!raw) return [];
      const proposals: MatchProposal[] = JSON.parse(raw);
      return proposals.filter((p) => p.leadId === leadId);
    } catch {
      return [];
    }
  }
}

export const wantedPropertyService = new WantedPropertyService();
