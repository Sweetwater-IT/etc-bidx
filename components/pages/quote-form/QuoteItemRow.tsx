import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Pencil, Check, MoreVertical } from "lucide-react";
import QuoteItemSubItems from "./QuoteItemSubItems";
import { AutoComplete } from "@/components/ui/autocomplete";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useState, useRef } from "react";

export default function QuoteItemRow({
  item,
  isEditing,
  editingSubItemId,
  setEditingItemId,
  setEditingSubItemId,
  handleItemUpdate,
  handleRemoveItem,
  handleAddCompositeItem,
  handleCompositeItemUpdate,
  handleDeleteComposite,
  UOM_TYPES,
  calculateCompositeUnitPrice,
  calculateExtendedPrice,
}) {
  const hasAssociatedItems =
    item.associatedItems && item.associatedItems.length > 0;
  const displayUnitPrice = hasAssociatedItems
    ? calculateCompositeUnitPrice(item)
    : item.unitPrice;

  // Mock de produtos
  const productOptions = [
    { value: "1", label: "Server costs" },
    { value: "2", label: "AI tool first milestone" },
    { value: "3", label: "Consulting" },
  ];
  const [openProductSheet, setOpenProductSheet] = useState(false);
  const [productInput, setProductInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredProducts = productOptions.filter((p) =>
    p.label.toLowerCase().includes(productInput.toLowerCase())
  );

  if (isEditing) {
    return (
      <div className="space-y-4 border-b border-gray-200 last:border-b-0 pb-4">
        <div
          className="grid items-center gap-2"
          style={{
            gridTemplateColumns:
              "200px 190px 70px 78px 90px 90px 100px 140px 28px 28px",
          }}
        >
          <div className="relative max-w-[180px]">
            <input
              ref={inputRef}
              className="w-full h-9 px-3 text-base border rounded focus:outline-none focus:ring-2 focus:ring-black bg-transparent"
              placeholder="Search or add a product..."
              value={productInput}
              onChange={(e) => {
                setProductInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-20 max-h-48 overflow-auto">
                <div
                  className="px-3 py-2 cursor-pointer text-black hover:bg-gray-100"
                  onMouseDown={() => {
                    setShowDropdown(false);
                    setOpenProductSheet(true);
                  }}
                >
                  + Add new product
                </div>
              </div>
            )}
          </div>
          <div>
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) =>
                handleItemUpdate(item.id, "description", e.target.value)
              }
              className=" w-full"
            />
          </div>
          <div>
            <Select
              value={item.uom}
              onValueChange={(value) => handleItemUpdate(item.id, "uom", value)}
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
              value={item.quantity || ""}
              onChange={(e) =>
                handleItemUpdate(item.id, "quantity", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Unit Price"
              value={item.unitPrice || ""}
              onChange={(e) =>
                handleItemUpdate(item.id, "unitPrice", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Select
              value={item.discountType}
              onValueChange={(value) =>
                handleItemUpdate(item.id, "discountType", value)
              }
            >
              <SelectTrigger className="shrink-[2]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dollar">$</SelectItem>
                <SelectItem value="percentage">%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="number"
              placeholder="Discount"
              value={item.discount || ""}
              onChange={(e) =>
                handleItemUpdate(item.id, "discount", Number(e.target.value))
              }
            />
          </div>
          <div className="text-center w-full">
            ${calculateExtendedPrice(item)}
          </div>
          <div></div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <QuoteItemSubItems
          item={item}
          editingSubItemId={editingSubItemId}
          setEditingSubItemId={setEditingSubItemId}
          handleAddCompositeItem={handleAddCompositeItem}
          handleCompositeItemUpdate={handleCompositeItemUpdate}
          handleDeleteComposite={handleDeleteComposite}
          UOM_TYPES={UOM_TYPES}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddCompositeItem(item)}
            disabled={item.associatedItems?.some(
              (ai) => !ai.itemNumber || ai.itemNumber === ""
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sub Item
          </Button>
        </div>
        <div>
          <div className="text-xs font-semibold mb-1 text-muted-foreground">
            Notes
          </div>
          <Textarea
            placeholder="Notes"
            value={item.notes || ""}
            onChange={(e) => handleItemUpdate(item.id, "notes", e.target.value)}
            className="min-h-[60px]"
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => {
              setEditingItemId(null);
              setEditingSubItemId(null);
            }}
            className="bg-black hover:bg-black/90"
          >
            Save Changes
          </Button>
        </div>
        {/* Sheet para novo produto */}
        <Sheet open={openProductSheet} onOpenChange={setOpenProductSheet}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="text-2xl mb-2">Add New Product</SheetTitle>
            </SheetHeader>
            <form className="flex flex-col gap-5 mt-4 px-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Product Name</label>
                <input className="border rounded px-3 py-2 focus:ring-2 focus:ring-black outline-none" placeholder="Product Name" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <input className="border rounded px-3 py-2 focus:ring-2 focus:ring-black outline-none" placeholder="Description" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Unit Price</label>
                <input className="border rounded px-3 py-2 focus:ring-2 focus:ring-black outline-none" placeholder="Unit Price" type="number" />
              </div>
              <SheetClose asChild>
                <button type="button" className="bg-black text-white rounded py-2 mt-4 text-lg font-semibold hover:bg-black/90 transition">Save Product</button>
              </SheetClose>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Not editing
  return (
    <div
      className="grid gap-4 pb-4 items-center border-b border-gray-200"
      style={{
        gridTemplateColumns:
          "200px 180px 50px 80px 100px 100px 100px 140px 28px 28px",
      }}
    >
      <div>
        <Input
          placeholder="Search or add a product..."
          value={item.itemNumber}
          onChange={(e) =>
            handleItemUpdate(item.id, "itemNumber", e.target.value)
          }
        />
      </div>
      <div className="text-foreground w-full truncate">
        {item.description ? (
          item.description
        ) : (
          <span className="opacity-50">—</span>
        )}
      </div>
      <div className="text-foreground">
        {item.uom ? item.uom : <span className="opacity-50">—</span>}
      </div>
      <div>
        <Input
          type="number"
          placeholder="Qty"
          value={item.quantity || ""}
          onChange={(e) =>
            handleItemUpdate(item.id, "quantity", Number(e.target.value))
          }
        />
      </div>
      <div className="text-foreground">
        {item.unitPrice ? (
          `$${displayUnitPrice.toFixed(2)}`
        ) : (
          <span className="opacity-50">—</span>
        )}
      </div>
      <div className="text-foreground">
        {!item.itemNumber &&
        !item.description &&
        !item.uom &&
        !item.unitPrice &&
        !item.discount ? (
          <span className="opacity-50">—</span>
        ) : item.discountType === "dollar" ? (
          "$"
        ) : item.discountType === "percentage" ? (
          "%"
        ) : (
          <span className="opacity-50">—</span>
        )}
      </div>
      <div className="text-foreground">
        {item.discount ? item.discount : <span className="opacity-50">—</span>}
      </div>
      <div className="text-foreground text-left max-w-[140px] w-full">
        {item.unitPrice && item.quantity ? (
          `$${calculateExtendedPrice(item)}`
        ) : (
          <span className="opacity-50">—</span>
        )}
      </div>
      <div></div>
      <div className="flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditingItemId(item.id);
                setEditingSubItemId(null);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleRemoveItem(item.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
