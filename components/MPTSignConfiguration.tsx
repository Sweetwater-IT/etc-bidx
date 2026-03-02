import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Package } from "lucide-react";
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

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">MPT Sign Configuration</h2>
        {!disabled && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Default Material:</span>
            <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
              {SIGN_MATERIALS.map((m) => (
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
      <div className="flex">
        <div className="w-[200px] shrink-0 border-r p-4">
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
        <div className="flex-1 min-w-0 p-4">
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
              return (
                <div key={sectionKey} className="mb-6">
                  {/* Placeholder for MPTSignTable - will be implemented next */}
                  <div className="rounded-lg border bg-background p-4">
                    <h3 className="text-sm font-medium mb-3">{section.label}</h3>
                    <div className="text-xs text-muted-foreground">
                      MPTSignTable component will be integrated here for {section.label}
                    </div>
                    <div className="mt-3 space-y-2">
                      {section.structures.map((structure) => (
                        <div key={structure} className="text-xs p-2 bg-muted/30 rounded">
                          {structure}
                        </div>
                      ))}
                    </div>
                  </div>
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