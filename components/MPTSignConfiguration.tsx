import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Package } from "lucide-react";
import { SignMaterial, SIGN_MATERIALS, abbreviateMaterial } from "@/utils/signMaterial";
import { MPTSignTable, type MPTSignRow } from "@/components/MPTSignTable";

// Re-export for convenience
export type { MPTSignRow };

interface MPTSignConfigurationProps {
  activeSections: string[];
  signRows: Record<string, MPTSignRow[]>;
  defaultSignMaterial: SignMaterial;
  onToggleSection: (key: string) => void;
  onSignRowsChange: (sectionKey: string, rows: MPTSignRow[]) => void;
  onDefaultMaterialChange: (material: SignMaterial) => void;
  onApplyMaterialToAll: () => void;
  disabled?: boolean;
}

const MPT_SECTIONS = [
  {
    key: "trailblazers",
    label: "Trailblazers / H-Stands",
    structures: [
      "Loose",
      "8FT POST (COMPLETE)",
      "10FT POST (COMPLETE)",
      "12FT POST (COMPLETE)",
      "14FT POST (COMPLETE)",
      "8FT H-STAND",
      "10FT H-STAND",
      "12FT H-STAND",
      "14FT H-STAND",
    ],
  },
  {
    key: "type_iii",
    label: "Type IIIs",
    structures: [
      "6FT RIGHT",
      "6FT LEFT",
      "4FT RIGHT",
      "4FT LEFT",
      "6FT LEFT/RIGHT",
      "4FT LEFT/RIGHT",
      "6FT WING BARRICADE",
    ],
  },
  {
    key: "sign_stands",
    label: "Sign Stands",
    structures: ["Sign Stand", "Loose"],
  },
];

export const MPTSignConfiguration = ({
  activeSections,
  signRows,
  defaultSignMaterial,
  onToggleSection,
  onSignRowsChange,
  onDefaultMaterialChange,
  onApplyMaterialToAll,
  disabled = false,
}: MPTSignConfigurationProps) => {
  const [showApplyMaterialDialog, setShowApplyMaterialDialog] = useState(false);

  const getSandbagsForRow = (sectionKey: string, row: MPTSignRow) => {
    if (!row.structureType) return 0;
    if (sectionKey === "trailblazers") {
      return row.structureType.toUpperCase().includes("H-STAND") ? 6 * row.quantity : 0;
    }
    if (sectionKey === "type_iii") {
      return row.structureType === "Loose" ? 0 : 12 * row.quantity;
    }
    return 0;
  };

  // Debugging refs
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Debugging: Log container dimensions
  useEffect(() => {
    const logDimensions = () => {
      if (mainContainerRef.current) {
        const mainRect = mainContainerRef.current.getBoundingClientRect();
        console.log('MPTSignConfiguration Main Container:', {
          clientWidth: mainContainerRef.current.clientWidth,
          clientHeight: mainContainerRef.current.clientHeight,
          scrollWidth: mainContainerRef.current.scrollWidth,
          scrollHeight: mainContainerRef.current.scrollHeight,
          boundingRect: mainRect,
        });
      }
      if (sidebarRef.current) {
        const sidebarRect = sidebarRef.current.getBoundingClientRect();
        console.log('MPTSignConfiguration Sidebar:', {
          clientWidth: sidebarRef.current.clientWidth,
          clientHeight: sidebarRef.current.clientHeight,
          scrollWidth: sidebarRef.current.scrollWidth,
          scrollHeight: sidebarRef.current.scrollHeight,
          boundingRect: sidebarRect,
        });
      }
      if (contentRef.current) {
        const contentRect = contentRef.current.getBoundingClientRect();
        console.log('MPTSignConfiguration Content Area:', {
          clientWidth: contentRef.current.clientWidth,
          clientHeight: contentRef.current.clientHeight,
          scrollWidth: contentRef.current.scrollWidth,
          scrollHeight: contentRef.current.scrollHeight,
          boundingRect: contentRect,
        });
      }
    };

    logDimensions();
    window.addEventListener('resize', logDimensions);

    return () => window.removeEventListener('resize', logDimensions);
  }, [activeSections.length]);

  return (
    <div ref={mainContainerRef} className="rounded-lg border bg-card shadow-sm max-h-[600px] max-w-[calc(100vw-272px-64px)] flex flex-col">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">MPT Sign Configuration</h2>
        {!disabled && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Import signs from previous takeoffs</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5"
              onClick={() => {
                // TODO: Implement import functionality
                console.log('Import signs clicked');
              }}
            >
              <Package className="h-3 w-3" />
              Import Signs
            </Button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Default Material:</span>
            <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
              {SIGN_MATERIALS.filter(m => m.value === "PLASTIC" || m.value === "ALUMINUM").map((m) => (
                <button
                  key={m.value}
                  onClick={() => onDefaultMaterialChange(m.value)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    defaultSignMaterial === m.value
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground border border-transparent"
                  }`}
                >
                  {m.abbrev}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={() => setShowApplyMaterialDialog(true)}
            >
              Apply to All
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-1 min-h-0">
        <div ref={sidebarRef} className="w-[200px] shrink-0 border-r p-4 overflow-y-auto overflow-x-auto">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Structure Types</h4>
          <div className="space-y-2">
            {MPT_SECTIONS.map((section) => {
              const active = activeSections.includes(section.key);
              return (
                <label
                  key={section.key}
                  className={`flex items-center gap-2 select-none ${
                    disabled ? "opacity-60 cursor-default" : "cursor-pointer"
                  }`}
                  onClick={() => !disabled && onToggleSection(section.key)}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                    active ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"
                  }`}>
                    {active && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-xs font-medium text-foreground">{section.label}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div ref={contentRef} className="flex-1 min-w-0 p-4 overflow-x-auto">
          {activeSections.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Select a structure type</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click a structure type on the left to start building your MPT takeoff.
              </p>
            </div>
          ) : (
            activeSections.map((sectionKey) => {
              const section = MPT_SECTIONS.find((s) => s.key === sectionKey)!;
              const sectionSandbags = (signRows[sectionKey] || []).reduce((total, row) => {
                return total + getSandbagsForRow(sectionKey, row);
              }, 0);
              return (
                <div key={sectionKey} className="mb-6">
                  <MPTSignTable
                    sectionTitle={section.label}
                    structureOptions={section.structures}
                    rows={signRows[sectionKey] || []}
                    onRowsChange={(rows) => onSignRowsChange(sectionKey, rows)}
                    orderable={sectionKey === "type_iii"}
                    disabled={disabled}
                    defaultMaterial={defaultSignMaterial}
                  />
                  {sectionSandbags > 0 && (
                    <div className="mt-1.5 mb-4 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sand Bags</span>
                      <span className="text-sm font-bold tabular-nums text-amber-700">{sectionSandbags}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Apply Material Dialog - Placeholder for now */}
      {showApplyMaterialDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Apply Material to All Signs?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will set all existing sign items to <strong>{abbreviateMaterial(defaultSignMaterial)}</strong> ({defaultSignMaterial}). You can still override individual signs after.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowApplyMaterialDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                onApplyMaterialToAll();
                setShowApplyMaterialDialog(false);
              }}>
                Apply to All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};