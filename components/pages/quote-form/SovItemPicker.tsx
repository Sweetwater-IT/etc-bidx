"use client";

import { Fragment, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSovPickerItems, type SovPickerItem } from "@/hooks/use-sov-picker-items";
import { toast } from "sonner";

function formatWorkTypeLabel(value: string) {
  if (value === "CUSTOM") return "Custom";
  if (value === "DELIVERY") return "Delivery";
  if (value === "SERVICE") return "Service";
  if (value === "RENTAL") return "Rental";
  if (value === "SALE") return "Sale";

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

type CustomDraft = {
  itemNumber: string;
  description: string;
  workType: string;
  uom: string;
};

const EMPTY_CUSTOM_DRAFT: CustomDraft = {
  itemNumber: "",
  description: "",
  workType: "CUSTOM",
  uom: "EA",
};

export function SovItemPicker({
  open,
  onOpenChange,
  valueLabel,
  onSelect,
  contractNumber,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valueLabel?: string;
  onSelect: (item: SovPickerItem) => void;
  contractNumber?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState<CustomDraft>(EMPTY_CUSTOM_DRAFT);
  const [savingCustom, setSavingCustom] = useState(false);
  const { groupedItems, items, loading, refresh } = useSovPickerItems(search);

  const duplicateCustomItem = useMemo(() => {
    const normalizedItemNumber = customDraft.itemNumber.trim().toUpperCase();
    if (!normalizedItemNumber) return null;

    return items.find(
      (item) => item.is_custom && item.item_number.trim().toUpperCase() === normalizedItemNumber
    ) || null;
  }, [customDraft.itemNumber, items]);

  const handleCustomSave = async () => {
    if (savingCustom) return;

    if (duplicateCustomItem) {
      toast.error(`Custom item ${customDraft.itemNumber.trim()} already exists.`);
      return;
    }

    setSavingCustom(true);
    try {
      const response = await fetch("/api/sov-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemNumber: customDraft.itemNumber.trim(),
          description: customDraft.description.trim(),
          workType: customDraft.workType.trim() || "CUSTOM",
          uom: customDraft.uom.trim() || "EA",
          contractNumber: contractNumber || "",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create custom SOV item");
      }

      await refresh();
      setCustomDialogOpen(false);
      setCustomDraft(EMPTY_CUSTOM_DRAFT);
      onOpenChange(false);
      onSelect(result.item);
      toast.success(`Custom SOV item ${result.item.item_number} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create custom SOV item");
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-start bg-transparent text-left text-sm font-normal">
            {valueLabel || "Add an item"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[520px] p-0" sideOffset={6}>
          <div className="max-h-[420px] overflow-auto rounded-md border">
            <div className="sticky top-0 z-20 border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex flex-col gap-3">
                <Input
                  placeholder="Search item #, display #, description, or category…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#FAFAFA]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky top-0 w-[150px] bg-[#FAFAFA] text-[11px]">Item #</TableHead>
                  <TableHead className="sticky top-0 w-[150px] bg-[#FAFAFA] text-[11px]">Display #</TableHead>
                  <TableHead className="sticky top-0 bg-[#FAFAFA] text-[11px]">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  className="cursor-pointer border-b border-[#16335A]/15 bg-[#16335A]/5 transition-colors hover:bg-[#16335A]/8"
                  onClick={() => {
                    setCustomDialogOpen(true)
                  }}
                >
                  <TableCell colSpan={3} className="py-2 text-[11px] font-semibold uppercase tracking-wide text-[#16335A]">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Custom Item
                    </div>
                  </TableCell>
                </TableRow>
                {groupedItems.map((group) => (
                  <Fragment key={group.heading}>
                    <TableRow className="border-t border-[#16335A]/15 bg-[#16335A]/5 hover:bg-[#16335A]/5 data-[state=selected]:bg-[#16335A]/5">
                      <TableCell colSpan={3} className="py-2 text-[11px] font-semibold uppercase tracking-wide text-[#16335A]">
                        {formatWorkTypeLabel(group.heading)}
                      </TableCell>
                    </TableRow>
                    {group.items.map((item) => (
                      <TableRow
                        key={`${item.is_custom ? "custom" : "standard"}-${item.id}`}
                        className="cursor-pointer border-b border-border/40 transition-colors hover:bg-[#16335A]/6 data-[state=selected]:bg-[#16335A]/8"
                        onClick={() => {
                          onOpenChange(false);
                          onSelect(item);
                        }}
                      >
                        <TableCell className="w-[150px] text-xs font-mono text-foreground/90">{item.item_number}</TableCell>
                        <TableCell className="w-[150px] text-xs font-mono text-foreground/80">{item.display_item_number || item.item_number}</TableCell>
                        <TableCell className="text-xs text-foreground/85">
                          {item.display_name || item.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
                {!loading && groupedItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                      No matching items found.
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
            <DialogDescription>
              Create a reusable custom SOV item for quotes and future reuse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-item-number">Item Number</Label>
              <Input
                id="custom-item-number"
                value={customDraft.itemNumber}
                onChange={(event) =>
                  setCustomDraft((prev) => ({ ...prev, itemNumber: event.target.value.toUpperCase() }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-item-description">Description</Label>
              <Input
                id="custom-item-description"
                value={customDraft.description}
                onChange={(event) =>
                  setCustomDraft((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-item-work-type">Work Type</Label>
                <Input
                  id="custom-item-work-type"
                  value={customDraft.workType}
                  onChange={(event) =>
                    setCustomDraft((prev) => ({ ...prev, workType: event.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-item-uom">UOM</Label>
                <Input
                  id="custom-item-uom"
                  value={customDraft.uom}
                  onChange={(event) =>
                    setCustomDraft((prev) => ({ ...prev, uom: event.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>
            {duplicateCustomItem && (
              <p className="text-sm text-destructive">
                A custom item with this item number already exists.
              </p>
            )}
            {!contractNumber && (
              <p className="text-sm text-muted-foreground">
                Select a project or estimate with a contract number before saving a shared custom SOV item.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCustomSave}
              disabled={
                savingCustom ||
                !customDraft.itemNumber.trim() ||
                !customDraft.description.trim() ||
                !contractNumber ||
                Boolean(duplicateCustomItem)
              }
            >
              {savingCustom ? "Saving..." : "Save Custom Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
