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
      });
      setDigits({
        unitPrice: "000",
        discount: "000",
      });
    }
  }, [open, editingSubItemId, item.associatedItems]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full">
        <SheetHeader className="p-0 pt-6">
          <SheetTitle className="text-[24px] ml-6">Add New Product</SheetTitle>
          <Separator className="mt-1" />
        </SheetHeader>
        <form className="flex flex-col gap-5 px-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium bled:opacity-50 text-muted-foreground">
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
            <Label className="text-sm font-medium text-muted-foreground">
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
            <Label className="text-sm font-medium text-muted-foreground">
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
            <Label className="text-sm font-medium text-muted-foreground">
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
            <Label className="text-sm font-medium text-muted-foreground">
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
            <Label className="text-sm font-medium text-muted-foreground">
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
            <Label className="text-sm font-medium text-muted-foreground">
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
        <div className="px-4 py-4 border-t flex gap-2">
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-1/2 text-sm font-semibold rounded-md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              type="button"
              className="bg-black text-white py-2 w-1/2 text-sm font-semibold hover:bg-black/90 transition rounded-md"
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
                  };

                  const exists = item.associatedItems?.some(
                    (ai) => ai.id === editingSubItemId
                  );

                  if (exists) {
                    handleItemUpdate(
                      item.id,
                      "associatedItems",
                      item.associatedItems.map((ai) =>
                        ai.id === editingSubItemId ? subItemData : ai
                      )
                    );
                  } else {
                    handleItemUpdate(item.id, "associatedItems", [
                      ...(item.associatedItems || []),
                      subItemData,
                    ]);
                  }

                  setEditingSubItemId(null);
                } else {
                  handleItemUpdate(
                    item.id,
                    "itemNumber",
                    newProduct.itemNumber
                  );
                  handleItemUpdate(
                    item.id,
                    "description",
                    newProduct.description
                  );
                  handleItemUpdate(item.id, "uom", newProduct.uom);
                  handleItemUpdate(
                    item.id,
                    "quantity",
                    Number(newProduct.quantity)
                  );
                  handleItemUpdate(
                    item.id,
                    "unitPrice",
                    Number(newProduct.unitPrice)
                  );
                  handleItemUpdate(
                    item.id,
                    "discountType",
                    newProduct.discountType
                  );
                  handleItemUpdate(
                    item.id,
                    "discount",
                    Number(newProduct.discount)
                  );
                  handleItemUpdate(item.id, "isCustom", true);
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
