import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

export function ProductSheet({
  open,
  onOpenChange,
  newProduct,
  setNewProduct,
  digits,
  setDigits,
  UOM_TYPES,
  formatDecimal,
  formatPercentage,
  handleNextDigits,
  editingSubItemId,
  handleItemUpdate,
  item,
  setProductInput,
  setEditingItemId,
  setEditingSubItemId,
}) {
  useEffect(() => {
    if (open) {
      if (editingSubItemId) {
        const subItem = item.associatedItems?.find(
          (s) => s.id === editingSubItemId
        );
        if (subItem) {
          setNewProduct({
            itemNumber: subItem.itemNumber || "",
            description: subItem.description || "",
            uom: subItem.uom || "",
            quantity: subItem.quantity || "",
            unitPrice: subItem.unitPrice || "",
            discountType: subItem.discountType || "dollar",
            discount: subItem.discount || "",
            notes: subItem.notes || "",
            tax: subItem.tax || "",
            is_tax_percentage: subItem.is_tax_percentage || false,

          });
          setDigits({
            unitPrice: subItem.unitPrice
              ? (subItem.unitPrice * 100).toString().padStart(3, "0")
              : "000",
            discount: subItem.discount
              ? (subItem.discount * 100).toString().padStart(3, "0")
              : "000",
          });
        } else {
          // Novo subitem: limpa tudo!
          setNewProduct({
            itemNumber: "",
            description: "",
            uom: "",
            quantity: "",
            unitPrice: "",
            discountType: "dollar",
            discount: "",
            notes: "",
            tax: "",
            is_tax_percentage: false,
          });
          setDigits({
            unitPrice: "000",
            discount: "000",
          });
        }
      } else {
        setNewProduct({
          itemNumber: item.itemNumber || "",
          description: item.description || "",
          uom: item.uom || "",
          quantity: item.quantity || "",
          unitPrice: item.unitPrice || "",
          discountType: item.discountType || "dollar",
          discount: item.discount || "",
          notes: item.notes || "",
          tax: item.tax || "",
          is_tax_percentage: item.is_tax_percentage || false,
        });
        setDigits({
          unitPrice: item.unitPrice
            ? (item.unitPrice * 100).toString().padStart(3, "0")
            : "000",
          discount: item.discount
            ? (item.discount * 100).toString().padStart(3, "0")
            : "000",
        });
      }
    } else {
      setNewProduct({
        itemNumber: "",
        description: "",
        uom: "",
        quantity: "",
        unitPrice: "",
        discountType: "dollar",
        discount: "",
        notes: "",
        tax: "",
        is_tax_percentage: false,
      });
      setDigits({
        unitPrice: "000",
        discount: "000",
      });
    }
  }, [
    open,
    editingSubItemId,
    item.associatedItems,
    item.description,
    item.discount,
    item.discountType,
    item.itemNumber,
    item.notes,
    item.quantity,
    item.unitPrice,
    item.uom,
    setDigits,
    setNewProduct,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full">
        <SheetHeader className="p-0 pt-6">
          <SheetTitle className="text-[16px] ml-6">Add New Product</SheetTitle>
          <Separator className="mt-2" />
        </SheetHeader>
        <form className="flex flex-col gap-5 px-6 flex-1 overflow-y-auto pt-2">
          <div className="flex flex-col gap-1">
            <Label className="text-[15px] font-medium bled:opacity-50 text-muted-foreground">
              Item # / SKU
            </Label>
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
            <Label className="text-[15px] font-medium text-muted-foreground">
              Description
            </Label>
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
            <Label className="text-[15px] font-medium text-muted-foreground">
              UOM
            </Label>
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
            <Label className="text-[15px] font-medium text-muted-foreground">
              Quantity
            </Label>
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
            <Label className="text-[15px] font-medium text-muted-foreground">
              Unit Price
            </Label>
            <Input
              type="text"
              className="bg-background"
              placeholder="$0.00"
              value={
                digits.unitPrice ? `$ ${formatDecimal(digits.unitPrice)}` : ""
              }
              onChange={(e: any) => {
                const ev = e.nativeEvent;
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
            <Label className="text-[15px] font-medium text-muted-foreground">
              Discount
            </Label>
            <div className="flex items-center">
              <Input
                type="text"
                className="bg-background rounded-r-none"
                placeholder={
                  newProduct.discountType === "percentage" ? "10" : "10"
                }
                value={
                  digits.discount
                    ? newProduct.discountType === "dollar"
                      ? formatDecimal(digits.discount)
                      : formatPercentage(digits.discount)
                    : ""
                }
                onChange={(e: any) => {
                  const ev = e.nativeEvent;
                  const { inputType } = ev;
                  const data = (ev.data || "").replace(/[$%\s]/g, "");
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
              <div className="w-[80px]">
                <Select
                  value={newProduct.discountType}
                  onValueChange={(value) =>
                    setNewProduct((prev) => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger className="rounded-l-none w-[80px] border-l-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dollar">$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[15px] font-medium text-muted-foreground">
              Tax
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newProduct?.is_tax_percentage}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    is_tax_percentage: e.target.checked,
                    tax: e.target.checked ? prev.tax : "",
                  }))
                }
              />
              <span className="text-sm text-muted-foreground">Is Percentage</span>
            </div>
            {newProduct.is_tax_percentage && (
              <Input
                type="number"
                min={1}
                max={100}
                className="bg-background"
                placeholder="Enter tax %"
                value={newProduct.tax ?? ''}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    tax: e.target.value,
                  }))
                }
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[15px] font-medium text-muted-foreground">
              Notes
            </Label>
            <Textarea
              className="bg-background min-h-[100px]"
              placeholder="Enter any additional notes"
              value={newProduct.notes}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </form>
        <div className="px-4 py-4 border-t flex gap-4">
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-sm rounded-md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              type="button"
              className=" text-white py-2 flex-1 text-sm  transition rounded-md"
              onClick={() => {
                onOpenChange(false);

                if (editingSubItemId) {
                  const subItemData = {
                    id: editingSubItemId,
                    itemNumber: newProduct.itemNumber,
                    description: newProduct.description,
                    uom: newProduct.uom,
                    quantity: Number(newProduct.quantity),
                    unitPrice: Number(newProduct.unitPrice),
                    discountType: newProduct.discountType,
                    discount: Number(newProduct.discount),
                    notes: newProduct.notes,
                    isCustom: true,
                    tax: newProduct.tax,
                    is_tax_percentage: newProduct.is_tax_percentage,
                  };

                  const updatedAssociatedItems = item.associatedItems?.some(
                    (ai) => ai.id === editingSubItemId
                  )
                    ? item.associatedItems.map((ai) =>
                      ai.id === editingSubItemId ? subItemData : ai
                    )
                    : [...(item.associatedItems || []), subItemData];

                  handleItemUpdate(item.id, "associatedItems", updatedAssociatedItems);
                  setEditingSubItemId(null);
                } else {
                  const updatedItem = {
                    ...item,
                    itemNumber: newProduct.itemNumber,
                    description: newProduct.description,
                    uom: newProduct.uom,
                    quantity: Number(newProduct.quantity),
                    unitPrice: Number(newProduct.unitPrice),
                    discountType: newProduct.discountType,
                    discount: Number(newProduct.discount),
                    tax: newProduct.tax ? Number(newProduct.tax) : 0,
                    is_tax_percentage: newProduct.is_tax_percentage,
                    isCustom: true,
                  };

                  handleItemUpdate(item.id, "fullItem", updatedItem);
                  setProductInput(newProduct.itemNumber);
                  setEditingItemId(null);
                }

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
        </div>
      </SheetContent>
    </Sheet>
  );
}
