import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, Copy, FilePlus, Search } from "lucide-react";
import { SignMaterial, SIGN_MATERIALS, abbreviateMaterial } from "@/utils/signMaterial";
import DesignationSearcher from "@/components/pages/active-bid/signs/DesignationSearcher";
import { PrimarySign, SecondarySign } from "@/types/MPTEquipment";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
export interface PermanentSignItem {
  id: number;
  item_number: string;
  description: string;
  display_name: string;
  notes: string;
  uom: string;
  type: string;
}

export interface PermSignRow {
  id: string;
  itemNumber: string;
  signDesignation: string;
  signDescription: string;
  sheeting: string;
  width: number;
  height: number;
  dimensionLabel: string;
  signLegend: string;
  quantity: number;
  postSize: string;
  planSheetNum: string;
  planSheetTotal: string;
  sqft: number;
  totalSqft: number;
  isCustom: boolean;
  needsOrder: boolean;
  material: string;
  secondarySigns?: PermSecondarySign[];
}

export interface PermSecondarySign {
  id: string;
  signDesignation: string;
  signDescription: string;
  dimensionLabel: string;
  width: number;
  height: number;
  signLegend: string;
  sheeting: string;
  isCustom: boolean;
  sqft: number;
  needsOrder: boolean;
}

export interface PermEntryRow {
  id: string;
  itemNumber: string;
  quantity: number;
  description: string;
}

interface PermanentSignConfigurationProps {
  activeItems: string[];
  signRows: Record<string, PermSignRow[]>;
  entryRows: Record<string, PermEntryRow[]>;
  defaultSignMaterial: SignMaterial;
  onToggleItem: (itemNumber: string) => void;
  onSignRowsChange: (itemNumber: string, rows: PermSignRow[]) => void;
  onEntryRowsChange: (itemNumber: string, rows: PermEntryRow[]) => void;
  onDefaultMaterialChange: (material: SignMaterial) => void;
  onApplyMaterialToAll: () => void;
  disabled?: boolean;
}

const SHEETING_OPTIONS = [
  { value: "HI", label: "HI" },
  { value: "DG", label: "DG" },
  { value: "FYG", label: "FYG" },
  { value: "Type 11", label: "Type 11" },
];

const POST_SIZE_OPTIONS = ["8FT", "10FT", "12FT", "14FT"];

function calcSqft(w: number, h: number): number {
  return Math.round((w * h) / 144 * 100) / 100;
}

export const PermanentSignConfiguration = ({
  activeItems,
  signRows,
  entryRows,
  defaultSignMaterial,
  onToggleItem,
  onSignRowsChange,
  onEntryRowsChange,
  onDefaultMaterialChange,
  onApplyMaterialToAll,
  disabled = false,
}: PermanentSignConfigurationProps) => {
  const [permanentSignItems, setPermanentSignItems] = useState<PermanentSignItem[]>([]);
  const [loading, setLoading] = useState(true);

  // DesignationSearcher state
  const [localSign, setLocalSign] = useState<PrimarySign | SecondarySign | undefined>();
  const [designationSearcherOpen, setDesignationSearcherOpen] = useState(false);
  const [showApplyMaterialDialog, setShowApplyMaterialDialog] = useState(false);

  // Search state
  const [itemSearch, setItemSearch] = useState("");

  // Fetch permanent sign items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('permanent_sign_items')
          .select('*')
          .order('item_number');

        if (error) throw error;
        setPermanentSignItems(data || []);
      } catch (error) {
        console.error('Error fetching permanent sign items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleDesignationSelected = (updatedSign: PrimarySign | any) => {
    if (!localSign) return;

    // Check if this is a secondary sign (has primarySignId)
    if ((localSign as SecondarySign).primarySignId) {
      // Update secondary sign in parent's secondarySigns array
      const secondarySign = localSign as SecondarySign;
      const parentRows = signRows[secondarySign.primarySignId] || [];
      const parentRow = parentRows.find(r => r.secondarySigns?.some(s => s.id === secondarySign.id));

      if (parentRow) {
        const updatedSecondarySigns = parentRow.secondarySigns?.map(sec =>
          sec.id === secondarySign.id ? {
            ...sec,
            signDesignation: updatedSign.designation,
            signDescription: updatedSign.description || '',
            signLegend: updatedSign.description || '',
            width: updatedSign.width,
            height: updatedSign.height,
            dimensionLabel: updatedSign.width && updatedSign.height ? `${updatedSign.width}" x ${updatedSign.height}"` : '',
            sheeting: updatedSign.sheeting as any,
            sqft: calcSqft(updatedSign.width, updatedSign.height),
          } : sec
        ) || [];

        const updatedRows = parentRows.map(r =>
          r.id === parentRow.id ? { ...r, secondarySigns: updatedSecondarySigns } : r
        );

        onSignRowsChange(secondarySign.primarySignId, updatedRows);
      }
    } else {
      // Update primary sign row
      const itemNumber = (localSign as any).itemNumber;
      const rows = signRows[itemNumber] || [];
      const updatedRows = rows.map(row =>
        row.id === localSign.id ? {
          ...row,
          signDesignation: updatedSign.designation,
          signDescription: updatedSign.description || '',
          signLegend: updatedSign.description || '',
          width: updatedSign.width,
          height: updatedSign.height,
          dimensionLabel: updatedSign.width && updatedSign.height ? `${updatedSign.width}" x ${updatedSign.height}"` : '',
          sheeting: updatedSign.sheeting as any,
          sqft: calcSqft(updatedSign.width, updatedSign.height),
          quantity: updatedSign.quantity,
        } : row
      );

      onSignRowsChange(itemNumber, updatedRows);
    }

    setLocalSign(undefined);
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading permanent sign items...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm max-h-[600px] max-w-[calc(100vw-272px-64px)] flex flex-col">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permanent Signs Configuration</h2>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar with item checkboxes */}
        <div className="w-[250px] shrink-0 border-r p-4 overflow-y-auto">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Item Numbers</h4>
          <div className="mb-3">
            <Input
              placeholder="Search items..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-3">
            {permanentSignItems
              .filter((item) =>
                itemSearch === "" ||
                item.item_number.toLowerCase().includes(itemSearch.toLowerCase()) ||
                item.display_name.toLowerCase().includes(itemSearch.toLowerCase()) ||
                item.description.toLowerCase().includes(itemSearch.toLowerCase())
              )
              .map((item) => {
              const active = activeItems.includes(item.item_number);
              return (
                <label
                  key={item.item_number}
                  className={`flex items-start gap-2 select-none p-2 rounded border transition-colors ${
                    active ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-muted/20"
                  } ${disabled ? "opacity-60 cursor-default" : "cursor-pointer"}`}
                  onClick={() => !disabled && onToggleItem(item.item_number)}
                >
                  <div className="mt-0.5">
                    <Checkbox
                      checked={active}
                      onChange={() => {}} // Handled by label click
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">{item.item_number}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.display_name}</div>
                    <div className="text-[9px] text-muted-foreground/70 uppercase mt-1 font-bold">{item.type}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 p-4 overflow-x-auto">
          {activeItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Select item numbers</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click item numbers on the left to start configuring permanent signs.
              </p>
            </div>
          ) : (
            activeItems.map((itemNumber) => {
              const item = permanentSignItems.find(i => i.item_number === itemNumber)!;
              const isPostType = item.type === 'post';

              return (
                <div key={itemNumber} className="mb-6">
                  {isPostType ? (
                    <PermanentSignTable
                      item={item}
                      rows={signRows[itemNumber] || []}
                      onRowsChange={(rows) => onSignRowsChange(itemNumber, rows)}
                      disabled={disabled}
                      defaultMaterial={defaultSignMaterial}
                      onDesignationSelected={handleDesignationSelected}
                      setLocalSign={setLocalSign}
                      setDesignationSearcherOpen={setDesignationSearcherOpen}
                    />
                  ) : (
                    <PermanentSignEntryTable
                      item={item}
                      rows={entryRows[itemNumber] || []}
                      onRowsChange={(rows) => onEntryRowsChange(itemNumber, rows)}
                      disabled={disabled}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DesignationSearcher */}
      {localSign && (
        <DesignationSearcher
          localSign={localSign}
          setLocalSign={setLocalSign}
          onDesignationSelected={(updatedSign) => {
            handleDesignationSelected(updatedSign);
            setDesignationSearcherOpen(false);
          }}
          open={designationSearcherOpen}
          onOpenChange={setDesignationSearcherOpen}
        />
      )}
    </div>
  );
};

// Component for POST type items (sign picker)
const PermanentSignTable = ({
  item,
  rows,
  onRowsChange,
  disabled,
  defaultMaterial,
  onDesignationSelected,
  setLocalSign,
  setDesignationSearcherOpen,
}: {
  item: PermanentSignItem;
  rows: PermSignRow[];
  onRowsChange: (rows: PermSignRow[]) => void;
  disabled?: boolean;
  defaultMaterial: SignMaterial;
  onDesignationSelected: (sign: any) => void;
  setLocalSign: (sign: any) => void;
  setDesignationSearcherOpen: (open: boolean) => void;
}) => {
  const addSign = () => {
    const newRow: PermSignRow = {
      id: crypto.randomUUID(),
      itemNumber: item.item_number,
      signDesignation: "",
      signDescription: "",
      sheeting: "HI",
      width: 0,
      height: 0,
      dimensionLabel: "",
      signLegend: "",
      quantity: 1,
      postSize: "10FT",
      planSheetNum: "",
      planSheetTotal: "",
      sqft: 0,
      totalSqft: 0,
      isCustom: false,
      needsOrder: false,
      material: "ALUMINUM",
      secondarySigns: [],
    };
    onRowsChange([...rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<PermSignRow>) => {
    onRowsChange(rows.map(row => {
      if (row.id === id) {
        const updated = { ...row, ...updates };
        const w = updates.width ?? row.width;
        const h = updates.height ?? row.height;
        const qty = updates.quantity ?? row.quantity;
        updated.sqft = calcSqft(w, h);
        updated.totalSqft = Math.round(updated.sqft * qty * 100) / 100;
        return updated;
      }
      return row;
    }));
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter(row => row.id !== id));
  };

  const duplicateRow = (id: string) => {
    const rowToDuplicate = rows.find(row => row.id === id);
    if (rowToDuplicate) {
      const duplicatedRow: PermSignRow = {
        ...rowToDuplicate,
        id: crypto.randomUUID(),
        secondarySigns: (rowToDuplicate.secondarySigns || []).map((s) => ({ ...s, id: crypto.randomUUID() })),
      };
      onRowsChange([...rows, duplicatedRow]);
    }
  };

  const addSecondarySign = (id: string) => {
    const row = rows.find(row => row.id === id);
    if (row) {
      const newSecondarySign: PermSecondarySign = {
        id: crypto.randomUUID(),
        signDesignation: "",
        signDescription: "",
        dimensionLabel: "",
        width: 0,
        height: 0,
        signLegend: "",
        sheeting: "HI",
        isCustom: false,
        sqft: 0,
        needsOrder: false,
      };

      const updatedRow = {
        ...row,
        secondarySigns: [...(row.secondarySigns || []), newSecondarySign],
      };

      updateRow(id, { secondarySigns: updatedRow.secondarySigns });
    }
  };

  const updateSecondarySign = (parentId: string, secId: string, updates: Partial<PermSecondarySign>) => {
    const row = rows.find(row => row.id === parentId);
    if (row) {
      const updatedSecondarySigns = (row.secondarySigns || []).map(sec =>
        sec.id === secId ? { ...sec, ...updates } : sec
      );
      updateRow(parentId, { secondarySigns: updatedSecondarySigns });
    }
  };

  const removeSecondarySign = (parentId: string, secId: string) => {
    const row = rows.find(row => row.id === parentId);
    if (row) {
      const updatedSecondarySigns = (row.secondarySigns || []).filter(sec => sec.id !== secId);
      updateRow(parentId, { secondarySigns: updatedSecondarySigns });
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground">{item.display_name}</h4>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">{item.item_number}</span>
            <span className="text-[10px] text-muted-foreground">Structure: <span className="font-medium text-foreground">Post Complete</span></span>
            <span className="text-[10px] text-muted-foreground">Substrate: <span className="font-medium text-foreground">Aluminum</span></span>
          </div>
        </div>
        {!disabled && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={addSign}>
              <Plus className="h-3 w-3" /> Add Sign
            </Button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          No signs added. Click Add Sign to configure signs for this item.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-muted/30">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-32">Designation</th>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-96">Legend</th>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-28">Dimensions</th>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-24">Sheeting</th>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-32">Qty</th>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-24">Post Size</th>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-32">Plan Sheet</th>
                <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-32">Sq Ft</th>
                {!disabled && <th className="px-2 py-2 w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <>
                  <tr key={row.id} className="hover:bg-muted/20">
                    <td className="px-2 py-1 border-r w-32">
                      <Button
                        variant="outline"
                        className="h-7 w-full justify-center text-center font-normal text-xs"
                        onClick={() => {
                          const primarySign: PrimarySign = {
                            id: row.id,
                            designation: row.signDesignation || '',
                            width: row.width || 0,
                            height: row.height || 0,
                            quantity: row.quantity || 1,
                            sheeting: row.sheeting as any,
                            associatedStructure: 'none',
                            displayStructure: 'LOOSE',
                            bLights: 0,
                            cover: false,
                            isCustom: row.isCustom || false,
                            bLightsColor: undefined,
                            description: row.signDescription || '',
                            substrate: 'Aluminum',
                          };
                          (primarySign as any).itemNumber = item.item_number;
                          setLocalSign(primarySign);
                          setDesignationSearcherOpen(true);
                        }}
                        disabled={disabled}
                      >
                        {row.signDesignation || 'select sign...'}
                      </Button>
                    </td>
                    <td className="px-2 py-1 border-r w-96">
                      <Textarea
                        className="text-xs w-full min-h-[28px] resize-none overflow-hidden py-1.5 px-2"
                        value={row.signLegend}
                        onChange={(e) => updateRow(row.id, { signLegend: e.target.value })}
                        placeholder="Legend text"
                        disabled={disabled}
                        rows={1}
                        onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
                      />
                    </td>
                    <td className="px-2 py-1 border-r w-28">
                      <span className="text-xs text-foreground">{row.dimensionLabel || "—"}</span>
                    </td>
                    <td className="px-2 py-1 border-r w-24">
                      <Select value={row.sheeting} onValueChange={(v) => updateRow(row.id, { sheeting: v })} disabled={disabled}>
                        <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SHEETING_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>
                            ))}
                          </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1 border-r w-32">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateRow(row.id, { quantity: Math.max(1, row.quantity - 1) })}
                          disabled={disabled || row.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="h-7 text-xs text-center w-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={row.quantity || 1}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const cleaned = raw.replace(/\D/g, '');
                            const num = cleaned === '' ? 1 : Math.max(1, parseInt(cleaned, 10));
                            updateRow(row.id, { quantity: num });
                          }}
                          disabled={disabled}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateRow(row.id, { quantity: row.quantity + 1 })}
                          disabled={disabled}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-2 py-1 border-r w-24">
                      <Select value={row.postSize} onValueChange={(v) => updateRow(row.id, { postSize: v })} disabled={disabled}>
                        <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {POST_SIZE_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1 border-r w-32">
                      <div className="flex gap-1">
                        <Input
                          className="h-7 text-xs w-12 text-center"
                          value={row.planSheetNum}
                          onChange={(e) => updateRow(row.id, { planSheetNum: e.target.value })}
                          placeholder="#"
                          disabled={disabled}
                        />
                        <span className="text-xs text-muted-foreground self-center">/</span>
                        <Input
                          className="h-7 text-xs w-12 text-center"
                          value={row.planSheetTotal}
                          onChange={(e) => updateRow(row.id, { planSheetTotal: e.target.value })}
                          placeholder="#"
                          disabled={disabled}
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1 border-r w-32 text-xs font-medium tabular-nums text-right">
                      {row.totalSqft > 0 ? row.totalSqft : "—"}
                    </td>
                    {!disabled && (
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Duplicate sign" onClick={() => duplicateRow(row.id)}>
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Add secondary sign" onClick={() => addSecondarySign(row.id)}>
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(row.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Secondary signs */}
                  {(row.secondarySigns || []).map((sec) => (
                    <tr key={sec.id} className="bg-muted/10">
                      <td className="px-2 py-1 border-r w-32">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">↳</span>
                          <Button
                            variant="outline"
                            className="h-6 flex-1 justify-start text-left font-normal text-[11px] truncate"
                            onClick={() => {
                              const secondarySign: SecondarySign = {
                                id: sec.id,
                                primarySignId: row.id,
                                designation: sec.signDesignation || '',
                                width: sec.width || 0,
                                height: sec.height || 0,
                                quantity: row.quantity,
                                sheeting: sec.sheeting as any,
                                isCustom: sec.isCustom || false,
                                description: sec.signDescription || '',
                                substrate: 'Aluminum',
                              };
                              setLocalSign(secondarySign);
                              setDesignationSearcherOpen(true);
                            }}
                            disabled={disabled}
                          >
                            {sec.signDesignation || 'select sign...'}
                          </Button>
                        </div>
                      </td>
                      <td className="px-2 py-1 border-r w-96">
                        <Textarea className="text-[11px] w-full min-h-[24px] resize-none overflow-hidden py-1 px-2" value={sec.signLegend}
                          onChange={(e) => updateSecondarySign(row.id, sec.id, { signLegend: e.target.value })}
                          placeholder="Legend" disabled={disabled} rows={1}
                          onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }} />
                      </td>
                      <td className="px-2 py-1 border-r w-28">
                        <span className="text-[11px] text-muted-foreground">{sec.dimensionLabel || "—"}</span>
                      </td>
                      <td className="px-2 py-1 border-r w-24">
                        <Select value={sec.sheeting} onValueChange={(v) => updateSecondarySign(row.id, sec.id, { sheeting: v })} disabled={disabled}>
                          <SelectTrigger className="h-6 text-[11px] w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SHEETING_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1 border-r w-32">
                        <span className="text-[11px] text-muted-foreground">{row.quantity}</span>
                      </td>
                      <td className="px-2 py-1 border-r w-24">
                        <span className="text-[10px] text-muted-foreground italic">same post</span>
                      </td>
                      <td className="px-2 py-1 border-r w-32">
                        <span className="text-[10px] text-muted-foreground italic">same sheet</span>
                      </td>
                      <td className="px-2 py-1 border-r w-32 text-[11px] font-medium tabular-nums text-right">
                        {sec.sqft > 0 ? Math.round(sec.sqft * row.quantity * 100) / 100 : "—"}
                      </td>
                      {!disabled && (
                        <td className="px-2 py-1">
                          <div className="flex items-center justify-end">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSecondarySign(row.id, sec.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary footer */}
      {rows.length > 0 && (
        <div className="bg-muted/20 px-4 py-2 flex items-center gap-6 text-xs border-t">
          <div>
            <span className="text-muted-foreground font-medium">Total Sq Ft: </span>
            <span className="font-bold tabular-nums">
              {Math.round(rows.reduce((sum, r) => {
                let rowTotal = r.totalSqft;
                (r.secondarySigns || []).forEach((s) => {
                  rowTotal += Math.round(s.sqft * r.quantity * 100) / 100;
                });
                return sum + rowTotal;
              }, 0) * 100) / 100}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Unique Signs: </span>
            <span className="font-bold tabular-nums">{rows.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Total Qty: </span>
            <span className="font-bold tabular-nums">{rows.reduce((sum, r) => sum + r.quantity, 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Component for RESET/REMOVE type items (simple entry)
const PermanentSignEntryTable = ({
  item,
  rows,
  onRowsChange,
  disabled,
}: {
  item: PermanentSignItem;
  rows: PermEntryRow[];
  onRowsChange: (rows: PermEntryRow[]) => void;
  disabled?: boolean;
}) => {
  const addEntry = () => {
    const newRow: PermEntryRow = {
      id: crypto.randomUUID(),
      itemNumber: item.item_number,
      quantity: 1,
      description: "",
    };
    onRowsChange([...rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<PermEntryRow>) => {
    onRowsChange(rows.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter(row => row.id !== id));
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground">{item.display_name}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">{item.item_number}</span>
        </div>
        {!disabled && (
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={addEntry}>
            <Plus className="h-3 w-3" /> Add Entry
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground">No entries. Click Add Entry to add.</div>
      ) : (
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider border-r w-24">Qty</th>
              <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider">Description / Notes</th>
              {!disabled && <th className="px-4 py-2 w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2 border-r w-24">
                  <Input
                    type="number" min={1} className="h-7 w-16 text-xs"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    disabled={disabled}
                  />
                </td>
                <td className="px-4 py-2">
                  <Textarea
                    className="text-xs min-h-[28px] resize-none overflow-hidden py-1.5 px-2"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    placeholder="Description or location notes"
                    disabled={disabled}
                    rows={1}
                    onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
                  />
                </td>
                {!disabled && (
                  <td className="px-4 py-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(row.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};