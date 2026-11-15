import React, { useState, useMemo } from 'react';
import {
  wantedPropertyService,
  WantedPropertyLead,
  MatchProposal,
} from '../../services/wantedPropertyService';
import { formatPriceLkr } from '../../utils/formatters';

export function AdminWantedProperties() {
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedLeadForProposals, setSelectedLeadForProposals] = useState<WantedPropertyLead | null>(null);

  const leads = useMemo(() => {
    let list = wantedPropertyService.getWantedLeads({
      district: districtFilter,
      status: statusFilter,
      searchQuery: searchQuery,
    });
    return list;
  }, [districtFilter, statusFilter, searchQuery, refreshKey]);

  const proposals: MatchProposal[] = useMemo(() => {
    if (!selectedLeadForProposals) return [];
    return wantedPropertyService.getProposalsForLead(selectedLeadForProposals.id);
  }, [selectedLeadForProposals, refreshKey]);

  const handleStatusChange = (id: string, status: WantedPropertyLead['status']) => {
    wantedPropertyService.updateLeadStatus(id, status);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = (id: string) => {
    if (confirm('Permanently remove this buyer wanted request from the database?')) {
      wantedPropertyService.deleteLead(id);
      if (selectedLeadForProposals?.id === id) {
        setSelectedLeadForProposals(null);
      }
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
            Demand Generation & Lead Moderation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
            Wanted Buyer Demands Moderation
          </h1>
          <p className="text-sm text-[#5F6B63] mt-1">
            Review, verify, and moderate buyer property requests and agent match submissions across Sri Lanka.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#FAFBF9] border border-[#DDE5DF] px-3 py-2 rounded-[3px] font-bold text-[#103D2C]">
            Total Inquiries: {leads.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#DDE5DF] rounded-[3px] p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 text-xs w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search buyer name, area, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-[#DDE5DF] rounded-[2px] w-64 focus:outline-none focus:border-[#103D2C]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#DDE5DF] rounded-[2px] bg-white text-[#18251E] focus:outline-none focus:border-[#103D2C]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="pending_review">Pending Review</option>
            <option value="archived">Archived</option>
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
            <option value="Gampaha">Gampaha</option>
            <option value="Kalutara">Kalutara</option>
            <option value="Matara">Matara</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#DDE5DF] rounded-[3px] overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAFBF9] border-b border-[#DDE5DF] text-[#5F6B63] uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Ref & Date</th>
              <th className="py-3 px-4">Buyer & Contact</th>
              <th className="py-3 px-4">Requirement Title</th>
              <th className="py-3 px-4">Target District / Areas</th>
              <th className="py-3 px-4">Budget Range</th>
              <th className="py-3 px-4">Proposals</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE5DF]">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#5F6B63]">
                  No wanted property records found matching criteria.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[#F5F8F5]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#5F6B63]">
                    <div>{lead.id}</div>
                    <div className="text-[10px] text-[#7A8880] font-normal">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#18251E] flex items-center gap-1.5">
                      {lead.buyerName}
                      {lead.verifiedBuyer && (
                        <span className="text-[10px] px-1 bg-[#E8F3EC] text-[#176B45] rounded-[1px] font-bold">
                          ✓ Vetted
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5F6B63]">{lead.phone}</div>
                    <div className="text-[10px] text-[#7A8880] capitalize">
                      {lead.buyerType.replace('_', ' ')} (Prefers {lead.preferredContactMethod})
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-bold text-[#18251E] truncate">{lead.title}</div>
                    <div className="text-[11px] text-[#5F6B63] line-clamp-2 mt-0.5">
                      {lead.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#103D2C] block">{lead.district}</span>
                    <span className="text-[11px] text-[#5F6B63]">
                      {lead.specificAreas.slice(0, 2).join(', ')}
                      {lead.specificAreas.length > 2 ? ` +${lead.specificAreas.length - 2}` : ''}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#18251E] whitespace-nowrap">
                    <div>{formatPriceLkr(lead.budgetMinLkr)}</div>
                    <div className="text-[10px] text-[#5F6B63]">to {formatPriceLkr(lead.budgetMaxLkr)}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setSelectedLeadForProposals(lead)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-[#FAFBF9] border border-[#DDE5DF] hover:border-[#103D2C] text-[#103D2C] rounded-[2px]"
                    >
                      {lead.proposalsCount || 0} Proposals →
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                      className={`text-[11px] font-bold border rounded-[2px] px-2 py-1 bg-white ${
                        lead.status === 'active'
                          ? 'border-[#176B45] text-[#176B45]'
                          : lead.status === 'fulfilled'
                          ? 'border-[#103D2C] text-[#103D2C]'
                          : 'border-[#5F6B63] text-[#5F6B63]'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="px-2 py-1 text-[11px] font-bold text-[#C93636] hover:bg-[#C93636]/10 rounded-[2px]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Proposals Drawer / Modal */}
      {selectedLeadForProposals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setSelectedLeadForProposals(null)}
              className="absolute top-4 right-4 text-sm text-[#7A8880] hover:text-[#18251E]"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                Match Submissions
              </span>
              <h3 className="text-lg font-extrabold text-[#103D2C] mt-0.5">
                Proposals for {selectedLeadForProposals.buyerName}
              </h3>
              <p className="text-xs text-[#5F6B63]">
                {selectedLeadForProposals.title} ({selectedLeadForProposals.district})
              </p>
            </div>

            {proposals.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5F6B63] bg-[#FAFBF9] border border-[#DDE5DF] rounded-[2px]">
                No agent or owner match proposals submitted yet for this request.
              </div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#18251E]">{p.senderName} ({p.senderRole})</span>
                      <span className="text-[10px] text-[#7A8880]">
                        {new Date(p.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#103D2C]">{p.propertyTitle}</span>
                      <span className="font-bold text-[#18251E]">{formatPriceLkr(p.priceLkr)}</span>
                    </div>
                    {p.notes && <p className="text-[#5F6B63] bg-white p-2 rounded-[2px] border border-[#DDE5DF]">{p.notes}</p>}
                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-[#5F6B63]">Phone: {p.senderPhone}</span>
                      {p.propertyUrl && (
                        <a
                          href={p.propertyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#176B45] font-bold hover:underline"
                        >
                          View Listing →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-[#DDE5DF]">
              <button
                type="button"
                onClick={() => setSelectedLeadForProposals(null)}
                className="px-4 py-2 bg-[#103D2C] text-white text-xs font-bold rounded-[2px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
