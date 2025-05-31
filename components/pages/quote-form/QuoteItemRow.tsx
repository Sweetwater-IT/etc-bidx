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
import { Separator } from "@/components/ui/separator";
import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";

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
  const [productInput, setProductInput] = useState(item.itemNumber || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredProducts = productOptions.filter((p) =>
    p.label.toLowerCase().includes(productInput.toLowerCase())
  );

  const [newProduct, setNewProduct] = useState({
    itemNumber: "",
    description: "",
    uom: "",
    quantity: "",
    unitPrice: "",
    discountType: "dollar",
    discount: "",
    notes: "",
  });

  const [digits, setDigits] = useState({
    unitPrice: item.unitPrice
      ? (item.unitPrice * 100).toString().padStart(3, "0")
      : "000",
    discount: item.discount
      ? (item.discount * 100).toString().padStart(3, "0")
      : "000",
  });

  useEffect(() => {
    if (isEditing) {
      setDigits({
        unitPrice: item.unitPrice
          ? (item.unitPrice * 100).toString().padStart(3, "0")
          : "000",
        discount: item.discount
          ? (item.discount * 100).toString().padStart(3, "0")
          : "000",
      });
    }
  }, [isEditing, item.unitPrice, item.discount]);

  function formatDecimal(value: string): string {
    return (parseInt(value, 10) / 100).toFixed(2);
  }

  function formatPercentage(value: string): string {
    return (parseInt(value, 10) / 100).toFixed(2);
  }

  function handleNextDigits(
    current: string,
    inputType: string,
    data: string
  ): string {
    let digits = current;

    if (inputType === "insertText" && /\d/.test(data)) {
      const candidate = current + data;
      digits = candidate;
    } else if (inputType === "deleteContentBackward") {
      digits = current.slice(0, -1);
    }

    return digits.padStart(3, "0");
  }

  let content;
  if (isEditing) {
    content = (
      <div className="space-y-4 border-b border-border last:border-b-0 pb-4">
        <div
          className="grid items-center gap-2"
          style={{
            gridTemplateColumns: "2fr 3fr 1fr 1fr 1fr 1fr 1fr 1fr auto auto",
          }}
        >
          <div className="relative">
            <input
              ref={inputRef}
              className="w-full h-9 px-3 text-base border rounded focus:outline-none focus:ring-2 focus:ring-black bg-background text-foreground"
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
              <div className="absolute left-0 right-0 mt-1 bg-background border rounded shadow z-20 max-h-48 overflow-auto">
                <div
                  className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
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
              value={item.description || ""}
              onChange={(e) =>
                handleItemUpdate(item.id, "description", e.target.value)
              }
              className="w-full"
            />
          </div>
          <div>
            <Select
              value={item.uom || ""}
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
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="$0.00"
              value={
                digits.unitPrice ? `$ ${formatDecimal(digits.unitPrice)}` : ""
              }
              onChange={(e) => {
                const ev = e.nativeEvent as InputEvent;
                const { inputType } = ev;
                const data = (ev.data || "").replace(/\$/g, "");

                const nextDigits = handleNextDigits(
                  digits.unitPrice,
                  inputType,
                  data
                );
                setDigits((prev) => ({ ...prev, unitPrice: nextDigits }));
                handleItemUpdate(
                  item.id,
                  "unitPrice",
                  Number(formatDecimal(nextDigits))
                );
              }}
              className="w-full"
            />
          </div>
          <div>
            <Select
              value={item.discountType || "dollar"}
              onValueChange={(value) =>
                handleItemUpdate(item.id, "discountType", value)
              }
            >
              <SelectTrigger className="w-full">
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
              type="text"
              placeholder={item.discountType === "dollar" ? "$0.00" : "0.00%"}
              value={
                digits.discount
                  ? item.discountType === "dollar"
                    ? `$ ${formatDecimal(digits.discount)}`
                    : `${formatPercentage(digits.discount)}%`
                  : ""
              }
              onChange={(e) => {
                const ev = e.nativeEvent as InputEvent;
                const { inputType } = ev;
                const data = (ev.data || "").replace(/[$\s%]/g, "");

                const nextDigits = handleNextDigits(
                  digits.discount,
                  inputType,
                  data
                );
                setDigits((prev) => ({ ...prev, discount: nextDigits }));
                handleItemUpdate(
                  item.id,
                  "discount",
                  Number(formatDecimal(nextDigits))
                );
              }}
              className="w-full"
            />
          </div>
          <div className=" w-full">${calculateExtendedPrice(item)}</div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditing) {
                  setEditingItemId(null);
                } else {
                  handleRemoveItem(item.id);
                }
              }}
            >
              {isEditing ? (
                <Check className="h-4 w-4" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Bloco de subitens */}
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
        {/* Campo Notes */}
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
      </div>
    );
  } else {
    content = (
      <>
        <div
          className="grid gap-4 pb-4 items-center border-b border-border"
          style={{
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 40px",
          }}
        >
          <div>
            <div className="relative">
              <input
                ref={inputRef}
                className="w-full h-9 px-3 text-base border rounded focus:outline-none focus:ring-2 focus:ring-black bg-background text-foreground"
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
                <div className="absolute left-0 right-0 mt-1 bg-background border rounded shadow z-20 max-h-48 overflow-auto">
                  <div
                    className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
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
          </div>
          <div className="text-foreground w-full truncate ml-2">
            {item.description ? (
              item.description
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-4">
            {item.uom ? item.uom : <span className="opacity-50">—</span>}
          </div>
          <div className="ml-2 mr-2">
            <Input
              type="number"
              placeholder="Qty"
              value={item.quantity || ""}
              onChange={(e) =>
                handleItemUpdate(item.id, "quantity", Number(e.target.value))
              }
            />
          </div>
          <div className="text-foreground ml-[6px]">
            {item.unitPrice ? (
              `$${displayUnitPrice.toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-2">
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
          <div className="text-foreground ml-2">
            {item.discount ? (
              item.discount
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full">
            {item.unitPrice && item.quantity ? (
              `$${calculateExtendedPrice(item)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div>
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
                <DropdownMenuItem
                  onClick={() => {
                    setEditingItemId(item.id);
                    handleAddCompositeItem(item);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub Item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {item.associatedItems && item.associatedItems.length > 0 && (
          <div className="mt-2 mb-8">
            <div className="text-sm font-semibold mb-2 text-muted-foreground">
              Sub Items
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 pt-2 pb-1 text-left font-medium text-xs text-muted-foreground">
                      #
                    </th>
                    <th className="px-2 pt-2 pb-1 text-left font-medium text-xs text-muted-foreground">
                      Description
                    </th>
                    <th className="px-2 pt-2 pb-1 text-left font-medium text-xs text-muted-foreground">
                      UOM
                    </th>
                    <th className="px-2 pt-2 pb-1 text-left font-medium text-xs text-muted-foreground">
                      Qty
                    </th>
                    <th className="px-2 pt-2 pb-1 text-left font-medium text-xs text-muted-foreground">
                      Unit Price
                    </th>
                    <th className="px-2 pt-2 pb-1 text-left font-medium text-xs text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="border-b border-border">
                  {item.associatedItems.map((subItem, idx) => (
                    <tr
                      key={subItem.id || idx}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-2 py-2 align-top">
                        <div className="font-semibold text-base text-foreground">
                          {subItem.itemNumber || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="font-semibold text-base text-foreground">
                          {subItem.description || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="font-semibold text-base text-foreground">
                          {subItem.uom || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="font-semibold text-base text-foreground">
                          {subItem.quantity || "-"}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="font-semibold text-base text-foreground">
                          {subItem.unitPrice !== undefined
                            ? `$${Number(subItem.unitPrice).toFixed(2)}`
                            : "-"}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="font-semibold text-base text-foreground">
                          {subItem.quantity && subItem.unitPrice !== undefined
                            ? `$${(
                                subItem.quantity * subItem.unitPrice
                              ).toFixed(2)}`
                            : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
  
        {item.notes && item.notes.trim() !== "" && (
          <div className="mt-2 mb-8">
            <div className="text-xs font-semibold mb-1 text-muted-foreground">
              Notes
            </div>
            <div className="py-2 text-base text-foreground whitespace-pre-line">
              {item.notes}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {content}
      <Sheet open={openProductSheet} onOpenChange={setOpenProductSheet}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="text-2xl mb-2">Add New Product</SheetTitle>
            <Separator className="mt-2" />
          </SheetHeader>
          <form className="flex flex-col gap-5 px-4">
            <div className="flex flex-col gap-1">
              <Label>Item # / SKU</Label>
              <Input
                className="bg-background"
                placeholder="Enter item number or SKU"
                value={newProduct.itemNumber}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    itemNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Description</Label>
              <Input
                className="bg-background"
                placeholder="Enter product description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>UOM</Label>
              <Select
                value={newProduct.uom}
                onValueChange={(value) =>
                  setNewProduct((prev) => ({ ...prev, uom: value }))
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select UOM" />
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
            <div className="flex flex-col gap-1">
              <Label>Quantity</Label>
              <Input
                type="number"
                className="bg-background"
                placeholder="Enter quantity"
                value={newProduct.quantity}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Unit Price</Label>
              <Input
                type="text"
                className="bg-background"
                placeholder="$0.00"
                value={
                  digits.unitPrice ? `$ ${formatDecimal(digits.unitPrice)}` : ""
                }
                onChange={(e) => {
                  const ev = e.nativeEvent as InputEvent;
                  const { inputType } = ev;
                  const data = (ev.data || "").replace(/\$/g, "");

                  const nextDigits = handleNextDigits(
                    digits.unitPrice,
                    inputType,
                    data
                  );
                  setDigits((prev) => ({ ...prev, unitPrice: nextDigits }));
                  setNewProduct((prev) => ({
                    ...prev,
                    unitPrice: formatDecimal(nextDigits),
                  }));
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Discount Type</Label>
              <Select
                value={newProduct.discountType}
                onValueChange={(value) =>
                  setNewProduct((prev) => ({ ...prev, discountType: value }))
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dollar">$</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Discount</Label>
              <Input
                type="text"
                className="bg-background"
                placeholder={
                  newProduct.discountType === "dollar" ? "$0.00" : "0.00%"
                }
                value={
                  digits.discount
                    ? newProduct.discountType === "dollar"
                      ? `$ ${formatDecimal(digits.discount)}`
                      : `${formatPercentage(digits.discount)}%`
                    : ""
                }
                onChange={(e) => {
                  const ev = e.nativeEvent as InputEvent;
                  const { inputType } = ev;
                  const data = (ev.data || "").replace(/[$\s%]/g, "");

                  const nextDigits = handleNextDigits(
                    digits.discount,
                    inputType,
                    data
                  );
                  setDigits((prev) => ({ ...prev, discount: nextDigits }));
                  setNewProduct((prev) => ({
                    ...prev,
                    discount: formatDecimal(nextDigits),
                  }));
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Notes</Label>
              <Textarea
                className="bg-background min-h-[100px]"
                placeholder="Enter any additional notes"
                value={newProduct.notes}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
            <Separator className="my-2" />
            <SheetClose asChild>
              <Button
                type="button"
                className="bg-black text-white py-2 mt-4 text-md font-semibold hover:bg-black/90 transition rounded"
                onClick={() => {
                  // Aqui você pode adicionar a lógica para salvar o novo produto
                  setOpenProductSheet(false);
                  setNewProduct({
                    itemNumber: "",
                    description: "",
                    uom: "",
                    quantity: "",
                    unitPrice: "",
                    discountType: "dollar",
                    discount: "",
                    notes: "",
                  });
                  setDigits({
                    unitPrice: "000",
                    discount: "000",
                  });
                }}
              >
                Save Product
              </Button>
            </SheetClose>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
