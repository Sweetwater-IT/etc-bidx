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
  handleCompositeItemUpdate,
  handleItemUpdate,
  item,
  setProductInput,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="text-2xl mb-2">Add New Product</SheetTitle>
          <Separator className="mt-2" />
        </SheetHeader>
        <form className="flex flex-col gap-5 px-4 max-h-[80vh] overflow-y-auto">
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
            <Label>Discount</Label>
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
                onOpenChange(false);
                if (editingSubItemId) {
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "itemNumber",
                    newProduct.itemNumber
                  );
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "description",
                    newProduct.description
                  );
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "uom",
                    newProduct.uom
                  );
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "quantity",
                    newProduct.quantity
                  );
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "unitPrice",
                    newProduct.unitPrice
                  );
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "discountType",
                    newProduct.discountType
                  );
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "discount",
                    newProduct.discount
                  );
                  handleCompositeItemUpdate(
                    item.id,
                    editingSubItemId,
                    "isCustom",
                    true
                  );
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
                  handleItemUpdate(item.id, "quantity", newProduct.quantity);
                  handleItemUpdate(item.id, "unitPrice", newProduct.unitPrice);
                  handleItemUpdate(
                    item.id,
                    "discountType",
                    newProduct.discountType
                  );
                  handleItemUpdate(item.id, "discount", newProduct.discount);
                  handleItemUpdate(item.id, "isCustom", true);
                  setProductInput(newProduct.itemNumber);
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
        </form>
      </SheetContent>
    </Sheet>
  );
}
