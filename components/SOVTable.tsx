'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QuantityInput } from '@/components/ui/quantity-input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { InputGroup } from '@/components/ui/input-group';
console.log('🔧 SOVTable: InputGroup imported successfully');
import { useSovItems } from '@/hooks/useSovItems';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
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
interface SovMasterItem {
  id: number;
  item_number: string;
  display_item_number: string;
  description: string;
  display_name: string;
  work_type: string;
}

// Work type constants
const WORK_TYPE_CUSTOM = 'CUSTOM';
const WORK_TYPE_DELIVERY = 'DELIVERY';
const WORK_TYPE_SERVICE = 'SERVICE';

import type { ScheduleOfValuesItem } from '@/types/job';

interface SOVTableProps {
  jobId?: string;
  contractId?: string;
  readOnly?: boolean;
}

interface CustomItemDraft {
  rowId: string;
  itemNumber: string;
  description: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  retainageType: 'percent' | 'dollar';
  retainageValue: number;
}

function calcRetainageAmount(extendedPrice: number, type: 'percent' | 'dollar', value: number): number {
  if (type === 'percent') return Math.round(extendedPrice * (value / 100) * 100) / 100;
  return Math.round(value * 100) / 100;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseRetainageDraft(raw: string) {
  // Allow users to type partial states without us forcing a number
  // e.g. '', '.', '0.', '10.'
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '.') return { ok: false as const };

  // Normalize comma to dot for accidental locale input
  const normalized = trimmed.replace(',', '.');
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n)) return { ok: false as const };
  return { ok: true as const, value: n };
}

export const SOVTable = ({ jobId, contractId, readOnly = false }: SOVTableProps) => {
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
  const [bulkType, setBulkType] = useState<'percent' | 'dollar'>('percent');
  const [bulkValue, setBulkValue] = useState('');

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const notesTimeoutRef = useRef<number | null>(null);

  const filteredItems = useMemo(
    () =>
      sovProducts.filter(
        (p) =>
          p.item_number.toLowerCase().includes(selectorSearch.toLowerCase()) ||
          p.display_name.toLowerCase().includes(selectorSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(selectorSearch.toLowerCase())
      ),
    [sovProducts, selectorSearch]
  );

  const addRow = () => {
    const newItem: ScheduleOfValuesItem = {
      id: `temp-${crypto.randomUUID()}`, // Mark as temporary/incomplete
      itemNumber: '',
      description: '',
      uom: '',
      quantity: 0,
      unitPrice: 0,
      extendedPrice: 0,
      retainageType: 'percent',
      retainageValue: 0,
      retainageAmount: 0,
      notes: '',
    };
    // Add to items but don't trigger save yet (validation will prevent it)
    updateItems([...items, newItem]);
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
                uom: 'EA',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                extendedPrice: item.extendedPrice || 0,
                retainageType: item.retainageType || 'percent',
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
        uom: 'EA',
        quantity: 1, // Default quantity
        unit_price: 0, // Default unit price
        retainage_type: 'percent' as const,
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
                uom: 'EA',
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
      uom: 'LS',
      quantity: 1,
      unitPrice: 0,
      extendedPrice: 0,
      retainageType: 'percent',
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
        uom: 'EA',
        quantity: 0,
        unitPrice: 0,
        extendedPrice: 0,
        retainageType: 'percent',
        retainageValue: 0,
        retainageAmount: 0,
        notes: '',
      };
      updateItems([...items, newItem]);
      setCustomDraft({
        rowId: newId,
        itemNumber: '',
        description: '',
        uom: 'EA',
        quantity: 0,
        unitPrice: 0,
        retainageType: 'percent',
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
    const parsed = parseRetainageDraft(bulkValue);
    let val = parsed.ok ? parsed.value : 0;

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
      <div className="rounded-xl border bg-card p-4">
        <div className="text-center py-8 text-muted-foreground">Loading SOV items...</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
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
          <div className="w-[180px]">
            <InputGroup
              value={bulkValue}
              onValueChange={setBulkValue}
              type={bulkType}
              onTypeChange={(type) => setBulkType(type)}
              placeholder="0.00"
              className="h-7 text-xs"
              ariaLabel="Bulk retainage"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyBulkRetainage();
                }
              }}
            />
          </div>
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
        <div className="overflow-x-auto max-w-full">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] text-xs">Item Number</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="w-[80px] text-xs">UOM</TableHead>
                <TableHead className="w-[70px] text-xs text-right">Qty</TableHead>
                <TableHead className="w-[100px] text-xs text-right">Unit Price</TableHead>
                <TableHead className="w-[110px] text-xs text-right">Extended</TableHead>
                <TableHead className="w-[280px] text-xs text-right">Retainage</TableHead>
                <TableHead className="w-[100px] text-xs text-right">Ret. Amt</TableHead>
                <TableHead className="w-[40px] text-xs text-center">Notes</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isCustom = item.itemNumber && !sovProducts.some(p => p.item_number === item.itemNumber);
                return (
                <TableRow key={item.id}>
                  <TableCell className="p-1.5">
                    {readOnly ? (
                      <span className="text-xs font-mono truncate block px-1">{item.itemNumber}</span>
                    ) : (
                      <Dialog open={selectorOpen === item.id} onOpenChange={(open) => {
                        setSelectorOpen(open ? item.id : null);
                        if (!open) setSelectorSearch('');
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between h-7 text-xs font-normal"
                          >
                            {item.itemNumber || 'Select item…'}
                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Select Schedule of Values Item</DialogTitle>
                          </DialogHeader>
                          <div className="mt-3">
                            {/* Quick-add buttons above search */}
                            <div className="flex items-center gap-2 mb-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                                onClick={() => { handleQuickAdd(item.id, 'custom'); setSelectorOpen(null); }}
                              >
                                <Plus className="h-3 w-3" /> Custom Item
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => { handleQuickAdd(item.id, 'delivery'); setSelectorOpen(null); }}
                              >
                                <Plus className="h-3 w-3" /> Delivery
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
                                onClick={() => { handleQuickAdd(item.id, 'service'); setSelectorOpen(null); }}
                              >
                                <Plus className="h-3 w-3" /> Service
                              </Button>
                            </div>
                            <Command className="border rounded-lg">
                              <CommandInput
                                placeholder="Search by # or name…"
                                value={selectorSearch}
                                onValueChange={setSelectorSearch}
                                className="border-b"
                              />
                              <CommandList className="max-h-[400px]">
                                <CommandEmpty className="py-2 px-3 text-xs text-muted-foreground">
                                  No matching items found.
                                </CommandEmpty>
                                {/* Items grouped by work type in fixed order */}
                                {(['MPT', 'LANE CLOSURE', 'FLAGGING', 'PERMANENT SIGN'] as const).map((workType) => {
                                  const groupItems = filteredItems.filter(p => p.work_type === workType);
                                  if (groupItems.length === 0) return null;
                                  return (
                                    <CommandGroup key={workType} heading={workType}>
                                      {groupItems.map((p) => (
                                        <CommandItem
                                          key={p.id}
                                          value={`${p.item_number} ${p.display_name}`}
                                          onSelect={() => {
                                            selectMasterItem(item.id, p);
                                            setSelectorOpen(null);
                                          }}
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
                                })}
                              </CommandList>
                            </Command>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span className="text-xs px-1 truncate block">{item.description}</span>
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span className="text-xs px-1">{item.uom}</span>
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
                        <CurrencyInput
                          value={Math.round(item.unitPrice * 100).toFixed(0)}
                          onChange={(digits) => updateRow(item.id, 'unitPrice', parseInt(digits) / 100)}
                          className="h-7 text-xs text-right w-[100px]"
                        />
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
                        {item.retainageType === 'percent' ? `${item.retainageValue}%` : `$${item.retainageValue}`}
                      </span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          className="h-7 text-xs text-right w-[90px]"
                          value={item.retainageValue || ''}
                          onChange={(e) => {
                            const nextValue = parseFloat(e.target.value);
                            updateRetainage(
                              item.id,
                              item.retainageType,
                              Number.isNaN(nextValue) ? 0 : nextValue
                            );
                          }}
                        />
                        <Select
                          value={item.retainageType}
                          onValueChange={(type) =>
                            updateRetainage(item.id, type as 'percent' | 'dollar', item.retainageValue)
                          }
                        >
                          <SelectTrigger className="h-7 w-14 text-xs px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">%</SelectItem>
                            <SelectItem value="dollar">$</SelectItem>
                          </SelectContent>
                        </Select>
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
            <DialogTitle className="text-sm">Add Custom Line Item</DialogTitle>
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
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs">UOM</label>
                  <Input
                    className="h-8 text-sm"
                    value={customDraft.uom}
                    onChange={(e) => setCustomDraft({ ...customDraft, uom: e.target.value })}
                  />
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
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs">Retainage Type</label>
                  <Select
                    value={customDraft.retainageType}
                    onValueChange={(v) => setCustomDraft({ ...customDraft, retainageType: v as 'percent' | 'dollar' })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent (%)</SelectItem>
                      <SelectItem value="dollar">Dollar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs">Retainage Value</label>
                  <Input
                    className="h-8 text-sm text-right"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customDraft.retainageValue || ''}
                    onChange={(e) => setCustomDraft({ ...customDraft, retainageValue: parseFloat(e.target.value) || 0 })}
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
              disabled={!customDraft?.itemNumber.trim() || !customDraft?.description.trim()}
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