import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from '../../hooks/useRouter';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { AdminPropertyRecord, PublicationStatus } from '../types/admin';
import { PropertyPurpose, PropertyType, PriceUnit } from '../../types/property';
import { formatPriceLkr } from '../../utils/formatters';
import { SRI_LANKA_DISTRICTS, getCitiesForDistrict } from '../../data/locations';
import { compressImagesBatch, formatBytes } from '../../utils/imageCompressor';
import { uploadBatchPropertyPhotosToHostinger } from '../../services/mediaStorageService';
import { userPortalService } from '../../services/userPortalService';
import {
  parseHeuristic,
  mergeAIResultsWithForm,
} from '../../utils/propertyParser';
import {
  FieldExtractionResult,
  ParserSummary,
  AIPropertyParseResponse,
} from '../../types/propertyParser';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Eye,
  ExternalLink,
  Plus,
  Trash2,
  Clock,
  Layers,
  MapPin,
  FileText,
  Image as ImageIcon,
  User,
  ShieldCheck,
  ChevronDown,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Eraser,
  Wand2,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  Compass,
  Video,
  Info,
} from 'lucide-react';

interface AdminPropertyEditorProps {
  propertyId?: string; // If undefined, creating new listing
}

export function AdminPropertyEditor({ propertyId }: AdminPropertyEditorProps) {
  const { navigate, searchParams } = useRouter();
  const { currentUser, hasPermission } = useAdminAuth();
  const { properties, saveProperty, updatePropertyStatus, deleteProperty } = useAdminData();

  const isEditing = Boolean(propertyId);
  const existingRecord = useMemo(() => {
    if (!propertyId) return undefined;
    return properties.find((p) => p.id === propertyId);
  }, [propertyId, properties]);

  // Form State initialized empty when creating (NO guessed defaults, NO 0 bedrooms)
  const [formData, setFormData] = useState<AdminPropertyRecord>(() => {
    if (existingRecord) {
      return { ...existingRecord };
    }
    const newId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `prop-${Date.now()}`;
    return {
      id: newId,
      slug: '',
      title: '',
      purpose: 'buy' as PropertyPurpose,
      type: 'house' as PropertyType,
      priceLkr: 0,
      priceUnit: 'total' as PriceUnit,
      status: 'available',
      publicationStatus: 'draft',
      collections: [],
      packageTier: 'standard',
      location: {
        address: '',
        city: '',
        district: '',
        province: '',
      },
      specs: {},
      images: [],
      description: '',
      additionalInfo: '',
      materialSpecs: '',
      amenities: [],
      agent: {
        name: currentUser.name,
        role: 'Broker Portfolio Representative',
        phone: currentUser.phone || '',
        whatsapp: currentUser.phone ? currentUser.phone.replace(/[^0-9]/g, '') : '',
      },
      publishedDate: new Date().toISOString().split('T')[0],
      viewCount: 0,
      inquiryCount: 0,
      saveCount: 0,
      lastModifiedBy: currentUser.name,
      lastModifiedAt: new Date().toLocaleString(),
      recordVersion: 1,
    };
  });

  // Track if current record is invalid/unavailable
  const isInvalidExistingRecord = isEditing && !existingRecord;

  // Active section for in-page navigation (1 to 9)
  const [activeSection, setActiveSection] = useState<number>(1);

  // Form state tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [publishedFeedback, setPublishedFeedback] = useState<boolean>(false);

  // Snapshot history for "Undo Last Apply"
  const formSnapshotBeforeApplyRef = useRef<AdminPropertyRecord | null>(null);
  const [canUndoApply, setCanUndoApply] = useState(false);

  // Highlighted fields after applying parser results
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());

  // Quick AI Text Parser State
  const [pastedRawText, setPastedRawText] = useState('');
  const [autoFillEmptyFields, setAutoFillEmptyFields] = useState(true);
  const [parserResults, setParserResults] = useState<FieldExtractionResult[] | null>(null);
  const [parserSummary, setParserSummary] = useState<ParserSummary | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiAbortControllerRef = useRef<AbortController | null>(null);

  // Manual image URL & Drag-and-Drop Gallery Reorder State
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const [isCompressingAdminImages, setIsCompressingAdminImages] = useState(false);
  const [adminCompressionStats, setAdminCompressionStats] = useState<{
    count: number;
    original: string;
    compressed: string;
    percentSaved: number;
  } | null>(null);

  // Synchronize if existing record updates from storage
  useEffect(() => {
    if (existingRecord && !hasUnsavedChanges) {
      setFormData({ ...existingRecord });
    }
  }, [existingRecord, hasUnsavedChanges]);

  // Handle field change helper
  const handleFieldChange = (fieldPath: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (fieldPath.startsWith('location.')) {
        const sub = fieldPath.split('.')[1] as keyof typeof prev.location;
        next.location = { ...next.location, [sub]: value };
        // Auto-assign province if district changes
        if (sub === 'district') {
          const matched = SRI_LANKA_DISTRICTS.find(
            (d) => d.district.toLowerCase() === String(value).toLowerCase()
          );
          if (matched) next.location.province = matched.province;
        }
      } else if (fieldPath.startsWith('specs.')) {
        const sub = fieldPath.split('.')[1] as keyof typeof prev.specs;
        next.specs = { ...next.specs, [sub]: value };
      } else if (fieldPath.startsWith('agent.')) {
        const sub = fieldPath.split('.')[1] as keyof typeof prev.agent;
        next.agent = { ...next.agent, [sub]: value };
      } else {
        (next as any)[fieldPath] = value;
      }
      return next;
    });

    setHasUnsavedChanges(true);
    setSaveSuccessMessage(null);

    // Clear validation error on field change
    if (validationErrors[fieldPath]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[fieldPath];
        return next;
      });
    }
  };

  // Section list definitions
  const formSections = [
    { id: 1, label: '1. AI Text Parser', icon: Wand2 },
    { id: 2, label: '2. Core Details', icon: FileText },
    { id: 3, label: '3. Location', icon: MapPin },
    { id: 4, label: '4. Price & Specs', icon: Layers },
    { id: 5, label: '5. Descriptions', icon: FileText },
    { id: 6, label: '6. Photos & Media', icon: ImageIcon },
    { id: 7, label: '7. Contact Info', icon: User },
    { id: 8, label: '8. Visibility & Package', icon: ShieldCheck },
    { id: 9, label: '9. Review & Publish', icon: CheckCircle2 },
  ];

  // -------------------------------------------------------------
  // STAGE A: Instant Heuristic Parser Handler
  // -------------------------------------------------------------
  const handleRunHeuristic = (textToParse = pastedRawText, forceApply = false) => {
    if (!textToParse.trim()) return;
    const res = parseHeuristic(textToParse, formData);
    setParserResults(res.fields);
    setParserSummary(res.summary);
    setAiError(null);

    // Apply unambiguous extracted fields if autoFillEmptyFields is on OR explicitly triggered
    if (autoFillEmptyFields || forceApply) {
      const eligibleFields = res.fields.filter((f) => f.selectedToApply && !f.isConflict);
      applyExtractedFields(eligibleFields);
      if (forceApply && eligibleFields.length > 0) {
        setSaveSuccessMessage(`Auto-arranged ${eligibleFields.length} extracted fields into the property form.`);
      }
    }
  };

  // Debounced heuristic run after paste or raw text change
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handlePastedTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPastedRawText(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (val.trim().length > 15) {
        handleRunHeuristic(val, false);
      }
    }, 500);
  };

  // -------------------------------------------------------------
  // STAGE B: AI-Assisted Server Extraction Handler
  // -------------------------------------------------------------
  const handleEnhanceWithAI = async () => {
    if (!pastedRawText.trim()) return;

    setIsAiLoading(true);
    setAiError(null);

    // Support cancellation
    const controller = new AbortController();
    aiAbortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ai/parse-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pastedRawText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }

      const aiData: AIPropertyParseResponse = await response.json();
      const merged = mergeAIResultsWithForm(aiData, formData);
      setParserResults(merged.fields);
      setParserSummary(merged.summary);

      if (autoFillEmptyFields) {
        applyExtractedFields(merged.fields.filter((f) => f.selectedToApply && !f.isConflict));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('AI parsing cancelled by user');
      } else {
        console.warn('AI Parsing failed, falling back to heuristic:', err);
        setAiError(err.message || 'AI service unavailable. Using instant heuristic extraction.');
        handleRunHeuristic(pastedRawText, true);
      }
    } finally {
      setIsAiLoading(false);
      aiAbortControllerRef.current = null;
    }
  };

  const handleCancelAI = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
      setIsAiLoading(false);
    }
  };

  // Clear source text without affecting form state
  const handleClearSourceText = () => {
    setPastedRawText('');
    setParserResults(null);
    setParserSummary(null);
    setAiError(null);
  };

  // -------------------------------------------------------------
  // REVIEW TABLE: Application and Undo Actions
  // -------------------------------------------------------------
  const applyExtractedFields = (fieldsToApply: FieldExtractionResult[]) => {
    if (fieldsToApply.length === 0) return;

    // Snapshot current form state for Undo Last Apply
    formSnapshotBeforeApplyRef.current = JSON.parse(JSON.stringify(formData));
    setCanUndoApply(true);

    const newlyAppliedKeys = new Set<string>();

    setFormData((prev) => {
      const next = { ...prev };
      fieldsToApply.forEach((item) => {
        newlyAppliedKeys.add(item.fieldKey);
        if (item.fieldKey.startsWith('location.')) {
          const sub = item.fieldKey.split('.')[1] as keyof typeof prev.location;
          next.location = { ...next.location, [sub]: item.proposedValue };
          if (sub === 'district') {
            const matched = SRI_LANKA_DISTRICTS.find(
              (d) => d.district.toLowerCase() === String(item.proposedValue).toLowerCase()
            );
            if (matched) next.location.province = matched.province;
          }
        } else if (item.fieldKey.startsWith('specs.')) {
          const sub = item.fieldKey.split('.')[1] as keyof typeof prev.specs;
          next.specs = { ...next.specs, [sub]: item.proposedValue };
        } else if (item.fieldKey.startsWith('agent.')) {
          const sub = item.fieldKey.split('.')[1] as keyof typeof prev.agent;
          next.agent = { ...next.agent, [sub]: item.proposedValue };
          if (sub === 'phone' && !next.agent.whatsapp) {
            next.agent.whatsapp = String(item.proposedValue).replace(/[^0-9]/g, '');
          }
        } else if (item.fieldKey === 'amenities' && Array.isArray(item.proposedValue)) {
          next.amenities = Array.from(new Set([...(next.amenities || []), ...item.proposedValue]));
        } else {
          (next as any)[item.fieldKey] = item.proposedValue;
          if (item.fieldKey === 'title' && !next.slug) {
            next.slug = String(item.proposedValue)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
          }
        }
      });
      return next;
    });

    setHasUnsavedChanges(true);

    // Visual feedback highlight
    setHighlightedFields(newlyAppliedKeys);
    setTimeout(() => {
      setHighlightedFields(new Set());
    }, 2800);
  };

  const handleUndoApply = () => {
    if (formSnapshotBeforeApplyRef.current) {
      setFormData(formSnapshotBeforeApplyRef.current);
      setCanUndoApply(false);
      formSnapshotBeforeApplyRef.current = null;
    }
  };

  const toggleSelectResult = (fieldKey: string) => {
    if (!parserResults) return;
    setParserResults((prev) =>
      prev ? prev.map((f) => (f.fieldKey === fieldKey ? { ...f, selectedToApply: !f.selectedToApply } : f)) : null
    );
  };

  const handleSelectAllResults = (select: boolean) => {
    if (!parserResults) return;
    setParserResults((prev) => (prev ? prev.map((f) => ({ ...f, selectedToApply: select })) : null));
  };

  const handleFillOnlyEmpty = () => {
    if (!parserResults) return;
    setParserResults((prev) =>
      prev
        ? prev.map((f) => {
            const isCurrentlyEmpty =
              f.currentValue === '' ||
              f.currentValue === undefined ||
              f.currentValue === null ||
              f.currentValue === 0;
            return {
              ...f,
              selectedToApply: isCurrentlyEmpty && !f.isConflict,
            };
          })
        : null
    );
  };

  // -------------------------------------------------------------
  // Validation Rules
  // -------------------------------------------------------------
  const validateForm = (isPublishing = false): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required.';
    }

    if (!formData.location.city.trim()) {
      errors['location.city'] = 'City is required.';
    }

    if (!formData.location.district.trim()) {
      errors['location.district'] = 'District is required.';
    }

    if (formData.priceLkr <= 0 && !formData.priceOnRequest) {
      errors.priceLkr = 'Valid asking price is required unless marked Price on Request.';
    }

    // Publishing validations
    if (isPublishing) {
      if (!formData.description || formData.description.trim().length < 40) {
        errors.description = 'A detailed description (at least 40 characters) is required to publish.';
      }

      if (!formData.images || formData.images.length === 0) {
        errors.images = 'At least 1 cover photo is required to publish to marketplace.';
      }

      if (formData.type === 'house' || formData.type === 'apartment') {
        if (formData.specs.bedrooms === undefined) {
          errors['specs.bedrooms'] = 'Bedrooms count is required for residential properties.';
        }
      } else if (formData.type === 'land') {
        if (!formData.specs.landPerches || formData.specs.landPerches <= 0) {
          errors['specs.landPerches'] = 'Land extent in perches is required for land parcels.';
        }
      }

      if (!formData.agent.phone) {
        errors['agent.phone'] = 'Primary phone number is required for prospective buyer inquiries.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // -------------------------------------------------------------
  // SUBMISSION HANDLER (Shared by Top & Bottom Action Bars)
  // -------------------------------------------------------------
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveSuccessMessage(null);

    // Auto-generate clean sanitized slug
    const rawSlugCandidate = formData.slug ? formData.slug.trim() : formData.title.trim();
    const generatedSlug =
      rawSlugCandidate
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') ||
      `property-${Date.now().toString().slice(-6)}`;

    const draftRecord: AdminPropertyRecord = {
      ...formData,
      slug: generatedSlug,
      publicationStatus: formData.publicationStatus === 'published' ? 'published' : 'draft',
      lastModifiedBy: currentUser.name,
      lastModifiedAt: new Date().toLocaleString(),
    };

    const res = saveProperty(draftRecord);
    setIsSaving(false);

    if (res.success && res.property) {
      setHasUnsavedChanges(false);
      setFormData(res.property);
      setSaveSuccessMessage('Draft saved successfully to authoritative store.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
      if (!isEditing && res.property.id) {
        window.history.replaceState(null, '', `/admin/properties/${res.property.id}/edit`);
      }
    } else {
      alert(res.message || 'Failed to save draft.');
    }
  };

  const handlePublishListing = async () => {
    const isValid = validateForm(true);
    if (!isValid) {
      setActiveSection(9); // Jump to review & publish section
      alert('Please resolve the required highlighted fields before publishing.');
      return;
    }

    setIsSaving(true);

    const rawSlugCandidate = formData.slug ? formData.slug.trim() : formData.title.trim();
    const generatedSlug =
      rawSlugCandidate
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') ||
      `property-${Date.now().toString().slice(-6)}`;

    const publishedRecord: AdminPropertyRecord = {
      ...formData,
      slug: generatedSlug,
      publicationStatus: 'published',
      publishedAt: new Date().toISOString().split('T')[0],
      lastModifiedBy: currentUser.name,
      lastModifiedAt: new Date().toLocaleString(),
    };

    const res = saveProperty(publishedRecord);
    setIsSaving(false);

    if (res.success && res.property) {
      setHasUnsavedChanges(false);
      setFormData(res.property);
      setPublishedFeedback(true);
      setSaveSuccessMessage('Property published to live marketplace!');
      if (!isEditing && res.property.id) {
        window.history.replaceState(null, '', `/admin/properties/${res.property.id}/edit`);
      }
    }
  };

  const handleUnpublishListing = () => {
    updatePropertyStatus(formData.id, 'draft', 'Unpublished by administrator');
    setFormData((prev) => ({ ...prev, publicationStatus: 'draft' }));
    setSaveSuccessMessage('Listing unpublished and reverted to draft.');
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteCurrentProperty = async () => {
    if (!existingRecord && !formData.id) return;
    const targetId = existingRecord ? existingRecord.id : formData.id;
    setIsDeleting(true);
    try {
      const res = await deleteProperty(targetId);
      if (res.success) {
        navigate('/admin/properties');
      } else {
        alert(res.message || 'Failed to delete listing.');
      }
    } catch (err: any) {
      alert(`Deletion error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Image Upload / Drag-and-Drop Handlers with Client-Side WebP Compression (Unlimited for SuperAdmin)
  const processImageFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (selectedFiles.length === 0) return;

    setIsCompressingAdminImages(true);
    setAdminCompressionStats(null);

    try {
      const summary = await compressImagesBatch(selectedFiles, 1280, 0.65);
      const rawUrls = summary.results.map((r) => r.dataUrl);
      const hostedUrls = await uploadBatchPropertyPhotosToHostinger(rawUrls);

      handleFieldChange('images', [...formData.images, ...hostedUrls]);
      setAdminCompressionStats({
        count: summary.results.length,
        original: formatBytes(summary.totalOriginalBytes),
        compressed: formatBytes(summary.totalCompressedBytes),
        percentSaved: summary.overallPercentSaved,
      });
      setSaveSuccessMessage(`Compressed & added ${summary.results.length} photos (${summary.overallPercentSaved}% space saved).`);
    } catch (err: any) {
      alert(`Image compression failed: ${err.message || 'Please choose valid images.'}`);
    } finally {
      setIsCompressingAdminImages(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processImageFiles(files);
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    handleFieldChange('images', [...formData.images, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    const nextImages = formData.images.filter((_, i) => i !== index);
    handleFieldChange('images', nextImages);
  };

  const handleSetCoverPhoto = (index: number) => {
    if (index === 0) return;
    const nextImages = [...formData.images];
    const [selected] = nextImages.splice(index, 1);
    nextImages.unshift(selected);
    handleFieldChange('images', nextImages);
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.images.length) return;
    const nextImages = [...formData.images];
    const [target] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, target);
    handleFieldChange('images', nextImages);
  };

  // Invalid existing record state
  if (isInvalidExistingRecord) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white border border-[#DDE5DF] rounded-[4px] space-y-4 my-12">
        <AlertTriangle className="w-10 h-10 text-[#C93636] mx-auto" />
        <h2 className="text-xl font-bold text-[#18251E]">Property Not Found in Inventory</h2>
        <p className="text-sm text-[#5F6B63]">
          The listing with ID <code className="bg-[#F5F8F5] px-1 py-0.5 font-bold">{propertyId}</code> could not be
          located in the authoritative records.
        </p>
        <button
          onClick={() => navigate('/admin/properties')}
          className="px-5 py-2.5 bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px]"
        >
          Return to Property Inventory
        </button>
      </div>
    );
  }

  // Published Success Dialog Overlay (with Live Property Cover & Gallery Preview)
  if (publishedFeedback) {
    const coverImg =
      formData.images?.[0] ||
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80';
    return (
      <div className="max-w-2xl mx-auto my-10 bg-white border border-[#176B45]/40 rounded-[4px] shadow-[0_14px_38px_rgba(16,61,44,0.12)] overflow-hidden">
        {/* Top Cover Preview Image */}
        <div className="relative aspect-16/9 w-full bg-[#0B2519] overflow-hidden">
          <img
            src={coverImg}
            alt={formData.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2519]/90 via-[#0B2519]/25 to-transparent" />
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[#176B45] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-[2px] shadow-md">
            <CheckCircle2 className="w-4 h-4" />
            <span>Publication Confirmed · Live</span>
          </div>
          <div className="absolute bottom-4 left-5 right-5 text-white flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#9FE3B8]">
                {formData.location.city}, {formData.location.district} · Ref: {formData.listingRef || formData.id}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold leading-snug mt-0.5">
                {formData.title}
              </h2>
            </div>
            <div className="text-lg sm:text-xl font-black text-white bg-[#103D2C]/90 px-3 py-1.5 rounded-[2px] border border-white/20 tabular-nums">
              {formData.priceLkr > 0 ? formatPriceLkr(formData.priceLkr, formData.priceUnit) : 'Price on Request'}
            </div>
          </div>
        </div>

        {/* Thumbnail Strip if multiple photos uploaded */}
        {formData.images.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 px-6 pt-4 bg-[#FAFBF9]">
            {formData.images.slice(0, 6).map((img, i) => (
              <div
                key={i}
                className={`aspect-4/3 rounded-[2px] overflow-hidden border ${
                  i === 0 ? 'border-2 border-[#176B45]' : 'border-[#DDE5DF]'
                }`}
              >
                <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="p-6 sm:p-8 text-center space-y-5">
          <p className="text-sm text-[#5F6B63] leading-relaxed max-w-lg mx-auto">
            Your listing has been published to the authoritative property database with{' '}
            <strong>{formData.images.length} photos</strong>. It is immediately live in marketplace searches and regional collections.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setPublishedFeedback(false)}
              className="px-5 py-2.5 bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] hover:bg-[#115236] transition-colors cursor-pointer"
            >
              Continue Editing
            </button>
            <a
              href={`/properties/${formData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#176B45] text-[#176B45] text-xs font-bold uppercase tracking-wider rounded-[3px] hover:bg-[#E8F3EC] transition-colors"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => navigate('/admin/properties')}
              className="px-5 py-2.5 bg-[#F5F8F5] border border-[#DDE5DF] text-[#18251E] text-xs font-bold uppercase tracking-wider rounded-[3px] cursor-pointer"
            >
              Back to Inventory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DDE5DF]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#5F6B63]">
            <button
              onClick={() => navigate('/admin/properties')}
              className="hover:text-[#176B45] transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Properties</span>
            </button>
            <span>/</span>
            <span className="font-semibold text-[#18251E]">
              {isEditing ? `Edit Property (${formData.listingRef || formData.id})` : 'Add Property'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18251E]">
              {isEditing ? 'Edit Property Listing' : 'Add Property'}
            </h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-[2px] ${
                formData.publicationStatus === 'published'
                  ? 'bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/40'
                  : formData.publicationStatus === 'pending_review'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {formData.publicationStatus.replace('_', ' ')}
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-[2px] border border-amber-200">
                Unsaved changes
              </span>
            )}
            {saveSuccessMessage && (
              <span className="text-xs text-[#176B45] font-semibold bg-[#E8F3EC] px-2 py-0.5 rounded-[2px]">
                {saveSuccessMessage}
              </span>
            )}
          </div>
        </div>

        {/* TOP ACTION BAR */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/admin/properties')}
            className="px-3.5 py-2 border border-[#DDE5DF] bg-white hover:bg-[#F5F8F5] text-[#18251E] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors"
          >
            Back to Properties
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#176B45] bg-white text-[#176B45] hover:bg-[#E8F3EC] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <a
            href={`/properties/${formData.slug || formData.id}?preview=true`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#DDE5DF] bg-white hover:bg-[#F5F8F5] text-[#18251E] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors"
            title="Preview current draft in public view"
          >
            <Eye className="w-3.5 h-3.5 text-[#176B45]" />
            <span>Preview</span>
          </a>

          {isEditing && hasPermission('canDeleteListings') && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-white hover:bg-red-50 text-[#C93636] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
              title="Permanently delete property"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#C93636]" />
              <span>Delete</span>
            </button>
          )}

          {hasPermission('canPublishListings') && (
            <button
              type="button"
              onClick={formData.publicationStatus === 'published' ? handlePublishListing : handlePublishListing}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors shadow-2xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{formData.publicationStatus === 'published' ? 'Update Published' : 'Publish Listing'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION NAV (DESKTOP TABS & MOBILE SELECTOR) */}
      <div className="bg-white border border-[#DDE5DF] rounded-[4px] p-2 shadow-2xs">
        {/* Mobile dropdown selector */}
        <div className="sm:hidden">
          <label className="block text-xs font-bold text-[#5F6B63] mb-1">Jump to section:</label>
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(Number(e.target.value))}
            className="w-full text-sm font-semibold p-2 border border-[#DDE5DF] rounded-[3px] bg-white text-[#18251E]"
          >
            {formSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop segmented buttons */}
        <div className="hidden sm:flex flex-wrap items-center gap-1">
          {formSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors ${
                  isActive
                    ? 'bg-[#176B45] text-white'
                    : 'text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. QUICK AI TEXT PARSER & AUTO-ARRANGEMENT PANEL */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 1 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-5`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DDE5DF]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#18251E]">
                Quick AI Text Parser & Auto-Arrangement
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#E8F3EC] text-[#103D2C] border border-[#176B45]/30 rounded-[2px]">
                Heuristic + AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5F6B63] mt-1 leading-relaxed">
              Paste a raw property description to fill clearly identified fields instantly. Use AI to organize complex
              details and review anything uncertain.
            </p>
          </div>

          {/* Auto-fill Toggle */}
          <label className="flex items-center gap-2 text-xs font-semibold text-[#18251E] cursor-pointer self-start sm:self-auto shrink-0 bg-[#F5F8F5] px-3 py-1.5 rounded-[3px] border border-[#DDE5DF]">
            <input
              type="checkbox"
              checked={autoFillEmptyFields}
              onChange={(e) => setAutoFillEmptyFields(e.target.checked)}
              className="rounded-[2px] text-[#176B45] focus:ring-[#176B45]"
            />
            <span>Auto-fill empty fields</span>
          </label>
        </div>

        {/* Textarea & Counter */}
        <div className="space-y-2">
          <div className="relative">
            <textarea
              rows={5}
              value={pastedRawText}
              onChange={handlePastedTextChange}
              placeholder="Paste raw real-estate text in English, Sinhala, Tamil, or mixed formats (e.g. '3 BR luxury villa in Talpe, Galle on 28 perches with ocean view. Asking Rs. 78.5 million neg. Call 077 123 4567')..."
              className="w-full p-3.5 text-sm font-sans border border-[#DDE5DF] rounded-[3px] bg-[#F5F8F5] focus:bg-white focus:border-[#176B45] focus:outline-none transition-colors leading-relaxed placeholder:text-[#5F6B63]/60"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#5F6B63] gap-2">
            <span>
              {pastedRawText.length.toLocaleString()} characters · Accepts English, Sinhala, Tamil & mixed ads.
            </span>
            {pastedRawText.length > 0 && (
              <button
                type="button"
                onClick={handleClearSourceText}
                className="text-xs text-[#C93636] hover:underline flex items-center gap-1 font-semibold"
                title="Clears only the raw textarea without resetting the property form"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear Source Text</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls (Clean text-only buttons) */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleRunHeuristic(pastedRawText, true)}
            disabled={!pastedRawText.trim() || isAiLoading}
            className="px-4 py-2 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            Extract & Auto-fill
          </button>

          <button
            type="button"
            onClick={handleEnhanceWithAI}
            disabled={!pastedRawText.trim() || isAiLoading}
            className="px-4 py-2 bg-[#103D2C] hover:bg-[#0c2e21] text-[#E8F3EC] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {isAiLoading ? 'Analyzing with Gemini...' : 'Enhance with AI'}
          </button>

          {isAiLoading && (
            <button
              type="button"
              onClick={handleCancelAI}
              className="px-3 py-2 border border-[#DDE5DF] bg-white text-[#C93636] text-xs font-bold uppercase tracking-wider rounded-[3px] hover:bg-[#F5F8F5]"
            >
              Cancel AI
            </button>
          )}

          {canUndoApply && (
            <button
              type="button"
              onClick={handleUndoApply}
              className="px-3 py-2 border border-[#DDE5DF] bg-white text-[#5F6B63] hover:text-[#18251E] text-xs font-bold uppercase tracking-wider rounded-[3px]"
            >
              Undo Last Apply
            </button>
          )}
        </div>

        {/* AI Error message */}
        {aiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#C93636] rounded-[3px] text-xs flex items-center justify-between gap-2">
            <span>{aiError}</span>
            <button
              onClick={handleEnhanceWithAI}
              className="underline font-bold text-xs hover:text-red-900 shrink-0"
            >
              Retry AI
            </button>
          </div>
        )}

        {/* PARSER SUMMARY & RESULTS REVIEW TABLE */}
        {parserResults && parserResults.length > 0 && (
          <div className="pt-4 border-t border-[#DDE5DF] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F5F8F5] p-3 rounded-[3px] border border-[#DDE5DF]">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-[#18251E]">
                  {parserSummary?.fieldsFilledCount || 0} fields identified · {parserSummary?.needReviewCount || 0}{' '}
                  need review
                </span>
                <span className="text-xs text-[#5F6B63] font-medium">
                  Language: <strong>{parserSummary?.detectedLanguage}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSelectAllResults(true)}
                  className="text-[#176B45] hover:underline"
                >
                  Select All
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleFillOnlyEmpty}
                  className="text-[#176B45] hover:underline"
                >
                  Fill Empty Only
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllResults(false)}
                  className="text-[#5F6B63] hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Conflicts Warning */}
            {parserSummary?.conflicts && parserSummary.conflicts.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-[3px] text-xs text-amber-900 space-y-1">
                <strong className="block font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Unresolved Conflicts Detected in Description:</span>
                </strong>
                <ul className="list-disc list-inside space-y-0.5">
                  {parserSummary.conflicts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Review Table */}
            <div className="overflow-x-auto border border-[#DDE5DF] rounded-[3px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F8F5] uppercase tracking-wider text-[#5F6B63] border-b border-[#DDE5DF]">
                  <tr>
                    <th className="py-2.5 px-3 w-8">
                      <span className="sr-only">Apply</span>
                    </th>
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Current Value</th>
                    <th className="py-2.5 px-3">Proposed Value</th>
                    <th className="py-2.5 px-3">Source Excerpt</th>
                    <th className="py-2.5 px-3">Method & Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE5DF]">
                  {parserResults.map((result) => {
                    const hasConflict = result.isConflict;
                    const formatVal = (v: any) => {
                      if (v === '' || v === undefined || v === null) return <span className="italic text-[#5F6B63]/60">Empty</span>;
                      if (typeof v === 'boolean') return v ? 'Yes' : 'No';
                      return String(v);
                    };

                    return (
                      <tr
                        key={result.fieldKey}
                        className={`hover:bg-[#F5F8F5]/60 transition-colors ${
                          hasConflict ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={result.selectedToApply}
                            onChange={() => toggleSelectResult(result.fieldKey)}
                            className="rounded-[2px] text-[#176B45]"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#18251E] whitespace-nowrap">
                          {result.fieldLabel}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums text-[#5F6B63] max-w-[140px] truncate">
                          {formatVal(result.currentValue)}
                        </td>
                        <td className="py-2.5 px-3 tabular-nums font-bold text-[#103D2C] max-w-[180px] truncate">
                          {formatVal(result.proposedValue)}
                          {result.normalizedUnit && (
                            <span className="ml-1 text-[10px] font-sans font-normal text-[#5F6B63]">
                              ({result.normalizedUnit})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[#5F6B63] max-w-[200px] truncate italic" title={result.sourceExcerpt}>
                          "{result.sourceExcerpt || 'Matched'}"
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-[2px] ${
                                result.method === 'ai'
                                  ? 'bg-[#103D2C] text-[#E8F3EC]'
                                  : 'bg-[#E8F3EC] text-[#176B45]'
                              }`}
                            >
                              {result.method}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                result.confidence === 'high'
                                  ? 'text-[#176B45]'
                                  : result.confidence === 'medium'
                                  ? 'text-amber-700'
                                  : 'text-[#C93636]'
                              }`}
                            >
                              {result.confidence}
                            </span>
                            {result.conflictOrAmbiguity && (
                              <span
                                className="text-amber-600 cursor-help"
                                title={result.conflictOrAmbiguity}
                              >
                                ⚠️
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Apply Selected Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#5F6B63]">
                Selected {parserResults.filter((r) => r.selectedToApply).length} of {parserResults.length} fields to apply.
              </span>
              <button
                type="button"
                onClick={() => applyExtractedFields(parserResults.filter((r) => r.selectedToApply))}
                className="px-5 py-2 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors shadow-2xs"
              >
                Apply Selected Fields
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CORE DETAILS */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 2 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-4`}
      >
        <div className="pb-3 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E]">2. Core Property Details</h2>
          <p className="text-xs text-[#5F6B63]">Primary headline, classification category, and transaction purpose.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Seller / Agency Attribution */}
          <div className="md:col-span-3 p-3.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#18251E]">
                Seller / Real Estate Agency Attribution
              </label>
              <span className="text-[10px] text-[#176B45] font-bold uppercase tracking-wider">
                User Management Sync
              </span>
            </div>
            <select
              value={formData.listedByUserId || 'superadmin'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'superadmin') {
                  setFormData((prev) => ({
                    ...prev,
                    listedByUserId: undefined,
                    listedByName: undefined,
                    listedByRole: undefined,
                  }));
                } else {
                  const users = userPortalService.getUsersWithListingStats();
                  const u = users.find((user) => user.id === val);
                  if (u) {
                    setFormData((prev) => ({
                      ...prev,
                      listedByUserId: u.id,
                      listedByName: u.agencyName ? `${u.name} (${u.agencyName})` : u.name,
                      listedByRole: u.role,
                      selectedPackageId: u.activePackageId,
                    }));
                  }
                }
              }}
              className="w-full px-3 py-2 text-xs border border-[#DDE5DF] rounded-[2px] bg-white text-[#18251E] font-medium"
            >
              <option value="superadmin">LankaProperty Platform Direct (Superadmin Authenticated)</option>
              {userPortalService.getUsersWithListingStats().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.agencyName ? `[Agency: ${u.agencyName}]` : `[Private Owner]`} — {u.district || 'Sri Lanka'} ({u.activePackageId.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#5F6B63]">
              Assigns this listing to a registered Property Owner or Agency profile. The listing will appear in their dashboard and lead CRM automatically.
            </p>
          </div>

          {/* Title */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Property Headline / Title <span className="text-[#C93636]">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g. The Frangipani Courtyard Villa"
              className={`w-full px-3.5 py-2.5 text-sm border ${
                validationErrors.title ? 'border-[#C93636]' : 'border-[#DDE5DF]'
              } rounded-[3px] ${
                highlightedFields.has('title') ? 'bg-[#E8F3EC]' : 'bg-white'
              } transition-colors`}
            />
            {validationErrors.title && (
              <p className="text-xs text-[#C93636] font-semibold mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Transaction Purpose <span className="text-[#C93636]">*</span>
            </label>
            <select
              value={formData.purpose}
              onChange={(e) => handleFieldChange('purpose', e.target.value as PropertyPurpose)}
              className={`w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] ${
                highlightedFields.has('purpose') ? 'bg-[#E8F3EC]' : 'bg-white'
              } font-medium`}
            >
              <option value="buy">For Sale</option>
              <option value="rent">For Rent</option>
              <option value="land">Land Parcel</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Property Category <span className="text-[#C93636]">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleFieldChange('type', e.target.value as PropertyType)}
              className={`w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] ${
                highlightedFields.has('type') ? 'bg-[#E8F3EC]' : 'bg-white'
              } font-medium`}
            >
              <option value="land">Land</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="hotel">Hotel</option>
              <option value="business">Business</option>
            </select>
          </div>

          {/* Inventory Status */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Marketplace Inventory Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-white font-medium"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold / Concluded</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. LOCATION */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 3 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-4`}
      >
        <div className="pb-3 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E]">3. Regional Location</h2>
          <p className="text-xs text-[#5F6B63]">District, locality, road boundaries, and optional maps integration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* District */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              District <span className="text-[#C93636]">*</span>
            </label>
            <select
              value={formData.location.district}
              onChange={(e) => handleFieldChange('location.district', e.target.value)}
              className={`w-full px-3.5 py-2.5 text-sm border ${
                validationErrors['location.district'] ? 'border-[#C93636]' : 'border-[#DDE5DF]'
              } rounded-[3px] ${
                highlightedFields.has('location.district') ? 'bg-[#E8F3EC]' : 'bg-white'
              } font-medium`}
            >
              <option value="">Select Sri Lanka District...</option>
              {SRI_LANKA_DISTRICTS.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district} ({d.province})
                </option>
              ))}
            </select>
            {validationErrors['location.district'] && (
              <p className="text-xs text-[#C93636] font-semibold mt-1">{validationErrors['location.district']}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              City / Town <span className="text-[#C93636]">*</span>
            </label>
            <input
              type="text"
              value={formData.location.city}
              onChange={(e) => handleFieldChange('location.city', e.target.value)}
              placeholder="e.g. Talpe, Colombo 07, Kandy"
              list="city-suggestions"
              className={`w-full px-3.5 py-2.5 text-sm border ${
                validationErrors['location.city'] ? 'border-[#C93636]' : 'border-[#DDE5DF]'
              } rounded-[3px] ${
                highlightedFields.has('location.city') ? 'bg-[#E8F3EC]' : 'bg-white'
              }`}
            />
            <datalist id="city-suggestions">
              {getCitiesForDistrict(formData.location.district).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {validationErrors['location.city'] && (
              <p className="text-xs text-[#C93636] font-semibold mt-1">{validationErrors['location.city']}</p>
            )}
          </div>

          {/* Province (Auto-assigned or selectable) */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">Province</label>
            <input
              type="text"
              value={formData.location.province || ''}
              onChange={(e) => handleFieldChange('location.province', e.target.value)}
              placeholder="Province auto-filled"
              className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-[#F5F8F5]"
            />
          </div>

          {/* Address / Road Locality */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Address / Locality Reference
            </label>
            <input
              type="text"
              value={formData.location.address || ''}
              onChange={(e) => handleFieldChange('location.address', e.target.value)}
              placeholder="e.g. Matara Road, Talpe (or specific boundary lane)"
              className={`w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] ${
                highlightedFields.has('location.address') ? 'bg-[#E8F3EC]' : 'bg-white'
              }`}
            />
          </div>

          {/* Map URL */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Google Maps URL / Coordinates Link
            </label>
            <input
              type="url"
              value={formData.mapUrl || ''}
              onChange={(e) => handleFieldChange('mapUrl', e.target.value)}
              placeholder="https://maps.google.com/..."
              className={`w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] ${
                highlightedFields.has('mapUrl') ? 'bg-[#E8F3EC]' : 'bg-white'
              }`}
            />
          </div>

          {/* Cadastral Market Benchmark Dossier */}
          {formData.location.district && (
            <div className="col-span-full p-4 bg-[#FAFBF9] border border-[#176B45]/30 rounded-[3px] text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#103D2C] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#176B45]"></span>
                  Cadastral Market Benchmark: {formData.location.district} District
                </span>
                <a
                  href={`/districts/${formData.location.district.toLowerCase()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#176B45] hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  View District SEO Hub →
                </a>
              </div>
              {(() => {
                const distInfo = SRI_LANKA_DISTRICTS.find(
                  (d) => d.district.toLowerCase() === formData.location.district.toLowerCase()
                );
                if (!distInfo) return null;
                return (
                  <div className="space-y-1">
                    <p className="text-[#5F6B63]">{distInfo.character}</p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 font-semibold text-[#18251E]">
                      <span>Land Benchmark: <strong className="text-[#176B45]">{distInfo.landBenchmark}</strong></span>
                      <span>Province: <strong>{distInfo.province}</strong></span>
                      <span>Cadastral Coverage: <strong>{distInfo.cities.length} Registered Localities</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. PRICE & SPECIFICATIONS */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 4 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-4`}
      >
        <div className="pb-3 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E]">4. Price & Specifications</h2>
          <p className="text-xs text-[#5F6B63]">
            Asking price in LKR, unit selection, negotiability, and concrete structural measurements.
          </p>
        </div>

        {/* Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Price LKR */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Asking Price (LKR) <span className="text-[#C93636]">*</span>
            </label>
            <input
              type="number"
              value={formData.priceLkr === 0 ? '' : formData.priceLkr}
              onChange={(e) => handleFieldChange('priceLkr', e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder="e.g. 78500000"
              className={`w-full px-3.5 py-2.5 text-base font-bold text-[#103D2C] border ${
                validationErrors.priceLkr ? 'border-[#C93636]' : 'border-[#DDE5DF]'
              } rounded-[3px] ${
                highlightedFields.has('priceLkr') ? 'bg-[#E8F3EC]' : 'bg-white'
              }`}
            />
            {formData.priceLkr > 0 && (
              <span className="block text-xs text-[#176B45] font-semibold mt-1">
                Formatted: {formatPriceLkr(formData.priceLkr, formData.priceUnit)}
              </span>
            )}
            {validationErrors.priceLkr && (
              <p className="text-xs text-[#C93636] font-semibold mt-1">{validationErrors.priceLkr}</p>
            )}
          </div>

          {/* Price Unit */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">Price Unit</label>
            <select
              value={formData.priceUnit}
              onChange={(e) => handleFieldChange('priceUnit', e.target.value as PriceUnit)}
              className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-white font-medium"
            >
              <option value="total">Total Valuation</option>
              <option value="perch">Per Perch</option>
              <option value="month">Per Month (Rent)</option>
            </select>
          </div>

          {/* Negotiability / Price on request */}
          <div className="space-y-2 pt-2 sm:pt-6">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#18251E] cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.isNegotiable)}
                onChange={(e) => handleFieldChange('isNegotiable', e.target.checked)}
                className="rounded-[2px] text-[#176B45]"
              />
              <span>Price Negotiable</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-[#18251E] cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.priceOnRequest)}
                onChange={(e) => handleFieldChange('priceOnRequest', e.target.checked)}
                className="rounded-[2px] text-[#176B45]"
              />
              <span>Price on Request</span>
            </label>
          </div>

          {/* Calculation Note */}
          {formData.calculationNote && (
            <div className="md:col-span-4 p-3 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs text-[#5F6B63]">
              <strong>Calculation Note:</strong> {formData.calculationNote}
            </div>
          )}

          {/* CBSL Financing & Statutory Estimate Preview */}
          {formData.priceLkr > 0 && (
            <div className="md:col-span-4 p-3.5 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
              <div>
                <span className="text-[10px] text-[#5F6B63] block uppercase tracking-wider font-bold">
                  Statutory Stamp Duty (approx. 4%)
                </span>
                <span className="font-extrabold text-[#18251E] text-sm">
                  {formatPriceLkr(formData.priceLkr * 0.04)}
                </span>
                <span className="text-[10px] text-[#5F6B63] block mt-0.5">3% on first 100k, 4% balance</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5F6B63] block uppercase tracking-wider font-bold">
                  Est. CBSL Housing Loan (12% p.a., 15y)
                </span>
                <span className="font-extrabold text-[#176B45] text-sm">
                  {formatPriceLkr(((formData.priceLkr * 0.7) * (0.01 * Math.pow(1.01, 180))) / (Math.pow(1.01, 180) - 1))}/mo
                </span>
                <span className="text-[10px] text-[#5F6B63] block mt-0.5">Assuming 70% Loan-to-Value</span>
              </div>
              <div>
                <span className="text-[10px] text-[#5F6B63] block uppercase tracking-wider font-bold">
                  Recommended Upfront Down Payment (30%)
                </span>
                <span className="font-extrabold text-[#103D2C] text-sm">
                  {formatPriceLkr(formData.priceLkr * 0.3)}
                </span>
                <span className="text-[10px] text-[#5F6B63] block mt-0.5">Meets CBSL capital adequacy</span>
              </div>
            </div>
          )}
        </div>

        {/* Specifications Strip (No forced 0 defaults) */}
        <div className="pt-4 border-t border-[#DDE5DF]">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#5F6B63] mb-3">
            Structural & Land Dimensions (Leave empty if unknown)
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {/* Bedrooms (Irrelevant for Land) */}
            {formData.type !== 'land' && (
              <div>
                <label className="block text-xs font-bold text-[#18251E] mb-1.5">Bedrooms</label>
                <input
                  type="number"
                  value={formData.specs.bedrooms ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'specs.bedrooms',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 4"
                  className={`w-full px-3.5 py-2.5 text-sm border ${
                    validationErrors['specs.bedrooms'] ? 'border-[#C93636]' : 'border-[#DDE5DF]'
                  } rounded-[3px] ${
                    highlightedFields.has('specs.bedrooms') ? 'bg-[#E8F3EC]' : 'bg-white'
                  }`}
                />
              </div>
            )}

            {/* Bathrooms (Irrelevant for Land) */}
            {formData.type !== 'land' && (
              <div>
                <label className="block text-xs font-bold text-[#18251E] mb-1.5">Bathrooms</label>
                <input
                  type="number"
                  value={formData.specs.bathrooms ?? ''}
                  onChange={(e) =>
                    handleFieldChange(
                      'specs.bathrooms',
                      e.target.value === '' ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder="e.g. 3"
                  className={`w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] ${
                    highlightedFields.has('specs.bathrooms') ? 'bg-[#E8F3EC]' : 'bg-white'
                  }`}
                />
              </div>
            )}

            {/* Floor Area (Sq Ft) */}
            <div>
              <label className="block text-xs font-bold text-[#18251E] mb-1.5">Floor Area (Sq Ft)</label>
              <input
                type="number"
                value={formData.specs.floorAreaSqFt ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'specs.floorAreaSqFt',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                placeholder="e.g. 3200"
                className={`w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] ${
                  highlightedFields.has('specs.floorAreaSqFt') ? 'bg-[#E8F3EC]' : 'bg-white'
                }`}
              />
            </div>

            {/* Land Extent (Perches) */}
            <div>
              <label className="block text-xs font-bold text-[#18251E] mb-1.5">
                Land Extent (Perches) {formData.type === 'land' && <span className="text-[#C93636]">*</span>}
              </label>
              <input
                type="number"
                step="any"
                value={formData.specs.landPerches ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'specs.landPerches',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                placeholder="e.g. 28"
                className={`w-full px-3.5 py-2.5 text-sm border ${
                  validationErrors['specs.landPerches'] ? 'border-[#C93636]' : 'border-[#DDE5DF]'
                } rounded-[3px] ${
                  highlightedFields.has('specs.landPerches') ? 'bg-[#E8F3EC]' : 'bg-white'
                }`}
              />
            </div>

            {/* Parking Spaces */}
            <div>
              <label className="block text-xs font-bold text-[#18251E] mb-1.5">Parking Spaces</label>
              <input
                type="number"
                value={formData.specs.parkingSpaces ?? ''}
                onChange={(e) =>
                  handleFieldChange(
                    'specs.parkingSpaces',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                placeholder="e.g. 2"
                className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-white"
              />
            </div>

            {/* Furnishing */}
            <div>
              <label className="block text-xs font-bold text-[#18251E] mb-1.5">Furnishing</label>
              <select
                value={formData.specs.furnishing || ''}
                onChange={(e) => handleFieldChange('specs.furnishing', e.target.value || undefined)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-white font-medium"
              >
                <option value="">Not Specified</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Fully Furnished">Fully Furnished</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. DESCRIPTION & ADDITIONAL INFORMATION */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 5 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-5`}
      >
        <div className="pb-3 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E]">5. Description & Editorial Content</h2>
          <p className="text-xs text-[#5F6B63]">
            Distinct content areas: Public Description, Structured Buyer Highlights, and Material Specifications.
          </p>
        </div>

        {/* 1. Property Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#18251E]">
            Property Description <span className="text-[#C93636]">*</span>
          </label>
          <p className="text-xs text-[#5F6B63]">
            A readable introductory overview based strictly on supplied facts. Renders real paragraphs without literal "\n".
          </p>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Write or auto-generate the property introduction..."
            className={`w-full p-3.5 text-sm border ${
              validationErrors.description ? 'border-[#C93636]' : 'border-[#DDE5DF]'
            } rounded-[3px] ${
              highlightedFields.has('description') ? 'bg-[#E8F3EC]' : 'bg-white'
            } leading-relaxed`}
          />
          {validationErrors.description && (
            <p className="text-xs text-[#C93636] font-semibold">{validationErrors.description}</p>
          )}
        </div>

        {/* 2. Additional Information */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#18251E]">
            Additional Information (Structured Buyer Headings)
          </label>
          <p className="text-xs text-[#5F6B63]">
            Organized buyer-facing details. Use clean headings such as: Property Highlights, Access & Location, Utilities & Facilities.
          </p>
          <textarea
            rows={5}
            value={formData.additionalInfo || ''}
            onChange={(e) => handleFieldChange('additionalInfo', e.target.value)}
            placeholder={`### Property Highlights\n- Private swimming pool with timber deck\n- 3-phase electricity and backup solar inverter\n\n### Access & Location\n- 20-foot wide carpeted access road\n- 400m from Talpe beach strip`}
            className={`w-full p-3.5 text-sm font-sans border border-[#DDE5DF] rounded-[3px] ${
              highlightedFields.has('additionalInfo') ? 'bg-[#E8F3EC]' : 'bg-white'
            } leading-relaxed`}
          />
        </div>

        {/* 3. Material Specifications */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#18251E]">
            Material Specifications & Finishes
          </label>
          <p className="text-xs text-[#5F6B63]">
            Construction materials, timber species (Kumbuk, Teak), titanium flooring, and architectural fittings explicitly supplied.
          </p>
          <textarea
            rows={3}
            value={formData.materialSpecs || ''}
            onChange={(e) => handleFieldChange('materialSpecs', e.target.value)}
            placeholder="e.g. Polished Kumbuk timber staircase, solid teak doors, imported Grohe sanitary fittings, solar hot water system."
            className={`w-full p-3.5 text-sm border border-[#DDE5DF] rounded-[3px] ${
              highlightedFields.has('materialSpecs') ? 'bg-[#E8F3EC]' : 'bg-white'
            }`}
          />
        </div>

        {/* 4. Private Staff Notes (Strictly hidden from public view) */}
        <div className="pt-3 border-t border-[#DDE5DF] space-y-1.5">
          <label className="block text-xs font-extrabold text-[#C93636] uppercase tracking-wider">
            Private Administrative Staff Notes (Internal Only)
          </label>
          <p className="text-xs text-[#5F6B63]">
            Confidential broker records, title verification remarks, seller escrow requirements. Strictly omitted from public pages.
          </p>
          <textarea
            rows={2}
            value={formData.privateStaffNotes || ''}
            onChange={(e) => handleFieldChange('privateStaffNotes', e.target.value)}
            placeholder="Internal notes: Deed approved by legal counsel on Oct 02. Seller requesting direct bank transfer."
            className="w-full p-3 text-xs border border-amber-300 rounded-[3px] bg-amber-50/40 text-[#18251E]"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. PHOTOS & MEDIA WORKFLOW */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 6 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-5`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DDE5DF]">
          <div>
            <h2 className="text-lg font-bold text-[#18251E]">6. Photography & Media Gallery</h2>
            <p className="text-xs text-[#5F6B63]">
              Click, hold, and drag any photo to reorder. Position #1 is automatically the Main Cover Photo.
            </p>
          </div>
          <span className="text-xs font-bold tabular-nums px-3 py-1 bg-[#E8F3EC] border border-[#176B45]/30 rounded-[3px] text-[#103D2C] self-start sm:self-auto">
            {formData.images.length} Photos Uploaded · Unlimited SuperAdmin Quota
          </span>
        </div>

        {/* Compact Drop Area (Supports drag-and-drop file upload) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processImageFiles(e.dataTransfer.files);
            }
          }}
          className="border-2 border-dashed border-[#DDE5DF] hover:border-[#176B45] rounded-[4px] p-6 text-center bg-[#F5F8F5]/60 transition-colors"
        >
          <UploadCloud className="w-8 h-8 text-[#176B45] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#18251E]">Drag and drop images here, or browse files</p>
          <p className="text-xs text-[#5F6B63] mt-0.5">
            Supports high-resolution JPG, PNG, WEBP with automatic client-side compression. Unlimited photos for SuperAdmin.
          </p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <label className="px-4 py-2 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] cursor-pointer transition-colors shadow-2xs">
              <span>Select Files</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Or add via URL */}
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="Or enter image URL: https://images.unsplash.com/..."
            className="flex-1 px-3.5 py-2 text-xs border border-[#DDE5DF] rounded-[3px] bg-white"
          />
          <button
            type="button"
            onClick={handleAddImageUrl}
            className="px-4 py-2 border border-[#DDE5DF] bg-[#F5F8F5] hover:bg-white text-xs font-bold uppercase tracking-wider rounded-[3px]"
          >
            Add Image URL
          </button>
        </div>

        {/* Selected Image Thumbnails Gallery (Click, Hold & Drag to Reorder) */}
        {formData.images.length > 0 ? (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[11px] text-[#5F6B63] font-semibold">
              <span>Click & hold any photo to drag it to Position #1 (Main Cover) or reorder your gallery.</span>
              <span>Drag-and-Drop Reordering Active</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.images.map((imgUrl, idx) => {
                const isCover = idx === 0;
                const isDragging = draggedImageIndex === idx;
                const isDragOver = dragOverImageIndex === idx && draggedImageIndex !== idx;
                return (
                  <div
                    key={`${idx}-${imgUrl.slice(-24)}`}
                    draggable
                    onDragStart={(e) => {
                      setDraggedImageIndex(idx);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', String(idx));
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverImageIndex !== idx) {
                        setDragOverImageIndex(idx);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverImageIndex === idx) {
                        setDragOverImageIndex(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fromIdx = draggedImageIndex;
                      setDraggedImageIndex(null);
                      setDragOverImageIndex(null);
                      if (fromIdx !== null && fromIdx !== idx) {
                        handleMoveImage(fromIdx, idx);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedImageIndex(null);
                      setDragOverImageIndex(null);
                    }}
                    className={`group relative aspect-4/3 rounded-[3px] overflow-hidden border transition-all cursor-grab active:cursor-grabbing select-none ${
                      isDragging
                        ? 'opacity-45 scale-95 border-dashed border-[#103D2C]'
                        : isDragOver
                        ? 'border-2 border-[#C93636] ring-2 ring-[#C93636]/30 scale-[1.03]'
                        : isCover
                        ? 'border-2 border-[#176B45] ring-2 ring-[#176B45]/20'
                        : 'border-[#DDE5DF] hover:border-[#103D2C]'
                    } bg-[#F5F8F5] shadow-xs`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Listing photo ${idx + 1}`}
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Position / Cover Badge */}
                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-[2px] shadow-xs ${
                        isCover ? 'bg-[#176B45] text-white' : 'bg-[#103D2C]/85 text-white'
                      }`}
                    >
                      {isCover ? 'Main Cover (#1)' : `#${idx + 1}`}
                    </div>

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-[2px] cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-white">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetCoverPhoto(idx);
                            }}
                            className="px-2 py-1 bg-white text-[#18251E] hover:bg-[#E8F3EC] text-[10px] font-bold uppercase tracking-wider rounded-[2px] cursor-pointer"
                          >
                            Set Cover
                          </button>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveImage(idx, idx - 1);
                            }}
                            disabled={idx === 0}
                            className="p-1 bg-white/20 hover:bg-white/40 rounded-[2px] disabled:opacity-30 cursor-pointer"
                            title="Move Left"
                          >
                            <ArrowUp className="w-3 h-3 rotate-[-90deg]" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveImage(idx, idx + 1);
                            }}
                            disabled={idx === formData.images.length - 1}
                            className="p-1 bg-white/20 hover:bg-white/40 rounded-[2px] disabled:opacity-30 cursor-pointer"
                            title="Move Right"
                          >
                            <ArrowDown className="w-3 h-3 rotate-[-90deg]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] text-xs text-[#5F6B63] text-center">
            No photos uploaded yet. A cover photo is required prior to marketplace publication.
          </div>
        )}

        {/* Video Tour URL */}
        <div className="pt-3 border-t border-[#DDE5DF]">
          <label className="block text-xs font-bold text-[#18251E] mb-1.5">
            Video Tour URL (YouTube / Vimeo)
          </label>
          <input
            type="url"
            value={formData.videoUrl || ''}
            onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-white"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 7. CONTACT DETAILS */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 7 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-4`}
      >
        <div className="pb-3 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E]">7. Contact & Broker Desk</h2>
          <p className="text-xs text-[#5F6B63]">
            Direct contact credentials presented to verified inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Agent Name */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Assigned Specialist Name <span className="text-[#C93636]">*</span>
            </label>
            <input
              type="text"
              value={formData.agent.name}
              onChange={(e) => handleFieldChange('agent.name', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-white font-medium"
            />
          </div>

          {/* Primary Phone */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              Primary Phone Number <span className="text-[#C93636]">*</span>
            </label>
            <input
              type="text"
              value={formData.agent.phone}
              onChange={(e) => handleFieldChange('agent.phone', e.target.value)}
              placeholder="+94 77 123 4567"
              className={`w-full px-3.5 py-2.5 text-sm border ${
                validationErrors['agent.phone'] ? 'border-[#C93636]' : 'border-[#DDE5DF]'
              } rounded-[3px] ${
                highlightedFields.has('agent.phone') ? 'bg-[#E8F3EC]' : 'bg-white'
              }`}
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-bold text-[#18251E] mb-1.5">
              WhatsApp Pre-Filled Number
            </label>
            <input
              type="text"
              value={formData.agent.whatsapp}
              onChange={(e) => handleFieldChange('agent.whatsapp', e.target.value)}
              placeholder="94771234567"
              className="w-full px-3.5 py-2.5 text-sm border border-[#DDE5DF] rounded-[3px] bg-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 8. PACKAGE & HOMEPAGE VISIBILITY */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 8 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-5`}
      >
        <div className="pb-3 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E]">8. Package Tier & Homepage Visibility</h2>
          <p className="text-xs text-[#5F6B63]">
            Operational publishing packages are separate from editorial section placements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Package Tier (Free Unlimited Override for SuperAdmin) */}
          <div className="p-4 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#18251E] block">
                Operational Listing Package
              </span>
              <span className="px-2 py-0.5 bg-[#103D2C] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-[2px]">
                SuperAdmin: Free Unlimited ($0)
              </span>
            </div>
            <p className="text-[11px] text-[#5F6B63]">
              SuperAdmin can publish unlimited listings across any tier, Featured, or Trending placement at LKR 0.
            </p>
            <div className="space-y-2">
              {(['standard', 'gold', 'platinum'] as const).map((tier) => (
                <label
                  key={tier}
                  className={`flex items-center justify-between p-3 rounded-[3px] border cursor-pointer transition-colors ${
                    formData.packageTier === tier
                      ? 'bg-white border-[#176B45] shadow-xs'
                      : 'bg-white/60 border-[#DDE5DF] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="packageTier"
                      checked={formData.packageTier === tier}
                      onChange={() => handleFieldChange('packageTier', tier)}
                      className="text-[#176B45]"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider capitalize text-[#18251E]">
                      {tier} Tier
                    </span>
                  </div>
                  <span className="text-xs text-[#5F6B63]">
                    {tier === 'platinum' ? '30 days featured' : tier === 'gold' ? '14 days featured' : 'Standard catalog'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Editorial Section Placements (Requires manual staff authorization) */}
          <div className="p-4 bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#18251E] block">
              Homepage Editorial Sections
            </span>
            <p className="text-[11px] text-[#5F6B63]">
              Placement criteria: Public visibility requires a published active listing. Toggling a collection on a
              draft does NOT make it public.
            </p>

            <div className="space-y-2.5">
              {/* Featured Properties */}
              <label className="flex items-start gap-2.5 p-2.5 bg-white border border-[#DDE5DF] rounded-[3px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isFeatured)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleFieldChange('isFeatured', checked);
                    const nextColls = checked
                      ? Array.from(new Set([...formData.collections, 'featured' as const]))
                      : formData.collections.filter((c) => c !== 'featured');
                    handleFieldChange('collections', nextColls);
                  }}
                  className="rounded-[2px] text-[#176B45] mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-[#18251E] block">Section G: Featured Properties</span>
                  <span className="text-[11px] text-[#5F6B63]">
                    Horizontal grid card with detailed photo-to-info ratio.
                  </span>
                </div>
              </label>

              {/* Architectural Homes */}
              <label className="flex items-start gap-2.5 p-2.5 bg-white border border-[#DDE5DF] rounded-[3px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.collections.includes('architectural')}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextColls = checked
                      ? Array.from(new Set([...formData.collections, 'architectural' as const]))
                      : formData.collections.filter((c) => c !== 'architectural');
                    handleFieldChange('collections', nextColls);
                  }}
                  className="rounded-[2px] text-[#176B45] mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-[#18251E] block">
                    Section C: Curated Collection (Architectural Tab)
                  </span>
                  <span className="text-[11px] text-[#5F6B63]">Requires exceptional architectural heritage.</span>
                </div>
              </label>

              {/* Land Collection */}
              <label
                className={`flex items-start gap-2.5 p-2.5 bg-white border border-[#DDE5DF] rounded-[3px] ${
                  formData.type === 'land' || formData.purpose === 'land'
                    ? 'cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={formData.type !== 'land' && formData.purpose !== 'land'}
                  checked={formData.collections.includes('land')}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const nextColls = checked
                      ? Array.from(new Set([...formData.collections, 'land' as const]))
                      : formData.collections.filter((c) => c !== 'land');
                    handleFieldChange('collections', nextColls);
                  }}
                  className="rounded-[2px] text-[#176B45] mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-[#18251E] block">
                    Section C: Curated Collection (Land Tab)
                  </span>
                  <span className="text-[11px] text-[#5F6B63]">
                    {formData.type === 'land' || formData.purpose === 'land'
                      ? 'Eligible land parcel'
                      : 'Requires property type or purpose to be Land.'}
                  </span>
                </div>
              </label>

              {/* Signature Story */}
              <label className="flex items-start gap-2.5 p-2.5 bg-white border border-[#DDE5DF] rounded-[3px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isSignature)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleFieldChange('isSignature', checked);
                    const nextColls = checked
                      ? Array.from(new Set([...formData.collections, 'signature' as const]))
                      : formData.collections.filter((c) => c !== 'signature');
                    handleFieldChange('collections', nextColls);
                  }}
                  className="rounded-[2px] text-[#176B45] mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-[#18251E] block">
                    Section E: Signature Property Story
                  </span>
                  <span className="text-[11px] text-[#5F6B63]">
                    Full-width editorial sequence on homepage. Requires explicit staff choice.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 9. REVIEW & PUBLISH */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`bg-white border ${
          activeSection === 9 ? 'border-[#176B45]' : 'border-[#DDE5DF]'
        } rounded-[4px] p-5 sm:p-6 shadow-xs space-y-6`}
      >
        <div className="pb-3 border-b border-[#DDE5DF]">
          <h2 className="text-lg font-bold text-[#18251E]">9. Review & Final Publishing</h2>
          <p className="text-xs text-[#5F6B63]">
            Verify all fields, check validation status, and publish to the live marketplace.
          </p>
        </div>

        {/* Validation Errors banner if any */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-[3px] text-xs text-[#C93636] space-y-1.5">
            <strong className="block font-bold">Unresolved Required Items for Publication:</strong>
            <ul className="list-disc list-inside space-y-0.5">
              {Object.entries(validationErrors).map(([k, err]) => (
                <li key={k}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Visual Live Card Preview Before Publishing */}
        <div className="p-4 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[#103D2C]">
              Live Marketplace Preview
            </span>
            <span className="text-[#5F6B63] font-semibold">
              {formData.images.length} {formData.images.length === 1 ? 'photo' : 'photos'} attached
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#DDE5DF] rounded-[3px] overflow-hidden shadow-xs">
            <div className="w-full md:w-64 aspect-16/10 md:aspect-auto md:min-h-[150px] bg-[#F5F8F5] shrink-0 relative overflow-hidden">
              {formData.images.length > 0 ? (
                <img
                  src={formData.images[0]}
                  alt={formData.title || 'Property cover preview'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#5F6B63] font-semibold p-4 text-center">
                  No cover photo selected yet
                </div>
              )}
              {formData.images.length > 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#103D2C]/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                  Cover Image (#1)
                </span>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#5F6B63]">
                  {formData.location.city || 'City'}, {formData.location.district || 'District'} ·{' '}
                  {formData.purpose.toUpperCase()} · {formData.type.toUpperCase()}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#18251E] line-clamp-1">
                  {formData.title || 'Untitled Listing'}
                </h3>
                <p className="text-xs text-[#5F6B63] line-clamp-2">
                  {formData.description || 'Property description will appear here...'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DDE5DF]">
                <span className="text-base sm:text-lg font-extrabold text-[#103D2C] tabular-nums">
                  {formData.priceLkr > 0
                    ? formatPriceLkr(formData.priceLkr, formData.priceUnit)
                    : 'Price not entered'}
                </span>

                {formData.images.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {formData.images.slice(1, 5).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Gallery thumb ${i + 2}`}
                        className="w-9 h-7 object-cover rounded-[2px] border border-[#DDE5DF]"
                      />
                    ))}
                    {formData.images.length > 5 && (
                      <span className="text-[10px] font-bold text-[#5F6B63] px-1">
                        +{formData.images.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Contact Publication Notice */}
        <div className="p-3.5 bg-[#E8F3EC] border border-[#176B45]/30 rounded-[3px] text-xs text-[#103D2C] flex items-start gap-2">
          <Info className="w-4 h-4 text-[#176B45] shrink-0 mt-0.5" />
          <p>
            <strong>Public Contact Disclosure:</strong> Publishing this listing will display{' '}
            <strong>{formData.agent.name}</strong> ({formData.agent.phone}) as the primary contact point on the public
            detail page and pre-fill direct WhatsApp buyer inquiries.
          </p>
        </div>

        {/* Final Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#DDE5DF]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5F6B63]">
              Listing Reference: <strong>{formData.listingRef || formData.id}</strong> · Status:{' '}
              <strong className="capitalize">{formData.publicationStatus}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isEditing && hasPermission('canDeleteListings') && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-red-300 bg-white text-[#C93636] hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#C93636]" />
                <span>Delete</span>
              </button>
            )}

            {formData.publicationStatus === 'published' && (
              <button
                type="button"
                onClick={handleUnpublishListing}
                className="px-4 py-2 border border-red-300 bg-white text-[#C93636] hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors"
              >
                Unpublish to Draft
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#176B45] bg-white text-[#176B45] hover:bg-[#E8F3EC] text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            {hasPermission('canPublishListings') && (
              <button
                type="button"
                onClick={handlePublishListing}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#176B45] hover:bg-[#115236] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {formData.publicationStatus === 'published'
                    ? 'Update Published Listing'
                    : 'Publish Listing to Marketplace'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Permanent Deletion Safety Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#C93636]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#18251E]">
                  Permanently Delete Listing?
                </h3>
                <p className="text-xs text-[#5F6B63] mt-0.5">
                  Are you sure you want to permanently delete <strong>{formData.title}</strong>? This action is irreversible and will delete the listing from both local memory and the Supabase cloud database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#DDE5DF]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white border border-[#DDE5DF] text-xs font-semibold text-[#5F6B63] hover:text-[#18251E] rounded-[2px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCurrentProperty}
                className="px-4 py-2 bg-[#C93636] hover:bg-[#A92828] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Permanent Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
