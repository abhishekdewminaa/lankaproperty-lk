import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffUser, AdminRole, AdminPermissionSet } from '../types/admin';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissionSet> = {
  super_admin: {
    canViewListings: true,
    canCreateListings: true,
    canEditListings: true,
    canPublishListings: true,
    canArchiveListings: true,
    canDeleteListings: true,
    canManageHomepage: true,
    canManageCollections: true,
    canManageInquiries: true,
    canAssignLeads: true,
    canScheduleViewings: true,
    canManageUsers: true,
    canManageRoles: true,
    canManageBilling: true,
    canManageContentSeo: true,
    canManageMedia: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageSettings: true,
    canViewAudit: true,
  },
  listing_manager: {
    canViewListings: true,
    canCreateListings: true,
    canEditListings: true,
    canPublishListings: true,
    canArchiveListings: true,
    canDeleteListings: false,
    canManageHomepage: false,
    canManageCollections: true,
    canManageInquiries: false,
    canAssignLeads: false,
    canScheduleViewings: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageBilling: false,
    canManageContentSeo: false,
    canManageMedia: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageSettings: false,
    canViewAudit: false,
  },
  sales_manager: {
    canViewListings: true,
    canCreateListings: false,
    canEditListings: false,
    canPublishListings: false,
    canArchiveListings: false,
    canDeleteListings: false,
    canManageHomepage: false,
    canManageCollections: false,
    canManageInquiries: true,
    canAssignLeads: true,
    canScheduleViewings: true,
    canManageUsers: false,
    canManageRoles: false,
    canManageBilling: false,
    canManageContentSeo: false,
    canManageMedia: false,
    canViewAnalytics: true,
    canExportData: true,
    canManageSettings: false,
    canViewAudit: false,
  },
  marketing_manager: {
    canViewListings: true,
    canCreateListings: false,
    canEditListings: false,
    canPublishListings: false,
    canArchiveListings: false,
    canDeleteListings: false,
    canManageHomepage: true,
    canManageCollections: true,
    canManageInquiries: false,
    canAssignLeads: false,
    canScheduleViewings: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageBilling: false,
    canManageContentSeo: true,
    canManageMedia: true,
    canViewAnalytics: true,
    canExportData: true,
    canManageSettings: false,
    canViewAudit: false,
  },
  finance_manager: {
    canViewListings: true,
    canCreateListings: false,
    canEditListings: false,
    canPublishListings: false,
    canArchiveListings: false,
    canDeleteListings: false,
    canManageHomepage: false,
    canManageCollections: false,
    canManageInquiries: false,
    canAssignLeads: false,
    canScheduleViewings: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageBilling: true,
    canManageContentSeo: false,
    canManageMedia: false,
    canViewAnalytics: true,
    canExportData: true,
    canManageSettings: false,
    canViewAudit: true,
  },
  readonly_analyst: {
    canViewListings: true,
    canCreateListings: false,
    canEditListings: false,
    canPublishListings: false,
    canArchiveListings: false,
    canDeleteListings: false,
    canManageHomepage: false,
    canManageCollections: false,
    canManageInquiries: false,
    canAssignLeads: false,
    canScheduleViewings: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageBilling: false,
    canManageContentSeo: false,
    canManageMedia: false,
    canViewAnalytics: true,
    canExportData: false,
    canManageSettings: false,
    canViewAudit: false,
  },
};

export const INITIAL_STAFF_MEMBERS: StaffUser[] = [
  {
    id: 'staff-1',
    name: 'Dilshan Samarasinghe',
    email: 'dilshan.s@lankaproperty.lk',
    role: 'super_admin',
    department: 'Executive Leadership',
    title: 'Chief Technology Officer & Superadmin',
    phone: '+94 77 100 2000',
    isActive: true,
    lastLogin: '2026-10-05 10:45 AM',
    isProtected: true, // Primary protected superadmin
  },
  {
    id: 'staff-2',
    name: 'Chamari Perera',
    email: 'chamari.p@lankaproperty.lk',
    role: 'listing_manager',
    department: 'Property Operations',
    title: 'Senior Portfolio Director',
    phone: '+94 71 889 4321',
    isActive: true,
    lastLogin: '2026-10-05 09:12 AM',
  },
  {
    id: 'staff-3',
    name: 'Rohan Senanayake',
    email: 'rohan.s@lankaproperty.lk',
    role: 'sales_manager',
    department: 'Brokerage & Inquiries',
    title: 'Head of Client Acquisition',
    phone: '+94 77 992 1104',
    isActive: true,
    lastLogin: '2026-10-04 04:30 PM',
  },
  {
    id: 'staff-4',
    name: 'Asha Jayawardena',
    email: 'asha.j@lankaproperty.lk',
    role: 'marketing_manager',
    department: 'Editorial & Brand',
    title: 'Creative Director',
    phone: '+94 77 334 5566',
    isActive: true,
    lastLogin: '2026-10-05 08:45 AM',
  },
  {
    id: 'staff-5',
    name: 'Kavinda Fernando',
    email: 'kavinda.f@lankaproperty.lk',
    role: 'finance_manager',
    department: 'Accounts & Subscriptions',
    title: 'Financial Controller',
    phone: '+94 72 445 6677',
    isActive: true,
    lastLogin: '2026-10-03 11:20 AM',
  },
  {
    id: 'staff-6',
    name: 'Nirmani De Silva',
    email: 'nirmani.d@lankaproperty.lk',
    role: 'readonly_analyst',
    department: 'Market Research',
    title: 'Market Intelligence Analyst',
    phone: '+94 76 556 7788',
    isActive: true,
    lastLogin: '2026-10-05 07:15 AM',
  },
];

interface AdminAuthContextType {
  currentUser: StaffUser;
  currentRole: AdminRole;
  permissions: AdminPermissionSet;
  hasPermission: (permission: keyof AdminPermissionSet) => boolean;
  switchRole: (role: AdminRole) => void;
  staffMembers: StaffUser[];
  updateStaffUser: (user: StaffUser) => boolean;
  deleteStaffUser: (id: string) => { success: boolean; message?: string };
  addStaffUser: (user: Omit<StaffUser, 'id'>) => StaffUser;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>(() => {
    try {
      const saved = localStorage.getItem('lankaproperty_admin_staff');
      return saved ? JSON.parse(saved) : INITIAL_STAFF_MEMBERS;
    } catch {
      return INITIAL_STAFF_MEMBERS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>('staff-1');

  useEffect(() => {
    try {
      localStorage.setItem('lankaproperty_admin_staff', JSON.stringify(staffMembers));
    } catch (e) {
      console.warn('Could not persist staff members:', e);
    }
  }, [staffMembers]);

  const currentUser =
    staffMembers.find((s) => s.id === currentUserId) || staffMembers[0] || INITIAL_STAFF_MEMBERS[0];

  const currentRole = currentUser.role;
  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.readonly_analyst;

  const hasPermission = (permission: keyof AdminPermissionSet): boolean => {
    return !!permissions[permission];
  };

  // Safe role switcher for evaluation and demo auditing
  const switchRole = (newRole: AdminRole) => {
    const matchingStaff = staffMembers.find((s) => s.role === newRole);
    if (matchingStaff) {
      setCurrentUserId(matchingStaff.id);
    } else {
      // Temporarily update current user role
      setStaffMembers((prev) =>
        prev.map((s) => (s.id === currentUser.id ? { ...s, role: newRole } : s))
      );
    }
  };

  const updateStaffUser = (updated: StaffUser): boolean => {
    // Protect primary superadmin from demotion if they are the only active superadmin
    if (updated.isProtected && updated.role !== 'super_admin') {
      return false;
    }
    setStaffMembers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    return true;
  };

  const deleteStaffUser = (id: string): { success: boolean; message?: string } => {
    const target = staffMembers.find((s) => s.id === id);
    if (!target) return { success: false, message: 'User not found.' };

    if (target.isProtected) {
      return { success: false, message: 'Cannot delete the primary protected Superadmin account.' };
    }

    const superAdminCount = staffMembers.filter((s) => s.role === 'super_admin' && s.isActive).length;
    if (target.role === 'super_admin' && superAdminCount <= 1) {
      return { success: false, message: 'Cannot delete the last active Superadmin on the system.' };
    }

    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  const addStaffUser = (user: Omit<StaffUser, 'id'>): StaffUser => {
    const newUser: StaffUser = {
      ...user,
      id: `staff-${Date.now()}`,
    };
    setStaffMembers((prev) => [...prev, newUser]);
    return newUser;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        currentUser,
        currentRole,
        permissions,
        hasPermission,
        switchRole,
        staffMembers,
        updateStaffUser,
        deleteStaffUser,
        addStaffUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
