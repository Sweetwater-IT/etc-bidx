import { useState, useRef } from "react";
import { useProductsSearch } from "../../../hooks/useProductsSearch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { createPortal } from "react-dom";

export function SubItemRow({
  item,
  subItem,
  handleCompositeItemUpdate,
  handleDeleteComposite,
  editingSubItemId,
  setEditingSubItemId,
  UOM_TYPES,
  setOpenProductSheet,
  handleSubItemProductSelect,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [productInput, setProductInput] = useState(subItem.itemNumber || "");
  const { products, loading } = useProductsSearch(productInput);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

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

  return (
    <div
      className={`grid gap-4 items-center bg-muted py-0 pr-1`}
      style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 40px" }}
    >
      {editingSubItemId === subItem.id ? (
        <>
          <div className="text-foreground w-full truncate">
            <div className="w-full">
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
                          onMouseDown={() => {
                            handleSubItemProductSelect(product, subItem.id);
                            setProductInput(product.item_number);
                            setShowDropdown(false);
                          }}
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
            {subItem.description ? (
              subItem.description
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-[18px] text-sm">
            {subItem.uom ? subItem.uom : <span className="opacity-50">—</span>}
          </div>
          <div className="ml-2 mr-2">
            {editingSubItemId === subItem.id ? (
              <Input
                type="number"
                placeholder="Qty"
                value={subItem.quantity || ""}
                className="text-sm"
                onChange={(e) =>
                  handleCompositeItemUpdate(
                    item.id,
                    subItem.id,
                    "quantity",
                    Number(e.target.value)
                  )
                }
              />
            ) : (
              <div className="text-sm text-foreground">
                {subItem.quantity || <span className="opacity-50">—</span>}
              </div>
            )}
          </div>
          <div className="text-foreground ml-[10px] text-sm">
            {subItem.unitPrice ? (
              `$${Number(subItem.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-sm">
            {subItem.discountType === "dollar" ? (
              "$"
            ) : subItem.discountType === "percentage" ? (
              "%"
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-3 text-sm">
            {subItem.discount ? (
              subItem.discount
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full text-sm ml-1">
            {subItem.unitPrice && subItem.quantity ? (
              `$${(subItem.unitPrice * subItem.quantity).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingSubItemId(null);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="text-foreground w-full truncate">
            <div className="w-full">
              {editingSubItemId === subItem.id ? (
                <Input
                  ref={inputRef}
                  className="w-full h-9 px-3 text-base !bg-transparent text-foreground"
                  placeholder="Search or add a product..."
                  value={productInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setProductInput(value);
                    handleCompositeItemUpdate(
                      item.id,
                      subItem.id,
                      "itemNumber",
                      value
                    );
                    setShowDropdown(true);
                  }}
                  onFocus={handleFocus}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />
              ) : (
                <div className="w-full px-3 text-base text-foreground">
                  {productInput || <span className="opacity-50">—</span>}
                </div>
              )}
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
                          onMouseDown={() => {
                            handleSubItemProductSelect(product, subItem.id);
                            setProductInput(product.item_number);
                            setShowDropdown(false);
                          }}
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
            {subItem.description ? (
              subItem.description
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-[19px] text-sm">
            {subItem.uom ? subItem.uom : <span className="opacity-50">—</span>}
          </div>
          <div className="ml-3 mr-2">
            {editingSubItemId === subItem.id ? (
              <Input
                type="number"
                placeholder="Qty"
                value={subItem.quantity || ""}
                className="text-sm"
                onChange={(e) =>
                  handleCompositeItemUpdate(
                    item.id,
                    subItem.id,
                    "quantity",
                    Number(e.target.value)
                  )
                }
              />
            ) : (
              <div className="text-sm text-foreground">
                {subItem.quantity || <span className="opacity-50">—</span>}
              </div>
            )}
          </div>
          <div className="text-foreground ml-[11px] text-sm">
            {subItem.unitPrice ? (
              `$${Number(subItem.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-4 text-sm">
            {subItem.discountType === "dollar" ? (
              "$"
            ) : subItem.discountType === "percentage" ? (
              "%"
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground ml-4 text-sm">
            {subItem.discount ? (
              subItem.discount
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full text-sm ml-2">
            {subItem.unitPrice && subItem.quantity ? (
              `$${(subItem.unitPrice * subItem.quantity).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="flex items-center justify-end pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="flex">
                <Button variant="ghost" size="sm" className="!p-[6px]">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingSubItemId(subItem.id);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteComposite(item.id, subItem.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}
