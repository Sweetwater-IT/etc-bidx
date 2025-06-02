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
import { Trash2, Plus, Pencil, Check, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useProductsSearch } from "@/hooks/useProductsSearch";
import { SubItemRow } from "./SubItemRow";
import { createPortal } from "react-dom";
import { ProductSheet } from "./ProductSheet";

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
  const [isSearching, setIsSearching] = useState(false);
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

  const [isCustomLocal, setIsCustomLocal] = useState(!!item.isCustom);
  useEffect(() => {
    setIsCustomLocal(!!item.isCustom);
  }, [item.isCustom]);

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
    if (!item.itemNumber) {
      setIsSearching(true);
      updateDropdownPosition();
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
      setIsSearching(false);
    }, 150);
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

  useEffect(() => {
    console.log("openProductSheet", openProductSheet);
  }, [openProductSheet]);

  useEffect(() => {
    if (openProductSheet && editingSubItemId) {
      const subItem = item.associatedItems?.find(
        (s) => s.id === editingSubItemId
      );
      if (subItem) {
        setNewProduct({
          itemNumber: subItem.itemNumber || "",
          description: subItem.description || "",
          uom: subItem.uom || "",
          quantity: subItem.quantity || 0,
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
      }
    }
  }, [openProductSheet, editingSubItemId, item.associatedItems]);

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

  return (
    <>
      <div
        className={`grid items-center mb-1 gap-2 ${
          !hasSubItems ? "border-b border-border pb-1" : ""
        }`}
        style={{
          gridTemplateColumns: "2fr 2fr 1fr 2fr 1fr 1fr 2fr 40px",
        }}
      >
        {/* Produto: input sempre disponível */}
        <div className="relative">
          {!!item.itemNumber ? (
            <div className="text-foreground w-full truncate text-sm ml-2">
              {item.itemNumber}
            </div>
          ) : (
            <Input
            ref={inputRef}
            className={`w-full h-9 text-base text-foreground bg-transparent ${
              item.itemNumber ? "border-none p-0 shadow-none" : "px-3"
            }`}
            placeholder="Search or add a product..."
            value={productInput}
            onChange={(e) => {
              const value = e.target.value;
              setProductInput(value);
              setShowDropdown(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
              readOnly={!!item.itemNumber}
            />
          )}

          {showDropdown && isSearching &&
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
                  onMouseDown={(e) => {
                    e.preventDefault();
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
        {/* Descrição */}
        <div className="text-foreground w-full truncate ml-2 text-base pr-2">
          {item.description ? (
            item.description
          ) : (
            <span className="opacity-50">—</span>
          )}
        </div>
        <div className="text-foreground text-base">
          {item.uom ? item.uom : <span className="opacity-50">—</span>}
        </div>
        {/* Qty: stepper com input */}
        <div className="flex items-center justify-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-7 h-7 flex items-center justify-center border rounded bg-muted hover:bg-accent "
            onClick={() =>
              handleItemUpdate(
                item.id,
                "quantity",
                Math.max(0, Number(item.quantity || 0) - 1)
              )
            }
            tabIndex={-1}
          >
            -
          </Button>
          <Input
            min={0}
            value={item.quantity || 0}
            onChange={(e) =>
              handleItemUpdate(
                item.id,
                "quantity",
                Math.max(0, Number(e.target.value))
              )
            }
            className="no-spinner w-16 h-6 px-2 py-1 border rounded text-center bg-background !border-none shadow-none"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-7 h-7 flex items-center justify-center border rounded bg-muted  hover:bg-accent "
            onClick={() =>
              handleItemUpdate(
                item.id,
                "quantity",
                Number(item.quantity || 0) + 1
              )
            }
            tabIndex={-1}
          >
            +
          </Button>
        </div>
        <div className="text-foreground text-sm">
          {item.unitPrice ? (
            `$${Number(item.unitPrice).toFixed(2)}`
          ) : (
            <span className="opacity-50">—</span>
          )}
        </div>
        <div className="text-foreground text-base">
          {item.discount ? (
            item.discountType === "dollar" ? (
              `$${Number(item.discount).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}`
            ) : (
              `${Number(item.discount).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}%`
            )
          ) : (
            <span className="opacity-50">—</span>
          )}
        </div>
        <div className="text-foreground w-full text-base text-center">
          {item.unitPrice && item.quantity ? (
            `$${calculateExtendedPrice(item)}`
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
              <Button variant="ghost" size="sm" className="!p-[2px]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setOpenProductSheet(true);
                  setEditingItemId(item.id);
                  setEditingSubItemId(null);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleAddCompositeItem(item);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sub Item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRemoveItem(item.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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

      <ProductSheet
        open={openProductSheet}
        onOpenChange={setOpenProductSheet}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        digits={digits}
        setDigits={setDigits}
        UOM_TYPES={UOM_TYPES}
        formatDecimal={formatDecimal}
        formatPercentage={formatPercentage}
        handleNextDigits={handleNextDigits}
        editingSubItemId={editingSubItemId}
        handleItemUpdate={handleItemUpdate}
        item={item}
        setProductInput={setProductInput}
        setEditingItemId={setEditingItemId}
        setEditingSubItemId={setEditingSubItemId}
      />
    </>
  );
}
