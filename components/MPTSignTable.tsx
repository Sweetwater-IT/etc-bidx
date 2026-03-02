import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, Settings } from "lucide-react";
import { SignMaterial, SIGN_MATERIALS, abbreviateMaterial } from "@/utils/signMaterial";

export type MPTSignRow = {
  id: string;
  isCustom: boolean;
  signDesignation: string;
  signDescription: string;
  width: number;
  height: number;
  dimensionLabel: string;
  signLegend: string;
  sheeting: string;
  structureType: string;
  bLights: 'none' | 'yellow' | 'red' | 'white';
  sqft: number;
  totalSqft: number;
  quantity: number;
  needsOrder: boolean;
  cover: boolean;
  loadOrder: number;
  material: SignMaterial;
  secondarySigns: any[];
};

interface MPTSignTableProps {
  sectionTitle: string;
  structureOptions: string[];
  rows: MPTSignRow[];
  onRowsChange: (rows: MPTSignRow[]) => void;
  orderable?: boolean;
  disabled?: boolean;
  defaultMaterial: SignMaterial;
}

const SHEETING_OPTIONS = ["HI", "ENG", "FL", "DG", "EG"];
const B_LIGHT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
];

export const MPTSignTable = ({
  sectionTitle,
  structureOptions,
  rows,
  onRowsChange,
  orderable = false,
  disabled = false,
  defaultMaterial,
}: MPTSignTableProps) => {
  const [showAddSignDialog, setShowAddSignDialog] = useState(false);
  const [showCustomSignDialog, setShowCustomSignDialog] = useState(false);

  // Determine column layout based on section
  const getColumns = (sectionKey: string) => {
    const baseColumns = [
      { key: 'designation', label: 'Designation', width: 'w-32' },
      { key: 'legend', label: 'Legend', width: 'w-24' },
      { key: 'dimensions', label: 'Dimensions', width: 'w-28' },
      { key: 'sheeting', label: 'Sheeting', width: 'w-20' },
      { key: 'qty', label: 'Qty', width: 'w-16' },
      { key: 'structure', label: 'Structure', width: 'w-32' },
      { key: 'bLights', label: 'B-Lights', width: 'w-20' },
      { key: 'sqft', label: 'Sq Ft', width: 'w-16' },
      { key: 'material', label: 'Material', width: 'w-20' },
      { key: 'cover', label: 'Cover', width: 'w-16' },
    ];

    if (sectionTitle.toLowerCase().includes('trailblazer')) {
      // Trailblazers: Add Load Order at the end
      return [...baseColumns, { key: 'loadOrder', label: 'Load Order', width: 'w-20' }];
    } else if (sectionTitle.toLowerCase().includes('type iii')) {
      // Type IIIs: Load Order first, then others
      return [
        { key: 'loadOrder', label: 'Load Order', width: 'w-20' },
        ...baseColumns,
      ];
    } else {
      // Sign Stands: Base columns without Load Order
      return baseColumns;
    }
  };

  const columns = getColumns(sectionTitle.toLowerCase());

  const addSign = () => {
    const newRow: MPTSignRow = {
      id: crypto.randomUUID(),
      isCustom: false,
      signDesignation: '',
      signDescription: '',
      width: 0,
      height: 0,
      dimensionLabel: '',
      signLegend: '',
      sheeting: 'HI',
      structureType: structureOptions[0] || '',
      bLights: 'none',
      sqft: 0,
      totalSqft: 0,
      quantity: 1,
      needsOrder: false,
      cover: false,
      loadOrder: rows.length + 1,
      material: defaultMaterial,
      secondarySigns: [],
    };
    onRowsChange([...rows, newRow]);
  };

  const addCustomSign = () => {
    const newRow: MPTSignRow = {
      id: crypto.randomUUID(),
      isCustom: true,
      signDesignation: '',
      signDescription: '',
      width: 0,
      height: 0,
      dimensionLabel: '',
      signLegend: '',
      sheeting: 'HI',
      structureType: structureOptions[0] || '',
      bLights: 'none',
      sqft: 0,
      totalSqft: 0,
      quantity: 1,
      needsOrder: false,
      cover: false,
      loadOrder: rows.length + 1,
      material: defaultMaterial,
      secondarySigns: [],
    };
    onRowsChange([...rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<MPTSignRow>) => {
    onRowsChange(rows.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter(row => row.id !== id));
  };

  const renderCell = (row: MPTSignRow, column: { key: string; label: string; width: string }) => {
    switch (column.key) {
      case 'designation':
        return (
          <Input
            className="h-8 text-xs"
            value={row.signDesignation}
            onChange={(e) => updateRow(row.id, { signDesignation: e.target.value })}
            placeholder="Enter designation"
            disabled={disabled}
          />
        );
      case 'legend':
        return (
          <Input
            className="h-8 text-xs"
            value={row.signLegend}
            onChange={(e) => updateRow(row.id, { signLegend: e.target.value })}
            placeholder="Legend"
            disabled={disabled}
          />
        );
      case 'dimensions':
        return (
          <Input
            className="h-8 text-xs"
            value={row.dimensionLabel}
            onChange={(e) => updateRow(row.id, { dimensionLabel: e.target.value })}
            placeholder="e.g. 48x96"
            disabled={disabled}
          />
        );
      case 'sheeting':
        return (
          <Select
            value={row.sheeting}
            onValueChange={(value) => updateRow(row.id, { sheeting: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHEETING_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'qty':
        return (
          <Input
            type="number"
            min={1}
            className="h-8 text-xs w-16"
            value={row.quantity}
            onChange={(e) => updateRow(row.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            disabled={disabled}
          />
        );
      case 'structure':
        return (
          <Select
            value={row.structureType}
            onValueChange={(value) => updateRow(row.id, { structureType: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select structure" />
            </SelectTrigger>
            <SelectContent>
              {structureOptions.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'bLights':
        return (
          <Select
            value={row.bLights}
            onValueChange={(value: any) => updateRow(row.id, { bLights: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {B_LIGHT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'sqft':
        return (
          <Input
            type="number"
            step="0.01"
            className="h-8 text-xs w-20"
            value={row.sqft}
            onChange={(e) => updateRow(row.id, { sqft: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
          />
        );
      case 'material':
        return (
          <Select
            value={row.material}
            onValueChange={(value: any) => updateRow(row.id, { material: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIGN_MATERIALS.filter(m => m.value === "PLASTIC" || m.value === "ALUMINUM").map(m => (
                <SelectItem key={m.value} value={m.value}>{m.abbrev}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'cover':
        return (
          <div className="flex justify-center">
            <Checkbox
              checked={row.cover}
              onCheckedChange={(checked) => updateRow(row.id, { cover: !!checked })}
              disabled={disabled}
            />
          </div>
        );
      case 'loadOrder':
        return (
          <Input
            type="number"
            min={1}
            className="h-8 text-xs w-16"
            value={row.loadOrder}
            onChange={(e) => updateRow(row.id, { loadOrder: Math.max(1, parseInt(e.target.value) || 1) })}
            disabled={disabled}
          />
        );
      default:
        return <span className="text-xs text-muted-foreground">-</span>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Section Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{sectionTitle}</h3>
        {!disabled && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setShowCustomSignDialog(true)}
            >
              <Settings className="h-3 w-3" />
              Custom Sign
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setShowAddSignDialog(true)}
            >
              <Plus className="h-3 w-3" />
              Add Sign
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">No signs added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Add Sign" or "Custom Sign" to start building your {sectionTitle.toLowerCase()} takeoff.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  {columns.map(column => (
                    <th key={column.key} className={`px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 ${column.width}`}>
                      {column.label}
                    </th>
                  ))}
                  {!disabled && <th className="px-2 py-2 w-12"></th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-muted/20">
                    {columns.map(column => (
                      <td key={column.key} className="px-2 py-1 border-r last:border-r-0">
                        {renderCell(row, column)}
                      </td>
                    ))}
                    {!disabled && (
                      <td className="px-2 py-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeRow(row.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Sign Dialog Placeholder */}
      {showAddSignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Add Sign from Database</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Sign selection modal will be integrated here. For now, click "Add Blank Row" to add an empty sign entry.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddSignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                addSign();
                setShowAddSignDialog(false);
              }}>
                Add Blank Row
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Sign Dialog Placeholder */}
      {showCustomSignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Create Custom Sign</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Custom sign creation modal will be integrated here. For now, click "Add Custom Row" to add an empty custom sign entry.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCustomSignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                addCustomSign();
                setShowCustomSignDialog(false);
              }}>
                Add Custom Row
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};