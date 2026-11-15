import React from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { formatPriceLkr } from '../../utils/formatters';
import {
  Building,
  Clock,
  Inbox,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Home,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export function AdminDashboard() {
  const { navigate } = useRouter();
  const { currentUser, currentRole, hasPermission } = useAdminAuth();
  const { properties, inquiries, viewings, auditLogs, updatePropertyStatus } = useAdminData();

  // Metrics derived from actual data
  const publishedCount = properties.filter((p) => p.publicationStatus === 'published').length;
  const pendingReviewCount = properties.filter((p) => p.publicationStatus === 'pending_review').length;
  const draftCount = properties.filter((p) => p.publicationStatus === 'draft').length;
  const newInquiriesCount = inquiries.filter((inq) => inq.stage === 'new').length;
  const activeViewingsCount = viewings.filter((v) => v.status === 'scheduled' || v.status === 'confirmed').length;

  // Items needing attention
  const needsAttentionList = [
    ...properties
      .filter((p) => p.publicationStatus === 'pending_review')
      .map((p) => ({
        id: p.id,
        type: 'Review Required',
        title: p.title,
        subtext: `Submitted by ${p.assignedAgentName || 'Agent'}. Price: ${formatPriceLkr(p.priceLkr, p.priceUnit)}.`,
        link: `/admin/properties/${p.id}/edit`,
        severity: 'high',
      })),
    ...inquiries
      .filter((inq) => inq.stage === 'new')
      .map((inq) => ({
        id: inq.id,
        type: 'Unassigned Lead',
        title: inq.customerName,
        subtext: `Inquired on ${inq.propertyTitle || 'General Marketplace'}. SLA: 2 hours.`,
        link: '/admin/inquiries',
        severity: 'medium',
      })),
  ].slice(0, 5);

  const metrics = [
    {
      label: 'Published Listings',
      value: publishedCount,
      subtext: 'Active on public marketplace',
      icon: Building,
      href: '/admin/properties?status=published',
      color: 'text-[#176B45]',
      bgColor: 'bg-[#E8F3EC]',
    },
    {
      label: 'Pending Editorial Review',
      value: pendingReviewCount,
      subtext: 'Requires broker deed verification',
      icon: Clock,
      href: '/admin/properties?status=pending_review',
      color: 'text-[#C93636]',
      bgColor: 'bg-red-50',
    },
    {
      label: 'New Customer Inquiries',
      value: newInquiriesCount,
      subtext: 'Incoming web & WhatsApp leads',
      icon: Inbox,
      href: '/admin/inquiries?stage=new',
      color: 'text-[#176B45]',
      bgColor: 'bg-[#E8F3EC]',
    },
    {
      label: 'Upcoming Site Viewings',
      value: activeViewingsCount,
      subtext: 'Coordinated in Asia/Colombo',
      icon: CalendarDays,
      href: '/admin/viewings',
      color: 'text-[#103D2C]',
      bgColor: 'bg-[#F5F8F5]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#176B45]">
            Operational Overview
          </span>
          <h1 className="text-2xl font-extrabold text-[#18251E] mt-1">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6B63] mt-0.5">
            Role: <span className="font-bold text-[#103D2C] capitalize">{currentRole.replace('_', ' ')}</span> · Department: {currentUser.department}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('canCreateListings') && (
            <button
              onClick={() => navigate('/admin/properties/new')}
              className="px-4 py-2 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Property</span>
            </button>
          )}
          {hasPermission('canManageHomepage') && (
            <button
              onClick={() => navigate('/admin/homepage')}
              className="px-4 py-2 bg-white hover:bg-[#F5F8F5] text-[#18251E] border border-[#DDE5DF] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors inline-flex items-center gap-1.5"
            >
              <Home className="w-4 h-4 text-[#176B45]" />
              <span>Edit Homepage</span>
            </button>
          )}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="px-3.5 py-2 bg-[#F5F8F5] hover:bg-white text-[#5F6B63] border border-[#DDE5DF] text-xs font-semibold rounded-[3px] transition-colors inline-flex items-center gap-1"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.label}
              onClick={() => navigate(m.href)}
              className="p-5 bg-white border border-[#DDE5DF] hover:border-[#176B45] rounded-[4px] shadow-2xs text-left transition-all hover:shadow-xs group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5F6B63] uppercase tracking-wider">{m.label}</span>
                <div className={`w-8 h-8 rounded-[3px] ${m.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-[#18251E] tabular-nums block">{m.value}</span>
                <span className="text-xs text-[#5F6B63] mt-1 block">{m.subtext}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#DDE5DF]/60 flex items-center gap-1 text-[11px] font-bold text-[#176B45] group-hover:underline">
                <span>View filtered records</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split: Needs Attention & Quick Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Needs Attention Queue */}
        <div className="lg:col-span-7 bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-[#DDE5DF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-[#C93636]" />
              <h2 className="text-sm font-bold text-[#18251E] uppercase tracking-wider">
                Needs Attention Queue ({needsAttentionList.length})
              </h2>
            </div>
            <span className="text-[11px] text-[#5F6B63]">Strict verification priority</span>
          </div>

          <div className="divide-y divide-[#DDE5DF] flex-1">
            {needsAttentionList.length > 0 ? (
              needsAttentionList.map((item) => (
                <div key={item.id} className="p-4 hover:bg-[#F5F8F5]/60 transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                        item.severity === 'high' ? 'bg-red-100 text-[#C93636]' : 'bg-[#E8F3EC] text-[#176B45]'
                      }`}>
                        {item.type}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#18251E] truncate">{item.title}</h3>
                    </div>
                    <p className="text-xs text-[#5F6B63] mt-1 truncate">{item.subtext}</p>
                  </div>
                  <button
                    onClick={() => navigate(item.link)}
                    className="shrink-0 px-3 py-1.5 bg-white border border-[#DDE5DF] hover:border-[#176B45] text-xs font-semibold text-[#176B45] rounded-[2px] transition-colors"
                  >
                    Action
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#5F6B63] flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-[#176B45]" />
                <span className="font-bold text-[#18251E]">All verification queues resolved.</span>
                <span>No active bottlenecks detected.</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#DDE5DF] bg-[#F5F8F5]/40 text-right">
            <button
              onClick={() => navigate('/admin/properties')}
              className="text-xs font-bold text-[#176B45] hover:underline"
            >
              View Full Property Queue →
            </button>
          </div>
        </div>

        {/* Right 5 cols: Recent Audit & Activity Log */}
        <div className="lg:col-span-5 bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-[#DDE5DF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-[#176B45]" />
              <h2 className="text-sm font-bold text-[#18251E] uppercase tracking-wider">
                Recent Staff Activity
              </h2>
            </div>
            <button
              onClick={() => navigate('/admin/audit')}
              className="text-[11px] font-bold text-[#176B45] hover:underline"
            >
              View All Logs
            </button>
          </div>

          <div className="p-4 divide-y divide-[#DDE5DF]/60 space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between text-[11px] text-[#5F6B63]">
                  <span className="font-bold text-[#18251E]">{log.actorName}</span>
                  <span className="tabular-nums">{log.timestamp}</span>
                </div>
                <p className="text-xs text-[#18251E] font-medium mt-0.5">
                  <span className="font-bold text-[#176B45] text-[10px] mr-1.5 uppercase">
                    [{log.action.replace(/_/g, ' ')}]
                  </span>
                  {log.details || log.targetRecord}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Inquiries Pipeline Snapshot */}
      <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-sm font-bold text-[#18251E] uppercase tracking-wider">
              Recent Leads & Direct Inquiries
            </h2>
            <p className="text-xs text-[#5F6B63]">
              Live consumer inquiries received from the public marketplace
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/inquiries')}
            className="text-xs font-bold uppercase tracking-wider text-[#176B45] hover:underline"
          >
            Open Inquiries Pipeline →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DDE5DF] text-[#5F6B63] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Ref ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Property Context</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Assigned Broker</th>
                <th className="py-2.5 px-3 text-right">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF]/60">
              {inquiries.slice(0, 5).map((inq) => (
                <tr key={inq.id} className="hover:bg-[#F5F8F5]/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-[#176B45] tabular-nums">{inq.referenceNumber}</td>
                  <td className="py-3 px-3 font-bold text-[#18251E]">{inq.customerName}</td>
                  <td className="py-3 px-3 text-[#5F6B63] truncate max-w-[220px]">
                    {inq.propertyTitle || 'General Marketplace'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#F5F8F5] border border-[#DDE5DF]">
                      {inq.source.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                      inq.stage === 'new'
                        ? 'bg-red-100 text-[#C93636]'
                        : inq.stage === 'viewing_scheduled'
                        ? 'bg-[#E8F3EC] text-[#103D2C]'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {inq.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#5F6B63]">{inq.assignedStaffName || 'Unassigned'}</td>
                  <td className="py-3 px-3 text-right text-[#5F6B63] tabular-nums">{inq.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
