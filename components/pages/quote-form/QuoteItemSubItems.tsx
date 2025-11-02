import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Trash2, Plus, Pencil, Check } from "lucide-react";

export default function QuoteItemSubItems({
  item,
  editingSubItemId,
  setEditingSubItemId,
  handleAddCompositeItem,
  handleCompositeItemUpdate,
  handleDeleteComposite,
  UOM_TYPES,
}) {
  if (!item.associatedItems || item.associatedItems.length === 0) return null;
  return (
    <div>
      <div className="text-md font-semibold mb-3 mt-6 text-muted-foreground">
        Sub Items
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground font-medium mb-1">
        <div>Sub Item #</div>
        <div>Description</div>
        <div>UOM</div>
        <div>Qty</div>
        <div>Unit Price</div>
        <div className="text-right pr-4">Total</div>
        <div className="text-right"></div>
      </div>
      <div className="space-y-2">
        {item.associatedItems.map((subItem) => {
          const isEditingSub = editingSubItemId === subItem.id;
          return (
            <div
              key={subItem.id}
              className={`grid grid-cols-7 gap-2 rounded border p-3 items-center shadow-sm ${
                isEditingSub ? "bg-muted/40" : "bg-muted/20"
              }`}
            >
              {isEditingSub ? (
                <>
                  <div>
                    <Input
                      placeholder="Sub Item #"
                      value={subItem.itemNumber}
                      onChange={(e) =>
                        handleCompositeItemUpdate(
                          item.id,
                          subItem.id,
                          "itemNumber",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Description"
                      value={subItem.item_name}
                      onChange={(e) =>
                        handleCompositeItemUpdate(
                          item.id,
                          subItem.id,
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Select
                      value={subItem.uom}
                      onValueChange={(value) =>
                        handleCompositeItemUpdate(
                          item.id,
                          subItem.id,
                          "uom",
                          value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(UOM_TYPES).map((uom: any) => (
                          <SelectItem key={uom} value={uom}>
                            {uom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={subItem.quantity || ""}
                      onChange={(e) =>
                        handleCompositeItemUpdate(
                          item.id,
                          subItem.id,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={subItem.unitPrice || ""}
                      onChange={(e) =>
                        handleCompositeItemUpdate(
                          item.id,
                          subItem.id,
                          "unitPrice",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="text-right">
                    ${(subItem.quantity * subItem.unitPrice).toFixed(2)}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSubItemId(null)}
                      aria-label="Save"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComposite(item.id, subItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="truncate font-medium text-foreground">
                    {subItem.itemNumber}
                  </div>
                  <div className="truncate text-foreground">
                    {subItem.item_name}
                  </div>
                  <div className="text-foreground">{subItem.uom}</div>
                  <div className="text-foreground">{subItem.quantity}</div>
                  <div className="text-foreground">{subItem.unitPrice}</div>
                  <div className="font-semibold text-right">
                    ${(subItem.quantity * subItem.unitPrice).toFixed(2)}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSubItemId(subItem.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComposite(item.id, subItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
