'use client';

import { Fragment, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useSovItems } from '@/hooks/useSovItems';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, Plus, Minus, Trash2, Check, ChevronsUpDown, MessageSquare, Pencil, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DollarPercentCurrencyInputField } from '@/components/ui/dollar-percent-currency-input-field';
import { toast } from 'sonner';
interface SovMasterItem {
  id: number;
  item_number: string;
  display_item_number: string;
  description: string;
  display_name: string;
  work_type: string;
  uom_1: string | null;
  uom_2: string | null;
  uom_3: string | null;
  uom_4: string | null;
  uom_5: string | null;
  uom_6: string | null;
  uom_7: string | null;
  is_custom?: boolean;
}

import type { ScheduleOfValuesItem } from '@/types/job';

interface SOVTableProps {
  jobId?: string;
  contractId?: string;
  readOnly?: boolean;
  onEditAttempt?: () => void;
  isSignedContract?: boolean;
  changeOrderApproved?: boolean;
  forceShowPricing?: boolean;
}

export interface SOVTableHandle {
  flushPendingSave: () => Promise<void>;
}

interface CustomItemDraft {
  rowId: string;
  itemNumber: string;
  description: string;
  workType: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  retainageType: 'percent' | 'dollar';
  retainageValue: number;
  notes: string;
}

interface PendingDeleteState {
  rowId: string;
  reason: string;
}

interface SovItemEditorDraft {
  rowId: string;
  isNew: boolean;
  itemNumber: string;
  displayItemNumber: string;
  displayName: string;
  sourceDescription: string;
  workType: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  retainageType: 'percent' | 'dollar';
  retainageValue: number;
  notes: string;
  sov_item_id?: number;
  custom_sov_item_id?: number;
  isCustom?: boolean;
}

const CUSTOM_WORK_TYPE_OPTIONS = [
  { value: 'MPT', label: 'MPT' },
  { value: 'PERMANENT_SIGNS', label: 'Permanent Signs' },
  { value: 'FLAGGING', label: 'Flagging' },
  { value: 'LANE_CLOSURE', label: 'Lane Closure' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'RENTAL', label: 'Rental' },
  { value: 'SALE', label: 'Sale' },
];

function calcRetainageAmount(extendedPrice: number, type: 'percent' | 'dollar', value: number): number {
  if (type === 'percent') return Math.round(extendedPrice * (value / 100) * 100) / 100;
  return Math.round(Math.min(value, extendedPrice) * 100) / 100;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFirstNonNullUom(master: SovMasterItem): string {
  const firstUom = master.uom_1 || master.uom_2 || master.uom_3 || master.uom_4 || master.uom_5 || master.uom_6 || master.uom_7 || "EA";
  return normalizeUom(firstUom);
}

function normalizeUom(uom: string): string {
  const trimmed = uom.trim().replace(/\s+/g, " ");
  const normalizedKey = trimmed.replace(/\./g, "").toUpperCase();

  if (normalizedKey === "SQ FT" || normalizedKey === "SQFT") return "SQ. FT";
  if (normalizedKey === "SF") return "SF";
  if (normalizedKey === "LS" || normalizedKey === "LUMP SUM") return "LUMP SUM";

  return trimmed.toUpperCase();
}

function getAvailableUoms(master: SovMasterItem): string[] {
  const uoms = [master.uom_1, master.uom_2, master.uom_3, master.uom_4, master.uom_5, master.uom_6, master.uom_7];
  return Array.from(
    new Set(
      uoms
        .filter((uom): uom is string => uom !== null && uom.trim() !== '')
        .map(normalizeUom)
    )
  );
}

function getAvailableUomsForWorkType(products: SovMasterItem[], workType: string): string[] {
  if (!workType.trim()) return ["EA"];

  const matchingProducts = products.filter((product) => {
    const normalizedType = product.work_type?.trim().toUpperCase();
    return normalizedType === workType.trim().toUpperCase();
  });

  const uoms = matchingProducts.flatMap((product) => getAvailableUoms(product));
  const deduped = Array.from(new Set(uoms.map(normalizeUom)));

  return deduped.length > 0 ? deduped : ["EA"];
}

function mergeSelectableUoms(primaryUoms: string[], fallbackUoms: string[], currentUom?: string): string[] {
  const normalizedCurrent = currentUom?.trim() ? normalizeUom(currentUom) : null;

  return Array.from(
    new Set(
      [
        ...primaryUoms.map(normalizeUom),
        ...(normalizedCurrent ? [normalizedCurrent] : []),
        ...fallbackUoms.map(normalizeUom),
      ].filter((uom) => uom.trim() !== "")
    )
  );
}

function getMasterDisplayItemNumber(item: Pick<SovMasterItem, 'display_item_number' | 'item_number'>): string {
  return item.display_item_number?.trim() || item.item_number?.trim() || '';
}

function formatWorkTypeLabel(workType: string): string {
  const normalized = workType.trim().toUpperCase();

  switch (normalized) {
    case 'PERMANENT_SIGNS':
      return 'Permanent Signs';
    case 'LANE_CLOSURE':
      return 'Lane Closure';
    case 'FLAGGING':
      return 'Flagging';
    case 'DELIVERY':
      return 'Delivery';
    case 'SERVICE':
      return 'Service';
    case 'RENTAL':
      return 'Rental';
    case 'SALE':
      return 'Sale';
    case 'MPT':
      return 'MPT';
    case 'CUSTOM':
      return 'Custom';
    default:
      return workType || 'Other';
  }
}

function getWorkTypeTone(workType: string): string {
  const normalized = workType.trim().toUpperCase();

  switch (normalized) {
    case 'MPT':
      return 'border-[#16335A]/15 bg-[#16335A]/5 text-[#16335A]';
    case 'RENTAL':
      return 'border-amber-500/20 bg-amber-500/5 text-amber-800';
    case 'SALE':
      return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-800';
    case 'SERVICE':
      return 'border-violet-500/20 bg-violet-500/5 text-violet-800';
    case 'DELIVERY':
      return 'border-cyan-500/20 bg-cyan-500/5 text-cyan-800';
    case 'FLAGGING':
      return 'border-orange-500/20 bg-orange-500/5 text-orange-800';
    case 'LANE_CLOSURE':
      return 'border-rose-500/20 bg-rose-500/5 text-rose-800';
    case 'PERMANENT_SIGNS':
      return 'border-slate-500/20 bg-slate-500/5 text-slate-800';
    case 'CUSTOM':
      return 'border-zinc-500/20 bg-zinc-500/5 text-zinc-800';
    default:
      return 'border-border bg-muted/40 text-foreground';
  }
}

const SOVTableComponent = forwardRef<SOVTableHandle, SOVTableProps>(({
  jobId,
  contractId,
  readOnly = false,
  onEditAttempt,
  isSignedContract = false,
  changeOrderApproved = false,
  forceShowPricing = false
}, ref) => {
  console.log('[SOVTable] Component initialized with:', { jobId, contractId, readOnly });

  const [sovProducts, setSovProducts] = useState<SovMasterItem[]>([]);
  const [sovMasterLoading, setSovMasterLoading] = useState(false);
  // Use contractId if available, otherwise use jobId for the hook
  const effectiveId = contractId || jobId;
  const { items, loading: sovLoading, saving, updateItems, saveNow, removeItemWithReason } = useSovItems(effectiveId, !!contractId);

  console.log('[SOVTable] useSovItems hook returned:', { items: items.length, loading: sovLoading, saving });

  useEffect(() => {
    console.log('[SOVTable] Fetching SOV master items...');
    const fetchSovItems = async () => {
      setSovMasterLoading(true);
      try {
        const params = new URLSearchParams();
        if (effectiveId) params.set('job_id', effectiveId);
        const response = await fetch(`/api/sov-items${params.toString() ? `?${params.toString()}` : ''}`);
        console.log('[SOVTable] SOV master items API response:', response.status, response.statusText);
        if (response.ok) {
          const data = await response.json();
          console.log('[SOVTable] SOV master items data received:', data.data?.length || 0, 'items');
          setSovProducts(data.data || []);
        } else {
          console.error('[SOVTable] Failed to fetch SOV master items:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[SOVTable] Error fetching SOV master items:', error);
      } finally {
        setSovMasterLoading(false);
        console.log('[SOVTable] SOV master items fetch completed');
      }
    };

    fetchSovItems();
  }, [effectiveId]);

  const [selectorOpen, setSelectorOpen] = useState<string | null>(null);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorStep, setEditorStep] = useState<'pick' | 'configure'>('pick');
  const [editorDraft, setEditorDraft] = useState<SovItemEditorDraft | null>(null);
  const [customDraft, setCustomDraft] = useState<CustomItemDraft | null>(null);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);

  // Bulk retainage controls
  const [bulkType, setBulkType] = useState<'percent' | 'dollar'>('dollar');
  const [bulkValueDigits, setBulkValueDigits] = useState('');

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const notesTimeoutRef = useRef<number | null>(null);
  const [unitPriceDrafts, setUnitPriceDrafts] = useState<Record<string, string>>({});
  const [activePriceInputId, setActivePriceInputId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const showPricingColumns = forceShowPricing || !readOnly;
  const showWorkTypeColumn = !readOnly;
  const totalColumnCount =
    (readOnly ? 0 : 1) +
    1 +
    1 +
    (showWorkTypeColumn ? 1 : 0) +
    1 +
    1 +
    (showPricingColumns ? 4 : 0) +
    1 +
    1;
  const notesColSpan = totalColumnCount;
  const totalLabelColSpan = (readOnly ? 0 : 1) + (showWorkTypeColumn ? 6 : 5);

  useImperativeHandle(ref, () => ({
    flushPendingSave: async () => {
      await saveNow();
    },
  }), [saveNow]);

  useEffect(() => {
    setUnitPriceDrafts((prev) => {
      const next: Record<string, string> = {};
      items.forEach((item) => {
        next[item.id] = prev[item.id] ?? Math.round(item.unitPrice * 100).toFixed(0);
      });
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (customDialogOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      document.body.style.pointerEvents = "";
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [customDialogOpen]);

  useEffect(() => {
    if (readOnly || sovProducts.length === 0) return;

    const nextUomById = new Map<string, string>();

    items.forEach((item) => {
      if (!item.itemNumber) return;
      const masterItem = sovProducts.find((p) => p.item_number === item.itemNumber);
      if (!masterItem) return;

      const availableUoms = getAvailableUoms(masterItem);
      if (availableUoms.length === 0) return;

      const normalizedCurrent = item.uom ? normalizeUom(item.uom) : '';

      if (!normalizedCurrent || !availableUoms.includes(normalizedCurrent) || availableUoms.length === 1) {
        const nextUom = availableUoms.length === 1 ? availableUoms[0] : (normalizedCurrent || availableUoms[0]);
        if (normalizedCurrent !== nextUom) {
          nextUomById.set(item.id, nextUom);
        }
      }
    });

    if (nextUomById.size === 0) return;

    updateItems((prevItems) =>
      prevItems.map((item) =>
        nextUomById.has(item.id)
          ? { ...item, uom: nextUomById.get(item.id)! }
          : item
      )
    );
  }, [items, readOnly, sovProducts, updateItems]);

  const filteredItems = useMemo(() => {
    if (!selectorSearch.trim()) return sovProducts;

    const searchTerm = selectorSearch.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);

    return sovProducts.filter((p) => {
      const searchableText = [
        p.item_number,
        p.display_item_number,
        p.work_type,
        p.display_name,
        p.description
      ].join(' ').toLowerCase();

      // Check if all search words are present in the searchable text
      return searchWords.every(word => searchableText.includes(word));
    });
  }, [sovProducts, selectorSearch]);

  const sortedSelectableItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aType = (a.is_custom ? 'CUSTOM' : a.work_type || 'OTHER').trim().toUpperCase();
      const bType = (b.is_custom ? 'CUSTOM' : b.work_type || 'OTHER').trim().toUpperCase();

      if (aType !== bType) {
        if (aType === 'CUSTOM') return 1;
        if (bType === 'CUSTOM') return -1;
        return aType.localeCompare(bType);
      }

      return a.item_number.localeCompare(b.item_number, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredItems]);

  const groupedSelectableItems = useMemo(() => {
    return sortedSelectableItems.reduce<Array<{ heading: string; items: SovMasterItem[] }>>((acc, item) => {
      const heading = (item.is_custom ? 'CUSTOM' : item.work_type || 'OTHER').trim().toUpperCase();
      const lastGroup = acc[acc.length - 1];

      if (!lastGroup || lastGroup.heading !== heading) {
        acc.push({ heading, items: [item] });
        return acc;
      }

      lastGroup.items.push(item);
      return acc;
    }, []);
  }, [sortedSelectableItems]);

  const customUomOptions = useMemo(() => {
    const allUoms = sovProducts.flatMap((product) => getAvailableUoms(product));
    const deduped = Array.from(new Set(allUoms.filter((uom) => uom.trim() !== "").map(normalizeUom)));
    return deduped.length > 0 ? deduped : ["EA"];
  }, [sovProducts]);

  const buildEditorDraftFromItem = useCallback((item: ScheduleOfValuesItem, options?: { isNew?: boolean }): SovItemEditorDraft => ({
    rowId: item.id,
    isNew: options?.isNew ?? false,
    itemNumber: item.itemNumber || '',
    displayItemNumber: item.displayItemNumber || item.itemNumber || '',
    displayName: item.displayNameOverride || item.description || '',
    sourceDescription: item.sourceDescription || item.description || '',
    workType: item.work_type || '',
    uom: item.uomOverride || item.uom || '',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    retainageType: item.retainageType || 'dollar',
    retainageValue: item.retainageValue || 0,
    notes: item.notes || '',
    sov_item_id: item.sov_item_id,
    custom_sov_item_id: item.custom_sov_item_id,
    isCustom: item.is_custom,
  }), []);

  const openEditorForNewItem = useCallback(() => {
    const rowId = `temp-${crypto.randomUUID()}`;
    setEditorDraft({
      rowId,
      isNew: true,
      itemNumber: '',
      displayItemNumber: '',
      displayName: '',
      sourceDescription: '',
      workType: '',
      uom: '',
      quantity: 1,
      unitPrice: 0,
      retainageType: 'dollar',
      retainageValue: 0,
      notes: '',
    });
    setEditorStep('pick');
    setSelectorSearch('');
    setEditorOpen(true);
  }, []);

  const openEditorForExistingItem = useCallback((item: ScheduleOfValuesItem) => {
    setEditorDraft(buildEditorDraftFromItem(item));
    setEditorStep('configure');
    setSelectorSearch('');
    setEditorOpen(true);
  }, [buildEditorDraftFromItem]);

  const applyMasterToEditor = useCallback((master: SovMasterItem) => {
    setEditorDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        itemNumber: master.item_number,
        displayItemNumber: getMasterDisplayItemNumber(master),
        displayName: master.display_name || master.description || getMasterDisplayItemNumber(master),
        sourceDescription: master.description || '',
        workType: master.work_type || '',
        uom: getFirstNonNullUom(master),
        sov_item_id: master.is_custom ? undefined : master.id,
        custom_sov_item_id: master.is_custom ? master.id : undefined,
        isCustom: master.is_custom,
      };
    });
    setEditorStep('configure');
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditorStep('pick');
    setEditorDraft(null);
    setSelectorSearch('');
  }, []);

  const addRow = () => {
    // Check if change order is required for signed contracts
    if (isSignedContract && !changeOrderApproved && onEditAttempt) {
      onEditAttempt();
      return;
    }
    openEditorForNewItem();
  };

  const addCustomRow = () => {
    if (isSignedContract && !changeOrderApproved && onEditAttempt) {
      onEditAttempt();
      return;
    }
    openCustomDialog();
  };

  const updateRow = (id: string, field: keyof ScheduleOfValuesItem, value: string | number) => {
    updateItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? (value as number) : item.quantity;
          const price = field === 'unitPrice' ? (value as number) : item.unitPrice;
          updated.extendedPrice = Math.round(qty * price * 100) / 100;
          updated.retainageAmount = calcRetainageAmount(updated.extendedPrice, updated.retainageType, updated.retainageValue);
        }
        if (field === 'retainageType' || field === 'retainageValue') {
          const rType = field === 'retainageType' ? (value as 'percent' | 'dollar') : item.retainageType;
          const rValue = field === 'retainageValue' ? (value as number) : item.retainageValue;
          updated.retainageAmount = calcRetainageAmount(updated.extendedPrice, rType, rValue);
        }
        return updated;
      })
    );
  };

  const updateUnitPrice = (id: string, digits: string) => {
    setUnitPriceDrafts((prev) => ({ ...prev, [id]: digits }));
    updateRow(id, 'unitPrice', parseInt(digits || '0', 10) / 100);
  };

  const updateRetainage = (
    id: string,
    nextType: 'percent' | 'dollar',
    rawValue: number
  ) => {
    const currentItem = items.find((item) => item.id === id);
    const maxDollarRetainage = currentItem?.extendedPrice ?? Number.MAX_SAFE_INTEGER;
    let nextValue = Number.isFinite(rawValue) ? rawValue : 0;
    if (nextType === 'percent') nextValue = clampNumber(nextValue, 0, 100);
    else nextValue = clampNumber(nextValue, 0, maxDollarRetainage);
    nextValue = Math.round(nextValue * 100) / 100;

    updateItems(
      items.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          retainageType: nextType,
          retainageValue: nextValue,
          retainageAmount: calcRetainageAmount(item.extendedPrice, nextType, nextValue),
        };
      })
    );
  };

  const selectMasterItem = async (rowId: string, master: SovMasterItem) => {
    const effectiveId = contractId || jobId;

    console.log('[SOVTable] Selecting master item:', { rowId, master, effectiveId, isContract: !!contractId });

    // If no effectiveId yet (new unsaved contract), update local state optimistically.
    // useSovItems will persist the items once a contractId becomes available.
    if (!effectiveId) {
      console.log('[SOVTable] No effectiveId yet — updating local state optimistically');
      updateItems((prevItems) =>
        prevItems.map((item) =>
          item.id === rowId
            ? {
                ...item,
                itemNumber: master.item_number,
                displayItemNumber: getMasterDisplayItemNumber(master),
                description: master.description,
                work_type: master.work_type,
                uom: getFirstNonNullUom(master),
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                extendedPrice: item.extendedPrice || 0,
                retainageType: 'dollar',
                retainageValue: item.retainageValue || 0,
                retainageAmount: item.retainageAmount || 0,
              }
            : item
        )
      );
      setSelectorOpen(null);
      setSelectorSearch('');
      return;
    }

    try {
      // Immediately create database record when item is selected
      const payload = {
        sov_item_id: master.is_custom ? null : master.id,
        custom_sov_item_id: master.is_custom ? master.id : null,
        item_number: master.item_number,
        description: master.description,
        work_type: master.is_custom ? 'CUSTOM' : master.work_type,
        uom: getFirstNonNullUom(master),
        quantity: 1, // Default quantity
        unit_price: 0, // Default unit price
        retainage_type: 'dollar' as const,
        retainage_value: 0,
        notes: '',
        sort_order: items.length + 1,
      };

      console.log('[SOVTable] Creating database record for selected item:', payload);

      // Determine the correct API endpoint based on whether we're dealing with a contract or job
      const apiEndpoint = contractId 
        ? `/api/l/contracts/${contractId}/sov-items`
        : `/api/l/jobs/${jobId}/sov-items`;

      const requestBody = contractId ? { items: [payload] } : payload;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SOVTable] Failed to create SOV item record:', errorData);
        throw new Error(errorData?.error || `Failed to create SOV item: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[SOVTable] Successfully created SOV item record:', result);

      // For contracts, the response structure might be different, so adapt accordingly
      const createdItem = Array.isArray(result.data) && result.data.length > 0 
        ? result.data[0] 
        : result.data;

      // Replace the temp item with the real database record
      updateItems((prevItems) =>
        prevItems.map((item) =>
          item.id === rowId
            ? {
                ...item,
                id: createdItem.id, // Replace temp ID with real database ID
                sov_item_id: createdItem.sov_item_id ?? payload.sov_item_id ?? undefined,
                custom_sov_item_id: createdItem.custom_sov_item_id ?? payload.custom_sov_item_id ?? undefined,
                itemNumber: master.item_number,
                displayItemNumber: createdItem.display_item_number || getMasterDisplayItemNumber(master),
                description: master.description,
                work_type: createdItem.work_type || master.work_type,
                uom: createdItem.uom || getFirstNonNullUom(master),
                quantity: createdItem.quantity || payload.quantity,
                unitPrice: createdItem.unit_price || payload.unit_price,
                extendedPrice: createdItem.extended_price || (createdItem.quantity * createdItem.unit_price),
                retainageType: createdItem.retainage_type || payload.retainage_type,
                retainageValue: createdItem.retainage_value || payload.retainage_value,
                retainageAmount: createdItem.retainage_amount || 0,
              }
            : item
        )
      );

      console.log('[SOVTable] Successfully replaced temp item with database record');
    } catch (error) {
      console.error('[SOVTable] Error selecting master item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create SOV item');
    } finally {
      setSelectorOpen(null);
      setSelectorSearch('');
    }
  };

  const handleQuickAdd = (rowId: string, type: 'custom' | 'delivery' | 'service') => {
    if (type === 'custom') {
      openCustomDialog(rowId);
      return;
    }

    // For delivery and service, auto-fill the row
    const newItem: ScheduleOfValuesItem = {
      id: rowId,
      itemNumber: type === 'delivery' ? 'Delivery' : 'Service',
      description: type === 'delivery' ? 'Delivery' : 'Service',
      uom: 'EA',
      quantity: 1,
      unitPrice: 0,
      extendedPrice: 0,
      retainageType: 'dollar',
      retainageValue: 0,
      retainageAmount: 0,
      notes: '',
    };

    updateItems((prevItems) =>
      prevItems.map((item) => (item.id === rowId ? newItem : item))
    );
    setSelectorOpen(null);
  };

  const openCustomDialog = (rowId?: string) => {
    if (rowId) {
      // Editing existing custom row
      const existing = items.find((i) => i.id === rowId);
      if (existing) {
        setCustomDraft({
          rowId,
          itemNumber: existing.itemNumber,
          description: existing.description,
          workType: existing.work_type || '',
          uom: existing.uom || customUomOptions[0] || 'EA',
          quantity: existing.quantity || 1,
          unitPrice: existing.unitPrice || 0,
          retainageType: existing.retainageType || 'dollar',
          retainageValue: existing.retainageValue || 0,
          notes: existing.notes || '',
        });
      }
    } else {
      // Adding new custom row — create the row first
      const newId = crypto.randomUUID();
      const newItem: ScheduleOfValuesItem = {
        id: newId,
        itemNumber: '',
        description: '',
        work_type: '',
        uom: '',
        quantity: 0,
        unitPrice: 0,
        extendedPrice: 0,
        retainageType: 'dollar',
        retainageValue: 0,
        retainageAmount: 0,
        notes: '',
      };
      updateItems((prevItems) => [...prevItems, newItem]);
      setCustomDraft({
        rowId: newId,
        itemNumber: '',
        description: '',
        workType: '',
        uom: customUomOptions[0] || 'EA',
        quantity: 1,
        unitPrice: 0,
        retainageType: 'dollar',
        retainageValue: 0,
        notes: '',
      });
    }
    setCustomDialogOpen(true);
    setSelectorOpen(null);
    setSelectorSearch('');
  };

  const closeCustomDialog = (discardUnsavedRow: boolean) => {
    if (discardUnsavedRow && customDraft) {
      updateItems((prevItems) => {
        const row = prevItems.find((item) => item.id === customDraft.rowId);
        if (row && !row.itemNumber) {
          return prevItems.filter((item) => item.id !== customDraft.rowId);
        }
        return prevItems;
      });
    }

    setCustomDialogOpen(false);
    window.setTimeout(() => {
      setCustomDraft(null);
    }, 0);
  };

  const saveCustomItem = async () => {
    if (!customDraft || !customDraft.itemNumber.trim() || !customDraft.description.trim()) return;
    const quantity = Math.max(1, customDraft.quantity || 1);
    const unitPrice = Math.max(0, customDraft.unitPrice || 0);
    const extendedPrice = Math.round(quantity * unitPrice * 100) / 100;
    const retainageValue = customDraft.retainageType === 'percent'
      ? clampNumber(customDraft.retainageValue || 0, 0, 100)
      : clampNumber(customDraft.retainageValue || 0, 0, extendedPrice);
    const nextUom = normalizeUom(customDraft.uom || customUomOptions[0] || 'EA');
    const trimmedItemNumber = customDraft.itemNumber.trim();
    const trimmedDescription = customDraft.description.trim();
    const nextItem: ScheduleOfValuesItem = {
      id: customDraft.rowId,
      itemNumber: trimmedItemNumber,
      displayItemNumber: trimmedItemNumber,
      description: trimmedDescription,
      sourceDescription: trimmedDescription,
      displayNameOverride: trimmedDescription,
      work_type: customDraft.workType,
      uom: nextUom,
      uomOverride: nextUom,
      quantity,
      unitPrice,
      extendedPrice,
      retainageType: customDraft.retainageType,
      retainageValue,
      retainageAmount: calcRetainageAmount(
        extendedPrice,
        customDraft.retainageType,
        retainageValue
      ),
      notes: customDraft.notes || '',
      is_custom: true,
    };

    const effectiveId = contractId || jobId;
    if (!effectiveId) {
      updateItems((prevItems) =>
        prevItems.map((item) =>
          item.id === customDraft.rowId
            ? { ...item, ...nextItem }
            : item
        )
      );
      closeCustomDialog(false);
      return;
    }

    try {
      const payload = {
        sov_item_id: null,
        custom_sov_item_id: null,
        item_number: trimmedItemNumber,
        description: trimmedDescription,
        display_name_override: trimmedDescription,
        work_type: customDraft.workType,
        uom: nextUom,
        uom_override: nextUom,
        quantity,
        unit_price: unitPrice,
        retainage_type: customDraft.retainageType,
        retainage_value: retainageValue,
        notes: customDraft.notes || '',
        sort_order: items.length + 1,
      };

      const apiEndpoint = contractId
        ? `/api/l/contracts/${contractId}/sov-items`
        : `/api/l/jobs/${jobId}/sov-items`;
      const requestBody = contractId ? { items: [payload] } : payload;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to create custom SOV item: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const createdItem = Array.isArray(result.data) && result.data.length > 0
        ? result.data[0]
        : result.data;

      updateItems((prevItems) =>
        prevItems.map((item) =>
          item.id === customDraft.rowId
            ? {
                ...item,
                id: createdItem.id,
                itemNumber: createdItem.item_number || trimmedItemNumber,
                displayItemNumber: createdItem.display_item_number || trimmedItemNumber,
                description: createdItem.display_name || trimmedDescription,
                sourceDescription: createdItem.description || trimmedDescription,
                displayNameOverride: createdItem.display_name_override || trimmedDescription,
                work_type: createdItem.work_type || customDraft.workType,
                uom: createdItem.uom || nextUom,
                uomOverride: createdItem.uom_override || nextUom,
                quantity: createdItem.quantity || quantity,
                unitPrice: createdItem.unit_price || unitPrice,
                extendedPrice: createdItem.extended_price || extendedPrice,
                retainageType: createdItem.retainage_type || customDraft.retainageType,
                retainageValue: createdItem.retainage_value || retainageValue,
                retainageAmount: createdItem.retainage_amount || 0,
                notes: createdItem.notes || customDraft.notes || '',
                custom_sov_item_id: createdItem.custom_sov_item_id ?? undefined,
                is_custom: true,
              }
            : item
        )
      );

      closeCustomDialog(false);
    } catch (error) {
      console.error('[SOVTable] Error creating custom SOV item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create custom SOV item');
    }
  };

  const saveEditorDraft = useCallback(() => {
    if (!editorDraft?.itemNumber.trim()) return;

    const normalizedUom = editorDraft.uom.trim();
    const normalizedDisplayName = (editorDraft.displayName || editorDraft.sourceDescription || editorDraft.itemNumber).trim();
    const normalizedSourceDescription = (editorDraft.sourceDescription || normalizedDisplayName || editorDraft.itemNumber).trim();
    const displayNameOverride =
      normalizedDisplayName !== normalizedSourceDescription ? normalizedDisplayName : undefined;
    const nextItem: ScheduleOfValuesItem = {
      id: editorDraft.rowId,
      itemNumber: editorDraft.itemNumber,
      displayItemNumber: editorDraft.displayItemNumber || editorDraft.itemNumber,
      description: normalizedDisplayName,
      sourceDescription: normalizedSourceDescription,
      displayNameOverride,
      quantity: Math.max(1, editorDraft.quantity || 1),
      unitPrice: Math.max(0, editorDraft.unitPrice || 0),
      extendedPrice: Math.max(1, editorDraft.quantity || 1) * Math.max(0, editorDraft.unitPrice || 0),
      retainageAmount: calcRetainageAmount(
        Math.max(1, editorDraft.quantity || 1) * Math.max(0, editorDraft.unitPrice || 0),
        editorDraft.retainageType,
        editorDraft.retainageValue || 0
      ),
      retainageType: editorDraft.retainageType,
      retainageValue: editorDraft.retainageValue || 0,
      uom: normalizedUom || 'EA',
      uomOverride: normalizedUom || 'EA',
      notes: editorDraft.notes || '',
      work_type: editorDraft.workType,
      sov_item_id: editorDraft.sov_item_id,
      custom_sov_item_id: editorDraft.custom_sov_item_id,
      is_custom: editorDraft.isCustom,
    };

    if (editorDraft.isNew) {
      updateItems((prev) => [...prev, nextItem]);
    } else {
      updateItems((prev) => prev.map((item) => (item.id === editorDraft.rowId ? { ...item, ...nextItem } : item)));
    }

    closeEditor();
  }, [closeEditor, editorDraft, updateItems]);

  const applyBulkRetainage = () => {
    let val = bulkValueDigits ? (parseInt(bulkValueDigits, 10) || 0) / 100 : 0;
    if (bulkType === 'percent') val = clampNumber(val, 0, 100);
    val = Math.round(val * 100) / 100;

    updateItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        retainageType: bulkType,
        retainageValue: val,
        retainageAmount: calcRetainageAmount(item.extendedPrice, bulkType, val),
      }))
    );

  };

  const moveItem = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;

    updateItems((prevItems) => {
      const fromIndex = prevItems.findIndex((item) => item.id === fromId);
      const toIndex = prevItems.findIndex((item) => item.id === toId);

      if (fromIndex === -1 || toIndex === -1) return prevItems;

      const nextItems = [...prevItems];
      const [movedItem] = nextItems.splice(fromIndex, 1);
      nextItems.splice(toIndex, 0, movedItem);
      return nextItems;
    });
  }, [updateItems]);

  const totalExtended = items.reduce((sum, i) => sum + i.extendedPrice, 0);
  const totalRetainage = items.reduce((sum, i) => sum + i.retainageAmount, 0);

  if (sovLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-foreground/70" />
            <h2 className="text-sm font-semibold tracking-[0.08em] text-foreground uppercase">Schedule of Values</h2>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">Loading SOV items...</div>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 bg-muted/30 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-foreground/70" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground">Schedule of Values</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="border border-border/70 bg-background/80 text-[11px] font-medium text-foreground">
                {items.length} {items.length === 1 ? 'Item' : 'Items'}
              </Badge>
            </div>
          </div>
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={addRow} className="h-8 border-border/70 bg-background text-xs font-medium">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Line Item
              </Button>
              <Button variant="outline" size="sm" onClick={addCustomRow} className="h-8 border-border/70 bg-background text-xs font-medium">
                <Plus className="mr-1 h-3.5 w-3.5" /> Create Custom Item
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4">

      {/* Bulk retainage controls - only show when not read-only */}
      {items.length > 0 && !readOnly && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 p-3">
          <span className="text-xs font-medium text-foreground whitespace-nowrap">Apply retainage to all:</span>
          <DollarPercentCurrencyInputField
            type={bulkType}
            value={bulkValueDigits ? parseInt(bulkValueDigits, 10) / 100 : 0}
            onTypeChange={setBulkType}
            onValueChange={(value) => setBulkValueDigits(Math.round(value * 100).toString())}
            size="sm"
          />
          <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={applyBulkRetainage}>
            Apply All
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          No line items yet. Click Add Line Item to begin.
        </div>
      ) : (
        <div className="max-w-full min-w-0 overflow-hidden rounded-xl border border-border/60">
          <div className="overflow-x-auto">
          <Table className={cn("min-w-[800px]", readOnly && "min-w-[600px]")}>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {!readOnly && <TableHead className="w-[36px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" />}
                <TableHead className="w-[120px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Item Number</TableHead>
                <TableHead className="min-w-[320px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</TableHead>
                {showWorkTypeColumn && (
                  <TableHead className="w-[125px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    Work Type
                  </TableHead>
                )}
                <TableHead className="w-[110px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">UOM</TableHead>
                <TableHead className="w-[70px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Qty</TableHead>
                {showPricingColumns && <TableHead className="w-[150px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Unit Price</TableHead>}
                {showPricingColumns && <TableHead className="w-[110px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Extended</TableHead>}
                {showPricingColumns && <TableHead className="w-[320px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Retainage</TableHead>}
                {showPricingColumns && <TableHead className="w-[100px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">Ret. Amt</TableHead>}
                <TableHead className="w-[40px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center">Notes</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isCustom = item.itemNumber && !sovProducts.some(p => p.item_number === item.itemNumber);
                const hasNotes = Boolean(item.notes?.trim());

                return (
                <Fragment key={item.id}>
                <TableRow
                  key={item.id}
                  className={cn(
                    !readOnly && "transition-colors hover:bg-muted/20",
                    dragOverItemId === item.id && draggedItemId !== item.id && "bg-primary/5"
                  )}
                  onDragOver={(e) => {
                    if (readOnly || !draggedItemId || draggedItemId === item.id) return;
                    e.preventDefault();
                    setDragOverItemId(item.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverItemId === item.id) {
                      setDragOverItemId(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (readOnly || !draggedItemId) return;
                    e.preventDefault();
                    moveItem(draggedItemId, item.id);
                    setDraggedItemId(null);
                    setDragOverItemId(null);
                  }}
                >
                  {!readOnly && (
                    <TableCell className="p-1.5 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        draggable
                        className={cn(
                          "h-7 w-7 cursor-grab text-muted-foreground hover:text-foreground",
                          draggedItemId === item.id && "cursor-grabbing text-foreground"
                        )}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(item.id));
                          setDraggedItemId(item.id);
                        }}
                        onDragEnd={() => {
                          setDraggedItemId(null);
                          setDragOverItemId(null);
                        }}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                  <TableCell className="p-1.5">
                    {readOnly ? (
                      <span className="text-xs font-mono truncate block px-1">{item.displayItemNumber || item.itemNumber}</span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-7 w-full justify-start overflow-hidden px-2 text-xs font-mono font-normal"
                        onClick={() => openEditorForExistingItem(item)}
                      >
                        <span className="truncate">
                          {item.displayItemNumber || item.itemNumber || 'Select item…'}
                        </span>
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span
                      className={cn(
                        "block px-1 text-sm text-foreground",
                        readOnly ? "whitespace-normal break-words" : "truncate max-w-[35ch]"
                      )}
                      title={item.description || item.sourceDescription}
                    >
                      {item.description}
                    </span>
                  </TableCell>
                  {showWorkTypeColumn && (
                    <TableCell className="p-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-md border text-[10px] font-semibold uppercase tracking-wide",
                          getWorkTypeTone(item.work_type || (isCustom ? 'CUSTOM' : 'OTHER'))
                        )}
                      >
                        {formatWorkTypeLabel(item.work_type || (isCustom ? 'CUSTOM' : 'OTHER'))}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="p-1.5">
                    <span className="text-xs px-1 whitespace-nowrap">{item.uom}</span>
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span className="text-xs text-right block px-1">{item.quantity}</span>
                  </TableCell>
                  {showPricingColumns && (
                    <TableCell className="p-1.5">
                      <span className="text-xs text-right block px-1">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </TableCell>
                  )}
                  {showPricingColumns && (
                    <TableCell className="p-1.5">
                      <span className="text-xs text-right block px-1 font-medium">
                        ${item.extendedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                  )}
                  {showPricingColumns && (
                    <TableCell className="p-1.5">
                      <span className="text-xs text-right block px-1">
                        {item.retainageType === 'percent'
                          ? `${item.retainageValue}%`
                          : `$${item.retainageValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      </span>
                    </TableCell>
                  )}
                  {showPricingColumns && (
                    <TableCell className="p-1.5 text-right text-xs font-medium text-primary">
                      ${item.retainageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                  )}
                  <TableCell className="p-1.5 text-center relative">
                    <div className={cn('inline-flex items-center justify-center h-6 w-6', item.notes ? 'text-primary' : 'text-muted-foreground/40')}>
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                  </TableCell>
                  <TableCell className="p-1.5">
                    {!readOnly && (
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => openEditorForExistingItem(item)}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setPendingDelete({ rowId: item.id, reason: '' })}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                {hasNotes && (
                  <TableRow className="border-t-0 bg-muted/10">
                    <TableCell colSpan={notesColSpan} className="p-1.5 pt-0">
                      <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-foreground/70 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/70">Note</p>
                            <p className="text-xs italic text-foreground whitespace-pre-wrap break-words">{item.notes?.trim()}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </Fragment>
                );
              })}

              {showPricingColumns && (
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={totalLabelColSpan} className="p-1.5 text-xs text-right">
                    Total
                  </TableCell>
                  <TableCell className="p-1.5 text-right text-xs">
                    ${totalExtended.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="p-1.5 text-right text-xs">
                    Retainage
                  </TableCell>
                  <TableCell className="p-1.5 text-right text-xs text-primary">
                    ${totalRetainage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      )}
      </div>

      <Dialog open={editorOpen} onOpenChange={(open) => {
        if (!open) closeEditor();
      }}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-[1100px]">
          <div className="shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editorStep === 'pick' ? 'Choose SOV Item' : 'Configure SOV Item'}
            </DialogTitle>
            <DialogDescription>
              {editorStep === 'pick'
                ? 'Search the SOV master table and choose the line item you want to add.'
                : 'Review the row values before saving them into the contract schedule of values.'}
            </DialogDescription>
          </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
      {editorStep === 'pick' && (
            <div className="space-y-3">
              <div className="max-h-[500px] overflow-auto rounded-md border">
                <div className="sticky top-0 z-20 border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
                      placeholder="Search item #, display #, description, or category…"
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      autoFocus
                      className="sm:flex-1"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-[#FAFAFA]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="sticky top-0 bg-[#FAFAFA] text-[11px] w-[150px]">Item #</TableHead>
                      <TableHead className="sticky top-0 bg-[#FAFAFA] text-[11px] w-[150px]">Display #</TableHead>
                      <TableHead className="sticky top-0 bg-[#FAFAFA] text-[11px]">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedSelectableItems.map((group) => (
                      <Fragment key={group.heading}>
                        <TableRow className="border-t border-[#16335A]/15 bg-[#16335A]/5 hover:bg-[#16335A]/5 data-[state=selected]:bg-[#16335A]/5">
                          <TableCell colSpan={3} className="py-2 text-[11px] font-semibold uppercase tracking-wide text-[#16335A]">
                            {formatWorkTypeLabel(group.heading)}
                          </TableCell>
                        </TableRow>
                        {group.items.map((p) => (
                          <TableRow
                            key={`${p.is_custom ? 'custom' : 'standard'}-${p.id}`}
                            className="cursor-pointer border-b border-border/40 transition-colors hover:bg-[#16335A]/6 data-[state=selected]:bg-[#16335A]/8"
                            onClick={() => applyMasterToEditor(p)}
                          >
                            <TableCell className="w-[150px] text-xs font-mono text-foreground/90">{p.item_number}</TableCell>
                            <TableCell className="w-[150px] text-xs font-mono text-foreground/80">{getMasterDisplayItemNumber(p)}</TableCell>
                            <TableCell className="text-xs text-foreground/85">{p.description}</TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                    {!sovMasterLoading && groupedSelectableItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                          No matching items found.
                        </TableCell>
                      </TableRow>
                    )}
                    {sovMasterLoading && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                          Loading…
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {editorStep === 'configure' && editorDraft && (
            <div className="space-y-4 pb-2">
              <div className="grid gap-3 rounded-md border bg-muted/30 p-3 md:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Item Number</p>
                  <p className="text-sm font-mono">{editorDraft.itemNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Display Number</p>
                  <p className="text-sm font-mono">{editorDraft.displayItemNumber || editorDraft.itemNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                  <p className="text-sm">{formatWorkTypeLabel(editorDraft.workType || 'OTHER')}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Master Description</p>
                  <p className="text-sm">{editorDraft.sourceDescription || '—'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Display Name</p>
                  </div>
                  <Input
                    className="max-w-2xl"
                    value={editorDraft.displayName}
                    onChange={(e) => setEditorDraft((prev) => prev ? { ...prev, displayName: e.target.value } : prev)}
                    placeholder="How this item should appear on the contract"
                  />
                </div>
                <div className="space-y-2">
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">UOM</p>
                  </div>
                  <Select
                    value={editorDraft.uom || undefined}
                    onValueChange={(value) => setEditorDraft((prev) => prev ? { ...prev, uom: value } : prev)}
                  >
                    <SelectTrigger className="w-full max-w-[220px]">
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        editorDraft.itemNumber
                          ? mergeSelectableUoms(
                              editorDraft.sov_item_id != null || editorDraft.custom_sov_item_id != null
                                ? getAvailableUoms(
                                    sovProducts.find((product) =>
                                      (editorDraft.custom_sov_item_id != null && product.is_custom && product.id === editorDraft.custom_sov_item_id) ||
                                      (editorDraft.sov_item_id != null && !product.is_custom && product.id === editorDraft.sov_item_id)
                                    ) || {
                                      id: 0,
                                      item_number: '',
                                      display_item_number: '',
                                      description: '',
                                      display_name: '',
                                      work_type: '',
                                      uom_1: editorDraft.uom || 'EA',
                                      uom_2: null,
                                      uom_3: null,
                                      uom_4: null,
                                      uom_5: null,
                                      uom_6: null,
                                      uom_7: null,
                                    } as SovMasterItem
                                  )
                                : getAvailableUomsForWorkType(sovProducts, editorDraft.workType),
                              customUomOptions,
                              editorDraft.uom
                            )
                          : customUomOptions
                      ).map((uom) => (
                        <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</p>
                  </div>
                  <div className="flex items-center gap-2 max-w-[220px]">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setEditorDraft((prev) => prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : prev)}
                      disabled={editorDraft.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="h-9 w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={editorDraft.quantity || 1}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        const quantity = cleaned === '' ? 1 : Math.max(1, parseInt(cleaned, 10));
                        setEditorDraft((prev) => prev ? { ...prev, quantity } : prev);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setEditorDraft((prev) => prev ? { ...prev, quantity: prev.quantity + 1 } : prev)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit Price</p>
                  </div>
                  <div className="flex items-center h-9 max-w-[260px] border rounded-md bg-background transition-colors focus-within:border-[#16335A]/25 focus-within:bg-[#16335A]/5 focus-within:shadow-[0_0_0_1px_rgba(22,51,90,0.15)]">
                    <span className="px-3 text-sm text-muted-foreground border-r">$</span>
                    <CurrencyInput
                      value={Math.round(editorDraft.unitPrice * 100).toString()}
                      onChange={(digits) => {
                        const nextUnitPrice = parseInt(digits || '0', 10) / 100;
                        setEditorDraft((prev) => prev ? { ...prev, unitPrice: nextUnitPrice } : prev);
                      }}
                      className="h-9 w-full border-0 bg-transparent text-right pr-3 focus-visible:ring-0 cursor-text"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Retainage</p>
                  </div>
                  <div className="flex max-w-[320px] justify-start rounded-md border bg-background px-3 py-2 transition-colors focus-within:border-[#16335A]/25 focus-within:bg-[#16335A]/5 focus-within:shadow-[0_0_0_1px_rgba(22,51,90,0.15)]">
                    <DollarPercentCurrencyInputField
                      type={editorDraft.retainageType}
                      value={editorDraft.retainageValue}
                      onTypeChange={(type) => setEditorDraft((prev) => prev ? { ...prev, retainageType: type } : prev)}
                      onValueChange={(value) => setEditorDraft((prev) => prev ? { ...prev, retainageValue: value } : prev)}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="border-b pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
                  </div>
                  <Textarea
                    className="min-h-[90px] max-w-2xl"
                    value={editorDraft.notes}
                    onChange={(e) => setEditorDraft((prev) => prev ? { ...prev, notes: e.target.value } : prev)}
                    placeholder="Optional notes for this line item"
                  />
                </div>
              </div>
            </div>
          )}
          </div>

          <DialogFooter className="shrink-0 border-t bg-background px-6 py-4">
            {editorStep === 'configure' && (
              <Button variant="outline" onClick={() => setEditorStep('pick')}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={closeEditor}>Cancel</Button>
            {editorStep === 'configure' && (
            <Button
              onClick={saveEditorDraft}
              disabled={!editorDraft?.itemNumber.trim() || !editorDraft?.uom.trim()}
            >
              Save Item
            </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Item Dialog */}
      <Dialog modal={false} open={customDialogOpen} onOpenChange={(open) => {
        if (!open) {
          closeCustomDialog(true);
        }
      }}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Create Custom Line Item</DialogTitle>
            <DialogDescription>
              Add the custom line item with its UOM and pricing details up front.
            </DialogDescription>
          </DialogHeader>
          {customDraft && (
            <div className="grid flex-1 gap-3 overflow-y-auto py-2 pr-1">
              <div className="grid gap-1.5">
                <label className="text-xs">Item Number <span className="text-destructive">*</span></label>
                <Input
                  className="h-8 text-sm"
                  placeholder="e.g. CUSTOM-001"
                  value={customDraft.itemNumber}
                  onChange={(e) => setCustomDraft({ ...customDraft, itemNumber: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs">Description</label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Item description"
                  value={customDraft.description}
                  onChange={(e) => setCustomDraft({ ...customDraft, description: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs">Work Type <span className="text-destructive">*</span></label>
                <Select
                  value={customDraft.workType}
                  onValueChange={(value) => setCustomDraft({ ...customDraft, workType: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_WORK_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs">UOM <span className="text-destructive">*</span></label>
                <Select
                  value={customDraft.uom}
                  onValueChange={(value) => setCustomDraft({ ...customDraft, uom: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {customUomOptions.map((uom) => (
                      <SelectItem key={uom} value={uom}>
                        {uom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs">Quantity</label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min="1"
                    step="1"
                    value={customDraft.quantity}
                    onChange={(e) => setCustomDraft({ ...customDraft, quantity: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs">Unit Price</label>
                  <div className="flex items-center h-8 rounded-md border bg-background">
                    <span className="border-r px-2 text-xs text-muted-foreground">$</span>
                    <CurrencyInput
                      value={Math.round(customDraft.unitPrice * 100).toString()}
                      onChange={(digits) => setCustomDraft({ ...customDraft, unitPrice: parseInt(digits || '0', 10) / 100 })}
                      className="h-8 w-full border-0 bg-transparent pr-2 text-right text-sm focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs">Retainage</label>
                <div className="flex rounded-md border bg-background px-3 py-2">
                  <DollarPercentCurrencyInputField
                    type={customDraft.retainageType}
                    value={customDraft.retainageValue}
                    onTypeChange={(type) => setCustomDraft({ ...customDraft, retainageType: type })}
                    onValueChange={(value) => setCustomDraft({ ...customDraft, retainageValue: value })}
                    size="sm"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs">Notes</label>
                <Textarea
                  className="min-h-[88px] text-sm"
                  placeholder="Optional notes for this custom item"
                  value={customDraft.notes}
                  onChange={(e) => setCustomDraft({ ...customDraft, notes: e.target.value })}
                />
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Extended amount: ${(Math.max(1, customDraft.quantity || 1) * Math.max(0, customDraft.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0 border-t bg-background pt-4">
            <Button variant="outline" size="sm" onClick={() => closeCustomDialog(true)}>Cancel</Button>
            <Button
              size="sm"
              disabled={!customDraft?.itemNumber.trim() || !customDraft?.description.trim() || !customDraft?.workType || !customDraft?.uom}
              onClick={saveCustomItem}
            >
              Add to Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => {
        if (!open) setPendingDelete(null);
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Why are you removing this item?</DialogTitle>
            <DialogDescription>
              We do not currently have a standard removal-reason dropdown for contract SOV items, so this reason will be saved as freeform text in the contract log.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-foreground">
              Reason for removal <span className="text-destructive">*</span>
            </label>
            <Textarea
              className="min-h-[90px] text-sm"
              placeholder="Explain why this item is being removed..."
              value={pendingDelete?.reason ?? ''}
              onChange={(e) => setPendingDelete((prev) => (
                prev ? { ...prev, reason: e.target.value } : prev
              ))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!pendingDelete?.reason.trim()}
              onClick={async () => {
                if (!pendingDelete?.rowId || !pendingDelete.reason.trim()) return;
                try {
                  await removeItemWithReason(pendingDelete.rowId, pendingDelete.reason.trim());
                  toast.success('SOV item removed');
                  setPendingDelete(null);
                } catch (error) {
                  console.error('Failed to remove SOV item:', error);
                }
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

SOVTableComponent.displayName = 'SOVTableComponent';

export const SOVTable = memo(SOVTableComponent, (prevProps, nextProps) => (
  prevProps.jobId === nextProps.jobId &&
  prevProps.contractId === nextProps.contractId &&
  prevProps.readOnly === nextProps.readOnly &&
  prevProps.onEditAttempt === nextProps.onEditAttempt &&
  prevProps.isSignedContract === nextProps.isSignedContract &&
  prevProps.changeOrderApproved === nextProps.changeOrderApproved &&
  prevProps.forceShowPricing === nextProps.forceShowPricing
));

SOVTable.displayName = 'SOVTable';
