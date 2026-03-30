import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QuoteItem } from "@/types/IQuoteItem";
import { restorePointerEvents } from "@/lib/pointer-events-fix";

interface QuoteItemEditorDialogProps {
  open: boolean;
  item: QuoteItem | null;
  saving: boolean;
  uomOptions: string[];
  onOpenChange: (open: boolean) => void;
  onItemChange: (item: QuoteItem) => void;
  onSave: () => void;
}

export function QuoteItemEditorDialog({
  open,
  item,
  saving,
  uomOptions,
  onOpenChange,
  onItemChange,
  onSave,
}: QuoteItemEditorDialogProps) {
  useEffect(() => {
    if (open) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      restorePointerEvents();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      restorePointerEvents();
    };
  }, [open]);

  if (!item) {
    return null;
  }

  const canSave = Boolean(item.itemNumber.trim() || item.description.trim());

  const updateField = <K extends keyof QuoteItem>(field: K, value: QuoteItem[K]) => {
    onItemChange({
      ...item,
      [field]: value,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          restorePointerEvents();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{item.id ? "Edit Quote Item" : "Add Quote Item"}</DialogTitle>
          <DialogDescription>
            Update the item details, then save once when you are ready.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="quote-item-number">Item # / SKU</Label>
            <Input
              id="quote-item-number"
              value={item.itemNumber}
              onChange={(event) => updateField("itemNumber", event.target.value)}
              placeholder="Enter item number or SKU"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quote-item-description">Description</Label>
            <Input
              id="quote-item-description"
              value={item.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>UOM</Label>
              <Select
                value={item.uom || undefined}
                onValueChange={(value) => updateField("uom", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {uomOptions.map((uom) => (
                    <SelectItem key={uom} value={uom}>
                      {uom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quote-item-quantity">Quantity</Label>
              <Input
                id="quote-item-quantity"
                type="number"
                min={0}
                value={item.quantity}
                onChange={(event) =>
                  updateField("quantity", Math.max(0, Number(event.target.value) || 0))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quote-item-unit-price">Unit Price</Label>
              <Input
                id="quote-item-unit-price"
                type="number"
                min={0}
                step="0.01"
                value={item.unitPrice}
                onChange={(event) =>
                  updateField("unitPrice", Math.max(0, Number(event.target.value) || 0))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Discount Type</Label>
              <Select
                value={item.discountType}
                onValueChange={(value) =>
                  updateField("discountType", value as QuoteItem["discountType"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dollar">$</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quote-item-discount">Discount</Label>
            <Input
              id="quote-item-discount"
              type="number"
              min={0}
              step="0.01"
              value={item.discount}
              onChange={(event) =>
                updateField("discount", Math.max(0, Number(event.target.value) || 0))
              }
            />
          </div>

          <div className="grid gap-3 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="quote-item-tax-toggle"
                checked={item.is_tax_percentage}
                onCheckedChange={(checked) =>
                  onItemChange({
                    ...item,
                    is_tax_percentage: checked === true,
                    tax: checked === true ? Number(item.tax) || 0 : 0,
                  })
                }
              />
              <Label htmlFor="quote-item-tax-toggle">Apply tax</Label>
            </div>

            {item.is_tax_percentage ? (
              <div className="grid gap-2">
                <Label htmlFor="quote-item-tax">Tax %</Label>
                <Input
                  id="quote-item-tax"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={item.tax}
                  onChange={(event) =>
                    updateField("tax", Math.max(0, Number(event.target.value) || 0))
                  }
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quote-item-notes">Notes</Label>
            <Textarea
              id="quote-item-notes"
              value={item.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Add any additional notes"
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!canSave || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
