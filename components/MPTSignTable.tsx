import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Search, Settings, GripVertical, Check } from "lucide-react";
import { SignMaterial, SIGN_MATERIALS, abbreviateMaterial } from "@/utils/signMaterial";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useRef } from 'react';
import DesignationSearcher from "@/components/pages/active-bid/signs/DesignationSearcher";
import { PrimarySign, SecondarySign } from "@/types/MPTEquipment";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SignDesignation {
  id: string;
  designation: string;
  description: string;
  category: string;
  sizes: string[];
  sheeting: string;
  image_url?: string;
  dimensions: { width: number; height: number }[];
}

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
  { value: '1y', label: '1 Yellow' },
  { value: '1r', label: '1 Red' },
  { value: '1w', label: '1 White' },
  { value: '2y', label: '2 Yellow' },
  { value: '2r', label: '2 Red' },
  { value: '2w', label: '2 White' },
];

// Sortable table row component
const SortableRow = ({
  row,
  columns,
  renderCell,
  removeRow,
  disabled,
  orderable,
}: {
  row: MPTSignRow;
  columns: { key: string; label: string; width: string }[];
  renderCell: (row: MPTSignRow, column: { key: string; label: string; width: string }) => React.ReactNode;
  removeRow: (id: string) => void;
  disabled: boolean;
  orderable: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-muted/20 ${isDragging ? 'opacity-50' : ''}`}
    >
      {orderable && (
        <td className="px-2 py-1 border-r">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </td>
      )}
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
  );
};

export const MPTSignTable = ({
  sectionTitle,
  structureOptions,
  rows,
  onRowsChange,
  orderable = false,
  disabled = false,
  defaultMaterial,
}: MPTSignTableProps) => {
  // Sign selection state
  const [signs, setSigns] = useState<SignDesignation[]>([]);
  const [signsLoading, setSignsLoading] = useState(false);

  // DesignationSearcher state
  const [localSign, setLocalSign] = useState<PrimarySign | SecondarySign | undefined>();

  // Debugging ref
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Viewport-aware debugging: Log table wrapper dimensions and viewport calculations
  useEffect(() => {
    const logTableDimensions = () => {
      if (tableWrapperRef.current) {
        const rect = tableWrapperRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const sidebarWidth = 272; // Approximate sidebar width
        const padding = 32; // p-4 = 16px * 2
        const availableWidth = viewportWidth - sidebarWidth - padding;

        console.log(`MPTSignTable ${sectionTitle} - Viewport Analysis:`, {
          viewport: { width: viewportWidth, height: viewportHeight },
          sidebarWidth,
          padding,
          availableContentWidth: availableWidth,
          tableWrapper: {
            clientWidth: tableWrapperRef.current.clientWidth,
            scrollWidth: tableWrapperRef.current.scrollWidth,
            overflowX: tableWrapperRef.current.scrollWidth > tableWrapperRef.current.clientWidth,
            overflowAmount: tableWrapperRef.current.scrollWidth - tableWrapperRef.current.clientWidth,
          },
          boundingRect: rect,
          overflow: window.getComputedStyle(tableWrapperRef.current).overflow,
          overflowX: window.getComputedStyle(tableWrapperRef.current).overflowX,
          overflowY: window.getComputedStyle(tableWrapperRef.current).overflowY,
        });
      }
    };

    logTableDimensions();
    window.addEventListener('resize', logTableDimensions);

    return () => window.removeEventListener('resize', logTableDimensions);
  }, [sectionTitle, rows.length]);

  // Fetch signs from database
  useEffect(() => {
    const fetchSigns = async () => {
      setSignsLoading(true);
      try {
        const { data: signsDataRaw } = await supabase
          .from('signs_all')
          .select('id, designation, description, category, sizes, sheeting, image_url')
          .order('designation');

        const signsData: SignDesignation[] = (signsDataRaw || []).map((sign: any) => {
          const dimensions = (sign.sizes || []).map((sizeStr: string) => {
            const [widthStr, heightStr] = sizeStr.split(' x ');
            const width = parseFloat(widthStr);
            const height = parseFloat(heightStr);
            return !isNaN(width) && !isNaN(height) ? { width, height } : null;
          }).filter((dim): dim is { width: number; height: number } => dim !== null);

          return {
            ...sign,
            dimensions: dimensions.length > 0 ? dimensions : [{ width: 0, height: 0 }],
          };
        });

        setSigns(signsData);
      } catch (err) {
        console.error('Error fetching signs:', err);
      } finally {
        setSignsLoading(false);
      }
    };

    fetchSigns();
  }, []);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((row) => row.id === active.id);
      const newIndex = rows.findIndex((row) => row.id === over.id);

      const reorderedRows = arrayMove(rows, oldIndex, newIndex);

      // Update load order numbers based on new positions
      const updatedRows = reorderedRows.map((row, index) => ({
        ...row,
        loadOrder: index + 1,
      }));

      onRowsChange(updatedRows);
    }
  };

  // Determine column layout based on section
  const getColumns = (sectionKey: string) => {
    const baseColumns = [
      { key: 'designation', label: 'Designation', width: 'w-32' },
      { key: 'legend', label: 'Legend', width: 'w-80' },
      { key: 'dimensions', label: 'Dimensions', width: 'w-28' },
      { key: 'sheeting', label: 'Sheeting', width: 'w-20' },
      { key: 'qty', label: 'Qty', width: 'w-16' },
      { key: 'structure', label: 'Structure', width: 'w-32' },
      { key: 'bLights', label: 'B-Lights', width: 'w-20' },
      { key: 'sqft', label: 'Sq Ft', width: 'w-16' },
      { key: 'material', label: 'Material', width: 'w-20' },
      { key: 'cover', label: 'Cover', width: 'w-16' },
    ];

    if (sectionTitle.toLowerCase().includes('type iii')) {
      // Type IIIs: Load Order first, then others
      return [
        { key: 'loadOrder', label: 'Load Order', width: 'w-20' },
        ...baseColumns,
      ];
    } else {
      // Trailblazers and Sign Stands: Base columns without Load Order
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

  // Handle designation selection from DesignationSearcher
  const handleDesignationSelected = (updatedSign: PrimarySign | any) => {
    // Find the row that triggered the designation search (we'll need to track this)
    // For now, we'll update based on the current localSign state
    if (localSign) {
      updateRow(localSign.id, {
        signDesignation: updatedSign.designation,
        signDescription: updatedSign.description || '',
        signLegend: updatedSign.description || '', // Populate legend with sign description
        width: updatedSign.width,
        height: updatedSign.height,
        dimensionLabel: updatedSign.width && updatedSign.height ? `${updatedSign.width}x${updatedSign.height}` : '',
        sheeting: updatedSign.sheeting as any,
        sqft: (updatedSign.width * updatedSign.height) / 144, // Convert to square feet
        quantity: updatedSign.quantity,
        cover: updatedSign.cover,
        // Map bLights from the searcher format to our format
        bLights: !updatedSign.bLights || updatedSign.bLights === 'none' ? 'none' :
                (updatedSign.bLightsColor === 'Yellow' ? 'yellow' :
                 updatedSign.bLightsColor === 'Red' ? 'red' : 'white'),
      });
      // Reset localSign after selection
      setLocalSign(undefined);
    }
  };

  const renderCell = (row: MPTSignRow, column: { key: string; label: string; width: string }) => {
    switch (column.key) {
      case 'designation':
        return (
          <>
            <Button
              variant="outline"
              className="h-8 w-full justify-start text-left font-normal text-xs"
              onClick={() => {
                // Create a proper PrimarySign object for the designation searcher
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
                  cover: row.cover || false,
                  isCustom: row.isCustom || false,
                  bLightsColor: undefined,
                  description: row.signDescription || '',
                  substrate: 'Plastic',
                };
                setLocalSign(primarySign);
              }}
              disabled={disabled}
            >
              <span className="truncate">
                {row.signDesignation || 'Select designation...'}
              </span>
            </Button>
            {localSign && localSign.id === row.id && (
              <DesignationSearcher
                localSign={localSign}
                setLocalSign={setLocalSign}
                onDesignationSelected={handleDesignationSelected}
              />
            )}
          </>
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
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{sectionTitle}</h2>
        {!disabled && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs"
              onClick={addSign}
            >
              <Plus className="h-3 w-3" />
              Add Sign
            </Button>
          </div>
        )}
      </div>
      <div className="p-5">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No signs added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click Add Sign or Custom Sign to start building your {sectionTitle.toLowerCase()} takeoff.
            </p>
          </div>
        ) : orderable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={rows.map(row => row.id)} strategy={verticalListSortingStrategy}>
              <div className="rounded-lg border overflow-hidden">
                <div ref={tableWrapperRef} className="overflow-x-auto max-w-full">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border-r w-12">
                          {/* Drag handle column */}
                        </th>
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
                        <SortableRow
                          key={row.id}
                          row={row}
                          columns={columns}
                          renderCell={renderCell}
                          removeRow={removeRow}
                          disabled={disabled}
                          orderable={orderable}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[800px]">
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
      </div>
    </div>
  );
};