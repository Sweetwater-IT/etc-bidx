'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useSovItems } from '@/hooks/useSovItems';
import {
  Dialog,
  DialogContent,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { ClipboardList, Plus, Minus, Trash2, Check, ChevronsUpDown, MessageSquare, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DollarPercentCurrencyInputField } from '@/components/ui/dollar-percent-currency-input-field';
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
}

import type { ScheduleOfValuesItem } from '@/types/job';

interface SOVTableProps {
  jobId?: string;
  contractId?: string;
  readOnly?: boolean;
  onEditAttempt?: () => void;
  isSignedContract?: boolean;
  changeOrderApproved?: boolean;
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
}

const CUSTOM_WORK_TYPE_OPTIONS = [
  { value: 'MPT', label: 'MPT' },
  { value: 'PERMANENT_SIGNS', label: 'Permanent Signs' },
  { value: 'FLAGGING', label: 'Flagging' },
  { value: 'LANE_CLOSURE', label: 'Lane Closure' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'RENTAL', label: 'Rental' },
];

function calcRetainageAmount(extendedPrice: number, type: 'percent' | 'dollar', value: number): number {
  if (type === 'percent') return Math.round(extendedPrice * (value / 100) * 100) / 100;
  return Math.round(value * 100) / 100;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFirstNonNullUom(master: SovMasterItem): string {
  return master.uom_1 || master.uom_2 || master.uom_3 || master.uom_4 || master.uom_5 || master.uom_6 || "EA";
}

function getAvailableUoms(master: SovMasterItem): string[] {
  const uoms = [master.uom_1, master.uom_2, master.uom_3, master.uom_4, master.uom_5, master.uom_6];
  return Array.from(new Set(uoms.filter((uom): uom is string => uom !== null && uom.trim() !== '')));
}

export const SOVTable = ({
  jobId,
  contractId,
  readOnly = false,
  onEditAttempt,
  isSignedContract = false,
  changeOrderApproved = false
}: SOVTableProps) => {
  console.log('[SOVTable] Component initialized with:', { jobId, contractId, readOnly });

  const [sovProducts, setSovProducts] = useState<SovMasterItem[]>([]);
  const [sovMasterLoading, setSovMasterLoading] = useState(false);
  // Use contractId if available, otherwise use jobId for the hook
  const effectiveId = contractId || jobId;
  const { items, loading: sovLoading, saving, updateItems, saveNow } = useSovItems(effectiveId, !!contractId);

  console.log('[SOVTable] useSovItems hook returned:', { items: items.length, loading: sovLoading, saving });

  useEffect(() => {
    console.log('[SOVTable] Fetching SOV master items...');
    const fetchSovItems = async () => {
      setSovMasterLoading(true);
      try {
        const response = await fetch('/api/sov-items');
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
  }, []);

  const [selectorOpen, setSelectorOpen] = useState<string | null>(null);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [customDraft, setCustomDraft] = useState<CustomItemDraft | null>(null);

  // Bulk retainage controls
  const [bulkType, setBulkType] = useState<'percent' | 'dollar'>('dollar');
  const [bulkValueDigits, setBulkValueDigits] = useState('');

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const notesTimeoutRef = useRef<number | null>(null);

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

  const customUomOptions = useMemo(() => {
    const allUoms = sovProducts.flatMap((product) => getAvailableUoms(product));
    const deduped = Array.from(new Set(allUoms.filter((uom) => uom.trim() !== "")));
    return deduped.length > 0 ? deduped : ["EA"];
  }, [sovProducts]);

  const addRow = () => {
    // Check if change order is required for signed contracts
    if (isSignedContract && !changeOrderApproved && onEditAttempt) {
      onEditAttempt();
      return;
    }

    const newItem: ScheduleOfValuesItem = {
      id: `temp-${crypto.randomUUID()}`, // Mark as temporary/incomplete
      itemNumber: '',
      description: '',
      uom: '',
      quantity: 0,
      unitPrice: 0,
      extendedPrice: 0,
      retainageType: 'dollar',
      retainageValue: 0,
      retainageAmount: 0,
      notes: '',
    };
    // Add to items but don't trigger save yet (validation will prevent it)
    updateItems([...items, newItem]);
    // Open selector immediately to reduce one extra click
    setSelectorOpen(newItem.id);
    setSelectorSearch('');
  };

  const removeRow = (id: string) => {
    updateItems(items.filter((i) => i.id !== id));
  };

  const updateRow = (id: string, field: keyof ScheduleOfValuesItem, value: string | number) => {
    updateItems(
      items.map((item) => {
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

  const updateRetainage = (
    id: string,
    nextType: 'percent' | 'dollar',
    rawValue: number
  ) => {
    let nextValue = Number.isFinite(rawValue) ? rawValue : 0;
    if (nextType === 'percent') nextValue = clampNumber(nextValue, 0, 100);
    else nextValue = clampNumber(nextValue, 0, Number.MAX_SAFE_INTEGER);
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
      updateItems(
        items.map((item) =>
          item.id === rowId
            ? {
                ...item,
                itemNumber: master.item_number,
                description: master.display_name,
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
        sov_item_id: master.id,
        item_number: master.item_number,
        description: master.display_name,
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

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [payload] // The contract endpoint expects an array of items
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[SOVTable] Failed to create SOV item record:', errorData);
        throw new Error(`Failed to create SOV item: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[SOVTable] Successfully created SOV item record:', result);

      // For contracts, the response structure might be different, so adapt accordingly
      const createdItem = Array.isArray(result.data) && result.data.length > 0 
        ? result.data[0] 
        : result.data;

      // Replace the temp item with the real database record
      updateItems(
        items.map((item) =>
          item.id === rowId
            ? {
                ...item,
                id: createdItem.id, // Replace temp ID with real database ID
                itemNumber: master.item_number,
                description: master.display_name,
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
      // Could show a toast error here if needed
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

    updateItems(
      items.map((item) => (item.id === rowId ? newItem : item))
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
          uom: existing.uom,
          quantity: existing.quantity,
          unitPrice: existing.unitPrice,
          retainageType: existing.retainageType,
          retainageValue: existing.retainageValue,
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
        uom: customUomOptions[0] || 'EA',
        quantity: 0,
        unitPrice: 0,
        extendedPrice: 0,
        retainageType: 'dollar',
        retainageValue: 0,
        retainageAmount: 0,
        notes: '',
      };
      updateItems([...items, newItem]);
      setCustomDraft({
        rowId: newId,
        itemNumber: '',
        description: '',
        workType: '',
        uom: customUomOptions[0] || 'EA',
        quantity: 0,
        unitPrice: 0,
        retainageType: 'dollar',
        retainageValue: 0,
      });
    }
    setSelectorOpen(null);
    setSelectorSearch('');
  };

  const saveCustomItem = () => {
    if (!customDraft || !customDraft.itemNumber.trim() || !customDraft.description.trim()) return;
    const extendedPrice = Math.round(customDraft.quantity * customDraft.unitPrice * 100) / 100;
    const retainageAmount = calcRetainageAmount(extendedPrice, customDraft.retainageType, customDraft.retainageValue);
    updateItems(
      items.map((item) =>
        item.id === customDraft.rowId
          ? {
              ...item,
              itemNumber: customDraft.itemNumber.trim(),
              description: customDraft.description.trim(),
              work_type: customDraft.workType,
              uom: customDraft.uom.trim() || 'EA',
              quantity: customDraft.quantity,
              unitPrice: customDraft.unitPrice,
              extendedPrice,
              retainageType: customDraft.retainageType,
              retainageValue: customDraft.retainageValue,
              retainageAmount,
            }
          : item
      )
    );
    setCustomDraft(null);
  };

  const applyBulkRetainage = () => {
    let val = bulkValueDigits ? (parseInt(bulkValueDigits, 10) || 0) / 100 : 0;
    if (bulkType === 'percent') val = clampNumber(val, 0, 100);
    val = Math.round(val * 100) / 100;

    updateItems(
      items.map((item) => ({
        ...item,
        retainageType: bulkType,
        retainageValue: val,
        retainageAmount: calcRetainageAmount(item.extendedPrice, bulkType, val),
      }))
    );

  };

  const totalExtended = items.reduce((sum, i) => sum + i.extendedPrice, 0);
  const totalRetainage = items.reduce((sum, i) => sum + i.retainageAmount, 0);

  const customExtended = customDraft
    ? Math.round(customDraft.quantity * customDraft.unitPrice * 100) / 100
    : 0;

  if (sovLoading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-center py-8 text-muted-foreground">Loading SOV items...</div>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Schedule of Values
        </h2>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Line Item
            </Button>
            <Button variant="outline" size="sm" onClick={() => openCustomDialog()} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Custom Item
            </Button>
          </div>
        )}
      </div>

      {/* Bulk retainage controls - only show when not read-only */}
      {items.length > 0 && !readOnly && (
        <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
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
        <div className="text-center py-8 text-muted-foreground text-sm">
          No line items yet. Click Add Line Item to begin.
        </div>
      ) : (
        <div className="max-w-full min-w-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] text-xs">Item Number</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="w-[200px] text-xs">UOM</TableHead>
                <TableHead className="w-[70px] text-xs text-right">Qty</TableHead>
                <TableHead className="w-[100px] text-xs text-right">Unit Price</TableHead>
                <TableHead className="w-[110px] text-xs text-right">Extended</TableHead>
                <TableHead className="w-[320px] text-xs text-right">Retainage</TableHead>
                <TableHead className="w-[100px] text-xs text-right">Ret. Amt</TableHead>
                <TableHead className="w-[40px] text-xs text-center">Notes</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isCustom = item.itemNumber && !sovProducts.some(p => p.item_number === item.itemNumber);
                const hasNotes = Boolean(item.notes?.trim());

                return (
                <Fragment key={item.id}>
                <TableRow key={item.id}>
                  <TableCell className="p-1.5">
                    {readOnly ? (
                      <span className="text-xs font-mono truncate block px-1">{item.itemNumber}</span>
                    ) : (
                      <Select
                        value={item.itemNumber || undefined}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            openCustomDialog(item.id);
                            return;
                          }
                          if (value === "delivery") {
                            handleQuickAdd(item.id, 'delivery');
                            return;
                          }
                          if (value === "service") {
                            handleQuickAdd(item.id, 'service');
                            return;
                          }
                          const selected = sovProducts.find(p => p.item_number === value);
                          if (selected) selectMasterItem(item.id, selected);
                        }}
                      >
                        <SelectTrigger className="w-full h-7 text-xs font-mono font-normal bg-transparent">
                          <SelectValue placeholder="Select item…">
                            {item.itemNumber || "Select item…"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" className="max-h-80 w-[550px] p-2">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search by item #, name, or work type…"
                              value={selectorSearch}
                              onValueChange={setSelectorSearch}
                              autoFocus
                            />
                            <CommandList>

                              {/* Items grouped by work type */}
                              {(() => {
                                const searchTerm = selectorSearch.toLowerCase().trim();
                                const grouped = filteredItems.reduce<Record<string, SovMasterItem[]>>((acc, curr) => {
                                  const key = curr.work_type?.trim().toUpperCase();
                                  if (key && !acc[key]) acc[key] = [];
                                  if (key) acc[key].push(curr);
                                  return acc;
                                }, {});

                                // Always show these three categories at the top when no search
                                const alwaysShowCategories = ['SERVICE', 'DELIVERY', 'CUSTOM'];

                                // Add synthetic groups for Delivery, Service, and Custom
                                if (!grouped['DELIVERY']) grouped['DELIVERY'] = [];
                                if (!grouped['SERVICE']) grouped['SERVICE'] = [];
                                if (!grouped['CUSTOM']) grouped['CUSTOM'] = [];

                                let allWorkTypes: string[];

                                if (!searchTerm) {
                                  // No search: show always-show categories first, then others with items
                                  allWorkTypes = [
                                    ...alwaysShowCategories,
                                    ...Object.keys(grouped)
                                      .filter(type => !alwaysShowCategories.includes(type) && grouped[type].length > 0)
                                      .sort()
                                  ];
                                } else {
                                  // With search: show categories that have items or match search
                                  allWorkTypes = Object.keys(grouped)
                                    .filter(type => {
                                      if (alwaysShowCategories.includes(type)) {
                                        // Always show these when searched
                                        return true;
                                      }
                                      return grouped[type].length > 0;
                                    })
                                    .sort();
                                }

                                return allWorkTypes.map((workType) => {
                                  const groupItems = grouped[workType] || [];

                                  // For synthetic sections (Delivery, Service, Custom), show items without category headers
                                  if (workType === 'DELIVERY' && groupItems.length === 0) {
                                    return (
                                      <CommandItem
                                        key="delivery-item"
                                        value="delivery"
                                        onSelect={() => handleQuickAdd(item.id, 'delivery')}
                                        className="text-xs cursor-pointer"
                                      >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        <span className="font-mono mr-2 text-muted-foreground">DELIVERY</span>
                                        <span className="truncate">Delivery</span>
                                      </CommandItem>
                                    );
                                  }

                                  if (workType === 'SERVICE' && groupItems.length === 0) {
                                    return (
                                      <CommandItem
                                        key="service-item"
                                        value="service"
                                        onSelect={() => handleQuickAdd(item.id, 'service')}
                                        className="text-xs cursor-pointer"
                                      >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        <span className="font-mono mr-2 text-muted-foreground">SERVICE</span>
                                        <span className="truncate">Service</span>
                                      </CommandItem>
                                    );
                                  }

                                  if (workType === 'CUSTOM' && groupItems.length === 0) {
                                    return (
                                      <CommandItem
                                        key="custom-item"
                                        value="custom"
                                        onSelect={() => openCustomDialog(item.id)}
                                        className="text-xs cursor-pointer"
                                      >
                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                        <span className="font-mono mr-2 text-muted-foreground">CUSTOM</span>
                                        <span className="truncate">Custom Item Number</span>
                                      </CommandItem>
                                    );
                                  }

                                  // For work type groups with items, show them with category headers
                                  if (groupItems.length > 0) {
                                    return (
                                      <CommandGroup key={workType} heading={workType}>
                                        {groupItems.map((p) => (
                                          <CommandItem
                                            key={p.id}
                                            value={[
                                              p.item_number,
                                              p.display_item_number,
                                              p.display_name,
                                              p.description,
                                              p.work_type,
                                            ].filter(Boolean).join(' ')}
                                            onSelect={() => selectMasterItem(item.id, p)}
                                            className="text-xs cursor-pointer"
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                item.itemNumber === p.item_number ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            <span className="font-mono mr-2 text-muted-foreground">{p.item_number}</span>
                                            <span className="truncate">{p.display_name}</span>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    );
                                  }

                                  return null;
                                });
                              })()}

                              {filteredItems.length === 0 && !sovMasterLoading && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  No matching items found.
                                </div>
                              )}

                              {sovMasterLoading && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                  Loading...
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span className="text-xs px-1 truncate block">{item.description}</span>
                  </TableCell>
                  <TableCell className="p-1.5">
                    {readOnly ? (
                      <span className="text-xs px-1">{item.uom}</span>
                    ) : (
                      (() => {
                        const masterItem = sovProducts.find(p => p.item_number === item.itemNumber);
                        const availableUoms = masterItem ? getAvailableUoms(masterItem) : [];

                        // Always show select if we have UOM options, otherwise show as text
                        return availableUoms.length > 0 ? (
                          <Select
                            value={item.uom}
                            onValueChange={(value) => updateRow(item.id, 'uom', value)}
                          >
                            <SelectTrigger className="w-full h-7 text-xs bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUoms.map((uom) => (
                                <SelectItem key={uom} value={uom} className="text-xs">
                                  {uom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs px-1">{item.uom}</span>
                        );
                      })()
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    {readOnly ? (
                      <span className="text-xs text-right block px-1">{item.quantity}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateRow(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="h-8 text-xs text-center w-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.quantity || 1}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const cleaned = raw.replace(/\D/g, '');
                            const num = cleaned === '' ? 1 : Math.max(1, parseInt(cleaned, 10));
                            updateRow(item.id, 'quantity', num);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateRow(item.id, 'quantity', item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    {readOnly ? (
                      <span className="text-xs text-right block px-1">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        ) : (
                        <div className="flex items-center h-7 border rounded-md bg-background">
                          <span className="px-2 text-xs text-muted-foreground border-r">$</span>
                          <CurrencyInput
                            value={Math.round(item.unitPrice * 100).toFixed(0)}
                            onChange={(digits) => updateRow(item.id, 'unitPrice', parseInt(digits) / 100)}
                            className="h-7 text-xs text-right w-[100px] border-0 focus-visible:ring-0"
                          />
                        </div>
                        )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span className="text-xs text-right block px-1 font-medium">
                      ${item.extendedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell className="p-1.5">
                    {readOnly ? (
                      <span className="text-xs text-right block px-1">
                        {item.retainageType === 'percent'
                          ? `${item.retainageValue}%`
                          : `$${item.retainageValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      </span>
                    ) : (
                      <div className="flex justify-end">
                        <DollarPercentCurrencyInputField
                          type={item.retainageType}
                          value={item.retainageValue}
                          onTypeChange={(type) => {
                            const currentValue = item.retainageValue;
                            const newValue = type === 'percent' ? currentValue / 100 : currentValue * 100;
                            updateRetainage(item.id, type, newValue);
                          }}
                          onValueChange={(value) => updateRetainage(item.id, item.retainageType, value)}
                          size="sm"
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-1.5 text-right text-xs font-medium text-primary">
                    ${item.retainageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="p-1.5 text-center relative">
                    {readOnly ? (
                      <div className={cn('inline-flex items-center justify-center h-6 w-6', item.notes ? 'text-primary' : 'text-muted-foreground/40')}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <Popover
                        open={editingNotesId === item.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingNotesId(item.id);
                            setNotesDraft(item.notes || '');
                          } else {
                            setEditingNotesId(null);
                            setNotesDraft('');
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn('h-6 w-6 relative', item.notes ? 'text-primary' : 'text-muted-foreground/40')}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {item.notes && (
                              <div className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-red-500 rounded-full" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-3" align="end">
                          <div className="space-y-3">
                            <label className="text-xs font-semibold text-foreground">Scope Notes</label>
                            <textarea
                              className="text-xs min-h-[80px] resize-none w-full p-2 border rounded"
                              placeholder="Add notes about scope, special instructions, etc."
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[10px] text-muted-foreground">These notes will be visible in the project manager portal.</p>
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  updateRow(item.id, 'notes', notesDraft);
                                  setEditingNotesId(null);
                                  setNotesDraft('');
                                }}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    {!readOnly && (
                      <div className="flex items-center gap-0.5">
                        {isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openCustomDialog(item.id)}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeRow(item.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
                {hasNotes && (
                  <TableRow className="border-t-0">
                    <TableCell colSpan={10} className="p-1.5 pt-0">
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

              {/* Totals row */}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={5} className="p-1.5 text-xs text-right">
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
            </TableBody>
          </Table>
        </div>
      )}

      {/* Custom Item Dialog */}
      <Dialog open={!!customDraft} onOpenChange={(open) => {
        if (!open && customDraft) {
          // Remove row if it was a new custom item with no data saved
          const row = items.find(i => i.id === customDraft.rowId);
          if (row && !row.itemNumber) {
            updateItems(items.filter(i => i.id !== customDraft.rowId));
          }
          setCustomDraft(null);
        }
      }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Custom Item Number</DialogTitle>
          </DialogHeader>
          {customDraft && (
            <div className="grid gap-3 py-2">
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
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs">UOM</label>
                  <Select
                    value={customDraft.uom}
                    onValueChange={(value) => setCustomDraft({ ...customDraft, uom: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
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
                <div className="grid gap-1.5">
                  <label className="text-xs">Qty</label>
                  <Input
                    className="h-8 text-sm text-right"
                    type="number"
                    step="1"
                    min="0"
                    value={customDraft.quantity || ''}
                    onChange={(e) => setCustomDraft({ ...customDraft, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs">Unit Price</label>
                  <Input
                    className="h-8 text-sm text-right"
                    type="number"
                    step="0.01"
                    value={customDraft.unitPrice || ''}
                    onChange={(e) => setCustomDraft({ ...customDraft, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border/50">
                <span className="text-xs font-medium text-foreground">Extended Price</span>
                <span className="text-sm font-semibold">${customExtended.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs">Retainage Value</label>
                <div className="flex items-center h-8 border rounded-md bg-background">
                  <span className="px-2 text-xs text-muted-foreground border-r">$</span>
                  <Input
                    className="h-8 text-sm text-right border-0 focus-visible:ring-0"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customDraft.retainageValue || ''}
                    onChange={(e) => setCustomDraft({ ...customDraft, retainageType: 'dollar', retainageValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => {
              if (customDraft) {
                const row = items.find(i => i.id === customDraft.rowId);
                if (row && !row.itemNumber) {
                  updateItems(items.filter(i => i.id !== customDraft.rowId));
                }
              }
              setCustomDraft(null);
            }}>Cancel</Button>
            <Button
              size="sm"
              disabled={!customDraft?.itemNumber.trim() || !customDraft?.description.trim() || !customDraft?.workType}
              onClick={saveCustomItem}
            >
              Add to Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
