'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { ClipboardList, Plus, Trash2, Check, ChevronsUpDown, MessageSquare, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductsSearch } from '@/hooks/useProductsSearch';
import { useSovItems } from '@/hooks/useSovItems';
import type { ScheduleOfValuesItem } from '@/types/job';

interface SOVTableProps {
  jobId?: string;
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

export const SOVTable = ({ jobId }: SOVTableProps) => {
  const { products, loading: productsLoading } = useProductsSearch('');
  const { items, loading: sovLoading, saving, updateItems } = useSovItems(jobId);

  const [openRow, setOpenRow] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [customDraft, setCustomDraft] = useState<CustomItemDraft | null>(null);

  // Bulk retainage controls
  const [bulkType, setBulkType] = useState<'percent' | 'dollar'>('percent');
  const [bulkValue, setBulkValue] = useState('');

  const filteredItems = useMemo(
    () =>
      products.filter(
        (p) =>
          p.item_number.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const addRow = () => {
    const newItem: ScheduleOfValuesItem = {
      id: crypto.randomUUID(),
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

  const selectMasterItem = (rowId: string, master: { item_number: string; description: string; uom: string }) => {
    updateItems(
      items.map((item) =>
        item.id === rowId
          ? { ...item, itemNumber: master.item_number, description: master.description, uom: master.uom }
          : item
      )
    );
    setOpenRow(null);
    setSearch('');
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
    setOpenRow(null);
    setSearch('');
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
    const val = parseFloat(bulkValue) || 0;
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addRow} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Add Line Item
          </Button>
          <Button variant="outline" size="sm" onClick={() => openCustomDialog()} className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" /> Add Custom Item
          </Button>
        </div>
      </div>

      {/* Bulk retainage controls */}
      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
          <span className="text-xs font-medium text-foreground whitespace-nowrap">Apply retainage to all:</span>
          <Select value={bulkType} onValueChange={(v) => setBulkType(v as 'percent' | 'dollar')}>
            <SelectTrigger className="h-7 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">%</SelectItem>
              <SelectItem value="dollar">$</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="h-7 w-[80px] text-xs"
            type="number"
            step="0.01"
            placeholder="Value"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px] text-xs">Item Number</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="w-[80px] text-xs">UOM</TableHead>
                <TableHead className="w-[70px] text-xs text-right">Qty</TableHead>
                <TableHead className="w-[100px] text-xs text-right">Unit Price</TableHead>
                <TableHead className="w-[110px] text-xs text-right">Extended</TableHead>
                <TableHead className="w-[160px] text-xs text-right">Retainage</TableHead>
                <TableHead className="w-[100px] text-xs text-right">Ret. Amt</TableHead>
                <TableHead className="w-[40px] text-xs text-center">Notes</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isCustom = item.itemNumber && !products.some(p => p.item_number === item.itemNumber);
                return (
                <TableRow key={item.id}>
                  <TableCell className="p-1.5">
                    {isCustom ? (
                      <span className="text-xs font-mono truncate block px-1">{item.itemNumber}</span>
                    ) : (
                      <Popover
                        open={openRow === item.id}
                        onOpenChange={(open) => {
                          setOpenRow(open ? item.id : null);
                          if (!open) setSearch('');
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-7 text-xs font-normal"
                          >
                            {item.itemNumber || 'Select item…'}
                            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[360px] p-0 z-50 bg-popover" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search by # or name…"
                              value={search}
                              onValueChange={setSearch}
                            />
                            <CommandList className="max-h-[200px]">
                              <CommandEmpty className="py-2 px-3 text-xs text-muted-foreground">
                                No matching items found.
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredItems.slice(0, 50).map((p) => (
                                  <CommandItem
                                    key={p.id}
                                    value={`${p.item_number} ${p.description}`}
                                    onSelect={() => selectMasterItem(item.id, p)}
                                    className="text-xs"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-1.5 h-3 w-3",
                                        item.itemNumber === p.item_number ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="font-mono mr-2 text-muted-foreground">{p.item_number}</span>
                                    <span className="truncate">{p.description}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span className="text-xs px-1 truncate block">{item.description}</span>
                  </TableCell>
                  <TableCell className="p-1.5">
                    <span className="text-xs px-1">{item.uom}</span>
                  </TableCell>
                  <TableCell className="p-1.5">
                    <Input
                      className="h-7 text-xs text-right w-[70px]"
                      type="number"
                      step="1"
                      min="0"
                      value={item.quantity || ''}
                      onChange={(e) => updateRow(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell className="p-1.5">
                    <Input
                      className="h-7 text-xs text-right w-[100px]"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateRow(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell className="p-1.5 text-right text-xs font-medium">
                    ${item.extendedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="p-1.5">
                    <div className="flex items-center gap-1">
                      <Select
                        value={item.retainageType}
                        onValueChange={(v) => updateRow(item.id, 'retainageType', v)}
                      >
                        <SelectTrigger className="h-7 w-[50px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="dollar">$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-7 text-xs text-right w-[70px]"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.retainageValue || ''}
                        onChange={(e) => updateRow(item.id, 'retainageValue', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="p-1.5 text-right text-xs font-medium text-primary">
                    ${item.retainageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="p-1.5 text-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn('h-6 w-6', item.notes ? 'text-primary' : 'text-muted-foreground/40')}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-3" align="end">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">Scope Notes</label>
                          <textarea
                            className="text-xs min-h-[80px] resize-none w-full p-2 border rounded"
                            placeholder="Add notes about scope, special instructions, etc."
                            value={item.notes || ''}
                            onChange={(e) => updateRow(item.id, 'notes', e.target.value)}
                          />
                          <p className="text-[10px] text-muted-foreground">These notes will be visible in the project manager portal.</p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="p-1.5">
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