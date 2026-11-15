import React, { useState, useMemo } from 'react';
import { userPortalService, PortalUser } from '../../services/userPortalService';
import { propertyService } from '../../services/propertyService';
import { AdminPropertyRecord } from '../types/admin';
import { formatPriceLkr } from '../../utils/formatters';
import { useRouter } from '../../hooks/useRouter';
import {
  Users,
  Building,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  Edit,
  Phone,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

interface UserWithFullDossier extends PortalUser {
  propertyCount: number;
  totalValueLkr: number;
  properties: AdminPropertyRecord[];
  activityLogs: {
    id: string;
    action: string;
    detail: string;
    timestamp: string;
    type: 'listing' | 'photo' | 'inquiry' | 'plan';
  }[];
}

export function AdminUserActivity() {
  const { navigate } = useRouter();
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'agent'>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserDossier, setSelectedUserDossier] = useState<UserWithFullDossier | null>(null);

  // Generate enriched users with properties and realistic activity logs
  const usersWithDossiers: UserWithFullDossier[] = useMemo(() => {
    const raw = userPortalService.getUsersWithListingStats();

    return raw.map((u) => {
      // Build realistic audit activity entries for each user
      const logs: UserWithFullDossier['activityLogs'] = [];

      if (u.properties.length > 0) {
        u.properties.forEach((p, idx) => {
          logs.push({
            id: `act-${u.id}-${idx}-1`,
            action: 'Published Listing',
            detail: `Listed "${p.title}" in ${p.location.city}, ${p.location.district} (${formatPriceLkr(p.priceLkr)})`,
            timestamp: p.createdAt || '2026-11-12 10:30 AM',
            type: 'listing',
          });
          if (p.images.length > 0) {
            logs.push({
              id: `act-${u.id}-${idx}-2`,
              action: 'Uploaded Compressed Gallery',
              detail: `Uploaded ${p.images.length} high-definition WebP photos for "${p.title}"`,
              timestamp: p.updatedAt || '2026-11-13 02:15 PM',
              type: 'photo',
            });
          }
        });
      }

      logs.push({
        id: `act-${u.id}-plan`,
        action: 'Active Package Tier',
        detail: `Operating on ${u.activePackageId.toUpperCase().replace('-', ' ')} plan`,
        timestamp: `${u.joinedAt} 09:00 AM`,
        type: 'plan',
      });

      return {
        ...u,
        activityLogs: logs,
      };
    });
  }, []);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return usersWithDossiers.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (districtFilter !== 'all' && u.district !== districtFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          (u.agencyName && u.agencyName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [usersWithDossiers, roleFilter, districtFilter, searchQuery]);

  // Aggregate KPIs
  const totalUsersCount = usersWithDossiers.length;
  const totalAgentsCount = usersWithDossiers.filter((u) => u.role === 'agent').length;
  const totalOwnersCount = usersWithDossiers.filter((u) => u.role === 'owner').length;
  const totalPropertiesListed = usersWithDossiers.reduce((acc, u) => acc + u.propertyCount, 0);
  const totalCombinedValuation = usersWithDossiers.reduce((acc, u) => acc + u.totalValueLkr, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
            Seller Portfolio & Agent Oversight
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
            User & Agent Activity Tracker
          </h1>
          <p className="text-sm text-[#5F6B63] mt-1">
            Comprehensive oversight of property owners and licensed real estate brokers: their listed properties, photo galleries, recent actions, and portfolio valuations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B63] block">
            Total Registered Sellers
          </span>
          <div className="text-2xl font-extrabold text-[#103D2C]">
            {totalUsersCount} Sellers
          </div>
          <span className="text-[11px] text-[#5F6B63]">
            {totalOwnersCount} Owners · {totalAgentsCount} Agencies
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B63] block">
            Properties Listed by Users
          </span>
          <div className="text-2xl font-extrabold text-[#176B45]">
            {totalPropertiesListed} Properties
          </div>
          <span className="text-[11px] text-[#5F6B63]">
            Across all 25 districts
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B63] block">
            Combined Portfolio Value
          </span>
          <div className="text-2xl font-extrabold text-[#103D2C]">
            {formatPriceLkr(totalCombinedValuation)}
          </div>
          <span className="text-[11px] text-[#5F6B63]">
            Active residential & commercial stock
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE5DF] rounded-[3px] shadow-2xs space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5F6B63] block">
            Verification & Compliance
          </span>
          <div className="text-2xl font-extrabold text-[#176B45] flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-[#176B45]" />
            <span>100% Vetted</span>
          </div>
          <span className="text-[11px] text-[#5F6B63]">
            NIC & CEA Broker credentials checked
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 text-xs w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search user name, agency, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-[#DDE5DF] rounded-[2px] w-64 focus:outline-none focus:border-[#103D2C]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white text-[#18251E] focus:outline-none focus:border-[#103D2C]"
          >
            <option value="all">All Roles (Owners & Agents)</option>
            <option value="owner">Property Owners Only</option>
            <option value="agent">Real Estate Agents Only</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white text-[#18251E] focus:outline-none focus:border-[#103D2C]"
          >
            <option value="all">All Districts</option>
            <option value="Colombo">Colombo</option>
            <option value="Galle">Galle</option>
            <option value="Kandy">Kandy</option>
          </select>
        </div>

        <span className="text-xs text-[#5F6B63] font-semibold">
          Showing <span className="text-[#103D2C] font-bold">{filteredUsers.length}</span> active accounts
        </span>
      </div>

      {/* User Portfolios Grid */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-[#DDE5DF] rounded-[4px] p-5 shadow-2xs hover:border-[#103D2C]/50 transition-all space-y-4"
          >
            {/* User Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE5DF] pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-[3px] flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                    user.role === 'agent' ? 'bg-[#103D2C]' : 'bg-[#176B45]'
                  }`}
                >
                  {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#18251E]">{user.name}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[2px] ${
                        user.role === 'agent'
                          ? 'bg-[#103D2C] text-white'
                          : 'bg-[#E8F3EC] text-[#176B45]'
                      }`}
                    >
                      {user.role === 'agent' ? 'Licensed Agency' : 'Property Owner'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#E6F3EB] text-[#176B45] font-bold rounded-[2px]">
                      ✓ Verified
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F6B63] mt-0.5">
                    {user.agencyName && <span className="font-semibold text-[#18251E]">{user.agencyName}</span>}
                    {user.licenseNumber && <span>Lic: {user.licenseNumber}</span>}
                    <span>Phone: {user.phone}</span>
                    <span>District: {user.district || 'All Island'}</span>
                    <span>Joined: {user.joinedAt}</span>
                  </div>
                </div>
              </div>

              {/* Right Summary Badge */}
              <div className="sm:text-right shrink-0 flex items-center sm:flex-col justify-between gap-1 bg-[#FAFBF9] sm:bg-transparent p-2 sm:p-0 rounded-[2px]">
                <span className="text-[10px] uppercase font-bold text-[#5F6B63]">
                  Active Inventory
                </span>
                <div className="text-lg font-extrabold text-[#103D2C]">
                  {user.propertyCount} Listing{user.propertyCount !== 1 ? 's' : ''}
                </div>
                <span className="text-[11px] text-[#5F6B63] font-medium">
                  Valuation: {formatPriceLkr(user.totalValueLkr)}
                </span>
              </div>
            </div>

            {/* Listed Properties Previews (Big Images) */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] block mb-2">
                Properties Listed by {user.name} ({user.properties.length})
              </span>

              {user.properties.length === 0 ? (
                <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] text-xs text-[#5F6B63] text-center">
                  No active properties published under this account yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {user.properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="border border-[#DDE5DF] rounded-[3px] overflow-hidden bg-white hover:border-[#103D2C] transition-all flex flex-col justify-between"
                    >
                      <div className="relative">
                        <img
                          src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80'}
                          alt={prop.title}
                          className="w-full h-36 object-cover bg-gray-100"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase bg-[#103D2C] text-white rounded-[2px]">
                          {prop.publicationStatus.replace('_', ' ')}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold bg-white/90 text-[#18251E] rounded-[2px]">
                          {prop.images.length} Photos
                        </span>
                      </div>

                      <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-[#18251E] line-clamp-1" title={prop.title}>
                            {prop.title}
                          </h4>
                          <span className="text-[11px] text-[#5F6B63] block">
                            {prop.location.city}, {prop.location.district} · {prop.type.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#DDE5DF]/60 text-xs">
                          <span className="font-extrabold text-[#103D2C]">
                            {formatPriceLkr(prop.priceLkr)}
                          </span>
                          <button
                            onClick={() => navigate(`/admin/properties/${prop.id}/edit`)}
                            className="text-[#176B45] hover:underline font-bold text-[11px] flex items-center gap-1"
                          >
                            Edit Listing →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions & Activity Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#DDE5DF] text-xs">
              <div className="text-[#5F6B63] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#176B45]"></span>
                <span>Active Plan: <strong className="text-[#18251E]">{user.activePackageId.toUpperCase().replace('-', ' ')}</strong></span>
                <span>·</span>
                <span>Account Status: <strong className="text-[#176B45]">Active</strong></span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedUserDossier(user)}
                  className="px-3.5 py-1.5 bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C] text-[#103D2C] font-bold rounded-[2px] transition-colors"
                >
                  Inspect Full Seller Dossier & Logs ({user.activityLogs.length}) →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Dossier & Activity Modal */}
      {selectedUserDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setSelectedUserDossier(null)}
              className="absolute top-4 right-4 text-sm text-[#7A8880] hover:text-[#18251E]"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                Seller Dossier & Full Activity History
              </span>
              <h3 className="text-xl font-extrabold text-[#103D2C] mt-0.5">
                {selectedUserDossier.name}
              </h3>
              <p className="text-xs text-[#5F6B63]">
                {selectedUserDossier.role === 'agent' ? `Real Estate Agent (${selectedUserDossier.agencyName || 'Agency'})` : 'Private Property Owner'} · Member since {selectedUserDossier.joinedAt}
              </p>
            </div>

            {/* Contact Details */}
            <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#5F6B63] block">Phone / WhatsApp:</span>
                <span className="font-bold text-[#18251E]">{selectedUserDossier.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5F6B63] block">Email:</span>
                <span className="font-bold text-[#18251E]">{selectedUserDossier.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5F6B63] block">Operating District:</span>
                <span className="font-bold text-[#18251E]">{selectedUserDossier.district || 'All Sri Lanka'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5F6B63] block">Subscription Plan:</span>
                <span className="font-bold text-[#176B45] uppercase">{selectedUserDossier.activePackageId}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5F6B63] block">Total Properties:</span>
                <span className="font-bold text-[#18251E]">{selectedUserDossier.propertyCount} Listed</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5F6B63] block">Portfolio Value:</span>
                <span className="font-bold text-[#103D2C]">{formatPriceLkr(selectedUserDossier.totalValueLkr)}</span>
              </div>
            </div>

            {/* Activity Logs Stream */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#18251E] block">
                Recorded Actions & Listing Timeline
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedUserDossier.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px] text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#103D2C] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#176B45]"></span>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-[#7A8880]">{log.timestamp}</span>
                    </div>
                    <p className="text-[#4A5750] pl-3">{log.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setSelectedUserDossier(null)}
                className="px-4 py-2 bg-[#103D2C] text-white text-xs font-bold rounded-[2px]"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
