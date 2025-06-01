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

  useEffect(() => {
    console.log("openProductSheet", openProductSheet);
  }, [openProductSheet]);

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

  if (isEditing) {
    const isCustom = isCustomLocal;
    return (
      <>
      <div
        className={`space-y-4 mb-1 ${
          !hasSubItems ? "border-b border-border pb-4" : ""
        }`}
      >
        <div
          className="grid items-center gap-2"
          style={{
              gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 2fr 2fr 40px",
            }}
          >
            {/* Produto */}
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
                      onMouseDown={(e) => {
                        e.preventDefault();
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
            {/* Descrição */}
            <div className="text-foreground w-full truncate text-base">
              {isCustom ? (
              <Input
                placeholder="Description"
                value={item.description || ""}
                onChange={(e) =>
                  handleItemUpdate(item.id, "description", e.target.value)
                }
                className="w-full"
              />
              ) : (
                item.description || <span className="opacity-50">—</span>
              )}
            </div>
            {/* UOM */}
            <div className="text-foreground text-base">
              {isCustom ? (
              <Select
                value={item.uom || ""}
                onValueChange={(value) =>
                  handleItemUpdate(item.id, "uom", value)
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
              ) : (
                item.uom || <span className="opacity-50">—</span>
              )}
            </div>
            {/* Quantidade */}
            <div className="">
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity || ""}
                className="text-base text-foreground"
                onChange={(e) =>
                  handleItemUpdate(item.id, "quantity", Number(e.target.value))
                }
              />
            </div>
            {/* Unit Price */}
            <div className="text-foreground text-base">
              {isCustom ? (
              <Input
                type="text"
                placeholder="$0.00"
                value={
                    digits.unitPrice
                      ? `$ ${formatDecimal(digits.unitPrice)}`
                      : ""
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
              ) : item.unitPrice ? (
                `$${Number(item.unitPrice).toFixed(2)}`
              ) : (
                <span className="opacity-50">—</span>
              )}
            </div>
            {/* Discount (editável e unificado) */}
            <div className="text-foreground text-base flex items-center gap-1">
              {isCustom ? (
                <>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Discount"
                    value={item.discount || ""}
                    onChange={(e) =>
                      handleItemUpdate(
                        item.id,
                        "discount",
                        Number(e.target.value)
                      )
                    }
                    className="text-base w-full"
                  />
                  <div className="w-[62px] h-full">
              <Select
                value={item.discountType || "dollar"}
                onValueChange={(value) =>
                  handleItemUpdate(item.id, "discountType", value)
                }
              >
                      <SelectTrigger className="w-[20px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dollar">$</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
                </>
              ) : item.discount ? (
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
            {/* Total */}
            <div className="text-foreground text-left max-w-[140px] w-full text-base">
              {item.unitPrice && item.quantity ? (
                `$${calculateExtendedPrice(item)}`
              ) : (
                <span className="opacity-50">—</span>
              )}
            </div>
            {/* Botão de salvar */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingItemId(null)}
              >
                  <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Subitens visual: igual ao item principal, mas com fundo cinza e recuo */}
        {hasSubItems && (
          <div className="relative border-b border-border mb-1">
            {/* Linha vertical */}
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
          handleCompositeItemUpdate={handleCompositeItemUpdate}
          handleItemUpdate={handleItemUpdate}
          item={item}
          setProductInput={setProductInput}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`grid items-center mb-1 gap-2 ${
            !hasSubItems ? "border-b border-border pb-1" : ""
          }`}
          style={{
          gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 2fr 2fr 40px",
          }}
        >
          <div>
            <div className="relative">
            <div className="w-full text-base text-foreground">
              {item.itemNumber || <span className="opacity-50">#</span>}
            </div>
          </div>
        </div>
        <div className="text-foreground w-full truncate ml-2 text-base">
            {item.description ? (
              item.description
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
        <div className="text-foreground text-base">
            {item.uom ? item.uom : <span className="opacity-50">—</span>}
          </div>
        <div className="">
          <div className="text-base text-foreground">
            {item.quantity || <span className="opacity-50">—</span>}
          </div>
        </div>
        <div className="text-foreground text-sm">
            {item.unitPrice ? (
            `$${Number(item.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
        <div className="text-foreground text-base">
          {item.discount
            ? item.discountType === "dollar"
              ? `$${Number(item.discount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : `${Number(item.discount).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
            : <span className="opacity-50">—</span>}
          </div>
        <div className="text-foreground text-left max-w-[140px] w-full text-base">
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
        handleCompositeItemUpdate={handleCompositeItemUpdate}
        handleItemUpdate={handleItemUpdate}
        item={item}
        setProductInput={setProductInput}
      />
    </>
  );
}
