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
import { useProductsSearch } from "@/hooks/useProductsSearch";
import { SubItemRow } from "./SubItemRow";
import { createPortal } from "react-dom";

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
  const hasSubItems = hasAssociatedItems;
  const displayUnitPrice = hasAssociatedItems
    ? calculateCompositeUnitPrice(item)
    : item.unitPrice;

  const [openProductSheet, setOpenProductSheet] = useState(false);
  const [productInput, setProductInput] = useState(item.itemNumber || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const { products, loading } = useProductsSearch(productInput);

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

  const [subItemDropdown, setSubItemDropdown] = useState({});
  const [subItemInput, setSubItemInput] = useState({});

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleFocus = () => {
    updateDropdownPosition();
    setShowDropdown(true);
  };

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

  const handleProductSelect = (product: any) => {
    setProductInput(product.item_number);
    setShowDropdown(false);

    handleItemUpdate(item.id, "itemNumber", product.item_number);
    handleItemUpdate(item.id, "description", product.description);
    handleItemUpdate(item.id, "uom", product.uom);
  };

  const handleSubItemProductSelect = (product: any, subItemId: string) => {
    handleCompositeItemUpdate(
      item.id,
      subItemId,
      "itemNumber",
      product.item_number
    );
    handleCompositeItemUpdate(
      item.id,
      subItemId,
      "description",
      product.description
    );
    handleCompositeItemUpdate(item.id, subItemId, "uom", product.uom);
  };

  let content;
  if (isEditing) {
    content = (
      <div
        className={`space-y-4 mb-1 ${
          !hasSubItems ? "border-b border-border pb-4" : ""
        }`}
      >
        <div
          className="grid items-center gap-2"
          style={{
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 40px",
          }}
        >
          <div className="relative">
            <Input
              ref={inputRef}
              className="w-full h-9 px-3 text-base text-foreground"
              placeholder="Search or add a product..."
              value={productInput}
              onChange={(e) => {
                const value = e.target.value;
                setProductInput(value);
                setShowDropdown(true);
              }}
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown &&
              createPortal(
                <div
                  className="absolute bg-background border rounded shadow z-[100] max-h-48 overflow-auto"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                  }}
                >
                  <div
                    className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted border-b"
                    onMouseDown={() => {
                      setShowDropdown(false);
                      setOpenProductSheet(true);
                    }}
                  >
                    + Add new product
                  </div>
                  {loading ? (
                    <div className="px-3 py-2 text-foreground">Loading...</div>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <div
                        key={product.id}
                        className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
                        onMouseDown={() => handleProductSelect(product)}
                      >
                        {product.item_number} - {product.description}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-foreground">
                      No products found
                    </div>
                  )}
                </div>,
                document.body
              )}
          </div>
          <div className="text-foreground w-full truncate ml-2 text-sm">
            {item.description ? (
              item.description
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-[18px] text-sm">
            {item.uom ? item.uom : <span className="opacity-50">—</span>}
          </div>
          <div className="ml-2 mr-2">
            <Input
              type="number"
              placeholder="Qty"
              value={item.quantity || ""}
              className="text-sm"
              onChange={(e) =>
                handleItemUpdate(item.id, "quantity", Number(e.target.value))
              }
            />
          </div>
          <div className="text-foreground ml-[10px] text-sm">
            {item.unitPrice ? (
              `$${Number(item.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-sm">
            {item.discountType === "dollar" ? (
              "$"
            ) : item.discountType === "percentage" ? (
              "%"
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-sm">
            {item.discount ? (
              item.discount
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full text-sm ml-1">
            {item.unitPrice && item.quantity ? (
              `$${(item.unitPrice * item.quantity).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingItemId(null);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  } else {
    content = (
      <>
        <div
          className={`grid gap-4 items-center mb-1 ${
            !hasSubItems ? "border-b border-border pb-4" : ""
          }`}
          style={{
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 40px",
          }}
        >
          <div>
            <div className="relative">
              <Input
                ref={inputRef}
                className="w-full h-9 px-3 text-base text-foreground"
                placeholder="Search or add a product..."
                value={productInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setProductInput(value);
                  setShowDropdown(true);
                }}
                onFocus={handleFocus}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              />
              {showDropdown &&
                createPortal(
                  <div
                    className="absolute bg-background border rounded shadow z-[100] max-h-48 overflow-auto"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                    }}
                  >
                    <div
                      className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted border-b"
                      onMouseDown={() => {
                        setShowDropdown(false);
                        setOpenProductSheet(true);
                      }}
                    >
                      + Add new product
                    </div>
                    {loading ? (
                      <div className="px-3 py-2 text-foreground">
                        Loading...
                      </div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <div
                          key={product.id}
                          className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
                          onMouseDown={() => handleProductSelect(product)}
                        >
                          {product.item_number} - {product.description}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-foreground">
                        No products found
                      </div>
                    )}
                  </div>,
                  document.body
                )}
            </div>
          </div>
          <div className="text-foreground w-full truncate ml-2 text-sm">
            {item.description ? (
              item.description
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-[18px] text-sm">
            {item.uom ? item.uom : <span className="opacity-50">—</span>}
          </div>
          <div className="ml-2 mr-2">
            {isEditing ? (
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity || ""}
                className="text-base text-foreground"
                onChange={(e) =>
                  handleItemUpdate(item.id, "quantity", Number(e.target.value))
                }
              />
            ) : (
              <div className="text-base text-foreground">
                {item.quantity || <span className="opacity-50">—</span>}
              </div>
            )}
          </div>
          <div className="text-foreground ml-[10px] text-sm">
            {item.unitPrice ? (
              `$${Number(item.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-sm">
            {item.discountType === "dollar" ? (
              "$"
            ) : item.discountType === "percentage" ? (
              "%"
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-sm">
            {item.discount ? (
              item.discount
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full text-sm ml-1">
            {item.unitPrice && item.quantity ? (
              `$${(item.unitPrice * item.quantity).toFixed(2)}`
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

        {/* Subitens visual: igual ao item principal, mas com fundo cinza e recuo */}
        {hasSubItems && (
          <div className="relative border-b border-border mb-1">
            {/* Linha vertical */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-300 z-0 mb-[15px]" />
            {item.associatedItems.map((subItem, idx) => (
              <div key={subItem.id || idx} className="pl-4 relative z-10">
                <div
                  className="absolute top-1/2 left-2 w-2 h-[0.01rem] bg-gray-300"
                  style={{ transform: "translateY(-50%)" }}
                />
                <SubItemRow
                  item={item}
                  subItem={subItem}
                  handleCompositeItemUpdate={handleCompositeItemUpdate}
                  handleDeleteComposite={handleDeleteComposite}
                  editingSubItemId={editingSubItemId}
                  setEditingSubItemId={setEditingSubItemId}
                  UOM_TYPES={UOM_TYPES}
                  setOpenProductSheet={setOpenProductSheet}
                  handleSubItemProductSelect={handleSubItemProductSelect}
                />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {isEditing ? (
        <div
          className={`space-y-4 mb-1 ${
            !hasSubItems ? "border-b border-border pb-4" : ""
          }`}
        >
          <div
            className="grid items-center gap-2"
            style={{
              gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 40px",
            }}
          >
            <div className="relative">
              <Input
                ref={inputRef}
                className="w-full h-9 px-3 text-base text-foreground"
                placeholder="Search or add a product..."
                value={productInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setProductInput(value);
                  setShowDropdown(true);
                }}
                onFocus={handleFocus}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              />
              {showDropdown &&
                createPortal(
                  <div
                    className="absolute bg-background border rounded shadow z-[100] max-h-48 overflow-auto"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                    }}
                  >
                    <div
                      className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted border-b"
                      onMouseDown={() => {
                        setShowDropdown(false);
                        setOpenProductSheet(true);
                      }}
                    >
                      + Add new product
                    </div>
                    {loading ? (
                      <div className="px-3 py-2 text-foreground">
                        Loading...
                      </div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <div
                          key={product.id}
                          className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
                          onMouseDown={() => handleProductSelect(product)}
                        >
                          {product.item_number} - {product.description}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-foreground">
                        No products found
                      </div>
                    )}
                  </div>,
                  document.body
                )}
            </div>
            <div className="text-foreground w-full truncate ml-2 text-sm">
              {item.description ? (
                item.description
              ) : (
                <span className="opacity-50">—</span>
              )}
            </div>
            <div className="text-foreground ml-[18px] text-sm">
              {item.uom ? item.uom : <span className="opacity-50">—</span>}
            </div>
            <div className="ml-2 mr-2">
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity || ""}
                className="text-sm"
                onChange={(e) =>
                  handleItemUpdate(item.id, "quantity", Number(e.target.value))
                }
              />
            </div>
            <div className="text-foreground ml-[10px] text-sm">
              {item.unitPrice ? (
                `$${Number(item.unitPrice).toFixed(2)}`
              ) : (
                <span className="opacity-50">—</span>
              )}
            </div>
            <div className="text-foreground ml-3 text-sm">
              {item.discountType === "dollar" ? (
                "$"
              ) : item.discountType === "percentage" ? (
                "%"
              ) : (
                <span className="opacity-50">—</span>
              )}
            </div>
            <div className="text-foreground ml-3 text-sm">
              {item.discount ? (
                item.discount
              ) : (
                <span className="opacity-50">—</span>
              )}
            </div>
            <div className="text-foreground text-left max-w-[140px] w-full text-sm ml-1">
              {item.unitPrice && item.quantity ? (
                `$${(item.unitPrice * item.quantity).toFixed(2)}`
              ) : (
                <span className="opacity-50">—</span>
              )}
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingItemId(null);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`grid gap-4 items-center mb-1 ${
            !hasSubItems ? "border-b border-border pb-1" : ""
          }`}
          style={{
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 40px",
          }}
        >
          <div>
            <div className="relative">
              <div className="w-full px-3 text-base text-foreground">
                {productInput || <span className="opacity-50">#</span>}
              </div>
              {showDropdown &&
                createPortal(
                  <div
                    className="absolute bg-background border rounded shadow z-[100] max-h-48 overflow-auto"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      width: `${dropdownPosition.width}px`,
                    }}
                  >
                    <div
                      className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted border-b"
                      onMouseDown={() => {
                        setShowDropdown(false);
                        setOpenProductSheet(true);
                      }}
                    >
                      + Add new product
                    </div>
                    {loading ? (
                      <div className="px-3 py-2 text-foreground">
                        Loading...
                      </div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <div
                          key={product.id}
                          className="px-3 py-2 cursor-pointer text-foreground hover:bg-muted"
                          onMouseDown={() => handleProductSelect(product)}
                        >
                          {product.item_number} - {product.description}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-foreground">
                        No products found
                      </div>
                    )}
                  </div>,
                  document.body
                )}
            </div>
          </div>
          <div className="text-foreground w-full truncate ml-2 text-base">
            {item.description ? (
              item.description
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-[18px] text-base">
            {item.uom ? item.uom : <span className="opacity-50">—</span>}
          </div>
          <div className="ml-2 mr-2">
            {isEditing ? (
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity || ""}
                className="text-base text-foreground"
                onChange={(e) =>
                  handleItemUpdate(item.id, "quantity", Number(e.target.value))
                }
              />
            ) : (
              <div className="text-base text-foreground">
                {item.quantity || <span className="opacity-50">—</span>}
              </div>
            )}
          </div>
          <div className="text-foreground ml-[10px] text-sm">
            {item.unitPrice ? (
              `$${Number(item.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-base">
            {item.discountType === "dollar" ? (
              "$"
            ) : item.discountType === "percentage" ? (
              "%"
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-base">
            {item.discount ? (
              item.discount
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full text-base ml-1">
            {item.unitPrice && item.quantity ? (
              `$${(item.unitPrice * item.quantity).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                className="flex items-center justify-center"
              >
                <Button variant="ghost" size="sm" className="!p-[6px]">
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
      )}

      {hasSubItems && (
        <div className="relative border-b border-border mb-1">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-300 z-0 mb-[15px]" />
          {item.associatedItems.map((subItem, idx) => (
            <div key={subItem.id || idx} className="pl-4 relative z-10">
              {/* Linha horizontal para conectar à vertical */}
              <div
                className="absolute top-1/2 left-2 w-2 h-[0.01rem] bg-gray-300"
                style={{ transform: "translateY(-50%)" }}
              />
              <SubItemRow
                item={item}
                subItem={subItem}
                handleCompositeItemUpdate={handleCompositeItemUpdate}
                handleDeleteComposite={handleDeleteComposite}
                editingSubItemId={editingSubItemId}
                setEditingSubItemId={setEditingSubItemId}
                UOM_TYPES={UOM_TYPES}
                setOpenProductSheet={setOpenProductSheet}
                handleSubItemProductSelect={handleSubItemProductSelect}
              />
            </div>
          ))}
        </div>
      )}

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
                  setOpenProductSheet(false);
                  if (editingSubItemId) {
                    handleCompositeItemUpdate(item.id, editingSubItemId, "itemNumber", newProduct.itemNumber);
                    handleCompositeItemUpdate(item.id, editingSubItemId, "description", newProduct.description);
                    handleCompositeItemUpdate(item.id, editingSubItemId, "uom", newProduct.uom);
                    handleCompositeItemUpdate(item.id, editingSubItemId, "quantity", newProduct.quantity);
                    handleCompositeItemUpdate(item.id, editingSubItemId, "unitPrice", newProduct.unitPrice);
                    handleCompositeItemUpdate(item.id, editingSubItemId, "discountType", newProduct.discountType);
                    handleCompositeItemUpdate(item.id, editingSubItemId, "discount", newProduct.discount);
                  } else {
                    handleItemUpdate(item.id, "itemNumber", newProduct.itemNumber);
                    handleItemUpdate(item.id, "description", newProduct.description);
                    handleItemUpdate(item.id, "uom", newProduct.uom);
                    handleItemUpdate(item.id, "quantity", newProduct.quantity);
                    handleItemUpdate(item.id, "unitPrice", newProduct.unitPrice);
                    handleItemUpdate(item.id, "discountType", newProduct.discountType);
                    handleItemUpdate(item.id, "discount", newProduct.discount);
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
    </>
  );
}
