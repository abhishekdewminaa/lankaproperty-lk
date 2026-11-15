import React, { useState, useMemo } from 'react';
import { useRouter } from '../../hooks/useRouter';
import { userPortalService, PortalUser } from '../../services/userPortalService';
import { propertyService } from '../../services/propertyService';
import { AdminPropertyRecord } from '../types/admin';
import { formatPriceLkr } from '../../utils/formatters';

const PACKAGE_LABELS: Record<string, string> = {
  free: 'Starter Free',
  'premium-pro': 'Premium Pro (Rs. 4,500)',
  platinum: 'Platinum Monograph (Rs. 25,000)',
  diamond: 'Diamond Sovereign (Rs. 45,000)',
};

export function AdminUsersAndAgents() {
  const { navigate } = useRouter();

  // Local state for re-rendering when portal service updates
  const [usersStats, setUsersStats] = useState(() => userPortalService.getUsersWithListingStats());
  const [allProperties, setAllProperties] = useState(() => propertyService.getAllAuthoritativeProperties());

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'agent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');

  // Inspect Modal State
  const [inspectingUser, setInspectingUser] = useState<PortalUser | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Refresh helper
  const refreshData = () => {
    setUsersStats(userPortalService.getUsersWithListingStats());
    setAllProperties(propertyService.getAllAuthoritativeProperties());
  };

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // KPI Calculations
  const totalUsers = usersStats.length;
  const ownerCount = usersStats.filter((u) => u.role === 'owner').length;
  const agentCount = usersStats.filter((u) => u.role === 'agent').length;
  const totalUserProperties = usersStats.reduce((sum, u) => sum + u.propertyCount, 0);
  const totalUserValuationLkr = usersStats.reduce((sum, u) => sum + u.totalValueLkr, 0);

  // Filtered accounts list
  const filteredUsers = useMemo(() => {
    return usersStats.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (packageFilter !== 'all' && u.activePackageId !== packageFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          (u.agencyName && u.agencyName.toLowerCase().includes(q)) ||
          (u.district && u.district.toLowerCase().includes(q)) ||
          (u.licenseNumber && u.licenseNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [usersStats, roleFilter, statusFilter, packageFilter, searchQuery]);

  // Handle Package Update by Super Admin
  const handleUpdatePackage = (userId: string, newPackage: string) => {
    userPortalService.updateUserPackage(userId, newPackage);
    refreshData();
    showNotification(`Package tier successfully updated for user.`);
  };

  // Handle Status Toggle (Active / Suspended)
  const handleToggleStatus = (userId: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    userPortalService.updateUserStatus(userId, nextStatus);
    refreshData();
    showNotification(`User account status marked as ${nextStatus.toUpperCase()}.`);
  };

  // Handle Delete User
  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete account "${userName}"? This will not delete their properties, but unlinks their portal login.`)) {
      userPortalService.deleteUser(userId);
      refreshData();
      if (inspectingUser?.id === userId) {
        setInspectingUser(null);
      }
      showNotification(`Account ${userName} has been removed.`);
    }
  };

  // Handle Impersonation / 1-Click Login
  const handleImpersonate = (user: PortalUser) => {
    userPortalService.loginDemoUser(user.id);
    const destination = user.role === 'agent' ? '/agent/dashboard' : '/owner/dashboard';
    window.open(destination, '_blank');
  };

  // Inspect Modal: Change Property Status
  const handlePropertyStatusChange = (propertyId: string, newStatus: string) => {
    propertyService.updatePropertyStatus(propertyId, newStatus as any);
    refreshData();
    showNotification(`Property ${propertyId} status changed to ${newStatus.toUpperCase()}`);
  };

  // Inspect Modal: Delete Property
  const handleDeleteProperty = (propertyId: string, propertyTitle: string) => {
    if (window.confirm(`Permanently remove property listing "${propertyTitle}"?`)) {
      propertyService.deleteProperty(propertyId);
      refreshData();
      showNotification(`Property "${propertyTitle}" deleted from system.`);
    }
  };

  // Active user's properties for the inspection drawer
  const userPropertiesForModal: AdminPropertyRecord[] = useMemo(() => {
    if (!inspectingUser) return [];
    return allProperties.filter((p) => p.listedByUserId === inspectingUser.id);
  }, [inspectingUser, allProperties]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#103D2C] text-white border border-[#176B45] text-xs font-bold px-4 py-3 rounded-[3px] shadow-xl flex items-center gap-3">
          <span className="w-2 h-2 rounded-[1px] bg-white"></span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-5">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-widest text-[#176B45]">
            Master Directory & Ownership Control
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1 tracking-tight">
            Property Owners & Real Estate Agents
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6B63] mt-1 max-w-3xl">
            Institutional directory of registered property owners and verified real estate agents. As Super Admin, you have full authority to inspect all listings authored by any user, edit prices and photos, change publication status, or adjust subscription packages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/list-property')}
            className="px-4 py-2.5 bg-[#176B45] hover:bg-[#103D2C] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors"
          >
            + Create New Listing
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] block">
            Total Accounts
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#18251E] tabular-nums block mt-1">
            {totalUsers}
          </span>
          <span className="text-[11px] text-[#5F6B63] block mt-0.5">Owners & Registered Agencies</span>
        </div>

        <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] block">
            Property Owners
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#176B45] tabular-nums block mt-1">
            {ownerCount}
          </span>
          <span className="text-[11px] text-[#5F6B63] block mt-0.5">Private individuals</span>
        </div>

        <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] block">
            Real Estate Agents
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] tabular-nums block mt-1">
            {agentCount}
          </span>
          <span className="text-[11px] text-[#5F6B63] block mt-0.5">Licensed brokerages</span>
        </div>

        <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] block">
            User-Listed Properties
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#18251E] tabular-nums block mt-1">
            {totalUserProperties}
          </span>
          <span className="text-[11px] text-[#176B45] font-semibold block mt-0.5">Assigned & Tracked</span>
        </div>

        <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 shadow-2xs col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63] block">
            Total Valuation
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#176B45] tabular-nums block mt-1 truncate">
            Rs. {(totalUserValuationLkr / 1000000).toFixed(1)}M
          </span>
          <span className="text-[11px] text-[#5F6B63] block mt-0.5">User Portfolio Value</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 border border-[#DDE5DF] p-1 rounded-[3px] bg-[#FAFBF9]">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
                roleFilter === 'all'
                  ? 'bg-[#103D2C] text-white'
                  : 'text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              All Accounts ({totalUsers})
            </button>
            <button
              onClick={() => setRoleFilter('owner')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
                roleFilter === 'owner'
                  ? 'bg-[#176B45] text-white'
                  : 'text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Property Owners ({ownerCount})
            </button>
            <button
              onClick={() => setRoleFilter('agent')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
                roleFilter === 'agent'
                  ? 'bg-[#176B45] text-white'
                  : 'text-[#5F6B63] hover:text-[#18251E]'
              }`}
            >
              Real Estate Agents ({agentCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name, email, agency, phone, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-[#DDE5DF] rounded-[3px] focus:outline-none focus:border-[#176B45] bg-[#FAFBF9] text-[#18251E]"
            />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#DDE5DF] text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#5F6B63] uppercase tracking-wider text-[10px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 bg-white border border-[#DDE5DF] rounded-[2px] text-xs font-medium text-[#18251E]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-[#5F6B63] uppercase tracking-wider text-[10px]">Package:</span>
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-[#DDE5DF] rounded-[2px] text-xs font-medium text-[#18251E]"
            >
              <option value="all">All Packages</option>
              <option value="free">Starter Free</option>
              <option value="premium-pro">Premium Pro</option>
              <option value="platinum">Platinum Monograph</option>
              <option value="diamond">Diamond Sovereign</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || packageFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
                setPackageFilter('all');
              }}
              className="text-[#C93636] font-bold text-xs hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Master Data Table */}
      <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F5F8F5] border-b border-[#DDE5DF] text-[#5F6B63] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">User / Agent Name</th>
                <th className="py-3 px-4">Role & Organization</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Active Package</th>
                <th className="py-3 px-4 text-center">Listed Properties</th>
                <th className="py-3 px-4">Total Valuation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF]">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F8F5]/50 transition-colors">
                    {/* User Name & ID */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-[#18251E] text-sm block">{u.name}</span>
                        <span className="text-[10px] text-[#5F6B63] block font-medium">
                          ID: {u.id} · Joined: {u.joinedAt}
                        </span>
                      </div>
                    </td>

                    {/* Role & Agency */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                            u.role === 'agent'
                              ? 'bg-[#103D2C] text-white'
                              : 'bg-[#E8F3EC] text-[#176B45] border border-[#176B45]/20'
                          }`}
                        >
                          {u.role === 'agent' ? 'Real Estate Agent' : 'Property Owner'}
                        </span>
                        {u.agencyName && (
                          <span className="text-xs font-semibold text-[#18251E] block">
                            {u.agencyName}
                          </span>
                        )}
                        {u.licenseNumber && (
                          <span className="text-[10px] text-[#5F6B63] block">
                            Lic: {u.licenseNumber}
                          </span>
                        )}
                        {u.district && (
                          <span className="text-[10px] text-[#5F6B63] block">
                            District: {u.district}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-xs text-[#5F6B63]">
                        <span className="font-medium text-[#18251E] block">{u.email}</span>
                        <span className="block tabular-nums">Tel: {u.phone}</span>
                        <span className="block text-[#176B45] font-medium tabular-nums">WA: {u.whatsapp}</span>
                      </div>
                    </td>

                    {/* Package Selector (Direct Edit) */}
                    <td className="py-3.5 px-4">
                      <select
                        value={u.activePackageId}
                        onChange={(e) => handleUpdatePackage(u.id, e.target.value)}
                        className="text-xs font-semibold border border-[#DDE5DF] rounded-[2px] px-2 py-1 bg-white text-[#18251E] focus:outline-none focus:border-[#176B45]"
                      >
                        <option value="free">Starter Free</option>
                        <option value="premium-pro">Premium Pro</option>
                        <option value="platinum">Platinum Monograph</option>
                        <option value="diamond">Diamond Sovereign</option>
                      </select>
                      <span className="text-[10px] text-[#5F6B63] block mt-0.5">
                        {PACKAGE_LABELS[u.activePackageId] || u.activePackageId}
                      </span>
                    </td>

                    {/* Listed Properties Count with Direct Click to Inspect */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setInspectingUser(u)}
                        className={`inline-block font-extrabold text-sm px-2.5 py-1 rounded-[2px] transition-colors tabular-nums ${
                          u.propertyCount > 0
                            ? 'bg-[#E8F3EC] text-[#103D2C] hover:bg-[#176B45] hover:text-white border border-[#176B45]/30'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title="Click to inspect all properties listed by this user"
                      >
                        {u.propertyCount} Listed →
                      </button>
                    </td>

                    {/* Total Valuation */}
                    <td className="py-3.5 px-4 font-bold text-[#103D2C] tabular-nums whitespace-nowrap">
                      {u.totalValueLkr > 0 ? (
                        <>Rs. {(u.totalValueLkr / 1000000).toFixed(1)}M</>
                      ) : (
                        <span className="text-[#5F6B63] font-normal">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                          u.status === 'active'
                            ? 'bg-[#E8F3EC] text-[#103D2C]'
                            : 'bg-red-100 text-[#C93636]'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    {/* Super Admin Action Controls */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Inspect Listings */}
                        <button
                          onClick={() => setInspectingUser(u)}
                          className="px-2.5 py-1 bg-[#176B45] hover:bg-[#103D2C] text-white text-[11px] font-bold rounded-[2px] transition-colors"
                          title="Inspect, Edit, and Delete properties listed by this user"
                        >
                          Inspect ({u.propertyCount})
                        </button>

                        {/* Impersonate / Open Portal */}
                        <button
                          onClick={() => handleImpersonate(u)}
                          className="px-2 py-1 bg-white border border-[#DDE5DF] hover:border-[#176B45] text-[#18251E] text-[11px] font-medium rounded-[2px] transition-colors"
                          title="Open user's portal view in a new tab"
                        >
                          Open Portal ↗
                        </button>

                        {/* Status Toggle */}
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`px-2 py-1 text-[11px] font-medium rounded-[2px] border transition-colors ${
                            u.status === 'active'
                              ? 'border-[#DDE5DF] text-[#5F6B63] hover:text-[#C93636]'
                              : 'border-[#176B45] text-[#176B45] hover:bg-[#E8F3EC]'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-2 py-1 text-[11px] font-bold text-[#C93636] hover:bg-red-50 rounded-[2px] transition-colors"
                          title="Remove user account"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#5F6B63] text-sm">
                    No registered property owners or agents matched your current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Listed Properties Drawer / Modal */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="bg-[#103D2C] text-white p-5 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#FAFBF9]/70 block">
                  Super Admin Property Inspector
                </span>
                <h2 className="text-xl font-extrabold mt-0.5">
                  Properties Listed by: {inspectingUser.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#FAFBF9]/80">
                  <span>Role: <strong>{inspectingUser.role.toUpperCase()}</strong></span>
                  {inspectingUser.agencyName && <span>Agency: <strong>{inspectingUser.agencyName}</strong></span>}
                  <span>Email: <strong>{inspectingUser.email}</strong></span>
                  <span>Active Plan: <strong>{inspectingUser.activePackageId}</strong></span>
                  <span>Count: <strong>{userPropertiesForModal.length} Properties</strong></span>
                </div>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="text-white hover:text-[#FAFBF9]/80 text-xl font-bold px-2 py-1 leading-none rounded-[2px]"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#FAFBF9]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#18251E]">
                  Authoritative Property Inventory ({userPropertiesForModal.length})
                </h3>
                <span className="text-xs text-[#5F6B63]">
                  Super Admin can edit details, change publication status, or delete any listing below.
                </span>
              </div>

              {userPropertiesForModal.length > 0 ? (
                <div className="space-y-3">
                  {userPropertiesForModal.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-white border border-[#DDE5DF] hover:border-[#176B45]/40 rounded-[3px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs transition-colors"
                    >
                      {/* Left: Image & Specs */}
                      <div className="flex items-start gap-4">
                        <img
                          src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'}
                          alt={prop.title}
                          className="w-20 h-16 object-cover rounded-[2px] bg-stone-100 border border-[#DDE5DF] shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#176B45] uppercase tracking-wider block">
                            {prop.type} · {prop.purpose} · {prop.location.city}, {prop.location.district}
                          </span>
                          <h4 className="font-extrabold text-[#18251E] text-base leading-snug">
                            {prop.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#5F6B63]">
                            <span className="font-bold text-[#103D2C]">
                              {formatPriceLkr(prop.priceLkr, prop.priceUnit, true)}
                            </span>
                            <span>·</span>
                            <span>{prop.specs.beds ? `${prop.specs.beds} Beds` : `${prop.specs.landExtentPerches || 0} Perches`}</span>
                            <span>·</span>
                            <span>{prop.specs.sqft ? `${prop.specs.sqft} sqft` : 'Direct Plot'}</span>
                            <span>·</span>
                            <span>Photos: {prop.images.length}/20</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Super Admin Instant Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#DDE5DF]">
                        {/* Status Dropdown */}
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-[#5F6B63] block mb-0.5">
                            Status
                          </label>
                          <select
                            value={prop.publicationStatus}
                            onChange={(e) => handlePropertyStatusChange(prop.id, e.target.value)}
                            className="text-xs font-bold border border-[#DDE5DF] rounded-[2px] px-2.5 py-1.5 bg-white text-[#18251E] focus:outline-none focus:border-[#176B45]"
                          >
                            <option value="published">Published (Live)</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto mt-2 sm:mt-3">
                          <button
                            onClick={() => {
                              setInspectingUser(null);
                              navigate(`/admin/properties/${prop.id}/edit`);
                            }}
                            className="px-3 py-1.5 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[2px] transition-colors"
                            title="Edit full specifications, price, and photos in Super Admin editor"
                          >
                            Edit Property
                          </button>

                          <a
                            href={`/properties/${prop.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-white border border-[#DDE5DF] hover:border-[#176B45] text-[#18251E] text-xs font-semibold rounded-[2px] transition-colors"
                            title="Preview live public listing"
                          >
                            View Live ↗
                          </a>

                          <button
                            onClick={() => handleDeleteProperty(prop.id, prop.title)}
                            className="px-2.5 py-1.5 text-xs font-bold text-[#C93636] hover:bg-red-50 rounded-[2px] transition-colors"
                            title="Permanently remove this property"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-8 text-center space-y-2">
                  <p className="font-bold text-[#18251E]">No properties listed yet by this account.</p>
                  <p className="text-xs text-[#5F6B63]">
                    The owner or agent has registered but has not yet published any real estate listing.
                  </p>
                  <button
                    onClick={() => {
                      userPortalService.loginDemoUser(inspectingUser.id);
                      navigate('/list-property');
                    }}
                    className="mt-2 inline-block px-4 py-2 bg-[#176B45] text-white text-xs font-bold uppercase rounded-[2px]"
                  >
                    + Post Property For This User
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-[#DDE5DF] p-4 flex items-center justify-between text-xs">
              <span className="text-[#5F6B63]">
                Super Admin Master Access Active
              </span>
              <button
                onClick={() => setInspectingUser(null)}
                className="px-4 py-2 bg-[#18251E] text-white font-bold rounded-[2px] hover:bg-black transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
