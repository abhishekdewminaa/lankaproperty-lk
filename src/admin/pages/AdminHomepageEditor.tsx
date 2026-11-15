import React, { useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Home, ExternalLink, Save, CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { formatPriceLkr } from '../../utils/formatters';

export function AdminHomepageEditor() {
  const {
    homepageConfig,
    publishedHomepageConfig,
    saveHomepageDraft,
    publishHomepageDraft,
    properties,
    toggleCollectionPlacement,
  } = useAdminData();
  const { hasPermission } = useAdminAuth();

  const [formState, setFormState] = useState({
    headline: homepageConfig.hero.headline,
    subheadline: homepageConfig.hero.subheadline,
    supportingCopy: homepageConfig.hero.supportingCopy,
    backgroundImageUrl: homepageConfig.hero.backgroundImageUrl,
    featuredSectionTitle: homepageConfig.featuredSectionTitle,
    curatedSectionTitle: homepageConfig.curatedSectionTitle,
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    saveHomepageDraft({
      hero: {
        ...homepageConfig.hero,
        headline: formState.headline,
        subheadline: formState.subheadline,
        supportingCopy: formState.supportingCopy,
        backgroundImageUrl: formState.backgroundImageUrl,
      },
      featuredSectionTitle: formState.featuredSectionTitle,
      curatedSectionTitle: formState.curatedSectionTitle,
    });
    setStatusMessage('Homepage draft revision saved successfully.');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handlePublish = () => {
    // First save latest form values to draft, then publish
    saveHomepageDraft({
      hero: {
        ...homepageConfig.hero,
        headline: formState.headline,
        subheadline: formState.subheadline,
        supportingCopy: formState.supportingCopy,
        backgroundImageUrl: formState.backgroundImageUrl,
      },
      featuredSectionTitle: formState.featuredSectionTitle,
      curatedSectionTitle: formState.curatedSectionTitle,
    });

    publishHomepageDraft();
    setStatusMessage('Homepage configuration successfully published to live website!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#176B45]">
            Homepage Editorial
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E] mt-1">
            Homepage Layout & Placements
          </h1>
          <p className="text-sm text-[#5F6B63] mt-1">
            Configure hero copy, featured listings assignment, and the signature story showcase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Draft Action */}
          <a
            href="/?previewHomepage=true"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-white border border-[#DDE5DF] hover:bg-[#F5F8F5] text-xs font-bold text-[#18251E] rounded-[3px] inline-flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#176B45]" />
            <span>Preview Draft</span>
          </a>

          {/* Publish Live */}
          {hasPermission('canManageHomepage') && (
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Publish Live</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-[#E8F3EC] border border-[#176B45]/40 rounded-[3px] text-xs font-semibold text-[#103D2C] flex items-center justify-between animate-in fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#103D2C] hover:opacity-75 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Configuration Form */}
      <form onSubmit={handleSaveDraft} className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E] flex items-center gap-2">
            <Home className="w-5 h-5 text-[#176B45]" />
            <span>Hero Banner Headline & Copy</span>
          </h2>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-bold uppercase rounded-[2px] ${
                homepageConfig.isDraft
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-[#E8F3EC] text-[#176B45]'
              }`}
            >
              {homepageConfig.isDraft ? 'Draft (Unpublished Changes)' : 'Published Live'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div>
            <label className="block text-xs font-bold text-[#5F6B63] uppercase tracking-wider mb-1.5">
              Headline
            </label>
            <input
              type="text"
              value={formState.headline}
              onChange={(e) => setFormState({ ...formState, headline: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#DDE5DF] rounded-[3px] font-medium text-[#18251E] bg-[#F5F8F5] focus:outline-none focus:border-[#176B45]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5F6B63] uppercase tracking-wider mb-1.5">
              Subheadline / Eyebrow
            </label>
            <input
              type="text"
              value={formState.subheadline}
              onChange={(e) => setFormState({ ...formState, subheadline: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#DDE5DF] rounded-[3px] font-medium text-[#18251E] bg-[#F5F8F5] focus:outline-none focus:border-[#176B45]"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#5F6B63] uppercase tracking-wider mb-1.5">
              Supporting Paragraph
            </label>
            <textarea
              rows={2}
              value={formState.supportingCopy}
              onChange={(e) => setFormState({ ...formState, supportingCopy: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#DDE5DF] rounded-[3px] font-medium text-[#18251E] bg-[#F5F8F5] focus:outline-none focus:border-[#176B45]"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#5F6B63] uppercase tracking-wider mb-1.5">
              Hero Background Photography URL
            </label>
            <input
              type="url"
              value={formState.backgroundImageUrl}
              onChange={(e) => setFormState({ ...formState, backgroundImageUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#DDE5DF] rounded-[3px] font-medium text-[#18251E] bg-[#F5F8F5] focus:outline-none focus:border-[#176B45]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5F6B63] uppercase tracking-wider mb-1.5">
              Featured Section Title
            </label>
            <input
              type="text"
              value={formState.featuredSectionTitle}
              onChange={(e) => setFormState({ ...formState, featuredSectionTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#DDE5DF] rounded-[3px] font-medium text-[#18251E] bg-[#F5F8F5] focus:outline-none focus:border-[#176B45]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5F6B63] uppercase tracking-wider mb-1.5">
              Curated Showcase Title
            </label>
            <input
              type="text"
              value={formState.curatedSectionTitle}
              onChange={(e) => setFormState({ ...formState, curatedSectionTitle: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-[#DDE5DF] rounded-[3px] font-medium text-[#18251E] bg-[#F5F8F5] focus:outline-none focus:border-[#176B45]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#DDE5DF]">
          <span className="text-xs text-[#5F6B63]">
            Last saved draft: {homepageConfig.lastSavedAt || 'Never'} · Last published: {homepageConfig.lastPublishedAt || 'Never'}
          </span>
          <button
            type="submit"
            className="px-4 py-2 bg-white border border-[#176B45] text-[#176B45] hover:bg-[#E8F3EC] text-xs font-bold uppercase rounded-[3px] inline-flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft Config</span>
          </button>
        </div>
      </form>

      {/* Active Placements Table */}
      <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-[#18251E]">Curated Section Allocations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F8F5] text-xs uppercase tracking-wider text-[#5F6B63] border-y border-[#DDE5DF]">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Architectural</th>
                <th className="py-3 px-4">Signature</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5DF]">
              {properties.slice(0, 10).map((p) => (
                <tr key={p.id} className="hover:bg-[#F5F8F5]/60 transition-colors text-xs">
                  <td className="py-3 px-4 font-bold text-[#18251E]">{p.title}</td>
                  <td className="py-3 px-4 text-[#5F6B63]">
                    {p.location.city}, {p.location.district}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-[#103D2C]">
                    {formatPriceLkr(p.priceLkr, p.priceUnit, true)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleCollectionPlacement(p.id, 'featured')}
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase ${
                        p.collections?.includes('featured') || p.isFeatured
                          ? 'bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/40'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {p.collections?.includes('featured') || p.isFeatured ? 'Assigned' : 'Off'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleCollectionPlacement(p.id, 'architectural')}
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase ${
                        p.collections?.includes('architectural')
                          ? 'bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/40'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {p.collections?.includes('architectural') ? 'Assigned' : 'Off'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleCollectionPlacement(p.id, 'signature')}
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase ${
                        p.collections?.includes('signature') || p.isSignature
                          ? 'bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/40'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {p.collections?.includes('signature') || p.isSignature ? 'Assigned' : 'Off'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`/properties/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-[#5F6B63] hover:text-[#176B45]"
                      title="View live listing"
                    >
                      <ExternalLink className="w-3.5 h-3.5 inline" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
