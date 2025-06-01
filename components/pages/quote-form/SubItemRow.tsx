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

  const isCustom = subItem.isCustom;

  // Função utilitária para calcular o total do subitem já com desconto
  function calculateSubItemTotal(subItem) {
    const base = (subItem.unitPrice || 0) * (subItem.quantity || 0);
    const discountAmount = subItem.discountType === "dollar"
      ? Number(subItem.discount || 0)
      : base * (Number(subItem.discount || 0) / 100);
    return (base - discountAmount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div
      className={`grid items-center bg-muted py-0 pr-1 gap-2`}
      style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr 2fr 2fr 40px", }}
    >
      {editingSubItemId === subItem.id ? (
        <>
          <div className="text-foreground w-full truncate">
            <div className="w-full pr-3">
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
          <div className="text-foreground w-full truncate text-sm -ml-3">
            {isCustom ? (
              <Input
                placeholder="Description"
                value={subItem.description || ""}
                onChange={(e) =>
                  handleCompositeItemUpdate(
                    item.id,
                    subItem.id,
                    "description",
                    e.target.value
                  )
                }
                className="w-full text-sm"
              />
            ) : subItem.description ? (
              subItem.description
            ) : (
              <span className="opacity-50 text-sm">—</span>
            )}
          </div>
          <div className="text-foreground text-sm -ml-3 mr-3">
            {isCustom ? (
              <Select
                value={subItem.uom || ""}
                onValueChange={(value) =>
                  handleCompositeItemUpdate(item.id, subItem.id, "uom", value)
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
            ) : subItem.uom ? (
              subItem.uom
            ) : (
              <span className="opacity-50 text-sm">—</span>
            )}
          </div>
          <div className="-ml-3 mr-2">
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
          </div>
          <div className="text-foreground text-sm -ml-2">
            {isCustom ? (
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
                className="w-full"
              />
            ) : subItem.unitPrice ? (
              `$${Number(subItem.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50 text-sm">—</span>
            )}
          </div>
          <div className="text-foreground text-sm flex items-center gap-1">
            {isCustom ? (
              <>
                <Input
                  type="number"
                  min={0}
                  placeholder="Discount"
                  value={subItem.discount || ""}
                  onChange={(e) =>
                    handleCompositeItemUpdate(
                      item.id,
                      subItem.id,
                      "discount",
                      Number(e.target.value)
                    )
                  }
                  className=" text-sm w-full"
                />
                <div className="w-[62px] h-full">
                  <Select
                    value={subItem.discountType || "dollar"}
                    onValueChange={(value) =>
                      handleCompositeItemUpdate(
                        item.id,
                        subItem.id,
                        "discountType",
                        value
                      )
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
            ) : subItem.discount ? (
              subItem.discountType === "dollar" ? (
                `$${Number(subItem.discount).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              ) : (
                `${Number(subItem.discount).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}%`
              )
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full text-sm">
            {subItem.unitPrice && subItem.quantity ? (
              `$${calculateSubItemTotal(subItem)}`
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
            <div className="w-full text-sm text-foreground pl-2">
              {subItem.itemNumber || <span className="opacity-50">—</span>}
            </div>
          </div>
          <div className="text-foreground w-full truncate text-sm">
            {subItem.description ? (
              subItem.description
            ) : (
              <span className="opacity-50 text-sm">—</span>
            )}
          </div>
          <div className="text-foreground text-sm -ml-2">
            {subItem.uom ? subItem.uom : <span className="opacity-50">—</span>}
          </div>
          <div className="">
            <div className="text-sm text-foreground">
              {subItem.quantity || <span className="opacity-50">—</span>}
            </div>
          </div>
          <div className="text-foreground text-sm">
            {subItem.unitPrice ? (
              `$${Number(subItem.unitPrice).toFixed(2)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-sm">
            {subItem.discount ? (
              subItem.discountType === "dollar" ? (
                `$${Number(subItem.discount).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              ) : (
                `${Number(subItem.discount).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}%`
              )
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div className="text-foreground text-left max-w-[140px] w-full text-sm">
            {subItem.unitPrice && subItem.quantity ? (
              `$${calculateSubItemTotal(subItem)}`
            ) : (
              <span className="opacity-50">—</span>
            )}
          </div>
          <div>
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
