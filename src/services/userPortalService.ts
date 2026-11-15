import { AdminPropertyRecord } from '../admin/types/admin';
import { propertyService } from './propertyService';

export type PortalRole = 'owner' | 'agent';

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: PortalRole;
  agencyName?: string;
  licenseNumber?: string;
  activePackageId: string;
  joinedAt: string;
  status: 'active' | 'suspended';
  district?: string;
}

const STORAGE_USERS_KEY = 'lankaproperty_portal_users';
const STORAGE_CURRENT_USER_KEY = 'lankaproperty_active_portal_user';

export const INITIAL_PRESEEDED_USERS: PortalUser[] = [
  {
    id: 'owner-roshan',
    name: 'Dr. Roshan Senanayake',
    email: 'roshan.senanayake@gmail.com',
    phone: '+94 77 123 4567',
    whatsapp: '+94 77 123 4567',
    role: 'owner',
    activePackageId: 'platinum',
    joinedAt: '2026-08-14',
    status: 'active',
    district: 'Colombo',
  },
  {
    id: 'owner-priyantha',
    name: 'Priyantha De Silva',
    email: 'priyantha.desilva@yahoo.com',
    phone: '+94 71 987 6543',
    whatsapp: '+94 71 987 6543',
    role: 'owner',
    activePackageId: 'premium-pro',
    joinedAt: '2026-09-02',
    status: 'active',
    district: 'Galle',
  },
  {
    id: 'owner-ananya',
    name: 'Ananya Wickremasinghe',
    email: 'ananya.w@outlook.com',
    phone: '+94 76 555 4321',
    whatsapp: '+94 76 555 4321',
    role: 'owner',
    activePackageId: 'free',
    joinedAt: '2026-10-18',
    status: 'active',
    district: 'Kandy',
  },
  {
    id: 'agent-rohan',
    name: 'Rohan Wijesekera',
    email: 'rohan@colombopremier.lk',
    phone: '+94 77 345 6789',
    whatsapp: '+94 77 345 6789',
    role: 'agent',
    agencyName: 'Colombo Premier Real Estate',
    licenseNumber: 'CEA/COL/2024/089',
    activePackageId: 'diamond',
    joinedAt: '2026-06-10',
    status: 'active',
    district: 'Colombo',
  },
  {
    id: 'agent-dilshan',
    name: 'Dilshan Perera',
    email: 'dilshan@southerncoastal.lk',
    phone: '+94 77 888 9999',
    whatsapp: '+94 77 888 9999',
    role: 'agent',
    agencyName: 'Southern Coastal Brokers',
    licenseNumber: 'CEA/GAL/2023/112',
    activePackageId: 'platinum',
    joinedAt: '2026-07-22',
    status: 'active',
    district: 'Galle',
  },
  {
    id: 'agent-menaka',
    name: 'Menaka Fernando',
    email: 'menaka@highlandproperties.lk',
    phone: '+94 70 222 3344',
    whatsapp: '+94 70 222 3344',
    role: 'agent',
    agencyName: 'Highland Properties Ceylon',
    licenseNumber: 'CEA/KAN/2025/044',
    activePackageId: 'premium-pro',
    joinedAt: '2026-10-05',
    status: 'active',
    district: 'Kandy',
  },
];

class UserPortalService {
  private users: PortalUser[];
  private currentUser: PortalUser | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.users = this.loadUsers();
    this.currentUser = this.loadCurrentUser();
    this.syncInitialPropertyOwnership();
  }

  private loadUsers(): PortalUser[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_USERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {
      // fallback
    }
    this.saveUsers(INITIAL_PRESEEDED_USERS);
    return INITIAL_PRESEEDED_USERS;
  }

  private loadCurrentUser(): PortalUser | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
      // fallback
    }
    return null;
  }

  private saveUsers(data: PortalUser[]): void {
    this.users = data;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Failed to save portal users to storage', e);
    }
    this.notify();
  }

  private saveCurrentUser(user: PortalUser | null): void {
    this.currentUser = user;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (user) {
          localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
        }
      }
    } catch (e) {
      console.warn('Failed to save current user to storage', e);
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('UserPortalService listener error:', err);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lankaproperty:auth-update'));
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Assigns realistic ownership to seed properties if not yet assigned,
   * so Super Admin can immediately see who listed what!
   */
  private syncInitialPropertyOwnership(): void {
    try {
      const allProps = propertyService.getAllAuthoritativeProperties();
      let updated = false;

      allProps.forEach((p, idx) => {
        if (!p.listedByUserId) {
          updated = true;
          if (idx % 2 === 0) {
            // Assign to an Owner
            const owner = this.users.find((u) => u.role === 'owner') || this.users[0];
            p.listedByUserId = owner.id;
            p.listedByRole = 'owner';
            p.listedByName = owner.name;
            p.listedByEmail = owner.email;
            p.selectedPackageId = owner.activePackageId;
          } else {
            // Assign to an Agent
            const agent = this.users.find((u) => u.role === 'agent') || this.users[3];
            p.listedByUserId = agent.id;
            p.listedByRole = 'agent';
            p.listedByName = agent.name;
            p.listedByEmail = agent.email;
            p.selectedPackageId = agent.activePackageId;
          }
        }
      });

      if (updated) {
        // Properties have been enriched
      }
    } catch {
      // ignore
    }
  }

  getCurrentUser(): PortalUser | null {
    return this.currentUser;
  }

  getAllUsers(): PortalUser[] {
    return [...this.users];
  }

  login(email: string, role: PortalRole): { success: boolean; user?: PortalUser; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const found = this.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.role === role
    );

    if (found) {
      if (found.status === 'suspended') {
        return { success: false, error: 'Your account has been suspended by the administrator.' };
      }
      this.saveCurrentUser(found);
      return { success: true, user: found };
    }

    // Auto-create account if new for seamless demo experience
    const newId = `${role}-${Date.now().toString().slice(-4)}`;
    const defaultPackage = role === 'agent' ? 'premium-pro' : 'free';
    const newUser: PortalUser = {
      id: newId,
      name: cleanEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || (role === 'owner' ? 'Property Owner' : 'Real Estate Agent'),
      email: cleanEmail,
      phone: '+94 77 000 0000',
      whatsapp: '+94 77 000 0000',
      role,
      agencyName: role === 'agent' ? 'Ceylon Independent Agency' : undefined,
      activePackageId: defaultPackage,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
      district: 'Colombo',
    };

    const updated = [newUser, ...this.users];
    this.saveUsers(updated);
    this.saveCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  register(accountData: {
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    role: PortalRole;
    agencyName?: string;
    licenseNumber?: string;
    packageId?: string;
    district?: string;
  }): { success: boolean; user: PortalUser } {
    const newId = `${accountData.role}-${Date.now().toString().slice(-4)}`;
    const defaultPackage = accountData.packageId || (accountData.role === 'agent' ? 'premium-pro' : 'free');

    const newUser: PortalUser = {
      id: newId,
      name: accountData.name.trim(),
      email: accountData.email.trim().toLowerCase(),
      phone: accountData.phone.trim(),
      whatsapp: accountData.whatsapp.trim() || accountData.phone.trim(),
      role: accountData.role,
      agencyName: accountData.agencyName?.trim(),
      licenseNumber: accountData.licenseNumber?.trim(),
      activePackageId: defaultPackage,
      joinedAt: new Date().toISOString().split('T')[0],
      status: 'active',
      district: accountData.district || 'Colombo',
    };

    const updated = [newUser, ...this.users];
    this.saveUsers(updated);
    this.saveCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  loginDemoUser(userId: string): PortalUser | null {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.saveCurrentUser(user);
      return user;
    }
    return null;
  }

  logout(): void {
    this.saveCurrentUser(null);
  }

  updateUserPackage(userId: string, packageId: string): void {
    const updated = this.users.map((u) => {
      if (u.id === userId) {
        return { ...u, activePackageId: packageId };
      }
      return u;
    });
    this.saveUsers(updated);
    if (this.currentUser && this.currentUser.id === userId) {
      this.saveCurrentUser({ ...this.currentUser, activePackageId: packageId });
    }
  }

  updateUserStatus(userId: string, status: 'active' | 'suspended'): void {
    const updated = this.users.map((u) => (u.id === userId ? { ...u, status } : u));
    this.saveUsers(updated);
  }

  deleteUser(userId: string): void {
    const updated = this.users.filter((u) => u.id !== userId);
    this.saveUsers(updated);
    if (this.currentUser?.id === userId) {
      this.saveCurrentUser(null);
    }
  }

  /**
   * Retrieves all properties listed by a specific user ID
   */
  getUserProperties(userId: string): AdminPropertyRecord[] {
    const all = propertyService.getAllAuthoritativeProperties();
    return all.filter((p) => p.listedByUserId === userId);
  }

  /**
   * Super Admin aggregated view:
   * Returns every Owner and Agent, with their listed property count, total valuation, and properties list.
   */
  getUsersWithListingStats() {
    const allProps = propertyService.getAllAuthoritativeProperties();

    return this.users.map((user) => {
      const userProps = allProps.filter((p) => p.listedByUserId === user.id);
      const totalValueLkr = userProps.reduce((sum, p) => sum + (p.priceLkr || 0), 0);
      return {
        ...user,
        propertyCount: userProps.length,
        totalValueLkr,
        properties: userProps,
      };
    });
  }
}

export const userPortalService = new UserPortalService();
