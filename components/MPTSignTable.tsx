import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Minus, Trash2, Search, Settings, GripVertical, Check, Copy, FilePlus } from "lucide-react";
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
import { QuantityInput } from "@/components/ui/quantity-input";

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

const SHEETING_OPTIONS = ["HI", "DG", "Type 11", "FYG"];
const B_LIGHT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '1y', label: '1 Yellow' },
  { value: '1r', label: '1 Red' },
  { value: '1w', label: '1 White' },
  { value: '2y', label: '2 Yellow' },
  { value: '2r', label: '2 Red' },
  { value: '2w', label: '2 White' },
];

const roundToTwo = (value: number) => Math.round(value * 100) / 100;

const getTypeIIIStructureSqft = (structureType?: string) => {
  const normalized = String(structureType || "").toUpperCase();
  if (!normalized || normalized === "LOOSE") return 0;
  return normalized.includes("6FT") ? 12 : 8.01;
};

// Sortable table row component
const SortableRow = ({
  row,
  columns,
  renderCell,
  requestDeleteRow,
  duplicateRow,
  addSecondarySign,
  disabled,
  orderable,
}: {
  row: MPTSignRow;
  columns: { key: string; label: string; width: string }[];
  renderCell: (row: MPTSignRow, column: { key: string; label: string; width: string }) => React.ReactNode;
  requestDeleteRow: (id: string) => void;
  duplicateRow: (id: string) => void;
  addSecondarySign: (id: string) => void;
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
        <td key={column.key} className={`px-2 py-1 border-r last:border-r-0 ${column.width}`}>
          {renderCell(row, column)}
        </td>
      ))}
      {!disabled && (
        <td className="px-2 py-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => duplicateRow(row.id)}
              title="Duplicate row"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => addSecondarySign(row.id)}
              title="Add secondary sign"
            >
              <FilePlus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => requestDeleteRow(row.id)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
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
  const [designationSearcherOpen, setDesignationSearcherOpen] = useState(false);
  const isTypeIIISection = sectionTitle.toLowerCase().includes('type iii');
  const [pendingDelete, setPendingDelete] = useState<{ type: "row" | "secondary"; rowId: string; secondaryId?: string } | null>(null);

  const getPrimaryTotalSqft = (row: Partial<MPTSignRow>) => {
    const quantity = isTypeIIISection ? 1 : Math.max(1, Number(row.quantity || 1));
    const signSqft = Number(row.sqft || 0) * quantity;
    const structureSqft =
      isTypeIIISection && row.structureType && row.structureType !== "Loose"
        ? getTypeIIIStructureSqft(row.structureType) * quantity
        : 0;
    return roundToTwo(signSqft + structureSqft);
  };

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

  useEffect(() => {
    if (!isTypeIIISection) return;

    const hasInvalidQuantity = rows.some((row) => row.quantity !== 1);
    const hasInvalidSecondaryQuantity = rows.some((row) =>
      (row.secondarySigns || []).some((secondary) => secondary.quantity !== 1)
    );

    if (!hasInvalidQuantity && !hasInvalidSecondaryQuantity) return;

    onRowsChange(
      rows.map((row) => ({
        ...row,
        quantity: 1,
        secondarySigns: (row.secondarySigns || []).map((secondary) => ({
          ...secondary,
          quantity: 1,
        })),
      }))
    );
  }, [isTypeIIISection, onRowsChange, rows]);

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
      { key: 'legend', label: 'Legend', width: 'w-96' },
      { key: 'dimensions', label: 'Dimensions', width: 'w-28' },
      { key: 'sheeting', label: 'Sheeting', width: 'w-24' },
      { key: 'qty', label: 'Qty', width: 'w-32' },
      { key: 'structure', label: 'Structure', width: 'w-40' },
      { key: 'bLights', label: 'B-Lights', width: 'w-24' },
      { key: 'sqft', label: 'Sq Ft', width: 'w-32' },
      { key: 'material', label: 'Material', width: 'w-24' },
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

  // Debug table cell widths
  useEffect(() => {
    const logCellWidths = () => {
      const table = tableWrapperRef.current?.querySelector('table');
      if (table && columns.length > 0) {
        const headers = table.querySelectorAll('thead th');
        const cells = table.querySelectorAll('tbody td');

        console.log(`MPTSignTable ${sectionTitle} - Cell Width Analysis:`);

        // Log header widths
        headers.forEach((header, index) => {
          const column = columns[index];
          const htmlHeader = header as HTMLElement;
          if (column) {
            console.log(`Header ${column.key}:`, {
              label: column.label,
              widthClass: column.width,
              clientWidth: htmlHeader.clientWidth,
              offsetWidth: htmlHeader.offsetWidth,
              computedStyle: {
                width: window.getComputedStyle(htmlHeader).width,
                minWidth: window.getComputedStyle(htmlHeader).minWidth,
                maxWidth: window.getComputedStyle(htmlHeader).maxWidth,
                boxSizing: window.getComputedStyle(htmlHeader).boxSizing,
              },
            });
          }
        });

        // Log first row cell widths for comparison
        if (cells.length > 0) {
          const firstRowCells = Array.from(cells).slice(0, columns.length);
          firstRowCells.forEach((cell, index) => {
            const column = columns[index];
            const htmlCell = cell as HTMLElement;
            if (column) {
              console.log(`Cell ${column.key}:`, {
                label: column.label,
                widthClass: column.width,
                clientWidth: htmlCell.clientWidth,
                offsetWidth: htmlCell.offsetWidth,
                computedStyle: {
                  width: window.getComputedStyle(htmlCell).width,
                  minWidth: window.getComputedStyle(htmlCell).minWidth,
                  maxWidth: window.getComputedStyle(htmlCell).maxWidth,
                  boxSizing: window.getComputedStyle(htmlCell).boxSizing,
                },
              });
            }
          });
        }
      }
    };

    // Log after a short delay to ensure DOM is updated
    const timeoutId = setTimeout(logCellWidths, 100);

    return () => clearTimeout(timeoutId);
  }, [sectionTitle, columns, rows.length]);

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
    onRowsChange(
      rows.map((row) => {
        if (row.id !== id) return row;

        const nextRow: MPTSignRow = {
          ...row,
          ...updates,
          quantity: isTypeIIISection ? 1 : (updates.quantity ?? row.quantity),
        };

        return {
          ...nextRow,
          totalSqft: getPrimaryTotalSqft(nextRow),
        };
      })
    );
  };

  const removeRow = (id: string) => {
    onRowsChange(rows.filter(row => row.id !== id));
  };

  const duplicateRow = (id: string) => {
    const rowToDuplicate = rows.find(row => row.id === id);
    if (rowToDuplicate) {
      const duplicatedRow: MPTSignRow = {
        ...rowToDuplicate,
        id: crypto.randomUUID(),
        quantity: isTypeIIISection ? 1 : rowToDuplicate.quantity,
        totalSqft: getPrimaryTotalSqft({
          ...rowToDuplicate,
          quantity: isTypeIIISection ? 1 : rowToDuplicate.quantity,
        }),
        loadOrder: rows.length + 1,
        secondarySigns: [], // Don't duplicate secondary signs
      };
      onRowsChange([...rows, duplicatedRow]);
    }
  };

  const addSecondarySign = (id: string) => {
    const row = rows.find(row => row.id === id);
    if (row) {
      const newSecondarySign = {
        id: crypto.randomUUID(),
        primarySignId: id,
        signDesignation: '',
        signDescription: '',
        width: 0,
        height: 0,
        dimensionLabel: '',
        signLegend: '',
        sheeting: 'HI',
        sqft: 0,
        quantity: row.quantity, // Match primary sign quantity
        isCustom: false,
        needsOrder: false,
      };

      const updatedRow = {
        ...row,
        secondarySigns: [...row.secondarySigns, newSecondarySign],
      };

      updateRow(id, { secondarySigns: updatedRow.secondarySigns });
    }
  };

  const updateSecondarySign = (parentId: string, secId: string, updates: Partial<any>) => {
    const row = rows.find(row => row.id === parentId);
    if (row) {
      const updatedSecondarySigns = row.secondarySigns.map(sec =>
        sec.id === secId ? { ...sec, ...updates } : sec
      );
      updateRow(parentId, { secondarySigns: updatedSecondarySigns });
    }
  };

  const removeSecondarySign = (parentId: string, secId: string) => {
    const row = rows.find(row => row.id === parentId);
    if (row) {
      const updatedSecondarySigns = row.secondarySigns.filter(sec => sec.id !== secId);
      updateRow(parentId, { secondarySigns: updatedSecondarySigns });
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === "row") {
      removeRow(pendingDelete.rowId);
    } else if (pendingDelete.secondaryId) {
      removeSecondarySign(pendingDelete.rowId, pendingDelete.secondaryId);
    }
    setPendingDelete(null);
  };

  // Handle designation selection from DesignationSearcher
  const handleDesignationSelected = (updatedSign: PrimarySign | any) => {
    if (!localSign) return;

    // Check if this is a secondary sign (has primarySignId)
    if ((localSign as SecondarySign).primarySignId) {
      // Update secondary sign in parent's secondarySigns array
      const secondarySign = localSign as SecondarySign;
      updateSecondarySign(secondarySign.primarySignId, secondarySign.id, {
        signDesignation: updatedSign.designation,
        signDescription: updatedSign.description || '',
        signLegend: updatedSign.description || '', // Populate legend with sign description
        width: updatedSign.width,
        height: updatedSign.height,
        dimensionLabel: updatedSign.width && updatedSign.height ? `${updatedSign.width}" x ${updatedSign.height}"` : '',
        sheeting: updatedSign.sheeting as any,
        sqft: roundToTwo((updatedSign.width * updatedSign.height) / 144), // Convert to square feet
      });
    } else {
      // Update primary sign row
      const primarySqft = roundToTwo((updatedSign.width * updatedSign.height) / 144);
      updateRow(localSign.id, {
        signDesignation: updatedSign.designation,
        signDescription: updatedSign.description || '',
        signLegend: updatedSign.description || '', // Populate legend with sign description
        width: updatedSign.width,
        height: updatedSign.height,
        dimensionLabel: updatedSign.width && updatedSign.height ? `${updatedSign.width}" x ${updatedSign.height}"` : '',
        sheeting: updatedSign.sheeting as any,
        sqft: primarySqft,
        totalSqft: getPrimaryTotalSqft({
          ...rows.find((row) => row.id === localSign.id),
          width: updatedSign.width,
          height: updatedSign.height,
          sqft: primarySqft,
          quantity: updatedSign.quantity,
        }),
        quantity: updatedSign.quantity,
        cover: updatedSign.cover,
        // Map bLights from the searcher format to our format
        bLights: !updatedSign.bLights || updatedSign.bLights === 'none' ? 'none' :
                (updatedSign.bLightsColor === 'Yellow' ? 'yellow' :
                 updatedSign.bLightsColor === 'Red' ? 'red' : 'white'),
      });
    }

    // Reset localSign after selection
    setLocalSign(undefined);
  };

  const renderCell = (row: MPTSignRow, column: { key: string; label: string; width: string }) => {
    switch (column.key) {
      case 'designation':
        return (
          <>
            <Button
              variant="outline"
              className="h-8 w-full justify-center text-center font-normal text-xs"
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
                setDesignationSearcherOpen(true);
              }}
              disabled={disabled}
            >
              {row.signDesignation || 'select sign...'}
            </Button>
          </>
        );
      case 'legend':
        return (
          <Input
            className="h-8 text-xs w-full"
            value={row.signLegend}
            onChange={(e) => updateRow(row.id, { signLegend: e.target.value })}
            placeholder="Legend"
            disabled={disabled}
          />
        );
      case 'dimensions':
        return (
          <Input
            className="h-8 text-xs w-full"
            value={row.dimensionLabel}
            onChange={(e) => updateRow(row.id, { dimensionLabel: e.target.value })}
            placeholder="e.g. 48x96"
            disabled={disabled || !!row.signDesignation}
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
        if (isTypeIIISection) {
          return (
            <QuantityInput
              value={1}
              min={1}
              max={1}
              disabled
              className="opacity-80"
              inputClassName="text-xs tabular-nums"
            />
          );
        }
        return (
          <QuantityInput
            value={row.quantity || 1}
            min={1}
            onChange={(value) => updateRow(row.id, { quantity: Math.max(1, value) })}
            disabled={disabled}
            inputClassName="text-xs tabular-nums"
          />
        );
      case 'structure':
        return (
          <Select
            value={row.structureType}
            onValueChange={(value) => updateRow(row.id, { structureType: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs w-full">
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
            <SelectTrigger className="h-8 text-xs w-full">
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
          <div className="flex items-center">
            <Input
              type="number"
              step="0.01"
              className="h-8 text-xs flex-1 rounded-r-none border-r-0"
              value={getPrimaryTotalSqft(row)}
              onChange={(e) => updateRow(row.id, { sqft: roundToTwo((parseFloat(e.target.value) || 0)) })}
              disabled={true}
            />
            <span className="h-8 px-2 bg-muted border border-l-0 rounded-r flex items-center text-xs text-muted-foreground">
              sq ft
            </span>
          </div>
        );
      case 'material':
        return (
          <Select
            value={row.material}
            onValueChange={(value: any) => updateRow(row.id, { material: value })}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs w-full">
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
            type="text"
            readOnly
            aria-readonly="true"
            className="h-8 text-xs w-16 text-center tabular-nums bg-muted/40"
            value={row.loadOrder}
            disabled={disabled}
          />
        );
      default:
        return <span className="text-xs text-muted-foreground">-</span>;
    }
  };

  const summary = rows.reduce(
    (acc, row) => {
      if (!row.signDesignation) return acc;

      const rowQty = row.quantity || 0;
      const quantity = isTypeIIISection ? 1 : rowQty;
      const structureSqft = isTypeIIISection ? getTypeIIIStructureSqft(row.structureType) * quantity : 0;
      const primarySignSqft = Number(row.sqft || 0) * quantity;
      const primarySqft = Number(row.totalSqft || 0) || getPrimaryTotalSqft(row);
      const secondarySqft = (row.secondarySigns || []).reduce((secTotal, sec) => {
        const secSqft = sec.sqft || 0;
        return secTotal + Math.round(secSqft * rowQty * 100) / 100;
      }, 0);
      const signSqft = primarySignSqft + secondarySqft;
      acc.signSqft = Math.round((acc.signSqft + signSqft) * 100) / 100;
      acc.structureSqft = Math.round((acc.structureSqft + structureSqft) * 100) / 100;
      acc.totalSqft = Math.round((acc.totalSqft + primarySqft + secondarySqft) * 100) / 100;
      acc.uniqueSigns += 1;
      acc.totalStructures += row.structureType && row.structureType !== 'Loose' ? rowQty : 0;
      const bLightsValue = row.bLights || 'none';
      if (bLightsValue !== 'none') {
        const parsed = parseInt(bLightsValue.replace(/\D/g, ''), 10);
        const count = Number.isNaN(parsed) ? 1 : parsed;
        acc.totalBLights += count * rowQty;
      }
      return acc;
    },
    { totalSqft: 0, signSqft: 0, structureSqft: 0, uniqueSigns: 0, totalStructures: 0, totalBLights: 0 }
  );

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
                  <table className="w-full min-w-[800px]" style={{ tableLayout: 'fixed' }}>
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
                          requestDeleteRow={(id) => setPendingDelete({ type: "row", rowId: id })}
                          duplicateRow={duplicateRow}
                          addSecondarySign={addSecondarySign}
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
              <table className="w-full min-w-[800px]" style={{ tableLayout: 'fixed' }}>
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
                    <>
                      <tr key={row.id} className="hover:bg-muted/20">
                        {columns.map(column => (
                          <td key={column.key} className={`px-2 py-1 border-r last:border-r-0 ${column.width}`}>
                            {renderCell(row, column)}
                          </td>
                        ))}
                        {!disabled && (
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => duplicateRow(row.id)}
                                title="Duplicate row"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => addSecondarySign(row.id)}
                                title="Add secondary sign"
                              >
                                <FilePlus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setPendingDelete({ type: "row", rowId: row.id })}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Secondary signs */}
                      {(row.secondarySigns || []).map((sec: any) => (
                        <tr key={sec.id} className="bg-muted/10">
                          {columns.map((column, index) => (
                            <td key={`${sec.id}-${column.key}`} className={`px-2 py-1 border-r last:border-r-0 ${column.width}`}>
                              {column.key === 'designation' ? (
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
                                        substrate: 'Plastic',
                                      };
                                      setLocalSign(secondarySign);
                                      setDesignationSearcherOpen(true);
                                    }}
                                    disabled={disabled}
                                  >
                                    {sec.signDesignation || 'select sign...'}
                                  </Button>
                                </div>
                              ) : column.key === 'legend' ? (
                                <Input
                                  className="h-6 text-[11px] w-full"
                                  value={sec.signLegend}
                                  onChange={(e) => updateSecondarySign(row.id, sec.id, { signLegend: e.target.value })}
                                  placeholder="Legend"
                                  disabled={disabled}
                                />
                              ) : column.key === 'dimensions' ? (
                                <span className="text-[11px] text-muted-foreground">{sec.dimensionLabel || "—"}</span>
                              ) : column.key === 'sheeting' ? (
                                <Select
                                  value={sec.sheeting || 'HI'}
                                  onValueChange={(v: string) => updateSecondarySign(row.id, sec.id, { sheeting: v })}
                                  disabled={disabled}
                                >
                                  <SelectTrigger className="h-6 text-[11px] w-[65px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SHEETING_OPTIONS.map((o) => (
                                      <SelectItem key={o} value={o}>{o}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : column.key === 'qty' ? (
                                <span className="text-[11px] text-muted-foreground">{row.quantity}</span>
                              ) : column.key === 'structure' ? (
                                <span className="text-[10px] text-muted-foreground italic">same structure</span>
                              ) : column.key === 'sqft' ? (
                                <span className="text-[11px] font-medium tabular-nums text-right">
                                  {sec.sqft > 0 ? Math.round(sec.sqft * row.quantity * 100) / 100 : "—"}
                                </span>
                              ) : index === columns.length - 1 && !disabled ? (
                                <div className="flex items-center justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setPendingDelete({ type: "secondary", rowId: row.id, secondaryId: sec.id })}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {rows.length > 0 && summary.uniqueSigns > 0 && (
        <div className="bg-muted/20 px-4 py-2 flex flex-wrap items-center gap-6 text-xs border-t">
          <div>
            <span className="text-muted-foreground font-medium">Total Sq Ft: </span>
            <span className="font-bold tabular-nums">{summary.totalSqft.toFixed(2)}</span>
          </div>
          {isTypeIIISection && (
            <>
              <div>
                <span className="text-muted-foreground font-medium">Sign Sq Ft: </span>
                <span className="font-bold tabular-nums">{summary.signSqft.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Structure Sq Ft: </span>
                <span className="font-bold tabular-nums">{summary.structureSqft.toFixed(2)}</span>
              </div>
            </>
          )}
          <div>
            <span className="text-muted-foreground font-medium">Unique Signs: </span>
            <span className="font-bold tabular-nums">{summary.uniqueSigns}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Total Structures: </span>
            <span className="font-bold tabular-nums">{summary.totalStructures}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">B-Lights: </span>
            <span className="font-bold tabular-nums">{summary.totalBLights}</span>
          </div>
        </div>
      )}

      {/* Controlled DesignationSearcher */}
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
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              This will remove the selected sign row. Choose confirm to continue or cancel to keep it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
