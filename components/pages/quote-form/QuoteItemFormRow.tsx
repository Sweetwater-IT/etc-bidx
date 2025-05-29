import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export default function QuoteItemFormRow({
  newQuoteItem,
  handleCustomItemChange,
  setEditingItemId,
  setShowCustomForm,
  editingItemId,
  editingSubItemId,
  setEditingSubItemId,
  handleCompositeItemUpdate,
  handleDeleteComposite,
  handleAddCompositeItem,
  UOM_TYPES,
}) {
  return (
    <div className="grid grid-cols-9 gap-2 items-center">
      <div>
        <Input
          placeholder="Search or add a product..."
          value={newQuoteItem.itemNumber}
          onChange={(e) => handleCustomItemChange("itemNumber", e.target.value)}
        />
      </div>
      <div className="text-foreground">
        {newQuoteItem.description ? newQuoteItem.description : "—"}
      </div>
      <div className="text-foreground">
        {newQuoteItem.uom ? newQuoteItem.uom : "—"}
      </div>
      <div>
        <Input
          type="number"
          placeholder="Qty"
          value={newQuoteItem.quantity || ""}
          onChange={(e) => handleCustomItemChange("quantity", Number(e.target.value))}
        />
      </div>
      <div className="text-foreground">
        {newQuoteItem.unitPrice ? `$${newQuoteItem.unitPrice.toFixed(2)}` : "—"}
      </div>
      <div className="text-foreground">
        {!newQuoteItem.itemNumber &&
        !newQuoteItem.description &&
        !newQuoteItem.uom &&
        !newQuoteItem.unitPrice &&
        !newQuoteItem.discount
          ? "—"
          : newQuoteItem.discountType === "dollar"
          ? "$"
          : newQuoteItem.discountType === "percentage"
          ? "%"
          : "—"}
      </div>
      <div className="text-foreground">
        {newQuoteItem.discount ? newQuoteItem.discount : "—"}
      </div>
      <div className="text-foreground">
        {newQuoteItem.unitPrice && newQuoteItem.quantity
          ? `$${(newQuoteItem.unitPrice * newQuoteItem.quantity).toFixed(2)}`
          : "—"}
      </div>
      <div className="flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingItemId(newQuoteItem.id)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCustomForm(false)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 