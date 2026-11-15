import React from 'react';
import { useRouter } from '../hooks/useRouter';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider, useAdminData } from './context/AdminDataContext';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProperties } from './pages/AdminProperties';
import { AdminPropertyEditor } from './pages/AdminPropertyEditor';
import { AdminHomepageEditor } from './pages/AdminHomepageEditor';
import { AdminUsersAndAgents } from './pages/AdminUsersAndAgents';
import { AdminWantedProperties } from './pages/AdminWantedProperties';
import { AdminUserActivity } from './pages/AdminUserActivity';
import { AdminPackageEditor } from './pages/AdminPackageEditor';
import { superAdminSecurityService } from '../services/superAdminSecurityService';
import { formatPriceLkr } from '../utils/formatters';
import {
  Inbox,
  CalendarDays,
  Users,
  CreditCard,
  FileText,
  Image as ImageIcon,
  BarChart3,
  Settings as SettingsIcon,
  ShieldAlert,
  Home,
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Eye,
} from 'lucide-react';

function AdminContent() {
  const { pathname, segments, navigate } = useRouter();
  const { currentUser, currentRole, hasPermission } = useAdminAuth();
  const {
    properties,
    inquiries,
    viewings,
    auditLogs,
    homepageConfig,
    invoices,
    plans,
    updatePropertyStatus,
    toggleCollectionPlacement,
    updateInquiryStage,
    updateViewingStatus,
  } = useAdminData();

  // Sub-route matching
  // /admin or /admin/
  if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/dashboard') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminDashboard />
      </AdminLayout>
    );
  }

  // /admin/properties
  if (pathname === '/admin/properties') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminProperties />
      </AdminLayout>
    );
  }

  // /admin/properties/new
  if (pathname === '/admin/properties/new') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminPropertyEditor />
      </AdminLayout>
    );
  }

  // /admin/properties/:id/edit
  if (segments[0] === 'admin' && segments[1] === 'properties' && segments[2] && segments[3] === 'edit') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminPropertyEditor propertyId={segments[2]} />
      </AdminLayout>
    );
  }

  // /admin/homepage (Homepage & Hero Placement)
  if (pathname === '/admin/homepage') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminHomepageEditor />
      </AdminLayout>
    );
  }

  // /admin/inquiries (Leads Pipeline)
  if (pathname === '/admin/inquiries') {
    return (
      <AdminLayout currentPath={pathname}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
                Leads & CRM
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
                Inquiries Pipeline
              </h1>
              <p className="text-sm text-[#5F6B63] mt-1">
                Manage prospective buyers, overseas investors, and scheduled private viewings.
              </p>
            </div>
            <div className="text-xs bg-white px-3 py-2 border border-[#DDE5DF] rounded-[3px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-[1px] bg-[#176B45]"></span>
              <span className="font-semibold text-[#18251E]">Total Leads: {inquiries.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white border border-[#DDE5DF] hover:border-[#176B45]/50 rounded-[4px] p-5 shadow-2xs space-y-3.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#DDE5DF] pb-2.5">
                  <span className="text-xs font-bold text-[#5F6B63] tabular-nums">{inq.referenceNumber}</span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded-[2px] ${
                      inq.stage === 'new'
                        ? 'bg-[#C93636] text-white'
                        : inq.stage === 'viewing_scheduled'
                        ? 'bg-[#176B45] text-white'
                        : 'bg-[#E8F3EC] text-[#103D2C]'
                    }`}
                  >
                    {inq.stage.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-[#18251E] text-base">{inq.customerName}</h3>
                  <p className="text-xs text-[#176B45] font-semibold mt-0.5">
                    Re: {inq.propertyTitle || 'General Catalog'}
                  </p>
                </div>

                <p className="text-xs text-[#5F6B63] line-clamp-3 bg-[#F5F8F5] p-2.5 rounded-[2px]">
                  "{inq.message}"
                </p>

                <div className="text-xs text-[#5F6B63] space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#176B45]" />
                    <span className="truncate">{inq.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#176B45]" />
                    <span>{inq.customerPhone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDE5DF] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#5F6B63]">Agent: {inq.assignedStaffName || 'Unassigned'}</span>
                  <select
                    value={inq.stage}
                    onChange={(e) => updateInquiryStage(inq.id, e.target.value as any)}
                    className="text-xs border border-[#DDE5DF] rounded-[2px] px-2 py-1 bg-white text-[#18251E] font-medium"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="viewing_scheduled">Viewing</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // /admin/viewings (Viewing Appointments)
  if (pathname === '/admin/viewings') {
    return (
      <AdminLayout currentPath={pathname}>
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
              Calendar & Logistics
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
              Private Viewing Appointments
            </h1>
            <p className="text-sm text-[#5F6B63] mt-1">
              Scheduled client inspections, chauffeur itineraries, and security access permissions.
            </p>
          </div>

          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F8F5] text-xs uppercase tracking-wider text-[#5F6B63] border-b border-[#DDE5DF]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Property</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Agent Assigned</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF]">
                  {viewings.map((v) => (
                    <tr key={v.id} className="hover:bg-[#F5F8F5]/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#18251E] tabular-nums">
                        {v.scheduledDate} · {v.scheduledTime}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#18251E]">{v.propertyTitle}</td>
                      <td className="py-3.5 px-4 text-[#5F6B63]">{v.customerName}</td>
                      <td className="py-3.5 px-4 text-[#5F6B63]">{v.assignedStaffName}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold uppercase rounded-[2px] ${
                            v.status === 'confirmed'
                              ? 'bg-[#176B45] text-white'
                              : v.status === 'scheduled'
                              ? 'bg-[#E8F3EC] text-[#103D2C]'
                              : 'bg-[#F5F8F5] text-[#5F6B63]'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={v.status}
                          onChange={(e) => updateViewingStatus(v.id, e.target.value as any)}
                          className="text-xs border border-[#DDE5DF] rounded-[2px] px-2 py-1 bg-white text-[#18251E]"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // /admin/wanted (Wanted Property Buyer Board Moderation)
  if (pathname === '/admin/wanted') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminWantedProperties />
      </AdminLayout>
    );
  }

  // /admin/audit (Audit & Security)
  if (pathname === '/admin/audit') {
    const securityLogs = superAdminSecurityService.getSecurityAuditLogs();
    const lockOnBlur = superAdminSecurityService.isLockOnBlurEnabled();

    return (
      <AdminLayout currentPath={pathname}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
                Compliance & Cryptographic Security
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
                Security Vault & System Audit Trail
              </h1>
              <p className="text-sm text-[#5F6B63] mt-1">
                Zero-plaintext SHA-256 authentication telemetry, brute-force intrusion logs, and platform change records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  superAdminSecurityService.setLockOnBlurEnabled(!lockOnBlur);
                }}
                className={`px-3 py-2 text-xs font-bold rounded-[3px] border transition-colors cursor-pointer ${
                  lockOnBlur
                    ? 'bg-[#103D2C] text-white border-[#103D2C]'
                    : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#176B45]'
                }`}
              >
                Auto-Lock on Tab Switch: {lockOnBlur ? 'ENABLED' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  superAdminSecurityService.logout();
                  navigate('/');
                }}
                className="px-3.5 py-2 bg-[#C93636] hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              >
                Lock Console Now
              </button>
            </div>
          </div>

          {/* Cryptographic Gatekeeper Access Telemetry */}
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#103D2C] text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider">
                  Gatekeeper Authentication & Intrusion Log
                </h2>
                <p className="text-xs text-[#FAFBF9]/80 mt-0.5">
                  Records every Ctrl + Shift + L login attempt, lockout trigger, and session integrity check.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#176B45] rounded-[2px]">
                SHA-256 + HMAC Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F8F5] uppercase tracking-wider text-[#5F6B63] border-b border-[#DDE5DF]">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp (UTC)</th>
                    <th className="py-2.5 px-4">Security Event</th>
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-4">Client Fingerprint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF]">
                  {securityLogs.length > 0 ? (
                    securityLogs.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#F5F8F5]/60">
                        <td className="py-2.5 px-4 text-[#5F6B63] tabular-nums whitespace-nowrap">
                          {entry.timestamp}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-[2px] ${
                              entry.event === 'AUTH_SUCCESS'
                                ? 'bg-[#E8F3EC] text-[#103D2C]'
                                : entry.event === 'LOCKOUT_TRIGGERED' || entry.event === 'TAMPER_DETECTED'
                                ? 'bg-[#C93636] text-white'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {entry.event.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#18251E]">{entry.details}</td>
                        <td className="py-2.5 px-4 text-[#5F6B63] truncate max-w-xs">{entry.userAgent}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 px-4 text-center text-[#5F6B63]">
                        No gatekeeper security events recorded in this browser storage yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F8F5] text-xs uppercase tracking-wider text-[#5F6B63] border-b border-[#DDE5DF]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Record</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F8F5]/60 transition-colors">
                      <td className="py-3 px-4 text-xs text-[#5F6B63] whitespace-nowrap tabular-nums">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#18251E]">{log.actorName}</td>
                      <td className="py-3 px-4 text-xs">
                        <span className="bg-[#E8F3EC] text-[#176B45] px-2 py-0.5 rounded-[2px] font-semibold">
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#18251E]">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#18251E]">{log.targetRecord}</td>
                      <td className="py-3 px-4 text-xs text-[#5F6B63] max-w-sm truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // /admin/users (Property Owners & Real Estate Agents Master Directory)
  if (pathname === '/admin/users') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminUsersAndAgents />
      </AdminLayout>
    );
  }

  // /admin/user-activity (User & Agent Activity Tracker & Listed Inventory)
  if (pathname === '/admin/user-activity') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminUserActivity />
      </AdminLayout>
    );
  }

  // /admin/packages (Superadmin Advertised Packages Editor)
  if (pathname === '/admin/packages') {
    return (
      <AdminLayout currentPath={pathname}>
        <AdminPackageEditor />
      </AdminLayout>
    );
  }

  // Fallback for any other /admin routes (collections, users, billing, analytics, settings, media, content, developments)
  return (
    <AdminLayout currentPath={pathname}>
      <div className="space-y-6">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
            Superadmin Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1 capitalize">
            {pathname.replace('/admin/', '').replace('-', ' ') || 'Management Console'}
          </h1>
          <p className="text-sm text-[#5F6B63] mt-1">
            Active module for LankaProperty enterprise operations, platform configuration, and catalog curation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 space-y-3">
            <div className="w-10 h-10 bg-[#E8F3EC] text-[#176B45] rounded-[3px] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#18251E] text-base">RBAC Security Active</h3>
            <p className="text-xs text-[#5F6B63] leading-relaxed">
              Logged in as <strong className="text-[#18251E]">{currentUser.name}</strong> ({currentRole.replace('_', ' ')}).
              Actions are authenticated and logged.
            </p>
          </div>

          <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 space-y-3">
            <div className="w-10 h-10 bg-[#E8F3EC] text-[#176B45] rounded-[3px] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#18251E] text-base">Live Data Synchronized</h3>
            <p className="text-xs text-[#5F6B63] leading-relaxed">
              Connected to real-time property inventory ({properties.length} listings, {inquiries.length} active leads).
            </p>
          </div>

          <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 space-y-3">
            <div className="w-10 h-10 bg-[#E8F3EC] text-[#176B45] rounded-[3px] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#18251E] text-base">Quick Navigation</h3>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => navigate('/admin/properties')}
                className="px-3 py-1.5 bg-[#176B45] text-white text-xs font-bold rounded-[2px]"
              >
                Property Inventory
              </button>
              <button
                onClick={() => navigate('/admin/inquiries')}
                className="px-3 py-1.5 bg-[#F5F8F5] border border-[#DDE5DF] text-[#18251E] text-xs font-bold rounded-[2px]"
              >
                Inquiries
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export function AdminRouter() {
  return (
    <AdminAuthProvider>
      <AdminDataProvider>
        <AdminContent />
      </AdminDataProvider>
    </AdminAuthProvider>
  );
}
